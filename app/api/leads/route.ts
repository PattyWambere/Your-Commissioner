import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const leadSchema = z.object({
  propertyId: z.string(),
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  message: z.string().optional(),
  channel: z.enum(['whatsapp', 'chat', 'inquiry', 'appointment']).default('inquiry'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = leadSchema.parse(body)

    // Get current user if logged in
    let userId = null
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken')
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
        userId = payload.userId
      } catch {
        // User not logged in, continue as anonymous
      }
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        ...data,
        userId,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    // Increment inquiry count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await prisma.propertyAnalytics.upsert({
      where: {
        propertyId_date: {
          propertyId: property.id,
          date: today,
        },
      },
      update: {
        inquiries: { increment: 1 },
      },
      create: {
        propertyId: property.id,
        date: today,
        inquiries: 1,
      },
    })

    // Create notification for commissioner
    await prisma.notification.create({
      data: {
        userId: property.commissionerId,
        type: 'inquiry',
        title: 'New Inquiry Received',
        message: `${data.name} is interested in ${property.title}`,
        payload: {
          leadId: lead.id,
          propertyId: property.id,
        },
      },
    })

    // TODO: Send email/SMS notification

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Lead creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const jwt = require('jsonwebtoken')
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user || user.role !== 'COMMISSIONER') {
      return NextResponse.json(
        { error: 'Forbidden - Commissioner access required' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')

    const where: any = {}
    if (propertyId) {
      // Check ownership
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      })
      if (property && property.commissionerId === user.id) {
        where.propertyId = propertyId
      }
    } else {
      // Get all leads for user's properties
      const userProperties = await prisma.property.findMany({
        where: { commissionerId: user.id },
        select: { id: true },
      })
      where.propertyId = { in: userProperties.map((p) => p.id) }
    }

    if (status) {
      where.status = status
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({ leads })
  } catch (error) {
    console.error('Leads fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


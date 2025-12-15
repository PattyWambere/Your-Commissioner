import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const appointmentSchema = z.object({
  propertyId: z.string(),
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  requestedAt: z.string().datetime(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = appointmentSchema.parse(body)

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

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        ...data,
        requestedAt: new Date(data.requestedAt),
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

    // Create notification for commissioner
    await prisma.notification.create({
      data: {
        userId: property.commissionerId,
        type: 'appointment',
        title: 'New Viewing Appointment Request',
        message: `${data.name} requested a viewing for ${property.title}`,
        payload: {
          appointmentId: appointment.id,
          propertyId: property.id,
        },
      },
    })

    // TODO: Send email/SMS notification

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Appointment creation error:', error)
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
      // Get all appointments for user's properties
      const userProperties = await prisma.property.findMany({
        where: { commissionerId: user.id },
        select: { id: true },
      })
      where.propertyId = { in: userProperties.map((p) => p.id) }
    }

    if (status) {
      where.status = status
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { requestedAt: 'asc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Appointments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


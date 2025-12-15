import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  type: z.enum(['HOUSE', 'PLOT', 'APARTMENT', 'COMMERCIAL']).optional(),
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  sizeSqm: z.number().positive().optional(),
  rooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  parkingSlots: z.number().int().positive().optional(),
  yearBuilt: z.number().int().min(1800).max(2100).optional(),
  province: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
  sector: z.string().min(1).optional(),
  cell: z.string().optional(),
  status: z.enum(['AVAILABLE', 'UNDER_NEGOTIATION', 'SOLD', 'RENTED']).optional(),
  availability: z.enum(['SALE', 'RENT', 'LEASE']).optional(),
  mapUrl: z.string().url().optional(),
  whatsappPrefill: z.string().optional(),
  amenities: z.array(z.string()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        commissioner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        media: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            leads: true,
            appointments: true,
            messages: true,
          },
        },
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Increment view count
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
        views: { increment: 1 },
      },
      create: {
        propertyId: property.id,
        date: today,
        views: 1,
      },
    })

    return NextResponse.json({ property })
  } catch (error) {
    console.error('Property fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateSchema.parse(body)

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
    
    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id: params.id },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    if (property.commissionerId !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const updated = await prisma.property.update({
      where: { id: params.id },
      data,
      include: {
        commissioner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        media: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({ property: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Property update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id: params.id },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    if (property.commissionerId !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await prisma.property.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Property deleted' })
  } catch (error) {
    console.error('Property deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const propertySchema = z.object({
  type: z.enum(['HOUSE', 'PLOT', 'APARTMENT', 'COMMERCIAL']),
  title: z.string().min(3),
  description: z.string().optional(),
  price: z.number().positive(),
  sizeSqm: z.number().positive(),
  rooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  parkingSlots: z.number().int().positive().optional(),
  yearBuilt: z.number().int().min(1800).max(2100).optional(),
  province: z.string().min(1),
  district: z.string().min(1),
  sector: z.string().min(1),
  cell: z.string().optional(),
  availability: z.enum(['SALE', 'RENT', 'LEASE']),
  mapUrl: z.string().url().optional(),
  whatsappPrefill: z.string().optional(),
  amenities: z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Filters
    const type = searchParams.get('type')
    const province = searchParams.get('province')
    const district = searchParams.get('district')
    const sector = searchParams.get('sector')
    const cell = searchParams.get('cell')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minSize = searchParams.get('minSize')
    const maxSize = searchParams.get('maxSize')
    const rooms = searchParams.get('rooms')
    const availability = searchParams.get('availability')
    const status = searchParams.get('status') || ''
    const commissioner = searchParams.get('commissioner') // supports 'me' or explicit id
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}
    if (status && status !== 'ALL') {
      where.status = status as any
    }

    if (type) where.type = type
    if (province) where.province = province
    if (district) where.district = district
    if (sector) where.sector = sector
    if (cell) where.cell = cell
    if (availability) where.availability = availability
    if (rooms) where.rooms = parseInt(rooms)
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }
    if (minSize || maxSize) {
      where.sizeSqm = {}
      if (minSize) where.sizeSqm.gte = parseFloat(minSize)
      if (maxSize) where.sizeSqm.lte = parseFloat(maxSize)
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Commissioner scoping
    if (commissioner === 'me') {
      const token =
        request.cookies.get('token')?.value ||
        request.headers.get('authorization')?.replace('Bearer ', '')
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      const jwt = require('jsonwebtoken')
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
      where.commissionerId = payload.userId
    } else if (commissioner) {
      where.commissionerId = commissioner
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
            take: 1,
          },
          _count: {
            select: {
              leads: true,
              appointments: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ])

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Properties fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = propertySchema.parse(body)

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
    
    // Check if user is commissioner
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user || user.role !== 'COMMISSIONER') {
      return NextResponse.json(
        { error: 'Forbidden - Commissioner access required' },
        { status: 403 }
      )
    }

    const property = await prisma.property.create({
      data: {
        ...data,
        commissionerId: user.id,
      },
      include: {
        commissioner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({ property }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Property creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


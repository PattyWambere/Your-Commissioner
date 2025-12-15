import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'

const createSchema = z.object({
  propertyId: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const scope = request.nextUrl.searchParams.get('scope') || 'user'
    const take = parseInt(request.nextUrl.searchParams.get('take') || '50')

    if (user.role === 'COMMISSIONER' && scope === 'commissioner') {
      const conversations = await prisma.conversation.findMany({
        where: { commissionerId: user.id },
        orderBy: { lastMessageAt: 'desc' },
        take,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      })
      return NextResponse.json({ conversations })
    }

    // buyer/renter scope
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { lastMessageAt: 'desc' },
      take,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        commissioner: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })
    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Conversation list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create or get existing conversation for user when opening chat from a property
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const data = createSchema.parse(body)

    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { id: true, commissionerId: true },
    })
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

    // only buyers/renters can initiate; commissioners already know commissionerId
    const commissionerId = property.commissionerId

    const existing = await prisma.conversation.findUnique({
      where: {
        userId_commissionerId: {
          userId: user.id,
          commissionerId,
        },
      },
    })
    if (existing) {
      return NextResponse.json({ conversation: existing })
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        commissionerId,
      },
    })
    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Conversation create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


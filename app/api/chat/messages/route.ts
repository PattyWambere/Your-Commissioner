import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getIO } from '@/lib/socket-bus'
import { getCurrentUser } from '@/lib/auth'

const messageSchema = z.object({
  conversationId: z.string().optional(),
  propertyId: z.string().optional(),
  propertyName: z.string().optional(),
  propertyImage: z.string().optional(),
  propertyLink: z.string().optional(),
  body: z.string().min(1),
  phone: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const conversationId = request.nextUrl.searchParams.get('conversationId')
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    const convo = await prisma.conversation.findUnique({ where: { id: conversationId } })
    if (!convo) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    if (convo.userId !== user.id && convo.commissionerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 500,
      select: {
        id: true,
        conversationId: true,
        propertyId: true,
        propertyName: true,
        propertyImage: true,
        propertyLink: true,
        body: true,
        senderName: true,
        senderEmail: true,
        senderPhone: true,
        userId: true,
        createdAt: true,
        isRead: true,
      },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Chat fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const data = messageSchema.parse(body)

    let conversationId = data.conversationId || ''
    let conversation = null

    if (conversationId) {
      conversation = await prisma.conversation.findUnique({ where: { id: conversationId } })
      if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      if (conversation.userId !== user.id && conversation.commissionerId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      // create or find based on property commissioner for the user
      if (!data.propertyId) {
        return NextResponse.json({ error: 'propertyId required when no conversationId' }, { status: 400 })
      }
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
        select: { id: true, commissionerId: true, title: true, media: { take: 1, select: { url: true } } },
      })
      if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 })
      conversation = await prisma.conversation.upsert({
        where: {
          userId_commissionerId: {
            userId: user.id,
            commissionerId: property.commissionerId,
          },
        },
        create: {
          userId: user.id,
          commissionerId: property.commissionerId,
        },
        update: {},
      })
      conversationId = conversation.id
      if (!data.propertyName) data.propertyName = property.title
      if (!data.propertyImage && property.media[0]?.url) data.propertyImage = property.media[0].url
      if (!data.propertyLink) data.propertyLink = `/properties/${property.id}`
    }

    const isSenderCommissioner = conversation.commissionerId === user.id

    const message = await prisma.message.create({
      data: {
        conversationId,
        propertyId: data.propertyId,
        propertyName: data.propertyName,
        propertyImage: data.propertyImage,
        propertyLink: data.propertyLink,
        userId: user.id,
        senderName: user.name || user.email,
        senderEmail: user.email,
        senderPhone: data.phone || user.phone,
        body: data.body,
      },
      select: {
        id: true,
        conversationId: true,
        propertyId: true,
        propertyName: true,
        propertyImage: true,
        propertyLink: true,
        body: true,
        senderName: true,
        senderEmail: true,
        senderPhone: true,
        userId: true,
        createdAt: true,
        isRead: true,
      },
    })

    // update conversation counters
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadForCommissioner: isSenderCommissioner ? undefined : { increment: 1 },
        unreadForUser: isSenderCommissioner ? { increment: 1 } : undefined,
      },
    })

    // broadcast
    try {
      const io = getIO()
      if (io) {
        io.to(conversationId).emit('new_message', message)
      }
    } catch {}

    return NextResponse.json({ message, conversationId }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Chat create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


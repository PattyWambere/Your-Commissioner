export const runtime = 'nodejs'

import type { NextApiRequest, NextApiResponse } from 'next'
import { Server } from 'socket.io'
import { prisma } from '@/lib/prisma'
import cookie from 'cookie'
import jwt from 'jsonwebtoken'
import { setIO } from '@/lib/socket-bus'

export const config = {
  api: {
    bodyParser: false,
  },
}

const ioHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!(res.socket as any).server.io) {
    const io = new Server((res.socket as any).server, {
      path: '/api/socket.io',
    })
    ;(res.socket as any).server.io = io
    setIO(io)

    io.on('connection', (socket) => {
      // Auth from cookie
      const cookies = socket.handshake.headers.cookie
        ? cookie.parse(socket.handshake.headers.cookie)
        : {}
      const token = cookies['token']
      let userPayload: any = null
      if (token) {
        try {
          userPayload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
        } catch {
          userPayload = null
        }
      }

      socket.on('join_conversation', ({ conversationId }: { conversationId: string }) => {
        if (conversationId) socket.join(conversationId)
      })

      socket.on(
        'send_message',
        async (
          payload: { conversationId: string; body: string; phone?: string },
          callback: (ack?: any) => void
        ) => {
          try {
            if (!userPayload) {
              callback({ error: 'Unauthorized' })
              return
            }
            const { conversationId, body, phone } = payload
            if (!conversationId || !body?.trim()) {
              callback({ error: 'Invalid payload' })
              return
            }

            const conversation = await prisma.conversation.findUnique({
              where: { id: conversationId },
            })
            if (!conversation) {
              callback({ error: 'Conversation not found' })
              return
            }
            if (conversation.userId !== userPayload.userId && conversation.commissionerId !== userPayload.userId) {
              callback({ error: 'Forbidden' })
              return
            }

            const message = await prisma.message.create({
              data: {
                conversationId,
                userId: userPayload.userId,
                senderName: userPayload.email || 'User',
                senderEmail: userPayload.email || null,
                senderPhone: phone || null,
                body,
              },
              select: {
                id: true,
                propertyId: true,
                body: true,
                senderName: true,
                senderEmail: true,
                senderPhone: true,
                userId: true,
                createdAt: true,
              },
            })
            io.to(propertyId).emit('new_message', message)
            callback({ ok: true })
          } catch (error: any) {
            callback({ error: 'Failed to send message' })
          }
        }
      )
    })
  }
  res.end()
}

export default ioHandler


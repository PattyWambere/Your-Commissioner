import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const token =
      request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const jwt = require('jsonwebtoken')
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

    const body = await request.json()
    const data = updateSchema.parse(body)

    const update: any = {}
    if (data.name) update.name = data.name
    if (data.phone !== undefined) update.phone = data.phone
    if (data.password) {
      update.password = await bcrypt.hash(data.password, 10)
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: update,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


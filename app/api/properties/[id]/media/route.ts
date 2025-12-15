import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'

const mediaSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  order: z.number().int().default(0),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const token =
      request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jwt = require('jsonwebtoken')
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id: params.id },
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    if (property.commissionerId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const contentType = request.headers.get('content-type') || ''

    // Branch: JSON (URL-based) upload
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const data = mediaSchema.parse(body)

      const media = await prisma.propertyMedia.create({
        data: {
          propertyId: params.id,
          ...data,
        },
      })

      return NextResponse.json({ media }, { status: 201 })
    }

    // Branch: multipart file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file')
      const alt = formData.get('alt')?.toString()

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'File is required' }, { status: 400 })
      }

      const maxSize = Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024) // default 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File too large. Max ${Math.round(maxSize / 1024 / 1024)}MB` },
          { status: 400 }
        )
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
      const filename = `${crypto.randomUUID()}.${ext}`
      const uploadDir = process.env.UPLOAD_DIR || './public/uploads'
      const uploadsPath = join(process.cwd(), uploadDir)

      await mkdir(uploadsPath, { recursive: true })
      const filePath = join(uploadsPath, filename)
      await writeFile(filePath, buffer)

      // Public URL
      let publicUrl = `/uploads/${filename}`
      if (uploadDir && !uploadDir.includes('public')) {
        const base = process.env.APP_URL || ''
        publicUrl = `${base}/uploads/${filename}`
      }

      const media = await prisma.propertyMedia.create({
        data: {
          propertyId: params.id,
          url: publicUrl,
          alt: alt || file.name,
        },
      })

      return NextResponse.json({ media }, { status: 201 })
    }

    return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Media upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const media = await prisma.propertyMedia.findMany({
      where: { propertyId: params.id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ media })
  } catch (error) {
    console.error('Media fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


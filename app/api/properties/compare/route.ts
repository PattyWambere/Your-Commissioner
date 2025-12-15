import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []

    if (ids.length === 0 || ids.length > 5) {
      return NextResponse.json(
        { error: 'Please provide 1-5 property IDs' },
        { status: 400 }
      )
    }

    const properties = await prisma.property.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        commissioner: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
        media: {
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    })

    return NextResponse.json({ properties })
  } catch (error) {
    console.error('Property comparison error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


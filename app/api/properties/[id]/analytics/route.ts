import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    // Get analytics
    const analytics = await prisma.propertyAnalytics.findMany({
      where: { propertyId: params.id },
      orderBy: { date: 'desc' },
      take: 30, // Last 30 days
    })

    // Aggregate totals
    const totals = analytics.reduce(
      (acc, curr) => ({
        views: acc.views + curr.views,
        chats: acc.chats + curr.chats,
        inquiries: acc.inquiries + curr.inquiries,
      }),
      { views: 0, chats: 0, inquiries: 0 }
    )

    // Get leads count
    const leadsCount = await prisma.lead.count({
      where: { propertyId: params.id },
    })

    // Get appointments count
    const appointmentsCount = await prisma.appointment.count({
      where: { propertyId: params.id },
    })

    return NextResponse.json({
      analytics,
      totals: {
        ...totals,
        leads: leadsCount,
        appointments: appointmentsCount,
      },
    })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


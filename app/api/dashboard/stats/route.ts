import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Get user's properties
    const properties = await prisma.property.findMany({
      where: { commissionerId: user.id },
      select: { id: true },
    })

    const propertyIds = properties.map((p) => p.id)

    // Get total listings
    const totalListings = properties.length

    // Get total views, chats, inquiries
    const analytics = await prisma.propertyAnalytics.findMany({
      where: { propertyId: { in: propertyIds } },
    })

    const totals = analytics.reduce(
      (acc, curr) => ({
        views: acc.views + curr.views,
        chats: acc.chats + curr.chats,
        inquiries: acc.inquiries + curr.inquiries,
      }),
      { views: 0, chats: 0, inquiries: 0 }
    )

    // Get total leads
    const totalLeads = await prisma.lead.count({
      where: { propertyId: { in: propertyIds } },
    })

    // Get total appointments
    const totalAppointments = await prisma.appointment.count({
      where: { propertyId: { in: propertyIds } },
    })

    // Get best performing properties (by views)
    const propertyViews = await prisma.propertyAnalytics.groupBy({
      by: ['propertyId'],
      where: { propertyId: { in: propertyIds } },
      _sum: {
        views: true,
        chats: true,
        inquiries: true,
      },
      orderBy: {
        _sum: {
          views: 'desc',
        },
      },
      take: 5,
    })

    const bestPerforming = await Promise.all(
      propertyViews.map(async (pv) => {
        const property = await prisma.property.findUnique({
          where: { id: pv.propertyId },
          select: {
            id: true,
            title: true,
            price: true,
            status: true,
            media: {
              orderBy: { order: 'asc' },
              take: 1,
            },
          },
        })
        return {
          ...property,
          views: pv._sum.views || 0,
          chats: pv._sum.chats || 0,
          inquiries: pv._sum.inquiries || 0,
        }
      })
    )

    return NextResponse.json({
      stats: {
        totalListings,
        totalViews: totals.views,
        totalChats: totals.chats,
        totalInquiries: totals.inquiries,
        totalLeads,
        totalAppointments,
      },
      bestPerforming,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


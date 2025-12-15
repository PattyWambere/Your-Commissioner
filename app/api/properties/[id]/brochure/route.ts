import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'

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
            name: true,
            email: true,
            phone: true,
          },
        },
        media: {
          orderBy: { order: 'asc' },
          take: 5,
        },
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => {})

    // Title
    doc.fontSize(24).text(property.title, { align: 'center' })
    doc.moveDown()

    // Property Type and Status
    doc.fontSize(14)
    doc.text(`Type: ${property.type}`)
    doc.text(`Status: ${property.status}`)
    doc.text(`Availability: ${property.availability}`)
    doc.moveDown()

    // Price
    doc.fontSize(20).fillColor('#0ea5e9')
    doc.text(`Price: RWF ${property.price.toLocaleString()}`, { align: 'center' })
    doc.fillColor('black')
    doc.moveDown()

    // Details
    doc.fontSize(12)
    doc.text(`Size: ${property.sizeSqm} sqm`)
    if (property.rooms) {
      doc.text(`Rooms: ${property.rooms}`)
    }
    doc.text(`Location: ${property.province}, ${property.district}, ${property.sector}`)
    if (property.cell) {
      doc.text(`Cell: ${property.cell}`)
    }
    doc.moveDown()

    // Description
    if (property.description) {
      doc.fontSize(12).text('Description:', { underline: true })
      doc.text(property.description)
      doc.moveDown()
    }

    // Amenities
    if (Array.isArray(property.amenities) && property.amenities.length > 0) {
      doc.text('Amenities:', { underline: true })
      property.amenities.forEach((amenity: string) => {
        doc.text(`• ${amenity}`)
      })
      doc.moveDown()
    }

    // Contact Information
    doc.fontSize(14).text('Contact Information', { underline: true })
    doc.fontSize(12)
    doc.text(`Commissioner: ${property.commissioner.name}`)
    if (property.commissioner.email) {
      doc.text(`Email: ${property.commissioner.email}`)
    }
    if (property.commissioner.phone) {
      doc.text(`Phone: ${property.commissioner.phone}`)
    }
    doc.moveDown()

    // Map Link
    if (property.mapUrl) {
      doc.text(`Map Location: ${property.mapUrl}`)
    }

    doc.end()

    // Wait for PDF to finish
    await new Promise((resolve) => {
      doc.on('end', resolve)
    })

    const pdfBuffer = Buffer.concat(chunks)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${property.title.replace(/[^a-z0-9]/gi, '_')}_brochure.pdf"`,
      },
    })
  } catch (error) {
    console.error('Brochure generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


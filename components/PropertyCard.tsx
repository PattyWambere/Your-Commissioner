'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Bed, Square, DollarSign, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PropertyCardProps {
  property: {
    id: string
    title: string
    price: number
    sizeSqm: number
    rooms?: number | null
    type: string
    status: string
    province: string
    district: string
    sector: string
    media: Array<{ url: string; alt?: string | null }>
  }
  compareSelected?: boolean
  onToggleCompare?: (id: string) => void
}

export default function PropertyCard({ property, compareSelected, onToggleCompare }: PropertyCardProps) {
  const imageUrl = property.media[0]?.url || '/placeholder-property.jpg'
  const statusColors: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800',
    UNDER_NEGOTIATION: 'bg-yellow-100 text-yellow-800',
    SOLD: 'bg-red-100 text-red-800',
    RENTED: 'bg-blue-100 text-blue-800',
  }

  return (
    <Link href={`/properties/${property.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        <div className="relative h-40 sm:h-48 w-full">
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
          {onToggleCompare && (
            <label
              className="absolute top-2 left-2 bg-white/90 backdrop-blur rounded-full px-2 sm:px-3 py-1 flex items-center gap-1 sm:gap-2 text-xs font-medium text-gray-700 shadow touch-manipulation"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={!!compareSelected}
                onChange={() => onToggleCompare(property.id)}
                className="accent-primary-600 w-4 h-4"
              />
              <span className="hidden sm:inline">Compare</span>
            </label>
          )}
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                statusColors[property.status] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {property.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {property.title}
          </h3>
          <div className="flex items-center text-gray-600 text-xs sm:text-sm mb-2">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">
              {property.sector}, {property.district}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span>{property.sizeSqm} sqm</span>
            </div>
            {property.rooms && (
              <div className="flex items-center">
                <Bed className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span>{property.rooms} rooms</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-lg sm:text-xl font-bold text-primary-600">
              {formatCurrency(property.price)}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-500 capitalize">
                {property.type.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}


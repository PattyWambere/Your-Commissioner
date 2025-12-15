'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, X, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('compareProperties')
    if (stored) {
      const ids = JSON.parse(stored)
      setSelectedIds(ids)
      if (ids.length > 0) {
        fetchProperties(ids)
      }
    }
  }, [])

  const fetchProperties = async (ids: string[]) => {
    if (ids.length === 0) return
    setLoading(true)
    try {
      const response = await fetch(`/api/properties/compare?ids=${ids.join(',')}`)
      const data = await response.json()
      if (response.ok) {
        setProperties(data.properties)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCompare = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= 5) return
    const newIds = [...selectedIds, id]
    setSelectedIds(newIds)
    localStorage.setItem('compareProperties', JSON.stringify(newIds))
    fetchProperties(newIds)
  }

  const removeFromCompare = (id: string) => {
    const newIds = selectedIds.filter((i) => i !== id)
    setSelectedIds(newIds)
    localStorage.setItem('compareProperties', JSON.stringify(newIds))
    setProperties(properties.filter((p) => p.id !== id))
  }

  if (selectedIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center">
                <Home className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Your Commissioner</span>
              </Link>
              <Link href="/properties" className="text-gray-700 hover:text-primary-600">
                Browse Properties
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Compare Properties</h1>
            <p className="text-gray-600 mb-8">
              Select up to 5 properties to compare side by side
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Browse Properties
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Home className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Your Commissioner</span>
            </Link>
            <Link href="/properties" className="text-gray-700 hover:text-primary-600">
              Browse Properties
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col gap-3 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">Compare Properties</h1>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/properties"
                className="text-xs sm:text-sm text-primary-600 underline hover:text-primary-700 touch-manipulation"
              >
                Back to Listings
              </Link>
              <button
                onClick={() => {
                  setSelectedIds([])
                  setProperties([])
                  localStorage.removeItem('compareProperties')
                }}
                className="text-xs sm:text-sm text-red-600 hover:text-red-700 touch-manipulation"
              >
                Clear All
              </button>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600">Side-by-side comparison. Up to 5 properties.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm sm:text-base text-gray-600">No properties selected for comparison</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-x-auto border border-gray-100 -mx-4 sm:mx-0">
            <div className="min-w-full inline-block">
              <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 sm:p-4 text-left text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-[120px] sm:min-w-[150px]">Feature</th>
                  {properties.map((property) => (
                    <th key={property.id} className="p-3 sm:p-4 text-left min-w-[200px] sm:min-w-[260px] align-top">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 line-clamp-2">{property.title}</h3>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-600">
                            <span className="capitalize">{property.type.toLowerCase()}</span>
                            <span>•</span>
                            <span className="line-clamp-1">{property.sector}, {property.district}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCompare(property.id)}
                          className="text-red-600 hover:text-red-700 flex-shrink-0 touch-manipulation"
                          aria-label="Remove from compare"
                        >
                          <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                      <div className="mt-2 sm:mt-3 rounded-lg overflow-hidden border border-gray-100">
                        <img
                          src={property.media[0]?.url || '/placeholder-property.jpg'}
                          alt={property.title}
                          className="w-full h-24 sm:h-32 object-cover"
                        />
                      </div>
                      <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          property.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                          property.status === 'UNDER_NEGOTIATION' ? 'bg-yellow-100 text-yellow-800' :
                          property.status === 'SOLD' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {property.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-primary-700">
                          {formatCurrency(property.price)}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 sm:p-4 font-semibold text-gray-700 sticky left-0 bg-white z-10">Price</td>
                  {properties.map((property) => (
                    <td key={property.id} className="p-3 sm:p-4 align-top">
                      <span className="text-xs sm:text-sm">{formatCurrency(property.price)}</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sm:p-4 font-semibold text-gray-700 sticky left-0 bg-white z-10">Size</td>
                  {properties.map((property) => (
                    <td key={property.id} className="p-3 sm:p-4 align-top">
                      <span className="text-xs sm:text-sm">{property.sizeSqm} sqm</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sm:p-4 font-semibold text-gray-700 sticky left-0 bg-white z-10">Rooms</td>
                  {properties.map((property) => (
                    <td key={property.id} className="p-3 sm:p-4 align-top">
                      <span className="text-xs sm:text-sm">{property.rooms || 'N/A'}</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sm:p-4 font-semibold text-gray-700 sticky left-0 bg-white z-10">Type</td>
                  {properties.map((property) => (
                    <td key={property.id} className="p-3 sm:p-4 align-top capitalize">
                      <span className="text-xs sm:text-sm">{property.type.toLowerCase()}</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sm:p-4 font-semibold text-gray-700 sticky left-0 bg-white z-10">Bathrooms</td>
                  {properties.map((property) => (
                    <td key={property.id} className="p-3 sm:p-4 align-top">
                      <span className="text-xs sm:text-sm">{property.bathrooms ?? 'N/A'}</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sm:p-4 font-semibold text-gray-700 sticky left-0 bg-white z-10">Parking</td>
                  {properties.map((property) => (
                    <td key={property.id} className="p-3 sm:p-4 align-top">
                      <span className="text-xs sm:text-sm">{property.parkingSlots ?? 'N/A'}</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sm:p-4 font-semibold text-gray-700 sticky left-0 bg-white z-10">Year Built</td>
                  {properties.map((property) => (
                    <td key={property.id} className="p-3 sm:p-4 align-top">
                      <span className="text-xs sm:text-sm">{property.yearBuilt ?? 'N/A'}</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sm:p-4 font-semibold text-gray-700 sticky left-0 bg-white z-10">Status</td>
                  {properties.map((property) => (
                    <td key={property.id} className="p-3 sm:p-4 align-top">
                      <span className="text-xs sm:text-sm">{property.status.replace('_', ' ')}</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sm:p-4 font-semibold text-gray-700 sticky left-0 bg-white z-10">Location</td>
                  {properties.map((property) => (
                    <td key={property.id} className="p-3 sm:p-4 align-top">
                      <span className="text-xs sm:text-sm line-clamp-2">{property.province}, {property.district}, {property.sector}</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sm:p-4 font-semibold text-gray-700 sticky left-0 bg-white z-10">Commissioner</td>
                  {properties.map((property) => (
                    <td key={property.id} className="p-3 sm:p-4 align-top">
                      <span className="text-xs sm:text-sm">{property.commissioner.name}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-gray-700 sticky left-0 bg-white z-10">Actions</td>
                  {properties.map((property) => (
                    <td key={property.id} className="p-3 sm:p-4 align-top">
                      <Link
                        href={`/properties/${property.id}`}
                        className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 underline touch-manipulation"
                      >
                        View Details
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


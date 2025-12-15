'use client'

import { useState, useEffect } from 'react'
import PropertyCard from '@/components/PropertyCard'
import PropertyFilters from '@/components/PropertyFilters'
import NavBar from '@/components/NavBar'
import { Home } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface Property {
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

export default function PropertiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [compareIds, setCompareIds] = useState<string[]>([])

  // Initialize filters/page from URL
  useEffect(() => {
    if (!searchParams) return
    const paramsObj: any = {}
    searchParams.forEach((value, key) => {
      if (key === 'page') {
        setPage(parseInt(value) || 1)
      } else {
        paramsObj[key] = value
      }
    })
    setFilters(paramsObj)
  }, [searchParams])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          params.set(k, String(v))
        }
      })

      const response = await fetch(`/api/properties?${params}`)
      const data = await response.json()

      if (response.ok) {
        setProperties(data.properties)
        setTotalPages(data.pagination.pages)
        const stored = localStorage.getItem('compareProperties')
        if (stored) setCompareIds(JSON.parse(stored))
        // push state to URL
        const qp = params.toString()
        router.replace(`/properties?${qp}`, { scroll: false })
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [filters, page])

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar showDashboard />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse Properties</h1>
          {compareIds.length > 0 && (
            <Link
              href="/properties/compare"
              className="text-primary-600 underline hover:text-primary-700 text-sm sm:text-base"
            >
              Compare ({compareIds.length})
            </Link>
          )}
        </div>

        <PropertyFilters onFilterChange={(f) => { setPage(1); setFilters(f) }} initialFilters={filters} />

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No properties found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  compareSelected={compareIds.includes(property.id)}
                  onToggleCompare={(id) => {
                    setCompareIds((prev) => {
                      if (prev.includes(id)) {
                        const next = prev.filter((x) => x !== id)
                        localStorage.setItem('compareProperties', JSON.stringify(next))
                        return next
                      }
                      if (prev.length >= 5) {
                        toast.error('You can compare up to 5 properties')
                        return prev
                      }
                      const next = [...prev, id]
                      localStorage.setItem('compareProperties', JSON.stringify(next))
                      return next
                    })
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-2 mt-6 sm:mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 touch-manipulation"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm sm:text-base">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 touch-manipulation"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
      {compareIds.length > 0 && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center px-4 z-50">
          <div className="bg-white shadow-lg rounded-full px-4 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 border max-w-full sm:max-w-none">
            <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
              {compareIds.length} propert{compareIds.length > 1 ? 'ies' : 'y'} selected
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/properties/compare"
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm touch-manipulation ${
                  compareIds.length < 2 ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'
                }`}
                onClick={(e) => {
                  if (compareIds.length < 2) {
                    e.preventDefault()
                    toast.error('Select at least 2 properties to compare')
                  }
                }}
              >
                Compare
              </Link>
              <button
                onClick={() => {
                  setCompareIds([])
                  localStorage.removeItem('compareProperties')
                }}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-800 px-2 py-1 touch-manipulation"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


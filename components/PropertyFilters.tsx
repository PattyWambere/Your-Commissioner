'use client'

import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'

interface PropertyFiltersProps {
  onFilterChange: (filters: any) => void
  initialFilters?: any
}

export default function PropertyFilters({ onFilterChange, initialFilters }: PropertyFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    province: '',
    district: '',
    sector: '',
    minPrice: '',
    maxPrice: '',
    minSize: '',
    maxSize: '',
    rooms: '',
    availability: '',
    status: '',
    ...(initialFilters || {}),
  })

  // Sync when initialFilters changes
  useEffect(() => {
    if (initialFilters) {
      setFilters((f: typeof filters) => ({ ...f, ...initialFilters }))
    }
  }, [initialFilters])

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClear = () => {
    const cleared = {
      search: '',
      type: '',
      province: '',
      district: '',
      sector: '',
      minPrice: '',
      maxPrice: '',
      minSize: '',
      maxSize: '',
      rooms: '',
      availability: '',
      status: '',
    }
    setFilters(cleared)
    onFilterChange(cleared)
  }

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Search Properties</h2>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-primary-600 hover:text-primary-700 text-sm sm:text-base px-2 py-1 sm:px-0 sm:py-0"
          >
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
            <span className="hidden sm:inline">{showFilters ? 'Hide' : 'Show'} Filters</span>
            <span className="sm:hidden">{showFilters ? 'Hide' : 'Show'}</span>
          </button>
          <button
            onClick={handleClear}
            className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 underline px-2 py-1"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Property Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="HOUSE">House</option>
              <option value="PLOT">Plot</option>
              <option value="APARTMENT">Apartment</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Availability
            </label>
            <select
              value={filters.availability}
              onChange={(e) => handleChange('availability', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All</option>
              <option value="SALE">Sale</option>
              <option value="RENT">Rent</option>
              <option value="LEASE">Lease</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Province
            </label>
            <input
              type="text"
              placeholder="Province"
              value={filters.province}
              onChange={(e) => handleChange('province', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              District
            </label>
            <input
              type="text"
              placeholder="District"
              value={filters.district}
              onChange={(e) => handleChange('district', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Sector
            </label>
            <input
              type="text"
              placeholder="Sector"
              value={filters.sector}
              onChange={(e) => handleChange('sector', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Min Price (RWF)
            </label>
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handleChange('minPrice', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Max Price (RWF)
            </label>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Rooms
            </label>
            <input
              type="number"
              placeholder="Number of rooms"
              value={filters.rooms}
              onChange={(e) => handleChange('rooms', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Min Size (sqm)
            </label>
            <input
              type="number"
              placeholder="Min"
              value={filters.minSize}
              onChange={(e) => handleChange('minSize', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Max Size (sqm)
            </label>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxSize}
              onChange={(e) => handleChange('maxSize', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}


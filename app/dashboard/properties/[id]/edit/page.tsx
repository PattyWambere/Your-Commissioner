'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, ArrowLeft, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditPropertyPage() {
  const params = useParams()
  const propertyId = useMemo(() => {
    const id = params?.id
    return Array.isArray(id) ? id[0] : id
  }, [params])
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [property, setProperty] = useState<any>(null)
  const [formData, setFormData] = useState({
    type: 'HOUSE',
    title: '',
    description: '',
    price: '',
    sizeSqm: '',
    rooms: '',
    bathrooms: '',
    parkingSlots: '',
    yearBuilt: '',
    province: '',
    district: '',
    sector: '',
    cell: '',
    status: 'AVAILABLE',
    availability: 'SALE',
    mapUrl: '',
    whatsappPrefill: '',
    amenities: [] as string[],
  })
  const [amenityInput, setAmenityInput] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [bulkMediaInput, setBulkMediaInput] = useState('')
  const [bulkAdding, setBulkAdding] = useState(false)
  const [fileUploading, setFileUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)

  // Type-specific configuration
  const typeConfig: Record<
    string,
    {
      showRooms: boolean
      showBathrooms: boolean
      showParking: boolean
      showYearBuilt: boolean
    }
  > = {
    HOUSE: {
      showRooms: true,
      showBathrooms: true,
      showParking: true,
      showYearBuilt: true,
    },
    APARTMENT: {
      showRooms: true,
      showBathrooms: true,
      showParking: true,
      showYearBuilt: true,
    },
    COMMERCIAL: {
      showRooms: false,
      showBathrooms: false,
      showParking: true,
      showYearBuilt: true,
    },
    PLOT: {
      showRooms: false,
      showBathrooms: false,
      showParking: false,
      showYearBuilt: false,
    },
  }

  useEffect(() => {
    if (!propertyId) return
    fetchProperty()
  }, [propertyId])

  const fetchProperty = async () => {
    if (!propertyId) return
    try {
      const response = await fetch(`/api/properties/${propertyId}`)
      const data = await response.json()
      if (response.ok) {
        setProperty(data.property)
        setFormData({
          type: data.property.type,
          title: data.property.title,
          description: data.property.description || '',
          price: data.property.price.toString(),
          sizeSqm: data.property.sizeSqm.toString(),
          rooms: data.property.rooms?.toString() || '',
          bathrooms: data.property.bathrooms?.toString() || '',
          parkingSlots: data.property.parkingSlots?.toString() || '',
          yearBuilt: data.property.yearBuilt?.toString() || '',
          province: data.property.province,
          district: data.property.district,
          sector: data.property.sector,
          cell: data.property.cell || '',
          status: data.property.status,
          availability: data.property.availability,
          mapUrl: data.property.mapUrl || '',
          whatsappPrefill: data.property.whatsappPrefill || '',
          amenities: Array.isArray(data.property.amenities) ? data.property.amenities : [],
        })
      }
    } catch (error) {
      console.error('Error fetching property:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          sizeSqm: parseFloat(formData.sizeSqm),
          rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
          parkingSlots: formData.parkingSlots ? parseInt(formData.parkingSlots) : undefined,
          yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
          cell: formData.cell || undefined,
          mapUrl: formData.mapUrl || undefined,
          whatsappPrefill: formData.whatsappPrefill || undefined,
        }),
      })

      if (response.ok) {
        toast.success('Property updated successfully!')
        fetchProperty()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update property')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property?')) return

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Property deleted successfully!')
        router.push('/dashboard')
      } else {
        toast.error('Failed to delete property')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleAddMedia = async () => {
    if (!mediaUrl.trim()) {
      toast.error('Please enter a media URL')
      return
    }

    try {
      const response = await fetch(`/api/properties/${propertyId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mediaUrl }),
      })

      if (response.ok) {
        toast.success('Media added successfully!')
        setMediaUrl('')
        fetchProperty()
      } else {
        toast.error('Failed to add media')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleFileUpload = async () => {
    if (!propertyId) {
      toast.error('Missing property id')
      return
    }
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please choose one or more files')
      return
    }
    setFileUploading(true)
    try {
      for (const file of Array.from(selectedFiles)) {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch(`/api/properties/${propertyId}/media`, {
          method: 'POST',
          body: formData,
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || `Failed to upload ${file.name}`)
        }
      }
      toast.success(`Uploaded ${selectedFiles.length} file(s)`)
      setSelectedFiles(null)
      fetchProperty()
    } catch (error: any) {
      toast.error(error.message || 'Upload failed')
    } finally {
      setFileUploading(false)
    }
  }

  const handleBulkAddMedia = async () => {
    const urls = bulkMediaInput
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)

    if (urls.length === 0) {
      toast.error('Please paste one or more image URLs (one per line)')
      return
    }

    if (!propertyId) {
      toast.error('Missing property id')
      return
    }
    setBulkAdding(true)
    try {
      for (const url of urls) {
        const response = await fetch(`/api/properties/${propertyId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || `Failed to add ${url}`)
        }
      }
      toast.success(`Added ${urls.length} image${urls.length > 1 ? 's' : ''}`)
      setBulkMediaInput('')
      fetchProperty()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add some images')
    } finally {
      setBulkAdding(false)
    }
  }

  const addAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityInput.trim()],
      })
      setAmenityInput('')
    }
  }

  const removeAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((a) => a !== amenity),
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Property not found</p>
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
            <Link href="/dashboard" className="text-gray-700 hover:text-primary-600">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/dashboard"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Delete Property
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h1 className="text-2xl font-bold mb-6">Edit Property</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="HOUSE">House</option>
                  <option value="PLOT">Plot</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="COMMERCIAL">Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="UNDER_NEGOTIATION">Under Negotiation</option>
                  <option value="SOLD">Sold</option>
                  <option value="RENTED">Rented</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability *
                </label>
                <select
                  required
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="SALE">Sale</option>
                  <option value="RENT">Rent</option>
                  <option value="LEASE">Lease</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (RWF) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size (sqm) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.sizeSqm}
                  onChange={(e) => setFormData({ ...formData, sizeSqm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {typeConfig[formData.type].showRooms && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Rooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.rooms}
                    onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
              {typeConfig[formData.type].showBathrooms && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
              {typeConfig[formData.type].showParking && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parking Slots
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.parkingSlots}
                    onChange={(e) => setFormData({ ...formData, parkingSlots: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
              {typeConfig[formData.type].showYearBuilt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Built
                  </label>
                  <input
                    type="number"
                    min="1800"
                    max="2100"
                    value={formData.yearBuilt}
                    onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province *
                </label>
                <input
                  type="text"
                  required
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District *
                </label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sector *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cell
                </label>
                <input
                  type="text"
                  value={formData.cell}
                  onChange={(e) => setFormData({ ...formData, cell: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Maps URL
              </label>
              <input
                type="url"
                value={formData.mapUrl}
                onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Prefill Message
              </label>
              <textarea
                value={formData.whatsappPrefill}
                onChange={(e) => setFormData({ ...formData, whatsappPrefill: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amenities
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm flex items-center"
                  >
                    {amenity}
                    <button
                      type="button"
                      onClick={() => removeAmenity(amenity)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href="/dashboard"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Media Management */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-bold mb-4">Property Images</h2>
          
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Enter image URL"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleAddMedia}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Image
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Images from Device
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                disabled={fileUploading}
                onClick={handleFileUpload}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {fileUploading ? 'Uploading...' : 'Upload Selected'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Supported: images. Max size {Number(process.env.MAX_FILE_SIZE || 5242880) / 1024 / 1024} MB per file.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Multiple Image URLs (one per line)
            </label>
            <textarea
              value={bulkMediaInput}
              onChange={(e) => setBulkMediaInput(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                disabled={bulkAdding}
                onClick={handleBulkAddMedia}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {bulkAdding ? 'Adding...' : 'Add All'}
              </button>
            </div>
          </div>

          {property.media && property.media.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {property.media.map((media: any) => (
                <div key={media.id} className="relative">
                  <img
                    src={media.url}
                    alt={media.alt || property.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No images added yet</p>
          )}
        </div>
      </main>
    </div>
  )
}


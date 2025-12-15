'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { MapPin, Bed, Square, Map, MessageCircle, Download, Calendar, ArrowLeft, Send, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useKeenSlider } from 'keen-slider/react'
import 'keen-slider/keen-slider.min.css'
import NavBar from '@/components/NavBar'

interface Property {
  id: string
  title: string
  description?: string | null
  price: number
  sizeSqm: number
  rooms?: number | null
  type: string
  status: string
  availability: string
  province: string
  district: string
  sector: string
  cell?: string | null
  mapUrl?: string | null
  whatsappPrefill?: string | null
  amenities: string[]
  bathrooms?: number | null
  parkingSlots?: number | null
  yearBuilt?: number | null
  commissioner: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  media: Array<{ id: string; url: string; alt?: string | null }>
}

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [appointmentData, setAppointmentData] = useState({
    name: '',
    email: '',
    phone: '',
    requestedAt: '',
    notes: '',
  })
  const [chatOpen, setChatOpen] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [messages, setMessages] = useState<
    Array<{
      id: string
      conversationId: string
      body: string
      senderName: string | null
      senderEmail: string | null
      senderPhone: string | null
      userId: string | null
      createdAt: string
      propertyName?: string | null
      propertyImage?: string | null
      propertyLink?: string | null
    }>
  >([])
  const [chatForm, setChatForm] = useState({
    name: '',
    email: '',
    phone: '',
    body: '',
  })
  const [showImageModal, setShowImageModal] = useState(false)
  const [prefillReady, setPrefillReady] = useState(false)
  const [socket, setSocket] = useState<any>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      initial: 0,
      loop: property?.media && property.media.length > 1 ? true : false,
      slideChanged(slider) {
        setCurrentSlide(slider.track.details.rel)
      },
      created(slider) {
        setCurrentSlide(slider.track.details.rel)
      },
    },
    []
  )
  const [modalSliderRef, modalInstanceRef] = useKeenSlider<HTMLDivElement>(
    {
      initial: 0,
      loop: property?.media && property.media.length > 1 ? true : false,
    },
    []
  )

  useEffect(() => {
    fetchProperty()
  }, [params.id])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (res.ok && data.user) {
          setUser(data.user)
          setChatForm((f) => ({ ...f, name: data.user.name || '', email: data.user.email || '' }))
          setAppointmentData((f) => ({
            ...f,
            name: data.user.name || f.name,
            email: data.user.email || f.email,
            phone: data.user.phone || f.phone,
          }))
          setPrefillReady(true)
        }
      } catch (e) {
        // ignore
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (chatOpen && property?.id) {
      ensureConversation()
    }
  }, [chatOpen, property?.id])

  useEffect(() => {
    if (!conversationId) return

    let s: any
    let isMounted = true

    import('socket.io-client').then(({ io }) => {
      if (!isMounted) return
      s = io('/', { path: '/api/socket.io' })
      setSocket(s)
      s.emit('join_conversation', { conversationId })
      s.on('new_message', (msg: any) => {
        if (msg.conversationId === conversationId) {
          setMessages((prev) => [...prev, msg])
        }
      })
    })

    return () => {
      isMounted = false
      if (s) s.disconnect()
    }
  }, [conversationId])

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${params.id}`)
      const data = await response.json()
      if (response.ok) {
        setProperty(data.property)
      }
    } catch (error) {
      console.error('Error fetching property:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    const phone = property?.commissioner.phone || ''
    const message = property?.whatsappPrefill || `Hi, I'm interested in ${property?.title}`
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const handleDownloadBrochure = () => {
    window.open(`/api/properties/${params.id}/brochure`, '_blank')
  }

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!property?.id) {
      toast.error('Property not found')
      return
    }
    if (!appointmentData.name || !appointmentData.phone || !appointmentData.requestedAt) {
      toast.error('Please fill name, phone, and preferred date/time')
      return
    }
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...appointmentData,
          propertyId: property.id,
          requestedAt: new Date(appointmentData.requestedAt).toISOString(),
        }),
      })

      if (response.ok) {
        toast.success('Appointment request submitted successfully!')
        setShowAppointmentForm(false)
        setAppointmentData({
          name: '',
          email: '',
          phone: '',
          requestedAt: '',
          notes: '',
        })
      } else {
        const data = await response.json().catch(() => null)
        toast.error(data?.error || 'Failed to submit appointment request')
      }
    } catch (error) {
      toast.error('Error submitting appointment request')
    }
  }

  const ensureConversation = async () => {
    if (!property) return
    try {
      const convRes = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id }),
      })
      const convData = await convRes.json()
      if (convRes.ok) {
        setConversationId(convData.conversation.id || convData.conversationId || convData.conversation?.id)
        await fetchMessages(convData.conversation.id || convData.conversationId || convData.conversation?.id)
      } else if (convRes.status === 401) {
        toast.error('Please login to chat')
        router.push('/login')
      }
    } catch (e) {
      console.error('Conversation error', e)
    }
  }

  const fetchMessages = async (cid?: string) => {
    const id = cid || conversationId
    if (!id) return
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${id}`)
      const data = await res.json()
      if (res.ok) {
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Chat fetch error', error)
    }
  }

  const handleSendMessage = async () => {
    if (!property || !chatForm.body.trim()) {
      return
    }
    if (!user) {
      toast.error('Please login to chat')
      router.push('/login')
      return
    }
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          propertyId: property.id,
          propertyName: property.title,
          propertyImage: property.media[0]?.url,
          propertyLink: `/properties/${property.id}`,
          body: chatForm.body,
          phone: chatForm.phone || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to send message')
      } else {
        setChatForm((f) => ({ ...f, body: '' }))
        if (!conversationId) {
          const data = await res.json()
          if (data.conversationId) setConversationId(data.conversationId)
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
    } finally {
      setChatLoading(false)
    }
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

  const statusColors: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800',
    UNDER_NEGOTIATION: 'bg-yellow-100 text-yellow-800',
    SOLD: 'bg-red-100 text-red-800',
    RENTED: 'bg-blue-100 text-blue-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar showDashboard />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm sm:text-base text-gray-700 hover:text-primary-700 touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> Back
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Image Gallery */}
          <div className="relative">
            <div
              ref={sliderRef}
              className="keen-slider h-64 sm:h-80 lg:h-96 bg-black cursor-pointer"
              onClick={() => setShowImageModal(true)}
            >
              {(property.media.length ? property.media : [{ id: 'placeholder', url: '/placeholder-property.jpg' }]).map((media, idx) => (
                <div className="keen-slider__slide relative" key={media.id || idx}>
                  <Image
                    src={media.url}
                    alt={media.alt || property.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority={idx === 0}
                  />
                </div>
              ))}
            </div>
            {property.media.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 sm:p-2 shadow touch-manipulation z-10"
                  onClick={() => instanceRef.current?.prev()}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 sm:p-2 shadow touch-manipulation z-10"
                  onClick={() => instanceRef.current?.next()}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </>
            )}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
              <span
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                  statusColors[property.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {property.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          {property.media.length > 1 && (
            <div className="flex space-x-2 p-2 sm:p-4 bg-gray-50 overflow-x-auto">
              {property.media.map((media, index) => (
                <button
                  key={media.id}
                  onClick={() => instanceRef.current?.moveToIdx(index)}
                    onDoubleClick={() => setShowImageModal(true)}
                  className={`relative w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 touch-manipulation ${
                    index === currentSlide ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={media.url}
                    alt={media.alt || property.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <div className="flex items-start text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-1 mt-0.5 flex-shrink-0" />
                <span>
                  {property.cell ? `${property.cell}, ` : ''}
                  {property.sector}, {property.district}, {property.province}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-primary-600 mb-4">
                {formatCurrency(property.price)}
              </div>
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <Square className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 mb-1 sm:mb-2" />
                <div className="text-xs sm:text-sm text-gray-600">Size</div>
                <div className="text-base sm:text-lg font-semibold">{property.sizeSqm} sqm</div>
              </div>
              {property.rooms && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <Bed className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 mb-1 sm:mb-2" />
                  <div className="text-xs sm:text-sm text-gray-600">Rooms</div>
                  <div className="text-base sm:text-lg font-semibold">{property.rooms}</div>
                </div>
              )}
              {property.bathrooms !== undefined && property.bathrooms !== null && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-600">Bathrooms</div>
                  <div className="text-base sm:text-lg font-semibold">{property.bathrooms}</div>
                </div>
              )}
              {property.parkingSlots !== undefined && property.parkingSlots !== null && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-600">Parking</div>
                  <div className="text-base sm:text-lg font-semibold">{property.parkingSlots}</div>
                </div>
              )}
              {property.yearBuilt && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-600">Year Built</div>
                  <div className="text-base sm:text-lg font-semibold">{property.yearBuilt}</div>
                </div>
              )}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="text-xs sm:text-sm text-gray-600">Type</div>
                <div className="text-base sm:text-lg font-semibold capitalize">{property.type.toLowerCase()}</div>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="text-xs sm:text-sm text-gray-600">Availability</div>
                <div className="text-base sm:text-lg font-semibold capitalize">{property.availability.toLowerCase()}</div>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-2">Description</h2>
                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-2">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-2 sm:px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs sm:text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons - icon-only for compact layout */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
              {property.mapUrl && (
                <a
                  href={property.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition touch-manipulation"
                  title="View on Map"
                >
                  <Map className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="sr-only">View on Map</span>
                </a>
              )}
              {property.commissioner.phone && (
                <button
                  onClick={handleWhatsApp}
                  className="h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 transition touch-manipulation"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="sr-only">Chat on WhatsApp</span>
                </button>
              )}
              <button
                onClick={handleDownloadBrochure}
                className="h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-800 transition touch-manipulation"
                title="Download Brochure"
              >
                <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="sr-only">Download Brochure</span>
              </button>
              <button
                onClick={() => setShowAppointmentForm(true)}
                className="h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700 transition touch-manipulation"
                title="Request Viewing"
              >
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="sr-only">Request Viewing</span>
              </button>
              <button
                onClick={() => setChatOpen(true)}
                className="h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-full border border-primary-200 text-primary-700 hover:bg-primary-50 transition touch-manipulation"
                title="Chat with Commissioner"
              >
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="sr-only">Chat with Commissioner</span>
              </button>
            </div>

            {/* Commissioner Info */}
            <div className="border-t pt-4 sm:pt-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Contact Information</h2>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <p className="font-semibold text-sm sm:text-base">{property.commissioner.name}</p>
                {property.commissioner.email && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Email: {property.commissioner.email}</p>
                )}
                {property.commissioner.phone && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Phone: {property.commissioner.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Image Lightbox Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-5xl">
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-200 touch-manipulation"
                aria-label="Close"
              >
                <X className="h-8 w-8" />
              </button>
              <div className="bg-black rounded-lg overflow-hidden">
                <div ref={modalSliderRef} className="keen-slider h-[60vh] sm:h-[70vh]">
                  {(property.media.length ? property.media : [{ id: 'placeholder', url: '/placeholder-property.jpg' }]).map((media, idx) => (
                    <div className="keen-slider__slide relative" key={media.id || idx}>
                      <Image
                        src={media.url}
                        alt={media.alt || property.title}
                        fill
                        className="object-contain bg-black"
                        sizes="100vw"
                      />
                    </div>
                  ))}
                </div>
                {property.media.length > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-black/60">
                    <button
                      className="px-3 py-2 text-white border border-white/40 rounded-lg hover:bg-white/10 touch-manipulation"
                      onClick={() => modalInstanceRef.current?.prev()}
                    >
                      Prev
                    </button>
                    <button
                      className="px-3 py-2 text-white border border-white/40 rounded-lg hover:bg-white/10 touch-manipulation"
                      onClick={() => modalInstanceRef.current?.next()}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Appointment Modal */}
        {showAppointmentForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 my-auto">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Request Viewing Appointment</h2>
              <form onSubmit={handleAppointmentSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={appointmentData.name}
                      onChange={(e) => setAppointmentData({ ...appointmentData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={appointmentData.email}
                      onChange={(e) => setAppointmentData({ ...appointmentData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={appointmentData.phone}
                      onChange={(e) => setAppointmentData({ ...appointmentData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={appointmentData.requestedAt}
                      onChange={(e) => setAppointmentData({ ...appointmentData, requestedAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={appointmentData.notes}
                      onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAppointmentForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Chat Drawer */}
        {chatOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Chat about {property.title}</h3>
                <button onClick={() => setChatOpen(false)} className="text-gray-600 hover:text-gray-900">
                  ✕
                </button>
              </div>
              <div className="px-4 pt-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={chatForm.name}
                    onChange={(e) => setChatForm({ ...chatForm, name: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={chatForm.email}
                    onChange={(e) => setChatForm({ ...chatForm, email: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={chatForm.phone}
                    onChange={(e) => setChatForm({ ...chatForm, phone: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{msg.senderName || 'Guest'}</span>
                        <span>{formatDate(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.body}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <textarea
                    value={chatForm.body}
                    onChange={(e) => setChatForm({ ...chatForm, body: e.target.value })}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm resize-none"
                    rows={2}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={chatLoading || !chatForm.body.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


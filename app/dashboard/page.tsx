'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Plus, TrendingUp, Eye, MessageCircle, Users, Calendar, LogOut, User, Menu, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'properties' | 'leads' | 'appointments' | 'messages'>('properties')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (response.ok && data.user) {
        if (data.user.role !== 'COMMISSIONER') {
          router.push('/properties')
          return
        }
        setUser(data.user)
        fetchDashboardData()
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    }
  }

  const fetchDashboardData = async () => {
    try {
      const [statsRes, propertiesRes, leadsRes, appointmentsRes, convRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/properties?commissioner=me&status=ALL'),
        fetch('/api/leads'),
        fetch('/api/appointments'),
        fetch('/api/chat/conversations?scope=commissioner'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json()
        setProperties(propertiesData.properties || [])
      }

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json()
        setLeads(leadsData.leads || [])
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json()
        setAppointments(appointmentsData.appointments || [])
      }

      if (convRes.ok) {
        const convData = await convRes.json()
        setConversations(convData.conversations || [])
        if (convData.conversations?.[0]?.id) {
          loadConversation(convData.conversations[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
      const data = await res.json()
      if (res.ok) {
        setSelectedConversation(conversationId)
        setMessages(data.messages || [])
      }
    } catch (e) {
      console.error('Load conversation error', e)
    }
  }

  const sendReply = async () => {
    if (!selectedConversation || !replyBody.trim()) return
    setReplyLoading(true)
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation,
          body: replyBody.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages((prev) => [...prev, data.message])
        setReplyBody('')
      } else {
        toast.error(data.error || 'Failed to send message')
      }
    } catch (e) {
      toast.error('Failed to send message')
    } finally {
      setReplyLoading(false)
    }
  }

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">Your Commissioner</span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/profile" className="flex items-center text-gray-700 hover:text-primary-700">
                <User className="h-5 w-5 mr-1" />
                <span className="hidden lg:inline">Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-red-600"
              >
                <LogOut className="h-5 w-5 mr-1" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-primary-600 touch-manipulation"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-3">
              <Link
                href="/profile"
                className="flex items-center px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
              <button
                onClick={() => {
                  handleLogout()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg text-left"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Commissioner Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your properties, leads, and appointments</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm truncate">Total Listings</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-0.5">{stats.totalListings}</p>
                </div>
                <Home className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary-600 flex-shrink-0 mt-1 sm:mt-0" />
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm truncate">Total Views</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-0.5">{stats.totalViews}</p>
                </div>
                <Eye className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-600 flex-shrink-0 mt-1 sm:mt-0" />
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm truncate">Total Leads</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-0.5">{stats.totalLeads}</p>
                </div>
                <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600 flex-shrink-0 mt-1 sm:mt-0" />
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm truncate">Appointments</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-0.5">{stats.totalAppointments}</p>
                </div>
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-600 flex-shrink-0 mt-1 sm:mt-0" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6">
          <div className="border-b overflow-x-auto">
            <div className="flex min-w-max sm:min-w-0">
              <button
                onClick={() => setActiveTab('properties')}
                className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-sm sm:text-base whitespace-nowrap touch-manipulation ${
                  activeTab === 'properties'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-sm sm:text-base whitespace-nowrap touch-manipulation ${
                  activeTab === 'leads'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Leads ({leads.length})
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-sm sm:text-base whitespace-nowrap touch-manipulation ${
                  activeTab === 'appointments'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Appointments ({appointments.length})
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-sm sm:text-base whitespace-nowrap touch-manipulation ${
                  activeTab === 'messages'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Messages ({conversations.length})
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'properties' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold">My Properties</h2>
                  <Link
                    href="/dashboard/properties/new"
                    className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm sm:text-base touch-manipulation"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Add Property
                  </Link>
                </div>
                {properties.length === 0 ? (
                  <p className="text-sm sm:text-base text-gray-600">No properties yet. Create your first listing!</p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {properties.map((property) => (
                      <div key={property.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg mb-1 line-clamp-2">{property.title}</h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-1">{property.sector}, {property.district}</p>
                            <p className="text-sm sm:text-base text-primary-600 font-semibold">RWF {property.price.toLocaleString()}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                property.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                                property.status === 'UNDER_NEGOTIATION' ? 'bg-yellow-100 text-yellow-800' :
                                property.status === 'SOLD' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {property.status.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500 capitalize">{property.type.toLowerCase()}</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                            <Link
                              href={`/properties/${property.id}`}
                              className="px-3 py-2 text-sm sm:text-base border rounded hover:bg-gray-50 text-center touch-manipulation"
                            >
                              View
                            </Link>
                            <Link
                              href={`/dashboard/properties/${property.id}/edit`}
                              className="px-3 py-2 text-sm sm:text-base bg-primary-600 text-white rounded hover:bg-primary-700 text-center touch-manipulation"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'leads' && (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Leads</h2>
                {leads.length === 0 ? (
                  <p className="text-sm sm:text-base text-gray-600">No leads yet.</p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {leads.map((lead) => (
                      <div key={lead.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg mb-1">{lead.name}</h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-1 line-clamp-2">{lead.property?.title || 'Property'}</p>
                            <p className="text-xs sm:text-sm text-gray-500 mb-1">{lead.phone}</p>
                            {lead.email && (
                              <p className="text-xs sm:text-sm text-gray-500 mb-2">{lead.email}</p>
                            )}
                            {lead.message && (
                              <p className="mt-2 text-sm sm:text-base text-gray-700 line-clamp-3">{lead.message}</p>
                            )}
                            <div className="mt-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                lead.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                lead.status === 'CONTACTED' ? 'bg-blue-100 text-blue-800' :
                                lead.status === 'VIEWING_SCHEDULED' ? 'bg-purple-100 text-purple-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {lead.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-col items-stretch sm:items-end gap-2 sm:w-auto w-full">
                            <select
                              value={lead.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value
                                const res = await fetch(`/api/leads/${lead.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: newStatus }),
                                })
                                if (res.ok) {
                                  setLeads((prev) =>
                                    prev.map((l) =>
                                      l.id === lead.id ? { ...l, status: newStatus } : l
                                    )
                                  )
                                  toast.success('Lead updated')
                                } else {
                                  toast.error('Failed to update lead')
                                }
                              }}
                              className="px-3 py-2 border rounded text-sm sm:text-base touch-manipulation w-full sm:w-auto"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="CONTACTED">Contacted</option>
                              <option value="VIEWING_SCHEDULED">Viewing Scheduled</option>
                              <option value="CLOSED">Closed</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Appointments</h2>
                {appointments.length === 0 ? (
                  <p className="text-sm sm:text-base text-gray-600">No appointments scheduled.</p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg mb-1">{appointment.name}</h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-1 line-clamp-2">{appointment.property?.title || 'Property'}</p>
                            <p className="text-xs sm:text-sm text-gray-500 mb-1">
                              {new Date(appointment.requestedAt).toLocaleString()}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 mb-2">{appointment.phone}</p>
                            {appointment.email && (
                              <p className="text-xs sm:text-sm text-gray-500 mb-2">{appointment.email}</p>
                            )}
                            {appointment.notes && (
                              <p className="text-sm sm:text-base text-gray-700 mt-2 line-clamp-2">{appointment.notes}</p>
                            )}
                            <div className="mt-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                appointment.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-col items-stretch sm:items-end gap-2 sm:w-auto w-full">
                            <select
                              value={appointment.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value
                                const res = await fetch(`/api/appointments/${appointment.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: newStatus }),
                                })
                                if (res.ok) {
                                  setAppointments((prev) =>
                                    prev.map((a) =>
                                      a.id === appointment.id ? { ...a, status: newStatus } : a
                                    )
                                  )
                                  toast.success('Appointment updated')
                                } else {
                                  toast.error('Failed to update appointment')
                                }
                              }}
                              className="px-3 py-2 border rounded text-sm sm:text-base touch-manipulation w-full sm:w-auto"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Messages</h2>
                <div className="flex flex-col md:grid md:grid-cols-3 gap-4">
                  {/* Conversations List */}
                  <div className="border rounded-lg p-2 sm:p-3 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto order-2 md:order-1">
                    {conversations.length === 0 ? (
                      <p className="text-sm sm:text-base text-gray-600 text-center py-4">No conversations yet.</p>
                    ) : (
                      <div className="space-y-1 sm:space-y-2">
                        {conversations.map((c) => {
                          const last = c.messages?.[0]
                          return (
                            <button
                              key={c.id}
                              onClick={() => loadConversation(c.id)}
                              className={`w-full text-left p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation ${
                                selectedConversation === c.id ? 'bg-primary-50 border border-primary-200' : ''
                              }`}
                            >
                              <p className="font-semibold text-sm sm:text-base truncate">{c.user?.name || c.user?.email || 'User'}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(c.lastMessageAt).toLocaleString()}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-700 line-clamp-2 mt-1">
                                {last?.body || 'No messages yet'}
                              </p>
                              {c.unreadForCommissioner > 0 && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                                  {c.unreadForCommissioner}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Messages View */}
                  <div className="md:col-span-2 border rounded-lg p-3 sm:p-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto order-1 md:order-2">
                    {selectedConversation ? (
                      <>
                        {messages.length === 0 ? (
                          <p className="text-sm sm:text-base text-gray-600 text-center py-8">No messages yet.</p>
                        ) : (
                          <div className="space-y-2 sm:space-y-3 mb-4">
                            {messages.map((msg) => (
                              <div key={msg.id} className="border rounded-lg p-2 sm:p-3 bg-gray-50">
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs text-gray-500 mb-1 sm:mb-2">
                                  <span className="font-medium">{msg.senderName || 'User'}</span>
                                  <span>{new Date(msg.createdAt).toLocaleString()}</span>
                                </div>
                                {msg.propertyName && (
                                  <div className="text-xs sm:text-sm text-primary-700 mb-1 sm:mb-2 font-medium">
                                    📍 {msg.propertyName}
                                  </div>
                                )}
                                <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap break-words">{msg.body}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center border-t pt-3">
                          <textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            rows={2}
                            placeholder="Type a reply..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                          />
                          <button
                            onClick={sendReply}
                            disabled={replyLoading || !replyBody.trim()}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 touch-manipulation"
                          >
                            {replyLoading ? 'Sending...' : 'Send'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full min-h-[200px]">
                        <p className="text-sm sm:text-base text-gray-600">Select a conversation to view messages.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


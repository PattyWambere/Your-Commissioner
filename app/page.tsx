import Link from 'next/link'
import { Search, Home as HomeIcon, MapPin, TrendingUp } from 'lucide-react'
import NavBar from '@/components/NavBar'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <NavBar showDashboard />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Find Your Perfect Property
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 px-2">
            Houses, Plots, Apartments, and Commercial Spaces
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center bg-primary-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-primary-700 transition touch-manipulation"
          >
            <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Start Searching
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16">
          <div className="bg-white p-5 sm:p-6 rounded-lg shadow-md">
            <MapPin className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Location-Based Search</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Filter by Province, District, Sector, and Cell to find properties in your preferred area.
            </p>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-lg shadow-md">
            <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Compare Properties</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Compare multiple properties side-by-side to make informed decisions.
            </p>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-lg shadow-md">
            <HomeIcon className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Direct Contact</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Connect with property owners via WhatsApp or schedule viewing appointments.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}


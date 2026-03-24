import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '@context/AuthContext'
import Loading from '@components/Loading'
import { formatINR } from '@utils/formatters'

const PassengerDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/passengers/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      setStats(response.data.stats)
      setRecentBookings(response.data.recentBookings)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {user?.name}!</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {stats && (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <p className="text-gray-600 mb-2">Total Bookings</p>
            <p className="text-4xl font-bold text-blue-600">{stats.totalBookings}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 mb-2">Active Bookings</p>
            <p className="text-4xl font-bold text-green-600">{stats.activeBookings}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 mb-2">Completed Trips</p>
            <p className="text-4xl font-bold text-purple-600">{stats.completedTrips}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 mb-2">Eco Score</p>
            <p className="text-4xl font-bold text-emerald-600">{stats.ecoScore ?? 0}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Recent Bookings</h2>

        {recentBookings.length === 0 ? (
          <p className="text-gray-600">No bookings yet. <a href="/search-rides" className="text-blue-600 hover:underline">Search rides</a></p>
        ) : (
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking._id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{booking.ride.from} to {booking.ride.to}</h3>
                  <p className="text-gray-600 text-sm">{new Date(booking.ride.departureDate).toLocaleDateString('en-IN')}</p>
                  <p className="text-gray-600 text-sm">{booking.numSeats} seat(s)</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatINR(booking.totalPrice)}</p>
                  <span className={`badge badge-${booking.status === 'confirmed' ? 'success' : 'warning'}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PassengerDashboard

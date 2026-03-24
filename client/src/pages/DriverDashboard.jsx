import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '@context/ToastContext'
import Loading from '@components/Loading'
import { formatINR, formatTime12Hour, getRideCompletionUnlockAt } from '@utils/formatters'

const DriverDashboard = () => {
  const { showToast, confirmAction } = useToast()
  const [stats, setStats] = useState(null)
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/drivers/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      setStats(response.data.stats)
      setRides(response.data.rides)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteRide = async (rideId) => {
    const confirmed = await confirmAction('Mark this ride as completed?', {
      title: 'Complete Ride',
      confirmLabel: 'Complete',
    })
    if (!confirmed) return

    try {
      await axios.patch(
        `/api/rides/${rideId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      await fetchDashboardData()
      showToast('Ride marked as completed', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete ride', 'danger')
    }
  }

  const handleCancelRide = async (rideId) => {
    const confirmed = await confirmAction('Cancel this ride? All bookings will be cancelled.', {
      title: 'Cancel Ride',
      confirmLabel: 'Cancel Ride',
      tone: 'danger',
    })
    if (!confirmed) return

    try {
      await axios.patch(
        `/api/rides/${rideId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      await fetchDashboardData()
      showToast('Ride cancelled', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel ride', 'danger')
    }
  }

  if (loading) return <Loading />

  const getCompletionState = (ride) => {
    const unlockAt = getRideCompletionUnlockAt(ride)
    if (!unlockAt) return { canComplete: true, helperText: '' }

    const canComplete = Date.now() >= unlockAt.getTime()
    return {
      canComplete,
      helperText: canComplete
        ? ''
        : `Complete available after ${unlockAt.toLocaleDateString('en-IN')} ${unlockAt.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}`,
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Driver Dashboard</h1>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {stats && (
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="card">
            <p className="text-gray-600 mb-2">Total Rides</p>
            <p className="text-4xl font-bold text-blue-600">{stats.totalRides}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 mb-2">Active Rides</p>
            <p className="text-4xl font-bold text-green-600">{stats.activeRides}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 mb-2">Total Bookings</p>
            <p className="text-4xl font-bold text-purple-600">{stats.totalBookings}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 mb-2">Eco Score</p>
            <p className="text-4xl font-bold text-emerald-600">{stats.ecoScore ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 mb-2">Total Earnings</p>
            <p className="text-4xl font-bold text-green-700">{formatINR(stats.totalEarnings)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Your Rides</h2>

        {rides.length === 0 ? (
          <p className="text-gray-600">
            No rides yet. <Link to="/create-ride" className="text-blue-600 hover:underline">Create your first ride</Link>
          </p>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div key={ride._id} className="border rounded-lg p-4">
                {(() => {
                  const completionState = getCompletionState(ride)
                  return (
                    <>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{ride.from} to {ride.to}</h3>
                    <p className="text-gray-600">
                      {new Date(ride.departureDate).toLocaleDateString('en-IN')} at {formatTime12Hour(ride.departureTime)}
                    </p>
                  </div>
                  <span className={`badge badge-${ride.status === 'active' ? 'success' : ride.status === 'completed' ? 'success' : 'danger'}`}>
                    {ride.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 text-sm">Seats</p>
                    <p className="font-bold">{ride.availableSeats}/{ride.totalSeats}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Bookings</p>
                    <p className="font-bold">{ride.bookings}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Fare/Seat</p>
                    <p className="font-bold">{formatINR(ride.pricePerSeat)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Earnings</p>
                    <p className="font-bold text-green-600">{formatINR(ride.earnings)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Car</p>
                    <p className="font-bold">{ride.carModel}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {ride.status === 'active' && (
                    <>
                      {completionState.canComplete && (
                        <button
                          onClick={() => handleCompleteRide(ride._id)}
                          className="btn-primary text-sm"
                        >
                          Complete
                        </button>
                      )}
                      <button onClick={() => handleCancelRide(ride._id)} className="btn-secondary text-sm">
                        Cancel
                      </button>
                    </>
                  )}
                  <Link to={`/driver/ride/${ride._id}/bookings`} className="btn-secondary text-sm">
                    Bookings
                  </Link>
                </div>
                {ride.status === 'active' && completionState.helperText && (
                  <p className="mt-3 text-xs text-slate-500">{completionState.helperText}</p>
                )}
                    </>
                  )
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DriverDashboard

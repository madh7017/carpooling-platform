import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@context/AuthContext'
import { useToast } from '@context/ToastContext'
import Loading from '@components/Loading'
import { formatINR, formatTime12Hour, getRideCompletionUnlockAt } from '@utils/formatters'

const Dashboard = () => {
  const { user } = useAuth()
  const { showToast, confirmAction } = useToast()
  const [bookings, setBookings] = useState([])
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` }
      const [bookingsResponse, ridesResponse] = await Promise.all([
        axios.get('/api/bookings', { headers }),
        axios.get('/api/rides/my', { headers }),
      ])

      setBookings(bookingsResponse.data.bookings || [])
      setRides(ridesResponse.data?.rides || ridesResponse.data || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

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

  const bookingStats = {
    total: bookings.length,
    active: bookings.filter((booking) => booking.status === 'confirmed').length,
    completed: bookings.filter((booking) => booking.status === 'completed').length,
  }

  const rideStats = {
    total: rides.length,
    active: rides.filter((ride) => ride.status === 'active').length,
    earnings: rides.reduce((sum, ride) => sum + (ride.earnings || 0), 0),
  }

  const stats = [
    { label: 'Bookings', value: bookingStats.total, tone: 'text-slate-900' },
    { label: 'Active Trips', value: bookingStats.active, tone: 'text-emerald-600' },
    { label: 'Created Rides', value: rideStats.total, tone: 'text-slate-900' },
    { label: 'Ride Earnings', value: formatINR(rideStats.earnings), tone: 'text-cyan-700' },
    { label: 'Eco Score', value: user?.ecoScore ?? 0, tone: 'text-lime-600' },
  ]

  const recentBookings = bookings.slice(0, 3)
  const recentRides = rides.slice(0, 3)

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
    <div className="container-main py-8 space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">Dashboard</p>
            <h1 className="heading-2 mt-2">Welcome back, {user?.name}</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Manage your bookings and rides from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/search-rides" className="btn-secondary">
              Find Rides
            </Link>
            <Link to="/create-ride" className="btn-primary">
              Create Ride
            </Link>
          </div>
        </div>
      </section>

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className={`mt-3 text-3xl font-bold ${item.tone}`}>{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="heading-4">Recent Bookings</h2>
              <p className="mt-1 text-sm text-slate-500">Your latest passenger activity.</p>
            </div>
            <Link to="/my-bookings" className="text-sm font-semibold text-blue-700 transition hover:text-blue-800">
              View all
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-slate-500">
              No bookings yet.
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <article key={booking._id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{booking.ride.from} to {booking.ride.to}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {new Date(booking.ride.departureDate).toLocaleDateString('en-IN')} at {formatTime12Hour(booking.ride.departureTime)}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {booking.numSeats} seat(s) • {formatINR(booking.totalPrice)}
                      </p>
                    </div>
                    <span className={`badge badge-${booking.status === 'cancelled' ? 'danger' : booking.status === 'completed' ? 'info' : 'success'}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link to="/my-bookings" className="btn-outline btn-sm">
                      Manage Booking
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="heading-4">Recent Rides</h2>
              <p className="mt-1 text-sm text-slate-500">Your latest created rides.</p>
            </div>
          </div>

          {recentRides.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-slate-500">
              No rides created yet.
            </div>
          ) : (
            <div className="space-y-4">
              {recentRides.map((ride) => (
                <article key={ride._id} className="rounded-2xl border border-slate-200 p-4">
                  {(() => {
                    const completionState = getCompletionState(ride)
                    return (
                      <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{ride.from} to {ride.to}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {new Date(ride.departureDate).toLocaleDateString('en-IN')} at {formatTime12Hour(ride.departureTime)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span>Bookings: {ride.bookings}</span>
                        <span>Seats: {ride.availableSeats}/{ride.totalSeats}</span>
                        <span>Fare: {formatINR(ride.pricePerSeat)}</span>
                      </div>
                    </div>
                    <span className={`badge badge-${ride.status === 'cancelled' ? 'danger' : ride.status === 'completed' ? 'info' : 'success'}`}>
                      {ride.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {ride.status === 'active' && (
                      <>
                        {completionState.canComplete && (
                          <button
                            onClick={() => handleCompleteRide(ride._id)}
                            className="btn-primary btn-sm"
                          >
                            Complete
                          </button>
                        )}
                        <button onClick={() => handleCancelRide(ride._id)} className="btn-secondary btn-sm">
                          Cancel
                        </button>
                      </>
                    )}
                    <Link to={`/driver/ride/${ride._id}/bookings`} className="btn-outline btn-sm">
                      View Bookings
                    </Link>
                  </div>
                  {ride.status === 'active' && completionState.helperText && (
                    <p className="mt-3 text-xs text-slate-500">{completionState.helperText}</p>
                  )}
                      </>
                    )
                  })()}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}

export default Dashboard

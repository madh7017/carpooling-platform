import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@context/AuthContext'
import { useToast } from '@context/ToastContext'
import Loading from '@components/Loading'
import { formatINR } from '@utils/formatters'

const StatusBarChart = ({ title, items }) => {
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="heading-4">{title}</h2>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">{item.label}</span>
              <span className="font-semibold text-slate-900">{item.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${item.color}`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

const MiniTrendChart = ({ title, points }) => {
  const maxValue = Math.max(...points.map((point) => point.value), 1)

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="heading-4">{title}</h2>
      <div className="mt-6 flex h-48 items-end gap-3">
        {points.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center justify-end gap-2">
            <div className="text-xs font-semibold text-slate-500">{point.value}</div>
            <div className="flex h-36 w-full items-end rounded-2xl bg-slate-100 p-1">
              <div
                className="w-full rounded-xl bg-gradient-to-t from-blue-600 to-cyan-400"
                style={{ height: `${Math.max((point.value / maxValue) * 100, point.value > 0 ? 12 : 0)}%` }}
              />
            </div>
            <div className="text-center text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {point.label}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

const AdminPage = () => {
  const { user } = useAuth()
  const { showToast, confirmAction, promptAction } = useToast()
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [rides, setRides] = useState([])
  const [bookings, setBookings] = useState([])
  const [supportRequests, setSupportRequests] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }),
    []
  )

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      const [overviewResponse, usersResponse, ridesResponse, bookingsResponse] = await Promise.all([
        axios.get('/api/admin/overview', { headers }),
        axios.get('/api/admin/users', { headers }),
        axios.get('/api/admin/rides', { headers }),
        axios.get('/api/admin/bookings', { headers }),
      ])

      setOverview(overviewResponse.data.stats)
      setUsers(usersResponse.data.users || [])
      setRides(ridesResponse.data.rides || [])
      setBookings(bookingsResponse.data.bookings || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.isAdmin) {
      fetchAdminData()
    }
  }, [user?.isAdmin])

  useEffect(() => {
    if (!user?.isAdmin || activeTab !== 'support') return

    let isMounted = true

    const fetchSupportRequests = async () => {
      try {
        const response = await axios.get('/api/admin/support', { headers })
        if (!isMounted) return
        setSupportRequests(response.data.requests || [])
        window.dispatchEvent(new Event('support-badge-refresh'))
      } catch (err) {
        if (!isMounted) return
        showToast(err.response?.data?.message || 'Failed to load support requests', 'danger')
      }
    }

    fetchSupportRequests()

    return () => {
      isMounted = false
    }
  }, [activeTab, headers, showToast, user?.isAdmin])

  if (!user) return null
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />
  if (loading) return <Loading />

  const handleToggleAdmin = async (targetUser) => {
    const confirmed = await confirmAction(
      `${targetUser.isAdmin ? 'Remove' : 'Give'} admin access for ${targetUser.name}?`,
      {
        title: 'Update Admin Access',
        confirmLabel: targetUser.isAdmin ? 'Remove Admin' : 'Make Admin',
      }
    )
    if (!confirmed) return

    try {
      await axios.patch(
        `/api/admin/users/${targetUser.id}/admin`,
        { isAdmin: !targetUser.isAdmin },
        { headers }
      )
      showToast('Admin access updated', 'success')
      fetchAdminData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update admin access', 'danger')
    }
  }

  const handleDeleteUser = async (targetUser) => {
    const confirmed = await confirmAction(
      `Delete ${targetUser.name} and related records? This cannot be undone.`,
      {
        title: 'Delete User',
        confirmLabel: 'Delete User',
        tone: 'danger',
      }
    )
    if (!confirmed) return

    try {
      await axios.delete(`/api/admin/users/${targetUser.id}`, { headers })
      showToast('User deleted', 'success')
      fetchAdminData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'danger')
    }
  }

  const handleCancelRide = async (ride) => {
    const confirmed = await confirmAction(
      `Cancel the ride from ${ride.from} to ${ride.to}?`,
      {
        title: 'Cancel Ride',
        confirmLabel: 'Cancel Ride',
        tone: 'danger',
      }
    )
    if (!confirmed) return

    try {
      await axios.patch(`/api/admin/rides/${ride.id}/cancel`, {}, { headers })
      showToast('Ride cancelled', 'success')
      fetchAdminData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel ride', 'danger')
    }
  }

  const handleCancelBooking = async (booking) => {
    const confirmed = await confirmAction(
      `Cancel this booking for ${booking.passenger?.name || 'the passenger'}?`,
      {
        title: 'Cancel Booking',
        confirmLabel: 'Cancel Booking',
        tone: 'danger',
      }
    )
    if (!confirmed) return

    try {
      await axios.patch(`/api/admin/bookings/${booking.id}/cancel`, {}, { headers })
      showToast('Booking cancelled', 'success')
      fetchAdminData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel booking', 'danger')
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'rides', label: 'Rides' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'support', label: 'Support' },
  ]

  const handleSupportUpdate = async (request, status) => {
    const note = await promptAction('Add admin note for this support request.', {
      title: status === 'resolved' ? 'Resolve Support Request' : 'Update Support Request',
      confirmLabel: 'Save',
      initialValue: request.adminNote || '',
      placeholder: 'Optional admin note',
    })
    if (note === null) return

    try {
      await axios.patch(
        `/api/admin/support/${request.id}`,
        { status, adminNote: note ?? request.adminNote ?? '' },
        { headers }
      )
      showToast('Support request updated', 'success')
      fetchAdminData()
      if (activeTab === 'support') {
        const response = await axios.get('/api/admin/support', { headers })
        setSupportRequests(response.data.requests || [])
      }
      window.dispatchEvent(new Event('support-badge-refresh'))
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update support request', 'danger')
    }
  }

  const rideStatusItems = [
    { label: 'Active', value: rides.filter((ride) => ride.status === 'active').length, color: 'bg-emerald-500' },
    { label: 'Completed', value: rides.filter((ride) => ride.status === 'completed').length, color: 'bg-blue-500' },
    { label: 'Cancelled', value: rides.filter((ride) => ride.status === 'cancelled').length, color: 'bg-rose-500' },
  ]

  const bookingStatusItems = [
    { label: 'Confirmed', value: bookings.filter((booking) => booking.status === 'confirmed').length, color: 'bg-emerald-500' },
    { label: 'Completed', value: bookings.filter((booking) => booking.status === 'completed').length, color: 'bg-blue-500' },
    { label: 'Cancelled', value: bookings.filter((booking) => booking.status === 'cancelled').length, color: 'bg-rose-500' },
  ]

  const recentRidePoints = Array.from({ length: 7 }, (_, index) => {
    const current = new Date()
    current.setDate(current.getDate() - (6 - index))
    const key = current.toDateString()
    const count = rides.filter((ride) => new Date(ride.createdAt).toDateString() === key).length

    return {
      label: current.toLocaleDateString('en-IN', { weekday: 'short' }),
      value: count,
    }
  })

  const recentBookingPoints = Array.from({ length: 7 }, (_, index) => {
    const current = new Date()
    current.setDate(current.getDate() - (6 - index))
    const key = current.toDateString()
    const count = bookings.filter((booking) => new Date(booking.createdAt).toDateString() === key).length

    return {
      label: current.toLocaleDateString('en-IN', { weekday: 'short' }),
      value: count,
    }
  })

  const totalPlatformFare = rides.reduce((sum, ride) => sum + Number(ride.pricePerSeat || 0), 0)

  return (
    <div className="container-main py-8 space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">Admin</p>
        <h1 className="heading-2 mt-2">Platform Management</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Manage users, rides, bookings, and overall platform activity from one place.
        </p>
      </section>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && overview && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {[
              { label: 'Users', value: overview.users },
              { label: 'Rides', value: overview.rides },
              { label: 'Bookings', value: overview.bookings },
              { label: 'Active Rides', value: overview.activeRides },
              { label: 'Active Bookings', value: overview.activeBookings },
              { label: 'Open Support', value: overview.openSupportRequests ?? 0 },
            ].map((item) => (
              <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_1.2fr_0.8fr]">
            <StatusBarChart title="Ride Status Analysis" items={rideStatusItems} />
            <StatusBarChart title="Booking Status Analysis" items={bookingStatusItems} />

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="heading-4">Quick Insights</h2>
              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Admin Users</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{users.filter((entry) => entry.isAdmin).length}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Average Fare</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {rides.length ? formatINR(totalPlatformFare / rides.length) : formatINR(0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Completed Booking Ratio</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {bookings.length ? `${Math.round((bookingStatusItems[1].value / bookings.length) * 100)}%` : '0%'}
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <MiniTrendChart title="Rides Created This Week" points={recentRidePoints} />
            <MiniTrendChart title="Bookings Created This Week" points={recentBookingPoints} />
          </section>
        </>
      )}

      {activeTab === 'users' && (
        <section className="space-y-4">
          {users.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{entry.name}</h2>
                    {entry.isAdmin && <span className="badge badge-info">Admin</span>}
                  </div>
                  <p className="text-sm text-slate-600">{entry.email}</p>
                  <p className="text-sm text-slate-500">Phone: {entry.phone || 'Not provided'}</p>
                  <p className="text-sm text-slate-500">Eco Score: {entry.ecoScore}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleToggleAdmin(entry)} className="btn-outline btn-sm">
                    {entry.isAdmin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button type="button" onClick={() => handleDeleteUser(entry)} className="btn-danger btn-sm">
                    Delete User
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {activeTab === 'rides' && (
        <section className="space-y-4">
          {rides.map((ride) => (
            <article key={ride.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{ride.from} to {ride.to}</h2>
                    <span className={`badge badge-${ride.status === 'active' ? 'success' : ride.status === 'completed' ? 'info' : 'danger'}`}>
                      {ride.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Driver: {ride.driver?.name || 'Unknown'} ({ride.driver?.email || 'No email'})
                  </p>
                  <p className="text-sm text-slate-500">
                    Departure: {new Date(ride.departureAt).toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-slate-500">
                    Fare: {formatINR(ride.pricePerSeat)} • Seats: {ride.availableSeats}
                  </p>
                </div>

                {ride.status === 'active' && (
                  <button type="button" onClick={() => handleCancelRide(ride)} className="btn-danger btn-sm">
                    Cancel Ride
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {activeTab === 'bookings' && (
        <section className="space-y-4">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {booking.ride?.from || 'Unknown'} to {booking.ride?.to || 'Unknown'}
                    </h2>
                    <span className={`badge badge-${booking.status === 'confirmed' ? 'success' : booking.status === 'completed' ? 'info' : 'danger'}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Passenger: {booking.passenger?.name || 'Unknown'} ({booking.passenger?.email || 'No email'})
                  </p>
                  <p className="text-sm text-slate-500">
                    Driver: {booking.ride?.driver?.name || 'Unknown'} • Seats: {booking.seatsBooked}
                  </p>
                  <p className="text-sm text-slate-500">
                    Created: {new Date(booking.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>

                {booking.status === 'confirmed' && (
                  <button type="button" onClick={() => handleCancelBooking(booking)} className="btn-danger btn-sm">
                    Cancel Booking
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {activeTab === 'support' && (
        <section className="space-y-4">
          {supportRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-slate-500">
              No support requests yet.
            </div>
          ) : (
            supportRequests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">{request.subject}</h2>
                      <span className={`badge badge-${request.status === 'resolved' ? 'info' : request.status === 'in_progress' ? 'success' : 'warning'}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      User: {request.user?.name || 'Unknown'} ({request.user?.email || 'No email'})
                    </p>
                    <p className="text-sm text-slate-500">
                      Category: {request.category} • Created: {new Date(request.createdAt).toLocaleString('en-IN')}
                    </p>
                    {request.ride && (
                      <p className="text-sm text-slate-500">
                        Ride: {request.ride.from} to {request.ride.to}
                      </p>
                    )}
                    <p className="text-sm leading-6 text-slate-600">{request.message}</p>
                    {request.adminNote && (
                      <p className="text-sm rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                        <span className="font-semibold text-slate-900">Admin note:</span> {request.adminNote}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleSupportUpdate(request, 'in_progress')} className="btn-secondary btn-sm">
                      Mark In Progress
                    </button>
                    <button type="button" onClick={() => handleSupportUpdate(request, 'resolved')} className="btn-primary btn-sm">
                      Mark Resolved
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  )
}

export default AdminPage

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { formatDateIN, formatINR, formatRating, formatTime12Hour } from '@utils/formatters'

const GuestHome = () => (
  <div className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden px-4 py-12">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.15),_transparent_30%)]" />
      <div className="absolute left-[-4rem] top-12 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="absolute bottom-8 right-[-2rem] h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />

      <svg
        viewBox="0 0 1200 500"
        className="absolute left-1/2 top-10 h-[300px] w-[900px] -translate-x-1/2 text-slate-300/35"
        fill="none"
        aria-hidden="true"
      >
        <path d="M80 360C180 255 320 220 470 224C590 227 700 191 826 152C906 127 975 124 1062 146" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray="1 22" />
        <circle cx="172" cy="310" r="8" fill="currentColor" />
        <circle cx="566" cy="215" r="8" fill="currentColor" />
        <circle cx="956" cy="132" r="8" fill="currentColor" />
      </svg>

      <svg
        viewBox="0 0 320 120"
        className="absolute left-10 top-16 h-24 w-72 text-slate-400/35"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M60 72h12l10-25c2-6 7-10 13-10h70c8 0 16 4 21 11l13 18h24c10 0 18 8 18 18v8h-16a18 18 0 0 0-36 0h-82a18 18 0 0 0-36 0H60c-7 0-12-5-12-12v-6c0-7 5-12 12-12Zm55-5h70l-10-14c-2-3-6-5-9-5h-49c-4 0-7 2-8 6l-5 13Z" />
      </svg>

      <svg
        viewBox="0 0 360 140"
        className="absolute bottom-10 right-12 h-28 w-80 text-cyan-400/25"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M48 82h20l14-28c4-8 12-14 21-14h92c10 0 19 4 25 12l17 22h34c12 0 21 9 21 21v9h-22a21 21 0 0 0-42 0H122a21 21 0 0 0-42 0H48c-8 0-14-6-14-14v-4c0-8 6-14 14-14Zm76-8h86l-12-16c-3-4-7-6-12-6h-56c-5 0-9 3-11 7l-7 15Z" />
      </svg>
    </div>

    <section className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/78 px-8 py-16 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-12 sm:py-20">
      <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#2563eb_0%,#06b6d4_100%)]" />
      <div className="absolute right-10 top-10 h-28 w-28 rounded-full border border-blue-100/80" />
      <div className="absolute left-12 bottom-10 h-16 w-16 rounded-full bg-cyan-100/70 blur-xl" />

      <h1 className="relative font-display text-4xl font-extrabold leading-[1.02] text-slate-900 sm:text-6xl lg:text-7xl">
        Trajectory-Based Carpool Ride Matching System using Map APIs
      </h1>

      <p className="relative mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
        A clean, route-aware carpooling platform for matching ride creators and passengers using map-based travel intelligence.
      </p>

      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">Map API powered</span>
        <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">Trajectory matching</span>
        <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">Real-time ride flow</span>
      </div>

      <div className="relative mt-10 flex flex-wrap justify-center gap-4">
        <Link to="/login" className="btn-secondary btn-lg min-w-36 shadow-sm">
          Login
        </Link>
        <Link to="/register" className="btn-primary btn-lg min-w-36 shadow-lg shadow-blue-200/70">
          Register
        </Link>
      </div>
    </section>
  </div>
)

const UserHome = ({ upcomingBooking, upcomingRide, summaryLoading }) => (
  <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden px-4 py-8">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.16),_transparent_34%)]" />
      <div className="absolute left-12 top-20 h-48 w-48 rounded-full bg-blue-200/35 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-cyan-200/35 blur-3xl" />
    </div>

    <div className="container-main relative z-10 space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/82 px-6 py-7 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-blue-700">
              Quick Start
            </p>
            <h1 className="font-display mt-4 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              Pick your next move
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Book an upcoming ride or publish your own trip from one compact home screen.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">Live matching</span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">Safer coordination</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Link to="/search-rides" className="group rounded-[1.75rem] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="grid h-12 w-12 place-content-center rounded-2xl bg-blue-600 text-xl font-semibold text-white shadow-lg shadow-blue-200/70">
                P
              </div>
              <span className="rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                Passenger
              </span>
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">Book a Ride</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Search routes, compare fares, and reserve seats quickly.
            </p>
          </Link>

          <Link to="/create-ride" className="group rounded-[1.75rem] border border-cyan-100 bg-[linear-gradient(180deg,#f8fffe_0%,#edfdfb_100%)] p-6 shadow-sm transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="grid h-12 w-12 place-content-center rounded-2xl bg-cyan-600 text-xl font-semibold text-white shadow-lg shadow-cyan-200/70">
                D
              </div>
              <span className="rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Driver
              </span>
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">Create a Ride</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Publish your route, set seats, and manage passengers.
            </p>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Upcoming Booking</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Your next booked ride</h2>
            </div>
            <Link to="/my-bookings" className="text-sm font-semibold text-blue-700">
              View all
            </Link>
          </div>

          {summaryLoading ? (
            <div className="mt-4 h-24 animate-pulse rounded-2xl bg-slate-100" />
          ) : upcomingBooking ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-lg font-semibold text-slate-900">{upcomingBooking.ride?.from} to {upcomingBooking.ride?.to}</p>
              <p className="mt-1 text-sm text-slate-600">
                {formatDateIN(upcomingBooking.ride?.departureDate)} at {formatTime12Hour(upcomingBooking.ride?.departureTime)}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                <span>{upcomingBooking.numSeats} seat(s)</span>
                <span>{formatINR(upcomingBooking.totalPrice)}</span>
                <span>Driver: {upcomingBooking.ride?.driver?.name || 'Unknown'}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No upcoming bookings yet.
            </div>
          )}
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Upcoming Created Ride</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Your next published trip</h2>
            </div>
            <Link to="/dashboard" className="text-sm font-semibold text-cyan-700">
              Manage
            </Link>
          </div>

          {summaryLoading ? (
            <div className="mt-4 h-24 animate-pulse rounded-2xl bg-slate-100" />
          ) : upcomingRide ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-lg font-semibold text-slate-900">{upcomingRide.from} to {upcomingRide.to}</p>
              <p className="mt-1 text-sm text-slate-600">
                {formatDateIN(upcomingRide.departureDate)} at {formatTime12Hour(upcomingRide.departureTime)}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                <span>Bookings: {upcomingRide.bookings || 0}</span>
                <span>Seats: {upcomingRide.availableSeats}/{upcomingRide.totalSeats}</span>
                <span>{formatINR(upcomingRide.pricePerSeat)}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No upcoming created rides yet.
            </div>
          )}
        </article>
      </section>
    </div>
  </div>
)

const AdminHome = ({ adminOverview, adminLoading, adminError, liveRides }) => {
  const stats = [
    { label: 'Users', value: adminOverview?.users ?? '--' },
    { label: 'Rides', value: adminOverview?.rides ?? '--' },
    { label: 'Active Rides', value: adminOverview?.activeRides ?? '--' },
    { label: 'Bookings', value: adminOverview?.bookings ?? '--' },
  ]

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.16),_transparent_34%)]" />
        <div className="absolute left-12 top-20 h-48 w-48 rounded-full bg-blue-200/35 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-cyan-200/35 blur-3xl" />
      </div>

      <div className="container-main relative z-10 space-y-8">
        <section className="rounded-[2.5rem] border border-white/70 bg-white/82 px-8 py-10 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-blue-700">
                Admin Home
              </p>
              <h1 className="font-display mt-5 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
                Live rides across the platform
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                Monitor current ride activity, jump into platform management, and keep an eye on the next trips going live.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/admin" className="btn-primary btn-lg">
                Open Admin Panel
              </Link>
              <Link to="/search-rides" className="btn-secondary btn-lg">
                Browse Public Rides
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <article key={item.label} className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2.25rem] border border-white/70 bg-white/82 px-6 py-7 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="heading-3">Live Rides</h2>
              <p className="mt-1 text-sm text-slate-600">
                Active upcoming rides currently visible on the platform.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {liveRides.length} showing now
            </span>
          </div>

          {adminError && <div className="alert alert-danger mt-6">{adminError}</div>}

          {adminLoading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-[1.75rem] border border-slate-200 bg-slate-100" />
              ))}
            </div>
          ) : liveRides.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {liveRides.map((ride) => (
                <article
                  key={ride._id || ride.id}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="badge badge-success">Active</span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {formatINR(ride.pricePerSeat)}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-slate-900">
                    {ride.from} to {ride.to}
                  </h3>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>
                      Driver: <span className="font-semibold text-slate-800">{ride.driver?.name || 'Unknown'}</span>
                    </p>
                    <p>
                      Departure:{' '}
                      <span className="font-semibold text-slate-800">
                        {formatDateIN(ride.departureDate)} at {formatTime12Hour(ride.departureTime)}
                      </span>
                    </p>
                    <p>
                      Seats left: <span className="font-semibold text-slate-800">{ride.availableSeats}</span>
                    </p>
                    <p>
                      Rating: <span className="font-semibold text-slate-800">{formatRating(ride.driver?.rating, 'New')}</span>
                    </p>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <Link to={`/ride/${ride._id || ride.id}`} className="btn-outline btn-sm flex-1">
                      View Ride
                    </Link>
                    <Link to="/admin" className="btn-secondary btn-sm flex-1">
                      Manage
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-600">
              No active rides are live right now.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const Home = () => {
  const { user, loading } = useAuth()
  const [adminOverview, setAdminOverview] = useState(null)
  const [liveRides, setLiveRides] = useState([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [upcomingBooking, setUpcomingBooking] = useState(null)
  const [upcomingRide, setUpcomingRide] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const adminHeaders = useMemo(() => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  useEffect(() => {
    if (!user?.isAdmin) {
      setAdminOverview(null)
      setLiveRides([])
      setAdminError('')
      return
    }

    let isMounted = true

    const fetchAdminHome = async () => {
      try {
        setAdminLoading(true)
        const [overviewResponse, ridesResponse] = await Promise.all([
          axios.get('/api/admin/overview', { headers: adminHeaders, timeout: 30000 }),
          axios.get('/api/rides/search', { params: { limit: 8, sortBy: 'date' } }),
        ])

        if (!isMounted) return

        setAdminOverview(overviewResponse.data?.stats || null)
        setLiveRides(ridesResponse.data?.rides || [])
        setAdminError('')
      } catch (error) {
        if (!isMounted) return
        setAdminError(error.response?.data?.message || 'Failed to load live rides')
      } finally {
        if (isMounted) {
          setAdminLoading(false)
        }
      }
    }

    fetchAdminHome()

    return () => {
      isMounted = false
    }
  }, [adminHeaders, user?.isAdmin])

  useEffect(() => {
    if (!user || user.isAdmin) {
      setUpcomingBooking(null)
      setUpcomingRide(null)
      setSummaryLoading(false)
      return
    }

    let isMounted = true

    const toTimestamp = (dateValue, timeValue) => {
      if (!dateValue || !timeValue) return Number.POSITIVE_INFINITY
      const parsed = new Date(`${dateValue}T${timeValue}`)
      return Number.isNaN(parsed.getTime()) ? Number.POSITIVE_INFINITY : parsed.getTime()
    }

    const fetchSummaries = async () => {
      try {
        setSummaryLoading(true)
        const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` }
        const [bookingsResponse, ridesResponse] = await Promise.all([
          axios.get('/api/bookings', { headers }),
          axios.get('/api/rides/my', { headers }),
        ])

        if (!isMounted) return

        const now = Date.now()
        const nextBooking =
          (bookingsResponse.data?.bookings || [])
            .filter((booking) => booking.status === 'confirmed')
            .filter((booking) => toTimestamp(booking.ride?.departureDate, booking.ride?.departureTime) >= now)
            .sort(
              (left, right) =>
                toTimestamp(left.ride?.departureDate, left.ride?.departureTime) -
                toTimestamp(right.ride?.departureDate, right.ride?.departureTime)
            )[0] || null

        const nextRide =
          (ridesResponse.data?.rides || ridesResponse.data || [])
            .filter((ride) => ride.status === 'active')
            .filter((ride) => toTimestamp(ride.departureDate, ride.departureTime) >= now)
            .sort(
              (left, right) =>
                toTimestamp(left.departureDate, left.departureTime) -
                toTimestamp(right.departureDate, right.departureTime)
            )[0] || null

        setUpcomingBooking(nextBooking)
        setUpcomingRide(nextRide)
      } catch {
        if (!isMounted) return
        setUpcomingBooking(null)
        setUpcomingRide(null)
      } finally {
        if (isMounted) {
          setSummaryLoading(false)
        }
      }
    }

    fetchSummaries()

    return () => {
      isMounted = false
    }
  }, [user])

  if (loading) return null
  if (!user) return <GuestHome />
  if (user.isAdmin) {
    return (
      <AdminHome
        adminOverview={adminOverview}
        adminLoading={adminLoading}
        adminError={adminError}
        liveRides={liveRides}
      />
    )
  }

  return <UserHome upcomingBooking={upcomingBooking} upcomingRide={upcomingRide} summaryLoading={summaryLoading} />
}

export default Home

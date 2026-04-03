import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Loading from '@components/Loading'
import { getApiUrl } from '@api/api'
import { formatINR, formatRating, formatTime12Hour } from '@utils/formatters'

const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const SearchRides = () => {
  const placeSuggestions = [
    'Bengaluru',
    'Mysuru',
    'Chennai',
    'Coimbatore',
    'Hyderabad',
    'Vijayawada',
    'Tirupati',
    'Kochi',
    'Thiruvananthapuram',
    'Mangaluru',
    'Udupi',
    'Madurai',
    'Visakhapatnam',
    'Puducherry',
    'Warangal',
    'Ooty',
    'Rajahmundry',
  ]
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    date: '',
    minPrice: '',
    maxPrice: '',
    minSeats: '',
  })
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortBy] = useState('price')
  const [page, setPage] = useState(1)
  const sameRouteMessage = 'Choose different cities'
  const minSearchDate = getTodayDateString()

  const hasSameRoute = (fromValue, toValue) => {
    const from = fromValue.trim().toLowerCase()
    const to = toValue.trim().toLowerCase()
    return Boolean(from && to && from === to)
  }

  const handleSwap = () => {
    setFilters((prev) => {
      const next = {
        ...prev,
        from: prev.to,
        to: prev.from,
      }

      if (hasSameRoute(next.from, next.to)) {
        setError(sameRouteMessage)
        return { ...next, to: '' }
      }

      setError('')
      return next
    })
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => {
      const nextValue = name === 'date' && value && value < minSearchDate ? '' : value
      const next = { ...prev, [name]: nextValue }

      if (name === 'date' && value && value < minSearchDate) {
        setError('Invalid date')
        return next
      }

      if (hasSameRoute(next.from, next.to)) {
        setError(sameRouteMessage)
        return name === 'to' ? { ...next, to: '' } : { ...next, to: '' }
      }

      setError('')
      return next
    })
    setPage(1)
  }

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault?.()
    setError('')

    if (hasSameRoute(filters.from, filters.to)) {
      setError(sameRouteMessage)
      setFilters((prev) => ({ ...prev, to: '' }))
      return
    }

    setLoading(true)

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      params.append('sort', sortBy)
      params.append('page', page)
      params.append('limit', 10)

      const response = await axios.get(`/api/rides/search?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      setRides(response.data.rides)
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [filters, page, sortBy])

  useEffect(() => {
    handleSearch()
  }, [handleSearch])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return undefined

    const source = new EventSource(getApiUrl(`/stream?token=${encodeURIComponent(token)}`))
    source.addEventListener('ride_update', (event) => {
      const payload = JSON.parse(event.data)
      setRides((prev) => prev.filter((ride) => ride._id !== payload.rideId))
    })

    return () => source.close()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-6 shadow-sm sm:p-10">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-100/70 blur-2xl"></div>
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-cyan-100/60 blur-2xl"></div>

        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Smart search</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Find rides fast</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Minimal inputs, maximum results. Swap cities or add a date to refine.
          </p>

          <form onSubmit={handleSearch} className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_auto]">
            <input
              type="text"
              name="from"
              placeholder="From city"
              value={filters.from}
              onChange={handleFilterChange}
              list="place-suggestions"
              className="input-field"
            />

            <button
              type="button"
              onClick={handleSwap}
              className="btn-secondary h-[46px] px-4"
              aria-label="Swap locations"
            >
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 7h11l-3-3" />
                  <path d="M17 17H6l3 3" />
                </svg>
                Swap
              </span>
            </button>

            <input
              type="text"
              name="to"
              placeholder="To city"
              value={filters.to}
              onChange={handleFilterChange}
              list="place-suggestions"
              className="input-field"
            />

            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              min={minSearchDate}
              className="input-field"
            />

            <button type="submit" className="btn-primary h-[46px] px-6">
              Search
            </button>
          </form>
          <datalist id="place-suggestions">
            {placeSuggestions.map((place) => (
              <option key={place} value={place} />
            ))}
          </datalist>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Bengaluru to Mysuru</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Chennai to Coimbatore</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Hyderabad to Vijayawada</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      {loading ? (
        <Loading />
      ) : rides.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No rides found</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {rides.map((ride) => (
            <article
              key={ride._id}
              className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`badge badge-${ride.status === 'active' ? 'success' : 'warning'}`}>
                  {ride.status}
                </span>
                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {formatINR(ride.pricePerSeat)}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold leading-snug text-slate-900">
                  {ride.from} to {ride.to}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {new Date(ride.departureDate).toLocaleDateString('en-IN')} at {formatTime12Hour(ride.departureTime)}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Driver</p>
                  <p className="mt-1 font-medium text-slate-800">{ride.driver.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rating</p>
                  <p className="mt-1 font-medium text-slate-800">{formatRating(ride.driver?.rating)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Seats</p>
                  <p className="mt-1 font-medium text-slate-800">{ride.availableSeats}/{ride.totalSeats}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fare</p>
                  <p className="mt-1 font-medium text-slate-800">{formatINR(ride.pricePerSeat)}</p>
                </div>
              </div>

              <div className="mt-5">
                <Link to={`/ride/${ride._id}`} className="btn-primary w-full justify-center">
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchRides

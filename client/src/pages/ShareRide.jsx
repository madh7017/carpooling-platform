import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Loading from '@components/Loading'
import { formatINR } from '@utils/formatters'

const ShareRide = () => {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const response = await axios.get(`/api/share/${token}`)
        setData(response.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Share link not found')
      } finally {
        setLoading(false)
      }
    }

    fetchShare()
  }, [token])

  const mapLinks = useMemo(() => {
    if (!data?.booking?.ride) return null
    const from = data.booking.ride.from
    const to = data.booking.ride.to
    const query = encodeURIComponent(`${from} to ${to}`)
    return {
      embed: `https://www.google.com/maps?q=${query}&output=embed&hl=en&gl=IN`,
      googleDirections: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving&hl=en&gl=IN`,
    }
  }, [data])

  if (loading) return <Loading />

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  const booking = data.booking

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Shared Trip</h1>
            <p className="text-slate-600">
              {booking.ride.from} to {booking.ride.to}
            </p>
          </div>
          <span className={`badge badge-${booking.status === 'confirmed' ? 'success' : booking.status === 'completed' ? 'info' : 'danger'}`}>
            {booking.status}
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Passenger</p>
            <p className="font-semibold text-slate-900">{data.passenger?.name || 'Passenger'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Driver</p>
            <p className="font-semibold text-slate-900">{booking.ride.driver?.name || 'Driver'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Seats</p>
            <p className="font-semibold text-slate-900">{booking.numSeats}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Total Fare</p>
            <p className="font-semibold text-slate-900">{formatINR(booking.totalPrice)}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="heading-4">Trip Route</h2>
          <a href={mapLinks.googleDirections} target="_blank" rel="noreferrer" className="btn-outline">
            Open Navigation
          </a>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 h-80">
          <iframe
            title="Shared ride map"
            src={mapLinks.embed}
            width="100%"
            height="100%"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  )
}

export default ShareRide

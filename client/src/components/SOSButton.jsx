import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@context/AuthContext'
import { useToast } from '@context/ToastContext'

const rideRelatedPages = new Set(['/login', '/register'])

const buildRideOption = (ride, source) => {
  const rideId = ride._id || ride.id
  const departureValue = ride.departureAt || `${ride.departureDate}T${ride.departureTime}`
  const departureAt = new Date(departureValue)
  const departureText = Number.isNaN(departureAt.getTime())
    ? 'Schedule unavailable'
    : departureAt.toLocaleString('en-IN')

  return {
    id: rideId,
    label: `${ride.from} to ${ride.to} • ${departureText} • ${source}`,
  }
}

const SOSButton = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [rideOptions, setRideOptions] = useState([])
  const [selectedRideId, setSelectedRideId] = useState('')

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }),
    []
  )

  if (!user || user.isAdmin || rideRelatedPages.has(location.pathname)) {
    return null
  }

  const loadRideOptions = async () => {
    try {
      setLoading(true)
      const [bookingResponse, rideResponse] = await Promise.all([
        axios.get('/api/bookings', { headers }),
        axios.get('/api/rides/my', { headers }),
      ])

      const options = new Map()
      ;(bookingResponse.data.bookings || []).forEach((booking) => {
        if (booking.ride?._id) {
          options.set(booking.ride._id, buildRideOption(booking.ride, 'booked'))
        }
      })
      ;(rideResponse.data?.rides || rideResponse.data || []).forEach((ride) => {
        const rideId = ride._id || ride.id
        if (rideId) {
          options.set(rideId, buildRideOption(ride, 'created'))
        }
      })

      const nextOptions = Array.from(options.values())
      setRideOptions(nextOptions)
      setSelectedRideId((current) => current || nextOptions[0]?.id || '')
    } catch {
      showToast('Unable to load rides for SOS', 'danger')
    } finally {
      setLoading(false)
    }
  }

  const openModal = async () => {
    setIsOpen(true)
    await loadRideOptions()
  }

  const handleSendSOS = async () => {
    if (!selectedRideId) {
      showToast('Select a ride for SOS', 'danger')
      return
    }

    try {
      setSending(true)
      await axios.post(
        '/api/support',
        {
          subject: 'SOS Emergency Alert',
          category: 'safety',
          message: 'User triggered the SOS button and may need urgent help.',
          rideId: selectedRideId,
        },
        { headers }
      )
      showToast('SOS alert sent to admin', 'success')
      setIsOpen(false)
      navigate('/support')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send SOS alert', 'danger')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200"
        aria-label="Open SOS"
      >
        SOS
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-lg animate-slide-up rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-red-600">Emergency</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Send SOS Alert</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This sends an urgent safety support request to the admin team for quick review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full px-2 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close SOS"
              >
                x
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
              If this is a real emergency, contact local emergency services immediately too.
            </div>

            <div className="mt-5">
              <label className="label">Related Ride</label>
              <select
                value={selectedRideId}
                onChange={(e) => setSelectedRideId(e.target.value)}
                className="select-field"
                disabled={loading || rideOptions.length === 0}
              >
                <option value="">{loading ? 'Loading rides...' : 'Choose a ride'}</option>
                {rideOptions.map((ride) => (
                  <option key={ride.id} value={ride.id}>
                    {ride.label}
                  </option>
                ))}
              </select>
              {rideOptions.length === 0 && !loading && (
                <p className="mt-1 text-sm text-slate-500">No booked or created rides available for SOS.</p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => navigate('/support')} className="btn-secondary">
                Open Support
              </button>
              <button
                type="button"
                onClick={handleSendSOS}
                disabled={sending || loading || !selectedRideId}
                className="btn-danger"
              >
                {sending ? 'Sending...' : 'Send SOS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SOSButton

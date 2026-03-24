import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useToast } from '@context/ToastContext'
import Loading from '@components/Loading'
import { isValidDescriptiveText, isValidSupportSubject } from '@utils/validators'

const defaultForm = {
  subject: '',
  category: 'other',
  message: '',
  rideId: '',
}

const rideRelatedCategories = ['ride', 'driver', 'safety']

const SupportPage = () => {
  const { showToast } = useToast()
  const [formData, setFormData] = useState(defaultForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [requests, setRequests] = useState([])
  const [rideOptions, setRideOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }),
    []
  )

  const needsRideSelection = rideRelatedCategories.includes(formData.category)

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

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const [requestResponse, bookingResponse, rideResponse] = await Promise.all([
        axios.get('/api/support', { headers }),
        axios.get('/api/bookings', { headers }),
        axios.get('/api/rides/my', { headers }),
      ])

      setRequests(requestResponse.data.requests || [])

      const options = new Map()

      ;(bookingResponse.data.bookings || []).forEach((booking) => {
        if (booking.ride?._id) {
          options.set(booking.ride._id, buildRideOption(booking.ride, 'booked'))
        }
      })

      ;(rideResponse.data.rides || []).forEach((ride) => {
        const rideId = ride._id || ride.id
        if (rideId) {
          options.set(rideId, buildRideOption(ride, 'created'))
        }
      })

      setRideOptions(Array.from(options.values()))
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load support requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!isValidSupportSubject(formData.subject)) {
      setFieldErrors((prev) => ({ ...prev, subject: 'Enter a clear support subject' }))
      showToast('Enter a clear support subject', 'danger')
      return
    }

    if (!isValidDescriptiveText(formData.message)) {
      setFieldErrors((prev) => ({ ...prev, message: 'Describe the issue clearly' }))
      showToast('Describe the issue clearly', 'danger')
      return
    }

    if (needsRideSelection && !formData.rideId) {
      setFieldErrors((prev) => ({ ...prev, rideId: 'Select a ride' }))
      showToast('Select a ride', 'danger')
      return
    }

    try {
      setSubmitting(true)
      await axios.post('/api/support', formData, { headers })
      setFormData(defaultForm)
      setFieldErrors({})
      showToast('Support request submitted', 'success')
      fetchRequests()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit support request', 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBlur = (name, value) => {
    let message = ''

    if (name === 'subject' && value.trim() && !isValidSupportSubject(value)) {
      message = 'Enter a clear support subject'
    }

    if (name === 'message' && value.trim() && !isValidDescriptiveText(value)) {
      message = 'Describe the issue clearly'
    }

    if (message) {
      setFormData((prev) => ({ ...prev, [name]: '' }))
    }

    setFieldErrors((prev) => ({ ...prev, [name]: message }))
  }

  if (loading) return <Loading />

  return (
    <div className="container-main py-8 space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">Support</p>
        <h1 className="heading-2 mt-2">Need help with something?</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Send a support request and the admin team will review it from the admin panel.
        </p>
      </section>

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="heading-4">Create Request</h2>

          <div>
            <label className="label">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => {
                const value = e.target.value
                setFormData((prev) => ({ ...prev, subject: value }))
                setFieldErrors((prev) => ({ ...prev, subject: value && isValidSupportSubject(value) ? '' : prev.subject }))
              }}
              onBlur={(e) => handleBlur('subject', e.target.value)}
              className="input-field"
              placeholder="Short summary of the issue"
              required
            />
            {fieldErrors.subject && <p className="mt-1 text-sm text-red-600">{fieldErrors.subject}</p>}
          </div>

          <div>
            <label className="label">Category</label>
            <select
              value={formData.category}
              onChange={(e) => {
                const category = e.target.value
                setFormData((prev) => ({
                  ...prev,
                  category,
                  rideId: rideRelatedCategories.includes(category) ? prev.rideId : '',
                }))
                setFieldErrors((prev) => ({
                  ...prev,
                  rideId: rideRelatedCategories.includes(category) ? prev.rideId : '',
                }))
              }}
              className="select-field"
            >
              <option value="booking">Booking</option>
              <option value="ride">Ride</option>
              <option value="driver">Driver</option>
              <option value="payment">Payment</option>
              <option value="account">Account</option>
              <option value="safety">Safety</option>
              <option value="other">Other</option>
            </select>
          </div>

          {needsRideSelection && (
            <div>
              <label className="label">Select Ride</label>
              <select
                value={formData.rideId}
                onChange={(e) => {
                  const rideId = e.target.value
                  setFormData((prev) => ({ ...prev, rideId }))
                  setFieldErrors((prev) => ({ ...prev, rideId: rideId ? '' : prev.rideId }))
                }}
                className="select-field"
                required
              >
                <option value="">Choose a ride</option>
                {rideOptions.map((ride) => (
                  <option key={ride.id} value={ride.id}>
                    {ride.label}
                  </option>
                ))}
              </select>
              {fieldErrors.rideId && <p className="mt-1 text-sm text-red-600">{fieldErrors.rideId}</p>}
              {rideOptions.length === 0 && (
                <p className="mt-1 text-sm text-slate-500">No booked or created rides available to select.</p>
              )}
            </div>
          )}

          <div>
            <label className="label">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => {
                const value = e.target.value
                setFormData((prev) => ({ ...prev, message: value }))
                setFieldErrors((prev) => ({ ...prev, message: value && isValidDescriptiveText(value) ? '' : prev.message }))
              }}
              onBlur={(e) => handleBlur('message', e.target.value)}
              className="textarea-field"
              rows="5"
              placeholder="Explain the issue clearly"
              required
            />
            {fieldErrors.message && <p className="mt-1 text-sm text-red-600">{fieldErrors.message}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Submitting...' : 'Submit Support Request'}
          </button>
        </form>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="heading-4">Your Requests</h2>

          {requests.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-slate-500">
              No support requests yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {requests.map((request) => (
                <article key={request.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{request.subject}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {new Date(request.createdAt).toLocaleString('en-IN')} • {request.category}
                      </p>
                      {request.ride && (
                        <p className="mt-1 text-sm text-slate-500">
                          Ride: {request.ride.from} to {request.ride.to}
                        </p>
                      )}
                    </div>
                    <span className={`badge badge-${request.status === 'resolved' ? 'info' : request.status === 'in_progress' ? 'success' : 'warning'}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{request.message}</p>
                  {request.adminNote && (
                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">Admin note:</span> {request.adminNote}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  )
}

export default SupportPage

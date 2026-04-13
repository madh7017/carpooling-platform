import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '@context/ToastContext'
import Loading from '@components/Loading'
import FloatingChatBox from '@components/FloatingChatBox'
import PrivateCallButton from '@components/PrivateCallButton'
import { getApiUrl } from '@api/api'
import { formatINR, formatTime12Hour } from '@utils/formatters'
import { buildShareUrl, copyTextToClipboard, isLocalOnlyShareBaseUrl } from '@utils/share'

const MyBookings = () => {
  const { showToast, confirmAction } = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [activeChat, setActiveChat] = useState(null)
  const [messagesByBooking, setMessagesByBooking] = useState({})
  const [messageDraft, setMessageDraft] = useState('')
  const [activeRatingBookingId, setActiveRatingBookingId] = useState(null)
  const [dismissedRatingBookingIds, setDismissedRatingBookingIds] = useState([])

  const maybeOpenRatingPopup = useCallback((bookingList) => {
    const nextBookingToRate = bookingList.find(
      (booking) =>
        booking.status === 'completed' &&
        !booking.rated &&
        !dismissedRatingBookingIds.includes(booking._id)
    )

    if (nextBookingToRate) {
      setActiveRatingBookingId((current) => current || nextBookingToRate._id)
    }
  }, [dismissedRatingBookingIds])

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const response = await axios.get(`/api/bookings${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      setBookings(response.data.bookings)
      maybeOpenRatingPopup(response.data.bookings)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }, [filter, maybeOpenRatingPopup])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return undefined

    const source = new EventSource(getApiUrl(`/stream?token=${encodeURIComponent(token)}`))
    source.addEventListener('chat_message', (event) => {
      const payload = JSON.parse(event.data)
      setMessagesByBooking((prev) => {
        const existing = prev[payload.bookingId] || []
        return {
          ...prev,
          [payload.bookingId]: [...existing, payload.message],
        }
      })
    })
    source.addEventListener('checkin_update', (event) => {
      const payload = JSON.parse(event.data)
      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === payload.bookingId ? { ...booking, lastCheckInAt: payload.lastCheckInAt } : booking
        )
      )
    })
    source.addEventListener('ride_update', (event) => {
      const payload = JSON.parse(event.data)
      setBookings((prev) => {
        const updatedBookings = prev.map((booking) =>
          booking.ride?._id === payload.rideId ? { ...booking, status: payload.status } : booking
        )

        if (payload.status === 'completed') {
          maybeOpenRatingPopup(updatedBookings)
        }

        return updatedBookings
      })
    })

    return () => source.close()
  }, [maybeOpenRatingPopup])

  const handleCancelBooking = async (bookingId) => {
    const confirmed = await confirmAction('Are you sure you want to cancel this booking?', {
      title: 'Cancel Booking',
      confirmLabel: 'Cancel Booking',
      tone: 'danger',
    })
    if (!confirmed) return

    try {
      await axios.patch(
        `/api/bookings/${bookingId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      setBookings(bookings.filter((b) => b._id !== bookingId))
      showToast('Booking cancelled successfully', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel booking', 'danger')
    }
  }

  const handleRateDriver = async (bookingId, rating, review) => {
    try {
      await axios.post(
        `/api/bookings/${bookingId}/rate`,
        { rating, review },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      showToast('Rating submitted successfully', 'success')
      setActiveRatingBookingId(null)
      fetchBookings()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit rating', 'danger')
    }
  }

  const openChat = async (bookingId) => {
    setActiveChat(bookingId)
    if (messagesByBooking[bookingId]) return

    try {
      const response = await axios.get(`/api/chat/${bookingId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      setMessagesByBooking((prev) => ({ ...prev, [bookingId]: response.data.messages }))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load chat')
    }
  }

  const sendMessage = async () => {
    if (!messageDraft.trim() || !activeChat) return

    try {
      await axios.post(
        `/api/chat/${activeChat}`,
        { message: messageDraft },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      setMessageDraft('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message')
    }
  }

  const handleCheckIn = async (bookingId) => {
    try {
      await axios.post(
        `/api/bookings/${bookingId}/check-in`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed')
    }
  }

  const handleCopyShare = async (booking) => {
    if (!booking.shareToken) return
    const shareUrl = buildShareUrl(booking.shareToken)

    try {
      const copied = await copyTextToClipboard(shareUrl)
      if (!copied) {
        showToast('Unable to copy link. Please try again.', 'danger')
        return
      }

      showToast('Share link copied', 'success')

      if (isLocalOnlyShareBaseUrl()) {
        showToast('This copied link uses localhost. Set VITE_PUBLIC_APP_URL to your LAN link for other devices.', 'info')
      }
    } catch {
      showToast('Unable to copy link. Please try again.', 'danger')
    }
  }

  const activeBooking = bookings.find((booking) => booking._id === activeChat)
  const activeRatingBooking = bookings.find((booking) => booking._id === activeRatingBookingId)

  const handleCloseRatingModal = (bookingId) => {
    if (bookingId) {
      setDismissedRatingBookingIds((prev) => (prev.includes(bookingId) ? prev : [...prev, bookingId]))
    }
    setActiveRatingBookingId(null)
  }

  if (loading) return <Loading />

  return (
    <div className="container-main py-8">
      <h1 className="heading-2 mb-8">My Bookings</h1>

      {error && <div className="alert alert-danger mb-6">{error}</div>}

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'confirmed', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg transition font-medium ${
              filter === status ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted text-lg">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="card">
              <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex gap-4 items-center mb-2 flex-wrap">
                    <h3 className="heading-4">{booking.ride.from} to {booking.ride.to}</h3>
                    <span
                      className={`badge badge-${
                        booking.status === 'confirmed' ? 'success' : booking.status === 'completed' ? 'success' : 'warning'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-muted mb-2">
                    {new Date(booking.ride.departureDate).toLocaleDateString('en-IN')} at {formatTime12Hour(booking.ride.departureTime)}
                  </p>
                  <p className="text-muted">{booking.numSeats} seat(s) - {formatINR(booking.totalPrice)}</p>
                  <p className="text-muted">Driver: {booking.ride.driver.name}</p>
                  {booking.lastCheckInAt && (
                    <p className="text-sm text-slate-500 mt-1">Last check-in: {new Date(booking.lastCheckInAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {booking.status === 'confirmed' && (
                    <button onClick={() => handleCancelBooking(booking._id)} className="btn-secondary">
                      Cancel
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button onClick={() => handleCheckIn(booking._id)} className="btn-outline">
                      Safety Check-in
                    </button>
                  )}
                  {booking.shareToken && (
                    <button onClick={() => handleCopyShare(booking)} className="btn-secondary">
                      Copy Share Link
                    </button>
                  )}
                  <PrivateCallButton
                    bookingId={booking._id}
                    label="Call Driver"
                    className="btn-outline"
                    title={booking.ride?.driver?.name || 'Driver'}
                    subtitle={`${booking.ride?.from || ''} to ${booking.ride?.to || ''}`.trim()}
                  />
                  <button onClick={() => openChat(booking._id)} className="btn-secondary">
                    Chat
                  </button>
                  {booking.status === 'completed' && !booking.rated && (
                    <button onClick={() => setActiveRatingBookingId(booking._id)} className="btn-primary">
                      Rate Driver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FloatingChatBox
        isOpen={Boolean(activeBooking)}
        title={activeBooking?.ride?.driver?.name || 'Ride Creator'}
        subtitle={
          activeBooking?.ride
            ? `${activeBooking.ride.from} to ${activeBooking.ride.to}`
            : ''
        }
        messages={activeBooking ? messagesByBooking[activeBooking._id] || [] : []}
        currentUserRole="passenger"
        messageDraft={messageDraft}
        onDraftChange={setMessageDraft}
        onSend={sendMessage}
        onClose={() => {
          setActiveChat(null)
          setMessageDraft('')
        }}
      />

      <RatingModal
        booking={activeRatingBooking}
        isOpen={Boolean(activeRatingBooking)}
        onRate={handleRateDriver}
        onClose={() => handleCloseRatingModal(activeRatingBooking?._id)}
      />
    </div>
  )
}

const RatingModal = ({ booking, isOpen, onRate, onClose }) => {
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')

  useEffect(() => {
    if (!isOpen) return

    setRating(5)
    setReview('')
  }, [isOpen, booking?._id])

  const handleSubmit = () => {
    onRate(booking._id, rating, review)
  }

  if (!isOpen || !booking) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full animate-slide-up">
        <h3 className="heading-4 mb-4">Rate Your Driver</h3>
        <p className="mb-4 text-sm text-slate-600">
          {booking.ride?.from} to {booking.ride?.to}
        </p>

        <div className="mb-4">
          <label className="label">Rating</label>
          <select value={rating} onChange={(e) => setRating(parseInt(e.target.value))} className="select-field">
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} Stars
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="label">Review (optional)</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="textarea-field"
            placeholder="Share your experience..."
          ></textarea>
        </div>

        <div className="flex gap-2">
          <button onClick={handleSubmit} className="btn-primary flex-1">
            Submit
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default MyBookings

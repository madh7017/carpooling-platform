import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Loading from '@components/Loading'
import FloatingChatBox from '@components/FloatingChatBox'
import PrivateCallButton from '@components/PrivateCallButton'
import { getApiUrl } from '@api/api'

const DriverRideBookings = () => {
  const { rideId } = useParams()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeChat, setActiveChat] = useState(null)
  const [messagesByBooking, setMessagesByBooking] = useState({})
  const [messageDraft, setMessageDraft] = useState('')
  const [rideSummary, setRideSummary] = useState(null)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get(`/api/bookings/ride/${rideId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        setBookings(response.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [rideId])

  useEffect(() => {
    const fetchRideSummary = async () => {
      try {
        const response = await axios.get(`/api/rides/${rideId}`)
        setRideSummary(response.data.ride)
      } catch (err) {
        setRideSummary(null)
      }
    }

    fetchRideSummary()
  }, [rideId])

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
    source.addEventListener('booking_cancelled', (event) => {
      const payload = JSON.parse(event.data)
      setBookings((prev) => prev.filter((booking) => booking._id !== payload.bookingId))
    })

    return () => source.close()
  }, [])

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

  const activeBooking = bookings.find((booking) => booking._id === activeChat)

  if (loading) return <Loading />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-slate-900">Ride Bookings</h1>
        <p className="text-slate-600">Review passenger details and chat for coordination.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="grid gap-4">
        {bookings.map((booking) => (
            <div key={booking._id} className="card-compact">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {booking.passenger?.name || booking.passenger?.email || 'Passenger'}
                  </p>
                  <p className="text-sm text-slate-600">Email: {booking.passenger?.email || 'Not shared'}</p>
                  <p className="text-sm text-slate-600">Seats: {booking.seatsBooked}</p>
                  {booking.passengerDetails?.phone && <p className="text-sm text-slate-600">Passenger phone is hidden for privacy.</p>}
                  {booking.passengerDetails?.emergencyContactName && booking.passengerDetails?.emergencyContactPhone && (
                    <p className="text-sm text-slate-600">
                      Emergency contact saved: {booking.passengerDetails.emergencyContactName}
                    </p>
                  )}
                  {booking.lastCheckInAt && (
                    <p className="text-xs text-slate-500">Last check-in: {new Date(booking.lastCheckInAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <PrivateCallButton
                    bookingId={booking._id}
                    label="Call Passenger"
                    className="btn-outline btn-sm"
                    title={booking.passenger?.name || booking.passenger?.email || 'Passenger'}
                    subtitle={rideSummary ? `${rideSummary.from} to ${rideSummary.to}` : 'Ride coordination'}
                  />
                  <button className="btn-secondary btn-sm" onClick={() => openChat(booking._id)}>
                    Open Chat
                  </button>
                </div>
              </div>
          </div>
        ))}
      </div>

      <FloatingChatBox
        isOpen={Boolean(activeBooking)}
        title={activeBooking?.passenger?.name || activeBooking?.passenger?.email || 'Passenger'}
        subtitle={rideSummary ? `${rideSummary.from} to ${rideSummary.to}` : 'Ride coordination chat'}
        messages={activeBooking ? messagesByBooking[activeBooking._id] || [] : []}
        currentUserRole="driver"
        messageDraft={messageDraft}
        onDraftChange={setMessageDraft}
        onSend={sendMessage}
        onClose={() => {
          setActiveChat(null)
          setMessageDraft('')
        }}
      />
    </div>
  )
}

export default DriverRideBookings

import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@context/AuthContext'
import { useToast } from '@context/ToastContext'
import Loading from '@components/Loading'
import { formatINR, formatRating, formatTime12Hour } from '@utils/formatters'
import { isValidName, isValidPhone, isValidSafetyNote } from '@utils/validators'

const getStatusMeta = (status) => {
  if (status === 'active') {
    return {
      label: 'Live ride tracking enabled',
      tone: 'success',
      note: 'Ride is active. Share your trip link with trusted contacts and keep emergency call access ready.',
    }
  }

  if (status === 'completed') {
    return {
      label: 'Ride completed',
      tone: 'info',
      note: 'Trip has ended. Please rate your experience to improve safety for future riders.',
    }
  }

  return {
    label: 'Ride cancelled',
    tone: 'danger',
    note: 'This trip is no longer active. Please book another verified ride.',
  }
}

const RideDetail = () => {
  const { rideId } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSeats, setSelectedSeats] = useState(1)
  const [booking, setBooking] = useState(false)
  const [passengerDetails, setPassengerDetails] = useState({
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    note: '',
  })

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const response = await axios.get(`/api/rides/${rideId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        setRide(response.data.ride)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch ride')
      } finally {
        setLoading(false)
      }
    }

    fetchRide()
  }, [rideId])

  const handleBookRide = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (ride?.driver?._id === user.id) {
      setError('You cannot book your own ride')
      return
    }

    if (
      !passengerDetails.phone.trim() ||
      !passengerDetails.emergencyContactName.trim() ||
      !passengerDetails.emergencyContactPhone.trim()
    ) {
      setError('Please fill passenger and emergency contact details for safety')
      return
    }

    if (!isValidPhone(passengerDetails.phone)) {
      setError('Enter a valid passenger phone')
      return
    }

    if (!isValidName(passengerDetails.emergencyContactName)) {
      setError('Enter a valid emergency contact name')
      return
    }

    if (!isValidPhone(passengerDetails.emergencyContactPhone)) {
      setError('Enter a valid emergency contact phone')
      return
    }

    if (passengerDetails.note.trim() && !isValidSafetyNote(passengerDetails.note)) {
      setError('Add a short safety note using simple text')
      return
    }

    try {
      setBooking(true)
      await axios.post(
        `/api/bookings`,
        { rideId, numSeats: selectedSeats, passengerDetails },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      showToast('Ride booked successfully!', 'success')
      navigate('/my-bookings')
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed')
    } finally {
      setBooking(false)
    }
  }

  const mapLinks = useMemo(() => {
    if (!ride) return null

    const from = ride.from || ride.source?.address || ''
    const to = ride.to || ride.destination?.address || ''
    const query = encodeURIComponent(`${from} to ${to}`)

    return {
      embed: `https://www.google.com/maps?q=${query}&output=embed&hl=en&gl=IN`,
      googleDirections: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving&hl=en&gl=IN`,
      osmSearch: `https://www.openstreetmap.org/search?query=${query}`,
    }
  }, [ride])

  const handlePassengerDetailBlur = (name, value) => {
    let message = ''

    if (name === 'phone' && value.trim() && !isValidPhone(value)) {
      message = 'Enter a valid passenger phone'
    }

    if (name === 'emergencyContactName' && value.trim() && !isValidName(value)) {
      message = 'Enter a valid emergency contact name'
    }

    if (name === 'emergencyContactPhone' && value.trim() && !isValidPhone(value)) {
      message = 'Enter a valid emergency contact phone'
    }

    if (name === 'note' && value.trim() && !isValidSafetyNote(value)) {
      message = 'Add a short safety note using simple text'
    }

    if (message) {
      setPassengerDetails((prev) => ({ ...prev, [name]: '' }))
      setError(message)
      return
    }

    setError('')
  }

  if (loading) return <Loading />

  if (!ride) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-red-600">{error || 'Ride not found'}</p>
      </div>
    )
  }

  const statusMeta = getStatusMeta(ride.status)
  const isOwnRide = Boolean(user && ride.driver?._id === user.id)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="card">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-2">{ride.from} to {ride.to}</h1>
            <span className={`badge badge-${ride.status === 'active' ? 'success' : ride.status === 'completed' ? 'info' : 'danger'}`}>
              {ride.status}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-4">Trip Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-gray-600">Date and Time</p>
                <p className="font-semibold">
                  {new Date(ride.departureDate).toLocaleDateString('en-IN')} at {formatTime12Hour(ride.departureTime)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-gray-600">Fare per Seat</p>
                <p className="font-semibold">{formatINR(ride.pricePerSeat)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-gray-600">Available Seats</p>
                <p className="font-semibold">{ride.availableSeats}/{ride.totalSeats}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-gray-600">Car Model</p>
                <p className="font-semibold">{ride.carModel || 'Not specified'}</p>
              </div>
            </div>

            <h3 className="text-xl font-bold mt-8 mb-4">Driver Info</h3>
            <div className="rounded-xl border border-slate-200 p-4 space-y-2">
              <p><strong>Name:</strong> {ride.driver.name}</p>
              <p><strong>Rating:</strong> {formatRating(ride.driver?.rating, 'No ratings yet')}</p>
              <p><strong>Driving Licence Number:</strong> {ride.driver?.drivingLicenseNumber || 'Not provided'}</p>
              <p><strong>Vehicle Registration Number:</strong> {ride.driver?.vehicleRegistrationNumber || 'Not provided'}</p>
              <p><strong>Contact:</strong> Phone number is kept private until booking.</p>
            </div>
          </div>

          {user && ride.status === 'active' && !isOwnRide && (
            <div className="bg-blue-50 p-6 rounded-lg h-fit">
              <h3 className="text-xl font-bold mb-4">Book This Ride</h3>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Number of Seats</label>
                <select
                  value={selectedSeats}
                  onChange={(e) => setSelectedSeats(parseInt(e.target.value, 10))}
                  disabled={ride.availableSeats === 0}
                  className="input-field"
                >
                  {Array.from({ length: Math.min(ride.availableSeats, 5) }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Seat' : 'Seats'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 mb-4">
                <p className="text-sm font-semibold text-gray-700">Passenger Safety Details</p>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="Your phone number (+91...)"
                  value={passengerDetails.phone}
                  onChange={(e) => setPassengerDetails((prev) => ({ ...prev, phone: e.target.value }))}
                  onBlur={(e) => handlePassengerDetailBlur('phone', e.target.value)}
                  disabled={booking}
                />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Emergency contact name"
                  value={passengerDetails.emergencyContactName}
                  onChange={(e) =>
                    setPassengerDetails((prev) => ({ ...prev, emergencyContactName: e.target.value }))
                  }
                  onBlur={(e) => handlePassengerDetailBlur('emergencyContactName', e.target.value)}
                  disabled={booking}
                />
                <input
                  type="tel"
                  className="input-field"
                  placeholder="Emergency contact phone (+91...)"
                  value={passengerDetails.emergencyContactPhone}
                  onChange={(e) =>
                    setPassengerDetails((prev) => ({ ...prev, emergencyContactPhone: e.target.value }))
                  }
                  onBlur={(e) => handlePassengerDetailBlur('emergencyContactPhone', e.target.value)}
                  disabled={booking}
                />
                <textarea
                  className="textarea-field"
                  placeholder="Optional safety note like pickup near gate, i have luggage, slow walk, asthma, etc."
                  value={passengerDetails.note}
                  onChange={(e) => setPassengerDetails((prev) => ({ ...prev, note: e.target.value }))}
                  onBlur={(e) => handlePassengerDetailBlur('note', e.target.value)}
                  disabled={booking}
                />
              </div>

              <div className="bg-white p-3 rounded mb-4 border">
                <div className="flex justify-between mb-2">
                  <span>Base fare:</span>
                  <span>{formatINR(ride.pricePerSeat * selectedSeats)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{formatINR(ride.pricePerSeat * selectedSeats)}</span>
                  </div>
                </div>
              </div>

              <p className="mb-4 text-xs text-slate-500">
                Driver phone number stays hidden publicly. You can contact them after booking from your bookings page.
              </p>

              <button
                onClick={handleBookRide}
                disabled={booking || ride.availableSeats === 0}
                className="w-full btn-primary disabled:opacity-50"
              >
                {booking ? 'Booking...' : ride.availableSeats === 0 ? 'No Seats Available' : 'Book Now'}
              </button>
            </div>
          )}

          {user && ride.status === 'active' && isOwnRide && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 h-fit">
              <h3 className="text-xl font-bold mb-2">This is your ride</h3>
              <p className="text-sm text-slate-600">
                You can manage this trip from your dashboard and review bookings there.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="heading-4">Safety Tracking Map</h2>
          <span className={`badge badge-${statusMeta.tone}`}>{statusMeta.label}</span>
        </div>

        <p className="text-muted mb-4">{statusMeta.note}</p>

        <div className="overflow-hidden rounded-xl border border-slate-200 h-80">
          <iframe
            title="Ride route map"
            src={mapLinks.embed}
            width="100%"
            height="100%"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a href={mapLinks.googleDirections} target="_blank" rel="noreferrer" className="btn-secondary">
            Google Maps Directions
          </a>
          <a href={mapLinks.osmSearch} target="_blank" rel="noreferrer" className="btn-secondary">
            OpenStreetMap View
          </a>
          <span className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
            For emergencies, use your local emergency service directly if needed.
          </span>
        </div>
      </div>
    </div>
  )
}

export default RideDetail

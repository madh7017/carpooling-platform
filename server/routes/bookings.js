const express = require('express')
const Booking = require('../models/Booking')
const Ride = require('../models/Ride')
const User = require('../models/User')
const { auth, roleCheck } = require('../middleware/auth')

const router = express.Router()

// Create booking (passenger only)
router.post('/', auth, roleCheck(['passenger']), async (req, res) => {
  try {
    const { rideId, numSeats } = req.body

    if (!rideId || !numSeats) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Check duplicate booking
    const existingBooking = await Booking.findOne({ ride: rideId, passenger: req.userId })
    if (existingBooking && existingBooking.status !== 'cancelled') {
      return res.status(400).json({ message: 'You already have a booking for this ride' })
    }

    const ride = await Ride.findById(rideId)
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' })
    }

    if (ride.status !== 'active') {
      return res.status(400).json({ message: 'Ride is no longer available' })
    }

    if (ride.availableSeats < numSeats) {
      return res.status(400).json({ message: 'Not enough available seats' })
    }

    const totalPrice = ride.pricePerSeat * numSeats

    const booking = new Booking({
      ride: rideId,
      passenger: req.userId,
      numSeats,
      totalPrice,
    })

    await booking.save()

    // Update ride available seats and booking count
    ride.availableSeats -= numSeats
    ride.bookings += 1
    await ride.save()

    res.status(201).json({ booking })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Get user bookings
router.get('/', auth, roleCheck(['passenger']), async (req, res) => {
  try {
    const { status } = req.query
    const filter = { passenger: req.userId }
    
    if (status) filter.status = status

    const bookings = await Booking.find(filter)
      .populate('ride')
      .populate('ride.driver', 'name phone rating')
      .sort({ createdAt: -1 })

    res.json({ bookings })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Cancel booking (passenger only)
router.patch('/:bookingId/cancel', auth, roleCheck(['passenger']), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate('ride')

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    if (booking.passenger.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking already cancelled' })
    }

    booking.status = 'cancelled'
    await booking.save()

    // Restore seats to ride
    const ride = await Ride.findById(booking.ride._id)
    ride.availableSeats += booking.numSeats
    ride.bookings -= 1
    await ride.save()

    res.json({ booking })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Rate driver (after ride completion)
router.post('/:bookingId/rate', auth, roleCheck(['passenger']), async (req, res) => {
  try {
    const { rating, review } = req.body

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Invalid rating' })
    }

    const booking = await Booking.findById(req.params.bookingId).populate('ride')

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    if (booking.passenger.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed rides' })
    }

    if (booking.rated) {
      return res.status(400).json({ message: 'You already rated this ride' })
    }

    booking.rated = true
    booking.rating = rating
    booking.review = review
    await booking.save()

    // Update driver rating
    const driver = await User.findById(booking.ride.driver)
    const totalRating = driver.rating * driver.ratingCount + rating
    driver.ratingCount += 1
    driver.rating = totalRating / driver.ratingCount
    await driver.save()

    res.json({ booking })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router

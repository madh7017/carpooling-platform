const express = require('express')
const Ride = require('../models/Ride')
const Booking = require('../models/Booking')
const User = require('../models/User')
const { auth, roleCheck } = require('../middleware/auth')

const router = express.Router()

// Create ride (driver only)
router.post('/', auth, roleCheck(['driver']), async (req, res) => {
  try {
    const { from, to, departureDate, departureTime, carModel, totalSeats, pricePerSeat, notes } = req.body

    if (!from || !to || !departureDate || !totalSeats || pricePerSeat === undefined) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const ride = new Ride({
      driver: req.userId,
      from,
      to,
      departureDate,
      departureTime,
      carModel,
      totalSeats,
      availableSeats: totalSeats,
      pricePerSeat,
      notes,
    })

    await ride.save()
    res.status(201).json({ ride })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Search rides with filtering
router.get('/search', auth, async (req, res) => {
  try {
    const { from, to, date, minPrice, maxPrice, minSeats, sort = 'date', page = 1, limit = 10 } = req.query

    const filter = { status: 'active' }
    
    if (from) filter.from = new RegExp(from, 'i')
    if (to) filter.to = new RegExp(to, 'i')
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      filter.departureDate = { $gte: startDate, $lt: endDate }
    }
    if (minPrice || maxPrice) {
      filter.pricePerSeat = {}
      if (minPrice) filter.pricePerSeat.$gte = parseFloat(minPrice)
      if (maxPrice) filter.pricePerSeat.$lte = parseFloat(maxPrice)
    }
    if (minSeats) {
      filter.availableSeats = { $gte: parseInt(minSeats) }
    }

    const sortObj = {}
    if (sort === 'price') sortObj.pricePerSeat = 1
    else if (sort === 'seats') sortObj.availableSeats = -1
    else sortObj.departureDate = 1

    const skip = (page - 1) * limit
    const rides = await Ride.find(filter)
      .populate('driver', 'name rating phone')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Ride.countDocuments(filter)

    res.json({ rides, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Get ride detail
router.get('/:rideId', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId).populate('driver', 'name rating phone')
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' })
    }

    res.json({ ride })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Mark ride as completed (driver only)
router.patch('/:rideId/complete', auth, roleCheck(['driver']), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' })
    }

    if (ride.driver.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    ride.status = 'completed'
    await ride.save()

    // Update booking statuses
    await Booking.updateMany({ ride: ride._id }, { status: 'completed' })

    res.json({ ride })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Cancel ride (driver only)
router.patch('/:rideId/cancel', auth, roleCheck(['driver']), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' })
    }

    if (ride.driver.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    ride.status = 'cancelled'
    await ride.save()

    // Cancel all bookings
    await Booking.updateMany({ ride: ride._id }, { status: 'cancelled' })

    res.json({ ride })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router

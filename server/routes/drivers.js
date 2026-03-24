const express = require('express')
const Ride = require('../models/Ride')
const Booking = require('../models/Booking')
const { auth, roleCheck } = require('../middleware/auth')

const router = express.Router()

// Get driver dashboard stats
router.get('/dashboard', auth, roleCheck(['driver']), async (req, res) => {
  try {
    const rides = await Ride.find({ driver: req.userId })

    const totalRides = rides.length
    const activeRides = rides.filter(r => r.status === 'active').length
    
    const totalBookings = rides.reduce((sum, ride) => sum + ride.bookings, 0)
    
    const totalEarnings = rides.reduce((sum, ride) => {
      const confirmedBookings = ride.bookings * ride.pricePerSeat
      return sum + confirmedBookings
    }, 0)

    const ridesWithDetails = await Ride.find({ driver: req.userId })
      .sort({ createdAt: -1 })
      .lean()
      .then(rides => rides.map(ride => ({
        ...ride,
        earnings: ride.bookings * ride.pricePerSeat
      })))

    res.json({
      stats: { totalRides, activeRides, totalBookings, totalEarnings },
      rides: ridesWithDetails,
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router

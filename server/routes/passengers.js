const express = require('express')
const Booking = require('../models/Booking')
const { auth, roleCheck } = require('../middleware/auth')

const router = express.Router()

// Get passenger dashboard stats
router.get('/dashboard', auth, roleCheck(['passenger']), async (req, res) => {
  try {
    const bookings = await Booking.find({ passenger: req.userId })

    const totalBookings = bookings.length
    const activeBookings = bookings.filter(b => b.status === 'confirmed').length
    const completedTrips = bookings.filter(b => b.status === 'completed').length

    const recentBookings = await Booking.find({ passenger: req.userId })
      .populate('ride')
      .populate('ride.driver', 'name rating')
      .sort({ createdAt: -1 })
      .limit(5)

    res.json({
      stats: { totalBookings, activeBookings, completedTrips },
      recentBookings,
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router

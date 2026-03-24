const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true,
  },
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  numSeats: {
    type: Number,
    required: true,
    min: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'completed', 'cancelled'],
    default: 'confirmed',
  },
  rated: {
    type: Boolean,
    default: false,
  },
  rating: Number,
  review: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Ensure no duplicate bookings
bookingSchema.index({ ride: 1, passenger: 1 }, { unique: true })

module.exports = mongoose.model('Booking', bookingSchema)

const mongoose = require('mongoose')

const rideSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  departureDate: {
    type: Date,
    required: true,
  },
  departureTime: String,
  carModel: String,
  totalSeats: {
    type: Number,
    required: true,
    min: 1,
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0,
  },
  pricePerSeat: {
    type: Number,
    required: true,
    min: 0,
  },
  notes: String,
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  },
  bookings: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Ride', rideSchema)

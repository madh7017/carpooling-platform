const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },

    // OPTIONAL — for future Google Maps integration
    lat: {
      type: Number,
      required: false,
    },

    lng: {
      type: Number,
      required: false,
    },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    source: {
      type: locationSchema,
      required: true,
    },

    destination: {
      type: locationSchema,
      required: true,
    },

    dateTime: {
      type: Date,
      required: true,
    },

    estimatedDurationMinutes: {
      type: Number,
      min: 0,
    },

    pricePerSeat: {
      type: Number,
      required: true,
      min: 0,
    },

    availableSeats: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "completed"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Indexes to improve search & sorting performance
rideSchema.index({ "source.address": 1 });
rideSchema.index({ "destination.address": 1 });
rideSchema.index({ dateTime: 1 });
rideSchema.index({ driver: 1 });
rideSchema.index({ status: 1 });

module.exports = mongoose.models.Ride || mongoose.model("Ride", rideSchema);


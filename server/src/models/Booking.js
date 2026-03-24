const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },

    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    seatsBooked: {
      type: Number,
      required: true,
    },

    passengerDetails: {
      phone: {
        type: String,
        trim: true,
      },
      emergencyContactName: {
        type: String,
        trim: true,
      },
      emergencyContactPhone: {
        type: String,
        trim: true,
      },
      note: {
        type: String,
        trim: true,
      },
    },

    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },

    lastCheckInAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["confirmed", "completed", "cancelled"],
      default: "confirmed",
    },

    // ⭐ Rating
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    ratingGiven: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ Prevent OverwriteModelError
module.exports =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

// Indexes
bookingSchema.index({ ride: 1 });
bookingSchema.index({ passenger: 1 });
bookingSchema.index({ status: 1 });

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    drivingLicenseNumber: {
      type: String,
      trim: true,
    },
    vehicleRegistrationNumber: {
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
    password: {
      type: String,
      required: true, // ✅ correct
    },
    role: {
      type: String,
      enum: ["passenger", "driver"],
      default: "passenger",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    ecoScore: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);

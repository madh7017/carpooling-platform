const mongoose = require("mongoose");

const supportRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["booking", "ride", "driver", "payment", "account", "safety", "other"],
      default: "other",
    },
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
    },
    adminViewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

supportRequestSchema.index({ user: 1, createdAt: -1 });
supportRequestSchema.index({ status: 1, createdAt: -1 });
supportRequestSchema.index({ ride: 1, createdAt: -1 });

module.exports =
  mongoose.models.SupportRequest || mongoose.model("SupportRequest", supportRequestSchema);

const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["driver", "passenger"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ booking: 1, createdAt: -1 });

module.exports = mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);

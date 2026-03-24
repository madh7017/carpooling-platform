const ChatMessage = require("../models/ChatMessage");
const Booking = require("../models/Booking");
const asyncHandler = require("../utils/asyncHandler");

const ensureParticipant = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId).populate("ride", "driver");
  if (!booking) return null;

  const isPassenger = booking.passenger.toString() === userId;
  const isDriver = booking.ride?.driver?.toString() === userId;
  if (!isPassenger && !isDriver) return null;

  return { booking, isPassenger, isDriver };
};

exports.getChatMessages = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const participant = await ensureParticipant(bookingId, req.user.id);
  if (!participant) return res.status(403).json({ message: "Not authorized" });

  const messages = await ChatMessage.find({ booking: bookingId })
    .sort({ createdAt: 1 })
    .limit(200);

  res.json({ messages });
});

exports.sendChatMessage = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Message is required" });
  }

  const participant = await ensureParticipant(bookingId, req.user.id);
  if (!participant) return res.status(403).json({ message: "Not authorized" });

  const senderRole = participant.isDriver ? "driver" : "passenger";
  const msg = await ChatMessage.create({
    booking: bookingId,
    sender: req.user.id,
    senderRole,
    message: message.trim(),
  });

  const stream = req.app.get("stream");
  if (stream) {
    const passengerId = participant.booking.passenger.toString();
    const driverId = participant.booking.ride.driver.toString();
    stream.sendToUsers([passengerId, driverId], "chat_message", {
      bookingId,
      message: {
        _id: msg._id.toString(),
        booking: bookingId,
        sender: req.user.id,
        senderRole,
        message: msg.message,
        createdAt: msg.createdAt,
      },
    });
  }

  res.status(201).json({ message: "Message sent", chat: msg });
});

const crypto = require("crypto");
const Booking = require("../models/Booking");
const asyncHandler = require("../utils/asyncHandler");

const getBookingForCall = async (bookingId) => {
  return Booking.findById(bookingId).populate({
    path: "ride",
    select: "driver status source destination",
  });
};

const getParticipants = (booking, userId) => {
  if (!booking || !booking.ride) return null;

  const passengerId = booking.passenger?.toString();
  const driverId = booking.ride.driver?.toString();

  if (!passengerId || !driverId) return null;

  if (userId === passengerId) {
    return {
      callerRole: "passenger",
      currentUserId: passengerId,
      otherUserId: driverId,
    };
  }

  if (userId === driverId) {
    return {
      callerRole: "driver",
      currentUserId: driverId,
      otherUserId: passengerId,
    };
  }

  return null;
};

const validateCallAccess = async (bookingId, userId) => {
  const booking = await getBookingForCall(bookingId);
  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  if (booking.status === "cancelled" || booking.ride?.status === "cancelled") {
    const error = new Error("Calling is unavailable for cancelled rides");
    error.statusCode = 400;
    throw error;
  }

  const participants = getParticipants(booking, userId);
  if (!participants) {
    const error = new Error("Not authorized for this call");
    error.statusCode = 403;
    throw error;
  }

  return { booking, participants };
};

const sendSignal = (req, recipientId, payload) => {
  const stream = req.app.get("stream");
  if (!stream || !recipientId) return;
  stream.sendToUser(recipientId, "call_signal", payload);
};

exports.startCall = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { offer, meta } = req.body;

  if (!offer) {
    return res.status(400).json({ message: "Offer is required" });
  }

  const { participants } = await validateCallAccess(bookingId, req.user.id);
  const callId = crypto.randomUUID();

  sendSignal(req, participants.otherUserId, {
    type: "incoming_call",
    callId,
    bookingId,
    fromUserId: participants.currentUserId,
    fromName: req.user.name,
    fromRole: participants.callerRole,
    offer,
    meta: {
      title: meta?.title || "App call",
      subtitle: meta?.subtitle || "",
    },
  });

  res.json({ callId });
});

exports.answerCall = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { answer, callId } = req.body;

  if (!answer || !callId) {
    return res.status(400).json({ message: "Answer and callId are required" });
  }

  const { participants } = await validateCallAccess(bookingId, req.user.id);

  sendSignal(req, participants.otherUserId, {
    type: "call_answer",
    callId,
    bookingId,
    fromUserId: participants.currentUserId,
    answer,
  });

  res.json({ message: "Call answered" });
});

exports.sendIceCandidate = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { candidate, callId } = req.body;

  if (!candidate || !callId) {
    return res.status(400).json({ message: "Candidate and callId are required" });
  }

  const { participants } = await validateCallAccess(bookingId, req.user.id);

  sendSignal(req, participants.otherUserId, {
    type: "ice_candidate",
    callId,
    bookingId,
    fromUserId: participants.currentUserId,
    candidate,
  });

  res.json({ message: "Candidate sent" });
});

exports.endCall = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { callId } = req.body;

  if (!callId) {
    return res.status(400).json({ message: "CallId is required" });
  }

  const { participants } = await validateCallAccess(bookingId, req.user.id);

  sendSignal(req, participants.otherUserId, {
    type: "call_ended",
    callId,
    bookingId,
    fromUserId: participants.currentUserId,
  });

  res.json({ message: "Call ended" });
});

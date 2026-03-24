const SupportRequest = require("../models/SupportRequest");
const User = require("../models/User");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const asyncHandler = require("../utils/asyncHandler");
const { getAdminEmails } = require("../utils/admin");

const formatSupportRequest = (request) => ({
  id: request._id.toString(),
  subject: request.subject,
  category: request.category,
  message: request.message,
  status: request.status,
  adminNote: request.adminNote || "",
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
  ride: request.ride
    ? {
        id: request.ride._id.toString(),
        from: request.ride.source?.address || "",
        to: request.ride.destination?.address || "",
        departureAt: request.ride.dateTime,
      }
    : null,
  user: request.user
    ? {
        id: request.user._id.toString(),
        name: request.user.name,
        email: request.user.email,
      }
    : null,
});

exports.createSupportRequest = asyncHandler(async (req, res) => {
  const { subject, category, message, rideId } = req.body;
  const categoryRequiresRide = ["ride", "driver", "safety"].includes(category);
  let selectedRide = null;

  if (rideId) {
    selectedRide = await Ride.findById(rideId);

    if (!selectedRide) {
      return res.status(404).json({ message: "Selected ride not found" });
    }

    const hasBooking = await Booking.exists({ ride: selectedRide._id, passenger: req.user.id });
    const isDriverRide = selectedRide.driver?.toString() === req.user.id;

    if (!hasBooking && !isDriverRide) {
      return res.status(403).json({ message: "You can only select your own booked or created ride" });
    }
  }

  if (categoryRequiresRide && !selectedRide) {
    return res.status(400).json({ message: "Please select a ride for this support category" });
  }

  const request = await SupportRequest.create({
    user: req.user.id,
    subject: String(subject || "").trim(),
    category,
    message: String(message || "").trim(),
    ride: selectedRide?._id || null,
  });

  const populated = await SupportRequest.findById(request._id)
    .populate("user", "name email")
    .populate("ride");

  const adminEmails = getAdminEmails();
  const adminUsers = await User.find({
    $or: [
      { isAdmin: true },
      ...(adminEmails.length ? [{ email: { $in: adminEmails } }] : []),
    ],
  }).select("_id");

  const adminIds = [...new Set(adminUsers.map((user) => user._id.toString()))];
  const stream = req.app.get("stream");
  if (stream && adminIds.length > 0) {
    stream.sendToUsers(adminIds, "support_request", {
      requestId: request._id.toString(),
      subject: request.subject,
      category: request.category,
      userId: req.user.id,
      userName: req.user.name,
    });
  }

  res.status(201).json({ request: formatSupportRequest(populated) });
});

exports.getMySupportRequests = asyncHandler(async (req, res) => {
  const requests = await SupportRequest.find({ user: req.user.id })
    .populate("user", "name email")
    .populate("ride")
    .sort({ createdAt: -1 });

  res.json({ requests: requests.map(formatSupportRequest) });
});

const User = require("../models/User");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const ChatMessage = require("../models/ChatMessage");
const SupportRequest = require("../models/SupportRequest");
const asyncHandler = require("../utils/asyncHandler");
const { isAdminUser } = require("../utils/admin");

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const formatUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  ecoScore: user.ecoScore || 0,
  rating: user.rating || 0,
  ratingCount: user.ratingCount || 0,
  isAdmin: isAdminUser(user),
  createdAt: user.createdAt,
});

exports.getAdminOverview = asyncHandler(async (req, res) => {
  const [users, rides, bookings, activeRides, activeBookings, openSupportRequests, unreadSupportRequests, adminUsers, averageFareAgg] = await Promise.all([
    User.countDocuments(),
    Ride.countDocuments(),
    Booking.countDocuments(),
    Ride.countDocuments({ status: "active" }),
    Booking.countDocuments({ status: "confirmed" }),
    SupportRequest.countDocuments({ status: { $ne: "resolved" } }),
    SupportRequest.countDocuments({ adminViewedAt: null }),
    User.countDocuments({ isAdmin: true }),
    Ride.aggregate([{ $group: { _id: null, averageFare: { $avg: "$pricePerSeat" } } }]),
  ]);

  const recentDateRanges = Array.from({ length: 7 }, (_, index) => {
    const current = new Date();
    current.setDate(current.getDate() - (6 - index));
    return {
      label: current.toLocaleDateString("en-IN", { weekday: "short" }),
      start: startOfDay(current),
      end: endOfDay(current),
    };
  });

  const [rideStatusAgg, bookingStatusAgg, recentRideAgg, recentBookingAgg] = await Promise.all([
    Ride.aggregate([{ $group: { _id: "$status", value: { $sum: 1 } } }]),
    Booking.aggregate([{ $group: { _id: "$status", value: { $sum: 1 } } }]),
    Promise.all(
      recentDateRanges.map((range) =>
        Ride.countDocuments({ createdAt: { $gte: range.start, $lte: range.end } })
      )
    ),
    Promise.all(
      recentDateRanges.map((range) =>
        Booking.countDocuments({ createdAt: { $gte: range.start, $lte: range.end } })
      )
    ),
  ]);

  const rideStatusCounts = Object.fromEntries(rideStatusAgg.map((item) => [item._id, item.value]));
  const bookingStatusCounts = Object.fromEntries(bookingStatusAgg.map((item) => [item._id, item.value]));

  res.json({
    stats: {
      users,
      rides,
      bookings,
      activeRides,
      activeBookings,
      openSupportRequests,
      unreadSupportRequests,
    },
    insights: {
      adminUsers,
      averageFare: Math.round(averageFareAgg?.[0]?.averageFare || 0),
      rideStatusCounts: {
        active: rideStatusCounts.active || 0,
        completed: rideStatusCounts.completed || 0,
        cancelled: rideStatusCounts.cancelled || 0,
      },
      bookingStatusCounts: {
        confirmed: bookingStatusCounts.confirmed || 0,
        completed: bookingStatusCounts.completed || 0,
        cancelled: bookingStatusCounts.cancelled || 0,
      },
      recentRides: recentDateRanges.map((range, index) => ({
        label: range.label,
        value: recentRideAgg[index] || 0,
      })),
      recentBookings: recentDateRanges.map((range, index) => ({
        label: range.label,
        value: recentBookingAgg[index] || 0,
      })),
    },
  });
});

exports.getAdminUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("name email phone ecoScore rating ratingCount isAdmin createdAt")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ users: users.map(formatUser) });
});

exports.getAdminRides = asyncHandler(async (req, res) => {
  const rides = await Ride.find()
    .populate("driver", "name email")
    .select("source destination status dateTime pricePerSeat availableSeats estimatedDurationMinutes createdAt driver")
    .sort({ createdAt: -1 });

  res.json({
    rides: rides.map((ride) => ({
      id: ride._id.toString(),
      from: ride.source?.address || "",
      to: ride.destination?.address || "",
      status: ride.status,
      departureAt: ride.dateTime,
      pricePerSeat: ride.pricePerSeat,
      availableSeats: ride.availableSeats,
      estimatedDurationMinutes: ride.estimatedDurationMinutes ?? null,
      driver: ride.driver
        ? {
            id: ride.driver._id.toString(),
            name: ride.driver.name,
            email: ride.driver.email,
          }
        : null,
      createdAt: ride.createdAt,
    })),
  });
});

exports.getAdminBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate("passenger", "name email")
    .populate({
      path: "ride",
      select: "source destination dateTime driver",
      populate: { path: "driver", select: "name email" },
    })
    .select("status seatsBooked passenger ride createdAt")
    .sort({ createdAt: -1 });

  res.json({
    bookings: bookings.map((booking) => ({
      id: booking._id.toString(),
      status: booking.status,
      seatsBooked: booking.seatsBooked,
      passenger: booking.passenger
        ? {
            id: booking.passenger._id.toString(),
            name: booking.passenger.name,
            email: booking.passenger.email,
          }
        : null,
      ride: booking.ride
        ? {
            id: booking.ride._id.toString(),
            from: booking.ride.source?.address || "",
            to: booking.ride.destination?.address || "",
            dateTime: booking.ride.dateTime,
            driver: booking.ride.driver
              ? {
                  id: booking.ride.driver._id.toString(),
                  name: booking.ride.driver.name,
                  email: booking.ride.driver.email,
                }
              : null,
          }
        : null,
      createdAt: booking.createdAt,
    })),
  });
});

exports.getAdminSupportRequests = asyncHandler(async (req, res) => {
  await SupportRequest.updateMany(
    { adminViewedAt: null },
    { adminViewedAt: new Date() }
  );

  const requests = await SupportRequest.find()
    .populate("user", "name email")
    .populate("ride")
    .select("subject category message status adminNote adminViewedAt createdAt updatedAt ride user")
    .sort({ createdAt: -1 });

  res.json({
    requests: requests.map((request) => ({
      id: request._id.toString(),
      subject: request.subject,
      category: request.category,
      message: request.message,
      status: request.status,
      adminNote: request.adminNote || "",
      adminViewedAt: request.adminViewedAt,
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
    })),
  });
});

exports.updateUserAdminStatus = asyncHandler(async (req, res) => {
  const { isAdmin } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isAdmin: Boolean(isAdmin) },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ message: "User updated", user: formatUser(user) });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own admin account" });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const rides = await Ride.find({ driver: user._id }).select("_id");
  const rideIds = rides.map((ride) => ride._id);

  const bookings = await Booking.find({
    $or: [{ passenger: user._id }, { ride: { $in: rideIds } }],
  }).select("_id");
  const bookingIds = bookings.map((booking) => booking._id);

  await Promise.all([
    ChatMessage.deleteMany({ booking: { $in: bookingIds } }),
    Booking.deleteMany({ _id: { $in: bookingIds } }),
    Ride.deleteMany({ _id: { $in: rideIds } }),
    User.deleteOne({ _id: user._id }),
  ]);

  res.json({ message: "User and related records deleted" });
});

exports.cancelRideAsAdmin = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.id);
  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  ride.status = "cancelled";
  await Promise.all([
    ride.save(),
    Booking.updateMany({ ride: ride._id, status: "confirmed" }, { status: "cancelled" }),
  ]);

  res.json({ message: "Ride cancelled by admin" });
});

exports.cancelBookingAsAdmin = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.status !== "cancelled") {
    await Promise.all([
      Booking.updateOne({ _id: booking._id }, { status: "cancelled" }),
      Ride.updateOne({ _id: booking.ride }, { $inc: { availableSeats: booking.seatsBooked } }),
    ]);
  }

  res.json({ message: "Booking cancelled by admin" });
});

exports.updateSupportRequestAsAdmin = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;

  const request = await SupportRequest.findByIdAndUpdate(
    req.params.id,
    {
      ...(status ? { status } : {}),
      ...(typeof adminNote === "string" ? { adminNote: adminNote.trim() } : {}),
    },
    { new: true }
  )
    .populate("user", "name email")
    .populate("ride");

  if (!request) {
    return res.status(404).json({ message: "Support request not found" });
  }

  res.json({
    message: "Support request updated",
    request: {
      id: request._id.toString(),
      subject: request.subject,
      category: request.category,
      message: request.message,
      status: request.status,
      adminNote: request.adminNote || "",
      adminViewedAt: request.adminViewedAt,
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
    },
  });
});

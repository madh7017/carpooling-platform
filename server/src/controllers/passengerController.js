const Booking = require("../models/Booking");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

exports.getPassengerDashboard = asyncHandler(async (req, res) => {
  const passenger = await User.findById(req.user.id).select("ecoScore");
  const bookings = await Booking.find({ passenger: req.user.id })
    .populate({
      path: "ride",
      populate: { path: "driver", select: "name rating" },
    })
    .sort({ createdAt: -1 });

  const recentBookings = bookings.slice(0, 5).map((booking) => {
    const ride = booking.ride || {};
    const dateObj = ride.dateTime ? new Date(ride.dateTime) : null;

    return {
      _id: booking._id,
      status: booking.status,
      numSeats: booking.seatsBooked,
      totalPrice: booking.seatsBooked * (ride.pricePerSeat || 0),
      ride: {
        _id: ride._id,
        from: ride.source?.address || "",
        to: ride.destination?.address || "",
        departureDate: dateObj ? dateObj.toISOString().split("T")[0] : null,
      },
    };
  });

  res.json({
    stats: {
      totalBookings: bookings.length,
      activeBookings: bookings.filter((booking) => booking.status === "confirmed").length,
      completedTrips: bookings.filter((booking) => booking.status === "completed").length,
      ecoScore: passenger?.ecoScore || 0,
    },
    recentBookings,
  });
});

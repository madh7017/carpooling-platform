const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

exports.getDriverEarnings = asyncHandler(async (req, res) => {
  const rides = await Ride.find({
    driver: req.user.id,
    status: "completed",
  });

  let totalEarnings = 0;
  let completedRides = rides.length;

  for (const ride of rides) {
    const bookings = await Booking.find({
      ride: ride._id,
      status: "completed",
    });

    bookings.forEach((b) => {
      totalEarnings += b.seatsBooked * (ride.pricePerSeat || 0);
    });
  }

  res.json({
    totalEarnings,
    completedRides,
  });
});

exports.getDriverDashboard = asyncHandler(async (req, res) => {
  const driver = await User.findById(req.user.id).select("ecoScore");
  const rides = await Ride.find({ driver: req.user.id }).sort({ dateTime: -1 });
  const rideIds = rides.map((ride) => ride._id);

  const bookingAgg = await Booking.aggregate([
    { $match: { ride: { $in: rideIds }, status: { $in: ["confirmed", "completed"] } } },
    {
      $group: {
        _id: "$ride",
        bookings: { $sum: 1 },
        seatsBooked: { $sum: "$seatsBooked" },
        completedSeats: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, "$seatsBooked", 0],
          },
        },
      },
    },
  ]);
  const bookingStatsByRideId = new Map(
    bookingAgg.map((item) => [
      item._id.toString(),
      { bookings: item.bookings, seatsBooked: item.seatsBooked, completedSeats: item.completedSeats },
    ])
  );

  const formattedRides = rides.map((ride) => {
    const stats = bookingStatsByRideId.get(ride._id.toString()) || { bookings: 0, seatsBooked: 0, completedSeats: 0 };
    const totalSeats = ride.availableSeats + stats.seatsBooked;
    const dateObj = new Date(ride.dateTime);
    const rideEarnings = ride.status === "completed" ? stats.completedSeats * ride.pricePerSeat : 0;

    return {
      _id: ride._id,
      from: ride.source?.address || "",
      to: ride.destination?.address || "",
      departureDate: dateObj.toISOString().split("T")[0],
      departureTime: dateObj.toTimeString().slice(0, 5),
      status: ride.status,
      availableSeats: ride.availableSeats,
      totalSeats,
      estimatedDurationMinutes: ride.estimatedDurationMinutes ?? null,
      bookings: stats.bookings,
      pricePerSeat: ride.pricePerSeat,
      earnings: rideEarnings,
      carModel: "N/A",
    };
  });

  const totalBookings = bookingAgg.reduce((sum, item) => sum + item.bookings, 0);
  const totalEarnings = formattedRides.reduce((sum, ride) => sum + ride.earnings, 0);

  res.json({
    stats: {
      totalRides: rides.length,
      activeRides: rides.filter((ride) => ride.status === "active").length,
      totalBookings,
      totalEarnings,
      ecoScore: driver?.ecoScore || 0,
    },
    rides: formattedRides,
  });
});

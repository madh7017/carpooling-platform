const crypto = require("crypto");
const Booking = require("../models/Booking");
const Ride = require("../models/Ride");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const formatBookingForClient = (booking) => {
  const ride = booking.ride || {};
  const dateObj = ride.dateTime ? new Date(ride.dateTime) : null;
  const seatCount = booking.seatsBooked || 0;
  const pricePerSeat = ride.pricePerSeat || 0;

  return {
    ...booking.toObject(),
    numSeats: seatCount,
    totalPrice: seatCount * pricePerSeat,
    rated: booking.ratingGiven,
    ride: {
      ...(ride.toObject ? ride.toObject() : ride),
      from: ride.source?.address || "",
      to: ride.destination?.address || "",
      departureDate: dateObj ? dateObj.toISOString().split("T")[0] : null,
      departureTime: dateObj ? dateObj.toTimeString().slice(0, 5) : null,
    },
  };
};

// ============================
// Passenger creates booking
// ============================
exports.createBooking = asyncHandler(async (req, res) => {
  const { rideId, seatsBooked, numSeats, passengerDetails } = req.body;
  const normalizedSeats = Number(seatsBooked ?? numSeats);
  const normalizedPassengerDetails = {
    phone: passengerDetails?.phone?.trim(),
    emergencyContactName: passengerDetails?.emergencyContactName?.trim(),
    emergencyContactPhone: passengerDetails?.emergencyContactPhone?.trim(),
    note: passengerDetails?.note?.trim() || "",
  };

  if (!rideId || !Number.isInteger(normalizedSeats) || normalizedSeats < 1) {
    return res.status(400).json({ message: "Invalid booking data" });
  }

  if (
    !normalizedPassengerDetails.phone ||
    !normalizedPassengerDetails.emergencyContactName ||
    !normalizedPassengerDetails.emergencyContactPhone
  ) {
    return res.status(400).json({ message: "Passenger safety details are required" });
  }

  // Prevent duplicate confirmed booking by the same passenger
  const existingBooking = await Booking.findOne({
    ride: rideId,
    passenger: req.user.id,
    status: "confirmed",
  });

  if (existingBooking) {
    return res.status(400).json({ message: "You already booked this ride" });
  }

  // Atomically decrement availableSeats if enough seats exist and ride is active
  const ride = await Ride.findOneAndUpdate(
    { _id: rideId, status: "active", availableSeats: { $gte: normalizedSeats } },
    { $inc: { availableSeats: -normalizedSeats } },
    { new: true }
  );

  if (!ride) {
    return res.status(400).json({ message: "Ride not available or not enough seats" });
  }

  if (ride.driver.toString() === req.user.id) {
    await Ride.findByIdAndUpdate(rideId, { $inc: { availableSeats: normalizedSeats } });
    return res.status(400).json({ message: "You cannot book your own ride" });
  }

  // Create booking; if creation fails, revert seat decrement
  let booking;
  try {
    const shareToken = crypto.randomUUID();
    booking = await Booking.create({
      ride: ride._id,
      passenger: req.user.id,
      seatsBooked: normalizedSeats,
      passengerDetails: normalizedPassengerDetails,
      shareToken,
      lastCheckInAt: new Date(),
      status: "confirmed",
    });
  } catch (err) {
    // revert seat decrement
    await Ride.findByIdAndUpdate(rideId, { $inc: { availableSeats: normalizedSeats } });
    throw err;
  }

  res.status(201).json({ message: "Booking successful", booking });

  const stream = req.app.get("stream");
  if (stream) {
    stream.sendToUsers([req.user.id.toString(), ride.driver.toString()], "booking_created", {
      bookingId: booking._id.toString(),
      rideId: ride._id.toString(),
      status: booking.status,
      passengerId: req.user.id.toString(),
      driverId: ride.driver.toString(),
    });
  }
});

// ============================
// Passenger cancels booking
// ============================
exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.passenger.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });
  if (booking.status === "cancelled") return res.status(400).json({ message: "Already cancelled" });

  // Atomically increment ride availableSeats and mark booking cancelled
  await Promise.all([
    // restore seats
    Ride.findByIdAndUpdate(booking.ride, { $inc: { availableSeats: booking.seatsBooked } }),
    // update booking status
    Booking.findByIdAndUpdate(booking._id, { status: "cancelled" }),
  ]);

  const ride = await Ride.findById(booking.ride).select("driver");
  const stream = req.app.get("stream");
  if (stream) {
    stream.sendToUsers([booking.passenger.toString(), ride?.driver?.toString()].filter(Boolean), "booking_cancelled", {
      bookingId: booking._id.toString(),
      rideId: booking.ride.toString(),
      passengerId: booking.passenger.toString(),
      driverId: ride?.driver?.toString(),
    });
  }

  res.json({ message: "Booking cancelled successfully" });
});

// ============================
// Passenger – My Bookings
// ============================
exports.getMyBookings = asyncHandler(async (req, res) => {
  const query = { passenger: req.user.id };
  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  const bookings = await Booking.find(query)
    .populate({
      path: "ride",
      populate: { path: "driver", select: "name rating phone" },
    })
    .sort({ createdAt: -1 });

  res.json(bookings);
});

exports.getMyBookingsForClient = asyncHandler(async (req, res) => {
  const query = { passenger: req.user.id };
  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  const bookings = await Booking.find(query)
    .populate({
      path: "ride",
      populate: { path: "driver", select: "name rating phone" },
    })
    .sort({ createdAt: -1 });

  res.json({ bookings: bookings.map(formatBookingForClient) });
});

exports.checkInBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.passenger.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });
  if (booking.status !== "confirmed") {
    return res.status(400).json({ message: "Check-in is only available for active bookings" });
  }

  booking.lastCheckInAt = new Date();
  await booking.save();

  const ride = await Ride.findById(booking.ride).select("driver");
  const stream = req.app.get("stream");
  if (stream) {
    stream.sendToUsers([booking.passenger.toString(), ride?.driver?.toString()].filter(Boolean), "checkin_update", {
      bookingId: booking._id.toString(),
      lastCheckInAt: booking.lastCheckInAt,
      passengerId: booking.passenger.toString(),
      driverId: ride?.driver?.toString(),
    });
  }

  res.json({ message: "Check-in recorded", lastCheckInAt: booking.lastCheckInAt });
});

exports.getShareByToken = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ shareToken: req.params.token })
    .populate({
      path: "ride",
      populate: { path: "driver", select: "name rating" },
    })
    .populate("passenger", "name");

  if (!booking) return res.status(404).json({ message: "Share link not found" });

  res.json({
    booking: formatBookingForClient(booking),
    passenger: booking.passenger,
  });
});

// ============================
// Driver – View passengers
// ============================
exports.getBookingsByRide = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.rideId).select("driver");
  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  if (ride.driver.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const bookings = await Booking.find({ ride: req.params.rideId, status: "confirmed" })
    .populate("passenger", "name email rating")
    .sort({ createdAt: -1 });

  res.json(bookings);
});

// ============================
// Driver – Rate passenger
// ============================
exports.ratePassenger = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { rating } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const booking = await Booking.findById(bookingId)
    .populate("ride")
    .populate("passenger");

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  // Only driver can rate
  if (booking.ride.driver.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  if (booking.ride.status !== "completed") {
    return res.status(400).json({ message: "Ride not completed yet" });
  }

  if (booking.ratingGiven) {
    return res.status(400).json({ message: "Already rated" });
  }

  const passenger = booking.passenger;

  const total =
    passenger.rating * passenger.ratingCount + rating;

  passenger.ratingCount += 1;
  passenger.rating = total / passenger.ratingCount;

  await passenger.save();

  booking.rating = rating;
  booking.ratingGiven = true;
  await booking.save();

  res.json({ message: "Passenger rated successfully" });
});

exports.rateDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const booking = await Booking.findById(id).populate("ride").populate("passenger");

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.passenger._id.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  if (booking.status !== "completed") {
    return res.status(400).json({ message: "Ride not completed yet" });
  }

  if (booking.ratingGiven) {
    return res.status(400).json({ message: "Already rated" });
  }

  const driver = await User.findById(booking.ride.driver);
  if (!driver) {
    return res.status(404).json({ message: "Driver not found" });
  }

  const total = driver.rating * driver.ratingCount + rating;
  driver.ratingCount += 1;
  driver.rating = total / driver.ratingCount;
  await driver.save();

  booking.rating = rating;
  booking.ratingGiven = true;
  await booking.save();

  res.json({ message: "Driver rated successfully" });
});

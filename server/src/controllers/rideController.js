const Ride = require("../models/Ride");
const asyncHandler = require("../utils/asyncHandler");
const Booking = require("../models/Booking");
const User = require("../models/User");

const ECO_POINTS_PER_SEAT_PASSENGER = 5;
const ECO_POINTS_PER_SEAT_DRIVER = 3;
const DEFAULT_GEOCODER_HEADERS = {
  "User-Agent": "CarPoolIndia/1.0 (ride-duration-estimator)",
  Accept: "application/json",
};

const geocodeAddress = async (address) => {
  if (!address) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, { headers: DEFAULT_GEOCODER_HEADERS });
  if (!response.ok) return null;

  const results = await response.json();
  const match = results?.[0];
  if (!match) return null;

  return {
    lat: Number(match.lat),
    lng: Number(match.lon),
  };
};

const getEstimatedDurationMinutes = async (sourceCoords, destinationCoords) => {
  if (!sourceCoords || !destinationCoords) return null;

  const { lat: sourceLat, lng: sourceLng } = sourceCoords;
  const { lat: destinationLat, lng: destinationLng } = destinationCoords;

  if (
    [sourceLat, sourceLng, destinationLat, destinationLng].some((value) => Number.isNaN(Number(value)))
  ) {
    return null;
  }

  const routeUrl = `https://router.project-osrm.org/route/v1/driving/${sourceLng},${sourceLat};${destinationLng},${destinationLat}?overview=false`;
  const response = await fetch(routeUrl, { headers: { "User-Agent": DEFAULT_GEOCODER_HEADERS["User-Agent"] } });
  if (!response.ok) return null;

  const data = await response.json();
  const durationSeconds = data?.routes?.[0]?.duration;
  if (!durationSeconds) return null;

  return Math.max(1, Math.round(durationSeconds / 60));
};

const getCompletionUnlockTime = (ride) => {
  const startTime = new Date(ride.dateTime);
  if (Number.isNaN(startTime.getTime())) return null;

  const estimatedDurationMinutes = Number(ride.estimatedDurationMinutes || 0);
  const unlockOffsetMinutes =
    estimatedDurationMinutes > 0 ? Math.max(1, Math.ceil(estimatedDurationMinutes * 0.1)) : 0;

  return new Date(startTime.getTime() + unlockOffsetMinutes * 60 * 1000);
};

const formatRideForClient = (ride, totalSeatsOverride) => {
  const dateObj = new Date(ride.dateTime);
  const totalSeats =
    typeof totalSeatsOverride === "number"
      ? totalSeatsOverride
      : ride.availableSeats;

  return {
    ...ride.toObject(),
    from: ride.source?.address || "",
    to: ride.destination?.address || "",
    departureDate: dateObj.toISOString().split("T")[0],
    departureTime: dateObj.toTimeString().slice(0, 5),
    totalSeats,
    estimatedDurationMinutes: ride.estimatedDurationMinutes ?? null,
  };
};

exports.createRide = asyncHandler(async (req, res) => {
  const {
    source,
    destination,
    dateTime,
    pricePerSeat,
    availableSeats,
    from,
    to,
    departureDate,
    departureTime,
    totalSeats,
    drivingLicenseNumber,
    vehicleRegistrationNumber,
    emergencyContactName,
    emergencyContactPhone,
  } = req.body;

  const normalizedSource = source?.address || from;
  const normalizedDestination = destination?.address || to;
  const normalizedDateTime =
    dateTime || (departureDate && departureTime ? new Date(`${departureDate}T${departureTime}`) : null);
  const normalizedAvailableSeats =
    availableSeats != null ? Number(availableSeats) : totalSeats != null ? Number(totalSeats) : null;

  if (
    !normalizedSource ||
    !normalizedDestination ||
    !normalizedDateTime ||
    pricePerSeat == null ||
    normalizedAvailableSeats == null ||
    !drivingLicenseNumber ||
    !vehicleRegistrationNumber ||
    !emergencyContactName ||
    !emergencyContactPhone
  ) {
    const error = new Error("Missing required ride fields");
    error.statusCode = 400;
    throw error;
  }

  if (normalizedSource.trim().toLowerCase() === normalizedDestination.trim().toLowerCase()) {
    const error = new Error("Source and destination must be different");
    error.statusCode = 400;
    throw error;
  }

  if (Number.isNaN(new Date(normalizedDateTime).getTime()) || new Date(normalizedDateTime) < new Date()) {
    const error = new Error("Ride date/time must be in the future");
    error.statusCode = 400;
    throw error;
  }

  if (normalizedAvailableSeats < 1) {
    const error = new Error("Available seats must be at least 1");
    error.statusCode = 400;
    throw error;
  }

  await User.findByIdAndUpdate(req.user.id, {
    drivingLicenseNumber: String(drivingLicenseNumber).trim().toUpperCase(),
    vehicleRegistrationNumber: String(vehicleRegistrationNumber).trim().toUpperCase(),
    emergencyContactName: String(emergencyContactName).trim(),
    emergencyContactPhone: String(emergencyContactPhone).trim(),
  });

  let sourceLocation = { address: normalizedSource };
  let destinationLocation = { address: normalizedDestination };
  let estimatedDurationMinutes = null;

  try {
    const [sourceCoords, destinationCoords] = await Promise.all([
      geocodeAddress(normalizedSource),
      geocodeAddress(normalizedDestination),
    ]);

    if (sourceCoords) {
      sourceLocation = { ...sourceLocation, ...sourceCoords };
    }
    if (destinationCoords) {
      destinationLocation = { ...destinationLocation, ...destinationCoords };
    }

    estimatedDurationMinutes = await getEstimatedDurationMinutes(sourceCoords, destinationCoords);
  } catch (error) {
    estimatedDurationMinutes = null;
  }

  const ride = await Ride.create({
    driver: req.user.id,
    source: sourceLocation,
    destination: destinationLocation,
    dateTime: normalizedDateTime,
    estimatedDurationMinutes,
    pricePerSeat,
    availableSeats: normalizedAvailableSeats,
  });

  res.status(201).json(formatRideForClient(ride, normalizedAvailableSeats));
});

exports.getRides = asyncHandler(async (req, res) => {
  const { from, to, date, sortBy, sort: querySort, page = 1, limit = 5, minPrice, maxPrice, minSeats } = req.query;

  const query = { status: "active" };

  if (from) query["source.address"] = { $regex: from, $options: "i" };
  if (to) query["destination.address"] = { $regex: to, $options: "i" };
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.dateTime = { $gte: start, $lte: end };
    // If the requested date is today, hide already-expired rides.
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    if (start <= todayEnd && end >= todayStart) {
      query.dateTime.$gte = now;
    }
  } else {
    // Default: hide expired rides
    query.dateTime = { $gte: new Date() };
  }
  if (minPrice != null || maxPrice != null) {
    query.pricePerSeat = {};
    if (minPrice != null && minPrice !== "") query.pricePerSeat.$gte = Number(minPrice);
    if (maxPrice != null && maxPrice !== "") query.pricePerSeat.$lte = Number(maxPrice);
  }
  if (minSeats != null && minSeats !== "") {
    query.availableSeats = { $gte: Number(minSeats) };
  }

  let sortConfig = { dateTime: 1 };
  const sortField = sortBy || querySort;
  if (sortField === "price") sortConfig = { pricePerSeat: 1 };
  if (sortField === "seats") sortConfig = { availableSeats: -1 };

  const skip = (page - 1) * limit;

  const [rides, total] = await Promise.all([
    Ride.find(query)
      .populate("driver", "name rating drivingLicenseNumber vehicleRegistrationNumber")
      .sort(sortConfig)
      .skip(skip)
      .limit(Number(limit)),
    Ride.countDocuments(query),
  ]);

  const rideIds = rides.map((ride) => ride._id);
  const seatAgg = await Booking.aggregate([
    { $match: { ride: { $in: rideIds }, status: { $in: ["confirmed", "completed"] } } },
    { $group: { _id: "$ride", bookedSeats: { $sum: "$seatsBooked" } } },
  ]);
  const bookedSeatsByRideId = new Map(seatAgg.map((item) => [item._id.toString(), item.bookedSeats]));

  const formattedRides = rides.map((ride) => {
    const bookedSeats = bookedSeatsByRideId.get(ride._id.toString()) || 0;
    const totalSeats = ride.availableSeats + bookedSeats;
    return formatRideForClient(ride, totalSeats);
  });

  res.json({
    rides: formattedRides,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  });
});

exports.getRideById = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.id).populate(
    "driver",
    "name rating drivingLicenseNumber vehicleRegistrationNumber"
  );
  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  const seatAgg = await Booking.aggregate([
    { $match: { ride: ride._id, status: { $in: ["confirmed", "completed"] } } },
    { $group: { _id: "$ride", bookedSeats: { $sum: "$seatsBooked" } } },
  ]);
  const bookedSeats = seatAgg[0]?.bookedSeats || 0;
  const totalSeats = ride.availableSeats + bookedSeats;

  res.json({ ride: formatRideForClient(ride, totalSeats) });
});

exports.completeRide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ride = await Ride.findById(id);
  if (!ride) {
    const err = new Error("Ride not found");
    err.statusCode = 404;
    throw err;
  }

  if (ride.driver.toString() !== req.user.id) {
    const err = new Error("Not authorized to complete this ride");
    err.statusCode = 403;
    throw err;
  }

  if (ride.status !== "active") {
    const err = new Error("Ride is not active");
    err.statusCode = 400;
    throw err;
  }

  const unlockAt = getCompletionUnlockTime(ride);
  if (unlockAt && unlockAt > new Date()) {
    const err = new Error(
      `Ride can be completed only after ${unlockAt.toLocaleDateString("en-IN")} ${unlockAt.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`
    );
    err.statusCode = 400;
    throw err;
  }

  const confirmedBookings = await Booking.find({ ride: ride._id, status: "confirmed" });

  ride.status = "completed";
  await Promise.all([
    ride.save(),
    Booking.updateMany({ ride: ride._id, status: "confirmed" }, { status: "completed" }),
  ]);

  if (confirmedBookings.length > 0) {
    const driverEcoPoints = confirmedBookings.reduce(
      (sum, booking) => sum + booking.seatsBooked * ECO_POINTS_PER_SEAT_DRIVER,
      0
    );

    await User.updateOne({ _id: ride.driver }, { $inc: { ecoScore: driverEcoPoints } });

    const passengerUpdates = confirmedBookings.map((booking) => ({
      updateOne: {
        filter: { _id: booking.passenger },
        update: { $inc: { ecoScore: booking.seatsBooked * ECO_POINTS_PER_SEAT_PASSENGER } },
      },
    }));

    await User.bulkWrite(passengerUpdates);
  }

  const stream = req.app.get("stream");
  if (stream) {
    const passengerIds = confirmedBookings.map((booking) => booking.passenger.toString());
    stream.sendToUsers([ride.driver.toString(), ...passengerIds], "ride_update", {
      rideId: ride._id.toString(),
      status: "completed",
      driverId: ride.driver.toString(),
    });
  }

  res.json({ message: "Ride marked as completed" });
});

exports.cancelRide = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.id);
  if (!ride) {
    const error = new Error("Ride not found");
    error.statusCode = 404;
    throw error;
  }

  if (ride.driver.toString() !== req.user.id) {
    const error = new Error("Not authorized to cancel this ride");
    error.statusCode = 403;
    throw error;
  }

  ride.status = "cancelled";
  await ride.save();

  await Booking.updateMany({ ride: ride._id, status: "confirmed" }, { status: "cancelled" });

  const stream = req.app.get("stream");
  if (stream) {
    const bookings = await Booking.find({ ride: ride._id }).select("passenger");
    const passengerIds = bookings.map((booking) => booking.passenger.toString());
    stream.sendToUsers([ride.driver.toString(), ...passengerIds], "ride_update", {
      rideId: ride._id.toString(),
      status: "cancelled",
      driverId: ride.driver.toString(),
    });
  }

  res.json({ message: "Ride cancelled and all bookings updated" });
});

exports.getMyRides = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ driver: req.user.id }).sort({ createdAt: -1 });
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
    const stats = bookingStatsByRideId.get(ride._id.toString()) || {
      bookings: 0,
      seatsBooked: 0,
      completedSeats: 0,
    };
    const totalSeats = ride.availableSeats + stats.seatsBooked;

    return {
      ...formatRideForClient(ride, totalSeats),
      bookings: stats.bookings,
      earnings: ride.status === "completed" ? stats.completedSeats * ride.pricePerSeat : 0,
    };
  });

  res.json(formattedRides);
});

exports.getDriverStats = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ driver: req.user.id });
  const rideIds = rides.map((r) => r._id);

  const bookings = await Booking.find({ ride: { $in: rideIds }, status: "confirmed" }).populate("ride");

  const totalEarnings = bookings.reduce((sum, b) => sum + b.seatsBooked * b.ride.pricePerSeat, 0);

  res.json({
    totalRides: rides.length,
    totalBookings: bookings.length,
    totalEarnings,
  });
});

exports.getDriverEarnings = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ driver: req.user.id });
  const rideIds = rides.map((r) => r._id);

  const bookings = await Booking.find({ ride: { $in: rideIds }, status: "confirmed" }).populate("ride");

  const earningsByRide = {};

  bookings.forEach((b) => {
    const rideId = b.ride._id.toString();
    if (!earningsByRide[rideId]) {
      earningsByRide[rideId] = {
        rideId,
        from: b.ride.source.address,
        to: b.ride.destination.address,
        dateTime: b.ride.dateTime,
        pricePerSeat: b.ride.pricePerSeat,
        seatsBooked: 0,
        earnings: 0,
        status: b.ride.status,
      };
    }

    earningsByRide[rideId].seatsBooked += b.seatsBooked;
    earningsByRide[rideId].earnings += b.seatsBooked * b.ride.pricePerSeat;
  });

  res.json(Object.values(earningsByRide));
});
 

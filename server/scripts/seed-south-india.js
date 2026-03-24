#!/usr/bin/env node
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const crypto = require("crypto");
const User = require("../src/models/User");
const Ride = require("../src/models/Ride");
const Booking = require("../src/models/Booking");
const ChatMessage = require("../src/models/ChatMessage");
const { hashPassword } = require("../src/utils/password");

const SEED_DOMAIN = "southcarpool.test";

const driversSeed = [
  { name: "Arjun Reddy", email: `arjun@${SEED_DOMAIN}`, rating: 4.7, ratingCount: 38 },
  { name: "Priya Nair", email: `priya@${SEED_DOMAIN}`, rating: 4.8, ratingCount: 42 },
  { name: "Ravi Kumar", email: `ravi@${SEED_DOMAIN}`, rating: 4.5, ratingCount: 25 },
  { name: "Sneha Iyer", email: `sneha@${SEED_DOMAIN}`, rating: 4.9, ratingCount: 51 },
  { name: "Karthik M", email: `karthik@${SEED_DOMAIN}`, rating: 4.6, ratingCount: 29 },
  { name: "Meera Joseph", email: `meera@${SEED_DOMAIN}`, rating: 4.7, ratingCount: 33 },
];

const passengersSeed = [
  { name: "Vikram S", email: `vikram@${SEED_DOMAIN}` },
  { name: "Lakshmi P", email: `lakshmi@${SEED_DOMAIN}` },
  { name: "Deepak Rao", email: `deepak@${SEED_DOMAIN}` },
  { name: "Ananya Das", email: `ananya@${SEED_DOMAIN}` },
  { name: "Gopi N", email: `gopi@${SEED_DOMAIN}` },
  { name: "Harini V", email: `harini@${SEED_DOMAIN}` },
  { name: "Pranav C", email: `pranav@${SEED_DOMAIN}` },
  { name: "Divya R", email: `divya@${SEED_DOMAIN}` },
  { name: "Manoj T", email: `manoj@${SEED_DOMAIN}` },
  { name: "Asha K", email: `asha@${SEED_DOMAIN}` },
];

const routePool = [
  ["Bengaluru", "Mysuru"],
  ["Bengaluru", "Chennai"],
  ["Chennai", "Coimbatore"],
  ["Hyderabad", "Vijayawada"],
  ["Hyderabad", "Tirupati"],
  ["Kochi", "Thiruvananthapuram"],
  ["Mangaluru", "Udupi"],
  ["Madurai", "Coimbatore"],
  ["Vijayawada", "Visakhapatnam"],
  ["Bengaluru", "Mangaluru"],
  ["Chennai", "Puducherry"],
  ["Coimbatore", "Kochi"],
  ["Hyderabad", "Warangal"],
  ["Mysuru", "Ooty"],
  ["Thiruvananthapuram", "Kochi"],
  ["Visakhapatnam", "Rajahmundry"],
];

const cityCoords = {
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Mysuru: { lat: 12.2958, lng: 76.6394 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Vijayawada: { lat: 16.5062, lng: 80.648 },
  Tirupati: { lat: 13.6288, lng: 79.4192 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  Mangaluru: { lat: 12.9141, lng: 74.856 },
  Udupi: { lat: 13.3409, lng: 74.7421 },
  Madurai: { lat: 9.9252, lng: 78.1198 },
  Visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  Puducherry: { lat: 11.9416, lng: 79.8083 },
  Warangal: { lat: 17.9689, lng: 79.5941 },
  Ooty: { lat: 11.4064, lng: 76.6932 },
  Rajahmundry: { lat: 16.9891, lng: 81.7787 },
};

const now = new Date();
const mkDate = (offsetDays, hour) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, hour, 0, 0, 0);

const rideBlueprints = [];
const hours = [6, 8, 12, 18];
for (let day = 0; day < 30; day += 1) {
  for (let slot = 0; slot < 3; slot += 1) {
    const routeIndex = (day * 3 + slot) % routePool.length;
    const hour = hours[(day + slot) % hours.length];
    let status = "active";
    if (day < 3) status = "completed";
    if (day === 3 && slot === 1) status = "cancelled";
    rideBlueprints.push({
      route: routeIndex,
      status,
      offset: day + 1,
      hour,
      totalSeats: 4 + ((day + slot) % 3),
      pricePerSeat: 180 + ((day + slot) % 6) * 40,
    });
  }
}

function getBookingPattern(status) {
  if (status === "active") {
    return [
      { seats: 1, status: "confirmed" },
      { seats: 1, status: "confirmed" },
      { seats: 1, status: "cancelled" },
    ];
  }
  if (status === "completed") {
    return [
      { seats: 1, status: "completed" },
      { seats: 1, status: "completed" },
      { seats: 1, status: "cancelled" },
    ];
  }
  return [
    { seats: 1, status: "cancelled" },
    { seats: 1, status: "cancelled" },
  ];
}

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const seedUsers = await User.find({ email: { $regex: `@${SEED_DOMAIN}$`, $options: "i" } }).select("_id");
  const seedUserIds = seedUsers.map((u) => u._id);
  const seedRides = await Ride.find({ driver: { $in: seedUserIds } }).select("_id");
  const seedRideIds = seedRides.map((r) => r._id);
  const seedBookings = await Booking.find({ ride: { $in: seedRideIds } }).select("_id");
  const seedBookingIds = seedBookings.map((b) => b._id);

  await ChatMessage.deleteMany({ booking: { $in: seedBookingIds } });
  await Booking.deleteMany({
    $or: [{ ride: { $in: seedRideIds } }, { passenger: { $in: seedUserIds } }],
  });
  await Ride.deleteMany({ _id: { $in: seedRideIds } });
  await User.deleteMany({ _id: { $in: seedUserIds } });
  console.log("Removed previous seeded records");

  const defaultPasswordHash = await hashPassword("Pass@123");

  const drivers = await User.insertMany(
    driversSeed.map((d) => ({
      ...d,
      role: "driver",
      ecoScore: 50 + Math.floor(Math.random() * 150),
      password: defaultPasswordHash,
    }))
  );
  const passengers = await User.insertMany(
    passengersSeed.map((p) => ({
      ...p,
      role: "passenger",
      rating: 0,
      ratingCount: 0,
      ecoScore: 20 + Math.floor(Math.random() * 80),
      password: defaultPasswordHash,
    }))
  );

  const bookingsToInsert = [];
  const ridesToInsert = [];

  for (let i = 0; i < rideBlueprints.length; i += 1) {
    const spec = rideBlueprints[i];
    const [sourceCity, destinationCity] = routePool[spec.route];
    const pattern = getBookingPattern(spec.status);
    const usedSeats = pattern
      .filter((p) => p.status === "confirmed" || p.status === "completed")
      .reduce((sum, p) => sum + p.seats, 0);

    const ride = {
      driver: drivers[i % drivers.length]._id,
      source: { address: sourceCity, ...(cityCoords[sourceCity] || {}) },
      destination: { address: destinationCity, ...(cityCoords[destinationCity] || {}) },
      dateTime: mkDate(spec.offset, spec.hour),
      pricePerSeat: spec.pricePerSeat,
      availableSeats: Math.max(spec.totalSeats - usedSeats, 0),
      status: spec.status,
    };
    ridesToInsert.push(ride);
  }

  const rides = await Ride.insertMany(ridesToInsert);

  rides.forEach((ride, index) => {
    const pattern = getBookingPattern(ride.status);
    pattern.forEach((bookingSpec, bookingIndex) => {
      const passenger = passengers[(index + bookingIndex) % passengers.length];
      const booking = {
        ride: ride._id,
        passenger: passenger._id,
        seatsBooked: bookingSpec.seats,
        status: bookingSpec.status,
        ratingGiven: bookingSpec.status === "completed",
        passengerDetails: {
          phone: `+91 98${(index + bookingIndex).toString().padStart(2, "0")}123456`,
          emergencyContactName: `Contact ${(index + bookingIndex) % 10}`,
          emergencyContactPhone: `+91 97${(index + bookingIndex).toString().padStart(2, "0")}654321`,
          note: "Seeded safety details",
        },
        shareToken: crypto.randomUUID(),
        lastCheckInAt: new Date(),
      };

      if (bookingSpec.status === "completed") {
        booking.rating = 4 + ((index + bookingIndex) % 2);
      }

      bookingsToInsert.push(booking);
    });
  });

  const bookings = await Booking.insertMany(bookingsToInsert);

  const chatMessages = [];
  bookings.forEach((booking, index) => {
    if (booking.status === "cancelled") return;
    chatMessages.push({
      booking: booking._id,
      sender: booking.passenger,
      senderRole: "passenger",
      message: "Hi, confirming pickup location.",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    chatMessages.push({
      booking: booking._id,
      sender: rides[index % rides.length].driver,
      senderRole: "driver",
      message: "Confirmed. I will be there on time.",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  await ChatMessage.insertMany(chatMessages);

  console.log("\nSeed complete:");
  console.log(`Drivers: ${drivers.length}`);
  console.log(`Passengers: ${passengers.length}`);
  console.log(`Rides: ${rides.length}`);
  console.log(`Bookings: ${bookings.length}`);
  console.log(`Chat messages: ${chatMessages.length}`);
  console.log("\nStatuses:");
  console.log(`Active rides: ${rides.filter((r) => r.status === "active").length}`);
  console.log(`Completed rides: ${rides.filter((r) => r.status === "completed").length}`);
  console.log(`Cancelled rides: ${rides.filter((r) => r.status === "cancelled").length}`);
  console.log("\nLogin password for all seeded users: Pass@123");
  console.log(`Email domain used: @${SEED_DOMAIN}`);
}

seed()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Seed failed:", err.message);
    await mongoose.connection.close();
    process.exit(1);
  });

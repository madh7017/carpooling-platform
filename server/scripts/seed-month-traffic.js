#!/usr/bin/env node
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const User = require("../src/models/User");
const Ride = require("../src/models/Ride");
const Booking = require("../src/models/Booking");
const ChatMessage = require("../src/models/ChatMessage");
const SupportRequest = require("../src/models/SupportRequest");
const { hashPassword } = require("../src/utils/password");

const SEED_DOMAIN = "trafficcarpool.test";
const PASSWORD = "Pass@123";

const DRIVER_COUNT = 80;
const PASSENGER_COUNT = 480;
const DAYS = 30;
const START_DAY_OFFSET = -20;
const RIDES_PER_DAY = 150;
const SUPPORT_REQUEST_COUNT = 320;

const firstNames = [
  "Aarav", "Aditi", "Akash", "Ananya", "Arjun", "Bhavana", "Charan", "Deepa", "Dev", "Divya",
  "Farhan", "Gayathri", "Harsha", "Ishita", "Jeevan", "Kavya", "Kiran", "Lakshmi", "Madhu", "Meera",
  "Naveen", "Niharika", "Pavan", "Pooja", "Pranav", "Priya", "Rahul", "Ritika", "Sai", "Sanjana",
  "Shreya", "Siddharth", "Sneha", "Surya", "Tejas", "Vaishnavi", "Varun", "Vidya", "Vikram", "Yash",
];

const lastNames = [
  "Reddy", "Nair", "Kumar", "Iyer", "Joseph", "Das", "Rao", "Menon", "Patel", "Sharma",
  "Bhat", "Krishnan", "Singh", "Mohan", "Verma", "Chandra", "Srinivas", "Pillai", "Gowda", "Shetty",
];

const cityCoords = {
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Mysuru: { lat: 12.2958, lng: 76.6394 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Vijayawada: { lat: 16.5062, lng: 80.6480 },
  Tirupati: { lat: 13.6288, lng: 79.4192 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  Mangaluru: { lat: 12.9141, lng: 74.8560 },
  Udupi: { lat: 13.3409, lng: 74.7421 },
  Madurai: { lat: 9.9252, lng: 78.1198 },
  Visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  Puducherry: { lat: 11.9416, lng: 79.8083 },
  Warangal: { lat: 17.9689, lng: 79.5941 },
  Ooty: { lat: 11.4064, lng: 76.6932 },
  Rajahmundry: { lat: 16.9891, lng: 81.7787 },
  Salem: { lat: 11.6643, lng: 78.1460 },
  Hosur: { lat: 12.7409, lng: 77.8253 },
  Nellore: { lat: 14.4426, lng: 79.9865 },
  Hubballi: { lat: 15.3647, lng: 75.1240 },
  Belagavi: { lat: 15.8497, lng: 74.4977 },
};

const routes = [
  ["Bengaluru", "Mysuru"],
  ["Bengaluru", "Chennai"],
  ["Bengaluru", "Mangaluru"],
  ["Bengaluru", "Hosur"],
  ["Chennai", "Coimbatore"],
  ["Chennai", "Puducherry"],
  ["Hyderabad", "Vijayawada"],
  ["Hyderabad", "Tirupati"],
  ["Hyderabad", "Warangal"],
  ["Hyderabad", "Nellore"],
  ["Kochi", "Thiruvananthapuram"],
  ["Coimbatore", "Kochi"],
  ["Madurai", "Coimbatore"],
  ["Mangaluru", "Udupi"],
  ["Mysuru", "Ooty"],
  ["Visakhapatnam", "Rajahmundry"],
  ["Vijayawada", "Visakhapatnam"],
  ["Salem", "Bengaluru"],
  ["Hubballi", "Belagavi"],
  ["Mysuru", "Bengaluru"],
];

const carBrands = ["Swift", "Baleno", "i20", "Venue", "Nexon", "Creta", "Kushaq", "Polo", "Amaze", "City"];
const chatMessagesPassenger = [
  "Hi, I will reach the pickup point 10 minutes early.",
  "Please share the exact pickup landmark.",
  "I am carrying one cabin bag along with me.",
  "Can we coordinate over call if traffic gets heavy?",
  "I have reached the meeting point.",
];
const chatMessagesDriver = [
  "Sure, I will share my live location before departure.",
  "Pickup confirmed. Please keep your phone reachable.",
  "I am on the way and should arrive shortly.",
  "Noted. I will wait near the main entrance.",
  "Please be ready five minutes before the departure time.",
];
const supportCategories = ["booking", "ride", "driver", "payment", "account", "safety", "other"];

const buildName = (index) => `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / firstNames.length) % lastNames.length]}`;
const makeEmail = (prefix, index) => `${prefix}${String(index + 1).padStart(3, "0")}@${SEED_DOMAIN}`;
const makePhone = (base, index) => `9${String(base + index).padStart(9, "0").slice(-9)}`;
const createLocation = (address) => ({ address, ...(cityCoords[address] || {}) });
const pick = (list, index) => list[index % list.length];

const makeDateTime = (dayOffset, rideIndexInDay) => {
  const hourOptions = [5, 6, 7, 8, 9, 11, 13, 15, 17, 18, 19, 20, 21];
  const minuteOptions = [0, 10, 20, 30, 40, 50];
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + dayOffset,
    hourOptions[rideIndexInDay % hourOptions.length],
    minuteOptions[Math.floor(rideIndexInDay / hourOptions.length) % minuteOptions.length],
    0,
    0
  );
};

const pickRideStatus = (dayOffset, rideIndex) => {
  if (dayOffset < 0) {
    return rideIndex % 9 === 0 ? "cancelled" : "completed";
  }
  if (dayOffset === 0) {
    return rideIndex % 17 === 0 ? "cancelled" : "active";
  }
  return rideIndex % 21 === 0 ? "cancelled" : "active";
};

const getBookingBlueprints = (rideStatus, rideIndex, totalSeats) => {
  if (rideStatus === "cancelled") {
    const count = 1 + (rideIndex % 2);
    return Array.from({ length: count }, () => ({ status: "cancelled", seats: 1 }));
  }

  if (rideStatus === "completed") {
    const count = 2 + (rideIndex % 3);
    const blueprint = [];
    let remainingSeats = totalSeats;
    for (let i = 0; i < count && remainingSeats > 0; i += 1) {
      const seats = Math.min(remainingSeats, i === 0 && rideIndex % 5 === 0 ? 2 : 1);
      blueprint.push({ status: "completed", seats });
      remainingSeats -= seats;
    }
    if (rideIndex % 4 === 0) blueprint.push({ status: "cancelled", seats: 1 });
    return blueprint;
  }

  const count = 1 + (rideIndex % 4);
  const blueprint = [];
  let remainingSeats = totalSeats;
  for (let i = 0; i < count && remainingSeats > 0; i += 1) {
    const seats = Math.min(remainingSeats, i === 1 && rideIndex % 6 === 0 ? 2 : 1);
    blueprint.push({ status: "confirmed", seats });
    remainingSeats -= seats;
  }
  if (rideIndex % 7 === 0) blueprint.push({ status: "cancelled", seats: 1 });
  return blueprint;
};

async function cleanupPreviousTrafficSeed() {
  const seededUsers = await User.find({ email: { $regex: `@${SEED_DOMAIN}$`, $options: "i" } }).select("_id");
  const seededUserIds = seededUsers.map((user) => user._id);
  const rides = await Ride.find({ driver: { $in: seededUserIds } }).select("_id");
  const rideIds = rides.map((ride) => ride._id);
  const bookings = await Booking.find({
    $or: [{ ride: { $in: rideIds } }, { passenger: { $in: seededUserIds } }],
  }).select("_id");
  const bookingIds = bookings.map((booking) => booking._id);

  await Promise.all([
    ChatMessage.deleteMany({ booking: { $in: bookingIds } }),
    SupportRequest.deleteMany({
      $or: [{ user: { $in: seededUserIds } }, { ride: { $in: rideIds } }],
    }),
    Booking.deleteMany({ _id: { $in: bookingIds } }),
    Ride.deleteMany({ _id: { $in: rideIds } }),
    User.deleteMany({ _id: { $in: seededUserIds } }),
  ]);
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  await cleanupPreviousTrafficSeed();
  console.log("Removed previous month-traffic seed data");

  const passwordHash = await hashPassword(PASSWORD);

  const driverDocs = [];
  for (let index = 0; index < DRIVER_COUNT; index += 1) {
    const driverName = buildName(index);
    driverDocs.push({
      name: driverName,
      email: makeEmail("driver", index),
      phone: makePhone(100000000, index),
      password: passwordHash,
      role: "driver",
      rating: 4.2 + (index % 7) * 0.1,
      ratingCount: 18 + (index % 20) * 3,
      ecoScore: 110 + (index % 25) * 8,
      drivingLicenseNumber: `${pick(["KA", "TN", "TS", "KL", "AP"], index)}${String((index % 20) + 1).padStart(2, "0")} 2024${String(10000 + index).padStart(5, "0")}`,
      vehicleRegistrationNumber: `${pick(["KA", "TN", "TS", "KL", "AP"], index)}${String((index % 30) + 1).padStart(2, "0")}${pick(["AB", "CD", "EF", "GH", "JK", "LM"], index)}${String(1000 + index).slice(-4)}`,
      emergencyContactName: `${pick(firstNames, index + 7)} ${pick(lastNames, index + 11)}`,
      emergencyContactPhone: makePhone(200000000, index),
    });
  }

  const passengerDocs = [];
  for (let index = 0; index < PASSENGER_COUNT; index += 1) {
    passengerDocs.push({
      name: buildName(index + DRIVER_COUNT + 50),
      email: makeEmail("passenger", index),
      phone: makePhone(300000000, index),
      password: passwordHash,
      role: "passenger",
      rating: 4.0 + (index % 6) * 0.1,
      ratingCount: 2 + (index % 12),
      ecoScore: 45 + (index % 40) * 4,
    });
  }

  const adminDoc = {
    name: "Traffic Seed Admin",
    email: `admin@${SEED_DOMAIN}`,
    phone: "9876500000",
    password: passwordHash,
    isAdmin: true,
    ecoScore: 180,
  };

  const users = await User.insertMany([adminDoc, ...driverDocs, ...passengerDocs]);
  const adminUser = users[0];
  const drivers = users.slice(1, 1 + DRIVER_COUNT);
  const passengers = users.slice(1 + DRIVER_COUNT);

  const ridesToInsert = [];
  const rideMeta = [];

  for (let dayIndex = 0; dayIndex < DAYS; dayIndex += 1) {
    const dayOffset = START_DAY_OFFSET + dayIndex;

    for (let rideInDay = 0; rideInDay < RIDES_PER_DAY; rideInDay += 1) {
      const globalRideIndex = dayIndex * RIDES_PER_DAY + rideInDay;
      const driver = drivers[globalRideIndex % drivers.length];
      const [from, to] = routes[(globalRideIndex * 7 + dayIndex) % routes.length];
      const totalSeats = 3 + (globalRideIndex % 4);
      const status = pickRideStatus(dayOffset, globalRideIndex);
      const estimatedDurationMinutes = 95 + (globalRideIndex % 9) * 25;
      const pricePerSeat = 180 + (globalRideIndex % 10) * 35;

      ridesToInsert.push({
        driver: driver._id,
        source: createLocation(from),
        destination: createLocation(to),
        dateTime: makeDateTime(dayOffset, rideInDay),
        estimatedDurationMinutes,
        pricePerSeat,
        availableSeats: totalSeats,
        status,
      });

      rideMeta.push({ totalSeats, driverId: driver._id, globalRideIndex, status });
    }
  }

  const rides = await Ride.insertMany(ridesToInsert);

  const bookingsToInsert = [];
  const bookingMeta = [];

  rides.forEach((ride, rideIndex) => {
    const { totalSeats, driverId, globalRideIndex, status } = rideMeta[rideIndex];
    const blueprints = getBookingBlueprints(status, globalRideIndex, totalSeats);
    let usedSeats = 0;

    blueprints.forEach((blueprint, blueprintIndex) => {
      let passengerIndex = (globalRideIndex * 5 + blueprintIndex * 17) % passengers.length;
      while (passengers[passengerIndex]._id.toString() === driverId.toString()) {
        passengerIndex = (passengerIndex + 1) % passengers.length;
      }

      const passenger = passengers[passengerIndex];
      if (blueprint.status === "confirmed" || blueprint.status === "completed") {
        usedSeats += blueprint.seats;
      }

      const checkInTime =
        blueprint.status === "cancelled"
          ? undefined
          : new Date(ride.dateTime.getTime() - Math.max(20, Math.floor((ride.estimatedDurationMinutes || 120) * 0.4)) * 60000);

      const rating = blueprint.status === "completed" && globalRideIndex % 3 === 0 ? 4 + (blueprintIndex % 2) : undefined;
      const ratingGiven = typeof rating === "number";

      bookingsToInsert.push({
        ride: ride._id,
        passenger: passenger._id,
        seatsBooked: blueprint.seats,
        status: blueprint.status,
        shareToken: crypto.randomUUID(),
        lastCheckInAt: checkInTime,
        passengerDetails: {
          phone: passenger.phone,
          emergencyContactName: `${pick(firstNames, passengerIndex + 13)} ${pick(lastNames, passengerIndex + 3)}`,
          emergencyContactPhone: makePhone(400000000, passengerIndex),
          note:
            blueprint.status === "completed"
              ? "Monthly traffic seed completed trip."
              : blueprint.status === "confirmed"
                ? "Monthly traffic seed active trip."
                : "Cancelled before departure.",
        },
        ...(ratingGiven ? { rating, ratingGiven } : {}),
      });

      bookingMeta.push({
        rideIndex,
        passengerId: passenger._id,
        driverId,
        globalRideIndex,
        status: blueprint.status,
      });
    });

    ride.availableSeats = Math.max(totalSeats - usedSeats, 1);
  });

  await Promise.all(rides.map((ride) => ride.save()));
  const bookings = await Booking.insertMany(bookingsToInsert);

  const chatMessagesToInsert = [];
  bookings.forEach((booking, index) => {
    const meta = bookingMeta[index];
    if (booking.status === "cancelled") return;

    const ride = rides[meta.rideIndex];
    const firstTs = new Date(ride.dateTime.getTime() - 150 * 60000);
    const secondTs = new Date(firstTs.getTime() + 12 * 60000);
    const thirdTs = new Date(secondTs.getTime() + 15 * 60000);

    chatMessagesToInsert.push({
      booking: booking._id,
      sender: meta.passengerId,
      senderRole: "passenger",
      message: pick(chatMessagesPassenger, meta.globalRideIndex + index),
      createdAt: firstTs,
      updatedAt: firstTs,
    });

    chatMessagesToInsert.push({
      booking: booking._id,
      sender: meta.driverId,
      senderRole: "driver",
      message: pick(chatMessagesDriver, meta.globalRideIndex + index),
      createdAt: secondTs,
      updatedAt: secondTs,
    });

    if ((meta.globalRideIndex + index) % 2 === 0) {
      chatMessagesToInsert.push({
        booking: booking._id,
        sender: meta.passengerId,
        senderRole: "passenger",
        message: "Thanks, that pickup plan works for me.",
        createdAt: thirdTs,
        updatedAt: thirdTs,
      });
    }
  });

  const chatMessages = await ChatMessage.insertMany(chatMessagesToInsert);

  const nonCancelledBookings = bookings.filter((booking) => booking.status !== "cancelled");
  const supportRequestsToInsert = [];

  for (let index = 0; index < SUPPORT_REQUEST_COUNT; index += 1) {
    const category = supportCategories[index % supportCategories.length];
    const booking = nonCancelledBookings[index % nonCancelledBookings.length];
    const ride = rides.find((item) => item._id.toString() === booking.ride.toString());
    const passenger = passengers[index % passengers.length];
    const status = index % 6 === 0 ? "resolved" : index % 4 === 0 ? "in_progress" : "open";

    supportRequestsToInsert.push({
      user: passenger._id,
      ride: ["ride", "driver", "safety"].includes(category) ? ride._id : null,
      subject: `${category.charAt(0).toUpperCase() + category.slice(1)} assistance request`,
      category,
      message: `Monthly traffic seed request ${index + 1} for ${category} review.`,
      status,
      adminNote: status === "open" ? "" : status === "resolved" ? "Resolved during seeded workflow review." : "Assigned to support team.",
      adminViewedAt: status === "open" && index % 5 === 0 ? null : new Date(),
      createdAt: new Date(Date.now() - (index % DAYS) * 86400000),
      updatedAt: new Date(Date.now() - (index % 10) * 3600000),
    });
  }

  const supportRequests = await SupportRequest.insertMany(supportRequestsToInsert);

  console.log("");
  console.log("Month traffic seed complete");
  console.log(`Admin users: 1`);
  console.log(`Drivers: ${drivers.length}`);
  console.log(`Passengers: ${passengers.length}`);
  console.log(`Rides: ${rides.length}`);
  console.log(`Bookings: ${bookings.length}`);
  console.log(`Chat messages: ${chatMessages.length}`);
  console.log(`Support requests: ${supportRequests.length}`);
  console.log("");
  console.log("Ride status breakdown:");
  console.log(`- Active: ${rides.filter((ride) => ride.status === "active").length}`);
  console.log(`- Completed: ${rides.filter((ride) => ride.status === "completed").length}`);
  console.log(`- Cancelled: ${rides.filter((ride) => ride.status === "cancelled").length}`);
  console.log("");
  console.log("Booking status breakdown:");
  console.log(`- Confirmed: ${bookings.filter((booking) => booking.status === "confirmed").length}`);
  console.log(`- Completed: ${bookings.filter((booking) => booking.status === "completed").length}`);
  console.log(`- Cancelled: ${bookings.filter((booking) => booking.status === "cancelled").length}`);
  console.log("");
  console.log(`Password for all ${SEED_DOMAIN} users: ${PASSWORD}`);
  console.log("Sample logins:");
  console.log(`- ${adminUser.email} (admin)`);
  console.log(`- ${drivers[0].email}`);
  console.log(`- ${drivers[1].email}`);
  console.log(`- ${passengers[0].email}`);
  console.log(`- ${passengers[1].email}`);
}

main()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Month traffic seed failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  });

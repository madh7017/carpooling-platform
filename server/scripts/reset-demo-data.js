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

const routes = [
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
  ["Visakhapatnam", "Rajahmundry"],
];

const driverSeeds = [
  ["Arjun Reddy", "arjun@southcarpool.test", "9123456789", "TS09 20240012345", "TS09AB1234", "Raghav Reddy", "9345678912"],
  ["Priya Nair", "priya@southcarpool.test", "9234567890", "KL07 20245543210", "KL07CD5678", "Anil Nair", "9456789012"],
  ["Ravi Kumar", "ravi@southcarpool.test", "9345678901", "TN11 20243332221", "TN11EF4321", "Suma Kumar", "9567890123"],
  ["Sneha Iyer", "sneha@southcarpool.test", "9456789012", "KL01 20247778888", "KL01GH2468", "Vivek Iyer", "9678901234"],
  ["Karthik M", "karthik@southcarpool.test", "9567890123", "TS10 20245556666", "TS10JK1357", "Madhavi K", "9789012345"],
  ["Meera Joseph", "meera@southcarpool.test", "9678901234", "KL05 20241239876", "KL05LM8642", "Jijo Joseph", "9890123456"],
  ["Sanjay Verma", "sanjay@southcarpool.test", "9789012345", "AP07 20249876123", "AP07NP7412", "Renu Verma", "9876512340"],
  ["Nisha Rao", "nisha@southcarpool.test", "9890123456", "TN22 20246667777", "TN22QR2580", "Kiran Rao", "9765412309"],
];

const passengerSeeds = [
  ["Lakshmi P", "lakshmi@southcarpool.test", "9567890123"],
  ["Deepak Rao", "deepak@southcarpool.test", "9678901234"],
  ["Ananya Das", "ananya@southcarpool.test", "9789012345"],
  ["Harini V", "harini@southcarpool.test", "9890123456"],
  ["Vikram S", "vikram@southcarpool.test", "9876501234"],
  ["Divya R", "divya@southcarpool.test", "9765401234"],
  ["Gopi N", "gopi@southcarpool.test", "9654301234"],
  ["Asha K", "asha@southcarpool.test", "9543201234"],
  ["Pranav C", "pranav@southcarpool.test", "9432101234"],
  ["Manoj T", "manoj@southcarpool.test", "9321001234"],
  ["Sowmya S", "sowmya@southcarpool.test", "9210001234"],
  ["Keerthi L", "keerthi@southcarpool.test", "9109001234"],
  ["Ritika M", "ritika@southcarpool.test", "9876511111"],
  ["Naveen P", "naveen@southcarpool.test", "9765411111"],
  ["Bhavana J", "bhavana@southcarpool.test", "9654311111"],
  ["Rahul T", "rahul@southcarpool.test", "9543211111"],
  ["Ishita N", "ishita@southcarpool.test", "9432111111"],
  ["Tejas K", "tejas@southcarpool.test", "9321011111"],
];

const supportSubjects = {
  safety: "Safety concern during trip",
  driver: "Driver behaviour feedback",
  ride: "Ride issue to review",
  booking: "Booking issue",
  account: "Account help needed",
};

const supportMessages = {
  safety: "Please review this trip because I had a safety concern and want admin follow-up.",
  driver: "I want to report driver behaviour from this trip for admin review.",
  ride: "There was a ride coordination issue and I need admin assistance.",
  booking: "My booking flow had an issue and I need help resolving it.",
  account: "Please help me review or update my account-related details.",
};

const now = new Date();

const dateOffset = (days, hour, minute = 0) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, hour, minute, 0, 0);

const createLocation = (address) => ({
  address,
  ...(cityCoords[address] || {}),
});

const pickRideStatus = (index) => {
  if (index % 7 === 0 || index % 11 === 0) return "cancelled";
  if (index % 3 === 0 || index % 4 === 0) return "completed";
  return "active";
};

const getBookingBlueprints = (rideStatus, rideIndex) => {
  if (rideStatus === "cancelled") {
    return [
      { status: "cancelled", seats: 1 },
      { status: "cancelled", seats: 1 },
    ];
  }

  if (rideStatus === "completed") {
    return [
      { status: "completed", seats: 1 },
      { status: "completed", seats: rideIndex % 4 === 0 ? 2 : 1 },
      ...(rideIndex % 5 === 0 ? [{ status: "cancelled", seats: 1 }] : []),
    ];
  }

  return [
    { status: "confirmed", seats: 1 },
    { status: "confirmed", seats: rideIndex % 4 === 0 ? 2 : 1 },
    ...(rideIndex % 3 === 0 ? [{ status: "confirmed", seats: 1 }] : []),
    ...(rideIndex % 6 === 0 ? [{ status: "cancelled", seats: 1 }] : []),
  ];
};

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  await Promise.all([
    ChatMessage.deleteMany({}),
    Booking.deleteMany({}),
    Ride.deleteMany({}),
    SupportRequest.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log("Deleted old users and app data");

  const password = await hashPassword("Pass@123");
  const adminEmail = (process.env.ADMIN_EMAILS || "carpooladmin.madhu@gmail.com")
    .split(",")[0]
    .trim() || "carpooladmin.madhu@gmail.com";

  const users = await User.insertMany([
    {
      name: "Madhu Admin",
      email: adminEmail,
      phone: "9876543210",
      password,
      isAdmin: true,
      ecoScore: 140,
    },
    ...driverSeeds.map(([name, email, phone, licence, vehicle, emergencyName, emergencyPhone], index) => ({
      name,
      email,
      phone,
      password,
      role: "driver",
      rating: 4.4 + (index % 5) * 0.1,
      ratingCount: 18 + index * 5,
      ecoScore: 130 + index * 12,
      drivingLicenseNumber: licence,
      vehicleRegistrationNumber: vehicle,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
    })),
    ...passengerSeeds.map(([name, email, phone], index) => ({
      name,
      email,
      phone,
      password,
      ecoScore: 60 + index * 4,
    })),
  ]);

  const usersByEmail = Object.fromEntries(users.map((user) => [user.email, user]));
  const drivers = driverSeeds.map(([, email]) => usersByEmail[email]);
  const passengers = passengerSeeds.map(([, email]) => usersByEmail[email]);

  const rideDocs = [];
  const ridePlan = [];
  const rideHours = [6, 7, 8, 12, 16, 18, 20];

  for (let day = -10; day <= 14; day += 1) {
    for (let slot = 0; slot < 3; slot += 1) {
      const rideIndex = ridePlan.length;
      const [from, to] = routes[rideIndex % routes.length];
      const driver = drivers[rideIndex % drivers.length];
      const totalSeats = 4 + (rideIndex % 3);
      const status = pickRideStatus(rideIndex);
      const estimatedDurationMinutes = 150 + (rideIndex % 7) * 45;
      const pricePerSeat = 180 + (rideIndex % 8) * 40;

      ridePlan.push({
        index: rideIndex,
        totalSeats,
        status,
      });

      rideDocs.push({
        driver: driver._id,
        source: createLocation(from),
        destination: createLocation(to),
        dateTime: dateOffset(day, rideHours[(rideIndex + slot) % rideHours.length], (rideIndex * 5) % 60),
        estimatedDurationMinutes,
        pricePerSeat,
        availableSeats: totalSeats,
        status,
      });
    }
  }

  const rides = await Ride.insertMany(rideDocs);

  const bookingsToInsert = [];
  const bookingMeta = [];

  rides.forEach((ride, rideIndex) => {
    const blueprints = getBookingBlueprints(ride.status, rideIndex);
    let usedSeats = 0;

    blueprints.forEach((blueprint, blueprintIndex) => {
      const passenger = passengers[(rideIndex + blueprintIndex) % passengers.length];
      if (blueprint.status === "confirmed" || blueprint.status === "completed") {
        usedSeats += blueprint.seats;
      }

      const lastCheckInAt =
        blueprint.status === "cancelled"
          ? undefined
          : new Date(ride.dateTime.getTime() - Math.max(45, (ride.estimatedDurationMinutes || 120) * 60 * 1000 * 0.35));

      bookingsToInsert.push({
        ride: ride._id,
        passenger: passenger._id,
        seatsBooked: blueprint.seats,
        status: blueprint.status,
        shareToken: crypto.randomUUID(),
        lastCheckInAt,
        passengerDetails: {
          phone: passenger.phone,
          emergencyContactName: `Contact ${(rideIndex + blueprintIndex) % 20}`,
          emergencyContactPhone: `9${String(111111111 + rideIndex * 7 + blueprintIndex).slice(-9)}`,
          note:
            blueprint.status === "completed"
              ? "Trip completed safely"
              : blueprint.status === "confirmed"
                ? "Seeded confirmed booking"
                : "Ride was cancelled before departure",
        },
        ...(blueprint.status === "completed"
          ? {
              rating: 4 + ((rideIndex + blueprintIndex) % 2),
              ratingGiven: true,
            }
          : {}),
      });

      bookingMeta.push({
        rideIndex,
        passengerEmail: passenger.email,
        driverId: ride.driver,
        rideId: ride._id,
        status: blueprint.status,
      });
    });

    ride.availableSeats = Math.max(ridePlan[rideIndex].totalSeats - usedSeats, 0);
  });

  await Promise.all(rides.map((ride) => ride.save()));
  const bookings = await Booking.insertMany(bookingsToInsert);

  const chatMessagesToInsert = [];
  bookings.forEach((booking, index) => {
    const meta = bookingMeta[index];
    if (booking.status === "cancelled") return;

    const passenger = usersByEmail[meta.passengerEmail];
    const ride = rides[meta.rideIndex];
    const baseTime = new Date(ride.dateTime.getTime() - 3 * 60 * 60 * 1000);

    chatMessagesToInsert.push({
      booking: booking._id,
      sender: passenger._id,
      senderRole: "passenger",
      message: index % 2 === 0 ? "Hi, confirming pickup point." : "Please share the pickup landmark.",
      createdAt: baseTime,
      updatedAt: baseTime,
    });

    chatMessagesToInsert.push({
      booking: booking._id,
      sender: meta.driverId,
      senderRole: "driver",
      message: index % 3 === 0 ? "Pickup confirmed. I will message before arrival." : "Sure, I will coordinate before departure.",
      createdAt: new Date(baseTime.getTime() + 12 * 60 * 1000),
      updatedAt: new Date(baseTime.getTime() + 12 * 60 * 1000),
    });

    if (index % 4 === 0) {
      chatMessagesToInsert.push({
        booking: booking._id,
        sender: passenger._id,
        senderRole: "passenger",
        message: "Thanks, that works for me.",
        createdAt: new Date(baseTime.getTime() + 22 * 60 * 1000),
        updatedAt: new Date(baseTime.getTime() + 22 * 60 * 1000),
      });
    }
  });

  const chatMessages = await ChatMessage.insertMany(chatMessagesToInsert);

  const supportRequestsToInsert = [];
  const supportCategories = ["safety", "driver", "ride", "booking", "account"];
  const rideBackedBookings = bookings.filter((booking) => booking.status !== "cancelled");

  for (let index = 0; index < 18; index += 1) {
    const category = supportCategories[index % supportCategories.length];
    const relatedBooking = rideBackedBookings[index % rideBackedBookings.length];
    const relatedRide = rides.find((ride) => ride._id.toString() === relatedBooking.ride.toString());
    const relatedPassenger = passengers[index % passengers.length];
    const status = index % 5 === 0 ? "resolved" : index % 3 === 0 ? "in_progress" : "open";

    supportRequestsToInsert.push({
      user: relatedPassenger._id,
      ride: ["safety", "driver", "ride"].includes(category) ? relatedRide._id : null,
      subject: supportSubjects[category],
      category,
      message: supportMessages[category],
      status,
      adminNote:
        status === "resolved"
          ? "Resolved after review."
          : status === "in_progress"
            ? "Under admin review."
            : "",
      adminViewedAt: status === "open" && index % 4 === 0 ? null : new Date(),
      createdAt: dateOffset(-(index % 7), 10 + (index % 8), 15),
      updatedAt: dateOffset(-(index % 4), 14 + (index % 6), 30),
    });
  }

  const supportRequests = await SupportRequest.insertMany(supportRequestsToInsert);

  console.log("");
  console.log("Database reset complete");
  console.log(`Users: ${users.length}`);
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
  console.log("Login password for all seeded accounts: Pass@123");
  console.log("");
  console.log("Main demo accounts:");
  console.log(`- ${adminEmail} (admin)`);
  console.log("- arjun@southcarpool.test");
  console.log("- priya@southcarpool.test");
  console.log("- ravi@southcarpool.test");
  console.log("- sneha@southcarpool.test");
  console.log("- lakshmi@southcarpool.test");
  console.log("- deepak@southcarpool.test");
  console.log("- ananya@southcarpool.test");
  console.log("- harini@southcarpool.test");
}

main()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Reset failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  });

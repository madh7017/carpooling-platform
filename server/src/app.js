const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const rideRoutes = require("./routes/rideRoutes");
const bookingRoutes = require("./routes/bookingRoutes");


const app = express();

/* ---------- Global Middlewares ---------- */
app.use(cors());
app.use(express.json());

/* ---------- Routes ---------- */
app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/calls", require("./routes/callRoutes"));
app.use("/api/support", require("./routes/supportRoutes"));
app.use("/api/driver", require("./routes/driverRoutes"));
app.use("/api/drivers", require("./routes/driverRoutes"));
app.use("/api/passengers", require("./routes/passengerRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));



/* ---------- Health Check ---------- */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server running" });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Not Found" });
});

// Error handler
app.use(require("./middlewares/errorMiddleware").errorHandler);

module.exports = app;

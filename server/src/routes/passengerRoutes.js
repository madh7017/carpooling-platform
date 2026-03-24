const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getPassengerDashboard } = require("../controllers/passengerController");

router.get(
  "/dashboard",
  authMiddleware,
  getPassengerDashboard
);

module.exports = router;

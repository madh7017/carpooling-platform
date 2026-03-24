const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getDriverEarnings, getDriverDashboard } = require("../controllers/driverController");

router.get(
  "/dashboard",
  authMiddleware,
  getDriverDashboard
);

router.get(
  "/earnings",
  authMiddleware,
  getDriverEarnings
);

module.exports = router;

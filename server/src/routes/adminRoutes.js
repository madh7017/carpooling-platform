const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
  getAdminOverview,
  getAdminUsers,
  getAdminRides,
  getAdminBookings,
  getAdminSupportRequests,
  updateUserAdminStatus,
  deleteUser,
  cancelRideAsAdmin,
  cancelBookingAsAdmin,
  updateSupportRequestAsAdmin,
} = require("../controllers/adminController");

router.use(authMiddleware, adminMiddleware);

router.get("/overview", getAdminOverview);
router.get("/users", getAdminUsers);
router.get("/rides", getAdminRides);
router.get("/bookings", getAdminBookings);
router.get("/support", getAdminSupportRequests);
router.patch("/users/:id/admin", updateUserAdminStatus);
router.delete("/users/:id", deleteUser);
router.patch("/rides/:id/cancel", cancelRideAsAdmin);
router.patch("/bookings/:id/cancel", cancelBookingAsAdmin);
router.patch("/support/:id", updateSupportRequestAsAdmin);

module.exports = router;

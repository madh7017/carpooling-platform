const express = require("express");
const router = express.Router();

const {
  createRide,
  getRides,
  getRideById,
  completeRide,
  cancelRide,
  getMyRides,
  getDriverStats,
  getDriverEarnings,
} = require("../controllers/rideController");
const authMiddleware = require("../middlewares/authMiddleware");
const { body, query } = require("express-validator");
const { runValidation } = require("../middlewares/validationMiddleware");
const {
  isValidDescriptiveText,
  isValidLicenseNumber,
  isValidName,
  isValidPhone,
  isValidPlace,
  isValidVehicleNumber,
} = require("../utils/validators");

// Public search rides
router.get(
  "/",
  [
    query("from").optional().isString(),
    query("to").optional().isString(),
    query("date").optional().isISO8601(),
    query("sortBy").optional().isIn(["price", "seats", "date"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  runValidation,
  getRides
);

// Driver dashboard - my rides
router.get(
  "/my",
  authMiddleware,
  getMyRides
);

// Driver stats (summary)
router.get(
  "/stats",
  authMiddleware,
  getDriverStats
);

// Driver earnings breakdown
router.get(
  "/earnings",
  authMiddleware,
  getDriverEarnings
);

// Compatibility alias for frontend
router.get("/search", getRides);

router.get("/:id", getRideById);



// Driver-only create ride
router.post(
  "/",
  authMiddleware,
  [
    body().custom((value) => {
      const from = value?.source?.address || value?.from;
      if (from && isValidPlace(from)) return true;
      throw new Error("Source address required");
    }),
    body().custom((value) => {
      const to = value?.destination?.address || value?.to;
      if (to && isValidPlace(to)) return true;
      throw new Error("Destination address required");
    }),
    body().custom((value) => {
      const from = value?.source?.address || value?.from || "";
      const to = value?.destination?.address || value?.to || "";
      if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
        throw new Error("Source and destination must be different");
      }
      return true;
    }),
    body().custom((value) => {
      if (value?.dateTime) return true;
      if (value?.departureDate && value?.departureTime) return true;
      throw new Error("Valid dateTime required");
    }),
    body("drivingLicenseNumber")
      .custom((value) => isValidLicenseNumber(value))
      .withMessage("Enter a valid driving licence number"),
    body("vehicleRegistrationNumber")
      .custom((value) => isValidVehicleNumber(value))
      .withMessage("Enter a valid vehicle registration number"),
    body("emergencyContactName")
      .custom((value) => isValidName(value))
      .withMessage("Enter a valid emergency contact name"),
    body("emergencyContactPhone")
      .custom((value) => isValidPhone(value))
      .withMessage("Valid emergency contact phone required"),
    body("carModel")
      .optional({ checkFalsy: true })
      .custom((value) => isValidPlace(value))
      .withMessage("Enter a valid car model"),
    body("notes")
      .optional({ checkFalsy: true })
      .custom((value) => isValidDescriptiveText(value))
      .withMessage("Add meaningful notes"),
    body().custom((value) => {
      const dateTimeValue = value?.dateTime
        ? new Date(value.dateTime)
        : value?.departureDate && value?.departureTime
          ? new Date(`${value.departureDate}T${value.departureTime}`)
          : null;
      if (!dateTimeValue || Number.isNaN(dateTimeValue.getTime())) {
        throw new Error("Valid dateTime required");
      }
      if (dateTimeValue < new Date()) {
        throw new Error("Ride date/time must be in the future");
      }
      return true;
    }),
    body("pricePerSeat").isFloat({ min: 0 }).withMessage("Valid pricePerSeat required"),
    body().custom((value) => {
      const seats = value?.availableSeats ?? value?.totalSeats;
      if (Number.isInteger(Number(seats)) && Number(seats) >= 1) return true;
      throw new Error("availableSeats >= 1");
    }),
  ],
  runValidation,
  createRide
);

router.patch(
  "/:id/complete",
  authMiddleware,
  completeRide
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  cancelRide
);



module.exports = router;

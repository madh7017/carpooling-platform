const express = require("express");
const router = express.Router();

const {
  createBooking,
  cancelBooking,
  getMyBookings,
  getMyBookingsForClient,
  getBookingsByRide,
  checkInBooking,
  ratePassenger,
  rateDriver,
} = require("../controllers/bookingController");

const authMiddleware = require("../middlewares/authMiddleware");
const { body, param } = require("express-validator");
const { runValidation } = require("../middlewares/validationMiddleware");
const { isValidDescriptiveText, isValidName, isValidPhone } = require("../utils/validators");

router.post(
  "/",
  authMiddleware,
  [
    body("rideId").isMongoId().withMessage("Valid rideId required"),
    body().custom((value) => {
      const seats = value?.seatsBooked ?? value?.numSeats;
      if (Number.isInteger(Number(seats)) && Number(seats) >= 1) return true;
      throw new Error("seatsBooked >= 1");
    }),
    body("passengerDetails").isObject().withMessage("Passenger details required for security"),
    body("passengerDetails.phone")
      .custom((value) => isValidPhone(value))
      .withMessage("Valid passenger phone required"),
    body("passengerDetails.emergencyContactName")
      .custom((value) => isValidName(value))
      .withMessage("Enter a valid emergency contact name"),
    body("passengerDetails.emergencyContactPhone")
      .custom((value) => isValidPhone(value))
      .withMessage("Valid emergency contact phone required"),
    body("passengerDetails.note")
      .optional({ checkFalsy: true })
      .custom((value) => isValidDescriptiveText(value))
      .withMessage("Add a meaningful safety note"),
  ],
  runValidation,
  createBooking
);
router.get("/", authMiddleware, getMyBookingsForClient);
router.get("/my", authMiddleware, getMyBookings);
router.patch(
  "/:id/cancel",
  authMiddleware,
  [param("id").isMongoId().withMessage("Valid booking id required")],
  runValidation,
  cancelBooking
);
router.post(
  "/:id/check-in",
  authMiddleware,
  [param("id").isMongoId().withMessage("Valid booking id required")],
  runValidation,
  checkInBooking
);

router.get(
  "/ride/:rideId",
  authMiddleware,
  getBookingsByRide
);

router.post(
  "/:id/rate",
  authMiddleware,
  [param("id").isMongoId(), body("rating").isInt({ min: 1, max: 5 })],
  runValidation,
  rateDriver
);

router.post(
  "/rate/:bookingId",
  authMiddleware,
  [param("bookingId").isMongoId(), body("rating").isInt({ min: 1, max: 5 })],
  runValidation,
  ratePassenger
);

module.exports = router;

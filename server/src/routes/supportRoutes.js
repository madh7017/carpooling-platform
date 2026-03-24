const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const mongoose = require("mongoose");
const authMiddleware = require("../middlewares/authMiddleware");
const { runValidation } = require("../middlewares/validationMiddleware");
const { isValidDescriptiveText, isValidSupportSubject } = require("../utils/validators");
const {
  createSupportRequest,
  getMySupportRequests,
} = require("../controllers/supportController");

router.use(authMiddleware);

router.get("/", getMySupportRequests);

router.post(
  "/",
  [
    body("subject")
      .custom((value) => isValidSupportSubject(value))
      .withMessage("Enter a clear support subject"),
    body("category")
      .isIn(["booking", "ride", "driver", "payment", "account", "safety", "other"])
      .withMessage("Valid support category required"),
    body("message")
      .custom((value) => isValidDescriptiveText(value))
      .withMessage("Describe the issue clearly"),
    body("rideId")
      .optional({ values: "falsy" })
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Valid ride selection required"),
  ],
  runValidation,
  createSupportRequest
);

module.exports = router;

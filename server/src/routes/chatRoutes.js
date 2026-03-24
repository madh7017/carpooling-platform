const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const authMiddleware = require("../middlewares/authMiddleware");
const { runValidation } = require("../middlewares/validationMiddleware");
const { getChatMessages, sendChatMessage } = require("../controllers/chatController");

router.get(
  "/:bookingId",
  authMiddleware,
  [param("bookingId").isMongoId().withMessage("Valid booking id required")],
  runValidation,
  getChatMessages
);

router.post(
  "/:bookingId",
  authMiddleware,
  [
    param("bookingId").isMongoId().withMessage("Valid booking id required"),
    body("message").isString().isLength({ min: 1, max: 1000 }),
  ],
  runValidation,
  sendChatMessage
);

module.exports = router;

const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const authMiddleware = require("../middlewares/authMiddleware");
const { runValidation } = require("../middlewares/validationMiddleware");
const {
  startCall,
  answerCall,
  sendIceCandidate,
  endCall,
} = require("../controllers/callController");

router.post(
  "/:bookingId/start",
  authMiddleware,
  [param("bookingId").isMongoId().withMessage("Valid booking id required"), body("offer").notEmpty().withMessage("Offer is required")],
  runValidation,
  startCall
);

router.post(
  "/:bookingId/answer",
  authMiddleware,
  [
    param("bookingId").isMongoId().withMessage("Valid booking id required"),
    body("callId").notEmpty().withMessage("Call id is required"),
    body("answer").notEmpty().withMessage("Answer is required"),
  ],
  runValidation,
  answerCall
);

router.post(
  "/:bookingId/ice",
  authMiddleware,
  [
    param("bookingId").isMongoId().withMessage("Valid booking id required"),
    body("callId").notEmpty().withMessage("Call id is required"),
    body("candidate").notEmpty().withMessage("Candidate is required"),
  ],
  runValidation,
  sendIceCandidate
);

router.post(
  "/:bookingId/end",
  authMiddleware,
  [
    param("bookingId").isMongoId().withMessage("Valid booking id required"),
    body("callId").notEmpty().withMessage("Call id is required"),
  ],
  runValidation,
  endCall
);

module.exports = router;

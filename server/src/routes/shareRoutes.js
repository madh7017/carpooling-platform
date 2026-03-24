const express = require("express");
const router = express.Router();
const { getShareByToken } = require("../controllers/bookingController");

router.get("/:token", getShareByToken);

module.exports = router;

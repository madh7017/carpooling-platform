const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { register, login, getMe } = require("../controllers/authController");
const { runValidation } = require("../middlewares/validationMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { isValidName, isValidPhone } = require("../utils/validators");

router.post(
	"/register",
	[
		body("name")
			.custom((value) => isValidName(value))
			.withMessage("Enter a valid full name"),
		body("email").isEmail().withMessage("Valid email required"),
		body("phone")
			.custom((value) => isValidPhone(value))
			.withMessage("Valid phone number required"),
		body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
	],
	runValidation,
	register
);

router.post(
	"/login",
	[body("email").isEmail(), body("password").notEmpty()],
	runValidation,
	login
);

router.get("/me", authMiddleware, getMe);

module.exports = router;

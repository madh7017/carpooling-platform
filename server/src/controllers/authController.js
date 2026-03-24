const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { hashPassword, comparePassword } = require("../utils/password");
const { generateToken } = require("../utils/jwt");
const { isAdminEmail, isAdminUser } = require("../utils/admin");

// REGISTER
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    isAdmin: isAdminEmail(email),
  });

  const token = generateToken({ id: user._id });

  res.status(201).json({
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      ecoScore: user.ecoScore,
      isAdmin: isAdminUser(user),
      drivingLicenseNumber: user.drivingLicenseNumber,
      vehicleRegistrationNumber: user.vehicleRegistrationNumber,
      emergencyContactName: user.emergencyContactName,
      emergencyContactPhone: user.emergencyContactPhone,
    },
  });
});


// LOGIN
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const user = await User.findOne({ email });

  // 🔒 User or password missing
  if (!user || !user.password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken({ id: user._id });

  res.json({
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      ecoScore: user.ecoScore,
      isAdmin: isAdminUser(user),
      drivingLicenseNumber: user.drivingLicenseNumber,
      vehicleRegistrationNumber: user.vehicleRegistrationNumber,
      emergencyContactName: user.emergencyContactName,
      emergencyContactPhone: user.emergencyContactPhone,
    },
  });
});

// CURRENT USER (token validation)
exports.getMe = asyncHandler(async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      ecoScore: req.user.ecoScore,
      isAdmin: req.user.isAdmin,
      drivingLicenseNumber: req.user.drivingLicenseNumber,
      vehicleRegistrationNumber: req.user.vehicleRegistrationNumber,
      emergencyContactName: req.user.emergencyContactName,
      emergencyContactPhone: req.user.emergencyContactPhone,
    },
  });
});

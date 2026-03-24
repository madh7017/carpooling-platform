const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { isAdminUser } = require("../utils/admin");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "name email phone role ecoScore isAdmin drivingLicenseNumber vehicleRegistrationNumber emergencyContactName emergencyContactPhone"
    );
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      ecoScore: user.ecoScore,
      isAdmin: isAdminUser(user),
      drivingLicenseNumber: user.drivingLicenseNumber,
      vehicleRegistrationNumber: user.vehicleRegistrationNumber,
      emergencyContactName: user.emergencyContactName,
      emergencyContactPhone: user.emergencyContactPhone,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

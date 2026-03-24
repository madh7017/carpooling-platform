exports.requirePassenger = (req, res, next) => {
  if (req.user.role !== "passenger") {
    return res
      .status(403)
      .json({ message: "Passenger access required" });
  }
  next();
};

const { isAdminUser } = require("../utils/admin");

module.exports = (req, res, next) => {
  if (!req.user || !isAdminUser(req.user)) {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

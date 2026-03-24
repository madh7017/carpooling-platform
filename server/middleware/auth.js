const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    req.userRole = decoded.role
    next()
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Unauthorized role' })
    }
    next()
  }
}

module.exports = { auth, roleCheck }

const express = require('express')
const jwt = require('jsonwebtoken')
const { validationResult, body } = require('express-validator')
const User = require('../models/User')
const { auth } = require('../middleware/auth')

const router = express.Router()

// Register
router.post('/register', [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['passenger', 'driver']),
  body('phone').trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const { name, email, password, role, phone } = req.body

    let user = await User.findOne({ email })
    if (user) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    user = new User({ name, email, password, role, phone })
    await user.save()

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    )

    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const { email, password } = req.body
    const user = await User.findOne({ email })
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    )

    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router

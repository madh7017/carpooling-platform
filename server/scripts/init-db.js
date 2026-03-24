#!/usr/bin/env node
/**
 * Database Initialization Script
 * This script initializes MongoDB with indexes for optimal performance
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Ride = require('./src/models/Ride');
const Booking = require('./src/models/Booking');

async function initializeDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');

    // Create indexes
    console.log('\nCreating indexes...');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    console.log('✓ User email index created');

    // Ride indexes (already defined in schema)
    console.log('✓ Ride indexes created');

    // Booking indexes
    await Booking.collection.createIndex({ ride: 1, passenger: 1 }, { unique: true });
    console.log('✓ Booking indexes created');

    console.log('\n✓ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;

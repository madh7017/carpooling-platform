# Backend Setup & Troubleshooting Guide

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Create or update `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your local MongoDB connection:

```env
MONGO_URI=mongodb://localhost:27017/carpooling
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3. Start MongoDB

```bash
# If MongoDB is installed locally
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Start Backend Server

```bash
npm run dev
```

Expected output:

```
✓ MongoDB connected successfully
✓ CarPool Server is running
  URL:        http://localhost:5000
  API:        http://localhost:5000/api
  Health:     http://localhost:5000/api/health
```

## Project Structure

```
server/
├── server.js                 # Entry point
├── .env                      # Environment variables (local)
├── .env.example             # Environment template
├── package.json             # Dependencies
├── src/
│   ├── app.js               # Express app setup (backup)
│   ├── config/
│   │   └── config.js        # Centralized configuration
│   ├── controllers/         # Business logic
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── driverController.js
│   │   └── rideController.js
│   ├── models/              # Database schemas
│   │   ├── User.js
│   │   ├── Ride.js
│   │   └── Booking.js
│   ├── middlewares/         # Express middleware
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── validationMiddleware.js
│   │   └── errorMiddleware.js
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   ├── rideRoutes.js
│   │   ├── bookingRoutes.js
│   │   └── driverRoutes.js
│   ├── services/            # Business logic services
│   ├── utils/               # Helper functions
│   │   ├── asyncHandler.js
│   │   ├── password.js
│   │   ├── jwt.js
│   │   └── errors.js
└── scripts/
    └── init-db.js           # Database initialization
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Rides

- `GET /api/rides` - List all available rides
- `POST /api/rides` - Create a new ride (driver only)
- `GET /api/rides/my` - Get driver's rides
- `GET /api/rides/stats` - Get driver statistics
- `GET /api/rides/earnings` - Get earnings breakdown
- `PATCH /api/rides/:id/complete` - Complete a ride
- `PATCH /api/rides/:id/cancel` - Cancel a ride

### Bookings

- `POST /api/bookings` - Create a booking (passenger only)
- `GET /api/bookings/my` - Get passenger's bookings
- `PATCH /api/bookings/:id/cancel` - Cancel a booking
- `GET /api/bookings/ride/:rideId` - Get ride bookings (driver only)
- `POST /api/bookings/rate/:bookingId` - Rate a passenger

### Drivers

- `GET /api/drivers/earnings` - Get driver earnings

## Key Changes Made

### 1. Route Structure

- **Fixed**: Consolidated routes from `src/routes/` instead of old `routes/`
- Routes now use modern controller-based structure with proper middleware

### 2. Middleware Stack

- **authMiddleware**: Validates JWT tokens
- **roleMiddleware**: Checks user role (passenger/driver)
- **validationMiddleware**: Validates request data with express-validator
- **errorMiddleware**: Consistent error handling

### 3. Error Handling

- Global error handler catches all controller errors
- Specific handling for MongoDB errors, JWT errors, validation errors
- Proper HTTP status codes (400, 401, 403, 404, 500)

### 4. Authentication

- JWT-based authentication with configurable expiration
- Password security with bcryptjs (12 salt rounds)
- User role-based access control

## Troubleshooting

### MongoDB Connection Errors

**Error**: `MongooseError: Cannot connect to MongoDB`

**Solutions**:

1. Check if MongoDB is running:

```bash
mongosh  # Try to connect to MongoDB shell
```

2. Verify MONGO_URI in `.env`:

```bash
# Local MongoDB
MONGO_URI=mongodb://localhost:27017/carpooling

# MongoDB Atlas (Cloud)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/carpooling?retryWrites=true&w=majority
```

3. Start MongoDB if using local installation:

```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Port Already in Use

**Error**: `Error: listen EADDRINUSE :::5000`

**Solution**:

```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use a different port
PORT=5001 npm run dev
```

### Invalid JWT Secret

**Error**: `JsonWebTokenError: secret must be a string`

**Solution**:
Ensure JWT_SECRET is set in `.env`:

```bash
JWT_SECRET=your_super_secret_key_min_32_characters_long
```

### CORS Errors in Frontend

**Error**: `Access to XMLHttpRequest from frontend blocked by CORS`

**Solution**:
Update CORS_ORIGIN in `.env` to match your frontend URL:

```bash
# Development
CORS_ORIGIN=http://localhost:5173

# Production
CORS_ORIGIN=https://yourdomain.com
```

### Missing Routes or Controllers

**Error**: `Cannot find module '../routes/...'` or `Cannot find module '../controllers/...'`

**Solution**:

1. Verify all files exist in `src/routes/` and `src/controllers/`
2. Check file names (case-sensitive on Linux):
   - `authRoutes.js` (not `auth.js` or `authroutes.js`)
   - Check imports match exact file paths

3. Verify exports in controller files:

```javascript
exports.functionName = asyncHandler(async (req, res) => {
  // Function body
});
```

## Development Best Practices

### 1. Using Async/Await

Always wrap async operations with `asyncHandler`:

```javascript
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});
```

### 2. Error Handling

Throw errors with statusCode for proper handling:

```javascript
const error = new Error('User not found');
error.statusCode = 404;
throw error;
```

### 3. Validation

Use express-validator for request validation:

```javascript
router.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Min 6 chars'),
  ],
  runValidation,
  controller
);
```

### 4. Authentication

Always check req.user from authMiddleware:

```javascript
exports.getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ passenger: req.user.id });
  res.json(bookings);
});
```

## Testing Endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"password123","role":"passenger"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get rides
curl http://localhost:5000/api/rides

# Health check
curl http://localhost:5000/api/health
```

### Using Postman

1. Import the included Postman collection
2. Set base URL to `http://localhost:5000`
3. After login, add token to Authorization header:
   - Type: Bearer Token
   - Token: (paste JWT token from login response)

## Performance Optimization

### Database Indexes

Run the initialization script to create optimal indexes:

```bash
node scripts/init-db.js
```

### Query Optimization

- Use `.lean()` for read-only queries
- Use `.select()` to limit fields
- Add pagination to list endpoints

Example:

```javascript
const rides = await Ride.find(query)
  .select('source destination dateTime pricePerSeat')
  .lean()
  .skip((page - 1) * limit)
  .limit(limit);
```

### Caching

For frequently accessed data, consider adding Redis:

```bash
npm install redis
```

## Production Deployment

### Environment Setup

```bash
NODE_ENV=production
JWT_SECRET=very-long-random-string-at-least-32-chars
MONGO_URI=mongodb+srv://production-cluster...
CORS_ORIGIN=https://yourdomain.com
PORT=5000
```

### Server Optimization

```bash
npm install --production
NODE_ENV=production npm start
```

### Monitoring

- Use PM2 for process management
- Set up error tracking (Sentry)
- Monitor database performance
- Log all requests and errors

## Support & Help

For issues or questions:

1. Check logs: `npm run dev` output
2. Check MongoDB: `mongosh`
3. Verify .env configuration
4. Check network requests in browser DevTools
5. Review error messages for specific issues

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Lint JavaScript
npm run lint

# Fix linting errors
npm run lint:fix

# Initialize database
node scripts/init-db.js
```

---

**Version**: 1.0.0-fixed
**Last Updated**: February 2026

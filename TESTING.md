# Testing Guide

This guide helps you verify that the CarPool Platform is working correctly.

## Prerequisites

1. **MongoDB** is running (local or MongoDB Atlas)
2. **Node.js** environment properly configured
3. Both backend and frontend are started
4. Ports 5000 (backend) and 5173 (frontend) are available

## Quick Startup (Windows)

```bash
# Run the batch script to start both services
start-all.bat
```

## Quick Startup (Mac/Linux)

```bash
# Run the shell script to start both services
chmod +x start-all.sh
./start-all.sh
```

## Manual Startup

### Terminal 1: Start Backend

```bash
cd server
npm run dev
# Should see: "✅ Server running on port 5000"
```

### Terminal 2: Start Frontend

```bash
cd client
npm run dev
# Should see: "VITE v5.0.8 ...ready in XXX ms"
```

## Health Check

### Backend Health

```bash
curl http://localhost:5000
# Expected: Server is running message
```

### Frontend

```
Open http://localhost:5173 in your browser
```

## API Testing - Using curl

### 1. Register a New User (Passenger)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "passenger"
  }'
```

Expected response:

```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "john@example.com",
    "role": "passenger"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Save the token from response:

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Create a Ride (As Driver)

First, register a driver:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "password123",
    "role": "driver"
  }'
```

Login and save the driver token:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "password123"
  }'
```

Create a ride:

```bash
DRIVER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:5000/api/rides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -d '{
    "source": {
      "address": "Times Square NYC",
      "latitude": 40.7580,
      "longitude": -73.9855
    },
    "destination": {
      "address": "Grand Central Terminal",
      "latitude": 40.7527,
      "longitude": -73.9772
    },
    "dateTime": "2024-01-15T10:00:00Z",
    "pricePerSeat": 25,
    "availableSeats": 4
  }'
```

### 4. Search for Rides (As Passenger)

```bash
PASSENGER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl "http://localhost:5000/api/rides?from=Times%20Square&to=Grand%20Central" \
  -H "Authorization: Bearer $PASSENGER_TOKEN"
```

### 5. Book a Ride

```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PASSENGER_TOKEN" \
  -d '{
    "rideId": "RIDE_ID_HERE",
    "seatsBooked": 2
  }'
```

Replace `RIDE_ID_HERE` with actual ride ID from search results.

### 6. View My Bookings

```bash
curl http://localhost:5000/api/bookings/my \
  -H "Authorization: Bearer $PASSENGER_TOKEN"
```

### 7. Cancel a Booking

```bash
curl -X PATCH http://localhost:5000/api/bookings/BOOKING_ID/cancel \
  -H "Authorization: Bearer $PASSENGER_TOKEN"
```

## API Testing - Using Postman

1. **Create a new Postman collection** called "CarPool API"

2. **Set variables** at collection level:
   - `baseUrl`: `http://localhost:5000/api`
   - `token`: Will be set after login

3. **Create requests** for each endpoint

### Postman Request Example: Login

- **Method**: POST
- **URL**: `{{baseUrl}}/auth/login`
- **Headers**:
  - `Content-Type: application/json`
- **Body** (raw JSON):
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Tests** tab (auto-save token):
  ```javascript
  if (pm.response.code === 200) {
    pm.environment.set('token', pm.response.json().token);
  }
  ```

### Postman Request Example: Create Ride

- **Method**: POST
- **URL**: `{{baseUrl}}/rides`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- **Body** (raw JSON):
  ```json
  {
    "source": {
      "address": "Times Square NYC",
      "latitude": 40.758,
      "longitude": -73.9855
    },
    "destination": {
      "address": "Grand Central Terminal",
      "latitude": 40.7527,
      "longitude": -73.9772
    },
    "dateTime": "2024-01-15T10:00:00Z",
    "pricePerSeat": 25,
    "availableSeats": 4
  }
  ```

## Frontend Testing Walkthrough

### 1. Register as Passenger

1. Open http://localhost:5173
2. Click "Don't have an account? Register"
3. Fill form:
   - Name: John Passenger
   - Email: john@example.com
   - Password: password123
   - Role: Passenger
4. Click Register
5. Should redirect to Passenger Dashboard

### 2. Create a Test Ride (As Driver)

1. In another browser window/incognito, go to http://localhost:5173
2. Register as driver:
   - Name: Jane Driver
   - Email: jane@example.com
   - Password: password123
   - Role: Driver
3. Click "Create Ride"
4. Fill in:
   - From: Times Square
   - To: Grand Central
   - Date/Time: Tomorrow 10:00 AM
   - Seats: 4
   - Price: $25
5. Click Create
6. Should see ride in Driver Dashboard

### 3. Search and Book (As Passenger)

1. Switch to passenger window
2. Click "Search Rides"
3. Enter "Times Square" to "Grand Central"
4. Click Search
5. Find the ride you created
6. Click Book
7. Select number of seats and book
8. Check "My Bookings" to confirm

## Common Issues & Fixes

### Issue: "Cannot connect to MongoDB"

**Solution**:

```bash
# Check if MongoDB is running
# For local MongoDB:
mongod

# For MongoDB Atlas:
# Update MONGO_URI in server/.env with your connection string
```

### Issue: "JWT verification failed"

**Cause**: Token expired or invalid
**Solution**: Logout and login again to get a new token

### Issue: "CORS error"

**Cause**: Frontend on different port than expected
**Solution**: Check `server/.env` has correct `CORS_ORIGIN`

### Issue: "Invalid email format"

**Cause**: Email validation in backend
**Solution**: Use proper email format: `user@domain.com`

### Issue: Port already in use

**For Backend (5000)**:

```bash
# On Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

# On Mac/Linux
lsof -i :5000
```

**For Frontend (5173)**:

```bash
# On Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess

# On Mac/Linux
lsof -i :5173
```

## Database Inspection

### Connect to MongoDB

```bash
# Local MongoDB
mongo

# MongoDB Atlas (if using cloud)
# Use MongoDB Compass or Atlas UI
```

### View Collections

```mongodb
# In MongoDB shell
use carpooling_db
show collections
db.users.find()
db.rides.find()
db.bookings.find()
```

## Performance Testing

### Load Testing with ApacheBench

```bash
# Install (on Windows with WSL or use Apache)
ab -n 100 -c 10 http://localhost:5000

# -n 100: 100 requests
# -c 10: 10 concurrent connections
```

### Check Network Timing

In browser DevTools (F12):

- **Network tab**: See request/response times
- **Performance tab**: Timeline of page load
- **Console**: Check for JavaScript errors

## Success Criteria

✅ All tests passed if:

- [ ] Backend starts without errors
- [ ] Frontend loads on http://localhost:5173
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Driver can create a ride
- [ ] Passenger can search rides
- [ ] Passenger can book a ride
- [ ] Can view booked rides
- [ ] API responds with proper error messages
- [ ] Database stores data correctly

## Next Steps

Once everything is working:

1. **Review Error Handling**: Try invalid inputs and verify proper error messages
2. **Test Authorization**: Try accessing driver-only routes as passenger
3. **Check Validation**: Try incomplete ride creation and check validation messages
4. **Performance**: Load test with multiple concurrent users
5. **Edge Cases**: Try canceling rides, rating drivers, etc.

## Getting Help

Refer to:

- `server/BACKEND_SETUP.md` - Backend API documentation
- `README.md` - Project overview
- `DEPLOYMENT.md` - Production setup
- Browser DevTools (F12) - For frontend debugging
- Server logs - Check terminal output for errors

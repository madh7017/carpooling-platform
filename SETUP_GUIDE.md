# CarPool Platform - Complete Setup Guide

## Prerequisites

- Node.js 16+ installed
- MongoDB 4.4+ running locally or Atlas connection
- Git (optional)

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
# Install all dependencies
node install.js

# Or manually:
cd client && npm install
cd ../server && npm install
```

### 2. Setup Environment Variables

Create `.env` file in `/server`:

```env
MONGO_URI=mongodb://localhost:27017/carpooling
JWT_SECRET=your_secure_secret_key_change_this
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

### 3. Start MongoDB

**Windows (if installed locally):**
```bash
mongod
```

**Using MongoDB Atlas (Cloud):**
- Create account at https://www.mongodb.com/cloud/atlas
- Get connection string
- Update `MONGO_URI` in `.env`

### 4. Start Backend

```bash
cd server
npm run dev
# Server should run on http://localhost:5000
```

### 5. Start Frontend (new terminal)

```bash
cd client
npm run dev
# App should run on http://localhost:5173
```

## Troubleshooting

### Error: "Failed to load resource: 500 (Internal Server Error)"

**Causes & Solutions:**

1. **MongoDB not running**
   ```bash
   # Check if MongoDB is running
   mongod
   
   # If using Atlas, verify MONGO_URI in .env
   ```

2. **Wrong connection string**
   ```bash
   # Test connection
   mongosh "mongodb://localhost:27017/carpooling"
   ```

3. **JWT_SECRET not set**
   ```bash
   # Make sure .env has:
   JWT_SECRET=your_secure_key
   ```

4. **Port 5000 already in use**
   ```bash
   # Find process using port 5000
   lsof -i :5000  # Mac/Linux
   netstat -ano | findstr :5000  # Windows
   
   # Kill process or change PORT in .env
   ```

### Error: "net::ERR_FILE_NOT_FOUND" for Extensions

This is a Chrome extension error, not your app. It's safe to ignore.

### API Endpoints Returning 404

1. **Check server is running:**
   ```bash
   curl http://localhost:5000/api/health
   # Should return: {"status":"Server is running",...}
   ```

2. **Check routes exist:**
   - `/api/auth/register` - POST
   - `/api/auth/login` - POST
   - `/api/rides/search` - GET

3. **Check CORS is enabled:**
   Verify in `server.js` has `cors()` middleware

### Cannot Connect to MongoDB

```bash
# Test local MongoDB connection
mongosh

# Test Atlas connection
mongosh "mongodb+srv://user:password@cluster.mongodb.net/carpooling"
```

### Port Already in Use

```bash
# Linux/Mac - Kill process
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows - Use Task Manager or:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## File Structure

```
carpooling-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # Auth context
│   │   ├── services/       # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                 # Express backend
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   ├── server.js           # Main server file
│   ├── .env                # Environment variables
│   └── package.json
│
└── README.md
```

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# View logs
npm run dev -- --debug

# Check MongoDB connection
mongosh
```

## Testing the API

Use Postman or curl:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Doe",
    "email":"john@example.com",
    "password":"password123",
    "role":"passenger",
    "phone":"+1234567890"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"john@example.com",
    "password":"password123"
  }'

# Health check
curl http://localhost:5000/api/health
```

## Production Deployment

1. **Build frontend:**
   ```bash
   cd client
   npm run build
   ```

2. **Set production env vars:**
   ```bash
   NODE_ENV=production
   JWT_SECRET=strong_secure_key
   MONGO_URI=your_atlas_uri
   ```

3. **Start server:**
   ```bash
   cd server
   npm start
   ```

## Support

- Check logs for detailed errors
- Verify all ports are accessible
- Ensure MongoDB is running
- Check network connectivity

Happy coding! 🚗

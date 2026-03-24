# CarPool India

Trajectory-based carpool ride matching platform built with a React frontend, an Express/MongoDB backend, and real-time ride collaboration features.

The project supports the full ride-sharing flow: user registration, ride creation, ride search, booking, ride sharing links, live notifications, in-app chat, voice calling, support requests, safety check-ins, SOS escalation, and admin moderation tools.

## What This Project Includes

- Single account system for passengers and drivers
- Ride discovery with source, destination, date, seat, and sort filters
- Driver ride creation with licence, vehicle, and emergency details
- Passenger booking flow with safety contact details
- Driver and passenger dashboards
- Booking management, cancellation, check-in, and ratings
- Shareable booking/ride links using unique tokens
- Real-time notifications using Server-Sent Events
- In-app chat between ride participants
- In-app voice calling flow for booking participants
- Support request management and SOS safety escalation
- Admin dashboard for users, rides, bookings, analytics, and support tickets
- Demo seed/reset scripts for local testing

## Tech Stack

- Frontend: React 18, Vite, React Router, Axios, Tailwind CSS, Socket.IO client
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, express-validator, CORS
- Tooling: ESLint, Nodemon, Docker, Docker Compose, Nginx

## Repository Layout

```text
carpooling-platform/
|- client/                    React + Vite frontend
|- server/                    Express + MongoDB backend
|- Dockerfile                 Production image build
|- docker-compose.yml         Local container stack
|- start-all.bat              Start frontend + backend on Windows
|- start-all.sh               Start frontend + backend on Linux/macOS
|- SETUP_GUIDE.md             Detailed setup notes
|- DEVELOPMENT.md             Development workflow notes
|- DEPLOYMENT.md              Deployment guide
|- TESTING.md                 Testing guidance
|- PROJECT_REPORT.md          Project report
`- *_DIAGRAM.md               Architecture and UML-style documentation
```

## Core Frontend Pages

- `/` Home page
- `/login` and `/register` authentication
- `/search-rides` ride search
- `/ride/:rideId` ride details and booking
- `/share/:token` shared ride/booking page
- `/dashboard` shared authenticated dashboard
- `/passenger-dashboard` passenger summary
- `/create-ride` driver ride creation
- `/my-bookings` passenger bookings
- `/driver/ride/:rideId/bookings` driver booking management
- `/support` support request page
- `/admin` admin dashboard

## Core Backend API Areas

- `/api/auth` register, login, current user
- `/api/rides` create rides, search rides, driver ride history, stats, earnings
- `/api/bookings` create bookings, list bookings, cancel, check-in, ratings
- `/api/chat` booking-based chat messages
- `/api/calls` voice-call signaling
- `/api/support` support ticket creation and listing
- `/api/passengers` passenger dashboard data
- `/api/drivers` driver dashboard and earnings data
- `/api/admin` admin overview and moderation actions
- `/api/stream` live notification event stream
- `/api/share` token-based shared booking/ride access
- `/api/health` health check endpoint

## Prerequisites

- Node.js `>=16`
- npm `>=8`
- MongoDB running locally or a MongoDB Atlas connection string

## Quick Start

### 1. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Create environment files

Backend:

```bash
cd server
copy .env.example .env
```

Frontend:

```bash
cd client
copy .env.example .env.local
```

On macOS/Linux, replace `copy` with `cp`.

### 3. Update backend environment values

`server/.env`

```env
MONGO_URI=mongodb://localhost:27017/carpooling
JWT_SECRET=replace_with_a_secure_secret_at_least_32_characters
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=debug
```

Optional admin setup:

```env
ADMIN_EMAILS=your-admin@email.com
```

If you want multiple allowed frontend origins:

```env
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,https://your-frontend-domain.com
```

### 4. Update frontend environment values

`client/.env.local`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=CarPool Platform
VITE_APP_VERSION=1.0.0
VITE_PUBLIC_APP_URL=http://localhost:5173
VITE_NODE_ENV=development
VITE_ENABLE_ANALYTICS=false
```

`VITE_PUBLIC_APP_URL` is important for copied share links. If you are testing on phones or other devices over LAN, set it to your machine's LAN URL, for example `http://192.168.0.3:5173`.

### 5. Start the backend

```bash
cd server
npm run dev
```

Backend runs at `http://localhost:5000`.

### 6. Start the frontend

```bash
cd client
npm run dev
```

Frontend runs at `http://localhost:5173`.

## One-Command Startup Helpers

Windows:

```bash
start-all.bat
```

Linux/macOS:

```bash
chmod +x start-all.sh
./start-all.sh
```

## Available Scripts

### Frontend

```bash
cd client
npm run dev
npm run build
npm run preview
npm run lint
```

### Backend

```bash
cd server
npm run dev
npm start
npm run lint
npm run lint:fix
npm run seed:south
npm run seed:reset-demo
```

Notes:

- `seed:south` seeds example South India ride data
- `seed:reset-demo` recreates demo-friendly data for testing flows
- `npm test` is currently a placeholder and does not run automated tests

## Environment Variables Reference

### Backend

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: secret used to sign login tokens
- `JWT_EXPIRES_IN`: token lifetime, default `7d`
- `PORT`: API server port, default `5000`
- `NODE_ENV`: app environment, usually `development` or `production`
- `CORS_ORIGIN`: one or more allowed frontend origins separated by commas
- `ADMIN_EMAILS`: comma-separated list of emails that should get admin access
- `RATE_LIMIT_WINDOW_MS`: request window used by config
- `RATE_LIMIT_MAX_REQUESTS`: request limit used by config
- `LOG_LEVEL`: backend logging verbosity

### Frontend

- `VITE_API_BASE_URL`: API base URL, usually `http://localhost:5000/api`
- `VITE_APP_NAME`: display app name
- `VITE_APP_VERSION`: app version label
- `VITE_PUBLIC_APP_URL`: public frontend base URL used to build share links
- `VITE_NODE_ENV`: frontend environment label
- `VITE_ENABLE_ANALYTICS`: analytics toggle placeholder

## Real-Time and Safety Features

- Live notifications are delivered through `/api/stream` using Server-Sent Events
- Booking creation, cancellation, support updates, ride updates, check-ins, and chat events are pushed in real time
- Share links are generated with `shareToken` values stored on bookings
- Voice calling uses a signaling flow exposed through `/api/calls`
- SOS actions create urgent safety support requests for admins
- Browsers usually allow microphone access on `localhost` or HTTPS; plain HTTP on LAN may block voice calling

## Admin Access

1. Add one or more email addresses to `ADMIN_EMAILS` in `server/.env`
2. Restart the backend
3. Register or log in with that email
4. Open `/admin`

Admin routes are protected by authentication plus admin middleware.

## Local Network Testing

If you want to open the app on another device on the same Wi-Fi network:

1. Find your machine's LAN IP address
2. Set `client/.env.local` so `VITE_PUBLIC_APP_URL` points to that LAN URL
3. Add the same LAN origin to `server/.env` in `CORS_ORIGIN`
4. Restart both frontend and backend

Example:

```env
# client/.env.local
VITE_PUBLIC_APP_URL=http://192.168.0.3:5173

# server/.env
CORS_ORIGIN=http://localhost:5173,http://192.168.0.3:5173
```

For smoother LAN viewing of the frontend:

```bash
cd client
npm run build
npm run preview -- --host
```

## Docker

The repository includes:

- `Dockerfile` for building a production image
- `docker-compose.yml` for MongoDB, the backend server, and Nginx
- `nginx.conf` for reverse proxy setup
- `render.yaml` for Render deployment configuration

Basic compose startup:

```bash
docker compose up --build
```

Important note: the current compose file focuses on MongoDB, the backend, and Nginx. For a complete deployment walkthrough, see `DEPLOYMENT.md`.

## Project Data Model

Main MongoDB models:

- `User`: identity, role, phone, vehicle/licence details, emergency contacts, admin flag, rating, eco score
- `Ride`: driver, source, destination, datetime, duration, price per seat, available seats, ride status
- `Booking`: ride, passenger, booked seats, safety details, share token, check-in time, booking status, ratings
- `ChatMessage`: booking-scoped chat
- `SupportRequest`: issue reporting and admin follow-up

## Additional Documentation

- `SETUP_GUIDE.md`
- `DEVELOPMENT.md`
- `DEPLOYMENT.md`
- `TESTING.md`
- `BACKEND_SETUP.md`
- `PROJECT_REPORT.md`
- `QUICK_REFERENCE.md`
- `SYSTEM_ARCHITECTURE.md`
- `CLASS_DIAGRAM.md`
- `SEQUENCE_DIAGRAM.md`
- `ACTIVITY_DIAGRAM.md`
- `USECASE_DIAGRAM.md`
- `WORKFLOW_DIAGRAM.md`
- `DEPLOYMENT_DIAGRAM.md`
- `PRESENTATION_ARCHITECTURE.md`

## Troubleshooting

### Backend exits immediately on startup

Make sure `server/.env` exists and includes valid `MONGO_URI` and `JWT_SECRET` values. The backend intentionally stops if either is missing.

### MongoDB connection fails

- Confirm MongoDB is running locally, or
- Replace `MONGO_URI` with a valid Atlas connection string

### Frontend cannot talk to backend

- Check `VITE_API_BASE_URL`
- Confirm the backend is running on port `5000`
- Confirm `CORS_ORIGIN` includes your frontend origin

### Share links open on the wrong host

Update `VITE_PUBLIC_APP_URL` and restart the frontend.

### Voice calling does not get microphone access

Use `localhost` during development or deploy the app over HTTPS.

## Current State

This repository contains a working full-stack project with extensive documentation and development helpers, but automated test coverage is not wired into `npm test` yet. For evaluation, demo, or presentation use, the seed/reset scripts and diagram documents are already included in the repo.

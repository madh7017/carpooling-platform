# CarPool India

Full-stack carpooling platform built with React, Vite, Express, and MongoDB. The application supports ride creation, ride discovery, bookings, share links, live notifications, in-app chat, voice-call signaling, support tickets, safety check-ins, SOS escalation, and admin moderation.

## Overview

This repository contains:

- `client/`: React 18 + Vite single-page application
- `server/`: Express + MongoDB API server
- seed scripts for realistic demo data
- startup helpers for Windows and Linux/macOS
- deployment and architecture documentation

The current implementation uses a shared account model for normal users: once authenticated, a user can create rides and also book rides. There is a legacy `role` field in the user model and the demo seeds still label users as drivers or passengers, but the main ride creation and booking routes are currently protected by authentication rather than strict role enforcement. Admin access is the only strongly separated permission level.

## Features

- Email/password registration and login with JWT auth
- Public ride search with filters for route, date, price, and seats
- Authenticated ride creation with licence, vehicle, and emergency-contact details
- Ride detail view with booking flow and passenger safety details
- Passenger booking management with cancellation and check-in
- Driver-facing ride management, booking visibility, stats, and earnings views
- Shareable booking links using a unique token
- Real-time updates through Server-Sent Events
- Booking-scoped chat between ride participants
- Voice-call signaling between booking participants
- Support request flow for users and admin follow-up
- SOS escalation path for urgent safety issues
- Admin dashboard for users, rides, bookings, support, and moderation
- Demo reset and South India seed scripts for presentations and manual testing

## Tech Stack

- Frontend: React 18, Vite, React Router, Axios, Tailwind CSS
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, express-validator, CORS
- Tooling: ESLint, Nodemon, Docker, Docker Compose, Nginx

## Project Structure

```text
carpooling-platform/
|- client/
|  |- src/
|  |  |- api/              API client helpers
|  |  |- components/       Shared UI and protected-route components
|  |  |- context/          Auth, notifications, toasts, and call state
|  |  |- pages/            App screens
|  |  `- utils/            Formatters, validators, share helpers
|  |- .env.example
|  `- package.json
|- server/
|  |- scripts/             Demo-data seed/reset scripts
|  |- src/
|  |  |- controllers/      Route handlers
|  |  |- middlewares/      Auth, admin, validation, error handling
|  |  |- models/           Mongoose models
|  |  |- routes/           API routes
|  |  `- utils/            JWT, password, admin, stream helpers
|  |- .env.example
|  `- package.json
|- docker-compose.yml
|- start-all.bat
|- start-all.sh
`- README.md
```

## Frontend Routes

Implemented routes in `client/src/App.jsx`:

- `/`: home page
- `/login`: login
- `/register`: registration
- `/search-rides`: search and filter rides
- `/ride/:rideId`: ride details and booking
- `/share/:token`: shared booking view
- `/dashboard`: authenticated dashboard
- `/admin`: admin dashboard
- `/passenger-dashboard`: passenger summary page
- `/driver-dashboard`: redirects to `/create-ride`
- `/create-ride`: create a ride
- `/my-bookings`: passenger bookings
- `/driver/ride/:rideId/bookings`: driver view of bookings for a ride
- `/support`: support request page

## Backend API

Mounted in `server/server.js`:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/rides`
- `GET /api/rides/search`
- `GET /api/rides/:id`
- `POST /api/rides`
- `GET /api/rides/my`
- `GET /api/rides/stats`
- `GET /api/rides/earnings`
- `PATCH /api/rides/:id/complete`
- `PATCH /api/rides/:id/cancel`
- `POST /api/bookings`
- `GET /api/bookings`
- `GET /api/bookings/my`
- `PATCH /api/bookings/:id/cancel`
- `POST /api/bookings/:id/check-in`
- `GET /api/bookings/ride/:rideId`
- `POST /api/bookings/:id/rate`
- `POST /api/bookings/rate/:bookingId`
- `GET /api/chat/:bookingId`
- `POST /api/chat/:bookingId`
- `POST /api/calls/:bookingId/start`
- `POST /api/calls/:bookingId/answer`
- `POST /api/calls/:bookingId/ice`
- `POST /api/calls/:bookingId/end`
- `GET /api/support`
- `POST /api/support`
- `GET /api/drivers/dashboard`
- `GET /api/drivers/earnings`
- `GET /api/passengers/dashboard`
- `GET /api/admin/overview`
- `GET /api/admin/users`
- `GET /api/admin/rides`
- `GET /api/admin/bookings`
- `GET /api/admin/support`
- `PATCH /api/admin/users/:id/admin`
- `DELETE /api/admin/users/:id`
- `PATCH /api/admin/rides/:id/cancel`
- `PATCH /api/admin/bookings/:id/cancel`
- `PATCH /api/admin/support/:id`
- `GET /api/stream?token=JWT_TOKEN`
- `GET /api/share/:token`
- `GET /api/health`

## Data Model

Primary MongoDB models:

- `User`: profile, phone, emergency details, vehicle/licence details, password hash, rating, eco score, optional admin flag
- `Ride`: driver, source, destination, departure time, estimated duration, fare, seats, ride status
- `Booking`: ride, passenger, seats, safety details, share token, check-in timestamp, booking status, rating state
- `ChatMessage`: booking-scoped chat history
- `SupportRequest`: user issue reports with admin review status and notes

## Prerequisites

- Node.js `>=16`
- npm `>=8`
- MongoDB local instance or MongoDB Atlas connection string

## Local Setup

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

### 3. Configure backend environment

`server/.env`

```env
MONGO_URI=mongodb://localhost:27017/carpooling
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=debug
```

Optional:

```env
ADMIN_EMAILS=your-admin@email.com
```

### 4. Configure frontend environment

`client/.env.local`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=CarPool Platform
VITE_APP_VERSION=1.0.0
VITE_PUBLIC_APP_URL=http://192.168.0.3:5173
VITE_NODE_ENV=development
VITE_ENABLE_ANALYTICS=false
```

`VITE_PUBLIC_APP_URL` is used when building share links. For same-machine development you can set it to `http://localhost:5173`.

### 5. Start the backend

```bash
cd server
npm run dev
```

Backend URL: `http://localhost:5000`

### 6. Start the frontend

```bash
cd client
npm run dev
```

Frontend URL: `http://localhost:5173`

## One-Command Startup

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

Frontend:

```bash
cd client
npm run dev
npm run build
npm run preview
npm run lint
```

Backend:

```bash
cd server
npm run dev
npm start
npm run lint
npm run lint:fix
npm run seed:south
npm run seed:reset-demo
npm run seed:month-traffic
```

Notes:

- `npm test` in the backend is currently a placeholder and exits with an error
- `seed:south` inserts South India-themed demo users, rides, bookings, and chat data
- `seed:reset-demo` clears app data and recreates a broader demo dataset with admin/support examples
- `seed:month-traffic` generates a heavier 30-day traffic dataset for demos, dashboards, and pagination testing

## Demo Credentials

If you run one of the demo seed scripts, common demo logins include:

- Admin: `carpooladmin.madhu@gmail.com` / `Pass@123`
- Driver-style seed user: `arjun@southcarpool.test` / `Pass@123`
- Passenger-style seed user: `lakshmi@southcarpool.test` / `Pass@123`
- High-volume traffic seed admin: `admin@trafficcarpool.test` / `Pass@123`

The seeded data uses a shared password of `Pass@123`. The admin email can also come from `ADMIN_EMAILS` in `server/.env`.

## Account Model Notes

- Normal users authenticate once and can both create rides and book rides
- The code still contains a `role` field and seed labels such as `driver` and `passenger`
- Current route protection for main ride and booking flows is auth-based, not role-based
- Admin routes require both authentication and admin authorization

## Real-Time, Sharing, and Safety

- Live notifications are delivered with Server-Sent Events through `/api/stream`
- Booking creation, booking cancellation, support submissions, call signaling, and related updates can trigger live events
- Share links use booking `shareToken` values and resolve through `/api/share/:token`
- Voice calls are implemented as signaling endpoints; browser media permissions still apply on the client
- Safety flows include emergency-contact collection, booking check-ins, support categories, and SOS escalation

## Admin Access

To access `/admin`:

1. Add one or more emails to `ADMIN_EMAILS` in `server/.env`, or use the seeded admin account.
2. Restart the backend.
3. Register or log in with that email.
4. Open `/admin`.

## Local Network Testing

If you want to open the frontend on another device on the same Wi-Fi network:

1. Set `client/.env.local` so `VITE_PUBLIC_APP_URL` points to your LAN URL.
2. Add the same origin to `CORS_ORIGIN` in `server/.env`.
3. Restart both services.

Example:

```env
# client/.env.local
VITE_PUBLIC_APP_URL=http://192.168.0.3:5173

# server/.env
CORS_ORIGIN=http://localhost:5173,http://192.168.0.3:5173
```

In development, the backend also allows common private-network origins and ngrok origins.

## Docker

The repository includes:

- `docker-compose.yml`
- `Dockerfile`
- `nginx.conf`
- `render.yaml`

Basic startup:

```bash
docker compose up --build
```

The compose file starts:

- MongoDB on `27017`
- the backend on `5000`
- Nginx on `80`

## Limitations and Current Notes

- Automated test coverage is not wired into a working `npm test` flow
- Some older docs and legacy files still mention separate driver/passenger roles more strongly than the current runtime behavior
- There are legacy route/controller files alongside the newer `server/src/*` implementation; the running server uses the `server/src/routes/*` modules from `server/server.js`

## Additional Documentation

- `SETUP_GUIDE.md`
- `DEVELOPMENT.md`
- `TESTING.md`
- `DEPLOYMENT.md`
- `PROJECT_REPORT.md`
- `QUICK_REFERENCE.md`
- `*_DIAGRAM.md`

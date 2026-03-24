# System Architecture Diagram

This diagram reflects the current implementation in this repository: React + Vite frontend, Express + Node.js backend, MongoDB persistence, JWT auth, and Server-Sent Events for booking/check-in updates.

For a cleaner slide-friendly version, see [PRESENTATION_ARCHITECTURE.md](PRESENTATION_ARCHITECTURE.md).

```mermaid
flowchart TD
    U[Users<br/>Passenger / Driver] --> F[React Frontend<br/>Vite SPA]

    subgraph Frontend["Client Layer"]
        F --> R[React Router Pages<br/>Home, Login, Register,<br/>Search, Ride Detail, Dashboards]
        F --> A[Auth Context<br/>Token + User Session]
        F --> X[Axios API Client<br/>Auth Header + 401 Handling]
        F --> S[Share Ride Page<br/>Public token-based access]
    end

    X -->|REST /api/*| B
    A -->|GET /api/auth/me| B
    F -->|SSE /api/stream?token=JWT| E
    S -->|GET /api/share/:token| B

    subgraph Backend["Server Layer - Node.js / Express"]
        B[Express App / API Gateway]
        B --> M1[CORS + JSON Parsing + Request Logging]
        B --> M2[Auth Middleware<br/>JWT Verification]
        B --> M3[Role Middleware<br/>Driver / Passenger Access]
        B --> M4[Validation Middleware<br/>express-validator]

        B --> C1[Auth Controller]
        B --> C2[Ride Controller]
        B --> C3[Booking Controller]
        B --> C4[Driver / Passenger Controllers]
        B --> C5[Chat Controller]
        B --> E[Stream Route + Stream Manager]
    end

    C1 --> U1[User Model]
    C2 --> R1[Ride Model]
    C3 --> B1[Booking Model]
    C3 --> R1
    C3 --> U1
    C4 --> U1
    C4 --> R1
    C4 --> B1
    C5 --> CMSG[ChatMessage Model]
    C5 --> B1
    E -->|booking_created / booking_cancelled / checkin_update| F

    subgraph Data["Data Layer"]
        DB[(MongoDB)]
        U1[User]
        R1[Ride]
        B1[Booking]
        CMSG[ChatMessage]
    end

    U1 --> DB
    R1 --> DB
    B1 --> DB
    CMSG --> DB

    subgraph CoreFlows["Primary Flows"]
        P1[Authentication<br/>register / login / me]
        P2[Ride Management<br/>search / create / complete / cancel]
        P3[Booking Lifecycle<br/>book / cancel / check-in / rate]
        P4[Sharing & Messaging<br/>public share link + booking chat]
    end

    C1 --> P1
    C2 --> P2
    C3 --> P3
    C5 --> P4
```

## Component Summary

- `client/` provides the SPA UI, route navigation, auth state, and API calls.
- `server/server.js` is the live backend entry point and wires routes, MongoDB, CORS, and SSE streaming.
- `server/src/routes/` exposes auth, rides, bookings, drivers, passengers, chat, stream, and share APIs.
- `server/src/controllers/` contains business logic for ride search, booking lifecycle, dashboards, ratings, and chat.
- `server/src/models/` stores the core domain entities: `User`, `Ride`, `Booking`, and `ChatMessage`.
- `server/src/utils/streamManager.js` pushes real-time booking/check-in events to connected clients using Server-Sent Events.

## High-Level Request Flow

1. A passenger or driver uses the React app in the browser.
2. The frontend calls Express APIs with Axios and attaches the JWT from local storage.
3. Express validates input, authenticates the user, checks role permissions, and runs controller logic.
4. Controllers read/write MongoDB through Mongoose models.
5. For booking events, the backend also emits SSE updates through the stream manager to active clients.
6. Public share links bypass login and fetch booking details through `/api/share/:token`.

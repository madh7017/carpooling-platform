# Presentation-Style Architecture Diagram

This version is simplified for presentations, viva, reports, and slides. It focuses on the main system blocks and user-facing flow instead of low-level implementation details.

```mermaid
flowchart LR
    %% Presentation-style system architecture
    classDef users fill:#FFF3C4,stroke:#C98A00,color:#3A2A00,stroke-width:2px;
    classDef client fill:#DFF3E4,stroke:#2E8B57,color:#123524,stroke-width:2px;
    classDef server fill:#DDEBFF,stroke:#2B6CB0,color:#102A43,stroke-width:2px;
    classDef data fill:#FFE3E3,stroke:#C53030,color:#4A1F1F,stroke-width:2px;
    classDef realtime fill:#F4E1FF,stroke:#7B2CBF,color:#31124A,stroke-width:2px;
    classDef public fill:#E6FFFB,stroke:#0F766E,color:#083344,stroke-width:2px;

    U[Passenger and Driver]:::users --> C[Web Application<br/>React + Vite]:::client

    C --> F1[Authentication<br/>Login / Register]:::client
    C --> F2[Ride Search and Booking]:::client
    C --> F3[Driver Dashboard<br/>Create and Manage Rides]:::client
    C --> F4[Passenger Dashboard<br/>Bookings and Ratings]:::client

    C --> API[Backend API<br/>Node.js + Express]:::server

    API --> A1[Auth and Access Control<br/>JWT + Role Checks]:::server
    API --> A2[Ride Management Module]:::server
    API --> A3[Booking and Safety Module]:::server
    API --> A4[Chat and Share Module]:::server

    A1 --> DB[(MongoDB Database)]:::data
    A2 --> DB
    A3 --> DB
    A4 --> DB

    API --> RT[Real-Time Update Channel<br/>Server-Sent Events]:::realtime
    RT --> C

    API --> SH[Public Share Link<br/>Trip Status by Token]:::public
```

## Slide-Friendly Explanation

- Users interact with a single web application built using React and Vite.
- The frontend sends requests to an Express backend that handles authentication, rides, bookings, dashboards, chat, and sharing.
- MongoDB stores all persistent data such as users, rides, bookings, and chat messages.
- Server-Sent Events provide lightweight real-time updates for booking, cancellation, and check-in changes.
- Public share links allow trip information to be viewed without logging in.

## Suggested Caption

**Figure: High-level system architecture of the CarPool platform showing users, frontend, backend services, MongoDB storage, and real-time updates.**

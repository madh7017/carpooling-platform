# Activity Diagram

This activity diagram is based on the implemented flow of the CarPool project. It focuses on the passenger ride-booking lifecycle and the related driver actions.

```mermaid
flowchart TD
    classDef start fill:#E6FFFA,stroke:#0F766E,color:#083344,stroke-width:2px;
    classDef action fill:#EFF6FF,stroke:#2563EB,color:#1E3A8A,stroke-width:1.5px;
    classDef decision fill:#FEF3C7,stroke:#D97706,color:#78350F,stroke-width:1.5px;
    classDef end fill:#FCE7F3,stroke:#BE185D,color:#831843,stroke-width:2px;

    A([Start]):::start --> B[Passenger opens ride details]:::action
    B --> C[Passenger enters seats and safety details]:::action
    C --> D[System validates booking request]:::action
    D --> E{Valid input?}:::decision

    E -->|No| F[Show booking validation error]:::action
    F --> Z([End]):::end

    E -->|Yes| G[System checks duplicate confirmed booking]:::action
    G --> H{Already booked?}:::decision
    H -->|Yes| I[Show duplicate booking error]:::action
    I --> Z

    H -->|No| J[System checks active ride and seat availability]:::action
    J --> K{Seats available?}:::decision
    K -->|No| L[Show ride unavailable or insufficient seats error]:::action
    L --> Z

    K -->|Yes| M[Reduce available seats]:::action
    M --> N[Create booking with share token and check-in timestamp]:::action
    N --> O[Confirm booking to passenger]:::action
    O --> P[Notify passenger and driver through SSE]:::action

    P --> Q{Passenger continues trip?}:::decision
    Q -->|Cancels booking| R[Restore seats and mark booking cancelled]:::action
    R --> S[Notify passenger and driver of cancellation]:::action
    S --> Z

    Q -->|Travels| T[Passenger performs safety check-in]:::action
    T --> U[System updates lastCheckInAt]:::action
    U --> V[Driver completes ride]:::action
    V --> W[System marks ride and confirmed bookings as completed]:::action
    W --> X[Passenger rates driver and driver rates passenger]:::action
    X --> Y([Trip completed]):::end
```

## Short Explanation

- The activity begins when a passenger opens ride details and submits a booking request.
- The system validates the input, checks for duplicate confirmed bookings, and verifies ride seat availability.
- If all conditions pass, the system reduces available seats, creates the booking, and sends real-time notifications.
- After booking, the passenger may either cancel the trip or continue with safety check-in and trip completion.
- At the end of the ride, both passenger and driver can submit ratings.

## Suggested Report Caption

**Figure: Activity diagram of the CarPool platform showing the booking lifecycle from ride selection to trip completion and rating.**

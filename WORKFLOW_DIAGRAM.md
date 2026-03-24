# Workflow Diagram For Report

This workflow diagram is designed for reports and documentation. It shows the main user journey through the CarPool platform in a clean, high-level format.

```mermaid
flowchart TD
    classDef start fill:#E6FFFA,stroke:#0F766E,color:#083344,stroke-width:2px;
    classDef step fill:#EFF6FF,stroke:#2563EB,color:#1E3A8A,stroke-width:1.5px;
    classDef decision fill:#FEF3C7,stroke:#D97706,color:#78350F,stroke-width:1.5px;
    classDef end fill:#FCE7F3,stroke:#BE185D,color:#831843,stroke-width:2px;

    A([Start]):::start --> B[User opens CarPool web application]:::step
    B --> C[User registers or logs in]:::step
    C --> D{Select role}:::decision

    D -->|Driver| E[Driver creates ride<br/>source, destination, date, seats, price]:::step
    E --> F[Ride is stored in system<br/>and becomes available for search]:::step

    D -->|Passenger| G[Passenger searches available rides]:::step
    F --> G
    G --> H[Passenger views ride details]:::step
    H --> I{Ride suitable?}:::decision
    I -->|No| G
    I -->|Yes| J[Passenger enters booking and safety details]:::step
    J --> K[Booking is confirmed<br/>available seats are reduced]:::step

    K --> L[Driver views booked passengers]:::step
    L --> M[Passenger and driver communicate if needed<br/>using chat or share link]:::step
    M --> N[Passenger performs trip check-in]:::step
    N --> O[Ride is completed by driver]:::step
    O --> P[Passenger and driver submit ratings]:::step
    P --> Q([Trip completed successfully]):::end
```

## Short Explanation

- The process begins when a user accesses the CarPool application and authenticates.
- Drivers publish rides, while passengers search and select matching rides.
- After booking, the system updates seat availability and supports safety tracking and communication.
- Once the trip is completed, both sides can provide ratings and feedback.

## Suggested Report Caption

**Figure: Workflow of the CarPool platform from login and ride creation to booking, trip completion, and rating.**

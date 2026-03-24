# Use Case Diagram

This use case diagram is designed for reports and project documentation. It summarizes how the main actors interact with the CarPool system.

```mermaid
flowchart LR
    classDef actor fill:#FEF3C7,stroke:#D97706,color:#78350F,stroke-width:2px;
    classDef usecase fill:#EFF6FF,stroke:#2563EB,color:#1E3A8A,stroke-width:1.5px;
    classDef system fill:#F8FAFC,stroke:#64748B,color:#0F172A,stroke-width:2px;

    P[Passenger]:::actor
    D[Driver]:::actor
    V[Public Viewer]:::actor

    subgraph S["CarPool System"]
        UC1((Register)):::usecase
        UC2((Login)):::usecase
        UC3((Search Rides)):::usecase
        UC4((View Ride Details)):::usecase
        UC5((Book Ride)):::usecase
        UC6((Manage My Bookings)):::usecase
        UC7((Check In For Trip)):::usecase
        UC8((Rate Driver)):::usecase

        UC9((Create Ride)):::usecase
        UC10((Manage My Rides)):::usecase
        UC11((View Passenger Bookings)):::usecase
        UC12((Complete Or Cancel Ride)):::usecase
        UC13((Rate Passenger)):::usecase

        UC14((Chat During Booking)):::usecase
        UC15((View Shared Trip Link)):::usecase
        UC16((View Dashboard)):::usecase
    end

    P --> UC1
    P --> UC2
    P --> UC3
    P --> UC4
    P --> UC5
    P --> UC6
    P --> UC7
    P --> UC8
    P --> UC14
    P --> UC16

    D --> UC1
    D --> UC2
    D --> UC9
    D --> UC10
    D --> UC11
    D --> UC12
    D --> UC13
    D --> UC14
    D --> UC16

    V --> UC15
```

## Short Explanation

- `Passenger` can register, log in, search rides, view ride details, book seats, manage bookings, check in, chat, view dashboard data, and rate drivers.
- `Driver` can register, log in, create rides, manage rides, view passengers for a ride, complete or cancel rides, chat, view dashboard data, and rate passengers.
- `Public Viewer` can access a shared trip link without logging in.

## Suggested Report Caption

**Figure: Use case diagram of the CarPool platform showing the interactions of Passenger, Driver, and Public Viewer with the system.**

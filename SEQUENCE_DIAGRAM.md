# Sequence Diagram

This sequence diagram is tailored to the current implementation of this repository. It reflects the actual ride-booking flow used in the CarPool platform, including JWT authentication, duplicate-booking checks, seat updates, booking creation, and SSE notifications.

```mermaid
sequenceDiagram
    autonumber
    actor Passenger
    participant Frontend as React Frontend
    participant API as Express API
    participant Auth as authMiddleware
    participant UserDB as User Model
    participant BookingDB as Booking Model
    participant RideDB as Ride Model
    participant Stream as SSE Stream Manager
    participant PassengerUI as Passenger Bookings Page
    participant DriverUI as Driver Bookings Page

    Passenger->>Frontend: Open ride detail page
    Frontend->>API: GET /api/rides/:rideId
    API->>RideDB: findById(rideId)
    RideDB-->>API: ride + driver info
    API-->>Frontend: ride details

    Passenger->>Frontend: Enter seats + passengerDetails and click Book Now
    Frontend->>API: POST /api/bookings\nAuthorization: Bearer token

    API->>Auth: Verify JWT and attach req.user
    Auth->>UserDB: findById(decoded.id)
    UserDB-->>Auth: user(name, email, role)
    Auth-->>API: req.user available

    API->>BookingDB: findOne({ ride, passenger, status:"confirmed" })
    BookingDB-->>API: existing booking or null

    alt Duplicate confirmed booking exists
        API-->>Frontend: 400 You already booked this ride
    else No duplicate booking
        API->>RideDB: findOneAndUpdate({ _id, status:"active", availableSeats >= seats }, { $inc: { availableSeats: -seats } })
        RideDB-->>API: updated ride or null

        alt Ride unavailable or insufficient seats
            API-->>Frontend: 400 Ride not available or not enough seats
        else Ride updated successfully
            API->>BookingDB: create({ ride, passenger, seatsBooked, passengerDetails, shareToken, lastCheckInAt, status:"confirmed" })
            BookingDB-->>API: booking created

            API-->>Frontend: 201 Booking successful

            par Real-time passenger update
                API->>Stream: sendToUsers(passengerId, "booking_created", payload)
                Stream-->>PassengerUI: SSE booking_created
            and Real-time driver update
                API->>Stream: sendToUsers(driverId, "booking_created", payload)
                Stream-->>DriverUI: SSE booking_created
            end
        end
    end
```

## Short Explanation

- The passenger first loads the ride details using `GET /api/rides/:rideId`.
- When the passenger books a ride, the request goes through `authMiddleware`, which validates the JWT and loads the current user from the database.
- The backend checks whether the passenger already has a confirmed booking for the same ride.
- If no duplicate exists, the system atomically reduces `availableSeats` using `Ride.findOneAndUpdate(...)`.
- After the ride is successfully updated, the system creates the booking with `shareToken`, `passengerDetails`, and `lastCheckInAt`.
- Finally, the backend returns success and emits a `booking_created` event through the SSE stream manager to both passenger and driver clients.

## Suggested Report Caption

**Figure: Exact sequence diagram of the CarPool ride-booking process based on the implemented frontend, Express API, MongoDB models, authentication middleware, and SSE notifications.**

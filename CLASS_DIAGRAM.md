# Class Diagram

This class diagram is based on the actual data model used in the CarPool project. It reflects the Mongoose schemas and their relationships in the backend.

```mermaid
classDiagram
    class User {
        +String name
        +String email
        +String password
        +String role
        +Number rating
        +Number ratingCount
        +Number ecoScore
        +Date createdAt
        +Date updatedAt
    }

    class Location {
        +String address
        +Number lat
        +Number lng
    }

    class Ride {
        +ObjectId driver
        +Location source
        +Location destination
        +Date dateTime
        +Number pricePerSeat
        +Number availableSeats
        +String status
        +Date createdAt
        +Date updatedAt
    }

    class PassengerDetails {
        +String phone
        +String emergencyContactName
        +String emergencyContactPhone
        +String note
    }

    class Booking {
        +ObjectId ride
        +ObjectId passenger
        +Number seatsBooked
        +PassengerDetails passengerDetails
        +String shareToken
        +Date lastCheckInAt
        +String status
        +Number rating
        +Boolean ratingGiven
        +Date createdAt
        +Date updatedAt
    }

    class ChatMessage {
        +ObjectId booking
        +ObjectId sender
        +String senderRole
        +String message
        +Date createdAt
        +Date updatedAt
    }

    User "1" <-- "many" Ride : creates
    User "1" <-- "many" Booking : books
    Ride "1" <-- "many" Booking : contains
    Booking "1" <-- "many" ChatMessage : has
    User "1" <-- "many" ChatMessage : sends
    Ride *-- Location : source
    Ride *-- Location : destination
    Booking *-- PassengerDetails : passengerDetails
```

## Short Explanation

- `User` represents both passengers and drivers, distinguished by the `role` field.
- `Ride` stores trip information created by a driver, including source, destination, date, fare, seat count, and status.
- `Booking` connects a passenger with a ride and stores safety details, booking status, rating data, and share token.
- `ChatMessage` stores messages exchanged between the passenger and driver for a specific booking.
- `Location` and `PassengerDetails` are embedded structures used inside `Ride` and `Booking`.

## Suggested Report Caption

**Figure: Class diagram of the CarPool platform showing the core backend entities and their relationships.**

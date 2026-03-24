# Deployment Diagram

This deployment diagram is based on the deployment setup present in this repository, including Docker Compose, Nginx reverse proxy, Express backend, and MongoDB database.

```mermaid
flowchart LR
    classDef user fill:#FEF3C7,stroke:#D97706,color:#78350F,stroke-width:2px;
    classDef edge fill:#E0F2FE,stroke:#0284C7,color:#0C4A6E,stroke-width:2px;
    classDef app fill:#EDE9FE,stroke:#7C3AED,color:#3B0764,stroke-width:2px;
    classDef data fill:#DCFCE7,stroke:#16A34A,color:#14532D,stroke-width:2px;
    classDef config fill:#FEE2E2,stroke:#DC2626,color:#7F1D1D,stroke-width:2px;

    U[User Browser]:::user

    subgraph ClientSide["Client Side"]
        B1[React Frontend<br/>Built with Vite]:::app
    end

    subgraph ServerSide["Deployment Server / Container Network"]
        N[Nginx Reverse Proxy<br/>Port 80]:::edge
        S[Node.js + Express API<br/>Port 5000]:::app
        M[(MongoDB<br/>Port 27017)]:::data
        E[Environment Variables<br/>MONGO_URI, JWT_SECRET,<br/>CORS_ORIGIN, NODE_ENV]:::config
    end

    U -->|HTTP/HTTPS| N
    N -->|Serves static frontend| B1
    N -->|Proxies /api requests| S
    S -->|Reads/Writes data| M
    E --> S

    subgraph OptionalCloud["Optional Cloud Deployment"]
        C1[Render / Cloud Node Service]:::app
        C2[(MongoDB Atlas / External MongoDB)]:::data
    end

    U -.->|HTTPS| C1
    C1 -.->|MONGO_URI| C2
```

## Short Explanation

- The user accesses the system through a browser.
- In containerized deployment, `Nginx` acts as the entry point and reverse proxy.
- Static frontend files are served to the browser, while API requests are forwarded to the `Node.js + Express` backend.
- The backend connects to `MongoDB` for storing users, rides, bookings, and chat messages.
- Runtime behavior is controlled through environment variables such as `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, and `NODE_ENV`.
- The repository also includes a cloud deployment option where the Node service can run on Render and connect to an external MongoDB instance like MongoDB Atlas.

## Suggested Report Caption

**Figure: Deployment diagram of the CarPool platform showing browser access, Nginx reverse proxy, Express backend, MongoDB database, and optional cloud deployment.**

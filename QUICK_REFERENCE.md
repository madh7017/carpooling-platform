# Quick Reference Guide

## 🎯 The 30-Second Setup

**Windows:**

```bash
# Terminal 1: Setup Backend
cd server && npm install && npm run dev

# Terminal 2: Setup Frontend
cd client && npm install && npm run dev
```

**Mac/Linux:**

```bash
# Do both in one go
cd server && npm install && npm run dev &
cd client && npm install && npm run dev
```

---

## 🚀 Common Commands

| Task                    | Command                                |
| ----------------------- | -------------------------------------- |
| **Start Backend**       | `cd server && npm run dev`             |
| **Start Frontend**      | `cd client && npm run dev`             |
| **Build Frontend**      | `cd client && npm run build`           |
| **Fix Code Issues**     | `npm run lint:fix`                     |
| **Initialize Database** | `cd server && node scripts/init-db.js` |
| **Both Windows**        | `start-all.bat`                        |
| **Both Mac/Linux**      | `./start-all.sh`                       |

---

## 🔗 URLs

| Service               | Address                                 |
| --------------------- | --------------------------------------- |
| **Frontend**          | http://localhost:5173                   |
| **Backend API**       | http://localhost:5000                   |
| **MongoDB (Default)** | mongodb://localhost:27017/carpooling_db |

---

## 🧪 Test API (copy & paste)

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"pass123","role":"passenger"}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

### Create Ride (requires Bearer token)

Save token from login response, then:

```bash
curl -X POST http://localhost:5000/api/rides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "source":{"address":"Start","latitude":40.7580,"longitude":-73.9855},
    "destination":{"address":"End","latitude":40.7527,"longitude":-73.9772},
    "dateTime":"2024-01-15T10:00:00Z",
    "pricePerSeat":25,
    "availableSeats":4
  }'
```

---

## 📁 Important Files

| Path                              | Purpose                  |
| --------------------------------- | ------------------------ |
| `server/.env`                     | Backend configuration    |
| `client/.env.local`               | Frontend configuration   |
| `server/src/routes/`              | API endpoint definitions |
| `server/src/controllers/`         | Business logic           |
| `server/src/models/`              | Database schemas         |
| `client/src/api/api.js`           | Frontend API client      |
| `client/src/auth/AuthContext.jsx` | Authentication state     |

---

## ✅ Verification Checklist

```
[ ] Node.js v16+ installed
[ ] npm installed
[ ] MongoDB running (local or Atlas)
[ ] Dependencies installed (npm install)
[ ] .env files configured
[ ] Backend starts without errors
[ ] Frontend loads in browser
[ ] Can register & login
[ ] Can complete quick test
```

---

## 🔧 Environment Variables

### Backend (`server/.env`)

```
MONGO_URI=mongodb://localhost:27017/carpooling_db
JWT_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`client/.env.local`)

```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🐛 Troubleshooting

| Problem                     | Solution                            |
| --------------------------- | ----------------------------------- |
| "Cannot connect to MongoDB" | Start MongoDB: `mongod`             |
| "Port already in use"       | Change PORT in .env or kill process |
| "Module not found"          | Run `npm install`                   |
| "CORS error"                | Check CORS_ORIGIN in server/.env    |
| "Frontend shows errors"     | Clear cache: `Ctrl+Shift+Del`       |
| "Token expired"             | Logout and login again              |

---

## 📚 Documentation

- **Full Setup**: See [CHECKLIST.md](CHECKLIST.md)
- **Testing APIs**: See [TESTING.md](TESTING.md)
- **What Changed**: See [IMPROVEMENTS.md](IMPROVEMENTS.md)
- **Deploy to Production**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Architecture Diagram**: See [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)
- **Presentation Diagram**: See [PRESENTATION_ARCHITECTURE.md](PRESENTATION_ARCHITECTURE.md)
- **Workflow Diagram**: See [WORKFLOW_DIAGRAM.md](WORKFLOW_DIAGRAM.md)
- **Use Case Diagram**: See [USECASE_DIAGRAM.md](USECASE_DIAGRAM.md)
- **Sequence Diagram**: See [SEQUENCE_DIAGRAM.md](SEQUENCE_DIAGRAM.md)
- **Class Diagram**: See [CLASS_DIAGRAM.md](CLASS_DIAGRAM.md)
- **Activity Diagram**: See [ACTIVITY_DIAGRAM.md](ACTIVITY_DIAGRAM.md)
- **Deployment Diagram**: See [DEPLOYMENT_DIAGRAM.md](DEPLOYMENT_DIAGRAM.md)
- **Project Overview**: See [README.md](README.md)
- **Backend Details**: See [server/BACKEND_SETUP.md](server/BACKEND_SETUP.md)

---

## 💡 Pro Tips

1. **Hot Reload**: Nodemon watches changes automatically
2. **VS Code**: Install recommended extensions for better experience
3. **Debug**: Use F12 in browser, check terminal logs
4. **Testing**: Use Postman for API testing with saved tokens
5. **Development**: Make changes, files auto-reload without manual restart

---

_Save this page as your quick reference!_

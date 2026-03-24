# Development Guide

## Project Structure

```
carpooling-platform/
├── client/                    # React frontend
│   ├── src/
│   │   ├── api/              # API client configuration
│   │   ├── auth/             # Authentication context
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── context/          # React context
│   │   ├── App.jsx           # Root app component
│   │   └── main.jsx          # Entry point
│   ├── .env.example          # Environment template
│   ├── .env.local            # Local environment config (git ignored)
│   └── vite.config.js        # Vite configuration
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── middlewares/      # Express middlewares
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utilities
│   ├── routes/               # Legacy routes (being migrated)
│   ├── .env.example          # Environment template
│   ├── .env                  # Local environment config (git ignored)
│   └── server.js             # Entry point
│
├── .gitignore                # Git ignore rules
├── README.md                 # Project overview
├── SETUP_GUIDE.md           # Installation instructions
└── DEVELOPMENT.md           # This file
```

## Development Workflow

### 1. Environment Setup

#### Client Setup
```bash
cd client
cp .env.example .env.local
# Edit .env.local with your settings
npm install
npm run dev
# App runs at http://localhost:5173
```

#### Server Setup
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
# Server runs at http://localhost:5000
```

### 2. Code Style & Linting

#### Frontend
```bash
cd client
npm run lint      # Run ESLint
npm run build     # Create production build
```

#### Backend
Currently no linter configured. Consider adding:
```bash
npm install --save-dev eslint
npx eslint --init
```

### 3. Git Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: description of changes"
   ```

3. Push and create a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

## Authentication Flow

1. **Registration**: User provides name, email, password, and role (passenger/driver)
   - Email must be unique
   - Password is hashed with bcryptjs (12 salt rounds)
   - JWT token is returned

2. **Login**: User provides email and password
   - Credentials are validated
   - JWT token is returned and stored in localStorage
   - User role is the same as stored

3. **Protected Routes**: All authenticated endpoints require Bearer token
   - Token is attached to requests via axios interceptor
   - Invalid/expired tokens redirect to login

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user

### Rides
- `GET /api/rides` - List all rides
- `POST /api/rides` - Create a ride (driver only)
- `GET /api/rides/:id` - Get ride details
- `PUT /api/rides/:id` - Update ride (driver only)
- `DELETE /api/rides/:id` - Delete ride (driver only)

### Bookings
- `GET /api/bookings` - List user's bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Cancel booking

### Users/Drivers
- `GET /api/drivers/:id` - Get driver profile
- `GET /api/passengers/:id` - Get passenger profile

## Key Technical Decisions

### Frontend
- **React 18**: Modern UI with hooks and suspense support
- **React Router v6**: Latest routing with data loaders
- **Tailwind CSS**: Utility-first styling
- **Axios**: Promise-based HTTP client with interceptors
- **Vite**: Fast build tool and dev server

### Backend
- **Express.js**: Lightweight, widely-used web framework
- **MongoDB**: NoSQL database for flexible data modeling
- **Mongoose**: Schema validation and ODM
- **JWT**: Stateless authentication
- **bcryptjs**: Secure password hashing

## Common Development Tasks

### Add a New Route

1. Create controller in `server/src/controllers/`
2. Add validation rules
3. Create route in `server/src/routes/`
4. Update API client in `client/src/api/`

### Add a New Component

1. Create `.jsx` file in `client/src/components/`
2. Export from component file
3. Import in parent component
4. Use in JSX

### Running Tests

Currently no test suite is configured. To add:

**Backend:**
```bash
npm install --save-dev jest supertest
npx jest --init
```

**Frontend:**
```bash
npm install --save-dev vitest @testing-library/react
```

## Troubleshooting

### API Not Responding (CORS Error)
- Check server is running on port 5000
- Verify CORS_ORIGIN in server .env matches client URL
- Check axios baseURL in client/src/api/api.js

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Check JWT_SECRET in server .env
- Verify token format in Authorization header

### Database Connection Issues
- Ensure MongoDB is running
- Check MONGO_URI format
- Test connection in MongoDB compass or shell

### Build Errors
- Delete node_modules and package-lock.json
- Run `npm install` again
- Check Node.js version (should be 16+)

## Performance Tips

1. **Frontend**
   - Use React.memo for expensive components
   - Implement lazy loading for routes
   - Optimize images
   - Use CSS grid/flex instead of manual positioning

2. **Backend**
   - Add database indexing for frequently queried fields
   - Implement pagination for list endpoints
   - Use lean() queries when you only need data
   - Cache frequently accessed data

3. **General**
   - Monitor network requests browser DevTools
   - Use production builds for testing
   - Enable gzip compression in Express

## Useful Commands

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter

# Backend
npm run dev          # Start with nodemon
npm start            # Start production server
npm test             # Run tests (when configured)
```

## Contributing Guidelines

1. Follow existing code style
2. Add comments for complex logic
3. Update documentation when adding features
4. Test changes before committing
5. Keep commits small and focused

## Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Documentation](https://vitejs.dev)

## Questions or Issues?

- Check existing documentation
- Review similar implementations in codebase
- Add comments to questions in code

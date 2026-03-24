import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@context/AuthContext'
import { NotificationProvider } from '@context/NotificationContext'
import { ToastProvider } from '@context/ToastContext'
import { CallProvider } from '@context/CallContext'
import ProtectedRoute from '@components/ProtectedRoute'
import Navbar from '@components/Navbar'
import Login from '@pages/Login'
import Register from '@pages/Register'
import Home from '@pages/Home'
import SearchRides from '@pages/SearchRides'
import RideDetail from '@pages/RideDetail'
import Dashboard from '@pages/Dashboard'
import AdminPage from '@pages/AdminPage'
import PassengerDashboard from '@pages/PassengerDashboard'
import CreateRide from '@pages/CreateRide'
import MyBookings from '@pages/MyBookings'
import ShareRide from '@pages/ShareRide'
import DriverRideBookings from '@pages/DriverRideBookings'
import SupportPage from '@pages/SupportPage'
import SOSButton from '@components/SOSButton'

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <CallProvider>
              <div className="app-shell">
                <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/search-rides" element={<SearchRides />} />
                  <Route path="/ride/:rideId" element={<RideDetail />} />
                  <Route path="/share/:token" element={<ShareRide />} />

                  <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/passenger-dashboard" element={<PassengerDashboard />} />
                    <Route path="/driver-dashboard" element={<Navigate to="/create-ride" replace />} />
                    <Route path="/my-bookings" element={<MyBookings />} />
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/create-ride" element={<CreateRide />} />
                    <Route path="/driver/ride/:rideId/bookings" element={<DriverRideBookings />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                <SOSButton />
              </div>
            </CallProvider>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}

export default App

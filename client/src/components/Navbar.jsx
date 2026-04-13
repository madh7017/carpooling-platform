import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { useEffect, useState } from 'react'
import NotificationBell from '@components/NotificationBell'

const NavLink = ({ to, children, onClick, badgeCount = 0 }) => (
  <Link
    to={to}
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-blue-700"
  >
    {children}
    {badgeCount > 0 && (
      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
        {badgeCount}
      </span>
    )}
  </Link>
)

const Navbar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openSupportCount, setOpenSupportCount] = useState(0)
  const isLandingPage = location.pathname === '/'

  useEffect(() => {
    if (!user?.isAdmin) {
      setOpenSupportCount(0)
      return
    }

    let isMounted = true

    const fetchOpenSupportCount = async () => {
      try {
        const response = await axios.get('/api/admin/overview', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          timeout: 30000,
        })

        if (!isMounted) return
        setOpenSupportCount(response.data?.stats?.unreadSupportRequests || response.data?.stats?.openSupportRequests || 0)
      } catch {
        if (!isMounted) return
        setOpenSupportCount(0)
      }
    }

    fetchOpenSupportCount()

    const handleRefresh = () => {
      fetchOpenSupportCount()
    }
    window.addEventListener('support-badge-refresh', handleRefresh)

    return () => {
      isMounted = false
      window.removeEventListener('support-badge-refresh', handleRefresh)
    }
  }, [user?.isAdmin, location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="container-main py-3">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-content-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-extrabold text-white shadow-sm">
              CP
            </div>
            <div className="hidden sm:block">
              <p className="font-display text-lg font-bold text-slate-900">CarPool India</p>
              <p className="-mt-1 text-xs text-slate-500">Smart intercity ride sharing</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {!user ? (
              <>
                {!isLandingPage && (
                  <>
                    <Link to="/login" className="btn-secondary btn-sm">Login</Link>
                    <Link to="/register" className="btn-primary btn-sm">Register</Link>
                  </>
                )}
              </>
            ) : (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                {user.isAdmin && <NavLink to="/admin" badgeCount={openSupportCount}>Admin</NavLink>}
                {!user.isAdmin && <NavLink to="/search-rides">Find Rides</NavLink>}
                {!user.isAdmin && <NavLink to="/support">Support</NavLink>}
                <NotificationBell />
                <div className="ml-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <button onClick={handleLogout} className="btn-danger btn-sm">
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="animate-slide-up mt-3 space-y-2 border-t border-slate-200 pt-3 md:hidden">
            {!user ? (
              <>
                {!isLandingPage && (
                  <>
                    <NavLink to="/login" onClick={() => setIsMenuOpen(false)}>Login</NavLink>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)} className="btn-primary w-full justify-center">Register</Link>
                  </>
                )}
              </>
            ) : (
              <>
                <NavLink to="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</NavLink>
                {user.isAdmin && <NavLink to="/admin" onClick={() => setIsMenuOpen(false)} badgeCount={openSupportCount}>Admin</NavLink>}
                {!user.isAdmin && <NavLink to="/search-rides" onClick={() => setIsMenuOpen(false)}>Find Rides</NavLink>}
                {!user.isAdmin && <NavLink to="/support" onClick={() => setIsMenuOpen(false)}>Support</NavLink>}
                <div className="px-1 py-2">
                  <NotificationBell onNavigate={() => setIsMenuOpen(false)} />
                </div>
                <button onClick={handleLogout} className="btn-danger w-full justify-center">
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

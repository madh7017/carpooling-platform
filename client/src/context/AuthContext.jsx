import { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      validateToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  const validateToken = async (token) => {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUser(response.data.user)
      setError(null)
    } catch (err) {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const register = async (userDataOrName, email, password) => {
    const userData =
      typeof userDataOrName === 'object'
        ? userDataOrName
        : { name: userDataOrName, email, password }

    try {
      const response = await axios.post('/api/auth/register', userData)
      localStorage.setItem('token', response.data.token)
      setUser(response.data.user)
      setError(null)
      return response.data
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
      throw err
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      localStorage.setItem('token', response.data.token)
      setUser(response.data.user)
      setError(null)
      return response.data
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setError(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

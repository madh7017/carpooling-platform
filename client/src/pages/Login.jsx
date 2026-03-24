import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '@components/Alert'
import { useAuth } from '@context/AuthContext'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      setLoading(true)
      await login(formData.email, formData.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card shadow-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-blue-600">
              <span className="text-3xl font-semibold text-white" aria-hidden="true">
                CP
              </span>
            </div>
            <h1 className="heading-3 mb-2">Welcome Back</h1>
            <p className="text-muted">Sign in to your CarPool account</p>
          </div>

          {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="form-group">
              <label className="label">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.in"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <div className="mb-2 flex items-center justify-between">
                <label className="label m-0">Password</label>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                  Forgot?
                </a>
              </div>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className="mt-6 w-full btn-primary py-3">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <div className="spinner"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-600">Don&apos;t have an account?</span>
            </div>
          </div>

          <Link to="/register" className="w-full btn btn-outline justify-center py-2.5">
            Create New Account
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          By continuing, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:underline">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  )
}

export default Login

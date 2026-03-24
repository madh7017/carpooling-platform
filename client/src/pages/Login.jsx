import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@context/AuthContext";
import Alert from "@components/Alert";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      await login(formData.email, formData.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚗</span>
            </div>
            <h1 className="heading-3 mb-2">Welcome Back</h1>
            <p className="text-muted">Sign in to your CarPool account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              type="danger"
              message={error}
              onClose={() => setError("")}
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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
              <div className="flex justify-between items-center mb-2">
                <label className="label m-0">Password</label>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                  Forgot?
                </a>
              </div>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 mt-6"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <div className="spinner"></div>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-600">Don't have an account?</span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className="w-full btn btn-outline justify-center py-2.5"
          >
            Create New Account
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 mt-6 text-sm">
          By continuing, you agree to our{" "}
          <a href="#" className="text-primary-600 hover:underline">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;

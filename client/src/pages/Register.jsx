import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@context/AuthContext";
import Alert from "@components/Alert";
import { isValidName, isValidPhone } from "@utils/validators";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value, allValues = formData) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Full name is required";
        if (value.trim().length < 2) return "Full name must be at least 2 characters";
        if (!isValidName(value)) return "Enter a real full name";
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email";
        return "";
      case "phone":
        if (!value.trim()) return "Phone number is required";
        if (!isValidPhone(value)) return "Enter a valid phone number";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return "";
      case "confirmPassword":
        if (!value) return "Confirm your password";
        if (value !== allValues.password) return "Passwords do not match";
        return "";
      default:
        return "";
    }
  };

  const validateAll = (values) => {
    const nextErrors = {};
    Object.keys(values).forEach((key) => {
      const message = validateField(key, values[key], values);
      if (message) nextErrors[key] = message;
    });
    return nextErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      const message = validateField(name, value, next);
      setFieldErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
      if (name === "password" || name === "confirmPassword") {
        const confirmMessage = validateField("confirmPassword", next.confirmPassword, next);
        setFieldErrors((prevErrors) => ({ ...prevErrors, confirmPassword: confirmMessage }));
      }
      return next;
    });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const message = validateField(name, value, formData);
    if (message && value.trim()) {
      setFormData((prev) => ({ ...prev, [name]: "" }));
    }
    setFieldErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationErrors = validateAll(formData);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">CP</span>
            </div>
            <h1 className="heading-3 mb-2">Create Account</h1>
            <p className="text-muted">Join once, then book rides or create them from your dashboard.</p>
          </div>

          {error && (
            <Alert type="danger" message={error} onClose={() => setError("")} />
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="form-group">
              <label className="label">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className="input-field"
                required
                disabled={loading}
              />
              {fieldErrors.name && <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>}
            </div>

            <div className="form-group">
              <label className="label">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.in"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className="input-field"
                required
                disabled={loading}
              />
              {fieldErrors.email && <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>}
            </div>

            <div className="form-group">
              <label className="label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className="input-field"
                required
                disabled={loading}
              />
              {fieldErrors.phone && <p className="text-sm text-red-600 mt-1">{fieldErrors.phone}</p>}
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className="input-field"
                required
                disabled={loading}
              />
              {fieldErrors.password && <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>}
            </div>

            <div className="form-group">
              <label className="label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className="input-field"
                required
                disabled={loading}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 mt-6"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <div className="spinner"></div>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-600">Already a member?</span>
            </div>
          </div>

          <Link to="/login" className="w-full btn btn-outline justify-center py-2.5">
            Sign In Instead
          </Link>
        </div>

        <p className="text-center text-gray-600 mt-6 text-sm">
          By creating an account, you agree to our{" "}
          <a href="#" className="text-primary-600 hover:underline">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../prototype.css";
import { authService } from "../services/apiService";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await authService.register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
      });

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.email?.[0] || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="auth-card">
        <div className="brand-wrap">
          <div className="brand-mark">S</div>
          <div className="brand-name">Sentra</div>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">
          New accounts start with the Viewer role
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div
              className="demo-note"
              style={{ color: "#ff8f8f", marginTop: 0 }}
            >
              {error}
            </div>
          )}

          <div className="auth-input">
            <label>Full name</label>
            <input
              name="full_name"
              placeholder="Name"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div className="auth-input">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div className="auth-input">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="auth-input">
              <label>Confirm</label>
              <input
                type="password"
                name="confirm_password"
                placeholder="Confirm password"
                value={formData.confirm_password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button className="auth-btn" type="submit">
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <div className="auth-helper">
          <span>Already have an account?</span>

          <Link className="auth-link" to="/login">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";
import { API } from "../config";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin() {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: res.data._id,
        username: res.data.username,
        email: res.data.email,
        bio: res.data.bio,
        interests: res.data.interests,
      }));
      navigate("/communities");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Background glow effects */}
      <div className="login-glow-1" />
      <div className="login-glow-2" />

      <div className="login-card">
        <div className="login-logo">💬</div>
        <h1 className="login-title">Welcome back</h1>
        <p className="login-sub">Sign in to your account</p>

        {error && <div className="error">{error}</div>}

        <label className="label">Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <label className="label">Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button
          onClick={handleLogin}
          className="btn"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="footer">
          Don't have an account?{" "}
          <Link to="/create-profile">Create one</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;

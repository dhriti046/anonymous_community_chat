import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "../styles/Login.css";
import { API } from "../config";

function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleGoogleSuccess(credentialResponse) {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/api/auth/google`, {
        credential: credentialResponse.credential,
      });

      if (res.data.newUser) {
        // New user — send them to profile completion with Google data pre-filled
        navigate("/create-profile", { state: res.data });
        return;
      }

      // Existing user — store token & user, go to rooms
      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: res.data._id,
          username: res.data.username,
          email: res.data.email,
          bio: res.data.bio,
          interests: res.data.interests,
          avatar: res.data.avatar,
        })
      );
      navigate("/communities");
    } catch (err) {
      setError(err?.response?.data?.message || "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleError() {
    setError("Google sign-in was cancelled or failed. Please try again.");
  }

  return (
    <div className="login-page">
      {/* Background glow effects */}
      <div className="login-glow-1" />
      <div className="login-glow-2" />

      <div className="login-card">
        <div className="login-logo">💬</div>
        <h1 className="login-title">Welcome to VeilTalk</h1>
        <p className="login-sub">Anonymous chat for IIT Ropar students</p>

        <div className="login-domain-badge">
          <span className="login-domain-icon">🎓</span>
          <span>Only <strong>@iitrpr.ac.in</strong> accounts allowed</span>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="login-google-wrapper">
          {loading ? (
            <div className="login-loading">Signing you in…</div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="filled_blue"
              size="large"
              shape="rectangular"
              text="signin_with"
              logo_alignment="left"
              width="100%"
            />
          )}
        </div>

        <p className="login-hint">
          First time here? You&apos;ll be guided to set up your profile after signing in.
        </p>
      </div>
    </div>
  );
}

export default Login;

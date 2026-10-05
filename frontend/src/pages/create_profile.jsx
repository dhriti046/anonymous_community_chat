import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "../styles/CreateProfile.css";
import { API } from "../config";

/**
 * CreateProfile is shown after a new user authenticates with Google.
 * The Google data (googleId, email, avatar, name) is passed via router state.
 * If somehow reached directly, we show Google sign-in again.
 */
function CreateProfile() {
  const location = useLocation();
  const navigate = useNavigate();

  // Data forwarded from login.jsx after Google auth
  const googleData = location.state || null;

  const [form, setForm] = useState({
    username: googleData?.name?.split(" ")[0]?.toLowerCase().replace(/\s+/g, "") || "",
    bio: "",
    interests: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingGoogleData, setPendingGoogleData] = useState(googleData);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // If user somehow lands here without Google state, let them sign in again
  async function handleGoogleSuccess(credentialResponse) {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/api/auth/google`, {
        credential: credentialResponse.credential,
      });

      if (!res.data.newUser) {
        // Already registered — just log them in
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
        return;
      }

      // New user — populate state and show form
      setPendingGoogleData(res.data);
      setForm((f) => ({
        ...f,
        username: res.data.name?.split(" ")[0]?.toLowerCase().replace(/\s+/g, "") || "",
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleError() {
    setError("Google sign-in was cancelled or failed. Please try again.");
  }

  async function handleCreate() {
    if (!form.username.trim()) {
      setError("Username is required.");
      return;
    }

    const interestArray = form.interests
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API}/api/auth/complete-profile`, {
        googleId: pendingGoogleData.googleId,
        email: pendingGoogleData.email,
        avatar: pendingGoogleData.avatar,
        username: form.username.trim(),
        bio: form.bio.trim(),
        interests: interestArray,
      });

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
      setError(err?.response?.data?.message || "Profile creation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Render: no google data yet ──────────────────────────────────────────────
  if (!pendingGoogleData) {
    return (
      <div className="create-page">
        <div className="create-glow-1" />
        <div className="create-glow-2" />
        <div className="create-card">
          <div className="create-logo">💬</div>
          <h1 className="create-title">Create your profile</h1>
          <p className="create-sub">Sign in with your IIT Ropar Google account to get started</p>

          <div className="login-domain-badge">
            <span className="login-domain-icon">🎓</span>
            <span>Only <strong>@iitrpr.ac.in</strong> accounts allowed</span>
          </div>

          {error && <div className="create-error">{error}</div>}

          <div className="login-google-wrapper" style={{ marginTop: "2rem" }}>
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
                text="continue_with"
                logo_alignment="left"
                width="100%"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: profile completion form ─────────────────────────────────────────
  return (
    <div className="create-page">
      <div className="create-glow-1" />
      <div className="create-glow-2" />

      <div className="create-card">
        {pendingGoogleData.avatar && (
          <img
            src={pendingGoogleData.avatar}
            alt="Your Google avatar"
            className="create-google-avatar"
          />
        )}
        <h1 className="create-title">Almost there!</h1>
        <p className="create-sub">
          Signed in as <strong>{pendingGoogleData.email}</strong>. Just fill in a few details.
        </p>

        {error && <div className="create-error">{error}</div>}

        <div className="create-field">
          <label className="create-label">Username</label>
          <input
            type="text"
            placeholder="e.g. CampusOwl, TechGeek, NightOwl…"
            value={form.username}
            onChange={set("username")}
            className="create-input"
            required
          />
        </div>

        <div className="create-field">
          <label className="create-label">Bio <span className="create-optional">(optional)</span></label>
          <textarea
            placeholder="Tell people a bit about yourself…"
            value={form.bio}
            onChange={set("bio")}
            className="create-textarea"
          />
        </div>

        <div className="create-field">
          <label className="create-label">Interests <span className="create-optional">(optional)</span></label>
          <input
            placeholder="music, hiking, design, chess…"
            value={form.interests}
            onChange={set("interests")}
            className="create-input"
          />
          <p className="create-hint">Separate interests with commas</p>
        </div>

        <button
          onClick={handleCreate}
          className="create-btn"
          style={{ opacity: loading ? 0.7 : 1 }}
          disabled={loading}
        >
          {loading ? "Creating profile…" : "Create profile →"}
        </button>
      </div>
    </div>
  );
}

export default CreateProfile;

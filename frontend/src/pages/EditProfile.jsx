import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/EditProfile.css";
import { API } from "../config";

function EditProfile() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const [form, setForm] = useState({
    username: currentUser?.username || "",
    bio: currentUser?.bio || "",
    interests: currentUser?.interests?.join(", ") || "",
  });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
  }, [navigate]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSave() {
    const interests = form.interests.split(",").map((i) => i.trim()).filter(Boolean);
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const res = await axios.put(
        `${API}/api/auth/update-profile`,
        { bio: form.bio.trim(), interests },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      const updated = {
        ...currentUser,
        username: res.data.username,
        bio: res.data.bio,
        interests: res.data.interests,
      };
      localStorage.setItem("user", JSON.stringify(updated));
      setMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Update failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="edit-page">
      <nav className="edit-nav">
        <div className="edit-nav-brand" onClick={() => navigate("/discover")}>
          <div className="edit-brand-icon">💬</div>
          YapYap
        </div>
        <button className="edit-btn-back" onClick={() => navigate(-1)}>← Back</button>
      </nav>

      <main className="edit-main">
        <div className="edit-card">
          <h1 className="edit-title">Edit profile</h1>
          <p className="edit-sub">Update your public information</p>

          {msg.text && (
            <div className={msg.type === "success" ? "edit-success" : "edit-error"}>
              {msg.text}
            </div>
          )}

          <div className="edit-field">
            <label className="edit-label">Username</label>
            <input
              value={form.username}
              disabled
              className="edit-input"
              style={{ cursor: "not-allowed", opacity: 0.6 }}
            />
            <p className="edit-hint">Usernames are automatically generated for anonymity and cannot be changed.</p>
          </div>

          <div className="edit-field">
            <label className="edit-label">Bio</label>
            <textarea
              value={form.bio}
              onChange={set("bio")}
              className="edit-textarea"
              placeholder="Tell people about yourself…"
            />
          </div>

          <div className="edit-field">
            <label className="edit-label">Interests</label>
            <input
              value={form.interests}
              onChange={set("interests")}
              className="edit-input"
              placeholder="music, hiking, chess…"
            />
            <p className="edit-hint">Separate with commas</p>
          </div>

          <button
            className="edit-btn-save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default EditProfile;

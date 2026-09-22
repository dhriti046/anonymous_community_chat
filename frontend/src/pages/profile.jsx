import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Avatar from "../components/Avatar";
import "../styles/Profile.css";
import { API } from "../config";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    fetch(`${API}/api/users/${id}`)
      .then((r) => r.json())
      .then(setUser)
      .catch(console.error);
  }, [id]);

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-glow-1" />
        <div className="profile-glow-2" />
        <div className="profile-loading">Loading profile…</div>
      </div>
    );
  }

  const isMe = currentUser?._id === user._id;

  return (
    <div className="profile-page">
      {/* Background glow effects */}
      <div className="profile-glow-1" />
      <div className="profile-glow-2" />

      <nav className="profile-nav">
        <div className="profile-nav-brand" onClick={() => navigate("/discover")}>
          <div className="profile-brand-icon">💬</div>
          YapYap
        </div>
        <button className="profile-btn-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </nav>

      <main className="profile-main">
        <div className="profile-card">
          <div className="profile-banner" />
          <div className="profile-top">
            <div className="profile-avatar-wrap">
              <Avatar username={user.username} size={72} />
            </div>
            <h1 className="profile-username">{user.username}</h1>
            {isMe && <p className="profile-email">{user.email}</p>}
          </div>

          {user.bio && (
            <div className="profile-section">
              <p className="profile-section-label">Bio</p>
              <p className="profile-bio">{user.bio}</p>
            </div>
          )}

          {user.interests?.length > 0 && (
            <div className="profile-section">
              <p className="profile-section-label">Interests</p>
              <div className="profile-tags">
                {user.interests.map((interest) => (
                  <span key={interest} className="profile-tag">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="profile-actions">
            {isMe ? (
              <>
                <button
                  className="profile-btn profile-btn-edit"
                  onClick={() => navigate("/edit-profile")}
                  onMouseOver={e => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseOut={e => e.currentTarget.style.background = "transparent"}
                >
                  ✏️ Edit profile
                </button>
                <button
                  className="profile-btn profile-btn-discover"
                  onClick={() => navigate("/discover")}
                  onMouseOver={e => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseOut={e => e.currentTarget.style.background = "transparent"}
                >
                  Discover users
                </button>
              </>
            ) : (
              <button
                className="profile-btn profile-btn-chat"
                onClick={() => navigate(`/chat/${user._id}`)}
                onMouseOver={e => e.currentTarget.style.opacity = "0.9"}
                onMouseOut={e => e.currentTarget.style.opacity = "1"}
              >
                💬 Start chatting
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import "../styles/Communities.css";
import { API } from "../config";

const CATEGORIES = [
  "All",
  "Campus Life",
  "Events",
  "Sports",
  "Gaming",
  "Clubs",
  "Hostel",
  "Creative",
  "Study",
  "Random",
  "Fest",
  "Mess",
];
const EMOJI_OPTIONS = ["💬", "💻", "🎮", "🎨", "🎵", "☕", "📚", "🚀", "🔥", "⚡", "🌟", "🍕", "🎉", "⚽", "🏠"];

function Communities() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [communities, setCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);

  // New room form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Campus Life");
  const [icon, setIcon] = useState("💬");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate, token]);

  const loadCommunities = () => {
    const url = currentUser?._id
      ? `${API}/api/communities?userId=${currentUser._id}`
      : `${API}/api/communities`;

    axios
      .get(url)
      .then((res) => setCommunities(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    loadCommunities();
  }, [currentUser?._id]);

  const handleJoinAndOpen = async (comm) => {
    if (comm.isMember) {
      navigate(`/community/${comm._id}`);
      return;
    }

    try {
      await axios.post(`${API}/api/communities/${comm._id}/join`, {
        userId: currentUser._id,
      });
      navigate(`/community/${comm._id}`);
    } catch (err) {
      console.error("Error joining room:", err);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a room name");
      return;
    }

    try {
      const res = await axios.post(`${API}/api/communities`, {
        name,
        description,
        category,
        icon,
        userId: currentUser._id,
      });

      setShowModal(false);
      setName("");
      setDescription("");
      setIcon("💬");
      setCategory("Campus Life");

      // Reload & navigate to created room
      loadCommunities();
      navigate(`/community/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Error creating room");
    }
  };

  const filteredCommunities = communities.filter((c) => {
    const matchesCategory =
      selectedCategory === "All" || c.category === selectedCategory;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="communities-page">
      <div className="communities-glow-1" />
      <div className="communities-glow-2" />

      <Navbar activeTab="communities" />

      <main className="communities-main">
        <header className="communities-header">
          <div>
            <h1 className="communities-title">Discover Rooms</h1>
            <p className="communities-subtitle">
              Find conversations happening around your campus.
            </p>
          </div>
          <button
            className="communities-btn-create"
            onClick={() => setShowModal(true)}
          >
            <span>+</span> Create Room
          </button>
        </header>

        <div className="communities-toolbar">
          <div className="communities-search-wrap">
            <input
              className="communities-search-input"
              placeholder="Search rooms or topics…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="communities-categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-chip ${
                  selectedCategory === cat ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredCommunities.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
            <h3>No rooms found</h3>
            <p>Try searching for something else or create a new room!</p>
          </div>
        ) : (
          <div className="communities-grid">
            {filteredCommunities.map((comm) => (
              <div key={comm._id} className="community-card">
                <div>
                  <div className="community-card-top">
                    <div className="community-icon">{comm.icon || "💬"}</div>
                    <div className="community-info">
                      <div className="community-name">{comm.name}</div>
                      <span className="community-category-badge">
                        {comm.category}
                      </span>
                    </div>
                  </div>
                  <p className="community-desc">{comm.description}</p>
                </div>

                <div className="community-card-footer">
                  <div className="community-members">
                    <span>👥</span> {comm.memberCount || 0} members
                  </div>
                  <button
                    className={`community-btn-action ${
                      comm.isMember ? "joined" : "join"
                    }`}
                    onClick={() => handleJoinAndOpen(comm)}
                  >
                    {comm.isMember ? "Open Chat →" : "Join & Chat"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">Create a Room</h2>
            {error && (
              <div
                style={{
                  color: "#ef4444",
                  fontSize: "13px",
                  marginBottom: "12px",
                }}
              >
                {error}
              </div>
            )}
            <form onSubmit={handleCreateCommunity}>
              <div className="form-group">
                <label className="form-label">Icon / Emoji</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      type="button"
                      key={e}
                      style={{
                        padding: "8px",
                        fontSize: "20px",
                        borderRadius: "8px",
                        background: icon === e ? "var(--accent-dim)" : "var(--bg-input)",
                        border: icon === e ? "1px solid var(--accent)" : "1px solid var(--border)",
                      }}
                      onClick={() => setIcon(e)}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Room Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Hostel 3 Mess Chat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="What is this room about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Communities;

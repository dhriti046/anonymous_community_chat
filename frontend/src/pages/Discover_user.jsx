import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Avatar from "../components/Avatar";
import Navbar from "../components/Navbar";
import "../styles/Discover.css";
import { API } from "../config";

function Discover() {
  const navigate = useNavigate();

  const currentUser = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    axios
      .get(`${API}/api/users`)
      .then((res) => setUsers(res.data))
      .catch(console.error);
  }, []);

  const filtered = users
    .filter(
      (u) => !currentUser || u._id !== currentUser._id
    )
    .filter(
      (u) =>
        searchQuery === "" ||
        u.interests.some((i) =>
          i
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        ) ||
        u.username
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );

  return (
    <div className="discover-page">
      {/* Background glow effects */}
      <div className="discover-glow-1" />
      <div className="discover-glow-2" />

      <Navbar activeTab="users" />

      <main className="discover-main">
        <div className="discover-header">
          <h1 className="discover-title">
            Discover people
          </h1>

          <p className="discover-subtitle">
            Search by interest or username
            to find your people
          </p>
        </div>

        <div className="discover-search-bar">
          <input
            className="discover-search-input"
            placeholder="Search by interest or username…"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === "Enter" &&
              setSearchQuery(searchTerm)
            }
          />

          <button
            className="discover-btn-search"
            onClick={() =>
              setSearchQuery(searchTerm)
            }
          >
            Search
          </button>

          {searchQuery && (
            <button
              className="discover-btn-clear"
              onClick={() => {
                setSearchTerm("");
                setSearchQuery("");
              }}
            >
              Clear
            </button>
          )}
        </div>

        <p className="discover-section-label">
          {filtered.length}{" "}
          {filtered.length === 1
            ? "person"
            : "people"}
          {searchQuery
            ? ` matching "${searchQuery}"`
            : " online"}
        </p>

        {filtered.length === 0 ? (
          <div className="discover-empty">
            <div className="discover-empty-icon">
              🔍
            </div>

            <h3>No users found</h3>

            <p>
              Try a different interest or
              clear your search
            </p>
          </div>
        ) : (
          <div className="discover-grid">
            {filtered.map((user) => (
              <div
                key={user._id}
                className="discover-card"
              >
                <div className="discover-card-top">
                  <Avatar
                    username={user.username}
                    size={44}
                    online={onlineUsers.includes(
                      user._id
                    )}
                  />

                  <div>
                    <div className="discover-card-name">
                      {user.username}
                    </div>

                    {onlineUsers.includes(
                      user._id
                    ) && (
                      <div className="discover-online-badge">
                        ● Online
                      </div>
                    )}
                  </div>
                </div>

                {user.bio && (
                  <p className="discover-bio">
                    {user.bio}
                  </p>
                )}

                {user.interests.length > 0 && (
                  <div className="discover-tags">
                    {user.interests
                      .slice(0, 4)
                      .map((interest) => (
                        <span
                          key={interest}
                          className="discover-tag"
                        >
                          {interest}
                        </span>
                      ))}

                    {user.interests.length >
                      4 && (
                      <span className="discover-tag-more">
                        +
                        {user.interests
                          .length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="discover-card-actions">
                  <button
                    className="discover-btn-chat"
                    onClick={() =>
                      navigate(
                        `/chat/${user._id}`
                      )
                    }
                  >
                    💬 Chat
                  </button>

                  <button
                    className="discover-btn-view"
                    onClick={() =>
                      navigate(
                        `/profile/${user._id}`
                      )
                    }
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Discover;
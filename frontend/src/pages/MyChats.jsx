import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Avatar from "../components/Avatar";
import "../styles/MyChats.css";
import { API } from "../config";

function MyChats() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [dmConversations, setDmConversations] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "groups", "dms"
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !currentUser?._id) {
      navigate("/login");
      return;
    }

    setLoading(true);

    const fetchJoined = axios.get(`${API}/api/communities/user/joined?userId=${currentUser._id}`);
    const fetchDms = axios.get(`${API}/api/messages/conversations/list?userId=${currentUser._id}`);

    Promise.all([fetchJoined, fetchDms])
      .then(([joinedRes, dmsRes]) => {
        setJoinedCommunities(joinedRes.data || []);
        setDmConversations(dmsRes.data || []);
      })
      .catch((err) => {
        console.error("Error loading chats:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, currentUser?._id, navigate]);

  const handleLeaveCommunity = async (e, communityId) => {
    e.stopPropagation();
    try {
      await axios.post(`${API}/api/communities/${communityId}/leave`, {
        userId: currentUser._id,
      });
      setJoinedCommunities((prev) => prev.filter((c) => c._id !== communityId));
    } catch (err) {
      console.error("Error leaving room:", err);
    }
  };

  const filteredGroups = joinedCommunities.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDms = dmConversations.filter(
    (conv) =>
      conv.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalChats = joinedCommunities.length + dmConversations.length;

  return (
    <div className="mychats-page">
      <div className="mychats-glow-1" />
      <div className="mychats-glow-2" />

      <Navbar activeTab="my-chats" />

      <main className="mychats-main">
        <header className="mychats-header">
          <div>
            <h1 className="mychats-title">My Chats</h1>
            <p className="mychats-subtitle">
              Manage your joined campus rooms and direct message conversations
            </p>
          </div>
          <div className="mychats-badge-count">
            💬 {totalChats} Active {totalChats === 1 ? "Chat" : "Chats"}
          </div>
        </header>

        {/* Search & Tabs Toolbar */}
        <div className="mychats-toolbar">
          <div className="mychats-search-wrap">
            <input
              className="mychats-search-input"
              placeholder="Search your chats by name, topic, or username…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mychats-tabs">
            <button
              className={`tab-chip ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All ({totalChats})
            </button>
            <button
              className={`tab-chip ${activeFilter === "groups" ? "active" : ""}`}
              onClick={() => setActiveFilter("groups")}
            >
              🌐 Joined Rooms ({joinedCommunities.length})
            </button>
            <button
              className={`tab-chip ${activeFilter === "dms" ? "active" : ""}`}
              onClick={() => setActiveFilter("dms")}
            >
              👥 Direct Messages ({dmConversations.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mychats-loading">Loading your chats…</div>
        ) : (
          <div className="mychats-content">
            {/* Joined Rooms Section */}
            {(activeFilter === "all" || activeFilter === "groups") && (
              <section className="chats-section">
                <div className="section-header-row">
                  <h2 className="section-title">
                    🌐 Joined Rooms ({filteredGroups.length})
                  </h2>
                  <button
                    className="btn-discover-more"
                    onClick={() => navigate("/communities")}
                  >
                    + Join More Rooms
                  </button>
                </div>

                {filteredGroups.length === 0 ? (
                  <div className="empty-chat-box">
                    <span className="empty-icon">🌐</span>
                    <h3>No Joined Rooms</h3>
                    <p>You haven't joined any public campus rooms yet.</p>
                    <button
                      className="btn-action-primary"
                      onClick={() => navigate("/communities")}
                    >
                      Explore Rooms →
                    </button>
                  </div>
                ) : (
                  <div className="groups-grid">
                    {filteredGroups.map((group) => (
                      <div
                        key={group._id}
                        className="group-card"
                        onClick={() => navigate(`/community/${group._id}`)}
                      >
                        <div className="group-card-top">
                          <div className="group-icon">{group.icon || "💬"}</div>
                          <div className="group-info">
                            <div className="group-name">{group.name}</div>
                            <span className="group-category">{group.category}</span>
                          </div>
                        </div>

                        <p className="group-last-msg">
                          {group.lastMessageSender ? (
                            <>
                              <strong>@{group.lastMessageSender}:</strong>{" "}
                              {group.lastMessage}
                            </>
                          ) : (
                            group.lastMessage
                          )}
                        </p>

                        <div className="group-card-footer">
                          <span className="group-members">
                            👥 {group.memberCount} members
                          </span>
                          <div className="group-actions">
                            <button
                              className="btn-leave"
                              title="Leave Room"
                              onClick={(e) => handleLeaveCommunity(e, group._id)}
                            >
                              Leave
                            </button>
                            <button
                              className="btn-open-chat"
                              onClick={() => navigate(`/community/${group._id}`)}
                            >
                              Open Chat →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Direct Messages Section */}
            {(activeFilter === "all" || activeFilter === "dms") && (
              <section className="chats-section">
                <div className="section-header-row">
                  <h2 className="section-title">
                    👥 Direct Messages ({filteredDms.length})
                  </h2>
                  <button
                    className="btn-discover-more"
                    onClick={() => navigate("/discover")}
                  >
                    + Start New DM
                  </button>
                </div>

                {filteredDms.length === 0 ? (
                  <div className="empty-chat-box">
                    <span className="empty-icon">💬</span>
                    <h3>No Direct Messages</h3>
                    <p>You haven't started any 1-on-1 conversations yet.</p>
                    <button
                      className="btn-action-primary"
                      onClick={() => navigate("/discover")}
                    >
                      Discover Users →
                    </button>
                  </div>
                ) : (
                  <div className="dms-list">
                    {filteredDms.map((conv) => (
                      <div
                        key={conv.user._id}
                        className="dm-card"
                        onClick={() => navigate(`/chat/${conv.user._id}`)}
                      >
                        <div className="dm-avatar-wrap">
                          <Avatar username={conv.user.username} size={44} />
                        </div>

                        <div className="dm-details">
                          <div className="dm-top-row">
                            <span className="dm-username">
                              @{conv.user.username}
                            </span>
                            <span className="dm-time">
                              {new Date(conv.updatedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="dm-last-msg">{conv.lastMessage}</p>
                        </div>

                        <button
                          className="btn-open-chat"
                          onClick={() => navigate(`/chat/${conv.user._id}`)}
                        >
                          Chat →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyChats;

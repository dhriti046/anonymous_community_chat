import { useNavigate, useLocation } from "react-router-dom";
import Avatar from "./Avatar";
import "../styles/Navbar.css";

function Navbar({ activeTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const currentTab =
    activeTab ||
    (location.pathname === "/my-chats"
      ? "my-chats"
      : location.pathname.startsWith("/communities")
      ? "communities"
      : "users");

  return (
    <nav className="nav-bar">
      <div className="nav-brand" onClick={() => navigate("/communities")}>
        <div className="nav-brand-icon">💬</div>
        <span className="nav-brand-text">YapYap</span>
      </div>

      <div className="nav-links">
        <button
          className={`nav-link ${currentTab === "my-chats" ? "active" : ""}`}
          onClick={() => navigate("/my-chats")}
        >
          <span>💬</span> My Chats
        </button>
        <button
          className={`nav-link ${currentTab === "communities" ? "active" : ""}`}
          onClick={() => navigate("/communities")}
        >
          <span>🌐</span> Discover Rooms
        </button>
      </div>

      <div className="nav-right">
        {currentUser && (
          <div
            className="nav-user"
            onClick={() => navigate(`/profile/${currentUser._id}`)}
          >
            <Avatar username={currentUser.username} size={28} />
            <span className="nav-user-name">{currentUser.username}</span>
          </div>
        )}

        <button className="nav-btn-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;

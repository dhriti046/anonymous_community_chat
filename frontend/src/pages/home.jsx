import { Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  return (
    <div className="home-container">
      {/* Background glow effects */}
      <div className="home-glow-1" />
      <div className="home-glow-2" />

      <div className="home-card">
        {/* Prominent YapYap Brand Header */}
        <div className="home-brand-badge">
          <span className="home-logo">💬</span>
          <span className="home-brand-name">YapYap</span>
        </div>
        
        <div className="home-campus-pill">
          🎓 Campus-Verified Platform
        </div>

        <h1 className="home-title">
          Your campus. Your conversations.
        </h1>

        <p className="home-subtitle">
          Discover, join, and create conversations happening around your campus.
        </p>

        <div className="home-actions">
          <Link to="/create-profile" className="home-btn primary">
            Get Started →
          </Link>

          <Link to="/login" className="home-btn secondary">
            Sign In
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <ul className="home-features">
          <li className="home-feature-item">
            <span className="home-feature-icon">🔍</span>
            <h3 className="home-feature-title">Discover Campus Conversations</h3>
            <p className="home-feature-text">
              Find rooms, topics, and trending discussions around campus.
            </p>
          </li>
          <li className="home-feature-item">
            <span className="home-feature-icon">💬</span>
            <h3 className="home-feature-title">Real-Time Conversations</h3>
            <p className="home-feature-text">
              Join public rooms or chat privately with other students.
            </p>
          </li>
          <li className="home-feature-item">
            <span className="home-feature-icon">🕶️</span>
            <h3 className="home-feature-title">Pseudonymous & Verified</h3>
            <p className="home-feature-text">
              Use a chosen username while your campus membership remains verified.
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
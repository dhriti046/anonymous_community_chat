import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import Avatar from "../components/Avatar";
import "../styles/CommunityChat.css";
import { API } from "../config";

const socket = io(API);

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function CommunityChat() {
  const { id: communityId } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [community, setCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]);

  // Load Community info
  useEffect(() => {
    axios
      .get(`${API}/api/communities/${communityId}`)
      .then((res) => setCommunity(res.data))
      .catch(console.error);
  }, [communityId]);

  // Load historical messages & Join room
  useEffect(() => {
    if (!currentUser?._id || !communityId) return;

    axios
      .get(`${API}/api/communities/${communityId}/messages`)
      .then((res) => setMessages(res.data))
      .catch(console.error);

    socket.emit("join_community_room", {
      communityId,
      userId: currentUser._id,
    });

    return () => {
      socket.emit("leave_community_room", {
        communityId,
        userId: currentUser._id,
      });
    };
  }, [communityId, currentUser?._id]);

  // Socket listener for incoming room messages
  useEffect(() => {
    function handleReceiveMessage(msg) {
      if (msg.community === communityId || msg.community?._id === communityId) {
        setMessages((prev) => [...prev, msg]);
      }
    }

    socket.on("receive_community_message", handleReceiveMessage);

    return () => {
      socket.off("receive_community_message", handleReceiveMessage);
    };
  }, [communityId]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !currentUser?._id) return;

    socket.emit("send_community_message", {
      communityId,
      senderId: currentUser._id,
      text: input.trim(),
    });

    setInput("");
  };

  const handleLeaveCommunity = async () => {
    try {
      await axios.post(`${API}/api/communities/${communityId}/leave`, {
        userId: currentUser._id,
      });
      navigate("/communities");
    } catch (err) {
      console.error("Error leaving community:", err);
    }
  };

  return (
    <div className="comm-chat-page">
      <nav className="comm-chat-nav">
        <button
          className="comm-chat-back"
          onClick={() => navigate("/communities")}
        >
          ← Communities
        </button>

        <div className="comm-chat-info">
          <div className="comm-chat-icon">{community?.icon || "💬"}</div>
          <div>
            <div className="comm-chat-title">
              {community?.name || "Loading..."}
            </div>
            <div className="comm-chat-sub">
              {community?.category} · {community?.members?.length || 0} members
            </div>
          </div>
        </div>

        <button
          className="comm-chat-leave"
          onClick={handleLeaveCommunity}
        >
          Leave Community
        </button>
      </nav>

      <div className="comm-chat-messages">
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              margin: "auto",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>💬</div>
            <p>Welcome to {community?.name || "this community"}!</p>
            <p style={{ fontSize: "13px" }}>
              Be the first to start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe =
              msg.sender === currentUser._id ||
              msg.sender?._id === currentUser._id;
            const senderName =
              typeof msg.sender === "object" ? msg.sender.username : "Member";

            return (
              <div
                key={msg._id || i}
                className={`comm-msg-row ${isMe ? "is-me" : ""}`}
              >
                {!isMe && <Avatar username={senderName} size={32} />}
                <div>
                  {!isMe && (
                    <div className="comm-msg-header">
                      <span className="comm-msg-sender">{senderName}</span>
                      <span className="comm-msg-time">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className="comm-msg-bubble">{msg.text}</div>
                  {isMe && (
                    <div
                      className="comm-msg-time"
                      style={{ textAlign: "right", marginTop: "2px" }}
                    >
                      {formatTime(msg.createdAt)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="comm-chat-input-bar">
        <input
          className="comm-chat-input"
          placeholder={`Message #${community?.name || "community"}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          className="comm-chat-send"
          onClick={sendMessage}
          disabled={!input.trim()}
          style={{ opacity: input.trim() ? 1 : 0.5 }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default CommunityChat;

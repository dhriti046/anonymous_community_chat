import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import Avatar from "../components/Avatar";
import "../styles/Chat.css";
import { API } from "../config";

const socket = io(API);

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Chat() {
  const { id: receiverId } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [peer, setPeer] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]);

  useEffect(() => {
    if (currentUser?._id) {
      socket.emit("register", currentUser._id);
    }
  }, [currentUser]);

  useEffect(() => {
    const profileToken = localStorage.getItem("token");
    if (!profileToken) { navigate("/login"); return; }
    fetch(`${API}/api/users/${receiverId}`, {
      headers: { Authorization: `Bearer ${profileToken}` },
    })
      .then((r) => {
        if (r.status === 401) { navigate("/login"); throw new Error("Sign-in required"); }
        if (!r.ok) throw new Error("Profile could not be loaded");
        return r.json();
      })
      .then(setPeer)
      .catch(console.error);
  }, [receiverId, token, navigate]);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API}/api/messages/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data))
      .catch(console.error);
  }, [receiverId, token]);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      if (
        (data.sender === receiverId && data.receiver === currentUser._id) ||
        (data.sender === currentUser._id && data.receiver === receiverId)
      ) {
        setMessages((prev) => [...prev, data]);
      }
    });

    socket.on("message_sent", (data) => {
      setMessages((prev) => {
        const exists = prev.find((m) => m._id === data._id);
        if (exists) return prev;
        return [...prev, data];
      });
    });

    return () => {
      socket.off("receive_message");
      socket.off("message_sent");
    };
  }, [receiverId, currentUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    if (!input.trim()) return;
    socket.emit("send_message", {
      senderId: currentUser._id,
      receiverId,
      text: input.trim(),
    });
    setInput("");
  }

  return (
    <div className="chat-page">
      <div className="chat-nav">
        <button className="chat-btn-back" onClick={() => navigate("/discover")}>
          ← Back
        </button>
        <div className="chat-peer-info">
          {peer && <Avatar username={peer.username} size={36} />}
          <div>
            <div className="chat-peer-name">{peer?.username || "Loading…"}</div>
            {peer?.interests?.length > 0 && (
              <div className="chat-peer-sub">
                {peer.interests.slice(0, 3).join(" · ")}
              </div>
            )}
          </div>
        </div>
        {peer && (
          <button
            className="chat-btn-view-profile"
            onClick={() => navigate(`/profile/${peer._id}`)}
          >
            View profile
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p>No messages yet. Say hello to {peer?.username || "them"}!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender === currentUser._id || msg.sender?._id === currentUser._id;
            const showAvatar = !isMe && (i === 0 || messages[i - 1]?.sender !== msg.sender);

            return (
              <div
                key={msg._id || i}
                className={`chat-msg-row ${isMe ? "chat-msg-row--me" : "chat-msg-row--them"}`}
              >
                <div className={`chat-msg-inner ${isMe ? "chat-msg-inner--me" : ""}`}>
                  {!isMe && (
                    <div className="chat-avatar-slot">
                      {showAvatar && <Avatar username={peer?.username} size={28} />}
                    </div>
                  )}
                  <div>
                    <div className={`chat-bubble ${isMe ? "chat-bubble--me" : "chat-bubble--them"}`}>
                      {msg.text}
                    </div>
                    <div className={`chat-msg-time ${isMe ? "chat-msg-time--me" : "chat-msg-time--them"}`}>
                      {msg.createdAt ? formatTime(msg.createdAt) : ""}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <div
          className={`chat-input-wrap ${inputFocused ? "chat-input-wrap--focused" : ""}`}
        >
          <input
            className="chat-input"
            placeholder={`Message ${peer?.username || "…"}`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
        </div>
        <button
          className="chat-btn-send"
          style={{ opacity: input.trim() ? 1 : 0.4 }}
          onClick={sendMessage}
          disabled={!input.trim()}
        >
          ↑
        </button>
      </div>
    </div>
  );
}

export default Chat;

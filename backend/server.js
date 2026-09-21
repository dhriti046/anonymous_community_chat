const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const communityRoutes = require("./routes/communityRoutes");
const Message = require("./models/Message");
const Community = require("./models/Community");
const CommunityMessage = require("./models/CommunityMessage");

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/communities", communityRoutes);

const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log(`User ${userId} registered with socket ${socket.id}`);
    io.emit("online_users", Object.keys(onlineUsers));
  });

  // Direct Message (1-on-1)
  socket.on("send_message", async (data) => {
    const { senderId, receiverId, text } = data;

    try {
      const message = new Message({ sender: senderId, receiver: receiverId, text });
      await message.save();

      const receiverSocketId = onlineUsers[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", {
          _id: message._id,
          sender: senderId,
          receiver: receiverId,
          text,
          createdAt: message.createdAt,
        });
      }

      socket.emit("message_sent", {
        _id: message._id,
        sender: senderId,
        receiver: receiverId,
        text,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error("Error saving message:", err);
      socket.emit("message_error", {
        message: "Message could not be sent."
      });
    }
  });

  // Community Rooms (Public Chat)
  socket.on("join_community_room", ({ communityId, userId }) => {
    socket.join(communityId);
    console.log(`Socket ${socket.id} (user ${userId}) joined community room ${communityId}`);
  });

  socket.on("leave_community_room", ({ communityId, userId }) => {
    socket.leave(communityId);
    console.log(`Socket ${socket.id} (user ${userId}) left community room ${communityId}`);
  });

  socket.on("send_community_message", async (data) => {
    const { communityId, senderId, text } = data;

    try {
      const commMessage = new CommunityMessage({
        community: communityId,
        sender: senderId,
        text,
      });
      await commMessage.save();

      const populatedMsg = await CommunityMessage.findById(commMessage._id).populate(
        "sender",
        "username avatar"
      );

      // Broadcast to room members including sender
      io.to(communityId).emit("receive_community_message", populatedMsg);
    } catch (err) {
      console.error("Error saving community message:", err);
      socket.emit("community_message_error", {
        message: "Community message could not be sent."
      });
    }
  });

  socket.on("disconnect", () => {
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }
    io.emit("online_users", Object.keys(onlineUsers));
    console.log("User disconnected:", socket.id);
  });
});

async function seedDefaultCommunities() {
  try {
    const count = await Community.countDocuments();
    if (count === 0) {
      const defaults = [
        {
          name: "💻 Code & Tech",
          description: "Discuss web dev, software engineering, AI, and futuristic tech!",
          category: "Tech",
          icon: "💻",
        },
        {
          name: "🎮 Gaming Lounge",
          description: "Connect with fellow gamers, share clips, strategy, and game recs.",
          category: "Gaming",
          icon: "🎮",
        },
        {
          name: "🎨 Creative Studio",
          description: "UI/UX design, digital art, illustration, and creative showcase.",
          category: "Art",
          icon: "🎨",
        },
        {
          name: "🎵 Music & Beats",
          description: "Share playlists, production tips, and talk about your favourite tunes.",
          category: "Music",
          icon: "🎵",
        },
        {
          name: "☕ General Hangout",
          description: "Casual community space for open discussions and daily chat.",
          category: "General",
          icon: "☕",
        },
      ];
      await Community.insertMany(defaults);
      console.log("Default communities seeded successfully.");
    }
  } catch (err) {
    console.error("Error seeding default communities:", err);
  }
}

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    seedDefaultCommunities();
  })
  .catch((err) => console.error("MongoDB error:", err));

app.get("/", (req, res) => res.send("Anonymous Chat API running"));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


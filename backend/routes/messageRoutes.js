const express = require("express");
const Message = require("../models/Message");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Get all 1-on-1 conversations for a user
router.get("/conversations/list", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId query parameter is required" });
    }

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "username avatar bio interests")
      .populate("receiver", "username avatar bio interests");

    const conversationMap = new Map();

    messages.forEach((msg) => {
      if (!msg.sender || !msg.receiver) return;
      const otherUser =
        msg.sender._id.toString() === userId.toString()
          ? msg.receiver
          : msg.sender;

      if (otherUser && !conversationMap.has(otherUser._id.toString())) {
        conversationMap.set(otherUser._id.toString(), {
          user: otherUser,
          lastMessage: msg.text,
          updatedAt: msg.createdAt,
        });
      }
    });

    res.json(Array.from(conversationMap.values()));
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ message: "Server error fetching conversations" });
  }
});

//get all messages between two users
//GET /messages/:userId
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const currentUser = req.userId;
    const otherUser = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUser, receiver: otherUser },
        { sender: otherUser, receiver: currentUser },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

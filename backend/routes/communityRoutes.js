const express = require("express");
const router = express.Router();
const Community = require("../models/Community");
const CommunityMessage = require("../models/CommunityMessage");

// Get all communities
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    const communities = await Community.find()
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    const formatted = communities.map((comm) => {
      const isMember = userId
        ? comm.members.some((m) => m.toString() === userId)
        : false;
      return {
        _id: comm._id,
        name: comm.name,
        description: comm.description,
        category: comm.category,
        icon: comm.icon,
        createdBy: comm.createdBy,
        memberCount: comm.members.length,
        isMember,
        createdAt: comm.createdAt,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching communities:", err);
    res.status(500).json({ message: "Server error fetching communities" });
  }
});

// Get single community by ID
router.get("/:id", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("createdBy", "username avatar")
      .populate("members", "username bio interests avatar");

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    res.json(community);
  } catch (err) {
    console.error("Error fetching community:", err);
    res.status(500).json({ message: "Server error fetching community" });
  }
});

// Create a new community
router.post("/", async (req, res) => {
  try {
    const { name, description, category, icon, userId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Community name is required" });
    }

    const existing = await Community.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Community with this name already exists" });
    }

    const community = new Community({
      name: name.trim(),
      description: description ? description.trim() : "",
      category: category || "General",
      icon: icon || "💬",
      createdBy: userId || null,
      members: userId ? [userId] : [],
    });

    await community.save();
    res.status(201).json(community);
  } catch (err) {
    console.error("Error creating community:", err);
    res.status(500).json({ message: "Server error creating community" });
  }
});

// Join community
router.post("/:id/join", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    if (!community.members.includes(userId)) {
      community.members.push(userId);
      await community.save();
    }

    res.json({ message: "Successfully joined community", community });
  } catch (err) {
    console.error("Error joining community:", err);
    res.status(500).json({ message: "Server error joining community" });
  }
});

// Leave community
router.post("/:id/leave", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    community.members = community.members.filter((m) => m.toString() !== userId);
    await community.save();

    res.json({ message: "Successfully left community", community });
  } catch (err) {
    console.error("Error leaving community:", err);
    res.status(500).json({ message: "Server error leaving community" });
  }
});

// Get community messages
router.get("/:id/messages", async (req, res) => {
  try {
    const messages = await CommunityMessage.find({ community: req.params.id })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching community messages:", err);
    res.status(500).json({ message: "Server error fetching messages" });
  }
});

module.exports = router;

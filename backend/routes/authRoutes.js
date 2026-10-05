const express = require("express");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ALLOWED_DOMAIN = "iitrpr.ac.in";

/**
 * POST /api/auth/google
 *
 * Receives a Google ID token from the frontend.
 * Verifies it, enforces domain restriction, then:
 *   - If user exists → returns JWT immediately (login)
 *   - If user does not exist → returns { newUser: true, googleId, email, avatar, name }
 *     so the frontend can prompt for username/bio/interests
 */
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required." });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, hd } = payload;

    // Enforce domain restriction
    if (hd !== ALLOWED_DOMAIN && !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return res.status(403).json({
        message: `Only @${ALLOWED_DOMAIN} Google accounts are allowed.`,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ googleId });

    if (existingUser) {
      // Existing user → generate JWT and return user data (login flow)
      const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      return res.json({
        token,
        _id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        bio: existingUser.bio,
        interests: existingUser.interests,
        avatar: existingUser.avatar,
      });
    }

    // New user → tell frontend to show profile-completion form
    return res.status(200).json({
      newUser: true,
      googleId,
      email,
      avatar: picture || "",
      name: name || "",
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ message: "Authentication failed. Please try again." });
  }
});

/**
 * POST /api/auth/complete-profile
 *
 * Called after a new Google user fills in their username, bio, and interests.
 * Creates the user record and issues a JWT.
 */
router.post("/complete-profile", async (req, res) => {
  try {
    const { googleId, email, avatar, username, bio, interests } = req.body;

    if (!googleId || !email || !username?.trim()) {
      return res.status(400).json({ message: "googleId, email, and username are required." });
    }

    // Prevent duplicate registration (user may hit this twice)
    const alreadyExists = await User.findOne({ googleId });
    if (alreadyExists) {
      const token = jwt.sign({ userId: alreadyExists._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      return res.json({
        token,
        _id: alreadyExists._id,
        username: alreadyExists.username,
        email: alreadyExists.email,
        bio: alreadyExists.bio,
        interests: alreadyExists.interests,
        avatar: alreadyExists.avatar,
      });
    }

    // Check username uniqueness (case-insensitive)
    const trimmedUsername = username.trim();
    const existingUsername = await User.findOne({
      username: { $regex: new RegExp(`^${trimmedUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (existingUsername) {
      return res.status(400).json({ message: "Username is already taken. Please choose another one." });
    }

    const user = new User({
      googleId,
      username: trimmedUsername,
      email,
      avatar: avatar || "",
      bio: bio || "",
      interests: interests || [],
    });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      _id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      interests: user.interests,
      avatar: user.avatar,
    });
  } catch (err) {
    console.error("Complete profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update profile (bio/interests) — still protected by JWT
router.put("/update-profile", authMiddleware, async (req, res) => {
  try {
    const { bio, interests } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.userId,
      { bio, interests },
      { new: true, select: "-password" }
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

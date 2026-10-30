const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const authMiddleware = require("../middleware/auth");
const { PUBLIC_PROFILE_FIELDS, publicProfile } = require("../utils/publicProfile");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();
router.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
const hash = token => crypto.createHash("sha256").update(token).digest("hex");
function sessionResponse(user) {
  return {
    token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" }),
    ...publicProfile(user),
  };
}
function validProfile(bio, interests) {
  return typeof bio === "string" && bio.length <= 300 &&
    Array.isArray(interests) && interests.length <= 30 &&
    interests.every(i => typeof i === "string" && i.length <= 100);
}

router.post("/google", async (req, res) => {
  if (typeof req.body.credential !== "string" || !req.body.credential) {
    return res.status(400).json({ message: "Google credential is required." });
  }
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ message: "Google sign-in could not be verified." });
  }
  if (!payload?.sub || !payload.email_verified || typeof payload.email !== "string" ||
      payload.hd !== "iitrpr.ac.in") {
    return res.status(403).json({ message: "A verified IIT Ropar Google account is required." });
  }
  try {
    const existingUser = await User.findOne({ googleId: payload.sub }).select(PUBLIC_PROFILE_FIELDS);
    if (existingUser) return res.json(sessionResponse(existingUser));
    const registrationToken = crypto.randomBytes(32).toString("hex");
    await PendingRegistration.create({
      tokenHash: hash(registrationToken),
      googleId: payload.sub,
      email: payload.email,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    res.set("Cache-Control", "no-store");
    return res.json({ newUser: true, registrationToken });
  } catch {
    return res.status(500).json({ message: "Authentication failed. Please try again." });
  }
});

router.post("/complete-profile", async (req, res) => {
  const { registrationToken, username, bio = "", interests = [] } = req.body;
  if (typeof registrationToken !== "string" || !/^[a-f0-9]{64}$/.test(registrationToken)) {
    return res.status(401).json({ message: "Please sign in with Google again." });
  }
  if (typeof username !== "string" || !username.trim() || username.trim().length > 50 ||
      !validProfile(bio, interests)) {
    return res.status(400).json({ message: "Invalid profile information." });
  }
  try {
    const trimmedUsername = username.trim();
    const escaped = trimmedUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (await User.findOne({ username: { $regex: `^${escaped}$`, $options: "i" } })) {
      return res.status(409).json({ message: "Username is already taken." });
    }
    // Atomic consumption prevents token replay, even with concurrent requests.
    // Expiry is checked here because MongoDB TTL cleanup is asynchronous.
    const pending = await PendingRegistration.findOneAndDelete({
      tokenHash: hash(registrationToken), expiresAt: { $gt: new Date() },
    }).select("+googleId +email");
    if (!pending) return res.status(401).json({ message: "Registration expired or already used. Sign in again." });
    if (await User.findOne({ googleId: pending.googleId })) {
      return res.status(409).json({ message: "Account already registered. Sign in again." });
    }
    const user = await User.create({
      googleId: pending.googleId, email: pending.email,
      username: trimmedUsername, bio, interests, avatar: "",
    });
    return res.status(201).json(sessionResponse(user));
  } catch (err) {
    return res.status(err.code === 11000 ? 409 : 500).json({
      message: "Profile could not be created. Please sign in again.",
    });
  }
});

router.put("/update-profile", authMiddleware, async (req, res) => {
  const { bio = "", interests = [] } = req.body;
  if (!validProfile(bio, interests)) return res.status(400).json({ message: "Invalid profile information." });
  try {
    const updated = await User.findByIdAndUpdate(req.userId, { bio, interests }, {
      new: true, runValidators: true, select: PUBLIC_PROFILE_FIELDS,
    });
    if (!updated) return res.status(404).json({ message: "User not found" });
    return res.json(publicProfile(updated));
  } catch {
    return res.status(500).json({ message: "Profile could not be updated." });
  }
});

module.exports = router;

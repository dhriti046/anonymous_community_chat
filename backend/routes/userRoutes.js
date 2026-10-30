const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const { PUBLIC_PROFILE_FIELDS, publicProfile } = require("../utils/publicProfile");
const router = express.Router();
router.use(authMiddleware);
router.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

//get all users from data base
//GET /users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, PUBLIC_PROFILE_FIELDS);
    res.json(users.map(publicProfile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//get my profile using jwt token
//GET/users/me
router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.userId, PUBLIC_PROFILE_FIELDS);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(publicProfile(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//get user by id
//GET /users/:id
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id, PUBLIC_PROFILE_FIELDS);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(publicProfile(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

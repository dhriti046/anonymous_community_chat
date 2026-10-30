const mongoose = require("mongoose");
// Only an opaque, short-lived proof reaches the client. Identity stays server-side.
const schema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  googleId: { type: String, required: true, select: false },
  email: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true, expires: 0 },
});
module.exports = mongoose.model("PendingRegistration", schema);

const mongoose = require("mongoose");
const chunkSchema = new mongoose.Schema({
  text: { type: String, required: true },
  page: { type: Number, default: null },
  section: { type: Number, required: true },
}, { _id: false });
const schema = new mongoose.Schema({
  filename: { type: String, required: true, maxlength: 160 },
  checksum: { type: String, required: true, unique: true },
  characterCount: { type: Number, required: true },
  chunks: { type: [chunkSchema], required: true, select: false },
}, { timestamps: true });
module.exports = mongoose.model("KnowledgeDocument", schema);

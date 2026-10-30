const express = require("express");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const KnowledgeDocument = require("../models/KnowledgeDocument");
const User = require("../models/User");
const { decodeUpload, extractDocument } = require("../services/extractDocument");
const { answerQuestion } = require("../services/collegeAssistant");
function isAdmin(userId) {
  return (process.env.CHATBOT_ADMIN_IDS || "").split(",").map(id => id.trim()).filter(Boolean).includes(String(userId));
}
function createChatbotRouter({ documents = KnowledgeDocument, users = User,
  extract = extractDocument, answer = answerQuestion } = {}) {
  const router = express.Router();
  const buckets = new Map();
  let activeQuestions = 0, activeUploads = 0;
  router.use(auth);
  router.use(async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.userId) || !await users.exists({ _id: req.userId })) {
        return res.status(401).json({ message: "Please sign in again." });
      }
      res.set("Cache-Control", "no-store"); next();
    } catch { res.status(503).json({ message: "The assistant is temporarily unavailable." }); }
  });
  function adminOnly(req, res, next) {
    if (!isAdmin(req.userId)) return res.status(403).json({ message: "Only an administrator can manage college documents." });
    next();
  }
  function limited(prefix, maximum) {
    return (req, res, next) => {
      const now = Date.now();
      for (const [key, value] of buckets) if (value.until <= now) buckets.delete(key);
      const key = `${prefix}:${req.userId}`;
      const bucket = buckets.get(key) || { count: 0, until: now + 60000 };
      if (bucket.count >= maximum || buckets.size >= 10000) {
        res.set("Retry-After", "60"); return res.status(429).json({ message: "Too many requests. Please wait a minute." });
      }
      bucket.count++; buckets.set(key, bucket); next();
    };
  }
  const json = express.json({ limit: "8mb", strict: true });
  const smallJson = express.json({ limit: "8kb", strict: true });
  router.get("/status", async (req, res) => {
    try {
      res.json({ configured: Boolean(process.env.GROQ_API_KEY?.trim()), canManage: isAdmin(req.userId),
        documentCount: await documents.countDocuments(), provider: "Groq", maxFileSizeMB: 5 });
    } catch { res.status(503).json({ message: "Unable to load the assistant status." }); }
  });
  router.get("/documents", limited("list", 30), async (_req, res) => {
    try {
      const list = await documents.find().select("_id filename characterCount createdAt").sort({ createdAt: -1 }).lean();
      res.json({ documents: list.map(doc => ({ id: String(doc._id), filename: doc.filename,
        characterCount: doc.characterCount, uploadedAt: doc.createdAt, status: "ready" })) });
    } catch { res.status(503).json({ message: "Unable to load college documents." }); }
  });
  router.post("/documents", adminOnly, limited("upload", 5), json, async (req, res) => {
    if (activeUploads) return res.status(429).json({ message: "Another document is processing. Please try again shortly." });
    activeUploads++;
    try {
      const { buffer, extension } = decodeUpload(req.body.filename, req.body.content);
      const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
      if (await documents.exists({ checksum })) return res.status(409).json({ message: "This document has already been uploaded." });
      if (await documents.countDocuments() >= 100) return res.status(409).json({ message: "The document library is full (100 files). Remove outdated files first." });
      const result = await extract(buffer, extension);
      const doc = await documents.create({ filename: req.body.filename.trim(), checksum, ...result });
      res.status(201).json({ document: { id: String(doc._id), filename: doc.filename,
        uploadedAt: doc.createdAt, characterCount: doc.characterCount, status: "ready" } });
    } catch (error) {
      const status = error.code === 11000 ? 409 : error.status || 503;
      res.status(status).json({ message: error.code === 11000 ? "This document has already been uploaded." : error.status ? error.message : "Document could not be saved. Please try again." });
    } finally { activeUploads--; }
  });
  router.delete("/documents/:id", adminOnly, limited("delete", 15), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid document ID." });
    try {
      const doc = await documents.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ message: "Document not found." });
      res.json({ message: "Document removed from the knowledge library." });
    } catch { res.status(503).json({ message: "Document could not be removed." }); }
  });
  router.post("/ask", limited("ask", 8), smallJson, async (req, res) => {
    if (typeof req.body.question !== "string" || !req.body.question.trim() || req.body.question.length > 2000) {
      return res.status(400).json({ message: "Enter a question between 1 and 2,000 characters." });
    }
    if (!process.env.GROQ_API_KEY?.trim()) return res.status(503).json({ message: "An administrator needs to configure the Groq API key before questions can be answered." });
    if (activeQuestions >= 4) return res.status(429).json({ message: "The assistant is busy. Please try again shortly." });
    activeQuestions++;
    try {
      // Only the dedicated document library is retrieved. No profiles or chats.
      const library = await documents.find().select("_id filename +chunks createdAt").limit(100).lean();
      const result = await answer(req.body.question.trim(), library);
      // Do not return references to documents removed while the answer was generated.
      if (result.sources.length) {
        const remaining = await documents.countDocuments({ _id: { $in: [...new Set(result.sources.map(source => source.documentId))] } });
        if (remaining !== new Set(result.sources.map(source => source.documentId)).size) {
          return res.status(409).json({ message: "The document library changed. Please ask your question again." });
        }
      }
      res.json(result);
    } catch (error) {
      res.status(error.status || 502).json({ message: error.status ? error.message : "The assistant could not answer right now. Please try again." });
    } finally { activeQuestions--; }
  });
  router.use((error, _req, res, _next) => {
    res.status(error.type === "entity.too.large" ? 413 : 400).json({ message: error.type === "entity.too.large" ? "File or request is too large (maximum file size: 5 MB)." : "Invalid request. Please try again." });
  });
  return router;
}
module.exports = { createChatbotRouter, isAdmin };

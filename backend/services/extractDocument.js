const { Worker } = require("node:worker_threads");
const path = require("node:path");
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS = new Set([".pdf", ".docx", ".txt", ".md"]);
function decodeUpload(filename, content) {
  if (typeof filename !== "string" || !filename.trim() || filename.length > 160 || /[\\/\x00-\x1f]/.test(filename)) {
    throw Object.assign(new Error("Use a filename of at most 160 characters without folder paths."), { status: 400 });
  }
  const extension = path.extname(filename).toLowerCase();
  if (!EXTENSIONS.has(extension)) throw Object.assign(new Error("Supported files: PDF, DOCX, TXT, and Markdown."), { status: 415 });
  if (typeof content !== "string" || !content || content.length > Math.ceil(MAX_BYTES / 3) * 4 ||
      (content.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(content))) {
    throw Object.assign(new Error("Upload a valid file of at most 5 MB."), { status: 413 });
  }
  const buffer = Buffer.from(content, "base64");
  if (!buffer.length || buffer.length > MAX_BYTES) throw Object.assign(new Error("Maximum file size is 5 MB."), { status: 413 });
  if (extension === ".pdf" && !buffer.subarray(0, 1024).includes(Buffer.from("%PDF-"))) {
    throw Object.assign(new Error("The file is not a valid PDF."), { status: 422 });
  }
  if (extension === ".docx" && (buffer.length < 4 || buffer.readUInt16LE(0) !== 0x4b50)) {
    throw Object.assign(new Error("The file is not a valid DOCX."), { status: 422 });
  }
  return { buffer, extension };
}
function extractDocument(buffer, extension) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "../workers/extractDocument.js"), {
      workerData: { buffer, extension }, resourceLimits: { maxOldGenerationSizeMb: 192 },
    });
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true; clearTimeout(timer); worker.terminate();
      if (error) reject(error); else resolve(result);
    };
    const timer = setTimeout(() => finish(Object.assign(new Error("Document processing timed out. Try a smaller file."), { status: 422 })), 20000);
    worker.once("message", message => finish(message.error ? Object.assign(new Error(message.error), { status: message.status }) : null, message.result));
    worker.once("error", () => finish(Object.assign(new Error("Document processing failed. Try a smaller file."), { status: 422 })));
    worker.once("exit", () => { if (!settled) finish(Object.assign(new Error("Document processing stopped."), { status: 422 })); });
  });
}
module.exports = { decodeUpload, extractDocument, MAX_BYTES };

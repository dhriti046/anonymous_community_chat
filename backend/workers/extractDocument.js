const { parentPort, workerData } = require("node:worker_threads");
(async () => {
  const buffer = Buffer.from(workerData.buffer);
  let pages;
  if (workerData.extension === ".pdf") {
    const { PDFParse } = require("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer), isEvalSupported: false });
    try {
      const result = await parser.getText();
      pages = result.pages.map(page => ({ text: page.text, page: page.num }));
    } finally { await parser.destroy(); }
  } else if (workerData.extension === ".docx") {
    const result = await require("mammoth").extractRawText({ buffer });
    pages = [{ text: result.value, page: null }];
  } else {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    if (text.includes("\u0000")) throw new Error("Binary text file");
    pages = [{ text, page: null }];
  }
  const { chunkPages } = require("../services/retrieval");
  parentPort.postMessage({ result: chunkPages(pages) });
})().catch(error => parentPort.postMessage({
  error: error.status ? error.message : "This file could not be read. Upload a valid, unencrypted PDF, DOCX, or UTF-8 text file.",
  status: error.status || 422,
}));

const STOP_WORDS = new Set("a an and are as at be by can could do does for from how i in is it me of on or please tell that the their there these this to was what when where which who why will with would you your college document documents according information about".split(" "));
function tokenize(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
    .filter(word => word.length > 1 && !STOP_WORDS.has(word))
    // Lightweight English inflection matching (e.g. opens/opening, policies/policy).
    .map(word => word.length > 4 && word.endsWith("ies") ? word.slice(0, -3) + "y"
      : word.length > 5 && word.endsWith("ing") ? word.slice(0, -3)
      : word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word);
}
function chunkPages(pages, size = 1200, overlap = 200) {
  const chunks = [];
  let total = 0;
  for (const page of pages) {
    const text = page.text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
    total += text.length;
    if (total > 200000) throw Object.assign(new Error("Document is too long. Split it into smaller files (maximum 200,000 characters)."), { status: 413 });
    for (let start = 0; start < text.length;) {
      let end = Math.min(start + size, text.length);
      if (end < text.length) {
        const space = text.lastIndexOf(" ", end);
        if (space > start + size / 2) end = space;
      }
      chunks.push({ text: text.slice(start, end).trim(), page: page.page || null, section: chunks.length + 1 });
      if (end === text.length) break;
      start = end - overlap;
    }
  }
  if (!chunks.length || !chunks.some(c => /[\p{L}\p{N}]/u.test(c.text))) {
    throw Object.assign(new Error("No readable text found. Scanned PDFs need OCR before uploading."), { status: 422 });
  }
  return { chunks, characterCount: total };
}
// BM25 lexical retrieval: no embedding service or personal data is required.
function retrieve(question, documents, limit = 5) {
  const query = [...new Set(tokenize(question))];
  if (!query.length) return [];
  const chunks = documents.flatMap(doc => doc.chunks.map(chunk => ({
    documentId: String(doc._id), filename: doc.filename,
    uploadedAt: doc.createdAt, ...chunk,
  })));
  const rows = chunks.map(chunk => {
    const words = tokenize(chunk.text);
    const frequencies = new Map();
    for (const word of words) frequencies.set(word, (frequencies.get(word) || 0) + 1);
    return { chunk, frequencies, length: words.length };
  });
  const average = rows.reduce((sum, row) => sum + row.length, 0) / (rows.length || 1) || 1;
  const documentFrequency = new Map(query.map(word => [word, rows.filter(row => row.frequencies.has(word)).length]));
  return rows.map(row => {
    let score = 0, matched = 0;
    for (const word of query) {
      const frequency = row.frequencies.get(word) || 0;
      if (!frequency) continue;
      matched++;
      const idf = Math.log(1 + (rows.length - documentFrequency.get(word) + 0.5) / (documentFrequency.get(word) + 0.5));
      score += idf * frequency * 2.2 / (frequency + 1.2 * (0.25 + 0.75 * row.length / average));
    }
    return { ...row.chunk, score, matched };
  }).filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score).slice(0, limit);
}
module.exports = { chunkPages, retrieve, tokenize };

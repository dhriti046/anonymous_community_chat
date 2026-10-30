const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const { chunkPages, retrieve } = require('../services/retrieval');
const { decodeUpload, extractDocument, MAX_BYTES } = require('../services/extractDocument');
const { answerQuestion, validateAnswer, NO_ANSWER } = require('../services/collegeAssistant');
const { createChatbotRouter } = require('../routes/chatbotRoutes');
const ADMIN = '507f1f77bcf86cd799439011', STUDENT = '507f1f77bcf86cd799439012';
process.env.JWT_SECRET = 'test-only-secret';
process.env.CHATBOT_ADMIN_IDS = ADMIN;
process.env.GROQ_API_KEY = 'fake-test-key-not-a-real-secret';
const library = [{ _id: ADMIN, filename: 'library.txt', createdAt: new Date(0), chunks: [{ text: 'The campus library opens at 8 AM on weekdays. Bring your student card to borrow books.', page: 1, section: 1 }] },
  { _id: STUDENT, filename: 'hostel.txt', chunks: [{ text: 'Hostel leave applications must be approved by the warden.', page: null, section: 1 }] }];

test('chunking preserves page references and limits extracted length', () => {
  const result = chunkPages([{ text: 'Library facilities are available for students. '.repeat(100), page: 3 }]);
  assert.ok(result.chunks.length > 1);
  assert.ok(result.chunks.every(c => c.text.length <= 1200 && c.page === 3));
  assert.throws(() => chunkPages([{ text: 'x'.repeat(200001) }]), /too long/);
  assert.throws(() => chunkPages([{ text: '   ' }]), /No readable text/);
});
test('retrieval ranks matching passages and rejects unrelated questions', () => {
  assert.equal(retrieve('When does the library open on weekdays?', library)[0].filename, 'library.txt');
  assert.equal(retrieve('Library opening hours?', library)[0].filename, 'library.txt');
  assert.equal(retrieve('Library hours?', library)[0].filename, 'library.txt');
  assert.equal(retrieve('Tell me about hostel leave applications', library)[0].filename, 'hostel.txt');
  assert.deepEqual(retrieve('What is the capital of France?', library), []);
  assert.deepEqual(retrieve('???', library), []);
});
test('upload validation rejects unsupported, oversized, malformed and disguised files', () => {
  assert.throws(() => decodeUpload('../secret.txt', 'dGVzdA=='), /filename/);
  assert.throws(() => decodeUpload('script.exe', 'dGVzdA=='), /Supported/);
  assert.throws(() => decodeUpload('test.txt', '!@#$'), /valid file/);
  assert.throws(() => decodeUpload('test.txt', Buffer.alloc(MAX_BYTES + 1).toString('base64')), /valid file|Maximum/);
  assert.equal(decodeUpload('large.txt', Buffer.alloc(MAX_BYTES, 65).toString('base64')).buffer.length, MAX_BYTES);
  assert.throws(() => decodeUpload('fake.pdf', Buffer.from('fake file').toString('base64')), /valid PDF/);
  assert.throws(() => decodeUpload('fake.docx', 'YQ=='), /valid DOCX/);
});
test('real document extraction works for UTF-8, Markdown, PDF and DOCX', async () => {
  for (const extension of ['.txt', '.md', '.pdf', '.docx']) {
    const buffer = extension === '.pdf' || extension === '.docx'
      ? fs.readFileSync(path.join(__dirname, 'fixtures/library' + extension))
      : Buffer.from('The campus library opens at 8 AM on weekdays.');
    const { chunks } = await extractDocument(buffer, extension);
    assert.match(chunks.map(c => c.text).join(' '), /library opens at 8 AM/);
    if (extension === '.pdf') assert.equal(chunks[0].page, 1);
  }
});
test('unrelated or empty retrieval does not call Groq', async () => {
  const result = await answerQuestion('What is the capital of France?', library, { fetchImpl: () => { throw new Error('must not call'); } });
  assert.equal(result.answer, NO_ANSWER); assert.equal(result.supported, false);
  assert.equal((await answerQuestion('Library hours?', [])).supported, false);
});
test('Groq receives only question and passages; verified citations are returned', async () => {
  let sent;
  const result = await answerQuestion('When does the library open on weekdays?', library, {
    fetchImpl: async (url, options) => {
      assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
      sent = JSON.parse(options.body);
      return { ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
        supported: true, answer: 'The library opens at 8 AM on weekdays. [1]',
        citations: [{ source: 1, quote: 'The campus library opens at 8 AM on weekdays.' }],
      }) } }] }) };
    },
  });
  assert.equal(result.supported, true); assert.equal(result.sources[0].filename, 'library.txt');
  assert.ok(!JSON.stringify(sent).includes(ADMIN)); assert.ok(!JSON.stringify(sent).includes('email'));
  assert.equal(sent.messages.length, 2);
});
test('invented sources, quotes, missing citations and malformed output fail closed', () => {
  const passages = retrieve('Library weekdays', library);
  for (const value of [
    { supported: false },
    { supported: true, answer: 'Open all night [99]', citations: [{ source: 99, quote: 'Invented opening hours' }] },
    { supported: true, answer: 'Open all night [1]', citations: [{ source: 1, quote: 'The library opens at midnight.' }] },
    { supported: true, answer: 'Open at 8 AM', citations: [{ source: 1, quote: 'The campus library opens at 8 AM on weekdays.' }] },
    { supported: true, answer: 'Open at 8 AM [2]', citations: [{ source: 1, quote: 'The campus library opens at 8 AM on weekdays.' }] },
  ]) assert.equal(validateAnswer(value, passages).supported, false);
});
test('provider failures do not leak credentials or raw errors', async () => {
  await assert.rejects(() => answerQuestion('Library weekdays', library, { fetchImpl: async () => ({ ok: false, status: 401 }) }), error => error.status === 502 && !error.message.includes('fake-test'));
  const result = await answerQuestion('Library weekdays', library, { fetchImpl: async () => ({ ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: 'invalid JSON' } }] }) }) });
  assert.equal(result.supported, false);
});
function fixtureRouter({ existingUser = true } = {}) {
  const saved = [];
  const documents = {
    countDocuments: async () => saved.length,
    exists: async ({ checksum }) => saved.some(d => d.checksum === checksum),
    create: async value => { const doc = { ...value, _id: ADMIN, createdAt: new Date(0) }; saved.push(doc); return doc; },
    find: () => ({ select() { return this; }, sort() { return this; }, limit() { return this; }, lean: async () => saved }),
    findByIdAndDelete: async () => saved.pop() || null,
  };
  let calls = 0;
  const router = createChatbotRouter({ documents, users: { exists: async () => existingUser },
    answer: async () => { calls++; return { answer: NO_ANSWER, supported: false, sources: [] }; },
    extract: async () => chunkPages([{ text: 'The campus library opens at 8 AM on weekdays.' }]),
  });
  return { router, saved, get calls() { return calls; } };
}
function request(router, url, { user = STUDENT, method = 'GET', body = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = { method, url, body, headers: user ? { authorization: `Bearer ${jwt.sign({ userId: user }, process.env.JWT_SECRET)}` } : {} };
    const res = { statusCode: 200, set() { return this; }, status(code) { this.statusCode = code; return this; }, json(value) { resolve({ status: this.statusCode, body: value }); } };
    router.handle(req, res, error => reject(error || new Error('Unhandled route')));
  });
}
test('every chatbot endpoint requires login and an existing user', async () => {
  const { router } = fixtureRouter();
  for (const [url, method] of [['/status','GET'],['/documents','GET'],['/documents','POST'],[`/documents/${ADMIN}`,'DELETE'],['/ask','POST']]) {
    assert.equal((await request(router, url, { user: null, method })).status, 401);
  }
  assert.equal((await request(fixtureRouter({ existingUser: false }).router, '/status')).status, 401);
});
test('students cannot upload/delete documents or grant themselves administrator privileges', async () => {
  const { router } = fixtureRouter();
  assert.equal((await request(router, '/documents', { method: 'POST', body: { userId: ADMIN, role: 'admin' } })).status, 403);
  assert.equal((await request(router, `/documents/${ADMIN}`, { method: 'DELETE' })).status, 403);
  assert.equal((await request(router, '/status')).body.canManage, false);
  assert.equal((await request(router, '/status', { user: ADMIN })).body.canManage, true);
});
test('admin upload publishes a safe document listing, duplicate upload fails, deletion removes it', async () => {
  const state = fixtureRouter();
  const body = { filename: 'library.txt', content: Buffer.from('Library hours').toString('base64') };
  assert.equal((await request(state.router, '/documents', { user: ADMIN, method: 'POST', body })).status, 201);
  assert.equal((await request(state.router, '/documents', { user: ADMIN, method: 'POST', body })).status, 409);
  const list = await request(state.router, '/documents');
  assert.equal(list.body.documents[0].status, 'ready');
  assert.ok(!JSON.stringify(list.body).includes('chunks')); assert.ok(!JSON.stringify(list.body).includes('checksum'));
  assert.equal((await request(state.router, `/documents/${ADMIN}`, { user: ADMIN, method: 'DELETE' })).status, 200);
  assert.equal(state.saved.length, 0);
});
test('question validation and user rate limits apply before generation', async () => {
  const state = fixtureRouter();
  assert.equal((await request(state.router, '/ask', { method: 'POST', body: { question: { $ne: '' } } })).status, 400);
  assert.equal((await request(state.router, '/ask', { method: 'POST', body: { question: 'x'.repeat(2001) } })).status, 400);
  for (let i = 0; i < 6; i++) assert.equal((await request(state.router, '/ask', { method: 'POST', body: { question: 'Library hours?' } })).status, 200);
  assert.equal((await request(state.router, '/ask', { method: 'POST', body: { question: 'Library hours?' } })).status, 429);
  assert.equal(state.calls, 6);
});
test('missing Groq key produces an actionable error without a provider request', async () => {
  const state = fixtureRouter(); const key = process.env.GROQ_API_KEY; delete process.env.GROQ_API_KEY;
  try {
    const result = await request(state.router, '/ask', { method: 'POST', body: { question: 'Library hours?' } });
    assert.equal(result.status, 503); assert.equal(state.calls, 0);
  } finally { process.env.GROQ_API_KEY = key; }
});

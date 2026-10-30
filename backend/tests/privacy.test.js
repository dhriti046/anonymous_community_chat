const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
process.env.JWT_SECRET = 'test-only-secret';
const User = require('../models/User');
const Pending = require('../models/PendingRegistration');
const { publicProfile } = require('../utils/publicProfile');
const fixture = { _id: '507f1f77bcf86cd799439011', username: 'CampusOwl', avatar: '', bio: '', interests: [], email: 'private@iitrpr.ac.in', googleId: 'private-google-id' };
const query = value => ({ select: async () => value });
let known, pending, created;
User.find = async () => [fixture];
User.findById = async () => fixture;
User.findByIdAndUpdate = async () => fixture;
// Google lookup uses .select(); registration identity lookup awaits the query itself.
User.findOne = filter => {
  const value = filter.googleId && known ? fixture : null;
  return { select: async () => value, then: resolve => Promise.resolve(value).then(resolve) };
};
User.create = async data => { created = data; return { ...fixture, ...data }; };
Pending.create = async data => { pending = data; };
Pending.findOneAndDelete = filter => {
  let value = null;
  if (pending && pending.tokenHash === filter.tokenHash && pending.expiresAt > filter.expiresAt.$gt) {
    value = pending; pending = null;
  }
  return query(value);
};
OAuth2Client.prototype.verifyIdToken = async ({ idToken }) => {
  if (idToken === 'invalid') throw new Error('invalid');
  return { getPayload: () => ({ sub: fixture.googleId, email: fixture.email,
    email_verified: true, hd: idToken === 'wrong-domain' ? 'other.edu' : 'iitrpr.ac.in' }) };
};
const routes = {
  '/api/users': require('../routes/userRoutes'),
  '/api/auth': require('../routes/authRoutes'),
};
const token = jwt.sign({ userId: fixture._id }, process.env.JWT_SECRET);
async function request(path, { auth = false, method = 'GET', body } = {}) {
  const prefix = Object.keys(routes).find(p => path.startsWith(p));
  return new Promise((resolve, reject) => {
    const req = { method, url: path.slice(prefix.length) || '/',
      headers: auth ? { authorization: `Bearer ${token}` } : {}, body: body || {} };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      set() { return this; },
      json(value) { resolve({ status: this.statusCode, body: JSON.parse(JSON.stringify(value)) }); },
    };
    routes[prefix].handle(req, res, err => reject(err || new Error('Unhandled route')));
  });
}
function noIdentity(body) {
  const text = JSON.stringify(body);
  for (const secret of ['email', 'googleId', fixture.email, fixture.googleId]) assert.ok(!text.includes(secret), secret);
}
test('profile endpoints require authentication and never return identity, including own profile', async () => {
  for (const path of ['/api/users', '/api/users/me', `/api/users/${fixture._id}`]) {
    assert.equal((await request(path)).status, 401);
    const result = await request(path, { auth: true });
    assert.equal(result.status, 200); noIdentity(result.body);
  }
});
test('schema hides identity by default and serialization strips explicit selections', () => {
  assert.equal(User.schema.path('email').options.select, false);
  assert.equal(User.schema.path('googleId').options.select, false);
  noIdentity(new User(fixture).toJSON());
  assert.deepEqual(Object.keys(publicProfile(fixture)).sort(), ['_id','username','avatar','bio','interests'].sort());
});
test('profile updates do not echo identity fields', async () => {
  const result = await request('/api/auth/update-profile', { method: 'PUT', auth: true, body: { bio: '', interests: [], email: 'attacker@example.com' } });
  assert.equal(result.status, 200); noIdentity(result.body);
});
test('Google login rejects invalid tokens and wrong hosted domains', async () => {
  for (const [credential, status] of [['invalid',401],['wrong-domain',403]]) {
    assert.equal((await request('/api/auth/google', { method: 'POST', body: { credential } })).status, status);
  }
});
test('existing login returns only session token and public profile', async () => {
  known = true;
  const result = await request('/api/auth/google', { method: 'POST', body: { credential: 'valid' } });
  assert.equal(result.status, 200); assert.ok(result.body.token); noIdentity(result.body);
  known = false;
});
test('raw identity cannot complete registration or obtain an existing account token', async () => {
  known = true;
  const result = await request('/api/auth/complete-profile', { method: 'POST', body: { googleId: fixture.googleId, email: fixture.email, username: 'attacker' } });
  assert.equal(result.status, 401); assert.ok(!result.body.token); known = false;
});
async function begin() {
  const result = await request('/api/auth/google', { method: 'POST', body: { credential: 'valid' } });
  assert.equal(result.status, 200); noIdentity(result.body);
  assert.match(result.body.registrationToken, /^[a-f0-9]{64}$/);
  assert.equal(pending.tokenHash, crypto.createHash('sha256').update(result.body.registrationToken).digest('hex'));
  return result.body.registrationToken;
}
test('registration ignores forged identity, consumes proof once, and returns no identity', async () => {
  const registrationToken = await begin();
  const body = { registrationToken, username: 'NewOwl', googleId: 'forged', email: 'forged@example.com', avatar: 'identifying-photo' };
  const result = await request('/api/auth/complete-profile', { method: 'POST', body });
  assert.equal(result.status, 201); noIdentity(result.body);
  assert.equal(created.googleId, fixture.googleId); assert.equal(created.email, fixture.email); assert.equal(created.avatar, '');
  assert.equal((await request('/api/auth/complete-profile', { method: 'POST', body })).status, 401);
});
test('expired proofs are rejected before TTL cleanup', async () => {
  const registrationToken = await begin(); pending.expiresAt = new Date(0);
  assert.equal((await request('/api/auth/complete-profile', { method: 'POST', body: { registrationToken, username: 'NewOwl' } })).status, 401);
});
test('registration for an account created in another tab never issues an existing session', async () => {
  const registrationToken = await begin(); known = true;
  const result = await request('/api/auth/complete-profile', { method: 'POST', body: { registrationToken, username: 'NewOwl' } });
  assert.equal(result.status, 409); assert.ok(!result.body.token); known = false;
});
const { pathToFileURL } = require('node:url');
const path = require('node:path');
test('browser storage cleanup removes legacy identity fields while preserving public profiles', async () => {
  const { cleanStoredProfile } = await import(pathToFileURL(path.resolve(__dirname, '../../frontend/src/profileStorage.js')));
  const values = new Map([['user', JSON.stringify(fixture)]]);
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  cleanStoredProfile(storage);
  const cleaned = JSON.parse(values.get('user')); noIdentity(cleaned);
  assert.equal(cleaned.username, fixture.username);
  values.set('user', 'invalid json'); cleanStoredProfile(storage); assert.ok(!values.has('user'));
});

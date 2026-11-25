// Access-control test: each user sees and changes ONLY their own notifications.   cd backend && npm run test:notifiso
const os = require('os'), path = require('path'), fs = require('fs'), stamp = Date.now() + '_' + process.pid;
process.env.NODE_ENV = 'test'; process.env.SEED_DEMO = 'false'; process.env.DB_PATH = path.join(os.tmpdir(), `lj_iso_${stamp}.db`);
const { test, after } = require('node:test'), assert = require('node:assert/strict');
const db = require('../database/db'), NT = require('../controllers/notifications');
after(() => { try { db.close && db.close(); } catch { /* ignore */ } for (const s of ['', '-wal', '-shm']) fs.rmSync(process.env.DB_PATH + s, { force: true }); });
const mk = n => db.prepare('INSERT INTO users(name,email,password) VALUES(?,?,?)').run(n, n.toLowerCase() + '@iso.local', 'x').lastInsertRowid;
const call = (fn, user, body = {}) => { let out, code = 200; const headers = {}; fn({ user, params: {}, body, query: {} }, { json: b => { out = b; }, set(h) { Object.assign(headers, h); return this; }, status(c) { code = c; return this; } }); return { out, code, headers }; };
const A = mk('Alice'), B = mk('Bob');
const same = { id: 'goal:1:2026-12-01', kind: 'goal-due', title: 'Goal due tomorrow', body: 'x', to: '/goals', at: 5 };
const onlyA = { id: 'as:9:overdue', kind: 'overdue', title: 'Alice private essay is overdue', body: 'secret', to: '/assignments', at: 9 };
const list = u => call(NT.list, { id: u }).out.notifications;

test('a user never sees another user\'s notifications', () => {
  call(NT.sync, { id: A }, { items: [same, onlyA] }); call(NT.sync, { id: B }, { items: [same] });
  assert.equal(list(A).length, 2); assert.equal(list(B).length, 1); assert.equal(list(B).find(x => x.id === onlyA.id), undefined);
  assert.ok(!JSON.stringify(list(B)).includes('Alice private'));
});
test('read / clear by id cannot touch someone else\'s rows, even for the same notification id', () => {
  call(NT.read, { id: B }, { ids: [onlyA.id] }); call(NT.clear, { id: B }, { ids: [onlyA.id] });
  assert.equal(list(A).find(x => x.id === onlyA.id).read, false); assert.equal(list(A).find(x => x.id === onlyA.id).cleared, false);
  call(NT.clear, { id: B }, { ids: [same.id] });
  assert.equal(list(B).find(x => x.id === same.id).cleared, true); assert.equal(list(A).find(x => x.id === same.id).cleared, false);
});
test('"mark all read" only affects the caller', () => {
  call(NT.read, { id: A }, { all: true });
  assert.ok(list(A).every(x => x.read)); db.prepare("UPDATE notifications SET is_read=0 WHERE user_id=?").run(B);
  call(NT.read, { id: A }, { all: true }); assert.ok(list(B).every(x => !x.read));
});
test('a user_id / owner sent in the request body is ignored (identity comes from the verified token only)', () => {
  call(NT.sync, { id: B }, { user_id: A, userId: A, items: [{ ...onlyA, id: 'spoof:1', title: 'spoof' }] });
  assert.ok(list(B).find(x => x.id === 'spoof:1')); assert.equal(list(A).find(x => x.id === 'spoof:1'), undefined);
  call(NT.read, { id: B }, { user_id: A, ids: [onlyA.id] }); assert.equal(list(A).find(x => x.id === onlyA.id).read, true); // A's own earlier mark-all, unchanged by B
});
test('requests without an authenticated user are rejected (401) and touch nothing', () => {
  for (const fn of [NT.list, NT.sync, NT.read, NT.clear]) for (const user of [undefined, null, {}, { id: 'abc' }]) assert.equal(call(fn, user, { ids: ['x'], items: [same] }).code, 401);
  assert.equal(db.prepare('SELECT COUNT(*) c FROM notifications').get().c, 4);
});
test('responses are private and never cacheable', () => {
  const r = call(NT.list, { id: A }); assert.match(r.headers['Cache-Control'], /no-store/); assert.match(r.headers['Cache-Control'], /private/); assert.equal(r.headers.Vary, 'Authorization');
});
test('stored links can only point inside the app', () => {
  const bad = ['https://evil.example', '//evil.example', 'javascript:alert(1)', '/\\evil.example', 'goals', '/a b'];
  call(NT.sync, { id: A }, { items: [...bad.map((to, i) => ({ id: 'l:' + i, kind: 'k', title: 't', body: 'b', to, at: 1 })), { id: 'l:ok', kind: 'k', title: 't', body: 'b', to: '/goals?x=1', at: 1 }] });
  const l = list(A); for (let i = 0; i < bad.length; i++) assert.equal(l.find(x => x.id === 'l:' + i).to, '', bad[i]);
  assert.equal(l.find(x => x.id === 'l:ok').to, '/goals?x=1');
});
test('every /notifications route is registered behind the auth middleware', () => {
  const src = fs.readFileSync(path.join(__dirname, '../routes/api.js'), 'utf8');
  const routes = [...src.matchAll(/router\.(get|post|put|delete)\('(\/notifications[^']*)',\s*([^,]+),/g)];
  assert.equal(routes.length, 5); for (const m of routes) assert.equal(m[3].trim(), 'auth', m[2]);
});
test('stream is also guarded (no user -> 401, no connection registered)', () => {
  const hub = require('../lib/notifyHub'); const before = hub.stats().connections; let code;
  NT.stream({ user: undefined }, { status(c) { code = c; return this; }, json() {}, writeHead() { throw new Error('must not open'); } });
  assert.equal(code, 401); assert.equal(hub.stats().connections, before);
});

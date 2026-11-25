# User-specific notifications: access-control hardening (only change)

Notifications were already stored per user (`notifications` table, `user_id` on every query, all routes behind `auth`). This update verifies and tightens that, and adds tests. No other module changed.

## Changed
- `backend/controllers/notifications.js`
  - Every handler (list, sync, read, clear, stream) now rejects a request with no authenticated user (401) and only ever uses `req.user.id` from the verified token.
  - Responses send `Cache-Control: private, no-store` and `Vary: Authorization`, so one user's list can't be shown to the next person on a shared device or proxy.
  - Stored `to` links must be in-app paths (`/goals`); external URLs, `//host`, `javascript:` are stored as empty.
- NEW `backend/tests/notificationsIsolation.test.js` (`npm run test:notifiso`, also in `npm test`): cross-user visibility, read/clear/mark-all isolation, spoofed `user_id` ignored, 401 without a user, no-store headers, link sanitising, all 5 routes behind `auth`.
- `backend/package.json`: test script entries.

Not changed: database schema, routes, frontend, all other modules.

**Art Hive — Documentation**

This document explains what the Art Hive web app does and how it works: overall features, tech stack, data models, game system, and then details like JWT authentication and axios usage.

---

**1. Overview — What the app is**

- **Concept:** Art Hive is a social creative platform where users can:
  - Create an account and log in.
  - Upload and share artwork.
  - Like and star posts.
  - Comment on other people’s posts.
  - Follow/unfollow other artists and see suggested profiles.
  - Play a collaborative “Gartic Phone” style drawing game with others.
- **Frontend:** React app in `frontend/` using React Router, Context API, axios for HTTP, socket.io-client for real-time game updates, Tailwind-style utility classes, and toast notifications.
- **Backend:** Node/Express API in `backend/` using MongoDB (via Mongoose), JWT for authentication, bcrypt for password hashing, express-validator for input validation, and Socket.IO for real-time events.

---

**2. Repository layout (high level)**

- `backend/`
  - `server.js` — Express + Socket.IO server entry.
  - `config/db.js` — MongoDB connection.
  - `controllers/` — route handlers (auth, posts, comments, game).
  - `routes/` — Express route definitions.
  - `models/` — Mongoose models (`User`, `Post`, `Comment`, `GameSession`).
  - `middleware/` — JWT auth, error handler, etc.
  - `utils/` — helpers like `generateToken.js`.
- `frontend/`
  - `src/App.js` — main router and app shell.
  - `src/pages/` — screens like `Feed`, `Profile`, `Game`, `SketchbookPro`.
  - `src/components/` — UI building blocks (navbar, post cards, modals, game views).
  - `src/context/` — `AuthContext`, `ThemeContext`, `SearchContext`.
  - `src/utils/api.js` — axios configuration and API helper functions.
  - `src/hooks/useGameSocket.js` — Socket.IO client hook for the game.

**Key backend files referenced**

- JWT helper: `backend/utils/generateToken.js`
- Auth middleware: `backend/middleware/authMiddleware.js`
- Auth controller: `backend/controllers/authController.js`
- Game model: `backend/models/GameSession.js`

**Key frontend files referenced**

- App shell & routing: `frontend/src/App.js`
- Auth context: `frontend/src/context/AuthContext.js`
- Axios & APIs: `frontend/src/utils/api.js`
- Game page: `frontend/src/pages/Game.js`
- Feed page: `frontend/src/pages/Feed.js`

---

**3. Tech stack & environment variables**

**Frontend stack**

- React 18 (`react`, `react-dom`).
- Routing: `react-router-dom` (see `App.js`).
- State: React Context API for auth, theme, search.
- HTTP: `axios` with centralized config in `src/utils/api.js`.
- Real-time: `socket.io-client` via `useGameSocket` hook.
- UI/Styling: Tailwind-like classes via `tailwindcss`, `postcss`, `autoprefixer`.
- UX helpers: `react-toastify` for toast messages, `react-icons` for icons.

**Backend stack**

- Runtime: Node.js 18+.
- Web framework: `express`.
- Database: MongoDB via `mongoose`.
- Auth: `jsonwebtoken` for JWT, `bcryptjs` for password hashing.
- Validation: `express-validator` for request validation.
- Real-time: `socket.io` server attached to Express HTTP server.
- Misc: `cors` for cross-origin support, `dotenv` for env vars.

**Environment variables (important)**

- `JWT_SECRET` — secret used to sign JWT tokens.
- `JWT_EXPIRE` — optional JWT expiration (e.g., `7d`).
- `MONGO_URI` — MongoDB connection string.
- `CORS_ORIGIN` — allowed origin for CORS (frontend URL).
- `PORT` — backend port (default 5001).
- `REACT_APP_API_URL` — frontend base API URL (optional; `api.js` falls back to `http://localhost:5001`).

---

**4. Data models (MongoDB/Mongoose)**

These are simplified descriptions of the Mongoose models used by the app.

**User (`backend/models/User.js`)**

- Fields (simplified):
  - `username`, `email`, `password` (hashed with `bcryptjs`).
  - `profilePic`, `bio`.
  - `followers` and `following` (arrays of user IDs).
  - `dateJoined`, timestamps.
- Methods:
  - `matchPassword` — compares plain text password with stored hash.

**Post (`backend/models/Post.js`)**

- Typical fields:
  - `user` (owner reference), `imageUrl` (or drawing URL), `caption`.
  - `likes`/`likesCount`, `starredBy`/`isStarred`, `remixes`, `isGameArt`.
  - Timestamps, and possibly `gameSessionId` for game-generated art.

**Comment (`backend/models/Comment.js`)**

- Fields:
  - `postId` (reference to `Post`).
  - `user` (reference to `User`).
  - `text`, timestamps.

**GameSession (`backend/models/GameSession.js`)**

- Fields (from the actual schema):
  - `code`: unique, uppercase game code used to join.
  - `hostId`: ID/nickname of the host.
  - `players`: list of players `{ nickname, socketId, userId, isGuest }`.
  - `chains`: array of chains for Gartic Phone style game: each has `chainId`, `originalPrompt`, `originalPlayer`, and `entries`.
  - `entries`: each entry has `playerNickname`, `type` (`prompt` or `drawing`), `data` (text or base64 drawing), and `round`.
  - `drawings`: legacy storage for drawings.
  - `status`: `waiting`, `in-progress`, or `finished`.
  - `currentRound`, `totalRounds`, `createdAt`, `endedAt`.
- Behavior:
  - Pre-save hook auto-generates `code` if not present.

---

**5. Routes & main features**

Routes live under `backend/routes/` and call controllers in `backend/controllers/`.

**Auth (`/api/auth`)**

- `POST /register` — create a new user; returns user + JWT.
- `POST /login` — log in existing user; returns user + JWT.
- `GET /me` — get current user (protected by `protect` middleware).
- `PUT /profile` — update profile (username, bio, profilePic, password); returns updated user + possibly a new JWT.
- `PUT /follow/:userId` — follow another user.
- `PUT /unfollow/:userId` — unfollow a user.
- `GET /suggested` — get suggested users to follow.

**Posts (`/api/posts`)**

- `GET /` — list posts with pagination & optional search/sort:
  - Query params: `page`, `limit`, `q` (search), `sort`.
- `GET /starred` — posts starred by the current user.
- `GET /liked` — posts liked by the current user.
- `GET /user/:userId` — posts created by a specific user.
- `GET /:id` — single post details.
- `POST /` — create a new post (upload art, caption, etc.).
- `PUT /:id` — update a post.
- `DELETE /:id` — delete a post.
- `PUT /:id/like` / `PUT /:id/unlike` — like/unlike a post.
- `PUT /:id/star` / `PUT /:id/unstar` — star/unstar a post.
- `GET /:id/remixes` — get remixed versions of a post.

**Comments (`/api/comments`)**

- `GET /:postId` — get comments for a post.
- `POST /` — create comment `{ postId, text }`.
- `DELETE /:id` — delete a comment.

**Game (`/api/game`)**

- `POST /create` — create a game session; host provides `nickname` and `totalRounds`.
- `POST /join` — join existing game by `code`, with `nickname` and optional `userId`.
- `GET /:code` — fetch game session details.
- `POST /:code/start` — start game, change status to in-progress, set round 1.
- `GET /:code/task/:nickname` — get current player’s task (prompt or drawing to create).
- `POST /:code/submit-entry` — submit an entry for current round.
- `POST /:code/submit` — submit drawing (used by SketchbookPro canvas page).
- `POST /:code/end` — end game.
- `POST /:code/leave` — leave game.
- `GET /:code/results` — get full chains/results for the finished game.

---

**6. Frontend flow & main pages**

**App shell & routing (`frontend/src/App.js`)**

- Wraps the app with providers:
  - `ThemeProvider` — for dark/light theme and colors.
  - `AuthProvider` — for user session and JWT.
  - `SearchProvider` — for global search query.
- Uses `react-router-dom` to define routes:
  - `/` — `Feed` page (main art feed).
  - `/login` — login form.
  - `/register` — registration form.
  - `/profile/:userId` — user profile page.
  - `/game` — game screen.
  - `/sketchbook` — `SketchbookPro` drawing canvas.
  - `/favorites` — protected page for starred posts.
  - `/liked` — protected page for liked posts.
- Protected routes use `ProtectedRoute`, which checks `useAuth()` and shows a loading state while auth is being initialized.

**Feed page (`frontend/src/pages/Feed.js`)**

- Uses `postsAPI.getAllPosts(page, limit, q)` to load posts.
- Integrates with `SearchContext` so search bar filters the feed.
- Implements infinite-like pagination (`Load More` button) using `page` and `hasMore`.
- Preloads first few images for better UX.
- Uses components:
  - `PostCard` — shows a single post (image, caption, likes, comments).
  - `TrendingCarousel` — top/trending art.
  - `SuggestedProfiles` — shows suggested users from `/api/auth/suggested`.
  - `CreativeActions` — shortcuts to upload art, start a remix, etc.

**Game page (`frontend/src/pages/Game.js`)**

- Handles the Gartic Phone-style game lifecycle:
  - `GameMenu` — create/join game.
  - `GameLobby` — waiting room; shows players and start button.
  - `GameTask` — where players enter prompts or see instructions to draw.
  - `GameResults` — final chains/results with reveal controls.
- Stores and restores some state in `localStorage` (`arthive_game_state`) to let users rejoin games after page reloads.
- Uses `gameAPI` endpoints to create/join/start the game, get tasks, submit entries, and get results.
- Uses `useGameSocket` to manage the Socket.IO client and join the proper room.
- Emits and listens to socket events (via the hook and `server.js`) to:
  - Join a game room.
  - Broadcast `start-game`, `entry-submitted`, `submit-prompt`, `next-round`, `game-ended`, `reveal-step`, `reveal-reset`, `player-left`.
- Can repost finished game drawings to the main feed using `postsAPI.createPost`.

---

**7. How authentication works (JWT) — end-to-end**

1. User registers or logs in

- Endpoint: `POST /api/auth/register` or `POST /api/auth/login` (see `authController.js`).
- On success, server responds with a JSON object containing user fields and a `token` property. Example (login/register response):

```json
{
  "_id": "641a...",
  "username": "artist123",
  "email": "artist@example.com",
  "profilePic": "...",
  "bio": "...",
  "dateJoined": "2024-01-01T00:00:00.000Z",
  "token": "<JWT_TOKEN_HERE>"
}
```

2. How the server creates tokens

- File: `backend/utils/generateToken.js` — the implementation used by controllers is:

```javascript
import jwt from "jsonwebtoken";

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};
```

- This signs a payload `{ id }` with `JWT_SECRET` and an expiration. The returned string is the JWT token.

3. Client stores the token and attaches it to requests

- In the React app, `AuthContext` stores the token in `localStorage` under the key `token` and sets an axios default header:

```javascript
// frontend/src/context/AuthContext.js
localStorage.setItem("token", data.token);
axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
```

- Once `axios.defaults.headers.common['Authorization']` is set, all subsequent axios requests include the `Authorization` header unless overridden.

4. Server verifies tokens on protected routes

- Middleware: `backend/middleware/authMiddleware.js` — the `protect` middleware expects the header `Authorization: Bearer <token>` and verifies it with `jwt.verify(token, process.env.JWT_SECRET)`.
- If verification succeeds, `req.user` is set to the user object (password excluded) and the request continues.

Snippet of the middleware behavior (simplified):

```javascript
if (
  req.headers.authorization &&
  req.headers.authorization.startsWith("Bearer")
) {
  token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id).select("-password");
  next();
} else {
  res.status(401).json({ message: "Not authorized, no token" });
}
```

There is also `optionalAuth`, which attempts to decode a token if present but does not fail the request when there's no token — useful for endpoints that are public but can provide extra data to logged-in users.

---

**8. Axios usage and configuration (frontend)**

- File: `frontend/src/utils/api.js` sets `axios.defaults.baseURL` and adds simple request and response interceptors for debugging.
- It exports grouped API helper objects: `authAPI`, `postsAPI`, `commentsAPI`, `gameAPI`. These helpers call endpoints such as `axios.post("/api/auth/login")`, `axios.get("/api/posts")`, etc.

Key points:

- `axios.defaults.baseURL` is set to `process.env.REACT_APP_API_URL || "http://localhost:5001"`. This means calls like `axios.get('/api/auth/me')` request `http://localhost:5001/api/auth/me` by default (or the configured `REACT_APP_API_URL`).
- The app sets `axios.defaults.headers.common["Authorization"] = 'Bearer <token>'` in `AuthContext` when the user logs in or when the app loads a token from `localStorage`. After that, you do not need to attach headers manually for each request — the `authAPI` and other helpers will send the header implicitly.

Example from `api.js` (how API helpers are defined):

```javascript
export const authAPI = {
  login: (email, password) =>
    axios.post("/api/auth/login", { email, password }),
  register: (username, email, password) =>
    axios.post("/api/auth/register", { username, email, password }),
  getMe: () => axios.get("/api/auth/me"),
  updateProfile: (data) => axios.put("/api/auth/profile", data),
};
```

Thus, an authenticated request to get the current user looks like this from the client:

```javascript
// axios already has Authorization header set by AuthContext
const { data } = await axios.get("/api/auth/me");
```

And the server `protect` middleware will read the header, verify the token, and set `req.user`.

---

**9. Typical flows and error handling**

- Login error: server returns 401 with `{ message: 'Invalid email or password' }`.
- Token missing or invalid: protected endpoints return 401 with `{ message: 'Not authorized, no token' }` or `{ message: 'Not authorized, token failed' }` depending on the failure.
- `optionalAuth` endpoints will continue without `req.user` if token missing/invalid.

---

**10. Game/API real-time overview**

- Socket.IO is initialized in `backend/server.js` and attached to the HTTP server. The `io` instance is also saved on `app` via `app.set('io', io)` so routes can emit events.
- Frontend uses `socket.io-client` via hooks (e.g., `frontend/src/hooks/useGameSocket.js`) to join rooms and exchange game events.

---

**11. How to run locally (quick start)**

1. Backend

```bash
cd backend
npm install
# Create a .env with at minimum: JWT_SECRET, MONGO_URI
npm run dev
```

2. Frontend

```bash
cd frontend
npm install
# Optionally set REACT_APP_API_URL to point to the backend
npm start
```

---

**12. Security notes & best practices**

- Keep `JWT_SECRET` out of version control.
- Shorter token expiry reduces risk from leaked tokens; use refresh tokens for long-lived sessions if needed.
- Use HTTPS in production so Authorization headers are sent securely.
- Consider using httpOnly cookies for tokens if you want to mitigate certain XSS risks (this project currently stores tokens in `localStorage`).

---

**13. Where to look next in the codebase**

- `backend/models/User.js` — password hashing and `matchPassword` implementation.
- `backend/routes/*` — route definitions and where `protect`/`optionalAuth` are applied.
- `frontend/src/context/AuthContext.js` — login/register/logout logic and axios header management.
- `frontend/src/utils/api.js` — all client API helpers and axios configuration.

If you want, I can:

- Add sequence diagrams for the JWT flow.
- Show code examples for manually attaching tokens to a single request.
- Add examples for error-handling best practices.

File added: `DOCUMENTATION.md`

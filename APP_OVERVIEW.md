# ArtHive - Application Overview

ArtHive is a full-stack social platform tailored for artists. It seamlessly integrates social networking features with creative tools, allowing users to upload, remix, interact with art, manage collections, play art-related games, and track their progression through an experience point (XP) and achievement system.

## 🏗️ Tech Stack & Frameworks

The application is built using the **MERN** stack (MongoDB, Express, React, Node.js), combined with real-time websocket and drawing capabilities.

### Frontend

- **Framework:** React.js (v18)
- **Styling:** Tailwind CSS (for rapid utility-first styling) & PostCSS
- **State Management:** Zustand (for lightweight global state) & React Context API
- **Routing:** React Router DOM (v6)
- **Interactive Canvas / Drawing:** Fabric.js (Used in components like `ArtJamCanvas` for creating & remixing art)
- **Layouts:** `react-masonry-css` (for Pinterest-like masonry image grids shown in `MasonryPostCard`)
- **HTTP Client:** Axios
- **Real-time Engine:** Socket.io-client (for active games widgets, notifications, live chat)

### Backend

- **Environment:** Node.js (v18+)
- **Server Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose (v8)
- **Real-time Services:** Socket.io (WebSocket handling in `socketHandler.js` for games, chat messaging, and notifications)
- **Storage:** Supabase (`@supabase/supabase-js`) is configured for seamless media and file storage capabilities.
- **Validation:** Express-Validator

## 🔐 Authentication

Auth implementation is custom, handled via native JSON Web Tokens (JWT).

- **Password Hashing:** `bcryptjs` is utilized to salt and hash user passwords prior to storing them in MongoDB.
- **Tokens:** `jsonwebtoken` is used in `utils/generateToken.js` and `middleware/authMiddleware.js`.
- **Flow:** When a user registers or logs in, the API returns a securely signed JWT and the user's profile information. Subsequent protected requests (e.g., posting art, playing a game) require the token to be passed via headers (`Authorization: Bearer <token>`).

## 🧮 Core Algorithms & Logic

### 1. Progression & Gamification (`progressionHelper.js`)

ArtHive incorporates a detailed RPG-style progression algorithm:

- **XP Ecosystem:** Users earn specific Experience Point (XP) amounts for various actions. E.g., Creating a post (10 XP), Receiving a like (2 XP), Remixing art (15 XP), Completing Daily Challenges (50 XP), Playing/Winning games (20-30 XP).
- **Achievement System:** Uses condition-checker algorithms (`condition: (stats) => stats.postsCreated >= 10`) to automatically award badges like "Prolific Artist", "Remix Royalty", or "Challenge Master" dynamically.

### 2. Social & Feeds Algorithms

- **Interactions:** Tracking likes, comments, and reactions dynamically updates user stats and recalculates XP in real-time.
- **Masonry Rendering:** Layout algorithm mapping images to responsive column systems based on client screen-width bounds (via `react-masonry-css`).
- **Remixing Logic:** Posts can be cloned directly into the Fabric.js canvas environment, preserving layers and metadata so users can derive ("remix") other artists' work.

### 3. Real-time Synchronization

- Websocket (Socket.io) multiplexing ensures lightweight, immediate delivery. Chat meshes (`MessageController` & `socketHandler.js`), in-game drawing payloads (`GameSession`, `GameResults`), and live notification pulses are broadcasted directly to specific connected socket IDs rather than pinging REST endpoints constantly.

## 📁 Key Features & Modules

- **Creative Engine:** In-app art creation (`ArtJamCanvas.jsx`, `ColorPicker.jsx`, `LayerManager.jsx`, `BrushSettings.jsx`).
- **Challenges & Games:** Daily art challenges and active multi-user drawing games (`GameSession.js`).
- **Community:** Groups (`Group.js`), Chat pipelines (`Chat.jsx`, `Message.js`), Collections.
- **Profiles:** Detailed user stats (`LevelUpModal.jsx`, `AchievementBadge.jsx`) tracking streaks and unlocks.

---

_Created as an overarching diagnostic view of the ArtHive project workspace._

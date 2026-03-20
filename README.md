# ArtHive - Social Platform for Artists

ArtHive is a full-stack MERN (MongoDB, Express.js, React, Node.js) social platform designed for artists to share their artwork, interact with the community, and play creative games together.

## 🎨 Features

### Core Features
- **User Authentication**: Secure JWT-based registration and login
- **Art Feed**: Browse and discover artwork from the community
- **Post Artwork**: Upload and share your creations with captions
- **Interactions**: Like, react, and comment on posts
- **User Profiles**: View artist profiles and their artwork galleries
- **Profile Editing**: Update bio and profile information
- **Upload Artwork**: Modal-based art upload with image preview, title, and description
- **Follow System**: Follow/unfollow users and discover new artists
- **Suggested Profiles**: Smart recommendations for artists to follow
- **Dark/Light Mode**: Toggle between themes with persistent preference
- **Collections & Groups**: Create and join groups, curate artwork into collections
- **Real-time Messaging & Notifications**: Direct messaging between users and in-app notifications
- **Search Functionality**: Discover artists, posts, and groups

### 🏆 Progression & Gamification
- **Level System**: Earn XP and level up by engaging with the platform
- **Daily Challenges**: Complete daily art prompts to earn bonus XP and maintain streaks
- **Achievements**: Unlock badges for milestones (e.g., "First Post", "Social Butterfly")
- **XP Rewards**:
  - Post Artwork: 10 XP
  - Daily Challenge: 50 XP
  - Receive Like: 2 XP
  - Receive Comment: 5 XP
  - Create Remix: 15 XP
- **Leaderboards**: Compete with other artists for top spots
- **Visual Feedback**: Animated progress bars and level-up celebrations

### Creative Tools
- **Digital Sketchbook**: Advanced lightweight drawing app built in the browser
  - **Brush Engine**: Multiple brush types (Pencil, Paintbrush, Marker, Airbrush, Eraser)
  - **Color Management**: Custom color picker, predefined colors
  - **Brush Control**: Size and opacity sliders with real-time preview
  - **Full History**: Unlimited Undo and Redo functionality
  - **Layer Management**: Support for multiple layers and blending
  - **Timelapse**: Record and playback your drawing process
  - **Export & Share**: Save locally or post directly to your ArtHive feed
  - **Mobile Support**: Full touch/swipe gesture support for tablets and phones

### Social Gaming
- **ArtHive Game** (Inspired by Gartic Phone):
  - Create or join games with invite codes
  - No login required to play - guests can join with a nickname
  - Draw and guess in rounds
  - Repost game artwork to your ArtHive feed (requires login)
  - Real-time multiplayer using Socket.IO

## 📁 Project Structure

```text
Art Hive/
├── backend/                    # Node.js + Express backend
│   ├── config/                 # DB (MongoDB) and Storage (Supabase) configurations
│   ├── controllers/            # Route logic (Auth, Posts, Groups, Messages, etc.)
│   ├── middleware/             # Auth, upload, and error handling
│   ├── models/                 # Mongoose schemas (User, Post, Group, Collection, Message...)
│   ├── routes/                 # API endpoints
│   ├── socket/                 # Socket.io handlers for real-time features
│   ├── utils/                  # Helpers (JWT generation, progression, etc.)
│   └── server.js               # Entry point
│
└── frontend/                   # React frontend
    ├── public/                 # Static assets
    ├── src/
    │   ├── components/         # Reusable UI components (Modals, Widgets, Canvas tools)
    │   ├── context/            # React Context (Auth, Theme, Search)
    │   ├── hooks/              # Custom hooks (e.g., useBrushEngine, useCanvasHistory)
    │   ├── pages/              # Route pages (Home, Profile, Collections, Groups, etc.)
    │   ├── store/              # Global state management (Zustand)
    │   └── utils/              # Helper functions
    ├── package.json
    └── tailwind.config.js      # Tailwind CSS configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)
- Supabase Account (for image storage)

### Installation
1. **Clone the repository**
2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```
3. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

### Environment Variables
Create a `.env` file in the `backend/` directory with the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### Running the App
1. **Start the Backend:**
   ```bash
   cd backend
   npm run dev
   ```
2. **Start the Frontend:**
   ```bash
   cd frontend
   npm start
   ```
3. Open `http://localhost:3000` in your browser.

## 🛠️ Technology Stack
- **Frontend:** React, Tailwind CSS, Zustand, Socket.IO Client
- **Backend:** Node.js, Express.js, Socket.IO
- **Database:** MongoDB (Mongoose)
- **Storage:** Supabase

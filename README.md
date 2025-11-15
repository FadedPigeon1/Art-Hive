# ArtHive - Social Platform for Artists

ArtHive is a full-stack MERN (MongoDB, Express.js, React, Node.js) social platform designed for artists to share their artwork, interact with the community, and play creative games together.

## 🎨 Features

### Core Features

- **User Authentication**: Secure JWT-based registration and login
- **Art Feed**: Browse and discover artwork from the community
- **Post Artwork**: Upload and share your creations with captions
- **Interactions**: Like and comment on posts
- **User Profiles**: View artist profiles and their artwork galleries
- **Profile Editing**: Update bio and profile information
- **Upload Artwork**: Modal-based art upload with image preview, title, and description
- **Follow System**: Follow/unfollow users and discover new artists
- **Suggested Profiles**: Smart recommendations for artists to follow
- **Dark/Light Mode**: Toggle between themes with persistent preference

### Creative Tools

- **Digital Sketchbook**: Advanced lightweight drawing app built in the browser
  - **5 Brush Types**: Pencil, Paintbrush, Marker, Airbrush, and Eraser
  - **Custom Color Picker**: 12 predefined colors + custom color selector
  - **Brush Size Control**: 1-50px adjustable slider
  - **Opacity Control**: 1-100% with real-time preview
  - **Full History**: Unlimited Undo and Redo functionality
  - **Clear Canvas**: Reset to blank canvas
  - **Download**: Save artwork as PNG to local device
  - **Post to Profile**: Upload directly to your ArtHive feed
  - **Mobile Support**: Full touch/swipe gesture support for tablets and phones
  - **Responsive Canvas**: Adapts to screen size for optimal drawing experience

### Social Gaming

- **ArtHive Game** (Inspired by Gartic Phone):
  - Create or join games with invite codes
  - No login required to play - guests can join with a nickname
  - Draw and guess in rounds
  - Repost game artwork to your ArtHive feed (requires login)
  - Real-time multiplayer using Socket.IO

## 📁 Project Structure

```
Art Hive/
├── backend/                    # Node.js + Express backend
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/           # Route logic
│   │   ├── authController.js
│   │   ├── postController.js
│   │   ├── commentController.js
│   │   └── gameController.js
│   ├── middleware/            # Auth & error handling
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   └── GameSession.js
│   ├── routes/                # API endpoints
│   │   ├── authRoutes.js
│   │   ├── postRoutes.js
│   │   ├── commentRoutes.js
│   │   └── gameRoutes.js
│   ├── utils/
│   │   └── generateToken.js   # JWT token generation
│   ├── .env.example           # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── server.js              # Entry point
│
└── frontend/                  # React frontend
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/        # Reusable components
    │   │   ├── Navbar.js
    │   │   ├── PostCard.js
    │   │   └── Comments.js
    │   ├── context/           # Global state
    │   │   ├── AuthContext.js
    │   │   └── ThemeContext.js
    │   ├── pages/             # Route pages
    │   │   ├── Feed.js
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Profile.js
    │   │   ├── Sketchbook.js
    │   │   └── Game.js
    │   ├── utils/
    │   │   └── api.js         # Axios API calls
    │   ├── App.js             # Main app component
    │   ├── index.js           # Entry point
    │   └── index.css          # Global styles
    ├── .env.example
    ├── .gitignore
    ├── package.json
    ├── tailwind.config.js
    └── postcss.config.js
```

## 🚀 Getting Started

### Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
  - Or use MongoDB Atlas (cloud database) - [Sign up](https://www.mongodb.com/cloud/atlas)
- **npm** or **yarn** package manager

### Installation

#### 1. Clone or Navigate to the Project

```bash
cd "Art Hive"
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/arthive
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

**Important**: Change `JWT_SECRET` to a random, secure string in production!

#### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit the `.env` file:

```env
REACT_APP_API_URL=http://localhost:5001
REACT_APP_SOCKET_URL=http://localhost:5001
```

### Running the Application

#### Option 1: Run Both Servers with One Command (Recommended)

From the project root directory:

```bash
cd "Art Hive"
npm run dev
```

This will start both the backend (port 5001) and frontend (port 3000) simultaneously.

#### Option 2: Run Servers Separately

##### Start MongoDB

If using local MongoDB:

```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Or manually
mongod --dbpath=/path/to/your/data/directory
```

If using MongoDB Atlas, ensure your connection string is in the backend `.env` file.

#### Start Backend Server

```bash
# From backend directory
cd backend
npm run dev
```

The server will start on `http://localhost:5001`

#### Start Frontend Development Server

```bash
# From frontend directory (in a new terminal)
cd frontend
npm start
```

The React app will open at `http://localhost:3000`

## 🎮 Usage Guide

### Authentication

1. **Register**: Create a new account at `/register`
2. **Login**: Access your account at `/login`
3. **Logout**: Click the logout icon in the navbar

### Posting Artwork

1. Navigate to the **Sketchbook** page (+ icon in navbar)
2. Draw using the canvas tools
3. Add an optional caption
4. Click "Post Artwork"

### Interacting with Posts

- **Like**: Click the heart icon
- **Comment**: Click the comment icon and type your message
- **View Profile**: Click on a user's name or avatar

### Playing the Game

1. Click the **Game** icon in the navbar
2. Enter a nickname (no login required)
3. **Create Game**: Start a new session and share the code
4. **Join Game**: Enter a friend's game code
5. Follow the prompts to draw and guess
6. After the game, you can repost artwork to your feed (requires login)

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `PUT /api/auth/follow/:userId` - Follow a user (protected)
- `PUT /api/auth/unfollow/:userId` - Unfollow a user (protected)
- `GET /api/auth/suggested` - Get suggested users to follow (protected)

### Posts

- `GET /api/posts` - Get all posts (paginated)
- `GET /api/posts/:id` - Get single post
- `GET /api/posts/user/:userId` - Get user's posts
- `POST /api/posts` - Create post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)
- `PUT /api/posts/:id/like` - Like post (protected)
- `PUT /api/posts/:id/unlike` - Unlike post (protected)

### Comments

- `GET /api/comments/:postId` - Get post comments
- `POST /api/comments` - Create comment (protected)
- `DELETE /api/comments/:id` - Delete comment (protected)

### Game

- `POST /api/game/create` - Create game session
- `POST /api/game/join` - Join game session
- `GET /api/game/:code` - Get game details
- `POST /api/game/:code/submit` - Submit drawing/prompt
- `POST /api/game/:code/end` - End game session

## 🛠️ Technologies Used

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Socket.IO** - Real-time communication
- **express-validator** - Input validation
- **CORS** - Cross-origin resource sharing

### Frontend

- **React** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Native HTML Canvas** - Drawing functionality
- **Socket.IO Client** - Real-time client
- **React Icons** - Icon library
- **React Toastify** - Toast notifications

## 🎨 Color Scheme & Design

The app uses a Twitter/X-inspired design with support for dark and light modes:

- **Primary Color**: `#1DA1F2` (Twitter Blue)
- **Dark Mode**: Black backgrounds with subtle borders
- **Light Mode**: White backgrounds with soft grays
- **Responsive**: Mobile-first design

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Protected Routes**: Middleware guards sensitive endpoints
- **Input Validation**: Express-validator for sanitization
- **CORS**: Configured for secure cross-origin requests

## 📝 Future Enhancements

- [ ] Cloud storage integration (Cloudinary/AWS S3) for image uploads
- [ ] Real-time notifications system
- [ ] Search functionality (users, hashtags, artwork)
- [ ] Direct messaging between users
- [ ] Story/ephemeral posts feature
- [ ] More game modes and variations
- [ ] Achievement and badges system
- [ ] Art collections/galleries
- [ ] Video posts support
- [ ] Advanced analytics for artists

## 🐛 Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running: `brew services list`
- Check connection string in `.env`
- Verify network access if using MongoDB Atlas

### Port Already in Use

```bash
# Kill process on port 5001 (backend)
lsof -ti:5001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Dependencies Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors

- Verify `CORS_ORIGIN` in backend `.env` matches frontend URL
- Check proxy setting in frontend `package.json`

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Developer

Built with ❤️ using the MERN stack.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**Happy Creating! 🎨**

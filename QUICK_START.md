# Quick Start Guide - Art Hive New Features

## Prerequisites

- Node.js installed
- MongoDB running
- Existing Art Hive project

## Installation Steps

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install date-fns
```

### 2. No Backend Dependencies Needed

All backend features use existing packages already in `package.json`.

### 3. Start the Application

**Terminal 1 - Backend:**

```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm start
```

## Testing the New Features

### Test Notifications

1. Create/login to two different user accounts (use incognito for second user)
2. User A: Create a post
3. User B: Like User A's post
4. User A: Check the bell icon in the navbar - you should see a notification!
5. Click on the notification bell to view all notifications
6. Click "Mark all as read" to clear the badge

### Test Direct Messaging

1. User B: Go to User A's profile
2. Click the "Message" button next to the Follow button
3. Type a message and send
4. User A: Click the floating chat button (bottom-right corner)
5. You should see the conversation with User B
6. Reply to the message - User B will see it in real-time!

### Test Refactored SketchbookPro

1. Navigate to `/sketchbook` or click "Create" in the navbar
2. Try the new modular components:
   - **LayerManager**: Add layers, change opacity, toggle visibility
   - **BrushSettings**: Switch between brush types (Pencil, Pen, Airbrush, etc.)
   - **ColorPicker**: Use HSL sliders or swatches
   - **Toolbar**: Test undo/redo, zoom, and download
3. All functionality should work as before, but the code is now much cleaner!

## Troubleshooting

### Notifications not appearing?

- Check that Socket.IO is connected (check browser console)
- Make sure both users are on different accounts
- Refresh the page to re-establish the Socket.IO connection

### Messages not sending?

- Verify MongoDB is running
- Check that the conversation was created (check network tab)
- Make sure you're logged in

### Components not rendering?

- Run `npm install date-fns` in the frontend directory
- Clear your browser cache
- Check browser console for errors

## What's New?

### 🔔 Real-time Notifications

- Bell icon in navbar shows unread count
- Get notified when someone:
  - Likes your post
  - Comments on your post
  - Follows you
- Click the bell to view all notifications
- Auto-expire after 30 days

### 💬 Direct Messaging

- Floating chat button (bottom-right)
- Message any user from their profile
- Real-time message delivery
- See unread message count
- Delete conversations

### 🎨 Better SketchbookPro

- Cleaner, more maintainable code
- Same features, better organization
- Separated into reusable components:
  - LayerManager
  - Toolbar
  - ColorPicker
  - BrushSettings
- Custom hooks for canvas logic

## API Endpoints

### Notifications

- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Messages

- `GET /api/messages/conversations` - Get all conversations
- `POST /api/messages/conversations` - Create/get conversation
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages/:conversationId` - Send message
- `DELETE /api/messages/conversations/:id` - Delete conversation
- `GET /api/messages/unread-count` - Get unread count

## Socket.IO Events

### Client → Server

- `register-user` - Register user for notifications
- (All existing game events still work)

### Server → Client

- `new-notification` - New notification received
- `new-message` - New message received
- (All existing game events still work)

## Need Help?

Check the `IMPLEMENTATION_SUMMARY.md` file for detailed technical information about:

- Architecture decisions
- Database schemas
- Component hierarchy
- Future enhancement ideas

Enjoy your improved Art Hive! 🎨

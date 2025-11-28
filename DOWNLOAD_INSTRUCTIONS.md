# Game Hub - Download & Setup Guide

Your Game Hub project is ready to download and run anywhere!

## What You Get

- **Single Player Games**: Tic-Tac-Toe (12 squares) and Flappy Bird
- **Multiplayer Tournament Mode**: Real-time battles over WebSocket for Tic-Tac-Toe and Flappy Bird
- **Full Stack**: React frontend + Node.js/Express backend with WebSocket support

## How to Use the Downloaded Project

### 1. Extract the Files
```bash
tar -xzf game-hub.tar.gz
cd Game-Hub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Locally (Development)
```bash
npm run dev
```
The app will start at `http://localhost:5000`

### 4. Deploy to Production

**Option A: Replit (Recommended - Free & Easy)**
- Upload to Replit
- Click "Publish" button
- Get instant free URL

**Option B: Netlify/Vercel (Frontend Only)**
- Build: `npm run build`
- Deploy the `dist/public` folder
- Note: Multiplayer won't work without backend

**Option C: Any Node.js Host**
- Build: `npm run build`
- Deploy entire project
- Run: `npm start`

## Features

### Single Player
- Tic-Tac-Toe vs AI (Easy/Medium/Hard)
- Flappy Bird with high score tracking
- Customizable player names
- Sound effects and animations

### Multiplayer Tournament
- Anyone on same network can join
- Create or join game rooms
- Real-time Tic-Tac-Toe battles
- Competitive Flappy Bird mode
- Share room IDs to invite players

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, WebSocket (ws), Node.js
- **UI Components**: shadcn/ui (Radix UI)
- **Routing**: Wouter
- **State Management**: TanStack Query

## Project Structure

```
Game-Hub/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Game pages & components
│   │   ├── lib/        # WebSocket, utilities
│   │   └── components/ # UI components
│   └── index.html
├── server/              # Node.js backend
│   ├── index.ts
│   ├── routes.ts       # API routes
│   ├── ws.ts          # WebSocket server
│   └── storage.ts     # Data storage
├── shared/             # Shared types
│   └── schema.ts
├── package.json
└── vite.config.ts
```

## Environment Variables

For production deployment, you may need:
- `NODE_ENV=production` (automatically set by hosts)
- `PORT` (defaults to 5000)

## Troubleshooting

**Port 5000 already in use?**
```bash
PORT=3000 npm run dev
```

**WebSocket not connecting?**
- Check firewall settings
- Ensure both devices are on same network
- Try http://localhost:5000 instead of IP address

**Build fails?**
```bash
rm -rf node_modules
npm install
npm run build
```

## Support

For issues or questions about deploying:
- Replit: Use built-in publish button
- Netlify/Vercel: Check their deployment docs
- Local: Run `npm run dev` and check terminal output

Enjoy your Game Hub! 🎮

Real-Time Pricing Engine – Market Data Dashboard  https://real-time-pricing-engine-frontend.onrender.com/

A full-stack real-time market pricing application built with React.js, Node.js, Express.js, WebSocket, and Redis.

The application connects to an upstream market-data WebSocket, processes live price ticks, maintains a rolling 24-hour pricing window, and streams optimized updates to connected React clients.

🚀 Features

Real-time market price updates
WebSocket-based communication
React live pricing dashboard
Node.js + Express backend
Upstream WebSocket integration
Multiple WebSocket clients
Symbol subscribe/unsubscribe
Redis-based price storage
Rolling 24-hour High/Low calculation
24-hour percentage change
Automatic WebSocket reconnection
Out-of-order tick protection
CORS support
Health-check API

🛠️ Tech Stack

Frontend
React.js
JavaScript
HTML5
CSS3
WebSocket API
Vite

Backend

Node.js
Express.js
WebSocket (ws)
Redis
ioredis
dotenv
CORS

📁 Project Structure

real-time-pricing-engine-Market/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── gateway/
│   │   │   └── ClientGateway.js
│   │   │
│   │   ├── upstream/
│   │   │   └── UpstreamFeed.js
│   │   │
│   │   ├── config.js
│   │   ├── symbols.js
│   │   ├── utils.js
│   │   └── index.js
│   │
│   ├── .env
│   └── package.json
│
└── README.md

🔄 Application Architecture

                    React Dashboard
                          │
                          │ WebSocket
                          ▼
                 Node.js WebSocket
                     Gateway
                          │
                          ▼
                  Pricing Engine
                     /       \
                    /         \
                   ▼           ▼
                Redis      Upstream Feed
                              │
                              ▼
                       Market Data API


 🔌 WebSocket Flow

The React application connects to:

ws://localhost:5000/ws

After connecting, the client sends:

{
  "action": "subscribe",
  "symbols": [
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "XAUUSD",
    "BTCUSD"
  ]
}

The server tracks the symbols subscribed by each client.

Live updates are sent in a compact format:

{
  "type": "tick",
  "data": {
    "s": "EURUSD",
    "b": 1.1642,
    "a": 1.1644,
    "t": 1753680000000
  }
}


📊 Supported Symbols

The dashboard supports symbols such as:

EURUSD
GBPUSD
USDJPY
XAUUSD
BTCUSD
ETHUSD
AUDUSD
USDCHF

⚙️ Environment Variables

Create:

server/.env

Example:

PORT=5000

REDIS_URL=redis://localhost:6379

UPSTREAM_WS_URL=wss://v3-prod.livefxhub.com/ws/algo

UPSTREAM_API_KEY=YOUR_API_KEY
UPSTREAM_SECRET=YOUR_SECRET

Never commit .env or real API credentials to GitHub.

Add this to .gitignore:

node_modules/
.env
dist/
📦 Installation

Clone the repository:

git clone https://github.com/Vaishali-kale/real-time-pricing-engine-Market.git

Go into the project:https://real-time-pricing-engine-frontend.onrender.com/

cd real-time-pricing-engine-Market
Backend
cd server
npm install
npm run dev

Backend runs on:

http://localhost:5000

Health check:

http://localhost:5000/health

Expected response:

{
  "success": true,
  "message": "Server is running"
}
Frontend

Open another terminal:

cd client
npm install
npm run dev

Frontend:

http://localhost:5173
🖥️ Dashboard

The dashboard provides:

Connection status
Symbol selection
Buy price
Sell price
24-hour high
24-hour low
24-hour percentage change
Latest update time
🔐 Security

API credentials are loaded from environment variables.

Never expose credentials inside:

React code
GitHub repository
README.md
screenshots
console logs

If credentials have accidentally been exposed, rotate/revoke them before continuing.

🧪 Testing
Health API
GET /health
WebSocket
ws://localhost:5000/ws
Subscribe
{
  "action": "subscribe",
  "symbols": ["EURUSD", "GBPUSD"]
}
Unsubscribe
{
  "action": "unsubscribe",
  "symbols": ["EURUSD"]
}
🔁 Reconnection

The upstream WebSocket uses exponential backoff for connection failures.

The retry delay increases gradually up to a maximum limit, helping prevent excessive reconnection attempts.

📈 Future Improvements
Authentication for dashboard users
Historical price charts
Better Redis stream management
Automated tests
Docker support
Production deployment
Monitoring and logging
Performance metrics
More financial instruments
👩‍💻 Author

Vaishali Kale

GitHub: Vaishali-kale GitHub: https://github.com/Vaishali-kale/real-time-pricing-engine-Market.git
Deploye: https://real-time-pricing-engine-frontend.onrender.com/

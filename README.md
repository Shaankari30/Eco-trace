# 🌿 EcoTrace — Carbon Footprint Awareness Platform

> Track, understand, and reduce your personal carbon footprint through smart insights, interactive tools, and community motivation.

## 📌 Problem Statement

Most people are unaware of how their daily habits — travel, diet, energy use — contribute to climate change. EcoTrace bridges this gap by providing a simple, personalized, and actionable platform to track and reduce individual carbon footprints.

---

## ✨ Features

### 🧮 Carbon Calculator
- Calculates your carbon footprint across 4 categories: **Transport**, **Energy**, **Diet**, and **Waste**
- Supports multiple transport modes including EV and public transit
- Instant results with category-wise breakdown

### 📊 Interactive Dashboard
- Visual carbon score with a 7-day trend line chart
- Streak counter for consecutive days under your personal target
- Historical log stored locally for persistent tracking

### 🌍 Carbon Simulator
- Real-time "what if" simulator to model lifestyle changes
- Tracks progress toward the **Paris Agreement target (2.0 tons CO₂/year)**
- Visual feedback when you hit the target

### 🤖 AI Advisor
- Personalized recommendations powered by Claude AI
- Server-side API with 10-minute response caching
- Rate-limited to prevent abuse (20 requests / 15 min)

### 🎯 Personalized Action Recommendations
- After each calculation, shows top 3 ranked actions based on your highest emission category
- Each action includes estimated CO₂ savings (e.g. "Switch to LED bulbs → saves 0.3 kg CO₂/day")

### 🏆 Community Leaderboard
- Anonymous opt-in weekly carbon leaderboard
- Top 10 lowest footprints with 🥇🥈🥉 badges
- See your own rank after submission with a motivational message

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Frontend | Vanilla JS, HTML5, CSS3 |
| Charts | Chart.js (lazy-loaded) |
| AI | Claude API (Anthropic) |
| Database | lowdb (JSON file DB) |
| Logging | Winston |
| Security | Helmet, express-rate-limit, express-validator |
| Testing | Jest, Supertest |
| Deployment | Vercel / GCP Cloud Run |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/eco-trace.git
cd eco-trace

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API key
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=8080
NODE_ENV=development
AI_ADVISOR_API_KEY=your_claude_api_key_here
```

### Run Locally

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🧪 Testing

```bash
# Run all tests with coverage
npm test

# Run only unit tests
npm test -- carbonMath.test.js

# Run only integration tests
npm test -- api.test.js
```

Target: **80%+ code coverage** across all modules.

---

## 📁 Project Structure

```
eco-trace/
├── public/
│   ├── index.html          # Main UI (single page)
│   ├── app.js              # Frontend logic
│   └── app.css             # Styles (WCAG AA compliant)
├── utils/
│   ├── carbonMath.js       # Carbon calculation logic
│   └── logger.js           # Winston logger
├── tests/
│   ├── carbonMath.test.js  # Unit tests
│   └── api.test.js         # Integration tests
├── server.js               # Express server + API routes
├── db.json                 # Leaderboard data (auto-created)
├── Dockerfile              # Container config
├── .env.example            # Environment variable template
├── .eslintrc.json          # ESLint config
├── .prettierrc             # Prettier config
└── package.json
```

---

## 🔐 Security

- HTTP security headers via `helmet`
- Global rate limiting: 100 requests / 15 minutes
- AI Advisor rate limit: 20 requests / 15 minutes
- All user inputs validated and sanitized with `express-validator`
- API keys stored exclusively in environment variables
- No stack traces exposed to clients in production

---

## ♿ Accessibility

- Full keyboard navigation (Tab, Enter, Escape)
- ARIA labels on all interactive elements
- `aria-live="polite"` on dynamic result areas for screen readers
- WCAG AA color contrast compliance throughout
- Mobile responsive down to 375px screen width

---

## ☁️ Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Deploy to GCP Cloud Run

```bash
gcloud run deploy eco-trace \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,AI_ADVISOR_API_KEY=your_key"
```

---

## 📈 Evaluation Parameters

| Parameter | Implementation |
|---|---|
| **Code Quality** | ESLint + Prettier, Winston logging, JSDoc, modular structure |
| **Security** | Helmet, rate limiting, input validation, env vars |
| **Efficiency** | AI response caching, lazy-loaded Chart.js, compression middleware |
| **Testing** | Jest unit + Supertest integration tests, 80%+ coverage |
| **Accessibility** | ARIA, keyboard nav, WCAG AA, screen reader support |
| **Problem Alignment** | Calculator, Simulator, AI Advisor, History, Leaderboard |


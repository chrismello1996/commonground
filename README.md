<p align="center">
  <img src="public/favicon-512.png" alt="CommonGround Logo" width="120" />
</p>

<h1 align="center">CommonGround</h1>

<p align="center">
  <strong>Live video debates with audience voting and ELO rankings.</strong>
  <br />
  Pick a topic. Debate anyone. Let the crowd decide.
  <br /><br />
  <a href="https://commongrounddebate.com">commongrounddebate.com</a>
</p>

---

## What is CommonGround?

CommonGround is a live video debate platform where strangers argue face-to-face and the audience decides who wins. Think Omegle meets competitive debate — with rankings, clips, and zero censorship.

### How it works

1. **Pick a topic** — Browse trending topics or create your own
2. **Get matched** — Our matchmaking system pairs you with someone who disagrees
3. **Debate live** — Face-to-face video debate with structured rounds
4. **Audience votes** — Viewers watch live and vote on who's winning
5. **ELO rankings** — Win debates to climb the leaderboard

### Key Features

- **Live 1v1 video debates** powered by LiveKit WebRTC
- **Real-time audience voting** with margin-based ELO system
- **Faction system** — Join political/ideological factions and compete as a team
- **Clip recording** — Capture and share the best moments
- **Challenge system** — Call out specific users to debate
- **Content moderation** — AI-powered NSFW detection keeps things civil
- **Structured formats** — Open, timed rounds, Oxford-style debates
- **Mobile-friendly** — Debate or watch from any device

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Video** | LiveKit (WebRTC) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Cache / Queue** | Upstash Redis |
| **Moderation** | TensorFlow.js + NSFWJS |
| **Hosting** | Vercel |

## Project Structure

```
src/
├── app/
│   ├── (main)/              # Main app routes
│   │   ├── browse/          # Browse & watch debates
│   │   ├── challenge/       # Challenge other users
│   │   ├── clips/           # TikTok-style clips feed
│   │   ├── debate/[id]/     # Live debate room
│   │   ├── find/            # Matchmaking
│   │   ├── profile/         # User profiles & stats
│   │   ├── rankings/        # ELO leaderboards
│   │   └── stances/         # Faction explorer
│   ├── api/                 # API routes
│   │   ├── matchmaking/     # Queue & pairing
│   │   ├── livekit/         # Video token generation
│   │   ├── votes/           # Voting & ELO calculation
│   │   ├── clips/           # Clip CRUD
│   │   ├── challenges/      # Challenge system
│   │   └── moderation/      # Content moderation
│   └── auth/                # Login & signup
├── components/
│   ├── debate/              # DebateRoom, LiveKitVideo, ClipRecorder
│   ├── browse/              # WatchClient, debate browser
│   └── matchmaking/         # FindDebate, queue UI
├── hooks/                   # Custom React hooks
├── lib/                     # Supabase clients, utilities
├── types/                   # TypeScript definitions
└── utils/                   # Helper functions
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project
- LiveKit server
- Upstash Redis instance

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/commonground.git
   cd commonground
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Links

- **Live site**: [commongrounddebate.com](https://commongrounddebate.com)
- **X**: [@CommonGrndLive](https://x.com/CommonGrndLive)
- **TikTok**: [@commongrounddebate](https://tiktok.com/@commongrounddebate)
- **YouTube**: [@CommonGroundDebate](https://youtube.com/@CommonGroundDebate)

## License

All rights reserved. This project is proprietary software.

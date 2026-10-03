# AgentHQ

**A phone-first control center for people who already have an AI agent.**
Connect it, give it a job, and see whether it finished or needs your help.

[Live site](https://agent-qh.vercel.app) | Built for [LA Hacks 2026](https://la-ai-hackathon-2026.devpost.com) at UCLA

<!-- Screenshots: replace the placeholders below with real captures from the app. -->

## The problem

If you run an AI agent through Telegram, Discord, or anywhere else, chat apps only show you the final result. You never see what the agent is doing while it works, what is still on its plate, or that it quietly broke ten minutes ago. Its messages also get buried under everyone else's texts.

## What AgentHQ does

AgentHQ is a second front door into an agent you already own and run elsewhere. It gives the agent a place to report status, progress, and errors in real time, and gives you a place to send it commands, without digging through a chat thread.

- **See live work:** status, progress, and failures from your agent in one place.
- **Send commands:** hand your agent a job and watch it get acknowledged and completed.
- **Stay in control:** tasks, memory, handoffs, and workspaces organized per agent.
- **Get alerted:** push notifications when something needs you.

### Core principle

AgentHQ never thinks for the agent. The agent's intelligence stays wherever it already runs. AgentHQ is a window and a remote control, not a replacement brain. This keeps costs flat and the product honest.

## Screenshots

| Dashboard | Agent profile | Tasks |
| :---: | :---: | :---: |
| _Screenshot coming soon_ | _Screenshot coming soon_ | _Screenshot coming soon_ |

## Tech stack

- **App:** Expo / React Native with TypeScript (one codebase for iOS and Android)
- **Backend:** Supabase (Postgres, Auth, Edge Functions)
- **Integrations:** Telegram, Discord, Stripe, push notifications
- **Website:** Next.js, deployed on Vercel

## Project structure

```
.
├── App.tsx              App entry point
├── src/
│   ├── components/      Reusable UI components
│   ├── constants/       Theme, plans, templates, demo data
│   ├── contexts/        React context providers (auth, agents, tasks, workspaces)
│   ├── lib/             API clients and utilities
│   ├── navigation/      Navigators and tab bar
│   ├── screens/         App screens
│   └── types/           Shared TypeScript types
├── supabase/
│   ├── functions/       Edge Functions (chat, imports, sync, billing, notifications)
│   └── migrations/      Database schema migrations
├── website/             Marketing site (Next.js)
└── docs/                Setup guides
```

## Quick start

**Prerequisites:** Node.js 18+, npm, and the [Expo Go](https://expo.dev/go) app or an iOS/Android simulator.

```bash
git clone https://github.com/Badbunny21/AgentQH.git
cd AgentQH
npm install
cp .env.example .env
```

Edit `.env` and fill in your own Supabase project values:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

Never commit `.env` or any real keys. `.env` is already in `.gitignore`.

Then start the app:

```bash
npm start          # Expo dev server on your local network
npm run start:tunnel   # Use this if your phone is on a different network
npm run web        # Run in the browser
```

Database migrations live in `supabase/migrations/`. Apply them with the [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase db push`). Billing setup is covered in [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md).

### Website

```bash
cd website
npm install
npm run dev
```

## Built for LA Hacks

AgentHQ is our entry for LA Hacks 2026 (October 17-18, UCLA). The demo goal: connect an existing agent, send it one command, watch it acknowledge and report progress, then finish or fail visibly with an audit trail.

## Team

Team: Julieth Avina - founder. Product, app, and agent integration.

## License

Released under the [MIT License](LICENSE).

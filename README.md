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

Use **Node.js 22 LTS (22.13 or newer in the 22.x line)** and npm. The command/report tests use Node's TypeScript stripping flag. For a phone preview, install [Expo Go](https://expo.dev/go); an Android emulator also works. The iOS Simulator requires macOS and Xcode, not Windows.

Run these commands in Terminal, PowerShell, or Command Prompt:

```text
git clone https://github.com/Badbunny21/AgentQH.git
cd AgentQH
node --version
npm ci
```

Copy the example environment file using the command for your shell:

| Shell | Command |
| --- | --- |
| macOS / Linux | `cp .env.example .env` |
| Windows PowerShell | `Copy-Item .env.example .env` |
| Windows Command Prompt | `copy .env.example .env` |

Edit `.env` with your own Supabase project values:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

Never put a service-role key, Telegram bot token, or model-provider secret in an `EXPO_PUBLIC_` variable. These values are bundled into the app. The optional OpenAI field in the example is a legacy local fallback, not required for this quick start; leave it unset. Never commit `.env` or real secrets.

```text
npm start
```

`npm start` uses Expo's LAN discovery on macOS, Linux, and Windows, without macOS-only `ipconfig` commands. Put the phone and computer on the same network and scan the QR code with Expo Go. If LAN access is blocked by your firewall or network, use `npm run start:tunnel` (Expo may prompt to install its tunnel helper). If automatic host discovery chooses the wrong interface, set `REACT_NATIVE_PACKAGER_HOSTNAME` to your computer's LAN IPv4 address in your shell, then restart Expo.

| Command | Purpose |
| --- | --- |
| `npm run start:tunnel` | Tunnel for phones on another network |
| `npm run web` | Browser preview |
| `npm run android` | Start with an installed Android emulator |
| `npm run ios` | Start the iOS Simulator on macOS |
| `npm test` | Local command/report emulator and protocol tests |

### What this preview does and does not prove

The Supabase project must already have the required schema and Edge Functions configured. A running Expo preview is not a backend deployment. The local command/report tests emulate the loop; passing them does not prove a live Hermes connection, production RLS, crash recovery, or active process cancellation.

**Do not import a Telegram bot already used by Hermes through the current import wizard.** That wizard changes the bot webhook and can interrupt the existing runtime. A non-invasive runtime connection is still separate work.

Database migrations are in `supabase/migrations/`. Before applying them, review the SQL and verify the exact target project and migration history with the [Supabase CLI](https://supabase.com/docs/guides/cli). Do not run `supabase db push` against an existing project just to launch this preview. Billing setup is in [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md).

### Website source

From the repository root:

```text
cd website
npm ci
npm run dev
```

For a production build, run `npm run build` in `website`. The website source in this repository currently differs from the public Vercel landing page. Confirm Vercel's deployment source before deploying it; do not overwrite the public page with this older copy.

## Built for LA Hacks

AgentHQ is our entry for LA Hacks 2026 (October 17-18, UCLA). The demo goal: connect an existing agent, send it one command, watch it acknowledge and report progress, then finish or fail visibly with an audit trail.

## Team

Team: Julieth Avina - founder. Product, app, and agent integration.

## License

Released under the [MIT License](LICENSE).

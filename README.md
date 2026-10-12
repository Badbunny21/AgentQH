# AgentHQ

**A phone-first control center for people who already have an AI agent.**
Connect it, give it a job, and see whether it finished or needs your help.

[Project landing page](https://agent-qh.vercel.app) | Built for [LA Hacks 2026](https://la-ai-hackathon-2026.devpost.com) at UCLA

## The problem

If you run an AI agent through Telegram, Discord, or anywhere else, chat apps only show you the final result. You never see what the agent is doing while it works, what is still on its plate, or that it quietly broke ten minutes ago. Its messages also get buried under everyone else's texts.

## What we are building toward

The goal is a second front door into an agent you already own and run elsewhere. AgentHQ is being built to show the agent's status, progress and errors in real time, and let you send commands without digging through a chat thread.

- **See live work:** status, progress, and failures from your agent in one place.
- **Send commands:** hand your agent a job and watch it get acknowledged and completed.
- **Stay in control:** tasks, memory, handoffs, and workspaces organized per agent.
- **Get alerted:** push notifications when something needs you.

### Core principle

Our design rule: AgentHQ should never think for the agent. The agent's intelligence stays wherever it already runs. AgentHQ is a window and a remote control, not a replacement brain. The command/report path follows that rule. The app shows recorded conversations; its composer is explicitly draft-only until sending is connected.

## Design previews

Design previews from the project website, not live app screenshots. Real captures will follow a verified phone demo.

| Home dashboard | Agent at work | Task board | Activity log |
| :---: | :---: | :---: | :---: |
| <img src="agenthq-design-home-dashboard.png" alt="Design preview of the Home dashboard" width="220"> | <img src="agenthq-design-agent-at-work.png" alt="Design preview of an agent at work" width="220"> | <img src="agenthq-design-task-board.png" alt="Design preview of the Task board" width="220"> | <img src="agenthq-design-activity-log.png" alt="Design preview of the Activity log" width="220"> |

These mockups show the intended interface, not verified live agent activity. The agent-at-work view illustrates messages and progress from an external agent; it does not mean AgentHQ supplies the agent's intelligence.

## Current status

AgentHQ is an in-progress prototype, with app code and a command/report foundation in `main`. It is not a finished live agent-control demo yet.

### Implemented in the repo

- Expo app screens and data access for agents, tasks, memory, handoffs and workspaces.
- Recorded activity feed with loading/error/retry states and no invented task-completion fallback.
- Agent conversation history from Inbox and agent profiles; draft-only composer, no simulated delivery or live progress.
- Monthly usage breakdown per agent. Dollar spend is unavailable until real cost telemetry is supplied; activity counts are not API bills.
- Original lime/cyan/magenta accents and gradient navigation. No paid plans or upgrade UI.
- A "Give it a job" panel with command status, progress, report history, results and a stale-agent warning.
- Backend code for issuing an agent key, creating commands, letting an external agent claim them, and recording acknowledgments, progress, results or errors.
- Automated tests for the command/report flow using the real handlers against an in-memory backend emulator.

### Team integration boundary

The app surfaces are prepared for the team to wire up. The connector, import/runtime plumbing, message delivery, progress streaming and cost telemetry are separate work. No screenshot or passing local test proves those connections.

### Still in progress

- The command/report foundation is emulator-tested only. It has not been deployed or verified with a real external agent or on a phone.
- A runnable external-agent connector and its setup/key flow still need to be completed and tested.
- Supabase migrations, access policies and functions need to be checked against the live project before deployment. Do not apply them blindly.
- Stop marks a command cancelled in AgentHQ. It does not yet prove the external agent stops executing.
- Retry/recovery and production hardening remain follow-up work.
- Legacy in-app chat, template-agent creation and the client-side OpenAI fallback were removed in [PR #2](https://github.com/Badbunny21/AgentQH/pull/2). Some backend functions still contain hosted AI code; that cleanup is separate from the external-agent connector.

### The hackathon slice

Connect one existing agent, send one real command from a phone, and show it acknowledge, report progress, then finish or fail with a visible report history. The work is the real connection and reliable demo, not building a new AI brain. Teammate ideas that make that slice clearer and stronger are welcome.

The [project landing page](https://agent-qh.vercel.app) introduces the concept. It is not proof of a working external-agent connection. Real app screenshots will be added after the phone demo is verified.

## Tech stack

- **App:** Expo / React Native with TypeScript (one codebase for iOS and Android)
- **Backend:** Supabase (Postgres, Auth, Edge Functions)
- **Integration source:** Telegram, Discord and push notifications; runtime connector work remains separate. Stripe server code is retained but has no app checkout route.
- **Website source:** Next.js in `website/`; the public Vercel landing is a separate standalone deployment.

## Project structure

```
.
├── App.tsx              App entry point
├── src/
│   ├── components/      Reusable UI components
│   ├── constants/       Theme, agent metadata and platform labels
│   ├── contexts/        React context providers (auth, agents, tasks, workspaces)
│   ├── lib/             API clients, including commandsApi.ts for commands/reports
│   ├── navigation/      Navigators and tab bar
│   ├── screens/         App screens
│   └── types/           Shared TypeScript types
├── supabase/
│   ├── functions/       Edge Functions (imports, sync, billing, legacy chat)
│   │                    Command/report: agent-key-issue, agent-commands-create,
│   │                    agent-commands-poll, agent-report and shared protocol
│   └── migrations/      Database schema migrations
├── tests/               Protocol/emulator tests + app-state regression tests
├── landing/             Captured public landing HTML, awaiting the reviewed logo
├── website/             Marketing site (Next.js)
└── docs/                Setup guides
```

## Quick start

Use **Node.js 22 LTS (22.13 or newer in the 22.x line)** and npm. The command/report tests use Node's TypeScript stripping flag. The app now targets Expo SDK 57. For a phone preview, install [Expo Go](https://expo.dev/go); an Android emulator also works. The iOS Simulator requires macOS and Xcode, not Windows.

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

Never put a service-role key, Telegram bot token, or model-provider secret in an `EXPO_PUBLIC_` variable. These values are bundled into the app. Never commit `.env` or real secrets.

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
| `npm test` | Full local protocol/emulator and app-state test suite |
| `npm run typecheck` | Root app TypeScript check |

### What this preview does and does not prove

The Supabase project must already have the required schema and Edge Functions configured. A running Expo preview is not a backend deployment. The local command/report tests emulate the loop; passing them does not prove a live Hermes connection, production RLS, crash recovery, or active process cancellation.

**Do not import a Telegram bot already used by Hermes through the current import wizard.** That wizard changes the bot webhook and can interrupt the existing runtime. A non-invasive runtime connection is still separate work.

Database migrations are in `supabase/migrations/`. Before applying them, review the SQL and verify the exact target project and migration history with the [Supabase CLI](https://supabase.com/docs/guides/cli). Do not run `supabase db push` against an existing project just to launch this preview. Stripe notes are archived in [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md); they are not current app setup. Removing payment UI does not cancel existing subscriptions. Server plan-gate source has been removed, but deployment of those Edge Functions is still pending.

### Website source

From the repository root:

```text
cd website
npm ci
npm run dev
```

For a production build, run `npm run build` in `website`. The website source in this repository currently differs from the public Vercel landing page. Confirm Vercel's deployment source before deploying it; do not overwrite the public page with this older copy.

## Code-health checks

The root app and `website/` have separate lockfiles. Run `npm ci`, `npm test`, `npm run typecheck`, and `npx expo export --platform web` at the root. Run `npm ci` and `npm run build` separately in `website/`. These checks do not verify live connectors, billing, iPhone keyboard behavior or production access policies.

No lint configuration is installed yet. Dependency advisories remain in both lockfiles; review `npm audit` in each directory. Do not force an Expo downgrade or assume a passing build means security is cleared.

## Built for LA Hacks

AgentHQ is our entry for LA Hacks 2026 (October 17-18, UCLA). The demo goal: connect an existing agent, send it one command, watch it acknowledge and report progress, then finish or fail visibly with an audit trail.

## Team

Team: Julieth Avina - founder. Product, app, and agent integration.

## License

Released under the [MIT License](LICENSE).

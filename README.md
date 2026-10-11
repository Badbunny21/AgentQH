# AgentHQ

**Give your existing AI agent a job from your phone. See its progress, result or failure in one place.**

For people who already run an agent in Telegram, Discord or another runtime and want a clearer view than a busy chat thread. AgentHQ is a remote control and activity window, not a new AI brain.

**Status: prototype.** The command/report handlers pass local emulator tests. A deployed external-agent connection and a real phone demo are still unverified. The website images below are design previews, not live results.

[Project landing page](https://agent-qh.vercel.app) | [LA Hacks AI Hackathon 2026](https://la-ai-hackathon-2026.devpost.com) | [Try the local checks](#try-the-local-checks-no-account-needed)

## The problem and the intended demo

An agent's final chat message is not enough to tell you whether it is working, stuck or quietly offline. AgentHQ separates agent work from chat, with a command history and visible progress.

The demo target is one complete loop:

1. Open one connected agent on a phone and give it a job.
2. Watch the external agent claim and acknowledge the command.
3. See progress reports arrive while it works.
4. See a result or a clear failure, with the report history preserved.

**What works locally today:** automated tests exercise the real command/report handlers against an in-memory backend emulator. They cover the success loop, duplicate protection, invalid keys, cross-user rejection, progress, failure, cancellation status and heartbeat staleness. They do not run a real AI agent.

**What remains for the live demo:** deploy and verify the Supabase schema/access policies/functions, finish the external-runtime connector and its key setup, then test the loop on an actual phone. Stop currently marks a command cancelled in AgentHQ; it does not prove the external process stops.

## Try the local checks (no account needed)

Use Git and **Node.js 22.13 or newer in the 22.x line**, with npm. Run from a terminal:

```text
git clone https://github.com/Badbunny21/AgentQH.git
cd AgentQH
node --version
npm ci
npm test
npx tsc --noEmit
```

Expected: all **7 tests pass** and TypeScript exits without errors. No Supabase project, bot token or paid API is needed. The tests verify handlers in an emulator, not deployed database security or a working phone connection. Node may print a module-type warning; it does not fail these tests.

To check browser startup:

```text
npm run web
```

Without real Supabase values, the expected page is **"Supabase not configured"**. That confirms the app loaded, not that the dashboard or backend is usable. Stop the server with Ctrl+C before starting another preview.

## Phone preview with Expo Go

Expo Go is a development preview app. Your computer serves AgentHQ; your phone opens it inside Expo Go. This is not a standalone App Store release. Keep the computer and development server running.

### Check compatibility first

This repository uses **Expo SDK 54**. The installed Expo Go version must support SDK 54. Use [Expo's device/version selector](https://expo.dev/go) rather than assuming the latest store app is compatible.

For an iPhone, the current [SDK-54 installation page](https://expo.dev/go?device=true&platform=ios&sdkVersion=54) points to a custom Expo Go build distributed through TestFlight, requiring Apple Developer Program membership. A reviewed SDK upgrade or development build may be needed. Do not upgrade the project blindly to solve a version warning. Native phone launch has not yet been verified for this repo.

### Configure the backend

After the clone/install above, copy `.env.example` to a new file named `.env` in the repository root. Edit it with the team's actual Supabase project values:

| Variable | Value needed |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

Placeholders or missing values intentionally stop the app at the configuration screen. Real values alone are not a backend deployment: the project's Auth, schema, access policies and Edge Functions must also be set up and tested.

Never put a service-role key, bot token or model-provider secret in an `EXPO_PUBLIC_` variable. These values are bundled into the app. Never commit `.env` or real secrets.

### Open the preview

1. Install a compatible Expo Go build using [Expo's instructions](https://expo.dev/go).
2. Put the phone and computer on the same Wi-Fi network.
3. Start the server from the repository root:

```text
npm start
```

4. Scan the terminal QR code with the iPhone Camera or the Android Expo Go scanner. Follow the prompt to open Expo Go.
5. On physical iPhones, [Expo's current instructions](https://docs.expo.dev/get-started/start-developing/) require the computer's Expo CLI and Expo Go to be signed in to the same Expo account. Sign in locally on each device; do not share passwords.
6. After changing `.env`, stop and restart the server.

Campus/public Wi-Fi can block the phone from reaching the computer. Stop the LAN server and try:

```text
npm run start:tunnel
```

Expo may ask to install its tunnel helper. Accept the prompt, wait for "Tunnel ready", then scan the new QR. Both devices need internet; reloads are slower than LAN. A tunnel solves networking, not SDK incompatibility or missing backend setup. Android remote push notifications require a development build and are not supported in Expo Go for SDK 54.

### Teammate workflow

- **To view the same preview:** install compatible Expo Go and open the host's QR, subject to network and Expo account requirements. A viewer does not need the source code on their phone.
- **To develop independently:** each teammate clones the repo on their own computer, installs dependencies, creates their own local `.env` and starts their own server. They scan their own QR and use their own Git branches/PRs for changes.
- Share the agreed Supabase project URL/public key and grant only needed project access. Each teammate uses their own app account. A shared backend does not automatically share all agents or workspaces; access policies determine visibility.

**Do not import a Telegram bot already used by Hermes through the current import wizard.** It changes the bot webhook and can interrupt the existing runtime. The non-invasive runtime connector is separate unfinished work.

Migrations are in `supabase/migrations/`. Review the SQL and verify the exact project and migration history before applying changes. Do not deploy a database just to see the preview. Billing setup is in [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md).

## Design previews

These are intended interface designs from the project website, **not screenshots of a verified live app**.

| Home dashboard | Agent at work | Task board | Activity log |
| :---: | :---: | :---: | :---: |
| <img src="agenthq-design-home-dashboard.png" alt="Design preview of the Home dashboard" width="220"> | <img src="agenthq-design-agent-at-work.png" alt="Design preview of an agent at work" width="220"> | <img src="agenthq-design-task-board.png" alt="Design preview of the Task board" width="220"> | <img src="agenthq-design-activity-log.png" alt="Design preview of the Activity log" width="220"> |

A live phone recording and real app captures still need to be added after the command-to-result loop is verified. The landing page introduces the concept; it is not proof of a working connection.

## Engineering map

- **App:** Expo SDK 54 / React Native / TypeScript. Screens and data access for agents, tasks, memory, handoffs and workspaces.
- **Backend:** Supabase Postgres, Auth and Edge Functions. Agent-key issuance, command creation/polling and acknowledgment/progress/result/error reports.
- **Tests:** protocol tests and real Edge Function handlers exercised against an in-memory backend emulator.
- **Other code:** Telegram/Discord imports, Stripe and notification code exist, but this is not a claim that every integration is deployed or verified.
- **Website:** Next.js source in `website/`; the public landing is a separate standalone deployment.

Legacy in-app chat, template-agent creation and the client-side OpenAI fallback were removed in [PR #2](https://github.com/Badbunny21/AgentQH/pull/2). Some backend functions still contain hosted AI code. That cleanup, retry/recovery, dependency security review and production hardening remain follow-up work. Passing builds/tests does not establish production readiness.

## Project structure

```
.
├── App.tsx              App entry point
├── src/
│   ├── components/      Reusable UI components
│   ├── constants/       Theme, plans, templates, demo data
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
├── tests/               Command protocol + emulator command/report tests
├── landing/             Captured public landing HTML, awaiting the reviewed logo
├── website/             Marketing site (Next.js)
└── docs/                Setup guides
```

## Website source (separate from the app)

From the repository root:

```text
cd website
npm ci
npm run dev
```

Open `http://localhost:3001`. Stop the server before running the production check in the same directory:

```text
npm run build
```

This source differs from the public Vercel landing and includes older product copy. Verify the deployment source before publishing; do not overwrite the public page with this copy.

## Hackathon submission checklist

Target event: LA Hacks AI Hackathon 2026, October 17-18 at UCLA. This repo includes **pre-event work**, not code claimed to have been built entirely during the event.

The [official submission page](https://la-ai-hackathon-2026.devpost.com) asks for a documented public repo, project/track/company-challenge description, a 2-3 minute demo video and a complete Devpost page. Its criteria are technical depth, product thinking/impact, execution/polish and originality/insight.

Before submitting:

- Confirm with organizers how pre-existing code may be used. The published page says the project must be completed within the hackathon timeframe; this README does not establish eligibility.
- Record what was already here and what the team builds during the event.
- Pick and explain the applicable track/company challenge; do not invent one before confirming it.
- Verify one real phone-to-agent loop, including a visible failure case, then add the demo video and actual screenshots.
- Show the command/report design and its limits. Check live access policies, dependency advisories and secret handling before a public live demo.

## Team

Julieth Avina - founder. Product, app and agent integration.

## License

Released under the [MIT License](LICENSE).

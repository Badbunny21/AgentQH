# AgentHQ

A phone-first view and remote control for an AI agent you already run.

AgentHQ records what the agent is doing, lets you give it a job, and shows when it finishes, fails or needs help. The agent's intelligence stays in its existing runtime. AgentHQ is the control surface, not a replacement brain.

[Project landing page](https://agent-qh.vercel.app) | [AI Hackathon 2026 by LA Hacks](https://la-ai-hackathon-2026.devpost.com/)

## Current state

This is an in-progress prototype, not a verified live agent-control demo. The app and command/report source are in `main`; the real runtime connection is the team's next piece of work.

| In the repo | Boundary |
| --- | --- |
| Agent, task, memory, handoff and workspace screens | Real data requires the matching Supabase schema and access policies |
| Recorded activity and conversation history | The chat composer is draft-only; it does not deliver messages |
| Command panel with status, progress, reports and stale-heartbeat warnings | The protocol is emulator-tested, not verified with a real external agent |
| Monthly activity counts by agent | Counts are not API bills; dollar spend needs cost telemetry |
| No paid-plan or checkout UI | Stripe server code remains; removing UI does not cancel subscriptions |

Stop currently marks a command `cancelled` in AgentHQ. It does not prove the external process stopped. Local tests and builds do not prove native-phone behavior, production RLS or live connector reliability.

## Where things live

```text
App.tsx                     App entry point
src/
  screens/                  App screens
  components/               Shared UI, including the command panel
  contexts/                 Auth, agents, tasks and workspaces
  navigation/               Navigators and tab bar
  lib/commandsApi.ts         App-side command/report client
  lib/                      Supabase and platform API clients
  hooks/, types/, constants/ Shared hooks, types and theme
supabase/
  functions/                Protocol, platform integrations and retained server code
  functions/_shared/        Protocol rules, DB/auth helpers and shared logic
  migrations/               Schema and RLS source
tests/                      Protocol/emulator and app regression tests
website/                    Next.js website source with its own lockfile
landing/                    Captured standalone public landing source
docs/                       Teammate protocol map and archived Stripe notes
```

The backend entry points are `agent-key-issue`, `agent-commands-create`, `agent-commands-poll` and `agent-report`. Start with [docs/TEAMMATES.md](docs/TEAMMATES.md) for the contract, source/deployment map and security review flags.

`website/` is not the current public landing source. See [landing/README.md](landing/README.md) before touching deployment. The public landing and design previews describe the concept, not a proven runtime connection.

## Quick commands

Node 22.13+ in the 22.x line, npm and Expo SDK 57. App environment: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env.example`. The target Supabase project needs the matching schema/functions; starting Expo does not deploy them.

```sh
# App, from the repo root
npm ci
npm start                       # Expo LAN preview
npm run start:tunnel             # Optional tunnel preview
npm run web
npm run android
npm run ios                     # macOS + Xcode

# Local checks
npm run typecheck
npm test
npx expo export --platform web

# Website, separate lockfile
cd website
npm ci
npm run dev
npm run build
```

### Preview and teammate access

Use a matching SDK-57 [Expo Go](https://expo.dev/go) client. On a physical iPhone, [Expo Go and the computer's Expo CLI must use the same Expo login](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/). Expo organization membership is not a documented exception. Each teammate can run their own checkout and CLI under their own account, matched to their phone. A tunnel fixes reachability, not that account requirement. Android and simulators are not currently subject to that physical-iOS sign-in check.

Web preview does not require Expo Go, but the app still requires AgentHQ sign-in. Fresh browsers see onboarding and authentication, not a guest dashboard. New accounts start empty; incomplete accounts go through app onboarding. No public read-only demo mode is implemented. Without valid public Supabase configuration, the app shows a configuration screen instead. Remote push is not demonstrated by web or Expo Go.

The current EAS `development` iOS profile is simulator-only. The device `preview` profile has empty Supabase environment values, so configure and verify the intended build environment before treating it as a phone demo. No installed native build is certified by these local checks.

Only public Supabase values belong in `EXPO_PUBLIC_*`. Keep service-role keys, bot tokens and agent keys out of the app bundle, logs and repo. Do not blindly run migrations against an existing project.

**Do not import or reconnect a Telegram bot already used by Hermes or another runtime through the current wizard.** It calls `setWebhook` and can displace the existing runtime's webhook. Build a non-invasive adapter instead.

### Verified baseline

On October 14, 2026, `main` at `48d1016` passed clean installs at root and `website/`, root typecheck, all 26 tests, Expo web export and the website production build. Dependency audit: website 0; root 22 entries (15 high, 7 moderate, 0 critical). Remaining root chains include `braces`, `node-forge` and `decode-uri-component`. No lint configuration is installed. Expo compatibility checking currently recommends SDK-57 patch updates to `expo` ~57.0.29, `expo-constants` ~57.0.22, `expo-notifications` ~57.0.23 and `expo-splash-screen` ~57.0.10. These have not been applied. Re-run checks after changes; keep Expo SDK 57, with no downgrade.

## Event build scope

The demo target is one existing agent, one real command from a phone, and visible acknowledgment, progress and a result or error. Include a failure/recovery case and an honest report history.

**Pre-event baseline:** app screens, recorded history/usage views, schema/function source, emulator-tested protocol, docs, tests and reviewed dependency/style fixes.

**Team work at the event:**

- Verify the target deployment, migration history and two-owner access isolation.
- Build the secure key/setup route and non-invasive runtime adapter.
- Add stable retry keys, crash recovery, heartbeat and cooperative cancellation.
- Wire real delivery and reports into the app; no simulated progress or completion.
- Verify the phone demo. Add cost telemetry before showing dollar spend.

The server plan-gate removal exists in source, but its deployment is still unverified. Compare deployed source before updating the affected functions; details are in the teammate doc. Legacy hosted-AI paths remain in some functions and are not evidence that an imported agent executed a command.

The event is October 17-18 at UCLA. Be explicit about the pre-event baseline. The published event page requires work completed within the hackathon timeframe; confirm treatment of pre-existing work with the organizers before submission.

## Design previews

These are website design mockups, not live app captures. Replace or supplement them only after a verified phone demo.

| Dashboard | Agent at work | Task board | Activity |
| :---: | :---: | :---: | :---: |
| <img src="agenthq-design-home-dashboard.png" alt="Dashboard design preview" width="220"> | <img src="agenthq-design-agent-at-work.png" alt="Agent-at-work design preview" width="220"> | <img src="agenthq-design-task-board.png" alt="Task-board design preview" width="220"> | <img src="agenthq-design-activity-log.png" alt="Activity design preview" width="220"> |

## Team

- Julieth Avina
- Eshaan
- Shuvangee
- Theresa

## License

[MIT](LICENSE).

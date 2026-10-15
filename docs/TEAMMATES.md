# AgentHQ: for teammates

Source baseline: `main` at `48d1016`, October 13, 2026. This is a protocol and integration map, not a setup tutorial or a production readiness claim.

AgentHQ is a view and remote control for an existing agent. The runtime owns reasoning and execution. Hosted-AI legacy functions are not a substitute for that connection.

## Source versus deployment

| Area | Source | Deployment boundary |
| --- | --- | --- |
| App | `src/`; command UI/client in `src/components/` and `src/lib/commandsApi.ts` | Local checks pass; native-phone and real-runtime demo still need proof |
| Protocol | Four functions below; `_shared/commandProtocol.ts` and `restDb.ts` | Emulator-tested handlers, not a verified live external-agent loop |
| Schema/RLS | `supabase/migrations/`, including `20261005000000_command_report_protocol.sql` | Compare target migration history and deployed policies before applying SQL |
| Plan gates | `_shared/planLimits.ts` allows use while retaining counts | Last check Oct 11 found old limits in deployed `agent-chat`; current state unverified |
| Telegram/Discord | Import, send, sync and webhook functions | Existing source is not an installed runtime adapter |
| Billing | Retained Stripe functions/schema; no app checkout | Test/live mode and existing subscription billing unverified |
| Website | `website/` and captured `landing/` source | Public landing uses a separate source/deployment; see `landing/README.md` |

Pending gate deployment affects `agent-chat`, `task-dispatch`, `telegram-webhook`, `discord-send` and `discord-sync`. Compare deployed code first and preserve unrelated changes. Verify auth and free-tier behavior without unwanted paid API calls. This does not authorize billing changes.

## Protocol map

Routes are relative to `/functions/v1/`. Payloads are source examples with placeholders, not production request evidence.

| Route | Method / auth | Request | Response |
| --- | --- | --- | --- |
| `agent-key-issue` | POST / owner JWT | `{"agentId":"<owned-agent-id>"}` | `{"apiKey":"<returned-once-secret>"}` |
| `agent-commands-create` | POST / owner JWT | `{"agentId":"<owned-agent-id>","command":"Summarize support issues","clientKey":"<stable-request-id>"}` | New: 201, `{"command":{...},"deduplicated":false}`; duplicate key: existing row, `deduplicated:true` |
| `agent-commands-poll` | GET or POST / `x-agent-key` | No payload required | `{"commands":[{"id":"<command-id>","command":"Summarize support issues","created_at":"<timestamp>"}]}`; idle: `{"commands":[]}` |
| `agent-report` | POST / `x-agent-key` | Examples below | `{"ok":true,"deduplicated":false}`; repeated report key: `deduplicated:true` |

```json
{"commandId":"<command-id>","kind":"ack","message":"Accepted","clientKey":"<ack-id>"}
{"commandId":"<command-id>","kind":"progress","message":"Reading sources","progress":40,"step":{"label":"Reading sources"},"clientKey":"<progress-id>"}
{"commandId":"<command-id>","kind":"result","message":"Completed summary","clientKey":"<result-id>"}
{"kind":"heartbeat","clientKey":"<heartbeat-id>"}
```

Each line is a separate request. Use one stable key per logical command/report and reuse it on retry; do not reuse a key for different reports. The app currently generates a new command key on each send.

- Key issuance returns plaintext once, stores a SHA-256 hash and rotates the prior key.
- Poll refreshes heartbeat and conditionally claims up to ten pending commands, oldest-first. `claimed` means receipt, not acceptance.
- Reports map `ack -> acknowledged`, `progress -> in_progress`, `result -> done`, `error -> failed`, `stop -> needs_review`. Heartbeat does not change command status. Progress is clamped to 0-100; result sets it to 100.
- Closed states: `done`, `failed`, `needs_review`, `cancelled`. A new report against a closed command returns 409; a previously recorded client key returns deduplicated success before this check.
- Invalid agent key: 401. Missing non-heartbeat command ID: 400. Unknown/non-matching command: 404.
- Missing or >10-minute heartbeat is stale. Stored `online` status is liveness, not proof of active work.

## Schema and security flags

Owner data lives in profiles, agents, tasks, messages, memories, activities, handoffs, workspaces and platform connections. The protocol migration adds key hash/heartbeat columns to `agents`, plus `agent_commands` and `agent_reports` with owner/agent IDs, timestamps and optional client keys. Reports carry kind, message, progress and JSON step data. Unique `(agent_id, client_key)` indexes support deduplication, not exactly-once execution.

Review before production:

- **Owner binding:** command INSERT RLS checks `user_id`, not whether `agent_id` belongs to that user. The create handler checks ownership; direct-table access needs equivalent protection and a two-owner test.
- **Cancel fields:** UPDATE RLS requires final status `cancelled`, but does not restrict changes to status/timestamp. Policy comments overstate enforcement. Check column grants and allowed transitions.
- **Secrets/auth:** `restDb.ts` uses service-role access. Poll/report disable gateway JWT verification and rely on handler agent-key auth. Review other webhook verification, connection secret visibility, key rotation, rate limits and SECURITY DEFINER RPCs.
- **Recovery:** no demonstrated lease/reclaim path for a crash after claim. Cancellation only updates AgentHQ state; implement cooperative runtime stop and confirmation.
- **Ordering/atomicity:** report validation is not a strict ordered state machine. Report insertion and command update are separate; the update result is not checked. Exercise concurrent reports, retries and database failures, not just the happy path.

Keep service-role keys, bot tokens and agent keys out of `EXPO_PUBLIC_*`, logs, screenshots and repo examples. Do not blindly push migrations or overwrite deployed functions.

## Non-invasive Telegram boundary

`telegram-import/index.ts` calls `setWebhook`. Importing/reconnecting a bot already used by Hermes or another runtime can displace its webhook. Do not use that wizard for the existing bot.

Build an adapter in the current runtime or another explicitly agreed bridge that receives AgentHQ commands and posts reports while preserving Telegram delivery. The old Telegram webhook invokes hosted AI; it does not prove existing-agent execution. Discord import/sync likewise does not establish a runtime bridge.

## Event scope

**Already exists:** app screens, recorded activity/conversations and usage counts, schema/function source, emulator-tested protocol, docs, tests and reviewed dependency/style fixes.

**Build at the event:** secure setup/key route; non-invasive runtime adapter; real delivery/progress; stable retries and crash recovery; heartbeat and cooperative cancellation; two-owner isolation and a verified phone demo. Supply cost provenance before showing dollar spend.

**Demo:** one phone command, visible receipt and acknowledgment, progress, result/error and report history, plus a failure/recovery case. No simulated execution or progress.

Declare the pre-event baseline. The [event page](https://la-ai-hackathon-2026.devpost.com/) requires work completed within the hackathon timeframe; confirm how pre-existing work is treated before submission.

## Verification baseline

October 14 local checks on `48d1016`: clean root/website installs, root typecheck, 26/26 tests, Expo web export and website production build pass. Website audit 0; root 22 (15 high, 7 moderate, no critical), including `braces`, `node-forge` and `decode-uri-component` chains. Keep Expo SDK 57; no downgrade. This is not a fresh production audit or native-phone certification.

# Pre-event baseline disclosure

LA Hacks hacking window: Sat Oct 17 2026 12:00 PT to Sun Oct 18 2026 12:00 PT. Times below are PT.

## Pre-event (not presented as event work)

Everything in `main` up to and including `f025067` (Sat Oct 17 10:51 PT):

| Feature | Where | Last pre-event commit |
| --- | --- | --- |
| Expo (SDK 57) app: dashboard, tasks, inbox, agents, memory, workspaces, settings | `src/`, `App.tsx` | `f025067` Oct 17 10:51 |
| Supabase schema, RLS and storage | `supabase/migrations/` | `1e1d544` Oct 16 20:31 |
| Command/report protocol (create, poll, report, key issue) | `supabase/functions/agent-*` | `2335035` Oct 9 20:24 (RLS migration `1e1d544` Oct 16 20:31) |
| Telegram import, connect, send and webhook | `supabase/functions/telegram-*` | `e5d1f65` Oct 11 18:47 |
| Discord import, send and sync | `supabase/functions/discord-*` | `e5d1f65` Oct 11 18:47 |
| Legacy `agent-chat` and `task-dispatch` (hosted model role-play; not agent execution) | `supabase/functions/` | `2cd13f8` May 31 16:05 |
| Stripe billing functions (retained, unused) | `supabase/functions/stripe-*` | `2cd13f8` May 31 16:05 |
| Website and landing page | `website/`, `landing/` | `48d1016` Oct 13 |

The old `agent-chat` and `task-dispatch` functions simulate agent behavior and are not part of any live demo.

## Event-built (Oct 17 12:00 PT onward)

| Work | Where | When |
| --- | --- | --- |
| App: live activity feed, dashboard counters, task timeline | `a912c8d` (#26) | Oct 17 16:35 |
| App: Paper phone screen redesign | `bd3906b` (#27) | Oct 18 00:51 |
| ACP weather/air demo slice (uncommitted at time of writing) | `agenthq_live/core.py`, `run.py`, `local_demo.py`, `tests/test_agenthq_live.py` | Oct 17 20:19–20:33 (file times, machine clock PDT) |
| Telegram task inbox (Chat Automation bridge, task store, Sentry) | `agenthq_live/` new files, `tests/`, `HANDOFF.md` | Oct 18 01:00 onward, milestone branches `m<N>-<slug>` |

# HANDOFF

## M0 Baseline (Sun Oct 18 ~01:10 PT, branch m0-baseline)

Files: `docs/BASELINE.md` (rewritten from an uncommitted draft; draft's disclosure kept), `.env.example`
(added AGENTHQ_BOT_TOKEN, SENTRY_DSN, GEMINI_API_KEY, LINK_ALLOWLIST). Nothing else changed.

Commands:
- `git log --format='%h %ad %s' --date=... origin/main` → dates used in BASELINE (CDT converted to PT).
- `git check-ignore .env` → `.env` (ignored).

Not committed, left untouched (someone's uncommitted event work): `agenthq_live/` ACP demo files,
`tests/test_agenthq_live.py`, `docs/PRODUCT_DUE_DILIGENCE.md`, `.gitignore` (+.venv/, __pycache__/),
planning docs (AGENTS.md, CLAUDE.md, TEAM_BRIEF.md, docs/BUILD_PLAN.md) and the old hardening patch.

NEEDS HUMAN: none for M0. Confirm the ACP demo files are yours and whether to commit them.

Verifier: check BASELINE dates against `git log` and that no other file changed.

## M1 Real round trip — code done, GATE A NOT YET RUN (Sun Oct 18 ~01:40 PT, branch m1-telegram-bridge)

Files: `agenthq_live/telegram_bridge.py` (stdlib only: getUpdates loop, routing, send via
business_connection_id with a live getBusinessConnection re-check), `agenthq_live/bridge.py` (2-line shim:
the brief names both `telegram_bridge.py` and `python -m agenthq_live.bridge`), `agenthq_live/.gitignore`
(state.json, agenthq.db*, .venv/), `.env.example` (+AGENTHQ_TARGET_CHAT_ID), `tests/test_telegram_bridge.py`,
`tests/test_verify_m1_bridge.py` (verifier's repros).

Docs notes (core.telegram.org): connecting a business bot does NOT need Premium; for business connections only
the sending bot needs Bot-to-Bot mode; Bot API 10.0 "reply to other bots from a business bot". Whether a
business bot may START a message to a bot isn't stated; Gate A proves it. `can_reply` read from
`rights.can_reply` with fallback to the legacy top-level field.

Commands:
- `agenthq_live/.venv/bin/python -m pytest tests/test_telegram_bridge.py tests/test_verify_m1_bridge.py -q` → 15 passed
- `npm test` → 27 tests, 25 pass, 2 fail: `authHydration.test.mjs` "Home keeps truthful task total" and
  `noBilling.test.mjs` "original gradient navigation…". Both are source-text checks broken by upstream #27
  (Paper redesign) on main, not by this branch (Python only). Not fixed: app code is out of scope.

Independent Claude verifier: PASS, 1 major (poll loop crashed on connection reset/non-JSON error) and minors
(sender-less message counted as a reply; `send` could rewind the poll offset; non-atomic state writes; quoted
.env values). All fixed; repros pass.

NEEDS HUMAN (Gate A): BotFather business mode + bot-to-bot on OUR bot; `.env` with AGENTHQ_BOT_TOKEN and
AGENTHQ_TARGET_CHAT_ID; owner messages the target bot; Settings > Chat Automation > add our bot > only that
chat > allow replies; run `python -m agenthq_live.bridge run` and `... send "<text>"`. PASS needs: task in the
original chat as the owner, the target bot's real reply logged (ids), owner can still chat, no other chat's
updates, disabled connection refuses send.

Verifier, try to break: replies from a second chat; edited messages; revoke mid-run; two `send`s in a row.

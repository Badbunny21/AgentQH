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

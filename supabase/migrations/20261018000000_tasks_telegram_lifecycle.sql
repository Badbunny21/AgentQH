-- Additive Telegram task lifecycle. Existing status/done behavior is unchanged.
-- Reply content uses result; delivery/processing errors use execution_error.
-- All new fields remain null for existing tasks and tasks not sent to Telegram.

alter table public.tasks
  add column if not exists telegram_state text
    constraint tasks_telegram_state_check
    check (telegram_state in (
      'SENT',
      'REPLY_RECEIVED',
      'NEEDS_REVIEW',
      'REVIEWED',
      'TIMED_OUT'
    )),
  add column if not exists telegram_bot_id bigint,
  add column if not exists telegram_chat_id bigint,
  add column if not exists telegram_outbound_message_id bigint,
  add column if not exists telegram_reply_message_id bigint,
  -- The existing webhook payload includes update_id; retain it for reply retries.
  add column if not exists telegram_reply_update_id bigint,
  add column if not exists sent_at timestamptz,
  add column if not exists reply_received_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reply_deadline_at timestamptz,
  add column if not exists timed_out_at timestamptz;

-- Correlate a reply-to message with its task, scoped to the sending bot/chat.
create index if not exists tasks_telegram_outbound_lookup_idx
  on public.tasks (telegram_bot_id, telegram_chat_id, telegram_outbound_message_id)
  where telegram_bot_id is not null
    and telegram_chat_id is not null
    and telegram_outbound_message_id is not null;

-- Find SENT tasks whose reply deadline has passed; no timeout job is installed here.
create index if not exists tasks_telegram_reply_deadline_idx
  on public.tasks (reply_deadline_at)
  where telegram_state = 'SENT' and reply_deadline_at is not null;

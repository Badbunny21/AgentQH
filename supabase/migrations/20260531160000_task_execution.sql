-- Task execution results for AgentHQ mission control
-- Run in Supabase SQL Editor

alter table public.tasks
  add column if not exists result text;

alter table public.tasks
  add column if not exists execution_error text;

alter table public.tasks
  add column if not exists executed_at timestamptz;

alter table public.tasks drop constraint if exists tasks_status_check;

alter table public.tasks
  add constraint tasks_status_check
  check (status in ('open', 'doing', 'review', 'done'));

alter table public.activities drop constraint if exists activities_type_check;

alter table public.activities
  add constraint activities_type_check
  check (type in (
    'task_assigned',
    'task_done',
    'task_dispatched',
    'task_executed',
    'chat_reply',
    'agent_created',
    'import'
  ));

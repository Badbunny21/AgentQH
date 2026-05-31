-- Smart memory: activity type for saved facts

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
    'import',
    'handoff',
    'memory_saved'
  ));

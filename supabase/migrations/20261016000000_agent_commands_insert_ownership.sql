-- Command ownership hardening
-- The app creates commands through agent-commands-create, which verifies that
-- the agent belongs to the caller. Direct table inserts only checked user_id,
-- so a signed-in user could file a command against someone else's agent_id.
-- Match the handler: the command's agent must belong to the same owner.

drop policy if exists "Users create own commands" on public.agent_commands;

create policy "Users create own commands" on public.agent_commands
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.agents
      where agents.id = agent_id
        and agents.user_id = auth.uid()
    )
  );

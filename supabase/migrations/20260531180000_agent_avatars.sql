-- Custom agent profile photos

alter table public.agents
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('agent-avatars', 'agent-avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload own avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;
drop policy if exists "Users can delete own avatars" on storage.objects;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'agent-avatars');

create policy "Users can upload own avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'agent-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own avatars"
  on storage.objects for update
  using (
    bucket_id = 'agent-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'agent-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own avatars"
  on storage.objects for delete
  using (
    bucket_id = 'agent-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

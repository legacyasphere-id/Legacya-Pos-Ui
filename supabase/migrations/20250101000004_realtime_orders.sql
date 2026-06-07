-- Enable Supabase Realtime for the order table so the Kitchen Display updates
-- instantly. Guarded so it's a no-op where the publication doesn't exist
-- (e.g. local vanilla Postgres) or the table is already a member.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order'
     ) then
    alter publication supabase_realtime add table public."order";
  end if;
end
$$;

-- =====================================================================
--  GIẢ LẬP TỐI THIỂU MÔI TRƯỜNG SUPABASE TRÊN POSTGRES THƯỜNG (chỉ để kiểm thử)
--  Dùng: tạo một CSDL Postgres 16 trống → chạy file này → chạy supabase/schema.sql
--        → supabase/seed_questions.sql → tools/kiem_tra_sql.sql
--  Không chạy file này trên dự án Supabase thật (ở đó đã có sẵn auth/vai trò).
-- =====================================================================
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;
create schema if not exists extensions;
create schema if not exists auth;
grant usage on schema auth, extensions to anon, authenticated, service_role;
-- auth.uid(): Supabase đọc từ JWT; ở đây đọc từ biến phiên request.jwt.claim.sub
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
-- quyền mặc định giống Supabase: anon/authenticated có mọi quyền trên bảng (RLS mới là lớp chặn)
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

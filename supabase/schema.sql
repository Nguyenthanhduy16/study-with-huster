-- =====================================================================
--  PHÒNG ÔN THI ẢO — CƠ SỞ DỮ LIỆU SUPABASE (bản thử nghiệm)
--  Cách dùng: Supabase → SQL Editor → New query → dán TOÀN BỘ file này → Run.
--  Sau đó chạy file seed_questions.sql để nạp ngân hàng câu hỏi mẫu.
--  Chạy lại file này nhiều lần vẫn an toàn (không xoá dữ liệu đã có).
--
--  Nguyên tắc:
--   * Trình duyệt KHÔNG được ghi thẳng vào bảng. Mọi thao tác đi qua các hàm
--     (RPC) "security definer" bên dưới; hàm kiểm tra quyền, giới hạn tần suất,
--     lọc từ cấm và chấm điểm ngay trên máy chủ.
--   * Đáp án đúng KHÔNG bao giờ được gửi xuống trình duyệt khi vòng câu hỏi còn mở.
--   * MSSV đầy đủ chỉ quản trị viên xem được; nơi công khai chỉ hiện dạng 2023****.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;
set search_path = public, extensions;

-- =====================================================================
-- 1. CẤU HÌNH
-- =====================================================================
create table if not exists app_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (id, data) values (1, $json${
  "room_open": true,
  "season_name": "Tuần ôn thi 03/11 – 10/11/2026",
  "season_start": "2026-11-03",
  "streak_min": 25,
  "quiz": { "enabled": true, "period_min": 5, "answer_sec": 45, "subjects": ["GT1", "DS"], "stars": 1 },
  "env": { "time": "auto", "weather": "auto" },
  "reminders": { "eye_min": 20, "eye_sec": 20, "move_min": 50, "move_sec": 60, "water_min": 60, "allow_skip": true },
  "chat": { "free_text": true, "cooldown_sec": 10, "max_len": 80 },
  "templates": [
    "Chào mọi người 👋", "Cố lên mọi người ơi! 💪", "Ai ôn Giải tích không? 📘", "Ai ôn Đại số không? 📗",
    "Học thêm 25 phút nữa nào ⏱️", "Nghỉ 5 phút rồi học tiếp nha ☕", "Ôn xong một chương rồi 🎉",
    "Bài này khó quá, ai giúp với 🤔", "Cảm ơn bạn nhiều! 🙏", "Mình đi ăn chút rồi quay lại 🍜",
    "Chúc cả phòng thi tốt! 🍀", "Qua môn hết nhé! ✨"
  ],
  "cheers": [
    "Cố lên, bạn làm được mà! 💪", "Chúc bạn thi thật tốt! 🍀", "Bạn học chăm quá, nể ghê 👏",
    "Nghỉ ngơi chút rồi học tiếp nhé ☕", "Cùng nhau qua môn nha! ✨", "Cảm ơn bạn đã giúp mình! 🙏"
  ],
  "dm_templates": [
    "Chào bạn 👋", "Bạn ôn tới chương nào rồi?", "Bài này bạn làm sao vậy? 🤔", "Mình qua chỗ bạn nhé 🚶",
    "Học cùng nhau không? 📚", "Mình nghỉ chút, lát quay lại nhé ☕", "Cảm ơn bạn nhiều! 🙏", "Ok bạn 👍",
    "Hẹn gặp ở tầng 10 ngắm sao nhé ✨", "Chúc bạn thi tốt! 🍀"
  ],
  "near_radius": 8
}$json$::jsonb)
on conflict (id) do nothing;

-- Mật khẩu quản trị (lưu dạng băm). Không có mật khẩu mặc định — đặt bằng:  select admin_set_initial_password('mat-khau-moi');
create table if not exists admin_secret (
  id int primary key default 1 check (id = 1),
  pw_hash text not null,
  fail_count int not null default 0,
  locked_until timestamptz
);

create table if not exists admin_log (
  id bigserial primary key,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 2. LỌC TỪ CẤM
-- accent = true : so khớp nguyên dấu  (vd "lồn" — để không chặn nhầm "lớn")
-- accent = false: so khớp sau khi bỏ dấu (vd "dcm", "vcl", "loz")
-- mode  = 'token': khớp nguyên một từ; 'substr': khớp chuỗi con khi viết liền
-- scope = 'all' (tên + tin nhắn) | 'name' (chỉ tên)
-- =====================================================================
create table if not exists banned_words (
  word   text primary key,
  accent boolean not null default false,
  mode   text not null default 'token' check (mode in ('token', 'substr')),
  scope  text not null default 'all' check (scope in ('all', 'name'))
);

insert into banned_words (word, accent, mode, scope) values
  ('lồn', true, 'token', 'all'), ('cặc', true, 'token', 'all'), ('buồi', true, 'token', 'all'),
  ('địt', true, 'token', 'all'), ('đéo', true, 'token', 'all'), ('đụ', true, 'token', 'all'),
  ('đĩ', true, 'token', 'all'), ('chó đẻ', true, 'substr', 'all'), ('óc chó', true, 'substr', 'all'),
  ('ngu như chó', true, 'substr', 'all'), ('mẹ mày', true, 'substr', 'all'), ('bố mày', true, 'substr', 'all'),
  ('dit', false, 'token', 'all'), ('djt', false, 'token', 'all'), ('loz', false, 'token', 'all'),
  ('lozz', false, 'token', 'all'), ('cak', false, 'token', 'all'), ('dcm', false, 'token', 'all'),
  ('dkm', false, 'token', 'all'), ('dmm', false, 'token', 'all'), ('dm', false, 'token', 'all'),
  ('dmcs', false, 'token', 'all'), ('vcl', false, 'token', 'all'), ('vkl', false, 'token', 'all'),
  ('vl', false, 'token', 'all'), ('vcc', false, 'token', 'all'), ('clm', false, 'token', 'all'),
  ('cmm', false, 'token', 'all'), ('cl', false, 'token', 'all'), ('cc', false, 'token', 'all'),
  ('dume', false, 'substr', 'all'), ('duma', false, 'substr', 'all'), ('dmvl', false, 'substr', 'all'),
  ('fuck', false, 'substr', 'all'), ('shit', false, 'substr', 'all'), ('bitch', false, 'substr', 'all'),
  ('dick', false, 'token', 'all'), ('pussy', false, 'substr', 'all'), ('porn', false, 'substr', 'all'),
  ('sex', false, 'token', 'all'), ('nigga', false, 'substr', 'all'), ('nigger', false, 'substr', 'all'),
  ('admin', false, 'token', 'name'), ('quan tri', false, 'substr', 'name'), ('ban to chuc', false, 'substr', 'name'),
  ('clb', false, 'token', 'name'), ('hust', false, 'token', 'name'), ('bach khoa', false, 'substr', 'name'),
  ('hieu truong', false, 'substr', 'name'), ('giang vien', false, 'substr', 'name'), ('giao vien', false, 'substr', 'name')
on conflict (word) do nothing;

-- chữ thường, gộp khoảng trắng, đổi số kiểu teencode (0→o, 1→i, 3→e, 4→a, 5→s, 7→t)
create or replace function _norm_acc(t text) returns text language sql immutable as $$
  select btrim(regexp_replace(
           regexp_replace(translate(lower(coalesce(t, '')), '013457@$', 'oieastas'),
                          '[^a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ ]', ' ', 'g'),
           '\s+', ' ', 'g'))
$$;
-- bỏ dấu + gộp chữ lặp ("đmmmm" → "dm")
create or replace function _norm_plain(t text) returns text language sql stable as $$
  select regexp_replace(extensions.unaccent(_norm_acc(t)), '(.)\1+', '\1', 'g')
$$;

-- trả về từ cấm đầu tiên tìm thấy (null nếu sạch)
create or replace function _bad_word(t text, p_scope text) returns text language plpgsql stable as $$
declare
  acc text := ' ' || _norm_acc(t) || ' ';
  pla text := ' ' || _norm_plain(t) || ' ';
  acc_join text := replace(_norm_acc(t), ' ', '');
  pla_join text := replace(_norm_plain(t), ' ', '');
  w record; nw text;
begin
  for w in select * from banned_words where scope = 'all' or scope = p_scope loop
    if w.accent then
      nw := _norm_acc(w.word);
      if w.mode = 'token' and position(' ' || nw || ' ' in acc) > 0 then return w.word; end if;
      if w.mode = 'substr' and (position(nw in acc) > 0 or position(replace(nw, ' ', '') in acc_join) > 0) then return w.word; end if;
    else
      nw := _norm_plain(w.word);
      if w.mode = 'token' and position(' ' || nw || ' ' in pla) > 0 then return w.word; end if;
      if w.mode = 'substr' and (position(nw in pla) > 0 or position(replace(nw, ' ', '') in pla_join) > 0) then return w.word; end if;
    end if;
  end loop;
  return null;
end $$;

-- Một âm tiết tiếng Việt (sau khi bỏ dấu) có dạng: [phụ âm đầu] + nguyên âm + [phụ âm cuối]
create or replace function _is_vn_name(t text) returns boolean language plpgsql stable as $$
declare w text; n int := 0;
begin
  foreach w in array regexp_split_to_array(extensions.unaccent(lower(btrim(t))), '\s+') loop
    n := n + 1;
    if w !~ '^(ngh|ng|nh|ch|gh|gi|kh|ph|qu|th|tr|[bcdghklmnprstvx])?[aeiouy]{1,3}(ng|nh|ch|[cmnpt])?$' then
      return false;
    end if;
  end loop;
  return n between 2 and 6;
end $$;

-- =====================================================================
-- 3. NGƯỜI DÙNG
-- =====================================================================
create table if not exists profiles (
  id uuid primary key,
  full_name text not null,
  mssv text not null,
  name_ok boolean not null default false,      -- tên khớp mẫu tên tiếng Việt
  approved boolean not null default false,     -- QTV đã duyệt tên (dùng cho tên đặc biệt)
  quiz boolean not null default true,
  style jsonb not null default '{}'::jsonb,
  hide_rank boolean not null default false,
  hide_status boolean not null default false,
  chat_banned boolean not null default false,
  blocked boolean not null default false,
  hidden boolean not null default false,
  name_changes int not null default 0,
  zone text,
  hb_state text,
  last_hb timestamptz,
  session_started_at timestamptz,
  last_msg_at timestamptz,
  last_cheer_at timestamptz,
  last_post_at timestamptz,
  kicked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists profiles_mssv on profiles (mssv);
-- đợt 2 phần 4: ví sao, điểm tình nguyện ảo, hái xoài, đồ uống trên tay
alter table profiles add column if not exists spent_stars int not null default 0;          -- sao đã tiêu (ví = tổng sao kiếm được − đã tiêu)
alter table profiles add column if not exists volunteer_pts int not null default 0;        -- "Điểm tình nguyện ảo 🌱" (nhặt rác), KHÔNG phải điểm rèn luyện
alter table profiles add column if not exists volunteer_day date;
alter table profiles add column if not exists volunteer_today int not null default 0;
alter table profiles add column if not exists last_trash_at timestamptz;
alter table profiles add column if not exists mango_day date;                            -- ngày gần nhất nhận giấy chứng nhận hái xoài
alter table profiles add column if not exists mango_total int not null default 0;
alter table profiles add column if not exists cup_kind text;                              -- 'coffee' | 'water'
alter table profiles add column if not exists cup_until timestamptz;

-- Bản công khai (không có MSSV đầy đủ) — trình duyệt đọc bảng này & nhận realtime
create table if not exists public_profiles (
  id uuid primary key,
  display_name text not null,
  mssv_masked text not null,
  style jsonb not null default '{}'::jsonb,
  hidden boolean not null default false,
  hide_rank boolean not null default false,
  hide_status boolean not null default false,
  pending_name boolean not null default false,
  kicked_at timestamptz,
  updated_at timestamptz not null default now()
);

create or replace function _display_name(p profiles) returns text language sql immutable as $$
  select case when p.name_ok or p.approved then p.full_name else 'Bạn học ' || right(p.mssv, 4) end
$$;

create or replace function _sync_public_profile() returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if tg_op = 'DELETE' then delete from public_profiles where id = old.id; return old; end if;
  insert into public_profiles (id, display_name, mssv_masked, style, hidden, hide_rank, hide_status, pending_name, kicked_at, updated_at)
  values (new.id, _display_name(new), left(new.mssv, 4) || repeat('*', greatest(length(new.mssv) - 4, 0)), new.style,
          new.hidden or new.blocked, new.hide_rank, new.hide_status, not (new.name_ok or new.approved), new.kicked_at, now())
  on conflict (id) do update set display_name = excluded.display_name, mssv_masked = excluded.mssv_masked, style = excluded.style,
    hidden = excluded.hidden, hide_rank = excluded.hide_rank, hide_status = excluded.hide_status,
    pending_name = excluded.pending_name, kicked_at = excluded.kicked_at, updated_at = now()
  where (public_profiles.display_name, public_profiles.mssv_masked, public_profiles.style, public_profiles.hidden, public_profiles.hide_rank,
         public_profiles.hide_status, public_profiles.pending_name, public_profiles.kicked_at)
    is distinct from (excluded.display_name, excluded.mssv_masked, excluded.style, excluded.hidden, excluded.hide_rank,
         excluded.hide_status, excluded.pending_name, excluded.kicked_at);
  return new;
end $$;
drop trigger if exists trg_sync_public_profile on profiles;
create trigger trg_sync_public_profile after insert or update or delete on profiles
  for each row execute function _sync_public_profile();

-- Thống kê theo ngày (giờ Hà Nội)
create table if not exists daily_stats (
  uid uuid not null references profiles (id) on delete cascade,
  day date not null,
  seconds int not null default 0,
  stars int not null default 0,
  correct int not null default 0,
  answered int not null default 0,
  primary key (uid, day)
);
create index if not exists daily_stats_day on daily_stats (day);

create or replace function _today() returns date language sql stable as $$
  select (now() at time zone 'Asia/Ho_Chi_Minh')::date
$$;
create or replace function _setting(path text[]) returns jsonb language sql stable as $$
  select data #> path from app_settings where id = 1
$$;

-- =====================================================================
-- 4. CÂU HỎI & VÒNG CÂU HỎI CHUNG
-- =====================================================================
create table if not exists questions (
  id text primary key,
  mon text not null,                 -- GT1 | DS
  chuong text not null,              -- vd GT1.3
  do_kho int not null default 1,
  kieu text not null default 'mc',   -- dạng câu
  de text not null,                  -- đề (có thể chứa LaTeX $...$)
  lua jsonb not null,                -- mảng lựa chọn
  dap int not null,                  -- chỉ số đáp án đúng (0..3) — KHÔNG lộ ra ngoài khi vòng mở
  giai text,
  dung_cho_cau_chung boolean not null default true,
  active boolean not null default true,
  use_count int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists rounds (
  id bigserial primary key,
  slot_key text unique not null,
  question_id text not null references questions (id),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  cancelled boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists rounds_opens on rounds (opens_at desc);

create table if not exists answers (
  round_id bigint not null references rounds (id) on delete cascade,
  uid uuid not null references profiles (id) on delete cascade,
  choice int not null,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  primary key (round_id, uid)
);

-- =====================================================================
-- 5. TƯƠNG TÁC
-- =====================================================================
create table if not exists messages (
  id bigserial primary key,
  uid uuid not null references profiles (id) on delete cascade,
  zone text not null,
  text text not null,
  target uuid,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_zone on messages (zone, created_at desc);
-- tin "Gần tôi": lưu vị trí người gửi lúc gửi {x,y,z}; máy người nhận chỉ hiện nếu đứng trong bán kính (mặc định 8 m)
alter table messages add column if not exists near jsonb;

create table if not exists qa_questions (
  id bigserial primary key,
  uid uuid not null references profiles (id) on delete cascade,
  subject text not null default 'Khác',
  title text not null,
  body text not null default '',
  answers_count int not null default 0,
  reports int not null default 0,
  pinned boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists qa_answers (
  id bigserial primary key,
  qid bigint not null references qa_questions (id) on delete cascade,
  uid uuid not null references profiles (id) on delete cascade,
  body text not null,
  reports int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists qa_reports (
  kind text not null,
  item_id bigint not null,
  uid uuid not null,
  created_at timestamptz not null default now(),
  primary key (kind, item_id, uid)
);

create table if not exists cheers (
  id bigserial primary key,
  from_uid uuid not null references profiles (id) on delete cascade,
  to_uid uuid not null references profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id bigserial primary key,
  uid uuid references profiles (id) on delete set null,
  kind text not null default 'gop_y',
  body text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists notices (
  id bigserial primary key,
  text text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists events (
  id bigserial primary key,
  kind text not null,
  uid uuid,
  text text not null,
  created_at timestamptz not null default now()
);

-- Đợt 3 (triển khai): chỉ mục cho các truy vấn/khoá ngoại chạy thường xuyên khi đông người.
-- Thiếu chúng thì: tải hộp thư nhắn riêng (cheers theo from_uid/to_uid), Realtime lọc to_uid, tải trả lời hỏi bài,
-- và xoá một người dùng (on delete cascade) đều phải quét cả bảng.
create index if not exists cheers_to on cheers (to_uid, created_at desc);
create index if not exists cheers_from on cheers (from_uid, created_at desc);
create index if not exists qa_answers_qid on qa_answers (qid, created_at);
create index if not exists qa_answers_uid on qa_answers (uid);
create index if not exists qa_questions_list on qa_questions (pinned desc, created_at desc);
create index if not exists qa_questions_uid on qa_questions (uid);
create index if not exists messages_uid on messages (uid);
create index if not exists messages_created on messages (created_at desc);
create index if not exists answers_uid on answers (uid);
create index if not exists feedback_uid on feedback (uid);
create index if not exists profiles_last_hb on profiles (last_hb desc);
create index if not exists notices_created on notices (created_at desc);

-- =====================================================================
-- 6. BẢO MẬT HÀNG (RLS): trình duyệt chỉ được ĐỌC những gì công khai
-- =====================================================================
alter table app_settings   enable row level security;
alter table admin_secret   enable row level security;
alter table admin_log      enable row level security;
alter table banned_words   enable row level security;
alter table profiles       enable row level security;
alter table public_profiles enable row level security;
alter table daily_stats    enable row level security;
alter table questions      enable row level security;
alter table rounds         enable row level security;
alter table answers        enable row level security;
alter table messages       enable row level security;
alter table qa_questions   enable row level security;
alter table qa_answers     enable row level security;
alter table qa_reports     enable row level security;
alter table cheers         enable row level security;
alter table feedback       enable row level security;
alter table notices        enable row level security;
alter table events         enable row level security;

drop policy if exists read_settings on app_settings;
create policy read_settings on app_settings for select to anon, authenticated using (true);
drop policy if exists read_words on banned_words;
create policy read_words on banned_words for select to anon, authenticated using (true);
drop policy if exists read_own_profile on profiles;
create policy read_own_profile on profiles for select to authenticated using (id = auth.uid());
drop policy if exists read_public_profiles on public_profiles;
create policy read_public_profiles on public_profiles for select to authenticated using (true);
drop policy if exists read_messages on messages;
create policy read_messages on messages for select to authenticated using (not hidden);
drop policy if exists read_qa on qa_questions;
create policy read_qa on qa_questions for select to authenticated using (not hidden);
drop policy if exists read_qa_ans on qa_answers;
create policy read_qa_ans on qa_answers for select to authenticated using (not hidden);
drop policy if exists read_my_cheers on cheers;
create policy read_my_cheers on cheers for select to authenticated using (to_uid = auth.uid() or from_uid = auth.uid());
drop policy if exists read_notices on notices;
create policy read_notices on notices for select to authenticated using (expires_at > now());
drop policy if exists read_events on events;
create policy read_events on events for select to authenticated using (true);
-- questions, rounds, answers, daily_stats, feedback, admin_*: không có policy ⇒ chỉ đọc qua hàm.

-- Realtime: các bảng trình duyệt cần nghe thay đổi
do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['messages', 'public_profiles', 'notices', 'events', 'cheers', 'app_settings'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Đợt 3: khi một tin nhắn bị ẩn (QTV ẩn, hoặc đủ 3 báo cáo), Realtime KHÔNG gửi bản cập nhật cho
-- trình duyệt vì RLS "not hidden" chặn chính dòng đó ⇒ trước đây tin bị ẩn vẫn nằm trên màn hình
-- người khác tới khi tải lại. Ghi thêm một sự kiện nhỏ 'hide_msg' (text = id tin) để máy khách gỡ tin.
create or replace function _msg_hidden_event() returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.hidden and not old.hidden then
    insert into events (kind, uid, text) values ('hide_msg', null, new.id::text);
  end if;
  return new;
end $$;
drop trigger if exists trg_msg_hidden_event on messages;
create trigger trg_msg_hidden_event after update of hidden on messages
  for each row execute function _msg_hidden_event();

-- =====================================================================
-- 7. HÀM CHO NGƯỜI HỌC
-- =====================================================================
create or replace function _me() returns profiles language plpgsql stable security definer set search_path = public, extensions as $$
declare p profiles;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  select * into p from profiles where id = auth.uid();
  return p;
end $$;

create or replace function server_now() returns timestamptz language sql stable as $$ select now() $$;

-- Cấu hình công khai (không chứa bí mật)
create or replace function get_config() returns jsonb language sql stable security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'settings', (select data from app_settings where id = 1),
    'banned', coalesce((select jsonb_agg(jsonb_build_object('w', word, 'a', accent, 'm', mode, 's', scope)) from banned_words), '[]'::jsonb),
    'now', now())
$$;

-- Kiểm tra tên + MSSV, trả lỗi bằng tiếng Việt (dùng cả ở form trước khi gửi)
create or replace function check_identity(p_name text, p_mssv text) returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare n text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')); bad text;
begin
  if n !~ '^[A-Za-zÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ ]+$' then
    return jsonb_build_object('ok', false, 'field', 'name', 'error', 'Họ tên chỉ gồm chữ cái và khoảng trắng.');
  end if;
  if char_length(n) < 4 or char_length(n) > 40 or array_length(regexp_split_to_array(n, ' '), 1) < 2 then
    return jsonb_build_object('ok', false, 'field', 'name', 'error', 'Vui lòng nhập đầy đủ họ và tên (2–6 chữ, tối đa 40 ký tự).');
  end if;
  bad := _bad_word(n, 'name');
  if bad is not null then
    return jsonb_build_object('ok', false, 'field', 'name', 'error', 'Tên chứa từ không phù hợp. Vui lòng dùng họ tên thật.');
  end if;
  if coalesce(p_mssv, '') !~ '^202[1-6][0-9]{4,5}$' then
    return jsonb_build_object('ok', false, 'field', 'mssv', 'error', 'MSSV gồm 8–9 chữ số, bắt đầu từ 2021 đến 2026 (vd 20231234).');
  end if;
  return jsonb_build_object('ok', true, 'name', n, 'vn', _is_vn_name(n));
end $$;

-- Tạo / cập nhật hồ sơ của chính mình
create or replace function register_profile(p_name text, p_mssv text, p_quiz boolean, p_style jsonb,
                                            p_hide_rank boolean default false, p_hide_status boolean default false)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare chk jsonb; p profiles; changed boolean;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  if not coalesce((_setting('{room_open}'))::boolean, true) then
    return jsonb_build_object('ok', false, 'error', 'Phòng ôn thi ảo đang tạm đóng.');
  end if;
  chk := check_identity(p_name, p_mssv);
  if not (chk->>'ok')::boolean then return chk; end if;
  select * into p from profiles where id = auth.uid();
  if found then
    if p.blocked then return jsonb_build_object('ok', false, 'error', 'Tài khoản đã bị tạm khoá. Liên hệ ban tổ chức nếu có nhầm lẫn.'); end if;
    changed := p.full_name <> chk->>'name' or p.mssv <> p_mssv;
    if changed and p.name_changes >= 5 then
      return jsonb_build_object('ok', false, 'field', 'name', 'error', 'Bạn đã đổi tên quá nhiều lần trên trình duyệt này.');
    end if;
    update profiles set full_name = chk->>'name', mssv = p_mssv, name_ok = (chk->>'vn')::boolean,
      approved = case when changed then false else approved end,
      name_changes = name_changes + case when changed then 1 else 0 end,
      quiz = coalesce(p_quiz, true), style = coalesce(p_style, '{}'::jsonb),
      hide_rank = coalesce(p_hide_rank, false), hide_status = coalesce(p_hide_status, false)
    where id = auth.uid();
  else
    if (select count(*) from profiles where created_at > now() - interval '1 minute') > 120 then
      return jsonb_build_object('ok', false, 'error', 'Hệ thống đang đông, vui lòng thử lại sau ít phút.');
    end if;
    insert into profiles (id, full_name, mssv, name_ok, quiz, style, hide_rank, hide_status)
    values (auth.uid(), chk->>'name', p_mssv, (chk->>'vn')::boolean, coalesce(p_quiz, true), coalesce(p_style, '{}'::jsonb),
            coalesce(p_hide_rank, false), coalesce(p_hide_status, false));
  end if;
  return jsonb_build_object('ok', true, 'profile', my_profile());
end $$;

create or replace function update_prefs(p_style jsonb, p_hide_rank boolean, p_hide_status boolean, p_quiz boolean default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  update profiles set style = coalesce(p_style, style), hide_rank = coalesce(p_hide_rank, hide_rank),
    hide_status = coalesce(p_hide_status, hide_status), quiz = coalesce(p_quiz, quiz)
  where id = auth.uid();
  return my_profile();
end $$;

-- streak (chuỗi ngày ≥ streak_min phút) của một người
create or replace function _streak(p_uid uuid) returns int language sql stable as $$
  with d as (select day from daily_stats where uid = p_uid and seconds >= coalesce((_setting('{streak_min}'))::int, 25) * 60),
  g as (select day, day - (row_number() over (order by day))::int as grp from d),
  isl as (select max(day) as last_day, count(*) as len from g group by grp)
  select coalesce((select len::int from isl where last_day >= _today() - 1 order by last_day desc limit 1), 0)
$$;

create or replace function my_profile() returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare p profiles; t daily_stats; tot record;
begin
  select * into p from profiles where id = auth.uid();
  if not found then return null; end if;
  select * into t from daily_stats where uid = p.id and day = _today();
  select coalesce(sum(seconds), 0) s, coalesce(sum(stars), 0) st, coalesce(sum(correct), 0) c, coalesce(sum(answered), 0) a
    into tot from daily_stats where uid = p.id;
  return jsonb_build_object(
    'id', p.id, 'full_name', p.full_name, 'display_name', _display_name(p), 'mssv', p.mssv,
    'pending_name', not (p.name_ok or p.approved), 'quiz', p.quiz, 'style', p.style,
    'hide_rank', p.hide_rank, 'hide_status', p.hide_status, 'chat_banned', p.chat_banned, 'blocked', p.blocked,
    'today', jsonb_build_object('seconds', coalesce(t.seconds, 0), 'stars', coalesce(t.stars, 0),
                                'correct', coalesce(t.correct, 0), 'answered', coalesce(t.answered, 0)),
    'total', jsonb_build_object('seconds', tot.s, 'stars', tot.st, 'correct', tot.c, 'answered', tot.a),
    'streak', _streak(p.id),
    'wallet', greatest(0, tot.st - p.spent_stars), 'spent', p.spent_stars,
    'volunteer', p.volunteer_pts, 'volunteer_today', case when p.volunteer_day = _today() then p.volunteer_today else 0 end,
    'mango_total', p.mango_total, 'mango_today', p.mango_day = _today(),
    'cup', case when p.cup_until > now() then jsonb_build_object('kind', p.cup_kind, 'until', p.cup_until) else null end);
end $$;

-- ----- ví sao: mua đồ (chỉ để vui, không ảnh hưởng xếp hạng) -----
create or replace function buy_item(p_item text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare p profiles; earned int; cost int; mins int;
begin
  p := _me();
  if p.id is null or p.blocked then return jsonb_build_object('ok', false, 'error', 'Chưa có hồ sơ'); end if;
  if p_item = 'coffee' then cost := 2; mins := 30;
  elsif p_item = 'water' then cost := 0; mins := 10;
  else return jsonb_build_object('ok', false, 'error', 'Không có món này.'); end if;
  select coalesce(sum(stars), 0) into earned from daily_stats where uid = p.id;
  if earned - p.spent_stars < cost then return jsonb_build_object('ok', false, 'error', 'Ví chưa đủ sao (cần ' || cost || ' ⭐).'); end if;
  update profiles set spent_stars = spent_stars + cost, cup_kind = p_item, cup_until = now() + make_interval(mins => mins) where id = p.id;
  return jsonb_build_object('ok', true, 'profile', my_profile());
end $$;

-- ----- nhặt rác trên sân: +1 điểm tình nguyện ảo, tối đa 30 lần/ngày, mỗi lần cách nhau ≥ 8 giây -----
create or replace function pick_trash() returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare p profiles; n int;
begin
  p := _me();
  if p.id is null or p.blocked then return jsonb_build_object('ok', false, 'error', 'Chưa có hồ sơ'); end if;
  if p.last_trash_at > now() - interval '8 seconds' then return jsonb_build_object('ok', false, 'error', 'Từ từ thôi, nhặt từng cái một nhé.'); end if;
  n := case when p.volunteer_day = _today() then p.volunteer_today else 0 end;
  if n >= 30 then return jsonb_build_object('ok', false, 'error', 'Hôm nay bạn đã nhặt đủ 30 lần rồi. Cảm ơn bạn! 🌱'); end if;
  update profiles set volunteer_pts = volunteer_pts + 1, volunteer_day = _today(), volunteer_today = n + 1, last_trash_at = now() where id = p.id;
  return jsonb_build_object('ok', true, 'total', p.volunteer_pts + 1, 'today', n + 1);
end $$;

-- ----- hái xoài: mỗi ngày nhận một giấy chứng nhận (mang tính giải trí) -----
create or replace function claim_mango() returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare p profiles;
begin
  p := _me();
  if p.id is null or p.blocked then return jsonb_build_object('ok', false, 'error', 'Chưa có hồ sơ'); end if;
  if p.mango_day = _today() then return jsonb_build_object('ok', false, 'already', true, 'total', p.mango_total); end if;
  update profiles set mango_day = _today(), mango_total = mango_total + 1 where id = p.id;
  return jsonb_build_object('ok', true, 'total', p.mango_total + 1);
end $$;

-- Bắt đầu một phiên học (mỗi lần vào phòng / tải lại trang)
create or replace function start_session(p_zone text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare p profiles;
begin
  p := _me();
  if p.id is null then return jsonb_build_object('ok', false, 'error', 'Chưa có hồ sơ'); end if;
  if p.blocked then return jsonb_build_object('ok', false, 'error', 'Tài khoản đã bị tạm khoá.'); end if;
  update profiles set session_started_at = now(), last_hb = now(), hb_state = 'nghi', zone = left(p_zone, 20) where id = p.id;
  return jsonb_build_object('ok', true, 'profile', my_profile(), 'now', now());
end $$;

-- Nhịp tim ~60 giây/lần. Thời gian chỉ được cộng cho khoảng vừa qua nếu trạng thái
-- trước đó là "đang học"/"tập trung" và hai nhịp cách nhau không quá 120 giây (tối đa cộng 90 giây/nhịp).
-- Nhiều tab cùng lúc không bị cộng đôi vì luôn tính theo mốc last_hb chung.
create or replace function heartbeat(p_zone text, p_state text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare p profiles; gap numeric; add int := 0; old_s int; new_s int;
begin
  p := _me();
  if p.id is null or p.blocked then return jsonb_build_object('ok', false); end if;
  -- 'piano' = đang chơi đàn ở tầng 6: không tính giờ học
  -- 'choi' = chế độ Dạo chơi (mini-game): không tính giờ học
  if p_state not in ('hoc', 'tap_trung', 'nghi', 'treo', 'quiz', 'piano', 'choi') then p_state := 'nghi'; end if;
  gap := extract(epoch from now() - coalesce(p.last_hb, now()));
  if p.hb_state in ('hoc', 'tap_trung', 'quiz') and gap > 0 and gap <= 120 then add := least(gap, 90)::int; end if;
  update profiles set last_hb = now(), hb_state = p_state, zone = left(p_zone, 20) where id = p.id;
  if add > 0 then
    insert into daily_stats (uid, day, seconds) values (p.id, _today(), add)
      on conflict (uid, day) do update set seconds = daily_stats.seconds + add
      returning seconds - add, seconds into old_s, new_s;
    if new_s / 3600 > old_s / 3600 and not p.hide_status and not p.hidden then
      insert into events (kind, uid, text) values ('milestone', p.id,
        _display_name(p) || ' vừa học đủ ' || (new_s / 3600) || ' giờ hôm nay 🎉');
    end if;
  end if;
  return jsonb_build_object('ok', true, 'added', add, 'profile', my_profile());
end $$;

-- ----- chọn câu hỏi cân bằng môn → chương → dạng -----
create or replace function _pick_question(p_subjects text[]) returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  recent text[]; last_mon text; last_ch text; last_kieu text;
  v_mon text; v_ch text; v_q text;
begin
  select coalesce(array_agg(question_id), '{}') into recent
    from (select question_id from rounds where not cancelled order by opens_at desc limit 20) r;
  select q.mon, q.chuong, q.kieu into last_mon, last_ch, last_kieu
    from rounds r join questions q on q.id = r.question_id where not r.cancelled order by r.opens_at desc limit 1;

  -- câu hợp lệ: đang bật, cho phép dùng làm câu chung, có ≥2 lựa chọn, đáp án nằm trong khoảng
  if to_regclass('pg_temp._elig') is null then
    create temp table _elig (id text, mon text, chuong text, kieu text, use_count int) on commit drop;
  else
    truncate _elig;
  end if;
  insert into _elig select id, mon, chuong, kieu, use_count from questions
    where active and dung_cho_cau_chung and mon = any (p_subjects)
      and jsonb_typeof(lua) = 'array' and jsonb_array_length(lua) >= 2 and dap >= 0 and dap < jsonb_array_length(lua);

  -- 1) MÔN: môn xuất hiện ít nhất trong 6 vòng gần đây, ưu tiên khác môn vòng trước
  select e.mon into v_mon from (select distinct mon from _elig) e
    left join lateral (select count(*) c from (select q.mon from rounds r join questions q on q.id = r.question_id
                       where not r.cancelled order by r.opens_at desc limit 6) x where x.mon = e.mon) k on true
    order by k.c, (e.mon = last_mon), random() limit 1;
  if v_mon is null then return null; end if;

  -- 2) CHƯƠNG: chương ít xuất hiện nhất trong 20 vòng gần đây (có câu chưa dùng gần đây), khác chương vòng trước
  select e.chuong into v_ch from (select distinct chuong from _elig where mon = v_mon and not (id = any (recent))) e
    left join lateral (select count(*) c from rounds r join questions q on q.id = r.question_id
                       where q.chuong = e.chuong and r.id in (select id from rounds where not cancelled order by opens_at desc limit 20)) k on true
    order by k.c, (e.chuong = last_ch), random() limit 1;
  if v_ch is null then  -- ngân hàng nhỏ: bỏ ràng buộc "chưa dùng gần đây"
    select chuong into v_ch from _elig where mon = v_mon group by chuong order by (chuong = last_ch), random() limit 1;
  end if;

  -- 3) CÂU: chưa dùng trong 20 vòng gần nhất, khác dạng câu vòng trước, ít được dùng nhất
  select id into v_q from _elig where mon = v_mon and chuong = v_ch
    order by (id = any (recent)), (kieu = last_kieu), use_count, random() limit 1;
  update questions set use_count = use_count + 1 where id = v_q;
  return v_q;
end $$;

-- Vòng hiện tại: tự tạo nếu chưa có. Trả câu hỏi KHÔNG kèm đáp án.
create or replace function get_round() returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  q jsonb := _setting('{quiz}'); period int; ans int; slot bigint; v_key text; r rounds; qq questions;
  p profiles; my answers; subs text[];
begin
  p := _me();
  if not coalesce((q->>'enabled')::boolean, true) then return jsonb_build_object('enabled', false, 'now', now()); end if;
  period := greatest(60, coalesce((q->>'period_min')::numeric, 5) * 60)::int;
  ans := least(greatest(coalesce((q->>'answer_sec')::int, 45), 10), period - 15);
  slot := floor(extract(epoch from now()) / period);
  v_key := period || ':' || slot;
  select * into r from rounds where slot_key = v_key;
  if not found then
    select array(select jsonb_array_elements_text(coalesce(q->'subjects', '["GT1","DS"]'::jsonb))) into subs;
    perform pg_advisory_xact_lock(hashtext('round:' || v_key));
    select * into r from rounds where slot_key = v_key;
    if not found then
      insert into rounds (slot_key, question_id, opens_at, closes_at)
      select v_key, qid, to_timestamp(slot * period), to_timestamp(slot * period) + make_interval(secs => ans)
        from (select _pick_question(subs) qid) x where qid is not null
      on conflict (slot_key) do nothing;
      select * into r from rounds where slot_key = v_key;
    end if;
  end if;
  if r.id is null then return jsonb_build_object('enabled', true, 'empty', true, 'now', now()); end if;
  select * into qq from questions where id = r.question_id;
  select * into my from answers where round_id = r.id and uid = p.id;
  return jsonb_build_object(
    'enabled', true, 'now', now(), 'id', r.id, 'opens_at', r.opens_at, 'closes_at', r.closes_at,
    'next_at', to_timestamp((slot + 1) * period), 'cancelled', r.cancelled,
    'eligible', p.id is not null and p.quiz and p.session_started_at is not null and p.session_started_at <= r.opens_at,
    'question', jsonb_build_object('id', qq.id, 'mon', qq.mon, 'chuong', qq.chuong, 'do_kho', qq.do_kho, 'de', qq.de, 'lua', qq.lua),
    'my_choice', my.choice);
end $$;

create or replace function submit_answer(p_round bigint, p_choice int) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare p profiles; r rounds; qq questions; ok boolean; stars int;
begin
  p := _me();
  if p.id is null or p.blocked then return jsonb_build_object('ok', false, 'error', 'Chưa có hồ sơ'); end if;
  if not p.quiz then return jsonb_build_object('ok', false, 'error', 'Bạn chưa đăng ký nhận câu hỏi.'); end if;
  select * into r from rounds where id = p_round;
  if not found or r.cancelled then return jsonb_build_object('ok', false, 'error', 'Vòng không tồn tại hoặc đã huỷ.'); end if;
  if now() < r.opens_at or now() > r.closes_at + interval '2 seconds' then
    return jsonb_build_object('ok', false, 'error', 'Đã hết thời gian trả lời.');
  end if;
  if p.session_started_at is null or p.session_started_at > r.opens_at then
    return jsonb_build_object('ok', false, 'error', 'Bạn vào phòng khi vòng đã bắt đầu, hãy chờ vòng sau nhé.');
  end if;
  select * into qq from questions where id = r.question_id;
  if p_choice < 0 or p_choice >= jsonb_array_length(qq.lua) then return jsonb_build_object('ok', false, 'error', 'Lựa chọn không hợp lệ.'); end if;
  ok := p_choice = qq.dap;
  insert into answers (round_id, uid, choice, is_correct) values (r.id, p.id, p_choice, ok)
    on conflict (round_id, uid) do nothing;
  if not found then return jsonb_build_object('ok', false, 'error', 'Bạn đã trả lời vòng này rồi.'); end if;
  stars := case when ok then coalesce((_setting('{quiz,stars}'))::int, 1) else 0 end;
  insert into daily_stats (uid, day, answered, correct, stars) values (p.id, _today(), 1, ok::int, stars)
    on conflict (uid, day) do update set answered = daily_stats.answered + 1,
      correct = daily_stats.correct + excluded.correct, stars = daily_stats.stars + excluded.stars;
  return jsonb_build_object('ok', true);
end $$;

create or replace function get_round_result(p_round bigint) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare r rounds; qq questions; dist jsonb; tot int; cor int; my answers;
begin
  select * into r from rounds where id = p_round;
  if not found then return jsonb_build_object('ok', false, 'error', 'Không có vòng này'); end if;
  if now() < r.closes_at then return jsonb_build_object('ok', false, 'error', 'Vòng chưa kết thúc', 'closes_at', r.closes_at); end if;
  select * into qq from questions where id = r.question_id;
  select coalesce(jsonb_object_agg(choice, c), '{}'::jsonb), coalesce(sum(c), 0), coalesce(sum(c) filter (where choice = qq.dap), 0)
    into dist, tot, cor from (select choice, count(*)::int c from answers where round_id = r.id group by choice) x;
  select * into my from answers where round_id = r.id and uid = auth.uid();
  return jsonb_build_object('ok', true, 'id', r.id, 'cancelled', r.cancelled, 'dap', qq.dap, 'giai', qq.giai,
    'dist', dist, 'total', tot, 'correct', cor, 'my_choice', my.choice, 'my_correct', my.is_correct,
    'stars', case when my.is_correct and not r.cancelled then coalesce((_setting('{quiz,stars}'))::int, 1) else 0 end);
end $$;

-- Bảng xếp hạng. p_metric: seconds | stars | streak ; p_period: today | season
create or replace function leaderboard(p_metric text, p_period text) returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare d0 date; rows jsonb; me jsonb;
begin
  d0 := case when p_period = 'today' then _today() else coalesce((_setting('{season_start}'))#>>'{}', _today()::text)::date end;
  with base as (
    select pr.id, pr.display_name,
      case p_metric
        when 'stars' then (select coalesce(sum(stars), 0) from daily_stats s where s.uid = pr.id and s.day >= d0)
        when 'streak' then _streak(pr.id)
        else (select coalesce(sum(seconds), 0) from daily_stats s where s.uid = pr.id and s.day >= d0) end::int as v
    from public_profiles pr where not pr.hidden and not pr.hide_rank
  ), ranked as (select id, display_name, v, rank() over (order by v desc) rk from base where v > 0)
  select coalesce((select jsonb_agg(jsonb_build_object('rank', rk, 'id', id, 'name', display_name, 'v', v) order by rk, display_name)
                   from (select * from ranked order by rk limit 20) t), '[]'::jsonb),
         (select jsonb_build_object('rank', rk, 'v', v) from ranked where id = auth.uid())
    into rows, me;
  return jsonb_build_object('rows', rows, 'me', me);
end $$;

create or replace function global_stats() returns jsonb language sql stable security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'seconds_today', coalesce((select sum(seconds) from daily_stats where day = _today()), 0),
    'answers_today', coalesce((select sum(answered) from daily_stats where day = _today()), 0),
    'learners_today', (select count(*) from daily_stats where day = _today() and seconds > 0),
    'learners_total', (select count(*) from profiles))
$$;

-- Thẻ hồ sơ khi bấm vào một bạn
create or replace function profile_card(p_uid uuid) returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare pp public_profiles; p profiles; t daily_stats; tot record;
begin
  select * into pp from public_profiles where id = p_uid and not hidden;
  if not found then return null; end if;
  select * into p from profiles where id = p_uid;
  select * into t from daily_stats where uid = p_uid and day = _today();
  select coalesce(sum(seconds), 0) s, coalesce(sum(stars), 0) st, coalesce(sum(correct), 0) c into tot from daily_stats where uid = p_uid;
  return jsonb_build_object('id', pp.id, 'name', pp.display_name, 'mssv', pp.mssv_masked, 'style', pp.style,
    'pending_name', pp.pending_name,
    'today_seconds', coalesce(t.seconds, 0), 'today_stars', coalesce(t.stars, 0),
    'total_seconds', tot.s, 'total_stars', tot.st, 'total_correct', tot.c, 'streak', _streak(p_uid),
    'state', case when pp.hide_status then null when p.last_hb > now() - interval '3 minutes' then p.hb_state else 'offline' end,
    'zone', case when pp.hide_status then null else p.zone end,
    'volunteer', p.volunteer_pts, 'mango_total', p.mango_total);
end $$;

-- ----- nhắn tin -----
drop function if exists send_message(text, text, uuid);
create or replace function send_message(p_zone text, p_text text, p_target uuid default null, p_near jsonb default null) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare p profiles; c jsonb := _setting('{chat}'); t text := btrim(regexp_replace(coalesce(p_text, ''), '\s+', ' ', 'g'));
  is_tpl boolean; cd int; bad text; row messages; nr jsonb;
begin
  p := _me();
  if p.id is null or p.blocked then return jsonb_build_object('ok', false, 'error', 'Chưa có hồ sơ'); end if;
  if p.chat_banned then return jsonb_build_object('ok', false, 'error', 'Bạn đang bị tạm khoá nhắn tin.'); end if;
  if t = '' then return jsonb_build_object('ok', false, 'error', 'Tin nhắn trống.'); end if;
  is_tpl := (_setting('{templates}')) ? t;
  if not is_tpl and not coalesce((c->>'free_text')::boolean, true) then
    return jsonb_build_object('ok', false, 'error', 'Hiện chỉ được gửi tin nhắn mẫu.');
  end if;
  if char_length(t) > coalesce((c->>'max_len')::int, 80) then return jsonb_build_object('ok', false, 'error', 'Tin nhắn quá dài.'); end if;
  cd := coalesce((c->>'cooldown_sec')::int, 10);
  if p.last_msg_at > now() - make_interval(secs => cd) then
    return jsonb_build_object('ok', false, 'error', 'Chậm lại một chút nhé (mỗi ' || cd || ' giây một tin).');
  end if;
  bad := _bad_word(t, 'all');
  if bad is not null then return jsonb_build_object('ok', false, 'error', 'Tin nhắn có từ ngữ không phù hợp.'); end if;
  if p_target is not null and not exists (select 1 from public_profiles where id = p_target and not hidden) then p_target := null; end if;
  update profiles set last_msg_at = now() where id = p.id;
  if p_near is not null then
    nr := jsonb_build_object('x', round((p_near->>'x')::numeric, 1), 'y', round((p_near->>'y')::numeric, 1), 'z', round((p_near->>'z')::numeric, 1));
  end if;
  insert into messages (uid, zone, text, target, near) values (p.id, left(p_zone, 20), t, p_target, nr) returning * into row;
  return jsonb_build_object('ok', true, 'id', row.id);
end $$;

-- ----- nhắn riêng: chỉ gửi được câu mẫu (dm_templates), người nhận và người gửi mới đọc được -----
alter table cheers add column if not exists kind text not null default 'cheer';
create or replace function send_dm(p_to uuid, p_idx int) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare p profiles; t text;
  tpl jsonb := coalesce(_setting('{dm_templates}'), '["Chào bạn 👋","Bạn ôn tới chương nào rồi?","Bài này bạn làm sao vậy? 🤔","Mình qua chỗ bạn nhé 🚶","Học cùng nhau không? 📚","Mình nghỉ chút, lát quay lại nhé ☕","Cảm ơn bạn nhiều! 🙏","Ok bạn 👍","Hẹn gặp ở tầng 10 ngắm sao nhé ✨","Chúc bạn thi tốt! 🍀"]'::jsonb);
begin
  p := _me();
  if p.id is null or p.blocked or p.chat_banned then return jsonb_build_object('ok', false, 'error', 'Không gửi được lúc này.'); end if;
  if p.last_cheer_at > now() - interval '5 seconds' then return jsonb_build_object('ok', false, 'error', 'Chậm lại một chút nhé.'); end if;
  t := tpl ->> p_idx;
  if t is null or p_to = p.id or not exists (select 1 from public_profiles where id = p_to and not hidden) then
    return jsonb_build_object('ok', false, 'error', 'Không gửi được.');
  end if;
  update profiles set last_cheer_at = now() where id = p.id;
  insert into cheers (from_uid, to_uid, text, kind) values (p.id, p_to, t, 'dm');
  return jsonb_build_object('ok', true);
end $$;

create or replace function send_cheer(p_to uuid, p_idx int) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare p profiles; t text;
begin
  p := _me();
  if p.id is null or p.blocked or p.chat_banned then return jsonb_build_object('ok', false, 'error', 'Không gửi được lúc này.'); end if;
  if p.last_cheer_at > now() - interval '20 seconds' then return jsonb_build_object('ok', false, 'error', 'Đợi 20 giây rồi gửi tiếp nhé.'); end if;
  t := (_setting('{cheers}')) ->> p_idx;
  if t is null or p_to = p.id or not exists (select 1 from profiles where id = p_to) then
    return jsonb_build_object('ok', false, 'error', 'Không gửi được.');
  end if;
  update profiles set last_cheer_at = now() where id = p.id;
  insert into cheers (from_uid, to_uid, text) values (p.id, p_to, t);
  return jsonb_build_object('ok', true);
end $$;

create or replace function send_feedback(p_kind text, p_body text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare p profiles; b text := btrim(coalesce(p_body, ''));
begin
  p := _me();
  if char_length(b) < 3 or char_length(b) > 1000 then return jsonb_build_object('ok', false, 'error', 'Nội dung cần từ 3 đến 1000 ký tự.'); end if;
  if (select count(*) from feedback where uid = auth.uid() and created_at > now() - interval '10 minutes') >= 5 then
    return jsonb_build_object('ok', false, 'error', 'Bạn đã gửi nhiều góp ý, thử lại sau nhé.');
  end if;
  insert into feedback (uid, kind, body) values (p.id, case when p_kind in ('gop_y', 'bao_loi', 'bao_cao') then p_kind else 'gop_y' end, b);
  return jsonb_build_object('ok', true);
end $$;

-- ----- hỏi bài -----
create or replace function _post_guard(p profiles) returns text language plpgsql as $$
begin
  if p.id is null or p.blocked then return 'Chưa có hồ sơ'; end if;
  if p.chat_banned then return 'Bạn đang bị tạm khoá đăng bài.'; end if;
  if p.last_post_at > now() - interval '20 seconds' then return 'Đợi 20 giây giữa hai lần đăng nhé.'; end if;
  return null;
end $$;

create or replace function qa_ask(p_subject text, p_title text, p_body text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare p profiles; e text; t text := btrim(coalesce(p_title, '')); b text := btrim(coalesce(p_body, '')); nid bigint;
begin
  p := _me(); e := _post_guard(p);
  if e is not null then return jsonb_build_object('ok', false, 'error', e); end if;
  if char_length(t) < 5 or char_length(t) > 150 then return jsonb_build_object('ok', false, 'error', 'Tiêu đề cần 5–150 ký tự.'); end if;
  if char_length(b) > 1500 then return jsonb_build_object('ok', false, 'error', 'Nội dung tối đa 1500 ký tự.'); end if;
  if _bad_word(t || ' ' || b, 'all') is not null then return jsonb_build_object('ok', false, 'error', 'Nội dung có từ ngữ không phù hợp.'); end if;
  update profiles set last_post_at = now() where id = p.id;
  insert into qa_questions (uid, subject, title, body) values (p.id, case when p_subject in ('GT1', 'DS') then p_subject else 'Khác' end, t, b)
    returning id into nid;
  return jsonb_build_object('ok', true, 'id', nid);
end $$;

create or replace function qa_reply(p_qid bigint, p_body text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare p profiles; e text; b text := btrim(coalesce(p_body, ''));
begin
  p := _me(); e := _post_guard(p);
  if e is not null then return jsonb_build_object('ok', false, 'error', e); end if;
  if char_length(b) < 2 or char_length(b) > 1500 then return jsonb_build_object('ok', false, 'error', 'Câu trả lời cần 2–1500 ký tự.'); end if;
  if _bad_word(b, 'all') is not null then return jsonb_build_object('ok', false, 'error', 'Nội dung có từ ngữ không phù hợp.'); end if;
  if not exists (select 1 from qa_questions where id = p_qid and not hidden) then return jsonb_build_object('ok', false, 'error', 'Câu hỏi không còn.'); end if;
  update profiles set last_post_at = now() where id = p.id;
  insert into qa_answers (qid, uid, body) values (p_qid, p.id, b);
  update qa_questions set answers_count = (select count(*) from qa_answers where qid = p_qid and not hidden) where id = p_qid;
  return jsonb_build_object('ok', true);
end $$;

-- Báo cáo nội dung: đủ 3 người báo cáo thì tự ẩn, chờ QTV xem
create or replace function qa_report(p_kind text, p_id bigint) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare n int;
begin
  if auth.uid() is null or p_kind not in ('q', 'a', 'm') then return jsonb_build_object('ok', false); end if;
  -- Đợt 3: chỉ người đã có hồ sơ và không bị khoá mới được báo cáo (tài khoản ẩn danh tạo rất dễ:
  -- trước đây 3 phiên ẩn danh chưa đăng ký đủ để tự ẩn bất kỳ tin nhắn/câu hỏi nào).
  if not exists (select 1 from profiles where id = auth.uid() and not blocked) then return jsonb_build_object('ok', false); end if;
  insert into qa_reports (kind, item_id, uid) values (p_kind, p_id, auth.uid()) on conflict do nothing;
  if not found then return jsonb_build_object('ok', true, 'already', true); end if;
  select count(*) into n from qa_reports where kind = p_kind and item_id = p_id;
  if p_kind = 'q' then update qa_questions set reports = n, hidden = hidden or (n >= 3 and not pinned) where id = p_id;
  elsif p_kind = 'a' then update qa_answers set reports = n, hidden = hidden or n >= 3 where id = p_id;
  else update messages set hidden = hidden or n >= 3 where id = p_id; end if;
  return jsonb_build_object('ok', true);
end $$;

-- =====================================================================
-- 8. HÀM QUẢN TRỊ (mọi hàm nhận mật khẩu ở tham số đầu, trả jsonb)
-- =====================================================================
-- Đợt 3: đếm sai mật khẩu THEO NGUỒN (địa chỉ IP do Supabase chuyển tới), để người lạ gõ sai liên tục
-- không khoá được cả ban tổ chức. Vẫn giữ một ngưỡng chung (40 lần sai liên tiếp ⇒ khoá chung 2 phút)
-- phòng khi địa chỉ nguồn bị giả mạo.
create table if not exists admin_fail (
  k text primary key,
  n int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table admin_fail enable row level security;

create or replace function _admin_ok(pw text) returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare s admin_secret; h jsonb; src text; f admin_fail;
begin
  select * into s from admin_secret where id = 1;
  if not found then return false; end if;
  begin h := nullif(current_setting('request.headers', true), '')::jsonb; exception when others then h := null; end;
  src := left(coalesce(nullif(h->>'cf-connecting-ip', ''), nullif(btrim(split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1)), ''), 'khac'), 64);
  select * into f from admin_fail where k = src;
  if f.locked_until > now() then return false; end if;      -- nguồn này đang bị khoá
  if s.locked_until > now() then return false; end if;      -- khoá chung
  if s.pw_hash = crypt(coalesce(pw, ''), s.pw_hash) then
    if s.fail_count > 0 then update admin_secret set fail_count = 0 where id = 1; end if;
    if f.k is not null then delete from admin_fail where k = src; end if;
    return true;
  end if;
  -- sai mật khẩu: một nguồn sai 8 lần liên tiếp ⇒ khoá nguồn đó 5 phút
  insert into admin_fail as a (k, n, locked_until, updated_at) values (src, 1, null, now())
    on conflict (k) do update set
      n = case when a.locked_until is not null or a.updated_at < now() - interval '1 hour' then 1 else a.n + 1 end,
      locked_until = case when a.locked_until is null and a.updated_at >= now() - interval '1 hour' and a.n + 1 >= 8
                          then now() + interval '5 minutes' else null end,
      updated_at = now();
  -- ngưỡng chung
  update admin_secret set fail_count = case when fail_count + 1 >= 40 then 0 else fail_count + 1 end,
    locked_until = case when fail_count + 1 >= 40 then now() + interval '2 minutes' else locked_until end where id = 1;
  delete from admin_fail where updated_at < now() - interval '1 day';
  return false;
end $$;

-- Đặt mật khẩu lần đầu (chỉ chạy được trong SQL Editor — trình duyệt không gọi được)
create or replace function admin_set_initial_password(newpw text) returns text language plpgsql security definer set search_path = public, extensions as $$
begin
  if char_length(newpw) < 8 then raise exception 'Mật khẩu cần ít nhất 8 ký tự'; end if;
  insert into admin_secret (id, pw_hash) values (1, crypt(newpw, gen_salt('bf')))
    on conflict (id) do update set pw_hash = excluded.pw_hash, fail_count = 0, locked_until = null;
  return 'Đã đặt mật khẩu quản trị';
end $$;
revoke all on function admin_set_initial_password(text) from public, anon, authenticated;

create or replace function _deny() returns jsonb language sql immutable as $$
  select jsonb_build_object('ok', false, 'error', 'Sai mật khẩu quản trị (sai nhiều lần sẽ bị khoá 5 phút).')
$$;

create or replace function _alog(a text, d jsonb) returns void language sql security definer set search_path = public, extensions as $$
  insert into admin_log (action, detail) values (a, d)
$$;

create or replace function admin_login(pw text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _admin_ok(pw) then return _deny(); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_change_password(pw text, newpw text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _admin_ok(pw) then return _deny(); end if;
  if char_length(coalesce(newpw, '')) < 8 then return jsonb_build_object('ok', false, 'error', 'Mật khẩu mới cần ít nhất 8 ký tự.'); end if;
  update admin_secret set pw_hash = crypt(newpw, gen_salt('bf')) where id = 1;
  perform _alog('doi_mat_khau', '{}');
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_overview(pw text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _admin_ok(pw) then return _deny(); end if;
  return jsonb_build_object('ok', true,
    'online', (select count(*) from profiles where last_hb > now() - interval '3 minutes'),
    'by_zone', coalesce((select jsonb_object_agg(zone, c) from (select zone, count(*) c from profiles
                         where last_hb > now() - interval '3 minutes' and zone is not null group by zone) z), '{}'::jsonb),
    'by_state', coalesce((select jsonb_object_agg(hb_state, c) from (select hb_state, count(*) c from profiles
                         where last_hb > now() - interval '3 minutes' and hb_state is not null group by hb_state) z), '{}'::jsonb),
    'users_total', (select count(*) from profiles),
    'users_today', (select count(*) from daily_stats where day = _today()),
    'pending_names', (select count(*) from profiles where not name_ok and not approved and not hidden),
    'seconds_today', coalesce((select sum(seconds) from daily_stats where day = _today()), 0),
    'seconds_total', coalesce((select sum(seconds) from daily_stats), 0),
    'answered_today', coalesce((select sum(answered) from daily_stats where day = _today()), 0),
    'correct_today', coalesce((select sum(correct) from daily_stats where day = _today()), 0),
    'messages_today', (select count(*) from messages where created_at > now() - interval '24 hours'),
    'qa_open', (select count(*) from qa_questions where not hidden),
    'feedback_new', (select count(*) from feedback where not handled),
    'reported', (select count(*) from qa_questions where reports > 0) + (select count(*) from qa_answers where reports > 0),
    'by_day', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'hours', round(s / 3600.0, 1), 'users', u, 'answered', a) order by day)
                        from (select day, sum(seconds) s, count(*) u, sum(answered) a from daily_stats group by day order by day desc limit 14) d), '[]'::jsonb),
    'questions', (select count(*) from questions), 'questions_active', (select count(*) from questions where active and dung_cho_cau_chung));
end $$;

create or replace function admin_users(pw text, p_search text default '', p_filter text default 'all') returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _admin_ok(pw) then return _deny(); end if;
  return jsonb_build_object('ok', true, 'rows', coalesce((select jsonb_agg(u) from (
    select p.id, p.full_name, _display_name(p) display_name, p.mssv, p.name_ok, p.approved, p.quiz, p.hidden, p.blocked, p.chat_banned,
      p.zone, p.hb_state, p.last_hb, p.created_at, p.last_hb > now() - interval '3 minutes' online,
      coalesce((select sum(seconds) from daily_stats s where s.uid = p.id), 0) seconds,
      coalesce((select seconds from daily_stats s where s.uid = p.id and s.day = _today()), 0) seconds_today,
      coalesce((select sum(stars) from daily_stats s where s.uid = p.id), 0) stars,
      coalesce((select sum(correct) from daily_stats s where s.uid = p.id), 0) correct,
      coalesce((select sum(answered) from daily_stats s where s.uid = p.id), 0) answered,
      (select count(*) from profiles p2 where p2.mssv = p.mssv) same_mssv
    from profiles p
    where (coalesce(p_search, '') = '' or p.full_name ilike '%' || p_search || '%' or p.mssv like p_search || '%')
      and (p_filter = 'all' or (p_filter = 'online' and p.last_hb > now() - interval '3 minutes')
           or (p_filter = 'pending' and not p.name_ok and not p.approved)
           or (p_filter = 'flagged' and (p.hidden or p.blocked or p.chat_banned)))
    order by p.last_hb desc nulls last limit 500) u), '[]'::jsonb));
end $$;

create or replace function admin_user_action(pw text, p_uid uuid, p_action text, p_value text default null) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare chk jsonb;
begin
  if not _admin_ok(pw) then return _deny(); end if;
  case p_action
    when 'approve' then update profiles set approved = true where id = p_uid;
    when 'unapprove' then update profiles set approved = false where id = p_uid;
    when 'rename' then
      chk := check_identity(p_value, (select mssv from profiles where id = p_uid));
      if not (chk->>'ok')::boolean then return chk; end if;
      update profiles set full_name = chk->>'name', approved = true where id = p_uid;
    when 'hide' then update profiles set hidden = true where id = p_uid;
    when 'unhide' then update profiles set hidden = false where id = p_uid;
    when 'ban_chat' then update profiles set chat_banned = true where id = p_uid;
    when 'unban_chat' then update profiles set chat_banned = false where id = p_uid;
    when 'kick' then update profiles set kicked_at = now() where id = p_uid;
    when 'block' then update profiles set blocked = true, kicked_at = now() where id = p_uid;
    when 'unblock' then update profiles set blocked = false where id = p_uid;
    when 'delete' then delete from profiles where id = p_uid;
    else return jsonb_build_object('ok', false, 'error', 'Thao tác không hợp lệ');
  end case;
  perform _alog('nguoi_dung:' || p_action, jsonb_build_object('uid', p_uid, 'value', p_value));
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_set_settings(pw text, p_patch jsonb) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare cur jsonb; k text;
begin
  if not _admin_ok(pw) then return _deny(); end if;
  select data into cur from app_settings where id = 1;
  -- gộp từng nhánh con (quiz, env, reminders, chat…) để không ghi đè mất khoá khác
  for k in select jsonb_object_keys(p_patch) loop
    if jsonb_typeof(p_patch->k) = 'object' and jsonb_typeof(cur->k) = 'object' then
      cur := jsonb_set(cur, array[k], (cur->k) || (p_patch->k));
    else
      cur := jsonb_set(cur, array[k], p_patch->k, true);
    end if;
  end loop;
  update app_settings set data = cur, updated_at = now() where id = 1;
  perform _alog('thiet_dat', p_patch);
  return jsonb_build_object('ok', true, 'settings', cur);
end $$;

create or replace function admin_notice(pw text, p_text text, p_minutes int) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _admin_ok(pw) then return _deny(); end if;
  if char_length(btrim(coalesce(p_text, ''))) < 2 then return jsonb_build_object('ok', false, 'error', 'Thông báo trống'); end if;
  insert into notices (text, expires_at) values (left(btrim(p_text), 300), now() + make_interval(mins => greatest(1, least(coalesce(p_minutes, 10), 1440))));
  perform _alog('thong_bao', jsonb_build_object('text', p_text));
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_questions(pw text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _admin_ok(pw) then return _deny(); end if;
  return jsonb_build_object('ok', true, 'rows', coalesce((select jsonb_agg(to_jsonb(q) order by q.mon, q.chuong, q.id) from questions q), '[]'::jsonb),
    'rounds', coalesce((select jsonb_agg(x order by x.opens_at desc) from (
       select r.id, r.question_id, r.opens_at, r.closes_at, r.cancelled, q.mon, q.chuong, left(q.de, 90) de,
         (select count(*) from answers a where a.round_id = r.id) total,
         (select count(*) from answers a where a.round_id = r.id and a.is_correct) correct
       from rounds r join questions q on q.id = r.question_id order by r.opens_at desc limit 60) x), '[]'::jsonb));
end $$;

-- Nhập/sửa nhiều câu một lúc. Mỗi phần tử: {id, mon, chuong, doKho, kieu, de, lua[], dap, giai, dungChoCauChung, active}
create or replace function admin_upsert_questions(pw text, p_items jsonb) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare it jsonb; n int := 0; bad jsonb := '[]'::jsonb;
begin
  if not _admin_ok(pw) then return _deny(); end if;
  for it in select * from jsonb_array_elements(p_items) loop
    if coalesce(it->>'id', '') = '' or coalesce(it->>'de', '') = '' or jsonb_typeof(it->'lua') <> 'array'
       or jsonb_array_length(it->'lua') < 2 or (it->>'dap')::int < 0 or (it->>'dap')::int >= jsonb_array_length(it->'lua') then
      bad := bad || to_jsonb(coalesce(it->>'id', '(thiếu id)'));
      continue;
    end if;
    insert into questions (id, mon, chuong, do_kho, kieu, de, lua, dap, giai, dung_cho_cau_chung, active, updated_at)
    values (it->>'id', coalesce(it->>'mon', 'GT1'), coalesce(it->>'chuong', coalesce(it->>'mon', 'GT1') || '.1'),
            coalesce((it->>'doKho')::int, (it->>'do_kho')::int, 1), coalesce(it->>'kieu', 'mc'), it->>'de', it->'lua', (it->>'dap')::int,
            it->>'giai', coalesce((it->>'dungChoCauChung')::boolean, (it->>'dung_cho_cau_chung')::boolean, true),
            coalesce((it->>'active')::boolean, true), now())
    on conflict (id) do update set mon = excluded.mon, chuong = excluded.chuong, do_kho = excluded.do_kho, kieu = excluded.kieu,
      de = excluded.de, lua = excluded.lua, dap = excluded.dap, giai = excluded.giai,
      dung_cho_cau_chung = excluded.dung_cho_cau_chung, active = excluded.active, updated_at = now();
    n := n + 1;
  end loop;
  perform _alog('cau_hoi:nhap', jsonb_build_object('so_cau', n, 'loi', bad));
  return jsonb_build_object('ok', true, 'saved', n, 'rejected', bad);
end $$;

create or replace function admin_question_action(pw text, p_id text, p_action text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _admin_ok(pw) then return _deny(); end if;
  case p_action
    when 'enable' then update questions set active = true where id = p_id;
    when 'disable' then update questions set active = false where id = p_id;
    when 'delete' then
      if exists (select 1 from rounds where question_id = p_id) then update questions set active = false where id = p_id;
      else delete from questions where id = p_id; end if;
    else return jsonb_build_object('ok', false, 'error', 'Thao tác không hợp lệ');
  end case;
  perform _alog('cau_hoi:' || p_action, jsonb_build_object('id', p_id));
  return jsonb_build_object('ok', true);
end $$;

-- Huỷ một vòng bị lỗi: thu hồi sao đã cộng
create or replace function admin_cancel_round(pw text, p_round bigint) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare st int := coalesce((_setting('{quiz,stars}'))::int, 1);
begin
  if not _admin_ok(pw) then return _deny(); end if;
  if exists (select 1 from rounds where id = p_round and not cancelled) then
    update rounds set cancelled = true where id = p_round;
    update daily_stats d set stars = greatest(0, d.stars - case when a.is_correct then st else 0 end),
      correct = greatest(0, d.correct - a.is_correct::int), answered = greatest(0, d.answered - 1)
    from answers a where a.round_id = p_round and d.uid = a.uid
      and d.day = (a.created_at at time zone 'Asia/Ho_Chi_Minh')::date;
  end if;
  perform _alog('huy_vong', jsonb_build_object('round', p_round));
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_content(pw text, p_kind text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _admin_ok(pw) then return _deny(); end if;
  return jsonb_build_object('ok', true, 'rows', coalesce(case p_kind
    when 'messages' then (select jsonb_agg(x order by x.created_at desc) from (select m.id, m.zone, m.text, m.hidden, m.created_at, m.uid,
        p.full_name, p.mssv from messages m join profiles p on p.id = m.uid order by m.created_at desc limit 300) x)
    when 'qa' then (select jsonb_agg(x order by x.created_at desc) from (select q.id, q.subject, q.title, q.body, q.answers_count, q.reports,
        q.pinned, q.hidden, q.created_at, p.full_name, p.mssv,
        (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'body', a.body, 'hidden', a.hidden, 'reports', a.reports,
          'name', p2.full_name, 'created_at', a.created_at) order by a.created_at), '[]'::jsonb)
          from qa_answers a join profiles p2 on p2.id = a.uid where a.qid = q.id) answers
        from qa_questions q join profiles p on p.id = q.uid order by q.created_at desc limit 200) x)
    when 'feedback' then (select jsonb_agg(x order by x.created_at desc) from (select f.id, f.kind, f.body, f.handled, f.created_at,
        p.full_name, p.mssv from feedback f left join profiles p on p.id = f.uid order by f.created_at desc limit 300) x)
    when 'notices' then (select jsonb_agg(x order by x.created_at desc) from (select * from notices order by created_at desc limit 50) x)
    when 'log' then (select jsonb_agg(x order by x.created_at desc) from (select * from admin_log order by created_at desc limit 200) x)
    when 'words' then (select jsonb_agg(to_jsonb(w) order by w.word) from banned_words w)
  end, '[]'::jsonb));
end $$;

create or replace function admin_moderate(pw text, p_kind text, p_id bigint, p_action text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _admin_ok(pw) then return _deny(); end if;
  if p_kind = 'message' then update messages set hidden = (p_action = 'hide') where id = p_id;
  elsif p_kind = 'qa' then
    if p_action in ('pin', 'unpin') then update qa_questions set pinned = (p_action = 'pin') where id = p_id;
    elsif p_action = 'delete' then delete from qa_questions where id = p_id;
    else update qa_questions set hidden = (p_action = 'hide'), reports = case when p_action = 'show' then 0 else reports end where id = p_id; end if;
  elsif p_kind = 'qa_answer' then
    update qa_answers set hidden = (p_action = 'hide'), reports = case when p_action = 'show' then 0 else reports end where id = p_id;
    update qa_questions q set answers_count = (select count(*) from qa_answers a where a.qid = q.id and not a.hidden)
      where q.id = (select qid from qa_answers where id = p_id);
  elsif p_kind = 'feedback' then update feedback set handled = (p_action = 'done') where id = p_id;
  elsif p_kind = 'notice' then update notices set expires_at = now() where id = p_id;
  else return jsonb_build_object('ok', false, 'error', 'Loại không hợp lệ'); end if;
  perform _alog('kiem_duyet:' || p_kind || ':' || p_action, jsonb_build_object('id', p_id));
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_words(pw text, p_op text, p_word text, p_accent boolean default false, p_mode text default 'token', p_scope text default 'all')
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _admin_ok(pw) then return _deny(); end if;
  if p_op = 'add' and char_length(btrim(coalesce(p_word, ''))) >= 2 then
    insert into banned_words (word, accent, mode, scope) values (lower(btrim(p_word)), coalesce(p_accent, false),
      case when p_mode = 'substr' then 'substr' else 'token' end, case when p_scope = 'name' then 'name' else 'all' end)
    on conflict (word) do update set accent = excluded.accent, mode = excluded.mode, scope = excluded.scope;
  elsif p_op = 'remove' then delete from banned_words where word = p_word;
  else return jsonb_build_object('ok', false, 'error', 'Thao tác không hợp lệ'); end if;
  perform _alog('tu_cam:' || p_op, jsonb_build_object('word', p_word));
  return jsonb_build_object('ok', true);
end $$;

-- Xoá dữ liệu: p_scope = 'stats' (giờ học, sao, câu trả lời) | 'content' (tin nhắn, hỏi bài, góp ý) | 'all' (cả người dùng)
create or replace function admin_reset(pw text, p_scope text, p_confirm text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _admin_ok(pw) then return _deny(); end if;
  -- Supabase bật pg-safeupdate cho lệnh gọi qua API: DELETE/UPDATE không có WHERE bị chặn
  -- ("DELETE requires a WHERE clause") ⇒ xoá cả bảng phải ghi rõ "where true".
  if p_confirm <> 'XOA DU LIEU' then return jsonb_build_object('ok', false, 'error', 'Gõ đúng "XOA DU LIEU" để xác nhận.'); end if;
  if p_scope in ('stats', 'all') then delete from answers where true; delete from rounds where true; delete from daily_stats where true; delete from events where true; update questions set use_count = 0 where true; end if;
  if p_scope in ('content', 'all') then delete from messages where true; delete from qa_reports where true; delete from qa_answers where true; delete from qa_questions where true;
    delete from cheers where true; delete from feedback where true; delete from notices where true; end if;
  if p_scope = 'all' then delete from profiles where true; end if;
  perform _alog('xoa_du_lieu', jsonb_build_object('scope', p_scope));
  return jsonb_build_object('ok', true);
end $$;

-- =====================================================================
-- 9. QUYỀN GỌI HÀM
-- =====================================================================
-- Đợt 3: ghi rõ quyền trên bảng thay vì dựa vào quyền mặc định của dự án
-- (dự án Supabase mới có thể tắt "tự cấp quyền cho bảng mới"; khi đó trình duyệt và Realtime không đọc được gì).
-- Trình duyệt chỉ ĐỌC các bảng công khai (RLS lọc tiếp từng dòng); mọi thao tác ghi đi qua hàm security definer.
grant usage on schema public to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke select on all tables in schema public from anon, authenticated;
grant select on app_settings, banned_words to anon, authenticated;
grant select on public_profiles, messages, qa_questions, qa_answers, cheers, notices, events to authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function server_now(), get_config(), check_identity(text, text) to anon, authenticated;
grant execute on function register_profile(text, text, boolean, jsonb, boolean, boolean), update_prefs(jsonb, boolean, boolean, boolean),
  my_profile(), start_session(text), heartbeat(text, text), get_round(), submit_answer(bigint, int), get_round_result(bigint),
  leaderboard(text, text), global_stats(), profile_card(uuid), send_message(text, text, uuid, jsonb), send_cheer(uuid, int), send_dm(uuid, int), buy_item(text), pick_trash(), claim_mango(),
  send_feedback(text, text), qa_ask(text, text, text), qa_reply(bigint, text), qa_report(text, bigint) to authenticated;
grant execute on function admin_login(text), admin_change_password(text, text), admin_overview(text), admin_users(text, text, text),
  admin_user_action(text, uuid, text, text), admin_set_settings(text, jsonb), admin_notice(text, text, int), admin_questions(text),
  admin_upsert_questions(text, jsonb), admin_question_action(text, text, text), admin_cancel_round(text, bigint),
  admin_content(text, text), admin_moderate(text, text, bigint, text), admin_words(text, text, text, boolean, text, text),
  admin_reset(text, text, text) to anon, authenticated;
-- các hàm nội bộ (_xxx) chỉ dùng bên trong; hàm security definer vẫn gọi được chúng.

-- =====================================================================
-- 10. MẬT KHẨU QUẢN TRỊ — KHÔNG có mật khẩu mặc định.
--     Trước đây file này tạo sẵn mật khẩu 'doi-mat-khau-ngay' (ai đọc repo cũng biết) ⇒ người lạ vào được
--     trang quản trị, xem MSSV đầy đủ và xoá dữ liệu nếu ban tổ chức quên đổi. Nay trang quản trị bị khoá
--     cho tới khi chạy trong SQL Editor (thay bằng mật khẩu riêng, ≥ 8 ký tự):
--     select admin_set_initial_password('mat-khau-rieng-cua-ban');
--     Dự án đã chạy bản cũ: mật khẩu hiện có được giữ nguyên; nếu vẫn là mật khẩu mặc định cũ thì bị vô hiệu hoá.
-- =====================================================================
delete from admin_secret where id = 1 and pw_hash = crypt('doi-mat-khau-ngay', pw_hash);

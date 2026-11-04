-- =====================================================================
--  KIỂM TRA NHANH schema.sql TRÊN POSTGRES CÓ GIẢ LẬP SUPABASE (tools/supabase-gia-lap.sql)
--  Chạy: psql -v ON_ERROR_STOP=1 -d <csdl> -f tools/kiem_tra_sql.sql
--  Mỗi khẳng định sai sẽ dừng bằng lỗi "KHÔNG ĐẠT: ...". Cuối cùng in "TẤT CẢ ĐẠT".
--  Chỉ dùng trên CSDL thử — file này tạo người dùng giả và xoá dữ liệu.
-- =====================================================================
\set QUIET on
\o /dev/null
create or replace function pg_temp.dat(ok boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(ok, false) then raise exception 'KHÔNG ĐẠT: %', msg; end if; raise notice 'đạt: %', msg; end $$;

-- hai người dùng giả (xoá bản cũ nếu lần chạy trước dừng giữa chừng)
delete from profiles where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
delete from admin_fail;
update admin_secret set fail_count = 0, locked_until = null;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set role authenticated;
select pg_temp.dat((register_profile('Nguyễn Văn An', '20231234', true, '{}'::jsonb)->>'ok')::boolean, 'đăng ký người A');
reset role;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
set role authenticated;
select pg_temp.dat((register_profile('Trần Thị Bình', '20235678', true, '{}'::jsonb)->>'ok')::boolean, 'đăng ký người B');
select pg_temp.dat((send_message('lib_a', 'Chào mọi người 👋')->>'ok')::boolean, 'B gửi tin');

-- quyền bảng: đọc được bảng công khai, không ghi thẳng được
select pg_temp.dat((select count(*) from messages) = 1, 'authenticated đọc được messages');
select pg_temp.dat((select count(*) from public_profiles) = 2, 'authenticated đọc được public_profiles');
do $$ begin
  begin insert into messages (uid, zone, text) values (auth.uid(), 'lib_a', 'ghi thẳng'); raise exception 'KHÔNG ĐẠT: ghi thẳng vào messages lẽ ra bị chặn';
  exception when insufficient_privilege then raise notice 'đạt: chặn ghi thẳng vào messages'; end;
  begin perform 1 from profiles; raise exception 'KHÔNG ĐẠT: đọc thẳng profiles lẽ ra bị chặn';
  exception when insufficient_privilege then raise notice 'đạt: chặn đọc thẳng profiles (MSSV đầy đủ)'; end;
  begin perform 1 from admin_fail; raise exception 'KHÔNG ĐẠT: đọc admin_fail lẽ ra bị chặn';
  exception when insufficient_privilege then raise notice 'đạt: chặn đọc admin_fail'; end;
end $$;
reset role;
set role anon;
do $$ begin
  begin perform 1 from public_profiles; raise exception 'KHÔNG ĐẠT: anon đọc public_profiles lẽ ra bị chặn';
  exception when insufficient_privilege then raise notice 'đạt: anon (chưa đăng nhập) không đọc được danh sách người dùng'; end;
end $$;
select pg_temp.dat((select count(*) from app_settings) = 1, 'anon đọc được app_settings');
reset role;

-- không có mật khẩu quản trị mặc định
select pg_temp.dat(not exists (select 1 from admin_secret where pw_hash = extensions.crypt('doi-mat-khau-ngay', pw_hash)), 'không còn mật khẩu quản trị mặc định công khai');

-- nhắn riêng: chỉ người gửi và người nhận đọc được; người thứ ba (C) không thấy, kể cả qua bộ lọc
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
set role authenticated;
select pg_temp.dat((send_dm('11111111-1111-1111-1111-111111111111', 0)->>'ok')::boolean, 'B nhắn riêng cho A');
select pg_temp.dat((select count(*) from cheers where kind = 'dm') = 1, 'B (người gửi) đọc lại được tin riêng');
reset role;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set role authenticated;
select pg_temp.dat((select count(*) from cheers where kind = 'dm') = 1, 'A (người nhận) đọc được tin riêng');
reset role;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set role authenticated;
select pg_temp.dat((select count(*) from cheers) = 0, 'C (người thứ ba) không đọc được tin riêng của A và B');
select pg_temp.dat((select count(*) from cheers where to_uid = '11111111-1111-1111-1111-111111111111') = 0, 'C lọc theo to_uid của A vẫn không thấy gì');
-- phiên ẩn danh chưa có hồ sơ không được báo cáo (3 phiên ẩn danh không ẩn được tin của người khác)
select pg_temp.dat(not coalesce((qa_report('m', (select max(id) from messages))->>'ok')::boolean, false), 'phiên chưa đăng ký không báo cáo được');
do $$ begin
  begin perform admin_set_initial_password('chiem-quyen-123'); raise exception 'KHÔNG ĐẠT: authenticated gọi được admin_set_initial_password';
  exception when insufficient_privilege then raise notice 'đạt: trình duyệt không gọi được admin_set_initial_password'; end;
  begin perform _admin_ok('x'); raise exception 'KHÔNG ĐẠT: authenticated gọi được hàm nội bộ _admin_ok';
  exception when insufficient_privilege then raise notice 'đạt: trình duyệt không gọi được hàm nội bộ _admin_ok'; end;
  begin perform 1 from admin_secret; raise exception 'KHÔNG ĐẠT: đọc được admin_secret';
  exception when insufficient_privilege then raise notice 'đạt: chặn đọc admin_secret (băm mật khẩu)'; end;
  begin update public_profiles set display_name = 'Giả mạo'; raise exception 'KHÔNG ĐẠT: sửa thẳng public_profiles';
  exception when insufficient_privilege then raise notice 'đạt: chặn sửa thẳng public_profiles'; end;
end $$;
reset role;
set role anon;
do $$ begin
  begin perform register_profile('Nguyễn Văn Ẩn', '20231111', true, '{}'::jsonb); raise exception 'KHÔNG ĐẠT: anon gọi được register_profile';
  exception when insufficient_privilege then raise notice 'đạt: chưa đăng nhập thì không gọi được hàm người học'; end;
end $$;
select pg_temp.dat(not (admin_login('doi-mat-khau-ngay')->>'ok')::boolean, 'mật khẩu mặc định cũ không đăng nhập được');
reset role;

-- ẩn tin ⇒ có sự kiện hide_msg cho Realtime
select admin_set_initial_password('mat-khau-thu-123');
select max(id) as msg_id from messages \gset
set role anon;
select pg_temp.dat((admin_moderate('mat-khau-thu-123', 'message', :msg_id, 'hide')->>'ok')::boolean, 'QTV ẩn tin');
reset role;
select pg_temp.dat(exists (select 1 from events where kind = 'hide_msg' and text = :'msg_id'), 'ẩn tin tạo sự kiện hide_msg');

-- khoá theo nguồn: nguồn X sai 8 lần bị khoá, nguồn Y vẫn đăng nhập được
set request.headers = '{"x-forwarded-for": "10.0.0.1"}';
set role anon;
do $$ begin for i in 1..8 loop perform admin_login('sai-mat-khau'); end loop; end $$;
select pg_temp.dat(not (admin_login('mat-khau-thu-123')->>'ok')::boolean, 'nguồn 10.0.0.1 bị khoá sau 8 lần sai (kể cả khi gõ đúng)');
reset role;
set request.headers = '{"x-forwarded-for": "10.0.0.2, 1.2.3.4"}';
set role anon;
select pg_temp.dat((admin_login('mat-khau-thu-123')->>'ok')::boolean, 'nguồn khác vẫn đăng nhập được');
reset role;
update admin_fail set locked_until = now() - interval '1 second' where k = '10.0.0.1';
set request.headers = '{"x-forwarded-for": "10.0.0.1"}';
set role anon;
select pg_temp.dat((admin_login('mat-khau-thu-123')->>'ok')::boolean, 'hết thời gian khoá thì đăng nhập lại được');
reset role;
select pg_temp.dat(not exists (select 1 from admin_fail where k = '10.0.0.1'), 'đăng nhập đúng xoá bộ đếm của nguồn');

-- dọn
delete from profiles where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
delete from events where kind = 'hide_msg';
delete from admin_secret where id = 1;   -- trả về trạng thái chưa đặt mật khẩu
\o
\echo 'TẤT CẢ ĐẠT'

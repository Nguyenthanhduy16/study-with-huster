/* =====================================================================
   CẤU HÌNH HỌC ONLINE CÙNG HUSTER — sửa ở đây là đủ
   ===================================================================== */

/* 1) KẾT NỐI SUPABASE
   Để trống = chạy CHẾ ĐỘ NGOẠI TUYẾN (chỉ mình bạn, dữ liệu lưu trên trình duyệt).
   Lấy 2 giá trị này ở Supabase → Project Settings → API (xem docs/HUONG_DAN_CAI_DAT.md).

   ⚠️ FILE NÀY AI CŨNG ĐỌC ĐƯỢC (nó được tải xuống trình duyệt của mọi người).
     ✅ ĐƯỢC dán ở đây: Project URL và khoá "anon" (chuỗi dài bắt đầu bằng eyJ…, ở tab "Legacy API Keys") —
        khoá công khai, mọi quyền đã được khoá bằng RLS và các hàm trong supabase/schema.sql.
        (Khoá kiểu mới "sb_publishable_…" cũng là khoá công khai nhưng CHƯA thử với supabase-js 2.45.4 đóng gói sẵn.)
     ❌ KHÔNG BAO GIỜ dán ở đây: khoá "service_role" / "secret" (sb_secret_…), mật khẩu cơ sở dữ liệu,
        mật khẩu quản trị. Mật khẩu quản trị chỉ nằm (dạng băm) trong cơ sở dữ liệu và được kiểm tra trên máy chủ.
   Ví dụ:  window.SUPABASE_URL = 'https://abcdxyz.supabase.co';
           window.SUPABASE_ANON_KEY = 'eyJhbGciOi...'; */
window.SUPABASE_URL = 'https://gxiryzkmntbgbfrigwdc.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_sGGAPT1XzACXxsVbtfyW2Q_CYpC5KSP';   // khoá publishable (công khai)

/* 1b) SERVER REALTIME TRÊN RAILWAY (tuỳ chọn — xem docs/HUONG_DAN_RAILWAY.md)
   Điền địa chỉ wss:// của server/server.js ⇒ vị trí, cử chỉ, ai đang online, đàn piano đi qua server này
   (giảm tải Realtime của Supabase). Để trống ⇒ dùng Supabase Realtime như trước.
   Ví dụ: window.REALTIME_URL = 'wss://study-with-huster-realtime.up.railway.app'; */
window.REALTIME_URL = '';

/* 2) THÔNG TIN CHUNG */
window.APP = {
  name: 'Học Online Cùng Huster',
  club: 'Bản demo',
  disclaimer: 'Bản demo thử nghiệm — không phải trang chính thức của Đại học Bách khoa Hà Nội.',
  // Toạ độ Đại học Bách khoa Hà Nội (lấy thời tiết thật từ Open-Meteo, miễn phí, không cần khoá)
  weather: { lat: 21.0049, lon: 105.8433, place: 'Bách Khoa, Hà Nội' },
  heartbeatSec: 60,          // nhịp gửi giờ học lên máy chủ
  idleCheckMin: 30,          // không thao tác bao lâu thì hỏi "Bạn vẫn đang học chứ?"
  hiddenPauseMin: 5,         // ẩn tab quá bao lâu thì ngừng tính giờ
  pomodoro: { focus: 25, rest: 5 },
  maxAvatars: { desktop: 40, mobile: 16 },   // số nhân vật vẽ cùng lúc (gần nhất trước) — giảm nếu máy yếu
  // Tiết kiệm lượt tin realtime (gói Supabase miễn phí: ~100 tin/giây cho cả dự án)
  posIntervalMs: 1200,       // khi đang đi, tối đa ~1 lần gửi vị trí mỗi 1,2 giây (người xem tự ngoại suy)
  presenceGapMs: 8000        // cập nhật trạng thái hiện diện tối đa 1 lần / 8 giây
};

/* 3) KHU VỰC (zone). Mỗi khu là một "phòng" để đếm người, nhắn tin, xếp ghế.
   space = phần cảnh 3D dùng để hiển thị (xem scene/adapter.js):
     campus = sân trước thư viện (file GLB) · A = thư viện tầng 1–4 (có phòng 401) · B = tầng 6–7 · D = sân thượng tầng 10
   Đợt này chỉ mở thư viện và sân trước; "Dạo sân trường" (cả khuôn viên) sẽ mở sau. */
window.ZONES = {
  campus: { name: 'Sân trước thư viện', short: 'Sân thư viện', space: 'campus' },
  lib_a:  { name: 'Thư viện · Tầng 1–4', short: 'Tầng 1–4', space: 'A', building: 'library', walk: true },
  lib_b:  { name: 'Thư viện · Tầng 6–7', short: 'Tầng 6–7', space: 'B', building: 'library', walk: true },
  lib_c:  { name: 'Thư viện · Sân thượng tầng 10', short: 'Tầng 10', space: 'D', building: 'library', walk: true }
};
window.BUILDING_ROOMS = {
  library: { name: 'Thư viện Tạ Quang Bửu', zones: ['lib_a', 'lib_b', 'lib_c'] }
};

/* 4) MÔN & CHƯƠNG (hiển thị trên câu hỏi) */
window.SUBJECTS = {
  GT1: { name: 'Giải tích 1', code: 'MI1111 / MI1114' },
  DS: { name: 'Đại số', code: 'MI1141 / MI1144' }
};
window.CHAPTERS = {
  'GT1.1': 'C1 · Dãy số, giới hạn, liên tục', 'GT1.2': 'C1 · Đạo hàm và vi phân',
  'GT1.3': "C1 · Taylor, L'Hôpital, khảo sát hàm", 'GT1.4': 'C2 · Tích phân bất định',
  'GT1.5': 'C2 · Tích phân xác định, suy rộng', 'GT1.6': 'C3 · Hàm nhiều biến',
  'GT1.7': 'C3 · Cực trị, cực trị có điều kiện',
  'DS.1': 'C1 · Tập hợp, logic, ánh xạ', 'DS.2': 'C1 · Số phức', 'DS.3': 'C2 · Ma trận, định thức, hệ PT',
  'DS.4': 'C3 · Không gian vectơ', 'DS.5': 'C4 · Ánh xạ tuyến tính', 'DS.6': 'C5 · Trị riêng, chéo hoá',
  'DS.7': 'C6 · Dạng toàn phương'
};

/* 5) CẤU HÌNH MẶC ĐỊNH CHO CHẾ ĐỘ NGOẠI TUYẾN
   (khi có Supabase, cấu hình thật lấy từ bảng app_settings — sửa trong trang Quản trị) */
window.DEFAULT_SETTINGS = {
  room_open: true,
  season_name: 'Tuần ôn thi 03/11 – 10/11/2026',
  season_start: '2026-11-03',
  streak_min: 25,
  quiz: { enabled: true, period_min: 5, answer_sec: 45, subjects: ['GT1', 'DS'], stars: 1 },
  env: { time: 'auto', weather: 'auto' },
  reminders: { eye_min: 20, eye_sec: 20, move_min: 50, move_sec: 60, water_min: 60, allow_skip: true },
  chat: { free_text: true, cooldown_sec: 10, max_len: 80 },
  templates: [
    'Chào mọi người 👋', 'Cố lên mọi người ơi! 💪', 'Ai ôn Giải tích không? 📘', 'Ai ôn Đại số không? 📗',
    'Học thêm 25 phút nữa nào ⏱️', 'Nghỉ 5 phút rồi học tiếp nha ☕', 'Ôn xong một chương rồi 🎉',
    'Bài này khó quá, ai giúp với 🤔', 'Cảm ơn bạn nhiều! 🙏', 'Mình đi ăn chút rồi quay lại 🍜',
    'Chúc cả phòng thi tốt! 🍀', 'Qua môn hết nhé! ✨'
  ],
  dm_templates: [
    'Chào bạn 👋', 'Bạn ôn tới chương nào rồi?', 'Bài này bạn làm sao vậy? 🤔', 'Mình qua chỗ bạn nhé 🚶',
    'Học cùng nhau không? 📚', 'Mình nghỉ chút, lát quay lại nhé ☕', 'Cảm ơn bạn nhiều! 🙏', 'Ok bạn 👍',
    'Hẹn gặp ở tầng 10 ngắm sao nhé ✨', 'Chúc bạn thi tốt! 🍀'
  ],
  near_radius: 8,            // "Gần tôi": tin nhắn chỉ hiện với người đứng trong bán kính này (mét)
  cheers: [
    'Cố lên, bạn làm được mà! 💪', 'Chúc bạn thi thật tốt! 🍀', 'Bạn học chăm quá, nể ghê 👏',
    'Nghỉ ngơi chút rồi học tiếp nhé ☕', 'Cùng nhau qua môn nha! ✨', 'Cảm ơn bạn đã giúp mình! 🙏'
  ]
};

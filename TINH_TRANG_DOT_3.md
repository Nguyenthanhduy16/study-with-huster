# Tình trạng Đợt 3 — bản chụp giữa chừng (04/11/2026)

Bản zip này là **ảnh chụp mã nguồn tại thời điểm đóng gói**. Một số việc đã xong và đã kiểm tra; một số việc đang được làm dở (code đã có một phần nhưng **chưa kiểm tra xong**). Tất cả file JavaScript đều đã kiểm tra cú pháp (`node --check`) — không có lỗi cú pháp, nhưng phần đang làm dở có thể chưa chạy đúng hết.

Xem toàn bộ thay đổi so với bản gốc: mở thư mục bằng git (`git diff`) nếu có thư mục `.git`, hoặc so với zip gốc.

## ✅ Đã xong

### 1. Thay Phòng thay đồ bằng bản mới (avatar-studio)
- Mã mới chép vào `avatar/src/` (giữ các bản vá chạy với Three.js r128, đoạn nhúng `EMBED`), đã đóng gói lại `avatar/avatar-kit.js` và `avatar/phong-thay-do.js`.
- Tủ đồ: 74 → 88 món (bộ sưu tập HUST/Phương Thảo, bomber, đồng phục GDTC, dây đeo đỏ cố định màu, thẻ SV ngang/dọc).
- Ảnh logo: `avatar/assets/textures/hust-logo.png`, `hust-logo-round.png` — hiện đúng trên áo, dây đeo, thẻ, cả trong phòng thay đồ và nhân vật trong cảnh.
- `phong-thay-do.html`: giao diện theo `css/studio.css` mới (đỏ HUST, chế độ tối).
- Lưu cũ không bị hỏng: món đồ không còn trong tủ thì tự về mặc định; huy hiệu "Tổ Ong" cũ tự đổi sang HUST.
- Đã thử trên Chromium (đồ hoạ giả lập): phòng thay đồ không lỗi; đăng nhập → thay đồ → "Mặc vào phòng" → vào thư viện, nhân vật đúng trang phục.
- Hướng dẫn cập nhật: `docs/HOP_DONG_CANH.md` mục "Phòng thay đồ".

## 🔧 Đang làm (code đã có một phần, chưa kiểm tra xong)

### 2. Kéo chuột xoay camera trong lúc di chuyển (WASD) — `js/world.js`, `scene/adapter.js`, `scene/hust3d.js`, `scene/tang10.js`
Mục tiêu: giữ W/A/S/D và kéo chuột (trái hoặc phải) vẫn xoay được góc nhìn mượt, hướng đi theo camera, cả ngoài sân, trong thư viện và sân thượng; trên điện thoại cần điều khiển + vuốt màn hình dùng cùng lúc.

### 3. Ngồi đúng chỗ ở mọi ghế trống — cùng các file trên + `js/avatar2.js`
Mục tiêu: nhân vật ngồi đúng mặt ghế, đúng hướng, ở mọi loại ghế và mọi khu; bấm vào ghế để đi tới ngồi; phím **E** để ngồi khi đứng gần ghế trống (kèm gợi ý "Nhấn E để ngồi").

### 4. Bỏ nút dịch chuyển ở thanh dưới + Radial Menu — `js/app.js`, `index.html`, `css/app.css`, `js/avatar2.js`
- Bỏ các nút "Ngồi ghế gần nhất", "Các tầng", "Ra sân": muốn đi đâu phải tự di chuyển (thang máy, cầu thang, cửa chính).
- Radial Menu (giữ phím hoặc nút tròn trên màn hình): 👋 Vẫy tay, 📖 Đọc sách, 📱 Bấm điện thoại, 💻 Dùng laptop (+ các cử chỉ cũ, "Dừng"); người khác cũng thấy.

### 5. Bong bóng chat hiện trên đầu nhân vật — `js/world.js` (bubble/labels), `css/app.css`
Tin ở kênh Cả khu và Gần tôi hiện trên đầu đúng người gửi, đi theo nhân vật, tự xuống dòng, tự ẩn.

### 6. Nhiều người truy cập và tương tác — `js/net.js`, `config.js`, `supabase/schema.sql`, tệp triển khai
- Rà soát lớp mạng Supabase (hiện diện, vị trí, chat, cử chỉ, kết nối lại, giới hạn gói Free).
- Đã thêm: `netlify.toml`, `vercel.json`, `.nojekyll` (GitHub Pages), máy chủ Supabase giả lập để thử nhiều người: `tools/fake-supabase.js`, `tools/fake-supabase-server.mjs`, `tools/kiem_tra_nhieu_nguoi.mjs`, `tools/supabase-gia-lap.sql`, `tools/kiem_tra_sql.sql`.
- Còn lại: hoàn tất bài thử 2–3 trình duyệt, cập nhật `docs/HUONG_DAN_CAI_DAT.md` (các bước tạo Supabase, triển khai, sức chứa).

### 7. Tiếng đàn piano nghe chung ở tầng 6–7 — `js/piano-net.js` (mới), `scene/hust3d.js`, `js/net.js`, `js/audio.js`, `js/app.js`
- Ai chơi đàn thì người khác ở tầng 6–7 cùng nghe (nốt gom ~50 ms/lần, tối đa ~25 tin/giây), phím đàn nhấn theo.
- Âm lượng nhỏ dần khi ra xa đàn, nhỏ hơn khi ở tầng 7.
- Tắt riêng được bằng mục "🎹 Tiếng đàn của bạn khác" trong hộp Âm thanh.

## ⚠️ Cần bạn lưu ý
- **Quyền dùng logo HUST và tên mẫu áo Phương Thảo:** bản Phòng thay đồ mới dùng ảnh logo thật; cần xác nhận được phép trước khi mở công khai. Dòng 136 của `README.md` (ghi "trường giả Tổ Ong, không dùng logo HUST") nay không còn đúng — sẽ sửa khi hoàn tất.
- **Chưa chạy trên Supabase thật** và chưa đo tốc độ khung hình trên máy thật (môi trường làm việc chỉ có đồ hoạ giả lập). Trang phục mới nặng hơn trang phục cũ.
- Bản chụp này có thể chứa thay đổi đang làm dở; nên dùng để xem/thử, chưa nên đưa lên web công khai.

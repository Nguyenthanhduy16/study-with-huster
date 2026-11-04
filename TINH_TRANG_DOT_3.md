# Tình trạng Đợt 3 — tiếp tục từ commit 534167e (04/11/2026)

Đây là tình trạng mã nguồn sau phiên tiếp tục. Các sửa đổi đã ghép vào cùng checkout; kiểm thử tự động không thay thế kiểm tra hình ảnh WebGL và Supabase thật.

## Đã thực hiện

| Yêu cầu | Mã nguồn và kết quả |
|---|---|
| Phòng thay đồ mới | Bản mới đã có trong repo: avatar/src/, các bundle, ảnh logo, 88 món và phong-thay-do.html. Đã kiểm tra liên kết tài nguyên, giữ tích hợp và dữ liệu trang phục cũ. Không có hai tệp đính kèm mới để so sánh ngoài nguồn repo. |
| Di chuyển và camera | World sở hữu đầu vào khi nhúng cảnh. WASD + kéo chuột trái/phải; cần điều khiển + ngón vuốt riêng; hai ngón thu phóng. Reset khi gõ chat/mất focus/mở radial; tốc độ theo độ nghiêng cần điều khiển. |
| Ngồi ghế | Căn vị trí hông/cao độ/hướng theo loại ghế. Đi tới điểm tiếp cận hợp lệ mới ngồi và kiểm tra ghế lại lúc đến. Không teleport khi sai tầng/không có đường. Xử lý phòng đầy, đứng dậy an toàn, giữ ghế NPC trước khi dựng NPC và tranh ghế đàn. |
| Không dùng nút dịch chuyển | Thanh dưới chỉ giữ thao tác theo ngữ cảnh. Tới khu khác qua cửa/cầu thang/thang máy. Tìm bạn khác tầng/khu chỉ hướng dẫn; lỗi tìm đường không dùng dịch chuyển dự phòng. |
| Radial menu | Giữ Q/giữ nút ✋; chạm nhanh mở cố định; 1–8 chọn, 0 dừng, Esc đóng, Tab/mũi tên/Enter. Vẫy tay, đọc sách, điện thoại, laptop và cử chỉ cũ. Tạm dừng di chuyển khi chọn và đóng an toàn khi hủy chạm/mất focus. |
| Chat trên đầu | Bong bóng theo nhãn nhân vật, tự xuống dòng/ẩn, tối đa hai bong bóng. Nội dung là văn bản, chống hiện trùng; QTV ẩn tin thì bong bóng cùng ID cũng biến mất. Tin gần chỉ hiển thị ở gần và cùng tầng. |
| Mạng/piano | Meta ghế/hoạt động gửi nhanh bằng broadcast; Presence tối thiểu 8 giây. Bỏ qua callback kênh cũ. Piano kiểm tra gói, chống trùng, dọn hàng đợi khi đổi khu và nhả nốt treo. |
| Khởi động/triển khai | Lỗi JavaScript/WebGL/tải cảnh có thông báo và tải lại. Cập nhật hướng dẫn hosting/Supabase và checklist hai thiết bị. config.js vẫn để trống URL/key. |
| Tái tạo lớp cảnh | Hai script patch cảnh giữ các sửa đầu vào; tái tạo sân thượng vào thư mục tạm khớp chính xác bản hiện tại. Nguồn hust-3d gốc không có trong repo nên module chính chỉ xác minh các hook đầu vào, chưa tái tạo toàn bộ. |

## Kiểm tra đã chạy

Lệnh chung: `npm run check && npm test`.

- Kiểm tra cú pháp JavaScript, đường dẫn tài nguyên HTML/CSS và header GLB.
- `tools/kiem_tra_dieu_khien.mjs`: handler thật trong VM; WASD + kéo chuột, nhiều con trỏ, pinch, cần điều khiển, chat/focus, phím tắt và freeze.
- `tools/kiem_tra_ghe.mjs`: 14 nhóm hồi quy ghế/đường đi/ghế đầy/NPC/tranh ghế/đứng dậy/đàn/không teleport, thêm điểm rẽ giữa đường và xử lý bị kẹt. Dùng logic thật với bố cục kiểm thử.
- `tools/kiem_tra_ghe_render.mjs` (`npm run test:render`, cần playwright + Chromium): kiểm tra trong cảnh render thật (SwiftShader). Mỗi loại ghế ở mỗi tầng của A/B/sân thượng/sân (`--all` là mọi ghế): đi tới bằng goSit, nhấn E, bấm chuột; đo gốc nhân vật, khớp hông trên mặt ghế bằng tia, vật đè/xuyên bàn, hướng bàn, đứng dậy ra ô đi được, ghế tầng khác không dịch chuyển. Ảnh chụp lưu vào `--out`.
- `tools/kiem_tra_tuong_tac.mjs`: 12 kiểm tra radial, phím/chạm/hủy, hoạt động đến muộn, bong bóng và xử lý lỗi WebGL.
- `tools/test-network.mjs`: khoảng cách Presence, meta ghế/hoạt động, callback kênh cũ, piano/gói lỗi/nốt treo.
- `tools/offline-features.test.mjs`: hồ sơ, giờ học/nghỉ, câu hỏi/đáp án/điểm sao, ví, chat/chống spam, hỏi đáp/góp ý và giới hạn phần thưởng mini-game.
- `tools/multiplayer-integration.test.mjs`: ba máy khách mạng độc lập chạy js/net.js và Supabase giả lập qua HTTP/SSE: đăng nhập, online, vị trí, ghế, hoạt động, cử chỉ, chat/chống spam, kiểm duyệt, nhắn riêng đúng người, phân khu, piano, ngắt/nối lại và rời phòng. Không có broadcast rơi xuống REST vì chưa vào kênh.
- Chrome trong phiên này: preview chạy được nhưng không tạo được WebGL context. Đã xác nhận giao diện thông báo lỗi WebGL, hướng dẫn và nút tải lại.
- Hai script Python kiểm tra cú pháp; sân thượng tái tạo khớp và hook sai dừng trước khi ghi đè.

`tools/kiem_tra_nhieu_nguoi.mjs` là bài thử Chromium cũ của repo, không chạy lại trong phiên này. Bài ba máy khách hiện tại kiểm tra lớp mạng, không chạy ba trình duyệt và không kiểm tra renderer.

## Còn cần trước khi mở cho người dùng thật

1. Điền URL và khoá public Supabase; bật anonymous sign-in, chạy schema/seed và cấu hình Realtime theo docs/HUONG_DAN_CAI_DAT.md.
2. Kiểm tra hai thiết bị với Supabase thật, nhất là JWT/RLS cho nhắn riêng, quyền quản trị, chống spam và nối lại. Phiên này chưa chạy Supabase thật hoặc PostgreSQL.
3. Trên máy có WebGL: đi bộ/kéo camera ở A/B/sân/sân thượng; thử mọi loại ghế, E, tranh ghế, ghế đàn, thang máy/cầu thang/cửa; radial/chat ở desktop và điện thoại. Kiểm tra trực quan cao độ ghế và FPS.
4. Đo tải tăng dần trên dịch vụ thật. Chưa có sức chứa đồng thời được xác nhận; broadcast nhân theo số người nhận.
5. Đưa tệp tĩnh lên hosting sau cấu hình và kiểm tra. Phiên này chưa triển khai production.

## Bổ sung: ngồi ghế trong cảnh render

Chạy `node tools/kiem_tra_ghe_render.mjs --all` trên toàn bộ 491 chỗ ngồi và xem ảnh chụp đã tìm ra:

- Nhiều ghế không ngồi được: tự đi trong thư viện bỏ điểm rẽ sớm (0,45 m) nên cắt góc bàn/hàng ghế. Bước đi chéo bị chặn thì nhân vật đứng im, đường bị hủy âm thầm. Đã giảm ngưỡng điểm rẽ xuống 0,2 m, trượt theo từng trục như trên sân, tìm lại đường một lần và báo cho người chơi nếu vẫn kẹt (không dịch chuyển).
- Thuyền gỗ tầng 6: hai chỗ ở mỗi đầu nằm ngoài mép đệm. Đã dời vào trong.
- Tầng 6: hai ghế đen đặt trùng ghế xanh/ghế bành. Đã bỏ chỗ trùng và ẩn món thừa.
- Tầng 7: chậu cây đè lên lưng 4 ghế dãy bàn cong. Đã dời chậu ra phía kính.
- Sân thượng: chậu cây góc giàn nằm ngay trước ghế dài. Đã sửa nguồn `tools/nguon/tang10.html` và tạo lại `scene/tang10.js`.

## Lệnh phát triển

- `npm start`: máy chủ ngoại tuyến, cổng 3000.
- `npm run dev`: Supabase giả lập, cổng 3000; dùng ?nguoi=1, ?nguoi=2, ?nguoi=3 cho các phiên riêng. Không dùng làm backend production.
- `npm run check`: kiểm tra nguồn/tài nguyên.
- `npm test`: các hồi quy Node nêu trên, không cần WebGL hoặc gói npm bên ngoài.
- `npm run test:render`: kiểm tra ngồi ghế trong cảnh render thật (cổng 3101, tự bật máy chủ ngoại tuyến nếu cổng trống).

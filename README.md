# Phòng ôn thi ảo — bản thử nghiệm độc lập

Bản demo web ôn thi cộng đồng: sinh viên học ở nhà nhưng vẫn thấy các bạn khác đang ôn cùng mình, trong Thư viện Tạ Quang Bửu và sân trước thư viện dựng lại bằng 3D.

- Chạy thử ngay: xem `docs/HUONG_DAN_CAI_DAT.md` mục 1.
- Bật nhiều người thật bằng Supabase: mục 2 cùng file.
- Thay mô hình 3D, cập nhật Phòng thay đồ hay sân thượng: `docs/HOP_DONG_CANH.md`.

## Đợt 2 (phần 1) — đã làm

| Mục góp ý | Đã làm |
|---|---|
| 1. Bấm để tới nơi | Bấm xuống sàn (trên sân và từng tầng thư viện) → nhân vật tự tìm đường (A*) và đi tới, tránh bàn ghế, bồn cây. Bấm vào ghế → đi tới rồi ngồi. Bấm phím di chuyển là huỷ. |
| 2. Giới hạn camera | Camera không chui qua tường, trần, toà nhà; phóng to/thu nhỏ trong giới hạn. Ban tổ chức có **Chế độ quan sát** (camera tự do), mở bằng `index.html?quan-sat` + mật khẩu quản trị. |
| 3. Đàn piano | Ghế đàn tầng 6 ngồi được → hiện bàn phím đàn (âm thanh chỉ ở máy mình), người khác thấy 🎹. Thời gian chơi đàn **không tính giờ học**. |
| 4. Phạm vi | Chỉ thư viện + sân trước (file GLB của bạn). Bỏ D3/D5/D7/C7. Nút "Dạo sân trường" hiện "Sắp mở". |
| 7. Ngồi mọi ghế | Ghế, sofa, ghế bành, ghế đá, đàn piano, ghế nằm, gối lười, ghế dài trên sân thượng. Có nút **Đứng dậy** (hoặc bấm W/↑). Vị trí hiện theo tầng/phòng ("Phòng 401", "Tầng 6"…). |
| 8. Bản đồ nhỏ | Góc trái trên, bật/tắt được, vẽ đúng lối đi của tầng đang đứng, chấm người khác, bấm lên bản đồ để đi tới. |
| 9. Chống chóng mặt | Mặc định nhìn từ sau lưng nhân vật ở mọi nơi; có thể chuyển "Nhìn bằng mắt". Chỉnh độ nhạy xoay, tốc độ đi, "Giảm chuyển động". Góc nhìn rộng hơn, đi chậm hơn (≈2,2 m/s trong nhà), chuyển cảnh mờ dần. |
| 10. Nhân vật | Dùng **Phòng thay đồ** của bạn: cơ thể liền khối có xương, quần áo, phụ kiện, thẻ sinh viên đeo cổ (tên + MSSV dạng `2023****`). Nhân vật đi, ngồi, gõ bàn phím, ngả lưng ở ghế nằm. Mở ở màn đăng nhập và mục "Của tôi → Đổi trang phục". |
| 0. Tầng 10 | Sân thượng ngắm sao của bạn: đi thang máy lên tầng 10 là tới, bước vào cửa thang máy để xuống. Ghế nằm → "Nằm ngắm sao"; đứng gần kính → "Nhìn qua kính thiên văn" (không tính giờ học). |


## Đợt 2 (phần 2) — đã làm

| Mục góp ý | Đã làm |
|---|---|
| 5. Tìm người | Tab **👥 Mọi người**: ai đang online, đang ở đâu ("Thư viện · Phòng 401", "Sân trước thư viện"…), cách mình bao nhiêu mét, sắp theo gần → xa, ô tìm theo tên (gõ không dấu cũng được). Nút 🚶 **Đến chỗ bạn ấy** (cùng tầng thì tự đi bộ tới, khác tầng/khu thì chuyển cảnh rồi đứng cạnh), **@** nhắc tên, **✉️** nhắn riêng. Bạn nào bật "Ẩn trạng thái & vị trí" thì không hiện vị trí và không "đến chỗ" được. |
| 5. Nhắc tên @ | Gõ `@` trong ô chat là hiện gợi ý tên những bạn cùng khu (kênh Gần tôi: chỉ người ở gần); chọn bằng chuột, ↑ ↓ Enter. Người được nhắc thấy thông báo vàng + tiếng chuông. |
| 5. Kênh chat | **💬 Cả khu** (mọi người cùng khu), **📍 Gần tôi** (chỉ người trong 8 m cùng tầng nhận được; QTV đổi bán kính được), **✉️ Nhắn riêng** (chỉ câu mẫu, chỉ hai người đọc được — kiểm tra bằng RLS trên máy chủ). |
| 11. NPC | **Chú bảo vệ** ở cửa chính, **Cô thủ thư** ngồi quầy lễ tân tầng 1, **Cô trực phòng 401** đứng trước các dãy bàn. Chỉ có mặt 8:00–21:00 giờ Hà Nội, nhãn tím "NPC", bấm vào để nghe lời nhắn, **không tính vào số người online**, ghế của NPC không ai ngồi đè. Danh sách NPC cũng hiện ở tab Mọi người. |


## Đợt 2 (phần 3) — đã làm

| Nội dung | Đã làm |
|---|---|
| Cử chỉ | Nút 😊 ở thanh dưới: **👋 Vẫy tay, 🙌 Cổ vũ, 👍 Thích, 🙇 Cúi chào, 🤸 Vươn vai** — người cùng khu thấy ngay (gửi qua kênh realtime, không lưu, mỗi 2,5 giây một lần). Đứng hay ngồi đều làm được. Tự động: gửi "Chào…" thì vẫy tay, gửi "Cố lên / Chúc thi tốt" thì cổ vũ, tới giờ nhắc vận động thì nhân vật vươn vai cùng bạn. |
| Nhân vật sống động | Chớp mắt; khi ai đó nói (bong bóng chat), những người đứng gần quay đầu nhìn về phía người đó vài giây. |
| Thẻ sinh viên | Hồ sơ của mỗi người (bấm vào nhân vật hoặc tên) hiện **thẻ đeo cổ** đúng như trên nhân vật: tên + MSSV dạng `2023****` + huy hiệu trường giả. Mục "Của tôi" hiện thẻ của bạn. |
| Sân thư viện | Ban ngày có đàn chim bay vòng trên sân; buổi tối có đom đóm quanh vườn xoài và bãi cỏ; sân tối hơn và ánh xanh hơn khi về đêm. |
| Âm thanh theo nơi | Ngoài sân nghe gió & chim, trong thư viện nghe lật sách / gõ phím, sân thượng gió nhẹ (tự chuyển dần; tắt được trong hộp Âm thanh). |


## Đợt 2 (phần 4) — đã làm

| Nội dung | Đã làm |
|---|---|
| 12. Hai chế độ | Nút **🌳 Dạo chơi / 📚 Ôn thi** trên thanh trên. Dạo chơi: hiện mini-game, NPC trò chơi, rác trên sân; **không tính giờ học**, không bật câu hỏi chung (chỉ hiện nhắc nhỏ), trạng thái 🌳. Bấm lại để về Ôn thi. |
| 6. Ví sao | Mục "Của tôi": **ví = tổng sao đã kiếm − sao đã tiêu** (bảng xếp hạng vẫn tính sao đã kiếm). **☕ Cà phê 2⭐**: cầm ly cà phê trên tay 30 phút (ai cũng thấy, chỉ để trang trí). **💧 Uống nước miễn phí**: cầm chai nước 10 phút và tính lại lời nhắc uống nước. Sách: "sắp có". Mua bán làm trên máy chủ (không sửa được ở trình duyệt). |
| 🥭 Hái xoài | Tới gần một trong 6 cây xoài → "Hái xoài" → cầm gậy, bấm "Chọc!" (hoặc Space) cho thanh tiến độ đầy → quả xoài trên cây rơi xuống thật (90 giây sau mọc lại) → "Chấm muối tôm · lấy vía qua môn" (không ghi tên nhãn hàng nào) → **Giấy chứng nhận Xoài thần (mang tính giải trí)** tải về được, mỗi ngày 1 giấy (máy chủ kiểm tra) → chọn "📚 Lên thư viện ôn thi" hoặc "🌳 Đi dạo tiếp". |
| 🙏 Xin vía chăm chỉ | NPC **Anh thủ khoa** trên sân (chỉ hiện ở chế độ Dạo chơi). Bấm "Xin vía" → tự xếp hàng sau những bạn tới trước (hàng thật, theo thời điểm xếp), tới lượt anh thủ khoa cổ vũ, bạn cúi chào, tên bạn có ✨ tới hết ngày. |
| 📸 Chụp ảnh chữ HUST | NPC **Chị thợ ảnh** đứng trước chữ HUST. Bấm "Chụp ảnh" → bạn đứng trước chữ, đếm 3-2-1, nhân vật tạo dáng ngẫu nhiên, bạn bè đứng gần cũng lọt khung → ảnh có viền "Phòng ôn thi ảo · Sân Thư viện Tạ Quang Bửu" + tên + giờ, tải về được. |
| 🗑️ Nhặt rác | 12 món rác (giấy vo, chai, lon, túi) rải trên sân, đổi chỗ mỗi giờ, hiện chấm cam trên bản đồ nhỏ. Bấm vào rác (ở xa thì tự đi tới) → **+1 "Điểm tình nguyện ảo 🌱"** (đặt tên khác "điểm rèn luyện" để không gây hiểu lầm), tối đa 30 lần/ngày, mỗi lần cách nhau ≥ 8 giây (máy chủ kiểm tra). |


## Tính năng đã làm

| Nhóm | Chi tiết |
|---|---|
| Vào phòng | Họ tên + MSSV (2021–2026, 8–9 số), chọn nhận câu hỏi GT + ĐS, chọn vào thư viện hay sân trước, chọn nhân vật trong Phòng thay đồ, tuỳ chọn ẩn khỏi xếp hạng / ẩn trạng thái. Có màn chào lần đầu giới thiệu mục đích, tính năng và 3 bước. |
| Chống tên bậy | 1) Kiểm tra định dạng (chỉ chữ, 2–6 chữ, tự viết hoa). 2) Lọc từ cấm có dấu / không dấu / teencode / số thay chữ. 3) Tên không giống mẫu tên tiếng Việt thì hiện "Bạn học 1234" tới khi QTV duyệt. 4) QTV đổi tên, ẩn, khoá ngay. Kiểm tra cả ở trình duyệt và trên máy chủ. |
| Thế giới 3D | Sân trước thư viện (file GLB): đồng hồ mặt tiền chạy theo giờ Hà Nội, cửa kính tự mở khi tới gần, đèn bật buổi tối. Bước qua cửa chính là vào sảnh; đi ra cửa là ra sân. Trong thư viện đi bộ khắp các tầng, đi thang máy 1–4 ⇄ 6–7 ⇄ 10. Ở mỗi khu chỉ thấy người cùng khu. |
| Khu vực | Sân trước thư viện · Thư viện tầng 1–4 (có phòng 401) · Tầng 6–7 · Sân thượng tầng 10. |
| Hiển thị tạo động lực | Số người đang học, giờ học của bạn, sao, chuỗi ngày. Bảng xếp hạng giờ học / sao / chuỗi theo hôm nay và cả đợt. Dòng "Hôm nay cả phòng đã học X giờ". Thông báo khi ai đó học đủ mỗi giờ. |
| Câu hỏi chung | Mặc định mỗi 5 phút, 45 giây trả lời (QTV chỉnh được). Máy chủ chọn câu cân bằng môn → chương → dạng, không lặp trong 20 vòng. Chấm trên máy chủ, đáp án không lộ khi vòng còn mở. Mỗi người 1 lần, đúng +1 ⭐. Sau giờ hiện đáp án, lời giải, tỉ lệ A/B/C/D, số người đúng; bảng kết quả giữ tới khi tự đóng. Vào giữa vòng thì chờ vòng sau; đang Tập trung thì không bật lên. |
| Nhắn tin | 3 kênh (Cả khu · Gần tôi · Nhắn riêng), mẫu câu + tin tự do, gợi ý @tên, bong bóng trên đầu khoảng 5 giây, giãn cách 10 giây, lọc từ, nút báo cáo (3 báo cáo thì tự ẩn). |
| Hỏi bài | Danh sách câu hỏi (hiện số trả lời), bấm vào để xem và trả lời, công thức `$…$`, ghim/ẩn bởi QTV, báo cáo. |
| Nhắn nhủ | Gửi lời động viên riêng cho một bạn (mẫu câu); hộp góp ý / báo lỗi / báo cáo gửi riêng cho ban tổ chức. |
| Sức khoẻ | Nghỉ mắt 20-20-20 (mỗi 20 phút, 20 giây), vận động mỗi 50 phút, nhắc uống nước mỗi 60 phút. Màn nghỉ khoá thao tác và đếm ngược, có nút bỏ qua. Không bật khi đang làm câu hỏi. Bật/tắt từng loại được. |
| Tập trung & nghỉ | Pomodoro 25/5; nút Nghỉ (không tính giờ); sau 30 phút không thao tác thì hỏi "Bạn vẫn đang học chứ?"; ẩn tab quá 5 phút thì ngừng tính giờ. |
| Môi trường | Ngày/đêm theo giờ Hà Nội, thời tiết thật tại Bách Khoa (Open-Meteo) kèm mưa rơi; QTV ép ngày/đêm hoặc thời tiết được. Âm thanh tự tạo: mưa, gió & chim, thư viện, piano nhẹ, âm báo. |
| Quản trị (`admin.html`) | Tổng quan (online theo khu và trạng thái, giờ học theo ngày, tỉ lệ đúng…), Người dùng, Câu hỏi (nhịp, ngân hàng, nhập/xuất JSON, xem trước công thức, lịch sử vòng, huỷ vòng), Nội dung (tin nhắn, hỏi bài, góp ý, thông báo), Thiết đặt, Dữ liệu (xuất CSV có/không che MSSV, xoá dữ liệu), nhật ký thao tác. |

## Sửa theo góp ý ngày 4/11

- Bỏ mọi chú thích về CLB; web ghi là **bản demo** ("không phải trang chính thức của ĐHBK Hà Nội").
- Hái xoài → **Giấy chứng nhận Xoài thần** (lấy vía qua môn), xong hỏi "📚 Lên thư viện ôn thi" hay "🌳 Đi dạo tiếp".
- Sân trước thư viện: bỏ chân của các hình người mẫu (cột đen gần chữ HUST), bỏ 2 khối đá xám cạnh thùng rác, bỏ vạch vàng trên mặt đường (sửa lúc tải, không cần xuất lại file GLB).
- Bấm vào cửa kính chính: ngoài sân thì đi vào thư viện, trong sảnh thì đi ra sân.
- Ngồi được thêm: ghế dài ở sảnh tầng 1, ghế dài gác lửng, ghế đệm vuông, ghế băng gỗ lượn sóng và "đảo thuyền" tầng 6, ghế dài tầng 7 (A: 248 chỗ, tầng 6–7: 189 chỗ).
- Tầng 6–7: sửa lỗi ngồi xong mất nhân vật (tầng 7) và đứng dậy bị dịch ra giữa không gian (tầng 6).
- Camera: **không tự phóng to/thu nhỏ, không tự quay** — chỉ đổi khi bạn kéo chuột/cuộn/kéo cần. Khi bấm để tự đi, nhân vật quay theo hướng đi còn góc nhìn giữ nguyên; camera bám chặt nhân vật.
- Tên trên đầu nhân vật hiện lại (lỗi do trang sân thượng dùng trùng tên phần tử).
- Đàn piano: bấm vào thân đàn hoặc nút "🎹 Ngồi chơi đàn" khi đứng gần là ngồi vào đàn; gõ phím máy tính hoặc bấm phím trên màn hình để chơi.

## Cấu trúc thư mục

```
index.html · admin.html · config.js     ← cấu hình nằm hết trong config.js
phong-thay-do.html                       Phòng thay đồ (mở trong khung khi đăng nhập / đổi trang phục)
css/app.css
js/util.js        tiện ích, lọc từ cấm, kiểm tra tên/MSSV
js/net.js         lớp mạng: Supabase (trực tuyến) hoặc ngoại tuyến
js/avatar2.js     nhân vật trong phòng (dựng bằng avatar/avatar-kit.js); js/avatar.js là bản khối cũ để dự phòng
js/grid.js        lưới đi bộ + tìm đường A*
js/world.js       camera sau lưng, đi bộ, bấm để tới, ghế, đàn, sân thượng, bản đồ nhỏ, người khác, nhãn tên
js/audio.js · js/app.js · js/admin.js · js/questions-bank.js
avatar/           avatar-kit.js + phong-thay-do.js (đóng gói từ avatar/src = mã Phòng thay đồ)
scene/            hust3d.js (thư viện, tự sinh) · tang10.js (sân thượng, tự sinh) · adapter.js (hợp đồng cảnh)
scene/exterior/   thu-vien-ta-quang-buu.glb (sân trước) · luoi-di-chuyen.json (lưới đi bộ tính sẵn)
supabase/schema.sql · seed_questions.sql
tools/            patch_scene.py · patch_tang10.py · build_avatar.mjs · tao_luoi_san.html · kiem_tra_canh.html · nguon/
vendor/           supabase-js, KaTeX, phông Be Vietnam Pro, Patrick Hand (đóng gói sẵn, không cần CDN)
docs/             hướng dẫn cài đặt, hợp đồng cảnh
```

## Đã tự kiểm tra

- **Cơ sở dữ liệu (Postgres 16 thật, giả lập lớp auth của Supabase):**
  - Chạy `schema.sql` 2 lần vẫn đúng.
  - Kiểm tra tên/MSSV và lọc từ: chặn "lồn" nhưng không chặn "lớn", "các", "buổi"; chặn teencode, số thay chữ.
  - Tính giờ: chỉ cộng khi trạng thái trước là đang học, khoảng cách hai nhịp ≤ 120 giây, mở nhiều tab không cộng đôi.
  - Câu hỏi: tạo vòng, chấm đúng/sai, trả lời lần hai bị từ chối, xem kết quả trước giờ đóng bị từ chối, huỷ vòng thu hồi sao.
  - Chọn câu cân bằng qua 60 vòng: luân phiên môn, chương đều, không lặp gần nhau.
  - Hàm quản trị sai/đúng mật khẩu; RLS chặn đọc thẳng bảng `profiles` và `questions`.
- **Đợt 2 phần 4:** SQL (ví đủ/thiếu sao, mua cà phê trừ 2 sao, nước miễn phí, món lạ bị chặn, nhặt rác giãn cách 8 giây, giấy hái xoài 1 lần/ngày, trạng thái 🌳 không cộng giờ); giao diện: bật Dạo chơi, chụp ảnh với chữ HUST, xếp hàng xin vía, hái xoài → quả rơi → giấy chứng nhận, nhặt rác +1 🌱, uống nước, ví sao.
- **Đợt 2 phần 2:** SQL trên Postgres 16 (chạy `schema.sql` 2 lần; tin Gần tôi lưu vị trí; nhắn riêng: giãn cách, chặn câu ngoài mẫu, chặn tự gửi mình, người thứ ba không đọc được); giao diện với máy chủ giả lập: tab Mọi người, đến chỗ một bạn, @ gợi ý + Enter, tin Gần tôi của người ở xa bị bỏ qua, nhắn riêng hai chiều, hộp thoại NPC.
- **Đợt 2 phần 1 (Chromium, đồ hoạ giả lập):** đăng nhập với Phòng thay đồ → sân → tự đi tới cửa → vào sảnh → bấm đi qua cổng an ninh → ngồi ghế gần nhất → đứng dậy → tầng 6 → ngồi đàn → rời đàn; tầng 10: ghế nằm → nằm ngắm sao → ngồi dậy → kính thiên văn → rời kính → vào cửa thang máy xuống tầng 6; chế độ trực tuyến giả lập thấy người khác (nhân vật mới) ngồi trong phòng và đứng trên sân; `tools/kiem_tra_canh.html` báo "Đạt yêu cầu".
- **Giao diện đợt 1 (Chromium):**
  - Chế độ ngoại tuyến: màn chào → đăng nhập → sân trường → vào thư viện → chat → câu hỏi chung (trả lời, xem kết quả, +1 sao) → đi dạo → về chỗ → tầng 6 → D3 → ra sân → khung điện thoại 390 px.
  - Chế độ trực tuyến chạy với Supabase **giả lập**: hiện diện, người khác ngồi ghế và đi lại, tin nhắn @nhắc tên, thẻ hồ sơ, thông báo QTV, bảng xếp hạng.
  - Trang quản trị: tất cả các tab.

## Chưa làm được / cần lưu ý

- **Chưa chạy trên một dự án Supabase thật** (môi trường làm việc không truy cập được Supabase). Logic SQL đã chạy trên Postgres thật; phần realtime mới thử với bản giả lập. Lần đầu cài, hãy thử 2–3 máy và 2 tài khoản trước khi mở rộng.
- **Chưa thử tải 500–800 người.** Gói Free chỉ hợp vài chục người cùng lúc; xem mục 3 của hướng dẫn cài đặt.
- **Tốc độ khung hình chưa đo trên máy thật** (máy làm việc chỉ có đồ hoạ giả lập ~1–2 khung hình/giây). Nhân vật mới nặng hơn nhân vật khối cũ nên mặc định chỉ vẽ 40 người gần nhất (điện thoại 16); chỉnh `maxAvatars` trong `config.js` nếu máy yếu.
- Sân thượng tầng 10 dùng hiệu ứng toả sáng (bloom) như bản gốc; trên máy yếu có thể nặng.
- Nhập họ tên + MSSV **không xác minh được danh tính thật**. Vì vậy web không hiển thị "đã xác minh", và chỉ hiện MSSV dạng `2023****`.
- Lời nhắc sức khoẻ theo khuyến nghị phổ biến (quy tắc 20-20-20, đứng dậy sau 30–60 phút), không phải chỉ định y khoa.

## Bản quyền & dữ liệu

- **Hình ảnh và âm thanh:** mô hình 3D, Phòng thay đồ và sân thượng tự dựng; huy hiệu trên đồ là trường giả "Tổ Ong", không dùng logo HUST. Âm thanh do máy tự tạo.
- **Thư viện & phông chữ:** phông Be Vietnam Pro (SIL OFL), KaTeX (MIT), supabase-js (MIT), Three.js (MIT).
- **Ghi rõ không phải trang chính thức:** web có dòng "không phải trang chính thức của ĐHBK Hà Nội".
- **Dữ liệu cá nhân:** cần người phụ trách chốt thời hạn lưu dữ liệu và nội dung thông báo về dữ liệu theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 trước khi mở công khai.

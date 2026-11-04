# Tình trạng Đợt 3 — tiếp tục từ commit 534167e (04/11/2026)

Đây là tình trạng mã nguồn sau phiên tiếp tục. Kiểm thử tự động không thay thế kiểm tra hình ảnh WebGL và Supabase thật.

## Hoàn thiện và gộp hai nhánh WIP (04/11/2026)

Hai nhánh `wip/ghe-ngoi-render` (63bcecb) và `wip/giao-dien-render` (3762e4b) được ghép trên nền `main` 3845f67. Giữ bản vá thang máy A ⇄ B và các thay đổi SQL/Supabase đã vào PR #2. Xung đột package.json được giải quyết bằng cách giữ cả lệnh kiểm tra thang máy và render ghế.

- Ghế: giữ cải thiện đi sát điểm rẽ, trượt theo trục và thử tìm đường lại một lần; hiệu chỉnh chỗ trên thuyền, bỏ ghế trùng và dời chậu cây. Hoàn thiện cách nhận diện đồ nội thất theo tên prop để không ẩn nhầm vật khác; kiểm tra đích đường tìm lại trước khi cho ngồi.
- Giao diện: giữ chọn radial theo tâm vòng khi sát mép; kéo từ nhãn tên để xoay camera; cập nhật ma trận camera trước chiếu nhãn. Hoàn thiện hủy con trỏ/chống click thừa, bố trí vòng ở màn hình thấp và giữ bong bóng đọc được trong khung hình/HUD.
- Công cụ: thêm `npm run test:ui`, giữ `test:lift` và `test:render`; sửa khởi tạo/dọn máy chủ của bài kiểm tra render khi trình duyệt chưa sẵn sàng. Thêm hồi quy Node cho frame/camera thang máy để bảo vệ bản vá cũ trong lúc ghép nhánh.
- Kiểm tra sau gộp: `npm run check`, `npm test`, `git diff --check` đạt; gồm 18 nhóm ghế, 14 nhóm tương tác, 4 nhóm bố cục, hồi quy điều khiển/mạng/piano, 2 hồi quy camera thang máy, chức năng ngoại tuyến và tích hợp ba máy khách mạng. Chậu cây di chuyển cùng vùng va chạm để không còn chặn ở vị trí cũ.
- Tái tạo sân thượng từ `tools/nguon/tang10.html` khớp byte với JS/DOM đã đóng gói. Nguồn hust-3d gốc chưa có trong repo; các hook mới trong patch_scene.py được đối chiếu với cảnh đã đóng gói.

**Giới hạn của phiên gộp:** Chrome preview hiện báo không tạo được WebGL context; môi trường Node không có Chromium của Playwright. Vì vậy các bài `test:render`, `test:ui`, `test:lift` và nhiều trình duyệt không được ghi là đạt trong phiên này. Các ghi nhận Chromium/PostgreSQL bên dưới là lịch sử từ nhánh main trước khi ghép, không phải kết quả chạy lại. Supabase thật và tải nhiều người vẫn chưa xác minh.

## Đã thực hiện

| Yêu cầu | Mã nguồn và kết quả |
|---|---|
| Phòng thay đồ mới | Bản mới đã có trong repo: avatar/src/, các bundle, ảnh logo, 89 món và phong-thay-do.html. Đã kiểm tra liên kết tài nguyên, giữ tích hợp và dữ liệu trang phục cũ. Không có hai tệp đính kèm mới để so sánh ngoài nguồn repo. |
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
- `tools/kiem_tra_ghe.mjs`: hồi quy ghế/đường đi/ghế đầy/NPC/tranh ghế/đứng dậy/đàn/không teleport, điểm rẽ và thử tìm đường lại; kiểm tra Three.js cho đồ trùng, mặt đệm thuyền và chậu cây. Dùng logic thật với bố cục kiểm thử, không thay thế render toàn cảnh.
- `tools/kiem_tra_ghe_render.mjs` (`npm run test:render`, cần playwright + Chromium): kiểm tra trong cảnh render thật (SwiftShader). Mỗi loại ghế ở mỗi tầng của A/B/sân thượng/sân (`--all` là mọi ghế): đi tới bằng goSit, nhấn E, bấm chuột; đo gốc nhân vật, khớp hông trên mặt ghế bằng tia, vật đè/xuyên bàn, hướng bàn, đứng dậy ra ô đi được, ghế tầng khác không dịch chuyển. Ảnh chụp lưu vào `--out`.
- `tools/kiem_tra_tuong_tac.mjs`: kiểm tra radial, phím/chạm/hủy, hoạt động đến muộn, bong bóng và xử lý lỗi WebGL. Các hồi quy giao diện bổ sung nằm trong nhóm kiểm thử Node.
- `tools/lift-merge.test.mjs`: camera của khung cũ không cập nhật World sau khi chuyển A ⇄ B; trả mắt ngôi thứ ba về đúng camera đã lưu.
- `tools/test-network.mjs`: khoảng cách Presence, meta ghế/hoạt động, callback kênh cũ, piano/gói lỗi/nốt treo.
- `tools/offline-features.test.mjs`: hồ sơ, giờ học/nghỉ, câu hỏi/đáp án/điểm sao, ví, chat/chống spam, hỏi đáp/góp ý và giới hạn phần thưởng mini-game.
- `tools/multiplayer-integration.test.mjs`: ba máy khách mạng độc lập chạy js/net.js và Supabase giả lập qua HTTP/SSE: đăng nhập, online, vị trí, ghế, hoạt động, cử chỉ, chat/chống spam, kiểm duyệt, nhắn riêng đúng người, phân khu, piano, ngắt/nối lại và rời phòng. Không có broadcast rơi xuống REST vì chưa vào kênh.
- Chrome trong phiên này: preview chạy được nhưng không tạo được WebGL context. Đã xác nhận giao diện thông báo lỗi WebGL, hướng dẫn và nút tải lại.
- Hai script Python kiểm tra cú pháp; sân thượng tái tạo khớp và hook sai dừng trước khi ghi đè.

**Lịch sử trước khi gộp hai WIP:** `tools/kiem_tra_nhieu_nguoi.mjs` từng được ghi nhận ba Chromium với WebGL SwiftShader, Supabase giả lập và CSP — 24/24 mục đạt. Không chạy lại bài này trong phiên gộp. Ảnh chụp chỉ khi có `--out`.

**Lịch sử trên main:** `tools/kiem_tra_sql.sql` được ghi nhận đạt trên PostgreSQL 16, gồm quyền nhắn riêng, hàm nội bộ/quản trị và mật khẩu mặc định. Phiên gộp giữ nguyên SQL; không có PostgreSQL để chạy lại, và chưa kiểm tra Supabase thật.

Sửa khi rà soát triển khai: bỏ mật khẩu quản trị mặc định công khai (chạy lại schema sẽ vô hiệu hoá nó); phiên ẩn danh chưa đăng ký không được báo cáo nội dung; thêm chỉ mục cho cheers/qa/messages/answers/feedback/profiles.

## Còn cần trước khi mở cho người dùng thật

1. Điền URL và khoá public Supabase; bật anonymous sign-in, chạy schema/seed và cấu hình Realtime theo docs/HUONG_DAN_CAI_DAT.md.
2. Kiểm tra hai thiết bị với Supabase thật, nhất là JWT/RLS cho nhắn riêng, quyền quản trị, chống spam và nối lại. Phiên này chưa chạy Supabase thật hoặc PostgreSQL.
3. Trên máy có WebGL: đi bộ/kéo camera ở A/B/sân/sân thượng; thử mọi loại ghế, E, tranh ghế, ghế đàn, thang máy/cầu thang/cửa; radial/chat ở desktop và điện thoại. Kiểm tra trực quan cao độ ghế và FPS.
4. Đo tải tăng dần trên dịch vụ thật. Chưa có sức chứa đồng thời được xác nhận; broadcast nhân theo số người nhận.
5. Đưa tệp tĩnh lên hosting sau cấu hình và kiểm tra. Phiên này chưa triển khai production.

## Bổ sung: ngồi ghế trong cảnh render

Nhánh WIP ghi nhận bài thử toàn bộ 491 chỗ ngồi đã tìm ra các vấn đề dưới đây. Chúng được giữ và rà soát khi ghép; số chỗ ngồi có thể thay đổi sau khi bỏ ghế trùng. Phiên này không xác nhận lại bằng render:

- Nhiều ghế không ngồi được: tự đi trong thư viện bỏ điểm rẽ sớm (0,45 m) nên cắt góc bàn/hàng ghế. Bước đi chéo bị chặn thì nhân vật đứng im, đường bị hủy âm thầm. Đã giảm ngưỡng điểm rẽ xuống 0,2 m, trượt theo từng trục như trên sân, tìm lại đường một lần và báo cho người chơi nếu vẫn kẹt (không dịch chuyển).
- Thuyền gỗ tầng 6: hai chỗ ở mỗi đầu nằm ngoài mép đệm. Đã dời vào trong.
- Tầng 6: hai ghế đen đặt trùng ghế xanh/ghế bành. Đã bỏ chỗ trùng và ẩn món thừa.
- Tầng 7: chậu cây đè lên lưng 4 ghế dãy bàn cong. Đã dời chậu ra phía kính.
- Sân thượng: chậu cây góc giàn nằm ngay trước ghế dài. Đã sửa nguồn `tools/nguon/tang10.html` và tạo lại `scene/tang10.js`.

## Lệnh phát triển

### Bổ sung theo ảnh và góp ý

- **Quần khi đi:** giới hạn trọng số mỗi ống theo đúng chuỗi xương chân; ẩn tam giác da hoàn toàn nằm trong quần để tránh xuyên do lưới khác nhau. Tự khôi phục khi đổi độ dài/váy/bỏ quần, không ảnh hưởng tay và hình học dùng chung.
- **Đầu moi:** thêm `toc-dau-moi` vào mục Tóc, mái ngắn tỉa, thái dương sát và gáy mullet dài; đổi màu và đội mũ được. Chưa kiểm tra trực quan trên GPU.
- **Laptop:** logo quả táo dạng hình học ở mặt sau laptop cầm tay và laptop hành động, dùng chung hình học an toàn khi đổi trang phục.
- **Nhãn đồng phục:** bỏ chữ Phương Thảo trên thẻ món, bộ lọc và dòng tham khảo trong giao diện phòng thay đồ độc lập/nhúng; giữ dữ liệu nguồn tham khảo trong catalog.
- **Piano:** thư viện nhúng 9 bản cổ điển và Hãy trao cho anh (trích đoạn 4 ô nhịp từ PDF người dùng cung cấp), chọn là phát mà không cần nhập tệp. Ba tên còn lại (Em của ngày hôm qua, Chúng ta của hiện tại, Xe đạp) cần MIDI do người dùng nhập. Phát giữ tempo, hợp âm, ngân và lực phím, chia sẻ nốt qua mạng hiện có. Dừng khi rời đàn/ẩn tab. Tập theo chỉ chọn nốt cao nhất của mỗi thời điểm, chưa chấm nhịp/hợp âm. Nguồn, giấy phép và cách dựng: docs/PIANO_SOURCES.md.
- `tools/avatar-clothing.test.mjs`: hình học Three thật, 3 thể hình/nhiều kiểu quần, chân đối diện, 575 phép so tia trong chu kỳ bước/ngồi không phát hiện da xuyên quá 3 mm; kiểm tra khôi phục da và logo.
- `tools/hair-style.test.mjs`: 5 kiểm tra catalog/hình học, thái dương, mái, gáy, màu và mũ; không thay thế quan sát kiểu tóc thật.
- **Áo khi vung tay:** vùng vai áo trước đây bỏ qua cơ delta khi phân loại, khiến vải bị giữ ở ngực trong khi da đi theo vai. Đã bổ sung cơ delta và chuyển tiếp trọng số liên tục; mở rộng lớp che da cho thân/tay áo, khôi phục da khi đổi cổ chữ V, gấu, tay dài/ngắn/không tay/bỏ áo và giữ lớp che quần. Áp dụng cả phòng thay đồ lẫn nhân vật trong game.
- Áo dài tay tách vỏ cổ tay khỏi thân áo dưới nách, tránh lưới SDF nối cổ tay với hông khi đứng nghỉ; trọng số dùng cùng hình học tách và chuyển tiếp mềm lên vai. Kiểm tra gấu đứng yên khi tay cử động và không có cạnh vải kéo thành mảng dài trong các tư thế thử.
- `tools/avatar-sleeves.test.mjs`: 5.676 tia so sánh da thuộc vùng tay áo ở tay ngắn/dài trong tư thế nghỉ, bước tới/lùi, vẫy tay, vươn vai và ngồi laptop; không phát hiện xuyên quá 3 mm. Kiểm tra khôi phục da, bàn tay/cổ và giữ dữ liệu hình học gốc trên 3 thể hình. Không thay thế kiểm tra render trong cảnh thật.
- `tools/piano-midi.test.mjs`: kiểm tra đọc MIDI, giới hạn/tệp lỗi, tempo, sustain, lực phím, dừng phát, chọn thư viện nhúng/nhập riêng, thay mục chờ nhập bằng bản PDF có sẵn và tích hợp nguồn tái tạo cảnh. `tools/piano-library.test.mjs` kiểm tra SHA-256/nguồn, phát hết mọi bản rồi nhả nốt, đọc khi chọn/giữ bộ nhớ đệm, hoạt động không gọi mạng và dựng tái lập. `tools/score-midi.test.mjs` kiểm tra 4 ô nhịp được chép, nốt nối/hóa biểu/tempo/hai tay và byte MIDI tương ứng.
- **Tên và đăng nhập:** đổi tên ứng dụng, tiêu đề tab, trang quản trị và nhãn ảnh/chứng nhận thành Học Online Cùng Huster. Bỏ lựa chọn nơi bắt đầu và nhận câu hỏi; nút Học ngay luôn đưa vào sân trước thư viện và tắt đăng ký câu hỏi tự động, kể cả phiên từng lưu vào thư viện. Giữ hồ sơ/nhân vật/quyền riêng tư.
- `tools/login-flow.test.mjs`: kiểm tra gửi form thật trong VM cho người mới, hồ sơ cũ từng chọn thư viện/câu hỏi và khôi phục nút sau lỗi máy chủ/kết nối.
- **Camera thang máy:** tự ép góc nhìn mắt ngay khi vào cabin A/B, suốt lúc cửa đóng/di chuyển/chuyển khối/đến tầng. Chặn đổi góc và thu phóng trong cabin; ẩn nhân vật/nhãn của chính mình, khôi phục lựa chọn góc nhìn và khoảng cách cũ khi ra ngoài. Chế độ quan sát quản trị vẫn riêng biệt.
- `tools/lift-camera.test.mjs`: chạy handler World và truy vấn cabin thật trong VM, kiểm tra vào/ra, A/B, cửa/di chuyển/chuyển khối, giữ sở thích camera và chặn wheel/pinch/setOpt. Kết hợp hồi quy chuyển khung cảnh trong `tools/lift-merge.test.mjs`; chưa kiểm tra render bằng WebGL.
- Kiểm tra cuối đợt bổ sung: `npm run check && npm test && git diff --check` đạt; 66 tệp JavaScript, 55 tài nguyên cục bộ và header GLB hợp lệ, 40 kiểm thử Node đạt cùng các nhóm điều khiển/ghế/tương tác/mạng. Hai bundle avatar đã dựng lại. Chưa xác minh trực quan trong cảnh WebGL hoặc với Supabase thật.

### Bổ sung MIDI và camera góc tường/tầng 10

- Thêm 10 tệp MIDI nhúng (9 bản Mutopia có ghi nguồn/giấy phép và đoạn 4 ô nhịp từ PDF người dùng cung cấp). Giải mã khi chọn bài, dùng bộ phát piano hiện có; không cần tải tệp hoặc gọi máy chủ ngoài để chơi nhạc có sẵn. Hãy trao cho anh thay đúng mục đang chờ nhập MIDI; các bài hiện đại khác vẫn giữ nhập riêng.
- Giữ byte MIDI gốc cổ điển trong `data/piano-library.json`, dựng ra `js/piano-library.js` bằng công cụ không cần npm ngoài. Ghi công và giấy phép theo từng mục trong `docs/PIANO_SOURCES.md` và trên giao diện đàn. Đoạn PDF có JSON chép nốt/bộ sinh/kiểm thử tái lập, không đưa PDF gốc lên repo.
- Sửa camera đi xuyên góc tường/sàn: callback trước đây luôn cho phép vị trí camera. Nay kiểm tra tâm và bốn góc mặt phẳng gần với biên tầng/trần, gồm điểm đích nằm giữa các bước lấy mẫu; A/B cung cấp biên sàn thật, tách khỏi nội thất.
- Tầng 10: dựng hình học thật trong kiểm thử CPU đã tái hiện camera ở trong dầm giàn che tại `(-5.24, 3.0851, -5.7079)` và chạm dây đèn tối ở góc nhìn mặc định. Thêm quét tâm/bốn góc camera với vật thể mái hiên/dầm/dây trên sân thượng, giới hạn camera trước vật cản; bỏ cảnh thành phố/bầu trời/nhân vật khỏi tập va chạm. Nơi thoáng giữ nguyên khoảng cách.
- Các thay đổi cảnh có hook trong generator; kiểm thử hồi quy giữ camera thang máy và khôi phục khung cảnh A/B. `tools/room-camera.test.mjs` kiểm tra hình học, góc tường, trần và góc khung nhìn qua phép chiếu Three. Chưa xác minh lại trong cảnh WebGL trên thiết bị người dùng.

### Chạy cục bộ

- `npm start`: máy chủ ngoại tuyến, cổng 3000.
- `npm run dev`: Supabase giả lập, cổng 3000; dùng ?nguoi=1, ?nguoi=2, ?nguoi=3 cho các phiên riêng. Không dùng làm backend production.
- `npm run check`: kiểm tra nguồn/tài nguyên.
- `npm test`: các hồi quy Node nêu trên, không cần WebGL hoặc gói npm bên ngoài.
- `npm run test:render`: kiểm tra ngồi ghế trong cảnh render thật (cổng 3101, tự bật máy chủ ngoại tuyến nếu cổng trống).
- `npm run test:ui`: kiểm tra giao diện/camera/chat/radial bằng Chromium (cổng 3102).
- `npm run test:lift`: kiểm tra thang máy bằng Chromium (cổng 3130).

Ba bài render cần cài Playwright/Chromium trên máy phát triển: `npm install --no-save playwright` rồi `npx playwright install chromium`. Không cần các gói này để chạy web hoặc `npm test`.

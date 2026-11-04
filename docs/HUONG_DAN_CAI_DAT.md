# Hướng dẫn cài đặt Phòng ôn thi ảo (bản thử nghiệm)

Có 2 cách chạy:

| Cách | Ai thấy ai? | Cần gì? |
|---|---|---|
| **Ngoại tuyến** (mặc định) | Chỉ mình bạn, dữ liệu lưu trên trình duyệt | Không cần gì, dùng để xem thử |
| **Trực tuyến** | Mọi người thấy nhau, nhắn tin, câu hỏi chung, bảng xếp hạng thật | Một dự án Supabase đã cấu hình |

`config.js` trong repo cố ý để trống hai giá trị Supabase. Chỉ đưa mã lên hosting sẽ vẫn chạy ngoại tuyến; cần hoàn tất mục 2 để người dùng trên các máy tương tác được với nhau.

---

## 0. Danh sách kiểm tra triển khai (làm theo thứ tự, đánh dấu từng ô)

Chi tiết từng bước ở mục 2. Dùng danh sách này trong ngày đưa web lên mạng.

**A. Supabase**
- [ ] Tạo dự án mới ở <https://supabase.com> → **New project**, vùng **Southeast Asia (Singapore)**. Chờ trạng thái *Healthy*.
- [ ] **Authentication → Sign In / Providers → Allow anonymous sign-ins**: bật → **Save**.
- [ ] **Authentication → Rate Limits**: nâng *anonymous sign-ins* (mặc định 30 lượt/giờ/IP; cả lớp dùng chung Wi-Fi trường là chung IP). Ví dụ 300–500 nếu mời vài trăm người.
- [ ] **SQL Editor → New query**: dán toàn bộ `supabase/schema.sql` → **Run**. Phải báo *Success*, không có dòng `ERROR`.
- [ ] Query mới: dán `supabase/seed_questions.sql` → **Run** (133 câu mẫu).
- [ ] Query mới: `select admin_set_initial_password('mat-khau-rieng-it-nhat-8-ky-tu');` → **Run**. **Không có mật khẩu mặc định**: chưa chạy lệnh này thì không ai (kể cả bạn) vào được trang quản trị.
- [ ] **Database → Publications → supabase_realtime**: có đủ 6 bảng `messages`, `public_profiles`, `notices`, `events`, `cheers`, `app_settings`.
- [ ] Kiểm tra nhanh trong SQL Editor: `select count(*) from questions;` ra 133; `select count(*) from admin_secret;` ra 1.

**B. config.js**
- [ ] **Project Settings → API** (hoặc **Data API**): chép **Project URL** vào `window.SUPABASE_URL`, chép khoá **anon** (tab *Legacy API Keys*, chuỗi `eyJ…`) vào `window.SUPABASE_ANON_KEY`.
- [ ] Tuyệt đối không dán khoá `service_role` / `sb_secret_…`. Nếu lỡ dán, web tự chạy ngoại tuyến và báo lỗi trong Console; hãy **đổi khoá** trong Supabase ngay.
- [ ] Nếu dùng tên miền riêng cho Supabase (custom domain), thêm `https://ten-mien` và `wss://ten-mien` vào `connect-src` trong `netlify.toml` và `vercel.json`, nếu không CSP sẽ chặn kết nối.

**C. Đưa web lên (chọn một)**
- [ ] **Netlify**: nối repo (Netlify tự đọc `netlify.toml`, không cần lệnh build) hoặc kéo thả cả thư mục vào <https://app.netlify.com/drop>.
- [ ] **Vercel**: **Add New → Project** → chọn repo → *Framework Preset: Other*, để trống Build Command và Output Directory → **Deploy** (`vercel.json` có sẵn header).
- [ ] **GitHub Pages**: **Settings → Pages → Deploy from a branch → main / (root)**. Lưu ý: GitHub Pages **không** đọc `netlify.toml`/`vercel.json` (không có CSP, mọi file được cache khoảng 10 phút), nên sau khi sửa `config.js` chờ khoảng 10 phút hoặc tải lại cứng (Ctrl+Shift+R).
- [ ] Mở `https://ten-mien/scene/exterior/thu-vien-ta-quang-buu.glb`: phải tải về tệp khoảng 9,4 MB (không phải trang 404 hay tệp con trỏ LFS vài trăm byte).

**D. Thử bằng 2 thiết bị (ví dụ một laptop và một điện thoại 4G, để khác mạng)**
- [ ] Mở URL trên cả hai, đăng nhập hai tên/MSSV khác nhau. Góc trên báo trực tuyến; số "đang học" là 2 trên cả hai máy.
- [ ] Cùng ở sân trước: thấy nhân vật của nhau; đi bộ trên máy này thì máy kia thấy di chuyển trong vòng 1–2 giây.
- [ ] Gửi chat *Cả khu*: máy kia nhận ngay. Gửi tin thứ hai liền: bị báo "Chậm lại…".
- [ ] Vẫy tay (giữ Q hoặc nút ✋): máy kia thấy. Nhắn riêng bằng câu mẫu: chỉ người nhận thấy.
- [ ] Một máy vào thư viện: máy kia thấy bạn ấy chuyển khu và nhân vật biến khỏi sân.
- [ ] Tắt Wi-Fi/4G trên một máy 10 giây rồi bật lại: tự nối lại, không cần tải lại trang. Đóng tab: máy kia còn 1 người sau khoảng 10–30 giây.
- [ ] Vào `admin.html` bằng mật khẩu vừa đặt, ẩn một tin nhắn: tin biến mất ở máy kia.
- [ ] Mở F12 → Console trên máy tính: không có lỗi đỏ về `Content-Security-Policy`, `401` hoặc `permission denied`.

---

## 1. Chạy thử ngay (ngoại tuyến)

Trình duyệt chặn một số tính năng khi mở thẳng file, nên hãy chạy qua một máy chủ nhỏ:

```bash
cd phong-on-thi-ao
python3 -m http.server 8000
```

Sau đó mở `http://localhost:8000`. Trang quản trị nằm ở `http://localhost:8000/admin.html`; ở chế độ ngoại tuyến, mật khẩu nào cũng vào được.

> Mẹo thử câu hỏi chung nhanh: vào **admin.html → Câu hỏi**, đặt "Mỗi bao nhiêu phút một câu" = 1 rồi Lưu. Tải lại trang chính và chờ sang phút kế tiếp.

---

## 2. Bật chế độ trực tuyến với Supabase

### Bước 1. Tạo dự án
1. Vào <https://supabase.com>, đăng nhập rồi chọn **New project**.
2. Đặt tên (ví dụ `phong-on-thi-ao`), đặt mật khẩu cơ sở dữ liệu, chọn vùng **Southeast Asia (Singapore)** cho gần Việt Nam.
3. Chờ khoảng 2 phút để dự án được tạo.

### Bước 2. Bật đăng nhập ẩn danh
Người học không cần email. Mỗi trình duyệt được cấp một mã ẩn danh, nên quay lại cùng trình duyệt sẽ giữ nguyên giờ học.
1. Vào **Authentication → Sign In / Providers**.
2. Bật **Allow anonymous sign-ins**, rồi bấm **Save**.
3. Vào **Authentication → Rate Limits**, điều chỉnh mục *anonymous sign-ins* theo số người dự kiến cùng dùng mạng trường.
   - Mặc định Supabase chỉ cho **30 lượt mỗi giờ cho một địa chỉ IP**.
   - Sinh viên dùng chung Wi-Fi trường sẽ có chung IP, nên nếu không nâng có thể bị chặn. Xem [tài liệu đăng nhập ẩn danh](https://supabase.com/docs/guides/auth/auth-anonymous) và [giới hạn Auth](https://supabase.com/docs/guides/auth/rate-limits).

### Bước 3. Tạo cơ sở dữ liệu
1. Vào **SQL Editor → New query**, dán toàn bộ `supabase/schema.sql`, rồi bấm **Run**.
2. Mở tiếp một query mới, dán `supabase/seed_questions.sql` (133 câu mẫu), rồi bấm **Run**.
3. **Đặt mật khẩu quản trị** (không có mật khẩu mặc định; trước khi chạy lệnh này trang quản trị bị khoá):
   ```sql
   select admin_set_initial_password('mat-khau-rieng-it-nhat-8-ky-tu');
   ```
   Dự án đã chạy bản cũ có mật khẩu mặc định `doi-mat-khau-ngay`: chạy lại `schema.sql` sẽ vô hiệu hoá mật khẩu đó, nên cần chạy lệnh trên một lần.

Chạy lại `schema.sql` nhiều lần vẫn an toàn, dữ liệu cũ không bị xoá. Khi sửa phiên bản sau, cứ dán lại và chạy.

### Bước 4. Bật Realtime
`schema.sql` đã tự thêm các bảng cần nghe thay đổi vào Realtime. Để kiểm tra:
1. Vào **Database → Publications → supabase_realtime**.
2. Phải thấy đủ 6 bảng: `messages`, `public_profiles`, `notices`, `events`, `cheers`, `app_settings`.

### Bước 5. Điền cấu hình vào web
1. Vào **Project Settings → API**.
2. Sao chép **Project URL** và khoá **anon / publishable**, rồi dán vào `config.js`:
   ```js
   window.SUPABASE_URL = 'https://xxxx.supabase.co';
   window.SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```

Khoá *anon* được phép để công khai trong trang web, vì mọi quyền đã được khoá bằng RLS và các hàm trên máy chủ. **Tuyệt đối không** dán khoá `service_role`.

### Bước 6. Đưa web lên mạng
Tải **toàn bộ mã chạy của web** (gồm `index.html`, `admin.html`, `phong-thay-do.html`, `config.js`, `css/`, `js/`, `avatar/`, `scene/`, `vendor/`) lên hosting tĩnh. Giữ nguyên cấu trúc thư mục và tên file; không chỉ tải mỗi `index.html`:
- **GitHub Pages:** đẩy lên một repo, rồi vào Settings → Pages → chọn nhánh `main`.
- **Netlify:** kéo thả thư mục vào <https://app.netlify.com/drop>.
- **Cloudflare Pages / Vercel:** tạo dự án tĩnh, không cần lệnh build.

Repo đã có `netlify.toml`, `vercel.json` và `.nojekyll` cho các nền tảng tương ứng. Với GitHub Pages của repo này, URL có thêm `/study-with-huster/`; các tài nguyên dùng đường dẫn tương đối để chạy được dưới thư mục đó. File GLB của sân trước và thư mục `avatar/assets/` phải được đưa lên cùng web. Không đưa thư mục `.git/`, tệp kiểm thử hay khoá bí mật lên hosting.

Web đã đóng gói sẵn thư viện và phông chữ trong `vendor/`, nên không phụ thuộc CDN ngoài. Thứ duy nhất gọi ra ngoài là thời tiết từ Open-Meteo; nếu bị chặn, web vẫn chạy bình thường.

### Bước 7. Vào trang quản trị
Mở `https://ten-mien-cua-ban/admin.html` và nhập mật khẩu đã đặt ở bước 3. Ở đây bạn có thể:
- **Người dùng:** duyệt tên, đổi tên, ẩn, cấm chat, mời ra, khoá.
- **Câu hỏi:** đổi nhịp và thời gian trả lời, thêm, sửa, nhập JSON ngân hàng câu, huỷ vòng lỗi.
- **Nội dung:** kiểm duyệt tin nhắn và hỏi bài, đọc góp ý, gửi thông báo.
- **Thiết đặt:** đóng/mở phòng, ép ngày/đêm và thời tiết, chỉnh nhắc nghỉ, mẫu câu, từ cấm.
- **Dữ liệu:** xuất CSV, xoá dữ liệu sau đợt, xem nhật ký thao tác.

Nếu nhập sai mật khẩu 8 lần liên tiếp, trang quản trị bị khoá 5 phút.

---

## 3. Giới hạn của gói miễn phí — đọc kỹ trước khi mở cho đông người

Theo trang [Realtime Limits](https://supabase.com/docs/guides/realtime/limits) của Supabase, đối chiếu ngày 04/11/2026 (giới hạn có thể thay đổi):

| | Free | Pro |
|---|---|---|
| Kết nối realtime cùng lúc | 200 | 500 |
| Tin realtime mỗi giây | 100 | 500 |
| Cập nhật hiện diện (presence) mỗi giây | 20 | 50 |
| Lần gọi Presence mỗi client trong 30 giây | 5 | 5 |

Web đã được làm cho tiết kiệm:
- Vị trí nhân vật chỉ gửi khoảng 1 lần mỗi 1,2 giây khi đang đi, người xem tự nội suy.
- Ngồi học thì không gửi vị trí.
- Presence gộp thay đổi tối thiểu 8 giây/lần; khi đông sẽ thưa hơn. Ghế và hoạt động dùng thêm broadcast nhỏ để người cùng khu thấy sớm, không gọi `track()` liên tục.
- Tin nhắn và bảng xếp hạng đi qua cơ sở dữ liệu.
- Đàn piano gom nốt theo khoảng 50 ms; rời khu sẽ xoá hàng đợi và nhả nốt còn giữ. Người nghe có thể tắt riêng trong Âm thanh.

Dù vậy:
- **Số kết nối tối đa không phải sức chứa đã kiểm chứng của trò chơi.** Ví dụ theo [cách tính sự kiện Realtime](https://supabase.com/docs/guides/realtime/settings), một broadcast tới 100 người tính khoảng 100 sự kiện. Đàn gửi liên tục 20 gói/giây cho 5 người nghe đã tạo khoảng 100 lượt nhận/giây, chưa tính vị trí, hiện diện và chat.
- Bắt đầu bằng nhóm nhỏ, theo dõi Realtime Reports trên dự án thật rồi tăng dần. **Chưa có phép đo tải để cam kết vài chục, 500 hay 800 người.** Giữ piano nhiều người nghe hoặc mở đông người cần điều chỉnh tần suất/gói dịch vụ và đo lại; hiện diện hiện dùng một kênh chung toàn khuôn viên.
- Trước buổi mở, kiểm tra dự án đang hoạt động và đăng nhập được từ hai mạng khác nhau.
- Có thể chỉnh `posIntervalMs` và `presenceGapMs` trong `config.js` để giảm lưu lượng hơn nữa.
- Mỗi người mở 4 kênh trên **một** kết nối WebSocket (hiện diện chung, kênh khu, tin nhắn của khu, thay đổi CSDL chung). Mỗi thay đổi `public_profiles`/`events` được Realtime kiểm tra RLS cho từng người đang nghe, nên càng đông thì CSDL càng bận; theo dõi *Database → Reports* khi tăng người.
- Kênh vị trí/cử chỉ/hiện diện là kênh broadcast công khai (chưa dùng Realtime Authorization). Người cố ý sửa mã trình duyệt có thể gửi gói vị trí giả; dữ liệu thật (giờ học, sao, tin nhắn, nhắn riêng, quản trị) vẫn được bảo vệ bằng RLS và hàm trên máy chủ.

### Kiểm tra trước khi mời người dùng

1. Mở URL đã triển khai trên hai trình duyệt hoặc hai thiết bị; đăng nhập hai hồ sơ khác nhau. Góc kết nối phải báo trực tuyến; nếu báo ngoại tuyến, kiểm tra `config.js`.
2. Vào cùng khu: thấy nhân vật, đi bộ, kéo góc nhìn khi giữ WASD, thử chọn cùng một ghế, đứng dậy rồi ngồi lại. Ghế đang có người phải bị từ chối hoặc giải quyết xung đột.
3. Gửi chat Cả khu/Gần tôi và chọn vẫy tay, đọc sách, điện thoại, laptop: máy kia phải thấy đúng người. Thử người vào khu sau khi hoạt động đã bắt đầu.
4. Ở tầng 6–7, bật Âm thanh trên máy nghe và chơi đàn; tắt riêng tiếng đàn người khác rồi thử lại. Chuyển khu khi nốt đang ngân, không được phát lại nốt từ khu cũ.
5. Tắt mạng rồi bật lại: trạng thái chuyển sang kết nối lại, người dùng trở lại danh sách, không cần tải lại trang. Đóng một tab và kiểm tra nó biến mất.
6. Xem Console, Realtime Reports, lỗi Auth và nhật ký SQL. Kiểm thử bằng máy chủ giả chỉ kiểm tra giao thức ứng dụng, **không xác nhận RLS/JWT, giới hạn hay độ trễ của Supabase thật**.

Kiểm thử lõi chạy bằng `node tools/test-network.mjs` (không cần trình duyệt). Kiểm thử ba trình duyệt Chromium thật qua Supabase giả lập: `node tools/kiem_tra_nhieu_nguoi.mjs --port=3103` sau khi cài Playwright/Chromium theo chú thích đầu file (máy không có GPU dựng hình bằng SwiftShader nên mất khoảng 7–10 phút; thêm `--out=thu-muc` để chụp ảnh). Kiểm tra quyền SQL trên Postgres 16 thường: chạy lần lượt `tools/supabase-gia-lap.sql`, `supabase/schema.sql`, `supabase/seed_questions.sql`, `tools/kiem_tra_sql.sql` bằng `psql -v ON_ERROR_STOP=1` trên một CSDL trống. Công cụ giả lập chỉ chạy trên máy phát triển, không dùng làm backend công khai.

---

## 4. Xử lý sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| Màn chờ báo "Không đăng nhập ẩn danh được" | Chưa bật Anonymous sign-ins (bước 2). |
| Báo lỗi sau khi nhiều bạn vào cùng lúc | Nâng giới hạn Anonymous sign-ins (bước 2.3). |
| Không thấy người khác, tin nhắn không hiện ngay | Kiểm tra Realtime (bước 4). Xem tab Console của trình duyệt (F12). |
| "Sai mật khẩu quản trị" | Chưa đặt mật khẩu hoặc quên: chạy `select admin_set_initial_password('...')` trong SQL Editor. |
| Console báo `Refused to connect … Content-Security-Policy` | `SUPABASE_URL` không phải `*.supabase.co` (tên miền riêng): thêm tên miền vào `connect-src` trong `netlify.toml`/`vercel.json`. |
| Sửa `config.js` mà máy khác vẫn chạy ngoại tuyến | GitHub Pages cache khoảng 10 phút: chờ rồi tải lại cứng (Ctrl+Shift+R). |
| Máy nóng, giật | Vào "Của tôi → Đồ hoạ → Nhẹ". |
| Muốn xoá sạch sau đợt thử | Vào admin.html → Dữ liệu → Xoá (gõ `XOA DU LIEU`). |

## 5. Cập nhật từ bản đợt 1

1. Chép đè toàn bộ thư mục web, **giữ lại `config.js` của bạn** (hoặc chép lại hai dòng `SUPABASE_URL`, `SUPABASE_ANON_KEY` sang file mới — file mới có thêm khu `lib_c` sân thượng và bỏ D3/D5/D7/C7).
2. Trong Supabase → SQL Editor, chạy lại `supabase/schema.sql` (chạy lại nhiều lần vẫn an toàn). Bản này thêm: trạng thái "đang chơi đàn / ngắm sao" (không tính giờ học), cột vị trí cho tin "Gần tôi", hàm `send_dm` cho nhắn riêng và quyền để người gửi đọc lại tin riêng của mình. Câu mẫu nhắn riêng và bán kính "Gần tôi" sửa ở trang Quản trị → Thiết đặt. Phần 4 thêm: cột ví sao / điểm tình nguyện ảo / giấy hái xoài trong bảng `profiles`, các hàm `buy_item`, `pick_trash`, `claim_mango`, và trạng thái 🌳 "Dạo chơi" (không tính giờ).
3. File sân trước `scene/exterior/thu-vien-ta-quang-buu.glb` nặng khoảng 9,4 MB. Hosting tĩnh (Netlify, Vercel, GitHub Pages, Cloudflare Pages) phục vụ được; nên bật nén gzip/brotli nếu dịch vụ cho chọn.
4. **Chế độ quan sát cho ban tổ chức:** mở `index.html?quan-sat`, vào phòng như thường, bấm nút **👁️ Quan sát** và nhập mật khẩu quản trị. Camera bay tự do; bấm "Thoát" để trở lại nhân vật. Người học bình thường không thấy nút này, và nếu tự gõ địa chỉ thì vẫn cần mật khẩu.
5. Nhân vật cũ (khối chibi) của người dùng đợt 1 được thay bằng nhân vật mới cố định theo tài khoản; họ có thể vào **Của tôi → 👕 Đổi trang phục** để tự chọn lại.

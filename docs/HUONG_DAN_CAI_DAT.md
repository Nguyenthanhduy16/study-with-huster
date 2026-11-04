# Hướng dẫn cài đặt Phòng ôn thi ảo (bản thử nghiệm)

Có 2 cách chạy:

| Cách | Ai thấy ai? | Cần gì? |
|---|---|---|
| **Ngoại tuyến** (mặc định) | Chỉ mình bạn, dữ liệu lưu trên trình duyệt | Không cần gì, dùng để xem thử |
| **Trực tuyến** | Mọi người thấy nhau, nhắn tin, câu hỏi chung, bảng xếp hạng thật | Một dự án Supabase miễn phí (khoảng 20 phút cài đặt) |

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
3. **Quan trọng:** vào **Authentication → Rate Limits** và nâng mục *anonymous sign-ins* lên khoảng `1000` mỗi giờ.
   - Mặc định Supabase chỉ cho **30 lượt mỗi giờ cho một địa chỉ IP**.
   - Sinh viên dùng chung Wi-Fi trường sẽ có chung IP, nên nếu không nâng sẽ bị chặn rất nhanh.

### Bước 3. Tạo cơ sở dữ liệu
1. Vào **SQL Editor → New query**, dán toàn bộ `supabase/schema.sql`, rồi bấm **Run**.
2. Mở tiếp một query mới, dán `supabase/seed_questions.sql` (133 câu mẫu), rồi bấm **Run**.
3. **Đặt mật khẩu quản trị ngay** (mật khẩu mặc định là `doi-mat-khau-ngay`):
   ```sql
   select admin_set_initial_password('mat-khau-rieng-it-nhat-8-ky-tu');
   ```

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
Tải **toàn bộ thư mục** (gồm `index.html`, `admin.html`, `config.js`, `css/`, `js/`, `scene/`, `vendor/`) lên một trong các dịch vụ dưới đây. Cả ba đều miễn phí cho web tĩnh:
- **GitHub Pages:** đẩy lên một repo, rồi vào Settings → Pages → chọn nhánh `main`.
- **Netlify:** kéo thả thư mục vào <https://app.netlify.com/drop>.
- **Cloudflare Pages / Vercel:** tạo dự án tĩnh, không cần lệnh build.

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

Theo trang [Realtime Limits](https://supabase.com/docs/guides/realtime/limits) của Supabase (kiểm tra lại vì có thể đổi):

| | Free | Pro (~25 USD/tháng) |
|---|---|---|
| Kết nối realtime cùng lúc | 200 | 500 |
| Tin realtime mỗi giây | 100 | 500 |
| Cập nhật hiện diện (presence) mỗi giây | 20 | 50 |

Web đã được làm cho tiết kiệm:
- Vị trí nhân vật chỉ gửi khoảng 1 lần mỗi 1,2 giây khi đang đi, người xem tự nội suy.
- Ngồi học thì không gửi vị trí.
- Trạng thái chỉ cập nhật tối đa 1 lần mỗi 8 giây.
- Tin nhắn và bảng xếp hạng đi qua cơ sở dữ liệu.

Dù vậy:
- **Gói Free phù hợp để thử với vài chục người cùng lúc.**
- **Mục tiêu 500–800 người cùng lúc cần gói Pro và phải thử tải trước.** Thiết kế hiện tại dùng một kênh hiện diện chung cho cả trường; trên 500 người nên tách kênh theo khu.
- Dự án Free bị **tạm dừng nếu khoảng 1 tuần không có hoạt động**. Hãy vào dashboard bấm Restore trước ngày mở.
- Có thể chỉnh `posIntervalMs` và `presenceGapMs` trong `config.js` để giảm lưu lượng hơn nữa.

---

## 4. Xử lý sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| Màn chờ báo "Không đăng nhập ẩn danh được" | Chưa bật Anonymous sign-ins (bước 2). |
| Báo lỗi sau khi nhiều bạn vào cùng lúc | Nâng giới hạn Anonymous sign-ins (bước 2.3). |
| Không thấy người khác, tin nhắn không hiện ngay | Kiểm tra Realtime (bước 4). Xem tab Console của trình duyệt (F12). |
| "Sai mật khẩu quản trị" | Chạy lại `select admin_set_initial_password('...')` trong SQL Editor. |
| Máy nóng, giật | Vào "Của tôi → Đồ hoạ → Nhẹ". |
| Muốn xoá sạch sau đợt thử | Vào admin.html → Dữ liệu → Xoá (gõ `XOA DU LIEU`). |

## 5. Cập nhật từ bản đợt 1

1. Chép đè toàn bộ thư mục web, **giữ lại `config.js` của bạn** (hoặc chép lại hai dòng `SUPABASE_URL`, `SUPABASE_ANON_KEY` sang file mới — file mới có thêm khu `lib_c` sân thượng và bỏ D3/D5/D7/C7).
2. Trong Supabase → SQL Editor, chạy lại `supabase/schema.sql` (chạy lại nhiều lần vẫn an toàn). Bản này thêm: trạng thái "đang chơi đàn / ngắm sao" (không tính giờ học), cột vị trí cho tin "Gần tôi", hàm `send_dm` cho nhắn riêng và quyền để người gửi đọc lại tin riêng của mình. Câu mẫu nhắn riêng và bán kính "Gần tôi" sửa ở trang Quản trị → Thiết đặt. Phần 4 thêm: cột ví sao / điểm tình nguyện ảo / giấy hái xoài trong bảng `profiles`, các hàm `buy_item`, `pick_trash`, `claim_mango`, và trạng thái 🌳 "Dạo chơi" (không tính giờ).
3. File sân trước `scene/exterior/thu-vien-ta-quang-buu.glb` nặng khoảng 9,4 MB. Hosting tĩnh (Netlify, Vercel, GitHub Pages, Cloudflare Pages) phục vụ được; nên bật nén gzip/brotli nếu dịch vụ cho chọn.
4. **Chế độ quan sát cho ban tổ chức:** mở `index.html?quan-sat`, vào phòng như thường, bấm nút **👁️ Quan sát** và nhập mật khẩu quản trị. Camera bay tự do; bấm "Thoát" để trở lại nhân vật. Người học bình thường không thấy nút này, và nếu tự gõ địa chỉ thì vẫn cần mật khẩu.
5. Nhân vật cũ (khối chibi) của người dùng đợt 1 được thay bằng nhân vật mới cố định theo tài khoản; họ có thể vào **Của tôi → 👕 Đổi trang phục** để tự chọn lại.

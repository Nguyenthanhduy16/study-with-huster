# Server realtime trên Railway

Kiến trúc:

| Phần | Chạy ở đâu |
|---|---|
| Giao diện (HTML, JS, mô hình 3D) | Cloudflare Pages (xem `HUONG_DAN_CLOUDFLARE.md`) |
| **Realtime: vị trí, cử chỉ, ai đang online, đàn piano** | **Railway** — `server/server.js` |
| Đăng nhập, dữ liệu, tin nhắn, bảng xếp hạng, quản trị | Supabase (như cũ) |

Server Railway kiểm tra vé đăng nhập bằng chính Supabase (`/auth/v1/user`), nên **không cần khoá bí mật**. Server tự gắn mã người dùng thật vào mọi tin: không ai giả vị trí hay cử chỉ của người khác được.

Để trống `REALTIME_URL` trong `config.js` thì web dùng Supabase Realtime như trước — chuyển qua lại không mất dữ liệu.

## Bước 1. Tạo service trên Railway

1. Railway → dự án của bạn (có thể dùng chung dự án với web CLB) → **+ Create** → **GitHub Repo** → chọn `study-with-huster`.
2. Mở service vừa tạo → **Settings**:
   - **Root Directory**: `/server`
   - **Watch Paths**: `/server/**` (chỉ deploy lại khi sửa server — mỗi lần deploy mọi người bị ngắt vài giây rồi tự nối lại)
   - **Region**: Southeast Asia (Singapore)
   - **Healthcheck Path**: `/health`
   - Start command để mặc định (`npm start`).
3. **Variables** → thêm:

   | Tên | Giá trị |
   |---|---|
   | `SUPABASE_URL` | `https://gxiryzkmntbgbfrigwdc.supabase.co` |
   | `SUPABASE_ANON_KEY` | khoá publishable trong `config.js` (công khai) |
   | `ALLOWED_ORIGINS` | `https://studywithhuster.cyou,https://www.studywithhuster.cyou,https://hoc-online-huster.pages.dev,https://*.hoc-online-huster.pages.dev,https://hoc-online-huster.netlify.app` |

   Không dán khoá `service_role` / `secret` — server không cần.
4. **Settings → Networking → Generate Domain**. Railway cấp địa chỉ dạng `xxx.up.railway.app`.
5. Mở `https://xxx.up.railway.app/health` → phải thấy `ok`. `https://xxx.up.railway.app/stats` cho số kết nối, số người online, số tin đã chuyển.
6. **Usage Limits** của workspace: đặt giới hạn chi (ví dụ 10 USD) để tránh hoá đơn bất ngờ.

## Bước 2. Bật trong web

Sửa `config.js`:

```js
window.REALTIME_URL = 'wss://xxx.up.railway.app';
```

Commit/merge ⇒ Cloudflare Pages tự deploy. CSP đã cho phép `wss://*.up.railway.app`. Nếu gắn tên miền riêng cho server (ví dụ `rt.studywithhuster.cyou`), thêm `wss://rt.studywithhuster.cyou` vào `connect-src` trong `netlify.toml` (Cloudflare lấy cấu hình từ file này).

## Bước 3. Kiểm tra

- Mở web trên 2 máy: thấy nhau đi lại, vẫy tay, số "đang học" đúng.
- F12 → Console: `__potaNet.rtMode` phải là `'railway'`.
- `https://xxx.up.railway.app/stats`: `users` bằng số người đang mở web.

## Chi phí ước tính (gói Hobby 5 USD/tháng đã gồm 5 USD sử dụng)

- RAM: server dùng khoảng 40–80 MB ⇒ ~0,5 USD/tháng.
- Băng thông ra (0,05 USD/GB): tin vị trí chỉ gửi khi đang đi và chỉ tới người cùng khu. Ví dụ 30 người cùng sảnh, 5 người đang đi ⇒ khoảng 130 MB/giờ; học vài giờ mỗi ngày ⇒ 5–15 GB/tháng ⇒ 0,25–0,75 USD.
- Tổng thường **dưới 2 USD/tháng**, nằm trong 5 USD có sẵn (dùng chung với web CLB).

## Lưu ý

- Tin nhắn chat, thông báo, nhắn riêng vẫn dùng Realtime của Supabase, nên mỗi người vẫn mở **một** kết nối tới Supabase. Giới hạn kết nối cùng lúc của gói Supabase Free (khoảng 200) vẫn áp dụng; phần giảm được là **số tin Realtime** (vị trí/cử chỉ/hiện diện/đàn chiếm phần lớn).
- Server giữ trạng thái trong bộ nhớ: chạy **một bản duy nhất** (không bật nhiều replica).

## Thử trên máy phát triển

```bash
npm --prefix server ci
node tools/kiem_tra_nhieu_nguoi.mjs --railway
```

Bài thử chạy 3 trình duyệt qua Supabase giả lập + server realtime thật, có cả bước khởi động lại server. `npm test` có bài thử riêng cho server (`tools/realtime-server.test.mjs`).

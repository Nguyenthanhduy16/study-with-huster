# Chuyển hosting sang Cloudflare Pages

Cloudflare Pages phục vụ web tĩnh **miễn phí, không giới hạn băng thông và số request**. Web này là web tĩnh hoàn toàn: phần nhiều người chơi chạy qua Supabase, nên chuyển hosting **không ảnh hưởng dữ liệu, tài khoản hay giờ học**.

Cấu hình bảo mật và bộ nhớ đệm vẫn viết trong `netlify.toml`. Lệnh `npm run build:cloudflare` chép phần web vào `dist/` và tự sinh `dist/_headers` cho Cloudflare từ file đó, nên chỉ có một nơi cần sửa.

## Bước 1. Tạo dự án Cloudflare Pages

1. Đăng ký hoặc đăng nhập <https://dash.cloudflare.com> (gói Free).
2. Vào **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git**.
3. Kết nối GitHub, chọn repo **study-with-huster** → **Begin setup**.
4. Điền:

   | Ô | Giá trị |
   |---|---|
   | Project name | `hoc-online-huster` (thành địa chỉ `hoc-online-huster.pages.dev`) |
   | Production branch | `main` |
   | Framework preset | **None** |
   | Build command | `npm run build:cloudflare` |
   | Build output directory | `dist` |
   | Root directory | để trống |

   Không cần biến môi trường. `config.js` đã chứa địa chỉ và khoá công khai của Supabase.
5. **Save and Deploy**. Khoảng 1 phút sau có địa chỉ `https://hoc-online-huster.pages.dev`.

## Bước 2. Thử bằng địa chỉ `.pages.dev`

- Mở địa chỉ trên máy tính và điện thoại, đăng nhập, vào thư viện, thử chat và vẫy tay.
- Người dùng trên `.pages.dev` và trên tên miền cũ (Netlify) **thấy nhau bình thường**, vì cùng dùng Supabase.
- Mở F12 → Console: không được có lỗi đỏ về `Content-Security-Policy`.

## Bước 3. Chuyển tên miền `studywithhuster.cyou`

Muốn dùng tên miền gốc (không có `www`) cho Cloudflare Pages, tên miền phải dùng **nameserver của Cloudflare** (miễn phí). Trong lúc chờ đổi nameserver, web vẫn chạy trên Netlify, không bị gián đoạn.

1. Cloudflare → **Add a domain** (hoặc *Add a site*) → nhập `studywithhuster.cyou` → chọn gói **Free**.
2. Cloudflare tự quét và nhập các bản ghi DNS hiện có (A `75.2.60.5`, CNAME `www`). Bấm tiếp.
3. Cloudflare đưa **2 nameserver**, dạng `xxx.ns.cloudflare.com`. Vào **Nicnames** → tên miền → mục **Name-Servers** → **Manage** → chọn dùng nameserver riêng → thay `ns10/11/12.nicnames.com` bằng 2 nameserver của Cloudflare → lưu.
4. Chờ Cloudflare báo tên miền **Active** (thường vài phút tới vài giờ; Cloudflare gửi email báo).
5. Vào dự án Pages → **Custom domains** → **Set up a custom domain** → nhập `studywithhuster.cyou` → **Activate domain**. Làm thêm lần nữa với `www.studywithhuster.cyou`. Cloudflare tự sửa bản ghi DNS sang Pages và tự cấp HTTPS.
6. Nếu Cloudflare báo trùng bản ghi: vào **DNS → Records**, xoá bản ghi A `75.2.60.5` (trỏ Netlify) và CNAME `www` → `hoc-online-huster.netlify.app`, rồi thêm lại tên miền ở bước 5.

Không bật **Rocket Loader** trong cài đặt tốc độ của Cloudflare (mặc định tắt): tính năng này đổi thứ tự tải script và làm hỏng cảnh 3D.

## Bước 4. Dừng Netlify (sau khi tên miền mới chạy ổn vài ngày)

- Netlify → dự án → **Site configuration → Build & deploy → Continuous deployment → Stop builds**. Mỗi lần merge PR, Netlify không deploy nữa (mỗi lần deploy tốn khoảng 15 credit).
- Netlify → **Domain management**: gỡ `studywithhuster.cyou`.
- Giữ `netlify.toml` trong repo: Cloudflare vẫn lấy cấu hình header từ file này.

## Supabase

Không cần sửa gì. CSP đã cho phép `*.supabase.co`. Nếu muốn, vào **Authentication → URL Configuration** đặt *Site URL* thành `https://studywithhuster.cyou`.

## Kiểm tra trên máy phát triển

```bash
npm run build:cloudflare
npx wrangler pages dev dist
```

Lệnh thứ hai chạy giả lập Cloudflare Pages tại `http://localhost:8788` (áp dụng `_headers` như thật).

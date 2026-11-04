# Hợp đồng cảnh 3D — cách thay mô hình chi tiết hơn

Web Phòng ôn thi ảo **không đụng trực tiếp** vào mô hình 3D. Mọi thứ đi qua một lớp trung gian tên là `SceneAPI`, nằm trong file `scene/adapter.js`.

Vì vậy, khi bạn làm xong bản mô hình chi tiết hơn, chỉ cần **thay nội dung thư mục `scene/`**. Toàn bộ phần web (đăng nhập, xếp hạng, câu hỏi, chat, quản trị…) giữ nguyên.

```
web (js/world.js, js/app.js)
        │  chỉ dùng SceneAPI
        ▼
scene/adapter.js  ← "hợp đồng": danh sách khu, ghế, cửa, va chạm, camera
        │
        ▼
scene/hust3d.js   ← mô hình 3D (tự sinh từ hust-3d/index.html bằng tools/patch_scene.py)
```

---

## 1. Bốn phần cảnh và hợp đồng

| Không gian | Nguồn | Cách đưa vào web |
|---|---|---|
| `campus` — sân trước thư viện | File GLB của bạn: `scene/exterior/thu-vien-ta-quang-buu.glb` | `adapter.js` tải trực tiếp. Lưới đi bộ tính sẵn trong `luoi-di-chuyen.json` |
| `A` — thư viện tầng 1–4, phòng 401 | `hust-3d/index.html` (module A) | `tools/patch_scene.py` → `scene/hust3d.js` |
| `B` — tầng 6–7 (đàn piano) | `hust-3d/index.html` (module B) | như trên |
| `D` — sân thượng tầng 10 | Trang "Sân thượng tầng 10" | `tools/patch_tang10.py` → `scene/tang10.js` |

Mỗi không gian trong `SceneAPI.spaces` có:

| Thành phần | Ý nghĩa |
|---|---|
| `seats[{x,y,z,ry,kind}]` | Mọi chỗ ngồi: `chair`, `sofa`, `arm`, `bench`, `piano`, `lounger`, `beanbag` |
| `floors`, `floorOf(y)`, `ceil(floor)` | Các mặt sàn **tính bằng độ cao (m)** ở mọi không gian (tầng 6–7 cũng vậy, adapter tự đổi sang số tầng 6/7/10 của mô hình), mặt sàn ứng với độ cao chân, độ cao trần |
| `grid(floor)` | Lưới đi bộ của một mặt sàn (`js/grid.js`): tìm đường A*, bản đồ nhỏ |
| `free(x,z,floor)` / `camFree(x,z,base)` / `solid(x,y,z)` | Chân đứng được không / camera đặt được không / điểm nằm trong toà nhà (sân) |
| `place(x,y,z)` | Tên vị trí dễ hiểu: "Phòng 401", "Tầng 6", "Tầng 10 · Đài ngắm sao"… |
| `walkNow(x,y,z,yaw)`, `stopWalk()` | Đi bộ bằng bộ đi bộ có sẵn của mô hình (web đặt camera sau lưng) |
| `sitPiano()` (B), `scope()` / `gaze(x,z)` / `leave()` (D) | Chế độ đặc biệt do mô hình tự điều khiển camera |

Ngoài ra: `SceneAPI.enter(id, text, arr)`, `setNight(t)`, `setDoor(t)` (cửa kính mặt tiền), `onFrame / afterFrame`, sự kiện `exit-library` (đi ra cửa chính) và `space-changed` (đi thang máy A ⇄ B). Thang máy lên tầng 10 do `js/world.js` chuyển sang không gian D.

Các khu trong `config.js` (`ZONES`) trỏ tới các không gian trên: `campus`, `lib_a → A`, `lib_b → B`, `lib_c → D`.

---

## 2. Cập nhật từng phần

**Mô hình thư viện (hust-3d mới):**
```bash
python3 tools/patch_scene.py ../hust-3d-moi scene
```
Công cụ chèn các "móc" (ghế, camera, độ nhạy, tốc độ đi, API, chỗ gắn sân thượng). Nếu bản mới đổi cấu trúc, nó **dừng lại và báo móc nào hỏng**.

**Sân thượng tầng 10 (khi bạn sửa trang sân thượng):** lưu trang thành `tools/nguon/tang10.html` rồi chạy
```bash
python3 tools/patch_tang10.py
```

**Sân trước (file GLB mới):**
1. Chép đè `scene/exterior/thu-vien-ta-quang-buu.glb` (giữ đơn vị mét, mặt tiền nhìn về +Z, mặt đất y = 0; giữ tên `GheDai_*`, `CayXoai_*`, `KimGio/KimPhut/KimGiay`, hoạt cảnh cửa `MoCuaChinh`).
2. Mở `tools/tao_luoi_san.html` qua máy chủ nhỏ, bấm tải về `luoi-di-chuyen.json` và chép vào `scene/exterior/`. (Nếu quên, web tự tính lại lúc mở, chậm hơn vài giây.)
3. Nếu cửa chính dời chỗ, sửa `SceneAPI.buildings` và hộp `EXT.solids` trong `scene/adapter.js`.

**Phòng thay đồ (khi bạn sửa trang Phòng thay đồ):** chép các file mới vào `avatar/src/` (giữ phần sửa cho Three r128 — xem chú thích `[r128]` trong `rig.js`, `textures.js`, `studio.js` và đoạn `EMBED` trong `main.js`), rồi
```bash
npm i esbuild@0.21.5 && node tools/build_avatar.mjs
```
để tạo lại `avatar/avatar-kit.js` và `avatar/phong-thay-do.js`.

**Sau mỗi lần cập nhật:** mở `tools/kiem_tra_canh.html` qua máy chủ nhỏ (`python3 -m http.server`), phải hiện **"Đạt yêu cầu"**; rồi mở `index.html` chơi thử: sân → cửa → các tầng → thang máy → tầng 10 → ngồi ghế, đàn, kính thiên văn.

---

## 3. Prompt gửi cho bên làm mô hình 3D

Gửi kèm file này (`HOP_DONG_CANH.md`) và zip mô hình hiện tại:

> Đây là mô hình 3D khuôn viên Bách Khoa + Thư viện Tạ Quang Bửu đang dùng cho web "Phòng ôn thi ảo", kèm file HOP_DONG_CANH.md mô tả những gì web cần. Hãy nâng cấp mô hình chi tiết hơn (hoặc thêm phòng tầng 10) nhưng phải GIỮ NGUYÊN:
> 1. Three.js r128, cấu trúc 3 module A (tầng 1–4 + phòng 401), B (tầng 6–7), C (khuôn viên, web hiện dùng file GLB sân trước thay cho phần này), file index.html ghép sẵn và thư mục vendor/.
> 2. Mọi chỗ ngồi đặt bằng hàm `place('chair…'|'sofa…'|'arm…', x, y, z, ry)`; phòng 401 vẫn dựng trong `buildRoom401(renderer, roomG)`; đàn piano vẫn là `PIANO` với hàm `sit()`/`standUp()`.
> 3. Các tên/hàm: `moduleA/B/C(ctx, root)`, `Object.assign(ME, {floors:…, group:scene, lights, …})`, `hitC(x,z)`, `LIB`, `viewPose`, `flyTo`, `enterWalk`, `setMode`, `nightTarget`, `ctx.enterLibrary/exitLibrary`, dòng `ctx.world.background=scene.background;renderer.render(ctx.world,camera);` ở cuối hàm frame của mỗi module, và hàm `boot()` ở cuối file.
> 4. Giữ hàm `surface(x,z,cur)` (tầng 1–4), `blocked(x,z,cx,cz)` và `groundY` (tầng 6–7), bộ đi bộ dùng `yaw`, `pitch`, `keys`, `eyeY`; cửa chính tầng 1 vẫn ở z ≈ 13.
> 5. Tối ưu cho laptop tầm trung: dùng InstancedMesh cho vật lặp lại, bóng đổ cập nhật một lần, không tạo vật thể mới mỗi khung hình.
> Giao file zip cùng cấu trúc thư mục cũ, kèm danh sách những gì đã thay đổi.

---

## 4. Prompt đưa mô hình mới vào web (cho AI lập trình như Claude)

Gửi kèm zip mô hình mới và zip web hiện tại:

> Đây là web "Phòng ôn thi ảo" (zip 1) và bản mô hình 3D mới (zip 2). Hãy thay lớp cảnh của web bằng mô hình mới theo docs/HOP_DONG_CANH.md:
> 1. Chạy `python3 tools/patch_scene.py <thư mục mô hình mới> scene`. Nếu móc nào không khớp, sửa `tools/patch_scene.py` (KHÔNG sửa tay `scene/hust3d.js`) cho tới khi chạy được.
> 2. Cập nhật `scene/adapter.js` nếu số ghế, toạ độ cửa hoặc mặt sàn thay đổi; nếu là sân thượng thì dùng `tools/patch_tang10.py`, nếu là sân trước (GLB) thì tính lại lưới bằng `tools/tao_luoi_san.html`.
> 3. Mở `tools/kiem_tra_canh.html` và sửa cho tới khi báo "Đạt yêu cầu". Đo tốc độ khung hình trước/sau.
> 4. Chơi thử: bấm để đi tới, ngồi từng loại ghế, đứng dậy, đi thang máy lên tầng 10 và xuống, đàn, kính thiên văn, bản đồ nhỏ, ra sân, câu hỏi chung, trên cả khung điện thoại.
> 5. Không đổi logic trong `js/` ngoài những gì cần cho cảnh mới. Báo lại những gì đã thay, chỗ nào chưa khớp, và kết quả kiểm tra.

---

## 5. Cách bền vững hơn (khuyến nghị cho bản sau)

Công cụ vá hiện dò theo từng dòng mã của mô hình, nên nếu mô hình bị viết lại hoàn toàn thì phải sửa công cụ. Lâu dài, nên yêu cầu bên làm mô hình **tự xuất ra `window.HUST3D`** với các trường giống bản đã vá, gồm:
- `A`, `B`, `C`, mỗi module có `api: { camera, controls, scene, … }` và `onFrame`;
- `ctx`, `renderer`, `show`.

Khi đó `adapter.js` dùng được ngay, không cần vá. Một hướng khác là xuất từng toà thành file `.glb` với các điểm mốc đặt tên chuẩn (`SEAT_401_001`, `DOOR_D3`…) để web tự đọc.

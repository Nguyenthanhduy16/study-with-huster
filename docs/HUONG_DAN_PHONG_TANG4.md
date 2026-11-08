# Dựng các phòng tầng 4 (theo sơ đồ thư viện)

Nguồn: sơ đồ tầng chính thức của thư viện (`library.hust.edu.vn/en/node/509`, tệp *2022. Sơ đồ tầng TV.pdf*, trang 4) và ảnh chụp P419.
Trang thư viện chỉ có ảnh mặt ngoài; ảnh bên trong các phòng tầng 4 chưa tìm được trên mạng. Nếu có ảnh chụp thật của từng phòng, gửi vào để chỉnh chi tiết.

| Phòng | Chức năng (theo thư viện) | Vị trí trên sơ đồ | Trong cảnh 3D (module A) | Trạng thái |
|---|---|---|---|---|
| 401 | Phòng tự học / XLTT | dưới, giữa | sau tường `back` (z < −13) | có sẵn |
| 419 | Phòng đọc chuyên ngành T – TJ | giữa, bên phải | phía `x > 19,5` (sau tường phải, quanh khối thang máy) | **đã làm** |
| 402 | Phòng đọc chuyên ngành A – P | giữa, bên trái | phía `x < −19,5` (sau tường trái) | chưa làm |
| 411 | Phòng đọc chuyên ngành Q – S | trên, giữa (phòng rộng nhất, có hàng cột) | phía `z > 13` (sau tường `front`) | chưa làm |
| 404 | Phòng báo, tạp chí / hỗ trợ nghiên cứu | góc trên trái (nhỏ) | góc `x < −19,5`, `z > 9` | chưa làm |
| 418 | Phòng tự học | góc trên phải (nhỏ) | góc `x > 19,5`, `z > 9` | chưa làm |

Tỉ lệ: sảnh trong cảnh rộng 39 m ứng với khoảng 350 px trên sơ đồ, tức khoảng **0,11 m/px**. Vì vậy 402 và 419 có kích thước khoảng 17 × 19 m, 411 khoảng 30 × 15 m, còn 404 và 418 khoảng 9 × 13 m.

## P419 đã làm thế nào (mẫu cho các phòng khác)

Mọi thứ nằm trong `scene/hust3d.js`, module A:

1. **Hằng số phòng** cạnh `BRM`:
   `const R4={x0:XW,x1:XW+17,z0:-9.5,z1:9.5,h:3.6,dh:2.7,doors:[[-8.4,-6.2],[6.2,8.4]],core:{x1:XW+2.45,z:3.6}}`
   Hai cửa ở tường phải, ở phía bắc và phía nam khối thang máy. `core` là khối giếng thang máy nhô vào phòng.
2. **Khoét cửa trên tường sảnh**: trong vòng lặp dựng tường mỗi tầng, hàm `run(a,b)` cắt các khoảng `R4.doors` khi `lv===4` và thêm lanh tô phía trên. Biển cửa giả và cửa sổ giả cũ của tầng 4 đã bỏ (`if(lv<4)`).
3. **Khối dựng phòng** (sau khối "wing" của phòng 401, trước `buildProps()`):
   - Sàn và trần được ghép từ 3 mảnh để chừa giếng thang. Trần nằm trong nhóm `c419`, tự ẩn khi camera lên cao hơn trần.
   - Tường trong là mặt đơn quay vào phòng. Vỏ ngoài là `wm`, quay ra ngoài.
   - Tường đông có cửa sổ (`winM`) và rèm xanh.
   - Trần có đèn LED tấm và quạt trần (`fans419`, quay trong vòng lặp khung hình).
   - Có cột tròn, tủ sách gỗ (`shelf`, sách nạp vào `books` dùng chung) và các dãy bàn dài. Ghế đặt bằng `place('chairB',x,y0,z,ry)`: `ry=0` quay mặt về +z, `ry=PI` quay về −z.
   - `window.__SEATTAG="r419"` trong lúc đặt ghế, để `scene/adapter.js` gắn `room:'419'` cho các ghế.
   - Va chạm: `cols419` gồm hình tròn `[x,z,r]` hoặc chữ nhật `[x0,x1,z0,z1]`.
4. **Đi bộ**:
   - `surface()`: nhánh `lvl===4&&x>XW-.35` cho đi qua khe cửa (`inDoor4`) và trong phòng, trừ `core` và `cols419`.
   - `cameraInside()`: thêm nhánh tương tự.
   - `liftAt()`: chỉ nhận vùng `x < R4.core.x1`, để vùng phòng cạnh giếng thang không bị coi là thang máy.
5. **`scene/adapter.js`**: nới `bx` của khu A thành `[-32, 38]` (lưới tìm đường), `place()` trả `'Phòng 419'`, và ghế mang tag `r419` được gắn `room: '419'`. `where()` trong module A cũng hiện "Phòng 419 · tầng 4".

## Làm tiếp các phòng còn lại

### P402 (đối xứng P419 qua trục x = 0)
- Hằng số: `R2={x0:-XW-17,x1:-XW,z0:-9.5,z1:9.5,...}`. Phía tường trái không có thang máy, nên không cần `core`.
- **Xung đột**: phòng mượn sách tầng 1 (`BRM`) cũng ở phía `x < −XW`, nhưng chỉ ở tầng 1. Các nhánh `surface`/`cameraInside` của P402 phải kiểm `lvl===4` (BRM kiểm `cur<.3`, nên không đụng nhau).
- Tường trái tầng 4 hiện là một tấm liền: `onWall('left',0,y0+FH/2,ZF-ZB,FH,...)`. Cần tách thành nhiều đoạn chừa cửa (làm giống `run`), và bỏ các mảng trang trí `W('left',-6,…roomM)`, `W('left',6,…doorM)`, `W('left',10,…winM)` ở `lv===4`.
- Nội thất: phòng đọc chuyên ngành, nhiều giá sách (có thể đặt 3–4 hàng giá đứng song song giữa phòng) và bàn đọc.

### P411 (sau tường front, z > 13)
- Kích thước khoảng 30 × 15 m: `x∈[-15,15]`, `z∈[13, 28]`. Sơ đồ có hàng cột tròn dọc mép phòng giáp sảnh.
- Tường front tầng 4 cần khoét 1 cửa ở giữa (sơ đồ có cửa giữa, nơi có quầy). Bỏ các ô cửa sổ giả `W('front',x,…winM)` khi `lv===4`.
- Nới `bz` trong adapter thành `[-40, 30]`. `surface()`/`cameraInside()` hiện chặn `z>ZF-.4`: cần thêm nhánh `lvl===4&&z>ZF-.4` trước dòng chặn.
- Chú ý mặt tiền ngoài (GLB của khuôn viên): khu A là cảnh riêng, nên không đụng.

### P404 và P418 (hai góc phía trên)
- Khoảng 9 × 13 m, ví dụ P418: `x∈[XW, XW+9]`, `z∈[10, 23]`. Lối vào từ hành lang của P411 hoặc từ P419. Nếu làm sau P411, có thể mở cửa từ hành lang trong P411.
- Tường giáp P419 (z = 9,5) phải ghép đúng với `R4.z1`.

### Kiểm tra sau mỗi phòng
```bash
npm run check && npm test
```
Chụp ảnh cảnh bằng Playwright (Chromium có sẵn, cờ `--use-angle=swiftshader`): đăng nhập bằng máy chủ giả `node tools/fake-supabase-server.mjs --port=3177 --offline`, vào khu A, rồi gọi `HUST3D.A.api.walkNow(new THREE.Vector3(x, 3*4.5+1.6, z), yaw)` để đứng trong phòng. Hướng nhìn là `(sin yaw, −cos yaw)`.
Kiểm `HUST3D.A.api.surface(x,z,3*4.5)` tại khe cửa (phải khác `null`) và trên bàn (phải là `null`), và `SceneAPI.spaces.A.seats.filter(s=>s.room==='419').length`.

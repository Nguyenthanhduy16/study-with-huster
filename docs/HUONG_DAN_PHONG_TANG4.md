# Dựng các phòng tầng 4 (theo sơ đồ thư viện)

Nguồn: sơ đồ tầng chính thức của thư viện (`library.hust.edu.vn/en/node/509`, tệp *2022. Sơ đồ tầng TV.pdf*, trang 4) và ảnh chụp P419.
Ảnh bên trong phòng đọc chuyên ngành lấy từ bài giảng *Hướng dẫn sử dụng thư viện* trên trang hust.edu.vn (tệp `tme-09-02-07-bai-giang-huong-dan-su-dung-thu-vien…pdf`, trang 48–50). Ảnh cho thấy cột tròn lớn đầu loe, quạt trần xanh ngọc, đèn huỳnh quang dạng hộp, bàn dài màu be với ghế xanh, tủ sách gỗ và giá sắt xám, cửa kính có cổng an ninh. Trang thư viện chỉ có ảnh mặt ngoài.

| Phòng | Chức năng (theo thư viện) | Vị trí trên sơ đồ | Trong cảnh 3D (module A) | Trạng thái |
|---|---|---|---|---|
| 401 | Phòng tự học / XLTT | dưới, giữa | sau tường `back` (z < −13) | có sẵn |
| 419 | Phòng đọc chuyên ngành T – TJ | giữa, bên phải | phía `x > 19,5` (sau tường phải, quanh khối thang máy) | **đã làm** |
| 402 | Phòng đọc chuyên ngành A – P | giữa, bên trái | phía `x < −19,5` (sau tường trái) | **đã làm** |
| 411 | Phòng đọc chuyên ngành Q – S | trên, giữa (phòng rộng nhất, có hàng cột) | phía `z > 13` (sau tường `front`) | **đã làm** |
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

### P402 (đã làm)
- Hằng số `R2` nằm cùng dòng với `BRM` và `R4`. Phòng ở `x∈[−36,5; −19,5]`, `z∈[−9,5; 9,5]`, có hai cửa ở tường trái của sảnh tầng 4.
- Nửa phía tây có 6 dãy giá sách hai mặt, nửa giáp sảnh có 5 bàn đọc dài. Bàn thủ thư đặt cạnh cửa bắc, cửa sổ rèm xanh ở tường tây.
- Các phòng dùng chung hàm `shelf4`, `table4`, `fan4`, `window4`, `slab4`, `sign4`, nhóm trần `ceil4` và mảng quạt `fans4`. Phòng mới chỉ cần gọi các hàm này.
- Phòng mượn sách tầng 1 (`BRM`) cũng ở phía tây, nhưng mọi nhánh của P402 đều kiểm `lvl===4`, nên hai phòng không ảnh hưởng nhau.

### P411 (đã làm)
- Hằng số `R11={x0:-15,x1:15,z0:ZF,z1:ZF+15,h:3.9,door:[-1.6,1.6]}` nằm cùng dòng với `BRM`. Cửa duy nhất nằm giữa tường trước của sảnh tầng 4, hai bên là vách kính, có cổng an ninh.
- Bên trong làm theo ảnh "Phòng đọc chuyên ngành":
  - 8 cột tròn đầu loe, có quạt treo trên cột;
  - quạt trần xanh ngọc, đèn huỳnh quang dạng hộp;
  - 3 hàng bàn dài × 4 bàn (144 chỗ ngồi), chừa lối đi giữa từ cửa vào;
  - tủ sách gỗ ở tường cuối, giá sắt xám ở hai tường bên, bàn trực cạnh cửa.
- Phòng không có vỏ ngoài, để góc nhìn "Toàn cảnh" (camera ở phía trước toà nhà) không bị che.
- Nhánh `surface`/`cameraInside` của P411 kiểm `lvl===4 && z>ZF && |x|<XW`. Trong adapter, `bz` được nới thành `[-40, 30]`.

### P404 và P418 (hai góc phía trên)
- Khoảng 9 × 13 m, ví dụ P418: `x∈[XW, XW+9]`, `z∈[10, 23]`. Lối vào từ hành lang của P411 hoặc từ P419. Nếu làm sau P411, có thể mở cửa từ hành lang trong P411.
- Tường giáp P419 (z = 9,5) phải ghép đúng với `R4.z1`. P418 nằm ở góc `x > 15`, `z > 13`, nên không đụng P411 (P411 kết thúc ở x = 15).

### Kiểm tra sau mỗi phòng
```bash
npm run check && npm test
```
Chụp ảnh cảnh bằng Playwright (Chromium có sẵn, cờ `--use-angle=swiftshader`): đăng nhập bằng máy chủ giả `node tools/fake-supabase-server.mjs --port=3177 --offline`, vào khu A, rồi gọi `HUST3D.A.api.walkNow(new THREE.Vector3(x, 3*4.5+1.6, z), yaw)` để đứng trong phòng. Hướng nhìn là `(sin yaw, −cos yaw)`.
Kiểm `HUST3D.A.api.surface(x,z,3*4.5)` tại khe cửa (phải khác `null`) và trên bàn (phải là `null`), và `SceneAPI.spaces.A.seats.filter(s=>s.room==='419').length`.

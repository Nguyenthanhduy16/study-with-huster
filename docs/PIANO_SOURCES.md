# Nhạc có sẵn trong đàn

Chọn bài trong danh sách ở đàn tầng 6, rồi bấm **Nghe mẫu** hoặc **Tập theo**. Không cần nhập tệp. Sáu giai điệu mẫu cũ vẫn giữ; thư viện có 9 bản cổ điển Mutopia, 2 bản hai tay tự nhập từ giai điệu công cộng và 1 trích đoạn từ PDF người dùng gửi. Không bài nào trong danh sách bắt nhập MIDI.

MIDI gốc được lưu nguyên byte dưới dạng Base64 trong `data/piano-library.json`, kèm SHA-256, nguồn, người soạn bản số và thông tin giấy phép. `node tools/build-piano-library.mjs` tạo `js/piano-library.js`; trình duyệt chỉ giải mã/đọc bản được chọn, không gọi máy chủ ngoài để phát nhạc. Bản dựng hiện tại chứa 67.656 byte MIDI trước Base64.

**Nghe mẫu** phát các nốt, hợp âm, khoảng nghỉ, tempo và lực phím trong MIDI qua bộ tiếng đàn hiện có; đây là nhạc tổng hợp, không phải bản thu âm. Nốt tiếp tục đi qua kênh piano nhiều người. **Tập theo** chọn nốt cao nhất tại mỗi thời điểm, không chấm tiết tấu hoặc hợp âm. Đổi bài, rời đàn hoặc ẩn tab sẽ dừng và nhả nốt.

## Nguồn cổ điển

Các bản dưới đây lấy trực tiếp từ [Mutopia Project](https://www.mutopiaproject.org/). Dùng giấy phép riêng của từng bản số hóa; không coi mọi MIDI trên mạng là tài sản công cộng. Ghi công vẫn hiện cạnh bài đang chọn.

| Bản nhạc | Người soạn bản số / nguồn | Giấy phép |
|---|---|---|
| [Für Elise · Beethoven (bản MIDI)](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=931) | Stelios Samelis / Mutopia Project · Mutopia-2015/08/18-931 | [Public Domain](https://www.mutopiaproject.org/legal.html) |
| [Moonlight Sonata · Beethoven (chương I)](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=276) | Stewart Holmes / Mutopia Project · Mutopia-2007/02/11-276 | [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5/) |
| [Pathétique · Beethoven (chương II)](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=295) | Chris Sawer / Mutopia Project · Mutopia-2011/10/25-295 | [Public Domain](https://www.mutopiaproject.org/legal.html) |
| [Turkish March · Mozart](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=108) | Rune Zedeler và Chris Sawer / Mutopia Project · Mutopia-2015/08/13-108 | [Public Domain](https://www.mutopiaproject.org/legal.html) |
| [Sonata Facile K.545 · Mozart (chương I)](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=998) | Alejandro Sierra / Mutopia Project · Mutopia-2013/09/01-998 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| [Minuet in G · Petzold](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=75) | Allen Garvin / Mutopia Project · Mutopia-2017/01/19-75 | [Public Domain](https://www.mutopiaproject.org/legal.html) |
| [Prelude in C BWV 846 · Bach](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=5) | Tobias Erbsland / Mutopia Project · Mutopia-2011/09/12-5 | [Public Domain](https://www.mutopiaproject.org/legal.html) |
| [Prelude Op.28 No.7 · Chopin](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=470) | Magnus Lewis-Smith / Mutopia Project · Mutopia-2015/01/17-470 | [Public Domain](https://www.mutopiaproject.org/legal.html) |
| [Gymnopédie No.1 · Satie](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=37) | Evin Robertson / Mutopia Project · Mutopia-2014/12/14-37 | [Public Domain](https://www.mutopiaproject.org/legal.html) |

Moonlight dùng nguyên tệp `moonlight1.mid` trong gói ZIP của Mutopia; không gồm chương II/III. Với các bản CC BY-SA, dữ liệu âm nhạc giữ giấy phép tương ứng (2.5 hoặc 3.0); mã trình phát và các dữ liệu khác không được gán lại giấy phép nhạc. Không sửa các byte MIDI gốc; Base64 chỉ đổi cách đóng gói. Việc rút nốt để tập là thao tác khi chạy; nguồn và giấy phép bản nhạc vẫn đi kèm. Các tác phẩm được cung cấp theo điều kiện “as-is” của nguồn.

Minuet BWV Anh.114 nằm trong thư mục Bach của nguồn Mutopia; giao diện ghi Petzold theo cách quy tác giả hiện nay. Bản âm nhạc đóng gói chính là bản Allen Garvin của Mutopia, không thay bằng một bản phối khác.

## Hay trao cho anh

Người dùng cung cấp `htca.pdf` (3 trang). Thư viện chỉ chép **trang 1, dòng nhạc đầu, ô nhịp 1–4**, hai tay, nhịp 4/4, tốc độ 96 BPM, hóa biểu sáu dấu giáng: 33 nốt trong 10 giây. Không phải toàn bài hoặc một đoạn được tự gán nhãn “điệp khúc”. Giữ nốt nối và bè trầm; lực phím phát lại 82/127 tay phải, 60/127 tay trái do bản phổ không ghi dynamics; không tự thêm pedal.

Bản nguồn do người dùng gửi, không được gán nhãn Public Domain hoặc Creative Commons. PDF gốc không nằm trong repo. Dữ liệu chép ở `data/hay-trao-cho-anh-excerpt.json`; `tools/build-score-midi.mjs` tạo MIDI tái lập được. Mã SHA-256 của PDF nguồn và MIDI nằm trong catalog để đối chiếu; kiểm thử so byte MIDI sinh ra với bản nhúng.

Bản này thay đúng mục “Hãy trao cho anh” trước đây chỉ có tên và yêu cầu nhập MIDI. Trong đàn không hiện dòng ghi công/nguồn cho bài này; thông tin nguồn chỉ ghi ở tài liệu này. Ba tên hiện đại khác (Em của ngày hôm qua, Chúng ta của hiện tại, Xe đạp) đã bỏ khỏi danh sách vì không có bản nhạc được phép nhúng; muốn thêm bài, gửi bản phổ để chép như bài này, hoặc dùng nút Nhập MIDI.

## Bản hai tay từ giai điệu công cộng

Hai bản dưới đây do dự án tự nhập nốt (tay phải giai điệu, tay trái đệm), không chép từ bản phối hay bản ghi âm nào. Giai điệu gốc đã thuộc phạm vi công cộng; bản hai tay phát hành theo [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Dữ liệu nốt ở `data/scores/*.json`, dựng MIDI bằng `node tools/build-score-midi.mjs <ra.mid> <bản.json>`; kiểm thử so byte MIDI sinh ra với bản nhúng.

<a id="canon-in-d"></a>
- **Canon in D · Pachelbel** (~1680): Rê trưởng, 4/4, 66 BPM, 17 ô nhịp. Bè trầm lặp 4 lần; giai điệu mở đầu nốt trắng rồi biến tấu nốt đen, kết ở Rê.

<a id="silent-night"></a>
- **Silent Night · Gruber** (Stille Nacht, 1818): chuyển về Đô trưởng, 3/4, 76 BPM, 24 ô nhịp, đủ một lời. Tay trái hợp âm C/F/G/G7.

## Cập nhật thư viện

1. Kiểm tra nguồn, người soạn bản số và giấy phép trước khi thêm.
2. Đưa byte MIDI Base64 và thông tin nguồn/giấy phép vào `data/piano-library.json`; cập nhật SHA-256 và số byte.
3. Chạy `node tools/build-piano-library.mjs`.
4. Chạy `node --test tools/piano-library.test.mjs tools/piano-midi.test.mjs tools/score-midi.test.mjs`.

Không cần gói npm ngoài để dựng thư viện hoặc chạy các kiểm thử này. Dữ liệu MIDI phải qua cùng bộ đọc/giới hạn như tệp nhập riêng.

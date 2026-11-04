// =============================================================
//  CATALOG — toàn bộ dữ liệu đồ. Đây là file bạn sửa nhiều nhất.
//
//  Mỗi món đồ:
//  {
//    id:       'ao-polo-truong',       // duy nhất, dùng để lưu cấu hình
//    slot:     'top',                  // hair|top|bottom|footwear|hat|bag|card|eyewear|mask|audio|handheld
//    name:     'Polo lớp',
//    group:    'truong',               // 'truong' = mang đặc trưng đồng phục trường (hiện nhãn "Data trường")
//    colors:   { main, accent, trim, print, zipper, front, text },
//    palette:  ['#…'],                 // gợi ý màu trong giao diện
//    textures: {                       // ẢNH CỦA BẠN (PNG nền trong suốt là đẹp nhất)
//      front:   'avatar/assets/textures/ao-mat-truoc.png',  // hình in mặt trước
//      back:    'avatar/assets/textures/ao-mat-sau.png',    // hình in lưng
//      pattern: 'avatar/assets/textures/vai-hoa-van.png',   // hoa văn vải lặp lại
//      upper:   'avatar/assets/textures/quai-dep.png',      // (dép) phủ lên quai, vẫn giữ lỗ
//    },
//    accepts:  ['front','back','pattern'],           // ô "Tải ảnh lên" hiện trong giao diện
//    emblem:   'chest-left' | 'chest-center' | 'back' | ...,   // vị trí huy hiệu tự tạo
//    options:  { ... tham số riêng của từng builder ... }
//  }
//
//  [game] Đường dẫn ảnh tính từ gốc web Phòng ôn thi ảo (index.html, phong-thay-do.html) → 'avatar/assets/textures/…'
//
//  Chữ in trên áo (wordmark) và tên trường trên dây đeo lấy từ phần "Huy hiệu"
//  (DEFAULTS.emblem) — mặc định dùng chữ HUST và huy hiệu cách điệu.
// =============================================================

// Bảng màu "đồng phục" — đỏ đậm + kem, gợi không khí áo lớp kỹ thuật
const RED = '#b3141d';
const WINE = '#7a1c26';
const CREAM = '#f6e7c8';
const NAVY = '#1f2a44';

export const SLOTS = [
  { id: 'hair', label: 'Tóc', allowNone: true },
  { id: 'top', label: 'Áo', allowNone: false },
  { id: 'bottom', label: 'Quần · váy', allowNone: false },
  { id: 'footwear', label: 'Giày dép', allowNone: true },
  { id: 'card', label: 'Thẻ SV', allowNone: true },
  { id: 'hat', label: 'Mũ', allowNone: true },
  { id: 'bag', label: 'Balo · cặp', allowNone: true },
  { id: 'eyewear', label: 'Kính', allowNone: true },
  { id: 'mask', label: 'Khẩu trang', allowNone: true },
  { id: 'audio', label: 'Tai nghe', allowNone: true },
  { id: 'handheld', label: 'Đồ cầm tay', allowNone: true },
];

const HAIR_COLORS = ['#1c1714', '#3b2a20', '#5a3a26', '#8a5a36', '#b98a52', '#6d6d72', '#7b2f3a', '#2f3f6b'];
const SCHOOL_TOPS = [RED, WINE, '#f4f2ee', NAVY, '#a9abb0'];

export const ITEMS = [
  // ---------------------------------------------------------------- TÓC
  { id: 'toc-ngan', slot: 'hair', name: 'Tóc ngắn', colors: { main: '#1c1714' }, palette: HAIR_COLORS, options: { style: 'ngan' } },
  { id: 'toc-mai-lech', slot: 'hair', name: 'Mái lệch', colors: { main: '#2b201a' }, palette: HAIR_COLORS, options: { style: 'mai-lech' } },
  { id: 'toc-cua', slot: 'hair', name: 'Đầu cua', colors: { main: '#1c1714' }, palette: HAIR_COLORS, options: { style: 'cua' } },
  { id: 'toc-dau-moi', slot: 'hair', name: 'Đầu moi', colors: { main: '#1c1714' }, palette: HAIR_COLORS, options: { style: 'moi' } },
  { id: 'toc-bob', slot: 'hair', name: 'Tóc bob', colors: { main: '#3b2a20' }, palette: HAIR_COLORS, options: { style: 'bob' } },
  { id: 'toc-dai', slot: 'hair', name: 'Tóc dài', colors: { main: '#1c1714' }, palette: HAIR_COLORS, options: { style: 'dai' } },
  { id: 'toc-buoc', slot: 'hair', name: 'Buộc đuôi ngựa', colors: { main: '#2b201a', accent: '#d24b6a' }, palette: HAIR_COLORS, options: { style: 'buoc' } },
  { id: 'toc-bui', slot: 'hair', name: 'Búi cao', colors: { main: '#3b2a20' }, palette: HAIR_COLORS, options: { style: 'bui' } },

  // ---------------------------------------------------------------- ÁO — phong cách áo trường (data của bạn)
  {
    "id": "ao-polo-truong",
    "slot": "top",
    "group": "truong",
    "name": "Polo cotton HUST đỏ đô",
    "colors": {
      "main": "#a51f28",
      "accent": "#a51f28",
      "trim": "#ffffff",
      "ribAccent": "#101c35",
      "print": "#ffffff"
    },
    "palette": [
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "short",
      "collar": "polo",
      "placket": [
        0,
        0.2
      ],
      "poloTrim": true,
      "wordmark": "chest-left",
      "sleeveEmblem": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo polo cộc tay (Sản phẩm Best Seller học đường)",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-polo-coc-tay-san-pham-best-seller-hoc-duong"
    }
  },
  {
    "id": "ao-thun-truong",
    "slot": "top",
    "group": "truong",
    "name": "Áo thể thao cổ tròn HUST",
    "colors": {
      "main": "#a51f28",
      "trim": "#ffffff",
      "print": "#ffffff"
    },
    "palette": [
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "short",
      "collar": "crew",
      "wordmark": "chest-left",
      "sleeveEmblem": true,
      "shoulderPiping": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo thể thao cổ tròn",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-the-thao-co-tron"
    }
  },
  {
    "id": "ao-khoac-gio",
    "slot": "top",
    "group": "truong",
    "name": "Áo khoác gió HUST có mũ",
    "colors": {
      "main": "#a51f28",
      "trim": "#ffffff",
      "print": "#ffffff",
      "zipper": "#333236"
    },
    "palette": [
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "long",
      "collar": "hood",
      "zipper": true,
      "piping": true,
      "weltPockets": true,
      "hemBand": true,
      "cuffs": true,
      "wordmark": "chest-left",
      "sleeveEmblem": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo khoác gió",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-khoac-gio"
    }
  },
  {
    id: 'ao-khoac-the-thao', slot: 'top', group: 'truong', name: 'Áo khoác thể thao',
    colors: { main: '#c8231f', accent: '#c8231f', trim: '#ffffff', print: '#fff4ea', zipper: '#ffffff' }, palette: ['#c8231f', '#d9481f', NAVY, '#1f5c46'],
    textures: { front: null, back: null }, accepts: ['front', 'back'],
    // 2 sọc tay (không dùng 3 sọc — đó là nhãn hiệu thể thao đã đăng ký)
    options: { sleeve: 'long', collar: 'stand', zipper: true, sleeveStripes: 2, cuffs: true, hemBand: true, arch: true },
  },
  {
    id: 'ao-so-mi-xanh', slot: 'top', group: 'truong', name: 'Sơ mi xanh nhạt',
    colors: { main: '#cfe0f2', accent: '#b8cde6' }, palette: ['#cfe0f2', '#f4f7fb', '#fdf1f3', '#e9f1e4'],
    textures: { front: null, back: null, pattern: null }, accepts: ['front', 'back', 'pattern'],
    emblem: 'chest-left',
    options: { sleeve: 'long', collar: 'shirt', placket: [0, 1], pocket: true, tucked: true, cuffs: true },
  },
  {
    "id": "ao-ni-truong",
    "slot": "top",
    "group": "truong",
    "name": "Sweater HUST xanh tím than",
    "colors": {
      "main": "#101c35",
      "print": "#ffffff"
    },
    "palette": [
      "#101c35",
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "long",
      "collar": "crew",
      "cuffs": true,
      "hemBand": true,
      "wordmark": "chest-big",
      "sleeveEmblem": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo Sweater màu xanh tím than",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-sweater-mau-xanh-tim-than"
    }
  },
  {
    "id": "ao-hoodie-truong",
    "slot": "top",
    "group": "truong",
    "name": "Hoodie HUST đỏ đô",
    "colors": {
      "main": "#a51f28",
      "print": "#ffffff"
    },
    "palette": [
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "long",
      "collar": "hood",
      "kangaroo": true,
      "cuffs": true,
      "hemBand": true,
      "wordmark": "chest-big",
      "sleeveEmblem": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo Hoodie màu đỏ đô (Trang phục best seller học đường)",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-hoodie-mau-do-do-trang-phuc-best-seller-hoc-duong"
    }
  },

  // ---------------------------------------------------------------- CÁC MẪU HUST TỪ MAY PHƯƠNG THẢO
  {
    "id": "ao-so-mi-nam-hust",
    "slot": "top",
    "group": "truong",
    "name": "Sơ mi HUST nam màu ghi",
    "colors": {
      "main": "#c5c8cd",
      "accent": "#b3b7bc"
    },
    "palette": [
      "#c5c8cd",
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "long",
      "collar": "shirt",
      "placket": [
        0,
        1
      ],
      "cuffs": true,
      "pocket": false,
      "tucked": false
    },
    "emblem": "chest-left",
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo sơ mi Nam",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-so-mi-nam"
    }
  },
  {
    "id": "ao-so-mi-nu-hust",
    "slot": "top",
    "group": "truong",
    "name": "Sơ mi HUST nữ màu ghi",
    "colors": {
      "main": "#c5c8cd",
      "accent": "#b3b7bc"
    },
    "palette": [
      "#c5c8cd",
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "long",
      "collar": "shirt",
      "placket": [
        0,
        1
      ],
      "cuffs": true,
      "pocket": false,
      "tucked": false,
      "waistFit": true
    },
    "emblem": "chest-left",
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo sơ mi nữ",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-so-mi-nu"
    }
  },
  {
    "id": "ao-thun-trang-nguc-trai-hust",
    "slot": "top",
    "group": "truong",
    "name": "Áo thun HUST trắng · ngực trái",
    "colors": {
      "main": "#f8f8f6",
      "print": "#a51f28"
    },
    "palette": [
      "#f8f8f6",
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "short",
      "collar": "crew",
      "wordmark": "chest-left",
      "sleeveEmblem": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo thun cổ tròn màu trắng (thêu ngực trái)",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-thun-co-tron-mau-trang-theu-nguc-trai"
    }
  },
  {
    "id": "ao-thun-trang-giua-nguc-hust",
    "slot": "top",
    "group": "truong",
    "name": "Áo thun HUST trắng · giữa ngực",
    "colors": {
      "main": "#f8f8f6",
      "print": "#a51f28"
    },
    "palette": [
      "#f8f8f6",
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "short",
      "collar": "crew",
      "wordmark": "chest-big",
      "sleeveEmblem": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo thun cổ tròn màu trắng (thêu giữa ngực)",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-thun-co-tron-mau-trang-theu-giua-nguc"
    }
  },
  {
    "id": "ao-thun-do-giua-nguc-hust",
    "slot": "top",
    "group": "truong",
    "name": "Áo thun HUST đỏ đô · giữa ngực",
    "colors": {
      "main": "#a51f28",
      "print": "#ffffff"
    },
    "palette": [
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "short",
      "collar": "crew",
      "wordmark": "chest-big",
      "sleeveEmblem": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo thun cổ tròn màu đỏ đô (thêu giữa ngực)",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-thun-co-tron-mau-do-do-theu-giua-nguc"
    }
  },
  {
    "id": "ao-thun-ghi-nguc-trai-hust",
    "slot": "top",
    "group": "truong",
    "name": "Áo thun HUST ghi · ngực trái",
    "colors": {
      "main": "#aeb0b2",
      "print": "#a51f28"
    },
    "palette": [
      "#aeb0b2",
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "short",
      "collar": "crew",
      "wordmark": "chest-left",
      "sleeveEmblem": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo thun cổ tròn màu ghi (thêu ngực trái)",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-thun-co-tron-mau-ghi-theu-nguc-trai"
    }
  },
  {
    "id": "ao-polo-the-thao-hust",
    "slot": "top",
    "group": "truong",
    "name": "Áo thể thao có cổ HUST",
    "colors": {
      "main": "#a51f28",
      "accent": "#a51f28",
      "trim": "#ffffff",
      "print": "#ffffff"
    },
    "palette": [
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "short",
      "collar": "polo",
      "placket": [
        0,
        0.2
      ],
      "shoulderPiping": true,
      "wordmark": "chest-left",
      "sleeveEmblem": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo thể thao có cổ",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-the-thao-co-co"
    }
  },
  {
    "id": "ao-bomber-xanh-hust",
    "slot": "top",
    "group": "truong",
    "name": "Bomber HUST xanh than · tay trắng",
    "colors": {
      "main": "#101c35",
      "accent": "#f5f4ef",
      "trim": "#ffffff",
      "print": "#ffffff",
      "ribAccent": "#ffffff"
    },
    "palette": [
      "#101c35",
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "long",
      "collar": "stand",
      "bomber": true,
      "accentSleeves": true,
      "cuffs": true,
      "hemBand": true,
      "wordmark": "chest-left",
      "sleeveEmblem": true,
      "weltPockets": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo khoác Bomber màu xanh than",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-khoac-bomber-mau-xanh-than"
    }
  },
  {
    "id": "ao-bomber-do-hust",
    "slot": "top",
    "group": "truong",
    "name": "Bomber HUST đỏ đô · tay ghi",
    "colors": {
      "main": "#a51f28",
      "accent": "#bdc0c2",
      "trim": "#e7e7e4",
      "print": "#ffffff",
      "ribAccent": "#e7e7e4"
    },
    "palette": [
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "long",
      "collar": "stand",
      "bomber": true,
      "accentSleeves": true,
      "cuffs": true,
      "hemBand": true,
      "wordmark": "chest-left",
      "sleeveEmblem": true,
      "weltPockets": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo khoác Bomber màu đỏ đô",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-khoac-bomber-mau-do-do"
    }
  },
  {
    "id": "ao-ni-trang-hust",
    "slot": "top",
    "group": "truong",
    "name": "Sweater HUST trắng",
    "colors": {
      "main": "#f7f7f3",
      "print": "#a51f28"
    },
    "palette": [
      "#f7f7f3",
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "long",
      "collar": "crew",
      "cuffs": true,
      "hemBand": true,
      "wordmark": "chest-big",
      "sleeveEmblem": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo Sweater màu trắng",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-sweater-mau-trang"
    }
  },
  {
    "id": "ao-hoodie-ghi-hust",
    "slot": "top",
    "group": "truong",
    "name": "Hoodie HUST màu ghi",
    "colors": {
      "main": "#bdbfbe",
      "print": "#a51f28"
    },
    "palette": [
      "#bdbfbe",
      "#a51f28",
      "#7a1c26",
      "#ffffff",
      "#101c35",
      "#a9abb0"
    ],
    "textures": {
      "front": null,
      "back": null,
      "pattern": null
    },
    "accepts": [
      "front",
      "back",
      "pattern"
    ],
    "options": {
      "sleeve": "long",
      "collar": "hood",
      "kangaroo": true,
      "cuffs": true,
      "hemBand": true,
      "wordmark": "chest-big",
      "sleeveEmblem": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Áo Hoodie màu ghi",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-hoodie-mau-ghi"
    }
  },

  // ---------------------------------------------------------------- ÁO — thông dụng
  { id: 'ao-raglan-co-tim', slot: 'top', group: 'truong', name: 'Áo GDTC HUST trắng · xanh', colors: { main: '#ffffff', accent: '#1689ca', trim: '#ffffff' }, palette: ['#ffffff', '#e7e9ee', '#f2efe6'], accepts: ['front'], textures: {}, emblem: 'chest-left', options: { sleeve: 'short', collar: 'polo', collarAccent: true, accentSleeves: true, vneck: true, sportsCollar: true } },
  { id: 'ao-thun', slot: 'top', name: 'Áo thun trơn', colors: { main: '#f2efe8' }, palette: ['#f2efe8', '#1f1f22', '#e65a4f', '#3d7bd9', '#f2c94c', '#7bc4a4'], textures: {}, accepts: ['front', 'back'], options: { sleeve: 'short', collar: 'crew' } },
  { id: 'ao-ke-ngang', slot: 'top', name: 'Áo thun kẻ ngang', colors: { main: '#f4f1ea', accent: '#24324f' }, palette: ['#f4f1ea', '#fff7e0'], options: { sleeve: 'long', collar: 'crew', breton: '#24324f' } },
  { id: 'ao-so-mi-caro', slot: 'top', name: 'Sơ mi caro', colors: { main: '#b8423a' }, palette: ['#b8423a', '#3a5f8a', '#4d6b3c', '#6b6f78'], options: { sleeve: 'long', collar: 'shirt', placket: [0, 1], pocket: true, cuffs: true, plaid: ['#22324d', '#f1e4c9'] } },
  { id: 'ao-the-thao', slot: 'top', name: 'Áo thể thao sọc', colors: { main: '#2e6fd6', accent: '#ffffff' }, palette: ['#2e6fd6', '#d63a3a', '#1aa36f', '#ff8a1f', '#222'], accepts: ['front', 'back'], textures: {}, options: { sleeve: 'short', collar: 'crew', collarAccent: true, stripes: [[0.62, 0.66], [0.69, 0.71]] } },
  { id: 'ao-hoodie', slot: 'top', name: 'Hoodie trơn', colors: { main: '#8a95a8' }, palette: ['#8a95a8', '#2a2d34', '#e8e2d6', '#b45f4a', '#4f6b52'], accepts: ['front', 'back'], textures: {}, options: { sleeve: 'long', collar: 'hood', kangaroo: true, cuffs: true, hemBand: true } },
  { id: 'ao-ba-lo', slot: 'top', name: 'Áo ba lỗ', colors: { main: '#f2efe8' }, palette: ['#f2efe8', '#1f1f22', '#5c7da8'], options: { sleeve: 'none', collar: 'crew' } },

  // ---------------------------------------------------------------- QUẦN THỂ THAO HUST
  {
    "id": "quan-the-thao-hust",
    "slot": "bottom",
    "group": "truong",
    "name": "Quần thể thao HUST · ống suông",
    "colors": {
      "main": "#101c35",
      "accent": "#ffffff",
      "print": "#ffffff"
    },
    "palette": [
      "#101c35",
      "#1f2a44",
      "#23252d"
    ],
    "textures": {},
    "accepts": [
      "pattern"
    ],
    "options": {
      "fit": "regular",
      "track": true,
      "sideStripe": true,
      "wordmark": true,
      "belt": false,
      "elasticWaist": true,
      "zipPockets": true,
      "sideTag": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Quần thể thao",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/quan-the-thao"
    }
  },
  {
    "id": "quan-the-thao-ni-hust",
    "slot": "bottom",
    "group": "truong",
    "name": "Quần thể thao HUST · nỉ ấm",
    "colors": {
      "main": "#101c35",
      "accent": "#ffffff",
      "print": "#ffffff"
    },
    "palette": [
      "#101c35",
      "#1f2a44",
      "#23252d"
    ],
    "textures": {},
    "accepts": [
      "pattern"
    ],
    "options": {
      "fit": "slim",
      "track": true,
      "sideStripe": true,
      "wordmark": true,
      "belt": false,
      "elasticWaist": true,
      "zipPockets": true,
      "sideTag": true,
      "fleece": true
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Quần thể thao cao cấp (Vải nỉ ấm áp)",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/quan-the-thao-cao-cap-vai-ni-am-ap"
    }
  },
  {
    "id": "quan-short-hust",
    "slot": "bottom",
    "group": "truong",
    "name": "Quần sooc thể thao HUST",
    "colors": {
      "main": "#101c35",
      "accent": "#ffffff",
      "print": "#ffffff"
    },
    "palette": [
      "#101c35",
      "#1f2a44",
      "#23252d"
    ],
    "textures": {},
    "accepts": [
      "pattern"
    ],
    "options": {
      "fit": "wide",
      "track": true,
      "sideStripe": true,
      "wordmark": true,
      "belt": false,
      "elasticWaist": true,
      "zipPockets": true,
      "sideTag": true,
      "length": "shorts",
      "wordmarkVertical": true,
      "trackStripeWidth": 0.1
    },
    "collection": "hust-phuong-thao",
    "source": {
      "name": "May Phương Thảo",
      "title": "Quần sooc thể thao cao cấp",
      "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/quan-sooc-the-thao-cao-cap"
    }
  },

  // ---------------------------------------------------------------- QUẦN · VÁY
  { id: 'quan-au', slot: 'bottom', group: 'truong', name: 'Quần âu', colors: { main: '#23252d' }, palette: ['#23252d', '#1f2c4a', '#8f9196', '#4a3a2c'], options: { fit: 'regular' } },
  { id: 'vay-xep-ly', slot: 'bottom', group: 'truong', name: 'Chân váy xếp ly', colors: { main: '#b5b6ba' }, palette: ['#b5b6ba', '#23252d', '#1f2c4a', WINE], accepts: ['pattern'], textures: {}, options: { skirt: true, skirtLen: 0.36 } },
  { id: 'vay-chu-a', slot: 'bottom', name: 'Chân váy chữ A', colors: { main: '#1e1e22' }, palette: ['#1e1e22', '#c4ae86', '#6f8db5', '#7a2238'], options: { skirt: true, skirtLen: 0.34, pleats: false } },
  { id: 'quan-jean', slot: 'bottom', name: 'Quần jean', colors: { main: '#3d5a86' }, palette: ['#3d5a86', '#26344d', '#6f8db5', '#2a2a2a'], options: { denim: true, fit: 'slim', rolled: true } },
  { id: 'quan-kaki', slot: 'bottom', name: 'Quần kaki', colors: { main: '#c4ae86' }, palette: ['#c4ae86', '#7d7357', '#e8dfcc', '#566048'], options: { fit: 'regular' } },
  { id: 'quan-the-thao', slot: 'bottom', name: 'Quần jogger', colors: { main: NAVY, accent: '#f2f2f2' }, palette: [NAVY, '#2b2e36', '#7a7f8a'], options: { fit: 'regular', cuff: true, sideStripe: true } },
  { id: 'quan-tui-hop', slot: 'bottom', name: 'Quần túi hộp', colors: { main: '#2a2b2f' }, palette: ['#2a2b2f', '#5d6247', '#a39272'], options: { fit: 'regular', cargo: true, cuff: true } },
  { id: 'quan-ong-rong', slot: 'bottom', name: 'Quần ống rộng', colors: { main: '#d9cdb8' }, palette: ['#d9cdb8', '#1e1e22', '#8f9196', '#6f8db5'], options: { fit: 'wide' } },
  { id: 'quan-short', slot: 'bottom', name: 'Quần short', colors: { main: '#5c6b7d' }, palette: ['#5c6b7d', '#c4ae86', '#2a2a2a', '#3d5a86'], options: { length: 'shorts', fit: 'wide' } },
  { id: 'quan-short-the-thao', slot: 'bottom', name: 'Short thể thao', colors: { main: NAVY, accent: '#ffffff' }, palette: [NAVY, RED, '#2a2a2a'], options: { length: 'shorts', fit: 'wide', sideStripe: true } },

  // ---------------------------------------------------------------- GIÀY DÉP
  {
    id: 'dep-to-ong', slot: 'footwear', group: 'truong', name: 'Dép tổ ong',
    colors: { main: '#efe4b8' }, palette: ['#efe4b8', '#f6f1e1', '#9fd0ea', '#f0b8c8', '#b9dcb0', '#3c4655'],
    textures: { upper: null }, accepts: ['upper'], options: { type: 'to-ong' },
  },
  {
    id: 'dep-to-ong-quai-hau', slot: 'footwear', group: 'truong', name: 'Dép tổ ong quai hậu',
    colors: { main: '#8cc9ea' }, palette: ['#8cc9ea', '#efe4b8', '#f6f1e1', '#f0b8c8', '#3c4655'],
    textures: { upper: null }, accepts: ['upper'], options: { type: 'to-ong', strap: true },
  },
  { id: 'giay-sneaker', slot: 'footwear', name: 'Sneaker trắng', colors: { main: '#f4f4f1', accent: RED }, palette: ['#f4f4f1', '#202125', '#d9dfe9', '#efe3cf'], options: { type: 'sneaker' } },
  { id: 'giay-bata', slot: 'footwear', name: 'Giày vải bata', colors: { main: '#4f6b45', accent: '#c0392b' }, palette: ['#4f6b45', '#f2efe6', '#2b4f8c', '#1f1f22'], options: { type: 'bata' } },
  { id: 'giay-chay', slot: 'footwear', name: 'Giày chạy bộ', colors: { main: '#3a4150', accent: '#ff7a3d' }, palette: ['#3a4150', '#e8eaee', '#1e5bd8', '#2b8a5e'], options: { type: 'runner' } },
  { id: 'giay-luoi', slot: 'footwear', name: 'Giày lười da', colors: { main: '#5a3423' }, palette: ['#5a3423', '#1e1a18', '#8a5a3a'], options: { type: 'loafer' } },
  { id: 'giay-bot', slot: 'footwear', name: 'Bốt cổ cao', colors: { main: '#4a3021' }, palette: ['#4a3021', '#1e1a18', '#8a6a48'], options: { type: 'boot' } },
  { id: 'dep-quai-hau', slot: 'footwear', name: 'Sandal quai hậu', colors: { main: '#2f2f33', accent: '#3a3a3e' }, palette: ['#2f2f33', '#6b4a33', '#3c5a7a'], options: { type: 'quai-hau' } },
  { id: 'dep-le', slot: 'footwear', name: 'Dép lê', colors: { main: '#e6e2da', accent: '#4a4f5a' }, palette: ['#e6e2da', '#202125', '#6d8fc7', '#e66a5b'], textures: { upper: null }, accepts: ['upper'], options: { type: 'le' } },
  { id: 'dep-tong', slot: 'footwear', name: 'Dép tông', colors: { main: '#2f6fd6', accent: '#f2efe6' }, palette: ['#2f6fd6', '#e14b4b', '#1f1f22', '#f2c94c'], options: { type: 'tong' } },

  // ---------------------------------------------------------------- THẺ SINH VIÊN
  { id: 'the-sv-day-deo', slot: 'card', group: 'truong', name: 'Dây đeo HUST + vỏ thẻ đỏ', fixedColors: true, colors: { main: '#df1930', accent: '#e31b34', text: '#ffffff' }, palette: ['#df1930'], options: { type: 'day-deo' } },
  { id: 'the-sv-kep-ao', slot: 'card', group: 'truong', name: 'Thẻ kẹp ngực', colors: { main: RED }, options: { type: 'kep-ao' } },

  // ---------------------------------------------------------------- MŨ
  { id: 'mu-luoi-trai', slot: 'hat', group: 'truong', name: 'Mũ lưỡi trai lớp', colors: { main: RED, accent: WINE }, palette: [RED, '#f2efe8', '#202125', NAVY], emblem: 'front', textures: { front: null }, accepts: ['front'], options: { type: 'luoi-trai' } },
  { id: 'mu-trucker', slot: 'hat', name: 'Mũ trucker', colors: { main: '#1f1f22', accent: '#1f1f22', front: '#f6f6f3' }, palette: ['#1f1f22', NAVY, RED], options: { type: 'luoi-trai' } },
  { id: 'mu-bao-hiem', slot: 'hat', name: 'Mũ bảo hiểm', colors: { main: '#e9e6df', accent: '#3a3f4a' }, palette: ['#e9e6df', '#d23b3b', '#2a2d34', '#f2c94c', '#6fb2d9'], emblem: 'side', options: { type: 'bao-hiem' } },
  { id: 'non-la', slot: 'hat', name: 'Nón lá', colors: { main: '#ead9a4', accent: '#c94a4a' }, palette: ['#ead9a4', '#e2cfa0', '#f0e3c2'], options: { type: 'non-la' } },
  { id: 'mu-bucket', slot: 'hat', name: 'Mũ bucket', colors: { main: '#cbbf9e', accent: '#3a3a3a' }, palette: ['#cbbf9e', '#2a2d34', '#8a9c7a', '#e8e2d6'], options: { type: 'bucket' } },
  { id: 'mu-len', slot: 'hat', name: 'Mũ len', colors: { main: '#c0463f', accent: '#f2efe8' }, palette: ['#c0463f', '#2a3b5c', '#e8c547', '#3d3d3d'], options: { type: 'len' } },
  { id: 'mu-tot-nghiep', slot: 'hat', group: 'truong', name: 'Mũ tốt nghiệp', colors: { main: '#1d1b26', accent: '#e3a52a' }, palette: ['#1d1b26', '#1f2c4a'], options: { type: 'tot-nghiep' } },

  // ---------------------------------------------------------------- BALO · CẶP · TÚI
  { id: 'balo', slot: 'bag', group: 'truong', name: 'Balo trường', colors: { main: '#2b2d33', accent: RED }, palette: ['#2b2d33', '#2f3a52', '#8a95a8', RED, '#3c6e5a'], emblem: 'patch', textures: { front: null }, accepts: ['front'], options: { type: 'balo' } },
  { id: 'balo-laptop', slot: 'bag', name: 'Balo laptop', colors: { main: '#25272d', accent: '#3a3d45' }, palette: ['#25272d', '#5c6470', '#d9d4c8'], options: { type: 'balo-laptop' } },
  { id: 'cap-sach', slot: 'bag', name: 'Cặp sách đeo vai', colors: { main: '#6b4a33', accent: '#4e3524' }, palette: ['#6b4a33', '#1f1f22', NAVY, '#7a2238'], emblem: 'front', textures: { front: null }, accepts: ['front'], options: { type: 'cap-sach' } },
  { id: 'tui-tote', slot: 'bag', group: 'truong', name: 'Túi tote vải', colors: { main: '#efe6d2', accent: '#c9b893' }, palette: ['#efe6d2', '#2a2d34', '#d9e4ef', RED], emblem: 'front', textures: { front: null }, accepts: ['front'], options: { type: 'tote' } },
  { id: 'tui-deo-cheo', slot: 'bag', name: 'Túi đeo chéo', colors: { main: '#3d4450', accent: '#202227' }, palette: ['#3d4450', '#7a5a3c', '#c0463f', '#e8e2d6'], options: { type: 'deo-cheo' } },

  // ---------------------------------------------------------------- KÍNH
  { id: 'kinh-vuong', slot: 'eyewear', name: 'Kính gọng vuông', colors: { main: '#1b1b1d' }, palette: ['#1b1b1d', '#6b4a33', '#3d5a86'], options: { type: 'vuong' } },
  { id: 'kinh-nua', slot: 'eyewear', name: 'Kính nửa gọng', colors: { main: '#b9bcc2', accent: '#1b1b1d' }, palette: ['#b9bcc2', '#b08d57'], options: { type: 'nua' } },
  { id: 'kinh-tron', slot: 'eyewear', name: 'Kính gọng tròn', colors: { main: '#b08d57' }, palette: ['#b08d57', '#202125', '#a8adb5'], options: { type: 'tron' } },
  { id: 'kinh-ram', slot: 'eyewear', name: 'Kính râm', colors: { main: '#202125', accent: '#1b1f2a' }, palette: ['#202125', '#b08d57'], options: { type: 'ram' } },

  // ---------------------------------------------------------------- KHẨU TRANG
  { id: 'khau-trang-y-te', slot: 'mask', name: 'Khẩu trang y tế', colors: { main: '#8ec5ea', accent: '#f4f6f8' }, palette: ['#8ec5ea', '#f4f6f8', '#2a2d34', '#f3b9c9', '#9fd8b5'], options: { type: 'y-te' } },
  { id: 'khau-trang-vai', slot: 'mask', name: 'Khẩu trang vải', colors: { main: '#25262b', accent: '#25262b' }, palette: ['#25262b', '#e9e4da', '#5c6b7d'], textures: { front: null }, accepts: ['front'], options: { type: 'vai' } },

  // ---------------------------------------------------------------- TAI NGHE
  { id: 'tai-nghe-chup', slot: 'audio', name: 'Tai nghe chụp tai', colors: { main: '#25262b', accent: '#3a3b42' }, palette: ['#25262b', '#efece6', '#9db4cf', '#e3b7c4'], options: { type: 'chup-tai' } },
  { id: 'tai-nghe-deo-co', slot: 'audio', name: 'Tai nghe đeo cổ', colors: { main: '#efece6', accent: '#c9c4ba' }, palette: ['#efece6', '#25262b', '#9db4cf'], options: { type: 'deo-co' } },
  { id: 'tai-nghe-nhet', slot: 'audio', name: 'Tai nghe nhét tai', colors: { main: '#f6f6f4' }, palette: ['#f6f6f4', '#25262b'], options: { type: 'nhet-tai' } },

  // ---------------------------------------------------------------- ĐỒ CẦM TAY
  { id: 'laptop', slot: 'handheld', name: 'Laptop', colors: { main: '#b9bec7' }, palette: ['#b9bec7', '#2a2d34', '#e8d9c4'], emblem: 'sticker', options: { type: 'laptop' } },
  { id: 'sach', slot: 'handheld', name: 'Giáo trình', colors: { main: '#2d4f86', accent: '#e3a52a', second: '#c94a4a' }, palette: ['#2d4f86', RED, '#2e6b4f', '#4a3a6b'], options: { type: 'sach' } },
  { id: 'vo-but', slot: 'handheld', name: 'Vở ô ly + bút', colors: { main: '#4a7fd1', accent: '#e14b4b' }, palette: ['#4a7fd1', '#e8b93a', '#5bb07a', '#d8577a'], options: { type: 'vo' } },
  { id: 'but', slot: 'handheld', name: 'Bút bi', colors: { main: '#2c5fd1', accent: '#c8ccd2' }, palette: ['#2c5fd1', '#1f1f22', '#e14b4b'], options: { type: 'but' } },
  { id: 'hop-but', slot: 'handheld', name: 'Hộp bút vải', colors: { main: '#e9c46a', accent: '#2a2d34' }, palette: ['#e9c46a', '#9fc2e7', '#f2a6c4', '#2a2d34'], options: { type: 'hop-but' } },
  { id: 'binh-nuoc', slot: 'handheld', name: 'Bình giữ nhiệt', colors: { main: '#6fb7a6', accent: '#2a2d34' }, palette: ['#6fb7a6', '#e8e2d6', '#d96b5a', '#2a2d34'], options: { type: 'binh-nuoc' } },
  { id: 'dien-thoai', slot: 'handheld', name: 'Điện thoại', colors: { main: '#2a2d34' }, palette: ['#2a2d34', '#e8e2d6', '#9db4cf'], options: { type: 'dien-thoai' } },
  { id: 'o-du', slot: 'handheld', name: 'Ô gấp', colors: { main: '#2a3b5c', accent: '#6b4a33' }, palette: ['#2a3b5c', '#c0463f', '#3d3d3d', '#e8c547'], options: { type: 'o' } },
  { id: 'may-tinh', slot: 'handheld', name: 'Máy tính cầm tay', colors: { main: '#2b2f36', accent: '#e86a33' }, palette: ['#2b2f36', '#3a5b8c', '#e8e2d6'], options: { type: 'may-tinh' } },
  { id: 'ong-ban-ve', slot: 'handheld', name: 'Ống đựng bản vẽ', colors: { main: '#3a3f4a', accent: '#e8b93a' }, palette: ['#3a3f4a', '#1f3b6e', '#c0463f'], options: { type: 'ong-ban-ve' } },
];

// Huy hiệu riêng cho áo: mẫu tròn, ngoại trừ áo GDTC trắng–xanh.
// Tách khỏi nhận diện phụ kiện để đổi logo áo không đổi thẻ, mũ hay balo.
for (const item of ITEMS) {
  if (item.slot !== 'top') continue;
  const rectangular = item.id === 'ao-raglan-co-tim';
  item.textures = {
    ...item.textures,
    badge: rectangular ? 'avatar/assets/textures/hust-logo.png' : 'avatar/assets/textures/hust-logo-round.png',
  };
  item.badgeCrop = rectangular ? [261, 40, 246, 370] : [16, 12, 224, 224];
  item.badgeClip = rectangular ? null : 'circle';
}

// Trạng thái mặc định khi mở trang
export const DEFAULTS = {
  body: { skin: '#e2b08c', build: 'vua', height: 0.97 },
  equipped: {
    hair: 'toc-ngan', top: 'ao-polo-truong', bottom: 'quan-au', footwear: 'dep-to-ong',
    card: 'the-sv-day-deo', hat: null, bag: 'balo', eyewear: null, mask: null, audio: null, handheld: null,
  },
  // Nhận diện HUST — dùng logo Bách khoa do người dùng cung cấp
  emblem: {
    name: 'Đại học Bách khoa Hà Nội', short: 'HUST', wordmark: 'HUST', year: '1956',
    shape: 'tron', motif: 'banh-rang', main: RED, accent: '#ffffff',
    logo: 'avatar/assets/textures/hust-logo.png', logoCrop: [261, 40, 246, 370],
  },
  // Thẻ SV mẫu — toàn bộ là dữ liệu giả
  card: {
    school: 'Đại học Bách khoa Hà Nội', title: 'THẺ SINH VIÊN',
    orientation: 'landscape',
    name: 'Nguyễn Minh An', id: '26A0001', major: 'Kỹ thuật phần mềm', cohort: 'K71 · 2026–2030',
    photo: null,     // dataURL hoặc đường dẫn ảnh
    template: null,  // 'avatar/assets/textures/the-sv-nen.png' — ảnh nền thẻ của bạn (1024×646)
    drawHeader: true,
  },
};

export const SKIN_TONES = ['#f3d2b8', '#e8bf9e', '#e2b08c', '#c98e66', '#a86f4c', '#7a4e34'];

export const CATALOG = { slots: SLOTS, items: ITEMS, defaults: DEFAULTS, skinTones: SKIN_TONES };
export default CATALOG;

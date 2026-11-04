// Bảng tra: mỗi "slot" (vị trí mặc) dùng một builder.
// Muốn thêm loại đồ mới: viết builder trả về { parts:[{joint, obj}] } rồi đăng ký ở đây.
import { buildHair, buildTop, buildBottom } from './clothing.js';
import { buildFootwear, buildHat, buildBag, buildCard, buildEyewear, buildHandheld, buildMask, buildAudio } from './gear.js';

export const BUILDERS = {
  hair: buildHair,
  top: buildTop,
  bottom: buildBottom,
  footwear: buildFootwear,
  hat: buildHat,
  bag: buildBag,
  card: buildCard,
  eyewear: buildEyewear,
  handheld: buildHandheld,
  mask: buildMask,
  audio: buildAudio,
};

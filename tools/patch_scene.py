#!/usr/bin/env python3
"""
Chuyển bản mô hình 3D gốc (hust-3d/index.html) thành "lớp cảnh" cho Phòng ôn thi ảo.

Cách dùng:
    python3 tools/patch_scene.py duong/dan/hust-3d   [thu_muc_dich=scene]

Script đọc hust-3d/index.html, tách CSS, khung HTML và mã JS, rồi chèn các "móc" (hook)
mà web cần: danh sách ghế, camera, va chạm, hàm bật đêm... Kết quả ghi vào thư mục scene/.
Mỗi móc được kiểm tra; nếu bản mô hình mới đổi cấu trúc khiến móc không khớp, script
dừng lại và báo rõ móc nào hỏng (xem docs/HOP_DONG_CANH.md).
"""
import re, sys, shutil, pathlib, json

src_dir = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'hust-3d')
out_dir = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else 'scene')
html = (src_dir / 'index.html').read_text(encoding='utf8')

errors = []
def sub_once(text, old, new, name, count=1):
    n = text.count(old)
    if n != count:
        errors.append(f'Móc "{name}": cần {count} chỗ khớp, tìm thấy {n}')
        return text
    return text.replace(old, new)

# ---------- tách phần ----------
css = re.search(r'<style>([\s\S]*?)</style>', html).group(1)
body = html[html.index('</style>') + len('</style>'):]
dom = body[:body.index('<script')]
dom = re.sub(r'<canvas[^>]*></canvas>', '', dom)          # web tự tạo canvas #c
dom = dom.replace('</head>', '').replace('<body>', '').strip()
scripts = re.findall(r'<script>([\s\S]*?)</script>', html)
if len(scripts) != 1:
    errors.append(f'Cần đúng 1 khối <script> nội tuyến, tìm thấy {len(scripts)}')
js = scripts[0] if scripts else ''

# ---------- móc 1: ghi lại vị trí mọi chiếc ghế (prop tên bắt đầu bằng "chair") ----------
SEAT = 'if(/^(chair|sofa|arm|cube)/.test(n))(window.__SEATLOG=window.__SEATLOG||[]).push({tag:window.__SEATTAG,n:n,x:x,y:y,z:z,ry:ry});'
js, k = re.subn(r'(function place\(n,x,y,z,ry=0,s=1(?:,sy)?\)\{)', lambda m: m.group(1) + SEAT, js)
if k < 3:
    errors.append(f'Móc "ghế": cần ít nhất 3 hàm place(), tìm thấy {k}')

# ---------- móc 1b: chỗ ngồi dựng bằng khối (không qua place) — ghế dài, băng ghế gỗ, đảo "thuyền", ghế đệm ----------
SEAT_FN = 'window.__S=(n,x,y,z,ry)=>(window.__SEATLOG=window.__SEATLOG||[]).push({tag:window.__SEATTAG,n:n,x:x,y:y,z:z,ry:ry});\n'
def seat_hook(old, extra, name):
    global js
    js = sub_once(js, old, old + extra, name)
seat_hook('colsG.push([s*18.7-.3,s*18.7+.3,7.1,9.7]);seatsG+=3;',
          'for(const dz of [-.8,0,.8])__S("benchA",s*18.65,0,8.4+dz,s>0?-PI/2:PI/2);', 'ghế dài sảnh')
seat_hook('colsM.push([-1.3,1.3,-11.9,-11.3]);seatsM+=3;',
          'for(const dx of [-.8,0,.8])__S("benchM",dx,MZ,-11.55,0);', 'ghế dài gác lửng')
seat_hook('cols7.push([12.7,-.8,.5],[12.7,.8,.5]);seats7+=3;',
          'for(const dz of [-.8,0,.8])__S("bench7",12.65,MZ,dz,-PI/2);', 'ghế dài tầng 7')
seat_hook('put(box(len,.4,.62),M.woodDark,0,.2);put(box(len,.1,.58),M.cushion,.02,.45);',
          'if(i%2===0)__S("booth",mx+lx*.06,PY,mz+lz*.06,ry);', 'ghế băng gỗ lượn sóng')
js = sub_once(js, '  for(let u=-2.4;u<=2.4;u+=.6){cols.push([.5+Math.cos(.5)*u,2.6-Math.sin(.5)*u,.8]);}\n  seats+=8;}',
              '  for(let u=-2.4;u<=2.4;u+=.6){cols.push([.5+Math.cos(.5)*u,2.6-Math.sin(.5)*u,.8]);}\n  seats+=8;'
              'for(const lx of [-1.8,-.6,.6,1.8])for(const lz of [-.45,.45])__S("island",.5+lx*Math.cos(.5)+lz*Math.sin(.5),PY,2.6-lx*Math.sin(.5)+lz*Math.cos(.5),lz>0?.5:.5+PI);}', 'đảo thuyền')

# ---------- móc 2: gắn nhãn module cho ghế ----------
js = sub_once(js, 'function moduleA(ctx,root){"use strict";', 'function moduleA(ctx,root){"use strict";window.__SEATTAG="A";', 'nhãn A')
js = sub_once(js, 'function moduleB(ctx,root){"use strict";', 'function moduleB(ctx,root){"use strict";window.__SEATTAG="B";', 'nhãn B')
js = sub_once(js, 'function moduleC(ctx,root){"use strict";', 'function moduleC(ctx,root){"use strict";window.__SEATTAG="C";', 'nhãn C')
js = sub_once(js, 'const ROOM=buildRoom401(renderer,roomG);',
              'window.__SEATTAG="r401";const ROOM=buildRoom401(renderer,roomG);window.__SEATTAG="A";', 'nhãn phòng 401')

# ---------- móc 3: gọi lại mỗi khung hình (web vẽ nhân vật, nhãn tên...) ----------
js = sub_once(js, 'ctx.world.background=scene.background;renderer.render(ctx.world,camera);',
              'ME.onFrame&&ME.onFrame(dt,now,camera);ctx.world.background=scene.background;renderer.render(ctx.world,camera);ME.afterFrame&&ME.afterFrame();',
              'onFrame', count=3)
# độ nhạy xoay góc nhìn và tốc độ đi (web chỉnh được để đỡ chóng mặt)
js = sub_once(js, 'const s=touch?.006:.0045;', 'const s=(touch?.006:.0045)*(window.__LOOK_K||1);', 'độ nhạy xoay', count=3)
js = sub_once(js, 'const sp=(keys.run?6:3)*dt', 'const sp=(keys.run?6:3)*dt*(window.__WALK_K||1)', 'tốc độ đi', count=2)

# ---------- đầu vào khi nhúng: World là nơi duy nhất đọc WASD và kéo góc nhìn ----------
# Giữ phím số thang máy ở mô hình; ô chat và tổ hợp phím trình duyệt không điều khiển nhân vật.
js = sub_once(js, "if(mode!=='walk')return;if(KMAP[e.code])",
              "if(mode!=='walk')return;"
              "if(window.__POTA&&(KMAP[e.code]||e.key==='Shift'||e.ctrlKey||e.metaKey||e.altKey||"
              "/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||'')||e.target?.isContentEditable))return;"
              "if(KMAP[e.code])", 'quyền đọc phím đi bộ', count=3)
js = sub_once(js, "if(mode!=='walk')return;look=", "if(mode!=='walk'||window.__POTA)return;look=", 'quyền kéo camera', count=3)
js = sub_once(js, "if(!look||mode!=='walk')return;", "if(!look||mode!=='walk'||window.__POTA)return;", 'quyền xoay camera', count=3)
js = sub_once(js, "mx=mx/len*sp;mz=mz/len*sp", "mx=mx/Math.max(1,len)*sp;mz=mz/Math.max(1,len)*sp", 'tốc độ cần điều khiển', count=3)
js = sub_once(js, "if(keys.f&&!keys.b){const want=", "if(keys.f&&!keys.b&&!window.__POTA){const want=", 'không tự xoay ở cầu thang')
# E phải qua World để kiểm tra ghế đang có người; đang nhập chat không chơi đàn.
js = sub_once(js, "if(mode==='walk'&&e.code==='KeyE'&&!sitBtn.hidden)", "if(!window.__POTA&&mode==='walk'&&e.code==='KeyE'&&!sitBtn.hidden)", 'quyền ngồi đàn')
js = sub_once(js, "if(e.target&&e.target.tagName==='SELECT'&&!KEYMAP[e.code]&&e.code!=='Escape')return;",
              "if(/^(INPUT|TEXTAREA)$/.test(e.target?.tagName||'')||e.target?.isContentEditable)return;\n  "
              "if(e.target&&e.target.tagName==='SELECT'&&!KEYMAP[e.code]&&e.code!=='Escape')return;", 'gõ chat khi ngồi đàn')

# phím Esc của mô hình (thoát đi bộ) — web tự xử lý nên tắt khi chạy trong Phòng ôn thi ảo
js = sub_once(js, "if(e.key==='Escape'&&mode==='walk'){setMode('orbit');return;}",
              "if(e.key==='Escape'&&mode==='walk'&&!window.__POTA){setMode('orbit');return;}", 'phím Esc', count=3)

# ---------- móc 4: lộ API của từng module ----------
API_A = ('api:{camera,controls,scene,roomG,ROOMZ,Y4,FH,viewPose,flyTo,surface,keys,'
         'get yaw(){return yaw;},set yaw(v){yaw=v;},get pitch(){return pitch;},set pitch(v){pitch=v;},get base(){return base;},get rider(){return rider;},'
         'ext:on=>{if(on){mode="ext";tween=null;rider=null;controls.enabled=false;dpad.hidden=true;canvas.classList.remove("walk");for(const k in keys)keys[k]=0;}},'
         'walkNow:(p,yw)=>{tween=null;rider=null;mode="walk";base=Math.round((p.y-1.6)/FH)*FH;eyeY=p.y;controls.enabled=false;yaw=yw;pitch=0;'
         'camera.position.copy(p);camera.rotation.order="YXZ";camera.rotation.set(0,-yaw,0);canvas.classList.add("walk");dpad.hidden=false;},'
         'setNight:v=>{nightTarget=v;},getMode:()=>mode,'
         'walkAt:(p,yw)=>{if(mode==="walk")setMode("orbit");enterWalk(p,yw);},'
         'stopWalk:()=>{if(mode==="walk")setMode("orbit");},'
         'orbitTo:(p,t,d)=>{if(mode==="walk")setMode("orbit");controls.enabled=true;flyTo(p,t,d==null?1:d);},'
         'orbit:(x,y,z)=>{setMode("orbit");controls.enabled=true;controls.target.set(x,y,z);},'
         'busy:()=>!!tween},')
API_B = ('api:{camera,controls,scene,viewPose,flyTo,keys,PIANO,sit,MZ,ROOF,'
         'get yaw(){return yaw;},set yaw(v){yaw=v;},get pitch(){return pitch;},set pitch(v){pitch=v;},get level(){return level;},get rider(){return rider;},'
         'blockedAt:(x,z,lv)=>{const o=level;level=lv;try{return blocked(x,z,x,z);}finally{level=o;}},groundY,'
         'ext:on=>{if(on){if(mode==="piano")standUp();mode="ext";tween=null;rider=null;controls.enabled=false;dpad.hidden=true;canvas.classList.remove("walk");for(const k in keys)keys[k]=0;}},'
         'walkNow:(p,yw,lv)=>{tween=null;rider=null;mode="walk";level=lv;eyeY=p.y;controls.enabled=false;yaw=yw;pitch=0;'
         'camera.position.copy(p);camera.rotation.order="YXZ";camera.rotation.set(0,-yaw,0);canvas.classList.add("walk");dpad.hidden=false;},'
         'setNight:v=>{nightTarget=v;},getMode:()=>mode,'
         'walkAt:(p,yw)=>{if(mode!=="orbit")setMode("orbit");enterWalk(p,yw,6);},'
         'stopWalk:()=>{if(mode!=="orbit")setMode("orbit");},'
         'orbitTo:(p,t,d)=>{if(mode!=="orbit")setMode("orbit");controls.enabled=true;flyTo(p,t,d==null?1:d);},'
         'orbit:(x,y,z)=>{setMode("orbit");controls.enabled=true;controls.target.set(x,y,z);},'
         'busy:()=>!!tween},')
API_C = ('api:{camera,controls,scene,hit:hitC,LIB,viewPose,flyTo,get fog(){return fog;},'
         'setNight:v=>{nightTarget=v;},getMode:()=>mode,'
         'ext:on=>{if(on){mode="ext";tween=null;controls.enabled=false;dpad.hidden=true;canvas.classList.remove("walk");}'
         'else{mode="orbit";controls.enabled=true;}},'
         'orbit:(x,y,z)=>{setMode("orbit");controls.enabled=true;controls.target.set(x,y,z);camera.position.set(x+18,y+14,z+18);},'
         'busy:()=>!!tween},')
js = sub_once(js, 'Object.assign(ME,{floors:FLOORS,group:scene,lights,', 'Object.assign(ME,{' + API_A + 'floors:FLOORS,group:scene,lights,', 'API A')
js = sub_once(js, 'Object.assign(ME,{floors:OWN,group:scene,lights,', 'Object.assign(ME,{' + API_B + 'floors:OWN,group:scene,lights,', 'API B')
js = sub_once(js, 'Object.assign(ME,{floors:[],group:scene,lights,', 'Object.assign(ME,{' + API_C + 'floors:[],group:scene,lights,', 'API C')

# ---------- móc 5: chất lượng đồ họa + lộ bộ điều phối ----------
js = sub_once(js, 'renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));',
              'const __Q=window.__SCENE_QUALITY||{pr:2,shadow:true};'
              'renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,__Q.pr));', 'chất lượng 1')
js = sub_once(js, 'renderer.shadowMap.enabled=true;', 'renderer.shadowMap.enabled=__Q.shadow!==false;', 'chất lượng 2')
js = sub_once(js, '\nboot();\n',
              '\nwindow.HUST3D={A,B,C,ctx,renderer,world,show,size,hopTo,'
              'get cur(){return ctx.cur;}};\n'
              'boot();\nwindow.dispatchEvent(new Event("hust3d-ready"));\n', 'boot')
# ---------- móc 6: sân thượng tầng 10 (module D, sinh bởi tools/patch_tang10.py) ----------
js = sub_once(js, 'const A=moduleA(ctx,rootA),B=moduleB(ctx,rootB),C=moduleC(ctx,rootC);',
              'const A=moduleA(ctx,rootA),B=moduleB(ctx,rootB),C=moduleC(ctx,rootC);'
              'const rootD=document.getElementById("modD"),D=window.moduleD&&rootD?window.moduleD(ctx,rootD):null;', 'module D')
js = sub_once(js, 'function place(mod){', 'function place(mod){if(D&&mod===D){C.group.visible=false;C.lights.forEach(l=>l.visible=false);A.group.visible=B.group.visible=false;return;}', 'đặt module D')
js = sub_once(js, 'function loop(now){const cur=ctx.cur;if(cur===C&&W)cur.frame(now);', 'function loop(now){const cur=ctx.cur;if((cur===C||(D&&cur===D))&&W)cur.frame(now);', 'vòng lặp D')
js = js.replace('window.HUST3D={A,B,C,ctx,', 'window.HUST3D={A,B,C,D,ctx,')

# Tự chạy khi tải: bọc toàn bộ để không làm rò biến toàn cục (trừ những gì cố ý gán vào window)
js = '/* Lớp cảnh tự sinh từ hust-3d/index.html bởi tools/patch_scene.py — đừng sửa tay */\n' + SEAT_FN + js

if errors:
    print('KHÔNG THỂ VÁ MÔ HÌNH:')
    for e in errors:
        print('  ✗', e)
    print('Xem docs/HOP_DONG_CANH.md để biết mô hình mới cần giữ những gì.')
    sys.exit(1)

out_dir.mkdir(parents=True, exist_ok=True)
(out_dir / 'vendor').mkdir(exist_ok=True)
(out_dir / 'hust3d.js').write_text(js, encoding='utf8')
(out_dir / 'hust3d.css').write_text('/* CSS gốc của mô hình 3D (tự sinh) */\n' + css, encoding='utf8')
(out_dir / 'hust3d-dom.js').write_text(
    '/* Khung HTML gốc của mô hình 3D (tự sinh) */\n'
    'document.getElementById("scene-dom").innerHTML=' + json.dumps(dom, ensure_ascii=False) + ';\n', encoding='utf8')
for f in (src_dir / 'vendor').iterdir():
    shutil.copy(f, out_dir / 'vendor' / f.name)
print('Đã vá xong mô hình →', out_dir)
print('  hust3d.js', len(js), 'ký tự')

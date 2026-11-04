#!/usr/bin/env python3
"""
Chuyển trang "Sân thượng tầng 10" (một file HTML tự chạy) thành module D cho Phòng ôn thi ảo.

Cách dùng:
    python3 tools/patch_tang10.py [tools/nguon/tang10.html] [scene]

Tạo ra:
    scene/tang10.js      — function moduleD(ctx, root): dựng sân thượng vào renderer chung
    scene/tang10-dom.js  — khung HTML (kính thiên văn, nhãn sao, thông báo sao băng…)
Mỗi chỗ vá được kiểm tra; nếu bản sân thượng mới đổi cấu trúc, script dừng và báo móc nào hỏng.
"""
import re, sys, json, pathlib

src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'tools/nguon/tang10.html')
out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else 'scene')
html = src.read_text(encoding='utf8')
errors = []
def sub(text, old, new, name, count=1):
    n = text.count(old)
    if n != count:
        errors.append(f'Móc "{name}": cần {count} chỗ khớp, tìm thấy {n}')
        return text
    return text.replace(old, new)

# ---------- tách khung HTML và mã ----------
body = html[html.index('<canvas id="c"'):]
dom = body[body.index('</canvas>') + len('</canvas>'):body.index('<script')]
js = re.findall(r'<script>([\s\S]*?)</script>', html)
if len(js) != 1: errors.append(f'Cần đúng 1 khối <script> nội tuyến, tìm thấy {len(js)}')
js = js[0] if js else ''
js = sub(js, '(function(){\n"use strict";', '', 'mở hàm')
js = js.rstrip()
if js.endswith('})();'): js = js[:-5]
else: errors.append('Móc "đóng hàm": không thấy })(); ở cuối')

# ---------- dùng renderer, canvas, sự kiện chung của web ----------
js = sub(js, "const $=s=>document.querySelector(s);\nconst canvas=$('#c');",
     "const $=s=>root.querySelector(s);const canvasEl=ctx.canvas;\n"
     "const canvas={addEventListener:(t,f,o)=>canvasEl.addEventListener(t,e=>{if(ctx.cur===ME)f(e);},o),classList:canvasEl.classList,"
     "getBoundingClientRect:()=>canvasEl.getBoundingClientRect(),setPointerCapture:i=>{try{canvasEl.setPointerCapture(i);}catch(_){}}};\n"
     "const addEventListener=(t,f,o)=>window.addEventListener(t,e=>{if(ctx.cur===ME)f(e);},o);", 'canvas')
js = sub(js, "const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});\n"
             "const DPR=Math.min(window.devicePixelRatio||1,2);\nrenderer.setPixelRatio(DPR);\nrenderer.outputEncoding=THREE.sRGBEncoding;",
     "const renderer=ctx.renderer;const DPR=renderer.getPixelRatio();", 'renderer')
js = sub(js, "labelsEl=$('#labels')", "labelsEl=$('#d-labels')", 'nhãn sao (mã)')
js = sub(js, 'const controls=new THREE.OrbitControls(camera,canvas);', 'const controls=new THREE.OrbitControls(camera,canvasEl);controls.enabled=false;', 'điều khiển')
js = sub(js, "document.querySelectorAll('[data-view]')", "root.querySelectorAll('[data-view]')", 'nút góc nhìn')
# tốc độ đi & độ nhạy xoay theo cài đặt chống chóng mặt của web
js = sub(js, 'const sp=(keys.run?5.5:2.8)*dt', 'const sp=(keys.run?5.5:2.8)*dt*(window.__WALK_K||1)', 'tốc độ đi')
js = sub(js, "const s=(touch?.006:.0045)*(mode==='scope'?camera.fov/FOV0:1);", "const s=(touch?.006:.0045)*(mode==='scope'?camera.fov/FOV0:1)*(window.__LOOK_K||1);", 'độ nhạy xoay')
# World sở hữu WASD và kéo camera trong chế độ đi bộ; kính thiên văn/ngắm sao vẫn tự điều khiển.
js = sub(js, "if(mode!=='walk')return;if(KMAP[e.code])", "if(mode!=='walk'||window.__POTA)return;if(KMAP[e.code])", 'quyền đọc phím đi bộ')
js = sub(js, "canvas.addEventListener('pointerdown',e=>{down=",
         "canvas.addEventListener('pointerdown',e=>{if(window.__POTA&&mode!=='scope'&&mode!=='gaze')return;down=", 'quyền kéo camera')
js = sub(js, "if(!look||mode==='orbit')return;", "if(!look||mode==='orbit'||(window.__POTA&&mode==='walk'))return;", 'quyền xoay camera')
js = sub(js, "mx=mx/len*sp;mz=mz/len*sp", "mx=mx/Math.max(1,len)*sp;mz=mz/Math.max(1,len)*sp", 'tốc độ cần điều khiển')
# Esc khi đang đi bộ: web tự xử lý; rời kính / thôi nằm ngắm sao: trả quyền cho web
js = sub(js, "if(e.key==='Escape'&&mode!=='orbit'){leaveLook();return;}", "if(e.key==='Escape'&&mode!=='orbit'&&!(window.__POTA&&mode==='walk')){leaveLook();return;}", 'phím Esc')
js = sub(js, "function leaveLook(){if(mode==='orbit')return;",
     "function leaveLook(){if(mode==='orbit')return;"
     "if(window.__POTA&&mode!=='walk'){if(mode==='scope'){closeScopeUI();camera.fov=FOV0;camera.updateProjectionMatrix();}mode='ext';tween=null;controls.enabled=false;canvas.classList.remove('walk');dpad.hidden=true;setHint();return;}", 'rời kính')
js = sub(js, "  }else if(!tween)controls.update();", "  }else if(!tween&&mode==='orbit')controls.update();", 'chế độ ngoài')
# không tự đổi cỡ / tự lặp: web gọi ME.resize và ME.frame
js = sub(js, "addEventListener('resize',resize);\nif(window.ResizeObserver)new ResizeObserver(resize).observe(document.documentElement);", '', 'đổi cỡ')
js = sub(js, "function resize(){const w=Math.max(document.documentElement.clientWidth,innerWidth||0),h=Math.max(document.documentElement.clientHeight,innerHeight||0);\n  if(!w||!h)return;\n  renderer.setSize(w,h,false);camera.aspect=w/h;",
     "function resize(W,H){const w=W||innerWidth,h=H||innerHeight;\n  if(!w||!h)return;\n  camera.aspect=w/h;", 'hàm đổi cỡ')
js = sub(js, "  if(!started){started=true;intro();}", "  if(!started&&!window.__POTA){started=true;intro();}", 'mở màn')
js = sub(js, "updateMeta();resize();setHint();", "updateMeta();setHint();", 'khởi động')
js = sub(js, "  if(started){if(composer){finalPass.uniforms.uTime.value=elapsed;composer.render(dt);}else renderer.render(scene,camera);}\n  requestAnimationFrame(frame);}\nrequestAnimationFrame(frame);",
     "  ME.onFrame&&ME.onFrame(dt,now,camera);\n"
     "  if(composer){finalPass.uniforms.uTime.value=elapsed;composer.render(dt);}else renderer.render(scene,camera);\n"
     "  ME.afterFrame&&ME.afterFrame();}", 'vòng lặp')
# ghi ghế: ghế dài, ghế nằm, gối lười
js = sub(js, "function place(n,x,y,z,ry=0,s=1){", "function place(n,x,y,z,ry=0,s=1){if(/^(lounger|bench|beanbag)$/.test(n))SEATS.push({n,x,y,z,ry});", 'ghi ghế')
js = sub(js, "const PROPS={};", "const PROPS={},SEATS=[];", 'danh sách ghế')

API = r'''
/* ---------- giao diện cho Phòng ôn thi ảo ---------- */
const lights=[];scene.traverse(o=>{if(o.isLight)lights.push(o);});
function seatList(){const out=[];
  for(const s of SEATS){const c=Math.cos(s.ry),sn=Math.sin(s.ry);
    if(s.n==='bench')for(const lx of [-.45,.45])out.push({x:s.x+c*lx,y:0,z:s.z-sn*lx,ry:s.ry,kind:'bench'});
    else if(s.n==='lounger')out.push({x:s.x,y:0,z:s.z+.35,ry:s.ry,kind:'lounger'});
    /* gối lười: tựa lưng ở phía −z của gối → nhìn về +z (trước đây bị quay ngược, ngồi lún vào trong gối); hông ở giữa gối */
    else out.push({x:s.x+sn*.1,y:.06,z:s.z+c*.1,ry:s.ry,kind:'beanbag'});}
  /* ghế cong quanh đài ngắm sao: nhìn vào giữa đài */
  {const {x,z,r,h}=SD,rb=r-.45;for(let i=0;i<6;i++){const th=.45+(i+.5)*(PI-.9)/6;out.push({x:x+rb*Math.sin(th),y:h,z:z+rb*Math.cos(th),ry:th+PI,kind:'bench'});}}
  return out;}
Object.assign(ME,{group:scene,lights,floors:[0],
  api:{camera,controls,scene,keys,KS,SD,MOUNT,X0,X1,Z0,Z1,
    get yaw(){return yaw;},set yaw(v){yaw=v;},get pitch(){return pitch;},set pitch(v){pitch=v;},
    getMode:()=>mode,busy:()=>!!tween,setNight:()=>{},blocked:(x,z)=>blocked(x,z),seats:seatList,
    ext:on=>{if(!on)return;if(mode==='scope'){closeScopeUI();camera.fov=FOV0;camera.updateProjectionMatrix();}mode='ext';tween=null;controls.enabled=false;dpad.hidden=true;canvas.classList.remove('walk');for(const k in keys)keys[k]=0;},
    walkNow:(p,yw)=>{tween=null;if(mode==='scope')closeScopeUI();mode='walk';controls.enabled=false;yaw=yw;pitch=0;camera.position.copy(p);camera.rotation.order='YXZ';camera.rotation.set(0,-yaw,0);canvas.classList.add('walk');setHint();},
    scope:()=>enterScope(),
    /* ghế nằm sát nhà thang máy: nhìn thẳng lên trời phía bắc thay vì về phía Ngân Hà (bị mái che) */
    gaze:(x,z)=>{const v=VIEWS.gaze,near=x<KS.x1+9,gy=near?PI:v.yaw,gp=near?-.95:v.pitch,p=V(x,1.02,z-.72),t=p.clone().addScaledVector(fwd(gy,gp),6);hint.textContent='Đang đặt bạn nằm xuống…';flyTo(p,t,1.4,()=>enterLook('gaze',gy,gp));},
    leave:()=>leaveLook(),
    orbit:(x,y,z)=>{mode='orbit';tween=null;controls.enabled=true;controls.target.set(x,y,z);canvas.classList.remove('walk');}},
  activate(){root.hidden=false;started=true;last=performance.now();if(!window.__POTA&&mode==='orbit')intro();},
  deactivate(){root.hidden=true;controls.enabled=false;for(const k in keys)keys[k]=0;if(mode==='scope')closeScopeUI();if(mode!=='orbit')mode='ext';},
  resize(w,h){resize(w,h);},
  otherVisible:()=>false,
  frame});
return ME;
'''
js = ('/* Sân thượng tầng 10 — tự sinh từ tools/nguon/tang10.html bởi tools/patch_tang10.py, đừng sửa tay */\n'
      'window.moduleD=function(ctx,root){"use strict";const ME={};\n' + js + API + '};\n')

# id "labels" trùng với lớp nhãn tên của web → đổi tên (nếu không, tên trên đầu nhân vật biến mất)
if 'id="labels"' not in dom: errors.append('Móc "nhãn sao": không thấy id="labels"')
dom = dom.replace('id="labels"', 'id="d-labels"')
if errors:
    print('KHÔNG THỂ VÁ SÂN THƯỢNG:'); [print('  ✗', e) for e in errors]; sys.exit(1)
out.mkdir(parents=True, exist_ok=True)
(out / 'tang10.js').write_text(js, encoding='utf8')
dom = '<div class="mod" id="modD" hidden>' + dom.strip() + '</div>'
(out / 'tang10-dom.js').write_text('/* Khung HTML sân thượng tầng 10 (tự sinh) */\n'
    'document.getElementById("scene-dom").insertAdjacentHTML("beforeend",' + json.dumps(dom, ensure_ascii=False) + ');\n', encoding='utf8')
print('Đã vá xong sân thượng →', out / 'tang10.js', len(js), 'ký tự')

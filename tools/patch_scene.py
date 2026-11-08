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

# Tên prop đi cùng từng bộ phận InstancedMesh để lớp cảnh ẩn đúng món trùng,
# không đoán theo số instance/vị trí (hai loại ghế có thể đứng sát nhau).
PROP_INSTANCE = 'const im=new THREE.InstancedMesh(p.g,p.m,P.list.length);'
if js.count(PROP_INSTANCE) < 3:
    errors.append('Móc "tên đồ nội thất": cần ít nhất 3 bộ dựng InstancedMesh')
js = js.replace(PROP_INSTANCE, PROP_INSTANCE + 'im.userData.propName=k;')

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

CAMERA_A = r'''function cameraInside(x,z,foot){
  if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(foot))return false;
  const m=.08,lvl=levelOf(foot);
  if((lvl===4||lvl===5)&&z<ZB+1.1)return x>(z>ZB?-XW+m:ROOM.X0+m)&&x<(z>ZB?XW-m:ROOM.X1-m)&&z>ROOMZ+ROOM.Z0+m;/*[tang5]*/
  if(foot<.3&&x<-XW+m)return x>BRM.x0+m&&z>BRM.z0+m&&z<BRM.z1-m&&!(x>-XW-m&&Math.abs(z)>BRM.open-m);
  if(x<-XW+m||x>XW-m||z<ZB+m||z>ZF-m)return false;
  if(foot>=FH-.3&&inside(x,z,FR+m)){const ax=Math.abs(x);return lvl===2&&ax>LAND.x0+m&&ax<LAND.x1-m&&z>Math.max(LAND.z0,-7.75)+m&&z<LAND.z1-m;}
  return true;
}'''
CAMERA_B = r'''function cameraInside(x,z,foot){
  if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(foot))return false;
  const upper=foot>=MZ-.3&&foot<ROOF-.3;
  return inside(x,z,WR-.08)&&!(upper&&inside(x,z,FR+.20));
}'''
if CAMERA_A not in js:
    js = sub_once(js, 'function surface(x,z,cur){', CAMERA_A + '\nfunction surface(x,z,cur){', 'biên camera A')
if CAMERA_B not in js:
    js = sub_once(js, 'function blocked(x,z,cx,cz){', CAMERA_B + '\nfunction blocked(x,z,cx,cz){', 'biên camera B')

# ---------- móc 4: lộ API của từng module ----------
API_A = ('api:{camera,controls,scene,roomG,roomG5,ROOMZ,Y4,Y5,NF,FH,/*[tang5]*/viewPose,flyTo,surface,keys,cameraInside,'
         'get yaw(){return yaw;},set yaw(v){yaw=v;},get pitch(){return pitch;},set pitch(v){pitch=v;},get base(){return base;},get rider(){return rider;},'
         "inLift:()=>mode==='walk'&&LIFTS.some(l=>inCab(l,camera.position.x,camera.position.z)&&(l.phase==='moving'||l.phase==='xfer'?rider===l:Math.abs(l.y-base)<.6)),"
         'ext:on=>{if(on){mode="ext";tween=null;rider=null;controls.enabled=false;dpad.hidden=true;canvas.classList.remove("walk");for(const k in keys)keys[k]=0;}},'
         'walkNow:(p,yw)=>{tween=null;rider=null;mode="walk";base=Math.round((p.y-1.6)/FH)*FH;eyeY=p.y;controls.enabled=false;yaw=yw;pitch=0;'
         'camera.position.copy(p);camera.rotation.order="YXZ";camera.rotation.set(0,-yaw,0);canvas.classList.add("walk");dpad.hidden=false;},'
         'setNight:v=>{nightTarget=v;},getMode:()=>mode,'
         'walkAt:(p,yw)=>{if(mode==="walk")setMode("orbit");enterWalk(p,yw);},'
         'stopWalk:()=>{if(mode==="walk")setMode("orbit");},'
         'orbitTo:(p,t,d)=>{if(mode==="walk")setMode("orbit");controls.enabled=true;flyTo(p,t,d==null?1:d);},'
         'orbit:(x,y,z)=>{setMode("orbit");controls.enabled=true;controls.target.set(x,y,z);},'
         'busy:()=>!!tween},')
API_B = ('api:{camera,controls,scene,viewPose,flyTo,keys,cameraInside,PIANO,sit,MZ,ROOF,plantColliders:cols7,'
         'get yaw(){return yaw;},set yaw(v){yaw=v;},get pitch(){return pitch;},set pitch(v){pitch=v;},get level(){return level;},get rider(){return rider;},'
         "inLift:()=>mode==='walk'&&LIFTS.some(l=>inCab(l,camera.position.x,camera.position.z)&&(l.phase==='moving'||l.phase==='xfer'?rider===l:l.floor===level)),"
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

# Nhận cường độ từng nốt MIDI thay cho cường độ cố định của bàn phím máy tính.
if 'function keyDown(m,vel=.78)' not in js:
    js = sub_once(js, 'function keyDown(m){', 'function keyDown(m,vel=.78){vel=Number.isFinite(vel)?Math.max(1/127,Math.min(1,vel)):.78;', 'velocity MIDI')
    js = sub_once(js, 'held[m]=1;noteOn(m);pressVisual(m,true);onPlayed(m);', 'held[m]=1;noteOn(m,vel);pressVisual(m,true);onPlayed(m);', 'âm lượng nốt MIDI')
    js = js.replace("pnOut({t:'d',m,v:.78})", "pnOut({t:'d',m,v:vel})")

# ---------- móc 7: thư viện MIDI (chỉ thay hướng dẫn đàn, giữ nguyên các bài mẫu nguồn) ----------
# Không nhúng giai điệu của những bài trong danh mục yêu cầu tệp MIDI cá nhân.
MIDI_GUIDE = r'''const NI={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
SONGS.forEach(sg=>sg.notes=sg.n.split(/\s+/).map(t=>{const [nm,d]=t.split(':');const mm=/^([A-G])(#?)(\d)$/.exec(nm);return {m:12*(+mm[3]+1)+NI[mm[1]]+(mm[2]?1:0),d:d?+d:1};}));
/* [midi-library-v2] Classical MIDIs are bundled; every listed song plays without importing a file (Nhập MIDI is optional). */
const MIDI=window.PianoMidi,LIBRARY=window.PianoLibrary;
const libraryReady=!!(LIBRARY&&Array.isArray(LIBRARY.entries)&&typeof LIBRARY.load==='function');
if(libraryReady)SONGS.push(...LIBRARY.entries.map(s=>({id:s.id,name:s.name,builtin:true,source:s.source,license:s.license,licenseUrl:s.licenseUrl,credit:s.credit,userProvided:!!s.userProvided,notes:[]})));
const songSel=$('#pb-song');
function refreshSongs(){songSel.replaceChildren(new Option('Chơi tự do',''),...SONGS.map((sg,i)=>new Option(sg.name+(sg.builtin?' · có sẵn':sg.requiresMidi?' · cần MIDI':sg.timeline?' · MIDI đã nhập':''),String(i))));}
refreshSongs();
let song=null,gmode='learn',idx=0,good=0,miss=0,demoT=[],demoOn=false;
const lane=$('#pb-lane'),guide=$('#pb-guide'),stat=$('#pb-stat'),prog=$('#pb-prog'),tip=$('#pb-tip');
const marker=mk(box(.022,.006,.05),mat('#4d86ff',{emissive:'#3a78ff',emissiveIntensity:1.6}),0,0,0,PIANO,false);marker.visible=false;
function markNext(){for(const el of Object.values(keyEls))el.classList.remove('next');marker.visible=false;
  if(!song||idx>=song.notes.length)return;const m=song.notes[idx].m;if(keyEls[m])keyEls[m].classList.add('next');
  const k=PIANO.userData.keys[m];if(k){marker.position.set(k.x,k.y+(k.b?.025:.02),k.z+(k.b?.01:.04));marker.visible=true;}}
function renderLane(){const pending=!!(song&&(song.requiresMidi||song.loadError||(song.builtin&&!song.timeline)));$('#pb-demo').disabled=pending;$('#pb-learn').disabled=pending;$('#pb-restart').disabled=pending;
  if(!song){guide.hidden=true;tip.hidden=false;markNext();return;}guide.hidden=false;tip.hidden=true;
  if(pending){lane.textContent=song.loadError?'Chưa mở được '+song.name:'Chưa có bản nhạc cho '+song.name;stat.textContent=song.loadError||'Chọn “Nhập MIDI” để gắn tệp .mid của bạn cho bài này. Tên bài không kèm giai điệu có sẵn.';prog.style.width='0%';markNext();return;}
  const from=Math.max(0,idx-2),to=Math.min(song.notes.length,from+16);let h='';
  for(let i=from;i<to;i++){const n=song.notes[i],k=keyFor(n.m);h+=`<div class="pb-chip${i<idx?' done':''}${i===idx?' now':''}${n.d>=2?' long':''}"><b>${k||'↔'}</b><small>${SOLF[n.m%12]}${n.d>=2?' —':''}</small></div>`;}
  lane.innerHTML=h;prog.style.width=(100*idx/song.notes.length)+'%';
  if(idx>=song.notes.length){stat.textContent=gmode==='demo'?'Đã phát xong bài mẫu. Chọn “Tập theo” để tự chơi.':`Hoàn thành! Bấm đúng ${good}/${good+miss} lần (${Math.round(100*good/Math.max(1,good+miss))}%). Bấm “Chơi lại” để tập tiếp.`;}
  else if(gmode==='demo')stat.textContent=`${demoOn?'Đang phát mẫu':'Đã dừng · bấm Chơi lại để phát'} · nốt ${idx+1}/${song.notes.length}`;
  else stat.textContent=`Bấm phím ${keyFor(song.notes[idx].m)||'(đổi quãng tám)'} · nốt ${idx+1}/${song.notes.length}`+(miss?` · bấm sai ${miss}`:'');
  if(song.timeline)stat.textContent+=' · '+(gmode==='learn'?'Tập nốt cao nhất mỗi thời điểm, không chấm nhịp/hợp âm.':'Phát toàn bộ nốt, hợp âm và khoảng nghỉ trong MIDI.');
  markNext();}
const midiPlayer=MIDI&&MIDI.createPlayer({down:(m,v)=>keyDown(m,v),up:m=>keyUp(m),progress:t=>{if(!song||!song.timeline)return;let lo=0,hi=song.notes.length;while(lo<hi){const mid=(lo+hi)>>1;if(song.notes[mid].at<=t)lo=mid+1;else hi=mid;}if(idx!==Math.max(0,lo-1)){idx=Math.max(0,lo-1);renderLane();}},done:()=>{demoOn=false;if(song){idx=song.notes.length;renderLane();}}});
function stopDemo(){demoT.forEach(clearTimeout);demoT=[];if(midiPlayer)midiPlayer.stop();if(demoOn){demoOn=false;releaseAll();}}
function startSong(){stopDemo();idx=0;good=0;miss=0;if(song&&shift!==0){shift=0;buildKeys();}showSongInfo();renderLane();if(song&&!song.requiresMidi&&!song.loadError&&gmode==='demo')playDemo();}
function playDemo(){audio();demoOn=true;renderLane();if(song.timeline&&midiPlayer){midiPlayer.play(song);return;}const beat=60/song.bpm*1000;let t=300;
  song.notes.forEach((n,i)=>{demoT.push(setTimeout(()=>{idx=i;renderLane();keyDown(n.m);},t));demoT.push(setTimeout(()=>keyUp(n.m),t+n.d*beat*.9));t+=n.d*beat;});
  demoT.push(setTimeout(()=>{demoOn=false;idx=song.notes.length;renderLane();},t+100));}
function onPlayed(m){if(!song||demoOn||gmode!=='learn'||idx>=song.notes.length)return;
  if(m===song.notes[idx].m){good++;idx++;renderLane();}
  else{miss++;const el=keyEls[m];if(el){el.classList.add('bad');setTimeout(()=>el.classList.remove('bad'),260);}renderLane();}}
function setGMode(v){gmode=v;$('#pb-learn').setAttribute('aria-pressed',v==='learn');$('#pb-demo').setAttribute('aria-pressed',v==='demo');startSong();}
songSel.addEventListener('change',()=>{stopDemo();song=songSel.value===''?null:SONGS[+songSel.value];
  if(song&&song.builtin&&!song.timeline)try{const loaded=LIBRARY.load(song.id);if(!loaded||!Array.isArray(loaded.notes)||!loaded.notes.length||!Array.isArray(loaded.timeline)||!Number.isFinite(loaded.duration))throw new Error('Bản MIDI chưa có dữ liệu hợp lệ.');Object.assign(song,loaded);delete song.loadError;}
  catch(e){song.loadError='Không mở được bản có sẵn: '+(e.message||'hãy tải lại trang.');}
  startSong();songSel.blur();});
const midiInput=$('#pb-midi-file'),midiStatus=$('#pb-midi-status'),midiCredit=$('#pb-midi-credit');let importVersion=0;
function sourceLink(text,value){try{const url=new URL(value);if(!/^https?:$/.test(url.protocol))return null;const a=document.createElement('a');a.textContent=text;a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';return a;}catch(_){return null;}}
function showSongInfo(){midiCredit.replaceChildren();midiCredit.hidden=!(song&&song.builtin&&!song.userProvided);
  if(song&&song.builtin){midiStatus.textContent=song.loadError||'Bản MIDI có sẵn · chọn “Nghe mẫu” để nghe, hoặc “Tập theo” để chơi từng nốt.';
    if(!song.userProvided){if(song.credit)midiCredit.append(String(song.credit));const source=sourceLink('Nguồn bản nhạc',song.source),license=sourceLink(song.license||'Giấy phép',song.licenseUrl);if(source)midiCredit.append(' · ',source);if(license)midiCredit.append(' · ',license);else if(song.license)midiCredit.append(' · '+String(song.license));}}
  else if(song&&song.requiresMidi)midiStatus.textContent='Bài này cần MIDI của bạn · chọn “Nhập MIDI” để thêm. Tệp chỉ đọc trên máy; nốt được chia sẻ khi phát.';
  else if(song&&song.timeline)midiStatus.textContent='MIDI đã nhập trong phiên này · chọn “Nghe mẫu” để phát.';
  else midiStatus.textContent=libraryReady?'Các bản cổ điển có sẵn trong danh sách · chọn một bài rồi bấm “Nghe mẫu”, không cần tải tệp.':'Chưa tải được thư viện cổ điển. Bạn vẫn có thể chơi bài mẫu hoặc nhập MIDI.';}
$('#pb-midi-import').addEventListener('click',()=>{if(MIDI)midiInput.click();else midiStatus.textContent='Chưa tải được bộ đọc MIDI. Hãy tải lại trang.';});
midiInput.addEventListener('change',async()=>{const file=midiInput.files&&midiInput.files[0];if(!file)return;const version=++importVersion,target=song&&song.requiresMidi?song:null;stopDemo();
  try{if(!/\.midi?$/i.test(file.name))throw new Error('Chọn tệp .mid hoặc .midi.');if(file.size>MIDI.LIMITS.bytes)throw new Error('Tệp MIDI tối đa 2 MB.');
    const parsed=MIDI.parse(await file.arrayBuffer());if(version!==importVersion)return;
    const entry=target||{name:file.name.replace(/\.midi?$/i,'').slice(0,80)};Object.assign(entry,{requiresMidi:false,notes:parsed.melody,timeline:parsed.timeline,duration:parsed.duration});
    if(!target)SONGS.push(entry);song=entry;refreshSongs();songSel.value=String(SONGS.indexOf(entry));gmode='learn';$('#pb-learn').setAttribute('aria-pressed','true');$('#pb-demo').setAttribute('aria-pressed','false');startSong();
    midiStatus.textContent=`Đã nhập ${file.name.slice(0,100)} · ${parsed.notes.length} nốt · ${Math.ceil(parsed.duration/1000)} giây. Tệp chỉ lưu trong phiên này; bấm “Nghe mẫu” để phát.`+(parsed.skipped.percussion||parsed.skipped.outside?' Bỏ qua trống và nốt ngoài A0–C8.':'');
  }catch(e){if(version===importVersion)midiStatus.textContent=e.message||'Không đọc được MIDI.';}finally{midiInput.value='';}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopDemo();renderLane();}});
$('#pb-learn').addEventListener('click',()=>setGMode('learn'));$('#pb-demo').addEventListener('click',()=>setGMode('demo'));
$('#pb-restart').addEventListener('click',startSong);
buildKeys();renderLane();showSongInfo();'''
MIDI_DOM = r'''  <div class="pb-row" data-midi-library>
    <button class="pb-up" id="pb-midi-import" type="button">Nhập MIDI (.mid)</button>
    <input id="pb-midi-file" type="file" accept=".mid,.midi,audio/midi,audio/x-midi" hidden>
    <span class="pb-tip" id="pb-midi-status" role="status" aria-live="polite">Chọn một bản cổ điển có sẵn rồi bấm “Nghe mẫu”, không cần tải tệp. Bạn cũng có thể nhập MIDI riêng.</span>
    <span class="pb-tip" id="pb-midi-credit" style="flex-basis:100%" hidden></span>
  </div>
'''
if '/* [midi-library-v2] Classical MIDIs' not in js:
    guide_start = js.find('const NI={C:0,D:2,E:4,F:5,G:7,A:9,B:11};')
    guide_end = js.find('buildKeys();renderLane();', guide_start) if guide_start >= 0 else -1
    if guide_start < 0 or guide_end < 0:
        errors.append('Móc "thư viện MIDI": không tìm thấy khối song guide')
    else:
        js = js[:guide_start] + MIDI_GUIDE + js[guide_end + len('buildKeys();renderLane();'):]
if 'id="pb-midi-credit"' not in dom:
    if 'id="pb-midi-file"' in dom:
        dom, count = re.subn(r'  <div class="pb-row" data-midi-library>[\s\S]*?</div>\n', lambda _: MIDI_DOM, dom, count=1)
        if count != 1:
            errors.append('Móc "nguồn MIDI": không tìm thấy hàng thư viện cũ')
    else:
        dom_anchor = '  <div class="pb-guide" id="pb-guide" hidden>'
        if dom.count(dom_anchor) != 1:
            errors.append('Móc "nhập MIDI": không tìm thấy pb-guide duy nhất')
        else:
            dom = dom.replace(dom_anchor, MIDI_DOM + dom_anchor)

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

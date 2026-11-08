/* Lớp cảnh tự sinh từ hust-3d/index.html bởi tools/patch_scene.py — đừng sửa tay */
window.__S=(n,x,y,z,ry)=>(window.__SEATLOG=window.__SEATLOG||[]).push({tag:window.__SEATTAG,n:n,x:x,y:y,z:z,ry:ry});

function buildRoom401(renderer,group){
const scene=group;
/* ---------- helpers ---------- */
let seed=20261103;
const R=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const lin=c=>new THREE.Color(c).convertSRGBToLinear();
const mc={};
function mat(c,o){const k=c+'|'+JSON.stringify(o||{});if(mc[k])return mc[k];
  const m=new THREE.MeshStandardMaterial(Object.assign({roughness:.85,metalness:0},o||{}));
  m.color=lin(c);if(o&&o.emissive)m.emissive=lin(o.emissive);return mc[k]=m;}
const gc={};
const box=(w,h,d)=>gc['b'+w+','+h+','+d]||(gc['b'+w+','+h+','+d]=new THREE.BoxGeometry(w,h,d));
const cyl=(a,b,h,s=16)=>gc['c'+a+','+b+','+h+','+s]||(gc['c'+a+','+b+','+h+','+s]=new THREE.CylinderGeometry(a,b,h,s));
const sph=gc.s||(gc.s=new THREE.SphereGeometry(1,12,9));
function mk(g,m,x=0,y=0,z=0,parent=scene,cast=true){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o;}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.userData={canvas:c,draw};return t;}
const T=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(sx,sy,sz));

/* instanced props: many chairs, monitors, desk items share draw calls */
const PROPS={};const part=(g,m,t,cast)=>({g,m,t:t||T(),cast});
function defineProp(n,parts){PROPS[n]={parts,list:[]};}
function place(n,x,y,z,ry=0,s=1){if(/^(chair|sofa|arm|cube)/.test(n))(window.__SEATLOG=window.__SEATLOG||[]).push({tag:window.__SEATTAG,n:n,x:x,y:y,z:z,ry:ry});PROPS[n].list.push(T(x,y,z,0,ry,0,s,s,s));}
function buildProps(){const tmp=new THREE.Matrix4();
  for(const k in PROPS){const P=PROPS[k];if(!P.list.length)continue;
    for(const p of P.parts){const im=new THREE.InstancedMesh(p.g,p.m,P.list.length);im.userData.propName=k;
      P.list.forEach((M,i)=>{tmp.multiplyMatrices(M,p.t);im.setMatrixAt(i,tmp);});
      im.castShadow=p.cast!==false;im.receiveShadow=true;im.frustumCulled=false;scene.add(im);}}}

/* simple walk collisions */
const colliders=[];
const addCol=(cx,cz,hx,hz)=>colliders.push([cx-hx,cx+hx,cz-hz,cz+hz]);

/* room bounds */
const X0=-21.5,X1=21.5,Z0=-13,Z1=12.5,H=4.2;

/* ---------- textures ---------- */
const floorTex=canvasTex(512,512,(g,w)=>{const n=4,s=w/n;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){g.fillStyle=`hsl(${16+R()*4},${52+R()*6}%,${89.5-R()*2.2}%)`;g.fillRect(i*s,j*s,s,s);
    g.fillStyle='rgba(255,255,255,.35)';g.fillRect(i*s+8,j*s+8,s*.35,5);}
  g.strokeStyle='rgba(196,150,134,.6)';g.lineWidth=3;
  for(let i=0;i<=n;i++){g.beginPath();g.moveTo(i*s,0);g.lineTo(i*s,w);g.stroke();g.beginPath();g.moveTo(0,i*s);g.lineTo(w,i*s);g.stroke();}});
floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;

const ceilTex=canvasTex(256,256,(g,w)=>{g.fillStyle='#efeaf2';g.fillRect(0,0,w,w);g.strokeStyle='rgba(170,160,190,.45)';g.lineWidth=2;
  for(let i=0;i<=2;i++){g.beginPath();g.moveTo(i*128,0);g.lineTo(i*128,w);g.stroke();g.beginPath();g.moveTo(0,i*128);g.lineTo(w,i*128);g.stroke();}});
ceilTex.wrapS=ceilTex.wrapT=THREE.RepeatWrapping;

const plankTex=canvasTex(256,64,(g,w,h)=>{g.fillStyle='#d49a5c';g.fillRect(0,0,w,h);
  for(let x=0;x<w;x+=32){g.fillStyle=`rgba(120,70,30,${.08+R()*.08})`;g.fillRect(x,0,32,h);g.fillStyle='rgba(110,60,25,.45)';g.fillRect(x,0,2,h);}});
plankTex.wrapS=THREE.RepeatWrapping;
function plankMat(len){const t=plankTex.clone();t.needsUpdate=true;t.repeat.set(len/1.6,1);return new THREE.MeshStandardMaterial({map:t,roughness:.8});}

/* the view outside the windows: sky, clouds, campus buildings, treetops */
const viewTex=canvasTex(4096,256,(g,w,h)=>{
  const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#3f8fe2');gr.addColorStop(.5,'#8ac7f4');gr.addColorStop(1,'#d9f0ff');g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let i=0;i<46;i++){const x=R()*w,y=34+R()*70,s=12+R()*20;g.fillStyle='#ffffff';
    for(let k=0;k<5;k++){g.beginPath();g.arc(x+k*s*.75,y-(k%2?s*.35:0),s*(.7+R()*.35),0,7);g.fill();}
    g.fillStyle='rgba(205,228,250,.9)';g.fillRect(x-s*.5,y+s*.45,s*3.8,4);}
  for(let x=40;x<w;x+=250+R()*300){const bw=150+R()*170,bh=46+R()*34,by=h-62-bh;
    g.fillStyle='#f4f7fc';g.fillRect(x,by,bw,bh);g.fillStyle='#3e64c8';g.fillRect(x-6,by-8,bw+12,10);
    g.fillStyle='#5b8fe0';for(let r=by+10;r<by+bh-8;r+=14)for(let c=x+8;c<x+bw-10;c+=16)g.fillRect(c,r,10,8);}
  const greens=['#2f8f36','#3fa83c','#56bf47','#79d35a'];
  for(let L=0;L<4;L++){for(let x=-40;x<w+40;x+=26+R()*34){const r=26+R()*34+L*4,y=h-8-R()*30+L*10;
    g.fillStyle=greens[L];g.beginPath();g.arc(x,y-L*6,r,0,7);g.fill();
    if(L>1){g.fillStyle='rgba(190,240,140,.45)';g.beginPath();g.arc(x-r*.3,y-L*6-r*.45,r*.3,0,7);g.fill();}}}
});

function posterTex(hue){return canvasTex(256,340,(g,w,h)=>{g.fillStyle='#ffffff';g.fillRect(0,0,w,h);g.strokeStyle='#c9cfe0';g.lineWidth=8;g.strokeRect(4,4,w-8,h-8);
  g.fillStyle=`hsl(${hue},70%,55%)`;g.fillRect(20,20,w-40,46);
  const cols=['#e85a4f','#f2b33d','#4f9de8','#5cbf63','#9b6fe0'];
  for(let i=0;i<4;i++){g.fillStyle=cols[(i+hue)%5];g.fillRect(22,84+i*58,60,44);g.fillStyle='#c6ccda';
    for(let k=0;k<3;k++)g.fillRect(96,88+i*58+k*14,w-120-k*18,6);}});}

const shelfSignTex=canvasTex(128,160,(g,w,h)=>{g.fillStyle='#ffffff';g.fillRect(0,0,w,h);g.strokeStyle='#3cab55';g.lineWidth=12;g.strokeRect(6,6,w-12,h-12);
  g.fillStyle='#3cab55';g.fillRect(24,26,w-48,14);g.fillStyle='#b8c0cf';for(let i=0;i<5;i++)g.fillRect(24,56+i*16,w-48-(i%2)*24,6);});

const arrowTex=canvasTex(64,80,(g,w,h)=>{g.fillStyle='#232835';g.fillRect(0,0,w,h);g.fillStyle='#57e04b';
  g.beginPath();g.moveTo(32,12);g.lineTo(54,40);g.lineTo(40,40);g.lineTo(40,66);g.lineTo(24,66);g.lineTo(24,40);g.lineTo(10,40);g.closePath();g.fill();});

const signCanvas=document.createElement('canvas');signCanvas.width=640;signCanvas.height=340;
const signTex=new THREE.CanvasTexture(signCanvas);signTex.encoding=THREE.sRGBEncoding;
function drawSign(){const g=signCanvas.getContext('2d');g.fillStyle='#1f50b5';g.fillRect(0,0,640,340);
  g.strokeStyle='#ffffff';g.lineWidth=10;g.strokeRect(20,20,600,300);g.fillStyle='#ffffff';g.textAlign='center';g.textBaseline='middle';
  g.font='700 70px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('PHÒNG',320,108);g.font='800 132px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('401',320,222);signTex.needsUpdate=true;}
drawSign();
if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load('700 70px "Be Vietnam Pro"'),document.fonts.load('800 132px "Be Vietnam Pro"')]).then(()=>{drawSign();drawTV();}).catch(()=>{});}

/* ---------- materials ---------- */
const M={
  wall:mat('#f8e8dd'), wallDark:mat('#eed7c9'), skirting:mat('#d8c3c9'),
  top:mat('#efbe84',{roughness:.65}), apron:mat('#c98b52'), leg:mat('#4f5566',{roughness:.5,metalness:.3}),
  chair:mat('#2648ad',{roughness:.6}), chairLeg:mat('#3b4150',{roughness:.4,metalness:.4}),
  dark:mat('#2a2f3d',{roughness:.45}), screenOff:mat('#1c2130',{roughness:.25}),
  screenOn:mat('#2f84e6',{emissive:'#3aa2ff',emissiveIntensity:.85,roughness:.3}),
  white:mat('#f4f6fa',{roughness:.6}), grey:mat('#d7d9e2'), shelf:mat('#a8adba',{roughness:.55,metalness:.15}),
  shelfDark:mat('#868b9a',{roughness:.55}), parapet:mat('#dcd8e3'), parapetCap:mat('#ece9f1'), inset:mat('#c9c5d3'),
  frame:mat('#e9edf5',{roughness:.5}), blind:mat('#5679b8',{roughness:.7}),
  glass:new THREE.MeshStandardMaterial({color:lin('#9ccff5'),transparent:true,opacity:.55,roughness:.1}),
  fan:mat('#2fa04a',{roughness:.5}), fanHub:mat('#e7e9ef',{roughness:.4}),
  panel:mat('#ffffff',{emissive:'#fffcf2',emissiveIntensity:.75}), panelRim:mat('#c8d2ea'),
};
const viewMat=new THREE.MeshBasicMaterial({map:viewTex});

/* ---------- floor, walls, ceiling ---------- */
const floor=new THREE.Mesh(new THREE.PlaneGeometry(X1-X0,Z1-Z0),new THREE.MeshStandardMaterial({map:floorTex,roughness:.55}));
floorTex.repeat.set((X1-X0)/2.4,(Z1-Z0)/2.4);floor.rotation.x=-Math.PI/2;floor.position.set(0,0,(Z0+Z1)/2);floor.receiveShadow=true;scene.add(floor);

const sideL=new THREE.Mesh(new THREE.PlaneGeometry(Z1-Z0,H),M.wall);sideL.rotation.y=Math.PI/2;sideL.position.set(X0,H/2,(Z0+Z1)/2);sideL.receiveShadow=true;scene.add(sideL);
const sideR=sideL.clone();sideR.rotation.y=-Math.PI/2;sideR.position.x=X1;scene.add(sideR);
mk(box(.04,.14,Z1-Z0),M.skirting,X0+.02,.07,(Z0+Z1)/2,scene,false);
mk(box(.04,.14,Z1-Z0),M.skirting,X1-.02,.07,(Z0+Z1)/2,scene,false);

const ceilingGroup=new THREE.Group();scene.add(ceilingGroup);
const ceil=new THREE.Mesh(new THREE.PlaneGeometry(X1-X0,Z1-Z0),new THREE.MeshStandardMaterial({map:ceilTex,roughness:.9}));
ceilTex.repeat.set((X1-X0)/1.2,(Z1-Z0)/1.2);ceil.rotation.x=Math.PI/2;ceil.position.set(0,H,(Z0+Z1)/2);ceilingGroup.add(ceil);

/* back wall with 15 window bays */
const WZ=Z0-.15, bayW=2.7, nBays=15, wx0=-nBays*bayW/2;
mk(box(X1-X0,1.4,.3),M.wall,0,.7,WZ);
mk(box(X1-X0,.6,.3),M.wall,0,3.9,WZ);
mk(box(X1-X0,.14,.04),M.skirting,0,.07,Z0+.02,scene,false);
mk(box(X1-X0,.08,.42),M.frame,0,1.42,Z0+.02);
for(let i=0;i<=nBays;i++)mk(box(.3,2.2,.3),M.wall,wx0+i*bayW,2.5,WZ);
mk(box(wx0-X0,2.2,.3),M.wall,(X0+wx0)/2,2.5,WZ);mk(box(wx0-X0,2.2,.3),M.wall,(X1-wx0)/2,2.5,WZ);
for(let i=0;i<nBays;i++){const cx=wx0+bayW*(i+.5);
  mk(box(bayW-.3,.62,.04),M.blind,cx,3.29,Z0-.12);
  mk(box(bayW-.3,.06,.08),M.frame,cx,2.96,Z0-.15);
  mk(box(.05,1.56,.08),M.frame,cx,2.18,Z0-.15);
  mk(box(bayW-.3,.06,.08),M.frame,cx,1.43,Z0-.15);}
const view=new THREE.Mesh(new THREE.PlaneGeometry(42,2.6),viewMat);view.position.set(0,2.5,Z0-.55);scene.add(view);

/* AC units on the back wall */
for(const x of [-11.5,1,13.5]){mk(box(1.35,.36,.3),M.white,x,3.86,Z0+.17);mk(box(1.05,.04,.02),M.dark,x,3.75,Z0+.33,scene,false);}

/* posters */
function poster(x,y,z,ry,hue){const p=new THREE.Mesh(new THREE.PlaneGeometry(1.05,1.4),new THREE.MeshStandardMaterial({map:posterTex(hue),roughness:.7}));p.position.set(x,y,z);p.rotation.y=ry;scene.add(p);}
poster(X0+.02,2.5,-9.6,Math.PI/2,2);poster(X0+.02,2.4,-5.2,Math.PI/2,4);poster(X1-.02,2.95,-11.6,-Math.PI/2,1);

/* ceiling: light panels, fans */
for(const z of [-9,-2.5,4.5])for(let x=-18;x<=18;x+=6){mk(box(1.8,.05,.62),M.panelRim,x,H-.02,z,ceilingGroup,false);mk(box(1.66,.04,.5),M.panel,x,H-.05,z,ceilingGroup,false);}
const fans=[];
function fan(x,z){const g=new THREE.Group();g.position.set(x,0,z);ceilingGroup.add(g);
  mk(cyl(.02,.02,.42,8),M.fanHub,0,H-.21,0,g,false);
  const rot=new THREE.Group();rot.position.y=H-.46;g.add(rot);
  mk(cyl(.16,.13,.12,20),M.fan,0,0,0,rot,false);mk(cyl(.09,.09,.04,16),M.panel,0,-.08,0,rot,false);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const b=mk(box(.95,.02,.2),M.fan,Math.cos(a)*.6,.01,-Math.sin(a)*.6,rot,false);b.rotation.y=a;b.rotation.x=.08;}
  fans.push(rot);}
fan(-13,-3.5);fan(-1,-3.5);fan(10.5,-3.5);fan(17.5,1.5);

/* pillars */
function pillar(x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  mk(cyl(.74,.8,.4,32),mat('#6e7490',{roughness:.45}),0,.2,0,g);
  mk(cyl(.62,.7,.12,32),mat('#8b91ab'),0,.46,0,g);
  mk(cyl(.55,.55,3.28,32),mat('#f6e6d8',{roughness:.55}),0,2.16,0,g);
  mk(cyl(.68,.58,.18,32),mat('#f0dccb'),0,3.89,0,g);
  mk(cyl(.76,.76,.16,32),mat('#f8eadf'),0,4.11,0,g);
  addCol(x,z,.78,.78);}
pillar(-6.5,-10.6);pillar(5,-10.6);pillar(-6.5,-1.3);pillar(5,-1.3);

/* ---------- props ---------- */
defineProp('table',[
  part(box(7,.06,1.1),M.top,T(0,.75,0)),
  part(box(6.9,.08,1.0),M.apron,T(0,.68,0)),
  ...[-3.35,0,3.35].flatMap(x=>[-.45,.45].map(z=>part(box(.07,.68,.07),M.leg,T(x,.34,z))))
]);
defineProp('chair',[
  part(box(.46,.07,.44),M.chair,T(0,.46,0)),
  part(box(.46,.42,.06),M.chair,T(0,.76,-.22,-.08)),
  part(box(.06,.3,.04),M.chairLeg,T(0,.54,-.22),false),
  ...[[-.19,-.18],[.19,-.18],[-.19,.18],[.19,.18]].map(([x,z])=>part(cyl(.018,.018,.43,6),M.chairLeg,T(x,.215,z)))
]);
const monitorParts=face=>[
  part(cyl(.12,.14,.02,16),M.dark,T(0,.01,-.05)),
  part(box(.04,.24,.04),M.dark,T(0,.13,-.07)),
  part(box(.58,.37,.04),M.dark,T(0,.4,-.03)),
  part(new THREE.PlaneGeometry(.53,.32),face,T(0,.4,-.008),false),
  part(box(.42,.02,.14),M.grey,T(0,.01,.22))
];
defineProp('monOn',monitorParts(M.screenOn));
defineProp('monOff',monitorParts(M.screenOff));
const lt=.25, scY=.018+.115*Math.cos(lt), scZ=-.12-.115*Math.sin(lt), nY=Math.sin(lt), nZ=Math.cos(lt);
defineProp('laptop',[
  part(box(.34,.018,.24),mat('#5d6374',{roughness:.4,metalness:.3}),T(0,.009,0)),
  part(box(.34,.23,.012),mat('#3a3f4d',{roughness:.4,metalness:.3}),T(0,scY,scZ,-lt)),
  part(new THREE.PlaneGeometry(.31,.2),mat('#8592b3',{roughness:.25}),T(0,scY+nY*.008,scZ+nZ*.008,-lt),false)
]);
defineProp('book',[
  part(box(.37,.012,.26),mat('#c9483c'),T(0,.006,0)),
  part(box(.17,.016,.24),M.white,T(-.088,.02,0,0,0,-.09)),
  part(box(.17,.016,.24),M.white,T(.088,.02,0,0,0,.09))
]);
const bottle=c=>[part(cyl(.035,.035,.2,12),mat(c,{roughness:.35}),T(0,.1,0)),part(cyl(.022,.022,.035,10),M.white,T(0,.217,0))];
defineProp('bottleBlue',bottle('#49a4ea'));
defineProp('bottlePink',bottle('#ee6f9c'));
defineProp('stack',[
  part(box(.24,.045,.3),mat('#3b6fd2'),T(0,.023,0)),
  part(box(.23,.045,.29),mat('#e8ecf3'),T(.01,.068,0,0,.12)),
  part(box(.22,.045,.28),mat('#36a3c9'),T(-.01,.113,0,0,-.08))
]);
defineProp('bush',[part(sph,mat('#46ad3f'),T(0,0,0,0,0,0,.42,.32,.36))]);
defineProp('bush2',[part(sph,mat('#6cc94f'),T(0,0,0,0,0,0,.34,.26,.3))]);
defineProp('flower',[part(sph,mat('#f59bc0',{roughness:.6}),T(0,0,0,0,0,0,.075,.06,.075),false),part(sph,mat('#fff2a8'),T(0,.04,0,0,0,0,.03,.02,.03),false)]);

/* ---------- study tables (3 columns × 4 rows) ---------- */
const TX=[-12.5,-.5,10.5], TZ=[-9.6,-4.1,1.5,7];
let tableSeats=0;
for(const tz of TZ)for(const tx of TX){
  place('table',tx,0,tz);addCol(tx,tz,3.55,1.08);
  for(let i=0;i<6;i++){const x=tx-2.75+i*1.1;
    place('chair',x+(R()-.5)*.08,0,tz-.84-R()*.08,(R()-.5)*.14);
    place('chair',x+(R()-.5)*.08,0,tz+.84+R()*.08,Math.PI+(R()-.5)*.14);tableSeats+=2;}}
/* items on the tables, laid out as in the picture */
const TOPY=.78;
const items=[
  [['bottleBlue',.6]],[['laptop',-2.2,1],['book',1.8]],[['book',.5]],
  [['stack',.3]],[['laptop',-2,1],['bottleBlue',.4]],[['laptop',2,1]],
  [['stack',-1.4],['bottlePink',.6],['laptop',1.4,1]],[['laptop',-2.6,1],['stack',-1],['book',.9],['laptop',2.3,-1]],[['book',-1.9],['bottlePink',-.2],['laptop',1.4,-1]],
  [['stack',-1.6],['bottlePink',.4],['laptop',1.6,-1]],[['book',-.4],['laptop',1.6,1]],[['laptop',-1.3,-1],['bottleBlue',.8]]
];
items.forEach((list,idx)=>{const tx=TX[idx%3],tz=TZ[idx/3|0];
  for(const [n,dx,side] of list){const s=side||(R()<.5?1:-1);const ry=(s>0?0:Math.PI)+(R()-.5)*.3;
    place(n,tx+dx,TOPY,tz+s*.15,ry);}});

/* ---------- computer counter (L shape with rounded corner) ---------- */
const CT=.76;
function counterSeg(cx,cz,len,ry,mon){
  const top=mk(box(len,.05,.82),M.top,cx,CT,cz);top.rotation.y=ry;
  const body=mk(box(len,CT-.03,.66),plankMat(len),cx,(CT-.03)/2,cz);body.rotation.y=ry;}
/* left run along the wall */
const LX=-19.8, LZa=-11.3, LZb=8.3;
counterSeg(LX,(LZa+LZb)/2,LZb-LZa,Math.PI/2);addCol(LX,(LZa+LZb)/2,.45,(LZb-LZa)/2);
/* corner arc */
const ac={x:-17.8,z:8.3,r:2};
for(let i=0;i<7;i++){const a0=Math.PI-i*(Math.PI/2)/7,a1=Math.PI-(i+1)*(Math.PI/2)/7,am=(a0+a1)/2;
  const x=ac.x+ac.r*Math.cos(am),z=ac.z+ac.r*Math.sin(am);const tx=-Math.sin(am),tz=Math.cos(am);
  counterSeg(x,z,ac.r*(Math.PI/2)/7+.06,Math.atan2(-tz,tx));addCol(x,z,.5,.5);}
/* front run */
const FZ=10.3, FXa=-17.8, FXb=-6.6;
counterSeg((FXa+FXb)/2,FZ,FXb-FXa,0);addCol((FXa+FXb)/2,FZ,(FXb-FXa)/2,.45);
let computers=0;
for(let i=0;i<12;i++){const z=-10.4+i*1.55;place('monOn',LX-.12,CT+.025,z,Math.PI/2);place('chair',LX+1.05,0,z+(R()-.5)*.1,-Math.PI/2+(R()-.5)*.15);computers++;}
for(const x of [-16.6,-14.3,-12,-9.7,-7.4]){place('monOff',x,CT+.025,FZ-.12,0);place('chair',x+(R()-.5)*.1,0,FZ+1.02,Math.PI+(R()-.5)*.15);computers++;}

/* ---------- bookshelves (6 double-sided rows) ---------- */
const bookColors=['#e2463f','#2f6fd6','#3cae55','#f2b632','#f07c2e','#f4f4f6','#36a7c9','#8b5bd6','#d93f6a','#1f4aa8','#6cc04a'].map(lin);
const books=[];let shelfCount=0;
function shelfRow(xa,xb,z){const L=xb-xa,cx=(xa+xb)/2,D=.72;shelfCount++;
  mk(box(L,.12,D),M.shelfDark,cx,.06,z);
  mk(box(L+.06,.06,D+.04),M.shelf,cx,2.18,z);
  mk(box(L,2.1,.03),M.shelf,cx,1.1,z);
  mk(box(.06,2.2,D),M.shelf,xa,1.1,z);mk(box(.06,2.2,D),M.shelf,xb,1.1,z);
  const levels=[.12,.53,.94,1.35,1.76];
  for(const y of levels.slice(1))mk(box(L,.03,D-.02),M.shelf,cx,y-.015,z,scene,false);
  const bays=Math.round(L/1.15),bw=L/bays;
  for(let b=1;b<bays;b++)mk(box(.03,2.06,D-.02),M.shelf,xa+b*bw,1.13,z,scene,false);
  for(const s of [-1,1])for(const y of levels)for(let b=0;b<bays;b++){
    let x=xa+b*bw+.05;const end=xa+(b+1)*bw-.04;
    while(x<end){const w=.026+R()*.03;if(x+w>end)break;
      if(R()<.04){x+=.04+R()*.05;continue;}
      const h=.22+R()*.12,d=.2+R()*.07;
      books.push({m:T(x+w/2,y+h/2,z+s*(.345-d/2-.02),0,0,R()<.03?.25:0,w,h,d),c:bookColors[R()*bookColors.length|0]});x+=w+.002;}}
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(.42,.52),new THREE.MeshStandardMaterial({map:shelfSignTex,roughness:.6}));
  sign.position.set(xa-.035,1.55,z);sign.rotation.y=-Math.PI/2;scene.add(sign);
  addCol(cx,z,L/2+.04,D/2);}
/* six rows, all the same length */
[-10.6,-8.1,-5.6,-3.1,-.6,1.9].forEach(z=>shelfRow(15.6,21.3,z));
{const im=new THREE.InstancedMesh(box(1,1,1),mat('#ffffff',{roughness:.75}),books.length);
  books.forEach((b,i)=>{im.setMatrixAt(i,b.m);im.setColorAt(i,b.c);});im.instanceColor.needsUpdate=true;
  im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;scene.add(im);}

/* ---------- plants ---------- */
const greens=['#3fae44','#5cc552','#2e8e3c','#7ad35f'].map(c=>mat(c,{roughness:.7}));
function plant(x,y,z,s=1,pot='#ffffff'){const g=new THREE.Group();
  mk(cyl(.17,.13,.24,18),mat(pot,{roughness:.45}),0,.12,0,g);mk(cyl(.155,.155,.02,18),mat('#6b4a33'),0,.235,0,g);
  const n=12;for(let i=0;i<n;i++){const piv=new THREE.Group();piv.position.y=.24;piv.rotation.y=i/n*Math.PI*2+R()*.5;
    const inner=new THREE.Group();inner.rotation.z=.25+R()*.75;const L=.24+R()*.2;
    const lf=new THREE.Mesh(sph,greens[i%4]);lf.scale.set(.065,L,.02);lf.position.y=L;lf.castShadow=true;inner.add(lf);piv.add(inner);g.add(piv);}
  g.position.set(x,y,z);g.scale.setScalar(s);scene.add(g);}
function hanging(x,y,z,s=1){const g=new THREE.Group();
  mk(cyl(.12,.09,.14,14),mat('#e9edf3'),0,.07,0,g);
  for(let i=0;i<6;i++){const lf=new THREE.Mesh(sph,greens[i%4]);const a=i/6*Math.PI*2;lf.scale.set(.06,.16,.03);lf.position.set(Math.cos(a)*.08,.2,Math.sin(a)*.08);lf.rotation.set(Math.sin(a)*.6,0,-Math.cos(a)*.6);g.add(lf);}
  for(let v=0;v<4;v++){const a=v/4*Math.PI*2+.4,len=5+(R()*4|0);
    for(let k=0;k<len;k++){const lf=new THREE.Mesh(sph,greens[(v+k)%4]);lf.scale.set(.055,.08,.03);
      lf.position.set(Math.cos(a)*(.12+k*.01)+(k%2?.03:-.03),.02-k*.12,Math.sin(a)*(.12+k*.01));g.add(lf);}}
  g.position.set(x,y,z);g.scale.setScalar(s);scene.add(g);}
plant(-19.8,CT+.02,-11,.9);plant(-18.4,CT+.02,9.9,.85);plant(-6.95,CT+.02,FZ,.85);
plant(18.7,0,11.4,2.1);addCol(18.7,11.4,.4,.4);
hanging(X0+.35,3.05,-7.4,1.1);hanging(X0+.35,3.05,-.5,1.1);
[-10.6,-8.1,-5.6,-3.1,-.6,1.9].forEach((z,i)=>{if(i!==1)hanging(16.05,2.21,z,1);});

/* ---------- duty desk: half a stadium lying along the front wall, its flat cut side against the wall
   right of the door (on your right as you walk in), the rounded side facing the students ---------- */
const FZW=12.5;const DD={zw:FZW-.2,xc:5.95,a:1.0};
function halfStad(r){const pts=[],n=16,{zw,xc,a}=DD;
  for(let i=0;i<=n;i++){const t=i/n*Math.PI/2;pts.push([xc-a-r*Math.cos(t),zw-r*Math.sin(t)]);}
  for(let i=0;i<=n;i++){const t=i/n*Math.PI/2;pts.push([xc+a+r*Math.sin(t),zw-r*Math.cos(t)]);}
  return pts;}
function bandGeo(ro,ri,h){const o=halfStad(ro),inn=halfStad(ri).reverse();const sh=new THREE.Shape([...o,...inn].map(([x,z])=>new THREE.Vector2(x,-z)));
  const g=new THREE.ExtrudeGeometry(sh,{depth:h,bevelEnabled:false,curveSegments:16});g.rotateX(-Math.PI/2);return g;}
{const body=new THREE.Mesh(bandGeo(1.9,1.38,.98),mat('#d9a066',{roughness:.6,side:THREE.DoubleSide}));body.castShadow=body.receiveShadow=true;scene.add(body);
  scene.add(new THREE.Mesh(bandGeo(1.86,1.42,.12),mat('#8a5a33',{side:THREE.DoubleSide})));
  const top=new THREE.Mesh(bandGeo(1.98,1.32,.05),mat('#f2d3a2',{roughness:.45,side:THREE.DoubleSide}));top.position.y=.98;top.castShadow=top.receiveShadow=true;scene.add(top);
  const work=new THREE.Mesh(bandGeo(1.4,.9,.04),mat('#f4f1ea',{roughness:.4,side:THREE.DoubleSide}));work.position.y=.72;work.receiveShadow=true;scene.add(work);
  for(const dx of [-1.6,0,1.6])mk(box(.05,.72,.05),M.leg,DD.xc+dx,.36,DD.zw-1.15);
  place('monOn',DD.xc-.3,.76,DD.zw-1.12,0);place('chair',DD.xc-.2,0,DD.zw-.45,Math.PI);
  mk(box(.22,.06,.18),M.dark,DD.xc+.75,.79,DD.zw-1.15);
  [['#2f6fd6',3],['#e2463f',2]].forEach(([c,n],k)=>{for(let i=0;i<n;i++){const bk=mk(box(.34,.05,.26),mat(c),DD.xc+1.3+k*.4,.76+.025+i*.052,DD.zw-1.1);bk.rotation.y=(R()-.5)*.3;}});
  addCol(DD.xc,DD.zw-1.0,DD.a+1.95,1.05);}
/* a solid piece of the front wall behind the desk, with the TV and the wall clock */
{const p=new THREE.Mesh(new THREE.PlaneGeometry(6.0,H-1.05),M.wall);p.position.set(DD.xc,1.05+(H-1.05)/2,FZW-.04);p.rotation.y=Math.PI;scene.add(p);}
const tvTex=canvasTex(640,360,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#14306e');gr.addColorStop(1,'#2a63c4');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,h-70,w,70);g.fillStyle='#ffffff';g.textAlign='left';g.textBaseline='middle';
  g.font='800 40px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('THƯ VIỆN TẠ QUANG BỬU',36,64);
  g.font='600 30px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Phòng 401 · Phòng học tự do',36,124);
  g.font='500 26px "Be Vietnam Pro", system-ui, sans-serif';g.fillStyle='#cfe0ff';g.fillText('Mở cửa 7:30 – 21:00 · Thứ Hai – Thứ Bảy',36,176);g.fillText('Giữ trật tự · Để điện thoại ở chế độ im lặng',36,216);
  g.fillStyle='#ffd27a';g.font='600 26px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Mượn – trả sách tại phòng mượn sách tầng 1',36,h-35);});
function drawTV(){const u=tvTex.userData;if(u&&u.canvas){u.draw(u.canvas.getContext('2d'),u.canvas.width,u.canvas.height);tvTex.needsUpdate=true;}}
mk(box(1.72,.98,.07),M.dark,DD.xc,2.35,FZW-.09);
{const tv=new THREE.Mesh(new THREE.PlaneGeometry(1.62,.9),new THREE.MeshBasicMaterial({map:tvTex}));tv.position.set(DD.xc,2.35,FZW-.13);tv.rotation.y=Math.PI;scene.add(tv);}
const clockTex=canvasTex(256,256,(g,w)=>{g.fillStyle='#ffffff';g.beginPath();g.arc(w/2,w/2,w/2-6,0,7);g.fill();g.strokeStyle='#2a2f3d';g.lineWidth=10;g.stroke();
  g.fillStyle='#2a2f3d';for(let i=0;i<60;i++){const a=i/60*Math.PI*2,r1=w/2-18,r2=r1-(i%5?6:16);g.save();g.translate(w/2,w/2);g.rotate(a);g.fillRect(-(i%5?1.5:3.5),-r1,i%5?3:7,r1-r2);g.restore();}
  g.font='600 26px system-ui, sans-serif';g.textAlign='center';g.textBaseline='middle';for(let i=1;i<=12;i++){const a=i/12*Math.PI*2;g.fillText(i,w/2+Math.sin(a)*(w/2-58),w/2-Math.cos(a)*(w/2-58));}});
const clock=new THREE.Group();clock.position.set(DD.xc,3.5,FZW-.08);clock.rotation.y=Math.PI;scene.add(clock);
{const rim=mk(cyl(.3,.3,.06,40),M.dark,0,0,0,clock,false);rim.rotation.x=Math.PI/2;
  const face=new THREE.Mesh(new THREE.PlaneGeometry(.54,.54),new THREE.MeshBasicMaterial({map:clockTex,transparent:true}));face.position.z=.032;clock.add(face);}
const hands={};for(const [k,w,l,c,z] of [['h',.026,.13,'#1c2130',.036],['m',.018,.2,'#1c2130',.04],['s',.008,.22,'#d93a2f',.044]]){const p=new THREE.Group();p.position.z=z;clock.add(p);
  const hnd=new THREE.Mesh(box(w,l,.006),mat(c));hnd.position.y=l/2-.025;p.add(hnd);hands[k]=p;}
/* book display table near the entrance */
function desk(cx,cz,w,d){mk(box(w,.05,d),M.top,cx,.78,cz);mk(box(w-.06,.75,d-.08),plankMat(w),cx,.375,cz);addCol(cx,cz,w/2,d/2);}
desk(16.0,10.9,3.1,.85);
[[14.9,'#2f6fd6',4],[15.6,'#e2463f',3],[16.3,'#e8ecf3',4],[16.9,'#3cae55',3]].forEach(([x,c,n])=>{for(let i=0;i<n;i++){const b=mk(box(.38,.055,.28),mat(c),x,.83+i*.058,10.9);b.rotation.y=(R()-.5)*.25;}});
const stand2=mk(box(.3,.42,.03),M.white,17.35,1.02,10.8);stand2.rotation.x=-.25;

/* trash bin */
mk(box(.42,.82,.36),mat('#e3e5ec'),4.6,.41,-12.5);mk(box(.28,.03,.02),M.dark,4.6,.72,-12.31,scene,false);addCol(4.6,-12.5,.25,.22);

/* ---------- front: low wall, planters, turnstiles, sign ---------- */
const PZ=12.5,PH=1.05;
function parapet(xa,xb){const L=xb-xa,cx=(xa+xb)/2;
  mk(box(L,PH,.34),M.parapet,cx,PH/2,PZ);mk(box(L+.04,.07,.42),M.parapetCap,cx,PH+.035,PZ);
  for(let x=xa+1.5;x<xb-1;x+=2.9){mk(box(2.3,.5,.02),M.parapetCap,x,.58,PZ+.18,scene,false);mk(box(2.12,.36,.03),M.inset,x,.58,PZ+.185,scene,false);}
  addCol(cx,PZ+.35,L/2,.55);}
parapet(X0,-4.1);parapet(2.7,X1);
for(const x of [-3.85,2.45]){mk(box(.4,1.15,.5),mat('#e4e6ec'),x,.575,PZ);addCol(x,PZ,.2,.25);}
const flaps=[];
function turnstile(x,dir){mk(box(.28,1.08,.72),mat('#eef0f4',{roughness:.4}),x,.54,PZ);mk(box(.22,.02,.4),M.dark,x,1.09,PZ,scene,false);
  const a=new THREE.Mesh(new THREE.PlaneGeometry(.17,.21),new THREE.MeshBasicMaterial({map:arrowTex}));a.position.set(x,.84,PZ+.362);scene.add(a);
  const piv=new THREE.Group();piv.position.set(x+dir*.14,0,PZ);scene.add(piv);
  const f=mk(box(1.0,.5,.025),M.glass,dir*.5,.68,0,piv);f.castShadow=false;flaps.push({piv,dir});addCol(x,PZ,.14,.36);}
turnstile(-3.1,1);turnstile(1.7,-1);
function planter(cx,w){mk(box(w,.44,.62),mat('#eceef3'),cx,.22,PZ+.5);mk(box(w-.12,.04,.5),mat('#6b4a33'),cx,.44,PZ+.5,scene,false);
  for(let x=cx-w/2+.3;x<cx+w/2-.2;x+=.34){place(R()<.5?'bush':'bush2',x+(R()-.5)*.1,.52+R()*.08,PZ+.38+R()*.25,R()*3);}
  for(let i=0;i<w*7;i++)place('flower',cx+(R()-.5)*(w-.4),.68+R()*.12,PZ+.3+R()*.42,R()*3);}
planter(-15,4.6);planter(-8.6,4.6);planter(7.2,4.6);
const signFrame=mk(box(2.75,1.5,.08),mat('#e8eaf0'),13.4,1.0,PZ+.22);
const signFace=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.38),new THREE.MeshStandardMaterial({map:signTex,roughness:.5}));signFace.position.set(13.4,1.0,PZ+.265);scene.add(signFace);

buildProps();
/* inner face of the front wall above the parapet, where the room is wider than the hall */
for(const sx of [-1,1]){const p=new THREE.Mesh(new THREE.PlaneGeometry(2.05,H-1.05),M.wall);p.position.set(sx*20.5,1.05+(H-1.05)/2,PZ-.02);p.rotation.y=Math.PI;scene.add(p);}
drawSign();
const _hit=(x,z)=>{const r=.28;for(const c of colliders)if(x>c[0]-r&&x<c[1]+r&&z>c[2]-r&&z<c[3]+r)return true;return false;};
let gateOpen=0;
return {colliders,PZ,X0,X1,Z0,Z1,H,ceilingGroup,
  hit:_hit,
  update(dt,lx,lz,walking){const near=walking&&Math.hypot(lx+.7,lz-PZ)<3.2?1:0;const go=gateOpen+(near-gateOpen)*Math.min(1,dt*5);
    if(Math.abs(go-gateOpen)>1e-4){gateOpen=go;flaps.forEach(f=>f.piv.rotation.y=f.dir*gateOpen*Math.PI/2*.95);}
    fans.forEach(f=>f.rotation.y+=6*dt);
    const d=new Date(),sec=d.getSeconds()+d.getMilliseconds()/1000,mi=d.getMinutes()+sec/60,hr=d.getHours()%12+mi/60;
    hands.s.rotation.z=-sec/60*Math.PI*2;hands.m.rotation.z=-mi/60*Math.PI*2;hands.h.rotation.z=-hr/12*Math.PI*2;},
  applyNight(t){viewMat.color.copy(lin('#ffffff')).lerp(lin('#26305e'),t);M.panel.emissiveIntensity=.75+t*.85;}};
}

function moduleA(ctx,root){"use strict";window.__SEATTAG="A";
const ME={};
const $=s=>root.querySelector(s);
const canvasEl=ctx.canvas;
const canvas={addEventListener:(t,f,o)=>canvasEl.addEventListener(t,e=>{if(ctx.cur===ME)f(e);},o),classList:canvasEl.classList,
  getBoundingClientRect:()=>canvasEl.getBoundingClientRect(),setPointerCapture:i=>{try{canvasEl.setPointerCapture(i);}catch(_){}}};
const addEventListener=(t,f,o)=>window.addEventListener(t,e=>{if(ctx.cur===ME)f(e);},o);
const renderer=ctx.renderer;
const PI=Math.PI;

/* ---------- renderer / scene ---------- */
const scene=new THREE.Group();ctx.world.add(scene);
const camera=new THREE.PerspectiveCamera(45,1,0.1,300);
const controls=new THREE.OrbitControls(camera,canvasEl);
controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=2.75;
controls.minDistance=1.2;controls.maxDistance=100;controls.screenSpacePanning=true;

/* ---------- helpers ---------- */
let seed=20261101;
const R=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const lin=c=>new THREE.Color(c).convertSRGBToLinear();
const mc={};
function mat(c,o){const k=c+'|'+JSON.stringify(o||{});if(mc[k])return mc[k];
  const m=new THREE.MeshStandardMaterial(Object.assign({roughness:.85,metalness:0},o||{}));
  m.color=lin(c);if(o&&o.emissive)m.emissive=lin(o.emissive);return mc[k]=m;}
const gc={};
const box=(w,h,d)=>gc['b'+w+','+h+','+d]||(gc['b'+w+','+h+','+d]=new THREE.BoxGeometry(w,h,d));
const cyl=(a,b,h,s=20)=>gc['c'+a+','+b+','+h+','+s]||(gc['c'+a+','+b+','+h+','+s]=new THREE.CylinderGeometry(a,b,h,s));
const sph=new THREE.SphereGeometry(1,16,12);
function mk(g,m,x=0,y=0,z=0,parent=scene,cast=true){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o;}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.userData={canvas:c,draw};return t;}
const T=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(sx,sy,sz));
const PROPS={};const part=(g,m,t,cast)=>({g,m,t:t||T(),cast});
function defineProp(n,parts){PROPS[n]={parts,list:[]};}
function place(n,x,y,z,ry=0,s=1){if(/^(chair|sofa|arm|cube)/.test(n))(window.__SEATLOG=window.__SEATLOG||[]).push({tag:window.__SEATTAG,n:n,x:x,y:y,z:z,ry:ry});PROPS[n].list.push(T(x,y,z,0,ry,0,s,s,s));}
function buildProps(){const tmp=new THREE.Matrix4();
  for(const k in PROPS){const P=PROPS[k];if(!P.list.length)continue;
    for(const p of P.parts){const im=new THREE.InstancedMesh(p.g,p.m,P.list.length);im.userData.propName=k;
      P.list.forEach((M,i)=>{tmp.multiplyMatrices(M,p.t);im.setMatrixAt(i,tmp);});
      im.castShadow=p.cast!==false;im.receiveShadow=true;im.frustumCulled=false;scene.add(im);}}}
const faceTo=(x,z,tx,tz)=>Math.atan2(tx-x,tz-z);
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
/* a flat plane facing a given direction (ry: 0 → +z, PI → −z, PI/2 → +x, −PI/2 → −x) */
function panel(w,h,m,x,y,z,ry,parent=scene){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);p.position.set(x,y,z);p.rotation.y=ry;p.receiveShadow=true;parent.add(p);return p;}
function tiled(tex,w,tileW,o={}){const t=tex.clone();t.needsUpdate=true;t.wrapS=THREE.RepeatWrapping;t.repeat.set(w/tileW,1);return new THREE.MeshStandardMaterial(Object.assign({map:t,roughness:.5},o));}
/* colliders: circles [x,z,r] or rectangles [x0,x1,z0,z1]; G = tầng 1 floor, M = tầng 2 */
const colsG=[],colsM=[];
const hit=(list,x,z)=>{for(const c of list){if(c.length===3){if(Math.hypot(x-c[0],z-c[1])<c[2]+.25)return true;}
  else if(x>c[0]-.25&&x<c[1]+.25&&z>c[2]-.25&&z<c[3]+.25)return true;}return false;};
function arcRun(cx,cz,r,th0,th1,segs,depth,h,y,m,list){const L2=r*Math.abs(th1-th0)/segs*1.06;
  for(let i=0;i<segs;i++){const th=th0+(i+.5)*(th1-th0)/segs;const x=cx+r*Math.sin(th),z=cz+r*Math.cos(th);
    const o=mk(box(L2,h,depth),m,x,y,z);o.rotation.y=th;if(list)list.push([x,z,Math.max(depth,L2)/2+.05]);}}

/* ---------- dimensions ----------
   The atrium is a stadium lying along x: straight runs at z = ±r for |x| ≤ L, half-circles at both ends.
   Four floors (tầng 1–4) ring the void; the top is closed by an oval ceiling with a sun painting. */
const XW=19.5,ZB=-13,ZF=13,FH=4.5,MZ=FH,SB=FH-.4,NF=4,CH=NF*FH,L=7,FR=7.5;
const liftZ=[-2.9,0,2.9], OW=.7, DH=2.45, STACK=4*FH+1.4, LBASE={1:0,2:FH,3:2*FH,4:3*FH,6:STACK,7:STACK+5.25,10:STACK+10.8}, FLOORS=[1,2,3,4], ROOMZ=-25.5;
const cols3=[],cols4=[],LCOL={1:colsG,2:colsM,3:cols3,4:cols4};
const STR={ri:5.0,ro:7.0,rm:6.0,a0:1.0,a1:-PI/2,N:32};   // two stairs hugging the inside of the void ends
const LAND={x0:L-2.4,x1:L+.05,z0:-7.9,z1:-4.95};          // landing at the top of each stair (mirrored for the left one)

/* stadium helpers (long axis x) */
const perim=r=>2*PI*r+4*L;
function stadAt(r,s){const P=perim(r);s=((s%P)+P)%P;
  if(s<2*L)return {x:-L+s,z:-r,tx:1,tz:0};s-=2*L;const a=PI*r;
  if(s<a){const al=-PI/2+s/r;return {x:L+r*Math.cos(al),z:r*Math.sin(al),tx:-Math.sin(al),tz:Math.cos(al)};}
  s-=a;if(s<2*L)return {x:L-s,z:r,tx:-1,tz:0};s-=2*L;
  const al=PI/2+s/r;return {x:-L+r*Math.cos(al),z:r*Math.sin(al),tx:-Math.sin(al),tz:Math.cos(al)};}
const ryOf=p=>Math.atan2(-p.tz,p.tx);
const inside=(x,z,r)=>{const dx=Math.max(0,Math.abs(x)-L);return dx*dx+z*z<r*r;};
function stadPts(r,flip){const P=perim(r),n=Math.ceil(P/.25),o=[];for(let i=0;i<n;i++){const p=stadAt(r,P*i/n);o.push(new THREE.Vector2(p.x,flip?-p.z:p.z));}return o;}
function ribbon(r,y0,y1,m,o={}){const s0=o.s0||0,s1=o.s1!==undefined?o.s1:perim(r),n=Math.max(2,Math.ceil((s1-s0)/(o.step||.25)));
  const pos=[],uv=[],idx=[];for(let i=0;i<=n;i++){const s=s0+(s1-s0)*i/n,p=stadAt(r,s);pos.push(p.x,y0,p.z,p.x,y1,p.z);const u=(s-s0)/(o.uLen||1);uv.push(u,0,u,1);}
  for(let i=0;i<n;i++){const a=2*i;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;mesh.castShadow=!!o.cast;(o.parent||scene).add(mesh);return mesh;}
/* a flat stadium (optionally a rectangle with a stadium hole), facing up or down */
function stadFlat(r,y,m,down,parent=scene,uvFit){const sh=new THREE.Shape(stadPts(r,!down));const g=new THREE.ShapeGeometry(sh);
  if(uvFit){const p=g.attributes.position,uv=g.attributes.uv,W=L+r;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+W)/(2*W),(p.getY(i)+r)/(2*r));}
  const mesh=new THREE.Mesh(g,m);mesh.rotation.x=down?PI/2:-PI/2;mesh.position.y=y;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function slabRect(y,m,down,parent=scene){const f=down?1:-1;const sh=new THREE.Shape([new THREE.Vector2(-XW,ZB*f),new THREE.Vector2(XW,ZB*f),new THREE.Vector2(XW,ZF*f),new THREE.Vector2(-XW,ZF*f)]);
  sh.holes.push(new THREE.Path(stadPts(FR,!down)));const mesh=new THREE.Mesh(new THREE.ShapeGeometry(sh),m);mesh.rotation.x=down?PI/2:-PI/2;mesh.position.y=y;mesh.receiveShadow=true;mesh.castShadow=!down;parent.add(mesh);return mesh;}
/* groups for the floors above tầng 2, hidden in the bird's-eye views */
const UP=[null,null,null,new THREE.Group(),new THREE.Group()],TOP=new THREE.Group();scene.add(UP[3],UP[4],TOP);
const grp=lv=>lv>=3?UP[lv]:scene;

/* ---------- textures ---------- */
function tileTex(base,grout,light,n=4){const t=canvasTex(512,512,(g,w)=>{const s=w/n;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){g.fillStyle=base();g.fillRect(i*s,j*s,s,s);
    const gr=g.createLinearGradient(i*s,j*s,i*s+s,j*s+s);gr.addColorStop(0,`rgba(255,255,255,${light})`);gr.addColorStop(.5,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,0,.05)');g.fillStyle=gr;g.fillRect(i*s,j*s,s,s);}
  g.strokeStyle=grout;g.lineWidth=3;for(let i=0;i<=n;i++){g.beginPath();g.moveTo(i*s,0);g.lineTo(i*s,w);g.stroke();g.beginPath();g.moveTo(0,i*s);g.lineTo(w,i*s);g.stroke();}});
  t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
const whiteTex=tileTex(()=>`hsl(${30+R()*10},${10+R()*6}%,${90-R()*3}%)`,'rgba(185,178,170,.55)',.25);
const redTex=tileTex(()=>`hsl(${358+R()*5},${52+R()*8}%,${33+R()*4}%)`,'rgba(220,170,160,.5)',.2);
const mezTex=tileTex(()=>`hsl(${32+R()*8},12%,${88-R()*3}%)`,'rgba(185,178,170,.5)',.2);
/* star inlay: bordeaux and cream rays on light grey tiles, as in the hall */
const starTex=canvasTex(1024,1024,(g,w)=>{g.fillStyle='#2c2f36';g.fillRect(0,0,w,w);
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){g.fillStyle=`hsl(220,${6+R()*4}%,${27+R()*4}%)`;g.fillRect(i*w/8+2,j*w/8+2,w/8-4,w/8-4);}
  const c=w/2,star=(n,ro,ri,rot,col)=>{g.fillStyle=col;g.beginPath();for(let i=0;i<2*n;i++){const a=rot+i*PI/n,r=i%2?ri:ro;g.lineTo(c+Math.cos(a)*r,c+Math.sin(a)*r);}g.closePath();g.fill();};
  const ray=(a,len,half,col,inner)=>{g.fillStyle=col;g.beginPath();g.moveTo(c+Math.cos(a-half)*inner,c+Math.sin(a-half)*inner);g.lineTo(c+Math.cos(a)*len,c+Math.sin(a)*len);g.lineTo(c+Math.cos(a+half)*inner,c+Math.sin(a+half)*inner);g.closePath();g.fill();};
  star(16,w*.49,w*.25,-PI/2,'#c9473a');
  for(let i=0;i<16;i++)ray(-PI/2+i*PI/8+PI/16,w*.43,PI/15,'#f2d7a4',w*.16);
  for(let i=0;i<16;i++)ray(-PI/2+i*PI/8,w*.36,PI/22,'#e5b052',w*.12);
  g.fillStyle='#c9473a';g.beginPath();g.arc(c,c,w*.15,0,7);g.fill();g.fillStyle='#f2d7a4';g.beginPath();g.arc(c,c,w*.12,0,7);g.fill();g.fillStyle='#c9473a';g.beginPath();g.arc(c,c,w*.1,0,7);g.fill();});
/* parapet face: grey inset panels in white frames */
const paraTex=canvasTex(512,256,(g,w,h)=>{g.fillStyle='#ebe9e3';g.fillRect(0,0,w,h);g.fillStyle='#dedbd3';g.fillRect(0,h*.72,w,h*.28);
  g.fillStyle='#f7f5f0';g.fillRect(14,14,w-28,h*.56);g.fillStyle='#98a09f';g.fillRect(26,26,w-52,h*.56-24);
  g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=3;g.strokeRect(34,34,w-68,h*.56-40);
  g.fillStyle='#f7f5f0';g.fillRect(14,h*.76,w-28,h*.16);g.fillStyle='#a9aeac';g.fillRect(24,h*.78,w-48,h*.12);});
paraTex.wrapS=THREE.RepeatWrapping;
/* the oval sun painting on the top ceiling */
const sunTex=canvasTex(2048,1024,(g,w,h)=>{g.fillStyle='#f4f2ee';g.fillRect(0,0,w,h);const cx=w/2,cy=h/2,sx=1.85;
  const petal=(a,len,wid,c1,c2)=>{g.save();g.translate(cx,cy);g.scale(sx,1);g.rotate(a);
    g.fillStyle=c1;g.beginPath();g.moveTo(70,0);g.quadraticCurveTo(len*.55,-wid,len,-wid*.25);g.lineTo(len*.94,0);g.closePath();g.fill();
    g.fillStyle=c2;g.beginPath();g.moveTo(70,0);g.quadraticCurveTo(len*.55,wid,len,wid*.25);g.lineTo(len*.94,0);g.closePath();g.fill();g.restore();};
  for(let i=0;i<16;i++){const a=i*PI/8,long=i%2===0;petal(a,long?460:330,long?78:58,'#f0a316','#d96a1e');}
  g.save();g.translate(cx,cy);g.scale(sx,1);g.fillStyle='#c4472a';for(let i=0;i<24;i++){const a=i*PI/12;g.beginPath();g.arc(Math.cos(a)*62,Math.sin(a)*62,6,0,7);g.fill();}
  g.fillStyle='#f6d58a';g.beginPath();g.arc(0,0,40,0,7);g.fill();g.fillStyle='#e08b2a';for(let i=0;i<8;i++){const a=i*PI/4;g.beginPath();g.ellipse(Math.cos(a)*20,Math.sin(a)*20,16,7,a,0,7);g.fill();}
  g.fillStyle='#c4472a';g.beginPath();g.arc(0,0,9,0,7);g.fill();g.restore();});
const ceilTex=canvasTex(256,256,(g,w)=>{g.fillStyle='#f3f2ef';g.fillRect(0,0,w,w);g.strokeStyle='rgba(180,175,168,.5)';g.lineWidth=2;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*64,0);g.lineTo(i*64,w);g.stroke();g.beginPath();g.moveTo(0,i*64);g.lineTo(w,i*64);g.stroke();}});
ceilTex.wrapS=ceilTex.wrapT=THREE.RepeatWrapping;
const winTex=canvasTex(256,192,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#7fb8ea');gr.addColorStop(1,'#d6edf8');g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let x=0;x<w;x+=30){g.fillStyle=['#3c9a45','#58b54e'][x/30%2|0];g.beginPath();g.arc(x+R()*10,h-10-R()*14,24+R()*10,0,7);g.fill();}
  g.fillStyle='#5c6672';g.fillRect(0,0,w,8);g.fillRect(0,h-8,w,8);g.fillRect(0,0,8,h);g.fillRect(w-8,0,8,h);g.fillRect(w/2-4,0,8,h);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(24,16,16,h-40);});
const glassDoorTex=canvasTex(256,320,(g,w,h)=>{g.fillStyle='#cfe0ea';g.fillRect(0,0,w,h);g.fillStyle='rgba(150,160,170,.35)';g.fillRect(0,h*.6,w,h*.4);
  g.fillStyle='#4a505b';g.fillRect(0,0,w,10);g.fillRect(0,0,8,h);g.fillRect(w-8,0,8,h);g.fillRect(w/2-4,0,8,h);g.fillStyle='#8a929e';g.fillRect(w/2-22,h*.48,6,46);g.fillRect(w/2+16,h*.48,6,46);
  g.fillStyle='rgba(255,255,255,.5)';g.fillRect(22,30,34,160);});
const roomGlassTex=canvasTex(512,256,(g,w,h)=>{g.fillStyle='#dfe8ec';g.fillRect(0,0,w,h);g.fillStyle='rgba(120,130,150,.32)';for(let i=0;i<4;i++){g.fillRect(30+i*120,h*.62,80,10);g.fillRect(44+i*120,h*.66,8,h*.2);g.fillRect(96+i*120,h*.66,8,h*.2);}
  g.fillStyle='#5e646f';g.fillRect(0,0,w,14);g.fillRect(0,h-8,w,8);for(let x=0;x<=w;x+=128)g.fillRect(x-3,0,6,h);g.fillStyle='rgba(255,255,255,.55)';g.fillRect(20,h*.35,w-40,10);});
const doorTex=canvasTex(128,256,(g,w,h)=>{g.fillStyle='#7a4320';g.fillRect(0,0,w,h);g.fillStyle='#5f3016';g.fillRect(0,0,w,8);g.fillRect(0,0,8,h);g.fillRect(w-8,0,8,h);g.fillRect(w/2-2,0,4,h);
  g.fillStyle='#a8c8e6';g.fillRect(18,30,w/2-28,60);g.fillRect(w/2+10,30,w/2-28,60);g.fillStyle='#d9b45a';g.fillRect(w/2-14,h*.55,6,20);g.fillRect(w/2+8,h*.55,6,20);});
const noticeTex=canvasTex(256,192,(g,w,h)=>{g.fillStyle='#8a5a33';g.fillRect(0,0,w,h);g.fillStyle='#c9a072';g.fillRect(10,10,w-20,h-20);
  const cl=['#ffffff','#fff3b0','#cfe8ff','#ffd6d6'];for(let i=0;i<7;i++){g.fillStyle=cl[i%4];const x=18+(i%4)*58,y=20+(i/4|0)*80;g.fillRect(x,y,48,60);g.fillStyle='#c0392b';g.beginPath();g.arc(x+24,y+5,4,0,7);g.fill();}});
const bannerTex=canvasTex(1024,384,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#fff4ec');gr.addColorStop(1,'#ffd9c2');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='#c62828';g.fillRect(0,0,w,18);g.fillRect(0,h-18,w,18);g.fillStyle='#c62828';g.font='800 64px "Be Vietnam Pro", system-ui, sans-serif';g.textBaseline='middle';
  g.fillText('THƯ VIỆN TẠ QUANG BỬU',60,h*.36);g.fillStyle='#5a2a1a';g.font='500 36px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Không gian học tập mở · Đọc · Nghiên cứu · Sáng tạo',60,h*.62);
  g.fillStyle='rgba(198,40,40,.18)';for(let i=0;i<5;i++)g.fillRect(w-330+i*58,h-60-i*36,44,40+i*36);});
function pylonTex(kind){return canvasTex(256,512,(g,w,h)=>{g.fillStyle='#ffffff';g.fillRect(0,0,w,h);g.fillStyle='#d32f2f';g.beginPath();g.moveTo(0,h*.78);g.lineTo(w,h*.62);g.lineTo(w,h);g.lineTo(0,h);g.fill();
  g.textAlign='center';g.textBaseline='middle';
  if(kind==='hust'){g.fillStyle='#d32f2f';g.font='800 74px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('HUST',w/2,h*.3);}
  else{g.strokeStyle='#333';g.lineWidth=6;g.strokeRect(w/2-34,h*.12,68,46);g.beginPath();g.moveTo(w/2,h*.12);g.lineTo(w/2,h*.12+46);g.stroke();
    g.fillStyle='#333';g.font='600 30px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Thư viện',w/2,h*.33);g.fillText('Tạ Quang Bửu',w/2,h*.4);}});}
const hustTex=pylonTex('hust'),libTex=pylonTex('lib');
const infoTex=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#ffffff';g.fillRect(0,0,w,h);g.strokeStyle='#d32f2f';g.lineWidth=8;g.strokeRect(8,8,w-16,h-16);
  g.fillStyle='#d32f2f';g.font='800 84px Georgia, serif';g.textAlign='center';g.textBaseline='middle';g.fillText('i',w/2,h/2+4);});
const plaqueTex=canvasTex(256,96,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#f4d27a');gr.addColorStop(1,'#b8892d');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='#4a2f0e';g.textAlign='center';g.textBaseline='middle';g.font='700 28px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('GS. Tạ Quang Bửu',w/2,h*.4);
  g.font='500 20px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('1910 – 1986',w/2,h*.75);});
const opacTex=canvasTex(160,100,(g,w,h)=>{g.fillStyle='#1e64c8';g.fillRect(0,0,w,h);g.fillStyle='#ffffff';g.fillRect(14,14,w-28,14);
  g.beginPath();g.arc(w/2,h*.62,18,0,7);g.lineWidth=5;g.strokeStyle='#ffffff';g.stroke();g.fillRect(w/2+12,h*.62+12,16,5);});
const kioskTex=canvasTex(160,320,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#3d7fe6');gr.addColorStop(1,'#78b8ff');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='#ffffff';g.fillRect(16,18,w-32,26);g.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<9;i++)g.fillRect(16,64+i*26,(w-32)*(.5+R()*.5),9);});
const boardTex=canvasTex(200,280,(g,w,h)=>{g.fillStyle='#ffffff';g.fillRect(0,0,w,h);g.fillStyle='#d32f2f';g.fillRect(0,0,w,46);g.fillStyle='#c6ccda';for(let i=0;i<8;i++)g.fillRect(18,66+i*24,w-36-(i%3)*20,9);});
const liftSignTex=canvasTex(1024,256,(g,w,h)=>{g.fillStyle='#2b3350';g.fillRect(0,0,w,h);g.fillStyle='#ffffff';g.textAlign='center';g.textBaseline='middle';
  g.font='700 84px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('THANG MÁY',w/2,h*.38);g.font='500 46px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Tầng 1 · 2 · 3 · 4 · 6 · 7',w/2,h*.75);});
const allText=[hustTex,libTex,plaqueTex,liftSignTex,bannerTex];
function redrawText(){for(const t of allText){const c=t.userData.canvas;t.userData.draw(c.getContext('2d'),c.width,c.height);t.needsUpdate=true;}}
if(document.fonts&&document.fonts.load){Promise.all(['800 74px','600 30px','700 28px','700 84px','800 64px','500 36px'].map(f=>document.fonts.load(f+' "Be Vietnam Pro"'))).then(redrawText).catch(()=>{});}

/* ---------- materials ---------- */
const M={
  wall:mat('#f2ede4'), cream:mat('#f4eee4',{roughness:.6}), white:mat('#f5f5f3',{roughness:.45}),
  column:mat('#f5efe4',{roughness:.45}), slate:mat('#3d4249',{roughness:.45}),
  wood:mat('#8a4a24',{roughness:.5}), woodLight:mat('#d9a66a',{roughness:.55}), woodDark:mat('#4a2412',{roughness:.4}),
  carpet:mat('#a83a33',{roughness:.9}), carpet2:mat('#9c332d',{roughness:.9}), nosing:mat('#efe2cd',{roughness:.6}),
  gold:mat('#e6b847',{roughness:.3,metalness:.3,emissive:'#6b4a08',emissiveIntensity:.35}), bronze:mat('#7a4f28',{roughness:.38,metalness:.6}), bronzeD:mat('#4f3218',{roughness:.45,metalness:.55}),
  rope:mat('#b3122a',{roughness:.6}), grey:mat('#a6a7ad',{roughness:.6}), metal:mat('#2a2d33',{roughness:.4,metalness:.4}), steel:mat('#c9ccd2',{roughness:.25,metalness:.6}),
  glass:new THREE.MeshStandardMaterial({color:lin('#bfe0f5'),transparent:true,opacity:.42,roughness:.05,side:THREE.DoubleSide,depthWrite:false}),
  panel:mat('#fff8ea',{emissive:'#fff1d6',emissiveIntensity:.95}), down:mat('#ffffff',{emissive:'#fff6e0',emissiveIntensity:.9}),
  soil:mat('#6b4a33'), para:new THREE.MeshStandardMaterial({map:paraTex,roughness:.6,side:THREE.DoubleSide}), paraBack:mat('#efebe4',{side:THREE.DoubleSide}),
};
const wallMat=mat('#f2ede4');   /* single-sided: from outside the walls disappear, like a doll's house */

/* ---------- floor: white tiles, red tiles under the atrium, star inlay ---------- */
{const f=new THREE.Mesh(new THREE.PlaneGeometry(2*XW,ZF-ZB),new THREE.MeshStandardMaterial({map:whiteTex,roughness:.25}));whiteTex.repeat.set(2*XW/2.4,(ZF-ZB)/2.4);
  f.rotation.x=-PI/2;f.receiveShadow=true;scene.add(f);
  redTex.repeat.set(1/2.4,1/2.4);stadFlat(FR+1.6,.003,mat('#5e1d18',{roughness:.3}));
  const red=stadFlat(FR+1.35,.005,new THREE.MeshStandardMaterial({map:redTex,roughness:.16,metalness:.05}));}
const BUST={x:0,z:.6};
{const s=new THREE.Mesh(new THREE.PlaneGeometry(8.8,8.8),new THREE.MeshStandardMaterial({map:starTex,roughness:.25}));s.rotation.x=-PI/2;s.position.set(BUST.x,.008,BUST.z);s.receiveShadow=true;scene.add(s);}
{const m=new THREE.Mesh(new THREE.PlaneGeometry(3.4,1.2),mat('#3c4050',{roughness:.95}));m.rotation.x=-PI/2;m.position.set(0,.01,12.1);m.receiveShadow=true;scene.add(m);}

/* ---------- outer walls: plain walls with a few doors and windows, per floor ---------- */
function onWall(side,u,y,w,h,m,parent=scene,off=.02){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.receiveShadow=true;
  if(side==='back'){o.position.set(u,y,ZB+off);}else if(side==='front'){o.position.set(u,y,ZF-off);o.rotation.y=PI;}
  else if(side==='left'){o.position.set(-XW+off,y,u);o.rotation.y=PI/2;}else{o.position.set(XW-off,y,u);o.rotation.y=-PI/2;}parent.add(o);return o;}
const winM=new THREE.MeshStandardMaterial({map:winTex,roughness:.2}),gdM=new THREE.MeshStandardMaterial({map:glassDoorTex,roughness:.2}),
  doorM=new THREE.MeshStandardMaterial({map:doorTex,roughness:.5}),noteM=new THREE.MeshStandardMaterial({map:noticeTex,roughness:.7}),roomM=new THREE.MeshStandardMaterial({map:roomGlassTex,roughness:.25});
/* BRM: phòng mượn sách tầng 1 · R4: phòng P419 (tầng 4, phía đông sảnh): cửa = khoảng z trên tường phải; core = khối giếng thang máy nhô vào phòng */
const BRM={x0:-26,x1:-XW,z0:-5,z1:5,h:3.4,open:4.5},R4={x0:XW,x1:XW+17,z0:-9.5,z1:9.5,h:3.6,dh:2.7,doors:[[-8.4,-6.2],[6.2,8.4]],core:{x1:XW+2.45,z:3.6}},inDoor4=(z,m)=>R4.doors.some(([a,b])=>z>a+m&&z<b-m);
for(let lv=1;lv<=NF;lv++){const y0=(lv-1)*FH,par=grp(lv);
  /* right wall: doorways for the three lifts on every floor */
  {const run=(a,b)=>{const cut=lv===4?R4.doors.filter(([d0,d1])=>d0>=a&&d1<=b):[];let u=a;
      for(const [d0,d1] of cut){onWall('right',(u+d0)/2,y0+FH/2,d0-u,FH,wallMat,par,0);onWall('right',(d0+d1)/2,y0+(R4.dh+FH)/2,d1-d0,FH-R4.dh,wallMat,par,0);u=d1;}
      onWall('right',(u+b)/2,y0+FH/2,b-u,FH,wallMat,par,0);};
    let z=ZB;for(const lz of liftZ){run(z,lz-OW);onWall('right',lz,y0+(DH+FH)/2,2*OW,FH-DH,wallMat,par,0);z=lz+OW;}
    run(z,ZF);}
  /* left wall: on tầng 1 an open shop-front into the book-lending room */
  if(lv===1){const o=BRM.open;onWall('left',(ZB-o)/2,FH/2,-o-ZB,FH,wallMat,par,0);onWall('left',(o+ZF)/2,FH/2,ZF-o,FH,wallMat,par,0);onWall('left',0,(BRM.h+FH)/2,2*o,FH-BRM.h,wallMat,par,0);}
  else onWall('left',0,y0+FH/2,ZF-ZB,FH,wallMat,par,0);
  /* back wall: on tầng 4 it becomes the glass front of room 401 */
  if(lv<4)onWall('back',0,y0+FH/2,2*XW,FH,wallMat,par,0);
  else{onWall('back',0,y0+3.6+(FH-3.6)/2,2*XW,FH-3.6,wallMat,par,0);
    const gm=mat('#8f96a3',{metalness:.4,roughness:.3});
    onWall('back',6.0,y0+1.05+(3.6-1.05)/2,6.0,3.6-1.05,wallMat,par,0);
    for(const [a,b] of [[-XW,-4.3],[9.0,XW]]){const gl=new THREE.Mesh(new THREE.PlaneGeometry(b-a,3.6-1.05),M.glass);gl.position.set((a+b)/2,y0+1.05+(3.6-1.05)/2,ZB);par.add(gl);
      const n=Math.max(1,Math.round((b-a)/2.4));for(let k=0;k<=n;k++)mk(box(.06,3.6-1.05,.08),gm,a+(b-a)*k/n,y0+1.05+(3.6-1.05)/2,ZB,par,false);
      mk(box(b-a,.08,.1),gm,(a+b)/2,y0+3.6,ZB,par,false);}}
  onWall('front',0,y0+FH/2,2*XW,FH,wallMat,par,0);
  for(const s of ['front','left','right'])onWall(s,0,y0+.07,s==='left'||s==='right'?ZF-ZB:2*XW,.14,mat('#cfc6b8'),par);
  if(lv<4)onWall('back',0,y0+.07,2*XW,.14,mat('#cfc6b8'),par);
  /* doors, windows, glass rooms */
  const W=(side,u,w,h,m,y=y0+h/2)=>onWall(side,u,y,w,h,m,par);
  if(lv===1){
    for(const x of [-15,-9,9,15])W('front',x,2.6,1.6,winM,y0+1.9);
    W('back',-16.4,1.2,2.3,doorM);W('back',-12.6,1.6,1.15,noteM,y0+1.65);W('back',-9.2,1.2,2.3,doorM);W('back',16.2,1.4,2.4,gdM);
    W('left',-9.6,2.4,1.6,winM,y0+1.9);W('left',9.6,2.4,1.6,winM,y0+1.9);
    W('right',-8.6,6,2.25,new THREE.MeshStandardMaterial({map:bannerTex,roughness:.5}),y0+1.75);W('right',9.6,2.4,1.6,winM,y0+1.9);
  }else{
    for(const x of [-14,-6,6,14])W('front',x,3.2,1.7,winM,y0+2.0);
    if(lv<4){W('back',-15.5,1.2,2.3,doorM);W('back',-6,4.8,2.6,roomM);W('back',15.5,1.2,2.3,doorM);}
    W('left',-6,6,2.6,roomM);W('left',6,1.2,2.3,doorM);W('left',10,2.4,1.6,winM,y0+2);
    if(lv<4){W('right',-8,1.2,2.3,doorM);W('right',9,2.4,1.6,winM,y0+2);}}
  /* lift sign above the doors */
  panel(4.0,.9,new THREE.MeshBasicMaterial({map:liftSignTex}),XW-.02,y0+3.5,0,-PI/2,par);
}
function doorSteelTexStatic(){if(doorSteelTexStatic.t)return doorSteelTexStatic.t;return doorSteelTexStatic.t=canvasTex(128,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#aab0b9');gr.addColorStop(.5,'#dadde2');gr.addColorStop(1,'#a8aeb7');
  g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#6d727c';g.fillRect(w/2-1,0,2,h);g.fillStyle='#4f545e';g.fillRect(0,0,w,10);g.fillRect(0,0,8,h);g.fillRect(w-8,0,8,h);});}
/* front entrance: automatic glass doors in a glass bay */
onWall('front',0,1.5,6.4,3.0,mat('#9aa3ad',{metalness:.4,roughness:.3}),scene,.012);
const fdoors=[];for(const s of [-1,1]){const d=mk(box(1.55,2.8,.05),M.glass,s*.78,1.42,ZF-.12,scene,false);fdoors.push({d,s});}
onWall('front',0,1.45,3.2,2.85,mat('#dce9f1',{roughness:.1}),scene,.016);
mk(box(6.6,.3,.25),mat('#8c9097',{metalness:.5,roughness:.3}),0,3.15,ZF-.14);

/* ---------- floors 2–4: slabs with the stadium void, parapets, ceilings ---------- */
mezTex.repeat.set(1/2.4,1/2.4);ceilTex.repeat.set(1/1.2,1/1.2);
const mezM=new THREE.MeshStandardMaterial({map:mezTex,roughness:.4}),ceilM=new THREE.MeshStandardMaterial({map:ceilTex,roughness:.9});
for(let lv=2;lv<=NF;lv++){const y=(lv-1)*FH,par=grp(lv);slabRect(y,mezM,false,par);slabRect(y-.4,ceilM,true,lv===2?scene:grp(lv));}
/* parapets around the void: grey panels in white frames, dark wooden handrail; gaps on tầng 2 for the stair landings */
const gapsL2=[[0,2.4],[2*L-2.4,2*L]];
function parapet(lv){const y=(lv-1)*FH,par=grp(lv),P=perim(FR),gaps=lv===2?gapsL2:[];let segs=[],s=0;
  for(const [a,b] of gaps){if(a>s)segs.push([s,a]);s=b;}segs.push([s,P]);
  for(const [s0,s1] of segs){ribbon(FR,y-.45,y+1.0,M.para,{s0,s1,uLen:2.6,parent:par});ribbon(FR+.24,y,y+1.0,M.paraBack,{s0,s1,parent:par});
    const n=Math.max(2,Math.ceil((s1-s0)/.4)),pts=[];for(let i=0;i<=n;i++){const p=stadAt(FR+.12,s0+(s1-s0)*i/n);pts.push(V(p.x,y+1.04,p.z));}
    const closed=gaps.length===0;if(closed)pts.pop();
    const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,closed),pts.length*2,.085,8,closed),M.woodDark);t.castShadow=true;par.add(t);}}
for(let lv=2;lv<=NF;lv++)parapet(lv);
/* the stair landings on tầng 2, with a short rail on their open sides */
for(const m of [1,-1]){const x0=m>0?LAND.x0:-LAND.x1,x1=m>0?LAND.x1:-LAND.x0,cx=(x0+x1)/2;
  mk(box(x1-x0,.4,LAND.z1+7.5+.25),M.cream,cx,MZ-.2,(LAND.z1-7.75)/2);
  const tp=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,LAND.z1+7.75),mezM);tp.rotation.x=-PI/2;tp.position.set(cx,MZ+.003,(LAND.z1-7.75)/2);tp.receiveShadow=true;scene.add(tp);
  const ex=m>0?x0:x1,dz=LAND.z1+7.5;mk(box(.12,1.0,dz),M.cream,ex,MZ+.5,(LAND.z1-7.5)/2);mk(box(.16,.08,dz),M.woodDark,ex,MZ+1.04,(LAND.z1-7.5)/2);
  mk(box(x1-x0,1.0,.12),M.cream,cx,MZ+.5,LAND.z1);mk(box(x1-x0,.08,.16),M.woodDark,cx,MZ+1.04,LAND.z1);
  colsM.push([ex-.12,ex+.12,-7.6,LAND.z1],[x0,x1,LAND.z1-.12,LAND.z1+.12]);}

/* ---------- top: oval recess with the sun painting ---------- */
slabRect(CH,ceilM,true,TOP);
ribbon(FR,CH-.45,CH+1.1,mat('#f1efea',{side:THREE.DoubleSide}),{parent:TOP});
ribbon(FR-.02,CH-.47,CH-.4,M.down,{parent:TOP});
stadFlat(FR,CH+1.1,new THREE.MeshStandardMaterial({map:sunTex,roughness:.8}),true,TOP,true);
{const P=perim(FR-.6),n=Math.round(P/2.2);for(let i=0;i<n;i++){const p=stadAt(FR-.6,P*i/n);mk(cyl(.1,.1,.02,12),M.down,p.x,CH+1.09,p.z,TOP,false);}}

/* ---------- columns: white with dark square bases, rising through every floor ---------- */
const COLS=[[-6.5,-8.5],[6.5,-8.5],[-6.5,8.5],[6.5,8.5],[-L-6.1,-5.9],[L+6.1,-5.9],[-L-6.1,5.9],[L+6.1,5.9]];
for(const [x,z] of COLS){for(let lv=1;lv<=NF;lv++){const y0=(lv-1)*FH,par=grp(lv),h=lv===1?FH-.4:FH-.4;
    mk(cyl(.48,.48,h,32),M.column,x,y0+h/2,z,par);mk(cyl(.62,.5,.2,32),mat('#efe6d8'),x,y0+h-.1,z,par);
    if(lv===1){mk(box(1.2,1.0,1.2),M.slate,x,.5,z);}else mk(box(1.0,.16,1.0),mat('#d8d3ca'),x,y0+.08,z,par);}
  colsG.push([x-.62,x+.62,z-.62,z+.62]);colsM.push([x,z,.55]);cols3.push([x,z,.55]);cols4.push([x,z,.55]);}

/* ---------- the two grand staircases, curving along the inside of each end of the void ---------- */
const stairs=[{m:1},{m:-1}];
const sP=(m,r,a)=>[m*(L+r*Math.cos(a)),r*Math.sin(a)];
function stairAt(x,z,mg){for(const st of stairs){const dx=st.m*x-L,r=Math.hypot(dx,z);if(r<STR.ri-mg||r>STR.ro+mg||dx<-.6)continue;
    const a=Math.atan2(z,dx),u=(STR.a0-a)/(STR.a0-STR.a1);if(u>=-.03&&u<=1.04)return {h:MZ*Math.min(1,Math.max(0,u)),u,m:st.m,a};}return null;}
defineProp('baluster',[part(cyl(.028,.028,.86,8),M.woodDark,T(0,.47,0))]);
function buildStair(st){const {ri,ro,rm,N,a0,a1}=STR,m=st.m,aAt=u=>a0+(a1-a0)*u,da=(a1-a0)/N;
  for(let i=0;i<N;i++){const a=a0+da*(i+.5),h=(i+1)*MZ/N,[x,z]=sP(m,rm,a),len=Math.abs(da)*ro*1.05,ry=Math.atan2(m*Math.cos(a),Math.sin(a));
    const t=mk(box(len,.11,ro-ri),i%2?M.carpet:M.carpet2,x,h-.055,z);t.rotation.y=ry;
    const n=mk(box(len,.05,ro-ri+.05),M.nosing,x,h-.135,z);n.rotation.y=ry;}
  const n=96,geo=(pos)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));const idx=[];for(let i=0;i<n;i++){const k=2*i;idx.push(k,k+2,k+1,k+1,k+2,k+3);}g.setIndex(idx);g.computeVertexNormals();return g;};
  const under=[];for(let i=0;i<=n;i++){const a=aAt(i/n),h=MZ*i/n,[ax,az]=sP(m,ri-.06,a),[bx,bz]=sP(m,ro+.06,a),y=Math.max(.02,h-.45);under.push(ax,y,az,bx,y,bz);}
  const um=new THREE.Mesh(geo(under),mat('#f7f3ec',{side:THREE.DoubleSide}));um.receiveShadow=true;scene.add(um);
  for(const r of [ri-.07,ro+.07]){const pos=[];for(let i=0;i<=n;i++){const a=aAt(i/n),h=MZ*i/n,[x,z]=sP(m,r,a);pos.push(x,Math.max(0,h-.55),z,x,h+.06,z);}
    const sm=new THREE.Mesh(geo(pos),mat('#f6f1e8',{side:THREE.DoubleSide}));sm.castShadow=true;sm.receiveShadow=true;scene.add(sm);}
  for(const r of [ri-.03,ro+.03]){const pts=[];
    for(let i=0;i<=N*2;i++){const u=i/(N*2),a=aAt(u),h=MZ*u,[x,z]=sP(m,r,a);if(i>0&&i<N*2)place('baluster',x,h,z);pts.push(V(x,h+.93,z));}
    const rail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),N*4,.055,8,false),M.woodDark);rail.castShadow=true;scene.add(rail);
    for(const u of [0,1]){const a=aAt(u),[x,z]=sP(m,r,a),h=MZ*u;mk(cyl(.12,.14,1.15,16),M.wood,x,h+.575,z);mk(sph,M.woodDark,x,h+1.27,z).scale.setScalar(.15);mk(cyl(.17,.17,.08,16),M.woodDark,x,h+1.12,z);}}
  /* flared bottom steps */
  for(const [k,ex] of [[0,.7],[1,.35]]){const a=a0+.05,[x,z]=sP(m,rm,a+.12*(1-k));const f=mk(box(1.3+ex,.15,ro-ri+ex),M.nosing,x,.075+k*.0,z);f.rotation.y=Math.atan2(m*Math.cos(a),Math.sin(a));}}
stairs.forEach(buildStair);

/* ---------- back feature wall: wood planks between dark bands, rows of cream discs, a gold sculpture leaning out in the middle ---------- */
const plankWallTex=canvasTex(1024,512,(g,w,h)=>{g.fillStyle='#a8572a';g.fillRect(0,0,w,h);
  for(let x=0;x<w;x+=w/24){g.fillStyle=`rgba(${R()<.5?'255,210,160':'60,20,0'},${.05+R()*.06})`;g.fillRect(x,0,w/24,h);g.fillStyle='rgba(60,25,8,.55)';g.fillRect(x,0,2,h);}
  for(let i=0;i<40;i++){g.strokeStyle='rgba(90,40,12,.18)';g.lineWidth=1.5;g.beginPath();const y=R()*h;g.moveTo(0,y);g.bezierCurveTo(w*.3,y+R()*20-10,w*.6,y+R()*20-10,w,y+R()*10);g.stroke();}});
{const z=-8.4,H=SB-.15;mk(box(12.8,H,.3),M.wood,0,H/2,z);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(12.6,H-.7),new THREE.MeshStandardMaterial({map:plankWallTex,roughness:.55}));face.position.set(0,.4+(H-.7)/2,z+.152);face.receiveShadow=true;scene.add(face);
  mk(box(12.9,.4,.36),mat('#1f2433',{roughness:.5}),0,.2,z);mk(box(12.9,.3,.36),mat('#1f2433',{roughness:.5}),0,H-.15,z);
  mk(box(13.0,.12,.42),M.gold,0,H+.06,z);mk(box(12.9,.04,.34),M.gold,0,.42,z+.01);mk(box(12.9,.04,.34),M.gold,0,H-.32,z+.01);
  mk(box(.25,H,.36),mat('#e8c99c'),-6.5,H/2,z);mk(box(.25,H,.36),mat('#e8c99c'),6.5,H/2,z);
  defineProp('disc',[part(cyl(.2,.2,.05,28),mat('#f4e6bf',{roughness:.45}),T(0,0,0,PI/2))]);
  /* two panels of discs, rows alternating 7 and 6 like the real wall */
  for(const s of [-1,1])for(let r=0;r<5;r++){const n=r%2?6:7;for(let c=0;c<n;c++){const x=s*(1.55+(r%2?.36:0)+c*.72);place('disc',x,.82+r*.56,z+.175);}}
  /* gold pipes running the full height of the wall, tallest in the middle, like organ pipes */
  const pipeM=[M.gold,mat('#f6d36a',{roughness:.25,metalness:.25,emissive:'#7a5a10',emissiveIntensity:.35})];
  mk(box(1.55,H,.08),mat('#3a2412',{roughness:.5}),0,H/2,z+.19);
  for(let i=0;i<11;i++){const u=(i-5)/5,top=SB-.2-Math.pow(Math.abs(u),1.3)*.9,r=.068-Math.abs(u)*.012,x=u*.66,zz=z+.3+(1-Math.abs(u))*.12;
    mk(cyl(r,r,top,18),pipeM[i%2],x,top/2,zz);
    const lip=mk(cyl(r*1.02,r*1.02,.05,18),mat('#fff1b8',{emissive:'#a0801c',emissiveIntensity:.4}),x,top*.62,zz,scene,false);
    const cap=mk(cyl(r*.2,r,.16,18),pipeM[(i+1)%2],x,top+.08,zz);}
  mk(box(1.7,.3,.5),mat('#1f2433',{roughness:.5}),0,.15,z+.38);
  colsG.push([-6.7,6.7,z-.2,z+.35],[-.95,.95,z,z+.7]);
  mk(box(.2,SB,ZB-z),M.wall,-6.5,SB/2,(ZB+z)/2);mk(box(.2,SB,ZB-z),M.wall,6.5,SB/2,(ZB+z)/2);}

/* ---------- elevators: three cars in the right wall, serving tầng 1–4 (and linking to tầng 6–7) ---------- */
const cabTex=canvasTex(256,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#aeb3bc');gr.addColorStop(.5,'#dadde2');gr.addColorStop(1,'#aab0b9');
  g.fillStyle=gr;g.fillRect(0,0,w,h);for(let i=0;i<260;i++){g.fillStyle=`rgba(255,255,255,${R()*.14})`;g.fillRect(R()*w,0,1,h);}g.fillStyle='rgba(90,96,108,.6)';g.fillRect(w/3-1,0,2,h);g.fillRect(2*w/3-1,0,2,h);});
const leafTex=canvasTex(128,384,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#b8bdc6');gr.addColorStop(.5,'#e0e3e8');gr.addColorStop(1,'#b3b8c1');
  g.fillStyle=gr;g.fillRect(0,0,w,h);for(let i=0;i<120;i++){g.fillStyle=`rgba(255,255,255,${R()*.15})`;g.fillRect(R()*w,0,1,h);}});
const doorMat=new THREE.MeshStandardMaterial({map:leafTex,roughness:.25,metalness:.55});
const frameMat=mat('#8b9099',{roughness:.3,metalness:.6}),cabWall=new THREE.MeshStandardMaterial({map:cabTex,roughness:.3,metalness:.45});
const shaftMat=mat('#6f747d',{roughness:.6}),btnMat=mat('#ffffff',{emissive:'#ffd27a',emissiveIntensity:.6});
function dispDraw(l){const c=l.dc,g=c.getContext('2d');g.fillStyle='#14161c';g.fillRect(0,0,c.width,c.height);g.fillStyle='#ff5a3c';g.font='700 40px system-ui, sans-serif';g.textAlign='center';g.textBaseline='middle';
  const mv=l.phase==='moving'||l.phase==='xfer',ar=mv?(l.target>l.floor?'▲ ':'▼ '):'';g.fillText(ar+(mv?l.target:l.floor),c.width/2,c.height/2+2);l.dt.needsUpdate=true;}
const CX0=XW+.08,CX1=XW+2.15,CW=.98,CHT=2.6;
const LIFTS=liftZ.map((z,i)=>{const l={i,z,floor:[1,2,1][i],phase:'idle',door:0,hold:0,target:null,doors:{},t:0,key:''};l.y=LBASE[l.floor];
  l.dc=document.createElement('canvas');l.dc.width=160;l.dc.height=56;l.dt=new THREE.CanvasTexture(l.dc);l.dt.encoding=THREE.sRGBEncoding;const dmat=new THREE.MeshBasicMaterial({map:l.dt});
  for(const fl of FLOORS){const b=LBASE[fl],par=grp(fl);
    mk(box(.12,2.6,.18),frameMat,XW-.06,b+1.3,z-OW-.09,par);mk(box(.12,2.6,.18),frameMat,XW-.06,b+1.3,z+OW+.09,par);mk(box(.12,.42,2*OW+.36),frameMat,XW-.06,b+2.72,z,par);
    panel(.5,.18,dmat,XW-.125,b+2.72,z,-PI/2,par);
    const pan=mk(box(.04,.3,.14),M.steel,XW-.02,b+1.15,z+OW+.5,par);for(const dy of [.06,-.06]){const bt=mk(cyl(.025,.025,.02,12),btnMat,-.03,dy,0,pan,false);bt.rotation.z=PI/2;}
    l.doors[fl]={L:mk(box(.04,DH-.02,OW),doorMat,XW+.07,b+DH/2,z-OW/2,par,false),R:mk(box(.04,DH-.02,OW),doorMat,XW+.07,b+DH/2,z+OW/2,par,false)};
    LCOL[fl].push([XW-.05,z+OW+.5,.22]);}
  /* the shaft face seen from inside the car, open at every landing */
  const sp=(w,h,y,zz)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),shaftMat);p.position.set(XW+.03,y,zz);p.rotation.y=PI/2;scene.add(p);};
  sp(.28,STACK,STACK/2,z-OW-.14);sp(.28,STACK,STACK/2,z+OW+.14);
  for(const fl of FLOORS){const b=LBASE[fl],top=fl<4?LBASE[fl+1]:STACK;sp(2*OW,top-b-DH,(b+DH+top)/2,z);}
  const cab=new THREE.Group();cab.position.y=l.y;scene.add(cab);l.cab=cab;
  const pl=(w,h,mm,px,py,pz,rx,ry)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mm);p.position.set(px,py,pz);p.rotation.set(rx,ry,0);p.receiveShadow=true;cab.add(p);return p;};
  pl(2*CW,CHT,cabWall,CX1,CHT/2,z,0,-PI/2);pl(CX1-CX0,CHT,cabWall,(CX0+CX1)/2,CHT/2,z-CW,0,0);pl(CX1-CX0,CHT,cabWall,(CX0+CX1)/2,CHT/2,z+CW,0,PI);
  pl(CX1-CX0,2*CW,mat('#3a3d45',{roughness:.35}),(CX0+CX1)/2,.01,z,-PI/2,0);pl(CX1-CX0,2*CW,mat('#e9eaee'),(CX0+CX1)/2,CHT,z,PI/2,0);pl(1.1,1.0,M.down,(CX0+CX1)/2,CHT-.01,z,PI/2,0);
  /* cửa cabin đi theo cabin: hai tấm cố định hai bên + ô trên cửa + hai cánh thu vào mép khi mở (đồng bộ cửa tầng) — khi cabin chạy, mặt trước kín hoàn toàn, không còn khe nhìn ra ngoài */{const fm=doorMat;for(const sg of [-1,1])mk(box(.03,CHT,CW-OW+.02),fm,CX0+.012,CHT/2,z+sg*(OW+(CW-OW)/2),cab,false);mk(box(.03,CHT-DH+.02,2*CW),fm,CX0+.012,DH+(CHT-DH)/2,z,cab,false);const gL=new THREE.BoxGeometry(.03,DH,OW);gL.translate(0,0,OW/2);const gR=new THREE.BoxGeometry(.03,DH,OW);gR.translate(0,0,-OW/2);l.cd={L:mk(gL,fm,CX0+.04,DH/2,z-OW,cab,false),R:mk(gR,fm,CX0+.04,DH/2,z+OW,cab,false)};}mk(box(.05,.05,1.7),M.steel,CX1-.08,.95,z,cab,false);mk(box(1.6,.05,.05),M.steel,(CX0+CX1)/2+.1,.95,z-CW+.07,cab,false);
  const ip=mk(box(.26,.55,.03),mat('#2a2d33',{roughness:.3}),CX0+.32,1.25,z+CW-.02,cab,false);
  for(const [dy,c] of [[.12,'#7fb6ff'],[-.02,'#7fb6ff'],[-.16,'#ffd27a']]){const bt=mk(cyl(.035,.035,.02,14),mat('#ffffff',{emissive:c,emissiveIntensity:.8}),0,dy,-.02,ip,false);bt.rotation.x=PI/2;}
  pl(1.3,1.2,mat('#e3e8ee',{roughness:.15,metalness:.25}),CX1-.01,1.55,z,0,-PI/2);
  dispDraw(l);return l;});
/* outside of the lift shaft (seen only from outside the building) */
{const sm=mat('#e6e0d6');const W2=2.45,Z2=3.6;
  panel(2*Z2,CH,sm,XW+W2,CH/2,0,PI/2);panel(W2,CH,sm,XW+W2/2,CH/2,Z2,0);panel(W2,CH,sm,XW+W2/2,CH/2,-Z2,PI);
  const t=new THREE.Mesh(new THREE.PlaneGeometry(W2,2*Z2),sm);t.rotation.x=-PI/2;t.position.set(XW+W2/2,CH,0);TOP.add(t);}

/* downlights under every slab */
defineProp('downl',[part(cyl(.11,.11,.02,14),M.down,T(),false)]);
for(let lv=2;lv<=NF+1;lv++){const y=(lv-1)*FH-.412,list=[];
  for(const r of [9.4,11.6]){const P=perim(r),n=Math.round(P/2.4);for(let i=0;i<n;i++){const p=stadAt(r,P*i/n);if(Math.abs(p.x)<XW-.5&&p.z>ZB+.5&&p.z<ZF-.5)list.push(T(p.x,y,p.z));}}
  const im=new THREE.InstancedMesh(cyl(.11,.11,.02,14),M.down,list.length);list.forEach((m,i)=>im.setMatrixAt(i,m));im.frustumCulled=false;
  (lv===2?scene:lv<=NF?UP[lv]:TOP).add(im);}

/* ---------- furniture & props ---------- */
function chairProp(n,c){defineProp(n,[part(box(.46,.05,.44),mat(c,{roughness:.6}),T(0,.46,0)),part(box(.48,.42,.05),mat(c,{roughness:.6}),T(0,.73,-.21,-.16)),
  ...[[-.19,-.18],[.19,-.18],[-.19,.18],[.19,.18]].map(([x,z])=>part(cyl(.016,.016,.45,6),M.metal,T(x,.225,z)))]);}
chairProp('chairW','#c98a4c');chairProp('chairB','#3e5679');chairProp('chairR','#c4363d');chairProp('chairL','#9cb0c6');
defineProp('monitor',[part(cyl(.11,.13,.02,16),M.metal,T(0,.01,-.05)),part(box(.04,.22,.04),M.metal,T(0,.12,-.07)),part(box(.54,.34,.04),M.metal,T(0,.38,-.03)),
  part(new THREE.PlaneGeometry(.49,.3),new THREE.MeshBasicMaterial({map:opacTex}),T(0,.38,-.008),false),part(box(.42,.02,.14),mat('#d7d9e2'),T(0,.01,.22))]);
defineProp('laptop',[part(box(.34,.018,.24),mat('#5d6374',{roughness:.4,metalness:.3}),T(0,.009,0)),part(box(.34,.23,.012),mat('#3a3f4d',{roughness:.4}),T(0,.13,-.15,-.25)),
  part(new THREE.PlaneGeometry(.31,.2),new THREE.MeshBasicMaterial({map:opacTex}),T(0,.131,-.143,-.25),false)]);
defineProp('bush',[part(sph,mat('#46ad3f'),T(0,0,0,0,0,0,.36,.26,.32))]);
defineProp('bush2',[part(sph,mat('#6cc94f'),T(0,0,0,0,0,0,.3,.22,.27))]);
defineProp('flower',[part(sph,mat('#f6a2bf',{roughness:.6}),T(0,0,0,0,0,0,.07,.055,.07),false)]);
defineProp('stanchion',[part(cyl(.035,.035,.95,10),M.gold,T(0,.5,0)),part(cyl(.17,.19,.04,20),M.gold,T(0,.02,0)),part(sph,M.gold,T(0,.99,0,0,0,0,.055,.055,.055))]);
defineProp('dtable',[part(cyl(.62,.62,.04,36),mat('#3a3e48',{roughness:.4}),T(0,.74,0)),part(cyl(.05,.05,.72,10),M.metal,T(0,.36,0)),part(cyl(.3,.34,.03,24),M.metal,T(0,.015,0))]);
defineProp('ctable',[part(cyl(.45,.45,.04,32),mat('#f2f2f0',{roughness:.35}),T(0,.42,0)),part(cyl(.32,.36,.4,24),mat('#c9a77c'),T(0,.2,0))]);
defineProp('sofa',[part(box(1.7,.36,.8),mat('#2b3658',{roughness:.7}),T(0,.2,0)),part(box(1.56,.1,.68),mat('#3e5679',{roughness:.75}),T(0,.43,.04)),part(box(1.7,.52,.18),mat('#2b3658',{roughness:.7}),T(0,.64,-.31,-.08)),
  part(box(.16,.52,.8),mat('#2b3658',{roughness:.7}),T(-.85,.38,0)),part(box(.16,.52,.8),mat('#2b3658',{roughness:.7}),T(.85,.38,0))]);
defineProp('arm',[part(box(.78,.2,.72),mat('#e2a032',{roughness:.7}),T(0,.36,0)),part(box(.78,.58,.16),mat('#e2a032',{roughness:.7}),T(0,.68,-.3,-.12)),
  part(box(.12,.3,.7),mat('#c4841f',{roughness:.7}),T(-.37,.5,0)),part(box(.12,.3,.7),mat('#c4841f',{roughness:.7}),T(.37,.5,0)),
  ...[[-.32,-.28],[.32,-.28],[-.32,.28],[.32,.28]].map(([x,z])=>part(cyl(.02,.02,.26,6),M.metal,T(x,.13,z)))]);
let seatsG=0,seatsM=0;
const greens=['#3fae44','#5cc552','#2e8e3c','#7ad35f'].map(c=>mat(c,{roughness:.7}));
function plant(x,y,z,s=1,list,parent=scene){const g=new THREE.Group();
  mk(cyl(.17,.13,.24,18),M.white,0,.12,0,g);mk(cyl(.155,.155,.02,18),M.soil,0,.235,0,g);
  for(let i=0;i<13;i++){const piv=new THREE.Group();piv.position.y=.24;piv.rotation.y=i/13*PI*2+R()*.5;
    const inner=new THREE.Group();inner.rotation.z=.2+R()*.8;const Lf=.24+R()*.2;
    const lf=new THREE.Mesh(sph,greens[i%4]);lf.scale.set(.075,Lf,.022);lf.position.y=Lf;lf.castShadow=true;inner.add(lf);piv.add(inner);g.add(piv);}
  g.position.set(x,y,z);g.scale.setScalar(s);parent.add(g);if(list)list.push([x,z,.33*s]);}
function flowerPot(x,y,z,s=1,list){mk(cyl(.2,.15,.32,18),M.white,x,y+.16,z);place('bush',x,y+.42,z,R()*3,s);
  for(let i=0;i<14;i++){const a=R()*7,r=R()*.28*s;place('flower',x+Math.cos(a)*r,y+.48+R()*.12*s,z+Math.sin(a)*r,R()*3);}if(list)list.push([x,z,.35]);}
function planter(x,z,w,list){mk(box(w,.5,.62),M.white,x,.25,z);mk(box(w-.1,.04,.52),M.soil,x,.5,z,scene,false);
  for(let u=-w/2+.25;u<w/2-.15;u+=.3)place(R()<.5?'bush':'bush2',x+u,.58+R()*.08,z+(R()-.5)*.2,R()*3);
  for(let i=0;i<w*9;i++)place('flower',x+(R()-.5)*(w-.3),.72+R()*.14,z+(R()-.5)*.4,R()*3);list.push([x-w/2,x+w/2,z-.31,z+.31]);}

/* bronze bust on a wooden pedestal, ringed by gold stanchions and red rope */
{const g=new THREE.Group();g.position.set(BUST.x,0,BUST.z);scene.add(g);
  mk(box(.95,.12,.8),M.woodDark,0,.06,0,g);mk(box(.72,1.42,.6),M.wood,0,.83,0,g);mk(box(.9,.1,.76),M.woodDark,0,1.59,0,g);
  panel(.44,.17,new THREE.MeshStandardMaterial({map:plaqueTex,roughness:.3,metalness:.5}),0,1.15,.305,0,g);
  const t=mk(sph,M.bronze,0,1.86,0,g);t.scale.set(.36,.28,.22);
  mk(cyl(.075,.085,.18,16),M.bronze,0,2.12,0,g);const h=mk(sph,M.bronze,0,2.33,.01,g);h.scale.set(.14,.17,.155);
  const hr=mk(sph,M.bronzeD,0,2.42,-.02,g);hr.scale.set(.145,.1,.155);
  const n=10,pts=[];for(let i=0;i<n;i++){const a=i/n*2*PI+PI/n;pts.push([Math.sin(a)*1.9,Math.cos(a)*1.9]);place('stanchion',BUST.x+pts[i][0],0,BUST.z+pts[i][1]);}
  for(let i=0;i<n;i++){const a=pts[i],c=pts[(i+1)%n];const curve=new THREE.QuadraticBezierCurve3(V(a[0],.92,a[1]),V((a[0]+c[0])/2,.68,(a[1]+c[1])/2),V(c[0],.92,c[1]));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,12,.022,6,false),M.rope));}
  colsG.push([BUST.x,BUST.z,2.05]);}
flowerPot(-.95,0,BUST.z+.95,1);flowerPot(.95,0,BUST.z+.95,1);

/* OPAC tables with laptops behind the bust, kiosks, brochure stands by the feature wall */
for(const [x,z] of [[-3.6,-5.4],[3.0,-5.6]]){mk(box(2.6,.05,.85),mat('#f4f4f2',{roughness:.35}),x,.75,z);for(const lx of [-1.2,1.2])for(const lz of [-.35,.35])mk(cyl(.025,.025,.74,8),M.metal,x+lx,.37,z+lz);
  for(const lx of [-.8,0,.8]){place('laptop',x+lx,.775,z-.05,0);}colsG.push([x-1.35,x+1.35,z-.5,z+.5]);}
{const x=5.3,z=-4.6,gk=new THREE.Group();gk.position.set(x,0,z);gk.rotation.y=-.5;scene.add(gk);
  mk(box(.45,.9,.4),mat('#2b3350'),0,.45,0,gk);const h=mk(box(.62,.46,.08),mat('#2b3350'),0,1.1,.06,gk);h.rotation.x=-.5;
  const sc=panel(.54,.38,new THREE.MeshBasicMaterial({map:kioskTex}),0,1.12,.105,0,gk);sc.rotation.x=-.5;colsG.push([x,z,.45]);}
for(const s of [-1,1]){const x=s*5.2,z=-7.4;mk(box(1.6,.75,.45),M.woodLight,x,.375,z);
  for(let i=0;i<3;i++){const bb=mk(box(.36,.48,.03),mat(['#2f6fd6','#3cae55','#e2463f'][i]),x-.45+i*.45,1.0,z+.05);bb.rotation.x=-.2;}
  colsG.push([x-.85,x+.85,z-.3,z+.3]);}
/* glass display case and magazine rack */
{const x=-17.3,z=-9.4;mk(box(1.8,.8,.7),M.woodDark,x,.4,z);mk(box(1.7,.6,.6),M.glass,x,1.1,z,scene,false);mk(box(1.82,.04,.72),M.steel,x,1.42,z);
  for(const [a,b2] of [[-1.25,-.85],[1.25,-.85],[-1.25,.85],[1.25,.85]])place('stanchion',x+a,0,z+b2);colsG.push([x-1.3,x+1.3,z-.9,z+.9]);}
{const g2=new THREE.Group();g2.position.set(16.9,0,6.8);g2.rotation.y=-PI/2;scene.add(g2);mk(box(1.9,.9,.5),M.woodLight,0,.45,0,g2);
  for(let r=0;r<2;r++)for(let i=0;i<5;i++){const bb=mk(box(.3,.4,.02),mat(['#e2463f','#2f6fd6','#f2b632','#3cae55','#8b5bd6'][(i+r)%5]),-.72+i*.36,1.05+r*.32,.12-r*.18,g2);bb.rotation.x=-.3;}
  mk(box(1.9,.7,.06),M.wood,0,1.3,-.22,g2);colsG.push([16.65,17.15,5.8,7.8]);}
/* entrance: gate 1 – curved information desk – gate 2, then pylons and planters to both walls */
const GZ=10.4;
function gate(x){for(const s of [-1,1]){mk(box(.14,1.05,.9),M.steel,x+s*.5,.525,GZ);mk(box(.04,.9,.85),M.glass,x+s*.36,.95,GZ,scene,false);colsG.push([x+s*.5-.1,x+s*.5+.1,GZ-.45,GZ+.45]);}}
[-2.6,2.6].forEach(gate);
{const cx=0,cz=GZ-.95,r=1.75;arcRun(cx,cz,r,-1.2,1.2,12,.5,1.0,.5,mat('#f0dcc0'),colsG);arcRun(cx,cz,r,-1.2,1.2,12,.62,.05,1.02,M.woodLight);
  arcRun(cx,cz,r+.26,-1.2,1.2,12,.04,.18,.25,mat('#c98a4c'));
  panel(.5,.5,new THREE.MeshStandardMaterial({map:infoTex,roughness:.5}),cx,.6,cz+r+.26,0);
  place('monitor',cx-.55,1.045,cz+r-.12,PI);flowerPot(cx+1.25,1.045,cz+r-.55,.7);place('chairB',cx,0,cz+.7,0);
  colsG.push([-2.05,-1.5,cz-.2,cz+.9],[1.5,2.05,cz-.2,cz+.9]);}
[[-16.9,5.0],[-11.85,5.1],[-6.9,4.8],[6.9,4.8],[11.85,5.1],[16.9,5.0]].forEach(([x,w])=>planter(x,GZ,w,colsG));
for(const [x,tex] of [[-4.0,hustTex],[4.0,libTex]]){mk(box(1.0,2.2,.45),M.white,x,1.1,GZ);mk(box(1.08,.12,.52),mat('#d9dbe0'),x,2.26,GZ);
  panel(.96,2.1,new THREE.MeshStandardMaterial({map:tex,roughness:.5}),x,1.1,GZ+.23,0);colsG.push([x-.55,x+.55,GZ-.25,GZ+.25]);}
/* benches and plants around tầng 1 */
for(const s of [-1,1]){mk(box(.55,.42,2.6),mat('#d9dbe0'),s*18.7,.21,8.4);mk(box(.57,.06,2.62),M.woodLight,s*18.7,.47,8.4);colsG.push([s*18.7-.3,s*18.7+.3,7.1,9.7]);seatsG+=3;for(const dz of [-.8,0,.8])__S("benchA",s*18.65,0,8.4+dz,s>0?-PI/2:PI/2);}
[[-18.7,-6.6],[18.6,-4.6],[-7.6,-12.2],[7.6,-12.2],[18.6,11.8]].forEach(([x,z])=>plant(x,0,z,2.0,colsG));
/* water dispensers in the two back corners */
const waterTex=canvasTex(128,64,(g,w,h)=>{g.fillStyle='#e9eef3';g.fillRect(0,0,w,h);g.fillStyle='#1f6fd1';g.font='700 22px "Be Vietnam Pro", system-ui, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('NƯỚC',w/2,h/2);});
const bottleM=new THREE.MeshStandardMaterial({color:lin('#7fc4f5'),transparent:true,opacity:.7,roughness:.05});
for(const s of [-1,1]){const x=s*18.85,z=-12.35,g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  mk(box(.42,1.05,.42),M.white,0,.525,0,g);mk(box(.36,.2,.06),mat('#2a2d33'),0,.82,.2,g);
  for(const [dx,c] of [[-.08,'#3a7bea'],[.08,'#e5483b']])mk(box(.05,.07,.06),mat(c,{emissive:c,emissiveIntensity:.3}),dx,.84,.25,g);
  mk(box(.3,.03,.18),mat('#9aa0aa',{metalness:.4}),0,.6,.17,g);
  mk(cyl(.15,.15,.38,24),bottleM,0,1.25,0,g);mk(cyl(.07,.15,.08,24),bottleM,0,1.08,0,g);
  panel(.3,.15,new THREE.MeshBasicMaterial({map:waterTex}),0,.45,.212,0,g);
  mk(cyl(.05,.05,.28,14),mat('#ffffff'),.3,.9,.05,g);colsG.push([x-.3,x+.3,z-.3,z+.3]);}
/* drinks vending machine in the outer left corner by the entrance */
const vendTex=canvasTex(256,512,(g,w,h)=>{g.fillStyle='#d6262b';g.fillRect(0,0,w,h);g.fillStyle='#1b1d24';g.fillRect(14,14,w*.66,h*.62);
  const cl=['#2f9ae0','#f2b632','#3cae55','#e2463f','#ffffff','#8b5bd6'];for(let r=0;r<5;r++)for(let c=0;c<4;c++){const x=24+c*40,y=26+r*60;g.fillStyle=cl[(r+c)%6];g.fillRect(x,y,26,44);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x+4,y+4,5,36);
    g.fillStyle='#f2d36b';g.fillRect(x,y+48,26,6);}
  g.fillStyle='#14161c';g.fillRect(w*.74,40,w*.2,160);g.fillStyle='#4fe06b';g.fillRect(w*.77,52,w*.14,24);g.fillStyle='#c9ccd2';for(let i=0;i<9;i++)g.fillRect(w*.77+(i%3)*14,92+(i/3|0)*18,10,12);
  g.fillStyle='#14161c';g.fillRect(24,h*.72,w*.62,h*.12);g.fillStyle='#ffffff';g.font='800 34px "Be Vietnam Pro", system-ui, sans-serif';g.textAlign='center';g.fillText('NƯỚC UỐNG',w/2,h*.93);});
allText.push(vendTex);
{const x=-19.0,z=11.9;mk(box(.9,1.95,1.05),mat('#c21f25',{roughness:.4}),x,.975,z);panel(1.0,1.9,new THREE.MeshStandardMaterial({map:vendTex,roughness:.3}),x+.452,.98,z,PI/2);colsG.push([x-.5,x+.5,z-.55,z+.55]);}


/* ---------- tầng 2: a full ring of seating like tầng 7 ---------- */
const bookCols=['#e2463f','#2f6fd6','#3cae55','#f2b632','#f07c2e','#f4f4f6','#36a7c9','#8b5bd6','#1f4aa8'].map(lin);const books=[];
function shelfRun(x0,x1){const z=ZB+.25,len=x1-x0,cx=(x0+x1)/2;mk(box(len,2.2,.42),M.woodLight,cx,MZ+1.1,z);
  for(const y of [.12,.55,.98,1.41,1.84]){mk(box(len-.04,.03,.4),M.wood,cx,MZ+y,z+.02,scene,false);
    let x=x0+.05;while(x<x1-.05){const w=.03+R()*.03,h=.24+R()*.13;if(R()<.05){x+=.08;continue;}if(x+w>x1-.05)break;
      books.push({m:T(x+w/2,MZ+y+.015+h/2,z+.06,0,0,0,w,h,.24),c:bookCols[R()*bookCols.length|0]});x+=w+.003;}}
  colsM.push([x0,x1,ZB,z+.25]);}
shelfRun(-18.6,-14.2);shelfRun(-12.4,-8.2);
for(const x of [-15.6,-11]){const z=-10.4;mk(box(2.4,.06,1.05),M.woodLight,x,MZ+.75,z);for(const lx of [-1.05,1.05])mk(box(.08,.72,.9),M.wood,x+lx,MZ+.36,z);
  for(const lx of [-.75,0,.75]){place('chairB',x+lx,MZ,z-.8,0);place('chairB',x+lx,MZ,z+.8,PI);seatsM+=2;}colsM.push([x-1.25,x+1.25,z-1.1,z+1.1]);}
/* front corridor: long study tables beside the parapet, chairs on both sides */
for(const [x0,x1] of [[-12.6,-3.4],[3.4,12.6]]){const z=10.3,cx=(x0+x1)/2,len=x1-x0;mk(box(len,.05,.9),mat('#f6f6f4',{roughness:.35}),cx,MZ+.75,z);
  for(let x=x0+.3;x<=x1-.2;x+=2.3)mk(box(.08,.72,.75),M.metal,x,MZ+.36,z);
  for(let x=x0+.5;x<x1-.2;x+=.9){place('chairL',x,MZ,z-.75,0);place('chairB',x,MZ,z+.75,PI);seatsM+=2;}colsM.push([x0,x1,z-1.05,z+1.05]);}
/* left end: dark round tables with red chairs */
for(const z of [-3.3,0,3.3]){const x=-17.2;place('dtable',x,MZ,z);colsM.push([x,z,1.3]);
  for(let k=0;k<4;k++){const a=k*PI/2+.4+(R()-.5)*.2;place('chairR',x+Math.sin(a)*.95,MZ,z+Math.cos(a)*.95,a+PI);seatsM++;}}
/* right end: two lounge corners */
for(const z of [-10.1,10.1]){const cx=15.9,cz=z;place('ctable',cx,MZ,cz);colsM.push([cx,cz,.6]);
  place('sofa',cx+1.15,MZ,cz,-PI/2);colsM.push([cx+1.15,cz,.9]);seatsM+=3;
  for(const sg of [-1,1]){const ax=cx,az=cz+sg*1.15;place('arm',ax,MZ,az,faceTo(ax,az,cx,cz));colsM.push([ax,az,.5]);seatsM++;}}
/* back corridor: bench in front of the lifts, plants */
mk(box(2.6,.42,.55),mat('#d9dbe0'),0,MZ+.21,-11.6);mk(box(2.62,.06,.57),M.woodLight,0,MZ+.47,-11.6);colsM.push([-1.3,1.3,-11.9,-11.3]);seatsM+=3;for(const dx of [-.8,0,.8])__S("benchM",dx,MZ,-11.55,0);
[[-3.2,-12.3],[3.2,-12.3],[-18.6,11.8],[18.8,12.1],[18.8,-12.1],[-2,12.2],[2,12.2]].forEach(([x,z])=>plant(x,MZ,z,1.9,colsM));
/* ---------- tầng 3: benches and a few plants; tầng 4: simple tables and chairs outside room 401 ---------- */
function simpleChair(par,x,y,z,ry,col){const c=new THREE.Group();c.position.set(x,y,z);c.rotation.y=ry;par.add(c);
  mk(box(.46,.05,.44),mat(col,{roughness:.6}),0,.46,0,c);mk(box(.48,.42,.05),mat(col,{roughness:.6}),0,.73,-.21,c);
  for(const [px,pz] of [[-.19,-.18],[.19,-.18],[-.19,.18],[.19,.18]])mk(cyl(.016,.016,.45,6),M.metal,px,.225,pz,c);}
function roundSet(par,list,x,y,z,top,n,cols){mk(cyl(.62,.62,.04,36),mat(top,{roughness:.4}),x,y+.74,z,par);mk(cyl(.05,.05,.72,10),M.metal,x,y+.36,z,par);mk(cyl(.3,.34,.03,24),M.metal,x,y+.015,z,par);list.push([x,z,1.3]);
  for(let k=0;k<n;k++){const a=k*2*PI/n+.4;simpleChair(par,x+Math.sin(a)*.95,y,z+Math.cos(a)*.95,a+PI,cols[k%cols.length]);}}
{const y=2*FH;for(const [x,z] of [[-18.6,11.8],[18.6,11.8],[-18.6,-11.8],[0,-12.2],[0,12.2],[18.6,-11.8]])plant(x,y,z,1.9,cols3,UP[3]);
  for(const s of [-1,1]){mk(box(2.6,.42,.55),mat('#d9dbe0'),s*8,y+.21,11.9,UP[3]);mk(box(2.62,.06,.57),M.woodLight,s*8,y+.47,11.9,UP[3]);cols3.push([s*8-1.3,s*8+1.3,11.6,12.2]);}
  for(const z of [-2.6,2.6])roundSet(UP[3],cols3,-17.2,y,z,'#3a3e48',3,['#9cb0c6']);}
{const y=3*FH;for(const [x,z] of [[-18.6,11.8],[18.6,11.8],[-18.6,-11.8],[18.6,-11.8],[0,12.2]])plant(x,y,z,1.9,cols4,UP[4]);
  for(const [x,z] of [[-15,10.3],[-9.5,10.3],[9.5,10.3],[15,10.3],[-17.2,-3],[-17.2,3]])roundSet(UP[4],cols4,x,y,z,'#f2f2f0',4,['#9cb0c6','#2c3759']);}
/* coffee and drinks vending machine on the tầng 4 corridor, outside room 401 */
const coffeeTex=canvasTex(256,512,(g,w,h)=>{g.fillStyle='#2b1d17';g.fillRect(0,0,w,h);const gr=g.createLinearGradient(0,0,0,h*.5);gr.addColorStop(0,'#6b3f26');gr.addColorStop(1,'#3a2418');g.fillStyle=gr;g.fillRect(12,12,w-24,h*.48);
  g.fillStyle='#f6e7d2';g.beginPath();g.ellipse(w*.42,h*.3,52,14,0,0,7);g.fill();g.fillRect(w*.42-52,h*.3,104,70);g.beginPath();g.ellipse(w*.42,h*.3+70,52,14,0,0,7);g.fill();
  g.strokeStyle='#f6e7d2';g.lineWidth=12;g.beginPath();g.arc(w*.42+58,h*.3+34,22,-1.2,1.2);g.stroke();
  g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=4;for(const dx of [-18,0,18]){g.beginPath();g.moveTo(w*.42+dx,h*.25);g.bezierCurveTo(w*.42+dx-12,h*.2,w*.42+dx+12,h*.16,w*.42+dx,h*.11);g.stroke();}
  g.fillStyle='#ffffff';g.textAlign='center';g.font='800 34px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('CÀ PHÊ · TRÀ',w/2,h*.56);
  g.fillStyle='#d9c3a5';g.font='500 22px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Pha tự động · 10.000đ',w/2,h*.62);
  for(let i=0;i<6;i++){g.fillStyle=['#e2463f','#f2b632','#3cae55','#2f6fd6','#f07c2e','#8b5bd6'][i];g.fillRect(28+(i%3)*72,h*.67+(i/3|0)*44,58,32);}
  g.fillStyle='#14161c';g.fillRect(w*.3,h*.86,w*.4,h*.1);g.fillStyle='#4fe06b';g.fillRect(w*.74,h*.68,26,14);});
allText.push(coffeeTex);
{const y=3*FH,x=-19.0,z=-8.6;mk(box(.85,1.95,1.0),mat('#3a2418',{roughness:.45}),x,y+.975,z,UP[4]);panel(.96,1.9,new THREE.MeshStandardMaterial({map:coffeeTex,roughness:.35}),x+.428,y+.98,z,PI/2,UP[4]);
  mk(box(.12,.24,.3),mat('#1a1c22'),x+.47,y+.75,z,UP[4]);cols4.push([x-.45,x+.5,z-.55,z+.55]);}

/* ---------- book-lending room: an open shop-front off the left wall of tầng 1 ---------- */
const brSign=canvasTex(1024,192,(g,w,h)=>{g.fillStyle='#1f6b4a';g.fillRect(0,0,w,h);g.fillStyle='#ffffff';g.textAlign='center';g.textBaseline='middle';
  g.font='800 84px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('PHÒNG MƯỢN SÁCH',w/2,h*.44);g.fillStyle='#bfe8d2';g.font='500 34px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Mượn · Trả · Gia hạn',w/2,h*.82);});
const awnTex=canvasTex(256,64,(g,w,h)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#ffffff':'#2a8a5e';g.fillRect(i*w/8,0,w/8,h);}g.fillStyle='rgba(0,0,0,.12)';g.fillRect(0,h-8,w,8);});
awnTex.wrapS=THREE.RepeatWrapping;awnTex.repeat.set(4,1);allText.push(brSign);
const brCols=[];
{const {x0,x1,z0,z1,h}=BRM,cx=(x0+x1)/2,cz=0,wx=x1-x0,wz=z1-z0;
  const ft=whiteTex.clone();ft.needsUpdate=true;ft.repeat.set(wx/2.4,wz/2.4);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(wx,wz),new THREE.MeshStandardMaterial({map:ft,roughness:.25}));fl.rotation.x=-PI/2;fl.position.set(cx,.002,cz);fl.receiveShadow=true;scene.add(fl);
  panel(wz,h,wallMat,x0,h/2,cz,PI/2);panel(wx,h,wallMat,cx,h/2,z0,0);panel(wx,h,wallMat,cx,h/2,z1,PI);
  const cl=new THREE.Mesh(new THREE.PlaneGeometry(wx,wz),mat('#f3f2ef'));cl.rotation.x=PI/2;cl.position.set(cx,h,cz);scene.add(cl);
  for(const z of [-2.5,0,2.5])mk(box(1.5,.04,.5),M.panel,cx,h-.03,z,scene,false);
  /* shelves on the three walls */
  const shelfAt=(sx,sz,len,ry)=>{const g=new THREE.Group();g.position.set(sx,0,sz);g.rotation.y=ry;scene.add(g);
    mk(box(len,2.3,.42),M.woodLight,0,1.15,0,g);
    for(const y of [.12,.56,1.0,1.44,1.88]){mk(box(len-.04,.03,.4),M.wood,0,y,.02,g,false);let x=-len/2+.05;
      while(x<len/2-.05){const w=.03+R()*.03,hh=.24+R()*.14;if(R()<.05){x+=.08;continue;}if(x+w>len/2-.05)break;
        const v=new THREE.Vector3(x+w/2,y+.015+hh/2,.06).applyAxisAngle(V(0,1,0),ry);books.push({m:T(sx+v.x,v.y,sz+v.z,0,ry,0,w,hh,.24),c:bookCols[R()*bookCols.length|0]});x+=w+.003;}}};
  shelfAt(x0+.25,0,wz-.6,PI/2);shelfAt(cx-.3,z0+.25,wx-1.6,0);shelfAt(cx-.3,z1-.25,wx-1.6,PI);
  brCols.push([x0,x0+.5,z0,z1],[x0,x1-1.2,z0,z0+.5],[x0,x1-1.2,z1-.5,z1]);
  /* lending counter, facing the hall like a shop counter, with a gap to walk in */
  mk(box(.7,1.0,5.5),mat('#2a8a5e',{roughness:.5}),-21.1,.5,-1.55);mk(box(.84,.06,5.58),M.woodLight,-21.1,1.03,-1.55);brCols.push([-21.5,-20.7,-4.3,1.2]);
  place('monitor',-21.25,1.06,-2.4,PI/2);place('monitor',-21.25,1.06,-.2,PI/2);place('chairB',-22.3,0,-2.4,PI/2);place('chairB',-22.3,0,-.2,PI/2);
  [['#2f6fd6',4],['#e2463f',3],['#3cae55',3]].forEach(([c,n],k)=>{for(let i=0;i<n;i++){const bk=mk(box(.26,.05,.34),mat(c),-21.0,1.06+.025+i*.052,-3.8+k*.42);bk.rotation.y=(R()-.5)*.3;}});
  mk(box(.6,.75,.9),mat('#f4f4f2'),-24.6,.375,-2.6);brCols.push([-24.9,-24.3,-3.05,-2.15]);
  /* sign and striped awning over the opening */
  panel(5.4,1.0,new THREE.MeshStandardMaterial({map:brSign,roughness:.5}),-XW+.03,3.95,0,PI/2);
  const aw=new THREE.Mesh(new THREE.PlaneGeometry(9.2,.95),new THREE.MeshStandardMaterial({map:awnTex,roughness:.6,side:THREE.DoubleSide}));aw.position.set(-XW+.4,3.18,0);aw.rotation.set(-.95,PI/2,0,'YXZ');scene.add(aw);
  plant(-20.0,0,-4.55,1.6);plant(-20.0,0,4.55,1.6);brCols.push([-20.4,-19.6,-4.9,-4.2],[-20.4,-19.6,4.2,4.9]);}

/* ---------- room 401 on tầng 4, behind the back wall ---------- */
const roomG=new THREE.Group();roomG.position.set(0,3*FH,ROOMZ);UP[4].add(roomG);
window.__SEATTAG="r401";const ROOM=buildRoom401(renderer,roomG);window.__SEATTAG="A";
/* the wing that holds room 401, seen from outside */
{const wm=mat('#ece4d8'),zb=ROOMZ+ROOM.Z0-.05,len=ZB-zb,cz=(ZB+zb)/2,h=3*FH+ROOM.H+.3;
  panel(len,h,wm,21.55,h/2,cz,PI/2);panel(len,h,wm,-21.55,h/2,cz,-PI/2);panel(43.1,h,wm,0,h/2,zb,PI);
  panel(2.05,3*FH,wm,20.5,1.5*FH,ZB,0);panel(2.05,3*FH,wm,-20.5,1.5*FH,ZB,0);}

/* ---------- phòng P419 trên tầng 4: phía đông sảnh, sau khối thang máy (theo sơ đồ tầng 4 + ảnh chụp) ----------
   Dãy bàn dài màu be, ghế xanh hai bên, tủ sách gỗ dọc tường bắc và nam, cột tròn trắng, quạt trần + đèn LED,
   cửa sổ rèm xanh ở tường đông. Vào từ sảnh qua hai cửa ở tường phải (bắc và nam khối thang máy). */
const cols419=[],fans419=[],c419=new THREE.Group();UP[4].add(c419);
{const {x0,x1,z0,z1,h,doors,dh,core}=R4,y0=3*FH,par=UP[4],cx=(x0+x1)/2,cz=(z0+z1)/2,wx=x1-x0,wz=z1-z0;
  window.__SEATTAG="r419";
  /* sàn và trần: ba mảnh, chừa giếng thang máy */
  const rects=[[core.x1,x1,z0,z1],[x0,core.x1,z0,-core.z],[x0,core.x1,core.z,z1]];
  const ft=whiteTex.clone();ft.needsUpdate=true;ft.repeat.set(1/2.4,1/2.4);ft.wrapS=ft.wrapT=THREE.RepeatWrapping;
  const fm=new THREE.MeshStandardMaterial({map:ft,roughness:.3}),cm=mat('#f3f2ef');
  for(const [a,b,c,d] of rects){const g=new THREE.PlaneGeometry(b-a,d-c),uv=g.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(a+uv.getX(i)*(b-a)),(c+uv.getY(i)*(d-c)));
    const f=new THREE.Mesh(g,fm);f.rotation.x=-PI/2;f.position.set((a+b)/2,y0+.003,(c+d)/2);f.receiveShadow=true;par.add(f);
    const cl=new THREE.Mesh(new THREE.PlaneGeometry(b-a,d-c),cm);cl.rotation.x=PI/2;cl.position.set((a+b)/2,y0+h,(c+d)/2);c419.add(cl);}
  /* tường trong (một mặt, nhìn từ trong phòng) */
  panel(wz,h,wallMat,x1,y0+h/2,cz,-PI/2,par);panel(wx,h,wallMat,cx,y0+h/2,z0,0,par);panel(wx,h,wallMat,cx,y0+h/2,z1,PI,par);
  {const cuts=[[z0,doors[0][0]],[doors[0][1],-core.z],[core.z,doors[1][0]],[doors[1][1],z1]];
    for(const [a,b] of cuts)panel(b-a,h,wallMat,x0+.01,y0+h/2,(a+b)/2,PI/2,par);
    for(const [a,b] of doors){panel(b-a,h-dh,wallMat,x0+.01,y0+(h+dh)/2,(a+b)/2,PI/2,par);
      mk(box(.16,dh,.1),M.woodLight,x0,y0+dh/2,a,par,false);mk(box(.16,dh,.1),M.woodLight,x0,y0+dh/2,b,par,false);mk(box(.16,.1,b-a+.1),M.woodLight,x0,y0+dh,(a+b)/2,par,false);}}
  for(const [s,ry,px,pz,len] of [[0,-PI/2,x1-.02,cz,wz],[1,0,cx,z0+.02,wx],[2,PI,cx,z1-.02,wx]]){const p=panel(len,.12,mat('#cfc6b8'),px,y0+.06,pz,ry,par);}
  /* cửa sổ + rèm xanh ở tường đông */
  const curM=mat('#2f6db5',{roughness:.85}),n=5;
  for(let i=0;i<n;i++){const z=z0+wz*(i+.5)/n;panel(2.6,1.7,winM,x1-.03,y0+2.0,z,-PI/2,par);
    for(const s of [-1,1])mk(box(.06,2.25,.55),curM,x1-.12,y0+1.95,z+s*1.45,par,false);
    mk(box(.08,.2,3.4),curM,x1-.1,y0+3.08,z,par,false);}
  /* trần: đèn LED tấm và quạt trần */
  for(let x=x0+4;x<x1-1;x+=4.2)for(let z=z0+2.2;z<z1-1;z+=4.6){mk(box(1.24,.04,.62),M.panel,x,y0+h-.03,z,c419,false);}
  const fanM=mat('#f3f3f1',{roughness:.5});
  for(const x of [x0+6.6,x0+14])for(const z of [-6,0,6]){const g=new THREE.Group();g.position.set(x,y0+h-.5,z);c419.add(g);
    mk(cyl(.02,.02,.42,8),M.metal,0,.29,0,g,false);mk(cyl(.15,.12,.12,18),fanM,0,0,0,g,false);
    for(let k=0;k<3;k++){const a=k*PI*2/3,b=mk(box(.95,.02,.18),fanM,Math.cos(a)*.58,.01,-Math.sin(a)*.58,g,false);b.rotation.y=a;}fans419.push(g);}
  /* cột tròn trắng giữa hai dãy bàn */
  for(const z of [-4.5,4.5]){mk(cyl(.3,.3,h,24),M.column,x0+10.3,y0+h/2,z,par);cols419.push([x0+10.3,z,.3]);}
  /* tủ sách gỗ dọc tường bắc và nam */
  const shelf=(sx,sz,len,ry)=>{const g=new THREE.Group();g.position.set(sx,y0,sz);g.rotation.y=ry;par.add(g);
    mk(box(len,2.1,.42),M.woodLight,0,1.05,0,g);
    for(const y of [.12,.52,.92,1.32,1.72]){mk(box(len-.04,.03,.4),M.wood,0,y,.02,g,false);let x=-len/2+.05;
      while(x<len/2-.05){const w=.03+R()*.03,hh=.22+R()*.12;if(R()<.06){x+=.08;continue;}if(x+w>len/2-.05)break;
        const v=new THREE.Vector3(x+w/2,y+.015+hh/2,.06).applyAxisAngle(V(0,1,0),ry);books.push({m:T(sx+v.x,y0+v.y,sz+v.z,0,ry,0,w,hh,.24),c:bookCols[R()*bookCols.length|0]});x+=w+.003;}}};
  for(let x=x0+3.6;x<x1-1;x+=3.3){shelf(x+1.55,z1-.25,3.1,PI);shelf(x+1.55,z0+.25,3.1,0);}
  cols419.push([x0+3.6,x1,z1-.5,z1],[x0+3.6,x1,z0,z0+.5]);
  /* dãy bàn dài màu be, ghế xanh hai bên */
  const topM=mat('#e8dcc2',{roughness:.5}),legM=mat('#d9cbb0',{roughness:.55}),TL=5.4,TW=1.0;
  for(const tz of [-6,-3,0,3,6])for(const tx of [x0+6.6,x0+14]){
    mk(box(TL,.05,TW),topM,tx,y0+.745,tz,par);
    for(const s of [-1,1])mk(box(.06,.72,TW-.1),legM,tx+s*(TL/2-.12),y0+.36,tz,par);
    mk(box(TL-.3,.3,.03),legM,tx,y0+.55,tz,par,false);
    cols419.push([tx-TL/2,tx+TL/2,tz-TW/2,tz+TW/2]);
    for(let k=0;k<7;k++){const x=tx-TL/2+.39+k*.77;place('chairB',x,y0,tz-.66,0);place('chairB',x,y0,tz+.66,PI);}}
  /* bàn thủ thư cạnh cửa phía nam */
  mk(box(.7,.95,2.2),mat('#2f6db5',{roughness:.5}),x0+3.1,y0+.475,-4.8,par);mk(box(.8,.05,2.3),M.woodLight,x0+3.1,y0+.97,-4.8,par);
  place('monitor',x0+3.15,y0+1.0,-4.8,-PI/2);place('chairB',x0+3.9,y0,-4.8,-PI/2);cols419.push([x0+2.7,x0+3.5,-5.95,-3.65]);
  plant(x0+3.0,y0,z1-1.3,1.4,undefined,par);plant(x1-.7,y0,z1-1.3,1.4,undefined,par);
  window.__SEATTAG="A";
  /* biển phòng trên tường sảnh, trên mỗi cửa */
  const sign=canvasTex(512,160,(g,w,hh)=>{g.fillStyle='#1f3f73';g.fillRect(0,0,w,hh);g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';
    g.font='800 76px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('P419',w/2,hh*.42);g.fillStyle='#cfe0ff';g.font='500 30px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Phòng đọc',w/2,hh*.8);});
  allText.push(sign);const sm=new THREE.MeshStandardMaterial({map:sign,roughness:.5});
  for(const [a,b] of doors)panel(1.5,.47,sm,XW-.03,y0+dh+.45,(a+b)/2,-PI/2,par);
  /* vỏ ngoài của cánh phòng (chỉ thấy từ ngoài toà nhà) */
  const wm=mat('#ece4d8'),H2=y0+h+.3;
  panel(wz,H2,wm,x1+.05,H2/2,cz,PI/2);panel(wx,H2,wm,cx,H2/2,z1+.05,0);panel(wx,H2,wm,cx,H2/2,z0-.05,PI);}

buildProps();
{const im=new THREE.InstancedMesh(box(1,1,1),mat('#ffffff',{roughness:.75}),books.length);books.forEach((b,i)=>{im.setMatrixAt(i,b.m);im.setColorAt(i,b.c);});
  im.instanceColor.needsUpdate=true;im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;scene.add(im);}

/* ---------- lighting ---------- */
const hemi=new THREE.HemisphereLight(0xffffff,0xe6dcd2,.86);scene.add(hemi);
const topLight=new THREE.DirectionalLight(0xfff8ee,.5);topLight.position.set(-5,46,9);topLight.target.position.set(0,0,0);
topLight.castShadow=true;{const s=topLight.shadow;s.mapSize.set(2048,2048);Object.assign(s.camera,{left:-26,right:26,top:26,bottom:-26,near:1,far:110});s.camera.updateProjectionMatrix();s.bias=-.0004;s.normalBias=.025;}
scene.add(topLight,topLight.target);
const fill=new THREE.DirectionalLight(0xfff0e0,.18);fill.position.set(12,10,24);scene.add(fill);
const winMats=[];scene.traverse(o=>{if(o.material&&o.material.map&&o.material.map.image===winTex.image)winMats.push(o.material);});
const DAY={bg:lin('#efe7e2'),hemi:.86,hemiC:lin('#fff6ee'),top:.5,win:lin('#ffffff'),panel:.95};
const EVE={bg:lin('#17141a'),hemi:.55,hemiC:lin('#ffe2c4'),top:.45,win:lin('#2c3560'),panel:1.7};
let night=0,nightTarget=0;scene.background=DAY.bg.clone();
function applyNight(t){const l=(a,b)=>a+(b-a)*t;scene.background.copy(DAY.bg).lerp(EVE.bg,t);hemi.intensity=l(DAY.hemi,EVE.hemi);hemi.color.copy(DAY.hemiC).lerp(EVE.hemiC,t);
  topLight.intensity=l(DAY.top,EVE.top);winMats.forEach(m=>m.color.copy(DAY.win).lerp(EVE.win,t));M.panel.emissiveIntensity=l(DAY.panel,EVE.panel);M.down.emissiveIntensity=l(.9,1.5);ROOM.applyNight(t);}

/* ---------- views & camera ---------- */
const Y4=3*FH;
const VIEWS={
  overview:{p:V(0,27,34),t:V(0,1,-1),fit:'over'},
  entrance:{p:V(0,2.9,12.6),t:V(0,1.4,0)},
  bust:{p:V(2.0,2.1,5.0),t:V(0,1.6,BUST.z)},
  wall:{p:V(0,2.0,-2.2),t:V(0,1.9,-8.4)},
  stairs:{p:V(1.5,2.3,6.4),t:V(11.5,2.6,-1.5)},
  lending:{p:V(-14.8,2.2,6.2),t:V(-22.5,1.3,-.5)},
  mezz:{p:V(5.8,MZ+1.8,-5.4),t:V(0,.5,2.5)},
  dome:{p:V(0,1.5,7.4),t:V(0,CH+1,-1.5)},
  floor2:{p:V(-17.5,MZ+2.6,10.6),t:V(-6,MZ+.6,9.6)},
  floor4:{p:V(16.5,Y4+2.4,10.8),t:V(2,Y4+.4,9)},
  r401:{p:V(-2,Y4+3.4,-14.6),t:V(4,Y4+.2,-28)},
  desk401:{p:V(1.2,Y4+2.2,-20.8),t:V(5.95,Y4+1.5,-13.4)},
  lift:{p:V(15.0,1.7,0),t:V(19.5,1.5,0)},
  building:{p:V(44,30,50),t:V(3,13,-5)},
  top:{p:V(0,64,-6),t:V(0,0,-7),fit:'top'}
};
function viewPose(name){const v=VIEWS[name];const p=v.p.clone(),t=v.t.clone(),a=camera.aspect;
  if(v.fit==='over'){const k=Math.min(2.6,Math.max(1,Math.pow(1.7/a,.9)));p.sub(t).multiplyScalar(k).add(t);}
  if(v.fit==='top'){p.y=Math.max(64,56/a+14);}
  return {p,t};}
let tween=null;
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
function flyTo(p,t,dur=1.3,done){const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  tween={p0:camera.position.clone(),t0:controls.target.clone(),p1:p,t1:t,s:performance.now(),d:reduce?1:dur*1000,done};}
const viewBtns=[...root.querySelectorAll('[data-view]')];
const setActive=n=>viewBtns.forEach(b=>b.classList.toggle('on',b.dataset.view===n));
let fullView=false,cutNow=false;
function goView(n){if(mode==='walk')setMode('orbit');fullView=n==='building';const {p,t}=viewPose(n);flyTo(p,t);setActive(n);}
viewBtns.forEach(b=>b.addEventListener('click',()=>goView(b.dataset.view)));
controls.addEventListener('start',()=>{tween=null;setActive(null);});

/* ---------- walking: floors, stairs, lifts, room 401, lending room ---------- */
let mode='orbit',yaw=0,pitch=0,eyeY=1.6,base=0,rider=null;
const keys={f:0,b:0,l:0,r:0,run:0};
const touch=matchMedia('(pointer: coarse)').matches;
const hint=$('#hint'),dpad=$('#dpad');
const levelOf=y=>Math.max(1,Math.min(4,Math.round(y/FH)+1));
function where(){const p=camera.position;if(rider)return `Thang máy · tầng ${rider.phase==='moving'?'…':rider.floor}`;
  const f=base/FH;if(Math.abs(f-Math.round(f))>.07)return 'Cầu thang';const lv=levelOf(base);
  if(lv===4&&p.z<ZB-.1)return 'Phòng 401 · tầng 4';if(lv===4&&p.x>XW&&(p.x>R4.core.x1||Math.abs(p.z)>R4.core.z))return 'Phòng 419 · tầng 4';if(lv===1&&p.x<-XW)return 'Phòng mượn sách · tầng 1';return lv===1?'Sảnh tầng 1':`Tầng ${lv}`;}
let lastWhere='';
function setHint(){lastWhere=where();hint.textContent=mode==='walk'
  ?(`${lastWhere} · `+(touch?'Giữ nút mũi tên để đi · Vuốt để nhìn quanh · Thang máy ở tường bên phải':'W A S D để đi · Kéo để nhìn · Thang máy ở tường bên phải · Esc để thoát'))
  :(touch?'Một ngón để xoay · Hai ngón để phóng to và dịch chuyển':'Kéo để xoay · Cuộn để phóng to · Kéo chuột phải để dịch chuyển');}
const liftAt=(x,z)=>LIFTS.find(l=>Math.abs(z-l.z)<.96&&x>XW-.45&&x<R4.core.x1);
const inCab=(l,x,z)=>x>XW+.25&&x<CX1-.3&&Math.abs(z-l.z)<.68;
const onLanding=(x,z)=>{const ax=Math.abs(x);return ax>LAND.x0-.05&&ax<LAND.x1+.3&&z>LAND.z0&&z<LAND.z1;};
const onMezz=(x,z)=>onLanding(x,z)||!inside(x,z,FR+.3);
// Physical camera footprint: furniture is handled by visibility, not floor clearance.
function cameraInside(x,z,foot){
  if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(foot))return false;
  const m=.08,lvl=levelOf(foot);
  if(lvl===4&&z<ZB+1.1)return x>(z>ZB?-XW+m:ROOM.X0+m)&&x<(z>ZB?XW-m:ROOM.X1-m)&&z>ROOMZ+ROOM.Z0+m;
  if(lvl===4&&foot>LBASE[4]-.3&&x>XW-m&&z>ZB){if(x<XW+.3)return inDoor4(z,m);return x<R4.x1-m&&z>R4.z0+m&&z<R4.z1-m&&!(x<R4.core.x1+m&&Math.abs(z)<R4.core.z+m);}
  if(foot<.3&&x<-XW+m)return x>BRM.x0+m&&z>BRM.z0+m&&z<BRM.z1-m&&!(x>-XW-m&&Math.abs(z)>BRM.open-m);
  if(x<-XW+m||x>XW-m||z<ZB+m||z>ZF-m)return false;
  if(foot>=FH-.3&&inside(x,z,FR+m)){const ax=Math.abs(x);return lvl===2&&ax>LAND.x0+m&&ax<LAND.x1-m&&z>Math.max(LAND.z0,-7.75)+m&&z<LAND.z1-m;}
  return true;
}
/* the walkable surface height at (x,z) for someone standing at height cur, or null */
function surface(x,z,cur){const lvl=levelOf(cur),l=liftAt(x,z);
  if(l){const door=x<=XW+.25&&Math.abs(z-l.z)<.42;
    if(l.phase==='moving'||l.phase==='xfer')return (rider===l&&inCab(l,x,z))?l.y:null;
    if(l.floor!==lvl||Math.abs(cur-LBASE[lvl])>.4)return null;if(inCab(l,x,z))return l.y;if(door)return l.door>.85?l.y:null;return null;}
  if(cur>LBASE[2]+1){const y=LBASE[lvl];
    if(lvl===4&&z<ZB+1.1){if(Math.abs(x)>(z>ZB?XW-.35:21.2)||z-ROOMZ<ROOM.Z0+.35)return null;return ROOM.hit(x,z-ROOMZ)?null:y;}
    if(lvl===4&&x>XW-.35){if(x<XW+.35)return inDoor4(z,.35)?y:null;
      if(x>R4.x1-.35||z<R4.z0+.35||z>R4.z1-.35||(x<R4.core.x1+.35&&Math.abs(z)<R4.core.z+.35))return null;return hit(cols419,x,z)?null:y;}
    if(x<-XW+.35||x>XW-.35||z<ZB+.35||z>ZF-.4)return null;
    if(inside(x,z,FR+.3)||hit(LCOL[lvl],x,z))return null;return y;}
  if(cur<.3&&x<-XW+.35){if(x<BRM.x0+.35||z<BRM.z0+.35||z>BRM.z1-.35)return null;if(x>-XW-.35&&Math.abs(z)>BRM.open-.35)return null;return hit(brCols,x,z)?null:0;}
  if(x<-XW+.35||x>XW-.35||z<ZB+.35||z>ZF-.4)return null;
  const body=stairAt(x,z,.25),walk=stairAt(x,z,-.22),c=[];
  if(!(body&&body.h>.3&&body.h<2.3))c.push(0);
  if(walk)c.push(walk.h);
  if(onMezz(x,z))c.push(MZ);
  let best=null,bd=.45;for(const v of c){const d=Math.abs(v-cur);if(d<=bd){bd=d;best=v;}}
  if(best===null)return null;
  const onStair=walk&&best===walk.h&&best>.05&&best<MZ-.05;
  if(!onStair&&hit(best<2?colsG:colsM,x,z))return null;
  return best;}
function requestFloor(l,fl){if(!l||l.phase!=='idle')return;if(fl===l.floor){l.hold=3;return;}l.target=fl;l.phase='closing';}
let fOpen=0;
function updateLifts(dt){const p=camera.position,lvl=levelOf(base);
  for(const l of LIFTS){let want=false;
    if(mode==='walk'){if(rider===l)want=true;
      else if(!rider&&Math.abs(p.z-l.z)<1.4&&p.x>XW-3.6&&p.x<XW+.3&&Math.abs(base-LBASE[lvl])<.3){if(l.floor===lvl)want=true;else if(l.phase==='idle'&&l.door===0)requestFloor(l,lvl);}}
    if(l.phase==='closing'){l.door=Math.max(0,l.door-dt*1.3);
      if(l.door===0){l.phase='moving';l.t=0;l.y0=l.y;l.y1=LBASE[l.target];l.dur=1.4+Math.abs(l.y1-l.y0)/2.4;if(!FLOORS.includes(l.target))ctx.crossStart(ME,l.i);}}
    else if(l.phase==='moving'){l.t=Math.min(1,l.t+dt/l.dur);l.y=l.y0+(l.y1-l.y0)*ease(l.t);l.cab.position.y=l.y;
      if(l.t>=1){if(FLOORS.includes(l.target)){l.floor=l.target;l.target=null;l.phase='idle';l.hold=2.5;}
        else{/* the car has climbed into tầng 6–10: hand the ride over to that part of the building */
          const tf=l.target,ride=rider===l,pose={x:camera.position.x,z:camera.position.z,yaw,pitch};
          l.target=null;l.phase='idle';l.floor=4;l.y=LBASE[4];l.cab.position.y=l.y;l.door=0;l.hold=0;l.key='';
          if(ride)ctx.handoff(ME,tf,l.i,pose);}}}
    else if(l.phase==='idle'){l.hold-=dt;l.door=Math.min(1,Math.max(0,l.door+((want||l.hold>0)?1:-1)*dt*1.3));}
    for(const fl of FLOORS){const o=(fl===l.floor&&(l.phase==='idle'||l.phase==='closing'))?l.door*.68:0,d=l.doors[fl];d.L.position.z=l.z-OW/2-o;d.R.position.z=l.z+OW/2+o;}
    if(l.cd){const k=Math.max(.002,1-(l.phase==='idle'||l.phase==='closing'?l.door:0));l.cd.L.scale.z=k;l.cd.R.scale.z=k;}
    const key=l.phase+l.floor+l.target;if(key!==l.key){l.key=key;dispDraw(l);}}
    const near=mode==='walk'&&p.z>10.2&&Math.abs(p.x)<2.8;fOpen+=((near?1:0)-fOpen)*Math.min(1,dt*4);fdoors.forEach(f=>f.d.position.x=f.s*(.78+fOpen*1.4));
  updatePanel();}
const lp=$('#liftpanel'),lpBtns=[...lp.querySelectorAll('[data-floor]')];let lpKey='';
function updatePanel(){const show=mode==='walk'&&!!rider;if(lp.hidden===show)lp.hidden=!show;if(!show){lpKey='';return;}
  const l=rider,key=l.i+l.phase+l.floor+l.target;if(key===lpKey)return;lpKey=key;const mv=l.phase==='moving'||l.phase==='xfer';
  $('#lp-name').textContent='Thang máy '+(l.i+1);$('#lp-disp').textContent=mv?(l.target>l.floor?'▲ ':'▼ ')+l.target:String(l.floor);
  lpBtns.forEach(b=>b.classList.toggle('on',+b.dataset.floor===(l.target||l.floor)));
  $('#lp-note').textContent=mv?`Đang ${l.target>l.floor?'lên':'xuống'} tầng ${l.target}…`:l.phase==='closing'?'Cửa đang đóng…':`Đang ở tầng ${l.floor}. Chọn tầng hoặc bước ra.`;}
lpBtns.forEach(b=>b.addEventListener('click',()=>requestFloor(rider,+b.dataset.floor)));
$('#lp-open').addEventListener('click',()=>{if(rider&&rider.phase==='idle')rider.hold=3;});
function walkUI(){setActive(null);$('#m-orbit').setAttribute('aria-pressed',false);$('#m-walk').setAttribute('aria-pressed',true);}
function enterWalk(p,yw){walkUI();hint.textContent='Đang đưa bạn tới nơi…';const f=V(Math.sin(yw),0,-Math.cos(yw));
  flyTo(p.clone(),p.clone().addScaledVector(f,6),1.1,()=>{mode='walk';base=Math.round((p.y-1.6)/FH)*FH;eyeY=p.y;controls.enabled=false;yaw=yw;pitch=0;canvas.classList.add('walk');dpad.hidden=false;setHint();});}
function setMode(m){if(m===mode)return;
  $('#m-orbit').setAttribute('aria-pressed',m==='orbit');$('#m-walk').setAttribute('aria-pressed',m==='walk');
  if(m==='walk')enterWalk(V(0,1.6,12.1),0);
  else{mode='orbit';rider=null;canvas.classList.remove('walk');dpad.hidden=true;controls.enabled=true;
    const f=V(Math.sin(yaw),0,-Math.cos(yaw));controls.target.copy(camera.position).addScaledVector(f,4);controls.target.y=Math.max(1,camera.position.y-.6);tween=null;setHint();}}
$('#m-orbit').addEventListener('click',()=>setMode('orbit'));
$('#m-walk').addEventListener('click',()=>setMode('walk'));
root.querySelector('[data-action=ride]').addEventListener('click',()=>enterWalk(V(15.4,1.6,0),PI/2));
root.querySelector('[data-action=climb]').addEventListener('click',()=>enterWalk(V(9.06,1.6,5.81),1.0));
root.querySelector('[data-action=go401]').addEventListener('click',()=>enterWalk(V(-.6,Y4+1.6,-10.2),0));
const KMAP={KeyW:'f',ArrowUp:'f',KeyS:'b',ArrowDown:'b',KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r'};
addEventListener('keydown',e=>{if(e.key==='Escape'&&mode==='walk'&&!window.__POTA){setMode('orbit');return;}
  if(mode!=='walk')return;if(window.__POTA){if(rider&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||'')&&!e.target?.isContentEditable&&e.key.length===1&&'1234670'.includes(e.key))requestFloor(rider,e.key==='0'?10:+e.key);return;}if(KMAP[e.code]){keys[KMAP[e.code]]=1;e.preventDefault();}if(e.key==='Shift')keys.run=1;
  if(rider&&e.key.length===1&&'1234670'.includes(e.key))requestFloor(rider,e.key==='0'?10:+e.key);});
addEventListener('keyup',e=>{if(KMAP[e.code])keys[KMAP[e.code]]=0;if(e.key==='Shift')keys.run=0;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=0;});
dpad.querySelectorAll('button').forEach(b=>{const k=b.dataset.k;
  const on=e=>{e.preventDefault();keys[k]=1;b.classList.add('held');try{b.setPointerCapture(e.pointerId);}catch(_){}};
  const off=()=>{keys[k]=0;b.classList.remove('held');};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);});
let look=null;
canvas.addEventListener('pointerdown',e=>{if(mode!=='walk'||window.__POTA)return;look={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!look||mode!=='walk'||window.__POTA)return;const s=(touch?.006:.0045)*(window.__LOOK_K||1);
  yaw+=(e.clientX-look.x)*s;pitch+=(e.clientY-look.y)*s;pitch=Math.max(-1.2,Math.min(1.2,pitch));look={x:e.clientX,y:e.clientY};});
const endLook=()=>look=null;canvas.addEventListener('pointerup',endLook);canvas.addEventListener('pointercancel',endLook);
$('#t-night').addEventListener('click',e=>{nightTarget=nightTarget?0:1;e.currentTarget.setAttribute('aria-pressed',!!nightTarget);});

$('#meta').textContent=`Tầng 1–4 · thang máy lên tầng 6, 7, 10 · phòng 401 · phòng mượn sách`;

let started=false;
function intro(){const {p,t}=viewPose('overview');camera.position.copy(p).sub(t).multiplyScalar(1.45).add(t).add(V(0,8,6));controls.target.copy(t);flyTo(p,t,2.2);}
setHint();

let last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;
  if(tween){const k=Math.min(1,(now-tween.s)/tween.d),e=ease(k);
    camera.position.lerpVectors(tween.p0,tween.p1,e);controls.target.lerpVectors(tween.t0,tween.t1,e);camera.lookAt(controls.target);
    if(k>=1){const d=tween.done;tween=null;d&&d();}}
  if(mode==='walk'){
    const sp=(keys.run?6:3)*dt*(window.__WALK_K||1),fx=Math.sin(yaw),fz=-Math.cos(yaw);
    let mx=(keys.f-keys.b)*fx+(keys.r-keys.l)*-fz, mz=(keys.f-keys.b)*fz+(keys.r-keys.l)*fx;
    const len=Math.hypot(mx,mz),p=camera.position;
    rider=LIFTS.find(l=>inCab(l,p.x,p.z)&&(l.phase==='moving'||l.phase==='xfer'?rider===l:Math.abs(l.y-base)<.6))||null;
    if(len>0){mx=mx/Math.max(1,len)*sp;mz=mz/Math.max(1,len)*sp;
      /* on the stairs, walking follows the curve of the flight and the view turns with it */
      const st=base<MZ+.1?stairAt(p.x,p.z,-.22):null;
      if(st&&!rider&&st.u<.97){const tx=st.m*Math.sin(st.a),tz=-Math.cos(st.a),d=mx*tx+mz*tz;
        if(Math.abs(d)>sp*.25){const sg=Math.sign(d),r=Math.hypot(st.m*p.x-L,p.z),rc=Math.min(STR.ro-.4,Math.max(STR.ri+.4,r)),[nx,nz]=sP(st.m,rc,st.a-sg*sp/r);mx=nx-p.x;mz=nz-p.z;
          if(keys.f&&!keys.b&&!window.__POTA){const want=Math.atan2(tx*sg,-tz*sg);let dy=want-yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));yaw+=dy*Math.min(1,dt*4);}}}
      let s=surface(p.x+mx,p.z,base);if(s!==null){p.x+=mx;base=s;}s=surface(p.x,p.z+mz,base);if(s!==null){p.z+=mz;base=s;}}
    /* walking out through the front doors leads back onto the campus */
    if(!rider&&base<.3&&p.z>ZF-.8&&Math.abs(p.x)<1.5&&len>0&&mz>0){for(const kk in keys)keys[kk]=0;ctx.exitLibrary();}
    if(rider){base=rider.y;eyeY=base+1.6;}else eyeY+=((base+1.6)-eyeY)*Math.min(1,dt*12);
    p.y=eyeY;camera.rotation.order='YXZ';camera.rotation.set(-pitch,-yaw,0);
    if(where()!==lastWhere)setHint();
  }else if(!tween&&mode==='orbit'){controls.update();if(camera.position.y<.4)camera.position.y=.4;}
  updateLifts(dt);
  const cp=camera.position;ROOM.update(dt,cp.x,cp.z-ROOMZ,mode==='walk');
  ROOM.ceilingGroup.visible=cp.y<Y4+ROOM.H-.05;c419.visible=cp.y<Y4+R4.h-.05;for(const f of fans419)f.rotation.y+=dt*3.2;
  if(Math.abs(nightTarget-night)>.001){night+=(nightTarget-night)*Math.min(1,dt*3);applyNight(night);}
  cutNow=!fullView&&mode!=='walk'&&cp.y>CH+.5&&cp.z>ZB;UP[3].visible=UP[4].visible=TOP.visible=!cutNow;
  ME.onFrame&&ME.onFrame(dt,now,camera);ctx.world.background=scene.background;renderer.render(ctx.world,camera);ME.afterFrame&&ME.afterFrame();}
applyNight(0);

/* ---------- module interface ---------- */
function arrive(fl,idx,pose){const l=LIFTS[idx%LIFTS.length];l.floor=fl;l.y=LBASE[fl];l.cab.position.y=l.y;l.cab.visible=true;l.phase='idle';l.target=null;l.door=0;l.hold=2.8;l.key='';
  base=l.y;eyeY=base+1.6;rider=l;mode='walk';tween=null;fullView=false;controls.enabled=false;
  if(pose){yaw=pose.yaw;pitch=pose.pitch;camera.position.set(pose.x,eyeY,pose.z);}else{yaw=-PI/2;pitch=0;camera.position.set(XW+1.25,eyeY,l.z);}
  camera.rotation.order='YXZ';camera.rotation.set(-pitch,-yaw,0);
  canvas.classList.add('walk');dpad.hidden=false;walkUI();setHint();}
const lights=[];scene.traverse(o=>{if(o.isLight)lights.push(o);});
Object.assign(ME,{api:{camera,controls,scene,roomG,ROOMZ,Y4,FH,viewPose,flyTo,surface,keys,cameraInside,get yaw(){return yaw;},set yaw(v){yaw=v;},get pitch(){return pitch;},set pitch(v){pitch=v;},get base(){return base;},get rider(){return rider;},inLift:()=>mode==='walk'&&LIFTS.some(l=>inCab(l,camera.position.x,camera.position.z)&&(l.phase==='moving'||l.phase==='xfer'?rider===l:Math.abs(l.y-base)<.6)),ext:on=>{if(on){mode="ext";tween=null;rider=null;controls.enabled=false;dpad.hidden=true;canvas.classList.remove("walk");for(const k in keys)keys[k]=0;}},walkNow:(p,yw)=>{tween=null;rider=null;mode="walk";base=Math.round((p.y-1.6)/FH)*FH;eyeY=p.y;controls.enabled=false;yaw=yw;pitch=0;camera.position.copy(p);camera.rotation.order="YXZ";camera.rotation.set(0,-yaw,0);canvas.classList.add("walk");dpad.hidden=false;},setNight:v=>{nightTarget=v;},getMode:()=>mode,walkAt:(p,yw)=>{if(mode==="walk")setMode("orbit");enterWalk(p,yw);},stopWalk:()=>{if(mode==="walk")setMode("orbit");},orbitTo:(p,t,d)=>{if(mode==="walk")setMode("orbit");controls.enabled=true;flyTo(p,t,d==null?1:d);},orbit:(x,y,z)=>{setMode("orbit");controls.enabled=true;controls.target.set(x,y,z);},busy:()=>!!tween},floors:FLOORS,group:scene,lights,
  activate(arr){root.hidden=false;renderer.shadowMap.needsUpdate=true;last=performance.now();
    if(arr&&arr.entrance){mode='walk';base=0;eyeY=1.6;rider=null;tween=null;fullView=false;controls.enabled=false;yaw=0;pitch=0;camera.position.set(0,1.6,11.3);
      camera.rotation.order='YXZ';camera.rotation.set(0,0,0);canvas.classList.add('walk');dpad.hidden=false;walkUI();setHint();}
    else if(arr)arrive(arr.floor,arr.idx,arr.pose);else{controls.enabled=mode==='orbit';if(!started)intro();}started=true;},
  deactivate(){root.hidden=true;controls.enabled=false;for(const k in keys)keys[k]=0;UP[3].visible=UP[4].visible=TOP.visible=true;ROOM.ceilingGroup.visible=true;c419.visible=true;
    for(const l of LIFTS){l.cab.visible=true;if(l.phase!=='idle'){l.phase='idle';l.target=null;l.key='';}}rider=null;},
  hideCab(i,v){LIFTS[i%LIFTS.length].cab.visible=v;},
  otherVisible:()=>!cutNow,
  resize(w,h){camera.aspect=w/h;camera.updateProjectionMatrix();},
  frame});
return ME;
}

function moduleB(ctx,root){"use strict";window.__SEATTAG="B";
const ME={};
const $=s=>root.querySelector(s);
const canvasEl=ctx.canvas;
const canvas={addEventListener:(t,f,o)=>canvasEl.addEventListener(t,e=>{if(ctx.cur===ME)f(e);},o),classList:canvasEl.classList,
  getBoundingClientRect:()=>canvasEl.getBoundingClientRect(),setPointerCapture:i=>{try{canvasEl.setPointerCapture(i);}catch(_){}}};
const addEventListener=(t,f,o)=>window.addEventListener(t,e=>{if(ctx.cur===ME)f(e);},o);
const renderer=ctx.renderer;
const PI=Math.PI;

/* ---------- renderer / scene ---------- */
const scene=new THREE.Group();ctx.world.add(scene);
const camera=new THREE.PerspectiveCamera(45,1,0.1,300);
const controls=new THREE.OrbitControls(camera,canvasEl);
controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=1.5;
controls.minDistance=1.2;controls.maxDistance=110;controls.screenSpacePanning=true;

/* ---------- helpers ---------- */
let seed=20261106;
const R=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const lin=c=>new THREE.Color(c).convertSRGBToLinear();
const mc={};
function mat(c,o){const k=c+'|'+JSON.stringify(o||{});if(mc[k])return mc[k];
  const m=new THREE.MeshStandardMaterial(Object.assign({roughness:.85,metalness:0},o||{}));
  m.color=lin(c);if(o&&o.emissive)m.emissive=lin(o.emissive);return mc[k]=m;}
const gc={};
const box=(w,h,d)=>gc['b'+w+','+h+','+d]||(gc['b'+w+','+h+','+d]=new THREE.BoxGeometry(w,h,d));
const cyl=(a,b,h,s=20)=>gc['c'+a+','+b+','+h+','+s]||(gc['c'+a+','+b+','+h+','+s]=new THREE.CylinderGeometry(a,b,h,s));
const sph=new THREE.SphereGeometry(1,12,9);
function mk(g,m,x=0,y=0,z=0,parent=scene,cast=true){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o;}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.userData={canvas:c,draw};return t;}
const T=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(sx,sy,sz));
const PROPS={};const part=(g,m,t,cast)=>({g,m,t:t||T(),cast});
function defineProp(n,parts){PROPS[n]={parts,list:[]};}
function place(n,x,y,z,ry=0,s=1){if(/^(chair|sofa|arm|cube)/.test(n))(window.__SEATLOG=window.__SEATLOG||[]).push({tag:window.__SEATTAG,n:n,x:x,y:y,z:z,ry:ry});PROPS[n].list.push(T(x,y,z,0,ry,0,s,s,s));}
function buildProps(){const tmp=new THREE.Matrix4();
  for(const k in PROPS){const P=PROPS[k];if(!P.list.length)continue;
    for(const p of P.parts){const im=new THREE.InstancedMesh(p.g,p.m,P.list.length);im.userData.propName=k;
      P.list.forEach((M,i)=>{tmp.multiplyMatrices(M,p.t);im.setMatrixAt(i,tmp);});
      im.castShadow=p.cast!==false;im.receiveShadow=true;im.frustumCulled=false;scene.add(im);}}}
const faceTo=(x,z,tx,tz)=>Math.atan2(tx-x,tz-z);
const cols=[],cols7=[];   // circle colliders [x,z,r] for tầng 6 and tầng 7

/* ---------- stadium geometry ----------
   Every ring in this floor is a stadium (two half-circles joined by straight runs along z).
   All share the same straight half-length L; a ring is set by its radius r.
   q ∈ [0,4): 0–1 far arc (left→right), 1–2 right straight, 2–3 near arc (right→left), 3–4 left straight. */
const L=7.5;
const perim=r=>2*PI*r+4*L;
function stadAt(r,s){const P=perim(r);s=((s%P)+P)%P;const a=PI*r;
  if(s<a){const f=-PI/2+s/r;return {x:r*Math.sin(f),z:-L-r*Math.cos(f),tx:Math.cos(f),tz:Math.sin(f)};}
  s-=a;if(s<2*L)return {x:r,z:-L+s,tx:0,tz:1};
  s-=2*L;if(s<a){const f=PI/2-s/r;return {x:r*Math.sin(f),z:L+r*Math.cos(f),tx:-Math.cos(f),tz:Math.sin(f)};}
  s-=a;return {x:-r,z:L-s,tx:0,tz:-1};}
function sOf(r,q){const seg=[PI*r,2*L,PI*r,2*L];const k=Math.floor(q),f=q-k,lap=Math.floor(k/4),m=((k%4)+4)%4;
  let s=lap*perim(r);for(let i=0;i<m;i++)s+=seg[i];return s+f*seg[m];}
const atQ=(r,q)=>stadAt(r,sOf(r,q));
const ryOf=p=>Math.atan2(-p.tz,p.tx);            // local x along the ring, local +z facing the middle
const inside=(x,z,r)=>{const dz=Math.max(0,Math.abs(z)-L);return x*x+dz*dz<r*r;};
/* vertical band following a stadium ring */
function ribbon(r,y0,y1,m,o={}){const s0=o.s0||0,s1=o.s1!==undefined?o.s1:perim(r);const n=Math.max(2,Math.ceil((s1-s0)/(o.step||.3)));
  const pos=[],uv=[],idx=[];
  for(let i=0;i<=n;i++){const s=s0+(s1-s0)*i/n,p=stadAt(r,s);pos.push(p.x,y0,p.z,p.x,y1,p.z);const u=(s-s0)/(o.uLen||1);uv.push(u,0,u,1);}
  for(let i=0;i<n;i++){const a=2*i,b=2*i+2,c=2*i+1,d=2*i+3;if(o.outward)idx.push(a,c,b,c,d,b);else idx.push(a,b,c,c,b,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;mesh.castShadow=!!o.cast;(o.parent||scene).add(mesh);return mesh;}
function stadPts(r,down){const P=perim(r),n=Math.ceil(P/.3),out=[];for(let i=0;i<n;i++){const p=stadAt(r,P*i/n);out.push(new THREE.Vector2(p.x,down?p.z:-p.z));}return out;}
/* flat stadium (optionally with a stadium hole), facing up or down */
function flat(rOut,rIn,y,m,down,parent=scene){const sh=new THREE.Shape(stadPts(rOut,down));if(rIn)sh.holes.push(new THREE.Path(stadPts(rIn,down)));
  const mesh=new THREE.Mesh(new THREE.ShapeGeometry(sh),m);mesh.rotation.x=down?PI/2:-PI/2;mesh.position.y=y;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
/* a curved run of boxes around a circle centre (x = cx + r·sin th, z = cz + r·cos th) */
function arcRun(cx,cz,r,th0,th1,segs,depth,h,y,m,opt={}){const L2=r*Math.abs(th1-th0)/segs*1.06;
  for(let i=0;i<segs;i++){const th=th0+(i+.5)*(th1-th0)/segs;const x=cx+r*Math.sin(th),z=cz+r*Math.cos(th);
    const o=mk(box(L2,h,depth),m,x,y,z,scene,opt.cast!==false);o.rotation.y=th;if(opt.col)cols.push([x,z,Math.max(depth,L2)/2+.05]);}}

/* ---------- dimensions ---------- */
const PR=9.5, PY=.6;                 // raised stadium platform
const FR=11, WR=16.5, PIL=11.75;     // balcony void edge, outer walls, pillar ring
const SL=4.1, MZ=5.25, CH=9.8, CR=9; // slab underside, upper floor, ceiling, ceiling cove
const STEP=3.4;                      // half width of the two stair openings

/* ---------- textures ---------- */
function tiles(h,s,l,line,n=2){return canvasTex(512,512,(g,w)=>{const z=w/n;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){g.fillStyle=`hsl(${h},${s}%,${l-R()*2.5}%)`;g.fillRect(i*z,j*z,z,z);
    for(let k=0;k<50;k++){g.fillStyle=`rgba(255,255,255,${R()*.08})`;g.fillRect(i*z+R()*z,j*z+R()*z,3,3);}}
  g.strokeStyle=line;g.lineWidth=3;for(let i=0;i<=n;i++){g.beginPath();g.moveTo(i*z,0);g.lineTo(i*z,w);g.stroke();g.beginPath();g.moveTo(0,i*z);g.lineTo(w,i*z);g.stroke();}});}
const platTex=tiles(220,6,77,'rgba(140,146,158,.55)');   // sàn bục xám nhạt như ảnh
const corTex=tiles(38,28,88,'rgba(190,175,150,.5)');      // hành lang gạch kem
const mezTex=tiles(36,20,89,'rgba(190,178,160,.45)');
for(const t of [platTex,corTex,mezTex]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1/1.2,1/1.2);}
const rugTex=canvasTex(256,256,(g,w)=>{g.fillStyle='#262e4c';g.fillRect(0,0,w,w);
  for(let i=0;i<2600;i++){g.fillStyle=R()<.5?'rgba(120,135,190,.22)':'rgba(10,14,30,.35)';g.fillRect(R()*w,R()*w,2,1+R()*2);}});
rugTex.wrapS=rugTex.wrapT=THREE.RepeatWrapping;rugTex.repeat.set(6,6);

const fasciaPh=['INNOVATE','CONNECT','COLLABORATE','CREATE'];
function drawFascia(g,w,h,glow){g.fillStyle=glow?'#000000':'#8c919b';g.fillRect(0,0,w,h);
  if(!glow){const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#a3a8b1');gr.addColorStop(1,'#80858f');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(255,255,255,.1)';for(let x=0;x<w;x+=420)g.fillRect(x,0,2,h);}
  g.fillStyle='#ffffff';g.fillRect(0,h*.86,w,4);g.fillRect(0,h-5,w,5);
  g.font='600 54px "Be Vietnam Pro", system-ui, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#ffffff';
  fasciaPh.forEach((t,i)=>g.fillText(t+' ›››',w*(i+.5)/4,h*.44));}
const fasciaTex=canvasTex(4096,128,(g,w,h)=>drawFascia(g,w,h,false));
const fasciaGlow=canvasTex(4096,128,(g,w,h)=>drawFascia(g,w,h,true));
for(const t of [fasciaTex,fasciaGlow])t.wrapS=THREE.RepeatWrapping;

function textPlate(text,sub,bg,fg,w=1024,h=256,size=86){return canvasTex(w,h,(g)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';
  g.font=`700 ${size}px "Be Vietnam Pro", system-ui, sans-serif`;if(sub){g.fillText(text,w/2,h*.36);g.font=`500 ${size*.55}px "Be Vietnam Pro", system-ui, sans-serif`;g.fillText(sub,w/2,h*.74);}else g.fillText(text,w/2,h/2);});}
const libSignTex=canvasTex(1024,200,(g,w,h)=>{g.fillStyle='#f4f1ec';g.fillRect(0,0,w,h);
  g.strokeStyle='#b5672f';g.lineWidth=8;g.lineJoin='round';
  g.beginPath();g.moveTo(40,60);g.quadraticCurveTo(90,42,135,66);g.quadraticCurveTo(180,42,230,60);g.lineTo(230,150);g.quadraticCurveTo(180,132,135,156);g.quadraticCurveTo(90,132,40,150);g.closePath();g.stroke();
  g.beginPath();g.moveTo(135,66);g.lineTo(135,156);g.stroke();
  g.fillStyle='#b5672f';g.textBaseline='middle';g.font='700 60px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Thư viện Tạ Quang Bửu',262,104);});
const floorSignTex=textPlate('Phòng học tầng 6',null,'#2347b0','#ffffff',1024,220,92);
const liftSignTex=textPlate('THANG MÁY','Tầng 6 ⇄ Tầng 7','#2b3350','#ffffff',1024,256,80);
const allText=[fasciaTex,fasciaGlow,libSignTex,floorSignTex,liftSignTex];
function redrawText(){for(const t of allText){const c=t.userData.canvas;t.userData.draw(c.getContext('2d'),c.width,c.height);t.needsUpdate=true;}}
if(document.fonts&&document.fonts.load){Promise.all(['600 54px','700 60px','700 92px','700 80px'].map(f=>document.fonts.load(f+' "Be Vietnam Pro"'))).then(redrawText).catch(()=>{});}

const chartTex=canvasTex(320,200,(g,w,h)=>{g.fillStyle='#1d2a5c';g.fillRect(0,0,w,h);g.strokeStyle='#5f7fe0';g.lineWidth=4;g.strokeRect(6,6,w-12,h-12);
  const hs=[60,90,75,120,140,105];hs.forEach((v,i)=>{g.fillStyle=i%2?'#7fb6ff':'#c7dbff';g.fillRect(34+i*44,h-28-v,28,v);});});
const kioskTex=canvasTex(160,320,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#3d7fe6');gr.addColorStop(1,'#78b8ff');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='#ffffff';g.fillRect(16,18,w-32,26);g.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<9;i++)g.fillRect(16,64+i*26,(w-32)*(.5+R()*.5),9);});
const doorSteelTex=canvasTex(256,384,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#b8bdc6');gr.addColorStop(.5,'#dfe2e7');gr.addColorStop(1,'#b3b8c1');
  g.fillStyle=gr;g.fillRect(0,0,w,h);for(let i=0;i<220;i++){g.fillStyle=`rgba(255,255,255,${R()*.15})`;g.fillRect(R()*w,0,1,h);}
  g.fillStyle='#7c818b';g.fillRect(w/2-2,0,4,h);});
const liftDispTex=canvasTex(160,56,(g,w,h)=>{g.fillStyle='#14161c';g.fillRect(0,0,w,h);g.fillStyle='#ff5a3c';g.font='700 40px system-ui, sans-serif';g.textBaseline='middle';
  g.textAlign='center';g.fillText('▲ 6',w/2,h/2+2);});
const glassRoomTex=canvasTex(512,256,(g,w,h)=>{g.fillStyle='#e6ecef';g.fillRect(0,0,w,h);
  const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(190,210,222,.9)');gr.addColorStop(1,'rgba(225,234,238,.9)');g.fillStyle=gr;g.fillRect(0,18,w,h-18);
  g.fillStyle='rgba(120,130,150,.35)';for(let i=0;i<4;i++){g.fillRect(30+i*120,h*.62,80,10);g.fillRect(44+i*120,h*.66,8,h*.2);g.fillRect(96+i*120,h*.66,8,h*.2);}
  g.fillStyle='#5e646f';g.fillRect(0,0,w,18);g.fillRect(0,h-8,w,8);for(let x=0;x<=w;x+=128)g.fillRect(x-3,0,6,h);
  g.fillStyle='rgba(255,255,255,.65)';g.fillRect(20,h*.36,w-40,12);
  g.fillStyle='#ffffff';for(let i=0;i<4;i++){g.beginPath();g.arc(64+i*128,h*.42,14,0,7);g.fill();}
  g.fillStyle='#444a55';g.fillRect(250,h*.5,6,30);});
glassRoomTex.wrapS=THREE.RepeatWrapping;
const officeTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#f3f1ec';g.fillRect(0,0,w,h);
  const gy=h*.33;const gr=g.createLinearGradient(0,gy,0,h);gr.addColorStop(0,'#c9d7e0');gr.addColorStop(1,'#e8eef1');g.fillStyle=gr;g.fillRect(0,gy,w,h-gy);
  g.fillStyle='rgba(120,130,150,.3)';for(let i=0;i<3;i++)g.fillRect(40+i*160,h*.72,100,12);
  g.fillStyle='#59606b';g.fillRect(0,gy-8,w,10);g.fillRect(0,h-6,w,6);for(let x=0;x<=w;x+=128)g.fillRect(x-3,gy,6,h-gy);
  g.fillStyle='#ffffff';g.fillRect(0,0,w,10);g.fillStyle='rgba(255,250,235,.9)';for(let x=40;x<w;x+=110){g.beginPath();g.arc(x,40,8,0,7);g.fill();}});
officeTex.wrapS=THREE.RepeatWrapping;
const glassDoorTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#cfdde6';g.fillRect(0,0,w,h);g.fillStyle='#4a505b';g.fillRect(0,0,w,10);g.fillRect(0,0,8,h);g.fillRect(w-8,0,8,h);g.fillRect(w/2-4,0,8,h);
  g.fillStyle='#8a929e';g.fillRect(w/2-20,h*.45,6,50);g.fillRect(w/2+14,h*.45,6,50);g.fillStyle='rgba(255,255,255,.5)';g.fillRect(24,30,40,140);});
const stairDoorTex=canvasTex(128,256,(g,w,h)=>{g.fillStyle='#8d939e';g.fillRect(0,0,w,h);g.fillStyle='#a7adb7';g.fillRect(8,8,w-16,h-8);g.fillStyle='#5b616c';g.fillRect(w-30,h*.5,16,6);
  g.fillStyle='#d8dde4';g.fillRect(30,40,w-60,50);});
function posterTex(hue){return canvasTex(256,340,(g,w,h)=>{g.fillStyle='#ffffff';g.fillRect(0,0,w,h);g.strokeStyle='#c9cfe0';g.lineWidth=8;g.strokeRect(4,4,w-8,h-8);
  g.fillStyle=`hsl(${hue},65%,55%)`;g.fillRect(20,20,w-40,40);const cl=['#e85a4f','#f2b33d','#4f9de8','#5cbf63','#9b6fe0'];
  for(let i=0;i<6;i++){g.fillStyle=cl[i%5];g.fillRect(22,78+i*40,18,18);g.fillStyle='#c6ccda';g.fillRect(52,80+i*40,w-80-(i%3)*20,8);}});}
const keysTex=canvasTex(1024,64,(g,w,h)=>{g.fillStyle='#fbfbf8';g.fillRect(0,0,w,h);const n=52,kw=w/n;g.fillStyle='#b9bcc2';for(let i=0;i<=n;i++)g.fillRect(i*kw,0,1.5,h);
  const pat=[1,1,0,1,1,1,0];g.fillStyle='#111216';for(let i=0;i<n-1;i++){if(pat[(i+5)%7])g.fillRect((i+1)*kw-kw*.3,0,kw*.6,h*.62);}});
const curbTex=canvasTex(256,64,(g,w,h)=>{g.fillStyle='#d9dbe0';g.fillRect(0,0,w,h);g.fillStyle='#c7c9cf';g.fillRect(0,h-8,w,8);g.fillStyle='#fff6dc';g.fillRect(w/2-8,h*.45-8,16,16);});
curbTex.wrapS=THREE.RepeatWrapping;

/* ---------- materials ---------- */
const M={
  white:mat('#f5f5f3',{roughness:.45}), wall:mat('#f2efe9'), pillar:mat('#f7f7f5',{roughness:.4}),
  metal:mat('#2a2d33',{roughness:.4,metalness:.4}), steel:mat('#c9ccd2',{roughness:.25,metalness:.6}),
  railPost:mat('#e4e6ea',{roughness:.35,metalness:.3}), railTop:mat('#b9bdc5',{roughness:.2,metalness:.7}),
  glassRail:new THREE.MeshStandardMaterial({color:lin('#e9eef2'),transparent:true,opacity:.35,roughness:.08,side:THREE.DoubleSide,depthWrite:false}),
  wood:mat('#e4bb84',{roughness:.6}), woodDark:mat('#c99a5f',{roughness:.6}),
  navy:mat('#2b3658',{roughness:.7}), cushion:mat('#3e5679',{roughness:.75}),
  mustard:mat('#e2a032',{roughness:.7}), mustardDark:mat('#c4841f',{roughness:.7}),
  poleGlow:mat('#5aa2ff',{emissive:'#3e8cff',emissiveIntensity:1.2}),
  panel:mat('#ffffff',{emissive:'#fffbf0',emissiveIntensity:.85}), led:mat('#ffffff',{emissive:'#f4f7ff',emissiveIntensity:1.2}),
  exit:mat('#2e9c55',{emissive:'#2fbf62',emissiveIntensity:.6}), soil:mat('#6b4a33'), black:mat('#111216',{roughness:.15,metalness:.2}),
};

/* ---------- floors ---------- */
flat(WR+.1,0,0,new THREE.MeshStandardMaterial({map:corTex,roughness:.5}));
flat(PR,0,PY,new THREE.MeshStandardMaterial({map:platTex,roughness:.45}));
curbTex.repeat.set(1,1);
ribbon(PR,0,PY,new THREE.MeshStandardMaterial({map:curbTex,roughness:.5}),{outward:true,uLen:2.2});
/* stairs at both ends of the platform */
for(const sg of [1,-1]){const e=L+PR;
  [[.45,-.7,.6],[.3,.6,1.2],[.15,1.2,1.8]].forEach(([h,a,b],i)=>mk(box(STEP*2,h,b-a),mat(i%2?'#cdd0d6':'#d6d8dd'),0,h/2,sg*(e+(a+b)/2)));}

/* light-grey disc and white rings around the central desk, like the photo */
const DESK={x:0,z:-11.2};
mk(cyl(4.6,4.6,.012,72),mat('#dcdde1'),DESK.x,PY+.006,DESK.z,scene,false);
for(const [r0,r1,half] of [[5.1,5.24,1.9],[6.7,6.84,1.25]]){const ring=new THREE.Mesh(new THREE.RingGeometry(r0,r1,96,1,3*PI/2-half,half*2),mat('#ffffff'));
  ring.rotation.x=-PI/2;ring.position.set(DESK.x,PY+.008,DESK.z);ring.receiveShadow=true;scene.add(ring);}
mk(cyl(1.5,1.5,.012,48),mat('#dcdde1'),0,PY+.006,-5.7,scene,false);

/* ---------- railing around the platform (white-grey) ---------- */
const gQ=Math.asin(STEP/PR)/PI;
defineProp('post',[part(box(.07,1.02,.07),M.railPost,T(0,.51,0))]);
for(const [q0,q1] of [[.5+gQ,2.5-gQ],[2.5+gQ,4.5-gQ]]){
  const rr=PR-.1,s0=sOf(rr,q0),s1=sOf(rr,q1),n=Math.ceil((s1-s0)/1.25);
  for(let i=0;i<=n;i++){const p=stadAt(rr,s0+(s1-s0)*i/n);place('post',p.x,PY,p.z,ryOf(p));}
  ribbon(rr,PY+.12,PY+.92,M.glassRail,{s0,s1});
  const pts=[];for(let i=0;i<=Math.ceil((s1-s0)/.4);i++){const p=stadAt(rr,s0+(s1-s0)*i/Math.ceil((s1-s0)/.4));pts.push(new THREE.Vector3(p.x,PY+1.04,p.z));}
  const tube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),pts.length*2,.035,8,false),M.railTop);tube.castShadow=true;scene.add(tube);
  const pts2=pts.map(v=>v.clone().setY(PY+.1));const t2=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2),pts2.length*2,.02,6,false),M.railPost);scene.add(t2);}

/* ---------- outer walls (closed floor) ---------- */
const liftZ=[-2.9,0,2.9], OW=.7, DH=2.45;
/* walls on the right straight leave a doorway for each lift */
function gappedWall(r,y0,y1,m,o={}){const g=liftZ.map(z=>[sOf(r,1)+(z-OW+L),sOf(r,1)+(z+OW+L)]);let s=0;
  for(const [a,b] of g){ribbon(r,y0,y1,m,Object.assign({},o,{s0:s,s1:a}));s=b;}ribbon(r,y0,y1,m,Object.assign({},o,{s0:s,s1:perim(r)}));
  if(o.lintel)for(const [a,b] of g)ribbon(r,y0+DH,y1,m,Object.assign({},o,{s0:a,s1:b}));}
gappedWall(WR,0,SL,M.wall,{lintel:true});
gappedWall(WR-.02,0,.14,mat('#cfc8bd'));
function onWall(q,w,h,y,m,inset=.04,r=WR){const fq=((q%4)+4)%4;if(fq<1||(fq>=2&&fq<3))inset=Math.max(inset,r-Math.sqrt(r*r-w*w/4)+.04);const p=atQ(r-inset,q);const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(p.x,y,p.z);o.rotation.y=ryOf(p);scene.add(o);return o;}
function boxOnWall(q,w,h,d,y,m,r=WR){const p=atQ(r-d/2,q);const o=mk(box(w,h,d),m,p.x,y,p.z);o.rotation.y=ryOf(p);return o;}

/* elevators are built after the balcony (they serve tầng 6 and tầng 7) */
onWall(1.5,4.4,1.0,3.55,new THREE.MeshBasicMaterial({map:liftSignTex}));
onWall(1+(7.0+L)/(2*L)-.02,1.05,1.4,1.6,new THREE.MeshStandardMaterial({map:posterTex(4)}));

/* left straight wall: bookshelves, stair door, extinguisher */

const bookCols=['#e2463f','#2f6fd6','#3cae55','#f2b632','#f07c2e','#f4f4f6','#36a7c9','#8b5bd6','#1f4aa8'].map(lin);const books=[];
function wallShelf(z0,z1){const x=-WR+.25,len=z1-z0,cz=(z0+z1)/2;
  mk(box(.42,2.1,len),mat('#e9e6df'),x,1.05,cz);
  for(const y of [.1,.52,.94,1.36,1.78]){mk(box(.4,.03,len-.04),mat('#d8d3c8'),x+.02,y,cz,scene,false);
    let z=z0+.05;while(z<z1-.05){const w=.03+R()*.03,h=.24+R()*.12;if(R()<.05){z+=.08;continue;}if(z+w>z1-.05)break;
      books.push({m:T(x+.06,y+.015+h/2,z+w/2,0,0,0,.24,h,w),c:bookCols[R()*bookCols.length|0]});z+=w+.003;}}
  for(let z=z0;z<z1-.4;z+=1.2)cols.push([x+.2,z+.6,.55]);}
wallShelf(-7,-3.6);wallShelf(-3.2,.2);
{const q=3+(L-4.2)/(2*L);onWall(q,1.2,2.3,1.15,new THREE.MeshStandardMaterial({map:stairDoorTex,roughness:.4}),.03);
  boxOnWall(q,.5,.17,.06,2.55,M.exit);
  boxOnWall(3+(L-5.6)/(2*L),.38,.55,.18,1.1,mat('#d63a33'));}

/* far end: library entrance with glass doors and sign; glass rooms either side */
onWall(.5,3.4,2.75,1.375,new THREE.MeshStandardMaterial({map:glassDoorTex,roughness:.2}),.03);
onWall(.5,4.6,.9,3.45,new THREE.MeshStandardMaterial({map:libSignTex,roughness:.6}),.03);
glassRoomTex.repeat.set(1,1);
const grMat=new THREE.MeshStandardMaterial({map:glassRoomTex,roughness:.25});
ribbon(WR-.03,0,3.1,grMat,{s0:sOf(WR,.07),s1:sOf(WR,.38),uLen:4});
ribbon(WR-.03,0,3.1,grMat,{s0:sOf(WR,.62),s1:sOf(WR,.93),uLen:4});
ribbon(WR-.03,0,3.1,grMat,{s0:sOf(WR,2.08),s1:sOf(WR,2.92),uLen:4});
onWall(3.62,1.0,1.35,1.6,new THREE.MeshStandardMaterial({map:posterTex(1)}));

/* ---------- balcony of the upper floor: full stadium loop ---------- */
flat(WR+.1,FR,MZ,new THREE.MeshStandardMaterial({map:mezTex,roughness:.5}));
flat(WR+.1,FR,SL,mat('#f1f0ee'),true);
const fasciaMat=new THREE.MeshStandardMaterial({map:fasciaTex,emissiveMap:fasciaGlow,emissive:lin('#ffffff'),emissiveIntensity:.9,roughness:.5});
const fP=perim(FR);fasciaTex.repeat.x=1;
ribbon(FR,SL,MZ+.05,fasciaMat,{uLen:fP/3,step:.25});
ribbon(FR+.02,SL,MZ+.05,mat('#8c919b'),{outward:true,cast:true});
/* balcony glass railing with steel top rail */
ribbon(FR+.1,MZ,MZ+1.0,M.glassRail);
{const pts=[];const n=Math.ceil(perim(FR+.1)/.4);for(let i=0;i<=n;i++){const p=stadAt(FR+.1,perim(FR+.1)*i/n);pts.push(new THREE.Vector3(p.x,MZ+1.03,p.z));}
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),n*2,.04,8,true),M.railTop));
  const n2=Math.ceil(perim(FR+.1)/1.6);for(let i=0;i<n2;i++){const p=stadAt(FR+.1,perim(FR+.1)*i/n2);place('post',p.x,MZ,p.z,ryOf(p));}}
/* upper walls: glass offices, lifts, library name */
gappedWall(WR,MZ,CH,new THREE.MeshStandardMaterial({map:officeTex,roughness:.4}),{uLen:5,lintel:true});
onWall(.5,6.4,1.25,CH-.8,new THREE.MeshStandardMaterial({map:libSignTex,roughness:.6}),.05);
onWall(2.5,6.4,1.25,CH-.8,new THREE.MeshStandardMaterial({map:libSignTex,roughness:.6}),.05);

/* pillars between the platform and the walls, floor to ceiling */
{const spots=[];for(const f of [-.95,-.31,.31,.95]){spots.push([PIL*Math.sin(f),-L-PIL*Math.cos(f)],[PIL*Math.sin(f),L+PIL*Math.cos(f)]);}
  for(const z of [-5.6,5.6])spots.push([PIL,z],[-PIL,z]);
  for(const [x,z] of spots){const p={x,z};
  mk(cyl(.52,.52,CH,32),M.pillar,p.x,CH/2,p.z);mk(cyl(.6,.6,.12,32),mat('#dcdcd8'),p.x,.06,p.z);cols.push([p.x,p.z,.6]);cols7.push([p.x,p.z,.6]);}}

/* downlights under the balcony and in the top ceiling */
defineProp('down',[part(cyl(.11,.11,.02,14),M.panel,T(),false)]);
for(const r of [13.2,15.3]){const P=perim(r),n=Math.round(P/2.3);for(let i=0;i<n;i++){const p=stadAt(r,P*i/n);place('down',p.x,SL-.015,p.z);}}


/* ---------- elevators: three cars running between tầng 6 (y 0) and tầng 7 (y MZ) ---------- */
const ROOF=CH+1.0,cols10=[];const LBASE={1:-19.4,2:-14.9,3:-10.4,4:-5.9,6:0,7:MZ,10:ROOF},OWN=[6,7,10];
const cabTex=canvasTex(256,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#aeb3bc');gr.addColorStop(.5,'#dadde2');gr.addColorStop(1,'#aab0b9');
  g.fillStyle=gr;g.fillRect(0,0,w,h);for(let i=0;i<260;i++){g.fillStyle=`rgba(255,255,255,${R()*.14})`;g.fillRect(R()*w,0,1,h);}
  g.fillStyle='rgba(90,96,108,.6)';g.fillRect(w/3-1,0,2,h);g.fillRect(2*w/3-1,0,2,h);});
const leafTex=canvasTex(128,384,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#b8bdc6');gr.addColorStop(.5,'#e0e3e8');gr.addColorStop(1,'#b3b8c1');
  g.fillStyle=gr;g.fillRect(0,0,w,h);for(let i=0;i<120;i++){g.fillStyle=`rgba(255,255,255,${R()*.15})`;g.fillRect(R()*w,0,1,h);}});
const doorMat=new THREE.MeshStandardMaterial({map:leafTex,roughness:.25,metalness:.55});
const frameMat=mat('#8b9099',{roughness:.3,metalness:.6});
const cabWall=new THREE.MeshStandardMaterial({map:cabTex,roughness:.3,metalness:.45});
const shaftMat=mat('#6f747d',{roughness:.6,side:THREE.DoubleSide});
const btnMat=mat('#ffffff',{emissive:'#ffd27a',emissiveIntensity:.6});
function dispDraw(l){const c=l.dc,g=c.getContext('2d');g.fillStyle='#14161c';g.fillRect(0,0,c.width,c.height);
  g.fillStyle='#ff5a3c';g.font='700 40px system-ui, sans-serif';g.textAlign='center';g.textBaseline='middle';
  const mv=l.phase==='moving'||l.phase==='xfer',ar=mv?(l.target>l.floor?'▲ ':'▼ '):'';g.fillText(ar+(mv?l.target:l.floor),c.width/2,c.height/2+2);l.dt.needsUpdate=true;}
const CX0=WR+.08, CX1=WR+2.15, CW=.98, CHT=2.6;
const LIFTS=liftZ.map((z,i)=>{
  const l={i,z,floor:i===1?7:6,y:i===1?MZ:0,phase:'idle',door:0,hold:0,target:null,doors:{},t:0,key:''};
  l.dc=document.createElement('canvas');l.dc.width=160;l.dc.height=56;l.dt=new THREE.CanvasTexture(l.dc);l.dt.encoding=THREE.sRGBEncoding;
  const dmat=new THREE.MeshBasicMaterial({map:l.dt});
  for(const fl of OWN){const b=LBASE[fl];
    mk(box(.12,2.6,.18),frameMat,WR-.06,b+1.3,z-OW-.09);mk(box(.12,2.6,.18),frameMat,WR-.06,b+1.3,z+OW+.09);mk(box(.12,.42,2*OW+.36),frameMat,WR-.06,b+2.72,z);
    const d=new THREE.Mesh(new THREE.PlaneGeometry(.5,.18),dmat);d.position.set(WR-.125,b+2.72,z);d.rotation.y=-PI/2;scene.add(d);
    const pan=mk(box(.04,.3,.14),M.steel,WR-.02,b+1.15,z+OW+.5);
    for(const dy of [.06,-.06]){const bt=mk(cyl(.025,.025,.02,12),btnMat,-.03,dy,0,pan,false);bt.rotation.z=PI/2;}
    l.doors[fl]={L:mk(box(.04,DH-.02,OW),doorMat,WR+.07,b+DH/2,z-OW/2,scene,false),R:mk(box(.04,DH-.02,OW),doorMat,WR+.07,b+DH/2,z+OW/2,scene,false)};
    (fl===6?cols:fl===7?cols7:cols10).push([WR-.05,z+OW+.5,.22]);}
  /* shaft face seen from inside the car, with holes at each landing door */
  const sp=(w,h,y,zz)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),shaftMat);p.position.set(WR+.03,y,zz);p.rotation.y=PI/2;scene.add(p);};
  sp(.28,ROOF+3.2,(ROOF+3.2)/2,z-OW-.14);sp(.28,ROOF+3.2,(ROOF+3.2)/2,z+OW+.14);sp(2*OW,MZ-DH,(DH+MZ)/2,z);sp(2*OW,ROOF-MZ-DH,(MZ+DH+ROOF)/2,z);sp(2*OW,3.2-DH,ROOF+DH+(3.2-DH)/2,z);
  /* the car itself */
  const cab=new THREE.Group();cab.position.y=l.y;scene.add(cab);l.cab=cab;
  const pl=(w,h,m,x,y,zz,rx,ry)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);p.position.set(x,y,zz);p.rotation.set(rx,ry,0);p.receiveShadow=true;cab.add(p);return p;};
  pl(2*CW,CHT,cabWall,CX1,CHT/2,z,0,-PI/2);
  pl(CX1-CX0,CHT,cabWall,(CX0+CX1)/2,CHT/2,z-CW,0,0);
  pl(CX1-CX0,CHT,cabWall,(CX0+CX1)/2,CHT/2,z+CW,0,PI);
  pl(CX1-CX0,2*CW,mat('#3a3d45',{roughness:.35}),(CX0+CX1)/2,.01,z,-PI/2,0);
  pl(CX1-CX0,2*CW,mat('#e9eaee'),(CX0+CX1)/2,CHT,z,PI/2,0);
  pl(1.1,1.0,M.panel,(CX0+CX1)/2,CHT-.01,z,PI/2,0);
  /* cửa cabin đi theo cabin: hai tấm cố định hai bên + ô trên cửa + hai cánh thu vào mép khi mở (đồng bộ cửa tầng) — khi cabin chạy, mặt trước kín hoàn toàn, không còn khe nhìn ra ngoài */{const fm=doorMat;for(const sg of [-1,1])mk(box(.03,CHT,CW-OW+.02),fm,CX0+.012,CHT/2,z+sg*(OW+(CW-OW)/2),cab,false);mk(box(.03,CHT-DH+.02,2*CW),fm,CX0+.012,DH+(CHT-DH)/2,z,cab,false);const gL=new THREE.BoxGeometry(.03,DH,OW);gL.translate(0,0,OW/2);const gR=new THREE.BoxGeometry(.03,DH,OW);gR.translate(0,0,-OW/2);l.cd={L:mk(gL,fm,CX0+.04,DH/2,z-OW,cab,false),R:mk(gR,fm,CX0+.04,DH/2,z+OW,cab,false)};}mk(box(.05,.05,1.7),M.steel,CX1-.08,.95,z,cab,false);
  mk(box(1.6,.05,.05),M.steel,(CX0+CX1)/2+.1,.95,z-CW+.07,cab,false);
  const ip=mk(box(.26,.55,.03),mat('#2a2d33',{roughness:.3}),CX0+.32,1.25,z+CW-.02,cab,false);
  for(const [dy,c] of [[.12,'#7fb6ff'],[-.02,'#7fb6ff'],[-.16,'#ffd27a']]){const bt=mk(cyl(.035,.035,.02,14),mat('#ffffff',{emissive:c,emissiveIntensity:.8}),0,dy,-.02,ip,false);bt.rotation.x=PI/2;}
  const mir=pl(1.3,1.2,mat('#e3e8ee',{roughness:.15,metalness:.25}),CX1-.01,1.55,z,0,-PI/2);
  dispDraw(l);return l;});


/* ---------- tầng 10: the rooftop, left empty for now (its own content comes later) ---------- */
const roofG=new THREE.Group();scene.add(roofG);let forceRoof=false;
{const deck=mat('#cfcbc3',{roughness:.85}),para=mat('#ebe6dd',{roughness:.7,side:THREE.DoubleSide}),hw=mat('#e6e0d6',{roughness:.7,side:THREE.DoubleSide});
  flat(WR+.1,0,ROOF,deck,false,roofG);
  flat(WR+.1,0,ROOF-.02,mat('#d8d4cc',{side:THREE.DoubleSide}),true,roofG);
  /* low parapet all round, open where the lift lobby stands */
  const s0=sOf(WR,1)+(-4.6+L),s1=sOf(WR,1)+(4.6+L);
  ribbon(WR,ROOF,ROOF+1.1,para,{s0:s1,s1:s0+perim(WR),parent:roofG});
  ribbon(WR-.25,ROOF,ROOF+1.1,para,{s0:s1,s1:s0+perim(WR-.25),parent:roofG});
  /* small lift lobby on the roof: a wall with the three lift doors and a flat cover */
  let s=s0;for(const z of liftZ){const a=sOf(WR,1)+(z-OW+L),b=sOf(WR,1)+(z+OW+L);
    ribbon(WR,ROOF,ROOF+3.2,hw,{s0:s,s1:a,parent:roofG});ribbon(WR,ROOF+DH,ROOF+3.2,hw,{s0:a,s1:b,parent:roofG});s=b;}
  ribbon(WR,ROOF,ROOF+3.2,hw,{s0:s,s1,parent:roofG});
  mk(box(4.2,.22,9.6),hw,WR+.6,ROOF+3.3,0,roofG);
  for(const sz of [-1,1])mk(box(2.7,3.2,.2),hw,WR+1.15,ROOF+1.6,sz*4.7,roofG);
  mk(box(.2,ROOF+3.4,9.6),mat('#e6e0d6'),WR+2.55,(ROOF+3.4)/2,0);
  /* painted note on the deck */
  const note=canvasTex(1024,512,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=10;g.setLineDash([36,22]);g.strokeRect(20,20,w-40,h-40);
    g.setLineDash([]);g.fillStyle='#ffffff';g.textAlign='center';g.textBaseline='middle';g.font='800 120px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('TẦNG 10',w/2,h*.38);
    g.font='600 52px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Sân thượng · đang chờ bổ sung',w/2,h*.66);});
  if(document.fonts&&document.fonts.load)document.fonts.load('800 120px "Be Vietnam Pro"').then(()=>{const u=note.userData;u.draw(u.canvas.getContext('2d'),u.canvas.width,u.canvas.height);note.needsUpdate=true;}).catch(()=>{});
  const np=new THREE.Mesh(new THREE.PlaneGeometry(16,8),new THREE.MeshBasicMaterial({map:note,transparent:true,opacity:.92}));np.rotation.x=-PI/2;np.rotation.z=PI/2;np.position.set(-2,ROOF+.02,0);roofG.add(np);}

/* ---------- top ceiling (hidden when you look from above) ---------- */
const ceilingGroup=new THREE.Group();scene.add(ceilingGroup);
flat(WR+.1,CR,CH,mat('#f4f4f3'),true,ceilingGroup);
ribbon(CR,CH,CH+.7,mat('#2b2f38',{side:THREE.DoubleSide}),{parent:ceilingGroup});
ribbon(CR-.03,CH+.02,CH+.09,M.led,{parent:ceilingGroup});
flat(CR+.05,0,CH+.7,mat('#f2f2f4'),true,ceilingGroup);
for(const r of [11.6,14.6]){const P=perim(r),n=Math.round(P/2.6);for(let i=0;i<n;i++){const p=stadAt(r,P*i/n);mk(cyl(.12,.12,.02,14),M.panel,p.x,CH-.012,p.z,ceilingGroup,false);}}
for(const r of [3.5,6.5]){const P=perim(r),n=Math.round(P/2.4);for(let i=0;i<n;i++){const p=stadAt(r,P*i/n);mk(cyl(.14,.14,.02,14),M.panel,p.x,CH+.69,p.z,ceilingGroup,false);}}

/* ---------- furniture props ---------- */
function chairProp(n,c){defineProp(n,[part(box(.46,.05,.44),mat(c,{roughness:.6}),T(0,.46,0)),part(box(.48,.42,.05),mat(c,{roughness:.6}),T(0,.73,-.21,-.16)),
  ...[[-.19,-.18],[.19,-.18],[-.19,.18],[.19,.18]].map(([x,z])=>part(cyl(.016,.016,.45,6),M.metal,T(x,.225,z)))]);}
chairProp('chairL','#9cb0c6');chairProp('chairN','#2c3759');chairProp('chairK','#24262c');chairProp('chairO','#e08a2e');
defineProp('ltable',[part(cyl(.9,.9,.06,40),mat('#4a6fb4',{roughness:.45}),T(0,.75,0)),part(cyl(.44,.5,.72,28),mat('#2c3a60'),T(0,.36,0)),part(cyl(.28,.32,.05,24),M.white,T(0,.8,0))]);
defineProp('umb',[part(cyl(.045,.045,1.55,10),M.poleGlow,T(0,1.55,0),false),part(cyl(1.0,1.0,.06,40),mat('#8899b6',{roughness:.5}),T(0,2.35,0)),part(cyl(.2,.2,.03,16),M.poleGlow,T(0,2.31,0),false)]);
defineProp('sideW',[part(cyl(.36,.36,.03,30),mat('#ececea',{roughness:.4}),T(0,.52,0)),part(cyl(.03,.03,.5,8),M.metal,T(0,.26,0)),part(cyl(.2,.24,.03,20),M.metal,T(0,.015,0))]);
defineProp('sideG',[part(cyl(.42,.42,.03,30),mat('#8e939b',{roughness:.4}),T(0,.74,0)),part(cyl(.03,.03,.72,8),M.metal,T(0,.37,0)),part(cyl(.22,.26,.03,20),M.metal,T(0,.015,0))]);
defineProp('arm',[part(box(.78,.2,.72),M.mustard,T(0,.36,0)),part(box(.78,.58,.16),M.mustard,T(0,.68,-.3,-.12)),
  part(box(.12,.3,.7),M.mustardDark,T(-.37,.5,0)),part(box(.12,.3,.7),M.mustardDark,T(.37,.5,0)),
  ...[[-.32,-.28],[.32,-.28],[-.32,.28],[.32,.28]].map(([x,z])=>part(cyl(.02,.02,.26,6),M.metal,T(x,.13,z)))]);
defineProp('cube',[part(box(.48,.48,.48),M.white,T(0,.24,0))]);
defineProp('bush',[part(sph,mat('#46ad3f'),T(0,0,0,0,0,0,.42,.3,.36))]);
defineProp('bush2',[part(sph,mat('#6cc94f'),T(0,0,0,0,0,0,.34,.25,.3))]);
defineProp('flower',[part(sph,mat('#f6a2bf',{roughness:.6}),T(0,0,0,0,0,0,.075,.06,.075),false)]);

let seats=0,tables=0;
const chairsAround=(x,z,n,kinds,rad=1.2,a0=.3)=>{for(let i=0;i<n;i++){const a=a0+i*2*PI/n+(R()-.5)*.2;
  place(kinds[i%kinds.length],x+Math.sin(a)*rad,PY,z+Math.cos(a)*rad,a+PI+(R()-.5)*.25);seats++;}};
function lampTable(x,z,n,kinds,a0){place('ltable',x,PY,z);place('umb',x,PY,z);tables++;chairsAround(x,z,n,kinds,1.25,a0);cols.push([x,z,1.55]);}
function chair(k,x,z,ry){place(k,x,PY,z,ry);seats++;}
function armchair(x,z,tx,tz){place('arm',x,PY,z,faceTo(x,z,tx,tz));seats++;cols.push([x,z,.5]);}
function cube(x,z,ry=0){place('cube',x,PY,z,ry);cols.push([x,z,.33]);}

const greens=['#3fae44','#5cc552','#2e8e3c','#7ad35f'].map(c=>mat(c,{roughness:.7}));
function plant(x,y,z,s=1){const g=new THREE.Group();
  mk(cyl(.17,.13,.24,18),M.white,0,.12,0,g);mk(cyl(.155,.155,.02,18),M.soil,0,.235,0,g);
  for(let i=0;i<13;i++){const piv=new THREE.Group();piv.position.y=.24;piv.rotation.y=i/13*PI*2+R()*.5;
    const inner=new THREE.Group();inner.rotation.z=.2+R()*.8;const Lf=.24+R()*.2;
    const lf=new THREE.Mesh(sph,greens[i%4]);lf.scale.set(.075,Lf,.022);lf.position.y=Lf;lf.castShadow=true;inner.add(lf);piv.add(inner);g.add(piv);}
  g.position.set(x,y,z);g.scale.setScalar(s);scene.add(g);if(y<1)cols.push([x,z,.35*s]);}

/* ---------- far end: khu trưng bày tròn (theo ảnh thật tầng 6): bàn tròn có màn cảm ứng đặt nghiêng, cột "phễu"
   loe từ mặt bàn lên tấm trần tròn viền đèn LED, vòng nan bao quanh; vách cong trắng có gờ thấp và tivi treo mặt trong ---------- */
const uiTex=canvasTex(256,160,(g,w,h)=>{g.fillStyle='#f4f7fc';g.fillRect(0,0,w,h);g.fillStyle='#2f5fd0';g.fillRect(0,0,w,22);
  g.fillStyle='#ffffff';g.fillRect(8,7,46,8);g.fillStyle='#d23b3b';g.fillRect(w-30,6,22,10);
  [[10,32,70,52,'#7fa9ee'],[88,32,70,52,'#9cc3f5'],[166,32,80,52,'#5b86d8']].forEach(([x,y,a,b,c])=>{g.fillStyle=c;g.fillRect(x,y,a,b);});
  g.fillStyle='#b9c3d6';for(let k=0;k<5;k++)g.fillRect(10,96+k*12,k%2?150:210,5);});
{const X=DESK.x,Z=DESK.z,Y=PY,scrM=new THREE.MeshBasicMaterial({map:uiTex});
 // sàn: đĩa sáng dưới bàn + vòng trắng mảnh
 mk(cyl(2.3,2.3,.014,64),mat('#eceef1'),X,Y+.013,Z,scene,false);
 {const r=new THREE.Mesh(new THREE.RingGeometry(2.3,2.4,72),mat('#ffffff'));r.rotation.x=-PI/2;r.position.set(X,Y+.016,Z);r.receiveShadow=true;scene.add(r);}
 // bàn tròn: chân thụt vào, mặt bàn dày
 mk(cyl(1.05,1.15,.84,48),M.white,X,Y+.42,Z);
 mk(cyl(1.62,1.56,.16,64),mat('#fbfbfa',{roughness:.3}),X,Y+.92,Z);
 // năm màn cảm ứng đặt nghiêng quanh mặt bàn, quay ra ngoài
 for(let k=0;k<5;k++){const th=k*2*PI/5+.31,g=new THREE.Group();g.position.set(X+1.24*Math.sin(th),Y+1.0,Z+1.24*Math.cos(th));g.rotation.y=th;scene.add(g);
   mk(box(.44,.18,.24),M.white,0,.09,-.03,g);
   const pnl=new THREE.Group();pnl.position.set(0,.24,.02);pnl.rotation.x=-.78;g.add(pnl);
   mk(box(.64,.42,.035),M.black,0,0,0,pnl);
   const sc=new THREE.Mesh(new THREE.PlaneGeometry(.58,.36),scrM);sc.position.z=.019;pnl.add(sc);}
 // cột "phễu": thon ở mặt bàn, loe dần lên tấm trần
 {const pts=[];for(let k=0;k<=24;k++){const t=k/24;pts.push(new THREE.Vector2(.26+1.02*Math.pow(t,2.4),t*1.98));}
  const f=mk(new THREE.LatheGeometry(pts,40),M.white,X,Y+1.0,Z);f.material=M.white;}
 // tấm trần tròn + viền đèn LED quanh mép + vòng đèn bên dưới
 mk(cyl(2.42,2.42,.2,72),M.white,X,Y+3.08,Z);
 mk(cyl(2.44,2.44,.07,72),M.led,X,Y+2.96,Z,scene,false);
 {const r=new THREE.Mesh(new THREE.RingGeometry(1.55,1.7,64),M.led);r.rotation.x=PI/2;r.position.set(X,Y+2.97,Z);scene.add(r);}
 // vòng nan bao quanh (như bánh xe): vòng trắng mảnh + 10 nan nối vào tấm trần, mặt dưới vòng có dải đèn
 arcRun(X,Z,3.05,0,2*PI,48,.2,.12,Y+2.92,M.white,{cast:false});
 arcRun(X,Z,3.05,0,2*PI,48,.1,.02,Y+2.855,M.led,{cast:false});
 for(let k=0;k<10;k++){const th=k*2*PI/10,o=mk(box(.08,.08,.66),M.white,X+2.74*Math.sin(th),Y+2.92,Z+2.74*Math.cos(th),scene,false);o.rotation.y=th;}
 cols.push([X,Z,1.8]);
 for(const sg of [-1,1]){const th0=sg*.72,th1=sg*2.72;
   arcRun(X,Z,3.7,th0,th1,14,.24,2.4,Y+1.2,M.white,{col:true});                        // vách cong
   arcRun(X,Z,3.7,th0,th1,14,.28,.05,Y+2.42,mat('#e7e8ec'),{cast:false});               // nẹp đỉnh vách
   arcRun(X,Z,3.46,th0+.04,th1-.04,14,.26,.78,Y+.39,mat('#f0f1f3'),{col:true});          // gờ thấp chạy dọc mặt trong
   for(const th of [sg*1.3,sg*2.12]){                                                    // tivi treo mặt trong vách
     const x=X+3.55*Math.sin(th),z=Z+3.55*Math.cos(th);
     const fr=mk(box(1.12,.68,.05),mat('#1d2742'),x,Y+1.72,z);fr.rotation.y=th+PI;
     const sc=new THREE.Mesh(new THREE.PlaneGeometry(1.04,.6),scrM);sc.position.set(X+3.52*Math.sin(th),Y+1.72,Z+3.52*Math.cos(th));sc.rotation.y=th+PI;scene.add(sc);}}
 // ghế khối trắng bên trong vòng vách
 for(const th of [1.4,-1.4,2.18,-2.18])cube(X+2.72*Math.sin(th),Z+2.72*Math.cos(th),th);}
/* white counter in front of the ring */
{const c=mk(box(1.7,.95,.7),M.white,0,PY+.475,-5.7);mk(box(1.8,.05,.8),mat('#ffffff',{roughness:.3}),0,PY+.97,-5.7);cols.push([-.5,-5.7,.6],[.5,-5.7,.6]);}
/* kiosks and a separate curved partition */
function kiosk(x,z,tx,tz,h=1.9){const g=new THREE.Group();g.position.set(x,PY,z);g.rotation.y=faceTo(x,z,tx,tz);scene.add(g);
  mk(box(.66,h,.34),M.white,0,h/2,0,g);const sc=new THREE.Mesh(new THREE.PlaneGeometry(.52,h*.6),new THREE.MeshBasicMaterial({map:kioskTex}));sc.position.set(0,h*.58,.171);g.add(sc);cols.push([x,z,.45]);}
kiosk(-5.3,-10.4,0,-6);kiosk(-6.4,-8.3,0,-6);kiosk(5.4,-12.6,0,-6,2.1);
arcRun(2.4,-9.6,4.7,1.0,1.95,9,.24,2.3,PY+1.15,M.white,{col:true});
{const th=1.45,x=2.4+4.5*Math.sin(th),z=-9.6+4.5*Math.cos(th);const sc=mk(box(.9,1.2,.05),mat('#262b40'),x,PY+1.35,z);sc.rotation.y=th+PI;
  const f=new THREE.Mesh(new THREE.PlaneGeometry(.82,1.1),new THREE.MeshBasicMaterial({map:kioskTex}));f.position.set(2.4+4.47*Math.sin(th),PY+1.35,-9.6+4.47*Math.cos(th));f.rotation.y=th+PI;scene.add(f);}
cube(-3.9,-7.1,.2);cube(-4.6,-6.4,.6);cube(3.9,-7.2,.1);cube(-1.4,-6.9,.4);cube(1.5,-6.9,.3);cube(-4.3,-13.6,.5);

/* ---------- navy oval carpet with the lounge ---------- */
{const g=new THREE.CircleGeometry(1,96);g.scale(5.5,7.9,1);g.rotateX(-PI/2);g.rotateY(-.18);
  const uv=g.attributes.uv;const p=g.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,p.getX(i)/2,p.getZ(i)/2);
  rugTex.repeat.set(1,1);const rug=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:rugTex,roughness:.95}));rug.position.set(.7,PY+.012,6.0);rug.receiveShadow=true;scene.add(rug);}
/* the wooden "boat" island with three umbrellas */
function lensShape(l,w){const s=new THREE.Shape();s.moveTo(-l,0);s.quadraticCurveTo(0,w*2,l,0);s.quadraticCurveTo(0,-w*2,-l,0);return s;}
{const g=new THREE.Group();g.position.set(.5,PY,2.6);g.rotation.y=.5;scene.add(g);
  const base=new THREE.Mesh(new THREE.ExtrudeGeometry(lensShape(2.9,.72),{depth:.44,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2,curveSegments:24}),M.wood);
  base.rotation.x=-PI/2;base.castShadow=base.receiveShadow=true;g.add(base);
  const top=new THREE.Mesh(new THREE.ExtrudeGeometry(lensShape(2.6,.6),{depth:.07,bevelEnabled:false,curveSegments:24}),mat('#8ea2c0',{roughness:.7}));
  top.rotation.x=-PI/2;top.position.y=.46;top.castShadow=top.receiveShadow=true;g.add(top);
  mk(box(4.2,.55,.14),M.navy,0,.8,0,g);mk(box(4.3,.05,.2),M.wood,0,1.08,0,g);
  [[-1.6,.85,'#d8dbe1'],[0,1.15,'#8ea0bd'],[1.6,.85,'#d8dbe1']].forEach(([x,r,c])=>{mk(cyl(.05,.05,2.0,10),x?M.white:M.poleGlow,x,1.95,0,g,false);
    mk(cyl(r,r,.06,40),mat(c,{roughness:.5}),x,2.95,0,g);});
  for(let u=-2.4;u<=2.4;u+=.6){cols.push([.5+Math.cos(.5)*u,2.6-Math.sin(.5)*u,.8]);}
  seats+=8;for(const lx of [-1.8,-.6,.6,1.8])for(const lz of [-.45,.45])__S("island",.5+lx*Math.cos(.5)+lz*Math.sin(.5),PY,2.6-lx*Math.sin(.5)+lz*Math.cos(.5),lz>0?.5:.5+PI);}
[[-1.6,5.3],[1.4,5.0],[3.5,3.6],[-3.2,3.1]].forEach(([x,z])=>{place('sideW',x,PY,z);cols.push([x,z,.4]);});
[[-2.4,5.7,'chairL'],[-.9,5.9,'chairL'],[.6,5.6,'chairN'],[2.2,5.3,'chairL'],[3.0,4.6,'chairL'],[4.2,3.0,'chairN'],[-3.6,4.0,'chairL'],[-2.6,2.2,'chairN']].forEach(([x,z,k])=>chair(k,x,z,faceTo(x,z,.5,2.6)+PI+(R()-.5)*.6));
/* mustard armchairs */
const AC={x:2.7,z:8.6};place('sideW',AC.x,PY,AC.z);cols.push([AC.x,AC.z,.4]);
[[2.4,7.3],[1.2,8.9],[4.0,8.4],[2.9,10.0]].forEach(([x,z])=>armchair(x,z,AC.x,AC.z));
/* big lamp table on the carpet */
lampTable(-1.6,11.4,5,['chairN','chairN','chairL'],.6);
[[-3.3,8.8,'chairL'],[-2.9,7.4,'chairL'],[.4,13.6,'chairL']].forEach(([x,z,k])=>chair(k,x,z,R()*6));

/* ---------- left side: lamp tables, piano ---------- */
lampTable(-4.9,-3.4,4,['chairL','chairN'],.4);
lampTable(-7.0,-.6,4,['chairL','chairL','chairN'],.9);
lampTable(-6.3,9.4,3,['chairO','chairL'],.2);
[[-8.2,5.8,'chairL'],[-8.6,12.4,'chairL'],[-3.4,-1.0,'chairL']].forEach(([x,z,k])=>chair(k,x,z,R()*6));

/* grand piano: black lacquer, lid propped open, bench in front */
function piano(x,z,ry){const g=new THREE.Group();g.position.set(x,PY,z);g.rotation.y=ry;scene.add(g);
  const s=new THREE.Shape();s.moveTo(-.76,0);s.lineTo(.76,0);s.lineTo(.76,.55);s.bezierCurveTo(.76,1.05,.15,1.05,.05,1.35);s.bezierCurveTo(-.05,1.7,-.2,1.95,-.48,1.95);
  s.quadraticCurveTo(-.76,1.95,-.76,1.7);s.lineTo(-.76,0);
  const body=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.3,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,curveSegments:24}),M.black);
  body.rotation.x=-PI/2;body.position.y=.62;body.castShadow=body.receiveShadow=true;g.add(body);
  const hinge=new THREE.Group();hinge.position.set(-.76,.95,0);hinge.rotation.z=.6;g.add(hinge);
  const lid=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.02,bevelEnabled:false,curveSegments:24}),M.black);lid.rotation.x=-PI/2;lid.position.x=.76;lid.castShadow=true;hinge.add(lid);
  const stick=mk(cyl(.012,.012,.62,6),M.black,.55,1.18,-.9,g);stick.rotation.z=-.5;
  mk(box(1.52,.12,.3),M.black,0,.68,.16,g);
  /* 88 real keys (A0–C8) so each one can be pressed */
  const ww=1.4/52,isB=m=>[1,3,6,8,10].includes(m%12),info={};let wi=0;
  for(let m=21;m<=108;m++){if(isB(m))info[m]={x:-.7+ww*wi,b:true};else{info[m]={x:-.7+ww*(wi+.5),b:false};wi++;}}
  const wl=Object.keys(info).filter(m=>!info[m].b),bl=Object.keys(info).filter(m=>info[m].b);
  const wIM=new THREE.InstancedMesh(box(ww*.93,.022,.15),mat('#f7f4ea',{roughness:.3}),wl.length),bIM=new THREE.InstancedMesh(box(ww*.56,.03,.095),M.black,bl.length);
  wl.forEach((m,i)=>Object.assign(info[m],{im:wIM,i,y:.752,z:.2}));bl.forEach((m,i)=>Object.assign(info[m],{im:bIM,i,y:.77,z:.157}));
  for(const m in info){const k=info[m];k.im.setMatrixAt(k.i,T(k.x,k.y,k.z));}
  for(const im of [wIM,bIM]){im.frustumCulled=false;im.receiveShadow=true;g.add(im);}
  g.userData.keys=info;g.userData.pick={w:wIM,b:bIM,wl:wl.map(Number),bl:bl.map(Number)};
  mk(box(.06,.08,.3),M.black,-.73,.78,.16,g);mk(box(.06,.08,.3),M.black,.73,.78,.16,g);
  const stand=mk(box(.62,.26,.015),M.black,0,1.08,-.12,g);stand.rotation.x=-.25;
  for(const [lx,lz] of [[-.62,-.15],[.62,-.15],[-.45,-1.6]]){mk(cyl(.05,.035,.62,10),M.black,lx,.31,lz,g);mk(cyl(.04,.04,.03,10),mat('#c9a44c',{metalness:.7,roughness:.3}),lx,.015,lz,g);}
  const lyre=mk(box(.18,.38,.04),M.black,0,.3,-.05,g);
  mk(box(.8,.08,.36),M.black,0,.5,.78,g);for(const [bx,bz] of [[-.34,.66],[.34,.66],[-.34,.9],[.34,.9]])mk(cyl(.02,.02,.46,6),M.black,bx,.23,bz,g);
  [[0,-.5,1.0],[-.3,-1.4,.6],[0,.8,.5]].forEach(([lx,lz,r])=>{const v=new THREE.Vector3(lx,0,lz).applyAxisAngle(new THREE.Vector3(0,1,0),ry);cols.push([x+v.x,z+v.z,r]);});return g;}
const PIANO=piano(-6.6,3.6,.95);seats++;

/* ---------- right side: wavy wooden booth, small grey tables, black chairs ---------- */
{const pts=[];for(let z=.6;z<=12.6;z+=.35){let x=6.95+.55*Math.sin((z-.6)/12*2*PI);const xm=(z>L?Math.sqrt(PR*PR-(z-L)**2):PR)-1.05;x=Math.min(x,xm);pts.push([x,z]);}
  for(let i=0;i<pts.length-1;i++){const [x0,z0]=pts[i],[x1,z1]=pts[i+1],dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz)*1.08,ry=Math.atan2(-dz,dx),mx=(x0+x1)/2,mz=(z0+z1)/2;
    const lx=Math.sin(ry),lz=Math.cos(ry);
    const put=(geo,m,off,y)=>{const o=mk(geo,m,mx+lx*off,PY+y,mz+lz*off);o.rotation.y=ry;return o;};
    put(box(len,.4,.62),M.woodDark,0,.2);put(box(len,.1,.58),M.cushion,.02,.45);if(i%2===0)__S("booth",mx+lx*.06,PY,mz+lz*.06,ry);
    put(box(len,1.25,.14),M.wood,-.36,.62);put(box(len,.5,.06),M.cushion,-.26,.78);
    cols.push([mx,mz,.55]);}
  seats+=12;}
[[5.3,2.8],[5.5,6.6],[5.1,10.4]].forEach(([x,z])=>{place('sideG',x,PY,z);cols.push([x,z,.45]);chair('chairK',x-.95,z+.2,PI/2+(R()-.5)*.3);chair('chairK',x-.6,z-.75,.6);});
chair('chairK',3.9,8.4,1.2);chair('chairL',4.3,12.6,2.2);
lampTable(6.3,-4.6,4,['chairK','chairL'],.5);

/* plants on the platform and corridor */
[[-8.3,-5.6],[-8.6,1.6],[8.4,-1.6],[8.6,-7.2],[-6.8,-12.4],[6.6,-13.0],[-5.4,14.6],[2.4,15.6]].forEach(([x,z])=>plant(x,PY,z,1.7));
[[14.2,-7.8],[14.4,7.8],[-14.2,8.4],[-14.4,-8.6],[-3.6,-21.6],[3.6,-21.6]].forEach(([x,z])=>plant(x,0,z,2.1));

/* corridor: long white study tables along the left wall, a bench at the lifts */
for(const [z0,z1] of [[-6.8,-1.4],[1.2,6.2]]){const cz=(z0+z1)/2,len=z1-z0;mk(box(.9,.05,len),mat('#ffffff',{roughness:.35}),-13.9,.75,cz);
  mk(box(.1,.72,.1),M.metal,-13.9,.36,z0+.3);mk(box(.1,.72,.1),M.metal,-13.9,.36,z1-.3);tables++;
  for(let z=z0+.5;z<z1-.2;z+=1.0){place('chairL',-13.1,0,z,-PI/2+(R()-.5)*.2);place('chairN',-14.7,0,z,PI/2+(R()-.5)*.2);seats+=2;}
  cols.push(...Array.from({length:Math.ceil(len)},(_,i)=>[-13.9,z0+.5+i,.95]));}
mk(box(.6,.45,3.0),mat('#d9dbe0'),13.8,.225,5.3);mk(box(.62,.06,3.02),M.wood,13.8,.47,5.3);cols.push([13.8,4.3,.6],[13.8,6.3,.6]);seats+=3;for(const dz of [-1,0,1])__S("bench6",13.75,0,5.3+dz,-PI/2);   /* ghế dài ở lối ra thang máy tầng 6: ngồi được (3 chỗ, quay ra sảnh) */

/* planters and the floor sign by the near stairs */
function planter(q,len){const r=PR+.95,p=atQ(r,q),ry=ryOf(p);const b=mk(box(len,.5,.66),mat('#eef0f4'),p.x,.25,p.z);b.rotation.y=ry;
  const sl=mk(box(len-.12,.04,.54),M.soil,p.x,.5,p.z,scene,false);sl.rotation.y=ry;
  for(let u=-len/2+.3;u<len/2-.2;u+=.33){const o=(R()-.5)*.25;place(R()<.5?'bush':'bush2',p.x+p.tx*u-p.tz*o,.58+R()*.08,p.z+p.tz*u+p.tx*o,R()*3);}
  for(let i=0;i<len*8;i++){const u=(R()-.5)*(len-.4),o=(R()-.5)*.4;place('flower',p.x+p.tx*u-p.tz*o,.74+R()*.12,p.z+p.tz*u+p.tx*o,R()*3);}
  for(let u=-len/2+.4;u<len/2;u+=.8)cols.push([p.x+p.tx*u,p.z+p.tz*u,.45]);}
planter(2.5+.17,2.4);planter(2.5+.3,2.4);planter(2.5-.19,2.4);
{const p=atQ(PR+1.3,2.5-.31),ry=ryOf(p)+PI;const f=mk(box(2.75,.72,.08),mat('#e8eaf0'),p.x,1.05,p.z);f.rotation.y=ry;
  mk(box(.08,.7,.08),M.metal,p.x+p.tx*1.1,.35,p.z+p.tz*1.1);mk(box(.08,.7,.08),M.metal,p.x-p.tx*1.1,.35,p.z-p.tz*1.1);
  const s=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.56),new THREE.MeshStandardMaterial({map:floorSignTex,roughness:.5}));s.position.set(p.x+Math.sin(ry)*.045,1.05,p.z+Math.cos(ry)*.045);s.rotation.y=ry;scene.add(s);cols.push([p.x,p.z,.9]);}

/* ---------- tầng 7: seating on the balcony corridor ---------- */
let seats7=0;
function ringPlace(r,q0,q1,step,fn){const s0=sOf(r,q0),s1=sOf(r,q1);for(let s=s0;s<=s1+1e-6;s+=step)fn(stadAt(r,s));}
chairProp('chairR','#c4363d');
defineProp('dtable',[part(cyl(.62,.62,.04,36),mat('#3a3e48',{roughness:.4}),T(0,.74,0)),part(cyl(.05,.05,.72,10),M.metal,T(0,.36,0)),part(cyl(.3,.34,.03,24),M.metal,T(0,.015,0))]);
defineProp('ctable',[part(cyl(.45,.45,.04,32),mat('#f2f2f0',{roughness:.35}),T(0,.42,0)),part(cyl(.32,.36,.4,24),mat('#c9a77c'),T(0,.2,0))]);
defineProp('sofa',[part(box(1.7,.36,.8),M.navy,T(0,.2,0)),part(box(1.56,.1,.68),M.cushion,T(0,.43,.04)),part(box(1.7,.52,.18),M.navy,T(0,.64,-.31,-.08)),
  part(box(.16,.52,.8),M.navy,T(-.85,.38,0)),part(box(.16,.52,.8),M.navy,T(.85,.38,0))]);
/* far end: long curved study tables following the balcony, chairs both sides */
const tableTop7=mat('#f6f6f4',{roughness:.35});
for(const [q0,q1] of [[.1,.4],[.6,.9]]){
  ringPlace(14.2,q0,q1,.5,p=>{const t=mk(box(.56,.05,.88),tableTop7,p.x,MZ+.75,p.z);t.rotation.y=ryOf(p);cols7.push([p.x,p.z,1.15]);});
  ringPlace(14.2,q0+.012,q1-.012,1.5,p=>{const lg=mk(box(.08,.72,.6),M.metal,p.x,MZ+.36,p.z);lg.rotation.y=ryOf(p);});
  ringPlace(13.4,q0+.02,q1-.02,.85,p=>{place('chairL',p.x,MZ,p.z,ryOf(p)+PI);seats7++;});
  ringPlace(15.0,q0+.02,q1-.02,.85,p=>{place('chairN',p.x,MZ,p.z,ryOf(p));seats7++;});}
/* left side: dark round tables with red chairs, like the upper level in the photo */
for(const z of [-3.3,0,3.3]){const x=-14.0;place('dtable',x,MZ,z);cols7.push([x,z,1.3]);
  for(let k=0;k<4;k++){const a=k*PI/2+.4+(R()-.5)*.2;place('chairR',x+Math.sin(a)*.95,MZ,z+Math.cos(a)*.95,a+PI);seats7++;}}
/* near end: lounge corners with a navy sofa and two mustard armchairs */
for(const f of [-1.15,-.5,.5,1.15]){const r=14.0,cx=r*Math.sin(f),cz=L+r*Math.cos(f),nx=Math.sin(f),nz=Math.cos(f),tx=Math.cos(f),tz=-Math.sin(f);
  place('ctable',cx,MZ,cz);cols7.push([cx,cz,.6]);
  const sx=cx+nx*1.05,sz=cz+nz*1.05;place('sofa',sx,MZ,sz,faceTo(sx,sz,cx,cz));cols7.push([sx,sz,.9]);seats7+=3;
  for(const sg of [-1,1]){const ax=cx+tx*sg*1.15,az=cz+tz*sg*1.15;place('arm',ax,MZ,az,faceTo(ax,az,cx,cz));cols7.push([ax,az,.5]);seats7++;}}
/* lift lobby bench and plants */
mk(box(.55,.42,2.6),mat('#d9dbe0'),12.7,MZ+.21,0);mk(box(.57,.06,2.62),M.wood,12.7,MZ+.45,0);cols7.push([12.7,-.8,.5],[12.7,.8,.5]);seats7+=3;for(const dz of [-.8,0,.8])__S("bench7",12.65,MZ,dz,-PI/2);
[[14.6,-4.6],[14.6,4.6],[-15.6,-5.8],[-15.6,5.8]].forEach(([x,z])=>{plant(x,MZ,z,1.9);cols7.push([x,z,.5]);});
for(const f of [-.82,.82]){const x=15.4*Math.sin(f);plant(x,MZ,-L-15.4*Math.cos(f),1.9);plant(x,MZ,L+15.4*Math.cos(f),1.9);cols7.push([x,-L-15.4*Math.cos(f),.5],[x,L+15.4*Math.cos(f),.5]);}

buildProps();
{const im=new THREE.InstancedMesh(box(1,1,1),mat('#ffffff',{roughness:.75}),books.length);books.forEach((b,i)=>{im.setMatrixAt(i,b.m);im.setColorAt(i,b.c);});
  im.instanceColor.needsUpdate=true;im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;scene.add(im);}

/* ---------- lighting ---------- */
const hemi=new THREE.HemisphereLight(0xffffff,0xdcdad6,.76);scene.add(hemi);
const topLight=new THREE.DirectionalLight(0xffffff,.5);topLight.position.set(-6,36,10);topLight.target.position.set(0,0,0);
topLight.castShadow=true;{const s=topLight.shadow;s.mapSize.set(2048,2048);Object.assign(s.camera,{left:-27,right:27,top:27,bottom:-27,near:1,far:90});s.camera.updateProjectionMatrix();s.bias=-.0004;s.normalBias=.025;}
scene.add(topLight,topLight.target);
const fill=new THREE.DirectionalLight(0xfff4e6,.16);fill.position.set(12,10,-24);scene.add(fill);
renderer.shadowMap.needsUpdate=true;
const DAY={bg:lin('#e9eaee'),hemi:.76,hemiC:lin('#ffffff'),top:.5,topC:lin('#ffffff'),panel:.85,led:1.2};
const EVE={bg:lin('#14161e'),hemi:.5,hemiC:lin('#ffe8d0'),top:.42,topC:lin('#ffe1bd'),panel:1.6,led:2.0};
let night=0,nightTarget=0;scene.background=DAY.bg.clone();
function applyNight(t){const l=(a,b)=>a+(b-a)*t;scene.background.copy(DAY.bg).lerp(EVE.bg,t);hemi.intensity=l(DAY.hemi,EVE.hemi);hemi.color.copy(DAY.hemiC).lerp(EVE.hemiC,t);
  topLight.intensity=l(DAY.top,EVE.top);topLight.color.copy(DAY.topC).lerp(EVE.topC,t);M.panel.emissiveIntensity=l(DAY.panel,EVE.panel);M.led.emissiveIntensity=l(DAY.led,EVE.led);fasciaMat.emissiveIntensity=l(.9,1.4);}
let lampOn=true,lampLvl=1;
function applyLamp(v){M.poleGlow.emissiveIntensity=.03+v*(1.2+night*.6);}

/* ---------- views & camera ---------- */
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const VIEWS={
  overview:{p:V(0,38,35),t:V(0,0,.5),fit:'over'},
  roof10:{p:V(-30,ROOF+18,34),t:V(0,ROOF,0)},
  building:{p:V(56,14,70),t:V(-3,-6,0)},
  photo:{p:V(0,8.9,21.8),t:V(0,0,-3.5)},
  steps:{p:V(0,1.7,22.5),t:V(0,1.5,10)},
  lounge:{p:V(5.6,3.0,14.6),t:V(-.5,.6,5)},
  piano:{p:V(-3.4,1.9,6.8),t:V(-6.6,.9,3.4)},
  desk:{p:V(-4.6,2.5,-3.6),t:V(0,1.2,-11)},
  lift:{p:V(8.8,1.8,0),t:V(16.5,1.5,0)},
  floor7:{p:V(-12.2,MZ+3.1,14.8),t:V(-14.2,MZ+.3,-3)},
  top:{p:V(0,62,.6),t:V(0,0,0),fit:'top'}
};
function viewPose(name){const v=VIEWS[name];const p=v.p.clone(),t=v.t.clone(),a=camera.aspect;
  if(v.fit==='over'){const k=Math.min(2.6,Math.max(1,Math.pow(1.6/a,.9)));p.sub(t).multiplyScalar(k).add(t);}
  if(v.fit==='top'){p.y=Math.max(62,44/a+20);}
  return {p,t};}
let tween=null;
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
function flyTo(p,t,dur=1.3,done){const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  tween={p0:camera.position.clone(),t0:controls.target.clone(),p1:p,t1:t,s:performance.now(),d:reduce?1:dur*1000,done};}
const viewBtns=[...root.querySelectorAll('[data-view]')];
const setActive=n=>viewBtns.forEach(b=>b.classList.toggle('on',b.dataset.view===n));
function goView(n){forceRoof=n==='building'||n==='roof10';if(mode==='piano'){standUp();}if(mode==='walk')setMode('orbit');const {p,t}=viewPose(n);flyTo(p,t);setActive(n);}
viewBtns.forEach(b=>b.addEventListener('click',()=>goView(b.dataset.view)));
root.querySelector('[data-action=ride]').addEventListener('click',()=>{if(mode==='piano')standUp();enterWalk(V(13.0,1.6,0),PI/2,6);});
controls.addEventListener('start',()=>{tween=null;setActive(null);});

/* ---------- walk mode ---------- */
let mode='orbit',yaw=0,pitch=0,eyeY=1.6,level=6,rider=null;
const keys={f:0,b:0,l:0,r:0,run:0};
const touch=matchMedia('(pointer: coarse)').matches;
const hint=$('#hint'),dpad=$('#dpad');
function setHint(){hint.textContent=mode==='walk'
  ?(`Tầng ${level} · `+(touch?'Giữ nút mũi tên để đi · Vuốt để nhìn quanh · Thang máy ở tường bên phải':'W A S D hoặc mũi tên để đi · Kéo để nhìn quanh · Thang máy ở tường bên phải · Esc để thoát'))
  :(touch?'Một ngón để xoay · Hai ngón để phóng to và dịch chuyển':'Kéo để xoay · Cuộn để phóng to · Kéo chuột phải để dịch chuyển');}
function groundY(x,z){if(inside(x,z,PR))return PY;
  if(Math.abs(x)<STEP){const d=Math.abs(z)-(L+PR);if(d>-.7&&d<=.6)return .45;if(d>.6&&d<=1.2)return .3;if(d>1.2&&d<=1.8)return .15;}
  return 0;}
const liftAt=(x,z)=>LIFTS.find(l=>Math.abs(z-l.z)<.96&&x>WR-.45);
const inCab=(l,x,z)=>x>WR+.25&&x<CX1-.3&&Math.abs(z-l.z)<.68;
function cameraInside(x,z,foot){
  if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(foot))return false;
  const upper=foot>=MZ-.3&&foot<ROOF-.3;
  return inside(x,z,WR-.08)&&!(upper&&inside(x,z,FR+.20));
}
function blocked(x,z,cx,cz){const l=liftAt(x,z);
  if(l){const door=x<=WR+.25&&Math.abs(z-l.z)<.42;
    if(l.phase==='moving'||l.phase==='xfer')return !(rider===l&&inCab(l,x,z));
    if(l.floor!==level)return true;
    if(inCab(l,x,z))return false;if(door)return l.door<.85;return true;}
  if(!inside(x,z,WR-.4))return true;
  if(level===10){for(const c of cols10)if(Math.hypot(x-c[0],z-c[1])<c[2]+.22)return true;return !inside(x,z,WR-.6);}
  if(level===7){if(inside(x,z,FR+.45))return true;for(const c of cols7)if(Math.hypot(x-c[0],z-c[1])<c[2]+.22)return true;return false;}
  if(Math.abs(groundY(x,z)-groundY(cx,cz))>.2)return true;
  for(const c of cols)if(Math.hypot(x-c[0],z-c[1])<c[2]+.22)return true;return false;}
function baseY(x,z){const l=liftAt(x,z);if(l)return l.y;return level===6?groundY(x,z):level===10?ROOF:MZ;}
function requestFloor(l,fl){if(!l||l.phase!=='idle')return;if(fl===l.floor){l.hold=3;return;}l.target=fl;l.phase='closing';}
function updateLifts(dt){const p=camera.position;
  for(const l of LIFTS){let want=false;
    if(mode==='walk'){
      if(rider===l)want=true;
      else if(!rider&&Math.abs(p.z-l.z)<1.4&&p.x>13.4&&p.x<WR+.3){
        if(l.floor===level)want=true;else if(l.phase==='idle'&&l.door===0)requestFloor(l,level);}}
    if(l.phase==='closing'){l.door=Math.max(0,l.door-dt*1.3);if(l.door===0){l.phase='moving';l.t=0;l.y0=l.y;l.y1=LBASE[l.target];l.dur=1.4+Math.abs(l.y1-l.y0)/2.4;if(!OWN.includes(l.target))ctx.crossStart(ME,l.i);}}
    else if(l.phase==='moving'){l.t=Math.min(1,l.t+dt/l.dur);l.y=l.y0+(l.y1-l.y0)*ease(l.t);l.cab.position.y=l.y;
      if(l.t>=1){if(OWN.includes(l.target)){l.floor=l.target;l.target=null;l.phase='idle';l.hold=2.5;if(rider===l){level=l.floor;setHint();}}
        else{/* the car has gone down into tầng 1–4: hand the ride over to that part of the building */
          const tf=l.target,ride=rider===l,pose={x:camera.position.x,z:camera.position.z,yaw,pitch};
          l.target=null;l.phase='idle';l.floor=6;l.y=0;l.cab.position.y=0;l.door=0;l.hold=0;l.key='';
          if(ride)ctx.handoff(ME,tf,l.i,pose);}}}
    else if(l.phase==='idle'){l.hold-=dt;l.door=Math.min(1,Math.max(0,l.door+((want||l.hold>0)?1:-1)*dt*1.3));}
    for(const fl of OWN){const o=(fl===l.floor&&(l.phase==='idle'||l.phase==='closing'))?l.door*.68:0,d=l.doors[fl];d.L.position.z=l.z-OW/2-o;d.R.position.z=l.z+OW/2+o;}
    if(l.cd){const k=Math.max(.002,1-(l.phase==='idle'||l.phase==='closing'?l.door:0));l.cd.L.scale.z=k;l.cd.R.scale.z=k;}
    const key=l.phase+l.floor+l.target;if(key!==l.key){l.key=key;dispDraw(l);}}
  updatePanel();}
const lp=$('#liftpanel'),lpBtns=[...lp.querySelectorAll('[data-floor]')];let lpKey='';
function updatePanel(){const show=mode==='walk'&&!!rider;if(lp.hidden===show)lp.hidden=!show;if(!show){lpKey='';return;}
  const l=rider,key=l.i+l.phase+l.floor+l.target;if(key===lpKey)return;lpKey=key;
  $('#lp-name').textContent='Thang máy '+(l.i+1);
  const mv=l.phase==='moving'||l.phase==='xfer';$('#lp-disp').textContent=mv?(l.target>l.floor?'▲ ':'▼ ')+l.target:String(l.floor);
  lpBtns.forEach(b=>b.classList.toggle('on',+b.dataset.floor===(l.target||l.floor)));
  $('#lp-note').textContent=mv?`Đang ${l.target>l.floor?'lên':'xuống'} tầng ${l.target}…`:l.phase==='closing'?'Cửa đang đóng…':`Đang ở tầng ${l.floor}. Chọn tầng để đi hoặc bước ra.`;}
lpBtns.forEach(b=>b.addEventListener('click',()=>requestFloor(rider,+b.dataset.floor)));
$('#lp-open').addEventListener('click',()=>{if(rider&&rider.phase==='idle')rider.hold=3;});

/* ---------- playing the piano ---------- */
const KEYMAP={KeyZ:48,KeyS:49,KeyX:50,KeyD:51,KeyC:52,KeyV:53,KeyG:54,KeyB:55,KeyH:56,KeyN:57,KeyJ:58,KeyM:59,Comma:60,KeyL:61,Period:62,Semicolon:63,Slash:64,
  KeyQ:60,Digit2:61,KeyW:62,Digit3:63,KeyE:64,KeyR:65,Digit5:66,KeyT:67,Digit6:68,KeyY:69,Digit7:70,KeyU:71,KeyI:72,Digit9:73,KeyO:74,Digit0:75,KeyP:76,BracketLeft:77,Equal:78,BracketRight:79};
const KEYLABEL={Comma:',',Period:'.',Semicolon:';',Slash:'/',BracketLeft:'[',BracketRight:']',Equal:'='};
const labelOf=c=>KEYLABEL[c]||c.replace('Key','').replace('Digit','');
const NOTE=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
let ACX=null,master=null,pedal=false;const voices={},held={};
function audio(){if(ACX)return ACX;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ACX=new C();
  master=ACX.createGain();master.gain.value=.55;const comp=ACX.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=4;
  const rev=ACX.createConvolver();const n=ACX.sampleRate*2.6|0,b=ACX.createBuffer(2,n,ACX.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.5);}
  rev.buffer=b;const wet=ACX.createGain();wet.gain.value=.2;master.connect(comp);master.connect(rev);rev.connect(wet);wet.connect(comp);comp.connect(ACX.destination);return ACX;}
/* additive piano tone: slightly stretched partials, two detuned strings, fast-then-slow decay, felt-hammer thump */
function noteOn(m,vel=.78,bus,vs){/*[piano-net] bus/vs: remote notes use their own gain bus + voice map*/vs=vs||voices;bus=bus||master;const ac=audio();if(!ac)return;if(ac.state==='suspended')ac.resume();if(vs[m])noteOff(m,true,vs);
  const f=440*Math.pow(2,(m-69)/12),t=ac.currentTime+.005,out=ac.createGain();out.gain.value=1;
  const lp=ac.createBiquadFilter();lp.type='lowpass';lp.Q.value=.4;lp.frequency.setValueAtTime(Math.min(15000,f*(8+vel*10)+900),t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(f*2.2,500),t+2.2);lp.connect(out);out.connect(bus||master);/*[piano-net]*/
  const pan=ac.createStereoPanner?ac.createStereoPanner():null;if(pan){pan.pan.value=Math.max(-.6,Math.min(.6,(m-64)/40));out.disconnect();out.connect(pan);pan.connect(bus||master);/*[piano-net]*/}
  const tail=Math.max(1.4,8*Math.pow(110/f,.6)),B=.00032,np=f>1600?4:f>800?6:9,stop=t+tail*2.6,oscs=[];
  for(let n=1;n<=np;n++){const fn=n*f*Math.sqrt(1+B*n*n);if(fn>17000)break;
    const amp=vel*.26/Math.pow(n,1.1)*(n===2?.85:1)*(n===4?.6:1),tau=tail/(1+.45*(n-1));
    for(const ct of n<=3?[-1.4,1.6]:[0]){const o=ac.createOscillator();o.frequency.value=fn*Math.pow(2,ct/1200);const g=ac.createGain();
      const a=n<=3?amp/2:amp;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.003);
      g.gain.setTargetAtTime(a*.32,t+.003,tau*.07);g.gain.setTargetAtTime(0,t+.003+tau*.22,tau*.6);
      o.connect(g);g.connect(lp);o.start(t);o.stop(stop);oscs.push(o);}}
  const nb=ac.createBuffer(1,ac.sampleRate*.05|0,ac.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=(Math.random()*2-1)*Math.pow(1-i/nd.length,4);
  const ns=ac.createBufferSource();ns.buffer=nb;const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=Math.min(4000,f*2.5);bp.Q.value=1.2;
  const ng=ac.createGain();ng.gain.value=vel*.22;ns.connect(bp);bp.connect(ng);ng.connect(out);ns.start(t);
  vs[m]={out,oscs,sus:false};/*[piano-net]*/}
function noteOff(m,now,vs,pd){/*[piano-net] vs/pd: remote voice map + remote pedal*/vs=vs||voices;if(vs===voices)pd=pedal;const v=vs[m];if(!v||!ACX)return;if(pd&&!now){v.sus=true;return;}
  const t=ACX.currentTime;v.out.gain.cancelScheduledValues(t);v.out.gain.setValueAtTime(v.out.gain.value,t);v.out.gain.setTargetAtTime(0,t,now?.02:.09);
  v.oscs.forEach(o=>{try{o.stop(t+.7);}catch(_){}});delete vs[m];}
function setPedal(on){on=!!on;if(on!==pedal)pnOut({t:'p',on});/*[piano-net]*/pedal=on;if(!on)for(const m in voices)if(voices[m].sus&&!held[m])noteOff(+m);}
/* 3D key + on-screen key feedback */
const pbKeys=$('#pb-keys');let keyEls={},shift=0;
const SOLF=['Đô','Đô#','Rê','Rê#','Mi','Fa','Fa#','Sol','Sol#','La','La#','Si'];
const UPPER={},LOWER={};for(const [c,m] of Object.entries(KEYMAP)){if(['Comma','KeyL','Period','Semicolon','Slash'].includes(c))LOWER[m]=c;else if(m>=60)UPPER[m]=c;else LOWER[m]=c;}
function keyFor(m){const r=m-12*shift;const c=r>=60?UPPER[r]:LOWER[r];return c?labelOf(c):null;}
function pressVisual(m,down){const k=PIANO.userData.keys[m];if(k){k.im.setMatrixAt(k.i,T(k.x,k.y-(down?.008:0),k.z,down?.05:0));k.im.instanceMatrix.needsUpdate=true;}
  if(keyEls[m])keyEls[m].classList.toggle('on',down);}
function keyDown(m,vel=.78){vel=Number.isFinite(vel)?Math.max(1/127,Math.min(1,vel)):.78;if(m<21||m>108||held[m])return;held[m]=1;noteOn(m,vel);pressVisual(m,true);onPlayed(m);pnOut({t:'d',m,v:vel});/*[piano-net]*/}
function keyUp(m){if(!held[m])return;delete held[m];noteOff(m);pressVisual(m,false);pnOut({t:'u',m});/*[piano-net]*/}
function releaseAll(){for(const m in held)keyUp(+m);}
/* [piano-net] đàn qua mạng: nốt mình chơi được gửi ra window.__PIANO_NET.out (js/piano-net.js gom gói, gửi kênh khu);
   nốt của bạn khác vào api.pianoRemote(ev) → phát bằng cùng bộ tổng hợp nhưng qua bus âm lượng riêng (rbus) và kho
   voice riêng (rvoices), nên không đụng tới tiếng đàn của chính mình. Không cần ngồi đàn để nghe; trình duyệt chưa cho
   phát âm thì bỏ qua tiếng (vẫn nhún phím) và bật lại ở lần bấm/gõ kế tiếp. Nốt treo quá 12 giây thì tự nhả. */
function pnOut(e){try{const n=window.__PIANO_NET;if(n&&n.out)n.out(e);}catch(_){}}
const rvoices={},rheld={},rtm={};let rbus=null,rgain=1,rpedal=false,rwait=false;
function rWait(){if(rwait)return;rwait=true;const go=()=>{rwait=false;window.removeEventListener('pointerdown',go,true);window.removeEventListener('keydown',go,true);
    try{audio();if(ACX&&ACX.state!=='running'){const p=ACX.resume();if(p&&p.catch)p.catch(()=>{});}}catch(_){}};
  window.addEventListener('pointerdown',go,true);window.addEventListener('keydown',go,true);}
function rAudio(){try{if(!ACX){const ua=navigator.userActivation;if(ua&&!ua.hasBeenActive){rWait();return null;}if(!audio())return null;}
    if(!rbus){rbus=ACX.createGain();rbus.gain.value=rgain;rbus.connect(master);}
    if(ACX.state!=='running'){const p=ACX.resume();if(p&&p.catch)p.catch(()=>{});rWait();return null;}return ACX;}catch(_){return null;}}
function pianoRemoteGain(g){rgain=Math.max(0,Math.min(1.5,+g||0));if(rbus&&ACX)try{rbus.gain.setTargetAtTime(rgain,ACX.currentTime,.08);}catch(_){}}
function rUp(m,force){clearTimeout(rtm[m]);delete rtm[m];delete rheld[m];if(!held[m])pressVisual(m,false);noteOff(m,!!force,rvoices,rpedal);}
function pianoRemote(e){if(!e)return;if(e.g!=null)pianoRemoteGain(e.g);
  if(e.t==='p'){rpedal=!!e.on;if(!rpedal)for(const m in rvoices)if(rvoices[m].sus&&!rheld[m])noteOff(+m,false,rvoices,false);return;}
  const m=e.m|0;if(m<21||m>108)return;
  if(e.t==='d'){rheld[m]=1;if(!held[m])pressVisual(m,true);
    if(rgain>.001&&rAudio())noteOn(m,Math.max(.1,Math.min(1,e.v==null?.78:+e.v||.78)),rbus,rvoices);
    clearTimeout(rtm[m]);rtm[m]=setTimeout(()=>rUp(m,true),12000);}
  else if(e.t==='u'&&rheld[m])rUp(m,false);}
function pianoRemoteReset(){for(const m in rheld)rUp(+m,true);rpedal=false;for(const m in rvoices)noteOff(+m,true,rvoices);}
function buildKeys(){pbKeys.textContent='';keyEls={};const lo=48+12*shift;let wi=0;
  for(let m=lo;m<=lo+31;m++){if(m<21||m>108)continue;const b=[1,3,6,8,10].includes(m%12),el=document.createElement('div');
    const r=m-12*shift,labs=Object.entries(KEYMAP).filter(([c,v])=>v===r).map(([c])=>labelOf(c)).join(' ');
    el.className=b?'b':'w';el.textContent=b?labs:(labs+(m%12===0?`\nC${(m/12|0)-1}`:''));
    if(b)el.style.left=(wi*33-11)+'px';else wi++;el.dataset.m=m;pbKeys.appendChild(el);keyEls[m]=el;}
  pbKeys.style.width=(wi*33+1)+'px';
  $('#pb-ol').textContent=shift===0?'Quãng tám gốc':`Quãng tám ${shift>0?'+':''}${shift}`;markNext();}
function setShift(v){v=Math.max(-3,Math.min(3,v));if(v===shift)return;releaseAll();shift=v;buildKeys();renderLane();}
$('#pb-od').addEventListener('click',()=>setShift(shift-1));$('#pb-ou').addEventListener('click',()=>setShift(shift+1));
{const active=new Map();
  pbKeys.addEventListener('pointerdown',e=>{const el=e.target.closest('[data-m]');if(!el)return;e.preventDefault();try{pbKeys.setPointerCapture(e.pointerId);}catch(_){}
    const m=+el.dataset.m;active.set(e.pointerId,m);keyDown(m);});
  pbKeys.addEventListener('pointermove',e=>{if(!active.has(e.pointerId))return;const el=document.elementFromPoint(e.clientX,e.clientY);const m=el&&el.dataset&&el.dataset.m?+el.dataset.m:null;
    const cur=active.get(e.pointerId);if(m!==null&&m!==cur){keyUp(cur);keyDown(m);active.set(e.pointerId,m);}});
  const end=e=>{if(!active.has(e.pointerId))return;keyUp(active.get(e.pointerId));active.delete(e.pointerId);};
  pbKeys.addEventListener('pointerup',end);pbKeys.addEventListener('pointercancel',end);}
/* press the 3D keys directly: all 88 keys, A0 to C8 */
{const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),pk=PIANO.userData.pick,act=new Map();
  const pick=e=>{const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
    const h=ray.intersectObjects([pk.b,pk.w],false)[0];if(!h||h.instanceId===undefined)return null;return h.object===pk.b?pk.bl[h.instanceId]:pk.wl[h.instanceId];};
  canvas.addEventListener('pointerdown',e=>{if(mode!=='piano')return;const m=pick(e);if(m==null)return;try{canvas.setPointerCapture(e.pointerId);}catch(_){}act.set(e.pointerId,m);keyDown(m);});
  canvas.addEventListener('pointermove',e=>{if(mode!=='piano'||!act.has(e.pointerId))return;const m=pick(e),c=act.get(e.pointerId);if(m!=null&&m!==c){keyUp(c);keyDown(m);act.set(e.pointerId,m);}});
  const end=e=>{if(!act.has(e.pointerId))return;keyUp(act.get(e.pointerId));act.delete(e.pointerId);};
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);}

/* ---------- song guide ---------- */
/* melodies are public-domain tunes; each token is NOTE+octave[:beats] */
const SONGS=[
  {name:'Kìa con bướm vàng',bpm:110,n:'C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:2 E4 F4 G4:2 G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 C4 G3 C4:2 C4 G3 C4:2'},
  {name:'Twinkle Twinkle Little Star',bpm:100,n:'C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2'},
  {name:'Happy Birthday',bpm:100,n:'G3:.75 G3:.25 A3 G3 C4 B3:2 G3:.75 G3:.25 A3 G3 D4 C4:2 G3:.75 G3:.25 G4 E4 C4 B3 A3:2 F4:.75 F4:.25 E4 C4 D4 C4:2'},
  {name:'Ode to Joy · Beethoven',bpm:110,n:'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2 D4 D4 E4 C4 D4 E4:.5 F4:.5 E4 C4 D4 E4:.5 F4:.5 E4 D4 C4 D4 G3:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2'},
  {name:'Jingle Bells',bpm:120,n:'E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:.5 E4:4 F4 F4 F4:1.5 F4:.5 F4 E4 E4 E4:.5 E4:.5 E4 D4 D4 E4 D4:2 G4:2 E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:.5 E4:4 F4 F4 F4:1.5 F4:.5 F4 E4 E4 E4:.5 E4:.5 G4 G4 F4 D4 C4:4'},
  {name:'Für Elise · Beethoven (đoạn mở đầu)',bpm:76,n:'E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:1.5 C4:.5 E4:.5 A4:.5 B4:1.5 E4:.5 G#4:.5 B4:.5 C5:1.5 E4:.5 E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:1.5 C4:.5 E4:.5 A4:.5 B4:1.5 E4:.5 C5:.5 B4:.5 A4:2'},
];
const NI={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
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
buildKeys();renderLane();showSongInfo();

/* sitting down and standing up */
const benchW=()=>PIANO.localToWorld(V(0,0,.78)),pb=$('#pianobar'),sitBtn=$('#sitbtn'),hud=root.querySelector('.hud');
function sit(){audio();const eye=PIANO.localToWorld(V(0,1.6,1.25)),look=PIANO.localToWorld(V(0,.15,-.55));
  rider=null;mode='piano';controls.enabled=false;dpad.hidden=true;sitBtn.hidden=true;canvas.classList.remove('walk');
  $('#m-orbit').setAttribute('aria-pressed',false);$('#m-walk').setAttribute('aria-pressed',false);setActive(null);
  controls.target.copy(look);flyTo(eye,look,1.0,()=>{pb.hidden=false;hud.classList.add('playing');hint.textContent='';});}
function standUp(){stopDemo();releaseAll();setPedal(false);pb.hidden=true;hud.classList.remove('playing');
  const sp=PIANO.localToWorld(V(0,0,1.55)),c=PIANO.localToWorld(V(0,0,-.6));camera.position.set(sp.x,PY+1.6,sp.z);
  yaw=Math.atan2(c.x-sp.x,-(c.z-sp.z));pitch=.15;eyeY=PY+1.6;level=6;mode='walk';canvas.classList.add('walk');dpad.hidden=false;
  $('#m-walk').setAttribute('aria-pressed',true);setHint();}
$('#pb-up').addEventListener('click',standUp);sitBtn.addEventListener('click',sit);
root.querySelector('[data-action=play]').addEventListener('click',sit);
addEventListener('keydown',e=>{if(mode!=='piano'){if(!window.__POTA&&mode==='walk'&&e.code==='KeyE'&&!sitBtn.hidden){e.preventDefault();sit();}return;}
  if(/^(INPUT|TEXTAREA)$/.test(e.target?.tagName||'')||e.target?.isContentEditable)return;
  if(e.target&&e.target.tagName==='SELECT'&&!KEYMAP[e.code]&&e.code!=='Escape')return;
  e.stopImmediatePropagation();
  if(e.key==='Escape'){standUp();return;}
  if(e.code==='Space'){e.preventDefault();if(!e.repeat)setPedal(true);return;}
  if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();setShift(shift+(e.code==='ArrowLeft'?-1:1));return;}
  const r=KEYMAP[e.code];if(r===undefined||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;e.preventDefault();if(e.target&&e.target.blur)e.target.blur();keyDown(r+12*shift);},true);
addEventListener('keyup',e=>{if(mode!=='piano')return;if(e.code==='Space'){setPedal(false);return;}const r=KEYMAP[e.code];if(r!==undefined)keyUp(r+12*shift);},true);
addEventListener('blur',()=>{for(const m in held)keyUp(+m);setPedal(false);});
function updateSit(){if(mode!=='walk'){if(!sitBtn.hidden)sitBtn.hidden=true;return;}const b=benchW(),p=camera.position;
  const near=Math.hypot(p.x-b.x,p.z-b.z)<1.7&&level===6;if(sitBtn.hidden===near)sitBtn.hidden=!near;}

function enterWalk(p,yw,lvl){setActive(null);$('#m-orbit').setAttribute('aria-pressed',false);$('#m-walk').setAttribute('aria-pressed',true);
  hint.textContent='Đang đưa bạn tới nơi…';const f=V(Math.sin(yw),0,-Math.cos(yw));
  flyTo(p.clone(),p.clone().addScaledVector(f,6),1.1,()=>{mode='walk';level=lvl;controls.enabled=false;yaw=yw;pitch=0;eyeY=p.y;canvas.classList.add('walk');dpad.hidden=false;setHint();});}
function setMode(m){
  if(mode==='piano')standUp();
  if(m===mode)return;
  $('#m-orbit').setAttribute('aria-pressed',m==='orbit');$('#m-walk').setAttribute('aria-pressed',m==='walk');
  if(m==='walk'){enterWalk(V(0,1.6,22),0,6);
  }else{mode='orbit';rider=null;canvas.classList.remove('walk');dpad.hidden=true;controls.enabled=true;
    const f=V(Math.sin(yaw),0,-Math.cos(yaw));controls.target.copy(camera.position).addScaledVector(f,4);controls.target.y=1;tween=null;setHint();}
}
$('#m-orbit').addEventListener('click',()=>setMode('orbit'));
$('#m-walk').addEventListener('click',()=>setMode('walk'));
const KMAP={KeyW:'f',ArrowUp:'f',KeyS:'b',ArrowDown:'b',KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r'};
addEventListener('keydown',e=>{if(mode==='piano')return;if(e.key==='Escape'&&mode==='walk'&&!window.__POTA){setMode('orbit');return;}
  if(mode!=='walk')return;if(window.__POTA){if(rider&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||'')&&!e.target?.isContentEditable&&e.key.length===1&&'1234670'.includes(e.key))requestFloor(rider,e.key==='0'?10:+e.key);return;}if(KMAP[e.code]){keys[KMAP[e.code]]=1;e.preventDefault();}if(e.key==='Shift')keys.run=1;
  if(rider&&e.key.length===1&&'1234670'.includes(e.key))requestFloor(rider,e.key==='0'?10:+e.key);});
addEventListener('keyup',e=>{if(KMAP[e.code])keys[KMAP[e.code]]=0;if(e.key==='Shift')keys.run=0;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=0;});
dpad.querySelectorAll('button').forEach(b=>{const k=b.dataset.k;
  const on=e=>{e.preventDefault();keys[k]=1;b.classList.add('held');try{b.setPointerCapture(e.pointerId);}catch(_){}};
  const off=()=>{keys[k]=0;b.classList.remove('held');};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);});
let look=null;
canvas.addEventListener('pointerdown',e=>{if(mode!=='walk'||window.__POTA)return;look={x:e.clientX,y:e.clientY};try{canvas.setPointerCapture(e.pointerId);}catch(_){}});
canvas.addEventListener('pointermove',e=>{if(!look||mode!=='walk'||window.__POTA)return;const s=(touch?.006:.0045)*(window.__LOOK_K||1);
  yaw+=(e.clientX-look.x)*s;pitch+=(e.clientY-look.y)*s;pitch=Math.max(-1.2,Math.min(1.2,pitch));look={x:e.clientX,y:e.clientY};});
const endLook=()=>look=null;canvas.addEventListener('pointerup',endLook);canvas.addEventListener('pointercancel',endLook);

$('#t-lamp').addEventListener('click',e=>{lampOn=!lampOn;e.currentTarget.setAttribute('aria-pressed',lampOn);});
$('#t-night').addEventListener('click',e=>{nightTarget=nightTarget?0:1;e.currentTarget.setAttribute('aria-pressed',!!nightTarget);});

$('#meta').textContent=`${tables} bàn · ${seats} chỗ ngồi · tầng 7 thêm ${seats7} chỗ · 3 thang máy · 1 đàn piano`;

let started=false;
function intro(){const {p,t}=viewPose('overview');camera.position.copy(p).sub(t).multiplyScalar(1.45).add(t).add(V(18,6,0));controls.target.copy(t);flyTo(p,t,2.2);}
setHint();

let last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;
  if(tween){const k=Math.min(1,(now-tween.s)/tween.d),e=ease(k);
    camera.position.lerpVectors(tween.p0,tween.p1,e);controls.target.lerpVectors(tween.t0,tween.t1,e);camera.lookAt(controls.target);
    if(k>=1){const d=tween.done;tween=null;d&&d();}}
  if(mode==='walk'){
    const sp=(keys.run?6:3)*dt*(window.__WALK_K||1),fx=Math.sin(yaw),fz=-Math.cos(yaw);
    let mx=(keys.f-keys.b)*fx+(keys.r-keys.l)*-fz, mz=(keys.f-keys.b)*fz+(keys.r-keys.l)*fx;
    const len=Math.hypot(mx,mz),p=camera.position;
    if(len>0){mx=mx/Math.max(1,len)*sp;mz=mz/Math.max(1,len)*sp;if(!blocked(p.x+mx,p.z,p.x,p.z))p.x+=mx;if(!blocked(p.x,p.z+mz,p.x,p.z))p.z+=mz;}
    rider=LIFTS.find(l=>inCab(l,p.x,p.z)&&(l.phase==='moving'||l.floor===level))||null;
    if(rider)eyeY=rider.y+1.6;else eyeY+=((baseY(p.x,p.z)+1.6)-eyeY)*Math.min(1,dt*10);p.y=eyeY;
    camera.rotation.order='YXZ';camera.rotation.set(-pitch,-yaw,0);
  }else if(!tween&&mode==='orbit'){controls.update();}
  updateLifts(dt);updateSit();
  if(Math.abs(nightTarget-night)>.001){night+=(nightTarget-night)*Math.min(1,dt*3);applyNight(night);applyLamp(lampLvl);}
  const lt=lampOn?1:0;if(Math.abs(lt-lampLvl)>.001){lampLvl+=(lt-lampLvl)*Math.min(1,dt*6);applyLamp(lampLvl);}
  {const show=mode==='walk'||camera.position.y<CH-.05||forceRoof;ceilingGroup.visible=show;roofG.visible=show;}
  ME.onFrame&&ME.onFrame(dt,now,camera);ctx.world.background=scene.background;renderer.render(ctx.world,camera);ME.afterFrame&&ME.afterFrame();}
applyNight(0);applyLamp(1);
/* ---------- module interface ---------- */
function arrive(fl,idx,pose){const l=LIFTS[idx%LIFTS.length];l.floor=fl;l.y=LBASE[fl];l.cab.position.y=l.y;l.cab.visible=true;l.phase='idle';l.target=null;l.door=0;l.hold=2.8;l.key='';
  level=fl;rider=l;mode='walk';tween=null;forceRoof=false;controls.enabled=false;eyeY=l.y+1.6;
  if(pose){yaw=pose.yaw;pitch=pose.pitch;camera.position.set(pose.x,eyeY,pose.z);}else{yaw=-PI/2;pitch=0;camera.position.set(WR+1.25,eyeY,l.z);}
  camera.rotation.order='YXZ';camera.rotation.set(-pitch,-yaw,0);
  canvas.classList.add('walk');dpad.hidden=false;setActive(null);$('#m-orbit').setAttribute('aria-pressed',false);$('#m-walk').setAttribute('aria-pressed',true);setHint();}
const lights=[];scene.traverse(o=>{if(o.isLight)lights.push(o);});
Object.assign(ME,{api:{camera,controls,scene,viewPose,flyTo,keys,cameraInside,PIANO,sit,pianoRemote,pianoRemoteGain,pianoRemoteReset,/*[piano-net]*/MZ,ROOF,plantColliders:cols7,get yaw(){return yaw;},set yaw(v){yaw=v;},get pitch(){return pitch;},set pitch(v){pitch=v;},get level(){return level;},get rider(){return rider;},inLift:()=>mode==='walk'&&LIFTS.some(l=>inCab(l,camera.position.x,camera.position.z)&&(l.phase==='moving'||l.phase==='xfer'?rider===l:l.floor===level)),blockedAt:(x,z,lv)=>{const o=level;level=lv;try{return blocked(x,z,x,z);}finally{level=o;}},groundY,ext:on=>{if(on){if(mode==="piano")standUp();mode="ext";tween=null;rider=null;controls.enabled=false;dpad.hidden=true;canvas.classList.remove("walk");for(const k in keys)keys[k]=0;}},walkNow:(p,yw,lv)=>{tween=null;rider=null;mode="walk";level=lv;eyeY=p.y;controls.enabled=false;yaw=yw;pitch=0;camera.position.copy(p);camera.rotation.order="YXZ";camera.rotation.set(0,-yaw,0);canvas.classList.add("walk");dpad.hidden=false;},setNight:v=>{nightTarget=v;},getMode:()=>mode,walkAt:(p,yw)=>{if(mode!=="orbit")setMode("orbit");enterWalk(p,yw,6);},stopWalk:()=>{if(mode!=="orbit")setMode("orbit");},orbitTo:(p,t,d)=>{if(mode!=="orbit")setMode("orbit");controls.enabled=true;flyTo(p,t,d==null?1:d);},orbit:(x,y,z)=>{setMode("orbit");controls.enabled=true;controls.target.set(x,y,z);},busy:()=>!!tween},floors:OWN,group:scene,lights,
  activate(arr){root.hidden=false;renderer.shadowMap.needsUpdate=true;last=performance.now();
    if(arr)arrive(arr.floor,arr.idx,arr.pose);else{controls.enabled=mode==='orbit';if(!started)intro();}started=true;},
  deactivate(){if(mode==='piano')standUp();root.hidden=true;controls.enabled=false;for(const k in keys)keys[k]=0;ceilingGroup.visible=true;roofG.visible=true;
    for(const l of LIFTS){l.cab.visible=true;if(l.phase!=='idle'){l.phase='idle';l.target=null;l.key='';}}rider=null;},
  hideCab(i,v){LIFTS[i%LIFTS.length].cab.visible=v;},
  otherVisible:()=>true,
  resize(w,h){camera.aspect=w/h;camera.updateProjectionMatrix();},
  frame});
return ME;

}

function moduleC(ctx,root){"use strict";window.__SEATTAG="C";
const ME={};
const $=s=>root.querySelector(s);
const canvasEl=ctx.canvas;
const canvas={addEventListener:(t,f,o)=>canvasEl.addEventListener(t,e=>{if(ctx.cur===ME)f(e);},o),classList:canvasEl.classList,
  getBoundingClientRect:()=>canvasEl.getBoundingClientRect(),setPointerCapture:i=>{try{canvasEl.setPointerCapture(i);}catch(_){}}};
const addEventListener=(t,f,o)=>window.addEventListener(t,e=>{if(ctx.cur===ME)f(e);},o);
const renderer=ctx.renderer,PI=Math.PI;
const scene=new THREE.Group();ctx.world.add(scene);
const camera=new THREE.PerspectiveCamera(45,1,0.5,1600);
const controls=new THREE.OrbitControls(camera,canvasEl);
controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=1.45;controls.minDistance=3;controls.maxDistance=520;controls.screenSpacePanning=true;controls.enabled=false;

/* ---------- helpers ---------- */
let seed=20261103;
const R=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const lin=c=>new THREE.Color(c).convertSRGBToLinear();
const mc={};
function mat(c,o){const k=c+'|'+JSON.stringify(o||{});if(mc[k])return mc[k];const m=new THREE.MeshStandardMaterial(Object.assign({roughness:.85,metalness:0},o||{}));
  m.color=lin(c);if(o&&o.emissive)m.emissive=lin(o.emissive);return mc[k]=m;}
const gc={};
const box=(w,h,d)=>gc['b'+w+','+h+','+d]||(gc['b'+w+','+h+','+d]=new THREE.BoxGeometry(w,h,d));
const cyl=(a,b,h,s=16)=>gc['c'+a+','+b+','+h+','+s]||(gc['c'+a+','+b+','+h+','+s]=new THREE.CylinderGeometry(a,b,h,s));
const sph=new THREE.SphereGeometry(1,12,9),ico=new THREE.IcosahedronGeometry(1,1);
function mk(g,m,x=0,y=0,z=0,parent=scene,cast=true){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o;}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.userData={canvas:c,draw};return t;}
const T=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(sx,sy,sz));
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const PROPS={};const part=(g,m,t,cast)=>({g,m,t:t||T(),cast});
function defineProp(n,parts){PROPS[n]={parts,list:[]};}
function place(n,x,y,z,ry=0,s=1,sy){if(/^(chair|sofa|arm|cube)/.test(n))(window.__SEATLOG=window.__SEATLOG||[]).push({tag:window.__SEATTAG,n:n,x:x,y:y,z:z,ry:ry});PROPS[n].list.push(T(x,y,z,0,ry,0,s,sy||s,s));}
function buildProps(){const tmp=new THREE.Matrix4();for(const k in PROPS){const P=PROPS[k];if(!P.list.length)continue;
  for(const p of P.parts){const im=new THREE.InstancedMesh(p.g,p.m,P.list.length);im.userData.propName=k;P.list.forEach((M,i)=>{tmp.multiplyMatrices(M,p.t);im.setMatrixAt(i,tmp);});
    im.castShadow=p.cast!==false;im.receiveShadow=true;im.frustumCulled=false;scene.add(im);}}}
const cols=[];   // walking colliders: rectangles [x0,x1,z0,z1] and circles [x,z,r]
const solid=(x0,x1,z0,z1)=>cols.push([x0,x1,z0,z1]);
const textT=[];
function label(text,w,h,bg,fg,font,x,y,z,ry=0,parent=scene){const t=canvasTex(Math.round(w*64),Math.round(h*64),(g,cw,ch)=>{if(bg){g.fillStyle=bg;g.fillRect(0,0,cw,ch);}else g.clearRect(0,0,cw,ch);
    g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';const lines=text.split('\n');g.font=font.replace('$',Math.round(ch*.62/lines.length)+'px');
    lines.forEach((ln,i)=>g.fillText(ln,cw/2,ch*(i+.55)/lines.length));});
  textT.push(t);const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,transparent:!bg,roughness:.6}));p.position.set(x,y,z);p.rotation.y=ry;parent.add(p);return p;}

/* ---------- the ground: one painted map of grass, pink paving, roads and markings ---------- */
const S=170,N=4096,k=N/(2*S),X=x=>(x+S)*k,Z=z=>(z+S)*k;
const groundTex=canvasTex(N,N,(g)=>{
  g.fillStyle='#78bf55';g.fillRect(0,0,N,N);
  for(let i=0;i<9000;i++){g.fillStyle=`rgba(${R()<.5?'40,110,30':'170,220,110'},${.08+R()*.1})`;g.beginPath();g.arc(R()*N,R()*N,3+R()*14,0,7);g.fill();}
  const pave=(x0,x1,z0,z1,r=0)=>{g.fillStyle='#eec3bd';g.beginPath();if(g.roundRect)g.roundRect(X(x0),Z(z0),(x1-x0)*k,(z1-z0)*k,r*k);else g.rect(X(x0),Z(z0),(x1-x0)*k,(z1-z0)*k);g.fill();};
  /* pink paving: sidewalks, plazas, building forecourts */
  pave(-S,S,35,42);pave(-S,S,54,61);
  pave(-38,40,-38,35,3);pave(-138,-48,20,35,3);pave(-118,-56,-30,-2);pave(-120,46,-92,-82);pave(48,154,22,35,3);pave(-164,-136,14,35,2);
  pave(-152,-58,61,104,3);pave(56,154,-122,-22,10);pave(-130,154,-146,-134);pave(-48,-40,35,42);
  /* pale tile grid over the paving */
  g.save();g.globalCompositeOperation='source-atop';g.restore();
  const roadPath=(pts,w,col,dash)=>{g.strokeStyle=col;g.lineWidth=w*k;g.lineJoin='round';g.lineCap='butt';if(dash)g.setLineDash(dash.map(v=>v*k));else g.setLineDash([]);
    g.beginPath();pts.forEach((p,i)=>{if(p.q)g.quadraticCurveTo(X(p.q[0]),Z(p.q[1]),X(p.x),Z(p.z));else if(i)g.lineTo(X(p.x),Z(p.z));else g.moveTo(X(p.x),Z(p.z));});g.stroke();};
  const P=(x,z,q)=>({x,z,q});
  const roads=[
    [P(-142,48),P(-142,-112),P(-122,-130,[-142,-130]),P(160,-130)],
    [P(-44,48),P(-44,-62),P(-28,-78,[-44,-78]),P(32,-78),P(48,-62,[48,-78])],
    [P(48,48),P(48,-130)],
    [P(48,-14),P(144,-14),P(160,-30,[160,-14]),P(160,-114),P(144,-130,[160,-130])]];
  for(const r of roads)roadPath(r,15,'#efc4bd');
  for(const r of roads)roadPath(r,9,'#5b6069');
  for(const r of roads)roadPath(r,.35,'#f4f4f0',[3,3]);
  /* main road with a double yellow line */
  g.fillStyle='#565b64';g.fillRect(0,Z(42),N,12*k);g.fillStyle='#e9c341';g.fillRect(0,Z(47.75),N,.18*k);g.fillRect(0,Z(48.1),N,.18*k);
  g.fillStyle='#f4f4f0';g.fillRect(0,Z(42.3),N,.2*k);g.fillRect(0,Z(53.5),N,.2*k);
  g.setLineDash([3*k,3*k]);g.strokeStyle='#f4f4f0';g.lineWidth=.2*k;for(const z of [45,51]){g.beginPath();g.moveTo(0,Z(z));g.lineTo(N,Z(z));g.stroke();}g.setLineDash([]);
  /* zebra crossings */
  const zebra=(x,z0,z1,w)=>{g.fillStyle='#f6f6f2';for(let z=z0;z<z1;z+=1.2)g.fillRect(X(x-w/2),Z(z),w*k,.6*k);};
  zebra(0,42.5,53.5,5);zebra(-44,42.5,53.5,5);zebra(48,42.5,53.5,5);
  const zebraX=(z,x0,x1,w)=>{g.fillStyle='#f6f6f2';for(let x=x0;x<x1;x+=1.2)g.fillRect(X(x),Z(z-w/2),.6*k,w*k);};
  zebraX(25,-48.5,-39.5,4);zebraX(25,43.5,52.5,4);zebraX(-40,43.5,52.5,4);
  /* tile joints on the paving */
  g.strokeStyle='rgba(255,255,255,.28)';g.lineWidth=1;for(let i=0;i<N;i+=Math.round(1.5*k)){g.beginPath();g.moveTo(i,0);g.lineTo(i,N);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(N,i);g.stroke();}
  /* parking bays */
  g.strokeStyle='#ffffff';g.lineWidth=.15*k;for(let x=-162;x<-136;x+=2.2){g.beginPath();g.moveTo(X(x),Z(16));g.lineTo(X(x),Z(24));g.stroke();}
});
groundTex.anisotropy=renderer.capabilities.getMaxAnisotropy();
{const gr=new THREE.Mesh(new THREE.PlaneGeometry(2*S,2*S),new THREE.MeshStandardMaterial({map:groundTex,roughness:.95}));gr.rotation.x=-PI/2;gr.receiveShadow=true;scene.add(gr);
  const far=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),mat('#6fb04e'));far.rotation.x=-PI/2;far.position.y=-.05;scene.add(far);}

/* ---------- sky dome and distant city ---------- */
const skyTex=canvasTex(64,512,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#3d8fe0');gr.addColorStop(.45,'#8cc8f2');gr.addColorStop(.52,'#d8eefb');gr.addColorStop(1,'#d8eefb');g.fillStyle=gr;g.fillRect(0,0,w,h);});
const skyMat=new THREE.MeshBasicMaterial({map:skyTex,side:THREE.BackSide,fog:false,depthWrite:false});
const sky=new THREE.Mesh(new THREE.SphereGeometry(700,32,16),skyMat);scene.add(sky);
const cloudM=new THREE.MeshBasicMaterial({color:0xffffff,fog:false,transparent:true,opacity:.95});
for(let i=0;i<18;i++){const a=R()*PI*2,r=480+R()*120,cx=Math.cos(a)*r,cz=Math.sin(a)*r,cy=120+R()*90;const g=new THREE.Group();g.position.set(cx,cy,cz);scene.add(g);
  for(let j=0;j<5;j++){const c=new THREE.Mesh(sph,cloudM);c.scale.set(18+R()*14,9+R()*6,14+R()*8);c.position.set(j*16-32,(j%2)*5,R()*8);g.add(c);}}
const cityWin=canvasTex(128,256,(g,w,h)=>{g.fillStyle='#b8cbe6';g.fillRect(0,0,w,h);g.fillStyle='#e9f1fb';for(let y=8;y<h;y+=16)for(let x=8;x<w;x+=16)g.fillRect(x,y,9,9);});
cityWin.wrapS=cityWin.wrapT=THREE.RepeatWrapping;
for(let i=0;i<46;i++){const x=-330+i*15+R()*6,z=-250-R()*70,w=10+R()*12,h=28+R()*70,d=10+R()*10;
  const t=cityWin.clone();t.needsUpdate=true;t.repeat.set(w/8,h/16);const b=new THREE.Mesh(box(w,h,d),new THREE.MeshBasicMaterial({map:t,fog:true}));b.position.set(x,h/2,z);scene.add(b);}

/* ---------- buildings ---------- */
function facadeTex(kind){return canvasTex(256,256,(g,w,h)=>{const glow=kind==='glow';g.fillStyle=glow?'#000':'#f1f2f8';g.fillRect(0,0,w,h);
  if(!glow){g.fillStyle='#e2e4ee';g.fillRect(0,h-26,w,10);g.fillStyle='#d6d8e4';g.fillRect(w/2-6,0,12,h);}
  for(const x0 of [22,138]){g.fillStyle=glow?'#ffd98a':'#3e6fb6';g.fillRect(x0,40,96,150);if(!glow){g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x0+8,48,14,120);
      g.fillStyle='#f6f7fb';g.fillRect(x0,110,96,6);g.fillRect(x0+46,40,5,150);g.fillStyle='#c9ccd9';g.fillRect(x0-6,190,108,10);}}});}
const facade=facadeTex(),facadeGlow=facadeTex('glow');
const winMats=[];
function facadeMat(len,floors){const t=facade.clone(),e=facadeGlow.clone();for(const q of [t,e]){q.needsUpdate=true;q.wrapS=q.wrapT=THREE.RepeatWrapping;q.repeat.set(Math.max(1,Math.round(len/7)),floors);}
  const m=new THREE.MeshStandardMaterial({map:t,emissiveMap:e,emissive:lin('#ffe2a0'),emissiveIntensity:0,roughness:.6});winMats.push(m);return m;}
const roofM=mat('#d8d6de',{roughness:.8}),wallW=mat('#f4f4f9',{roughness:.7}),trimM=mat('#e4e5ee');
/* a block with windows on every side, a parapet and a couple of stair houses on the roof */
function block(x0,x1,z0,z1,floors,o={}){const w=x1-x0,d=z1-z0,h=floors*4,cx=(x0+x1)/2,cz=(z0+z1)/2;
  const mats=[facadeMat(d,floors),facadeMat(d,floors),roofM,roofM,facadeMat(w,floors),facadeMat(w,floors)];
  const b=new THREE.Mesh(box(w,h,d),mats);b.position.set(cx,h/2,cz);b.castShadow=b.receiveShadow=true;scene.add(b);
  mk(box(w+.4,.9,.4),trimM,cx,h+.45,z0+.2);mk(box(w+.4,.9,.4),trimM,cx,h+.45,z1-.2);mk(box(.4,.9,d),trimM,x0+.2,h+.45,cz);mk(box(.4,.9,d),trimM,x1-.2,h+.45,cz);
  mk(box(w,.5,.3),mat('#cfd2de'),cx,.25,z1+.05,scene,false);
  for(const fx of o.roofBoxes||[.25,.75])mk(box(5,3,4),wallW,x0+w*fx,h+1.5,cz);
  solid(x0-.4,x1+.4,z0-.4,z1+.4);return {h,cx,cz};}
/* an end tower in plain white with the building's name */
function tower(x0,x1,z0,z1,h,name,face='z',col='#2f7d3a'){const w=x1-x0,d=z1-z0;mk(box(w,h,d),wallW,(x0+x1)/2,h/2,(z0+z1)/2);mk(box(w+.4,.8,d+.4),trimM,(x0+x1)/2,h+.4,(z0+z1)/2);
  if(face==='z')label(name,w*.8,w*.4,null,col,'800 $ "Be Vietnam Pro", system-ui, sans-serif',(x0+x1)/2,h*.62,z1+.06);
  else label(name,d*.8,d*.4,null,col,'800 $ "Be Vietnam Pro", system-ui, sans-serif',x1+.06,h*.62,(z0+z1)/2,PI/2);solid(x0-.4,x1+.4,z0-.4,z1+.4);}
function entrance(cx,z,w,dir=1,col='#e8eaf2'){const g=new THREE.Group();g.position.set(cx,0,z);g.rotation.y=dir>0?0:PI;scene.add(g);
  mk(box(w+2,.4,3.2),col===null?wallW:mat(col),0,4.4,1.6,g);mk(box(.5,4.4,.5),wallW,-w/2-.6,2.2,3,g);mk(box(.5,4.4,.5),wallW,w/2+.6,2.2,3,g);
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(w,3.6),new THREE.MeshStandardMaterial({color:lin('#3d5e8e'),roughness:.15,metalness:.3,emissive:lin('#ffd98a'),emissiveIntensity:0}));gl.position.set(0,1.8,.06);g.add(gl);winMats.push(gl.material);
  mk(box(w+3,.3,2),mat('#e0d9d3'),0,.15,4.2,g);}

/* D3 – D5 – connecting wing – D7 – D9 */
block(-128,-58,-4,22,6);tower(-62,-53,-6,24,26,'D3');entrance(-95,22,6);
block(-134,-118,-104,-4,6,{roofBoxes:[.2,.5,.8]});
block(-118,-64,-52,-30,6);tower(-68,-59,-54,-28,26,'D5');entrance(-92,-30,5);
block(-118,48,-114,-94,6,{roofBoxes:[.15,.45,.75]});
tower(46,58,-118,-90,28,'D9');
{const g=entrance(-35,-94,9);label('D7',7,2.6,'#f4f4f9','#2f7d3a','800 $ "Be Vietnam Pro", system-ui, sans-serif',-35,5.9,-89.6);}
entrance(10,-94,7);
/* OCE and D2C by the pond */
block(54,110,6,28,3,{roofBoxes:[.3,.7]});
label('TÒA NHÀ ĐIỀU HÀNH - HỢP TÁC QUỐC TẾ (OCE)',30,1.6,'#ffffff','#1f50b5','800 $ "Be Vietnam Pro", system-ui, sans-serif',80,10.3,28.1);
label('OCE',5,2.2,'#1f50b5','#ffffff','800 $ "Be Vietnam Pro", system-ui, sans-serif',66,7.6,28.12);
{const ent=entrance(84,28,7,1,'#c9473a');mk(box(9,.5,3.6),mat('#c9473a'),84,4.6,29.8);}
block(110,140,-6,28,5,{roofBoxes:[.5]});label('D2C',8,3.2,null,'#2f7d3a','800 $ "Be Vietnam Pro", system-ui, sans-serif',125,13,28.1);entrance(125,28,5);
/* C7 across the road */
block(-142,-70,66,90,4,{roofBoxes:[.3,.7]});mk(box(20,4,1),wallW,-106,14,90.6);label('C7',12,3.2,'#ffffff','#1f50b5','800 $ "Be Vietnam Pro", system-ui, sans-serif',-106,10.4,91.2);entrance(-106,90,8);

/* ---------- Thư viện Tạ Quang Bửu ---------- */
const libSign=canvasTex(1024,256,(g,w,h)=>{g.fillStyle='#fbf6ec';g.fillRect(0,0,w,h);g.strokeStyle='#c98a3a';g.lineWidth=10;g.strokeRect(8,8,w-16,h-16);
  g.strokeStyle='#c27a2b';g.lineWidth=9;g.lineJoin='round';g.beginPath();g.moveTo(60,80);g.quadraticCurveTo(110,60,150,86);g.quadraticCurveTo(190,60,240,80);g.lineTo(240,180);g.quadraticCurveTo(190,160,150,186);g.quadraticCurveTo(110,160,60,180);g.closePath();g.stroke();
  g.beginPath();g.moveTo(150,86);g.lineTo(150,186);g.stroke();g.fillStyle='#c27a2b';g.textBaseline='middle';g.font='700 70px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Thư viện',290,92);g.fillText('Tạ Quang Bửu',290,172);});
textT.push(libSign);
const LIB={z:8};
{const cz=-7,zf=LIB.z;
  block(-16,16,-22,zf-4,8,{roofBoxes:[.25,.75]});
  /* front block of the centre: white stone face, blue top band, sign, louvres, clock, glass entrance */
  const fx=new THREE.Group();fx.position.set(0,0,zf-4);scene.add(fx);
  mk(box(22,33,4),wallW,0,16.5,2,fx);mk(box(22.4,1.4,4.4),mat('#2a54b8'),0,32.2,2,fx);mk(box(22.4,.5,4.4),mat('#ffffff'),0,31.2,2,fx);
  const fw=facadeMat(22,4);const f=new THREE.Mesh(new THREE.PlaneGeometry(18,13),fw);f.position.set(0,23.5,4.02);fx.add(f);fw.map.repeat.set(4,4);fw.emissiveMap.repeat.set(4,4);
  const sg=new THREE.Mesh(new THREE.PlaneGeometry(12,3),new THREE.MeshStandardMaterial({map:libSign,roughness:.5}));sg.position.set(0,15,4.05);fx.add(sg);
  for(let i=0;i<7;i++)mk(box(20,.25,.5),mat('#cfd4df'),0,9.6+i*.55,4.1,fx,false);
  /* the clock on the front, keeping real time */
  const clockTex=canvasTex(256,256,(g,w)=>{g.fillStyle='#ffffff';g.beginPath();g.arc(w/2,w/2,w/2-6,0,7);g.fill();g.strokeStyle='#22283a';g.lineWidth=12;g.stroke();
    g.fillStyle='#22283a';for(let i=0;i<12;i++){g.save();g.translate(w/2,w/2);g.rotate(i/12*PI*2);g.fillRect(-4,-w/2+20,8,i%3?14:26);g.restore();}});
  const clock=new THREE.Group();clock.position.set(0,11.6,4.4);fx.add(clock);
  const cf=new THREE.Mesh(new THREE.CircleGeometry(1.9,40),new THREE.MeshBasicMaterial({map:clockTex}));clock.add(cf);
  mk(cyl(2.05,2.05,.3,40),mat('#22283a'),0,0,-.16,clock,false).rotation.x=PI/2;
  for(const [k2,wd,l] of [['h',.16,1.0],['m',.11,1.5]]){const p=new THREE.Group();p.position.z=.05+(k2==='m'?.03:0);clock.add(p);const hn=new THREE.Mesh(box(wd,l,.04),mat('#14161c'));hn.position.y=l/2-.15;p.add(hn);clock[k2]=p;}
  ME._clock=clock;
  /* entrance: glass doors, canopy, steps */
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(10,6.5),new THREE.MeshStandardMaterial({color:lin('#365a8c'),roughness:.12,metalness:.35,emissive:lin('#ffd98a'),emissiveIntensity:0}));gl.position.set(0,3.25,4.06);fx.add(gl);winMats.push(gl.material);
  for(let x=-5;x<=5;x+=2)mk(box(.18,6.5,.2),mat('#8c95a3',{metalness:.4}),x,3.25,4.1,fx,false);
  mk(box(14,.5,4),wallW,0,7,5.8,fx);for(let i=0;i<4;i++)mk(box(16+i*1.6,.18,1.2),mat('#e7e1da'),0,.09+(3-i)*.18,4.6+i*1.1,fx);
  /* lower wings */
  block(-27,-16,-20,zf-3,5,{roofBoxes:[.5]});block(16,27,-20,zf-3,5,{roofBoxes:[.5]});
  for(const s of [-1,1]){const tw=new THREE.Group();tw.position.set(s*13.5,0,zf-5);scene.add(tw);mk(box(4,36,4),wallW,0,18,0,tw);mk(box(4.4,.8,4.4),mat('#2a54b8'),0,36.4,0,tw);}
  /* HUST sign at the front of the plaza */
  mk(box(10,.8,1.6),mat('#3a2418'),0,.4,30);
  label('HUST',9,2.4,null,'#d32f2f','900 $ "Be Vietnam Pro", system-ui, sans-serif',0,1.9,30.2);
  const back=label('HUST',9,2.4,null,'#d32f2f','900 $ "Be Vietnam Pro", system-ui, sans-serif',0,1.9,29.8,PI);
  solid(-5,5,29.2,30.8);solid(-11.2,11.2,4,8);}

/* motorbike shed behind the library, parking for D3–D5 at the far left */
defineProp('bike',[part(box(.6,.55,1.7),mat('#2a2d36',{roughness:.5}),T(0,.75,0)),part(box(.5,.25,.7),mat('#c9473a'),T(0,1.05,-.2)),
  part(cyl(.3,.3,.12,12),mat('#14161c'),T(0,.3,.65,0,0,PI/2)),part(cyl(.3,.3,.12,12),mat('#14161c'),T(0,.3,-.65,0,0,PI/2))]);
function shed(x0,x1,z0,z1,signText){const cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0;
  const r=mk(box(w+1,.3,d+1),mat('#5e9ea8',{roughness:.5}),cx,3.6,cz);r.rotation.x=.04;
  for(let x=x0;x<=x1+.01;x+=w/Math.round(w/5))for(const z of [z0,z1])mk(cyl(.12,.12,3.5,8),mat('#8c95a3',{metalness:.4}),x,1.75,z);
  for(let x=x0+1;x<x1-.6;x+=1.1)for(const z of [cz-d/4,cz+d/4])place('bike',x,0,z,(R()-.5)*.2);
  if(signText){mk(box(w*.9,1.4,.2),mat('#d32f2f'),cx,4.6,z1+.4);label(signText,w*.86,1.2,null,'#ffffff','800 $ "Be Vietnam Pro", system-ui, sans-serif',cx,4.6,z1+.52);
    mk(cyl(1,1,.2,32),mat('#1f50b5'),x1-1.4,4.6,z1+.55).rotation.x=PI/2;label('P',1.6,1.6,null,'#ffffff','900 $ "Be Vietnam Pro", system-ui, sans-serif',x1-1.4,4.6,z1+.67);}
  solid(x0-.3,x1+.3,z0-.3,z1+.3);}
shed(-18,18,-58,-44);shed(-162,-138,18,32,'ĐIỂM TRÔNG GIỮ XE D3 - D5');

/* ---------- the lotus pond inside the loop road ---------- */
function rrShape(x0,x1,z0,z1,r){const s=new THREE.Shape();s.moveTo(x0+r,-z0);s.lineTo(x1-r,-z0);s.quadraticCurveTo(x1,-z0,x1,-z0-r);s.lineTo(x1,-z1+r);s.quadraticCurveTo(x1,-z1,x1-r,-z1);
  s.lineTo(x0+r,-z1);s.quadraticCurveTo(x0,-z1,x0,-z1+r);s.lineTo(x0,-z0-r);s.quadraticCurveTo(x0,-z0,x0+r,-z0);return s;}
const POND={x0:68,x1:148,z0:-110,z1:-34};
{const rim=new THREE.Shape(rrShape(POND.x0-2,POND.x1+2,POND.z0-2,POND.z1+2,14).getPoints(40));rim.holes.push(new THREE.Path(rrShape(POND.x0,POND.x1,POND.z0,POND.z1,12).getPoints(40)));
  const rg=new THREE.ExtrudeGeometry(rim,{depth:.6,bevelEnabled:false});rg.rotateX(-PI/2);const rm=new THREE.Mesh(rg,mat('#d9d3c9'));rm.castShadow=rm.receiveShadow=true;scene.add(rm);
  const wg=new THREE.ShapeGeometry(rrShape(POND.x0,POND.x1,POND.z0,POND.z1,12));wg.rotateX(-PI/2);
  const water=new THREE.Mesh(wg,new THREE.MeshStandardMaterial({color:lin('#2f8fa8'),roughness:.15,metalness:.1,emissive:lin('#0b3a52'),emissiveIntensity:.25}));water.position.y=.25;water.receiveShadow=true;scene.add(water);ME._water=water;
  defineProp('pad',[part(cyl(1,1,.05,14),mat('#3f9a3c',{roughness:.7}),T(0,.28,0),false)]);
  defineProp('lotus',[part(cyl(.05,.32,.35,7),mat('#f29bb8',{roughness:.6,emissive:'#5a1a2c',emissiveIntensity:.15}),T(0,.48,0),false),part(sph,mat('#ffe58a'),T(0,.62,0,0,0,0,.09,.06,.09),false)]);
  for(let i=0;i<420;i++){const x=POND.x0+4+R()*(POND.x1-POND.x0-8),z=POND.z0+4+R()*(POND.z1-POND.z0-8);if(Math.hypot(x-80,z-70)<12&&false)continue;
    place('pad',x,0,z,R()*6,.5+R()*.8);if(R()<.32)place('lotus',x+.2,0,z,R()*6,.8+R()*.5);}
  solid(POND.x0-2,POND.x1+2,POND.z0-2,POND.z1+2);}
/* weeping willow on the near-left bank */
{const g=new THREE.Group();g.position.set(POND.x0+6,0,POND.z1-10);scene.add(g);mk(box(6,.6,6),mat('#d9d3c9'),0,.3,0,g);
  const tr=mk(cyl(.45,.7,7,10),mat('#6b4a33'),0,4,0,g);tr.rotation.z=.08;
  const lm=[mat('#9ccf4a'),mat('#b9dd63'),mat('#82bd3f')];
  for(let i=0;i<70;i++){const a=R()*PI*2,r=1.5+R()*4.2,h=7+R()*2.5;const s=new THREE.Mesh(sph,lm[i%3]);s.scale.set(.5,2.2+R()*1.6,.5);s.position.set(Math.cos(a)*r,h-1.5-R()*1.5,Math.sin(a)*r);s.castShadow=true;g.add(s);}
  const crown=new THREE.Mesh(ico,lm[0]);crown.scale.set(4,2.6,4);crown.position.y=8.6;crown.castShadow=true;g.add(crown);}

/* ---------- trees, palms, lamps, benches, flower beds ---------- */
const trunkM=mat('#7a5232'),leaf=[mat('#3f9e3a'),mat('#4db544'),mat('#2f8a35'),mat('#5fc04c')],pink=mat('#f3a6c8'),yellow=mat('#f2d23a');
defineProp('trunk',[part(cyl(.28,.4,4,8),trunkM,T(0,2,0))]);
const crownProps={};for(const [n,m] of [['g0',leaf[0]],['g1',leaf[1]],['g2',leaf[2]],['pk',pink],['yl',yellow]]){defineProp(n,[part(ico,m,T(0,0,0))]);crownProps[n]=1;}
defineProp('pine',[part(cyl(.2,.3,2,8),trunkM,T(0,1,0)),part(new THREE.ConeGeometry(2.4,3.6,10),leaf[2],T(0,3.4,0)),part(new THREE.ConeGeometry(1.8,3,10),leaf[0],T(0,5.1,0))]);
const treesAt=[];
function tree(x,z,s=1,kind){const n=kind||['g0','g1','g2','g1','g0'][R()*5|0];place('trunk',x,0,z,0,s);
  for(let i=0;i<3;i++){const a=i*2.1+R(),r=(1+R()*.6)*s;PROPS[n].list.push(T(x+Math.cos(a)*r*.8,(4.6+R()*1.6)*s,z+Math.sin(a)*r*.8,R(),R(),0,(2.2+R()*.8)*s,(1.8+R()*.6)*s,(2.2+R()*.8)*s));}
  treesAt.push([x,z]);cols.push([x,z,.6*s]);}
const blocked=[[-136,-50,-118,26],[-30,30,-60,10],[50,144,-8,32],[-144,-66,62,92],[-166,-134,14,36],[44,166,-124,-18],[-170,170,36,62],[-150,-136,-120,40],[-50,-38,-80,48],[38,54,-132,48],[-124,166,-136,-124],[-118,50,-92,-82],[-40,40,-82,-74]];
const free=(x,z)=>!blocked.some(b=>x>b[0]-2&&x<b[1]+2&&z>b[2]-2&&z<b[3]+2);
function scatter(x0,x1,z0,z1,n,sMin,sMax,kinds){let c=0,tries=0;while(c<n&&tries<n*20){tries++;const x=x0+R()*(x1-x0),z=z0+R()*(z1-z0);if(!free(x,z))continue;
  if(treesAt.some(([a,b])=>Math.hypot(a-x,b-z)<4.5))continue;const kind=kinds?kinds[R()*kinds.length|0]:null;
  if(kind==='pine'){place('pine',x,0,z,R()*6,1+R()*.4);cols.push([x,z,.5]);treesAt.push([x,z]);}else tree(x,z,sMin+R()*(sMax-sMin),kind);c++;}}
scatter(-170,170,-170,-138,120,1.2,1.7);
scatter(-170,-150,-130,34,30,1.1,1.5,[null,null,'yl']);scatter(158,170,-130,34,10,1.1,1.5,[null,'pk']);
scatter(-48,166,64,110,46,1,1.4,[null,null,'pk','yl','pine']);
scatter(-150,-60,94,110,10,1,1.3,[null,'pk']);
scatter(-110,-68,-26,-6,6,.9,1.1,[null,'yl']);
scatter(-30,40,-74,-62,6,1,1.3);scatter(-38,-30,-36,30,5,1,1.2);scatter(30,40,-36,30,5,1,1.2);
scatter(54,150,-124,-114,6,1,1.2,['pk','yl',null]);scatter(150,166,-120,-20,6,1,1.3);
for(let x=-160;x<=160;x+=16){if([0,-44,48].some(c=>Math.abs(x-c)<8))continue;if(free(x,33))tree(x,33,.9);}
for(let x=-150;x<=150;x+=18){if(Math.abs(x+106)<12)continue;tree(x,62.5,.85,R()<.3?'pk':null);}
/* palms flanking the library forecourt */
function palm(x,z,h=11){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);let px=0,py=0;const bend=(R()-.5)*.3;
  for(let i=0;i<8;i++){const s=mk(cyl(.32-i*.015,.36-i*.015,h/8,8),mat(i%2?'#9a7651':'#8a6845'),px,py+h/16,0,g);s.rotation.z=bend*i/8;px+=Math.sin(bend*i/8)*h/8;py+=h/8;}
  for(let i=0;i<9;i++){const a=i/9*PI*2,f=new THREE.Group();f.position.set(px,py,0);f.rotation.set(0,a,0);g.add(f);
    const fr=new THREE.Mesh(sph,mat(i%2?'#3fa33a':'#2f8a35'));fr.scale.set(.5,.14,3.2);fr.position.set(0,-.6,2.6);fr.rotation.x=.45;fr.castShadow=true;f.add(fr);}
  cols.push([x,z,.6]);}
for(const [x,z] of [[-11,20],[11,20],[-24,14],[24,14],[-11,30],[11,30]])palm(x,z,z>25?9:12);
/* lamps */
const lampHead=mat('#fff3cf',{emissive:'#ffd98a',emissiveIntensity:.2});
defineProp('lamp',[part(cyl(.1,.14,5,8),mat('#2a2d36',{metalness:.4}),T(0,2.5,0)),part(box(.9,.12,.12),mat('#2a2d36'),T(0,5,0)),part(sph,lampHead,T(0,5.25,0,0,0,0,.32,.32,.32),false)]);
for(let x=-162;x<=162;x+=20){place('lamp',x,0,39.5);place('lamp',x+10,0,56.5);}
for(const [x,z] of [[-36,-20],[-36,0],[-36,20],[36,-20],[36,0],[36,20],[-140,-20],[-140,-60],[56,-120],[100,-122],[150,-122],[58,-26],[150,-26],[-60,26],[-130,26],[60,30],[150,30],[-60,60],[-150,60]]){place('lamp',x,0,z);cols.push([x,z,.3]);}
defineProp('bench',[part(box(2,.12,.6),mat('#b7834f'),T(0,.5,0)),part(box(2,.5,.1),mat('#b7834f'),T(0,.8,-.28)),part(box(.1,.5,.5),mat('#2a2d36'),T(-.85,.25,0)),part(box(.1,.5,.5),mat('#2a2d36'),T(.85,.25,0))]);
for(const x of [60,85,115,140])place('bench',x,0,-141,PI);for(const x of [-20,20])place('bench',x,0,-66);
/* flower beds along the forecourts */
defineProp('hedge',[part(box(1,1,1),mat('#4ea845',{roughness:.8}),T(0,.4,0,0,0,0,1,.8,1))]);
defineProp('bloom',[part(sph,mat('#f6a7c6',{emissive:'#40101e',emissiveIntensity:.1}),T(0,0,0,0,0,0,.18,.14,.18),false)]);
defineProp('bloomY',[part(sph,mat('#f6d43e'),T(0,0,0,0,0,0,.18,.14,.18),false)]);
function bed(x0,x1,z,w=1.4){for(let x=x0;x<x1;x+=1){PROPS.hedge.list.push(T(x+.5,0,z,0,0,0,1,1,w));for(let j=0;j<3;j++)place(R()<.5?'bloom':'bloomY',x+R(),.85+R()*.1,z+(R()-.5)*w*.8);}solid(x0,x1,z-w/2,z+w/2);}
bed(-30,-6,26);bed(6,30,26);bed(-120,-102,24.6);bed(-88,-66,24.6);bed(56,78,31);bed(92,108,31);bed(114,138,31);bed(-150,-118,95);bed(-96,-62,95);
for(const [a,b] of [[-160,-112],[-100,-50],[-40,-8],[8,40],[56,160]])bed(a,b,60.5,.9);bed(70,100,-29);bed(116,146,-29);

buildProps();
/* ---------- lighting ---------- */
const hemi=new THREE.HemisphereLight(0xeaf4ff,0x7a9a5a,.75);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff4e2,.95);sun.position.set(110,170,130);sun.target.position.set(0,0,-20);sun.castShadow=true;
{const s=sun.shadow;s.mapSize.set(2048,2048);Object.assign(s.camera,{left:-190,right:190,top:190,bottom:-190,near:10,far:500});s.camera.updateProjectionMatrix();s.bias=-.0006;s.normalBias=.08;}
scene.add(sun,sun.target);
const fog=new THREE.Fog(lin('#d8eefb'),260,760);
const DAY={hemi:.75,sun:.95,fogC:lin('#d8eefb'),sky:lin('#ffffff'),win:0,lamp:.2},EVE={hemi:.35,sun:.12,fogC:lin('#1a2238'),sky:lin('#2a3560'),win:.9,lamp:2.2};
let night=0,nightTarget=0;scene.background=DAY.fogC.clone();
function applyNight(t){const l=(a,b)=>a+(b-a)*t;hemi.intensity=l(DAY.hemi,EVE.hemi);sun.intensity=l(DAY.sun,EVE.sun);fog.color.copy(DAY.fogC).lerp(EVE.fogC,t);scene.background.copy(fog.color);
  skyMat.color.copy(DAY.sky).lerp(EVE.sky,t);cloudM.opacity=l(.95,.25);winMats.forEach(m=>m.emissiveIntensity=l(DAY.win,EVE.win));lampHead.emissiveIntensity=l(DAY.lamp,EVE.lamp);}

function redrawText(){for(const t of textT){const u=t.userData;u.draw(u.canvas.getContext('2d'),u.canvas.width,u.canvas.height);t.needsUpdate=true;}}
if(document.fonts&&document.fonts.load){Promise.all(['800 40px','900 40px','700 70px'].map(f=>document.fonts.load(f+' "Be Vietnam Pro"'))).then(redrawText).catch(()=>{});}

/* ---------- views ---------- */
const VIEWS={
  overview:{p:V(10,150,250),t:V(0,0,-25),fit:'over'},
  library:{p:V(0,12,72),t:V(0,14,0)},
  pond:{p:V(52,26,4),t:V(108,0,-72)},
  d3:{p:V(-30,22,70),t:V(-95,10,5)},
  d7:{p:V(-10,38,-40),t:V(-40,10,-104)},
  oce:{p:V(80,14,72),t:V(98,8,18)},
  c7:{p:V(-70,16,132),t:V(-106,8,80)},
  parking:{p:V(-118,10,56),t:V(-150,2,25)},
  top:{p:V(0,420,1),t:V(0,0,-10),fit:'top'}
};
function viewPose(name){const v=VIEWS[name];const p=v.p.clone(),t=v.t.clone(),a=camera.aspect;
  if(v.fit==='over'){const kk=Math.min(2.4,Math.max(1,Math.pow(1.7/a,.9)));p.sub(t).multiplyScalar(kk).add(t);}
  if(v.fit==='top'){p.y=Math.max(420,330/a+80);}return {p,t};}
let tween=null;const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
function flyTo(p,t,dur=1.6,done){const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;tween={p0:camera.position.clone(),t0:controls.target.clone(),p1:p,t1:t,s:performance.now(),d:reduce?1:dur*1000,done};}
const viewBtns=[...root.querySelectorAll('[data-view]')];
const setActive=n=>viewBtns.forEach(b=>b.classList.toggle('on',b.dataset.view===n));
function goView(n){if(mode==='walk')setMode('orbit');const {p,t}=viewPose(n);flyTo(p,t);setActive(n);}
viewBtns.forEach(b=>b.addEventListener('click',()=>goView(b.dataset.view)));
controls.addEventListener('start',()=>{tween=null;setActive(null);});

/* ---------- walking around campus ---------- */
let mode='orbit',yaw=0,pitch=0;const keys={f:0,b:0,l:0,r:0,run:0};
const touch=matchMedia('(pointer: coarse)').matches,hint=$('#hint'),dpad=$('#dpad');
function setHint(){hint.textContent=mode==='walk'?(touch?'Giữ nút mũi tên để đi · Vuốt để nhìn quanh · Đi vào cửa chính để vào thư viện':'W A S D để đi · Shift để chạy · Kéo để nhìn · Đi vào cửa chính để vào thư viện · Esc để thoát')
  :(touch?'Một ngón để xoay · Hai ngón để phóng to và dịch chuyển':'Kéo để xoay · Cuộn để phóng to · Kéo chuột phải để dịch chuyển');}
function hitC(x,z){if(x<-166||x>166||z<-166||z>112)return true;for(const c of cols){if(c.length===3){if(Math.hypot(x-c[0],z-c[1])<c[2]+.3)return true;}else if(x>c[0]-.3&&x<c[1]+.3&&z>c[2]-.3&&z<c[3]+.3)return true;}return false;}
function walkUI(){setActive(null);$('#m-orbit').setAttribute('aria-pressed',false);$('#m-walk').setAttribute('aria-pressed',true);}
function startWalk(x,z,yw){mode='walk';tween=null;controls.enabled=false;yaw=yw;pitch=0;camera.position.set(x,1.6,z);camera.rotation.order='YXZ';camera.rotation.set(0,-yaw,0);
  canvas.classList.add('walk');dpad.hidden=false;walkUI();setHint();}
function enterWalk(x,z,yw){walkUI();hint.textContent='Đang đưa bạn tới nơi…';const p=V(x,1.6,z),f=V(Math.sin(yw),0,-Math.cos(yw));flyTo(p,p.clone().addScaledVector(f,6),1.4,()=>startWalk(x,z,yw));}
function setMode(m){if(m===mode)return;$('#m-orbit').setAttribute('aria-pressed',m==='orbit');$('#m-walk').setAttribute('aria-pressed',m==='walk');
  if(m==='walk')enterWalk(0,47,0);
  else{mode='orbit';canvas.classList.remove('walk');dpad.hidden=true;controls.enabled=true;const f=V(Math.sin(yaw),0,-Math.cos(yaw));controls.target.copy(camera.position).addScaledVector(f,8);tween=null;setHint();}}
$('#m-orbit').addEventListener('click',()=>setMode('orbit'));$('#m-walk').addEventListener('click',()=>setMode('walk'));
root.querySelector('[data-action=enter]').addEventListener('click',()=>enterWalk(0,24,0));
const KMAP={KeyW:'f',ArrowUp:'f',KeyS:'b',ArrowDown:'b',KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r'};
addEventListener('keydown',e=>{if(e.key==='Escape'&&mode==='walk'&&!window.__POTA){setMode('orbit');return;}if(mode!=='walk'||window.__POTA)return;if(KMAP[e.code]){keys[KMAP[e.code]]=1;e.preventDefault();}if(e.key==='Shift')keys.run=1;});
addEventListener('keyup',e=>{if(KMAP[e.code])keys[KMAP[e.code]]=0;if(e.key==='Shift')keys.run=0;});
addEventListener('blur',()=>{for(const kk in keys)keys[kk]=0;});
dpad.querySelectorAll('button').forEach(b=>{const kk=b.dataset.k;const on=e=>{e.preventDefault();keys[kk]=1;b.classList.add('held');try{b.setPointerCapture(e.pointerId);}catch(_){}};
  const off=()=>{keys[kk]=0;b.classList.remove('held');};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);});
let look=null;
canvas.addEventListener('pointerdown',e=>{if(mode!=='walk'||window.__POTA)return;look={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!look||mode!=='walk'||window.__POTA)return;const s=(touch?.006:.0045)*(window.__LOOK_K||1);yaw+=(e.clientX-look.x)*s;pitch+=(e.clientY-look.y)*s;pitch=Math.max(-1.2,Math.min(1.3,pitch));look={x:e.clientX,y:e.clientY};});
const endLook=()=>look=null;canvas.addEventListener('pointerup',endLook);canvas.addEventListener('pointercancel',endLook);
$('#t-night').addEventListener('click',e=>{nightTarget=nightTarget?0:1;e.currentTarget.setAttribute('aria-pressed',!!nightTarget);});
$('#meta').textContent=`Khu D · Thư viện Tạ Quang Bửu · ${treesAt.length} cây xanh · hồ sen · 7 tòa nhà`;
setHint();

let started=false,last=performance.now();
function intro(){const {p,t}=viewPose('overview');camera.position.copy(p).add(V(-120,90,60));controls.target.copy(t);flyTo(p,t,2.4);}
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;
  if(tween){const kk=Math.min(1,(now-tween.s)/tween.d),e=ease(kk);camera.position.lerpVectors(tween.p0,tween.p1,e);controls.target.lerpVectors(tween.t0,tween.t1,e);camera.lookAt(controls.target);
    if(kk>=1){const d=tween.done;tween=null;d&&d();}}
  if(mode==='walk'){const sp=(keys.run?9:4)*dt,fx=Math.sin(yaw),fz=-Math.cos(yaw);
    let mx=(keys.f-keys.b)*fx+(keys.r-keys.l)*-fz,mz=(keys.f-keys.b)*fz+(keys.r-keys.l)*fx;const len=Math.hypot(mx,mz),p=camera.position;
    if(len>0){mx=mx/Math.max(1,len)*sp;mz=mz/Math.max(1,len)*sp;
      /* walking up to the library's glass doors takes you inside */
      if(p.z+mz<LIB.z+2.3&&Math.abs(p.x)<3.2&&p.z>LIB.z+1){keys.f=keys.b=keys.l=keys.r=0;ctx.enterLibrary();}
      else{if(!hitC(p.x+mx,p.z))p.x+=mx;if(!hitC(p.x,p.z+mz))p.z+=mz;}}
    p.y=1.6;camera.rotation.order='YXZ';camera.rotation.set(-pitch,-yaw,0);
  }else if(!tween&&mode==='orbit'){controls.update();if(camera.position.y<2)camera.position.y=2;}
  if(Math.abs(nightTarget-night)>.001){night+=(nightTarget-night)*Math.min(1,dt*3);applyNight(night);}
  {const d=new Date(),mi=d.getMinutes()+d.getSeconds()/60,hr=d.getHours()%12+mi/60,c=ME._clock;c.m.rotation.z=-mi/60*PI*2;c.h.rotation.z=-hr/12*PI*2;}
  sky.position.copy(camera.position).setY(0);
  ME.onFrame&&ME.onFrame(dt,now,camera);ctx.world.background=scene.background;renderer.render(ctx.world,camera);ME.afterFrame&&ME.afterFrame();}
applyNight(0);
const lights=[];scene.traverse(o=>{if(o.isLight)lights.push(o);});
Object.assign(ME,{api:{camera,controls,scene,hit:hitC,LIB,viewPose,flyTo,get fog(){return fog;},setNight:v=>{nightTarget=v;},getMode:()=>mode,ext:on=>{if(on){mode="ext";tween=null;controls.enabled=false;dpad.hidden=true;canvas.classList.remove("walk");}else{mode="orbit";controls.enabled=true;}},orbit:(x,y,z)=>{setMode("orbit");controls.enabled=true;controls.target.set(x,y,z);camera.position.set(x+18,y+14,z+18);},busy:()=>!!tween},floors:[],group:scene,lights,
  activate(arr){root.hidden=false;renderer.shadowMap.needsUpdate=true;last=performance.now();ctx.world.fog=fog;
    if(arr&&arr.fromLibrary)startWalk(0,LIB.z+3.6,PI);else{controls.enabled=mode==='orbit';if(!started)intro();}started=true;},
  deactivate(){root.hidden=true;controls.enabled=false;ctx.world.fog=null;for(const kk in keys)keys[kk]=0;},
  hideCab(){},otherVisible:()=>false,
  resize(w,h){camera.aspect=w/h;camera.updateProjectionMatrix();},frame});
return ME;
}

(function(){
"use strict";
const canvas=document.getElementById('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
const __Q=window.__SCENE_QUALITY||{pr:2,shadow:true};renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,__Q.pr));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.shadowMap.enabled=__Q.shadow!==false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
const world=new THREE.Scene();
const ctx={renderer,canvas,world,cur:null};
const rootA=document.getElementById('modA'),rootB=document.getElementById('modB'),rootC=document.getElementById('modC'),fade=document.getElementById('fade');
/* tầng 6–7–10 sit directly on top of tầng 4: their lift shafts line up with the ones below */
const OFF=new THREE.Vector3(3,19.4,0);
const A=moduleA(ctx,rootA),B=moduleB(ctx,rootB),C=moduleC(ctx,rootC);const rootD=document.getElementById("modD"),D=window.moduleD&&rootD?window.moduleD(ctx,rootD):null;
const other=m=>m===A?B:A,modFor=f=>f<=4?A:B;
let W=0,H=0;
function size(){const w=Math.max(document.documentElement.clientWidth,innerWidth||0),h=Math.max(document.documentElement.clientHeight,innerHeight||0);
  if(!w||!h)return false;if(w!==W||h!==H){W=w;H=h;renderer.setSize(w,h,false);}if(ctx.cur)ctx.cur.resize(w,h);return true;}
function place(mod){if(D&&mod===D){C.group.visible=false;C.lights.forEach(l=>l.visible=false);A.group.visible=B.group.visible=false;return;}C.group.visible=mod===C;C.lights.forEach(l=>l.visible=mod===C);if(mod===C){A.group.visible=B.group.visible=false;A.lights.forEach(l=>l.visible=false);B.lights.forEach(l=>l.visible=false);return;}
  if(mod===A){A.group.position.set(0,0,0);B.group.position.copy(OFF);}else{B.group.position.set(0,0,0);A.group.position.copy(OFF).negate();}
  mod.group.visible=true;A.lights.forEach(l=>l.visible=mod===A);B.lights.forEach(l=>l.visible=mod===B);}
function show(mod,arr){if(ctx.cur&&ctx.cur!==mod)ctx.cur.deactivate();ctx.cur=mod;place(mod);size();mod.activate(arr);}
/* a lift car that leaves one half hides the twin car of the other half; on arrival the other half takes over */
ctx.crossStart=(from,idx)=>other(from).hideCab(idx,false);
ctx.handoff=(from,floor,idx,pose)=>{const to=other(from),s=from===A?-1:1;pose.x+=s*OFF.x;pose.z+=s*OFF.z;show(to,{floor,idx,pose});};
let busy=false;
function hopTo(text,mod,arr,delay){if(busy)return;busy=true;fade.textContent=text;fade.classList.add('on');
  setTimeout(()=>{try{show(mod,arr);}finally{setTimeout(()=>{fade.classList.remove('on');busy=false;},250);}},delay);}
function hop(text,floor,idx,delay){if(busy)return;busy=true;fade.textContent=text;fade.classList.add('on');
  setTimeout(()=>{try{show(modFor(floor),{floor,idx});}finally{setTimeout(()=>{fade.classList.remove('on');busy=false;},250);}},delay);}
/* the “Đến tầng” picker: arrive inside a lift on that floor */
for(const r of [rootA,rootB]){const sel=r.querySelector('.floorsel');sel.addEventListener('change',()=>{const v=sel.value,f=+v;sel.value='';sel.blur();if(v==='c')hopTo('Ra khuôn viên trường…',C,null,650);else if(f)hop(`Đang đến tầng ${f}…`,f,1,650);});}
rootC.querySelector('.floorsel').addEventListener('change',e=>{const f=+e.target.value;e.target.value='';e.target.blur();if(f)hop(`Đang đến tầng ${f}…`,f,1,650);});
ctx.enterLibrary=()=>hopTo('Vào Thư viện Tạ Quang Bửu…',A,{entrance:true},700);
ctx.exitLibrary=()=>hopTo('Ra khuôn viên trường…',C,{fromLibrary:true},700);
addEventListener('resize',size);
if(window.ResizeObserver)new ResizeObserver(size).observe(document.documentElement);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fade.textContent='Trình duyệt tạm ngắt đồ họa. Hãy tải lại trang nếu cảnh không tự hiện lại.';fade.classList.add('on');});
canvas.addEventListener('webglcontextrestored',()=>{renderer.shadowMap.needsUpdate=true;fade.classList.remove('on');});
function loop(now){const cur=ctx.cur;if((cur===C||(D&&cur===D))&&W)cur.frame(now);else if(cur&&W){const o=other(cur);
    /* the other half stays out of the shadow pass, so it never darkens this one */
    o.group.visible=!renderer.shadowMap.needsUpdate&&cur.otherVisible();cur.frame(now);}
  requestAnimationFrame(loop);}
function boot(){if(!size()){requestAnimationFrame(boot);return;}show(C);requestAnimationFrame(loop);}
window.HUST3D={A,B,C,D,ctx,renderer,world,show,size,hopTo,get cur(){return ctx.cur;}};
boot();
window.dispatchEvent(new Event("hust3d-ready"));
})();

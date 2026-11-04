/* Sân thượng tầng 10 — tự sinh từ tools/nguon/tang10.html bởi tools/patch_tang10.py, đừng sửa tay */
window.moduleD=function(ctx,root){"use strict";const ME={};


const $=s=>root.querySelector(s);const canvasEl=ctx.canvas;
const canvas={addEventListener:(t,f,o)=>canvasEl.addEventListener(t,e=>{if(ctx.cur===ME)f(e);},o),classList:canvasEl.classList,getBoundingClientRect:()=>canvasEl.getBoundingClientRect(),setPointerCapture:i=>{try{canvasEl.setPointerCapture(i);}catch(_){}}};
const addEventListener=(t,f,o)=>window.addEventListener(t,e=>{if(ctx.cur===ME)f(e);},o);
const PI=Math.PI;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- renderer / scene ---------- */
const renderer=ctx.renderer;const DPR=renderer.getPixelRatio();
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(55,1,0.1,4000);
const controls=new THREE.OrbitControls(camera,canvasEl);controls.enabled=false;
controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=2.3;
controls.minDistance=1;controls.maxDistance=150;controls.screenSpacePanning=true;

/* ---------- helpers ---------- */
let seed=20261110;
const R=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const gauss=()=>{let u=0,v=0;while(!u)u=R();while(!v)v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*PI*v);};
const lin=c=>new THREE.Color(c).convertSRGBToLinear();
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const mc={};
function mat(c,o){const k=c+'|'+JSON.stringify(o||{});if(mc[k])return mc[k];
  const m=new THREE.MeshStandardMaterial(Object.assign({roughness:.85,metalness:0},o||{}));
  m.color=lin(c);if(o&&o.emissive)m.emissive=lin(o.emissive);return mc[k]=m;}
const gc={};
const box=(w,h,d)=>gc['b'+w+','+h+','+d]||(gc['b'+w+','+h+','+d]=new THREE.BoxGeometry(w,h,d));
const cyl=(a,b,h,s=16)=>gc['c'+a+','+b+','+h+','+s]||(gc['c'+a+','+b+','+h+','+s]=new THREE.CylinderGeometry(a,b,h,s));
const sph=new THREE.SphereGeometry(1,16,12);
const cyl1=new THREE.CylinderGeometry(1,1,1,12);
function mk(g,m,x=0,y=0,z=0,parent=scene){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.userData={canvas:c,draw};return t;}
const T=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),V(sx,sy,sz));
const PROPS={},SEATS=[];const part=(g,m,t)=>({g,m,t:t||T()});
function defineProp(n,parts){PROPS[n]={parts,list:[]};}
function place(n,x,y,z,ry=0,s=1){if(/^(lounger|bench|beanbag)$/.test(n))SEATS.push({n,x,y,z,ry});PROPS[n].list.push(T(x,y,z,0,ry,0,s,s,s));}
function buildProps(){const tmp=new THREE.Matrix4();
  for(const k in PROPS){const P=PROPS[k];if(!P.list.length)continue;
    for(const p of P.parts){const im=new THREE.InstancedMesh(p.g,p.m,P.list.length);
      P.list.forEach((M,i)=>{tmp.multiplyMatrices(M,p.t);im.setMatrixAt(i,tmp);});im.frustumCulled=false;scene.add(im);}}}
/* a cylinder from a to b (limbs, rails, tripod legs) */
const UPV=V(0,1,0);
function limb(a,b,r,m,parent=scene){const d=b.clone().sub(a),L=d.length();const o=new THREE.Mesh(cyl1,m);
  o.scale.set(r,L,r);o.position.copy(a).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(UPV,d.normalize());parent.add(o);return o;}
const faceTo=(x,z,tx,tz)=>Math.atan2(tx-x,tz-z);
/* walk colliders: rectangles [x0,x1,z0,z1] and circles [x,z,r] */
const cols=[];
const addRect=(cx,cz,hx,hz)=>cols.push([cx-hx,cx+hx,cz-hz,cz+hz]);
const addCirc=(x,z,r)=>cols.push([x,z,r]);

/* ---------- dimensions ----------
   The rooftop deck runs along x. A wide walkway crosses it from the lift house (west) to a round star-gazing deck (east).
   North side (+z): sun loungers facing the city and the sky. South side (−z): a pergola strung with lights, benches. */
const X0=-22.4,X1=22.4,Z0=-8.6,Z1=8.6;       // deck edge (railing line)
const WK=1.8;                                // walkway half width
const KS={x0:-21.8,x1:-16,z0:-4,z1:4,h:3.5}; // lift house
const SD={x:19,z:0,r:2.9,h:.18};             // star-gazing deck
const MOUNT=V(SD.x-.3,SD.h+1.45,SD.z+.35);   // telescope head
const scopePivot=new THREE.Group();scopePivot.position.copy(MOUNT);scene.add(scopePivot);
const GY=-42;                                // street level, 10 floors down
const SKYR=1500;

/* ---------- sky: gradient, city glow on the horizon, the Milky Way ---------- */
const dirAt=(az,el)=>V(Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az));
/* the overview camera looks along this azimuth; the Milky Way rises diagonally across that part of the sky */
const VIEW_AZ=Math.atan2(-11.5,-30);
/* the real sky over Hà Nội at 20:30 on 3 November 2026: stars, constellations and the Milky Way sit where they really are.
   The overview camera faces west-south-west, where the core of the Milky Way is setting. */
const LAT=21.03*PI/180,LON=105.85;
const JD=Date.UTC(2026,10,3,13,30)/864e5+2440587.5;
const LST=(((18.697374558+24.06570982441908*(JD-2451545)+LON/15)%24)+24)%24;
const AZ_OFF=VIEW_AZ-(250-90)*PI/180;
function eq(ra,dec){const H=(LST-ra)*PI/12,d=dec*PI/180;
  const E=-Math.cos(d)*Math.sin(H),N=Math.sin(d)*Math.cos(LAT)-Math.cos(d)*Math.cos(H)*Math.sin(LAT),U=Math.sin(d)*Math.sin(LAT)+Math.cos(d)*Math.cos(H)*Math.cos(LAT);
  return dirAt(Math.atan2(E,N)-PI/2+AZ_OFF,Math.asin(Math.max(-1,Math.min(1,U))));}
const realAz=d=>{let A=(Math.atan2(d.z,d.x)+PI/2-AZ_OFF)%(2*PI);if(A<0)A+=2*PI;return A;};
const MW_CORE=eq(17.761,-28.936), MW_N=eq(12.857,27.128);
const MW_A=MW_CORE.clone(), MW_B=eq(20.690,45.28);
/* constellations: [RA hours, Dec degrees, magnitude, colour] */
const CONST=[
  {id:'cas',name:'Tiên Hậu',fov:26,stars:[[0.153,59.15,2.27],[0.675,56.54,2.24,'#ffd6a8'],[0.945,60.72,2.15],[1.430,60.24,2.68],[1.906,63.67,3.37]],lines:[[0,1],[1,2],[2,3],[3,4]]},
  {id:'peg',name:'Phi Mã',fov:38,stars:[[23.079,15.21,2.49],[23.063,28.08,2.42,'#ffc59a'],[0.220,15.18,2.83],[0.140,29.09,2.06],[22.691,10.83,3.4],[21.736,9.87,2.38,'#ffc08a']],lines:[[0,1],[1,3],[3,2],[2,0],[0,4],[4,5]]},
  {id:'and',name:'Tiên Nữ',fov:26,stars:[[0.140,29.09,2.06],[0.655,30.86,3.27],[1.162,35.62,2.05,'#ffc59a'],[2.065,42.33,2.17,'#ffd0a0']],lines:[[0,1],[1,2],[2,3]]},
  {id:'cyg',name:'Thiên Nga',fov:32,stars:[[20.690,45.28,1.25],[20.370,40.26,2.23,'#fff1dc'],[19.512,27.96,3.05,'#ffcf9a'],[19.750,45.13,2.87],[20.770,33.97,2.48,'#ffe1b8']],lines:[[0,1],[1,2],[3,1],[1,4]]},
  {id:'tri',name:'Tam giác mùa hè',fov:46,stars:[[18.616,38.78,0.03,'#d4e2ff'],[20.690,45.28,1.25],[19.846,8.87,0.77,'#e6eeff']],lines:[[0,1],[1,2],[2,0]]},
  {id:'ple',name:'Tua Rua',fov:4.5,stars:[[3.791,24.105,2.87,'#d6e4ff'],[3.819,24.053,3.62,'#d6e4ff'],[3.747,24.113,3.70,'#d6e4ff'],[3.763,24.367,3.87,'#d6e4ff'],[3.772,23.948,4.18,'#d6e4ff'],[3.754,24.467,4.29,'#d6e4ff'],[3.819,24.137,5.05,'#d6e4ff']],lines:[]},
];
const BRIGHT=[[4.599,16.51,.85,'#ffb070'],[5.278,46.0,.08,'#fff0c8'],[22.961,-29.62,1.16,'#e8f0ff']];
const M31=eq(0.712,41.27);
const HOR=lin('#21183a'), GLOW=lin('#b36a4c');
const FOG=HOR.clone().lerp(GLOW,.32);
scene.fog=new THREE.FogExp2(FOG.clone(),.002);
const NOISE=`
float hash(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return v;}`;
const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{uN:{value:MW_N},uCore:{value:MW_CORE},uHor:{value:HOR},uGlow:{value:GLOW},uFog:{value:FOG}},
  vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform vec3 uN,uCore,uHor,uGlow,uFog;varying vec3 vDir;${NOISE}
  void main(){vec3 d=normalize(vDir);float h=d.y;
    vec3 zen=vec3(.0028,.0035,.016), mid=vec3(.012,.012,.05);
    vec3 col=mix(uHor,mid,smoothstep(0.,.22,h));col=mix(col,zen,smoothstep(.16,.85,h));
    col+=uGlow*exp(-max(h,0.)*16.)*.32;
    float b=dot(d,uN);
    float band=exp(-b*b/.03);
    float n=fbm(d*5.5),n2=fbm(d*16.+4.3);
    float lane=smoothstep(.48,.72,fbm(d*8.5+7.7))*exp(-b*b/.0035);
    float core=pow(max(dot(d,uCore),0.),5.);
    float mw=band*(.25+1.1*n*n2)*(1.-.8*lane);
    vec3 mwCol=mix(vec3(.30,.36,.95),vec3(1.,.72,.55),core*.9+.05);
    mwCol=mix(mwCol,vec3(.75,.5,1.),smoothstep(.55,.8,n2)*.35);
    col+=mwCol*mw*(.13+.42*core)*smoothstep(.0,.16,h);
    col+=vec3(.6,.4,.9)*exp(-b*b/.12)*.006*smoothstep(.0,.3,h);
    if(h<0.)col=mix(col,uFog,smoothstep(0.,-.03,h));
    gl_FragColor=linearToOutputTexel(vec4(col,1.));}`});
const sky=new THREE.Mesh(new THREE.SphereGeometry(SKYR,64,32),skyMat);sky.renderOrder=-3;scene.add(sky);

/* stars: a field, thicker along the Milky Way; each twinkles on its own beat */
const skyGroup=new THREE.Group();scene.add(skyGroup);
let starCount=0;
{const N=9000,pos=[],col=[],size=[],ph=[];
  const e1=MW_A.clone().addScaledVector(MW_N,-MW_A.dot(MW_N)).normalize(),e2=MW_N.clone().cross(e1).normalize();
  const palette=[[.62,.72,1],[.8,.86,1],[1,1,1],[1,.95,.82],[1,.82,.6],[1,.68,.5]].map(c=>new THREE.Color(...c));
  for(let i=0;i<N;i++){let d;
    if(R()<.42){const u=R()*2*PI;d=e1.clone().multiplyScalar(Math.cos(u)).addScaledVector(e2,Math.sin(u)).addScaledVector(MW_N,gauss()*.09).normalize();}
    else{const z=R()*2-1,a=R()*2*PI,s=Math.sqrt(1-z*z);d=V(s*Math.cos(a),z,s*Math.sin(a));}
    if(d.y<-.05){i--;continue;}
    const m=Math.pow(R(),7);
    pos.push(d.x*SKYR*.93,d.y*SKYR*.93,d.z*SKYR*.93);
    const c=palette[Math.min(5,(R()*R()*6)|0)].clone().multiplyScalar(.3+m*.8+R()*.15);
    col.push(c.r,c.g,c.b);size.push(1.4+m*7+R()*.6);ph.push(R());}
  /* the named stars, at their real places and brightness */
  const done=new Set();
  const addStar=(ra,dec,mag,c)=>{const k=ra+','+dec;if(done.has(k))return;done.add(k);const d=eq(ra,dec);if(d.y<-.05)return;
    pos.push(d.x*SKYR*.93,d.y*SKYR*.93,d.z*SKYR*.93);const q=new THREE.Color(c||'#f4f6ff').multiplyScalar(Math.min(1.1,.3+(4.8-mag)*.16));
    col.push(q.r,q.g,q.b);size.push(Math.max(1.6,2+(4.8-mag)*1.35));ph.push(R());};
  CONST.forEach(c=>c.stars.forEach(st=>addStar(...st)));BRIGHT.forEach(st=>addStar(...st));
  for(let i=0;i<34;i++)addStar(3.785+gauss()*.03,24.12+gauss()*.32,5.2+R()*1.5,'#dfe8ff');
  starCount=pos.length/3;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('aColor',new THREE.Float32BufferAttribute(col,3));g.setAttribute('aSize',new THREE.Float32BufferAttribute(size,1));g.setAttribute('aPhase',new THREE.Float32BufferAttribute(ph,1));
  var starMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
    uniforms:{uTime:{value:0},uPR:{value:DPR},uTw:{value:reduceMotion?0:1},uZoom:{value:1}},
    vertexShader:`attribute vec3 aColor;attribute float aSize,aPhase;uniform float uTime,uPR,uTw,uZoom;varying vec3 vCol;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
        float tw=1.-uTw*.38*(.5+.5*sin(uTime*(1.3+aPhase*3.1)+aPhase*61.));
        float hz=smoothstep(-.01,.14,normalize(position).y);
        vCol=aColor*tw*hz*min(2.,pow(uZoom,.33));gl_PointSize=aSize*uPR*(.85+.15*tw)*min(1.9,pow(uZoom,.22));}`,
    fragmentShader:`varying vec3 vCol;void main(){vec2 c=gl_PointCoord-.5;float r=length(c)*2.;float a=exp(-r*r*5.)+exp(-r*r*40.)*.6;
      if(r>1.)discard;gl_FragColor=linearToOutputTexel(vec4(min(vCol,vec3(.92))*a,a));}`});
  const stars=new THREE.Points(g,starMat);stars.frustumCulled=false;stars.renderOrder=-2;skyGroup.add(stars);}

/* ---------- shooting stars: camera-facing ribbons, bright head, fading tail ---------- */
const meteors=[];
{const mvs=`attribute float aU,aV;varying float vU,vV;void main(){vU=aU;vV=aV;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const mfs=`uniform float uFade,uBright;varying float vU,vV;void main(){float a=pow(vU,2.2)*pow(1.-abs(vV),1.6)*uFade;
    vec3 c=mix(vec3(.45,.55,1.),vec3(1.,.96,.88),vU)*uBright;gl_FragColor=linearToOutputTexel(vec4(c*a,a));}`;
  for(let i=0;i<10;i++){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(12),3));
    g.setAttribute('aU',new THREE.Float32BufferAttribute([0,0,1,1],1));g.setAttribute('aV',new THREE.Float32BufferAttribute([-1,1,-1,1],1));g.setIndex([0,2,1,1,2,3]);
    const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,uniforms:{uFade:{value:0},uBright:{value:1}},vertexShader:mvs,fragmentShader:mfs});
    const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.visible=false;mesh.renderOrder=-1;skyGroup.add(mesh);
    meteors.push({mesh,on:false,t:0,dur:1,p0:V(0,0,0),v:V(0,0,0),speed:0,len:0,w:0});}}
const RADIANT=eq(3.3,14);   /* Taurid radiant in Taurus, in the east during early-November evenings */
const MR=520;
function launch(p,v,o){const m=meteors.find(m=>!m.on);if(!m)return false;
  m.on=true;m.t=0;m.dur=o.dur;m.p0.copy(p).normalize().multiplyScalar(MR);m.v.copy(v).normalize();m.speed=o.speed;m.len=o.len;m.w=o.w;
  m.mesh.material.uniforms.uBright.value=o.bright;m.mesh.visible=true;return true;}
const rnd=(a,b)=>a+Math.random()*(b-a);
function tangentFrom(p,biasDown){const r=V(rnd(-1,1),rnd(-1,1),rnd(-1,1));const t=r.cross(p).normalize();if(biasDown&&t.y>0)t.negate();t.y-=.25;return t.normalize();}
function meteorAt(dir,big){const p=dir.clone().normalize();if(p.y<.06)p.y=.06;
  return launch(p,tangentFrom(p,true),{dur:rnd(.7,1.25)*(big?1.2:1),speed:rnd(180,260),len:rnd(70,120)*(big?1.3:1),w:big?3.2:2.4,bright:big?2.6:rnd(1.4,2.2)});}
function randomMeteor(){return meteorAt(dirAt(rnd(0,2*PI),rnd(.3,1.1)),R()<.3);}
function showerMeteor(){for(let k=0;k<6;k++){const w=tangentFrom(RADIANT,false);const d=rnd(.2,1.0);
    const p=RADIANT.clone().multiplyScalar(Math.cos(d)).addScaledVector(w,Math.sin(d));if(p.y<.08)continue;
    const v=RADIANT.clone().multiplyScalar(-Math.sin(d)).addScaledVector(w,Math.cos(d));
    return launch(p,v,{dur:rnd(.45,.9),speed:rnd(220,320),len:rnd(50,95),w:rnd(1.6,2.6),bright:rnd(1.1,2.0)});}return false;}
const _h=V(0,0,0),_t=V(0,0,0),_s=V(0,0,0),_st=V(0,0,0);
function updateMeteors(dt){for(const m of meteors){if(!m.on)continue;m.t+=dt;const k=m.t/m.dur;
    if(k>=1){m.on=false;m.mesh.visible=false;continue;}
    _h.copy(m.p0).addScaledVector(m.v,m.speed*m.t);
    _t.copy(_h).addScaledVector(m.v,-Math.min(m.len,m.speed*m.t+8));
    _s.copy(m.v).cross(_h).normalize().multiplyScalar(m.w);_st.copy(_s).multiplyScalar(.15);
    const a=m.mesh.geometry.attributes.position.array;
    a[0]=_t.x-_st.x;a[1]=_t.y-_st.y;a[2]=_t.z-_st.z;a[3]=_t.x+_st.x;a[4]=_t.y+_st.y;a[5]=_t.z+_st.z;
    a[6]=_h.x-_s.x;a[7]=_h.y-_s.y;a[8]=_h.z-_s.z;a[9]=_h.x+_s.x;a[10]=_h.y+_s.y;a[11]=_h.z+_s.z;
    m.mesh.geometry.attributes.position.needsUpdate=true;
    m.mesh.material.uniforms.uFade.value=Math.sin(PI*Math.min(1,k*1.15))*(k>.85?(1-k)/.15:1);}}

/* ---------- constellation lines, names and the Andromeda galaxy (shown through the telescope) ---------- */
const LR=SKYR*.88;
const conLines=(()=>{const pts=[];CONST.forEach(c=>c.lines.forEach(([a,b])=>{for(const i of [a,b]){const d=eq(c.stars[i][0],c.stars[i][1]);pts.push(d.x*LR,d.y*LR,d.z*LR);}}));
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:lin('#8ea2ff'),transparent:true,opacity:.5,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));
  l.frustumCulled=false;l.visible=false;skyGroup.add(l);return l;})();
const LABELS=[];
{const avg=c=>c.stars.reduce((v,st)=>v.add(eq(st[0],st[1])),V(0,0,0)).normalize();
  CONST.forEach(c=>LABELS.push({t:c.name,d:avg(c),c:true}));
  [['Chức Nữ (Vega)',18.616,38.78],['Ngưu Lang (Altair)',19.846,8.87],['Deneb',20.690,45.28],['Aldebaran',4.599,16.51],['Capella',5.278,46.0]].forEach(([t,ra,de])=>LABELS.push({t,d:eq(ra,de)}));
  LABELS.push({t:'Thiên hà Tiên Nữ',d:M31.clone()});LABELS.push({t:'Lõi Ngân Hà',d:MW_CORE.clone()});}
{const tex=canvasTex(256,128,(g,w,h)=>{g.save();g.translate(w/2,h/2);g.scale(1,.5);const gr=g.createRadialGradient(0,0,0,0,0,w/2);
    gr.addColorStop(0,'rgba(255,244,226,1)');gr.addColorStop(.06,'rgba(255,232,205,.75)');gr.addColorStop(.3,'rgba(205,196,255,.22)');gr.addColorStop(1,'rgba(160,160,255,0)');
    g.fillStyle=gr;g.beginPath();g.arc(0,0,w/2,0,7);g.fill();g.restore();});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:tex,color:lin('#9a9aa6'),transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));
  m.scale.set(80,27,1);m.position.copy(M31).multiplyScalar(SKYR*.92);m.quaternion.setFromUnitVectors(V(0,0,1),M31.clone().negate());m.rotateZ(.62);skyGroup.add(m);}

/* ---------- Hà Nội under the horizon: streets of lights, Hồ Tây, buildings with lit windows ---------- */
const LAKE={x:-250,z:215,rx:125,rz:82};
const inLake=(x,z,m=0)=>((x-LAKE.x)/(LAKE.rx+m))**2+((z-LAKE.z)/(LAKE.rz+m))**2<1;
{const g=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),new THREE.MeshBasicMaterial({color:lin('#07060e')}));g.rotation.x=-PI/2;g.position.y=GY;scene.add(g);
  const lk=new THREE.Mesh(new THREE.CircleGeometry(1,72),new THREE.MeshBasicMaterial({color:lin('#141a3c')}));lk.rotation.x=-PI/2;lk.scale.set(LAKE.rx,LAKE.rz,1);lk.position.set(LAKE.x,GY+.3,LAKE.z);scene.add(lk);}
const dotTex=canvasTex(64,64,(g,w)=>{const gr=g.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.75)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,w);});
dotTex.encoding=THREE.LinearEncoding;
function pointsMat(size){return new THREE.PointsMaterial({size,map:dotTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});}
let cityLights=0;
{const pos=[],col=[];const sodium=lin('#ffa956'),warm=lin('#ffd9a3'),white=lin('#fff1dc'),cool=lin('#b8d4ff'),red=lin('#ff6b5e');
  const add=(x,z,c,k,y=GY+.6)=>{if(inLake(x,z,-2))return;pos.push(x,y,z);const q=c.clone().multiplyScalar(k);col.push(q.r,q.g,q.b);};
  for(let i=0;i<40;i++){const a=i/40*2*PI+R()*.08;for(let r=48;r<720;r+=3.6+R()*2.4){const w=Math.sin(r*.013+i)*6;add(Math.cos(a)*r-Math.sin(a)*w,Math.sin(a)*r+Math.cos(a)*w,sodium,.55+R()*.45);}}
  for(const rr of [70,125,190,265,350,450,570]){const n=Math.round(rr*2*PI/4.2);for(let i=0;i<n;i++){const a=i/n*2*PI,r=rr+Math.sin(a*5)*9;add(Math.cos(a)*r,Math.sin(a)*r,R()<.8?sodium:white,.5+R()*.5);}}
  for(let i=0;i<620;i++){const a=i/620*2*PI;add(LAKE.x+Math.cos(a)*LAKE.rx*1.03,LAKE.z+Math.sin(a)*LAKE.rz*1.03,R()<.6?warm:white,.7+R()*.5);}
  for(let i=0;i<7000;i++){const r=50+Math.pow(R(),.75)*640,a=R()*2*PI;const pick=R();
    add(Math.cos(a)*r,Math.sin(a)*r,pick<.5?warm:pick<.8?white:pick<.97?cool:red,.35+R()*.6,GY+.5+R()*R()*22);}
  cityLights=pos.length/3;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const p=new THREE.Points(g,pointsMat(2.4));p.frustumCulled=false;scene.add(p);}
/* traffic: little head- and tail-lights flowing along a few avenues */
const traffic=[];let trafficPts;
{const N=420,pos=new Float32Array(N*3),col=new Float32Array(N*3);const hw=lin('#fff3d6'),tl=lin('#ff4a3a');
  for(let i=0;i<N;i++){const road=(R()*8|0)*5,a=road/40*2*PI;const out=R()<.5;traffic.push({a,r:50+R()*650,v:(out?1:-1)*(9+R()*7),lane:out?2.2:-2.2});
    const c=out?tl:hw;col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  trafficPts=new THREE.Points(g,pointsMat(2.0));trafficPts.frustumCulled=false;scene.add(trafficPts);}
function updateTraffic(dt){const a=trafficPts.geometry.attributes.position.array;
  traffic.forEach((c,i)=>{c.r+=c.v*dt;if(c.r>700)c.r=50;if(c.r<50)c.r=700;const w=Math.sin(c.r*.013+c.a*40/(2*PI))*6+c.lane;
    a[i*3]=Math.cos(c.a)*c.r-Math.sin(c.a)*w;a[i*3+1]=GY+.8;a[i*3+2]=Math.sin(c.a)*c.r+Math.cos(c.a)*w;});
  trafficPts.geometry.attributes.position.needsUpdate=true;}
/* buildings: three height classes, windows only on the walls */
function windowTex(cols,rows,lit){return canvasTex(256,512,(g,w,h)=>{g.fillStyle='#0a0b15';g.fillRect(0,0,w,h);const cw=w/cols,rh=h/rows;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const p=R();let fill;
    if(p<lit){const q=R();fill=q<.55?`rgba(255,${190+R()*30|0},${120+R()*40|0},${.55+R()*.45})`:q<.85?`rgba(255,244,222,${.5+R()*.4})`:`rgba(180,215,255,${.5+R()*.4})`;}
    else fill='#141726';
    g.fillStyle=fill;g.fillRect(c*cw+cw*.18,r*rh+rh*.25,cw*.64,rh*.5);}});}
const roofMat=new THREE.MeshBasicMaterial({color:lin('#0c0d17')});
const towerTops=[];let buildings=0;
{const classes=[{tex:windowTex(6,4,.34),n:760,h:[6,18],rep:1},{tex:windowTex(6,10,.3),n:300,h:[18,42],rep:1},{tex:windowTex(5,24,.26),n:34,h:[60,120],rep:1}];
  const tmp=new THREE.Matrix4();
  classes.forEach((cl,ci)=>{const wall=new THREE.MeshBasicMaterial({map:cl.tex,color:lin('#a7a3b8')});
    const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),[wall,wall,roofMat,roofMat,wall,wall],cl.n);let k=0;
    for(let i=0;i<cl.n*3&&k<cl.n;i++){const r=ci===2?260+R()*330:55+Math.pow(R(),.85)*560,a=R()*2*PI,x=Math.cos(a)*r,z=Math.sin(a)*r;
      if(inLake(x,z,25))continue;if(Math.abs(x)<36&&Math.abs(z)<26)continue;
      const w=ci===2?14+R()*12:8+R()*18,d=ci===2?14+R()*12:8+R()*18;let h=cl.h[0]+R()*(cl.h[1]-cl.h[0])*(ci===0?R()*.6+.4:1);
      if(ci<2)h=Math.min(h,6+Math.max(0,r-45)*.22);   /* nearby blocks stay well under the horizon */
      tmp.compose(V(x,GY+h/2,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,a+(R()<.5?0:PI/2)+(R()-.5)*.3,0)),V(w,h,d));im.setMatrixAt(k++,tmp);
      if(ci===2)towerTops.push(V(x,GY+h+1.2,z));}
    im.count=k;buildings+=k;im.frustumCulled=false;scene.add(im);});}
const beaconMat=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.25,.15)});
for(const p of towerTops){const b=mk(sph,beaconMat,p.x,p.y,p.z);b.scale.setScalar(1.1);}

/* ---------- the library below the deck ---------- */
const facadeTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#d8d4cc';g.fillRect(0,0,w,h);const rows=5,cols=8,rh=h/rows,cw=w/cols;
  for(let r=0;r<rows;r++){g.fillStyle='#bdb7ad';g.fillRect(0,r*rh,w,8);
    for(let c=0;c<cols;c++){const lit=R()<.7;g.fillStyle=lit?`rgba(255,${200+R()*30|0},${140+R()*40|0},1)`:'#3a3e52';g.fillRect(c*cw+8,r*rh+22,cw-16,rh-34);
      g.fillStyle='rgba(60,50,40,.35)';g.fillRect(c*cw+cw/2-1,r*rh+22,2,rh-34);}}});
facadeTex.wrapS=facadeTex.wrapT=THREE.RepeatWrapping;
{const fm=new THREE.MeshBasicMaterial({map:facadeTex,color:lin('#8e8a98')});const fm2=fm.clone();fm2.map=facadeTex.clone();fm2.map.needsUpdate=true;
  fm.map.repeat.set(9,2);fm2.map.repeat.set(4,2);
  const b=new THREE.Mesh(new THREE.BoxGeometry(X1-X0+.6,-GY-.35,Z1-Z0+.6),[fm2,fm2,roofMat,roofMat,fm,fm]);b.position.y=GY/2-.18;scene.add(b);}

/* ---------- textures for the deck ---------- */
function planks(base,var1,gap,len=1024){return canvasTex(len,512,(g,w,h)=>{const n=8,ph=h/n;
  for(let i=0;i<n;i++){let x=-R()*w*.5;while(x<w){const L=w*(.35+R()*.45);g.fillStyle=`hsl(${base[0]+R()*var1},${base[1]+R()*8}%,${base[2]-R()*7}%)`;g.fillRect(x,i*ph,L,ph);
      for(let k=0;k<26;k++){g.fillStyle=`rgba(40,22,10,${R()*.12})`;g.fillRect(x+R()*L,i*ph+R()*ph,20+R()*120,1+R()*2);}
      g.fillStyle=gap;g.fillRect(x,i*ph,3,ph);x+=L;}
    g.fillStyle=gap;g.fillRect(0,i*ph,w,4);}});}
const deckTex=planks([24,6,30],8,'rgba(20,10,5,.85)');deckTex.wrapS=deckTex.wrapT=THREE.RepeatWrapping;deckTex.repeat.set((X1-X0)/4,(Z1-Z0)/1.6);
const walkTex=planks([30,10,44],6,'rgba(30,16,8,.8)');walkTex.wrapS=walkTex.wrapT=THREE.RepeatWrapping;walkTex.repeat.set(38/4,2*WK/1.6);
const claddingTex=canvasTex(512,256,(g,w,h)=>{for(let x=0;x<w;x+=24){g.fillStyle=`hsl(26,${38+R()*8}%,${30+R()*8}%)`;g.fillRect(x,0,24,h);g.fillStyle='rgba(15,8,4,.6)';g.fillRect(x,0,3,h);}});
claddingTex.wrapS=THREE.RepeatWrapping;

/* ---------- materials ---------- */
const M={
  deck:new THREE.MeshStandardMaterial({map:deckTex,roughness:.62}), walk:new THREE.MeshStandardMaterial({map:walkTex,roughness:.5}),
  wood:mat('#a8703f',{roughness:.55}), woodDark:mat('#5e3a1f',{roughness:.6}), teak:mat('#c08a55',{roughness:.5}),
  concrete:mat('#8d8a90',{roughness:.9}), concreteD:mat('#5c5a63',{roughness:.9}), steel:mat('#c7cad6',{roughness:.25,metalness:.75}),
  dark:mat('#20222c',{roughness:.45,metalness:.3}), white:mat('#e9e6e0',{roughness:.5}), soil:mat('#2f2118'),
  glass:new THREE.MeshStandardMaterial({color:lin('#c9c4ff'),transparent:true,opacity:.14,roughness:.05,metalness:.2,side:THREE.DoubleSide,depthWrite:false}),
  cushion:mat('#e6dfd2',{roughness:.9}), cushionB:mat('#3b4a7a',{roughness:.9}), fabric:mat('#7b6aa8',{roughness:.95}),
  leaf:mat('#2f6b3a',{roughness:.75}), leaf2:mat('#3f8a45',{roughness:.75}), leaf3:mat('#24563a',{roughness:.75}), bark:mat('#4a3424',{roughness:.9}),
  hair:mat('#17110d',{roughness:.6}),
};
/* everything that glows warm and dims with the "Đèn lối đi" toggle */
const glow=[];
function glowMat(c,k){const m=new THREE.MeshBasicMaterial({color:lin(c).multiplyScalar(k)});m.userData.base=m.color.clone();glow.push(m);return m;}
const G={
  led:glowMat('#ffc977',2.6), bollard:glowMat('#ffd38a',3.2), dot:glowMat('#ffcf86',1.7), bulb:glowMat('#ffd59a',3.6),
  lantern:glowMat('#ffbf6a',2.8), benchLed:glowMat('#ffbe72',1.6), rail:glowMat('#a99bff',1.15), uplight:glowMat('#ffe2b0',1.4),
};
const doorGlow=new THREE.MeshBasicMaterial({color:lin('#ffd9a8').multiplyScalar(.55)});

/* ---------- the deck ---------- */
{const top=new THREE.Mesh(new THREE.PlaneGeometry(X1-X0,Z1-Z0),M.deck);top.rotation.x=-PI/2;scene.add(top);
  const w=new THREE.Mesh(new THREE.PlaneGeometry(38,2*WK),M.walk);w.rotation.x=-PI/2;w.position.set(-16+19,.012,0);scene.add(w);
  mk(box(X1-X0+.6,.36,Z1-Z0+.6),M.concreteD,0,-.18,0);
  /* LED strips along both edges of the walkway, and small warm dots set into it like stars underfoot */
  for(const s of [-1,1])mk(box(38,.025,.05),G.led,3,.026,s*(WK+.04));
  defineProp('dot',[part(cyl(.05,.05,.01,10),G.dot)]);
  for(let x=-14.5;x<=15.5;x+=1.5)for(const s of [-1,1])place('dot',x+(s>0?.75:0),.02,s*(WK-.35));}
/* low glass railing all round, steel cap, a soft violet LED under the cap */
let railLen=0;
function railRun(ax,az,bx,bz){const L=Math.hypot(bx-ax,bz-az),cx=(ax+bx)/2,cz=(az+bz)/2,ry=Math.atan2(-(bz-az),bx-ax);railLen+=L;
  const p=mk(new THREE.PlaneGeometry(L,.86),M.glass,cx,.55,cz);p.rotation.y=ry;
  const cap=mk(box(L+.06,.05,.09),M.steel,cx,1.04,cz);cap.rotation.y=ry;
  const led=mk(box(L,.02,.03),G.rail,cx,1.0,cz);led.rotation.y=ry;
  const base=mk(box(L+.06,.1,.14),M.dark,cx,.05,cz);base.rotation.y=ry;
  const n=Math.ceil(L/1.6);for(let i=0;i<=n;i++){const t=i/n;place('post',ax+(bx-ax)*t,0,az+(bz-az)*t,ry);}}
defineProp('post',[part(box(.05,1.02,.05),M.steel,T(0,.51,0))]);
railRun(X0,Z0,X1,Z0);railRun(X1,Z0,X1,Z1);railRun(X1,Z1,X0,Z1);railRun(X0,Z1,X0,Z0);

/* ---------- lift house at the west end ---------- */
function textPlate(lines,w,h,bg,fg){return canvasTex(w,h,(g)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';
  for(const [t,y,size,weight,col] of lines){g.fillStyle=col||fg;g.font=`${weight||700} ${size}px "Be Vietnam Pro", system-ui, sans-serif`;g.fillText(t,w/2,h*y);}});}
const signTex=textPlate([['SÂN THƯỢNG · TẦNG 10',.42,74,800,'#f2c46b'],['Không gian thư giãn · Ngắm sao',.76,40,500,'#d9dcf5']],1024,220,'#141633','#ffffff');
const libSignTex=canvasTex(1024,200,(g,w,h)=>{g.fillStyle='#141633';g.fillRect(0,0,w,h);g.strokeStyle='#f2c46b';g.lineWidth=8;g.lineJoin='round';
  g.beginPath();g.moveTo(40,60);g.quadraticCurveTo(90,42,135,66);g.quadraticCurveTo(180,42,230,60);g.lineTo(230,150);g.quadraticCurveTo(180,132,135,156);g.quadraticCurveTo(90,132,40,150);g.closePath();g.stroke();
  g.beginPath();g.moveTo(135,66);g.lineTo(135,156);g.stroke();g.fillStyle='#f4ead6';g.textBaseline='middle';g.font='700 60px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Thư viện Tạ Quang Bửu',262,104);});
const liftDispTex=textPlate([['▼ 10',.54,40,700,'#ff6a4a']],160,56,'#0c0d12','#ff6a4a');
/* the November sky board on the star-gazing deck */
const boardTex=canvasTex(900,620,(g,w,h)=>{g.fillStyle='#0d1030';g.fillRect(0,0,w,h);g.strokeStyle='rgba(242,196,107,.8)';g.lineWidth=4;g.strokeRect(14,14,w-28,h-28);
  g.fillStyle='#f2c46b';g.font='800 46px "Be Vietnam Pro", system-ui, sans-serif';g.textBaseline='alphabetic';g.fillText('Bầu trời đêm tháng 11',44,82);
  g.fillStyle='#c9cdf2';g.font='500 25px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Hướng nhìn từ sân thượng, khoảng 20 giờ',44,122);
  const star=(x,y,r)=>{g.fillStyle='#ffffff';g.beginPath();g.arc(x,y,r,0,7);g.fill();};
  const fig=(pts,name,lx,ly)=>{g.strokeStyle='rgba(160,180,255,.55)';g.lineWidth=2.5;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();
    pts.forEach(([x,y],i)=>star(x,y,i%2?5:6.5));g.fillStyle='#e8eaff';g.font='600 24px "Be Vietnam Pro", system-ui, sans-serif';g.fillText(name,lx,ly);};
  fig([[70,250],[110,212],[150,250],[190,205],[232,236]],'Tiên Hậu',92,290);
  fig([[300,330],[420,330],[420,440],[300,440],[300,330]],'Phi Mã',318,480);
  fig([[420,330],[480,300],[540,280],[600,250]],'Tiên Nữ',520,232);
  for(const [x,y,r] of [[690,330,5],[705,318,4],[716,336,5.5],[728,322,4],[702,345,3.5],[722,350,4]])star(x,y,r);
  g.fillStyle='#e8eaff';g.font='600 24px "Be Vietnam Pro", system-ui, sans-serif';g.fillText('Tua Rua',668,385);
  fig([[160,400],[190,450],[160,520],[120,450],[160,400],[160,560]],'Thiên Nga',70,600-14);
  g.fillStyle='#c9cdf2';g.font='500 23px "Be Vietnam Pro", system-ui, sans-serif';
  g.fillText('Mưa sao băng Taurid: cực đại 5/11 và 12/11',560,520);g.fillText('Tâm phát ra ở chòm Kim Ngưu, phía đông',560,556);
  g.fillStyle='rgba(242,196,107,.9)';g.fillText('Hãy tắt điện thoại 15 phút để mắt quen bóng tối',300,600-14);});
const allText=[signTex,libSignTex,boardTex];
function redrawText(){for(const t of allText){const c=t.userData.canvas;t.userData.draw(c.getContext('2d'),c.width,c.height);t.needsUpdate=true;}}
if(document.fonts&&document.fonts.load){Promise.all(['800 74px','500 40px','700 60px','800 46px','600 24px','500 23px'].map(f=>document.fonts.load(f+' "Be Vietnam Pro"'))).then(redrawText).catch(()=>{});}

{const {x0,x1,z0,z1,h}=KS,cx=(x0+x1)/2,cz=(z0+z1)/2;
  mk(box(x1-x0,h,z1-z0),M.concrete,cx,h/2,cz);
  /* wood-clad face toward the walkway with a lit glass door */
  const cl=new THREE.MeshStandardMaterial({map:claddingTex,roughness:.7});claddingTex.repeat.set(3,1);
  for(const [za,zb] of [[z0,-1.15],[1.15,z1]]){const p=mk(new THREE.PlaneGeometry(zb-za,h),cl,x1+.012,h/2,(za+zb)/2);p.rotation.y=PI/2;}
  {const p=mk(new THREE.PlaneGeometry(2.3,h-2.55),cl,x1+.012,2.55+(h-2.55)/2,0);p.rotation.y=PI/2;}
  const door=mk(new THREE.PlaneGeometry(2.2,2.5),doorGlow,x1+.005,1.25,0);door.rotation.y=PI/2;
  for(const z of [-1.12,0,1.12]){mk(box(.07,2.55,.07),M.dark,x1+.03,1.275,z);}
  mk(box(.07,.07,2.3),M.dark,x1+.03,2.55,0);
  const disp=mk(new THREE.PlaneGeometry(.42,.15),new THREE.MeshBasicMaterial({map:liftDispTex}),x1+.02,2.78,0);disp.rotation.y=PI/2;
  const sg=mk(new THREE.PlaneGeometry(3.6,.78),new THREE.MeshBasicMaterial({map:signTex,color:lin('#cfcfcf')}),x1+.02,3.12,-2.15);sg.rotation.y=PI/2;sg.scale.set(.62,.62,1);
  /* roof overhang with a warm edge light */
  mk(box(x1-x0+1.4,.22,z1-z0+.8),M.concreteD,cx+.6,h+.11,cz);
  mk(box(.04,.03,z1-z0+.7),G.led,x1+1.28,h-.01,cz);
  const lib=mk(new THREE.PlaneGeometry(5,1),new THREE.MeshBasicMaterial({map:libSignTex,color:lin('#cfcfcf')}),cx,2.5,z1+.012);
  const lib2=lib.clone();lib2.position.z=z0-.012;lib2.rotation.y=PI;scene.add(lib2);
  addRect(cx,cz,(x1-x0)/2,(z1-z0)/2);}

/* ---------- plants ---------- */
let plantCount=0;
function tree(x,z,s=1){plantCount++;const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g);
  mk(box(1.25,.62,1.25),M.woodDark,0,.31,0,g);mk(box(1.1,.04,1.1),M.soil,0,.62,0,g);
  mk(cyl(.62,.62,.012,20),G.uplight,0,.64,0,g).scale.set(.18,1,.18);
  const tr=mk(cyl(.07,.1,1.9,10),M.bark,0,1.5,0,g);tr.rotation.z=(R()-.5)*.1;
  const L=[M.leaf,M.leaf2,M.leaf3];for(let i=0;i<7;i++){const a=R()*2*PI,r=.15+R()*.45;
    const f=mk(sph,L[i%3],Math.cos(a)*r,2.2+R()*.9,Math.sin(a)*r,g);f.scale.set(.55+R()*.3,.45+R()*.25,.55+R()*.3);}
  addRect(x,z,.65*s,.65*s);}
const greens=[M.leaf,M.leaf2,M.leaf3];
function plant(x,y,z,s=1){plantCount++;const g=new THREE.Group();
  mk(cyl(.2,.15,.42,18),M.concreteD,0,.21,0,g);mk(cyl(.18,.18,.02,18),M.soil,0,.41,0,g);
  for(let i=0;i<14;i++){const piv=new THREE.Group();piv.position.y=.42;piv.rotation.y=i/14*PI*2+R()*.5;
    const inner=new THREE.Group();inner.rotation.z=.2+R()*.8;const Lf=.28+R()*.24;
    const lf=new THREE.Mesh(sph,greens[i%3]);lf.scale.set(.085,Lf,.024);lf.position.y=Lf;inner.add(lf);piv.add(inner);g.add(piv);}
  g.position.set(x,y,z);g.scale.setScalar(s);scene.add(g);addCirc(x,z,.3*s);}
function grassBed(cx,cz,w,d){mk(box(w,.48,d),M.woodDark,cx,.24,cz);mk(box(w-.08,.03,d-.08),M.soil,cx,.48,cz);
  for(let i=0;i<w*14;i++){const x=cx+(R()-.5)*(w-.2),z=cz+(R()-.5)*(d-.15);const b=mk(cyl(.004,.012,.5+R()*.4,4),greens[i%3],x,.72,z);b.rotation.set((R()-.5)*.5,0,(R()-.5)*.5);}
  plantCount++;addRect(cx,cz,w/2,d/2);}

/* ---------- furniture props ---------- */
/* sun lounger: feet toward +z, raised back toward −z */
const BK=.6;
defineProp('lounger',[
  part(box(.06,.06,1.25),M.dark,T(-.31,.3,.35)),part(box(.06,.06,1.25),M.dark,T(.31,.3,.35)),
  ...[[-.31,-.22],[.31,-.22],[-.31,.92],[.31,.92]].map(([x,z])=>part(cyl(.018,.018,.3,6),M.dark,T(x,.15,z))),
  part(box(.64,.05,1.22),M.teak,T(0,.355,.35)),
  part(box(.64,.05,.82),M.teak,T(0,.36+.41*Math.sin(BK),-.25-.41*Math.cos(BK),BK)),
  part(box(.58,.08,1.16),M.cushion,T(0,.42,.36)),
  part(box(.58,.08,.76),M.cushion,T(0,.43+.4*Math.sin(BK),-.22-.4*Math.cos(BK),BK)),
  part(box(.36,.1,.2),M.cushionB,T(0,.48+.74*Math.sin(BK),-.2-.74*Math.cos(BK),BK)),
]);
/* bench: a teak plank on two concrete blocks, a strip of light under the seat */
defineProp('bench',[part(box(1.9,.08,.48),M.teak,T(0,.45,0)),part(box(.34,.41,.44),M.concrete,T(-.66,.205,0)),part(box(.34,.41,.44),M.concrete,T(.66,.205,0)),
  part(box(1.0,.02,.02),G.benchLed,T(0,.4,.2))]);
defineProp('sideTable',[part(cyl(.26,.26,.04,24),M.teak,T(0,.48,0)),part(cyl(.035,.035,.46,8),M.dark,T(0,.23,0)),part(cyl(.18,.2,.02,18),M.dark,T(0,.01,0))]);
defineProp('lantern',[part(box(.16,.02,.16),M.dark,T(0,.0,0)),part(box(.16,.02,.16),M.dark,T(0,.24,0)),part(cyl(.05,.05,.2,10),G.lantern,T(0,.12,0)),
  ...[[-.07,-.07],[.07,-.07],[-.07,.07],[.07,.07]].map(([x,z])=>part(box(.015,.24,.015),M.dark,T(x,.12,z))),part(cyl(.012,.012,.08,6),M.dark,T(0,.28,0))]);
defineProp('bookClosed',[part(box(.22,.035,.3),mat('#3d5ea8',{roughness:.7}),T(0,.018,0)),part(box(.2,.03,.28),M.white,T(.012,.018,0))]);
defineProp('bookOpen',[part(box(.38,.012,.27),mat('#8a3a35'),T(0,.006,0)),part(box(.18,.018,.25),M.white,T(-.09,.02,0,0,0,-.08)),part(box(.18,.018,.25),M.white,T(.09,.02,0,0,0,.08))]);
defineProp('mug',[part(cyl(.04,.035,.09,12),mat('#e8e2d8',{roughness:.4}),T(0,.045,0))]);
defineProp('beanbag',[part(sph,M.fabric,T(0,.3,0,0,0,0,.52,.32,.5)),part(sph,M.fabric,T(0,.42,-.28,0,0,0,.44,.3,.22))]);
defineProp('bollard',[part(cyl(.07,.08,.55,12),M.dark,T(0,.275,0)),part(cyl(.065,.065,.07,12),G.bollard,T(0,.5,0)),part(cyl(.085,.085,.03,12),M.dark,T(0,.55,0))]);

/* ---------- north side: loungers in pairs, facing the city and the sky ---------- */
let seats=0;
const LZ=4.75;
const pairs=[-11.5,-5.2,1.1,7.4];
pairs.forEach((cx,i)=>{for(const s of [-1,1]){place('lounger',cx+s*.68,0,LZ,0);seats++;addRect(cx+s*.68,LZ+.1,.34,1.2);}
  place('sideTable',cx,0,LZ-.35);place('lantern',cx,.5,LZ-.42);place('mug',cx+.12,.5,LZ-.24);addCirc(cx,LZ-.35,.3);
  place('bookClosed',cx-.1,.5,LZ-.2,.4);});
const lanternLights=pairs.map(cx=>V(cx,.85,LZ-.4));
/* books set aside on the deck beside the loungers */
place('bookOpen',pairs[0]-1.2,0,LZ+.5,.5);place('bookClosed',pairs[2]-1.18,0,LZ+.2,-.3);place('bookClosed',pairs[2]-1.16,.035,LZ+.22,.2);place('bookOpen',pairs[3]+1.25,0,LZ-.1,-.8);
/* trees and grasses between the pairs, along the railing */
for(const x of [-8.35,-2.05,4.25])tree(x,6.9,1);
tree(-14.4,6.8,1.05);
grassBed(-11.5,7.85,3.2,.62);grassBed(-5.2,7.85,3.2,.62);grassBed(1.1,7.85,3.2,.62);grassBed(7.4,7.85,3.2,.62);
for(const x of [-8.35,-2.05,4.25])plant(x,0,3.3,.85);

/* picnic blanket: two friends lying on their backs, books and a lantern beside them */
{const bx=13.1,bz=5.4,ry=-.12;const b=mk(new THREE.PlaneGeometry(2.6,3.0),mat('#5a4a8c',{roughness:.95}),bx,.012,bz);b.rotation.set(-PI/2,0,ry);
  const stripe=canvasTex(256,256,(g,w)=>{g.fillStyle='#4b3f7a';g.fillRect(0,0,w,w);g.fillStyle='#e6c27a';for(let i=0;i<w;i+=64){g.fillRect(i,0,10,w);g.fillRect(0,i,w,10);}g.fillStyle='rgba(255,255,255,.12)';for(let i=32;i<w;i+=64){g.fillRect(i,0,4,w);g.fillRect(0,i,w,4);}});
  b.material=new THREE.MeshStandardMaterial({map:stripe,roughness:.95});
  place('bookOpen',bx-.2,.014,bz-1.2,.3);place('bookClosed',bx+.95,.014,bz-1.15,-.5);place('bookClosed',bx+.97,.05,bz-1.13,-.2);
  place('lantern',bx+1.05,.014,bz+.95);place('mug',bx-1.05,.014,bz-.9);place('mug',bx-.95,.014,bz-.8);
  addRect(bx,bz,1.3,1.5);seats+=2;}
place('beanbag',9.95,0,6.1,PI*.85);place('beanbag',16.4,0,4.4,-PI*.7);addCirc(9.95,6.1,.5);addCirc(16.4,4.4,.5);seats+=2;
tree(16.6,6.9,.95);

/* ---------- south side: pergola strung with lights ---------- */
const PG={x0:-10.2,x1:2.2,z0:-7.3,z1:-3.0,h:2.85};
const bulbs=[];
{const {x0,x1,z0,z1,h}=PG;
  for(const x of [x0,(2*x0+x1)/3,(x0+2*x1)/3,x1])for(const z of [z0,z1]){mk(box(.16,h,.16),M.woodDark,x,h/2,z);addRect(x,z,.1,.1);}
  for(const z of [z0,z1])mk(box(x1-x0+.5,.2,.12),M.woodDark,(x0+x1)/2,h+.1,z);
  for(let x=x0;x<=x1+.01;x+=.62)mk(box(.07,.12,z1-z0+.5),M.wood,x,h+.26,(z0+z1)/2);
  /* three strands sagging between the posts, warm bulbs every half metre */
  const strand=new THREE.LineBasicMaterial({color:lin('#2a2420')});
  const posts=[x0,(2*x0+x1)/3,(x0+2*x1)/3,x1];
  for(const z of [z0+.9,(z0+z1)/2,z1-.9]){const pts=[];
    for(let i=0;i<posts.length-1;i++){const a=posts[i],b=posts[i+1];for(let k=0;k<=20;k++){const t=k/20;if(i&&!k)continue;pts.push(V(a+(b-a)*t,h+.04-Math.sin(PI*t)*.32,z));}}
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),strand));
    for(let k=0;k<pts.length;k+=3)bulbs.push(pts[k]);}
  defineProp('bulb',[part(sph,G.bulb,T(0,-.06,0,0,0,0,.045,.055,.045)),part(cyl(.015,.015,.04,6),M.dark,T(0,-.01,0))]);
  for(const p of bulbs)place('bulb',p.x,p.y,p.z);
  /* benches facing the walkway, a long low table with open books */
  for(const x of [-8.3,-4,.3]){place('bench',x,0,-6.55,0);addRect(x,-6.55,.95,.25);seats+=2;}
  mk(box(5.2,.06,.8),M.teak,-4,.42,-5.05);for(const x of [-6.3,-1.7])mk(box(.5,.4,.66),M.concrete,x,.2,-5.05);addRect(-4,-5.05,2.6,.42);
  place('bookOpen',-5.2,.45,-5.0,.2);place('bookClosed',-3.4,.45,-5.1,-.3);place('bookClosed',-3.38,.485,-5.08,.1);place('mug',-2.6,.45,-4.9);place('lantern',-4.1,.45,-5.15);
  for(const x of [x0+.35,x1-.35])plant(x,0,z1+.45,1);}

/* outward-facing benches along the south railing, with a grass bed in front */
for(const x of [6.2,10.2]){place('bench',x,0,-6.4,PI);addRect(x,-6.4,.95,.25);seats+=2;}
place('bookClosed',5.6,.49,-6.42,.3);place('bookOpen',10.0,.49,-6.4,.1);
grassBed(8.2,-7.85,6.2,.62);
tree(3.95,-6.9,1);tree(12.75,-6.9,1);tree(-13.2,-6.8,1.05);
grassBed(-13.6,-3.2,2.4,.62);
plant(-15.35,0,2.35,.9);plant(-15.35,0,-2.35,.9);

/* ---------- bollards and benches along the walkway ---------- */
for(let x=-13;x<=14;x+=4)for(const s of [-1,1]){const xx=x+(s>0?2:0);place('bollard',xx,0,s*(WK+.42));addCirc(xx,s*(WK+.42),.12);}
for(const x of [-9.5,-1.5,6.5]){place('bench',x,0,-(WK+1.0),0);addRect(x,-(WK+1.0),.95,.25);seats+=2;}

/* ---------- star-gazing deck at the east end ---------- */
{const {x,z,r,h}=SD;
  mk(cyl(r,r,h,72),M.teak,x,h/2,z);mk(cyl(r+.04,r+.04,.03,72),G.led,x,.015,z).scale.set(1,1,1);
  /* curved bench around the far half */
  const segs=16,th0=.45,th1=PI-.45,rb=r-.45;
  for(let i=0;i<segs;i++){const th=th0+(i+.5)*(th1-th0)/segs,bx=x+rb*Math.sin(th),bz=z+rb*Math.cos(th),L=rb*(th1-th0)/segs*1.04;
    const s=mk(box(L,.07,.46),M.wood,bx,h+.43,bz);s.rotation.y=th;const b=mk(box(L*.96,.4,.36),M.concrete,bx,h+.2,bz);b.rotation.y=th;
    const l=mk(box(L*.9,.02,.02),G.benchLed,x+(rb-.22)*Math.sin(th),h+.39,z+(rb-.22)*Math.cos(th));l.rotation.y=th;addCirc(bx,bz,.32);}
  seats+=6;
  /* telescope on a tripod; it turns to wherever you look through it */
  mk(box(.16,.16,.16),M.dark,MOUNT.x,MOUNT.y-.13,MOUNT.z);
  for(let i=0;i<3;i++){const a=i*2*PI/3+.4;limb(V(MOUNT.x,MOUNT.y-.15,MOUNT.z),V(MOUNT.x+Math.cos(a)*.5,h,MOUNT.z+Math.sin(a)*.5),.022,M.steel);}
  limb(V(0,0,-.42),V(0,0,.95),.085,M.white,scopePivot);limb(V(0,0,.88),V(0,0,1.04),.1,M.dark,scopePivot);
  limb(V(0,0,-.56),V(0,0,-.4),.03,M.dark,scopePivot);limb(V(0,.13,-.1),V(0,.13,.32),.025,M.dark,scopePivot);
  addCirc(MOUNT.x,MOUNT.z,.55);
  /* the November sky board */
  const bd=new THREE.Group();bd.position.set(15.0,0,-WK-1.15);scene.add(bd);
  for(const s of [-1,1])mk(box(.07,1.25,.07),M.dark,s*.95,.62,0,bd);
  mk(box(2.08,1.46,.06),M.dark,0,1.62,-.02,bd);
  mk(new THREE.PlaneGeometry(2.0,1.38),new THREE.MeshBasicMaterial({map:boardTex,color:lin('#d0d0d0')}),0,1.62,.012,bd);
  addRect(15,-WK-1.15,1.05,.15);}

buildProps();

/* ---------- lighting: dim blue night, warm pools of light ---------- */
const hemi=new THREE.HemisphereLight(lin('#6c72c8'),lin('#2c1c2c'),.62);scene.add(hemi);
const skyFill=new THREE.DirectionalLight(lin('#8f8cff'),.22);skyFill.position.set(-10,30,-12);scene.add(skyFill);
const cityFill=new THREE.DirectionalLight(lin('#ff9a6a'),.12);cityFill.position.set(20,4,30);scene.add(cityFill);
const warm=[];
function warmLight(p,int,dist,c='#ffbf73'){const l=new THREE.PointLight(lin(c),int,dist,2);l.position.copy(p);l.userData.base=int;scene.add(l);warm.push(l);return l;}
for(const [x,s] of [[-10,1],[-1,-1],[8,1]])warmLight(V(x,.75,s*(WK+.42)),1.5,9);
warmLight(V(-7.1,2.55,-5.15),1.7,10);warmLight(V(-.9,2.55,-5.15),1.7,10);
lanternLights.forEach(p=>warmLight(p,1.1,5.5));
warmLight(V(13.2,.6,5.4),1.0,5,'#ffb867');
warmLight(V(SD.x,.5,SD.z),1.1,7);
const doorLight=new THREE.PointLight(lin('#ffd9ad'),1.6,9,2);doorLight.position.set(KS.x1+1.2,2.3,0);scene.add(doorLight);

/* ---------- post-processing: soft bloom for the lights and stars ---------- */
let composer=null,finalPass=null;
const FinalShader={uniforms:{tDiffuse:{value:null},uTime:{value:0}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime;varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;c=c/(1.+c*.12)*1.06;
      c=pow(max(c,0.),vec3(1./2.2));float v=smoothstep(1.05,.32,length((vUv-.5)*vec2(1.1,1.)));c*=mix(.78,1.,v);
      c+=(h(vUv*vec2(1733.,977.)+fract(uTime))-.5)/180.;gl_FragColor=vec4(c,1.);}`};
try{if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.RenderPass&&THREE.ShaderPass){
  const webgl2=renderer.capabilities.isWebGL2;
  const RT=webgl2&&THREE.WebGLMultisampleRenderTarget?THREE.WebGLMultisampleRenderTarget:THREE.WebGLRenderTarget;
  const rt=new RT(2,2,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,type:webgl2?THREE.HalfFloatType:THREE.UnsignedByteType});
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  const bloom=new THREE.UnrealBloomPass(new THREE.Vector2(256,256),1.0,.62,.98);
  /* half-float blur targets: 8-bit ones leave square steps around faint glows */
  if(webgl2)[bloom.renderTargetBright,...bloom.renderTargetsHorizontal,...bloom.renderTargetsVertical].forEach(t=>{t.texture.type=THREE.HalfFloatType;});
  composer.addPass(bloom);
  finalPass=new THREE.ShaderPass(FinalShader);composer.addPass(finalPass);}}catch(e){composer=null;}

/* ---------- views & camera ---------- */
/* yaw/pitch that look along a direction (pitch < 0 looks up) */
const yp=(d,lift)=>({yaw:Math.atan2(d.x,-d.z),pitch:-Math.asin(Math.min(.99,d.y))-lift});
const VIEWS={
  overview:{p:V(30,7.4,11.5),t:V(0,6.6,-3),fit:'over'},
  walkway:{p:V(-15.1,1.62,0),t:V(8,2.3,0)},
  gaze:{gaze:true,p:V(pairs[1]+.68,1.02,LZ-.72),...yp(MW_A.clone().lerp(MW_B,.32).normalize(),.42)},
  milky:{gaze:true,p:V(9,1.6,.4),...yp(MW_A.clone().lerp(MW_B,.62).normalize(),.22)},
  pergola:{p:V(-.6,1.55,-1.0),t:V(-5.6,1.7,-5.6)},
  scope:{p:V(14.6,2.0,2.8),t:V(19.4,1.5,-.6)},
  city:{p:V(-5.4,1.65,7.6),t:V(-80,-24,95)},
  top:{p:V(0,62,.6),t:V(0,0,0),fit:'top'}
};
const fwd=(yaw,pitch)=>V(Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
function viewPose(name){const v=VIEWS[name];const p=v.p.clone(),t=v.gaze?v.p.clone().addScaledVector(fwd(v.yaw,v.pitch),6):v.t.clone(),a=camera.aspect;
  if(v.fit==='over'){const k=Math.min(2.2,Math.max(1,Math.pow(1.7/a,.85)));p.sub(t).multiplyScalar(k).add(t);}
  if(v.fit==='top'){p.y=Math.max(62,60/a+10);}
  return {p,t};}
let tween=null;
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
function flyTo(p,t,dur=1.4,done){tween={p0:camera.position.clone(),t0:controls.target.clone(),p1:p,t1:t,s:performance.now(),d:reduceMotion?1:dur*1000,done};}
const viewBtns=[...root.querySelectorAll('[data-view]')];
const setActive=n=>viewBtns.forEach(b=>b.classList.toggle('on',b.dataset.view===n));
function goView(n){const v=VIEWS[n];if(mode!=='orbit')leaveLook();
  const {p,t}=viewPose(n);setActive(n);
  if(v.gaze){hint.textContent='Đang đặt bạn nằm xuống…';flyTo(p,t,1.6,()=>enterLook('gaze',v.yaw,v.pitch));}
  else flyTo(p,t);}
viewBtns.forEach(b=>b.addEventListener('click',()=>goView(b.dataset.view)));
controls.addEventListener('start',()=>{tween=null;setActive(null);});

/* ---------- walk and gaze modes (look around by dragging) ---------- */
let mode='orbit',yaw=0,pitch=0;
const keys={f:0,b:0,l:0,r:0,run:0};
const touch=matchMedia('(pointer: coarse)').matches;
const hint=$('#hint'),dpad=$('#dpad');
function setHint(){hint.textContent=mode==='walk'
  ?(touch?'Giữ nút mũi tên để đi · Vuốt để nhìn quanh · Chạm vào trời để gọi sao băng':'W A S D hoặc phím mũi tên để đi · Kéo để nhìn quanh · Shift để đi nhanh · Esc để thoát')
  :mode==='gaze'?(touch?'Vuốt để ngắm quanh bầu trời · Chạm vào trời để gọi sao băng':'Kéo để ngắm quanh bầu trời · Bấm vào trời để gọi sao băng · Esc để đứng dậy')
  :(touch?'Một ngón để xoay · Hai ngón để phóng to · Chạm vào trời để gọi sao băng':'Kéo để xoay · Cuộn để phóng to · Bấm vào bầu trời để gọi sao băng');}
function pressSeg(){$('#m-orbit').setAttribute('aria-pressed',mode==='orbit');$('#m-walk').setAttribute('aria-pressed',mode==='walk');}
function enterLook(m,y,p){mode=m;yaw=y;pitch=p;controls.enabled=false;canvas.classList.add('walk');dpad.hidden=m!=='walk';pressSeg();setHint();}
function leaveLook(){if(mode==='orbit')return;if(window.__POTA&&mode!=='walk'){if(mode==='scope'){closeScopeUI();camera.fov=FOV0;camera.updateProjectionMatrix();}mode='ext';tween=null;controls.enabled=false;canvas.classList.remove('walk');dpad.hidden=true;setHint();return;}const was=mode;const f=fwd(yaw,pitch);controls.target.copy(camera.position).addScaledVector(f,4);
  mode='orbit';canvas.classList.remove('walk');dpad.hidden=true;controls.enabled=true;tween=null;pressSeg();setHint();
  if(was==='scope'){closeScopeUI();const v=viewPose('scope');flyTo(v.p,v.t,1.2);}}
function startWalk(){if(mode==='walk')return;if(mode!=='orbit')leaveLook();setActive(null);
  hint.textContent='Đang đưa bạn ra cửa thang máy…';$('#m-walk').setAttribute('aria-pressed',true);$('#m-orbit').setAttribute('aria-pressed',false);
  const p=V(KS.x1+1.3,1.6,0),t=p.clone().addScaledVector(fwd(PI/2,-.08),5);flyTo(p,t,1.2,()=>enterLook('walk',PI/2,-.08));}
$('#m-orbit').addEventListener('click',()=>{leaveLook();});
$('#m-walk').addEventListener('click',startWalk);
/* ---------- telescope: look through it, zoom, pick a target ---------- */
const hudEl=$('#hud'),eyepiece=$('#eyepiece'),labelsEl=$('#d-labels'),scopebar=$('#scopebar'),sbRead=$('#sb-read'),sbTip=$('#sb-tip'),sbZoom=$('#sb-zoom'),obsBtn=$('#b-observe');
const FOV0=55,FMIN=2,FMAX=50;let fovTarget=FOV0,slew=null,linesOn=true,curTarget=null;
const TARGETS=[
  {id:'cas',name:'Tiên Hậu',fov:26,tip:'Năm sao sáng xếp thành hình chữ W ở bầu trời phía bắc.'},
  {id:'peg',name:'Phi Mã',fov:38,tip:'Bốn sao tạo thành Hình vuông lớn, gần đỉnh đầu vào các tối tháng 11.'},
  {id:'m31',name:'Thiên hà Tiên Nữ',fov:7,dir:M31,tip:'Cách khoảng 2,5 triệu năm ánh sáng: vật thể xa nhất mắt thường còn thấy được, như một vệt sáng mờ hình bầu dục.'},
  {id:'cyg',name:'Thiên Nga',fov:32,tip:'Còn gọi là Thập tự phương Bắc, nằm ngay trên Dải Ngân Hà. Sao Deneb ở đỉnh chữ thập.'},
  {id:'tri',name:'Ngưu Lang Chức Nữ',fov:46,tip:'Tam giác mùa hè: Chức Nữ (Vega), Ngưu Lang (Altair) và Deneb. Dải Ngân Hà chạy giữa đôi sao Ngưu Lang và Chức Nữ.'},
  {id:'ple',name:'Tua Rua',fov:4.5,tip:'Cụm sao trẻ cách khoảng 440 năm ánh sáng. Mắt thường thấy 6–7 sao, qua kính thấy hàng chục.'},
  {id:'core',name:'Lõi Ngân Hà',fov:30,dir:MW_CORE,tip:'Hướng về tâm thiên hà, cách khoảng 26.000 năm ánh sáng, đang lặn sát chân trời phía tây nam.'},
];
TARGETS.forEach(t=>{if(!t.dir){const c=CONST.find(c=>c.id===t.id);t.dir=c.stars.reduce((v,st)=>v.add(eq(st[0],st[1])),V(0,0,0)).normalize();}});
const tBtns=TARGETS.map(t=>{const b=document.createElement('button');b.textContent=t.name;b.addEventListener('click',()=>aimAt(t));$('#sb-targets').appendChild(b);return b;});
const labelEls=LABELS.map(L=>{const e=document.createElement('span');e.textContent=L.t;if(L.c)e.className='c';labelsEl.appendChild(e);return e;});
const COMPASS=['Bắc','Đông Bắc','Đông','Đông Nam','Nam','Tây Nam','Tây','Tây Bắc'];
const zoomToSlider=f=>Math.log(FMAX/f)/Math.log(FMAX/FMIN), sliderToFov=v=>FMAX*Math.pow(FMIN/FMAX,v);
function setFov(f){fovTarget=Math.max(FMIN,Math.min(FMAX,f));sbZoom.value=zoomToSlider(fovTarget);}
function ypOf(d){return {yaw:Math.atan2(d.x,-d.z),pitch:-Math.asin(Math.max(-.999,Math.min(.999,d.y)))};}
function aimAt(t){curTarget=t;tBtns.forEach((b,i)=>b.classList.toggle('on',TARGETS[i]===t));
  const a=ypOf(t.dir);if(t.dir.y<.03)a.pitch=Math.min(a.pitch,-.035);
  sbTip.textContent=t.name+': '+t.tip+(t.dir.y<0?' Lúc này nó đã xuống dưới đường chân trời.':'');
  if(mode==='scope'){slew=a;setFov(t.fov);}return a;}
function openScopeUI(){eyepiece.hidden=false;scopebar.hidden=false;hudEl.classList.add('scoping');obsBtn.setAttribute('aria-pressed',true);scopePivot.visible=false;}
function closeScopeUI(){eyepiece.hidden=true;scopebar.hidden=true;labelsEl.hidden=true;hudEl.classList.remove('scoping');obsBtn.setAttribute('aria-pressed',false);
  scopePivot.visible=true;conLines.visible=false;fovTarget=FOV0;slew=null;}
function enterScope(t){if(mode==='scope'){leaveLook();return;}
  if(mode!=='orbit')leaveLook();setActive(null);t=t||curTarget||TARGETS[5];const a=aimAt(t);
  hint.textContent='Đang đưa bạn tới kính thiên văn…';
  const p=MOUNT.clone();flyTo(p,p.clone().addScaledVector(fwd(a.yaw,a.pitch),5),1.6,()=>{enterLook('scope',a.yaw,a.pitch);openScopeUI();setFov(t.fov);});}
obsBtn.addEventListener('click',()=>enterScope());
$('#sb-exit').addEventListener('click',()=>leaveLook());
$('#sb-in').addEventListener('click',()=>setFov(fovTarget/1.5));
$('#sb-out').addEventListener('click',()=>setFov(fovTarget*1.5));
sbZoom.addEventListener('input',()=>{fovTarget=sliderToFov(+sbZoom.value);});
$('#sb-lines').addEventListener('click',e=>{linesOn=!linesOn;e.currentTarget.setAttribute('aria-pressed',linesOn);});
canvas.addEventListener('wheel',e=>{if(mode!=='scope')return;e.preventDefault();setFov(fovTarget*Math.exp(e.deltaY*.0015));},{passive:false});
const _lp=V(0,0,0);
function updateScopeView(){const w=innerWidth,h=innerHeight,rr=Math.min(w*.46,h*.42);
  const zoom=FOV0/camera.fov,d=fwd(yaw,pitch);let deg=Math.round(Math.asin(Math.max(-1,Math.min(1,d.y)))*180/PI);
  sbRead.textContent=`×${zoom.toFixed(zoom<10?1:0)} · hướng ${COMPASS[Math.round(realAz(d)/(PI/4))%8]} · cao ${deg}°`;
  const show=linesOn;conLines.visible=show;labelsEl.hidden=!show;if(!show)return;
  LABELS.forEach((L,i)=>{const e=labelEls[i];_lp.copy(L.d).multiplyScalar(LR).add(camera.position).project(camera);
    const x=(_lp.x*.5+.5)*w,y=(-_lp.y*.5+.5)*h;const ok=_lp.z<1&&Math.hypot(x-w/2,y-h/2)<rr-24&&L.d.y>-.02;
    e.style.display=ok?'':'none';if(ok)e.style.transform=L.c?`translate(${x}px,${y}px) translate(-50%,14px)`:`translate(${x}px,${y}px) translate(9px,-50%)`;});}

const KMAP={KeyW:'f',ArrowUp:'f',KeyS:'b',ArrowDown:'b',KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r'};
addEventListener('keydown',e=>{if(e.key==='Escape'&&mode!=='orbit'&&!(window.__POTA&&mode==='walk')){leaveLook();return;}
  if(mode!=='walk')return;if(KMAP[e.code]){keys[KMAP[e.code]]=1;e.preventDefault();}if(e.key==='Shift')keys.run=1;});
addEventListener('keyup',e=>{if(KMAP[e.code])keys[KMAP[e.code]]=0;if(e.key==='Shift')keys.run=0;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=0;});
dpad.querySelectorAll('button').forEach(b=>{const k=b.dataset.k;
  const on=e=>{e.preventDefault();keys[k]=1;b.classList.add('held');try{b.setPointerCapture(e.pointerId);}catch(_){}};
  const off=()=>{keys[k]=0;b.classList.remove('held');};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);});
let look=null,down=null,pinch=null;const ptrs=new Map();
canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now()};ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(mode==='orbit')return;look={x:e.clientX,y:e.clientY};try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  if(mode==='scope'&&ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),f:fovTarget};look=null;down=null;}});
canvas.addEventListener('pointermove',e=>{if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&ptrs.size===2){const [a,b]=[...ptrs.values()];setFov(pinch.f*pinch.d/Math.max(20,Math.hypot(a.x-b.x,a.y-b.y)));return;}
  if(!look||mode==='orbit')return;const s=(touch?.006:.0045)*(mode==='scope'?camera.fov/FOV0:1)*(window.__LOOK_K||1);slew=null;
  yaw+=(e.clientX-look.x)*s;pitch+=(e.clientY-look.y)*s;pitch=Math.max(-1.5,Math.min(mode==='scope'?.4:1.2,pitch));look={x:e.clientX,y:e.clientY};});
const dropPtr=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;};
canvas.addEventListener('pointerup',dropPtr);canvas.addEventListener('pointercancel',dropPtr);
const ray=new THREE.Raycaster();
canvas.addEventListener('pointerup',e=>{look=null;if(!down)return;const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y),dt=performance.now()-down.t;down=null;
  if(moved>7||dt>500)return;const r=canvas.getBoundingClientRect();
  ray.setFromCamera({x:(e.clientX-r.left)/r.width*2-1,y:-(e.clientY-r.top)/r.height*2+1},camera);
  if(ray.ray.direction.y>.06){if(meteorAt(ray.ray.direction,true))seen(true);}});
canvas.addEventListener('pointercancel',()=>{look=null;down=null;});
function blocked(x,z){const r=.28;if(x<X0+.35||x>X1-.35||z<Z0+.35||z>Z1-.35)return true;
  for(const c of cols){if(c.length===3){if(Math.hypot(x-c[0],z-c[1])<c[2]+r)return true;}
    else if(x>c[0]-r&&x<c[1]+r&&z>c[2]-r&&z<c[3]+r)return true;}return false;}

/* ---------- toggles, toast and the stats line ---------- */
let shower=false,lampOn=true,lampLevel=1,meteorCount=0;
const toast=$('#toast');let toastT=0;
const wishes=['Sao băng kìa! Ước một điều đi.','Thêm một ngôi sao băng. Chúc kỳ thi suôn sẻ!','Sao băng! Hít một hơi thật sâu nhé.','Một vệt sáng vừa lướt qua bầu trời.'];
function showToast(t){toast.textContent=t;toast.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>toast.classList.remove('show'),2600);}
const meta=$('#meta');
function updateMeta(){meta.textContent=`${seats} chỗ ngồi · ${plantCount} bồn cây · ${starCount.toLocaleString('vi-VN')} ngôi sao · ${meteorCount} sao băng`;}
function seen(fromClick){meteorCount++;updateMeta();chime();if(fromClick||!shower)showToast(wishes[(meteorCount-1)%wishes.length]);}
$('#t-shower').addEventListener('click',e=>{shower=!shower;e.currentTarget.setAttribute('aria-pressed',shower);
  showToast(shower?'Mưa sao băng Taurid: nhìn về phía đông':'Bầu trời trở lại yên tĩnh');});
$('#t-lamp').addEventListener('click',e=>{lampOn=!lampOn;e.currentTarget.setAttribute('aria-pressed',lampOn);});

/* ---------- ambient sound: soft wind, a slow pad, crickets, a chime for each meteor ---------- */
let ac=null,master=null,soundOn=false,cricketT=0;
function buildAudio(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;ac=new AC();
  master=ac.createGain();master.gain.value=0;const comp=ac.createDynamicsCompressor();master.connect(comp);comp.connect(ac.destination);
  const len=ac.sampleRate*4,buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);let last=0;
  for(let i=0;i<len;i++){last=(last+.02*(Math.random()*2-1))/1.02;d[i]=last*3.2;}
  const src=ac.createBufferSource();src.buffer=buf;src.loop=true;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=420;
  const wg=ac.createGain();wg.gain.value=.16;const lfo=ac.createOscillator();lfo.frequency.value=.06;const lg=ac.createGain();lg.gain.value=180;
  lfo.connect(lg);lg.connect(lp.frequency);src.connect(lp);lp.connect(wg);wg.connect(master);src.start();lfo.start();
  const pad=ac.createGain();pad.gain.value=.022;const dl=ac.createDelay(2);dl.delayTime.value=.9;const fb=ac.createGain();fb.gain.value=.35;
  pad.connect(master);pad.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(master);
  [146.83,220,277.18,329.63,440].forEach((f,i)=>{const o=ac.createOscillator();o.type=i%2?'triangle':'sine';o.frequency.value=f;o.detune.value=(i-2)*5;
    const g=ac.createGain();g.gain.value=.5;const l=ac.createOscillator();l.frequency.value=.04+i*.017;const lgg=ac.createGain();lgg.gain.value=.45;
    l.connect(lgg);lgg.connect(g.gain);o.connect(g);g.connect(pad);o.start();l.start();});
  return true;}
function cricket(){if(!soundOn||!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain(),p=ac.createStereoPanner?ac.createStereoPanner():null;
  o.type='sine';o.frequency.value=4200+Math.random()*500;g.gain.value=0;
  for(let k=0;k<3;k++){g.gain.setValueAtTime(0,t+k*.07);g.gain.linearRampToValueAtTime(.012,t+k*.07+.015);g.gain.linearRampToValueAtTime(0,t+k*.07+.05);}
  o.connect(g);if(p){p.pan.value=Math.random()*1.6-.8;g.connect(p);p.connect(master);}else g.connect(master);o.start(t);o.stop(t+.3);
  cricketT=setTimeout(cricket,700+Math.random()*2600);}
function chime(){if(!soundOn||!ac)return;const t=ac.currentTime;[1318.5,1975.5].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05/(i+1),t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+2.4);o.connect(g);g.connect(master);o.start(t);o.stop(t+2.5);});}
$('#t-sound').addEventListener('click',e=>{const b=e.currentTarget;
  if(!ac&&!buildAudio()){showToast('Trình duyệt này không phát được âm thanh');return;}
  soundOn=!soundOn;b.setAttribute('aria-pressed',soundOn);
  if(soundOn){ac.resume();master.gain.cancelScheduledValues(ac.currentTime);master.gain.setTargetAtTime(.9,ac.currentTime,.8);clearTimeout(cricketT);cricketT=setTimeout(cricket,1200);}
  else{master.gain.cancelScheduledValues(ac.currentTime);master.gain.setTargetAtTime(0,ac.currentTime,.3);clearTimeout(cricketT);}});

/* ---------- resize ---------- */
let started=false;
function resize(W,H){const w=W||innerWidth,h=H||innerHeight;
  if(!w||!h)return;
  camera.aspect=w/h;camera.updateProjectionMatrix();
  if(composer){composer.setPixelRatio(Math.min(DPR,1.5));composer.setSize(w,h);}
  if(!started&&!window.__POTA){started=true;intro();}
  else if(!isFinite(camera.position.x)){const v=viewPose('overview');camera.position.copy(v.p);controls.target.copy(v.t);}}

canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();hint.textContent='Trình duyệt tạm ngắt đồ họa. Hãy tải lại trang nếu cảnh không tự hiện lại.';});
canvas.addEventListener('webglcontextrestored',()=>setHint());
function intro(){const {p,t}=viewPose('overview');camera.position.copy(p).sub(t).multiplyScalar(1.5).add(t).add(V(8,14,10));controls.target.copy(t);flyTo(p,t,2.6);}
updateMeta();setHint();

/* ---------- loop ---------- */
let last=performance.now(),nextMeteor=2.5,nextShower=0,elapsed=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;elapsed+=dt;
  if(tween){const k=Math.min(1,(now-tween.s)/tween.d),e=ease(k);
    camera.position.lerpVectors(tween.p0,tween.p1,e);controls.target.lerpVectors(tween.t0,tween.t1,e);camera.lookAt(controls.target);
    if(k>=1){const d=tween.done;tween=null;d&&d();}}
  if(mode==='walk'||mode==='gaze'||mode==='scope'){
    if(mode==='scope'&&slew){const k=Math.min(1,dt*3.2);let dy=((slew.yaw-yaw+3*PI)%(2*PI))-PI;yaw+=dy*k;pitch+=(slew.pitch-pitch)*k;
      if(Math.abs(dy)<.0005&&Math.abs(slew.pitch-pitch)<.0005)slew=null;}
    if(mode==='walk'){const sp=(keys.run?5.5:2.8)*dt*(window.__WALK_K||1),fx=Math.sin(yaw),fz=-Math.cos(yaw);
      let mx=(keys.f-keys.b)*fx+(keys.r-keys.l)*-fz,mz=(keys.f-keys.b)*fz+(keys.r-keys.l)*fx;
      const len=Math.hypot(mx,mz);if(len>0){mx=mx/len*sp;mz=mz/len*sp;const p=camera.position;if(!blocked(p.x+mx,p.z))p.x+=mx;if(!blocked(p.x,p.z+mz))p.z+=mz;}
      camera.position.y=1.6+(Math.hypot(camera.position.x-SD.x,camera.position.z-SD.z)<SD.r?SD.h:0);}
    camera.rotation.order='YXZ';camera.rotation.set(-pitch,-yaw,0);
  }else if(!tween&&mode==='orbit')controls.update();
  /* the sky stays infinitely far: it travels with the camera */
  sky.position.copy(camera.position);skyGroup.position.copy(camera.position);
  starMat.uniforms.uTime.value=elapsed;
  /* telescope zoom, readout, labels; the tube follows your gaze */
  const ft=mode==='scope'?fovTarget:FOV0;if(Math.abs(camera.fov-ft)>.005){camera.fov+=(ft-camera.fov)*Math.min(1,dt*(reduceMotion?30:4));camera.updateProjectionMatrix();}
  starMat.uniforms.uZoom.value=FOV0/camera.fov;
  if(mode==='scope'){updateScopeView();scopePivot.lookAt(_lp.copy(MOUNT).add(fwd(yaw,pitch)));}
  /* shooting stars */
  nextMeteor-=dt;if(nextMeteor<=0){if(randomMeteor()&&!shower)seen(false);nextMeteor=rnd(5,11);}
  if(shower){nextShower-=dt;if(nextShower<=0){if(showerMeteor()){meteorCount++;updateMeta();if(Math.random()<.3)chime();}nextShower=rnd(.25,.9);}}
  updateMeteors(dt);updateTraffic(dt);
  /* lamps fade in and out */
  const lt=lampOn?1:.06;if(Math.abs(lt-lampLevel)>.002){lampLevel+=(lt-lampLevel)*Math.min(1,dt*3.5);
    for(const m of glow)m.color.copy(m.userData.base).multiplyScalar(lampLevel);for(const l of warm)l.intensity=l.userData.base*lampLevel;}
  beaconMat.color.setRGB(3,.25,.15).multiplyScalar((Math.sin(elapsed*2.4)>.55)?1:.12);
  ME.onFrame&&ME.onFrame(dt,now,camera);
  if(composer){finalPass.uniforms.uTime.value=elapsed;composer.render(dt);}else renderer.render(scene,camera);
  ME.afterFrame&&ME.afterFrame();}

/* ---------- giao diện cho Phòng ôn thi ảo ---------- */
const lights=[];scene.traverse(o=>{if(o.isLight)lights.push(o);});
function seatList(){const out=[];
  for(const s of SEATS){const c=Math.cos(s.ry),sn=Math.sin(s.ry);
    if(s.n==='bench')for(const lx of [-.45,.45])out.push({x:s.x+c*lx,y:0,z:s.z-sn*lx,ry:s.ry,kind:'bench'});
    else if(s.n==='lounger')out.push({x:s.x,y:0,z:s.z+.35,ry:s.ry,kind:'lounger'});
    else out.push({x:s.x,y:-.1,z:s.z,ry:s.ry+PI,kind:'beanbag'});}
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
};

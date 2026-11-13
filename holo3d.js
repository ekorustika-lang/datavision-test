/* DataVision 2.0 (živi hologram) – 3D hologram lika DATA (Three.js/WebGL). Ako WebGL ne radi, ostaje 2D hologram iz v1.0. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const stage=document.querySelector('.stage'),app=document.getElementById('app');
const canvas=document.createElement('canvas');canvas.id='holo3d';
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
stage.prepend(canvas);stage.classList.add('has3d');
const mobile=/Android|iPhone|iPad/i.test(navigator.userAgent)||innerWidth<700;
renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.75:2));renderer.setClearColor(0,0);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.1,50);camera.position.set(0,.15,7.2);
const C1=new THREE.Color('#46E5FF'),C2=new THREE.Color('#087DFA'),CG=new THREE.Color('#39FF14');
const g=(a,b,s)=>Math.exp(-((a-b)**2)/(2*s*s));
const g2=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)**2)/(2*sx*sx)+((y-cy)**2)/(2*sy*sy)));
/* oblik glave: sfera deformirana u muško lice */
let W={s:0,b:0,l:0};
function shapeHead(v){const{x,y,z}=v;W.s=g2(Math.abs(x),y,.17,-.45,.06,.05)*Math.max(0,z);W.b=g(y,.25,.06)*g(Math.abs(x),.28,.16)*Math.max(0,z);W.l=g2(x,y,0,-.46,.17,.06)*Math.max(0,z);const f=Math.max(0,z);let X=x*.80,Y=y*1.06,Z=z*.92;
 if(y<-.1){const k=Math.min(1,(-y-.1)/.9);X*=1-.36*k;Z*=1-.12*k*(1-f);}
 let d=.06*g(y,.24,.06)*g(Math.abs(x),.28,.2)*f            // obrve
  -.10*g2(Math.abs(x),y,.29,.10,.11,.075)*f                   // očne duplje
  +.25*g(x,0,.065+.06*Math.max(0,.1-y))*((y<.16&&y>-.3)?Math.pow(Math.sin(Math.PI*(y+.3)/.46),.7):0)*f // nos
  +.06*g2(x,y,0,-.30,.07,.04)*f                               // vrh nosa
  +.05*g2(Math.abs(x),y,.45,-.05,.12,.1)*f                    // jagodice
  +.055*g2(x,y,0,-.43,.15,.035)*f-.03*g2(x,y,0,-.47,.14,.012)*f+.04*g2(x,y,0,-.51,.13,.03)*f // usne
  +.07*g2(x,y,0,-.76,.17,.08)*f+.035*g2(Math.abs(x),y,.42,-.62,.1,.12)*f-.025*g2(Math.abs(x),y,.33,-.38,.07,.1)*f+.02*g2(x,y,0,-.36,.035,.03)*f                               // brada
  +.06*g2(Math.abs(x),y,.97,.02,.06,.15)*(1-f);               // uši
 const n=Math.hypot(X,Y,Z)||1;v.set(X+X/n*d,Y+Y/n*d,Z+Z/n*d);
 return (y<-.47?Math.min(1,(-y-.47)/.12):0)*Math.max(0,Math.min(1,z+.2));}
const seg=mobile?120:170,headGeo=new THREE.SphereGeometry(1,seg,seg);
const pos=headGeo.attributes.position,jaw=new Float32Array(pos.count),smA=new Float32Array(pos.count),brA=new Float32Array(pos.count),lpA=new Float32Array(pos.count),t3=new THREE.Vector3();
for(let i=0;i<pos.count;i++){t3.fromBufferAttribute(pos,i);const sx0=t3.x;jaw[i]=shapeHead(t3);smA[i]=W.s*Math.sign(sx0);brA[i]=W.b;lpA[i]=W.l;pos.setXYZ(i,t3.x,t3.y,t3.z);}
headGeo.setAttribute('jaw',new THREE.BufferAttribute(jaw,1));headGeo.setAttribute('sm',new THREE.BufferAttribute(smA,1));headGeo.setAttribute('br',new THREE.BufferAttribute(brA,1));headGeo.setAttribute('lp',new THREE.BufferAttribute(lpA,1));headGeo.computeVertexNormals();
const U={uT:{value:0},uMouth:{value:0},uSmile:{value:0},uBrow:{value:0},uRound:{value:0},uGlow:{value:0},cg:{value:CG},uPulse:{value:0},uFlick:{value:1},c1:{value:C1},c2:{value:C2}};
const vs=`attribute float jaw,sm,br,lp;uniform float uMouth,uSmile,uBrow,uRound;varying vec3 vN,vV,vP;varying float vLip;
void main(){vec3 p=position;p.y-=jaw*uMouth*.11;p.z-=jaw*uMouth*.03;float aS=abs(sm);p.y+=aS*uSmile*.05;p.x+=sm*uSmile*.03;p.z-=aS*uSmile*.015;p.y+=br*uBrow*.045;p.x*=1.-lp*uRound*.28;p.z+=lp*uRound*.03;vLip=lp+aS;vec4 mv=modelViewMatrix*vec4(p,1.);
vN=normalize(normalMatrix*normal);vV=-mv.xyz;vP=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*mv;gl_PointSize=2.2;}`;
const fs=`uniform float uT,uPulse,uFlick,uGlow;uniform vec3 c1,c2,cg;varying vec3 vN,vV,vP;varying float vLip;
void main(){vec3 n=normalize(vN),v=normalize(vV);float fr=pow(1.-abs(dot(n,v)),2.2);
float scan=.6+.4*sin(vP.y*120.-uT*6.);float band=smoothstep(.06,0.,abs(fract(vP.y*.3-uT*.22)-.5));
float l=max(dot(n,normalize(vec3(.4,.6,1.))),0.);vec3 col=mix(c2,c1,fr*.8+l*.4);float fl=smoothstep(.985,1.,sin(vP.x*38.+vP.y*6.+uT*.8))*.5+smoothstep(.99,1.,sin(vP.y*55.-uT*1.5))*.35;col=mix(col,cg,fl*.5+clamp(vLip,0.,1.)*.15*uGlow);
float a=(fr*1.1+.08+l*.25)*scan+band*.35+fl*.45;a*=uFlick*(1.+uPulse*.9);
gl_FragColor=vec4(col*(1.+uPulse*.5+band),a*smoothstep(-2.4,-1.3,vP.y)*.85);}`;
const mat=new THREE.ShaderMaterial({uniforms:U,vertexShader:vs,fragmentShader:fs,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
const ptsMat=new THREE.ShaderMaterial({uniforms:U,vertexShader:vs,fragmentShader:`varying float vLip;uniform float uFlick,uPulse;uniform vec3 c1;varying vec3 vP;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(c1,(1.-d*2.)*.5*uFlick*(1.+uPulse)*smoothstep(-2.4,-1.3,vP.y));}`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
const z0=n=>new THREE.BufferAttribute(new Float32Array(n),1);
const rig=new THREE.Group();scene.add(rig);
const head=new THREE.Group();head.position.y=.62;rig.add(head);
head.add(new THREE.Mesh(headGeo,mat));const pts=new THREE.Points(headGeo,ptsMat);pts.scale.setScalar(1.006);head.add(pts);
/* oči */
function glowTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const r=x.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(240,255,235,1)');r.addColorStop(.25,'rgba(70,229,255,.55)');r.addColorStop(1,'rgba(8,125,250,0)');x.fillStyle=r;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
const gt=glowTex(),add={transparent:true,blending:THREE.AdditiveBlending,depthWrite:false};const eyes=[];
for(const sx of[-1,1]){const p=new THREE.Vector3(sx*.36,.10,.93).normalize();shapeHead(p);const e=new THREE.Group();e.position.copy(p).multiplyScalar(.95);
 const iris=new THREE.Mesh(new THREE.RingGeometry(.02,.05,40),new THREE.MeshBasicMaterial({color:0xF5FAFF,opacity:.95,...add}));
 const pupil=new THREE.Mesh(new THREE.CircleGeometry(.018,24),new THREE.MeshBasicMaterial({color:CG,opacity:.9,...add}));
 const lid=new THREE.Mesh(new THREE.RingGeometry(.075,.085,40,1,0,Math.PI),new THREE.MeshBasicMaterial({color:C1,opacity:.6,...add}));
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,opacity:.75,...add}));s.scale.setScalar(.3);
 iris.position.z=pupil.position.z=lid.position.z=.06;const gz=new THREE.Group();gz.add(iris,pupil);e.add(s,gz,lid);head.add(e);e.userData={gz,s};eyes.push(e);
 const bc=[];for(let k=0;k<=24;k++){const a=k/24;bc.push(new THREE.Vector3((a-.5)*.3,.035*Math.sin(a*Math.PI)-(sx>0?a:1-a)*.02,0));}
 const brow=new THREE.Line(new THREE.BufferGeometry().setFromPoints(bc),new THREE.LineBasicMaterial({color:CG,opacity:.6,...add}));brow.position.set(e.position.x,e.position.y+.16,e.position.z+.04);head.add(brow);e.userData.brow=brow;e.userData.by=brow.position.y;}
/* vrat i ramena */
const neckGeo=new THREE.CylinderGeometry(.34,.44,1.0,64,24,true);neckGeo.setAttribute('jaw',z0(neckGeo.attributes.position.count));
const neck=new THREE.Mesh(neckGeo,mat);neck.position.y=-.45;neck.scale.z=.85;rig.add(neck);
const shGeo=new THREE.SphereGeometry(1,mobile?90:130,60,0,Math.PI*2,0,Math.PI*.58);shGeo.setAttribute('jaw',z0(shGeo.attributes.position.count));
const sh=new THREE.Mesh(shGeo,mat);sh.scale.set(1.9,.85,.85);sh.position.y=-1.45;rig.add(sh);
const shP=new THREE.Points(shGeo,ptsMat);shP.scale.set(1.91,.86,.86);shP.position.y=-1.45;rig.add(shP);
/* energetski prstenovi */
const ringG=new THREE.Group();ringG.position.y=-.1;scene.add(ringG);
const ring1=new THREE.Mesh(new THREE.TorusGeometry(2.05,.012,8,200),new THREE.MeshBasicMaterial({color:C1,opacity:.85,...add}));
const ring2=new THREE.Mesh(new THREE.TorusGeometry(2.2,.006,6,200,Math.PI*1.3),new THREE.MeshBasicMaterial({color:CG,opacity:.55,...add}));
const nodes=new THREE.Group();for(let i=0;i<6;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,opacity:.9,...add}));const a=i/6*Math.PI*2;s.position.set(Math.cos(a)*2.05,Math.sin(a)*2.05,0);s.scale.setScalar(.16);nodes.add(s);}
const rr=new THREE.Group();rr.add(ring1,ring2,nodes);rr.rotation.x=Math.PI/2.25;ringG.add(rr);
/* čestice */
const PN=mobile?380:700,pg=new THREE.BufferGeometry(),pa=new Float32Array(PN*3),pv=new Float32Array(PN);
for(let i=0;i<PN;i++){const a=Math.random()*6.28,r=1+Math.random()*1.8;pa[i*3]=Math.cos(a)*r;pa[i*3+1]=Math.random()*5-2.5;pa[i*3+2]=Math.sin(a)*r*.6;pv[i]=.003+Math.random()*.008;}
pg.setAttribute('position',new THREE.BufferAttribute(pa,3));
const parts=new THREE.Points(pg,new THREE.PointsMaterial({color:C1,size:.035,map:gt,opacity:.8,...add}));scene.add(parts);
/* digitalne linije (podatkovni tokovi) */
const LN=26,lg=new THREE.BufferGeometry(),la=new Float32Array(LN*6),ls=[];
for(let i=0;i<LN;i++){const a=Math.random()*6.28,r=1.4+Math.random()*1.1;ls.push({x:Math.cos(a)*r,z:Math.sin(a)*r*.5,y:Math.random()*5-2.5,l:.2+Math.random()*.5,v:.01+Math.random()*.025});}
lg.setAttribute('position',new THREE.BufferAttribute(la,3));
const lines=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:C1,opacity:.45,...add}));scene.add(lines);
/* veličina */
function rs(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
rs();addEventListener('resize',rs);
/* GOVOR: preglednik ne daje pristup zvuku ugrađenog glasa, pa usta prate stvarne granice riječi (onboundary) te stvarni početak i kraj govora. */
const clock=new THREE.Clock();let kick=0,lastKick=-9,vow=0;
window.dvSpeechKick=(w)=>{kick=1;lastKick=clock.elapsedTime;w=(w||'').toLowerCase();vow=/[ou]/.test(w.slice(0,3))?1:0;};
/* IZRAZI: vizualni signal stanja razgovora, a ne tvrdnja da AI osjeća */
let emo='neutral',emoUntil=0,nodT=-9;
window.dvEmotion=(e,dur=2.5)=>{emo=e;emoUntil=clock.elapsedTime+dur;if(e==='greet'||e==='understand')nodT=clock.elapsedTime;};
const E={neutral:[.08,0],joy:[.8,.25],greet:[1,.45],interest:[.15,.75],thinking:[0,-.3],understand:[.55,.3],concern:[-.15,-.45]};
let mouth=0,pulse=0,blink=0,nextBlink=2,smile=0,brow=0,round=0,glow=0,gx=0,gy=0,tgx=0,tgy=0,nextSacc=1,visible=true;
document.addEventListener('visibilitychange',()=>{visible=!document.hidden;});
const lerp=(a,b,k)=>a+(b-a)*Math.min(1,k);
function loop(){requestAnimationFrame(loop);if(!visible)return;const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
 const st=app.classList;U.uT.value=t;
 const speaking=st.contains('speaking'),listening=st.contains('listening'),thinking=st.contains('thinking');
 let cur=t<emoUntil?emo:(listening?'interest':thinking?'thinking':'neutral');
 /* usta: otvaranje po riječi, prirodno zatvaranje između riječi, mir nakon govora */
 let target=0;if(speaking){const since=t-lastKick;kick*=Math.pow(.02,dt);
  const syl=.5+.5*Math.sin(t*13.5);target=since<.6?(.18+.5*kick+.22*syl*(1-since/.6)):.12+.1*syl;}
 mouth=lerp(mouth,target,dt*16);U.uMouth.value=mouth;
 round=lerp(round,speaking?vow*.8*mouth:0,dt*8);U.uRound.value=round;
 const ex=E[cur]||E.neutral;smile=lerp(smile,ex[0]*(speaking?.5:1),dt*3);brow=lerp(brow,ex[1]+(speaking?.12*kick:0),dt*4);
 U.uSmile.value=smile;U.uBrow.value=brow;glow=lerp(glow,speaking?1:0,dt*4);U.uGlow.value=glow;
 const pT=listening?.55+.45*Math.sin(t*5.5):thinking?.25+.2*Math.sin(t*9):speaking?.15+.2*kick:0;pulse=lerp(pulse,pT,dt*6);U.uPulse.value=pulse;
 U.uFlick.value=(Math.random()<.015?.7:1)*(.95+.05*Math.sin(t*37));
 /* pogled: kratki pomaci očiju, prema korisniku kod slušanja/pozdrava, sa strane kod razmišljanja */
 if(t>nextSacc){const look=listening||cur==='greet'||speaking;tgx=look?(Math.random()-.5)*.006:(Math.random()-.5)*.03;tgy=thinking?.012:(Math.random()-.5)*.008;if(thinking)tgx=.02*(Math.random()<.5?-1:1);nextSacc=t+(look?.9:1.4)+Math.random()*1.8;}
 gx=lerp(gx,tgx,dt*14);gy=lerp(gy,tgy,dt*14);
 /* glava: sporo okretanje, kimanje kod pozdrava i razumijevanja */
 const nod=t-nodT<1.4?Math.sin((t-nodT)/1.4*Math.PI*2)*.09*(1-(t-nodT)/1.4):0;
 const calm=(listening||cur==='greet')?.35:1;
 head.rotation.y=lerp(head.rotation.y,(Math.sin(t*.35)*.22+Math.sin(t*.13)*.08)*calm+gx*4,dt*2);
 head.rotation.x=lerp(head.rotation.x,Math.sin(t*.27)*.05-(listening?.05:0)+(thinking?-.04:0),dt*2)+nod;
 head.rotation.z=Math.sin(t*.21)*.03+(thinking?.04:0);
 rig.position.y=Math.sin(t*.8)*.04;
 if(t>nextBlink){blink=1;nextBlink=t+2.2+Math.random()*3.5;if(Math.random()<.15)nextBlink=t+.35;}blink=Math.max(0,blink-dt*6.5);
 for(const e of eyes){const u=e.userData;e.scale.y=1-Math.sin(blink*Math.PI)*.9;u.gz.position.set(gx,gy,0);
  u.s.material.opacity=.55+pulse*.3+glow*.25+(thinking?.2*Math.sin(t*10):0);u.brow.position.y=u.by+brow*.03;}
 rr.rotation.z+=dt*(.25+pulse*.6);ring2.rotation.z-=dt*.5;ringG.rotation.y=Math.sin(t*.2)*.15;
 for(let i=0;i<PN;i++){pa[i*3+1]+=pv[i]*(1+pulse*2);if(pa[i*3+1]>2.6)pa[i*3+1]=-2.6;}pg.attributes.position.needsUpdate=true;parts.rotation.y+=dt*.05;
 ls.forEach((s,i)=>{s.y+=s.v*(1+glow);if(s.y>2.8)s.y=-2.8;la.set([s.x,s.y,s.z,s.x,s.y+s.l,s.z],i*6);});lg.attributes.position.needsUpdate=true;
 renderer.render(scene,camera);}
loop();



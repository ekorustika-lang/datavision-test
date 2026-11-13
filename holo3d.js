/* DataVision 2.0 – 3D hologram lika DATA (Three.js/WebGL). Ako WebGL ne radi, ostaje 2D hologram iz v1.0. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const stage=document.querySelector('.stage'),app=document.getElementById('app');
const canvas=document.createElement('canvas');canvas.id='holo3d';
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
stage.prepend(canvas);stage.classList.add('has3d');
const mobile=/Android|iPhone|iPad/i.test(navigator.userAgent)||innerWidth<700;
renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.75:2));renderer.setClearColor(0,0);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.1,50);camera.position.set(0,.15,7.2);
const C1=new THREE.Color('#39FF14'),C2=new THREE.Color('#1FBF0A');
const g=(a,b,s)=>Math.exp(-((a-b)**2)/(2*s*s));
const g2=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)**2)/(2*sx*sx)+((y-cy)**2)/(2*sy*sy)));
/* oblik glave: sfera deformirana u muško lice */
function shapeHead(v){const{x,y,z}=v;const f=Math.max(0,z);let X=x*.80,Y=y*1.06,Z=z*.92;
 if(y<-.1){const k=Math.min(1,(-y-.1)/.9);X*=1-.36*k;Z*=1-.12*k*(1-f);}
 let d=.06*g(y,.24,.06)*g(Math.abs(x),.28,.2)*f            // obrve
  -.10*g2(Math.abs(x),y,.29,.10,.11,.075)*f                   // očne duplje
  +.25*g(x,0,.065+.06*Math.max(0,.1-y))*((y<.16&&y>-.3)?Math.pow(Math.sin(Math.PI*(y+.3)/.46),.7):0)*f // nos
  +.06*g2(x,y,0,-.30,.07,.04)*f                               // vrh nosa
  +.05*g2(Math.abs(x),y,.45,-.05,.12,.1)*f                    // jagodice
  +.055*g2(x,y,0,-.43,.15,.035)*f-.03*g2(x,y,0,-.47,.14,.012)*f+.04*g2(x,y,0,-.51,.13,.03)*f // usne
  +.07*g2(x,y,0,-.76,.17,.08)*f                               // brada
  +.06*g2(Math.abs(x),y,.97,.02,.06,.15)*(1-f);               // uši
 const n=Math.hypot(X,Y,Z)||1;v.set(X+X/n*d,Y+Y/n*d,Z+Z/n*d);
 return (y<-.47?Math.min(1,(-y-.47)/.12):0)*Math.max(0,Math.min(1,z+.2));}
const seg=mobile?120:170,headGeo=new THREE.SphereGeometry(1,seg,seg);
const pos=headGeo.attributes.position,jaw=new Float32Array(pos.count),t3=new THREE.Vector3();
for(let i=0;i<pos.count;i++){t3.fromBufferAttribute(pos,i);jaw[i]=shapeHead(t3);pos.setXYZ(i,t3.x,t3.y,t3.z);}
headGeo.setAttribute('jaw',new THREE.BufferAttribute(jaw,1));headGeo.computeVertexNormals();
const U={uT:{value:0},uMouth:{value:0},uPulse:{value:0},uFlick:{value:1},c1:{value:C1},c2:{value:C2}};
const vs=`attribute float jaw;uniform float uMouth;varying vec3 vN,vV,vP;
void main(){vec3 p=position;p.y-=jaw*uMouth*.11;p.z-=jaw*uMouth*.03;vec4 mv=modelViewMatrix*vec4(p,1.);
vN=normalize(normalMatrix*normal);vV=-mv.xyz;vP=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*mv;gl_PointSize=2.2;}`;
const fs=`uniform float uT,uPulse,uFlick;uniform vec3 c1,c2;varying vec3 vN,vV,vP;
void main(){vec3 n=normalize(vN),v=normalize(vV);float fr=pow(1.-abs(dot(n,v)),2.2);
float scan=.6+.4*sin(vP.y*120.-uT*6.);float band=smoothstep(.06,0.,abs(fract(vP.y*.3-uT*.22)-.5));
float l=max(dot(n,normalize(vec3(.4,.6,1.))),0.);vec3 col=mix(c2,c1,fr*.8+l*.4);
float a=(fr*1.1+.08+l*.25)*scan+band*.35;a*=uFlick*(1.+uPulse*.9);
gl_FragColor=vec4(col*(1.+uPulse*.5+band),a*smoothstep(-2.4,-1.3,vP.y)*.85);}`;
const mat=new THREE.ShaderMaterial({uniforms:U,vertexShader:vs,fragmentShader:fs,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
const ptsMat=new THREE.ShaderMaterial({uniforms:U,vertexShader:vs,fragmentShader:`uniform float uFlick,uPulse;uniform vec3 c1;varying vec3 vP;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(c1,(1.-d*2.)*.5*uFlick*(1.+uPulse)*smoothstep(-2.4,-1.3,vP.y));}`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
const z0=n=>new THREE.BufferAttribute(new Float32Array(n),1);
const rig=new THREE.Group();scene.add(rig);
const head=new THREE.Group();head.position.y=.62;rig.add(head);
head.add(new THREE.Mesh(headGeo,mat));const pts=new THREE.Points(headGeo,ptsMat);pts.scale.setScalar(1.006);head.add(pts);
/* oči */
function glowTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const r=x.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(240,255,235,1)');r.addColorStop(.25,'rgba(57,255,20,.55)');r.addColorStop(1,'rgba(31,191,10,0)');x.fillStyle=r;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
const gt=glowTex(),add={transparent:true,blending:THREE.AdditiveBlending,depthWrite:false};const eyes=[];
for(const sx of[-1,1]){const p=new THREE.Vector3(sx*.36,.10,.93).normalize();shapeHead(p);const e=new THREE.Group();e.position.copy(p).multiplyScalar(.95);
 const iris=new THREE.Mesh(new THREE.RingGeometry(.02,.05,40),new THREE.MeshBasicMaterial({color:0xF5FAFF,opacity:.95,...add}));
 const pupil=new THREE.Mesh(new THREE.CircleGeometry(.018,24),new THREE.MeshBasicMaterial({color:C1,opacity:.9,...add}));
 const lid=new THREE.Mesh(new THREE.RingGeometry(.075,.085,40,1,0,Math.PI),new THREE.MeshBasicMaterial({color:C1,opacity:.6,...add}));
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,opacity:.75,...add}));s.scale.setScalar(.3);
 iris.position.z=pupil.position.z=lid.position.z=.06;e.add(s,iris,pupil,lid);head.add(e);eyes.push(e);}
/* vrat i ramena */
const neckGeo=new THREE.CylinderGeometry(.34,.44,1.0,64,24,true);neckGeo.setAttribute('jaw',z0(neckGeo.attributes.position.count));
const neck=new THREE.Mesh(neckGeo,mat);neck.position.y=-.45;neck.scale.z=.85;rig.add(neck);
const shGeo=new THREE.SphereGeometry(1,mobile?90:130,60,0,Math.PI*2,0,Math.PI*.58);shGeo.setAttribute('jaw',z0(shGeo.attributes.position.count));
const sh=new THREE.Mesh(shGeo,mat);sh.scale.set(1.9,.85,.85);sh.position.y=-1.45;rig.add(sh);
const shP=new THREE.Points(shGeo,ptsMat);shP.scale.set(1.91,.86,.86);shP.position.y=-1.45;rig.add(shP);
/* energetski prstenovi */
const ringG=new THREE.Group();ringG.position.y=-.1;scene.add(ringG);
const ring1=new THREE.Mesh(new THREE.TorusGeometry(2.05,.012,8,200),new THREE.MeshBasicMaterial({color:C1,opacity:.85,...add}));
const ring2=new THREE.Mesh(new THREE.TorusGeometry(2.2,.006,6,200,Math.PI*1.3),new THREE.MeshBasicMaterial({color:C2,opacity:.9,...add}));
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
/* sinkronizacija govora: app.js javlja granice riječi (onboundary) */
let kick=0;window.dvSpeechKick=()=>{kick=1;};
let mouth=0,pulse=0,blink=0,nextBlink=2;const clock=new THREE.Clock();let visible=true;
document.addEventListener('visibilitychange',()=>visible=!document.hidden);
function loop(){requestAnimationFrame(loop);if(!visible)return;const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
 const st=app.classList;U.uT.value=t;
 const speaking=st.contains('speaking'),listening=st.contains('listening'),thinking=st.contains('thinking');
 let target=0;if(speaking){kick*=.86;target=Math.max(kick*.9,.25+.35*Math.abs(Math.sin(t*11)*Math.sin(t*4.3)));}
 mouth+=(target-mouth)*Math.min(1,dt*18);U.uMouth.value=mouth;
 const pT=listening?.55+.45*Math.sin(t*5.5):thinking?.25+.2*Math.sin(t*9):speaking?.2:0;pulse+=(pT-pulse)*Math.min(1,dt*6);U.uPulse.value=pulse;
 U.uFlick.value=(Math.random()<.025?.55:1)*(.94+.06*Math.sin(t*37));
 head.rotation.y=Math.sin(t*.35)*.28+Math.sin(t*.13)*.1;head.rotation.x=Math.sin(t*.27)*.07-(listening?.06:0);head.rotation.z=Math.sin(t*.21)*.03;
 rig.position.y=Math.sin(t*.8)*.04;
 if(t>nextBlink){blink=1;nextBlink=t+2.5+Math.random()*3;}blink=Math.max(0,blink-dt*7);
 for(const e of eyes){e.scale.y=1-Math.sin(blink*Math.PI)*.9;e.children[0].material.opacity=.6+pulse*.4+(thinking?.3*Math.sin(t*14):0);}
 rr.rotation.z+=dt*(.25+pulse*.6);ring2.rotation.z-=dt*.5;ringG.rotation.y=Math.sin(t*.2)*.15;
 for(let i=0;i<PN;i++){pa[i*3+1]+=pv[i]*(1+pulse*2);if(pa[i*3+1]>2.6)pa[i*3+1]=-2.6;}pg.attributes.position.needsUpdate=true;parts.rotation.y+=dt*.05;
 ls.forEach((s,i)=>{s.y+=s.v;if(s.y>2.8)s.y=-2.8;la.set([s.x,s.y,s.z,s.x,s.y+s.l,s.z],i*6);});lg.attributes.position.needsUpdate=true;
 renderer.render(scene,camera);}
loop();

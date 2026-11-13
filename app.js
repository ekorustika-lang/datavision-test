/* ===== AI KONFIGURACIJA =====
   Kad Cloudflare Worker "Ekorustika-data-ai" bude spreman, ovdje upiši samo njegov URL.
   API ključevi ostaju ISKLJUČIVO u Workeru (secrets), nikad u ovoj datoteci. */
const AI_ENDPOINT = ""; // npr. "https://ekorustika-data-ai.<racun>.workers.dev/chat"

const $=s=>document.querySelector(s), app=$('#app'), chat=$('#chat'), mode=$('#mode');
const GREETING="Pozdrav. Data je ovdje. DataVision je aktivan. Što danas radimo?";
if(AI_ENDPOINT){mode.textContent="AI POVEZAN";mode.style.color=mode.style.borderColor="#46E5FF";}
const LABEL={idle:"Spreman",listening:"Slušam",thinking:"Razmišljam",speaking:"Govorim"};
function setState(s){app.classList.remove('listening','thinking','speaking');if(s!=='idle')app.classList.add(s);$('#status').textContent=LABEL[s];}
function add(text,who){const e=chat.querySelector('.empty');if(e)e.remove();const d=document.createElement('div');d.className='msg '+who;d.textContent=text;chat.appendChild(d);chat.scrollTop=chat.scrollHeight;}

/* --- Glas (hr-HR, muški ako postoji) --- */
let voice=null;
function pickVoice(){const v=speechSynthesis.getVoices().filter(x=>/^hr/i.test(x.lang));
 voice=v.find(x=>/male|muš|srecko|matej|ivan|google/i.test(x.name)&&!/female|žen|gabrijela/i.test(x.name))||v[0]||null;}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice;}
let mouthT;
function speak(text){return new Promise(res=>{
 if(!('speechSynthesis' in window)){res();return;}
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='hr-HR';u.rate=.95;u.pitch=.85;if(voice)u.voice=voice;
 const m=$('#mouth');u.onstart=()=>{setState('speaking');mouthT=setInterval(()=>m.style.transform=`scaleY(${1+Math.random()*4})`,90);};
 const end=()=>{clearInterval(mouthT);m.style.transform='';setState('idle');res();};u.onboundary=ev=>{window.dvSpeechKick&&window.dvSpeechKick(ev&&ev.charIndex!=null?text.substr(ev.charIndex,4):'');};u.onend=end;u.onerror=end;speechSynthesis.speak(u);});}

/* --- Odgovor: pravi AI preko Workera ili jasno označen demo --- */
async function answer(q){
 add(q,'u');setState('thinking');let r;
 if(AI_ENDPOINT){try{const x=await fetch(AI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q,source:'datavision'})});const j=await x.json();r=j.reply||j.text||"Nisam dobio odgovor od servera.";}catch(e){r="Veza s AI serverom trenutno nije uspjela.";}}
 else{await new Promise(t=>setTimeout(t,700));r="Demo način rada: AI još nije povezan. Primio sam poruku, a pravi odgovori stižu kad spojimo Ekorustika-data-ai.";}
 emo('understand',1.6);add(r,'d');await speak(r);emo('joy',2);}

const emo=(e,d)=>window.dvEmotion&&window.dvEmotion(e,d);
$('#start').onclick=async()=>{emo('greet',3);add(GREETING,'d');await speak(GREETING);emo('joy',2);};
$('#f').onsubmit=e=>{e.preventDefault();const q=$('#q').value.trim();if(!q)return;$('#q').value='';answer(q);};

/* --- Mikrofon: samo na klik + dopuštenje preglednika --- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
$('#mic').onclick=()=>{
 if(!SR){add("Ovaj preglednik ne podržava prepoznavanje govora. Probaj Chrome na Androidu.",'d');return;}
 speechSynthesis&&speechSynthesis.cancel();const rec=new SR();rec.lang='hr-HR';rec.interimResults=false;
 rec.onstart=()=>setState('listening');
 rec.onresult=e=>answer(e.results[0][0].transcript);
 rec.onerror=e=>{setState('idle');if(e.error==='not-allowed')add("Mikrofon nije dopušten. Omogući ga u postavkama preglednika.",'d');};
 rec.onend=()=>{if(app.classList.contains('listening'))setState('idle');};rec.start();};

/* --- Čestice --- */
const c=$('#particles'),x=c.getContext('2d');let P=[];
function rs(){c.width=innerWidth;c.height=innerHeight;P=Array.from({length:Math.min(90,innerWidth/8)},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*1.8+.3,v:Math.random()*.4+.1,a:Math.random()}));}
rs();addEventListener('resize',rs);
(function loop(){x.clearRect(0,0,c.width,c.height);for(const p of P){p.y-=p.v;if(p.y<0)p.y=c.height;x.globalAlpha=.3+.5*Math.abs(Math.sin(p.a+=.02));x.fillStyle=p.r>1.3?'#46E5FF':'#087DFA';x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill();}requestAnimationFrame(loop);})();

/* --- PWA --- */
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
let dp;addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;$('#install').style.display='block';});
$('#install').onclick=async()=>{if(dp){dp.prompt();await dp.userChoice;dp=null;$('#install').style.display='none';}};


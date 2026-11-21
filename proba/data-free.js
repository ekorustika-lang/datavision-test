/* ===== AI KONFIGURACIJA =====
   Kad Cloudflare Worker "Ekorustika-data-ai" bude spreman, ovdje upiši samo njegov URL.
   API ključevi ostaju ISKLJUČIVO u Workeru (secrets), nikad u ovoj datoteci. */
const AI_ENDPOINT = ""; // npr. "https://ekorustika-data-ai.<racun>.workers.dev/chat"

const $=s=>document.querySelector(s), app=$('#app'), chat=$('#chat'), mode=$('#mode');
const GREETING="Pozdrav, ja sam Data. Pitajte me za vremensku prognozu ili tko je netko poznat. Samo pišite ili govorite.";
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

/* --- DATAVISION v3 proba: besplatni izvori bez kljuca (Open-Meteo, Wikipedia) --- */
const ctx={topic:null,city:null,last:null};
const DAYS=[['nedjelj',0],['ponedjelj',1],['utor',2],['srijed',3],['četvrt',4],['cetvrt',4],['petak',5],['petk',5],['subot',6]];
const DNAME=['nedjelju','ponedjeljak','utorak','srijedu','četvrtak','petak','subotu'];
const WMO={0:'vedro',1:'uglavnom vedro',2:'djelomično oblačno',3:'oblačno',45:'magla',48:'magla',51:'slaba rosulja',53:'rosulja',55:'rosulja',61:'slaba kiša',63:'kiša',65:'jaka kiša',66:'ledena kiša',67:'ledena kiša',71:'slab snijeg',73:'snijeg',75:'jak snijeg',77:'sitan snijeg',80:'pljuskovi',81:'pljuskovi',82:'jaki pljuskovi',85:'snježni pljuskovi',86:'snježni pljuskovi',95:'grmljavina',96:'grmljavina s tučom',99:'grmljavina s tučom'};
function dayOffset(t){if(/prekosutra/.test(t))return 2;if(/sutra/.test(t))return 1;if(/danas|večeras/.test(t))return 0;
 for(const[k,d]of DAYS)if(t.includes(k))return(d-new Date().getDay()+7)%7;return null;}
function cityWord(q){const m=q.match(/(?:^|\s)(?:u|za|na)\s+([A-ZČĆŠĐŽ][a-zčćšđž]+)/);return m?m[1]:null;}
async function geo(w){const tr=[w];if(/ci$/.test(w))tr.push(w.replace(/ci$/,'ka'));if(/ju$/.test(w))tr.push(w.slice(0,-2)+'a');if(/[uie]$/.test(w)){tr.push(w.slice(0,-1));tr.push(w.slice(0,-1)+'a');}
 for(const n of tr){try{const j=await(await fetch('https://geocoding-api.open-meteo.com/v1/search?count=5&language=hr&name='+encodeURIComponent(n))).json();
 if(j.results&&j.results.length){const r=j.results.find(x=>x.country_code==='HR')||j.results[0];return{name:r.name,lat:r.latitude,lon:r.longitude};}}catch(e){}}return null;}
async function weather(q,t){let off=dayOffset(t);const w=cityWord(q);
 if(w){const g=await geo(w);if(!g)return'Ne mogu pronaći mjesto „'+w+'”. Napišite ime grada malo drugačije.';ctx.city=g;}
 if(!ctx.city)ctx.city={name:'Zagreb',lat:45.81,lon:15.98};if(off===null)off=0;
 let j;try{j=await(await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${ctx.city.lat}&longitude=${ctx.city.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`)).json();}catch(e){return'Trenutno ne mogu provjeriti prognozu. Pokušajte malo kasnije.';}
 const d=j.daily;if(!d)return'Trenutno ne mogu provjeriti prognozu.';
 const dt=off===0?'Danas':off===1?'Sutra':off===2?'Prekosutra':'U '+DNAME[(new Date().getDay()+off)%7];const p=d.precipitation_probability_max[off];
 return`${dt} u mjestu ${ctx.city.name}: ${WMO[d.weathercode[off]]||'promjenjivo'}, od ${Math.round(d.temperature_2m_min[off])} do ${Math.round(d.temperature_2m_max[off])} °C.`+(p!=null?` Mogućnost kiše ${p} %.`:'');}
async function wiki(term){term=term.replace(/[?.!]+$/,'').trim();
 try{const s=await(await fetch('https://hr.wikipedia.org/w/api.php?action=opensearch&limit=1&format=json&origin=*&search='+encodeURIComponent(term))).json();
 const ti=s[1]&&s[1][0];if(!ti)return null;const j=await(await fetch('https://hr.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(ti))).json();
 if(!j.extract)return null;const se=j.extract.match(/[^.!?]+[.!?]+/g)||[j.extract];return se.slice(0,2).join(' ').trim()+' (izvor: Wikipedia)';}catch(e){return null;}}
const NO="To ovdje ne mogu provjeriti. Na ovoj stranici znam vremensku prognozu i kratke odgovore iz Wikipedije. Za sve ostalo pitajte pravu Datu u Zenzapu.";
async function think(q){const t=q.toLowerCase();
 if(/ne razumijem|ponovi|nisam shvatio|nisam shvatila|jednostavnije/.test(t)&&ctx.last)return'Kratko rečeno: '+ctx.last.split(/(?<=[.!?])\s/)[0];
 if(/zapamti|sjećaš|sjecas/.test(t))return'Osobne stvari pamti prava Data u Zenzapu. Ova stranica pamti samo ovaj razgovor dok je otvorena.';
 const wx=/vrijem|prognoz|kiš|kis|temperatur|sunčan|snijeg|hladno|toplo|kišobran/.test(t);
 const fol=ctx.topic==='weather'&&t.length<40&&(dayOffset(t)!==null||cityWord(q));
 if(wx||fol){ctx.topic='weather';return await weather(q,t);}
 const m=t.match(/^(?:tko|što|sto|šta|sta)\s+(?:je|su)\s+(.+)/)||t.match(/^(?:reci mi nešto o|reci mi o|objasni)\s+(.+)/);
 if(m){ctx.topic='wiki';const r=await wiki(q.slice(q.length-m[1].length));return r||'Za to nisam našao kratak odgovor. Pitajte pravu Datu u Zenzapu.';}
 if(/^(bok|pozdrav|hej|dobar dan|dobro jutro|dobra večer|zdravo)/.test(t))return'Pozdrav! Pitajte me, na primjer: „Kakvo će sutra biti vrijeme u Zagrebu?” ili „Tko je Nikola Tesla?”.';
 ctx.topic=null;return NO;}
async function answer(q){add(q,'u');setState('thinking');let r;try{r=await think(q);}catch(e){r='Nešto je zapelo. Pokušajte ponovno.';}
 ctx.last=r;emo('understand',1.6);add(r,'d');await speak(r.replace(' (izvor: Wikipedia)',''));emo('joy',2);}

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

let dp;addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;$('#install').style.display='block';});
$('#install').onclick=async()=>{if(dp){dp.prompt();await dp.userChoice;dp=null;$('#install').style.display='none';}};


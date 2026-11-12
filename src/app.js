(function(){
'use strict';
const $=s=>document.querySelector(s),E=Te,R=new TeRender.Renderer($('#court')),keys=new Set();
let match=new E.Match(),active=false,tab='play',manual=false,pending=null,sound=true,ctx=null,last=0,acc=0,notice='',noticeTime=0;
let oldPad=[],padAxes={x:0,y:0},fps=60,frames=0,fpsLast=0,musicNext=0,musicStep=0,hudKey='',fullRequest=Promise.resolve();
let tossGain=null,menu=null,padMenu={up:false,down:false};
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
R.reducedMotion=motionQuery.matches;motionQuery.addEventListener('change',e=>{R.reducedMotion=e.matches;});
const captions=['WIMBLEDON / GRASS','AUSTRALIA / HARD','US / HARD','FRANCE / CLAY'];
const encode=n=>'도'+'오'.repeat(n-1)+'옹';
const makeCode=(p=0,l=0,c=0)=>`나는 동현이냐?\n   ㅋㅋ 선수 ${p+1} · ${E.PLAYERS[p].name}\n  뿡뿡 ${encode(p+1)}~뿡뿡뿡\n   ㅋㅋ 난이도 ${l+1} · ${E.LEVELS[l].name}\n  뿡뿡 ${encode(l+1)}~뿡뿡뿡\n   ㅋㅋ 경기장 ${c+1} · ${E.COURTS[c].name}\n  뿡뿡 ${encode(c+1)}~뿡뿡뿡\n동현이구나`;
// Examples in three difficulty groups: 통상 → 프로 → 초보. Inside a group: player, then court.
const ex=(p,l,c,note)=>({group:['초보 · 난이도 1','통상 · 난이도 2','프로 · 난이도 3'][l],p,l,c,note});
const skillNote=i=>`${E.PLAYERS[i].name}의 기술: ${E.PLAYERS[i].skills.map(s=>s[0]).join(' / ')}. 14와 선수만 다르다.`;
const examples=[
 ex(0,1,0,'기준이 되는 조합. 속도 1.00배, 슈슈는 0.14초마다 자리를 다시 정하고 자리 오차는 ±0.16m다. 08(프로)·14(초보)는 난이도만 다르다.'),
 ex(0,1,1,'01과 코트만 다르다. 반발 0.56→0.73, 바운드 뒤 속도 유지 94%→85%. 안정적인 중간 높이로 튄다.'),
 ex(0,1,2,'코트 3. 반발 0.69, 속도 유지 90%. 02의 호주보다 낮고 빠르며 01의 윔블던보다는 덜 미끄러진다.'),
 ex(0,1,3,'코트 4. 반발 0.83, 속도 유지 72%. 가장 높이 튀고 가장 느려진다. 01–04를 차례로 해 보면 네 코트의 차이가 보인다.'),
 ex(1,1,1,'능력치가 모두 90인 균형형. 중간 높이 반발의 호주에서 기본기를 확인하자.'),
 ex(2,1,3,'공격 120·수비 80. 클레이가 강한 공을 늦추지만 높게 튄 공을 받을 시간도 함께 준다.'),
 ex(4,1,0,'이동 130으로 가장 빠르지만 공격·수비 80. 낮게 깔리는 잔디에서 발로 따라잡는 연습이다.'),
 ex(0,2,0,'01과 코트는 같고 난이도만 3이다. 속도 1.13배, 슈슈는 0.07초마다 자리를 다시 정하고 오차는 ±0.07m다. 낮게 미끄러지는 잔디라 반응할 시간이 가장 짧다.'),
 ex(0,2,1,'프로에서 코트만 바꿔 보는 묶음. 08(윔블던)·10(US)·11(프랑스)과 함께 네 코트를 같은 난이도로 비교한다.'),
 ex(0,2,2,'빠른 공과 빨라진 상대 반응. 반발 0.69, 속도 유지 90%의 하드 코트다.'),
 ex(0,2,3,'08과 난이도는 같고 코트만 클레이다. 바운드 뒤 수평 속도가 72%만 남아 프로의 빠른 공이 한 박자 늦어진다. 08과 번갈아 해 보자.'),
 ex(3,2,2,'이동 120. 빠른 하드 코트와 프로 상대에서 넓게 뛰며 버티는 조합이다.'),
 ex(5,2,0,'공격 80·수비 90. 가장 빠른 조합에서 비밀이야·알려고하지마로 포인트를 노린다.'),
 ex(0,0,0,'처음이라면 여기서 시작하자. 01에서 난이도만 2→1로 낮춘다. 공과 두 선수의 속도 1.00배→0.88배, 슈슈가 자리를 다시 정하는 간격 0.14초→0.24초, 자리 오차 ±0.16m→±0.33m.'),
 ex(0,0,1,'14와 선수·난이도는 같고 코트만 2로 바꾼다. 반발 0.56→0.73, 바운드 뒤 속도 유지 94%→85%. 공이 더 높고 조금 느리게 온다.'),
 ex(0,0,2,'코트 3. 반발 0.69, 속도 유지 90%. 15의 호주보다 낮고 빠르며 14의 윔블던보다는 덜 미끄러진다.'),
 ex(0,0,3,'코트 4. 반발 0.83, 속도 유지 72%. 가장 높이 튀고 가장 느려진다. 15·16과 같은 난이도에서 차이를 느껴 보자.'),
 ex(1,0,0,skillNote(1)),ex(2,0,0,skillNote(2)),ex(3,0,0,skillNote(3)),ex(4,0,0,skillNote(4)),ex(5,0,0,skillNote(5)),ex(6,0,0,skillNote(6)),
 ex(6,0,3,'가장 너그러운 조합. 초보의 느린 공에 높이 튀는 클레이가 겹쳐 공을 기다릴 여유가 크다. 슈슈의 리만가설로 바운드 위치를 미리 보며 연습하자.')];
// Derive all titles from the config, rather than maintaining inconsistent hand-written names.
examples.forEach((e,i)=>{e.name=`${String(i+1).padStart(2,'0')} · ${E.PLAYERS[e.p].name} · ${E.LEVELS[e.l].name} · ${E.COURTS[e.c].name}`;});
{const sel=$('#example');let html='',group='';examples.forEach((e,i)=>{if(e.group!==group){if(group)html+='</optgroup>';group=e.group;html+=`<optgroup label="${group}">`;}html+=`<option value="${i}">${e.name}</option>`;});sel.innerHTML=html+'</optgroup>';}
function explainConfig(cfg){
 const l=E.LEVELS[cfg.level],c=E.COURTS[cfg.court];
 $('#example-level').textContent=`난이도 ${cfg.level+1} · ${l.name}: ${['통상보다 느리고 상대의 자리 선정도 느슨하다.','속도 비교의 기준이며, 반응과 자리 오차는 중간이다.','공과 두 선수의 이동이 빨라지고 상대의 판단도 더 촘촘하다.'][cfg.level]} 공의 비행 시간·선수 이동에 적용하는 속도 배율 ${l.speed.toFixed(2)}. 상대 재판단 약 ${l.react.toFixed(2)}초, 바운드 전 좌우 목표 오차 최대 ±${(l.error/2).toFixed(3)}m.`;
 $('#example-court').textContent=`코트 ${cfg.court+1} · ${c.name} / ${c.surface}: ${c.desc}. 같은 입사 조건에서 수직 속도 반발 ${c.bounce.toFixed(2)}, 수평 속도 유지 ${Math.round(c.retain*100)}%. ${['네 코트 중 가장 낮게 튀고 수평 속도를 가장 많이 유지한다.','US보다 높게 튀고 수평 속도는 더 줄어든다.','호주보다 낮게 튀고 수평 속도를 더 많이 유지한다.','네 코트 중 가장 높게 튀고 수평 속도가 가장 많이 줄어든다.'][cfg.court]}`;
 $('.example-comparison').hidden=false;
}
const esc=t=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DH_TOKEN=/(ㅋㅋ.*$)|(나는 동현이냐\?|동현이구나)|(오겡끼데스까)|(신중동역|신중동|뭉치)|(뿡뿡뿡|뿡뿡|포동이)|(꽥꽥)|(동+현아)|(동+현)|(도오*옹)|(ㅠ+)|(뚱띠|또치)/g;
const DH_CLS=[null,'t-cmt','t-frame','t-halt','t-ctl','t-out','t-in','t-assign','t-var','t-num','t-minus','t-op'];
function dhLine(line){let html='',last=0;line.replace(DH_TOKEN,(m,...gr)=>{const idx=gr[gr.length-2];html+=esc(line.slice(last,idx));const k=gr.slice(0,11).findIndex(x=>x!==undefined)+1;html+=`<span class="${DH_CLS[k]}">${esc(m)}</span>`;last=idx+m.length;return m;});return html+esc(line.slice(last));}
const codeEl=$('#code'),hlArea=document.createElement('div'),hl=document.createElement('div');
hlArea.className='code-area';hl.id='hl';hl.setAttribute('aria-hidden','true');codeEl.parentNode.insertBefore(hlArea,codeEl);hlArea.append(hl,codeEl);
function hlSync(){hl.scrollTop=codeEl.scrollTop;hl.scrollLeft=codeEl.scrollLeft;}
function highlight(){const cs=getComputedStyle(codeEl);for(const k of ['paddingTop','paddingRight','paddingBottom','paddingLeft','fontFamily','fontSize','lineHeight','tabSize','letterSpacing'])hl.style[k]=cs[k];hl.innerHTML=codeEl.value.split('\n').map(l=>`<span class="ln">${dhLine(l)||' '}</span>`).join('')+'<span class="ln"> </span>';hlSync();}
addEventListener('resize',highlight);
function lineNumbers(){const code=$('#code');$('#lines').textContent=Array.from({length:code.value.split('\n').length},(_,i)=>i+1).join('\n');$('#lines').scrollTop=code.scrollTop;highlight();}
function parsed(){const result=Donghyun.run($('#code').value,{maxSteps:100000});return {config:E.parse(result.output),output:result.output.trim().split(/\s+/).join('  ')};}
function validate(){
 lineNumbers();
 try{const r=parsed();$('#error').hidden=true;$('#output').textContent=r.output;$('#config-description').textContent=`${E.PLAYERS[r.config.player].name} · ${E.LEVELS[r.config.level].name} · ${E.COURTS[r.config.court].name}`;explainConfig(r.config);if(!active){match=new E.Match(r.config);draw();}return r.config;}
 catch(e){$('#error').hidden=false;$('#error').textContent=e.message;$('#output').textContent='실행 오류';$('.example-comparison').hidden=true;return null;}
}
function example(i){const e=examples[i];$('#code').value=makeCode(e.p,e.l,e.c);$('#example-note').textContent=e.note;validate();}
$('#example').onchange=()=>example(Number($('#example').value));
$('#code').oninput=validate;$('#code').onscroll=()=>{hlSync();$('#lines').scrollTop=$('#code').scrollTop;};
$('#code').onfocus=()=>{if(active&&!match.paused&&match.phase!=='match'){match.paused=true;keys.clear();draw();}};
function audio(){
 if(!ctx)try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
 if(ctx.state==='suspended')ctx.resume().catch(()=>{});
}
function tone(freq=.0,dur=.08,type='triangle',vol=.035,delay=0){
 if(!ctx||!sound)return;
 const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+dur);
}
function noise(dur=.08,vol=.05,delay=0,freq=1800){
 if(!ctx||!sound)return;
 const n=Math.max(1,Math.floor(ctx.sampleRate*dur)),buf=ctx.createBuffer(1,n,ctx.sampleRate),d=buf.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
 const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=buf;f.type='bandpass';f.frequency.value=freq;g.gain.value=vol;
 src.connect(f).connect(g).connect(ctx.destination);src.start(ctx.currentTime+delay);
}
// One short signature per skill, so the ear can tell them apart without looking down at the HUD.
const skillSounds={
 fire:()=>{[220,330,494,740].forEach((f,i)=>tone(f,.09,'sawtooth',.022,i*.045));noise(.25,.03,.12,900);},
 comet:()=>[659,988,1319,1976].forEach((f,i)=>tone(f,.08,'sine',.035,i*.04)),
 win:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.2,'triangle',.04,i*.11)),
 lose:()=>[196,185,165].forEach((f,i)=>tone(f,.16,'sawtooth',.03,i*.1)),
 wind:()=>{noise(.5,.035,0,600);[392,330,392,330].forEach((f,i)=>tone(f,.09,'triangle',.02,i*.08));},
 slow:()=>[660,494,370,277].forEach((f,i)=>tone(f,.16,'sine',.035,i*.12)),
 drop:()=>[784,523,392].forEach((f,i)=>tone(f,.07,'triangle',.035,i*.06)),
 dance:()=>[523,659,523,784,659,880].forEach((f,i)=>tone(f,.08,'square',.018,i*.085)),
 miss:()=>{tone(170,.09,'square',.045);tone(150,.11,'square',.045,.16);},
 fall:()=>[988,1319,1568,2093].forEach((f,i)=>tone(f,.1,'sine',.03,i*.07)),
 vanish:()=>{[1047,1319,1047].forEach((f,i)=>tone(f,.06,'sine',.03,i*.05));noise(.12,.02,.12,4000);},
 serveVanish:()=>{[880,1175,880].forEach((f,i)=>tone(f,.06,'sine',.03,i*.05));noise(.12,.02,.12,4000);},
 long:()=>[262,330,392,523,659].forEach((f,i)=>tone(f,.07,'triangle',.03,i*.04)),
 predict:()=>{tone(880,.06,'square',.02);tone(880,.06,'square',.02,.1);tone(1175,.14,'square',.02,.2);}
};
function sounds(){
 for(const ev of match.events.splice(0)){
  if(ev.type==='toss')tossSound();
  else if(ev.type==='hit'){
   if(tossGain){tossGain.gain.cancelScheduledValues(ctx.currentTime);tossGain.gain.setTargetAtTime(.0001,ctx.currentTime,.015);}
   if(ev.text==='lob'||ev.text==='softVolley'){tone(260,.12,'triangle',.035);tone(390,.12,'triangle',.025,.06);}
   else tone(ev.text==='smash'?320:460,.055,'square',.025);
  }
  else if(ev.type==='bounce')tone(190,.035,'triangle',.03);
  else if(ev.type==='point'||ev.type==='game'){tone(523,.10);tone(659,.13,'triangle',.035,.12);}
  else if(ev.type==='skill'){(skillSounds[ev.kind]||skillSounds.predict)();notice=ev.text;noticeTime=1.4;}
  else if(ev.type==='long'){tone(294,.05,'triangle',.035);tone(587,.09,'triangle',.035,.05);}
  else if(ev.type==='release'){tone(440,.08,'sine',.03);tone(330,.12,'sine',.03,.08);notice=ev.text;noticeTime=1.8;}
  else if(ev.type==='concede'){notice=ev.text;noticeTime=2.6;}
  else if(ev.type==='smash'){tone(82,.14,'square',.05);noise(.09,.06,0,500);}
  else if(ev.type==='crack'){noise(.05,.09,0,3200);tone(1400,.03,'square',.04);tone(70,.22,'triangle',.06,.02);noise(.2,.04,.05,1500);}
  else if(ev.type==='charge')tone(880,.10);
  else if(ev.type==='fault')tone(160,.15);
  else if(ev.type==='match'){[523,659,784,1047].forEach((f,i)=>tone(f,.23,'triangle',.04,i*.15));}
 }
 if(sound&&ctx&&active&&!match.paused&&ctx.currentTime>musicNext){
  const melody=[262,0,330,0,392,330,294,0,262,330,440,0,392,0,330,294];
  const f=melody[musicStep++%melody.length];if(f)tone(f,.12,'triangle',.008);musicNext=ctx.currentTime+.34;
 }
}
function tossSound(){
 if(!ctx||!sound)return;
 const t=ctx.currentTime,g=ctx.createGain();tossGain=g;g.connect(ctx.destination);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.065,t+.045);
 g.gain.setValueAtTime(.065,t+.76);g.gain.exponentialRampToValueAtTime(.0001,t+1.05);
 for(const [type,f] of [['triangle',110],['sine',55]]){
  const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);
  o.frequency.exponentialRampToValueAtTime(f*3.6,t+1.0);o.connect(g);o.start(t);o.stop(t+1.08);
 }
 setTimeout(()=>{g.disconnect();if(tossGain===g)tossGain=null;},1250);
}
function toggleSound(){audio();sound=!sound;if(!sound&&tossGain){tossGain.gain.cancelScheduledValues(ctx.currentTime);tossGain.gain.setValueAtTime(0,ctx.currentTime);}$('#sound').classList.toggle('muted',!sound);$('#sound').setAttribute('aria-pressed',String(sound));}
$('#sound').onclick=toggleSound;
$('#theme').onclick=()=>{const on=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=on?'dark':'light';$('#theme').setAttribute('aria-pressed',String(on));};
function begin(config){
 hideMenu();match=new E.Match(config,Math.floor(Math.random()*2147483646)+1);active=true;manual=false;keys.clear();audio();acc=0;notice='';noticeTime=0;
 $('#stage').focus({preventScroll:true});draw();
}
async function run(){
 const c=validate();if(!c)return;
 if(active&&match.phase!=='match'){
  hideMenu();match.paused=true;await full(false);pending=c;$('#confirm-panel').hidden=false;$('#confirm-no').focus();draw();
 }else begin(c);
}
$('#run').onclick=run;$('#court-start').onclick=run;
$('#confirm-yes').onclick=()=>{const c=pending;pending=null;$('#confirm-panel').hidden=true;if(c)begin(c);};
$('#confirm-no').onclick=()=>{pending=null;$('#confirm-panel').hidden=true;match.paused=false;$('#stage').focus({preventScroll:true});draw();};
function setup(){hideMenu();active=false;match.paused=false;full(false);validate();renderSlotList();$('#court-start').focus({preventScroll:true});draw();}
$('#new-match').onclick=setup;

/* ---------- Enter 메뉴(잠시 멈춤): 동현큐·동현램과 같은 틀 ---------- */
function openMenu(title,items,onCancel){match.paused=true;keys.clear();menu={title,items:items.map(it=>Array.isArray(it)?{label:it[0],fn:it[1]}:it),onCancel};menu.i=Math.max(0,menu.items.findIndex(it=>!it.off));drawMenu();draw();}
function drawMenu(){
 const m=$('#menu');if(!menu){m.hidden=true;return;}
 m.hidden=false;m.className='game-menu center';
 m.innerHTML=(menu.title?`<h4>${esc(menu.title)}</h4>`:'')+menu.items.map((it,i)=>`<div class="mi ${i===menu.i?'sel':''} ${it.off?'off':''}" role="menuitem" aria-disabled="${it.off?'true':'false'}" data-i="${i}"><span>${esc(it.label)}</span>${it.note?`<small>${esc(it.note)}</small>`:''}</div>`).join('')+'<p class="menu-hint"><kbd>↑</kbd><kbd>↓</kbd>고르기 <kbd>Enter</kbd><kbd>X</kbd>선택 <kbd>Z</kbd>뒤로</p>';
 m.querySelectorAll('.mi').forEach(el=>el.onclick=e=>{e.stopPropagation();menu.i=+el.dataset.i;pick();});
 m.querySelector('.sel')?.scrollIntoView({block:'nearest'});
}
function hideMenu(){menu=null;$('#menu').hidden=true;}
function closeMenu(){hideMenu();match.paused=false;keys.clear();acc=0;}
function cancelMenu(){const c=menu&&menu.onCancel;closeMenu();if(c)c();else $('#stage').focus({preventScroll:true});draw();}
function pick(){const it=menu.items[menu.i];if(!it||it.off)return;closeMenu();it.fn();draw();}
function menuKey(k){
 if(!menu)return;
 if(k==='up'||k==='down'){const n=menu.items.length;for(let t=0;t<n;t++){menu.i=(menu.i+(k==='up'?-1:1)+n)%n;if(!menu.items[menu.i].off)break;}drawMenu();}
 else if(k==='pick')pick();else if(k==='cancel')cancelMenu();
}
function confirmMenu(q,opts,back){openMenu(q,opts.map(([label,fn])=>({label,fn})),back);}
function mainMenu(note){
 openMenu(note?note+' · 잠시 멈춤':'잠시 멈춤',[['계속 간다',()=>$('#stage').focus({preventScroll:true})],['저장',saveMenu],['불러오기',loadMenu],
  ['포기하고 출전 준비로',()=>confirmMenu('포기하고 출전 준비로 돌아갈까?',[['포기한다',setup],['계속 간다',()=>{}]],mainMenu)]]);
}

/* ---------- 저장·불러오기: 브라우저 칸 3개 + .dhsave 파일 ---------- */
const SAVE_FORMAT='donghyunte-save',SAVE_VERSION=1,SLOT_KEY=n=>'donghyunte:slot'+n,SLOTS=3;
function saveData(){
 const c=match.config;
 return {format:SAVE_FORMAT,version:SAVE_VERSION,savedAt:new Date().toISOString(),
  summary:{player:E.PLAYERS[c.player].name,level:E.LEVELS[c.level].name,court:E.COURTS[c.court].name,sets:[...match.sets],games:[...match.games],score:match.score().map(String)},state:match.snapshot()};
}
function restoreSave(data){
 if(!data||typeof data!=='object'||data.format!==SAVE_FORMAT)throw new Error('동현테 저장 파일이 아니다.');
 if(data.version!==SAVE_VERSION)throw new Error('지원하지 않는 저장 형식 버전이다('+String(data.version).slice(0,12)+').');
 const m=E.Match.restore(data.state),c=m.config; // throws with the reason when anything is off
 hideMenu();match=m;active=true;manual=false;pending=null;$('#confirm-panel').hidden=true;keys.clear();acc=0;notice='';noticeTime=0;audio();
 // The code panel follows the loaded match, so what is shown is what is being played.
 $('#code').value=makeCode(c.player,c.level,c.court);
 const i=examples.findIndex(e=>e.p===c.player&&e.l===c.level&&e.c===c.court);
 if(i>=0)$('#example').value=String(i);$('#example-note').textContent=i>=0?examples[i].note:'불러온 경기의 설정이다.';
 validate();$('#load-status').hidden=true;setTab('play');$('#stage').scrollIntoView({block:'nearest'});$('#stage').focus({preventScroll:true});
 mainMenu('저장한 경기를 불러왔다');
}
const busy=()=>active&&match.phase!=='match';
function readSlot(n){try{const t=localStorage.getItem(SLOT_KEY(n));const d=t?JSON.parse(t):null;return d&&typeof d==='object'?d:null;}catch(e){return null;}}
const pairText=a=>Array.isArray(a)&&a.length===2?a.map(v=>String(v).slice(0,3)).join(':'):'?';
function slotNote(d){
 if(!d)return '비어 있음';
 const u=d.summary&&typeof d.summary==='object'?d.summary:{},t=new Date(d.savedAt),pad=v=>String(v).padStart(2,'0');
 return `${String(u.player||'?').slice(0,6)} · 세트 ${pairText(u.sets)} · 게임 ${pairText(u.games)}`+(isNaN(t)?'':` · ${t.getMonth()+1}/${t.getDate()} ${pad(t.getHours())}:${pad(t.getMinutes())}`);
}
function toast(t,time=2.5){notice=t;noticeTime=time;hudKey='';}
function saveToSlot(n){
 try{localStorage.setItem(SLOT_KEY(n),JSON.stringify(saveData()));renderSlotList();toast(`브라우저 칸 ${n}에 저장했다.`);mainMenu(`칸 ${n}에 저장했다`);}
 catch(e){toast('브라우저 저장에 실패했다. 파일로 내려받아 저장하자.');mainMenu('브라우저 저장 실패 · 파일로 내려받자');}
}
function deleteSlot(n){try{localStorage.removeItem(SLOT_KEY(n));}catch(e){}renderSlotList();}
function saveToFile(){
 const d=saveData(),a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'}));
 a.href=u;a.download=`donghyunte-${['donghyun','mungchi','ttungtti','ttochi','podongi','kkwaek','shushu'][match.config.player]}-set${d.summary.sets.join('-')}-game${d.summary.games.join('-')}.dhsave`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
 toast('저장 파일을 내려받았다.');mainMenu('저장 파일을 내려받았다');
}
function saveMenu(){
 const items=[];
 for(let n=1;n<=SLOTS;n++){const d=readSlot(n);items.push({label:`브라우저 칸 ${n}`,note:slotNote(d),fn:()=>{if(d)confirmMenu(`칸 ${n}에 덮어쓸까?`,[['덮어쓴다',()=>saveToSlot(n)],['그만둔다',saveMenu]],saveMenu);else saveToSlot(n);}});}
 items.push({label:'파일로 내려받기',note:'.dhsave',fn:saveToFile});
 items.push({label:'브라우저 칸 지우기',note:'',off:!Array.from({length:SLOTS},(_,i)=>readSlot(i+1)).some(Boolean),fn:deleteMenu});
 openMenu('저장',items,mainMenu);
}
function deleteMenu(){
 const items=[];
 for(let n=1;n<=SLOTS;n++){const d=readSlot(n),eul=n===2?'를':'을';items.push({label:`브라우저 칸 ${n}`,note:slotNote(d),off:!d,fn:()=>confirmMenu(`칸 ${n}${eul} 지울까? 되돌릴 수 없다.`,[['지운다',()=>{deleteSlot(n);toast(`브라우저 칸 ${n}${eul} 지웠다.`);deleteMenu();}],['그만둔다',deleteMenu]],deleteMenu)});}
 if(items.every(it=>it.off)){saveMenu();return;}
 openMenu('지울 칸',items,saveMenu);
}
function loadFrom(d,why){
 try{if(why)throw new Error(why);restoreSave(d);}
 catch(e){
  const msg='불러오기 실패: '+String(e&&e.message||'읽을 수 없는 파일이다.').slice(0,80);
  $('#load-status').className='load-status';  $('#load-status').textContent=msg;$('#load-status').hidden=false;
  if(busy()){toast(msg,4);mainMenu(msg);}
 }
}
function loadMenu(){
 const items=[];
 for(let n=1;n<=SLOTS;n++){const d=readSlot(n);items.push({label:`브라우저 칸 ${n}`,note:slotNote(d),off:!d,fn:()=>confirmMenu('지금 경기를 버리고 불러올까?',[['불러온다',()=>loadFrom(readSlot(n))],['그만둔다',loadMenu]],loadMenu)});}
 items.push({label:'파일에서 불러오기',note:'.dhsave',fn:()=>{loadMenu();$('#load-file').click();}});
 openMenu('불러오기',items,mainMenu);
}
async function loadFile(e){
 const f=e.target.files[0];e.target.value='';if(!f)return;
 let data=null,why='';
 if(f.size>2e6)why='파일이 너무 크다. 저장 파일은 2 MB를 넘지 않는다.';
 else try{data=JSON.parse(await f.text());}catch(err){why='읽을 수 없는 파일이다. 동현테 .dhsave 파일을 고르자.';}
 if(busy()&&e.target.id==='load-file-setup'&&!why)confirmMenu('지금 경기를 버리고 불러올까?',[['불러온다',()=>loadFrom(data)],['그만둔다',()=>mainMenu()]],()=>mainMenu());
 else loadFrom(data,why);
}
$('#load-file').onchange=loadFile;$('#load-file-setup').onchange=loadFile;
document.querySelector('.load-head label').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#load-file-setup').click();}});
function renderSlotList(){
 const box=$('#slot-list');box.innerHTML='';
 for(let n=1;n<=SLOTS;n++){
  const d=readSlot(n),u=d&&d.summary&&typeof d.summary==='object'?d.summary:{},b=document.createElement('button');b.className='slot-btn';b.type='button';b.disabled=!d;
  b.innerHTML=`<b>칸 ${n}</b><span>${esc(slotNote(d))}</span>${d?`<small>${esc(String(u.level||'?').slice(0,6))} · ${esc(String(u.court||'?').slice(0,8))} · 포인트 ${esc(pairText(u.score))}</small>`:''}`;
  b.onclick=()=>{const data=readSlot(n);if(busy()){setTab('play');confirmMenu('지금 경기를 버리고 불러올까?',[['불러온다',()=>loadFrom(data)],['그만둔다',()=>mainMenu()]],()=>mainMenu());$('#stage').scrollIntoView({block:'nearest'});$('#stage').focus({preventScroll:true});}else loadFrom(data);};
  const row=document.createElement('div');row.className='slot-row';row.append(b);
  if(d){
   const x=document.createElement('button');x.className='slot-del';x.type='button';x.textContent='지우기';x.setAttribute('aria-label',`칸 ${n} 지우기`);let t=0;
   x.onclick=()=>{if(!x.classList.contains('armed')){x.classList.add('armed');x.textContent='정말 지운다';t=setTimeout(()=>{x.classList.remove('armed');x.textContent='지우기';},4000);return;}clearTimeout(t);deleteSlot(n);$('#load-status').className='load-status ok';$('#load-status').textContent=`브라우저 칸 ${n}${n===2?'를':'을'} 지웠다.`;$('#load-status').hidden=false;};
   row.append(x);
  }
  box.append(row);
 }
}
addEventListener('storage',e=>{if(!e.key||e.key.startsWith('donghyunte:slot'))renderSlotList();});
function setTab(name){
 if(active&&!match.paused&&name!=='play'){match.paused=true;keys.clear();}
 tab=name;document.querySelectorAll('.tab-panel').forEach(e=>e.hidden=e.id!=='tab-'+name);
 document.querySelectorAll('[data-tab]').forEach(e=>{const on=e.dataset.tab===name;e.setAttribute('aria-selected',String(on));e.classList.toggle('active',on);on?e.setAttribute('aria-current','page'):e.removeAttribute('aria-current');});draw();
}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
function full(on){
 const stage=$('#stage');stage.classList.toggle('is-full',on);$('#full-close').hidden=!on;document.body.style.overflow=on?'hidden':'';
 if(on){stage.focus({preventScroll:true});if(stage.requestFullscreen)fullRequest=stage.requestFullscreen().catch(()=>{});return fullRequest;}
 return fullRequest.then(()=>document.fullscreenElement?document.exitFullscreen().catch(()=>{}):undefined);
}
$('#fullscreen').onclick=()=>full(!$('#stage').classList.contains('is-full'));$('#full-close').onclick=()=>full(false);
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){$('#stage').classList.remove('is-full');$('#full-close').hidden=true;document.body.style.overflow='';}});
const isEdit=el=>el&&['TEXTAREA','INPUT','SELECT'].includes(el.tagName);
function aim(){const s=match.people[0].side;return {x:s*(keys.has('ArrowLeft')?-1:keys.has('ArrowRight')?1:padAxes.x),y:s*(keys.has('ArrowUp')?-1:keys.has('ArrowDown')?1:padAxes.y)};}
function command(key){
 if(tab!=='play'||!$('#confirm-panel').hidden)return;
 if(menu){if(key==='drive'||key==='pause')menuKey('pick');else if(key==='lob')menuKey('cancel');return;}
 if(key==='pause'){
  if(!active){run();return;}if(match.phase==='match'){setup();return;}
  audio();mainMenu();return;
 }
 if(!active)return;
 audio();const result=match.action(key,aim());if(result?.why){notice=result.why;noticeTime=2;}draw();
}
const actionKeys={KeyX:'drive',KeyZ:'lob',KeyS:'skill1',KeyA:'skill2',Enter:'pause'};
window.addEventListener('keydown',e=>{
 if(e.ctrlKey&&e.code==='Enter'){e.preventDefault();run();return;}
 if(isEdit(e.target))return;
 if(!$('#confirm-panel').hidden){
  if(e.code==='Escape')$('#confirm-no').click();
  if(e.code==='Tab'){e.preventDefault();(document.activeElement===$('#confirm-no')?$('#confirm-yes'):$('#confirm-no')).focus();}return;
 }
 if(e.code==='KeyF'){e.preventDefault();if(!e.repeat)full(!$('#stage').classList.contains('is-full'));return;}
 if(e.code==='KeyM'){e.preventDefault();if(!e.repeat)toggleSound();return;}
 if(e.code==='Escape'){e.preventDefault();if($('#stage').classList.contains('is-full'))full(false);else if(menu)menuKey('cancel');else if(!e.repeat)command('pause');return;}
 if(tab!=='play')return;
 if(menu){ // the pause menu owns the keyboard while it is open
  const k={ArrowUp:'up',ArrowDown:'down',Enter:'pick',NumpadEnter:'pick',KeyX:'pick',Space:'pick',KeyZ:'cancel'}[e.code];
  if(!k)return;
  if((k==='pick')&&e.target.tagName==='BUTTON'&&e.target!==$('#stage')&&e.code!=='KeyX')return;
  e.preventDefault();if(!e.repeat||k==='up'||k==='down')menuKey(k);return;
 }
 if(actionKeys[e.code]||e.code.startsWith('Arrow')){
  // Native Enter on a button should remain a single menu action.
  if(e.code==='Enter'&&e.target.tagName==='BUTTON'&&e.target!==$('#stage'))return;
  e.preventDefault();if(!e.repeat&&actionKeys[e.code])command(actionKeys[e.code]);keys.add(e.code);
 }
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();padAxes={x:0,y:0};if(active&&match.phase!=='match')match.paused=true;draw();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(active&&match.phase!=='match')match.paused=true;}});
function pollPad(){
 let pad;try{pad=Array.from(navigator.getGamepads?.()||[]).find(Boolean);}catch(e){return;}
 if(!pad){padAxes={x:0,y:0};oldPad=[];if($('#pad-status').textContent!=='연결된 패드 없음')$('#pad-status').textContent='연결된 패드 없음';return;}
 const padText=pad.id+(pad.mapping==='standard'?' · 표준 매핑':' · 비표준 매핑: 실제 단추를 확인하자.');
 if($('#pad-status').textContent!==padText)$('#pad-status').textContent=padText;
 const down=n=>!!pad.buttons[n]?.pressed;
 padAxes={x:down(14)?-1:down(15)?1:Math.abs(pad.axes[0])>.22?pad.axes[0]:0,y:down(12)?-1:down(13)?1:Math.abs(pad.axes[1])>.22?pad.axes[1]:0};
 const mapping={1:'drive',0:'lob',4:'skill1',5:'skill2',9:'pause'};
 const dir={up:down(12)||pad.axes[1]<-.5,down:down(13)||pad.axes[1]>.5};
 if(menu&&!isEdit(document.activeElement))for(const k of ['up','down'])if(dir[k]&&!padMenu[k])menuKey(k);
 padMenu=dir;
 for(const n of Object.keys(mapping))if(down(n)&&!oldPad[n]&&!isEdit(document.activeElement))command(mapping[n]);
 oldPad=pad.buttons.map(b=>b.pressed);
}
function draw(){
 R.draw(match);const cfg=match.config,p=E.PLAYERS[cfg.player],opp=E.PLAYERS[match.people[1].id];
 // Whatever paused the match (Enter, a lost focus, another tab), the menu is what the player sees.
 if(active&&match.paused&&!menu&&!pending&&match.phase!=='match'&&tab==='play'){mainMenu();return;}
 const cue=match.skillCue,el=$('#skill-cue');
 el.hidden=!active||!cue||match.paused||!!pending;
 if(active&&cue){
  R.skillBurst(TeRender.viewMatch(match));
  const style=TeRender.skillStyles[cue.kind],label=`${p.name} · ${cue.prepared?'준비':'발동'}`;
  el.classList.toggle('prepared',!!cue.prepared);
  if($('#skill-cue-who').textContent!==label)$('#skill-cue-who').textContent=label;
  if($('#skill-cue-name').textContent!==cue.name)$('#skill-cue-name').textContent=cue.name;
  const detail=cue.prepared?style[2]:style[1];
  if($('#skill-cue-detail').textContent!==detail)$('#skill-cue-detail').textContent=detail;
  el.style.setProperty('--cue-color',style[0]);
  el.style.opacity=R.reducedMotion?'1':String(Math.min(1,cue.ttl/.2));
  el.style.transform=R.reducedMotion?'none':`translateY(${-8*Math.max(0,1-(cue.duration-cue.ttl)/.15)}px)`;
 }
 const fx=match.fx,showEnd=match.phase==='match'&&!cue&&!(fx&&(fx.type==='lose'||(fx.type==='win'&&fx.ttl>1.2)));
 // What each of the two skills is doing right now: prepared, running (with what is left), usable or short of energy.
 const eff=match.effects,skillState=p.skills.map((sk,i)=>{
  const k=E.SKILL_KINDS[cfg.player][i];
  if(!active)return ['',`${sk[1]}칸`];
  if(match.armed===k)return ['armed','준비됨 · '+(k==='serveVanish'?'다음 서브':k==='comet'?'다음 타격 입력':'다음 리턴')];
  if(k==='long'&&eff.long>0)return ['on',`발동 중 · 남은 ${eff.long}번`];
  if(k==='fall'&&eff.fall>0)return ['on',`발동 중 · ${Math.ceil(eff.fall)}초`];
  if(k==='miss'&&(eff.miss||eff.whiff>0))return ['on',eff.miss?'발동 중 · 상대 다음 스윙':'상대 헛스윙'];
  if((k==='dance'||k==='predict')&&eff[k])return ['on','발동 중 · 이번 랠리'];
  if(k==='slow'&&match.ball?.slow)return ['on','발동 중 · 리턴하면 해제'];
  if(k==='lose'&&fx?.type==='lose')return ['on','라켓 파손'];
  return ['',`${sk[1]}칸 · ${match.energy>=sk[1]?'사용 가능':'충전 필요'}`];
 });
 const next=JSON.stringify([active,tab,cfg,match.phase,match.paused,match.points,match.games,match.sets,match.server,match.energy,match.winner,match.message,noticeTime>0?notice:'',!!pending,showEnd,skillState,!!menu]);
 if(next===hudKey)return;hudKey=next;
 $('#court-caption').textContent=captions[cfg.court];
 $('#player-name').innerHTML=p.name+` <small>나 ${match.server===0?'· 서브':''}</small>`;
 $('#opponent-name').innerHTML=opp.name+` <small>동현AI™ ${match.server===1?'· 서브':''}</small>`;
 $('#set-score').textContent=match.sets.join(' : ');$('#game-score').textContent=match.games.join(' : ');$('#point-score').textContent=match.score().join(' : ');
 $('#start-card').hidden=active;$('#stamp-player').firstChild.nodeValue=p.name+' ';
 $('#end-card').hidden=!active||!showEnd;$('#start-title').textContent=`${p.name}, ${E.COURTS[cfg.court].name}에 서다.`;
 $('#start-meta').textContent=`${E.LEVELS[cfg.level].name} · 공격 ${p.atk} / 수비 ${p.def} / 이동 ${p.mov}`;
 $('#status').textContent=!active?'코드로 출전하고 X로 토스하자.':noticeTime>0?notice:match.message;
 $('#energy-pips').innerHTML=Array.from({length:6},(_,i)=>`<i class="${i<match.energy?'on':''}"></i>`).join('');$('#energy-pips').setAttribute('aria-label',`에너지 ${match.energy} / 6`);
 p.skills.forEach((sk,i)=>{const el=$('#skill'+(i+1)),box=el.parentElement;el.innerHTML=`${sk[0]}<small>${skillState[i][1]}</small>`;box.className='skill-label '+skillState[i][0];box.style.setProperty('--sk',TeRender.skillStyles[E.SKILL_KINDS[cfg.player][i]][0]);});
 if(match.phase==='match'){$('#end-eyebrow').textContent=match.winner===0?'VICTORY':'MATCH OVER';$('#end-title').textContent=match.winner===0?`${p.name}의 승리.`:'다음 공을 기다리자.';$('#end-detail').textContent=match.message+(match.history.length?' / 세트 '+match.history.map(s=>s.join(':')).join(', '):'');}
}
function tick(dt){
 if(active)match.step(dt,aim());if(!match.paused)noticeTime=Math.max(0,noticeTime-dt);sounds();
}
function loop(t){
 pollPad();const delta=Math.min(.1,(t-(last||t))/1000);last=t;
 if(!manual){acc+=delta;while(acc>=E.DT){tick(E.DT);acc-=E.DT;}}
 frames++;if(t-fpsLast>=1000){fps=frames*1000/(t-fpsLast);frames=0;fpsLast=t;$('#perf').textContent=`${Math.round(fps)} FPS · 120 Hz`;}
 draw();requestAnimationFrame(loop);
}
$('#save-code').onclick=()=>{
 const blob=new Blob([$('#code').value],{type:'text/plain;charset=utf-8'}),a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download='donghyunte.dh';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
};
$('#open-code').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>100000){$('#error').textContent='100 KB 이하의 코드 파일을 열자.';$('#error').hidden=false;return;}$('#code').value=await f.text();validate();e.target.value='';};
$('#court-cards').innerHTML=E.COURTS.map((c,i)=>`<article class="court-card" style="--court:${c.ground}"><h3>${c.name}<small>${c.surface}</small></h3><p>${c.desc}</p><div class="coeff">반발 ${c.bounce.toFixed(2)} · 속도 유지 ${c.retain.toFixed(2)}</div></article>`).join('');
$('#roster').innerHTML=E.PLAYERS.map((p,i)=>`<article class="player-card"><div class="player-top"><img src="${R.portrait(i)}" alt="${p.name} 테니스 도트"><div><span>PLAYER 0${i+1}</span><h2>${p.name}</h2></div></div><div class="stats"><span>공격 <b>${p.atk}</b></span><span>수비 <b>${p.def}</b></span><span>이동 <b>${p.mov}</b></span></div>${p.skills.map((s,j)=>`<h3>${j?'A':'S'} · ${s[0]} <small>${s[1]}칸</small></h3><p>${s[2]}</p>`).join('')}<button data-player="${i}">이 선수의 출전 코드 불러오기</button></article>`).join('');
document.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>{const i=examples.findIndex(e=>e.p===Number(b.dataset.player)&&e.l===0&&e.c===0);$('#example').value=String(i);example(i);setTab('play');$('#code').focus();});
window.render_game_to_text=()=>JSON.stringify({phase:active?match.phase:'setup',paused:match.paused,coordinate:'World XYZ; display x/y = world x/y × viewSide. Human always bottom; fixed camera.',viewSide:match.people[0].side,config:match.config,people:match.people,ball:match.ball,score:match.score(),games:match.games,sets:match.sets,server:match.server,energy:match.energy,armed:match.armed,effects:match.effects,fx:match.fx,skillCue:match.skillCue,message:match.message,tab,winner:match.winner,menu:menu?{title:menu.title,i:menu.i,items:menu.items.map(it=>it.label+(it.note?' — '+it.note:'')+(it.off?' (off)':''))}:null});
window.advanceTime=ms=>{manual=true;for(let i=0;i<Math.round(ms/1000/E.DT);i++)tick(E.DT);draw();};
window.TeApp={get match(){return match;},get menu(){return menu;},begin,setup,makeCode,examples,saveData,loadFrom,renderer:R,resumeClock(){manual=false;acc=0;}};
$('.brand').onclick=e=>{e.preventDefault();setTab('play');scrollTo({top:0,behavior:'smooth'});};
renderSlotList();example(0);requestAnimationFrame(loop);
})();

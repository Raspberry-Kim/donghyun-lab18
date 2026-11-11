(function(){
'use strict';
const $=s=>document.querySelector(s),E=Te,R=new TeRender.Renderer($('#court')),keys=new Set();
let match=new E.Match(),active=false,tab='play',manual=false,pending=null,sound=true,ctx=null,last=0,acc=0,notice='',noticeTime=0;
let oldPad=[],padAxes={x:0,y:0},fps=60,frames=0,fpsLast=0,musicNext=0,musicStep=0,hudKey='',fullRequest=Promise.resolve();
let tossGain=null;
const captions=['WIMBLEDON / GRASS','AUSTRALIA / HARD','US / HARD','FRANCE / CLAY'];
const encode=n=>'도'+'오'.repeat(n-1)+'옹';
const makeCode=(p=0,l=0,c=0)=>`나는 동현이냐?\n   ㅋㅋ 선수 ${p+1} · ${E.PLAYERS[p].name}\n  뿡뿡 ${encode(p+1)}~뿡뿡뿡\n   ㅋㅋ 난이도 ${l+1} · ${E.LEVELS[l].name}\n  뿡뿡 ${encode(l+1)}~뿡뿡뿡\n   ㅋㅋ 경기장 ${c+1} · ${E.COURTS[c].name}\n  뿡뿡 ${encode(c+1)}~뿡뿡뿡\n동현이구나`;
const examples=E.PLAYERS.map((p,i)=>({name:`${String(i+1).padStart(2,'0')} · ${p.name} · 초보 · 윔블던`,p:i,l:0,c:0,note:p.skills.map(s=>s[0]).join(' / ')})).concat(E.COURTS.slice(1).map((c,i)=>({name:`0${i+8} · ${c.name} 코트 · 통상`,p:0,l:1,c:i+1,note:c.desc})),[{name:'11 · 프로 · 동현 · US',p:0,l:2,c:2,note:'빠른 공과 빨라진 상대 반응.'}]);
$('#example').innerHTML=examples.map((e,i)=>`<option value="${i}">${e.name}</option>`).join('');
function lineNumbers(){const code=$('#code');$('#lines').textContent=Array.from({length:code.value.split('\n').length},(_,i)=>i+1).join('\n');$('#lines').scrollTop=code.scrollTop;}
function parsed(){const result=Donghyun.run($('#code').value,{maxSteps:100000});return {config:E.parse(result.output),output:result.output.trim().split(/\s+/).join('  ')};}
function validate(){
 lineNumbers();
 try{const r=parsed();$('#error').hidden=true;$('#output').textContent=r.output;$('#config-description').textContent=`${E.PLAYERS[r.config.player].name} · ${E.LEVELS[r.config.level].name} · ${E.COURTS[r.config.court].name}`;if(!active){match=new E.Match(r.config);draw();}return r.config;}
 catch(e){$('#error').hidden=false;$('#error').textContent=e.message;$('#output').textContent='실행 오류';return null;}
}
function example(i){const e=examples[i];$('#code').value=makeCode(e.p,e.l,e.c);$('#example-note').textContent=e.note;validate();}
$('#example').onchange=()=>example(Number($('#example').value));
$('#code').oninput=validate;$('#code').onscroll=lineNumbers;
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
function sounds(){
 for(const ev of match.events.splice(0)){
  if(ev.type==='toss')tossSound();
  else if(ev.type==='hit')tone(ev.text==='smash'?320:460,.055,'square',.025);
  else if(ev.type==='bounce')tone(190,.035,'triangle',.03);
  else if(ev.type==='point'||ev.type==='game'){tone(523,.10);tone(659,.13,'triangle',.035,.12);}
  else if(ev.type==='skill'){[440,660,880,1047].forEach((f,i)=>tone(f,.10,'square',.02,i*.07));notice=ev.text;noticeTime=1.4;}
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
 g.gain.setValueAtTime(.065,t+.40);g.gain.exponentialRampToValueAtTime(.0001,t+.64);
 for(const [type,f] of [['triangle',110],['sine',55]]){
  const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);
  o.frequency.exponentialRampToValueAtTime(f*3.6,t+.60);o.connect(g);o.start(t);o.stop(t+.66);
 }
 setTimeout(()=>{g.disconnect();if(tossGain===g)tossGain=null;},800);
}
function toggleSound(){audio();sound=!sound;if(!sound&&tossGain){tossGain.gain.cancelScheduledValues(ctx.currentTime);tossGain.gain.setValueAtTime(0,ctx.currentTime);}$('#sound').textContent=sound?'소리 켬':'소리 끔';$('#sound').setAttribute('aria-pressed',String(sound));}
$('#sound').onclick=toggleSound;
$('#theme').onclick=()=>{const on=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=on?'dark':'light';$('#theme').textContent=on?'밝게':'어둡게';$('#theme').setAttribute('aria-pressed',String(on));};
function begin(config){
 match=new E.Match(config,Math.floor(Math.random()*2147483646)+1);active=true;manual=false;keys.clear();audio();acc=0;notice='';
 $('#stage').focus({preventScroll:true});draw();
}
async function run(){
 const c=validate();if(!c)return;
 if(active&&match.phase!=='match'){
  match.paused=true;await full(false);pending=c;$('#confirm-panel').hidden=false;$('#confirm-no').focus();draw();
 }else begin(c);
}
$('#run').onclick=run;$('#court-start').onclick=run;
$('#confirm-yes').onclick=()=>{const c=pending;pending=null;$('#confirm-panel').hidden=true;if(c)begin(c);};
$('#confirm-no').onclick=()=>{pending=null;$('#confirm-panel').hidden=true;match.paused=false;$('#stage').focus({preventScroll:true});draw();};
function setup(){active=false;match.paused=false;full(false);validate();$('#court-start').focus({preventScroll:true});draw();}
$('#restart-menu').onclick=setup;$('#new-match').onclick=setup;
$('#resume').onclick=()=>{match.paused=false;$('#stage').focus({preventScroll:true});keys.clear();draw();};
function setTab(name){
 if(active&&!match.paused&&name!=='play'){match.paused=true;keys.clear();}
 tab=name;document.querySelectorAll('.tab-panel').forEach(e=>e.hidden=e.id!=='tab-'+name);
 document.querySelectorAll('[data-tab]').forEach(e=>e.setAttribute('aria-selected',String(e.dataset.tab===name)));draw();
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
function aim(){return {x:keys.has('ArrowLeft')?-1:keys.has('ArrowRight')?1:padAxes.x,y:keys.has('ArrowUp')?-1:keys.has('ArrowDown')?1:padAxes.y};}
function command(key){
 if(tab!=='play'||!$('#confirm-panel').hidden)return;
 if(key==='pause'){
  if(!active){run();return;}if(match.phase==='match'){setup();return;}
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
 if(e.code==='Escape'){e.preventDefault();if($('#stage').classList.contains('is-full'))full(false);else command('pause');return;}
 if(tab!=='play')return;
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
 for(const n of Object.keys(mapping))if(down(n)&&!oldPad[n]&&!isEdit(document.activeElement))command(mapping[n]);
 oldPad=pad.buttons.map(b=>b.pressed);
}
function draw(){
 R.draw(match);const cfg=match.config,p=E.PLAYERS[cfg.player],opp=E.PLAYERS[match.people[1].id];
 const showEnd=match.phase==='match'&&!(match.fx?.type==='lose'&&match.fx.ttl>1.8);
 const next=JSON.stringify([active,tab,cfg,match.phase,match.paused,match.points,match.games,match.sets,match.server,match.energy,match.winner,match.message,noticeTime>0?notice:'',!!pending,showEnd]);
 if(next===hudKey)return;hudKey=next;
 $('#court-caption').textContent=captions[cfg.court];
 $('#player-name').innerHTML=p.name+` <small>나 ${match.server===0?'· 서브':''}</small>`;
 $('#opponent-name').innerHTML=opp.name+` <small>동현AI™ ${match.server===1?'· 서브':''}</small>`;
 $('#set-score').textContent=match.sets.join(' : ');$('#game-score').textContent=match.games.join(' : ');$('#point-score').textContent=match.score().join(' : ');
 $('#start-card').hidden=active;$('#pause-card').hidden=!active||!match.paused||match.phase==='match'||!$('#confirm-panel').hidden;
 $('#end-card').hidden=!active||!showEnd;$('#start-title').textContent=`${p.name}, ${E.COURTS[cfg.court].name}에 서다.`;
 $('#start-meta').textContent=`${E.LEVELS[cfg.level].name} · 공격 ${p.atk} / 수비 ${p.def} / 이동 ${p.mov}`;
 $('#status').textContent=!active?'코드로 출전하고 X로 토스하자.':noticeTime>0?notice:match.message;
 $('#energy-pips').innerHTML=Array.from({length:6},(_,i)=>`<i class="${i<match.energy?'on':''}"></i>`).join('');$('#energy-pips').setAttribute('aria-label',`에너지 ${match.energy} / 6`);
 p.skills.forEach((sk,i)=>$('#skill'+(i+1)).innerHTML=`${sk[0]}<small>${sk[1]}칸 · ${match.energy>=sk[1]?'사용 가능':'충전 필요'}</small>`);
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
document.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>{$('#example').value=b.dataset.player;example(Number(b.dataset.player));setTab('play');$('#code').focus();});
window.render_game_to_text=()=>JSON.stringify({phase:active?match.phase:'setup',paused:match.paused,coordinate:'x right, y near/bottom positive, z height. Camera fixed.',config:match.config,people:match.people,ball:match.ball,score:match.score(),games:match.games,sets:match.sets,server:match.server,energy:match.energy,armed:match.armed,effects:match.effects,fx:match.fx,message:match.message,tab,winner:match.winner});
window.advanceTime=ms=>{manual=true;for(let i=0;i<Math.round(ms/1000/E.DT);i++)tick(E.DT);draw();};
window.TeApp={get match(){return match;},begin,setup,makeCode,renderer:R,resumeClock(){manual=false;acc=0;}};
example(0);requestAnimationFrame(loop);
})();

/* 동현테: fixed-step, world-space XYZ tennis. Original implementation, no ROM code. */
(function(root){
'use strict';
const PLAYERS=[
 {name:'동현',atk:100,def:100,mov:100,color:'#b95648',skills:[['샤아아즈나블',1,'불꽃 리턴이 유효하게 바운드하면 포인트. 성공 전까지 다음 랠리에도 준비가 남는다.'],['샤아자쿠',1,'이번 랠리 동안 타격 입력마다 공으로 혜성 이동하여 리턴한다.']]},
 {name:'뭉치',atk:90,def:90,mov:90,color:'#aa6454',skills:[['오겡끼데스까',3,'경기를 끝내고 즉시 승리한다.'],['액슬로즈',1,'라켓을 두 번 내리쳐 부수고 이번 게임을 내준다. 경기는 이어진다.']]},
 {name:'뚱띠',atk:120,def:80,mov:110,color:'#aa7041',skills:[['사세보후우샤',1,'이번 랠리 동안 모든 리턴을 바람에 실어 네트 앞에 떨어뜨린다.'],['와루이지와나',1,'이번 랠리 동안 상대가 치는 모든 공의 시간이 느려진다. 미리 켜 둘 수 있다.']]},
 {name:'또치',atk:90,def:90,mov:120,color:'#458878',skills:[['구마몬기쥬츠',1,'상대 반대편 드롭이 유효하게 바운드하면 포인트. 성공 전까지 다음 랠리에도 남는다.'],['컴온스펜서',1,'상대가 이번 랠리 동안 공 반대편으로 춤추며 간다.']]},
 {name:'포동이',atk:80,def:80,mov:130,color:'#d5bb82',skills:[['멍멍',1,'이번 랠리 동안 상대의 모든 리턴이 헛스윙이 된다.'],['아잉뿌잉',1,'이번 랠리 동안 상대가 귀여움에 쓰러진다. 포인트가 끝나면 일어난다.']]},
 {name:'꽥꽥',atk:80,def:90,mov:90,color:'#d6a54c',skills:[['비밀이야',1,'리턴이 유효하게 바운드하면 사라지고 내 포인트. 성공 전까지 다음 랠리에도 남는다.'],['알려고하지마',1,'유효한 서브가 사라지고 내 포인트. 내 서브가 올 때까지 미리 준비할 수 있다.']]},
 {name:'슈슈',atk:90,def:100,mov:80,color:'#88aa68',skills:[['울트라롱팔',1,'이번 랠리 동안 횟수 제한 없이 긴 팔로 리턴한다. 타격 입력은 필요.'],['리만가설',1,'이번 랠리 동안 다음 바운드 위치를 표시한다.']]},
 {name:'이삐',atk:70,def:90,mov:100,color:'#6fa9bf',skills:[['양재천범람',1,'이번 랠리 동안 내가 친 공과 함께 물결이 네트를 넘어 상대를 덮친다. 젖은 상대는 이동이 90% 느려진다.'],['브롬톤앞바퀴',1,'이번 랠리 동안 빨리 이동해도 닿지 않는 공에 타격 입력을 하면 앞바퀴를 타고 굴러가 친다. 다섯 번에 한 번꼴로 놓친다.']]},
 {name:'빽빽',atk:90,def:100,mov:110,color:'#9a86c4',skills:[['오마이갓',1,'이번 랠리 동안 내가 친 공이 하트 다섯 갈래로 갈라진다. 진짜는 무작위 하나뿐이고, 상대가 우연히 진짜를 고르면 랠리가 이어진다.'],['백미취사완료',1,'이번 랠리 동안 내가 공을 치면 상대가 취한 듯 비틀거리며 네트 앞으로 걸어온다. 팔이 닿는 거리도 절반이 된다.']]}
];
const COURTS=[
 {name:'윔블던',surface:'잔디',bounce:.56,retain:.94,ground:'#6f9274',outer:'#355d51',line:'#f2edd4',accent:'#beb08b',desc:'낮고 빠르게 미끄러지는 공'},
 {name:'호주',surface:'하드',bounce:.73,retain:.85,ground:'#4f8ba3',outer:'#274e68',line:'#eaf0e7',accent:'#dfa77d',desc:'안정적인 중간 높이의 반발'},
 {name:'US',surface:'하드',bounce:.69,retain:.90,ground:'#436d91',outer:'#507b68',line:'#eeeadd',accent:'#b6c2a1',desc:'호주보다 낮고 빠른 하드 코트'},
 {name:'프랑스',surface:'클레이',bounce:.83,retain:.72,ground:'#b7795b',outer:'#405f55',line:'#f2dfc9',accent:'#d3b594',desc:'속도는 줄고 높이 튀는 공'}
];
const LEVELS=[{name:'초보',speed:.88,react:.24,error:.65},{name:'통상',speed:1,react:.14,error:.32},{name:'프로',speed:1.13,react:.07,error:.13}];
const SKILL_KINDS=[['fire','comet'],['win','lose'],['wind','slow'],['drop','dance'],['miss','fall'],['vanish','serveVanish'],['long','predict'],['flood','wheel'],['hearts','drunk']];
const G=13,NET=.92,W=4.115,L=11.885,DT=1/120,LONG_REACH=3,BREAK_TIME=2.8;
// 이삐·빽빽: all four are rally effects. FLOOD_MOVE scales the soaked opponent's speed; the wheel ride takes
// WHEEL_TICKS fixed steps (0.2 s) and skids past the ball with probability WHEEL_MISS; five hearts fan out
// HEART_SPREAD metres apart at the first bounce; a tipsy opponent walks at TIPSY_WALK of full speed with TIPSY_REACH of the reach.
const FLOOD_MOVE=.1,WHEEL_TICKS=24,WHEEL_MISS=.2,WHEEL_SKID=1.5,HEARTS=5,HEART_SPREAD=1.5,TIPSY_WALK=.45,TIPSY_REACH=.5;
// Sideways offset of heart j from the real ball: zero at the racket, full spread from the first bounce on.
function heartOffset(b,j){const h=b&&b.hearts;if(!h)return 0;return (j-h.real)*HEART_SPREAD*clamp((b.age||0)/(b.flightTime||1),0,1);}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function parse(out){
 const t=String(out).trim().split(/\s+/).filter(Boolean).map(Number);
 if(t.length!==3)throw Error('선수 · 난이도 · 경기장, 정수 세 개를 차례로 출력하자.');
 t.forEach((v,i)=>{if(!Number.isInteger(v)||v<1||v>[PLAYERS.length,3,4][i])throw Error(['선수는 1–'+PLAYERS.length,'난이도는 1–3','경기장은 1–4'][i]+'만 된다.');});
 return {player:t[0]-1,level:t[1]-1,court:t[2]-1};
}
// Opponent: any of the other players, chosen from the match seed without touching the rally RNG.
function pickOpponent(c,seed){
 const others=PLAYERS.map((_,i)=>i).filter(i=>i!==c.player);
 if(Number.isInteger(c.opponent)&&others.includes(c.opponent))return c.opponent;
 let x=(seed>>>0)^0x9e3779b9;x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);x=(x^(x>>>16))>>>0;
 return others[x%others.length];
}
class Match{
 constructor(config={player:0,level:0,court:0},seed=20261111){
  this.config={...config,opponent:pickOpponent(config,seed)};this.seed=seed>>>0;this.time=0;this.tick=0;this.level=LEVELS[config.level];this.court=COURTS[config.court];
  this.people=[{id:config.player,x:1.5,y:12.3,side:1,swing:0,cool:0,pose:'idle'},{id:this.config.opponent,x:-1.5,y:-11,side:-1,swing:0,cool:0,pose:'idle'}];
  this.points=[0,0];this.games=[0,0];this.sets=[0,0];this.history=[];this.server=0;this.totalGames=0;this.tb=false;this.tbFirst=0;
  this.energy=6;this.returns=0;this.rally=0;this.totalHits=0;this.events=[];this.phase='ready';this.paused=false;this.winner=null;this.faults=0;
  this.message='X 토스';this.armed=null;this.pendingSkills={};this.effects={};this.fx=null;this.ball=null;this.wheel=null;this.timer=0;this.aiClock=0;this.aiTarget={x:0,y:-10};
  this.setupPoint();
 }
 rand(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
 event(type,text,kind){this.events.push(kind?{type,text,kind}:{type,text});if(this.events.length>30)this.events.shift();}
 score(){if(this.tb)return this.points.map(String);if(this.points[0]>=3&&this.points[1]>=3)return this.points[0]===this.points[1]?['40','40']:this.points[0]>this.points[1]?['AD','40']:['40','AD'];return this.points.map(p=>['0','15','30','40'][p]||'40');}
 // keep=true after a fault or let: the point is still alive, so prepared skills and rally effects stay.
 setupPoint(keep=false){
  this.phase='ready';this.timer=0;this.ball=null;this.pendingServe=null;this.fx=null;this.skillCue=null;this.rally=0;this.wheel=null;
  // endRally clears used effects. Preparations made during a point break survive here.
  const s=this.people[this.server],r=this.people[1-this.server],parity=(this.points[0]+this.points[1])%2;
  s.x=(parity? -1:1)*s.side*1.5;s.y=s.side*12.3;r.x=-s.x;r.y=r.side*10.8;
  for(const p of this.people){p.pose='idle';p.swing=0;p.cool=0;p.anim=null;p.walk=false;p.gait=0;p.moveX=0;p.moveY=0;}
  this.message=this.server===0?'X 토스 · X 강한 서브 / Z 약한 서브':'동현AI™ 서브 준비';
 }
 swapEnds(){
  for(const p of this.people){
   p.side*=-1;p.x*=-1;p.y*=-1;p.moveX=-(p.moveX||0);p.moveY=-(p.moveY||0);
   if(p.anim){p.anim.hand*=-1;if(['forehand','backhand'].includes(p.anim.name))p.anim.name=p.anim.hand<0?'backhand':'forehand';}
  }
 }
 animate(i,name,duration,hand=1,height=1){this.people[i].anim={name,time:0,duration,hand,height};}
 cueSkill(kind,prepared=false){
  // Presentation only: no random numbers, hit windows, energy or world coordinates.
  const id=this.people[0].id,slot=SKILL_KINDS[id].indexOf(kind);
  if(slot<0)return;
  this.skillCue={kind,prepared,player:id,slot,name:PLAYERS[id].skills[slot][0],ttl:1.6,duration:1.6};
 }
 setFx(o,ttl){this.fx={...o,ttl,duration:ttl};}
 hasPrepared(kind){return this.armed===kind||this.pendingSkills[kind]===true;}
 consumePrepared(kind){
  delete this.pendingSkills[kind];
  if(this.armed===kind)this.armed=Object.keys(this.pendingSkills)[0]||null;
 }
 // One-shot winners are consumed only by a successful legal landing, not by a missed chance.
 endRally(timer){
  this.faults=0;this.phase='point';this.timer=timer;this.ball=null;this.pendingServe=null;this.effects={};this.wheel=null;
  for(const p of this.people)if(['fall','dance','whiff','drunk'].includes(p.pose))p.pose='idle';
 }
 winGame(w){
  this.games[w]++;this.points=[0,0];this.totalGames++;this.server=1-this.server;
  this.message='게임 · '+(w===0?'나':'동현AI™');this.event('game',this.message);
  if(this.totalGames%2===1)this.swapEnds();
  if(this.games[w]>=6&&this.games[w]-this.games[1-w]>=2)this.winSet(w);
  else if(this.games[0]===6&&this.games[1]===6){this.tb=true;this.tbFirst=this.server;this.message='타이브레이크 · 7점, 두 점 차';}
 }
 // 액슬로즈: hand the current game (a tiebreak counts as one game) to the opponent. No point, no energy.
 concedeGame(name){
  if(['point','fault','match'].includes(this.phase))return false;
  const p=this.people[0];p.anim=null;p.pose='idle';p.walk=false;p.swing=0;p.cool=0;
  this.endRally(BREAK_TIME+.2);
  if(this.tb){
   const n=this.points[0]+this.points[1];this.games[1]++;this.totalGames++;
   if(n===0||n%6!==0)this.swapEnds();
   this.server=1-this.tbFirst;this.winSet(1);
  }else this.winGame(1);
  if(this.phase!=='match'){this.timer=Math.max(this.timer,BREAK_TIME+.2);this.message=name+' · 이번 게임을 내줬다';}
  this.event('concede',this.message);return true;
 }
 finish(w,why){this.phase='match';this.winner=w;this.message=why+' · '+(w===0?'승리':'패배');this.ball=null;this.armed=null;this.pendingSkills={};this.effects={};this.wheel=null;this.event('match',this.message);}
 point(w,why){
  if(['point','match'].includes(this.phase))return;
  this.points[w]++;this.energy=clamp(this.energy+2,0,6);this.message=why+' · '+(w===0?'내':'상대')+' 포인트';this.event('point',this.message);
  this.endRally(1.7);
  const endSet=this.tb?(this.points[w]>=7&&this.points[w]-this.points[1-w]>=2):false;
  if(this.tb){
   const n=this.points[0]+this.points[1];
   if(n%6===0)this.swapEnds();
   this.server=(this.tbFirst+(Math.floor((n+1)/2)%2))%2;
   if(endSet){this.games[w]++;this.totalGames++;if(n%6!==0)this.swapEnds();this.server=1-this.tbFirst;this.winSet(w);}
  }else if(this.points[w]>=4&&this.points[w]-this.points[1-w]>=2)this.winGame(w);
 }
 winSet(w){
  this.history.push([...this.games]);this.sets[w]++;this.points=[0,0];this.games=[0,0];this.tb=false;
  this.message='세트 · '+(w===0?'나':'동현AI™');this.event('set',this.message);
  if(this.sets[w]===2)this.finish(w,'2세트 선승');else this.timer=2.4;
 }
 fault(why){
  this.faults++;if(this.faults>=2){this.point(1-this.server,'더블 폴트');return;}
  this.ball=null;this.phase='fault';this.timer=1.3;this.message=why+' · 두 번째 서브';this.event('fault',this.message);
 }
 toss(){
  if(this.phase!=='ready')return false;
  // The left arm reaches across the body to toss above the right-hand racket.
  // Keep the whole vertical flight clear of the head, on the hitting side.
  const p=this.people[this.server];this.ball={x:p.x+.65*p.side,y:p.y,z:1.1,vx:0,vy:0,vz:7.8,by:this.server,bounces:0,serve:true,crossed:false};
  this.phase='toss';this.timer=0;this.pendingServe=null;this.animate(this.server,'toss',2.1);p.walk=false;p.pose='toss';this.message=this.server===0?'토스 · X/Z로 타격, 높은 공은 준비 후 자동 타격':'동현AI™ 토스';this.event('toss','토스');return true;
 }
 serve(kind,aim={}){
  const b=this.ball,p=this.people[this.server];if(this.phase!=='toss'||!b)return false;
  if(b.z>3.15||(b.z<1.45&&b.vz>=0)){
   this.pendingServe={kind,aim:{x:aim.x||0,y:aim.y||0}};this.message='타격 준비 · 닿는 높이에 오면 친다';return true;
  }
  if(b.z<1.45){this.pendingServe=null;this.message='헛스윙 · 공을 받고 다시 X로 토스';return false;}
  // ROM timing sweep: higher contact went wider/deeper; lower contact shorter/central.
  // These are accessible game-tuned coordinates, not claimed ROM physics constants.
  const q=clamp((b.z-1.45)/1.7,0,1),side=-Math.sign(p.x);
  // Starting wider changes the diagonal angle; do not aim at one fixed spot.
  const baseX=side*(1.05+1.9*q)-(p.x+side*1.5)*.24*(.35+.65*q);
  const tx=baseX+(aim.x||0)*.55,ty=-p.side*(2.3+3.3*q-(aim.y||0)*p.side*2.0);
  const target={x:tx,y:ty,height:b.z,quality:q,startX:p.x,steer:(aim.x||0)*.55};this.pendingServe=null;
  this.launch(this.server,tx,ty,kind==='lob'?1.26:1.04+.08*(1-q),kind,true);
  this.ball.serviceTarget=target;
  // Accessible contact extension, not mid-flight steering or a claimed ROM constant.
  this.ball.serveControl=this.server===0?{remaining:.12,baseX,steer:target.steer}:null;
  p.pose='serve';p.swing=0;this.animate(this.server,'serve',kind==='lob'?.52:.44,1,b.z);
  p.anim.soft=kind==='lob';this.message=q>.65?'높은 타점 · 바깥쪽 깊게':q<.3?'낮은 타점 · 중앙 쪽 짧게':'중간 타점 · 서비스 박스 안쪽';return true;
 }
 launch(i,tx,ty,t,kind,serve=false){
  const p=this.people[i],old=this.ball;let z=serve?old.z:clamp(old.z,.25,3.4);
  t=Math.max(.5,t)/this.level.speed;
  this.ball={x:old.x,y:old.y,z,vx:(tx-old.x)/t,vy:(ty-old.y)/t,vz:(.5*G*t*t-z)/t,by:i,bounces:0,serve,crossed:false,netTouch:false,kind,age:0,flightTime:t,serviceOriginX:serve?p.x:null};
  this.ball.slow=i===1&&!!this.effects.slow;
  this.phase='rally';this.event('hit',kind);this.totalHits++;this.aiClock=0;
  if(i===0)this.launchSkills(old);
 }
 // 이삐·빽빽: what my own hit sets off while the rally effect is on. Serves count as hits.
 launchSkills(from){
  const e=this.effects,b=this.ball,o=this.people[1];
  if(e.flood){b.flood=true;if(!e.soaked)this.setFx({type:'flood',x:from.x,y:from.y},.9);}
  if(e.hearts){
   // Two draws per hit: which heart is the ball, and which one the opponent believes in.
   b.hearts={real:Math.floor(this.rand()*HEARTS),pick:Math.floor(this.rand()*HEARTS),swung:false};
   this.setFx({type:'hearts',x:from.x,y:from.y},.9);this.cueSkill('hearts');this.event('hearts','하트 다섯 갈래');
  }
  if(e.drunk&&!e.tipsy){
   e.tipsy=true;this.setFx({type:'drunk',x:o.x,y:o.y},1.3);this.cueSkill('drunk');this.event('skill','백미취사완료 · 상대가 비틀거린다','drunk');
  }
 }
 reachable(i,remote=false){
  const b=this.ball,p=this.people[i];if(this.phase!=='rally'||!b||b.by===i||!b.crossed||b.y*p.side<.35||b.z>3.8||b.z<.08)return false;
  if(b.serve&&b.bounces===0)return false;
  if(i===1&&['fire','drop','vanish'].includes(b.power))return false;
  if(i===1&&b.hearts&&b.hearts.pick!==b.hearts.real)return false; // the opponent is after a fake heart
  return remote||Math.hypot(b.x-p.x,(b.y-p.y)*.85)<this.reach(i);
 }
 reach(i){return (1.13*PLAYERS[this.people[i].id].def/100+.20)*(i===1&&this.effects.tipsy?TIPSY_REACH:1);}
 stroke(i,kind='drive',aim={}){
  const p=this.people[i];if(p.cool>0||(i===0&&this.wheel))return false;
  p.swing=.19;p.cool=.30;p.pose='swing';p.kind=kind;p.aim={...aim};
  const hand=this.ball&&this.ball.x<p.x? -1:1;this.animate(i,kind==='lob'?'lobWindup':'windup',.3,hand);
  if(i===0&&this.effects.wheel&&!this.reachable(0,false)&&this.reachable(0,true)){
   // 브롬톤앞바퀴: roll to the ball over WHEEL_TICKS steps, then swing. One draw decides a skid past it.
   const r=this.rand(),miss=r<WHEEL_MISS;
   this.wheel={n:WHEEL_TICKS,miss,off:miss?(r<WHEEL_MISS/2?-WHEEL_SKID:WHEEL_SKID):0};
   p.swing=0;p.cool=WHEEL_TICKS*DT+.3;p.anim=null;p.pose='idle';
   this.setFx({type:'wheel',x:p.x,y:p.y,toX:this.ball.x,toY:this.ball.y},.7);this.cueSkill('wheel');this.event('wheel','앞바퀴 출발');
   return false;
  }
  if(i===0&&this.effects.comet&&this.reachable(0,true)){
   this.setFx({type:'comet',x:p.x,y:p.y,toX:this.ball.x,toY:this.ball.y},.7);
   p.x=clamp(this.ball.x,-6.3,6.3);p.y=clamp(this.ball.y+.25*p.side,p.side===1?.8:-14.2,p.side===1?14.2:-.8);this.cueSkill('comet');
  }
  return this.tryHit(i);
 }
 tryHit(i){
  const p=this.people[i],b=this.ball;
  if(p.swing<=0)return false;
  // The long-arm animation is used only beyond normal reach; the effect lasts for the rally.
  const near=this.reachable(i,false),remote=!near&&i===0&&this.effects.long>0&&this.reachable(0,true);
  if(!near&&!remote)return false;
  if(i===1&&this.effects.miss){this.effects.whiff=1.4;p.swing=0;p.pose='whiff';this.event('skill','헛스윙!');return false;}
  if(i===1&&(this.effects.fall>0||this.effects.whiff>0||this.effects.dance))return false;
  const aim=p.aim||{},kind=p.kind||'drive',isSmash=kind!=='lob'&&b.z>2.25,isVolley=b.bounces===0;
  const localY=(aim.y||0)*p.side;
  let tx=(aim.x||0)*3.45,depth=localY<0?11.0:localY>0?3.0:9.3;
  if(i===1){tx=(this.rand()>.5?1:-1)*(2.6+this.rand()*.8);depth=8.2+this.rand()*2;}
  const off=remote?0:b.x-p.x,hitHand=b.x<p.x?-1:1,hitHeight=b.z;
  tx+=off*.48;
  let ty=-p.side*depth;
  let t=kind==='lob'&&!isVolley?2.20:Math.max(.78,Math.abs(b.y-ty)/(12.5*PLAYERS[p.id].atk/100));
  if(isVolley)t*=kind==='lob'?1.18:.80;
  if(isSmash)t*=.74;
  const oldArm=i===0?(['fire','drop','vanish'].find(k=>this.hasPrepared(k))||(this.effects.wind?'wind':null)):null,from={x:p.x,y:p.y,toX:b.x,toY:b.y,toZ:b.z};
  if(oldArm==='wind'||oldArm==='drop'){ty=-p.side*1.7;tx=oldArm==='drop'?(this.people[1].x>=0?-3.5:3.5):clamp(tx,-3.4,3.4);t=Math.max(1.05,Math.abs(b.y-ty)/10);}
  this.launch(i,tx,ty,t,isSmash?'smash':isVolley?(kind==='lob'?'softVolley':'volley'):kind);
  this.ball.power=oldArm;
  if(oldArm){this.setFx({type:oldArm,x:p.x,y:p.y},1.1);this.cueSkill(oldArm);}
  if(remote){
   this.setFx({type:'long',...from},.5);this.event('long','긴 팔 리턴');
  }
  p.swing=0;p.pose=isSmash?'smash':isVolley?'volley':'swing';p.cool=.24;
  this.animate(i,isSmash?'smash':isVolley?(kind==='lob'?'softVolley':'volley'):kind==='lob'?'lob':hitHand<0?'backhand':'forehand',isSmash?.40:kind==='lob'?.46:.34,hitHand,hitHeight);
  this.rally++;if(i===0){this.returns++;if(this.returns%2===0){this.energy=clamp(this.energy+1,0,6);this.event('charge','리턴 2회 · 기술 +1');}}
  this.message=isSmash?'스매시':isVolley?(kind==='lob'?'약한 발리':'강한 발리'):kind==='lob'?'로브 · 높게 띄워 치기':'스트로크 · 가로로 밀어 치기';return true;
 }
 skill(slot){
  if(this.paused||this.phase==='match')return {ok:false,why:'경기를 계속할 때 쓰자.'};
  const id=this.people[0].id,sk=PLAYERS[id].skills[slot];if(!sk)return {ok:false,why:'없는 기술'};
  if(this.energy<sk[1])return {ok:false,why:`기술 에너지 ${sk[1]}칸이 필요하다.`};
  let kind=SKILL_KINDS[id][slot];
  const arm=['fire','drop','vanish','serveVanish'].includes(kind);
  if(this.hasPrepared(kind)||this.effects[kind])return {ok:false,why:'이미 준비했거나 효과가 남아 있다.'};
  if(['win','lose'].includes(kind)&&['point','fault'].includes(this.phase))return {ok:false,why:'다음 서브 준비 때 쓰자.'};
  this.energy-=sk[1];this.event('skill',sk[0],kind);this.message=sk[0];this.cueSkill(kind,arm);
  if(arm){this.pendingSkills[kind]=true;if(!this.armed)this.armed=kind;}
  else if(kind==='win'){this.setFx({type:'win'},3);this.finish(0,sk[0]);}
  else if(kind==='lose'){this.concedeGame(sk[0]);this.setFx({type:'lose'},BREAK_TIME);}
  else {this.effects[kind]=true;if(kind==='slow'&&this.phase==='rally'&&this.ball?.by===1)this.ball.slow=true;}
  return {ok:true,why:sk[0]};
 }
 predict(){
  const b=this.ball;if(!b||this.phase!=='rally')return null;
  const t=(b.vz+Math.sqrt(b.vz*b.vz+2*G*b.z))/G;
  return {x:b.x+b.vx*t,y:b.y+b.vy*t,t};
 }
 move(i,dx,dy,dt){
  const p=this.people[i],sp=4.9*PLAYERS[p.id].mov/100*this.level.speed*(i?1.06:1)*(i===1&&this.effects.soaked?FLOOD_MOVE:1),len=Math.hypot(dx,dy)||1,ox=p.x,oy=p.y;
  if(len>1){dx/=len;dy/=len;}p.x=clamp(p.x+dx*sp*dt,-6.3,6.3);p.y=clamp(p.y+dy*sp*dt,p.side===1?.8:-14.2,p.side===1?14.2:-.8);
  const distance=Math.hypot(p.x-ox,p.y-oy);p.walk=distance>1e-6;
  if(p.walk){p.gait=(p.gait||0)+distance*2.2;p.moveX=Math.sign(dx);p.moveY=Math.sign(dy);}
  if(p.cool<=0&&!p.anim)p.pose=p.walk?'run':'idle';
 }
 ai(dt){
  const p=this.people[1],b=this.ball;
  if(this.phase==='rally'&&this.effects.fall>0){p.pose='fall';return;}
  if(this.effects.whiff>0){p.pose='whiff';return;}
  if(this.phase==='ready'&&this.server===1){this.timer+=dt;if(this.timer>.7)this.toss();return;}
  if(this.phase==='toss'&&this.server===1){if(b.vz<0&&b.z<=2.35&&b.z>1.5)this.serve(this.rand()<.16?'lob':'drive');return;}
  if(this.phase!=='rally')return;
  this.aiClock-=dt;
  if(this.aiClock<=0){
   this.aiClock=this.level.react;
   if(b.by===0){
    const pred=this.predict();let x=b.x,y=b.y;
    if(pred){x=pred.x;y=pred.y;}
    // Approach first landing, then chase the ball. No teleporting in normal play.
    this.aiTarget={x:clamp(x+(this.rand()-.5)*this.level.error,-5.6,5.6),y:clamp(y+p.side*.75,p.side===1?1.1:-13.2,p.side===1?13.2:-1.1)};
    if(b.bounces>0){this.aiTarget.x=b.x;this.aiTarget.y=b.y;}
    // 오마이갓: the opponent runs to the heart it picked, real or not.
    if(b.hearts)this.aiTarget.x=clamp(this.aiTarget.x+(b.hearts.pick-b.hearts.real)*HEART_SPREAD,-5.6,5.6);
   }else this.aiTarget={x:0,y:p.side*9.5};
  }
  const target=this.aiTarget;
  if(this.effects.dance){this.move(1,-Math.sign(b.x-p.x),Math.sin(this.time*8)*.55,dt);p.pose='dance';return;}
  if(this.effects.tipsy){
   // 백미취사완료: a slow, swaying walk to the net; the ball is no longer followed, only swung at when it passes close.
   const goal=p.side*1.5,sway=Math.sin(this.time*2.6)*.75+Math.sin(this.time*5.3)*.25;
   this.move(1,sway*TIPSY_WALK,clamp((goal-p.y)*3,-1,1)*TIPSY_WALK,dt);
   if(p.cool<=0&&!p.anim)p.pose='drunk';
   if(this.reachable(1)&&p.cool<=0)this.stroke(1,this.rand()<.14?'lob':'drive');
   return;
  }
  if(b.by===0&&b.hearts&&b.hearts.pick!==b.hearts.real&&!b.hearts.swung&&b.crossed&&p.cool<=0&&b.z<3.8&&(!b.serve||b.bounces>0)
   &&Math.hypot(b.x+heartOffset(b,b.hearts.pick)-p.x,(b.y-p.y)*.85)<this.reach(1)){
   b.hearts.swung=true;this.stroke(1,'drive');this.message='오마이갓 · 상대가 가짜 하트를 쳤다';this.event('skill',this.message,'heartPop');
  }
  this.move(1,clamp((target.x-p.x)*3,-1,1),clamp((target.y-p.y)*3,-1,1),dt);
  if(this.reachable(1)&&p.cool<=0)this.stroke(1,this.rand()<.14?'lob':'drive');
 }
 step(dt,input={}){
  if(this.paused)return;
  this.time+=dt;this.tick++;
  if(this.skillCue){this.skillCue.ttl-=dt;if(this.skillCue.ttl<=0)this.skillCue=null;}
  if(this.fx){
   const f=this.fx,was=(f.duration||0)-f.ttl;f.ttl-=dt;
   // Sound cues for the two racket slams; presentation only.
   if(f.type==='lose'){const now=f.duration-f.ttl;if(was<.42&&now>=.42)this.event('smash','쾅');if(was<.92&&now>=.92)this.event('crack','라켓이 부러졌다');}
   if(f.ttl<=0)this.fx=null;
  }
  for(const k of ['whiff'])if(this.effects[k]>0){
   this.effects[k]-=dt;
   if(this.effects[k]<=0){ // never leave a negative, truthy timer behind
    delete this.effects[k];const o=this.people[1];if(['fall','whiff'].includes(o.pose))o.pose='idle';
    if(k==='fall')this.event('release','아잉뿌잉 해제 · 상대가 일어났다');
   }
  }
  for(const p of this.people){p.cool=Math.max(0,p.cool-dt);p.swing=Math.max(0,p.swing-dt);if(p.anim){p.anim.time+=dt;if(p.anim.time>=p.anim.duration){p.anim=null;if(!['fall','dance','whiff','drunk'].includes(p.pose))p.pose=p.walk?'run':'idle';}}}
  if(this.phase==='match')return;
  if(this.phase==='point'||this.phase==='fault'){this.timer-=dt;if(this.timer<=0)this.setupPoint(this.phase==='fault');return;}
  const p=this.people[0];
  if(this.phase==='ready'&&this.server===0){
   const oldY=p.y;this.move(0,input.x||0,0,dt);p.y=oldY;
   const sign=((this.points[0]+this.points[1])%2?-1:1)*p.side;p.x=sign*clamp(Math.abs(p.x),.5,3.8);
  }else if(this.wheel)this.rideWheel();
  else if(!(this.phase==='toss'&&this.server===0)&&!(this.ball?.serveControl?.remaining>0))this.move(0,input.x||0,input.y||0,dt);
  this.ai(dt);
  if(this.phase==='toss'){
   // Slow only the toss, not rally flight: 1 s up / 1 s down.
   const b=this.ball,tossDt=dt*.6;b.z+=b.vz*tossDt-.5*G*tossDt*tossDt;b.vz-=G*tossDt;
   if(this.pendingServe&&b.z>=1.45&&b.z<=3.15){const s=this.pendingServe;this.serve(s.kind,s.aim);return;}
   if(b.z<=1.1&&b.vz<0){this.pendingServe=null;this.people[this.server].anim=null;this.people[this.server].pose='idle';this.ball=null;this.phase='ready';this.timer=0;this.message='다시 X로 토스';}
   return;
  }
  if(this.phase!=='rally'||!this.ball)return;
  this.steerServe(dt,input.x||0);
  this.tryHit(0);
  this.physics(dt);
 }
 // One fixed step of the wheel ride: close an equal share of what is left, so it arrives exactly on the last step.
 rideWheel(){
  const w=this.wheel,p=this.people[0],b=this.ball;
  if(!b||this.phase!=='rally'){this.wheel=null;return;}
  const tx=clamp(b.x+w.off,-6.3,6.3),ty=clamp(b.y+.25*p.side,p.side===1?.8:-14.2,p.side===1?14.2:-.8),k=1/w.n,ox=p.x,oy=p.y;
  p.x+=(tx-p.x)*k;p.y+=(ty-p.y)*k;w.n--;
  p.walk=false;p.moveX=Math.sign(p.x-ox);p.moveY=Math.sign(p.y-oy);
  if(w.n>0)return;
  this.wheel=null;
  if(w.miss){
   p.cool=.35;this.setFx({type:'wheelMiss',x:p.x,y:p.y},.9);this.message='브롬톤앞바퀴 · 미끄러져 놓쳤다';this.event('skill',this.message,'wheelMiss');
  }else{
   p.swing=.19;p.cool=.30;p.pose='swing';this.animate(0,p.kind==='lob'?'lobWindup':'windup',.3,1);
  }
 }
 steerServe(dt,axis){
  const b=this.ball,c=b?.serveControl;
  if(!c||c.remaining<=0||b.by!==0||b.bounces||b.crossed)return;
  const span=Math.min(dt,c.remaining);c.remaining=Math.max(0,c.remaining-span);
  const delta=clamp(axis,-1,1)*span/.12*1.4;
  if(delta){
   c.steer+=delta;b.serviceTarget.steer=c.steer;b.serviceTarget.x=c.baseX+c.steer;
   const remaining=b.flightTime-b.age;
   if(remaining>0)b.vx=(b.serviceTarget.x-b.x)/remaining;
  }
 }
 physics(dt){
  const b=this.ball;if(!b)return;
  if(b.slow)dt*=.23;
  // Resolve crossing/bounce at exact sub-frame event times rather than after tunnelling.
  let rem=dt;
  for(let k=0;k<3&&rem>1e-8&&this.phase==='rally';k++){
   const tn=!b.crossed&&b.vy&&b.y*b.vy<0?-b.y/b.vy:Infinity;
   const tb=(b.vz+Math.sqrt(b.vz*b.vz+2*G*Math.max(0,b.z)))/G;
   const step=Math.min(rem,tn>=0?tn:Infinity,tb>1e-8?tb:Infinity);
   b.x+=b.vx*step;b.y+=b.vy*step;b.z+=b.vz*step-.5*G*step*step;b.vz-=G*step;b.age+=step;rem-=step;
   if(tn<=step+1e-8){
    b.crossed=true;
    if(b.z<NET-.07){if(b.serve)this.fault('네트');else this.point(1-b.by,'네트');return;}
    if(b.z<NET+.07){b.netTouch=true;b.vx*=.72;b.vy*=.72;b.vz=Math.max(b.vz,1.1);this.event('net','네트 코드');}
    if(b.by===0&&b.flood&&!this.effects.soaked){ // 양재천범람: the wave goes over the net with the ball
     this.effects.soaked=true;this.setFx({type:'flood',x:this.people[1].x,y:this.people[1].y,end:true},1.4);this.cueSkill('flood');
     this.event('skill','양재천범람 · 상대가 물에 잠겼다','flood');
    }
   }
   if(tb<=step+1e-8){
    b.z=.001;b.bounces++;this.event('bounce','바운드');
    if(b.bounces===1){
     const legal=Math.abs(b.x)<=W+.035&&Math.abs(b.y)<=L+.035&&b.y*this.people[b.by].side<0;
     if(b.serve){
      const box=legal&&Math.abs(b.y)<=6.4+.035&&b.x*(b.serviceOriginX??this.people[b.by].x)<=0;
      if(!box){this.fault('서비스 아웃');return;}
      if(b.netTouch){this.phase='fault';this.timer=1.0;this.ball=null;this.message='렛 · 같은 서브 다시';this.event('let',this.message);return;}
      if(b.by===0&&this.hasPrepared('serveVanish')){this.consumePrepared('serveVanish');this.setFx({type:'vanish',x:b.x,y:b.y,end:true},1.5);this.cueSkill('serveVanish');this.point(0,'알려고하지마');return;}
     }else if(!legal){this.point(1-b.by,'아웃');return;}
     if(b.by===0&&['fire','drop','vanish'].includes(b.power)){
      this.consumePrepared(b.power);
      this.setFx({type:b.power==='fire'?'wall':b.power,x:b.x,y:b.y,end:true},1.6);this.point(0,b.power==='fire'?'샤아아즈나블':b.power==='drop'?'구마몬기쥬츠':'비밀이야');return;
     }
     b.vz=-b.vz*this.court.bounce;b.vx*=this.court.retain;b.vy*=this.court.retain;
    }else {this.point(b.by,'두 번 바운드');return;}
   }
  }
  if(this.phase!=='rally')return;
  const receiver=this.people[1-b.by];
  if(b.crossed&&(!b.serve||b.bounces>0)&&Math.abs(b.x-receiver.x)<.24&&Math.abs(b.y-receiver.y)<.28&&b.z<1.5&&receiver.cool<=0){this.point(b.by,'몸에 맞았다');return;}
  if(Math.abs(b.x)>9||Math.abs(b.y)>18){if(b.bounces===0){if(b.serve)this.fault('서비스 아웃');else this.point(1-b.by,'아웃');}else this.point(b.by,'리턴 실패');}
 }
 // Plain-data copy of the whole match. JSON keeps every float exactly, so a restored match replays identically.
 snapshot(){const o={...this};delete o.level;delete o.court;o.events=[];o.paused=false;return JSON.parse(JSON.stringify(o));}
 static restore(s){
  const bad=t=>{throw Error(t);},int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b,num=v=>typeof v==='number'&&Number.isFinite(v);
  if(!s||typeof s!=='object')bad('경기 정보가 없다.');
  const c=s.config;if(!c||!int(c.player,0,PLAYERS.length-1)||!int(c.level,0,2)||!int(c.court,0,3))bad('선수·난이도·경기장 정보가 맞지 않는다.');
  if(s.phase==='match')bad('이미 끝난 경기다.');
  if(!['ready','toss','rally','point','fault'].includes(s.phase))bad('경기 진행 정보가 맞지 않는다.');
  const pair=(a,max)=>Array.isArray(a)&&a.length===2&&a.every(v=>int(v,0,max));
  if(!pair(s.points,99)||!pair(s.games,7)||!pair(s.sets,1))bad('점수 정보가 맞지 않는다.');
  if(!Array.isArray(s.history)||s.history.length>2||!s.history.every(h=>pair(h,7)))bad('세트 기록이 맞지 않는다.');
  if(!int(s.server,0,1)||!int(s.tbFirst,0,1)||!int(s.energy,0,6)||!int(s.totalGames,0,40)||!int(s.faults,0,1)||typeof s.tb!=='boolean')bad('서브·에너지 정보가 맞지 않는다.');
  if(!int(s.seed,1,4294967295)||!num(s.time)||!int(s.tick,0,1e9)||!num(s.timer)||!num(s.aiClock)||!int(s.returns,0,1e7)||!int(s.rally,0,1e7)||!int(s.totalHits,0,1e7))bad('시계 정보가 맞지 않는다.');
  // Every nested value is checked against the shape the engine itself writes; unknown keys are refused.
  const NULLS=['power','serveControl','serviceOriginX','anim','height'],kinds=SKILL_KINDS.flat();
  const fits=(v,t,k)=>(v==null&&NULLS.includes(k))||(t==='n'?num(v):t==='b'?typeof v==='boolean':t==='s'?typeof v==='string'&&v.length<=60:Array.isArray(t)?t.includes(v)
   :!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(q=>Object.prototype.hasOwnProperty.call(t,q)&&fits(v[q],t[q],q)));
  const ANIM={name:['toss','serve','smash','windup','lobWindup','forehand','backhand','lob','volley','softVolley'],time:'n',duration:'n',hand:'n',height:'n',soft:'b'};
  const PERSON={id:'n',x:'n',y:'n',side:'n',swing:'n',cool:'n',pose:['idle','run','toss','serve','swing','smash','volley','dance','fall','whiff','drunk'],kind:['drive','lob'],aim:{x:'n',y:'n'},walk:'b',moveX:'n',moveY:'n',gait:'n',anim:ANIM};
  const BALL={x:'n',y:'n',z:'n',vx:'n',vy:'n',vz:'n',by:'n',bounces:'n',age:'n',flightTime:'n',crossed:'b',netTouch:'b',serve:'b',slow:'b',flood:'b',hearts:{real:'n',pick:'n',swung:'b'},kind:['drive','lob','smash','volley','softVolley'],
   power:['fire','comet','wind','drop','vanish','serveVanish'],serveControl:{baseX:'n',remaining:'n',steer:'n'},serviceOriginX:'n',serviceTarget:{x:'n',y:'n',height:'n',quality:'n',startX:'n',steer:'n'}};
  const FX={type:['wall','comet','fire','wind','drop','vanish','long','win','lose','flood','wheel','wheelMiss','hearts','drunk'],ttl:'n',duration:'n',x:'n',y:'n',toX:'n',toY:'n',toZ:'n',left:'n',end:'b'};
  const CUE={kind:kinds,prepared:'b',player:'n',slot:'n',name:'s',ttl:'n',duration:'n'};
  if(!Array.isArray(s.people)||s.people.length!==2||!s.people.every(p=>fits(p,PERSON)))bad('선수 정보가 맞지 않는다.');
  if(c.opponent!==undefined&&(!int(c.opponent,0,PLAYERS.length-1)||c.opponent===c.player))bad('상대 선수 정보가 맞지 않는다.');
  if(s.people[0].id!==c.player||s.people[1].id!==(c.opponent??6))bad('선수 정보가 맞지 않는다.'); // saves before v0.10 always faced 슈슈
  s.people.forEach(p=>{if(!num(p.x)||!num(p.y)||Math.abs(p.x)>6.31||Math.abs(p.y)>14.21||![1,-1].includes(p.side)||!num(p.swing)||!num(p.cool))bad('선수 위치가 맞지 않는다.');
   if(p.anim!=null&&!(typeof p.anim.name==='string'&&num(p.anim.time)&&num(p.anim.duration)&&num(p.anim.hand)))bad('선수 동작 정보가 맞지 않는다.');});
  if(s.people[0].side!==-s.people[1].side)bad('코트 방향이 맞지 않는다.');
  const b=s.ball;
  if(['toss','rally'].includes(s.phase)!==(b!=null))bad('공 정보가 맞지 않는다.');
  if(b&&(!fits(b,BALL)||!['x','y','z','vx','vy','vz'].every(k=>num(b[k]))||!int(b.by,0,1)||!int(b.bounces,0,2)||(s.phase==='rally'&&!(num(b.age)&&num(b.flightTime)))))bad('공 정보가 맞지 않는다.');
  if(b&&b.hearts!=null&&!(int(b.hearts.real,0,HEARTS-1)&&int(b.hearts.pick,0,HEARTS-1)&&typeof b.hearts.swung==='boolean'&&b.by===0))bad('공 정보가 맞지 않는다.');
  const w=s.wheel;
  if(w!=null&&!(typeof w==='object'&&!Array.isArray(w)&&Object.keys(w).length===3&&int(w.n,1,WHEEL_TICKS)&&typeof w.miss==='boolean'&&[0,WHEEL_SKID,-WHEEL_SKID].includes(w.off)&&(w.off!==0)===w.miss&&s.phase==='rally'&&SKILL_KINDS[c.player].includes('wheel')))bad('기술 진행 정보가 맞지 않는다.');
  if(s.armed!=null&&!SKILL_KINDS[c.player].includes(s.armed))bad('준비한 기술 정보가 맞지 않는다.');
  if(s.pendingSkills!==undefined&&(!s.pendingSkills||Array.isArray(s.pendingSkills)||typeof s.pendingSkills!=='object'||Object.entries(s.pendingSkills).some(([k,v])=>!['fire','drop','vanish','serveVanish'].includes(k)||!SKILL_KINDS[c.player].includes(k)||v!==true)))bad('준비한 기술 정보가 맞지 않는다.');
  const e=s.effects;if(!e||typeof e!=='object'||Array.isArray(e))bad('기술 효과 정보가 맞지 않는다.');
  for(const k of Object.keys(e)){
   const v=e[k],ok=['dance','miss','predict','comet','wind','slow','flood','wheel','hearts','drunk','soaked','tipsy'].includes(k)?v===true:k==='long'?v===true||int(v,1,LONG_REACH):k==='fall'?v===true||(num(v)&&v>0&&v<=4):k==='whiff'?num(v)&&v>0&&v<=1.4:false;
   if(!ok)bad('기술 효과 정보가 맞지 않는다.');
  }
  if(!s.aiTarget||!num(s.aiTarget.x)||!num(s.aiTarget.y))bad('상대 정보가 맞지 않는다.');
  if(s.fx!=null&&!(fits(s.fx,FX)&&num(s.fx.ttl)&&num(s.fx.duration)))bad('연출 정보가 맞지 않는다.');
  if(s.skillCue!=null&&!(fits(s.skillCue,CUE)&&num(s.skillCue.ttl)&&num(s.skillCue.duration)&&typeof s.skillCue.name==='string'))bad('연출 정보가 맞지 않는다.');
  if(s.pendingServe!=null&&!(['drive','lob'].includes(s.pendingServe.kind)&&s.pendingServe.aim&&num(s.pendingServe.aim.x)&&num(s.pendingServe.aim.y)&&Object.keys(s.pendingServe).length===2&&Object.keys(s.pendingServe.aim).length===2))bad('서브 정보가 맞지 않는다.');
  if(typeof s.message!=='string'||s.message.length>80)bad('경기 안내 정보가 맞지 않는다.');
  // Only the fields a match owns are taken over; anything else in the file is ignored.
  const m=new Match(c,s.seed),copy=JSON.parse(JSON.stringify(s));
  m.config.opponent=s.people[1].id; // older saves carry no opponent field and always faced 슈슈
  for(const k of Object.keys(m))if(!['level','court','config','events','paused','winner'].includes(k)&&Object.prototype.hasOwnProperty.call(copy,k))m[k]=copy[k];
  // Older v1 saves used one armed slot and numeric duration/charges; migrate to rally effects.
  if(s.pendingSkills===undefined){
   if(['comet','wind'].includes(m.armed)){m.effects[m.armed]=true;m.armed=null;}
   else if(m.armed)m.pendingSkills[m.armed]=true;
   if(m.effects.long)m.effects.long=true;if(m.effects.fall)m.effects.fall=true;
   if(m.ball?.slow)m.effects.slow=true;
  }
  return m;
 }
 action(key,aim={}){
  if(key==='pause'){if(this.phase!=='match')this.paused=!this.paused;return;}
  if(this.paused)return;
  if(key==='skill1'||key==='skill2')return this.skill(key==='skill1'?0:1);
  if(key==='drive'||key==='lob'){
   if(this.phase==='ready'&&this.server===0){if(key==='drive')this.toss();}
   else if(this.phase==='toss'&&this.server===0)this.serve(key,aim);
   else if(this.phase==='rally')this.stroke(0,key,aim);
  }
 }
}
const api={Match,PLAYERS,COURTS,LEVELS,SKILL_KINDS,LONG_REACH,BREAK_TIME,FLOOD_MOVE,WHEEL_TICKS,WHEEL_MISS,WHEEL_SKID,HEARTS,HEART_SPREAD,TIPSY_WALK,TIPSY_REACH,heartOffset,parse,G,NET,W,L,DT,clamp};
if(typeof module==='object'&&module.exports)module.exports=api;else root.Te=api;
})(typeof window!=='undefined'?window:globalThis);

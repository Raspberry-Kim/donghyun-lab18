/* 동현테: fixed-step, world-space XYZ tennis. Original implementation, no ROM code. */
(function(root){
'use strict';
const PLAYERS=[
 {name:'동현',atk:100,def:100,mov:100,color:'#b95648',skills:[['샤아아즈나블',3,'다음 리턴이 불꽃 스트로크. 유효한 공이면 상대를 벽으로 날려 포인트.'],['샤아자쿠',2,'다음 타격 입력 때 공으로 혜성 이동하여 리턴.']]},
 {name:'뭉치',atk:90,def:90,mov:90,color:'#aa6454',skills:[['오겡끼데스까',6,'경기를 끝내고 즉시 승리한다.'],['액슬로즈',1,'라켓을 부수고 경기를 끝낸다. 본인 패배.']]},
 {name:'뚱띠',atk:120,def:80,mov:110,color:'#aa7041',skills:[['사세보후우샤',2,'다음 리턴을 바람에 실어 네트 바로 앞에 떨어뜨린다.'],['와루이지와나',2,'지금 넘어오는 상대 공의 시간이 느려진다. 리턴하면 해제.']]},
 {name:'또치',atk:90,def:90,mov:120,color:'#458878',skills:[['구마몬기쥬츠',3,'다음 리턴을 상대 반대편에 툭 떨어뜨려 포인트.'],['컴온스펜서',2,'상대가 이번 랠리 동안 공 반대편으로 춤추며 간다.']]},
 {name:'포동이',atk:80,def:80,mov:130,color:'#d5bb82',skills:[['멍멍',2,'상대가 다음 리턴을 헛스윙한다.'],['아잉뿌잉',2,'상대가 귀여움에 4초간 쓰러진다.']]},
 {name:'꽥꽥',atk:80,def:90,mov:90,color:'#d6a54c',skills:[['비밀이야',3,'다음 리턴이 유효하게 바운드하면 사라지고 내 포인트.'],['알려고하지마',3,'다음 서브가 서비스 박스에 들어가면 사라지고 내 포인트.']]},
 {name:'슈슈',atk:90,def:100,mov:80,color:'#88aa68',skills:[['울트라롱팔',2,'이번 랠리는 길어진 팔로 내 코트의 공에 닿는다. 타격 입력은 필요.'],['리만가설',1,'이번 랠리 동안 다음 바운드 위치를 표시한다.']]}
];
const COURTS=[
 {name:'윔블던',surface:'잔디',bounce:.56,retain:.94,ground:'#6f9274',outer:'#355d51',line:'#f2edd4',accent:'#beb08b',desc:'낮고 빠르게 미끄러지는 공'},
 {name:'호주',surface:'하드',bounce:.73,retain:.85,ground:'#4f8ba3',outer:'#274e68',line:'#eaf0e7',accent:'#dfa77d',desc:'안정적인 중간 높이의 반발'},
 {name:'US',surface:'하드',bounce:.69,retain:.90,ground:'#436d91',outer:'#507b68',line:'#eeeadd',accent:'#b6c2a1',desc:'호주보다 낮고 빠른 하드 코트'},
 {name:'프랑스',surface:'클레이',bounce:.83,retain:.72,ground:'#b7795b',outer:'#405f55',line:'#f2dfc9',accent:'#d3b594',desc:'속도는 줄고 높이 튀는 공'}
];
const LEVELS=[{name:'초보',speed:.88,react:.24,error:.65},{name:'통상',speed:1,react:.14,error:.32},{name:'프로',speed:1.13,react:.07,error:.13}];
const G=13,NET=.92,W=4.115,L=11.885,DT=1/120;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function parse(out){
 const t=String(out).trim().split(/\s+/).filter(Boolean).map(Number);
 if(t.length!==3)throw Error('선수 · 난이도 · 경기장, 정수 세 개를 차례로 출력하자.');
 t.forEach((v,i)=>{if(!Number.isInteger(v)||v<1||v>[7,3,4][i])throw Error(['선수는 1–7','난이도는 1–3','경기장은 1–4'][i]+'만 된다.');});
 return {player:t[0]-1,level:t[1]-1,court:t[2]-1};
}
class Match{
 constructor(config={player:0,level:0,court:0},seed=20261111){
  this.config={...config};this.seed=seed>>>0;this.time=0;this.tick=0;this.level=LEVELS[config.level];this.court=COURTS[config.court];
  this.people=[{id:config.player,x:1.5,y:12.3,side:1,swing:0,cool:0,pose:'idle'},{id:6,x:-1.5,y:-11,side:-1,swing:0,cool:0,pose:'idle'}];
  this.points=[0,0];this.games=[0,0];this.sets=[0,0];this.history=[];this.server=0;this.totalGames=0;this.tb=false;this.tbFirst=0;
  this.energy=2;this.returns=0;this.rally=0;this.totalHits=0;this.events=[];this.phase='ready';this.paused=false;this.winner=null;this.faults=0;
  this.message='X 토스';this.armed=null;this.effects={};this.fx=null;this.ball=null;this.timer=0;this.aiClock=0;this.aiTarget={x:0,y:-10};
  this.setupPoint();
 }
 rand(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
 event(type,text){this.events.push({type,text});if(this.events.length>30)this.events.shift();}
 score(){if(this.tb)return this.points.map(String);if(this.points[0]>=3&&this.points[1]>=3)return this.points[0]===this.points[1]?['40','40']:this.points[0]>this.points[1]?['AD','40']:['40','AD'];return this.points.map(p=>['0','15','30','40'][p]||'40');}
 setupPoint(){
  this.phase='ready';this.timer=0;this.ball=null;this.pendingServe=null;this.armed=null;this.effects={};this.fx=null;this.rally=0;
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
 finish(w,why){this.phase='match';this.winner=w;this.message=why+' · '+(w===0?'승리':'패배');this.ball=null;this.event('match',this.message);}
 point(w,why){
  if(['point','match'].includes(this.phase))return;
  this.points[w]++;this.energy=clamp(this.energy+1,0,6);this.message=why+' · '+(w===0?'내':'상대')+' 포인트';this.event('point',this.message);
  this.faults=0;this.phase='point';this.timer=1.7;this.ball=null;this.armed=null;this.effects={};
  const endSet=this.tb?(this.points[w]>=7&&this.points[w]-this.points[1-w]>=2):false;
  if(this.tb){
   const n=this.points[0]+this.points[1];
   if(n%6===0)this.swapEnds();
   this.server=(this.tbFirst+(Math.floor((n+1)/2)%2))%2;
   if(endSet){this.games[w]++;this.totalGames++;if(n%6!==0)this.swapEnds();this.server=1-this.tbFirst;this.winSet(w);}
  }else if(this.points[w]>=4&&this.points[w]-this.points[1-w]>=2){
   this.games[w]++;this.points=[0,0];this.totalGames++;this.server=1-this.server;
   this.message='게임 · '+(w===0?'나':'동현AI™');this.event('game',this.message);
   if(this.totalGames%2===1)this.swapEnds();
   if(this.games[w]>=6&&this.games[w]-this.games[1-w]>=2)this.winSet(w);
   else if(this.games[0]===6&&this.games[1]===6){this.tb=true;this.tbFirst=this.server;this.message='타이브레이크 · 7점, 두 점 차';}
  }
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
  this.phase='rally';this.event('hit',kind);this.totalHits++;this.aiClock=0;
 }
 reachable(i,remote=false){
  const b=this.ball,p=this.people[i];if(this.phase!=='rally'||!b||b.by===i||!b.crossed||b.y*p.side<.35||b.z>3.8||b.z<.08)return false;
  if(b.serve&&b.bounces===0)return false;
  if(i===1&&['fire','drop','vanish'].includes(b.power))return false;
  return remote||Math.hypot(b.x-p.x,(b.y-p.y)*.85)<(1.13*PLAYERS[p.id].def/100+.20);
 }
 stroke(i,kind='drive',aim={}){
  const p=this.people[i];if(p.cool>0)return false;
  p.swing=.19;p.cool=.30;p.pose='swing';p.kind=kind;p.aim={...aim};
  const hand=this.ball&&this.ball.x<p.x? -1:1;this.animate(i,kind==='lob'?'lobWindup':'windup',.3,hand);
  if(i===0&&this.armed==='comet'&&this.reachable(0,true)){
   this.fx={type:'comet',x:p.x,y:p.y,toX:this.ball.x,toY:this.ball.y,ttl:.7};
   p.x=this.ball.x;p.y=this.ball.y+.25*p.side;this.armed=null;
  }
  return this.tryHit(i);
 }
 tryHit(i){
  const p=this.people[i],b=this.ball,remote=i===0&&this.effects.long;
  if(p.swing<=0||!this.reachable(i,remote))return false;
  if(i===1&&this.effects.miss){this.effects.miss=false;this.effects.whiff=1.4;p.swing=0;p.pose='whiff';this.event('skill','헛스윙!');return false;}
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
  const oldArm=i===0?this.armed:null;
  if(oldArm==='wind'||oldArm==='drop'){ty=-p.side*1.7;tx=oldArm==='drop'?(this.people[1].x>=0?-3.5:3.5):clamp(tx,-3.4,3.4);t=Math.max(1.05,Math.abs(b.y-ty)/10);}
  this.launch(i,tx,ty,t,isSmash?'smash':isVolley?(kind==='lob'?'softVolley':'volley'):kind);
  this.ball.power=oldArm;this.ball.slow=false;
  if(oldArm&&oldArm!=='serveVanish'){this.armed=null;this.fx={type:oldArm,x:p.x,y:p.y,ttl:1.1};}
  p.swing=0;p.pose=isSmash?'smash':isVolley?'volley':'swing';p.cool=.24;
  this.animate(i,isSmash?'smash':isVolley?(kind==='lob'?'softVolley':'volley'):kind==='lob'?'lob':hitHand<0?'backhand':'forehand',isSmash?.40:kind==='lob'?.46:.34,hitHand,hitHeight);
  this.rally++;if(i===0){this.returns++;if(this.returns%4===0){this.energy=clamp(this.energy+1,0,6);this.event('charge','리턴 4회 · 기술 +1');}}
  this.message=isSmash?'스매시':isVolley?(kind==='lob'?'약한 발리':'강한 발리'):kind==='lob'?'로브 · 높게 띄워 치기':'스트로크 · 가로로 밀어 치기';return true;
 }
 skill(slot){
  if(this.paused||['point','fault','match'].includes(this.phase))return {ok:false,why:'공이 살아 있을 때 쓰자.'};
  const id=this.people[0].id,sk=PLAYERS[id].skills[slot];if(!sk)return {ok:false,why:'없는 기술'};
  if(this.energy<sk[1])return {ok:false,why:`기술 에너지 ${sk[1]}칸이 필요하다.`};
  let kind=[['fire','comet'],['win','lose'],['wind','slow'],['drop','dance'],['miss','fall'],['vanish','serveVanish'],['long','predict']][id][slot];
  const arm=['fire','comet','wind','drop','vanish','serveVanish'].includes(kind);
  if(arm&&this.armed)return {ok:false,why:'이미 준비한 기술이 있다.'};
  if(kind==='serveVanish'&&!(this.server===0&&['ready','toss'].includes(this.phase)))return {ok:false,why:'내 서브 토스 전후에 준비하자.'};
  if(kind==='slow'&&!(this.phase==='rally'&&this.ball.by===1))return {ok:false,why:'상대가 친 공이 있을 때 쓰자.'};
  if(['dance','miss','fall','long','predict'].includes(kind)&&this.effects[kind])return {ok:false,why:'아직 효과가 남아 있다.'};
  if(kind==='slow'&&this.ball.slow)return {ok:false,why:'이미 느려진 공이다.'};
  this.energy-=sk[1];this.event('skill',sk[0]);this.message=sk[0];
  if(arm)this.armed=kind;
  else if(kind==='win'||kind==='lose'){this.fx={type:kind,ttl:3};this.finish(kind==='win'?0:1,sk[0]);}
  else if(kind==='slow')this.ball.slow=true;
  else this.effects[kind]=kind==='fall'?4:true;
  return {ok:true,why:sk[0]};
 }
 predict(){
  const b=this.ball;if(!b||this.phase!=='rally')return null;
  const t=(b.vz+Math.sqrt(b.vz*b.vz+2*G*b.z))/G;
  return {x:b.x+b.vx*t,y:b.y+b.vy*t,t};
 }
 move(i,dx,dy,dt){
  const p=this.people[i],sp=4.9*PLAYERS[p.id].mov/100*this.level.speed*(i?1.06:1),len=Math.hypot(dx,dy)||1,ox=p.x,oy=p.y;
  if(len>1){dx/=len;dy/=len;}p.x=clamp(p.x+dx*sp*dt,-6.3,6.3);p.y=clamp(p.y+dy*sp*dt,p.side===1?.8:-14.2,p.side===1?14.2:-.8);
  const distance=Math.hypot(p.x-ox,p.y-oy);p.walk=distance>1e-6;
  if(p.walk){p.gait=(p.gait||0)+distance*2.2;p.moveX=Math.sign(dx);p.moveY=Math.sign(dy);}
  if(p.cool<=0&&!p.anim)p.pose=p.walk?'run':'idle';
 }
 ai(dt){
  const p=this.people[1],b=this.ball;
  if(this.effects.fall>0){p.pose='fall';return;}
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
   }else this.aiTarget={x:0,y:p.side*9.5};
  }
  const target=this.aiTarget;
  if(this.effects.dance){this.move(1,-Math.sign(b.x-p.x),Math.sin(this.time*8)*.55,dt);p.pose='dance';return;}
  this.move(1,clamp((target.x-p.x)*3,-1,1),clamp((target.y-p.y)*3,-1,1),dt);
  if(this.reachable(1)&&p.cool<=0)this.stroke(1,this.rand()<.14?'lob':'drive');
 }
 step(dt,input={}){
  if(this.paused)return;
  this.time+=dt;this.tick++;
  if(this.fx){this.fx.ttl-=dt;if(this.fx.ttl<=0)this.fx=null;}
  for(const k of ['fall','whiff'])if(this.effects[k]>0)this.effects[k]-=dt;
  for(const p of this.people){p.cool=Math.max(0,p.cool-dt);p.swing=Math.max(0,p.swing-dt);if(p.anim){p.anim.time+=dt;if(p.anim.time>=p.anim.duration){p.anim=null;if(!['fall','dance','whiff'].includes(p.pose))p.pose=p.walk?'run':'idle';}}}
  if(this.phase==='match')return;
  if(this.phase==='point'||this.phase==='fault'){this.timer-=dt;if(this.timer<=0)this.setupPoint();return;}
  const p=this.people[0];
  if(this.phase==='ready'&&this.server===0){
   const oldY=p.y;this.move(0,input.x||0,0,dt);p.y=oldY;
   const sign=((this.points[0]+this.points[1])%2?-1:1)*p.side;p.x=sign*clamp(Math.abs(p.x),.5,3.8);
  }else if(!(this.phase==='toss'&&this.server===0)&&!(this.ball?.serveControl?.remaining>0))this.move(0,input.x||0,input.y||0,dt);
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
   }
   if(tb<=step+1e-8){
    b.z=.001;b.bounces++;this.event('bounce','바운드');
    if(b.bounces===1){
     const legal=Math.abs(b.x)<=W+.035&&Math.abs(b.y)<=L+.035&&b.y*this.people[b.by].side<0;
     if(b.serve){
      const box=legal&&Math.abs(b.y)<=6.4+.035&&b.x*(b.serviceOriginX??this.people[b.by].x)<=0;
      if(!box){this.fault('서비스 아웃');return;}
      if(b.netTouch){this.phase='fault';this.timer=1.0;this.ball=null;this.message='렛 · 같은 서브 다시';this.event('let',this.message);return;}
      if(b.by===0&&this.armed==='serveVanish'){this.fx={type:'vanish',x:b.x,y:b.y,ttl:1.5};this.point(0,'알려고하지마');return;}
     }else if(!legal){this.point(1-b.by,'아웃');return;}
     if(b.by===0&&['fire','drop','vanish'].includes(b.power)){
      this.fx={type:b.power==='fire'?'wall':b.power,x:b.x,y:b.y,ttl:1.6};this.point(0,b.power==='fire'?'샤아아즈나블':b.power==='drop'?'구마몬기쥬츠':'비밀이야');return;
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
const api={Match,PLAYERS,COURTS,LEVELS,parse,G,NET,W,L,DT,clamp};
if(typeof module==='object'&&module.exports)module.exports=api;else root.Te=api;
})(typeof window!=='undefined'?window:globalThis);

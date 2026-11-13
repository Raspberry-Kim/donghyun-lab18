// 이삐·빽빽의 네 기술 규칙 검사. 실제 엔진만 쓴다.
const assert=require('assert/strict'),E=require('../src/engine');
let pass=0;const test=(n,f)=>{f();pass++;console.log('ok',n);};
// 작은 시드는 xorshift 첫 값이 0에 붙으므로 섞어서 쓴다.
const mix=s=>(Math.imul(s,2654435761)>>>0)||1;
const fresh=(p,l=1,c=0,seed=123)=>new E.Match({player:p,level:l,court:c},mix(seed));
const step=(m,n,input={})=>{for(let i=0;i<n;i++)m.step(E.DT,input);};
const rally=(m,o={})=>{m.phase='rally';m.people[0].x=0;m.people[0].y=8;m.people[0].cool=0;m.people[0].swing=0;m.ball={x:0,y:8,z:1,vx:0,vy:3,vz:0,by:1,bounces:1,serve:false,crossed:true,age:0,flightTime:1,...o};return m;};
const hit=m=>{rally(m);m.action('drive',{x:0,y:0});let n=0;while(m.ball&&m.ball.by!==0&&m.phase==='rally'&&n++<60)m.step(E.DT);assert.ok(m.ball&&m.ball.by===0,'my hit left the racket');return m;};
const IPPI=7,PPAEK=8;

test('능력치·기술 이름·설정 번호 8·9',()=>{
 const a=E.PLAYERS[IPPI],b=E.PLAYERS[PPAEK];
 assert.deepEqual([a.name,a.atk,a.def,a.mov],['이삐',70,90,100]);assert.deepEqual([b.name,b.atk,b.def,b.mov],['빽빽',90,100,110]);
 assert.deepEqual(a.skills.map(s=>s[0]),['양재천범람','브롬톤앞바퀴']);assert.deepEqual(b.skills.map(s=>s[0]),['오마이갓','백미취사완료']);
 assert.deepEqual(E.SKILL_KINDS[IPPI],['flood','wheel']);assert.deepEqual(E.SKILL_KINDS[PPAEK],['hearts','drunk']);
 for(const sk of [...a.skills,...b.skills])assert.equal(sk[1],1);
 assert.deepEqual([E.FLOOD_MOVE,E.WHEEL_TICKS,E.WHEEL_MISS,E.WHEEL_SKID,E.HEARTS,E.HEART_SPREAD,E.TIPSY_WALK,E.TIPSY_REACH],[.1,24,.2,1.5,5,1.5,.45,.5]);
});
test('양재천범람: 내 공이 네트를 넘을 때 상대가 잠기고 이동이 정확히 10%가 된다',()=>{
 const m=fresh(IPPI);assert.ok(m.skill(0).ok);assert.equal(m.effects.flood,true);assert.equal(m.energy,5);
 hit(m);assert.equal(m.ball.flood,true);assert.ok(!m.effects.soaked,'not before the net');
 let n=0;while(!m.effects.soaked&&m.phase==='rally'&&n++<400)m.step(E.DT);
 assert.equal(m.effects.soaked,true);assert.ok(m.ball.crossed);assert.equal(m.fx.type,'flood');assert.equal(m.fx.end,true);assert.equal(m.skillCue.kind,'flood');
 const dry=fresh(IPPI),p=m.people[1],q=dry.people[1];p.x=q.x=0;p.y=q.y=-8;
 m.move(1,1,0,E.DT);dry.move(1,1,0,E.DT);assert.ok(Math.abs(p.x/q.x-E.FLOOD_MOVE)<1e-9,p.x/q.x);
 const me=m.people[0],x0=me.x;m.move(0,1,0,E.DT);dry.people[0].x=x0;dry.move(0,1,0,E.DT);assert.equal(me.x,dry.people[0].x,'my own speed unchanged');
});
test('양재천범람: 상대 공에는 붙지 않고, 포인트가 끝나면 풀리며 폴트에서는 남는다',()=>{
 const m=fresh(IPPI);m.skill(0);rally(m);assert.ok(!m.ball.flood);
 m.effects.soaked=true;m.fault();assert.equal(m.effects.flood,true);assert.equal(m.effects.soaked,true);
 m.point(0,'t');assert.deepEqual(m.effects,{});
});
test('브롬톤앞바퀴: 닿지 않는 공으로 24걸음 굴러가 친다',()=>{
 let done=0;
 for(let seed=1;seed<400&&done<12;seed++){
  const m=fresh(IPPI,1,0,seed);m.skill(1);rally(m,{x:3.5,y:9,vx:0,vy:.5});
  const willMiss=(()=>{const c=E.Match.restore(m.snapshot());return c.rand()<E.WHEEL_MISS;})();
  if(willMiss)continue;
  const from={...m.people[0]};m.action('drive',{x:0,y:0});
  assert.ok(m.wheel,'ride started');assert.equal(m.wheel.n,E.WHEEL_TICKS);assert.equal(m.wheel.miss,false);assert.equal(m.fx.type,'wheel');assert.equal(m.skillCue.kind,'wheel');
  assert.equal(m.people[0].x,from.x,'no instant jump (unlike 샤아자쿠)');
  step(m,12,{x:-1,y:1});assert.ok(m.wheel&&m.wheel.n===12);const mid=m.people[0].x;assert.ok(mid>from.x+1&&mid<m.ball.x-.5,'half way '+mid);
  m.action('drive',{x:0,y:0});assert.equal(m.wheel.n,12,'extra strokes ignored');
  step(m,12);assert.equal(m.wheel,null);assert.ok(Math.abs(m.people[0].x-m.ball.x)<.2||m.ball.by===0,'arrived');
  let n=0;while(m.ball&&m.ball.by!==0&&m.phase==='rally'&&n++<60)m.step(E.DT);
  assert.ok(m.ball&&m.ball.by===0,'returned after the ride (seed '+seed+')');done++;
 }
 assert.equal(done,12);
});
test('브롬톤앞바퀴: 놓칠 때는 공 옆 1.5 m에 서고 공을 치지 못한다',()=>{
 let done=0;
 for(let seed=1;seed<600&&done<8;seed++){
  const m=fresh(IPPI,1,0,seed);m.skill(1);rally(m,{x:3.5,y:9,vx:0,vy:0,vz:0});
  const c=E.Match.restore(m.snapshot());if(!(c.rand()<E.WHEEL_MISS))continue;
  m.action('drive',{x:0,y:0});assert.equal(m.wheel.miss,true);assert.equal(Math.abs(m.wheel.off),E.WHEEL_SKID);
  step(m,E.WHEEL_TICKS);assert.equal(m.wheel,null);assert.equal(m.fx.type,'wheelMiss');assert.ok(m.message.includes('놓쳤다'));
  assert.ok(Math.abs(Math.abs(m.people[0].x-m.ball.x)-E.WHEEL_SKID)<.05,'skid distance '+(m.people[0].x-m.ball.x));
  assert.equal(m.ball.by,1,'ball untouched');assert.ok(m.people[0].cool>0);done++;
 }
 assert.equal(done,8);
});
test('브롬톤앞바퀴: 놓칠 비율은 20% 안팎, 닿는 공은 그냥 친다',()=>{
 let miss=0,total=2000;
 for(let seed=1;seed<=total;seed++){const m=fresh(IPPI,1,0,seed*7+1);m.skill(1);rally(m,{x:3.5,y:9,vx:0,vy:0});m.action('drive',{x:0,y:0});assert.ok(m.wheel);if(m.wheel.miss)miss++;}
 assert.ok(miss/total>.16&&miss/total<.24,'miss rate '+miss/total);
 const m=fresh(IPPI);m.skill(1);rally(m);m.action('drive',{x:0,y:0});assert.equal(m.wheel,null,'no ride when the ball is within reach');
 let n=0;while(m.ball.by!==0&&n++<60)m.step(E.DT);assert.equal(m.ball.by,0);
 console.log('   miss rate',(miss/total).toFixed(3));
});
test('오마이갓: 칠 때마다 다섯 하트 · 상대가 가짜를 고르면 받지 못한다',()=>{
 let real=0,fake=0,returned=0,points=0,swungFake=0;const N=400;
 for(let seed=1;seed<=N;seed++){
  const m=fresh(PPAEK,1,0,seed*13+5);m.skill(0);assert.equal(m.effects.hearts,true);hit(m);
  const h=m.ball.hearts;assert.ok(h&&Number.isInteger(h.real)&&h.real>=0&&h.real<5&&Number.isInteger(h.pick)&&h.pick>=0&&h.pick<5&&h.swung===false);
  assert.equal(m.fx.type,'hearts');assert.equal(m.skillCue.kind,'hearts');
  const same=h.real===h.pick;same?real++:fake++;
  const ball=m.ball;let n=0;while(m.phase==='rally'&&m.ball===ball&&n++<1200)m.step(E.DT);
  if(m.phase==='rally'&&m.ball.by===1){returned++;assert.ok(same,'only the real heart can be returned (seed '+seed+')');assert.ok(!m.ball.hearts,'the opponent’s ball is an ordinary ball');}
  else{points++;if(!same&&ball.hearts.swung)swungFake++;}
 }
 assert.ok(real/N>.13&&real/N<.27,'real pick rate '+real/N);assert.ok(returned>0&&returned<=real);assert.ok(swungFake>fake*.5,'most fakes are swung at: '+swungFake+'/'+fake);
 console.log('   picked real',real,'/',N,'· returned',returned,'· empty swings at a fake',swungFake);
});
test('오마이갓: 하트는 첫 착지까지 1.5 m 간격으로 벌어진다',()=>{
 const b={hearts:{real:2,pick:0,swung:false},age:0,flightTime:1};
 assert.deepEqual([0,1,2,3,4].map(j=>E.heartOffset(b,j)),[-0,-0,0,0,0]);
 b.age=.5;assert.deepEqual([0,1,2,3,4].map(j=>E.heartOffset(b,j)),[-1.5,-.75,0,.75,1.5]);
 b.age=3;assert.deepEqual([0,1,2,3,4].map(j=>E.heartOffset(b,j)),[-3,-1.5,0,1.5,3]);
 assert.equal(E.heartOffset({age:1,flightTime:1},3),0);
});
test('백미취사완료: 내 타격부터 상대가 느리게 네트로 걸어오고 닿는 거리가 절반이 된다',()=>{
 const m=fresh(PPAEK);m.skill(1);assert.equal(m.effects.drunk,true);assert.ok(!m.effects.tipsy);
 const sober=m.reach(1);hit(m);assert.equal(m.effects.tipsy,true);assert.equal(m.fx.type,'drunk');assert.equal(m.skillCue.kind,'drunk');
 assert.ok(Math.abs(m.reach(1)/sober-E.TIPSY_REACH)<1e-12);assert.equal(m.reach(0),fresh(PPAEK).reach(0));
 const p=m.people[1];p.y=-10;p.x=0;m.ball={...m.ball,x:5,y:0,vx:0,vy:-.01,vz:0,z:3.5}; // keep a ball in the air
 let maxStep=0,poses=new Set();
 for(let i=0;i<120*6&&m.phase==='rally';i++){const ox=p.x,oy=p.y;m.ball.z=3.5;m.ball.vz=0;m.ball.y=0.2;m.ai(E.DT);maxStep=Math.max(maxStep,Math.hypot(p.x-ox,p.y-oy));poses.add(p.pose);}
 const full=4.9*E.PLAYERS[p.id].mov/100*1.06*E.DT;
 assert.ok(maxStep<=full*Math.SQRT2*E.TIPSY_WALK+1e-9,'slow walk '+maxStep/full);
 assert.ok(Math.abs(p.y-(-1.5))<.3,'arrived at the net: y='+p.y);assert.ok(poses.has('drunk'));
 m.point(0,'t');assert.deepEqual(m.effects,{});assert.notEqual(p.pose,'drunk');
});
test('저장: 타는 중·하트 공·젖은 상대를 그대로 이어 간다',()=>{
 const cases=[
  ()=>{const m=fresh(IPPI,1,0,3);m.skill(0);m.skill(1);rally(m,{x:3.5,y:9,vx:0,vy:.5});m.action('drive',{x:0,y:0});step(m,7);assert.ok(m.wheel);return m;},
  ()=>{const m=fresh(PPAEK,2,1,9);m.skill(0);m.skill(1);hit(m);step(m,20);assert.ok(m.ball.hearts&&m.effects.tipsy);return m;},
  ()=>{const m=fresh(IPPI,0,3,11);m.skill(0);hit(m);let n=0;while(!m.effects.soaked&&n++<400)m.step(E.DT);assert.ok(m.effects.soaked);return m;}
 ];
 for(const make of cases){
  const a=make(),b=E.Match.restore(JSON.parse(JSON.stringify(a.snapshot())));
  for(let i=0;i<120*8;i++){const input={x:(i>>5)%3-1,y:(i>>6)%3-1};if(i%37===0){a.action('drive',{x:0,y:0});b.action('drive',{x:0,y:0});}a.step(E.DT,input);b.step(E.DT,input);}
  assert.deepEqual(b.snapshot(),a.snapshot());
 }
});
test('저장: 맞지 않는 기술 정보는 거절하고 예전 저장은 받는다',()=>{
 const base=()=>{const m=fresh(IPPI,1,0,3);m.skill(1);rally(m,{x:3.5,y:9,vx:0,vy:.5});m.action('drive',{x:0,y:0});step(m,3);return m.snapshot();};
 assert.ok(E.Match.restore(base()));
 const bad=[s=>{s.wheel.n=0;},s=>{s.wheel.n=25;},s=>{s.wheel.n=1.5;},s=>{s.wheel.off=.7;},s=>{s.wheel.miss='yes';},s=>{s.wheel.extra=1;},s=>{s.phase='ready';},s=>{s.config.player=0;s.people[0].id=0;},
  s=>{s.ball.hearts={real:5,pick:0,swung:false};},s=>{s.ball.hearts={real:0,pick:-1,swung:false};},s=>{s.ball.hearts={real:0,pick:0};},s=>{s.ball.flood='yes';},s=>{s.effects.soaked=1;},s=>{s.effects.tipsy=.5;},s=>{s.fx={type:'tsunami',ttl:1,duration:1};}];
 bad.forEach((f,i)=>{const s=base();f(s);assert.throws(()=>E.Match.restore(s),undefined,'case '+i);});
 const old=fresh(0,1,0,5).snapshot();delete old.wheel;assert.ok(E.Match.restore(old));assert.equal(E.Match.restore(old).wheel,null);
});
test('상대로도 나오고, 상대 동현AI™는 새 기술을 쓰지 않는다',()=>{
 const seen=new Set();for(let seed=1;seed<300;seed++){const m=fresh(0,1,0,seed);seen.add(m.people[1].id);assert.notEqual(m.people[1].id,0);}
 assert.ok(seen.has(IPPI)&&seen.has(PPAEK),[...seen].join());
 for(const opp of [IPPI,PPAEK]){
  let m=null;for(let seed=1;seed<500&&!m;seed++){const c=fresh(0,1,0,seed);if(c.people[1].id===opp)m=c;}
  for(let i=0;i<120*40&&m.phase!=='match';i++){if(m.phase==='ready'&&m.server===0)m.action('drive');else if(m.phase==='toss'&&m.server===0&&m.ball.vz<0&&m.ball.z<2.3)m.action('drive',{x:0,y:0});m.step(E.DT);
   assert.deepEqual(Object.keys(m.effects),[]);assert.equal(m.wheel,null);assert.ok(!m.ball||(!m.ball.hearts&&!m.ball.flood));}
 }
});
test('네 기술 무작위 사용 60분: 값이 유한하고 포인트마다 비워진다',()=>{
 let points=0,uses=0;
 for(const p of [IPPI,PPAEK])for(let level=0;level<3;level++){
  let m=fresh(p,level,(p+level)%4,500+p*10+level),k=p*17+level+3;const rnd=()=>{k=(k*1103515245+12345)&0x7fffffff;return k/0x7fffffff;};
  for(let i=0;i<120*60*10;i++){
   if(m.phase==='match')m=fresh(p,level,(p+level)%4,900+i);
   const b=m.ball,q=m.people[0];let input={x:0,y:0};
   if(rnd()<.006){if(rnd()<.5)m.energy=6;if(m.skill(rnd()<.5?0:1).ok)uses++;}
   if(m.phase==='ready'&&m.server===0)m.action('drive');
   else if(m.phase==='toss'&&m.server===0&&b.vz<0&&b.z<2.3)m.action(rnd()<.2?'lob':'drive',{x:rnd()*2-1,y:0});
   else if(m.phase==='rally'){if(b.by===1)input={x:Math.sign(b.x-q.x),y:Math.sign(b.y-q.y)};if(rnd()<.2)m.action(rnd()<.15?'lob':'drive',{x:Math.round(rnd()*2-1),y:Math.round(rnd()*2-1)});}
   const before=m.phase;m.step(E.DT,input);
   for(const o of m.people)assert.ok(Number.isFinite(o.x)&&Number.isFinite(o.y)&&Math.abs(o.x)<=6.3+1e-9&&Math.abs(o.y)<=14.2+1e-9&&o.y*o.side>=.8-1e-9,'player in own half');
   if(m.ball)for(const key of ['x','y','z','vx','vy','vz'])assert.ok(Number.isFinite(m.ball[key]));
   if(m.wheel)assert.ok(m.phase==='rally'&&m.wheel.n>=1&&m.wheel.n<=E.WHEEL_TICKS);
   if(m.phase!=='rally')assert.equal(m.wheel,null);
   if(m.phase==='point'&&before!=='point'){points++;assert.deepEqual(m.effects,{});assert.notEqual(m.people[1].pose,'drunk');}
   if(i%1777===0)assert.deepEqual(E.Match.restore(m.snapshot()).snapshot(),m.snapshot());
  }
 }
 assert.ok(points>300&&uses>600,points+' '+uses);console.log('   points',points,'skill uses',uses);
});
console.log(`${pass} new-skill checks passed`);

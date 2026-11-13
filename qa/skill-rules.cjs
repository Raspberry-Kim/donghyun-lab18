// v0.05 기술 수명·액슬로즈·저장 규칙 검사. 실제 엔진만 쓴다.
const assert=require('assert/strict'),E=require('../src/engine');
let pass=0;const test=(n,f)=>{f();pass++;console.log('ok',n);};
const fresh=(p=0,l=0,c=0,seed=123)=>new E.Match({player:p,level:l,court:c},seed);
const step=(m,n,input={})=>{for(let i=0;i<n;i++)m.step(E.DT,input);};
const rally=(m,o={})=>{m.phase='rally';m.ball={x:0,y:8,z:1,vx:0,vy:3,vz:0,by:1,bounces:1,serve:false,crossed:true,age:0,flightTime:1,...o};m.people[0].x=0;m.people[0].y=8;m.people[0].cool=0;return m;};

test('울트라롱팔: 세 번 이후도 유지되며 포인트 끝에 풀린다 (세 난이도)',()=>{
 for(const level of [0,1,2]){
  const m=fresh(6,level,0,777);m.energy=6;m.server=1;m.setupPoint();assert.equal(m.skill(0).ok,true);assert.equal(m.effects.long,true);
  let longHits=0,released=false,ended=false;
  for(let i=0;i<120*60;i++){
   if(m.phase==='rally')m.action('drive',{});
   m.step(E.DT,{});
   for(const ev of m.events.splice(0)){if(ev.type==='long')longHits++;if(ev.type==='release')released=true;}
   if(m.points[0]+m.points[1]>0){ended=true;break;}
  }
  assert.ok(longHits>0,'level '+level);assert.equal(released,false);
  if(!ended)m.point(0,'검사 종료');
  assert.deepEqual(m.effects,{});
 }
});
test('울트라롱팔: 닿는 공은 긴 팔을 쓰지 않는다',()=>{
 const m=rally(fresh(6));m.energy=6;m.skill(0);assert.equal(m.stroke(0),true);assert.equal(m.effects.long,true);
 const far=rally(fresh(6),{x:-3});far.people[0].x=3;far.energy=6;far.skill(0);assert.equal(far.stroke(0),true);assert.equal(far.effects.long,true);assert.equal(far.fx.type,'long');
});
test('아잉뿌잉: 4초 뒤에도 유지하고 포인트 끝에 상대가 일어난다',()=>{
 const m=fresh(4);m.energy=6;m.skill(1);step(m,120*4+2);
 assert.equal(m.effects.fall,true);assert.equal(m.people[1].pose,'idle');assert.equal(m.phase,'ready');m.point(0,'끝');m.setupPoint();
 assert.equal(m.skill(1).ok,true,'다시 쓸 수 있어야 한다');
});
test('멍멍 헛스윙 타이머도 음수로 남지 않는다',()=>{
 const m=rally(fresh(4),{by:0,y:-8,vy:0,z:1.2});m.people[1].x=0;m.people[1].y=-8;m.energy=6;m.skill(0);m.stroke(1);assert.ok(m.effects.whiff>0);
 m.phase='ready';m.ball=null;m.server=0;step(m,200);assert.equal('whiff' in m.effects,false);assert.equal(m.people[1].pose,'idle');
});
test('폴트·렛 뒤에도 준비한 기술과 랠리 효과가 남는다',()=>{
 const a=fresh(5);a.energy=6;a.skill(1);a.fault('서비스 아웃');step(a,200);assert.equal(a.phase,'ready');assert.equal(a.armed,'serveVanish');
 const b=fresh(6);b.energy=6;b.skill(0);b.skill(1);b.fault('네트');step(b,200);assert.deepEqual(b.effects,{long:true,predict:true});
 const c=fresh(6);c.energy=6;c.skill(1);c.phase='fault';c.timer=1;c.message='렛';step(c,200);assert.equal(c.effects.predict,true);
});
test('더블 폴트·포인트가 끝나면 지속 효과만 풀리고 필승 준비는 남는다',()=>{
 for(const [p,slot] of [[0,0],[0,1],[2,0],[3,0],[3,1],[4,0],[4,1],[5,0],[5,1],[6,0],[6,1]]){
  const m=fresh(p);m.energy=6;assert.equal(m.skill(slot).ok,true);m.people[1].pose='dance';
  const k=E.SKILL_KINDS[p][slot],carry=['fire','drop','vanish','serveVanish'].includes(k);
  m.fault('아웃');step(m,200);m.fault('아웃');assert.equal(m.phase,'point');assert.equal(m.hasPrepared(k),carry);assert.deepEqual(m.effects,{});assert.equal(m.people[1].pose,'idle');
  step(m,300);assert.equal(m.phase,'ready');assert.equal(m.hasPrepared(k),carry);assert.deepEqual(m.effects,{});
 }
});
test('와루이지와나: 내 리턴은 정상 속도이고 효과는 유지된다',()=>{
 const m=rally(fresh(2));m.energy=6;m.skill(1);assert.equal(m.ball.slow,true);m.stroke(0);assert.equal(m.ball.by,0);assert.equal(m.ball.slow,false);assert.equal(m.effects.slow,true);
});
test('액슬로즈: 이번 게임만 내주고 경기는 이어진다',()=>{
 const m=fresh(1);m.energy=3;m.points=[3,0];m.games=[2,1];m.totalGames=3;const side=m.people[0].side,server=m.server;
 assert.equal(m.skill(1).ok,true);
 assert.equal(m.phase,'point');assert.equal(m.winner,null);assert.deepEqual(m.games,[2,2]);assert.deepEqual(m.points,[0,0]);assert.deepEqual(m.sets,[0,0]);
 assert.equal(m.energy,2,'에너지는 1칸만 쓰고 포인트 보상은 없다');assert.equal(m.server,1-server);assert.equal(m.totalGames,4);assert.equal(m.people[0].side,side,'짝수 게임 뒤에는 코트를 바꾸지 않는다');
 assert.equal(m.fx.type,'lose');assert.equal(m.skill(1).ok,false,'부수는 동안 다시 쓸 수 없다');
 const ev=[];for(let i=0;i<Math.round((E.BREAK_TIME+.4)*120);i++){m.step(E.DT,{});ev.push(...m.events.splice(0).map(e=>e.type));}
 assert.ok(ev.includes('smash')&&ev.includes('crack'));assert.equal(m.phase,'ready');assert.equal(m.fx,null);assert.equal(m.message.includes('서브')||m.message.includes('토스'),true);
});
test('액슬로즈: 랠리 중에 써도 공·준비 기술이 정리된다',()=>{
 const m=rally(fresh(1));m.energy=1;m.skill(1);assert.equal(m.ball,null);assert.equal(m.phase,'point');assert.deepEqual(m.games,[0,1]);assert.equal(m.people[0].side,-1,'홀수 게임 뒤 코트 교대');
});
test('액슬로즈: 상대의 세트·경기 포인트 게임이면 세트·경기를 내준다',()=>{
 const a=fresh(1);a.energy=1;a.games=[3,5];a.totalGames=8;a.skill(1);assert.deepEqual(a.sets,[0,1]);assert.deepEqual(a.history,[[3,6]]);assert.equal(a.phase,'point');assert.equal(a.winner,null);
 const b=fresh(1);b.energy=1;b.sets=[0,1];b.history=[[2,6]];b.games=[4,5];b.totalGames=17;b.skill(1);assert.equal(b.phase,'match');assert.equal(b.winner,1);assert.equal(b.fx.type,'lose');
});
test('액슬로즈: 타이브레이크는 한 게임으로 내준다',()=>{
 const m=fresh(1);m.energy=1;m.games=[6,6];m.totalGames=12;m.tb=true;m.tbFirst=0;m.points=[3,2];m.skill(1);
 assert.deepEqual(m.history,[[6,7]]);assert.deepEqual(m.sets,[0,1]);assert.equal(m.tb,false);assert.equal(m.totalGames,13);assert.equal(m.server,1);assert.equal(m.people[0].side,-1);
});
test('오겡끼데스까는 그대로 즉시 승리',()=>{const m=fresh(1);m.energy=6;m.skill(0);assert.equal(m.phase,'match');assert.equal(m.winner,0);});
test('저장 → 복원 뒤 같은 입력이면 틱마다 같은 경기',()=>{
 for(const [p,seed] of [[0,11],[2,22],[4,33],[6,44],[1,55]]){
  const m=fresh(p,1,p%4,seed);let k=seed;const rnd=()=>{k=(k*1103515245+12345)&0x7fffffff;return k/0x7fffffff;};
  const drive=(x,i)=>{const b=x.ball,q=x.people[0];
   if(i%240===7&&p!==1)x.skill(i%480<240?0:1);
   if(x.phase==='ready'&&x.server===0)x.action('drive');
   else if(x.phase==='toss'&&x.server===0&&b.vz<0&&b.z<2.3)x.action('drive');
   else if(x.phase==='rally'&&i%9===0)x.action(i%27?'drive':'lob',{x:i%2?1:-1,y:0});
   return b&&b.by===1?{x:Math.sign(b.x-q.x),y:Math.sign(b.y-q.y)}:{x:0,y:0};};
  let saved=0;
  for(let i=0;i<120*90&&m.phase!=='match';i++){
   if(rnd()<.004){
    const json=JSON.stringify(m.snapshot()),r=E.Match.restore(JSON.parse(json));saved++;
    assert.equal(JSON.stringify(r.snapshot()),json);
    const a=E.Match.restore(JSON.parse(json));
    for(let j=0;j<600;j++){const ia=drive(a,i+j),ir=drive(r,i+j);a.step(E.DT,ia);r.step(E.DT,ir);}
    assert.equal(JSON.stringify(a.snapshot()),JSON.stringify(r.snapshot()));
   }
   m.step(E.DT,drive(m,i));
  }
  assert.ok(saved>10);
 }
});
test('저장: 원본과 복원본이 이후 600틱 동안 같다 (기술·서브·랠리 도중 포함)',()=>{
 const m=fresh(6,2,3,99);m.energy=6;m.server=1;m.setupPoint();m.skill(0);m.skill(1);
 for(let i=0;i<400;i++){if(m.phase==='rally')m.action('drive',{x:1,y:0});m.step(E.DT,{});}
 const r=E.Match.restore(m.snapshot());
 for(let i=0;i<600;i++){for(const x of [m,r]){if(x.phase==='rally')x.action('drive',{x:-1,y:0});x.step(E.DT,{});}}
 assert.equal(JSON.stringify(r.snapshot()),JSON.stringify(m.snapshot()));
});
test('저장: 잘못된 자료는 거부한다',()=>{
 const good=()=>fresh(0).snapshot();
 assert.throws(()=>E.Match.restore(null),/경기 정보/);
 for(const [f,re] of [[s=>{s.config.player=9;},/선수·난이도/],[s=>{s.phase='match';},/끝난 경기/],[s=>{s.phase='x';},/진행/],[s=>{s.points=[0,-1];},/점수/],[s=>{s.sets=[2,0];},/점수/],
  [s=>{s.energy=9;},/에너지/],[s=>{s.people[0].x=null;},/선수/],[s=>{s.people[0].x=99;},/위치/],[s=>{s.people[0].id=3;},/선수 정보/],[s=>{s.people[1].side=1;},/방향/],[s=>{s.ball={x:0};},/공/],[s=>{s.phase='rally';},/공/],
  [s=>{s.armed='win';},/준비한 기술/],[s=>{s.skillCue={kind:'nope',name:'x',ttl:1,duration:1};},/연출/],[s=>{s.fx={type:'boom',ttl:1,duration:1};},/연출/],[s=>{s.fx={type:'long',ttl:1};},/연출/],
  [s=>{s.people[0].pose='<img>';},/선수 정보/],[s=>{s.people[1].hack=1;},/선수 정보/],[s=>{s.people[0].aim={x:'a'};},/선수 정보/],[s=>{s.message='x'.repeat(200);},/안내/],[s=>{s.message=5;},/안내/],
  [s=>{s.effects={miss:false};},/효과/],[s=>{s.effects={long:1.5};},/효과/],[s=>{s.effects={fall:-1};},/효과/],[s=>{s.phase='toss';s.ball={x:0,y:0,z:1,vx:0,vy:0,vz:1,by:0,bounces:0,evil:{}};},/공/],[s=>{s.effects={long:99};},/효과/],[s=>{s.effects={hack:true};},/효과/],[s=>{s.seed=0;},/시계/],[s=>{delete s.aiTarget;},/상대/]]){
  const s=good();f(s);assert.throws(()=>E.Match.restore(s),re);
 }
 const extra=good();extra.step=1;extra.skill='x';extra.court={bounce:99};extra.winner=0;extra.paused=true;const r=E.Match.restore(extra);
 assert.equal(typeof r.step,'function');assert.equal(typeof r.skill,'function');assert.equal(r.court,E.COURTS[0]);assert.equal(r.winner,null);assert.equal(r.paused,false);
 assert.deepEqual(Object.keys(fresh(0).snapshot()).sort(),Object.keys(fresh(0)).filter(k=>!['level','court'].includes(k)).sort());
 const ended=fresh(1);ended.energy=6;ended.skill(0);assert.throws(()=>E.Match.restore(ended.snapshot()),/끝난 경기/);
});
test('무작위 기술 사용 240분: 포인트마다 효과가 비고 값이 유한하다',()=>{
 let points=0,uses=0,longest=0;
 for(let p=0;p<E.PLAYERS.length;p++)for(let level=0;level<3;level++){
  let m=fresh(p,level,(p+level)%4,1000+p*10+level),k=p*31+level+1;const rnd=()=>{k=(k*1103515245+12345)&0x7fffffff;return k/0x7fffffff;};
  let lastPoint=0,since=0;
  for(let i=0;i<120*60*11.5;i++){
   if(m.phase==='match'){m=fresh(p,level,(p+level)%4,2000+i);lastPoint=0;since=0;}
   const b=m.ball,q=m.people[0];let input={x:0,y:0};
   if(rnd()<.004){if(rnd()<.5)m.energy=6;if(m.skill(rnd()<.5?0:1).ok)uses++;}
   if(m.phase==='ready'&&m.server===0)m.action('drive');
   else if(m.phase==='toss'&&m.server===0&&b.vz<0&&b.z<2.3)m.action(rnd()<.2?'lob':'drive',{x:rnd()*2-1,y:0});
   else if(m.phase==='rally'){if(b.by===1)input={x:Math.sign(b.x-q.x),y:Math.sign(b.y-q.y)};if(rnd()<.2)m.action(rnd()<.15?'lob':'drive',{x:Math.round(rnd()*2-1),y:Math.round(rnd()*2-1)});}
   const before=m.phase;m.step(E.DT,input);since++;
   for(const key of Object.keys(m.effects))assert.ok(m.effects[key]===true||m.effects[key]>0,'effect '+key+' '+m.effects[key]);
   if(m.ball)for(const key of ['x','y','z','vx','vy','vz'])assert.ok(Number.isFinite(m.ball[key]));
   assert.ok(m.energy>=0&&m.energy<=6);
   if(m.phase==='point'&&before!=='point'){points++;longest=Math.max(longest,since);since=0;assert.ok(!m.armed||['fire','drop','vanish','serveVanish'].includes(m.armed));assert.deepEqual(m.effects,{});assert.ok(!['fall','dance','whiff'].includes(m.people[1].pose));}
   if(!['rally','toss','ready'].includes(m.phase))since=0;
  }
 }
 assert.ok(points>1000&&uses>1500,points+' '+uses);console.log('   points',points,'skill uses',uses,'longest point',(longest/120).toFixed(1)+'s');
});
console.log(`${pass} skill-rule/save checks passed`);

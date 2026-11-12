const assert=require('assert/strict'),E=require('../src/engine'),fs=require('fs'),vm=require('vm');
let count=0;const test=(n,f)=>{f();count++;console.log('ok',n);};
const fresh=p=>new E.Match({player:p,level:1,court:0},123);
const rally=(m,extra={})=>{m.phase='rally';m.people[0].x=0;m.people[0].y=8;m.people[0].cool=0;m.ball={x:0,y:8,z:1,vx:0,vy:3,vz:0,by:1,bounces:1,serve:false,crossed:true,age:0,flightTime:1,...extra};return m;};
const tick=(m,n)=>{for(let i=0;i<n;i++)m.step(E.DT);};
test('all 14 skills immediately affordable without manual energy injection',()=>{
 for(let p=0;p<7;p++)for(let s=0;s<2;s++){const m=fresh(p);assert.equal(m.energy,6);assert.ok(m.skill(s).ok);assert.equal(m.energy,6-E.PLAYERS[p].skills[s][1]);}
});
test('both slots coexist and duplicates cost nothing',()=>{
 for(const p of [0,2,3,4,5,6]){const m=fresh(p);assert.ok(m.skill(0).ok);assert.ok(m.skill(1).ok);const before=m.energy;assert.equal(m.skill(0).ok,false);assert.equal(m.skill(1).ok,false);assert.equal(m.energy,before);}
});
test('comet, wind and long arm repeat across 8 hits in one rally',()=>{
 for(const [p,s,k] of [[0,1,'comet'],[2,0,'wind'],[6,0,'long']]){
  const m=fresh(p);m.skill(s);
  for(let i=0;i<8;i++){rally(m,{x:k==='wind'?0:3});assert.ok(m.stroke(0));assert.ok(m.effects[k]);if(k==='wind')assert.equal(m.ball.power,'wind');else assert.ok(m.fx?.type===k);}
  m.point(1,'끝');assert.deepEqual(m.effects,{});
 }
});
test('fall lasts beyond 4s; preactivation never blocks the CPU serve',()=>{
 const m=fresh(4);m.skill(1);tick(m,720);assert.equal(m.effects.fall,true);m.server=1;m.setupPoint();tick(m,90);assert.equal(m.phase,'toss');
 rally(m,{z:100,vz:40,vy:0,y:-6,by:0});tick(m,600);assert.equal(m.effects.fall,true);assert.equal(m.people[1].pose,'fall');m.point(0,'끝');assert.equal(m.people[1].pose,'idle');assert.deepEqual(m.effects,{});
});
test('miss remains after successive whiffs; transient whiff timer still clears',()=>{
 const m=fresh(4);m.skill(0);
 for(let i=0;i<3;i++){rally(m,{by:0,y:-8});m.people[1].x=0;m.people[1].y=-8;m.people[1].cool=0;assert.equal(m.stroke(1),false);assert.equal(m.effects.miss,true);m.phase='ready';m.ball=null;tick(m,200);assert.equal(m.effects.whiff,undefined);}
});
test('slow follows every CPU launch, never the human return',()=>{
 const m=fresh(2);assert.ok(m.skill(1).ok);
 for(let i=0;i<4;i++){
  rally(m,{by:0,y:-8});m.people[1].x=0;m.people[1].y=-8;m.people[1].cool=0;
  assert.equal(m.stroke(1),true);assert.equal(m.ball.slow,true);assert.equal(m.ball.by,1);
  rally(m);assert.equal(m.stroke(0),true);assert.equal(m.ball.slow,false);assert.equal(m.effects.slow,true);
 }
});
test('unspent winners survive point, double fault, end change, and next setup',()=>{
 for(const [p,s,k] of [[0,0,'fire'],[3,0,'drop'],[5,0,'vanish'],[5,1,'serveVanish']]){
  const m=fresh(p);m.skill(s);m.fault('ア');m.setupPoint(true);m.fault('ア');assert.ok(m.hasPrepared(k));m.setupPoint();m.points=[3,0];m.point(0,'game');m.setupPoint();assert.ok(m.hasPrepared(k));
 }
});
test('valid winners consume once; failed landings keep preparation',()=>{
 for(const [p,s,k] of [[0,0,'fire'],[3,0,'drop'],[5,0,'vanish'],[5,1,'serveVanish']]){
  for(const valid of [false,true]){
   const m=fresh(p);m.skill(s);rally(m,{x:valid?-1:7,y:-3,z:.001,vz:-1,vx:0,vy:0,by:0,bounces:0,power:k,serve:k==='serveVanish',serviceOriginX:1.5});m.physics(E.DT);
   assert.equal(m.hasPrepared(k),!valid,k);if(valid)assert.equal(m.points[0],1);
  }
 }
});
test('two quack preparations are independently consumed',()=>{
 const m=fresh(5);m.server=1;m.skill(0);m.skill(1);assert.ok(m.hasPrepared('serveVanish'));
 rally(m,{x:-1,y:-3,z:.001,vz:-1,vx:0,vy:0,by:0,bounces:0,power:'vanish'});m.physics(E.DT);
 assert.equal(m.hasPrepared('vanish'),false);assert.equal(m.hasPrepared('serveVanish'),true);
 const r=E.Match.restore(m.snapshot());assert.deepEqual(r.snapshot(),m.snapshot());r.setupPoint();assert.ok(r.hasPrepared('serveVanish'));
});
test('preactivate during point break or fault; pause/match reject',()=>{
 const m=fresh(6);m.point(0,'p');assert.ok(m.skill(0).ok);tick(m,220);assert.equal(m.effects.long,true);m.fault('f');m.skill(1);tick(m,180);assert.equal(m.effects.predict,true);
 m.paused=true;assert.equal(m.skill(0).ok,false);m.paused=false;m.finish(0,'done');assert.deepEqual(m.effects,{});assert.equal(m.skill(0).ok,false);
});
test('new saves round-trip; old numeric/armed v1 effects migrate',()=>{
 for(let p=0;p<7;p++){if(p===1)continue;const m=fresh(p);m.skill(0);m.skill(1);const r=E.Match.restore(m.snapshot());assert.deepEqual(r.snapshot(),m.snapshot());}
 const old=fresh(6).snapshot();delete old.pendingSkills;old.effects={long:2,fall:3};const r=E.Match.restore(old);assert.deepEqual(r.effects,{long:true,fall:true});
 const c=fresh(0).snapshot();delete c.pendingSkills;c.armed='comet';assert.equal(E.Match.restore(c).effects.comet,true);
 const bad=fresh(5).snapshot();bad.pendingSkills={fire:true};assert.throws(()=>E.Match.restore(bad),/기술/);
});
test('AI never activates a special while serving and rallying',()=>{
 const m=fresh(6);m.server=1;m.setupPoint();let calls=0;const orig=m.skill;m.skill=function(...a){calls++;return orig.apply(this,a);};tick(m,120*120);assert.equal(calls,0);assert.deepEqual(m.effects,{});assert.deepEqual(m.pendingSkills,{});
});
test('enlarged rectangular heads and CPU front orientation at all movements',()=>{
 const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../src/render'),'utf8'),sandbox);const R=sandbox.window.TeRender;
 for(const h of R.heads){assert.ok(h[0].length>=11);assert.ok(h.length>=11);assert.ok(h.every(row=>row.length===h[0].length));}
 for(const moveY of [-1,0,1])for(const kind of ['idle','run','toss','serve','lob','volley'])assert.equal(R.rearFacing({side:-1,walk:true,moveY},kind),false);
 assert.ok(R.heads[5].length<R.heads[1].length);assert.ok(R.heads[2][0].length>R.heads[3][0].length);
});
console.log(`${count} rally-skill/identity checks passed`);

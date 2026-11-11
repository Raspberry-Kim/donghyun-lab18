const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),E=require('../src/engine');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../src/render'),'utf8'),sandbox);
const R=sandbox.window.TeRender;
let count=0;function test(name,fn){fn();count++;console.log('ok',name);}
const step=(m,n,input={})=>{for(let i=0;i<n;i++)m.step(E.DT,input);};
function serve(x=1.5,ms=1600,side=1){
 const m=new E.Match();if(side===-1)m.swapEnds();m.setupPoint();m.people[0].x=x*side;
 m.toss();step(m,Math.round(ms/1000/E.DT));m.serve('drive');return m;
}
function ball(z=1,bounces=1){
 const m=new E.Match();m.phase='rally';m.people[0].x=0;m.people[0].y=8;
 m.ball={x:.25,y:8,z,vx:0,vy:4,vz:0,by:1,bounces,crossed:true,serve:false,age:0};return m;
}
test('oval major axis follows wrist-to-head line, not opposite lean',()=>{
 for(const name of ['idle','toss','serve','forehand','backhand','lob','windup','lobWindup','volley','softVolley']){
  for(const time of [0,.08,.17,.27]){
   const v=R.poseFrame({anim:{name,time,duration:.4,hand:1,height:2.5}}),r=R.racketFrame(v);
   assert.ok(Math.abs(Math.sin(r.angle)-r.ux)<1e-9);assert.ok(Math.abs(-Math.cos(r.angle)-r.uy)<1e-9);
   assert.ok(r.major>r.minor);assert.ok(r.minor>0);
  }
 }
 const r=R.racketFrame(R.poseFrame({}));assert.ok(r.angle>0);
});
test('racket face narrows and opens during A and B swings',()=>{
 for(const name of ['forehand','lob','serve']){
  const widths=[0,.09,.19,.29].map(time=>R.racketFrame(R.poseFrame({anim:{name,time,duration:.4,hand:1}})).minor);
  assert.ok(Math.max(...widths)-Math.min(...widths)>1);
 }
});
test('A and B have distinct windup, contact, follow-through and flight',()=>{
 const a=ball(),b=ball();a.stroke(0,'drive');b.stroke(0,'lob');
 assert.equal(a.people[0].anim.name,'forehand');assert.equal(b.people[0].anim.name,'lob');
 for(const time of [0,.1,.2]){a.people[0].anim.time=time;b.people[0].anim.time=time;assert.notDeepEqual(R.poseFrame(a.people[0]).racket,R.poseFrame(b.people[0]).racket);}
 assert.ok(b.ball.vz>a.ball.vz);assert.ok(b.ball.flightTime>a.ball.flightTime);
 const c=ball(),d=ball();c.ball.x=d.ball.x=5;c.stroke(0,'drive');d.stroke(0,'lob');
 assert.equal(c.people[0].anim.name,'windup');assert.equal(d.people[0].anim.name,'lobWindup');
});
test('high B stays a lob and unbounced B stays a soft volley',()=>{
 const a=ball(2.8),b=ball(2.8),c=ball(2.8,0);
 a.stroke(0,'drive');b.stroke(0,'lob');c.stroke(0,'lob');
 assert.equal(a.ball.kind,'smash');assert.equal(b.ball.kind,'lob');assert.equal(c.ball.kind,'softVolley');
});
test('three start positions alter first bounce at equal height',()=>{
 for(const side of [-1,1]){
  const land=[.5,1.5,3.8].map(x=>{
   const m=serve(x,1600,side),target=m.ball.serviceTarget.x;
   while(m.ball&&m.ball.bounces===0&&m.phase==='rally')m.physics(E.DT);
   assert.equal(m.phase,'rally');assert.equal(m.ball.bounces,1);assert.ok(Math.abs(m.ball.x-target)<.12);
   return m.ball.x*side;
  });
  assert.ok(land[0]>land[1]&&land[1]>land[2]);
 }
});
test('height and short/long post-impact direction independently alter real landing',()=>{
 for(const side of [-1,1])for(const ms of [1400,1800]){
  const land=[];
  for(const [axis,frames] of [[-1,12],[-1,4],[0,0],[1,4],[1,12]]){
   const m=serve(1.5,ms,side);
   step(m,frames,{x:axis*side});
   const target={...m.ball.serviceTarget};land.push(target.x*side);
   while(m.ball&&m.ball.bounces===0&&m.phase==='rally')m.physics(E.DT);
   assert.equal(m.phase,'rally',JSON.stringify({side,ms,axis,frames,target}));assert.equal(m.ball.bounces,1);
   assert.ok(Math.abs(m.ball.x-target.x)<.15);
  }
  for(let i=1;i<land.length;i++)assert.ok(land[i]>land[i-1]);
 }
});
test('steering closes, freezes on pause, respects analog amplitude and resets',()=>{
 const a=serve(),b=serve();step(a,6,{x:1});step(b,6,{x:.5});
 assert.ok(Math.abs(a.ball.serviceTarget.steer-2*b.ball.serviceTarget.steer)<1e-8);
 a.paused=true;const old=JSON.stringify(a);step(a,40,{x:-1});assert.equal(JSON.stringify(a),old);
 a.paused=false;step(a,20);const x=a.ball.serviceTarget.x;step(a,15,{x:-1});assert.equal(a.ball.serviceTarget.x,x);
 a.setupPoint();assert.equal(a.ball,null);assert.equal(a.pendingServe,null);
});
test('service box uses frozen launch side, not later player position',()=>{
 const m=serve();m.people[0].x=-3;
 while(m.ball&&m.ball.bounces===0&&m.phase==='rally')m.physics(E.DT);
 assert.equal(m.phase,'rally');assert.equal(m.ball.bounces,1);
});
test('human remains bottom through odd-game and tiebreak end changes',()=>{
 for(let court=0;court<4;court++){
  const m=new E.Match({player:0,level:0,court});m.points=[3,0];m.phase='rally';m.point(0,'game');
  assert.equal(m.people[0].side,-1);assert.ok(R.viewMatch(m).people[0].y>0);
  m.setupPoint();assert.ok(R.viewMatch(m).people[0].y>0);assert.ok(R.viewMatch(m).people[1].y<0);
  m.tb=true;m.points=[3,2];m.phase='rally';m.point(1,'tiebreak');assert.ok(R.viewMatch(m).people[0].y>0);
 }
});
test('view transformation mirrors ball, prediction and skill endpoints without mutation',()=>{
 const m=ball();m.swapEnds();m.ball={...m.ball,x:2,y:-5,vx:3,vy:4,z:2,vz:3};m.fx={type:'comet',x:2,y:-5,toX:3,toY:-6};const before=JSON.stringify(m),v=R.viewMatch(m);
 assert.equal(v.ball.x,-2);assert.equal(v.ball.y,5);assert.equal(v.fx.toX,-3);assert.equal(v.predict().x,-m.predict().x);assert.equal(JSON.stringify(m),before);
});
test('ROM-like plump oval, and walking carries the head behind the run at head height',()=>{
 for(const p of [{},{walk:true,moveX:-1,gait:1},{walk:true,moveX:1,gait:4}]){const r=R.racketFrame(R.poseFrame(p));assert.ok(r.minor/r.major>=.75,'plump '+r.minor/r.major);assert.ok(r.major>r.minor);}
 for(const gait of [0,1,2,3,4,5]){
  const L=R.poseFrame({walk:true,moveX:-1,gait}),Rt=R.poseFrame({walk:true,moveX:1,gait});
  assert.ok(L.racket[0]>8&&Rt.racket[0]<-8,'opposite side of travel');assert.ok(L.racket[1]<=-20&&Rt.racket[1]<=-20,'head height');
  assert.ok(L.right[2]>0&&Rt.right[2]<0,'right hand follows the racket side');
 }
 const m=new E.Match();m.swapEnds();m.phase='rally';const p=m.people[0];p.walk=true;p.moveX=1;p.gait=1;
 const v=R.viewMatch(m).people[0];assert.equal(v.moveX,-1);assert.ok(R.poseFrame(v).racket[0]>0,'mirrored end: screen-left run keeps racket on screen-right');
});
console.log(`${count} racket/input/view checks passed`);

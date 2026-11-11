const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),E=require('../src/engine');
const box={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../src/render'),'utf8'),box);
const R=box.window.TeRender;
let count=0;const check=(name,fn)=>{fn();count++;console.log('ok',name);};
check('toss rises higher, enlarges then shrinks, and returns without fault',()=>{
 const m=new E.Match();m.toss();let peak=0,rising=0,falling=0,last=R.ballVisual(m.ball).radius;
 for(let i=0;i<280&&m.phase==='toss';i++){
  const b=m.ball,v=R.ballVisual(b);peak=Math.max(peak,b.z);
  if(v.radius>last)rising++;if(v.radius<last)falling++;last=v.radius;m.step(E.DT);
 }
 assert.ok(peak>3.4&&peak<3.45);assert.ok(rising>50&&falling>50);
 assert.equal(m.phase,'ready');assert.equal(m.faults,0);
});
check('both serve types can hit the descending ball on every court',()=>{
 for(let court=0;court<4;court++)for(const kind of ['drive','lob']){
  const m=new E.Match({court,player:0,level:0});m.toss();
  for(let i=0;i<260;i++){if(m.ball.vz<0&&m.ball.z<=2.3)break;m.step(E.DT);}
  assert.ok(m.ball.z>=1.5);assert.ok(m.serve(kind));assert.equal(m.phase,'rally');assert.equal(m.faults,0);
 }
});
check('far-end toss apex and full enlarged ball stay inside canvas',()=>{
 const v=R.ballVisual({x:1.5,y:-12.3,z:3.44});
 assert.ok(v.y-v.radius>0);assert.ok(v.radius*2>13);assert.ok(R.ballVisual({x:0,y:0,z:0}).radius*2>=6);
});
check('above-reach input waits for reachable contact instead of faulting',()=>{
 const m=new E.Match();m.toss();for(let i=0;i<120;i++)m.step(E.DT);
 assert.ok(m.ball.z>3.4);assert.ok(m.serve('drive'));assert.ok(m.pendingServe);assert.equal(m.phase,'toss');assert.equal(m.faults,0);
 for(let i=0;i<60&&m.phase==='toss';i++)m.step(E.DT);
 assert.equal(m.phase,'rally');assert.ok(m.ball.serviceTarget.height<=3.15);
});
check('left hand tosses over right racket, clear of head, at both ends without a contact jump',()=>{
 for(const end of [1,-1])for(const server of [0,1]){
  const m=new E.Match();if(end===-1)m.swapEnds();m.server=server;m.setupPoint();m.toss();
  const v=R.viewMatch(m),p=v.people[server],b=R.ballVisual(v.ball),base=R.project(p.x,p.y);
  assert.ok(Math.abs(b.x-base.x)-b.radius>5,'ball overlaps large head at release');
  assert.ok((b.x-base.x)*p.side>0,'toss is not above the right-hand hitting side');
  const release=R.poseFrame(p);
  assert.ok(Math.abs(release.left[2]-(b.x-base.x))<1,'left wrist must release the ball');
  assert.ok(release.right[2]*p.side>0,'right hand must retain the racket');
  const startX=m.ball.x,startY=m.ball.y;m.ball.z=2.3;m.ball.vz=-3;m.serve('drive');
  assert.equal(m.ball.x,startX);assert.equal(m.ball.y,startY);
  const hit=R.viewMatch(m),pose=R.poseFrame(hit.people[server]);
  assert.ok(pose.racket[0]*p.side>0,'serve must contact above the right-hand racket');
  assert.ok(Math.abs(pose.racket[0]-(R.ballVisual(hit.ball).x-R.project(hit.people[server].x,hit.people[server].y).x))<2);
 }
});
console.log(`${count} round-ball/toss checks passed`);

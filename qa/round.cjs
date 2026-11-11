const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),E=require('../src/engine');
const box={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../src/render'),'utf8'),box);
const R=box.window.TeRender;
let count=0;const check=(name,fn)=>{fn();count++;console.log('ok',name);};
check('toss rises higher, enlarges then shrinks, and returns without fault',()=>{
 const m=new E.Match();m.toss();let peak=0,rising=0,falling=0,last=R.ballVisual(m.ball).radius;
 for(let i=0;i<160&&m.phase==='toss';i++){
  const b=m.ball,v=R.ballVisual(b);peak=Math.max(peak,b.z);
  if(v.radius>last)rising++;if(v.radius<last)falling++;last=v.radius;m.step(E.DT);
 }
 assert.ok(peak>3.4&&peak<3.45);assert.ok(rising>50&&falling>50);
 assert.equal(m.phase,'ready');assert.equal(m.faults,0);
});
check('both serve types can hit the descending ball on every court',()=>{
 for(let court=0;court<4;court++)for(const kind of ['drive','lob']){
  const m=new E.Match({court,player:0,level:0});m.toss();
  for(let i=0;i<200;i++){if(m.ball.vz<0&&m.ball.z<=2.3)break;m.step(E.DT);}
  assert.ok(m.ball.z>=1.5);assert.ok(m.serve(kind));assert.equal(m.phase,'rally');assert.equal(m.faults,0);
 }
});
check('far-end toss apex and full enlarged ball stay inside canvas',()=>{
 const v=R.ballVisual({x:1.5,y:-12.3,z:3.44});
 assert.ok(v.y-v.radius>0);assert.ok(v.radius*2>13);assert.ok(R.ballVisual({x:0,y:0,z:0}).radius*2>=6);
});
check('serve fails above reach rather than striking an invisible remote ball',()=>{
 const m=new E.Match();m.toss();for(let i=0;i<72;i++)m.step(E.DT);
 assert.ok(m.ball.z>3.4);assert.equal(m.serve('drive'),false);assert.equal(m.faults,1);
});
console.log(`${count} round-ball/toss checks passed`);

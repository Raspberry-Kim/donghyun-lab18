const assert=require('assert/strict'),E=require('../src/engine');
const step=(m,n)=>{for(let i=0;i<n;i++)m.step(E.DT);};
let count=0;const test=(name,fn)=>{fn();count++;console.log('ok',name);};
test('wide actual input-time matrix launches without timing faults',()=>{
 for(const kind of ['drive','lob'])for(const ms of [0,50,100,300,600,800,1000,1200,1400,1600,1800,1900]){
  const m=new E.Match();m.toss();step(m,Math.round(ms/1000/E.DT));m.serve(kind);
  for(let i=0;i<250&&m.phase==='toss';i++)m.step(E.DT);
  assert.equal(m.phase,'rally',`${kind}/${ms}`);assert.equal(m.faults,0);assert.ok(m.ball.serviceTarget);
 }
});
test('descending contact window exceeds half a second',()=>{
 const m=new E.Match();m.toss();let frames=0;
 for(let i=0;i<280&&m.phase==='toss';i++){if(m.ball.vz<0&&m.ball.z>=1.45&&m.ball.z<=3.15)frames++;m.step(E.DT);}
 assert.ok(frames*E.DT>.55);
});
test('timing sets a distinct wide/deep versus central/short actual bounce',()=>{
 const samples=[];
 for(const ms of [1400,1600,1800,1900]){
  const m=new E.Match();m.toss();step(m,Math.round(ms/1000/E.DT));m.serve('drive');
  const target=m.ball.serviceTarget;assert.ok(target);
  for(let i=0;i<250&&m.phase==='rally'&&m.ball.bounces===0;i++)m.physics(E.DT);
  assert.equal(m.phase,'rally');assert.equal(m.ball.bounces,1);assert.equal(m.faults,0);
  assert.ok(Math.abs(m.ball.x-target.x)<.2&&Math.abs(m.ball.y-target.y)<.2);
  samples.push(target);
 }
 for(let i=1;i<samples.length;i++){assert.ok(Math.abs(samples[i].x)<Math.abs(samples[i-1].x));assert.ok(Math.abs(samples[i].y)<Math.abs(samples[i-1].y));}
 console.log('  descending targets',samples.map(t=>({z:+t.height.toFixed(2),x:+t.x.toFixed(2),y:+t.y.toFixed(2)})));
});
test('queued input is frozen by pause and cleared by new point',()=>{
 const m=new E.Match();m.toss();step(m,120);m.serve('lob',{x:.2});m.paused=true;
 const state=JSON.stringify(m);step(m,100);assert.equal(JSON.stringify(m),state);
 m.paused=false;m.setupPoint();assert.equal(m.pendingServe,null);m.toss();step(m,245);assert.equal(m.phase,'ready');assert.equal(m.faults,0);
});
test('late miss and empty toss allow retry without a penalty',()=>{
 const m=new E.Match();m.toss();step(m,235);assert.equal(m.serve('drive'),false);
 step(m,10);assert.equal(m.phase,'ready');assert.equal(m.faults,0);assert.ok(m.toss());
});
test('CPU serves legally from either end on all difficulties',()=>{
 for(let level=0;level<3;level++)for(const side of [-1,1]){
  const m=new E.Match({player:0,level,court:0});m.server=1;m.people[1].side=side;m.people[0].side=-side;m.setupPoint();
  for(let i=0;i<500&&m.totalHits===0;i++)m.step(E.DT);
  assert.ok(m.totalHits>0);assert.equal(m.faults,0);assert.equal(m.ball.by,1);
 }
});
console.log(`${count} service-timing checks passed`);

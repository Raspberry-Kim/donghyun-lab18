const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const E=require('../src/engine'),Shu=require('../src/shushu');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../src/render'),'utf8'),sandbox);
const pose=sandbox.window.TeRender.poseFrame;
let count=0;function check(name,fn){fn();count++;console.log('ok',name);}
const step=(m,n)=>{for(let i=0;i<n;i++)m.step(E.DT);};
const descend=m=>{for(let i=0;i<280;i++){if(m.ball.vz<0&&m.ball.z<=2.3&&m.ball.z>=1.5)return;m.step(E.DT);}throw Error('descending service window missing');};
check('v0.10 opponent is random, never the player, fixed by the seed',()=>{
 for(let p=0;p<7;p++){const seen=new Set();for(let k=1;k<=300;k++){const seed=k*2654435761>>>0,m=new E.Match({player:p,level:k%3,court:k%4},seed);
  assert.notEqual(m.people[1].id,p);assert.equal(m.config.opponent,m.people[1].id);assert.equal(new E.Match({player:p,level:0,court:0},seed).people[1].id,m.people[1].id);seen.add(m.people[1].id);}
  assert.equal(seen.size,6);}
 assert.equal(new E.Match({player:0,level:0,court:0,opponent:3}).people[1].id,3);
 assert.notEqual(new E.Match({player:2,level:0,court:0,opponent:2}).people[1].id,2);
 const old=new E.Match({player:1,level:0,court:0}).snapshot();delete old.config.opponent;old.people[1].id=6;assert.equal(E.Match.restore(old).people[1].id,6);
});
check('Donghyun-pa original sprite arrays unchanged',()=>{
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(Shu)).digest('hex'),'e5bdb108167349f21617f49b6e78b525572d0e19780fbb8a683ec4e31ac858bb');
 assert.equal(Shu.rows.length,45);assert.equal(Shu.rows[0].length,28);
});
check('toss has four distinct arm and racket preparations',()=>{
 const m=new E.Match();m.toss();const frames=new Set();
 for(let n=0;n<42;n++){frames.add(JSON.stringify(pose(m.people[0]).racket));m.step(E.DT);}
 assert.equal(frames.size,4);
});
check('serve pose survives the first physics tick and movement',()=>{
 const m=new E.Match();m.toss();descend(m);m.serve('drive');m.step(E.DT,{x:1});
 assert.equal(m.people[0].anim.name,'serve');assert.equal(m.people[0].pose,'serve');assert.equal(m.ball.by,0);
});
check('serve contact and follow-through have four distinct frames',()=>{
 const m=new E.Match();m.toss();descend(m);m.serve('drive');const frames=new Set();
 for(let n=0;n<52;n++){frames.add(JSON.stringify(pose(m.people[0]).racket));m.step(E.DT);}
 assert.equal(frames.size,4);step(m,4);assert.equal(m.people[0].anim,null);assert.equal(m.people[0].pose,'idle');
});
check('CPU uses the same visible toss and serve sequence',()=>{
 const m=new E.Match();m.server=1;m.setupPoint();step(m,90);assert.equal(m.people[1].anim.name,'toss');
 while(m.phase==='toss')m.step(E.DT);assert.equal(m.people[1].anim.name,'serve');step(m,2);assert.equal(m.people[1].pose,'serve');
});
check('six gait poses depend on real travelled distance',()=>{
 const m=new E.Match();m.phase='rally';const p=m.people[0],frames=new Set();
 for(let n=0;n<100;n++){m.move(0,1,0,E.DT);frames.add(JSON.stringify(pose(p).feet));}
 assert.equal(frames.size,6);m.move(0,0,0,E.DT);assert.equal(p.walk,false);
});
check('forehand backhand lob volley smash poses differ',()=>{
 const frames=new Set();for(const name of ['forehand','backhand','lob','volley','smash']){
  const p={pose:'idle',anim:{name,time:0,duration:.4,hand:name==='backhand'?-1:1,height:2.8}};
  frames.add(JSON.stringify(pose(p).racket));
 }assert.equal(frames.size,5);
});
check('pause freezes the animation clock and gait',()=>{
 const m=new E.Match();m.toss();step(m,20);m.paused=true;const prior=JSON.stringify(m);step(m,100);assert.equal(JSON.stringify(m),prior);
});
check('empty toss returns to ready without a stuck animation',()=>{
 const m=new E.Match();m.toss();step(m,280);assert.equal(m.phase,'ready');assert.equal(m.people[0].anim,null);assert.equal(m.faults,0);
});
console.log(`${count} animation/opponent checks passed`);

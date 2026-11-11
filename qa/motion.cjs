const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const E=require('../src/engine'),Shu=require('../src/shushu');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../src/render'),'utf8'),sandbox);
const pose=sandbox.window.TeRender.poseFrame;
let count=0;function check(name,fn){fn();count++;console.log('ok',name);}
const step=(m,n)=>{for(let i=0;i<n;i++)m.step(E.DT);};
check('first opponent is Shushu for all 84 settings',()=>{for(let p=0;p<7;p++)for(let l=0;l<3;l++)for(let c=0;c<4;c++)assert.equal(new E.Match({player:p,level:l,court:c}).people[1].id,6);});
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
 const m=new E.Match();m.toss();step(m,33);m.serve('drive');m.step(E.DT,{x:1});
 assert.equal(m.people[0].anim.name,'serve');assert.equal(m.people[0].pose,'serve');assert.equal(m.ball.by,0);
});
check('serve contact and follow-through have four distinct frames',()=>{
 const m=new E.Match();m.toss();step(m,33);m.serve('drive');const frames=new Set();
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
 const m=new E.Match();m.toss();step(m,110);assert.equal(m.phase,'ready');assert.equal(m.people[0].anim,null);assert.equal(m.faults,0);
});
console.log(`${count} animation/opponent checks passed`);

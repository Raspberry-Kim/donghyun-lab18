// v0.18: exact crossing, automatic serves/returns, deterministic save, performance and scoring boundaries.
const assert=require('assert/strict'),E=require('../src/engine'),vm=require('vm'),fs=require('fs');
let count=0;const test=(name,f)=>{f();console.log('ok',++count,name);};
const fresh=(level=1,court=0,opponent=0)=>new E.Match({player:1,level,court,opponent},551);
const step=(m,n)=>{for(let i=0;i<n;i++)m.step(E.DT,{x:1,y:-1});};
const incoming=(m,over={})=>{m.phase='rally';m.ball={x:2,y:-.1*m.people[0].side,z:2,vx:0,vy:10*m.people[0].side,vz:0,by:1,bounces:0,serve:false,crossed:false,age:0,flightTime:1,...over};};
test('names, costs, rejected repeat and stationary dance',()=>{
 const m=fresh();assert.deepEqual(E.PLAYERS[1].skills.map(s=>s[0]),['액슬로즈','커트코베인']);m.skill(0);const e=m.energy;
 assert.equal(m.skill(0).ok,false);assert.equal(m.energy,e);const {x,y}=m.people[0];step(m,50);assert.deepEqual([m.people[0].x,m.people[0].y],[x,y]);assert.equal(m.stroke(0),false);
});
test('return at the exact net crossing, with no human movement or button',()=>{
 for(const side of [1,-1]){const m=fresh();if(side<0)m.swapEnds();m.skill(0);incoming(m);const {x,y}=m.people[0];m.physics(.02);
 assert.equal(m.ball.by,0);assert.equal(m.ball.crossed,true);assert.ok(Math.abs(m.ball.y)<1e-8);assert.deepEqual([m.people[0].x,m.people[0].y],[x,y]);assert.equal(m.effects.snake,true);}
});
test('eight returns, corners re-evaluated and reachable by opponent, no forced winner flag',()=>{
 const m=fresh();m.skill(0);
 for(let n=0;n<8;n++){incoming(m,{y:0,crossed:true});const o=m.people[1];o.x=n%2?3.8:-3.8;o.y=-10;
 const target=m.snakeTarget(),seed=m.seed;assert.equal(m.snakeReturn(),true);assert.equal(m.seed,seed);assert.equal(Math.sign(target.x),n%2?-1:1);
 assert.equal(m.ball.power,undefined);assert.equal(m.effects.snake,true);
 const t=m.ball.flightTime;assert.ok(Math.abs(t-Math.max(.5,target.t)/m.level.speed)<1e-10);
 // Stage a reachable return: the opponent is not disabled by S.
 Object.assign(m.ball,{x:o.x,y:o.y,z:2,bounces:1,crossed:true});o.cool=0;
 assert.equal(m.stroke(1),true);assert.equal(m.ball.by,1);
 }
 assert.equal(m.returns,8);assert.equal(m.energy,6);
});
test('service bounce validity: no volleyed serve, fault and let persist',()=>{
 const m=fresh();m.skill(0);incoming(m,{serve:true,crossed:true,y:3});
 assert.equal(m.snakeReturn(),false);
 for(const netTouch of [true,false]){incoming(m,{serve:true,crossed:true,y:3,z:.001,vz:-2,vy:1,serviceOriginX:-2,netTouch});m.physics(.01);
 if(netTouch){assert.equal(m.phase,'fault');assert.equal(m.effects.snake,true);}else{assert.equal(m.ball.by,0);assert.equal(m.ball.serve,false);}}
 m.fault('検査');assert.equal(m.effects.snake,true);
});
test('no free net/body loss on low and high incoming balls across all courts and levels',()=>{
 for(let l=0;l<3;l++)for(let c=0;c<4;c++)for(const y of [0,3,11])for(const z of [.001,.9,4.5]){
 const m=fresh(l,c);m.skill(0);incoming(m,{y,z,crossed:true,bounces:1});assert.equal(m.snakeReturn(),true);
 for(let k=0;k<800&&m.phase==='rally'&&m.ball.bounces===0;k++)m.physics(E.DT);
 assert.notEqual(m.points[1],1,`${l},${c},${y},${z}: ${m.message}`);
 }
});
test('natural hands-free points, both servers, all opponents, courts and levels',()=>{
 let returns=0;
 for(let l=0;l<3;l++)for(let c=0;c<4;c++)for(const opponent of [0,2,3,4,5,6,7,8])for(const server of [0,1]){
 const m=fresh(l,c,opponent);m.server=server;m.setupPoint();const pos=[m.people[0].x,m.people[0].y];m.skill(0);
 for(let k=0;k<120*90&&m.phase!=='point';k++)m.step(E.DT,{x:1,y:-1});
 assert.equal(m.phase,'point');assert.deepEqual(m.points,[1,0],`${l}/${c}/${opponent}/${server} ${m.message}`);
 assert.deepEqual([m.people[0].x,m.people[0].y],pos);assert.equal(m.effects.snake,undefined);returns+=m.returns;
 }console.log('  192 natural points; automatic returns',returns);
});
test('S loss carries on; own point ends; pause freezes exactly',()=>{
 const m=fresh();m.skill(0);m.point(1,'외부 검사');assert.equal(m.effects.snake,true);m.setupPoint();incoming(m);
 m.paused=true;const before=JSON.stringify(m.snapshot());step(m,400);assert.equal(JSON.stringify(m.snapshot()),before);m.paused=false;
 m.point(0,'상대 실패');assert.deepEqual(m.effects,{});
});
test('rage path turns in every direction, 12 impacts, score only at end, repeated input rejected',()=>{
 const m=fresh();m.skill(0);m.skill(1);const pos=[m.people[0].x,m.people[0].y],directions=new Set(),events=[];
 for(let n=0;n<1008;n++){
 assert.equal(m.skill(1).ok,false);assert.deepEqual(m.points,[0,0]);const old={...m.people[1]};m.step(E.DT);
 directions.add(Math.sign(m.people[1].x-old.x)+','+Math.sign(m.people[1].y-old.y));events.push(...m.events.splice(0).map(e=>e.type));
 }
 step(m,2);assert.deepEqual(m.points,[1,0]);assert.deepEqual(m.games,[0,0]);assert.deepEqual(m.effects,{});
 assert.deepEqual([m.people[0].x,m.people[0].y],pos);for(const dir of ['1,1','1,-1','-1,1','-1,-1'])assert.ok(directions.has(dir),dir);
 assert.equal(events.filter(t=>t==='smash'||t==='crack').length,12);
});
test('active S / A save restores and replays identically, legacy score preserved',()=>{
 for(const slot of [0,1]){const m=fresh();m.skill(slot);step(m,80);const r=E.Match.restore(m.snapshot());assert.deepEqual(r.snapshot(),m.snapshot());
 for(let i=0;i<1300;i++){m.step(E.DT);r.step(E.DT);assert.deepEqual(r.snapshot(),m.snapshot());}}
 const old=fresh().snapshot();old.phase='point';old.timer=3;old.games=[0,1];old.fx={type:'lose',duration:2.8,ttl:2};old.skillCue={kind:'lose',name:'액슬로즈',player:1,slot:1,ttl:1,duration:1.6,prepared:false};
 const r=E.Match.restore(old);step(r,400);assert.deepEqual(r.games,[0,1]);assert.deepEqual(r.points,[0,0]);
 const bad=fresh().snapshot();bad.phase='rage';assert.throws(()=>E.Match.restore(bad),/기술 진행/);
});
test('snake raised racket / opposing torso and legs, rage repeats, panic has no racket',()=>{
 const box={window:{},Te:E};vm.runInNewContext(fs.readFileSync(require.resolve('../src/render'),'utf8'),box);const R=box.window.TeRender;
 const poses=[0,.2,.4,.6,.8,1].map(time=>R.poseFrame({id:1,anim:{time}},'snake'));
 assert.ok(new Set(poses.map(v=>v.lean)).size>=4);assert.ok(poses.every(v=>v.racket[1]<-35));
 for(const t of [.1,.8,1.5,3.6,7.1])assert.ok(R.poseFrame({id:1,anim:{time:t}},'rage').racket[1]<-30);
 assert.equal(R.poseFrame({id:8,pose:'panic',walk:true,gait:1}).racketState,'none');
});
console.log(`${count} mungchi checks passed`);

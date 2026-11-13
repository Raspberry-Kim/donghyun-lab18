const assert=require('assert/strict'),E=require('../src/engine'),D=require('../src/donghyun');
let pass=0;
function test(name,fn){fn();pass++;console.log('ok',name);}
const fresh=(p=0,c=0)=>new E.Match({player:p,level:0,court:c},123);
function step(m,n){for(let i=0;i<n;i++)m.step(E.DT);}
function descend(m){for(let i=0;i<280;i++){if(m.ball.vz<0&&m.ball.z<=2.3&&m.ball.z>=1.5)return;m.step(E.DT);}throw Error('descending service window missing');}
function rally(m,o={}){
 m.phase='rally';m.ball={x:0,y:8,z:1,vx:0,vy:3,vz:0,by:1,bounces:1,serve:false,crossed:true,age:0,...o};m.people[0].x=0;m.people[0].y=8;m.people[0].cool=0;m.energy=6;return m;
}
function point(m,w){m.phase='rally';m.point(w,'test');}
test('108 configurations · real Donghyun interpreter',()=>{for(let p=1;p<=9;p++)for(let l=1;l<=3;l++)for(let c=1;c<=4;c++){const code='나는 동현이냐?\n'+[p,l,c].map(n=>'뿡뿡 도'+'오'.repeat(n-1)+'옹~뿡뿡뿡').join('\n')+'\n동현이구나';assert.deepEqual(E.parse(D.run(code).output),{player:p-1,level:l-1,court:c-1});}});
test('invalid config rejected',()=>{for(const str of ['', '1 1', '10 1 1','1 0 1','1 1 5','1.5 1 1','1 1 1 1','x 1 1'])assert.throws(()=>E.parse(str));});
test('stats exact',()=>assert.deepEqual(E.PLAYERS.map(p=>[p.atk,p.def,p.mov]),[[100,100,100],[90,90,90],[120,80,110],[90,90,120],[80,80,130],[80,90,90],[90,100,80],[70,90,100],[90,100,110]]));
test('toss repeat without fault',()=>{const m=fresh();m.toss();step(m,280);assert.equal(m.phase,'ready');assert.equal(m.faults,0);});
test('good serve crosses and is returned by CPU',()=>{const m=fresh();m.toss();descend(m);m.serve('drive');step(m,190);assert.equal(m.phase,'rally');assert.equal(m.ball.by,1);});
test('double fault awards receiver',()=>{const m=fresh();m.fault('test');assert.equal(m.faults,1);m.setupPoint();m.fault('test');assert.equal(m.points[1],1);});
test('net rally loses point',()=>{const m=rally(fresh(),{x:0,y:-.01,z:.3,vx:0,vy:5,vz:-1,by:1,bounces:0,crossed:false});m.physics(.02);assert.equal(m.points[0],1);});
test('bad serve side is fault',()=>{const m=rally(fresh(),{x:2,y:-3,z:.001,vz:-2,vy:0,by:0,serve:true,bounces:0});m.people[0].x=1.5;m.physics(.02);assert.equal(m.faults,1);});
test('let does not add fault',()=>{const m=rally(fresh(),{x:-2,y:-3,z:.001,vz:-2,vy:0,by:0,serve:true,bounces:0,netTouch:true});m.people[0].x=1.5;m.physics(.02);assert.equal(m.faults,0);assert.match(m.message,/렛/);});
test('first bounce outside loses hitter',()=>{const m=rally(fresh(),{x:5,y:8,z:.001,vz:-2,bounces:0});m.physics(.02);assert.equal(m.points[0],1);});
test('second bounce wins hitter',()=>{const m=rally(fresh(),{x:0,y:8,z:.001,vz:-2,bounces:1});m.physics(.02);assert.equal(m.points[1],1);});
test('line is in',()=>{const m=rally(fresh(),{x:E.W,y:8,z:.001,vz:-2,vy:0,bounces:0});m.physics(.02);assert.equal(m.phase,'rally');assert.equal(m.ball.bounces,1);});
test('no service volley',()=>{const m=rally(fresh(),{serve:true,bounces:0});assert.equal(m.stroke(0),false);});
test('high ball becomes smash',()=>{const m=rally(fresh(),{z:2.8});assert.equal(m.stroke(0),true);assert.equal(m.ball.kind,'smash');});
test('unbounced B becomes soft volley, A becomes strong volley',()=>{const m=rally(fresh(),{bounces:0}),a=rally(fresh(),{bounces:0});m.stroke(0,'lob');a.stroke(0,'drive');assert.equal(m.ball.kind,'softVolley');assert.equal(a.ball.kind,'volley');assert.ok(m.predict().t>a.predict().t);});
test('lob flight longer than drive',()=>{const a=rally(fresh()),b=rally(fresh());a.stroke(0,'lob');b.stroke(0,'drive');assert.ok(a.predict().t>b.predict().t);});
test('four surfaces alter bounce height and speed',()=>{const vals=[];for(let c=0;c<4;c++){const m=rally(fresh(0,c),{x:2,y:8,z:.001,vz:-4,vy:5,bounces:0});m.physics(.01);vals.push([m.ball.vz,m.ball.vy]);}assert.ok(vals[0][0]<vals[2][0]&&vals[2][0]<vals[1][0]&&vals[1][0]<vals[3][0]);assert.ok(vals[0][1]>vals[3][1]);});
test('deuce advantage and game',()=>{const m=fresh();for(let i=0;i<3;i++){point(m,0);point(m,1);}assert.deepEqual(m.score(),['40','40']);point(m,0);assert.deepEqual(m.score(),['AD','40']);point(m,1);assert.deepEqual(m.score(),['40','40']);point(m,0);point(m,0);assert.deepEqual(m.games,[1,0]);assert.equal(m.server,1);assert.equal(m.people[0].side,-1);});
test('two sets wins a match',()=>{const m=fresh();for(let i=0;i<48;i++)point(m,0);assert.equal(m.phase,'match');assert.equal(m.winner,0);assert.deepEqual(m.history,[[6,0],[6,0]]);});
test('tiebreak first one then two service and seven by two',()=>{const m=fresh();m.games=[5,6];m.points=[3,0];point(m,0);assert.equal(m.tb,true);const first=m.tbFirst;point(m,0);assert.equal(m.server,1-first);point(m,1);assert.equal(m.server,1-first);point(m,0);assert.equal(m.server,first);for(let i=0;i<4;i++)point(m,0);assert.equal(m.sets[0],0);point(m,0);assert.equal(m.sets[0],1);assert.deepEqual(m.history,[[7,6]]);});
test('pause freezes all engine state',()=>{const m=rally(fresh());m.paused=true;const s=JSON.stringify(m);step(m,120);assert.equal(JSON.stringify(m),s);});
test('body hit loses receiver',()=>{const m=rally(fresh(),{z:.7,y:8,vx:0,vy:0});m.physics(.01);assert.equal(m.points[1],1);});
test('energy earned and capped',()=>{const m=fresh();assert.equal(m.energy,6);m.energy=0;point(m,0);assert.equal(m.energy,2);for(let i=0;i<8;i++)point(m,1);assert.equal(m.energy,6);});
test('18 skills activate and charge once',()=>{for(let p=0;p<9;p++)for(let s=0;s<2;s++){const m=rally(fresh(p));if(p===5&&s===1){m.setupPoint();m.server=0;}const r=m.skill(s);assert.equal(r.ok,true,`${p}/${s} ${r.why}`);assert.equal(m.energy,6-E.PLAYERS[p].skills[s][1]);}});
test('skill failures consume no charge',()=>{const m=fresh();m.energy=0;assert.equal(m.skill(0).ok,false);assert.equal(m.energy,0);m.energy=6;m.skill(0);const n=m.energy;assert.equal(m.skill(0).ok,false);assert.equal(m.energy,n);});
test('fire valid shot forces winner and wall effect',()=>{const m=rally(fresh());m.skill(0);m.stroke(0);assert.equal(m.ball.power,'fire');assert.equal(m.reachable(1,true),false);step(m,350);assert.equal(m.points[0],1);});
test('comet moves across court on stroke only',()=>{const m=rally(fresh(),{x:-3});m.people[0].x=3;m.skill(1);assert.equal(m.people[0].x,3);m.stroke(0);assert.equal(m.people[0].x,-3);assert.equal(m.ball.by,0);});
test('Mungchi instant win; racket break concedes only the current game',()=>{const w=fresh(1);w.energy=6;w.skill(0);assert.equal(w.phase,'match');assert.equal(w.winner,0);const m=fresh(1);m.energy=6;m.points=[3,1];m.skill(1);assert.equal(m.phase,'point');assert.equal(m.winner,null);assert.deepEqual(m.games,[0,1]);assert.deepEqual(m.points,[0,0]);assert.deepEqual(m.sets,[0,0]);assert.equal(m.energy,5);});
test('wind drops near net',()=>{const m=rally(fresh(2));m.skill(0);m.stroke(0);assert.ok(Math.abs(m.predict().y)<2);step(m,190);assert.notEqual(m.message,'네트 · 상대 포인트');});
test('slow retains trajectory with slower time',()=>{const a=rally(fresh(2),{x:3}),b=rally(fresh(2),{x:3});a.skill(1);a.physics(.02);b.physics(.02);assert.ok(a.ball.y<b.ball.y);});
test('drop point unreachable',()=>{const m=rally(fresh(3));m.skill(0);m.stroke(0);assert.equal(m.ball.power,'drop');step(m,350);assert.equal(m.points[0],1);});
test('dance sends CPU away',()=>{const m=rally(fresh(3),{by:0,x:2,y:-6});m.people[1].x=0;m.skill(1);m.ai(.1);assert.ok(m.people[1].x<0);});
test('bark causes actual whiff',()=>{const m=rally(fresh(4),{by:0,y:-8});m.people[1].x=0;m.people[1].y=-8;m.skill(0);assert.equal(m.stroke(1),false);assert.ok(m.effects.whiff>0);});
test('cute causes fall for the rally',()=>{const m=rally(fresh(4));m.skill(1);assert.equal(m.effects.fall,true);m.ai(.1);assert.equal(m.people[1].pose,'fall');});
test('vanish return wins after valid bounce',()=>{const m=rally(fresh(5));m.skill(0);m.stroke(0);step(m,350);assert.equal(m.points[0],1);});
test('serve vanish requires successful service',()=>{const m=fresh(5);m.energy=6;m.skill(1);m.toss();descend(m);m.serve('drive');step(m,150);assert.equal(m.points[0],1);});
test('long arm returns distant ball, prediction shows landing',()=>{const m=rally(fresh(6),{x:-3});m.people[0].x=3;m.skill(0);assert.equal(m.stroke(0),true);const n=rally(fresh(6));n.skill(1);assert.ok(n.predict());assert.equal(n.effects.predict,true);});
test('deterministic 10000 ticks and finite ball values',()=>{const a=fresh(),b=fresh();for(const m of [a,b]){m.toss();descend(m);m.serve('drive');step(m,10000);}assert.equal(JSON.stringify(a),JSON.stringify(b));});
test('complete unassisted 2-set loss with alternating serve and ends',()=>{const m=fresh();for(let t=0;t<150000&&m.phase!=='match';t++){if(m.server===0&&m.phase==='ready')m.action('drive');else if(m.server===0&&m.phase==='toss'&&m.ball.vz<0&&m.ball.z<=2.3&&m.ball.z>1.6)m.action('drive');m.step(E.DT);}assert.equal(m.phase,'match');assert.equal(m.winner,1);assert.equal(m.sets[1],2);assert.equal(m.history.length,2);});
test('tiebreak finish increments game counter and changes ends once',()=>{for(const score of [[6,0],[6,5]]){const m=fresh();m.totalGames=12;m.tb=true;m.tbFirst=0;m.games=[6,6];m.points=score;point(m,0);assert.equal(m.totalGames,13);assert.equal(m.people[0].side,-1);assert.equal(m.tb,false);assert.equal(m.server,1);assert.deepEqual(m.history,[[7,6]]);}});
console.log(`${pass} checks passed`);

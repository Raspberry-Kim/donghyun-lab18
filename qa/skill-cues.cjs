const assert=require('assert/strict'),E=require('../src/engine');
const kinds=[['fire','comet'],['win','lose'],['wind','slow'],['drop','dance'],['miss','fall'],['vanish','serveVanish'],['long','predict']];
let checks=0;
for(let player=0;player<7;player++)for(let slot=0;slot<2;slot++){
 const m=new E.Match({player,level:0,court:0});m.energy=6;
 if(kinds[player][slot]==='slow'){m.phase='rally';m.ball={by:1};}
 const seed=m.seed,res=m.skill(slot);
 assert.equal(res.ok,true);assert.equal(m.skillCue.kind,kinds[player][slot]);
 assert.equal(m.skillCue.name,E.PLAYERS[player].skills[slot][0]);
 assert.equal(m.seed,seed,'visuals must not consume RNG');
 assert.equal(m.energy,6-E.PLAYERS[player].skills[slot][1]);
 m.paused=true;const cue=JSON.stringify(m.skillCue);m.step(1);
 assert.equal(JSON.stringify(m.skillCue),cue,'pause freezes cue');
 m.paused=false;m.phase='match';for(let i=0;i<200;i++)m.step(E.DT);
 assert.equal(m.skillCue,null,'cue expires even after match-ending skills');
 m.cueSkill(kinds[player][slot]);m.setupPoint();assert.equal(m.skillCue,null);
 checks++;
}
const m=new E.Match();m.energy=0;assert.equal(m.skill(0).ok,false);assert.equal(m.skillCue,null);
m.energy=6;m.skill(0);const cue=m.skillCue;assert.equal(m.skill(1).ok,false);assert.equal(m.skillCue,cue);
assert.equal(m.skillCue.prepared,true);m.cueSkill('fire');assert.equal(m.skillCue.prepared,false);
for(const [player,slot] of [[0,0],[0,1],[2,0],[3,0],[5,0]]){
 const a=new E.Match({player,level:0,court:0});a.energy=6;a.skill(slot);
 a.phase='rally';a.people[0].x=0;a.people[0].y=8;
 a.ball={x:.2,y:8,z:1,vx:0,vy:4,vz:0,by:1,bounces:1,crossed:true,serve:false,age:0};
 assert.equal(a.stroke(0,'drive'),true);assert.equal(a.skillCue.prepared,false);
 assert.equal(a.skillCue.kind,kinds[player][slot]);
}
for(const valid of [true,false]){
 const a=new E.Match({player:5,level:0,court:0});a.energy=6;a.skill(1);
 a.phase='rally';a.ball={x:valid?-1:6,y:-3,z:.001,vx:0,vy:0,vz:-1,by:0,bounces:0,crossed:true,serve:true,age:0,serviceOriginX:1.5};
 a.physics(E.DT);
 assert.equal(a.skillCue.prepared,!valid,'vanishing serve only activates on a legal service bounce');
}
console.log(`${checks} skill cues + rejection/pause/expiry/reset checks passed`);

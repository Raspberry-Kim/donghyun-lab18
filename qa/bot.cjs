const E=require('../src/engine'),assert=require('assert/strict');
let summaries=[],wins=0,returns=0;
for(let player=0;player<9;player++)for(let level=0;level<3;level++)for(let court=0;court<4;court++){
 const m=new E.Match({player,level,court},1000+player*12+level*4+court);let pts=0,maxRally=0;
 for(let t=0;t<120000&&pts<12&&m.phase!=='match';t++){
  let input={x:0,y:0};const p=m.people[0],b=m.ball;
  if(m.phase==='ready'&&m.server===0)m.toss();
  else if(m.phase==='toss'&&m.server===0&&b.vz<0&&b.z<=2.3&&b.z>1.6)m.serve('drive');
  else if(m.phase==='rally'){
   if(b.by===1){
    const q=m.predict(),x=b.bounces?b.x:q.x,y=b.bounces?b.y:q.y+p.side*.8;
    input={x:E.clamp((x-p.x)*3,-1,1),y:E.clamp((y-p.y)*3,-1,1)};
    // Deliberately leave every fourth incoming ball: exercise point/game/end changes
    // rather than letting two prediction-based agents rally forever.
    if(m.rally<7&&m.reachable(0)&&p.cool<=0)m.stroke(0,t%5===0?'lob':'drive',{x:p.x>0?-1:1,y:0});
   }else input={x:E.clamp(-p.x,-1,1),y:E.clamp((p.side*10-p.y),-1,1)};
  }
  m.step(E.DT,input);
  if(m.ball)for(const k of ['x','y','z','vx','vy','vz'])assert.ok(Number.isFinite(m.ball[k]));
  maxRally=Math.max(maxRally,m.rally);
  for(const e of m.events){if(e.type==='point'){pts++;if(e.text.includes('내 포인트'))wins++;}}
  m.events=[];
 }
 assert.equal(pts,12,`stalled ${player}/${level}/${court}`);
 returns+=m.returns;summaries.push({player,level,court,pts,returns:m.returns,maxRally});
}
console.log(JSON.stringify({configurations:summaries.length,points:summaries.length*12,playerPoints:wins,returns,minRally:Math.min(...summaries.map(s=>s.maxRally)),maxRally:Math.max(...summaries.map(s=>s.maxRally)),zeroReturnConfigurations:summaries.filter(s=>s.returns===0)},null,2));

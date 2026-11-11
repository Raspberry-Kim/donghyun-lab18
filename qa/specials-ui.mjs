const assert=(await import('node:assert/strict')).default;
const fs=await import('node:fs');
export async function checkSpecials(browser,url,out='/tmp/te-specials'){
 fs.mkdirSync(out,{recursive:true});
 const results=[];
 for(let player=0;player<7;player++)for(let slot=0;slot<2;slot++){
  const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
  // Fixtures grant energy for exhaustive visual coverage. All actions use real keyboard input.
  await ctx.addInitScript(()=>{
   let api;Object.defineProperty(window,'Te',{configurable:true,get:()=>api,set(v){
    const Base=v.Match;v.Match=class extends Base{constructor(...args){super(...args);this.energy=6;window.__qaMatch=this;}};api=v;
   }});
  });
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.selectOption('#example',String(player));await p.click('#court-start');
  await p.evaluate(()=>advanceTime(0));
  if(player===2&&slot===1)await p.evaluate(()=>{
   const m=window.__qaMatch;m.phase='rally';
   m.ball={x:0,y:0,z:2,vx:0,vy:4,vz:0,by:1,bounces:0,crossed:true,serve:false,age:0};
  });
  await p.keyboard.press(slot?'a':'s');await p.evaluate(()=>advanceTime(200));
  const state=JSON.parse(await p.evaluate(()=>render_game_to_text()));
  assert.ok(state.skillCue);assert.equal(state.skillCue.player,player);assert.equal(state.skillCue.slot,slot);
  assert.equal(await p.locator('#skill-cue-name').innerText(),state.skillCue.name);
  assert.equal(await p.locator('#skill-cue').isVisible(),true);
  await p.locator('#stage').screenshot({path:`${out}/${player}-${slot}.png`});
  if(state.phase!=='match'){
   await p.keyboard.press('Enter');const ttl=JSON.parse(await p.evaluate(()=>render_game_to_text())).skillCue.ttl;
   await p.evaluate(()=>advanceTime(500));
   assert.equal(JSON.parse(await p.evaluate(()=>render_game_to_text())).skillCue.ttl,ttl);
   assert.equal(await p.locator('#skill-cue').isVisible(),false);await p.keyboard.press('Enter');
  }
  await p.evaluate(()=>advanceTime(1700));assert.equal(await p.locator('#skill-cue').isVisible(),false);
  if(state.phase==='match')assert.equal(await p.locator('#end-card').isVisible(),true);
  assert.deepEqual(errors,[]);results.push({player,slot,name:state.skillCue.name,kind:state.skillCue.kind});
  await ctx.close();
 }
 fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));return results;
}

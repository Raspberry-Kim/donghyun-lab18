import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs');
const url=process.argv[2]||'http://127.0.0.1:3118/',out=process.argv[3]||'/tmp/te18-mungchi-ui';
fs.mkdirSync(out,{recursive:true});const b=await chromium.launch({channel:'chromium'});
let checks=0;
try{
 for(const [width,height,reduce] of [[1280,900,false],[390,844,false],[1280,900,true]]){
  const ctx=await b.newContext({viewport:{width,height},reducedMotion:reduce?'reduce':'no-preference'}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
  const adv=ms=>p.evaluate(ms=>advanceTime(ms),ms),key=k=>p.keyboard.press(k),state=()=>p.evaluate(()=>JSON.parse(render_game_to_text()));
  await p.selectOption('#example','4');await p.click('#court-start');await adv(0);await key('s');await adv(200);
  assert.match(await p.locator('#skill1').innerText(),/액슬로즈.*\n뱀춤/);const pos=(await state()).people[0];
  const stem=`${width}-${reduce?'reduce':'motion'}`;
  await p.locator('#stage').screenshot({path:`${out}/${stem}-snake-200.png`});
  await key('ArrowLeft');await key('x');await adv(400);
  assert.deepEqual([(await state()).people[0].x,(await state()).people[0].y],[pos.x,pos.y]);
  await p.locator('#stage').screenshot({path:`${out}/${stem}-snake-600.png`});
  // Real menu save, advance, load from menu, then resume.
  await key('Enter');const frozen=await p.evaluate(()=>JSON.stringify(TeApp.match.snapshot()));await adv(600);
  assert.equal(await p.evaluate(()=>JSON.stringify(TeApp.match.snapshot())),frozen);
  await key('ArrowDown');await key('Enter');await key('Enter');await key('Escape');await adv(300);
  await key('Enter');await key('ArrowDown');await key('ArrowDown');await key('Enter');await key('Enter');await key('Enter');
  assert.equal(await p.evaluate(()=>JSON.stringify(TeApp.match.snapshot())),frozen);await key('Escape');
  for(let n=0;n<200&&(await state()).phase!=='point';n++)await adv(100);
  assert.deepEqual((await state()).score,['15','0']);assert.equal((await state()).effects.snake,undefined);checks++;
  await adv(1800);await key('a');assert.equal((await state()).phase,'rage');
  await adv(2100);await p.locator('#stage').screenshot({path:`${out}/${stem}-rage-2100.png`});
  let previous=(await state()).people[1];await adv(450);
  assert.notDeepEqual([(await state()).people[1].x,(await state()).people[1].y],[previous.x,previous.y]);
  assert.equal((await state()).people[1].pose,'panic');assert.deepEqual((await state()).score,['15','0']);
  await p.locator('#stage').screenshot({path:`${out}/${stem}-rage-2550.png`});
  await key('Enter');const before=(await state()).fx.ttl;await adv(600);assert.equal((await state()).fx.ttl,before);
  await key('ArrowDown');await key('Enter');await key('ArrowDown');await key('Enter');await key('Escape');await adv(500);
  await key('Enter');await key('ArrowDown');await key('ArrowDown');await key('Enter');await key('ArrowDown');await key('Enter');await key('Enter');
  assert.equal((await state()).fx.ttl,before);assert.equal((await state()).phase,'rage');await key('Escape');
  await adv((before+.02)*1000);assert.deepEqual((await state()).score,['30','0']);assert.equal((await state()).fx,null);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);checks++;await ctx.close();
 }
 console.log(`${checks} mungchi UI flows passed (1280,390,reduced-motion; S/A; pause/save/load/score)`);
}finally{await b.close();}

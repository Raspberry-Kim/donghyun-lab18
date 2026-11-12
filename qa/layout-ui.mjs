// v0.06: fixed-view proportions, toolbar spacing, fullscreen, theme, tabs and ordinary play.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs');
const url=process.argv[2]||'http://127.0.0.1:3018/',out=process.argv[3]||'/tmp/te-layout';
fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,channel:'chromium'});let n=0;
const viewports=[[1440,900],[1280,800],[1024,768],[768,1024],[375,812],[320,740],[844,390],[1440,600]];
try{
for(const [width,height] of viewports){
 const p=await b.newPage({viewport:{width,height}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Permissions policy/.test(m.text()))errors.push(m.text());});
 await p.goto(url);await p.waitForSelector('#example option',{state:'attached'});
 const metrics=()=>p.evaluate(()=>{
  const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right};};
  return {canvas:rect('#court'),shell:rect('.canvas-shell'),wrap:rect('.court-wrap'),bar:rect('.board-bar'),button:rect('#fullscreen'),stage:rect('#stage'),close:rect('#full-close'),score:rect('.scoreboard'),skill:rect('.skill-strip'),overflow:document.documentElement.scrollWidth-innerWidth,full:!!document.fullscreenElement||document.querySelector('#stage').classList.contains('is-full'),vh:innerHeight,vw:innerWidth,scoreOverflow:document.querySelector('.scoreboard').scrollWidth-document.querySelector('.scoreboard').clientWidth};
 });
 let m=await metrics();assert.ok(m.overflow<=1);assert.ok(Math.abs(m.canvas.w/m.canvas.h-320/304)<.002,JSON.stringify(m));assert.ok(m.bar.y-m.wrap.bottom>=15.9);assert.ok(m.button.h>=44);n++;
 await p.click('#court-start');await p.evaluate(()=>advanceTime(0));
 await p.keyboard.press('ArrowLeft');await p.keyboard.down('ArrowLeft');await p.evaluate(()=>advanceTime(120));await p.keyboard.up('ArrowLeft');
 const left=await p.evaluate(()=>JSON.parse(render_game_to_text()));
 await p.keyboard.down('ArrowRight');await p.evaluate(()=>advanceTime(240));await p.keyboard.up('ArrowRight');
 const right=await p.evaluate(()=>JSON.parse(render_game_to_text()));
 assert.ok(right.people[0].x>left.people[0].x);
 await p.keyboard.press('x');await p.evaluate(()=>advanceTime(480));await p.keyboard.press('x');await p.evaluate(()=>advanceTime(350));
 assert.equal(await p.evaluate(()=>JSON.parse(render_game_to_text()).phase),'rally');
 await p.keyboard.press('Enter');assert.ok(await p.locator('#menu').isVisible());n++;
 await p.locator('.field-col').screenshot({path:`${out}/${width}-${height}.png`});
 // Real button enters; keyboard and close button both leave. Menus remain paused and usable.
 await p.click('#fullscreen');m=await metrics();
 assert.ok(m.full);assert.ok(Math.abs(m.canvas.w/m.canvas.h-320/304)<.002,JSON.stringify(m));
 assert.ok(m.shell.y>=0&&m.skill.bottom<=m.vh+1,JSON.stringify(m));
 assert.ok(m.scoreOverflow<=1,JSON.stringify(m));
 assert.ok(m.close.x>=0&&m.close.right<=m.vw+1);n++;
 await p.screenshot({path:`${out}/${width}-${height}-full.png`});
 await p.click('#full-close');assert.ok(!(await metrics()).full);
 await p.locator('#stage').focus();await p.keyboard.press('f');assert.ok((await metrics()).full);await p.keyboard.press('Escape');assert.ok(!(await metrics()).full);n++;
 await p.click('#theme');await p.locator('.field-col').screenshot({path:`${out}/${width}-${height}-dark.png`});
 for(const tab of ['players','rules','reference','play']){
  await p.click(`[data-tab="${tab}"]`);assert.ok(await p.locator(`#tab-${tab}`).isVisible());assert.ok((await metrics()).overflow<=1);
  if(tab==='players'&&width===1440&&height===900)await p.locator('#tab-players').screenshot({path:`${out}/roster.png`});
 }
 assert.deepEqual(errors,[]);n++;await p.close();
}
console.log(`${n} layout/fullscreen/flow checks passed`);
}finally{await b.close();}

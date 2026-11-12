// Browser check with a simulated standard gamepad (no real device): Start opens the menu,
// d-pad / stick move, right button picks, bottom button goes back, save and load work from the pad.
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);
const {chromium}=require('playwright');const assert=require('assert/strict');
const url=process.argv[2]||'http://127.0.0.1:3018/';const b=await chromium.launch();let n=0;const ok=t=>{n++;console.log('ok',t);};
const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{
 const pad={id:'QA pad',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
 window.__pad=pad;navigator.getGamepads=()=>[pad];
});
await p.goto(url);await p.waitForSelector('#example option',{state:'attached'});
const frame=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
const press=async i=>{await p.evaluate(i=>{window.__pad.buttons[i].pressed=true;},i);await frame();await p.evaluate(i=>{window.__pad.buttons[i].pressed=false;},i);await frame();};
const stick=async y=>{await p.evaluate(y=>{window.__pad.axes[1]=y;},y);await frame();await p.evaluate(()=>{window.__pad.axes[1]=0;});await frame();};
const title=()=>p.evaluate(()=>document.querySelector('#menu').hidden?null:document.querySelector('#menu h4').textContent);
const sel=()=>p.evaluate(()=>document.querySelector('#menu .sel span')?.textContent);
await p.click('#court-start');await frame();
assert.ok((await p.locator('#pad-status').innerText()).includes('QA pad'));
await press(9);assert.equal(await title(),'잠시 멈춤');ok('Start opens the menu');
await press(13);assert.equal(await sel(),'저장');await stick(1);assert.equal(await sel(),'불러오기');await press(12);await stick(-1);assert.equal(await sel(),'계속 간다');ok('d-pad and stick move one row per push');
await p.evaluate(()=>{window.__pad.axes[1]=1;});for(let i=0;i<10;i++)await frame();assert.equal(await sel(),'저장');await p.evaluate(()=>{window.__pad.axes[1]=0;});await frame();ok('a held stick does not run through the list');
await press(1);assert.equal(await title(),'저장');await press(1);assert.equal(await title(),'칸 1에 저장했다 · 잠시 멈춤');
assert.ok(await p.evaluate(()=>localStorage.getItem('donghyunte:slot1')));ok('right button picks: saved to slot 1');
await press(13);await press(13);await press(1);assert.equal(await title(),'불러오기');await press(0);assert.equal(await title(),'잠시 멈춤');ok('bottom button goes back');
await press(13);await press(13);await press(9);await press(1);assert.equal(await title(),'지금 경기를 버리고 불러올까?');await press(1);assert.equal(await title(),'저장한 경기를 불러왔다 · 잠시 멈춤');ok('load from the pad');
const t0=JSON.parse(await p.evaluate(()=>render_game_to_text()));assert.equal(t0.paused,true);
// pad strokes must not leak into the match while the menu is open
await press(4);await press(5);assert.equal(JSON.parse(await p.evaluate(()=>render_game_to_text())).armed??null,t0.armed??null);
await press(0);assert.equal(await title(),null);assert.equal(JSON.parse(await p.evaluate(()=>render_game_to_text())).paused,false);ok('bottom button on the main menu resumes');
assert.deepEqual(errs,[]);console.log(n+' pad checks passed');await b.close();

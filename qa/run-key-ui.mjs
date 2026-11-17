// v0.22: Ctrl+Enter와 맥의 ⌘+Enter가 같은 출전인지, 경기 중에는 확인 창이 뜨는지 확인한다.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('playwright'),assert=require('assert/strict');
const url=process.argv[2]||'http://127.0.0.1:3018/';
const b=await chromium.launch({headless:true,channel:'chromium'});let n=0;
try{
 for(const [name,combo] of [['Ctrl+Enter','Control+Enter'],['⌘+Enter','Meta+Enter'],['⌘+숫자판 Enter','Meta+NumpadEnter']]){
  const p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.waitForSelector('#example option',{state:'attached'});
  const phase=()=>p.evaluate(()=>JSON.parse(render_game_to_text()).phase);
  assert.equal(await phase(),'setup');
  await p.click('#code');await p.keyboard.press('Enter');assert.equal(await phase(),'setup',name+': 편집기의 Enter는 줄바꿈');n++;
  await p.keyboard.press('Backspace');await p.keyboard.press(combo);
  assert.notEqual(await phase(),'setup',name+': 편집기에서 눌러 출전');assert.ok(await p.locator('#start-card').isHidden());n++;
  await p.click('#code');await p.keyboard.press(combo);
  assert.ok(await p.locator('#confirm-panel').isVisible(),name+': 경기 중에는 확인 창');await p.click('#confirm-no');assert.ok(await p.locator('#confirm-panel').isHidden());n++;
  assert.deepEqual(errors,[]);await p.close();
 }
 console.log(`${n} run-key checks passed`);
}finally{await b.close();}

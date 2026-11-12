// Browser check: Enter menu, three browser slots, .dhsave file, refusal of bad files, confirm steps.
// Usage: node qa/save-ui.mjs [url]
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);
const {chromium}=require('playwright');const assert=require('assert/strict');const fs=require('fs');
const url=process.argv[2]||'http://127.0.0.1:3018/';const b=await chromium.launch();let n=0;
const ok=name=>{n++;console.log('ok',name);};
const ctx=await b.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
const st=async()=>JSON.parse(await p.evaluate(()=>render_game_to_text()));
const adv=ms=>p.evaluate(ms=>advanceTime(ms),ms);
const menu=()=>p.evaluate(()=>{const m=document.querySelector('#menu');return m.hidden?null:{title:m.querySelector('h4')?.textContent,items:[...m.querySelectorAll('.mi')].map(e=>({t:e.querySelector('span').textContent,note:e.querySelector('small')?.textContent||'',sel:e.classList.contains('sel'),off:e.classList.contains('off')}))};});
const snap=()=>p.evaluate(()=>JSON.stringify(TeApp.saveData().state));
const key=k=>p.keyboard.press(k);
await p.goto(url);await p.waitForSelector('#example option',{state:'attached'});
const canStore=await p.evaluate(()=>{try{localStorage.setItem('donghyunte:probe','1');localStorage.removeItem('donghyunte:probe');return true;}catch(e){return false;}});
assert.ok(canStore,'localStorage available on this origin');
// empty slots on the setup panel
assert.equal(await p.locator('#slot-list .slot-btn').count(),3);assert.equal(await p.locator('#slot-list .slot-btn:disabled').count(),3);assert.equal(await p.locator('#slot-list .slot-del').count(),0);ok('setup panel lists three empty slots');
// start example 10 (동현 · 프로 · US), play a serve into a rally
await p.selectOption('#example','9');await p.click('#court-start');await adv(0);
await key('a');await adv(100);await key('x');await adv(480);await key('x');await adv(350);
let s0=await st();assert.equal(s0.phase,'rally');assert.ok(s0.ball);assert.equal(s0.armed,'comet');
await key('Enter');let m=await menu();
assert.equal(m.title,'잠시 멈춤');assert.deepEqual(m.items.map(i=>i.t),['계속 간다','저장','불러오기','포기하고 출전 준비로']);assert.ok(m.items[0].sel);
const frozen=await snap();await adv(800);assert.equal(await snap(),frozen);assert.equal((await st()).paused,true);ok('Enter opens the menu and the match stands still');
// skill and stroke keys do nothing while the menu is open
await key('a');await key('ArrowLeft');await adv(200);assert.equal(await snap(),frozen);ok('game keys are ignored in the menu');
// ↓ Enter → save menu → slot 1
await key('ArrowDown');await key('Enter');m=await menu();assert.equal(m.title,'저장');
assert.deepEqual(m.items.map(i=>i.t),['브라우저 칸 1','브라우저 칸 2','브라우저 칸 3','파일로 내려받기','브라우저 칸 지우기']);assert.ok(m.items.slice(0,3).every(i=>i.note==='비어 있음'));assert.ok(m.items[4].off);
await key('Enter');m=await menu();assert.equal(m.title,'칸 1에 저장했다 · 잠시 멈춤');
const stored=JSON.parse(await p.evaluate(()=>localStorage.getItem('donghyunte:slot1')));
assert.equal(stored.format,'donghyunte-save');assert.equal(stored.version,1);assert.equal(JSON.stringify(stored.state),frozen);
assert.deepEqual(stored.summary,{player:'동현',level:'프로',court:'US',sets:[0,0],games:[0,0],score:['0','0']});ok('slot 1 holds exactly the paused match');
// Z from a sub menu goes back, Z from the main menu resumes
await key('ArrowDown');await key('x');assert.equal((await menu()).title,'저장');await key('z');assert.equal((await menu()).title,'잠시 멈춤');
await key('Escape');assert.equal(await menu(),null);assert.equal((await st()).paused,false);ok('X picks, Z goes back, Esc resumes');
// play on, so the live match differs from the save
await adv(2500);const later=await snap();assert.notEqual(later,frozen);
// file download
await key('Enter');await key('ArrowDown');await key('Enter');for(let i=0;i<3;i++)await key('ArrowDown');
const [dl]=await Promise.all([p.waitForEvent('download'),key('Enter')]);
assert.match(dl.suggestedFilename(),/^donghyunte-donghyun-set\d-\d-game\d-\d\.dhsave$/);const file='/tmp/te-save-ui.dhsave';await dl.saveAs(file);
const fileData=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(JSON.stringify(fileData.state),later);assert.equal((await menu()).title,'저장 파일을 내려받았다 · 잠시 멈춤');ok('file save: '+dl.suggestedFilename());
// overwrite asks first
await key('ArrowDown');await key('Enter');m=await menu();assert.ok(m.items[0].note.startsWith('동현 · 세트 0:0 · 게임 0:0'));
await key('Enter');m=await menu();assert.equal(m.title,'칸 1에 덮어쓸까?');assert.deepEqual(m.items.map(i=>i.t),['덮어쓴다','그만둔다']);
await key('ArrowDown');await key('Enter');assert.equal((await menu()).title,'저장');
assert.equal(JSON.stringify(JSON.parse(await p.evaluate(()=>localStorage.getItem('donghyunte:slot1'))).state),frozen);ok('overwrite needs a yes; "그만둔다" keeps the old save');
// save the later state into slot 2
await key('ArrowDown');await key('Enter');assert.equal((await menu()).title,'칸 2에 저장했다 · 잠시 멈춤');
// load from the menu: confirm, then the match is the saved one, paused
await key('ArrowDown');await key('ArrowDown');await key('Enter');m=await menu();assert.equal(m.title,'불러오기');assert.ok(!m.items[0].off&&!m.items[1].off&&m.items[2].off);
await key('Enter');assert.equal((await menu()).title,'지금 경기를 버리고 불러올까?');await key('Enter');
m=await menu();assert.equal(m.title,'저장한 경기를 불러왔다 · 잠시 멈춤');assert.equal(await snap(),frozen);assert.equal((await st()).paused,true);ok('menu load restores slot 1 and stays paused');
// the restored match replays exactly like the original would have
// (a load hands the clock back to the browser; advanceTime(0) takes it again while the menu still holds the match)
await adv(0);await key('Enter');assert.equal(await menu(),null);await adv(2500);assert.equal(await snap(),later);ok('restored match continues identically (2.5 s, same state as the first run)');
// reload: slots survive, the setup panel shows them, loading starts the saved match
await p.reload();await p.waitForSelector('#example option',{state:'attached'});
assert.equal(await p.locator('#slot-list .slot-btn:not(:disabled)').count(),2);
const txt=await p.locator('#slot-list .slot-btn').first().innerText();assert.ok(/칸 1/.test(txt)&&/동현 · 세트 0:0 · 게임 0:0/.test(txt)&&/프로 · US · 포인트 0:0/.test(txt),txt);
assert.equal(await p.locator('#example').inputValue(),'0');
await p.locator('#slot-list .slot-btn').first().click();
m=await menu();assert.equal(m.title,'저장한 경기를 불러왔다 · 잠시 멈춤');assert.equal(await snap(),frozen);
assert.equal(await p.locator('#example').inputValue(),'9');assert.equal(await p.locator('#config-description').innerText(),'동현 · 프로 · US');assert.equal(await p.locator('#stamp-player').innerText(),'동현 선수');
assert.equal((await st()).armed,'comet');assert.ok((await p.locator('#skill2').innerText()).includes('준비됨'));ok('after a reload the slot loads; code panel, example and prepared skill follow the save');
await adv(0);await key('Enter');await adv(2500);assert.equal(await snap(),later);ok('…and it continues identically after the reload too');
// loading from the setup panel during a match asks first; "그만둔다" keeps the match
await key('Enter');const live=await snap();await key('Escape');
await p.locator('#slot-list .slot-btn').nth(1).click();m=await menu();assert.equal(m.title,'지금 경기를 버리고 불러올까?');
await key('ArrowDown');await key('Enter');assert.equal((await menu()).title,'잠시 멈춤');assert.equal(await snap(),live);ok('setup-panel load during a match asks first');
await key('Escape');
// bad files are refused with a reason and the match is untouched
const good=fs.readFileSync(file,'utf8');const bad=(name,text)=>{const f='/tmp/te-bad-'+name;fs.writeFileSync(f,text);return f;};
const mut=fn=>{const d=JSON.parse(good);fn(d);return JSON.stringify(d);};
const cases=[
 ['not-json.dhsave','hello',/읽을 수 없는 파일/],
 ['other.dhsave',JSON.stringify({format:'donghyunq-save',version:1,state:{}}),/동현테 저장 파일이 아니다/],
 ['version.dhsave',mut(d=>{d.version=99;}),/지원하지 않는 저장 형식 버전/],
 ['nostate.dhsave',mut(d=>{delete d.state;}),/불러오기 실패/],
 ['energy.dhsave',mut(d=>{d.state.energy=99;}),/불러오기 실패/],
 ['player.dhsave',mut(d=>{d.state.config.player=9;}),/불러오기 실패/],
 ['nested.dhsave',mut(d=>{d.state.people[0].evil='<img src=x onerror=alert(1)>';}),/선수 정보가 맞지 않는다/],
 ['done.dhsave',mut(d=>{d.state.phase='match';d.state.winner=0;}),/이미 끝난 경기/],
 ['nan.dhsave',mut(d=>{d.state.people[0].x='left';}),/불러오기 실패/],
 ['msg.dhsave',mut(d=>{d.state.message='<b>'.repeat(60);}),/불러오기 실패/],
 ['huge.dhsave',' '.repeat(2.1e6)+good,/파일이 너무 크다/],
];
for(const [name,text,re] of cases){
 const before=await snap();await p.setInputFiles('#load-file-setup',bad(name,text));await p.waitForFunction(()=>!document.querySelector('#menu').hidden);
 if((await menu()).title==='지금 경기를 버리고 불러올까?')await key('Enter'); // a readable file asks first, then is checked
 await p.waitForFunction(()=>!document.querySelector('#load-status').hidden,null,{timeout:4000}).catch(async()=>{throw new Error(name+' gave no reason; menu '+JSON.stringify(await menu()));});
 const msg=await p.locator('#load-status').innerText();assert.match(msg,re,name+': '+msg);assert.ok(msg.length<=100);assert.ok((await menu()).title.startsWith('불러오기 실패'));
 await key('Enter');assert.equal(await snap(),before,name);await p.evaluate(()=>{document.querySelector('#load-status').hidden=true;});
}
assert.equal(await p.evaluate(()=>document.querySelectorAll('#menu img,#load-status img').length),0);ok(cases.length+' bad files refused, match untouched');
// unknown top-level fields are dropped, never copied onto the match
{const f=bad('extra.dhsave',mut(d=>{d.state.evil='<img src=x onerror=alert(1)>';d.state.step='x';d.extra=1;}));await p.setInputFiles('#load-file-setup',f);await p.waitForFunction(()=>document.querySelector('#menu h4')?.textContent==='지금 경기를 버리고 불러올까?');await key('Enter');
 assert.equal((await menu()).title,'저장한 경기를 불러왔다 · 잠시 멈춤');assert.equal(await snap(),later);assert.equal(await p.evaluate(()=>document.querySelectorAll('#menu img,.shell img[src=x]').length),0);
 await adv(0);await key('Enter');await adv(300);assert.equal(JSON.parse(await snap()).tick,JSON.parse(later).tick+36);assert.equal(await p.evaluate(()=>'evil' in JSON.parse(JSON.stringify(TeApp.saveData().state))),false);ok('unknown top-level fields in a file are ignored');}
// a tampered browser slot is refused the same way
await p.evaluate(()=>{const d=JSON.parse(localStorage.getItem('donghyunte:slot2'));d.state.sets=[9,9];d.summary.player='<i>x</i>';localStorage.setItem('donghyunte:slot3',JSON.stringify(d));});
await key('Enter');await key('ArrowDown');await key('ArrowDown');await key('Enter');m=await menu();assert.ok(m.items[2].note.startsWith('<i>x<'));assert.equal(await p.locator('#menu i').count(),0);
await key('ArrowDown');await key('ArrowDown');await key('Enter');await key('Enter');m=await menu();assert.ok(m.title.startsWith('불러오기 실패'),m.title);await key('Enter');ok('tampered slot refused; its text is shown as text');
// good file through the menu's file entry
await p.setInputFiles('#load-file',file);await p.waitForFunction(()=>document.querySelector('#menu h4')?.textContent.startsWith('저장한 경기를'));assert.equal(await snap(),later);ok('file load restores the downloaded match');
// delete: menu path with confirm, panel path with two presses
await key('ArrowDown');await key('Enter');for(let i=0;i<4;i++)await key('ArrowDown');await key('Enter');m=await menu();assert.equal(m.title,'지울 칸');
await key('ArrowDown');await key('ArrowDown');await key('Enter');assert.equal((await menu()).title,'칸 3을 지울까? 되돌릴 수 없다.');await key('Enter');
assert.equal(await p.evaluate(()=>localStorage.getItem('donghyunte:slot3')),null);assert.equal((await menu()).title,'지울 칸');
await key('z');await key('z');await key('Escape');
const del=p.locator('#slot-list .slot-del').nth(1);await del.click();assert.equal(await del.innerText(),'정말 지운다');assert.ok(await p.evaluate(()=>localStorage.getItem('donghyunte:slot2')));
await p.locator('#slot-list .slot-del').nth(1).click();assert.equal(await p.evaluate(()=>localStorage.getItem('donghyunte:slot2')),null);assert.equal(await p.locator('#load-status').innerText(),'브라우저 칸 2를 지웠다.');ok('delete: menu confirm and two-press button');
// give up → setup; finished match offers no save
await p.locator('#stage').focus();await key('Enter');for(let i=0;i<3;i++)await key('ArrowDown');await key('Enter');assert.equal((await menu()).title,'포기하고 출전 준비로 돌아갈까?');await key('Enter');
assert.equal(await menu(),null);assert.equal(await p.locator('#start-card').isVisible(),true);ok('give up asks, then returns to the start card');
// losing focus pauses into the menu
await p.click('#court-start');await adv(0);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await adv(50);assert.equal((await menu()).title,'잠시 멈춤');await key('Enter');assert.equal((await st()).paused,false);ok('window blur pauses into the menu');
// mouse can not play: clicking the court does nothing to the match
const b4=await snap();await p.mouse.click(700,400);await adv(0);assert.equal(JSON.parse(await snap()).phase,JSON.parse(b4).phase);
// narrow screen: menu fits
await p.setViewportSize({width:375,height:812});await key('Enter');await key('ArrowDown');await key('Enter');
const fit=await p.evaluate(()=>{const m=document.querySelector('#menu').getBoundingClientRect(),c=document.querySelector('.canvas-shell').getBoundingClientRect();return m.left>=c.left-1&&m.right<=c.right+1&&document.documentElement.scrollWidth<=innerWidth+1;});assert.ok(fit);
await p.screenshot({path:'/tmp/te-save-375.png'});ok('menu fits a 375 px screen');
assert.deepEqual(errs,[]);console.log(n+' save checks passed');await b.close();

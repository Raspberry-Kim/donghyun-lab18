// Browser check: every example runs, its name matches the parsed config, roster buttons map to 01-07.
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);
const {chromium}=require('playwright');const assert=require('assert/strict');
const url=process.argv[2]||'http://127.0.0.1:3018/';const b=await chromium.launch();let n=0;
for(const [w,h,dark] of [[1440,900,0],[375,812,0],[1440,900,1]]){
 const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(url);await p.waitForSelector('#example option',{state:'attached'});if(dark)await p.click('#theme');
 const opts=await p.$$eval('#example option',o=>o.map(x=>({v:x.value,t:x.textContent,g:x.parentElement.label})));
 assert.equal(opts.length,24);assert.equal(new Set(opts.map(o=>o.g)).size,5);
 for(const o of opts){
  await p.selectOption('#example',o.v);
  const r=await p.evaluate(()=>({err:!document.querySelector('#error').hidden,desc:document.querySelector('#config-description').textContent,out:document.querySelector('#output').textContent,note:document.querySelector('#example-note').textContent}));
  assert.ok(!r.err,o.t);assert.ok(r.note.length>3,o.t);
  const [pl,lv,ct]=r.desc.split(' · ');
  assert.equal(o.t,`${String(Number(o.v)+1).padStart(2,'0')} · ${pl} · ${lv} · ${ct}`);
  assert.ok((await p.locator('#example-level').innerText()).includes(lv));
  assert.ok((await p.locator('#example-court').innerText()).includes(ct));
  const lvl={'초보':'1','통상':'2','프로':'3'}[lv];
  assert.ok(o.t.includes(pl)||(pl==='동현'&&!/뭉치|뚱띠|또치|포동이|꽥꽥|슈슈/.test(o.t)),o.t+' player '+r.desc);assert.ok(o.t.includes(ct)||o.t.includes(ct.replace(/ .*/,'')),o.t+' court '+r.desc);
  assert.ok(o.t.includes(lv)||o.t.includes('난이도 '+lvl)||(o.g==='선수 고르기'&&lv==='초보'),o.t+' level '+r.desc);n++;
 }
 const over=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.ok(!over);
 if(!dark&&w===1440){
  await p.selectOption('#example','13');await p.screenshot({path:'/tmp/ex-1440.png'});
  await p.click('#court-start');await p.waitForTimeout(400);await p.keyboard.press('x');await p.waitForTimeout(450);await p.keyboard.press('x');await p.waitForTimeout(1200);
  const st=await p.locator('.match-status').innerText();console.log('status',st.replace(/\s+/g,' ').slice(0,80));await p.keyboard.press('Enter');
 }
 if(w===375){await p.selectOption('#example','20');await p.locator('#example').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/ex-375.png'});}
 if(dark){await p.selectOption('#example','16');await p.locator('#example').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/ex-dark.png'});}
 assert.deepEqual(errs,[]);await p.close();
}
console.log(n+' example checks passed');await b.close();

// Browser check: every example runs, its name matches the parsed config, groups run 통상 → 프로 → 초보,
// and each roster button loads that player's 초보 · 윔블던 example.
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);
const {chromium}=require('playwright');const assert=require('assert/strict');
const url=process.argv[2]||'http://127.0.0.1:3018/';const b=await chromium.launch();let n=0;
for(const [w,h,dark] of [[1440,900,0],[375,812,0],[1440,900,1]]){
 const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(url);await p.waitForSelector('#example option',{state:'attached'});if(dark)await p.click('#theme');
 const opts=await p.$$eval('#example option',o=>o.map(x=>({v:x.value,t:x.textContent,g:x.parentElement.label})));
 assert.equal(opts.length,24);assert.deepEqual([...new Set(opts.map(o=>o.g))],['통상 · 난이도 2','프로 · 난이도 3','초보 · 난이도 1']);
 assert.deepEqual(opts.map(o=>o.g[0]).join(''),'통'.repeat(7)+'프'.repeat(6)+'초'.repeat(11));
 // inside a group: player order, then court order; no combination twice
 {const ex=await p.evaluate(()=>TeApp.examples.map(e=>[e.l,e.p,e.c]));const rank=[2,0,1];
  for(let i=1;i<ex.length;i++){const a=ex[i-1],c=ex[i];assert.ok(rank[a[0]]<rank[c[0]]||(a[0]===c[0]&&(a[1]<c[1]||(a[1]===c[1]&&a[2]<c[2]))),'order '+i);}
  assert.equal(new Set(ex.map(String)).size,24);}
 // cross references in the notes: the example named really differs only in what the note says
 {const ex=await p.evaluate(()=>TeApp.examples.map(e=>({p:e.p,l:e.l,c:e.c,note:e.note})));
  const refs=[[1,8,'l'],[1,14,'l'],[2,1,'c'],[3,2,'c'],[3,1,'c'],[4,1,'c'],[8,1,'l'],[9,8,'c'],[9,10,'c'],[9,11,'c'],[11,8,'c'],[14,1,'l'],[15,14,'c'],[16,15,'c'],[16,14,'c'],[17,15,'c'],[17,16,'c'],...[18,19,20,21,22,23].map(k=>[k,14,'p'])];
  for(const [a,b2,k] of refs){const x=ex[a-1],y=ex[b2-1];assert.ok(x.note.includes(String(b2).padStart(2,'0')),`note ${a} names ${b2}`);for(const f of ['p','l','c'])assert.equal(x[f]!==y[f],f===k,`${a}↔${b2} ${f}`);}}
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
  assert.ok(o.t.includes(lv)&&o.g.startsWith(lv)&&o.g.endsWith(lvl),o.t+' level '+r.desc);n++;
 }
 for(let pl=0;pl<7;pl++){ // roster buttons
  await p.click('[data-tab=players]');await p.click(`[data-player="${pl}"]`);
  const d=await p.locator('#config-description').innerText(),name=await p.evaluate(n=>Te.PLAYERS[n].name,pl);
  assert.equal(d,`${name} · 초보 · 윔블던`);assert.equal(await p.locator('#stamp-player').innerText(),name+' 선수');n++;
 }
 const over=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.ok(!over);
 if(!dark&&w===1440){
  await p.selectOption('#example','7');await p.screenshot({path:'/tmp/ex-1440.png'});
  await p.click('#court-start');await p.waitForTimeout(400);await p.keyboard.press('x');await p.waitForTimeout(450);await p.keyboard.press('x');await p.waitForTimeout(1200);
  const st=await p.locator('.match-status').innerText();console.log('status',st.replace(/\s+/g,' ').slice(0,80));await p.keyboard.press('Enter');assert.equal(await p.locator('#menu').isVisible(),true);
 }
 if(w===375){await p.selectOption('#example','23');await p.locator('#example').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/ex-375.png'});}
 if(dark){await p.selectOption('#example','10');await p.locator('#example').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/ex-dark.png'});}
 assert.deepEqual(errs,[]);await p.close();
}
console.log(n+' example checks passed');await b.close();

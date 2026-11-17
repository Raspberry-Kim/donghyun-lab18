// 윈도우의 ‘애니메이션 효과’ 끔(prefers-reduced-motion: reduce)에서도 아홉 선수의 특수기술 열여덟 가지가
// 통상과 같은 그림으로 움직이는지 본다. 같은 시드로 같은 시각의 코트 그림을 장면마다 대조한다.
// 주소의 ?motion=reduce 로 동작을 줄인 화면은 따로 확인한다.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('playwright'),assert=require('assert/strict');
const url=process.argv[2]||'http://127.0.0.1:3118/';
const WIN='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const EDGE=WIN+' Edg/130.0.0.0';
const b=await chromium.launch({channel:'chromium'});
const run=async(player,slot,options,query='')=>{
 const ctx=await b.newContext({viewport:{width:1280,height:900},...options});
 await ctx.addInitScript(()=>{
  let seed=20261117;Math.random=()=>(seed=(seed*48271)%2147483647)/2147483647;
  // 검사용: 기술을 바로 쓸 수 있게 기력을 채운다. 입력은 실제 키보드로 넣는다.
  let api;Object.defineProperty(window,'Te',{configurable:true,get:()=>api,set(v){
   const Base=v.Match;v.Match=class extends Base{constructor(...args){super(...args);this.energy=6;window.__qaMatch=this;}};api=v;
  }});
 });
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url+query);
 const os=await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 // 실제 시계로 도는 화면 갱신을 멈추고, 검사가 정한 시각으로만 진행해 조건끼리 같은 순간을 대조한다.
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.waitForTimeout(120);
 await p.selectOption('#example',String(await p.evaluate(n=>TeApp.examples.findIndex(e=>e.p===n&&e.l===0&&e.c===0),player)));await p.click('#court-start');
 await p.evaluate(()=>advanceTime(0));
 if(player===2&&slot===1)await p.evaluate(()=>{const m=window.__qaMatch;m.phase='rally';m.ball={x:0,y:0,z:2,vx:0,vy:4,vz:0,by:1,bounces:0,crossed:true,serve:false,age:0};});
 await p.keyboard.press(slot?'a':'s');
 const {out:frames,name}=await p.evaluate(()=>{
  const c=document.querySelector('#court'),out=[];let name='';
  for(let i=0;i<40;i++){advanceTime(50);const s=c.toDataURL();let h=2166136261;for(let k=0;k<s.length;k++){h^=s.charCodeAt(k);h=Math.imul(h,16777619);}out.push((h>>>0).toString(36)+':'+s.length);if(i===3)name=JSON.parse(render_game_to_text()).skillCue?.name||'';}
  return {out,name};
 });
 await ctx.close();
 return {frames,distinct:new Set(frames).size,errors,os,name};
};
let checks=0,least=40,stilled=0;
try{
 for(let player=0;player<9;player++)for(let slot=0;slot<2;slot++){
  const usual=await run(player,slot,{});
  assert.equal(usual.os,false);assert.deepEqual(usual.errors,[]);assert.ok(usual.name,`${player}-${slot}: 기술 표지가 없다`);
  assert.ok(usual.distinct>=20,`${player}-${slot} ${usual.name}: 통상 조건의 그림 ${usual.distinct}/40`);
  for(const [label,options] of [['Windows Chrome',{userAgent:WIN,reducedMotion:'reduce'}],['Windows Edge',{userAgent:EDGE,reducedMotion:'reduce'}]]){
   if(label==='Windows Edge'&&!(player===1||slot===0&&player%4===0))continue; // 엣지는 뭉치 두 기술과 표본 선수만 다시 본다(같은 엔진).
   const win=await run(player,slot,options);
   assert.equal(win.os,true);assert.deepEqual(win.errors,[]);
   assert.deepEqual(win.frames,usual.frames,`${player}-${slot} ${usual.name}: ${label} 동작 줄이기에서 그림이 통상과 다르다`);
   checks++;
  }
  least=Math.min(least,usual.distinct);
  if(player===1||player===0&&slot===0){
   const reduced=await run(player,slot,{},'?motion=reduce');
   assert.deepEqual(reduced.errors,[]);assert.ok(reduced.distinct>=1);
   assert.notDeepEqual(reduced.frames,usual.frames,`${player}-${slot}: ?motion=reduce 가 듣지 않는다`);
   stilled++;checks++;
  }
 }
 console.log(`${checks} windows-motion checks passed (18 skills × 40 frames identical under OS reduced motion; fewest distinct frames ${least}/40; ?motion=reduce differs in ${stilled} skills)`);
}finally{await b.close();}

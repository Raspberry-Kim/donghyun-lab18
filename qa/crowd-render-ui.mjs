import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs');
const url=process.argv[2]||'http://127.0.0.1:8777/donghyunte/',out=process.argv[3]||'/tmp/te-v11';
fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,channel:'chromium'});
let checks=0;
try{
const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{
 let api;Object.defineProperty(window,'TeCrowd',{configurable:true,get:()=>api,set(v){
  const Base=v.Crowd;v.Crowd=class extends Base{constructor(...args){super(...args);window.__crowd=this;}};api=v;
 }});
});
await p.goto(url);await p.click('[data-tab=players]');
await p.locator('#roster').screenshot({path:out+'/roster.png'});
const render=await p.evaluate(()=>{
 const R=TeRender,results=[];
 for(let id=0;id<6;id++)for(const angle of [0,Math.PI/2,-Math.PI/2,Math.PI]){
  const c=document.createElement('canvas'),r=new R.Renderer(c);c.width=160;c.height=160;
  r.g.translate(80.3,80.7);r.g.rotate(angle);r.g.scale(1.8,2);
  r.pixels(R.heads[id],-7,-6,R.headPalettes[id]);
  const data=r.g.getImageData(0,0,160,160).data;
  let partial=0;for(let i=3;i<data.length;i+=4)if(data[i]>0&&data[i]<255)partial++;
  results.push({id,angle,partial});
 }
 // Reproduce the old rotated fillRect branch with the same .9 width × 2 scale.
 const c=document.createElement('canvas'),r=new R.Renderer(c);c.width=160;c.height=160;
 r.g.translate(80.3,80.7);r.g.rotate(Math.PI/2);r.g.scale(1.8,2);
 r.rect=function(x,y,w,h,color){this.g.fillStyle=color;this.g.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
 r.pixels(R.heads[4],-7,-6,R.headPalettes[4]);
 const data=r.g.getImageData(0,0,160,160).data;let oldPartial=0;
 for(let i=3;i<data.length;i+=4)if(data[i]>0&&data[i]<255)oldPartial++;
 return {results,oldPartial,ears:[R.headPalettes[4].c,R.headPalettes[4].d]};
});
assert.ok(render.oldPartial>0);assert.ok(render.results.every(r=>r.partial===0));
assert.deepEqual(render.ears,['#faf9f4','#e6e5df']);checks+=3;
console.log('Rotation regression',JSON.stringify(render));
// Whole-body fall sheet includes original Shushu (drawImage path), front and back.
const sheet=await p.evaluate(()=>{
 const c=document.createElement('canvas'),r=new TeRender.Renderer(c);
 c.width=1440;c.height=400;r.g.fillStyle='#6f9274';r.g.fillRect(0,0,1440,400);
 for(let rear=0;rear<2;rear++)for(let id=0;id<9;id++){
  r.g.save();r.g.translate(id*160+15,rear*200+95);r.g.scale(4,4);
  const pos=TeRender.project(0,0);r.g.translate(-pos.x,-pos.y);
  r.player({id,x:0,y:0,side:-1,pose:'fall',cool:0},0,'',null,1,{rear:!!rear});r.g.restore();
 }return c.toDataURL();
});
fs.writeFileSync(out+'/fallen.png',Buffer.from(sheet.split(',')[1],'base64'));
const audio=await p.evaluate(async()=>{
 const context=new OfflineAudioContext(2,22050*4,22050),result=[];
 for(const kind of ['murmur','applause','cheer','protest']){
  const buffer=TeCrowd.synth(context,kind);let peak=0,sum=0;
  for(const channel of [0,1])for(const v of buffer.getChannelData(channel)){peak=Math.max(peak,Math.abs(v));sum+=v*v;}
  result.push({kind,duration:buffer.duration,peak,rms:Math.sqrt(sum/(buffer.length*2))});
 }
 return result;
});
assert.ok(audio.every(a=>a.peak<=.651&&a.rms>.01&&Number.isFinite(a.rms)));checks++;
console.log('Synth buffers',JSON.stringify(audio));
await p.click('[data-tab=play]');await p.click('#court-start');
await p.waitForFunction(()=>window.__crowd?.enabled);
assert.equal(await p.evaluate(()=>__crowd.nodes.size),1);checks++;
// Real X-key serve; ambience must not create an extra loop.
await p.keyboard.press('x');await p.waitForTimeout(450);await p.keyboard.press('x');
assert.equal(await p.evaluate(()=>__crowd.ambient.loop),true);checks++;
// Event fixtures exercise the real audio consumer, not only a mapping helper.
for(const [event,expected] of [[{type:'point'},'applause'],[{type:'fault'},'murmur'],[{type:'hit',text:'smash'},'cheer'],[{type:'crack'},'protest']]){
 await p.evaluate(e=>{__crowd.next=0;TeApp.match.events=[e];advanceTime(20);},event);
 assert.equal(await p.evaluate(()=>__crowd.lastReaction),expected);checks++;
}
await p.click('#sound');assert.equal(await p.evaluate(()=>__crowd.nodes.size),0);checks++;
await p.evaluate(()=>{TeApp.match.events=[{type:'point'}];advanceTime(20);});
assert.equal(await p.evaluate(()=>__crowd.nodes.size),0);checks++;
await p.click('#sound');await p.evaluate(()=>advanceTime(20));
assert.equal(await p.evaluate(()=>__crowd.nodes.size),1);checks++;
await p.locator('#stage').focus();await p.keyboard.press('Enter');await p.evaluate(()=>advanceTime(20));
assert.equal(await p.evaluate(()=>__crowd.nodes.size),0);checks++;
await p.keyboard.press('Enter');await p.evaluate(()=>advanceTime(20));
assert.equal(await p.evaluate(()=>__crowd.nodes.size),1);checks++;
await p.click('[data-tab=players]');await p.evaluate(()=>advanceTime(20));
assert.equal(await p.evaluate(()=>__crowd.nodes.size),0);checks++;
assert.deepEqual(errors,[]);checks++;
await p.setViewportSize({width:375,height:812});await p.click('#theme');
await p.locator('#roster').screenshot({path:out+'/roster-mobile-dark.png'});
// Audio failure must not prevent a match from starting.
const q=await b.newPage();await q.addInitScript(()=>{window.AudioContext=class{constructor(){throw Error('No audio device');}};});
await q.goto(url);await q.click('#court-start');
assert.equal(await q.locator('#start-card').isHidden(),true);checks++;
console.log(`${checks} crowd/render checks passed`);
}finally{await b.close();}

/* Original procedural spectators. No recordings, speech, network assets or game RNG. */
(function(){
'use strict';
const DUR={murmur:4,applause:2.4,cheer:1.6,protest:1.7};
const rank={murmur:1,cheer:2,applause:3,protest:4};
function reaction(events,rally=0){
 let result=null;
 for(const e of events){
  const k=e.type==='crack'||e.type==='concede'?'protest':
   ['point','game','set','match'].includes(e.type)?'applause':
   e.type==='hit'&&(e.text==='smash'||(rally>=6&&rally%4===2))?'cheer':
   ['fault','let','net'].includes(e.type)?'murmur':null;
  if(k&&(!result||rank[k]>rank[result]))result=k;
 }
 return result;
}
function synth(ctx,kind){
 const sr=22050,n=Math.ceil(sr*DUR[kind]),buffer=ctx.createBuffer(2,n,sr);
 let seed=({murmur:137,applause:271,cheer:419,protest:563})[kind];
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const channels=[buffer.getChannelData(0),buffer.getChannelData(1)];
 if(kind==='applause'){
  // Many unsynchronised palm transients; differing pan, decay and timbre.
  for(let j=0;j<95;j++){
   const at=rand()*2.05,pan=rand(),amp=.12+rand()*.2,decay=.014+rand()*.026;
   let low=0;
   for(let i=0;i<sr*.13;i++){
    const t=i/sr,k=Math.floor(at*sr)+i;if(k>=n)break;
    const noise=rand()*2-1;low+=.15*(noise-low);
    const v=(noise-low)*amp*Math.exp(-t/decay)*Math.min(1,t/.0015);
    channels[0][k]+=v*Math.sqrt(1-pan);channels[1][k]+=v*Math.sqrt(pan);
   }
  }
 }else{
  const voices=kind==='murmur'?18:12;
  for(let j=0;j<voices;j++){
   const pan=rand(),f0=85+rand()*140,phase=rand()*Math.PI*2,rate=1+rand()*3;
   const onset=kind==='murmur'?0:rand()*.22;
   let low=0,angle=phase;
   for(let i=0;i<n;i++){
    const t=i/sr,u=t-onset;if(u<0)continue;
    const pitch=kind==='cheer'?1+.55*Math.sin(Math.min(1,u/1.4)*Math.PI/2):
     kind==='protest'?1-.24*Math.min(1,u/1.4):1;
    angle+=2*Math.PI*f0*pitch*(1+.012*Math.sin(t*12+phase))/sr;
    low+=.12*((rand()*2-1)-low);
    const syllable=.35+.65*Math.pow(.5+.5*Math.sin(t*rate*2*Math.PI+phase),2);
    const env=kind==='murmur'?1:Math.min(1,u/.16)*Math.max(0,1-u/(DUR[kind]-onset));
    // Low vowel chorus and breath; deliberately unintelligible, not spoken words.
    const voiced=Math.sin(angle)*.45+Math.sin(angle*2)*.3+Math.sin(angle*3)*.15;
    const v=(voiced*(kind==='murmur'?.17:.7)+low*.8)*syllable*env/voices;
    channels[0][i]+=v*Math.sqrt(1-pan);channels[1][i]+=v*Math.sqrt(pan);
   }
  }
 }
 // Zero boundaries avoid clicks, including the looping ambience join.
 let peak=0;
 for(const d of channels)for(let i=0;i<n;i++){
  d[i]*=Math.min(1,i/(sr*.04),(n-1-i)/(sr*.1));peak=Math.max(peak,Math.abs(d[i]));
 }
 const gain=peak>0?.65/peak:1;
 for(const d of channels)for(let i=0;i<n;i++)d[i]*=gain;
 return buffer;
}
class Crowd{
 constructor(ctx){
  this.ctx=ctx;this.bus=ctx.createGain();this.bus.gain.value=0;this.bus.connect(ctx.destination);
  this.buffers=new Map();this.nodes=new Map();this.enabled=false;this.ambient=null;this.next=0;
  this.lastReaction=null;
 }
 buffer(kind){if(!this.buffers.has(kind))this.buffers.set(kind,synth(this.ctx,kind));return this.buffers.get(kind);}
 play(kind,volume,loop=false){
  const s=this.ctx.createBufferSource(),g=this.ctx.createGain();
  s.buffer=this.buffer(kind);s.loop=loop;g.gain.value=volume;s.connect(g).connect(this.bus);
  this.nodes.set(s,g);s.onended=()=>{this.nodes.delete(s);s.disconnect();g.disconnect();};s.start();
  return s;
 }
 update(enabled,quiet=false){
  if(!enabled){if(this.enabled||this.nodes.size)this.stop();return;}
  if(!this.enabled){
   this.enabled=true;this.bus.gain.setValueAtTime(1,this.ctx.currentTime);
   this.ambient=this.play('murmur',.025,true);
  }
  this.bus.gain.setTargetAtTime(quiet?.45:1,this.ctx.currentTime,.08);
 }
 react(events,rally){
  const kind=reaction(events,rally),now=this.ctx.currentTime;
  if(!this.enabled||!kind||now<this.next)return null;
  this.play(kind,{murmur:.065,cheer:.10,applause:.15,protest:.12}[kind]);
  this.lastReaction=kind;this.next=now+(kind==='murmur'?.8:1.5);return kind;
 }
 stop(){
  this.bus.gain.cancelScheduledValues(this.ctx.currentTime);this.bus.gain.setValueAtTime(0,this.ctx.currentTime);
  for(const [s,g] of this.nodes){s.onended=null;s.stop();s.disconnect();g.disconnect();}
  this.nodes.clear();this.enabled=false;this.ambient=null;this.next=0;this.lastReaction=null;
 }
}
window.TeCrowd={Crowd,synth,reaction};
})();

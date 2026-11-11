/* Original tiny sprites; series identities reduced to a Game Boy-sized silhouette. */
(function(){
'use strict';
const heads=[
 ['.hhhhhhh.','hhhhhhhhh','hhssssshh','hsssssssh','skkssskks','swwssswws','.sssnsss.','..sssss..','...sss...'],
 ['..hhh..','.hhhhh.','hhssssh','.skssk.','.sssss.','..sns..','..sss..'],
 ['.hhhhh.','hhhhhhh','hsssssh','sskssks','sssssss','.snnns.','..sss..'],
 ['...hh..','..hhhh.','.hssss.','.skssk.','.sssss.','..sns..','..sss..'],
 ['ww.....ww','wwwwwwwww','wwwwwwwww','wwwkwkwww','wwwwwwwww','.wwknkww.','..wwwww..'],
 ['..yyy..','.yyyyy.','.ykyky.','.yyyyy.','ooooooo','.ooooo.','..yyy..']
];
const palette={h:'#342e2c',s:'#e3b797',k:'#292e2b',w:'#f5efdd',n:'#ab725c',y:'#e6be62',o:'#c67d43',g:'#a6be7b'};
const W=320,H=288,Z_SCALE=12;
function project(x,y,z=0){const sy=158+y*7.8,scale=1+y*.006;return {x:150+x*20*scale,y:sy-z*Z_SCALE,scale};}
function unproject(x,y){const wy=(y-158)/7.8;return{x:(x-150)/(20*(1+wy*.006)),y:wy};}
// Cartoon scale is visual only: collision, landing and rally trajectory stay in XYZ.
function ballVisual(ball){return {...project(ball.x,ball.y,ball.z),radius:3+Math.min(3.6,Math.max(0,ball.z))*1.1};}
// Display-only half-turn at an end change. Court art/camera never moves.
function viewMatch(m){
 const s=m.people[0].side;if(s===1)return m;
 const xy=o=>o?{...o,x:o.x*s,y:o.y*s}:o;
 const view=Object.create(m);
 view.people=m.people.map(p=>{
  const a=p.anim?{...p.anim,hand:p.anim.hand*s}:null;
  if(a&&['forehand','backhand'].includes(a.name))a.name=a.hand<0?'backhand':'forehand';
  return {...xy(p),side:p.side*s,moveX:(p.moveX||0)*s,moveY:(p.moveY||0)*s,anim:a};
 });
 view.ball=m.ball?{...xy(m.ball),vx:m.ball.vx*s,vy:m.ball.vy*s}:null;
 view.fx=m.fx?{...xy(m.fx),toX:m.fx.toX*s,toY:m.fx.toY*s}:null;
 view.predict=()=>xy(m.predict());return view;
}
function racketFrame(v){
 const [x,y]=v.racket,hand={x:v.right[2],y:v.right[3]};
 const dx=x-hand.x,dy=y-hand.y,length=Math.hypot(dx,dy)||1;
 // The oval's long axis continues the shaft, rather than leaning against it.
 return {x,y,hand,ux:dx/length,uy:dy/length,angle:Math.atan2(dx,-dy),minor:3.7*(v.face??.85),major:5.8};
}
const gait=[
 [-4,0,-3,-3,3,-1,1,-3],[-2,-1,-3,-3,3,0,2,-4],[-1,0,-1,-3,1,-2,3,-3],
 [3,-1,1,-3,-4,0,-2,-3],[3,0,2,-3,-2,-1,-3,-3],[1,-2,3,-3,-1,0,-1,-3]
];
/* Independent animation clock: hit windows/cooldowns do not decide what is visible. */
function poseFrame(p,override){
 const a=p.anim,t=a?.time||0,kind=override||(['fall','dance','whiff'].includes(p.pose)?p.pose:a?.name)||'idle';
 const walk=p.walk&&kind!=='serve'&&kind!=='toss',f=Math.floor(p.gait||0)%6;
 const v={kind,frame:0,lean:0,lift:0,bob:walk&&[1,4].includes(f)?-1:0,
  left:[-4,-12,-4,-9],right:[4,-12,4,-10],racket:[10,-17,'tilt'],face:.85,
  feet:walk?gait[f]:[-2,0,-2,-3,2,0,2,-3]};
 if(walk){const sway=[-1,-2,-1,1,2,1][f];v.frame=f;v.lean=p.moveX||0;
  v.left=[-4,-12,-4+sway,-9-sway];v.right=[4,-12,4,-10+sway];v.racket=[10,-17+sway,'tilt'];v.face=.65+.2*Math.abs(sway)/2;}
 if(kind==='toss'){
  const n=Math.min(3,Math.floor(t*10));v.frame=n;
  v.left=[[-8,-13,-13,-16],[-9,-18,-13,-23],[-8,-19,-12,-25],[-8,-17,-12,-22]][n];
  v.right=[[5,-12,5,-10],[5,-12,7,-10],[5,-15,6,-18],[5,-15,6,-18]][n];
  v.racket=[[10,-17,'tilt'],[15,-12,'wide'],[6,-26,'upright'],[10,-25,'tilt']][n];v.face=[.85,.5,.22,.35][n];v.lean=n>1?-1:0;v.bob=n===0?1:0;
 }else if(kind==='serve'||kind==='smash'){
  const st=a?.soft?t*.78:t,n=st<.07?0:st<.15?1:st<.28?2:3;v.frame=n;v.lean=[1,2,2,0][n];v.bob=[-1,0,1,0][n];v.face=a?.soft?[.95,.85,.65,.85][n]:[.95,.28,.18,.85][n];
  const contactHeight=(a?.height||2.1)*Z_SCALE,hitY=-Math.round(Math.max(18,Math.min(31,contactHeight)));
  if(kind==='serve'&&n<3)v.lift=-Math.round(Math.max(0,contactHeight-31)*[1,.65,.2][n]);
  const hitX=kind==='serve'?-Math.round(.65*20*(1+(p.y||0)*.006)):0;
  v.right=[[-3,-19,hitX,hitY+8],[5,-17,3,-17],[1,-11,-3,-10],[4,-12,4,-10]][n];
  v.racket=[[hitX,hitY,'upright'],[9,-23,'tilt'],[-11,-10,'wide'],[10,-17,'tilt']][n];
  v.left=[[-4,-14,-5,-16],[-5,-12,-6,-10],[-4,-11,-3,-8],[-4,-12,-4,-9]][n];
  if(n<3)v.feet=[-3,0,-2,-3,3,-1,1,-4];
 }else if(['lob','lobWindup','softVolley'].includes(kind)){
  const n=Math.min(3,Math.floor(t/((a?.duration||.46)/4))),hand=a?.hand||1;v.frame=n;
  // B: open face beneath the ball, lift, then hold the high follow-through.
  v.racket=[[10*hand,-7,'wide'],[10*hand,-17,'tilt'],[4*hand,-26,'upright'],[10,-17,'tilt']][n];
  v.right=[[4*hand,-12,3*hand,-8],[4*hand,-15,4*hand,-12],[3*hand,-17,2*hand,-18],[4,-12,4,-10]][n];
  v.left=[-4,-12,-6,-10];v.lean=[hand,hand,0,0][n];v.bob=[2,0,-1,0][n];v.face=[.95,.85,.58,.85][n];
  if(n<3)v.feet=[-3,0,-2,-2,3,0,2,-2];
 }else if(['forehand','backhand','volley','windup','whiff'].includes(kind)){
  const n=Math.min(3,Math.floor(t/.085));v.frame=n;
  const hand=kind==='backhand'?-1:a?.hand||1;
  const rack=kind==='volley'?[[9*hand,-19,'upright'],[12*hand,-17,'upright'],[6*hand,-16,'tilt'],[10,-17,'tilt']]
   :kind==='windup'?[[10*hand,-22,'tilt'],[14*hand,-13,'wide'],[-9*hand,-13,'tilt'],[10,-17,'tilt']]
   :[[14*hand,-13,'wide'],[1*hand,-20,'tilt'],[-11*hand,-12,'wide'],[10,-17,'tilt']];
  v.racket=rack[n];
  const wrists=kind==='volley'?[[6*hand,-12],[5*hand,-14],[1*hand,-10],[4,-10]]
   :kind==='windup'?[[5*hand,-15],[6*hand,-12],[-2*hand,-13],[4,-10]]
   :[[6*hand,-12],[4*hand,-13],[-3*hand,-12],[4,-10]];
  v.right=[4*hand,-13,...wrists[n]];v.left=[-4,-13,-5,-15];v.face=kind==='windup'?[.22,.4,.9,.85][n]:[.95,.25,.18,.85][n];
  v.lean=n===3?0:hand*(n===0?1:2);v.bob=n===2?1:0;
  if(!walk&&n<3)v.feet=[-3,0,-2,-3,3,0,2,-4];
 }else if(kind==='dance'){
  v.frame=f;v.lean=f<3?-2:2;v.left=[-5,-16,-7,-20];v.right=[5,-17,7,-21];v.racket=[9,-24,'tilt'];v.feet=gait[f];
 }
 if((kind==='toss'||kind==='serve')&&p.side===-1){
  for(const arm of [v.left,v.right]){arm[0]*=-1;arm[2]*=-1;}
  v.racket[0]*=-1;v.lean*=-1;
 }
 return v;
}
class Renderer{
 constructor(canvas){this.canvas=canvas;this.g=canvas.getContext('2d');canvas.width=W;canvas.height=H;this.g.imageSmoothingEnabled=false;
  this.shushu=[false,true].map(back=>{const c=document.createElement('canvas');c.width=28;c.height=45;const g=c.getContext('2d');
   TeShushu.rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(back&&y>=12&&y<21&&'sewbm'.includes(ch))ch='H';const color=TeShushu.colors[ch];if(color){g.fillStyle=color;g.fillRect(x,y,1,1);}}));return c;});
 }
 rect(x,y,w,h,c){const g=this.g;g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
 line(a,b,c,width=1){const g=this.g;g.strokeStyle=c;g.lineWidth=width;g.beginPath();g.moveTo(Math.round(a.x)+.5,Math.round(a.y)+.5);g.lineTo(Math.round(b.x)+.5,Math.round(b.y)+.5);g.stroke();}
 poly(pts,c){const g=this.g;g.fillStyle=c;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fill();}
 worldLine(x,y,x2,y2,c,w=1){this.line(project(x,y),project(x2,y2),c,w);}
 pixels(rows,x,y,pal){rows.forEach((row,j)=>[...row].forEach((ch,i)=>{if(pal[ch])this.rect(x+i,y+j,1,1,pal[ch]);}));}
 pixelLine(x0,y0,x1,y1,color,width=1){
  x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let e=dx+dy;
  for(let n=0;n<90;n++){this.rect(x0,y0,width,width,color);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}
 }
 player(p,time,role='',poseOverride=null,size=1){
  const g=this.g,pos=project(p.x,p.y),id=p.id,v=poseFrame(p,poseOverride),rear=p.walk&&p.moveY? p.moveY<0:p.side===1,ink=id===6?TeShushu.colors.o:'#343c32',skin=id===4?'#f5efdd':id===5?'#e6be62':id===6?TeShushu.colors.s:'#e3b797';
  g.save();g.translate(Math.round(pos.x),Math.round(pos.y));g.scale(size,size);g.imageSmoothingEnabled=false;
  this.rect(-4,0,9,1,'#172e3055');
  g.translate(0,v.lift);
  if(v.kind==='fall'){g.rotate(Math.PI/2);g.translate(-6,0);}
  const feet=v.feet,lean=v.lean,bob=v.bob;
  const limb=(sx,sy,ex,ey,hx,hy,c=skin)=>{this.pixelLine(sx,sy,ex,ey,ink,2);this.pixelLine(ex,ey,hx,hy,ink,2);this.pixelLine(sx,sy,ex,ey,c);this.pixelLine(ex,ey,hx,hy,c);};
  if(id!==6){
   limb(-1,-6,feet[2],feet[3],feet[0],feet[1]-1,ink);limb(1,-6,feet[6],feet[7],feet[4],feet[5]-1,ink);
   this.rect(feet[0]-1,feet[1],3,1,'#f2ead5');this.rect(feet[4]-1,feet[5],3,1,'#f2ead5');
  }else{
   const img=this.shushu[rear?1:0],moving=p.walk&&!['serve','toss'].includes(v.kind);
   g.drawImage(img,0,35,14,10,-7+(moving?Math.sign(feet[0])*1:0),-5+(moving?feet[1]:0),7,5);
   g.drawImage(img,14,35,14,10,(moving?Math.sign(feet[4])*1:0),-5+(moving?feet[5]:0),7,5);
  }
  g.save();g.translate(lean,bob);
  const shoulder=id===6?-11:-14,L=v.left,R=v.right;
  limb(-2,shoulder,...L); // far arm behind the body
  if(id===6){const img=this.shushu[rear?1:0];g.drawImage(img,0,0,28,35,-7,-22.5,14,17.5);}
  else {
   this.rect(-3,-15,6,8,ink);this.rect(-2,-14,4,6,id===4?'#f5efdd':Te.PLAYERS[id].color);
   this.rect(-3,-8,6,2,'#eee8d4');if(!rear)this.rect(-1,-14,2,1,'#eee8d4');
   const rows=heads[id].map((row,y)=>[...row].map(ch=>rear&&ch!=='.'?(id<4?(y<5?'h':'s'):id===4?'w':'y'):ch).join(''));
   this.pixels(rows,-Math.floor(rows[0].length/2),id===0?-24:-22,palette);
   if(['toss','serve','forehand','backhand'].includes(v.kind)&&id<4){ // turning profile, rather than a rigid front/back stamp
    this.rect(v.lean<0?-4:3,-18,1,2,palette.s);
   }
  }
  limb(2,shoulder,...R);
  if(v.kind!=='broken'){
   const rack=racketFrame(v),{x:rx,y:ry,minor,major}=rack;
   this.pixelLine(R[2],R[3],rx-rack.ux*6,ry-rack.uy*6,'#cdb87b',2);
   this.pixelLine(R[2],R[3],R[2]+rack.ux*2,R[3]+rack.uy*2,'#463f32',2);
   g.save();g.translate(rx,ry);g.rotate(rack.angle);
   g.beginPath();g.moveTo(-minor*.5,4.5);g.lineTo(0,7.8);g.lineTo(minor*.5,4.5);g.strokeStyle='#eadab3';g.lineWidth=1;g.stroke();
   g.beginPath();g.ellipse(0,0,minor,major,0,0,Math.PI*2);g.fillStyle='#45695c';g.fill();
   g.save();g.clip();g.strokeStyle='#b2c5a5';g.lineWidth=.55;g.beginPath();
   for(let q=-5;q<=5;q+=2){g.moveTo(q,-6);g.lineTo(q,6);g.moveTo(-4,q);g.lineTo(4,q);}g.stroke();g.restore();
   g.beginPath();g.ellipse(0,0,minor,major,0,0,Math.PI*2);g.strokeStyle='#f5ecd2';g.lineWidth=1.25;g.stroke();g.restore();
  }
  g.restore();
  if(role)this.rect(-1,(id===0?-28:-26)+v.bob,2,1,role==='P'?'#f3d884':'#e9e9dc');
  g.restore();
 }
 umpire(time){
  this.rect(291,134,15,4,'#c3b895');this.rect(294,138,2,25,'#c3b895');this.rect(304,138,2,25,'#c3b895');
  for(let y=143;y<162;y+=5)this.rect(296,y,8,1,'#a49677');
  const g=this.g;g.save();g.translate(299,135);
  // Joan: silver helmet, shoulder plates and the small Frankish banner.
  this.rect(-5,-17,9,3,'#d6dbcf');this.rect(-6,-14,11,5,'#8eaaa7');this.rect(-3,-12,5,4,'#dfb594');
  this.rect(-2,-11,1,1,'#303b35');this.rect(1,-11,1,1,'#303b35');this.rect(-5,-8,9,7,'#b9c7bd');
  this.rect(-7,-7,3,4,'#d3d9cc');this.rect(4,-7,3,4,'#d3d9cc');this.rect(-4,-1,3,3,'#3c5350');this.rect(1,-1,3,3,'#3c5350');
  this.rect(9,-24,1,25,'#ae9870');this.rect(10,-23,8,9,'#e5d4a8');this.rect(13,-21,1,5,'#597c9b');this.rect(11,-19,5,1,'#597c9b');g.restore();
 }
 draw(m){
  m=viewMatch(m);
  const g=this.g,c=m.court;
  this.rect(0,0,W,H,c.outer);
  // Low-contrast gallery and stone coping; fixed camera, including all skill effects.
  this.rect(0,4,320,20,'#243e37');this.rect(0,24,320,3,c.accent);
  for(let i=0;i<37;i++){const x=i*9-3;this.rect(x,8,3,3,i%3===0?'#b7b99e':'#7d9a87');this.rect(x-1,12,5,6,i%4===0?'#a6a78c':'#566f60');}
  this.poly([project(-5.5,-14),project(5.5,-14),project(5.5,14.5),project(-5.5,14.5)],c.ground);
  if(m.config.court===0)for(let i=0;i<12;i++)if(i%2===0)this.poly([project(-5.5,-14+i*2.4),project(5.5,-14+i*2.4),project(5.5,-11.6+i*2.4),project(-5.5,-11.6+i*2.4)],'#ffffff08');
  if(m.config.court===3)for(let i=0;i<280;i++){const x=32+(i*71)%222,y=35+(i*43)%238;this.rect(x,y,1,1,'#d5977728');}
  for(const x of [-5.49,-Te.W,Te.W,5.49])this.worldLine(x,-Te.L,x,Te.L,c.line);
  for(const y of [-Te.L,Te.L])this.worldLine(-5.49,y,5.49,y,c.line);
  for(const y of [-6.4,6.4])this.worldLine(-Te.W,y,Te.W,y,c.line);
  this.worldLine(0,-6.4,0,6.4,c.line);
  this.worldLine(0,-Te.L,0,-Te.L+.45,c.line);this.worldLine(0,Te.L,0,Te.L-.45,c.line);
  const visible=m.people.filter((p,i)=>!(i===1&&m.fx?.type==='wall'));
  const top=visible.filter(p=>p.y<0);for(const p of top)this.player(p,m.time,p===m.people[0]?'P':'C',p===m.people[0]&&m.fx?.type==='lose'?'broken':null);
  const a=project(-5.7,0),b=project(5.7,0),nh=Math.round(Te.NET*Z_SCALE);
  this.rect(a.x,a.y-nh,b.x-a.x,nh,'#273f3ad9');
  for(let x=a.x+2;x<b.x;x+=3)this.line({x,y:a.y-nh+1},{x,y:a.y},'#a8b4a26f');
  for(let y=a.y-nh+2;y<a.y;y+=3)this.line({x:a.x,y},{x:b.x,y},'#a8b4a26f');
  this.rect(a.x-1,a.y-nh,b.x-a.x+2,2,'#eee9d7');this.rect(a.x-2,a.y-nh-1,3,nh+4,'#d1c6a8');this.rect(b.x,a.y-nh-1,3,nh+4,'#d1c6a8');
  this.umpire(m.time);
  for(const p of visible.filter(p=>p.y>=0))this.player(p,m.time,p===m.people[0]?'P':'C',p===m.people[0]&&m.fx?.type==='lose'?'broken':null);
  if(m.effects.predict){const pr=m.predict();if(pr){const a=project(pr.x,pr.y);g.strokeStyle='#f9d880';g.lineWidth=1;g.beginPath();g.ellipse(a.x,a.y,5,2,0,0,7);g.stroke();this.rect(a.x-1,a.y-5,2,2,'#fff0b9');}}
  if(m.effects.long&&m.ball&&m.ball.by===1){const p=project(m.people[0].x,m.people[0].y,1),b=project(m.ball.x,m.ball.y,1);this.line(p,b,'#bdce8f',2);}
  if(m.ball){
   const ball=m.ball,shadow=project(ball.x,ball.y),pos=ballVisual(ball),r=pos.radius;
   g.fillStyle='#203832a8';g.beginPath();g.ellipse(shadow.x,shadow.y,3.5,1.3,0,0,Math.PI*2);g.fill();
   if(ball.power==='fire'){for(let i=1;i<7;i++)this.rect(pos.x-ball.vx*i*.018-2,pos.y-ball.vy*i*.12-2,4-i*.4,4-i*.4,i%2?'#e7a94a':'#ce6244');}
   if(ball.slow){g.strokeStyle='#d6b7e0';g.beginPath();g.arc(pos.x,pos.y,r+3,0,Math.PI*2);g.stroke();}
   g.beginPath();g.arc(pos.x,pos.y,r,0,Math.PI*2);g.fillStyle='#f6db72';g.fill();g.strokeStyle='#394b32';g.lineWidth=1;g.stroke();
   g.save();g.clip();g.beginPath();g.arc(pos.x-r*.65,pos.y,r*.85,-1.25,1.25);g.strokeStyle='#fff8cf';g.lineWidth=1;g.stroke();
   g.beginPath();g.arc(pos.x-r*.3,pos.y-r*.35,Math.max(.8,r*.2),0,Math.PI*2);g.fillStyle='#ffffe3';g.fill();g.restore();
  }
  const fx=m.fx;
  if(fx){
   if(fx.type==='wall'){
    const p=m.people[1],t=Math.min(1,(1.6-fx.ttl)/.42),edge=p.x<0?-5.9:5.9,x=p.x+(edge-p.x)*t,at=project(x,p.y);
    this.player({...p,x,pose:'fall'},m.time,'','fall');
    if(t===1)for(let j=0;j<9;j++)this.rect(at.x-7+(j*7)%15,at.y-15+(j*11)%22,2,2,'#b44d4a');
   }else if(fx.type==='comet'){
    this.line(project(fx.x,fx.y,1),project(fx.toX,fx.toY,1),'#f8dc92',2);
    for(let j=0;j<5;j++){const t=j/5;const p=project(fx.x+(fx.toX-fx.x)*t,fx.y+(fx.toY-fx.y)*t,1);this.rect(p.x,p.y,2,2,'#f1e9bd');}
   }else if(fx.type==='wind'){const p=project(fx.x,fx.y,1);for(let j=0;j<4;j++){g.strokeStyle='#e7ecd2';g.beginPath();g.arc(p.x,p.y,5+j*3,m.time*7+j,m.time*7+j+2);g.stroke();}}
   else if(fx.type==='lose'){const p=project(m.people[0].x,m.people[0].y);this.line({x:p.x+7,y:p.y-6},{x:p.x+12,y:p.y-1},'#ead7aa',2);this.line({x:p.x+15,y:p.y+2},{x:p.x+18,y:p.y+6},'#ead7aa',2);}
  }
 }
 portrait(id,size=52){
  const cv=document.createElement('canvas');cv.width=32;cv.height=32;const old=this.g;this.g=cv.getContext('2d');this.g.imageSmoothingEnabled=false;
  this.g.translate(-134,-130);this.player({id,x:0,y:0,side:-1,pose:'idle',cool:0},0,'',null,1);this.g=old;return cv.toDataURL();
 }
}
window.TeRender={Renderer,project,unproject,poseFrame,ballVisual,racketFrame,viewMatch};
})();

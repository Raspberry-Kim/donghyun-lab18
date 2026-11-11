/* Original tiny sprites; series identities reduced to a Game Boy-sized silhouette. */
(function(){
'use strict';
const heads=[
 ['...hhhhhh....','..hhhhhhhh...','..hssssssh...','..skksskkh...','..swwsswws...','...ssnnss....','....ssss.....'],
 ['....hhhh.....','...hhhhhh....','..hssssssh...','..hskssks....','...ssssss....','....snnss....','.....sss.....'],
 ['...hhhhhh....','..hhhhhhhh...','..hssssssh...','..ssssssss...','..sskssks....','..ssnnnss....','...sssss.....'],
 ['......hh.....','....hhhhh....','...hsssssh...','...sskssks...','...sssssss...','....snnss....','.....sss.....'],
 ['..ww....ww...','.wwwwwwwwww..','wwwwwwwwwwww.','wwwwkwwkwwww.','wwwwwwwwwwww.','.wwwknkwwww..','..wwwwwwww...'],
 ['....yyyy.....','...yyyyyy....','...ykyyky....','...yyyyyy....','...ooooooo...','....ooooo....','.....yyy.....'],
 ['....gggg.....','...gggggg....','..ggwggwgg...','..ggkggkgg...','..gggggggg...','...gkkkkg....','....gggg.....']
];
const palette={h:'#342e2c',s:'#e3b797',k:'#292e2b',w:'#f5efdd',n:'#ab725c',y:'#e6be62',o:'#c67d43',g:'#a6be7b'};
const W=320,H=288;
function project(x,y,z=0){const sy=158+y*7.8,scale=1+y*.006;return {x:150+x*20*scale,y:sy-z*17,scale};}
function unproject(x,y){const wy=(y-158)/7.8;return{x:(x-150)/(20*(1+wy*.006)),y:wy};}
class Renderer{
 constructor(canvas){this.canvas=canvas;this.g=canvas.getContext('2d');canvas.width=W;canvas.height=H;this.g.imageSmoothingEnabled=false;}
 rect(x,y,w,h,c){const g=this.g;g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
 line(a,b,c,width=1){const g=this.g;g.strokeStyle=c;g.lineWidth=width;g.beginPath();g.moveTo(Math.round(a.x)+.5,Math.round(a.y)+.5);g.lineTo(Math.round(b.x)+.5,Math.round(b.y)+.5);g.stroke();}
 poly(pts,c){const g=this.g;g.fillStyle=c;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fill();}
 worldLine(x,y,x2,y2,c,w=1){this.line(project(x,y),project(x2,y2),c,w);}
 player(p,time,role='',poseOverride=null,size=2){
  const g=this.g,pos=project(p.x,p.y),walk=p.walk?Math.floor(time*10)%2:0,pose=poseOverride||p.pose,id=p.id;
  g.save();g.translate(Math.round(pos.x),Math.round(pos.y));g.scale(size,size);
  if(pose==='fall'){g.rotate(Math.PI/2);g.translate(-7,0);}
  if(pose==='dance')g.rotate(Math.sin(time*15)*.5);
  g.fillStyle='#172e3055';g.fillRect(-6,0,13,2);
  const pal={...palette,b:Te.PLAYERS[id].color};
  // Seven-pixel head; white floppy ears and green worm body remain recognizable.
  for(let y=0;y<heads[id].length;y++)for(let x=0;x<heads[id][y].length;x++){let c=heads[id][y][x];if(p.side===1&&c!=='.'){if(id<4)c=y<5?'h':'s';else c=id===4?'w':id===5?'y':'g';}if(pal[c]){g.fillStyle=pal[c];g.fillRect(x-6,y-18,1,1);}}
  const body=id===6?'#94ae70':id===4?'#f5efdd':Te.PLAYERS[id].color;
  g.fillStyle='#293731';g.fillRect(-4,-11,9,8);g.fillStyle=body;g.fillRect(-3,-11,7,6);
  if(id===6){g.fillRect(-4,-5,9,3);g.fillStyle='#526b47';g.fillRect(-3,-8,7,1);}
  else {g.fillStyle='#eee8d4';g.fillRect(-3,-5,7,2);g.fillStyle='#35473e';g.fillRect(-3,-2-walk,2,3);g.fillRect(2,-3+walk,2,3);}
  const swing=['swing','smash','volley','whiff'].includes(pose)&&p.cool>0,dir=p.side===1?-1:1;
  g.strokeStyle='#e2bd92';g.lineWidth=2;g.beginPath();g.moveTo(4,-9);g.lineTo(swing?9:7,swing?-14:-6);g.stroke();
  if(pose!=='broken'){g.strokeStyle='#eee9d6';g.lineWidth=1;g.beginPath();g.ellipse(swing?11:10,swing?-18:-5,3,4,swing?.7:.3,0,Math.PI*2);g.stroke();
  g.strokeStyle='#718b7e';g.beginPath();g.moveTo(swing?9:8,swing?-18:-5);g.lineTo(swing?13:12,swing?-18:-5);g.stroke();}
  if(role){g.fillStyle=role==='P'?'#f3d884':'#e9e9dc';g.fillRect(-2,-23,5,2);}
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
  const a=project(-5.7,0),b=project(5.7,0),nh=Math.round(Te.NET*17);
  this.rect(a.x,a.y-nh,b.x-a.x,nh,'#273f3ad9');
  for(let x=a.x+2;x<b.x;x+=3)this.line({x,y:a.y-nh+1},{x,y:a.y},'#a8b4a26f');
  for(let y=a.y-nh+2;y<a.y;y+=3)this.line({x:a.x,y},{x:b.x,y},'#a8b4a26f');
  this.rect(a.x-1,a.y-nh,b.x-a.x+2,2,'#eee9d7');this.rect(a.x-2,a.y-nh-1,3,nh+4,'#d1c6a8');this.rect(b.x,a.y-nh-1,3,nh+4,'#d1c6a8');
  this.umpire(m.time);
  for(const p of visible.filter(p=>p.y>=0))this.player(p,m.time,p===m.people[0]?'P':'C',p===m.people[0]&&m.fx?.type==='lose'?'broken':null);
  if(m.effects.predict){const pr=m.predict();if(pr){const a=project(pr.x,pr.y);g.strokeStyle='#f9d880';g.lineWidth=1;g.beginPath();g.ellipse(a.x,a.y,5,2,0,0,7);g.stroke();this.rect(a.x-1,a.y-5,2,2,'#fff0b9');}}
  if(m.effects.long&&m.ball&&m.ball.by===1){const p=project(m.people[0].x,m.people[0].y,1),b=project(m.ball.x,m.ball.y,1);this.line(p,b,'#bdce8f',2);}
  if(m.ball){
   const ball=m.ball,shadow=project(ball.x,ball.y),pos=project(ball.x,ball.y,ball.z);
   this.rect(shadow.x-2,shadow.y,5,1,'#203832a8');
   if(ball.power==='fire'){for(let i=1;i<7;i++)this.rect(pos.x-ball.vx*i*.018-2,pos.y-ball.vy*i*.12-2,4-i*.4,4-i*.4,i%2?'#e7a94a':'#ce6244');}
   if(ball.slow){g.strokeStyle='#d6b7e0';g.beginPath();g.arc(pos.x,pos.y,6,0,7);g.stroke();}
   this.rect(pos.x-2,pos.y-2,5,5,'#394b32');this.rect(pos.x-1,pos.y-2,3,4,'#f5e69d');this.rect(pos.x-1,pos.y-2,2,1,'#ffffe3');
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
  const cv=document.createElement('canvas');cv.width=26;cv.height=26;const old=this.g;this.g=cv.getContext('2d');this.g.imageSmoothingEnabled=false;
  this.g.translate(-137,-135);this.player({id,x:0,y:0,side:-1,pose:'idle',cool:0},0,'',null,1);this.g=old;return cv.toDataURL();
 }
}
window.TeRender={Renderer,project,unproject};
})();

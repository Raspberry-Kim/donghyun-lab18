/* Original tiny sprites; series identities reduced to a Game Boy-sized silhouette. */
(function(){
'use strict';
const heads=[
 ['.............','..hhhhhhhhh..','.hhHHhhhhhhh.','hhHhhhhhhHhhh','hhssssssssshh','hsssssssssssh','ssskwssskwsss','ssskkssskksss','.sbssssssbs..','.ssssnsssss..','..sssssssss..','...ssnnnss...','....sssss....'],
 ['....hhhhh....','..hhhhhhhhh..','.hhHHhhhhhhh.','hhhhhhhhhhhhh','hhhsshhhsshhh','hhssssssssshh','hhskwssskwshh','hhskkssskkshh','hhsbsssssbshh','hhsssnnnssshh','.hhsssssshh..','...hssssh....'],
 ['...hhhhhhhh...','..hhhhhhhhhh..','.hhHHhhhhhhhh.','hhhhhhhhhhhhhh','hhsssssssssshh','hssskksskksssh','ssskwsssswksss','ssskksssskksss','ssssssssssssss','.sbsssnsssbs..','.sssssssssss..','..sssnnnnsss..','...ssssssss...'],
 ['....hhh....','...hhHhh...','..hHHhhhh..','.hhhhhhhhh.','.hhssssshh.','hhssssssssh','.skwssskws.','.skkssskks.','.sbsssssb..','..sssnnss..','..sssssss..','...sssss...'],
 ['..ww.......ww..','.wwwwwwwwwwwww.','wwwwwwwwwwwwwww','wwwwwwwwwwwwwww','wwwwkwwwwwkwwww','wwwwkwwwwwkwwww','wwwwwwwwwwwwwww','wwwwwwkkkwwwwww','.wwwwwwkwwwwww.','..wwwwnwnwwww..','...wwwwwwwww...','.....wwwww.....'],
 ['...hhhhhhh...','..hhHHhhhhh..','.hhhhhhhhhhh.','hhhsshhhsshhh','hhssssssssshh','hhskwssskwshh','hhskkssskkshh','hhsbsssssbshh','.hsssnnnsshh.','..hhssssshh..','....sssss....']
];
const palette={h:'#342e2c',s:'#e3b797',k:'#292e2b',w:'#f5efdd',n:'#ab725c',y:'#e6be62',o:'#c67d43',g:'#a6be7b'};
const headPalettes=[
 {...palette,h:'#bfbdb5',H:'#dddbd3',D:'#a3a098',b:'#d88f82'}, // 동현: soft grey, white and dark strands blended
 {...palette,h:'#624234',H:'#916049',b:'#e89b92',n:'#b6636a'},
 {...palette,h:'#3b3029',H:'#635044',s:'#dba784',b:'#c88670'},
 {...palette,h:'#614b39',H:'#997756',b:'#e4a093'},
 {...palette,b:'#dca79b'},
 {...palette,h:'#493329',H:'#866149',b:'#efa79b',n:'#b6636a'}
];
// Retreat is a backward step facing the ball, never a sudden back-of-head sprite.
const SALT_PEPPER=['hhDhhHhhDhhHh','hHhhDhhhhHhDh','DhhHhhDhHhhhh','hhDhhhhhhDhHh','hHhhDhHhhhhhD','DhhhhhhDhhHhh','hhHhDhhhhDhhH','hDhhhhHhDhhhh','hhhDhHhhhhHDh','HhhhhhDhhhhhD']; // fixed scattered black/white strands
function saltPepper(x,y){return SALT_PEPPER[y%SALT_PEPPER.length][x%13];}
function rearFacing(p,kind){return p.side===1&&['toss','serve'].includes(kind);}
const W=320,H=304,PIXEL=2,Z_SCALE=12,COURT_Y=166,DEPTH=8.4,BODY_WIDTH=.9;
// Only the ground projection grows in depth. Ball height and world physics do not change.
function project(x,y,z=0){const sy=COURT_Y+y*DEPTH,scale=1+y*.006;return {x:150+x*20*scale,y:sy-z*Z_SCALE,scale};}
function unproject(x,y){const wy=(y-COURT_Y)/DEPTH;return{x:(x-150)/(20*(1+wy*.006)),y:wy};}
// Cartoon scale is visual only: collision, landing and rally trajectory stay in XYZ.
function ballVisual(ball){
 const depth=Math.max(.7,Math.min(1.06,.88+ball.y*.012));
 return {...project(ball.x,ball.y,ball.z),radius:(2.2+Math.min(3.6,Math.max(0,ball.z))*1.1)*depth};
}
const skillStyles={
 fire:['#ffd080','불꽃 리턴','다음 리턴에 불꽃을 싣는다'],
 comet:['#bfe8ff','혜성 이동','이번 랠리 · 타격 입력마다 이동'],
 win:['#ffe49a','즉시 승리','뭉치의 특별한 승리'],
 lose:['#f4b6a0','라켓 파손 · 게임 내줌','라켓을 부수고 이번 게임을 내준다'],
 wind:['#d6f1ac','회오리 드롭','이번 랠리 · 모든 리턴에 적용'],
 slow:['#dccbff','느려진 공','이번 랠리 · 상대가 치는 모든 공'],
 drop:['#bce9ca','반대편 드롭','다음 리턴을 상대 반대편으로'],
 dance:['#f8c6e4','상대가 춤춘다','이번 랠리 동안'],
 miss:['#ffe1b1','상대 헛스윙','이번 랠리 · 상대의 모든 리턴'],
 fall:['#ffc7cf','귀여움에 쓰러짐','이번 랠리 끝까지 쓰러진다'],
 vanish:['#d2dbff','사라지는 리턴','다음 리턴이 유효하게 튀면 포인트'],
 serveVanish:['#badff2','사라지는 서브','서비스 박스에 들어가면 포인트'],
 long:['#dff0ac','길어진 팔 · 랠리 내내','횟수 제한 없음 · 타격 입력은 필요'],
 predict:['#fff1a6','바운드 예측','이번 랠리 · 착지 표식을 보자']
};
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
 return {x,y,hand,ux:dx/length,uy:dy/length,angle:Math.atan2(dx,-dy),minor:2.2+2.9*(v.face??.85),major:5.8};
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
 if(walk){const sway=[-1,-2,-1,1,2,1][f],dir=Math.sign(p.moveX||0),bounce=Math.abs(sway)>1?-1:0;v.frame=f;v.lean=dir;
  v.left=[-4,-12,-4+sway,-9-sway];v.face=.8+.05*Math.abs(sway)/2;
  // ROM walk: the head rides behind the shoulder, opposite the run, at head height.
  if(dir){const low=p.id===6?4:0; // Shushu's shoulder sits lower; keep the arm off her face
   v.right=[(2-dir*5)/2,-15+low,-dir*5,-16+low+bounce];v.racket=[-dir*11,-21+low+bounce,'tilt'];}
  else{v.right=[4,-12,4,-10+sway];v.racket=[10,-17+sway,'tilt'];}}
 if(kind==='toss'){
  const n=Math.min(3,Math.floor(t*10));v.frame=n;
  const tossX=Math.round(.65*20*(1+(p.y||0)*.006));
  // The free LEFT arm crosses in front; the RIGHT arm keeps the racket.
  v.left=[[1,-12,tossX,-13],[2,-18,tossX,-22],[1,-20,8,-27],[-3,-17,-4,-21]][n];
  v.right=[[6,-10,9,-7],[5,-12,7,-10],[5,-15,6,-18],[5,-15,6,-18]][n];
  v.racket=[[17,-6,'wide'],[15,-12,'wide'],[6,-26,'upright'],[10,-25,'tilt']][n];v.face=[.85,.5,.22,.35][n];v.lean=n>1?-1:0;v.bob=n===0?1:0;
 }else if(kind==='serve'||kind==='smash'){
  const st=a?.soft?t*.78:t,n=st<.07?0:st<.15?1:st<.28?2:3;v.frame=n;v.lean=[1,2,2,0][n];v.bob=[-1,0,1,0][n];v.face=a?.soft?[.95,.85,.65,.85][n]:[.95,.28,.18,.85][n];
  const contactHeight=(a?.height||2.1)*Z_SCALE,hitY=-Math.round(Math.max(18,Math.min(31,contactHeight)));
  if(kind==='serve'&&n<3)v.lift=-Math.round(Math.max(0,contactHeight-31)*[1,.65,.2][n]);
  const hitX=kind==='serve'?Math.round(.65*20*(1+(p.y||0)*.006)):0;
  v.right=[[kind==='serve'?5:-3,-19,hitX,hitY+8],[5,-17,3,-17],[1,-11,-3,-10],[4,-12,4,-10]][n];
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
 }else if(kind==='break'){
  // 액슬로즈: two overhead slams; the second snaps the head off. t = seconds since the skill.
  const up=t<.30||(t>=.42&&t<.80),down=(t>=.30&&t<.42)||(t>=.80&&t<1.25);
  if(up){const k=Math.min(1,(t<.30?t:t-.42)/.2);v.right=[5,-18,3,-22-2*k];v.left=[-3,-18,1,-22-2*k];v.racket=[2,-31-2*k,'upright'];v.face=.9;v.lean=-1;v.bob=-1;v.feet=[-3,0,-2,-3,3,0,2,-3];}
  else if(down){v.right=[6,-11,9,-6];v.left=[-2,-11,6,-7];v.racket=[16,-1,'wide'];v.face=.9;v.lean=2;v.bob=2;v.feet=[-4,0,-3,-2,4,0,3,-2];}
  else{const shrug=t>=1.9&&t<2.25;v.right=shrug?[5,-15,8,-17]:[4,-11,5,-7];v.left=shrug?[-5,-15,-8,-17]:[-4,-11,-5,-7];v.racket=shrug?[11,-21,'tilt']:[6,-2,'tilt'];v.bob=shrug?0:1;v.lean=0;}
  v.racketState=t<.42?'whole':t<.92?'bent':t<1.7?'stub':'none';v.frame=Math.floor(t*10);
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
 constructor(canvas){this.canvas=canvas;this.g=canvas.getContext('2d');canvas.width=W*PIXEL;canvas.height=H*PIXEL;this.g.imageSmoothingEnabled=false; // 2x backing store: 슈슈 is drawn 1:1 from 동현파
  this.shushu=[false,true].map(back=>{const c=document.createElement('canvas');c.width=28;c.height=45;const g=c.getContext('2d');
   TeShushu.rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(back&&y>=12&&y<21&&'sewbm'.includes(ch))ch='H';const color=TeShushu.colors[ch];if(color){g.fillStyle=color;g.fillRect(x,y,1,1);}}));return c;});
 }
 rect(x,y,w,h,c){const g=this.g;g.fillStyle=c;x=Math.round(x);y=Math.round(y);w=Math.ceil(w);h=Math.ceil(h);
  const t=g.getTransform();
  if(t.b||t.c){g.fillRect(x,y,w,h);return;} // rotated: draw as before
  // snap to device pixels so scaled pixel art has no hairline seams
  const x0=Math.round(t.a*x+t.e),x1=Math.round(t.a*(x+w)+t.e),y0=Math.round(t.d*y+t.f),y1=Math.round(t.d*(y+h)+t.f);
  g.save();g.setTransform(1,0,0,1,0,0);g.fillRect(Math.min(x0,x1),Math.min(y0,y1),Math.abs(x1-x0),Math.abs(y1-y0));g.restore();}
 line(a,b,c,width=1){const g=this.g;g.strokeStyle=c;g.lineWidth=width;g.beginPath();g.moveTo(Math.round(a.x)+.5,Math.round(a.y)+.5);g.lineTo(Math.round(b.x)+.5,Math.round(b.y)+.5);g.stroke();}
 poly(pts,c){const g=this.g;g.fillStyle=c;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fill();}
 worldLine(x,y,x2,y2,c,w=1){this.line(project(x,y),project(x2,y2),c,w);}
 pixels(rows,x,y,pal){rows.forEach((row,j)=>[...row].forEach((ch,i)=>{if(pal[ch])this.rect(x+i,y+j,1,1,pal[ch]);}));}
 pixelLine(x0,y0,x1,y1,color,width=1){
  x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let e=dx+dy;
  for(let n=0;n<90;n++){this.rect(x0,y0,width,width,color);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}
 }
 player(p,time,role='',poseOverride=null,size=1,opt={}){
  const g=this.g,pos=project(p.x,p.y),id=p.id,v=poseFrame(p,poseOverride),rear=opt.rear??rearFacing(p,v.kind),ink=id===6?TeShushu.colors.o:'#343c32',skin=id===4?'#f5efdd':id===6?TeShushu.colors.s:'#e3b797';
  g.save();g.translate(Math.round(pos.x),Math.round(pos.y));g.scale(size,size);g.imageSmoothingEnabled=false;
  this.rect(-4,0,9,1,'#172e3055');
  g.translate(0,v.lift);
  if(v.kind==='fall'){g.rotate(Math.PI/2);g.translate(-6,0);}
  if(opt.longArm&&v.kind==='idle'){ // 울트라롱팔: the racket arm visibly hangs long while the effect lasts
   const wob=this.reducedMotion?0:Math.round(Math.sin(time*6)*1.5);v.right=[11,-12+wob,20,-11-wob];v.racket=[29,-14-wob,'tilt'];
  }
  const feet=v.feet,lean=v.lean,bob=v.bob;
  const limb=(sx,sy,ex,ey,hx,hy,c=skin)=>{this.pixelLine(sx,sy,ex,ey,ink,2);this.pixelLine(ex,ey,hx,hy,ink,2);this.pixelLine(sx,sy,ex,ey,c);this.pixelLine(ex,ey,hx,hy,c);};
  g.save();if(id!==6)g.scale(BODY_WIDTH,1);
  if(id!==6){
   limb(-1,-6,feet[2],feet[3],feet[0],feet[1]-1,ink);limb(1,-6,feet[6],feet[7],feet[4],feet[5]-1,ink);
   this.rect(feet[0]-1,feet[1],3,1,'#f2ead5');this.rect(feet[4]-1,feet[5],3,1,'#f2ead5');
  }else{
   const img=this.shushu[rear?1:0],moving=p.walk&&!['serve','toss'].includes(v.kind);
   g.drawImage(img,0,35,14,10,-7+(moving?Math.sign(feet[0])*1:0),-5+(moving?feet[1]:0),7,5);
   g.drawImage(img,14,35,14,10,(moving?Math.sign(feet[4])*1:0),-5+(moving?feet[5]:0),7,5);
  }
  g.restore();
  g.save();g.translate(lean,bob);
  const shoulder=id===6?-11:-14,L=v.left,R=v.right,armSide=['toss','serve'].includes(v.kind)?p.side:1;
  limb(-2*armSide,shoulder,...L); // far arm behind the body
  g.save();if(id!==6)g.scale(BODY_WIDTH,1);
  if(id===6){const img=this.shushu[rear?1:0];g.drawImage(img,0,0,28,35,-7,-22.5,14,17.5);}
  else {
   this.rect(-3,-15,6,8,ink);this.rect(-2,-14,4,6,id===4?'#f5efdd':Te.PLAYERS[id].color);
   this.rect(-3,-8,6,2,'#eee8d4');if(!rear)this.rect(-1,-14,2,1,'#eee8d4');
   const rows=heads[id].map((row,y)=>[...row].map((ch,x)=>{const c=rear&&ch!=='.'?(id===4?'w':y<row.length-3?'h':'s'):ch;return id===0&&c==='h'?saltPepper(x,y):c;}).join(''));
   if(id===0||id===4){
    const mask=rows.map(row=>row.replace(/[^.]/g,'q')),hp={q:'#9a9685'},hx=-Math.floor(rows[0].length/2);
    for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])this.pixels(mask,hx+dx,-27+dy,hp);
   }
   this.pixels(rows,-Math.floor(rows[0].length/2),id===5?-25:-27,headPalettes[id]);
  }
  g.restore();
  const racketState=opt.hideArm?'none':v.racketState||'whole';
  if(!opt.hideArm)limb(2*armSide,shoulder,...R);
  if(racketState==='stub'){ // snapped shaft: grip plus two jagged splinters
   const rack=racketFrame(v);this.pixelLine(R[2],R[3],R[2]+rack.ux*5,R[3]+rack.uy*5,'#cdb87b',2);this.pixelLine(R[2],R[3],R[2]+rack.ux*2,R[3]+rack.uy*2,'#463f32',2);
   this.rect(R[2]+rack.ux*6-1,R[3]+rack.uy*6-1,1,1,'#f5ecd2');this.rect(R[2]+rack.ux*6+1,R[3]+rack.uy*6,1,1,'#f5ecd2');
  }else if(racketState!=='none'){
   const rack=racketFrame(v),{x:rx,y:ry,minor,major}=rack;
   this.pixelLine(R[2],R[3],rx-rack.ux*6,ry-rack.uy*6,'#cdb87b',2);
   this.pixelLine(R[2],R[3],R[2]+rack.ux*2,R[3]+rack.uy*2,'#463f32',2);
   g.save();g.translate(rx,ry);g.rotate(rack.angle+(racketState==='bent'?.6:0));
   g.beginPath();g.moveTo(-minor*.5,4.5);g.lineTo(0,7.8);g.lineTo(minor*.5,4.5);g.strokeStyle='#eadab3';g.lineWidth=1;g.stroke();
   g.beginPath();g.ellipse(0,0,minor,major,0,0,Math.PI*2);g.fillStyle='#45695c';g.fill();
   g.save();g.clip();g.strokeStyle='#b2c5a5';g.lineWidth=.55;g.beginPath();
   for(let q=-5;q<=5;q+=2){g.moveTo(q,-6);g.lineTo(q,6);g.moveTo(-6,q);g.lineTo(6,q);}g.stroke();g.restore();
   g.beginPath();g.ellipse(0,0,minor,major,0,0,Math.PI*2);g.strokeStyle='#f5ecd2';g.lineWidth=1.25;g.stroke();g.restore();
  }
  g.restore();
  if(role)this.rect(-1,(id===6?-26:id===5?-28:-30)+v.bob,2,1,role==='P'?'#f3d884':'#e9e9dc');
  g.restore();
 }
 umpire(time){
  this.g.save();this.g.translate(0,COURT_Y-158);
  this.rect(291,134,15,4,'#c3b895');this.rect(294,138,2,25,'#c3b895');this.rect(304,138,2,25,'#c3b895');
  for(let y=143;y<162;y+=5)this.rect(296,y,8,1,'#a49677');
  const g=this.g;g.save();g.translate(299,135);
  // Joan: silver helmet, shoulder plates and the small Frankish banner.
  this.rect(-5,-17,9,3,'#d6dbcf');this.rect(-6,-14,11,5,'#8eaaa7');this.rect(-3,-12,5,4,'#dfb594');
  this.rect(-2,-11,1,1,'#303b35');this.rect(1,-11,1,1,'#303b35');this.rect(-5,-8,9,7,'#b9c7bd');
  this.rect(-7,-7,3,4,'#d3d9cc');this.rect(4,-7,3,4,'#d3d9cc');this.rect(-4,-1,3,3,'#3c5350');this.rect(1,-1,3,3,'#3c5350');
  this.rect(9,-24,1,25,'#ae9870');this.rect(10,-23,8,9,'#e5d4a8');this.rect(13,-21,1,5,'#597c9b');this.rect(11,-19,5,1,'#597c9b');g.restore();g.restore();
 }
 draw(m,o={}){
  this.g.setTransform(PIXEL,0,0,PIXEL,0,0);this.g.imageSmoothingEnabled=false;
  this.started=!!o.started; // the player's own face shows only before the first start
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
  const T=m.time,still=this.reducedMotion,eff=m.effects||{},fxAge=m.fx?(still&&m.fx.type==='lose'?2.4:(m.fx.duration||m.fx.ttl)-m.fx.ttl):0;
  const person=p=>{
   const me=p===m.people[0];
   if(me&&m.fx?.type==='lose')return this.player({...p,walk:false,anim:{name:'break',time:fxAge,duration:m.fx.duration,hand:1}},T,'P','break',1,{rear:this.started});
   this.player(p,T,me?'P':'C',null,1,me?{longArm:eff.long>0,hideArm:m.fx?.type==='long',rear:this.started}:{});
  };
  for(const p of visible.filter(p=>p.y<0))person(p);
  const a=project(-5.7,0),b=project(5.7,0),nh=Math.round(Te.NET*Z_SCALE);
  this.rect(a.x,a.y-nh,b.x-a.x,nh,'#273f3ad9');
  for(let x=a.x+2;x<b.x;x+=3)this.line({x,y:a.y-nh+1},{x,y:a.y},'#a8b4a26f');
  for(let y=a.y-nh+2;y<a.y;y+=3)this.line({x:a.x,y},{x:b.x,y},'#a8b4a26f');
  this.rect(a.x-1,a.y-nh,b.x-a.x+2,2,'#eee9d7');this.rect(a.x-2,a.y-nh-1,3,nh+4,'#d1c6a8');this.rect(b.x,a.y-nh-1,3,nh+4,'#d1c6a8');
  this.umpire(m.time);
  for(const p of visible.filter(p=>p.y>=0))person(p);
  this.states(m);
  if(m.ball){
   const ball=m.ball,shadow=project(ball.x,ball.y),pos=ballVisual(ball),r=pos.radius;
   const groundRadius=ballVisual({...ball,z:0}).radius;
   g.fillStyle='#203832a8';g.beginPath();g.ellipse(shadow.x,shadow.y,groundRadius*1.15,groundRadius*.4,0,0,Math.PI*2);g.fill();
   // Where the ball was i frames ago, from its own flight; trails never bend the real path.
   const past=tau=>ballVisual({x:ball.x-ball.vx*tau,y:ball.y-ball.vy*tau,z:Math.max(0,ball.z-ball.vz*tau-.5*Te.G*tau*tau)});
   const ghostServe=ball.serve&&ball.by===0&&m.hasPrepared('serveVanish'),power=ghostServe?'vanish':ball.power;
   if(power==='fire'){
    for(let i=9;i>=1;i--){const q=past(i*.016),sz=7-i*.55,j=still?0:Math.sin(T*40+i*1.7)*1.5;this.rect(q.x-sz/2+j,q.y-sz/2,sz,sz,['#fff2a8','#f7b84a','#e7823c','#ce4a3a'][Math.min(3,i>>1)]);}
    g.strokeStyle='#ffd080';g.lineWidth=1;g.beginPath();g.arc(pos.x,pos.y,r+2.5,0,Math.PI*2);g.stroke();
   }else if(power==='wind'){
    g.strokeStyle='#e7f6c4';g.lineWidth=1;for(let j=0;j<3;j++){const a=(still?0:T*9)+j*2.1;g.beginPath();g.arc(pos.x,pos.y,r+3+j*2,a,a+1.9);g.stroke();}
    for(let i=1;i<6;i++){const q=past(i*.03);this.rect(q.x+(i%2?3:-4),q.y,3,1,'#d6f1ac');}
   }else if(power==='drop'){
    for(let i=1;i<8;i++){const q=past(i*.028);this.rect(q.x-1,q.y-1,2,2,i%2?'#bce9ca':'#f5efdd');}
   }else if(power==='vanish'){
    for(let i=1;i<7;i++){const q=past(i*.03),tw=still?0:Math.round(Math.sin(T*18+i*2));this.rect(q.x-2+tw,q.y,5,1,'#d2dbff');this.rect(q.x+tw,q.y-2,1,5,'#d2dbff');}
    g.strokeStyle='#d2dbff';g.setLineDash([2,2]);g.beginPath();g.arc(pos.x,pos.y,r+3,0,Math.PI*2);g.stroke();g.setLineDash([]);
   }
   if(ball.slow){
    for(let i=3;i>=1;i--){const q=past(i*.07);g.globalAlpha=.34-i*.08;g.fillStyle='#dccbff';g.beginPath();g.arc(q.x,q.y,q.radius,0,Math.PI*2);g.fill();}g.globalAlpha=1;
    g.strokeStyle='#dccbff';g.lineWidth=1;g.beginPath();g.arc(pos.x,pos.y,r+3,0,Math.PI*2);g.stroke();g.beginPath();g.arc(pos.x,pos.y,r+6,0,Math.PI*2);g.stroke();
    const a=still?-.6:T*1.6;g.beginPath();g.moveTo(pos.x,pos.y-r-6);g.lineTo(pos.x,pos.y-r-8);g.moveTo(pos.x,pos.y);g.lineTo(pos.x+Math.cos(a)*(r+5),pos.y+Math.sin(a)*(r+5));g.stroke();
   }
   const dim=power==='vanish'&&!still&&Math.sin(T*30)>0;
   g.globalAlpha=dim?.45:1;g.beginPath();g.arc(pos.x,pos.y,r,0,Math.PI*2);g.fillStyle=power==='fire'?'#ffb347':'#f6db72';g.fill();g.strokeStyle='#394b32';g.lineWidth=1;g.stroke();
   g.save();g.clip();g.beginPath();g.arc(pos.x-r*.65,pos.y,r*.85,-1.25,1.25);g.strokeStyle='#fff8cf';g.lineWidth=1;g.stroke();
   g.beginPath();g.arc(pos.x-r*.3,pos.y-r*.35,Math.max(.8,r*.2),0,Math.PI*2);g.fillStyle='#ffffe3';g.fill();g.restore();g.globalAlpha=1;
  }
  if(m.fx)this.effect(m,fxAge);
 }
 spark(x,y,r,c){this.rect(x-r,y,r*2+1,1,c);this.rect(x,y-r,1,r*2+1,c);}
 glyph(rows,x,y,c){this.pixels(rows,Math.round(x)-(rows[0].length>>1),Math.round(y)-(rows.length>>1),{x:c});}
 heart(x,y,c){this.glyph(['.x.x.','xxxxx','xxxxx','.xxx.','..x..'],x,y,c);}
 note(x,y,c){this.glyph(['..xxx','..x.x','..x..','xxx..','xxx..'],x,y,c);}
 // Persistent skill states: what is prepared, what is running, and what it has left.
 states(m){
  const g=this.g,T=m.time,still=this.reducedMotion,e=m.effects||{},me=m.people[0],cpu=m.people[1],a=project(me.x,me.y),o=project(cpu.x,cpu.y);
  const live=!['point','match'].includes(m.phase),beat=still?0:Math.sin(T*8),fx=m.fx,age=fx?(fx.duration||fx.ttl)-fx.ttl:0;
  g.save();g.lineWidth=1;
  if(m.armed&&live){ // 준비한 기술: ring under my feet until the stroke that spends it
   const c=skillStyles[m.armed][0];g.strokeStyle=c;
   g.beginPath();g.ellipse(a.x,a.y+1,11+beat,3.5+beat*.3,0,0,Math.PI*2);g.stroke();
   g.setLineDash([2,3]);g.lineDashOffset=still?0:-T*14;g.beginPath();g.ellipse(a.x,a.y+1,15,5,0,0,Math.PI*2);g.stroke();g.setLineDash([]);
   for(let j=0;j<5;j++){const ph=still?(j+1)/6:(T*.9+j/5)%1;g.globalAlpha=1-ph;this.rect(a.x-12+j*6,a.y-1-ph*18,1,2,c);}g.globalAlpha=1;
  }
  if(e.long>0&&live){ // Continuous rally effect, not a decreasing charge counter.
   for(let j=0;j<3;j++){const x=a.x-7+j*5,y=a.y+5;this.rect(x-1,y-1,5,5,'#203a32');this.rect(x,y,3,3,skillStyles.long[0]);}
  }
  if(fx?.type==='long'&&Number.isFinite(fx.toX)){ // the arm really stretches to where the ball was met
   const k=still?1:Math.min(1,age/.1)*Math.min(1,fx.ttl/.16),sh={x:a.x+2,y:a.y-11},to=project(fx.toX,fx.toY,fx.toZ||1);
   const hx=sh.x+(to.x-sh.x)*k,hy=sh.y+(to.y-sh.y)*k,len=Math.hypot(hx-sh.x,hy-sh.y)||1,ux=(hx-sh.x)/len,uy=(hy-sh.y)/len;
   g.lineCap='round';g.strokeStyle=TeShushu.colors.o;g.lineWidth=4;g.beginPath();g.moveTo(sh.x,sh.y);g.lineTo(hx,hy);g.stroke();
   g.strokeStyle=TeShushu.colors.s;g.lineWidth=2;g.beginPath();g.moveTo(sh.x,sh.y);g.lineTo(hx,hy);g.stroke();g.lineCap='butt';
   for(let d=7;d<len-3;d+=7)this.rect(sh.x+ux*d-1,sh.y+uy*d-1,2,2,skillStyles.long[0]); // stretch marks
   g.translate(hx+ux*6,hy+uy*6);g.rotate(Math.atan2(ux,-uy));
   g.beginPath();g.ellipse(0,0,4.5,5.8,0,0,Math.PI*2);g.fillStyle='#45695c';g.fill();g.strokeStyle='#f5ecd2';g.lineWidth=1.25;g.stroke();
   g.setTransform(PIXEL,0,0,PIXEL,0,0);g.lineWidth=1;
   this.spark(to.x,to.y,3+(still?0:Math.round(age*10)),skillStyles.long[0]);
  }
  if(e.predict){ // 리만가설: the flight still to come, and a large mark where it lands
   const pr=m.predict(),b=m.ball;
   if(pr&&b){
    const q=project(pr.x,pr.y),c=skillStyles.predict[0],r=still?0:(T*1.8)%1;
    for(let j=1;j<10;j++){const t=pr.t*j/10,d=project(b.x+b.vx*t,b.y+b.vy*t,Math.max(0,b.z+b.vz*t-.5*Te.G*t*t));this.rect(d.x,d.y,1,1,c);}
    g.strokeStyle=c;g.beginPath();g.ellipse(q.x,q.y,8,3,0,0,Math.PI*2);g.stroke();
    g.globalAlpha=1-r;g.beginPath();g.ellipse(q.x,q.y,8+r*8,3+r*3,0,0,Math.PI*2);g.stroke();g.globalAlpha=1;
    this.rect(q.x-14,q.y,5,1,c);this.rect(q.x+10,q.y,5,1,c);this.rect(q.x,q.y-7,1,3,c);this.rect(q.x,q.y+5,1,3,c);this.rect(q.x-1,q.y-1,3,3,'#fffbe2');
    this.glyph(['xxxxxxx','.xxxxx.','..xxx..','...x...'],q.x,q.y-13-(still?0:Math.abs(Math.sin(T*7))*4),c);
   }
  }
  if(e.dance&&live)for(let j=0;j<3;j++){const ph=still?(j+1)/4:(T*.8+j/3)%1;g.globalAlpha=1-ph*.7;this.note(o.x-11+j*11+Math.sin(ph*6+j)*2,o.y-27-ph*12,j%2?skillStyles.dance[0]:'#fff0b9');}
  g.globalAlpha=1;
  if(e.miss&&live){ // 멍멍 is waiting for the opponent's next swing
   if(still||Math.sin(T*10)>-.4){this.glyph(['x.x.x','x.x.x','.....','.xxx.','xxxxx','.xxx.'],o.x+11,o.y-27,skillStyles.miss[0]);this.glyph(['x','x','x','.','x'],o.x-11,o.y-27,skillStyles.miss[0]);}
  }
  if(e.whiff>0){ // the swing that found nothing
   g.strokeStyle=skillStyles.miss[0];for(let j=0;j<3;j++){g.beginPath();g.arc(o.x,o.y-12,11+j*4,-.4+j*.2,.9+j*.2);g.stroke();g.beginPath();g.arc(o.x,o.y-12,11+j*4,Math.PI-.9-j*.2,Math.PI+.4-j*.2);g.stroke();}
   for(let j=0;j<3;j++)this.glyph(['.x.','xxx','xxx'],o.x-13+j*13,o.y-29+(j%2)*3,'#bfe8ff');
  }
  if(e.fall>0){ // Rally duration, not a four-second countdown.
   for(let j=0;j<3;j++){const ph=still?(j+1)/4:(T*.7+j/3)%1;g.globalAlpha=1-ph*.7;this.heart(o.x-10+j*10,o.y-13-ph*13,skillStyles.fall[0]);}g.globalAlpha=1;
   for(let j=0;j<4;j++){this.rect(o.x-11+j*6,o.y+4,5,4,'#203a32');this.rect(o.x-10+j*6,o.y+5,3,2,skillStyles.fall[0]);}
  }
  g.restore();
 }
 // Short results of a skill. Everything is local to the court; the camera and the frame stay put.
 effect(m,age){
  const g=this.g,fx=m.fx,T=m.time,still=this.reducedMotion,me=m.people[0],a=project(me.x,me.y),fade=Math.min(1,fx.ttl/.3);
  const at=Number.isFinite(fx.x)?project(fx.x,fx.y):a,c=(skillStyles[fx.type]||skillStyles.fire)[0];
  g.save();g.lineWidth=1;
  if(fx.type==='wall'){
   const p=m.people[1],t=still?1:Math.min(1,age/.42),edge=p.x<0?-5.9:5.9,x=p.x+(edge-p.x)*t,w=project(edge,p.y);
   for(let j=0;j<7;j++){const q=project(p.x+(x-p.x)*j/7,p.y);g.globalAlpha=fade*(.3+j*.1);this.rect(q.x-2,q.y-13+(j%3)*4,5,3,j%2?'#e7823c':'#f7b84a');}g.globalAlpha=1;
   this.player({...p,x,pose:'fall'},T,'','fall');
   if(t===1){
    const s=still?1:Math.min(1,(age-.42)/.22);g.strokeStyle='#ffd080';g.globalAlpha=fade;
    for(let j=0;j<10;j++){const an=j*Math.PI/5+.2,r0=4+s*4,r1=8+s*11;g.beginPath();g.moveTo(w.x+Math.cos(an)*r0,w.y-10+Math.sin(an)*r0*.8);g.lineTo(w.x+Math.cos(an)*r1,w.y-10+Math.sin(an)*r1*.8);g.stroke();}
    const drop=still?5:(age-.42)*16;for(let j=0;j<11;j++)this.rect(w.x-10+(j*7)%21,w.y-20+(j*11)%20+drop*(.4+(j%3)*.3),2,2,j%2?'#b44d4a':'#e7a94a');
    for(let j=0;j<3;j++)this.spark(x*0+project(x,p.y).x-8+j*8,w.y-24-(still?0:Math.sin(T*9+j)*2),2,'#fff2a8'); // dizzy stars
   }
  }else if(fx.type==='comet'){
   const b=project(fx.toX,fx.toY),k=still?1:Math.min(1,age/.18);g.globalAlpha=fade;
   for(let j=-2;j<=2;j++)this.line({x:at.x,y:at.y-10+j*3},{x:at.x+(b.x-at.x)*k,y:b.y-10+j*3},j?'#8fc9e8':'#f1fbff',j?1:2);
   for(let j=0;j<8;j++){const t=j/8;this.spark(at.x+(b.x-at.x)*t,at.y+(b.y-at.y)*t-10+((j*5)%9-4),j%3?1:2,j%2?'#bfe8ff':'#ffffff');}
   if(!still)for(const [t,al] of [[.25,.22],[.6,.38]]){g.globalAlpha=al*fade;this.player({...me,x:fx.x+(fx.toX-fx.x)*t,y:fx.y+(fx.toY-fx.y)*t,walk:false,anim:null},T,'',null,1,{rear:this.started});}
  }else if(fx.type==='fire'){
   g.globalAlpha=fade;for(let j=0;j<11;j++){const h=7+((j*5)%7)+(still?0:Math.sin(T*22+j*1.9)*4),x=at.x-13+j*2.6;this.rect(x,at.y-h,2,h,'#ce4a3a');this.rect(x,at.y-h*.7,2,h*.7,'#e7823c');this.rect(x,at.y-h*.38,2,h*.38,'#ffd080');}
  }else if(fx.type==='wind'){
   g.globalAlpha=fade;g.strokeStyle='#e7f6c4';const spin=still?0:T*8;
   for(let j=0;j<5;j++){g.beginPath();g.ellipse(at.x,at.y-3-j*5,5+j*3,1.6+j*.7,0,spin+j,spin+j+4.2);g.stroke();}
   for(let j=0;j<5;j++){const an=spin*.7+j*1.3;this.rect(at.x+Math.cos(an)*(8+j*3),at.y-6-j*4+Math.sin(an)*2,2,1,c);}
  }else if(fx.type==='drop'&&fx.end){ // 톡: the ball dies where it lands
   for(let j=0;j<3;j++){const r=still?.4+j*.25:(age*1.3+j/3)%1;g.globalAlpha=(1-r)*fade;g.strokeStyle=c;g.beginPath();g.ellipse(at.x,at.y,4+r*14,1.5+r*5,0,0,Math.PI*2);g.stroke();}
   g.globalAlpha=fade;const hop=still?0:Math.abs(Math.sin(age*9))*5*Math.max(0,1-age/.9);g.fillStyle='#f6db72';g.beginPath();g.arc(at.x,at.y-2-hop,2.5,0,Math.PI*2);g.fill();
   this.glyph(['x...x','.x.x.','..x..'],at.x,at.y-12-hop,c);
  }else if(fx.type==='drop'){
   g.globalAlpha=fade;for(let j=0;j<3;j++)this.glyph(['x...x','.x.x.','..x..'],at.x+13,at.y-24+j*5+(still?0:(age*14)%5),j===2?'#f5efdd':c);
  }else if(fx.type==='vanish'&&fx.end){ // 펑: the ball is simply gone
   const r=still?.5:Math.min(1,age/.5);g.globalAlpha=(1-r*.8)*fade;g.fillStyle='#e9edff';
   for(let j=0;j<7;j++){const an=j*Math.PI*2/7;g.beginPath();g.arc(at.x+Math.cos(an)*(3+r*11),at.y-3+Math.sin(an)*(2+r*6),4-r*2,0,Math.PI*2);g.fill();}
   g.globalAlpha=fade;g.strokeStyle=c;g.setLineDash([2,2]);g.beginPath();g.arc(at.x,at.y-3,3.5,0,Math.PI*2);g.stroke();g.setLineDash([]);
   for(let j=0;j<6;j++){const an=j*Math.PI/3+.5,d=8+r*12;this.spark(at.x+Math.cos(an)*d,at.y-3+Math.sin(an)*d*.6,j%2?1:2,j%2?c:'#ffffff');}
  }else if(fx.type==='vanish'){
   g.globalAlpha=fade;for(let j=0;j<7;j++){const an=j*.9+(still?0:T*3),d=10+(j%3)*4;this.spark(at.x+Math.cos(an)*d,at.y-12+Math.sin(an)*d*.7,j%2?1:2,j%2?c:'#ffffff');}
  }else if(fx.type==='win'){
   const cols=['#ffe49a','#f8c6e4','#bfe8ff','#d6f1ac','#ffc7cf','#fff8d8'];
   for(let j=0;j<70;j++){const sp=34+(j%7)*9,x=(j*47+13)%W+(still?0:Math.sin(T*3+j)*3),y=still?(j*29)%H:((j*29)%H+age*sp)%H;this.rect(x,y,j%3?2:3,j%2?2:1,cols[j%6]);}
   const y=a.y-(me.id===0?37:35)-(still?0:Math.abs(Math.sin(T*5))*2);
   this.glyph(['x..x..x','xx.x.xx','xxxxxxx','xxxxxxx'],a.x,y,'#ffe49a');this.rect(a.x-3,y+1,1,1,'#ce6244');this.rect(a.x,y+1,1,1,'#597c9b');this.rect(a.x+3,y+1,1,1,'#ce6244');
   g.strokeStyle='#ffe49a';for(let j=0;j<8;j++){const an=j*Math.PI/4+(still?0:T*1.2),r0=17,r1=22+(j%2)*4;g.beginPath();g.moveTo(a.x+Math.cos(an)*r0,a.y-13+Math.sin(an)*r0*.8);g.lineTo(a.x+Math.cos(an)*r1,a.y-13+Math.sin(an)*r1*.8);g.stroke();}
  }else if(fx.type==='lose')this.breakRacket(a,age,me.id===0?-28:-26);
  g.restore();
 }
 // 액슬로즈: raise, slam (the frame bends), raise, slam again — the head snaps off and stays on the court.
 breakRacket(a,t,headY){
  const g=this.g,still=this.reducedMotion,dir=a.x>244?-1:1,ix=a.x+17,iy=a.y,red='#ef6a5c',wood='#cdb87b',cream='#f5ecd2';
  if(t<.30||(t>=.42&&t<.80)){ // anger mark and shaking lines while the racket is overhead
   const s=still?0:Math.round(Math.sin(t*60));this.glyph(['.x..x.','xx..xx','......','......','xx..xx','.x..x.'],a.x-10+s,a.y+headY-5,red);
   for(let j=0;j<3;j++)this.rect(a.x+9+j*3,a.y+headY-9-j*2+s,1,3,red);
  }
  if((t>=.30&&t<.47)||(t>=.80&&t<.97)){ // downward swish
   g.strokeStyle=cream;g.lineWidth=1;for(let j=0;j<3;j++){g.beginPath();g.arc(a.x+3,a.y-12,17+j*3,-1.35,-.05+j*.04);g.stroke();}
  }
  if(t>=.42){ // first impact: dust, and cracks in the court that stay until the next point
   const d=t-.42;if(d<.5){g.fillStyle='#e9e2c9';for(let j=0;j<6;j++){const an=Math.PI+j*Math.PI/5;g.globalAlpha=Math.max(0,.75-d*1.5);g.beginPath();g.arc(ix+Math.cos(an)*(5+d*26),iy-1+Math.sin(an)*(2+d*12),3.2-d*3,0,Math.PI*2);g.fill();}g.globalAlpha=1;}
   this.pixelLine(ix-6,iy+1,ix-1,iy,'#2a3a33');this.pixelLine(ix,iy,ix+5,iy+2,'#2a3a33');
  }
  if(t>=.92){
   const d=t-.92;
   this.pixelLine(ix-1,iy,ix-4,iy+4,'#2a3a33');this.pixelLine(ix+1,iy,ix+7,iy-2,'#2a3a33');this.pixelLine(ix-9,iy+2,ix-13,iy+1,'#2a3a33');
   if(d<.28){ // crack star at the snap
    const s=d/.28;g.strokeStyle='#fff2a8';g.lineWidth=2;for(let j=0;j<8;j++){const an=j*Math.PI/4+.3,r0=3+s*5,r1=7+s*13;g.beginPath();g.moveTo(ix+Math.cos(an)*r0,iy-4+Math.sin(an)*r0*.8);g.lineTo(ix+Math.cos(an)*r1,iy-4+Math.sin(an)*r1*.8);g.stroke();}g.lineWidth=1;
    this.spark(ix,iy-4,4,'#ffffff');
   }
   // Eight splinters and strings: thrown out, then left lying where they land.
   for(let j=0;j<8;j++){
    const vx=(j-3.5)*13,vy=46+(j*17)%30,land=.42+(j%4)*.07,q=Math.min(d,land),gr=2*vy/land;
    const x=ix+vx*q,y=iy+((j*5)%7-2)*(q/land)-(vy*q-.5*gr*q*q);
    this.rect(x,y,j%3?2:3,j%2?1:2,j%2?wood:cream);
   }
   // The racket head spins away and comes to rest.
   const land=.55,q=Math.min(d,land),hx=ix+dir*30*q/land,hy=iy-3-(92*q-.5*(2*92/land)*q*q),rot=d<land?dir*d*13:dir*1.25;
   g.save();g.translate(hx,hy);if(d>=land)g.scale(1,.62);g.rotate(rot);
   g.beginPath();g.ellipse(0,0,4.6,5.8,0,0,Math.PI*2);g.fillStyle='#45695c';g.fill();
   g.save();g.clip();g.strokeStyle='#b2c5a5';g.lineWidth=.55;g.beginPath();for(let k=-5;k<=5;k+=2){g.moveTo(k,-6);g.lineTo(k,6);g.moveTo(-6,k);g.lineTo(6,k);}g.stroke();
   g.strokeStyle='#203a32';g.lineWidth=1;g.beginPath();g.moveTo(-5,-2);g.lineTo(-1,0);g.lineTo(-3,3);g.lineTo(2,5);g.stroke();g.restore(); // torn strings
   g.beginPath();g.ellipse(0,0,4.6,5.8,0,0,Math.PI*2);g.strokeStyle=cream;g.lineWidth=1.25;g.stroke();
   g.beginPath();g.moveTo(-2,5);g.lineTo(-1,8);g.lineTo(0,6);g.lineTo(1,9);g.lineTo(2,5);g.strokeStyle='#eadab3';g.lineWidth=1;g.stroke();g.restore();
   if(d>=land&&d<land+.3){g.fillStyle='#e9e2c9';g.globalAlpha=.6-(d-land)*2;for(const s of [-1,1]){g.beginPath();g.arc(hx+s*(6+(d-land)*14),hy+1,2,0,Math.PI*2);g.fill();}g.globalAlpha=1;}
  }
  if(t>=1.7){ // the grip is dropped too
   const d=Math.min(1,(t-1.7)/.16),x=a.x+7,y=a.y-7+8*d*d;this.pixelLine(x-3,y,x+3,y-1,wood,2);this.rect(x-3,y,2,2,'#463f32');this.rect(x+4,y-2,1,1,cream);
  }
  if(t>=1.25){ // deflated: a sigh drifting off
   const d=still?.5:((t-1.25)*.9)%1;g.globalAlpha=1-d;g.strokeStyle='#d9e2d2';g.lineWidth=1;g.beginPath();g.arc(a.x-9-d*5,a.y+headY+4-d*7,2+d*2,0,Math.PI*2);g.stroke();g.globalAlpha=1;
  }
 }
 skillBurst(m){
  const q=m.skillCue;if(!q)return;
  const g=this.g,s=skillStyles[q.kind],age=q.duration-q.ttl;
  const target=['dance','miss','fall'].includes(q.kind)?m.people[1]:m.people[0];
  const p=project(target.x,target.y),t=this.reducedMotion?.35:Math.min(1,age/.8);
  g.save();g.globalAlpha=Math.min(1,q.ttl/.25);
  g.strokeStyle=s[0];g.fillStyle=s[0];g.lineWidth=1.4;
  // Small local effects only; never move the camera or cover the ball with a flash.
  // Frame cue: a coloured edge that pulses twice. No flash, no shake, nothing over the court.
  {const pulse=this.reducedMotion?.7:age<.9?Math.abs(Math.sin(age/.9*Math.PI*2)):0,al=g.globalAlpha;
   if(pulse>0){g.globalAlpha=al*pulse;g.lineWidth=3;g.strokeRect(1.5,1.5,W-3,H-3);
    for(const [x,y,sx,sy] of [[5,5,1,1],[W-5,5,-1,1],[5,H-5,1,-1],[W-5,H-5,-1,-1]]){this.rect(sx>0?x:x-12,sy>0?y:y-3,12,3,s[0]);this.rect(sx>0?x:x-3,sy>0?y:y-12,3,12,s[0]);}
    g.globalAlpha=al;g.lineWidth=1.4;}}
  if(!this.reducedMotion){
   for(let j=0;j<14;j++){
    const a=j*Math.PI/7+(q.kind==='wind'?t*3:0),r=(j%2?8:12)+t*(j%2?24:16);
    const x=p.x+Math.cos(a)*r,y=p.y-12+Math.sin(a)*r*.6;
    if(j%2)this.spark(x,y,1,'#fffbe2');else this.rect(x,y,2,2,s[0]);
   }
   g.beginPath();g.ellipse(p.x,p.y+1,7+t*11,2+t*3,0,0,Math.PI*2);g.stroke();
   const t2=Math.max(0,Math.min(1,(age-.18)/.8));if(t2>0&&t2<1){g.globalAlpha*=1-t2;g.beginPath();g.ellipse(p.x,p.y+1,7+t2*16,2+t2*4.5,0,0,Math.PI*2);g.stroke();g.globalAlpha=Math.min(1,q.ttl/.25);}
   // a column of light on the player who is affected
   g.globalAlpha=.16*Math.min(1,q.ttl/.25)*(1-t);g.fillRect(p.x-9,p.y-34,18,35);g.globalAlpha=Math.min(1,q.ttl/.25);
  }
  // Opponent emblem sits beside the feet, clear of the upper announcement on small screens.
  const upper=target.y<0;
  g.translate(Math.max(18,Math.min(302,p.x+(p.x>160?-24:24))),Math.max(22,p.y+(upper?2:-27)-(this.reducedMotion||upper?0:t*4)));
  g.scale(1.25,1.25);
  g.fillStyle='#203a32';g.beginPath();g.arc(0,0,10,0,Math.PI*2);g.fill();g.stroke();g.beginPath();g.arc(0,0,12,0,Math.PI*2);g.globalAlpha*=.55;g.stroke();g.globalAlpha=Math.min(1,q.ttl/.25);
  const line=(pts)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
  const ring=(x,y,r)=>{g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();};
  g.fillStyle=s[0];
  switch(q.kind){
   case 'fire':line([[-5,5],[-6,0],[-2,-5],[-1,-1],[3,-7],[5,0],[4,5],[-5,5]]);break;
   case 'comet':ring(3,2,3);line([[-7,-6],[0,0]]);line([[-7,-1],[-2,3]]);break;
   case 'win':line([[-6,-4],[-3,0],[0,-6],[3,0],[6,-4],[5,5],[-5,5],[-6,-4]]);break;
   case 'lose':{ // whole racket until the second blow lands, then the same racket in two pieces
    const broken=this.reducedMotion||age>=.92,k=broken?Math.min(1,this.reducedMotion?1:(age-.92)/.25):0;
    line([[-7,6],[-2-k,1+k]]);
    g.save();g.translate(k*1.5,-k*1.5);g.rotate(k*.35);g.beginPath();g.ellipse(3,-3,3,4.2,.8,0,Math.PI*2);g.stroke();line([[1,-5],[5,-1]]);line([[4,-6],[1,0]]);if(!broken)line([[-2,1],[1,-1]]);else line([[0,0],[1,-1]]);g.restore();
    if(broken){line([[-3,-1],[-1,0],[-2,2],[0,3]]);this.rect(-5,-5,1,1,s[0]);this.rect(6,4,1,1,s[0]);this.rect(-1,-7,1,1,s[0]);}
    break;}
   case 'wind':for(let j=0;j<3;j++){g.beginPath();g.arc(0,0,2+j*2,t*4+j,t*4+j+4);g.stroke();}break;
   case 'slow':ring(0,0,6);line([[0,-4],[0,0],[4,2]]);break;
   case 'drop':line([[-5,-4],[0,5],[5,-4]]);line([[-5,6],[5,6]]);break;
   case 'dance':line([[-3,4],[-3,-4],[4,-6],[4,2]]);ring(-5,4,2);ring(2,3,2);break;
   case 'miss':g.beginPath();g.ellipse(0,3,4,3,0,0,7);g.fill();for(const x of [-5,0,5]){g.beginPath();g.arc(x,-3,1.7,0,7);g.fill();}break;
   case 'fall':line([[0,6],[-6,0],[-6,-4],[-3,-6],[0,-3],[3,-6],[6,-4],[6,0],[0,6]]);break;
   case 'vanish':case 'serveVanish':line([[-5,6],[-5,-3],[-2,-6],[2,-6],[5,-3],[5,6],[2,3],[0,6],[-2,3],[-5,6]]);this.rect(-3,-2,1,2,s[0]);this.rect(2,-2,1,2,s[0]);if(q.kind==='serveVanish')line([[7,2],[7,-5]]);break;
   case 'long':line([[-7,4],[-3,4],[0,-1],[4,-1],[6,-4]]);ring(5,-4,2);break;
   case 'predict':ring(0,0,5);ring(0,0,2);line([[-8,0],[-4,0]]);line([[4,0],[8,0]]);line([[0,-8],[0,-4]]);line([[0,4],[0,8]]);break;
  }
  g.restore();
 }
 portrait(id,size=52){
  const cv=document.createElement('canvas');cv.width=32*PIXEL;cv.height=32*PIXEL;const old=this.g;this.g=cv.getContext('2d');this.g.imageSmoothingEnabled=false;
  this.g.scale(PIXEL,PIXEL);this.g.translate(-134,28-COURT_Y);this.player({id,x:0,y:0,side:-1,pose:'idle',cool:0},0,'',null,1);this.g=old;return cv.toDataURL();
 }
}
window.TeRender={Renderer,project,unproject,poseFrame,ballVisual,racketFrame,viewMatch,skillStyles,heads,headPalettes,rearFacing};
})();

/* 동현테 큰 그림 선수: 슈슈(동현파 원본), 이삐(새 그림), 빽빽(슈슈 그림에서 머리·옷 색만 바꿈).
   각 줄은 28칸이고 마지막 10줄은 걸을 때 따로 움직이는 다리·신발이다. */
(function(root){
'use strict';
const shu=typeof module==='object'&&module.exports?require('./shushu.js'):root.TeShushu;
// 이삐: 꽥꽥 키(50줄 = 25px), 슈슈의 눈·볼·입을 그대로 쓰고 머리만 턱선 단발이다.
const ippi=[
 '..........oooooooo..........','........ooHHHHHHHHoo........','......ooHHHhhHHHHHHHoo......','.....oHHHhhHHHHHHHHHHHo.....',
 '....oHHHhHHHHHHHHHHHHHHo....','...oHHHHHHHHHHHHHHHHHHHHo...','...oHHHHHHHHHHHHHHHHHHHHo...','...oHHHHHHHHHHHHHHHHHHHHo...',
 '...oHHHHHHHHHHHHHHHHHHHHo...','...oHHHHHHHHHHHHHHHHHHHHo...',
 '...oHHHHHHHHHHHHHHHHHHHHo...','...oHHHHHHHHHHHHHHHHHHHHo...','...oHHHHsssHHHssssHHHHHHo...','...oHHsswesssswessssHHHHo...',
 '...oHHsseesssseessssHHHHo...','...oHHsseesssseessssHHHHo...','...oHHbbssssssssbbssHHHHo...','...oHHHssssmmssssssHHHHHo...',
 '...oHHHHsssssssssssHHHHHo...','...oHHHHosssssssssoHHHHHo...','....oooo.oossssssoo.ooooo...','...........osssso...........',
 '..........oossssoo..........','.........oDccccccDo.........','.........oDDDccDDDo.........','.........oDDDDDDDDo.........',
 '.........oDDDDDDDDo.........','.........oDDDDDDDDo.........','........oDyyyyyyyyDo........','........oDDDDDDDDDDo........',
 '.......oDDdDDDDDDdDDo.......','.......oDDdDDDDDDdDDo.......','......oDDDdDDDDDDdDDDo......','......oDDDdDDDDDDdDDDo......',
 '......oDDDdDDDDDDdDDDo......','.....oDDDDdDDDDDDdDDDDo.....','.....oDDDDdDDDDDDdDDDDo.....',
 '.....oooooooooooooooooo.....','.........osso..osso.........','.........osso..osso.........',
 '.........osso..osso.........','.........osso..osso.........','.........osso..osso.........','.........osso..osso.........',
 '.........osso..osso.........','.........osso..osso.........','.......ooRLLRooRLLRoo.......','......orRRRRRoorRRRRRo......',
 '......oWWWWWWooWWWWWWWo.....','.......ooooooo.ooooooo......'
];
// 빽빽: 슈슈 그림의 양갈래 머리 8줄을 정수리 똥머리 12줄로 바꾼다. 얼굴·몸은 같은 줄을 쓴다.
const bun=[
 '............oooo............','..........ooHHHHoo..........','.........oHHhHHHHHo.........','.........oHhHHHHHHo.........',
 '.........oHHHHHHHHo.........','..........oHHHHHHo..........','...........oBBBBo...........','...........oHHHHo...........',
 '..........oHHHHHHo..........','.........oHHhhHHHHHo........','........oHhhHHHHHHHHo.......','.......oHHHHHHHHHHHHo.......'
];
const sprites={
 6:{rows:shu.rows,colors:shu.colors,face:[12,20],shoulder:-11,low:4,mark:-26},
 7:{rows:ippi,colors:{...shu.colors,H:'#3d302b',h:'#66503f',D:'#6fa9bf',d:'#4f879e',y:'#f4e8cd',R:'#edc776',r:'#c99a45',L:'#f6dc9a'},face:[12,19],
    back:{19:'...oHHHHHHHHHHHHHHHHHHHHo...',20:'....oooooooooooooooooooo....'},shoulder:-13,low:0,mark:-28},
 8:{rows:[...bun,...shu.rows.slice(8)],colors:{...shu.colors,D:'#9a86c4',d:'#7663a3',y:'#f1dfa0',R:'#7663a3',r:'#584880',B:'#edc776'},face:[16,24],shoulder:-11,low:4,mark:-28}
};
for(const s of Object.values(sprites))for(const row of s.rows)if(row.length!==28)throw new Error('sprite row width');
// 화면 밖 캔버스에 앞·뒷모습을 한 번씩 그려 둔다. 뒷모습은 얼굴 칸을 머리카락으로 덮는다.
function build(doc){const out={};
 for(const [id,s] of Object.entries(sprites))out[id]=[false,true].map(rear=>{const c=doc.createElement('canvas');c.width=28;c.height=s.rows.length;const g=c.getContext('2d');
  s.rows.forEach((row,y)=>{if(rear&&s.back?.[y])row=s.back[y];[...row].forEach((ch,x)=>{if(rear&&y>=s.face[0]&&y<=s.face[1]&&'sewbm'.includes(ch))ch='H';const color=s.colors[ch];if(color){g.fillStyle=color;g.fillRect(x,y,1,1);}});});return c;});
 return out;}
const api={sprites,build};
if(typeof module==='object'&&module.exports)module.exports=api;else root.TeSprites=api;
})(typeof window!=='undefined'?window:globalThis);

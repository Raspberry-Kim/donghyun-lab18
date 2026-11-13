// 동현테 묶기: src의 HTML·CSS·JS를 index.html 한 장으로 합친다(글꼴·아이콘 내장, 시리즈 줄 삽입). ROM은 넣지 않는다.
const fs=require('fs'),path=require('path');
const {copyIcons}=require('./icon-files.cjs');
const root=__dirname,out=path.join(root,'dist'),src=n=>fs.readFileSync(path.join(root,'src',n),'utf8');
let css=src('style.css');
for(const name of fs.readdirSync(path.join(root,'fonts')))css=css.replaceAll('./fonts/'+name,'data:font/woff2;base64,'+fs.readFileSync(path.join(root,'fonts',name)).toString('base64'));
let html=src('index.html')
 .replace('__SERIES_NAV__',()=>src('series.html'))
 .replace('__BRAND_ICON__',()=>src('brand-icon.txt').trim())
 .replace('<link rel="stylesheet" href="./style.css">',()=>`<style>${css}</style>`);
for(const file of ['donghyun.js','engine.js','shushu.js','sprites.js','render.js','crowd.js','app.js'])html=html.replace(`<script src="./${file}"></script>`,()=>'<script>'+src(file).replaceAll('</script','<\\/script')+'</script>');
if(/src="\.\/(donghyun|engine|shushu|sprites|render|crowd|app)\.js"|__SERIES_NAV__|__BRAND_ICON__/.test(html))throw new Error('묶지 못한 자리표시가 남았다');
fs.writeFileSync(path.join(root,'index.html'),html);
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'index.html'),html);
copyIcons(out);
fs.cpSync(path.join(root,'licenses'),path.join(out,'licenses'),{recursive:true});
console.log('Built',Buffer.byteLength(html),'bytes. ROM excluded.');

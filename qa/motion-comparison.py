from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,subprocess
ROOT=Path(__file__).resolve().parents[1]
Q=ROOT/"qa"
bg="#f4f0e7";ink="#283b32";muted="#687066"
im=Image.new("RGB",(1000,770),bg);d=ImageDraw.Draw(im)
font="/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
def txt(x,y,s,size=18,color=ink):d.text((x,y),s,font=ImageFont.truetype(font,size),fill=color)
txt(24,18,"동현테 · 선수 크기와 서브 동작 수정",28)
txt(24,62,"같은 고정 시점에서 비교. 아래는 실제 X 입력 뒤 연속 캡처.",16,muted)
for x,name,label in [(24,"before-motion","이전"),(432,"motion-final-ready","수정 · 첫 상대 슈슈")]:
    txt(x,100,label,19)
    shot=Image.open(Q/(name+".png")).convert("RGB")
    im.paste(shot.resize((392,352),Image.Resampling.NEAREST),(x,132))
data=json.loads(subprocess.check_output(["node","-e","console.log(JSON.stringify(require('./src/shushu')))"],cwd=ROOT))
girl=Image.new("RGBA",(28,45));g=ImageDraw.Draw(girl)
for y,row in enumerate(data["rows"]):
    for x,ch in enumerate(row):
        if ch in data["colors"]:g.point((x,y),fill=data["colors"][ch])
txt(846,103,"동현파 원본",17)
girl=girl.resize((112,180),Image.Resampling.NEAREST)
im.paste(girl,(856,173),girl)
txt(850,374,"도트·색 원본",15,muted);txt(850,400,"변경 없이 사용",15,muted)
txt(24,513,"토스부터 타격·복귀까지",21)
labels=["토스","라켓 준비","머리 위 타격","내려치기","후속 스윙","회복","대기"]
for i,label in enumerate(labels):
    x=12+i*140
    shot=Image.open(Q/f"serve-seq-{i+1}.png").convert("RGB")
    crop=shot.crop((205,272,269,342)).resize((128,140),Image.Resampling.NEAREST)
    im.paste(crop,(x,555));txt(x+4,707,label,16)
txt(24,746,"도트 화면을 정수 배율에 가깝게 확대해 동작을 비교했다.",13,muted)
im.save(Q/"donghyunte-motion-comparison.png")

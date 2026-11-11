from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
Q=Path(__file__).resolve().parent
im=Image.new("RGB",(920,790),"#f4f0e7")
d=ImageDraw.Draw(im)
def text(x,y,s,size=18):
    d.text((x,y),s,fill="#283b32",font=ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",size))
text(24,17,"동현테 · 커지는 공과 둥근 라켓",28)
text(24,61,"선수는 그대로. 공·라켓과 토스만 과장했다.",17)
for x,file,label in [(24,"round-before","이전 토스 최고점"),(480,"round-apex","수정 토스 최고점")]:
    text(x,99,label)
    im.paste(Image.open(Q/(file+".png")).convert("RGB"),(x,131))
text(24,527,"X 입력 → 상승·확대 → 최고점 → 하강·축소 → 타격",20)
for i,(file,label) in enumerate([("launch","토스"),("rise","상승"),("apex","최고점"),("fall","하강"),("contact","X 타격")]):
    x=24+i*176
    crop=Image.open(Q/("round-"+file+".png")).convert("RGB").crop((205,247,269,342))
    im.paste(crop.resize((128,190),Image.Resampling.NEAREST),(x,570))
    text(x+6,764,label,16)
im.save(Q/"donghyunte-round-ball-racket.png")

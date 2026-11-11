from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
Q=Path(__file__).resolve().parent
im=Image.new("RGB",(920,700),"#f4f0e7");d=ImageDraw.Draw(im)
def text(x,y,s,size=18):
    d.text((x,y),s,fill="#283b32",font=ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",size))
text(24,16,"동현테 · 타점에 따라 달라지는 서브",28)
text(24,59,"같은 위치·방향키 없음. 실제 X 입력 후 첫 바운드 화면.",17)
for x,name,label in [(24,"high","높은 타점 · 바깥쪽 깊게"),(480,"low","낮은 타점 · 중앙 쪽 짧게")]:
    text(x,102,label)
    im.paste(Image.open(Q/f"serve-{name}-landing.png").convert("RGB"),(x,134))
crop=Image.open(Q/"oval-head-ready.png").convert("RGB").crop((220,288,258,332))
im.paste(crop.resize((114,132),Image.Resampling.NEAREST),(24,544))
text(166,546,"동현 머리 7×7 → 9×9",21)
text(166,583,"라켓은 세로가 긴 타원. 코트와 슈슈 도트는 유지.",17)
text(166,620,"토스 약 2초 · 이른 입력은 타격 준비 · 늦은 헛스윙은 재토스",17)
text(166,655,"서브 성공 시점만 찍지 않고, 여러 입력 시점과 실제 착지를 확인했다.",14)
im.save(Q/"donghyunte-serve-timing-and-head.png")

from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
Q=Path(__file__).resolve().parent
im=Image.new("RGB",(920,760),"#f4f0e7");d=ImageDraw.Draw(im)
def text(x,y,s,size=18):
    d.text((x,y),s,fill="#283b32",font=ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",size))
text(24,16,"동현테 · 라켓 축과 A/B 타격 구별",28)
for x,name,label in [(24,"racket-vary-before","이전"),(224,"racket-axis-after","수정")]:
    text(x,65,label,20)
    crop=Image.open(Q/f"{name}.png").crop((417,641,453,682))
    im.paste(crop.resize((144,164),Image.Resampling.NEAREST),(x,100))
text(430,108,"손잡이와 반대로 기울던 타원을 수정.",20)
text(430,150,"긴 축을 손잡이의 연장선에 맞추고",18)
text(430,181,"스윙 중 면 너비도 바뀌도록 했다.",18)
text(24,288,"X · GB A: 가로 스트로크",20)
text(480,288,"Z · GB B: 높게 띄우는 로브",20)
for x,key in [(24,"x"),(480,"z")]:
    im.paste(Image.open(Q/f"ab-{key}-500.png").convert("RGB"),(x,326))
text(24,713,"같은 공 상태에 실제 X/Z 키 입력 후 0.5초. B의 공과 바닥 그림자 사이가 더 벌어진다.",17)
im.save(Q/"donghyunte-racket-axis-and-ab.png")

"""
Measures a phone screenshot: every card's position, height and side margins, and the gaps and
text around each section title between them, in points. For comparing screens in numbers.

    adb exec-out screencap -p > shot.png
    python3 scripts/measure-screen.py shot.png 3      # 3 = the phone's pixels per point (adb shell wm density / 160)

Cards are read along a line just inside the page margin, so a rounded corner makes each card about
3pt shorter at each end than it is: compare screens with each other, not with the tokens.
"""
import sys
from PIL import Image
D=float(sys.argv[2]) if len(sys.argv)>2 else 2.8125
im=Image.open(sys.argv[1]).convert('RGB'); W,H=im.size; px=im.load()
def is_bg(c): return abs(c[0]-c[1])<6 and abs(c[1]-c[2])<6 and 232<=c[0]<=246
def is_white(c): return min(c)>=250
def dark(c): return max(c)<110
# card runs along x=60 and confirm at x=W-60
runs=[];y=0;top=None
for y in range(H):
    inside = not is_bg(px[56,y]) and not is_bg(px[W-56,y])
    if inside and top is None: top=y
    if not inside and top is not None:
        if y-top>40: runs.append((top,y))
        top=None
pt=lambda v: round(v/D,1)
# left margin: first non-bg x at the middle row of first card
out=[]
prev=None
for (a,b) in runs:
    mid=(a+b)//2
    x=0
    while x<W and is_bg(px[x,mid]): x+=1
    xr=W-1
    while xr>0 and is_bg(px[xr,mid]): xr-=1
    seg=f"card {pt(a)}-{pt(b)} h={pt(b-a)} L={pt(x)} R={pt(W-1-xr)}"
    if prev is not None:
        # text rows in the gap
        rows=[]
        t=None
        for yy in range(prev,a):
            has=any(dark(px[xx,yy]) for xx in range(40,W-40,3))
            if has and t is None: t=yy
            if not has and t is not None:
                if rows and t-rows[-1][1]<10: rows[-1]=(rows[-1][0],yy)
                else: rows.append((t,yy))
                t=None
        if rows:
            parts=[f"gap↑{pt(rows[0][0]-prev)}"]
            for i,(r0,r1) in enumerate(rows):
                parts.append(f"text{pt(r1-r0)}")
                nxt = rows[i+1][0] if i+1<len(rows) else a
                parts.append(f"↓{pt(nxt-r1)}")
            seg=" ".join(parts)+"  | "+seg
        else:
            seg=f"gap {pt(a-prev)}  | "+seg
    out.append(seg); prev=b
print(sys.argv[1].split('/')[-1]); [print("   ",o) for o in out]

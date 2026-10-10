"""peek.py FILE SCENE T1 T2 ... -> stills/peek_SCENE.png (contact sheet of frames from the preview render)"""
import subprocess, sys, glob
from PIL import Image
f, sc = sys.argv[1], sys.argv[2]
v = glob.glob(f"media/videos/{f}/*/{sc}.mp4")[0]
ims = []
for t in sys.argv[3:]:
    p = f"stills/pk_{sc}_{t}.png"
    subprocess.run(["ffmpeg","-loglevel","error","-y","-ss",t,"-i",v,"-frames:v","1",p])
    ims.append(Image.open(p))
w, h = ims[0].size
S = Image.new("RGB", (w*2, h*((len(ims)+1)//2)))
for i, im in enumerate(ims): S.paste(im, ((i%2)*w, (i//2)*h))
S.save(f"stills/peek_{sc}.png")

#!/bin/sh
# Screenshot a scroll book in headless Chrome and report script errors and sideways overflow.
#   art/scroll/shot.sh <slug> <width> <out.png> [height]
# Run from the repo root. Uses a file:// URL and a throwaway profile, so many can run at once.
slug=$1; w=${2:-390}; out=${3:-/tmp/$slug-$w.png}; h=${4:-16000}
root=$(pwd); page="$root/books/$slug/index.html"; tmp=$(mktemp -d)
chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# a probe copy beside the page: every pop unfolded, every proof open, errors and width written into the title
probe="$root/books/$slug/.probe.html"
python3 - "$page" "$probe" <<'PY'
import sys,re
t=open(sys.argv[1]).read()
# the shot is one tall window, so anything sized by the window's height is pinned to an 800px screen
t=re.sub(r'(\d+)svh',lambda m:str(int(m.group(1))*8)+'px',t)
pre='<script>window.__e=[];addEventListener("error",e=>__e.push(e.message));addEventListener("unhandledrejection",e=>__e.push(String(e.reason)));</script>'
post='<script>addEventListener("load",()=>setTimeout(()=>{document.querySelectorAll(".pop").forEach(p=>p.classList.add("up"));document.title="PROBE width="+document.documentElement.scrollWidth+"/"+innerWidth+" errors="+JSON.stringify(__e)},1500));</script>'
t=t.replace('<head>','<head>'+pre+'<style>*{transition:none!important;animation:none!important}.pop>.leaf{transform:none!important;opacity:1!important}</style>',1).replace('</body>',post+'</body>',1)
open(sys.argv[2],'w').write(t)
PY
"$chrome" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$tmp" --window-size=$w,$h --virtual-time-budget=6000 --screenshot="$out" "file://$probe" >/dev/null 2>&1
"$chrome" --headless=new --disable-gpu --user-data-dir="$tmp" --window-size=$w,900 --virtual-time-budget=6000 --dump-dom "file://$probe" 2>/dev/null | grep -o '<title>PROBE[^<]*</title>' | sed 's/<[^>]*>//g'
rm -rf "$tmp" "$probe"; echo "screenshot: $out"

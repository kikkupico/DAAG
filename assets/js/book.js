"use strict";
/* The shared script of the books. A book's script.js starts with
     const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,mapPairs,Polar}=BOOK;  BOOK.init();
   and keeps only what is its own. Load it after registers.js (which a book that has the Allegory | Computing switch also uses);
   without registers.js it reads the allegory only. */
(function(){
const REG=window.REG||{isM:()=>false,vis:e=>e.textContent,onReg:[],dtext(parent,attrs,i){const e=document.createElementNS("http://www.w3.org/2000/svg","text");for(const k in attrs)e.setAttribute(k,attrs[k]);e.textContent=i;parent.appendChild(e);return [e]}};
const {isM,vis,onReg,dtext}=REG;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const NS="http://www.w3.org/2000/svg";
const sleep=ms=>new Promise(r=>setTimeout(r,reduce?0:ms));
function el(tag,attrs={},parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
function rnd(n){return Math.floor(Math.random()*n)}
/* run fn(0..1) over ms, eased */
function tween(ms,fn){return new Promise(res=>{if(reduce||ms<=0){fn(1);res();return}const t0=performance.now();
  (function f(t){const u=Math.max(0,Math.min(1,(t-t0)/ms)),e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;fn(e);if(u<1)requestAnimationFrame(f);else res()})(t0)})}
function button(g,label,fn){g.setAttribute("tabindex",0);g.setAttribute("role","button");g.setAttribute("aria-label",label);g.addEventListener("click",fn);g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();fn()}})}

/* the page itself: pop-ups, the bar, parallax, the section's name */
function init(){
  /* ===== pop-ups unfold when they enter view ===== */
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("up");io.unobserve(e.target)}}),{threshold:0,rootMargin:"0px 0px -12% 0px"});
  $$(".pop").forEach(p=>{ if(p.hasAttribute("data-auto")) setTimeout(()=>p.classList.add("up"),250); else io.observe(p); });
  $$(".say,[data-live]").forEach(e=>e.setAttribute("aria-live","polite"));

  /* ===== scroll: progress bar, section name, parallax ===== */
  const secs=$$("section.spread,header.spread"), now=$("#now"), prog=$("#prog");
  const dep=$$("[data-depth]"), par=$$("[data-parallax]");
  let tick=false;
  function onscroll(){
    if(tick)return; tick=true;
    requestAnimationFrame(()=>{
      tick=false;
      const y=scrollY,h=document.documentElement.scrollHeight-innerHeight;
      prog.style.width=(h>0?y/h*100:0)+"%";
      const mid=y+innerHeight*.4; let cur=secs[0];
      for(const s of secs){ if(s.offsetTop<=mid&&s.offsetTop>=cur.offsetTop) cur=s; }
      now.textContent=(isM()&&cur.dataset.nameM)||cur.dataset.name||"";
      if(reduce)return;
      for(const d of dep){const r=d.parentElement.getBoundingClientRect(); const c=(r.top+r.height/2-innerHeight/2)/innerHeight; d.style.transform=`translateY(${(c*+d.dataset.depth).toFixed(1)}px)`+(d.classList.contains("tilt-r")?" rotate(1.2deg)":d.classList.contains("tilt-l")?" rotate(-1.4deg)":"")}
      for(const p of par){const r=p.parentElement.getBoundingClientRect(); const c=(r.top+r.height/2-innerHeight/2)/innerHeight; p.style.transform=`translateY(${(c*-9).toFixed(2)}%)`}
    });
  }
  REG.after=onscroll;
  addEventListener("scroll",onscroll,{passive:true}); addEventListener("resize",onscroll); onscroll();
}

/* ===== a scroll-driven stage: the step in the middle of the window drives render(i) ===== */
function stepDots(root,steps){
  const stage=$(".stage",root),nav=document.createElement("div"); nav.className="dots"; nav.setAttribute("role","group"); nav.setAttribute("aria-label","The steps of this picture");
  let cur=0; const go=i=>steps[i]&&steps[i].scrollIntoView({behavior:reduce?"auto":"smooth",block:"center"});
  const ctl=(cls,label,d,fn)=>{const b=document.createElement("button"); b.type="button"; b.className=cls; b.setAttribute("aria-label",label); b.title=label;
    if(d) b.innerHTML='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="'+d+'"/></svg>'; b.addEventListener("click",fn); return b};
  const prev=ctl("arr","Previous step","M7.5 2 3.5 6l4 4",()=>go(cur-1)), next=ctl("arr","Next step","M4.5 2l4 4-4 4",()=>go(cur+1)),
        back=ctl("arr back","Back to the first step","M2.6 6.4a3.5 3.5 0 1 0 1-2.8M2.4 1.6v2.2h2.2",()=>go(0));
  const dots=steps.map((s,i)=>{const h=$("h3",s); return ctl("dot","Step "+(i+1)+" of "+steps.length+(h?": "+vis(h):""),"",()=>go(i))});
  onReg.push(()=>dots.forEach((d,i)=>{const h=$("h3",steps[i]),t="Step "+(i+1)+" of "+steps.length+(h?": "+vis(h):"");d.setAttribute("aria-label",t);d.title=t}));
  nav.append(prev,...dots,next,back);
  if(stage&&steps.length>1) stage.append(nav);
  return i=>{cur=i; prev.disabled=back.disabled=i===0; next.disabled=i===steps.length-1;
    dots.forEach((d,j)=>{d.classList.toggle("on",j===i); if(j===i)d.setAttribute("aria-current","step"); else d.removeAttribute("aria-current")})};
}
function scrolly(root,render){
  const steps=$$(".step",root),mark=stepDots(root,steps); render(0); mark(0);
  const so=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ const i=steps.indexOf(e.target); steps.forEach((s,j)=>s.classList.toggle("on",j===i)); mark(i); render(i); } }),{rootMargin:"-45% 0px -45% 0px"});
  steps.forEach(s=>so.observe(s));
}

/* ===== who is who: the setting on the left, computing on the right ===== */
function mapPairs(m,pairs){pairs.forEach(([a,b])=>{
  const l=document.createElement("div");l.className="l";l.textContent=a; const mid=document.createElement("div");mid.className="mid";mid.textContent="⟷"; const r=document.createElement("div");r.className="r";r.textContent=b;
  [l,mid,r].forEach(x=>{x.addEventListener("mouseenter",()=>{l.classList.add("hi");r.classList.add("hi")});x.addEventListener("mouseleave",()=>{l.classList.remove("hi");r.classList.remove("hi")});x.addEventListener("click",()=>{l.classList.toggle("hi");r.classList.toggle("hi")})}); m.append(l,mid,r)})}

/* ===== space-time drawn in the round: each place is a line running outward, each ring a later moment,
         and whatever is carried from place to place is an arc curving round and outward ===== */
function Polar(svg,o){
  const {cx,cy,r0,step,nodes,rings,tEnd}=o; svg.innerHTML=""; svg.setAttribute("viewBox",o.vb);
  const defs=el("defs",{},svg);
  const mk=(key,col)=>{const m=el("marker",{id:`${svg.id}-${key}`,markerWidth:9,markerHeight:9,refX:7.5,refY:3.2,orient:"auto"},defs);el("path",{d:"M0,0 L7.5,3.2 L0,6.4 z",fill:col},m)};
  mk("b","#136f9e"); mk("r","#bf4a26");
  const frame=el("g",{},svg), under=el("g",{},svg), slips=el("g",{},svg), evs=el("g",{},svg), over=el("g",{},svg);
  const P={svg,under,slips,evs,over,cx,cy,
    r:t=>r0+step*t,
    xy(deg,rr){const a=deg*Math.PI/180;return [cx+rr*Math.cos(a),cy+rr*Math.sin(a)]},
    pt(k,t){return P.xy(nodes[k][0],P.r(t))},
    /* the points of an arc from place a at time ta to place b at time tb, the short way round */
    arc(a,ta,b,tb){const a0=nodes[a][0],d=((nodes[b][0]-a0+540)%360)-180,n=Math.max(12,Math.round(Math.abs(d)/3)),pts=[];
      for(let i=0;i<=n;i++)pts.push(P.xy(a0+d*i/n,P.r(ta+(tb-ta)*i/n)));return pts},
    slip(a,ta,b,tb,trim=17){const pts=P.arc(a,ta,b,tb),end=pts[pts.length-1];
      while(pts.length>2&&Math.hypot(pts[pts.length-1][0]-end[0],pts[pts.length-1][1]-end[1])<trim)pts.pop();
      const p=el("path",{class:"st-slip","marker-end":`url(#${svg.id}-b)`,d:"M"+pts.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join(" L")},slips);
      p.mid=P.arc(a,ta,b,tb); p.mid=p.mid[Math.floor(p.mid.length/2)]; return p},
    seg(k,t1,t2){const [x1,y1]=P.pt(k,t1),[x2,y2]=P.pt(k,t2);return el("line",{class:"st-seg",x1,y1,x2,y2},under)},
    event(k,t,fill,rad=13){const [x,y]=P.pt(k,t),g=el("g",{class:"st-ev",transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},evs);
      el("circle",{class:"halo2",r:rad+5},g);el("circle",{class:"b",r:rad,fill},g);g.label=el("text",{},g);el("circle",{r:rad+8,fill:"transparent"},g);return g}
  };
  for(let i=1;i<=rings;i++)el("circle",{class:"st-ring",cx,cy,r:P.r(i)},frame);
  for(const k in nodes){const [x1,y1]=P.pt(k,0),[x2,y2]=P.pt(k,tEnd);el("line",{class:"st-spoke",x1,y1,x2,y2},frame)}
  for(const k in nodes){const [x,y]=P.pt(k,0),g=el("g",{class:"st-node",transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},frame);
    el("rect",{x:-17,y:-12,width:34,height:24,rx:4,fill:nodes[k][2]||"#f6eed6"},g).style.fill=nodes[k][2]||"";dtext(g,{},nodes[k][1],nodes[k][3]||nodes[k][1])}
  if(o.note){const [x,y]=o.note;const t=el("text",{class:"st-note",x,y},frame);t.textContent="later moments are further out"}
  return P;
}

/* The same space-time picture for computing, on a rectangular grid in the covers' dress: one lane per process from top
   to bottom, in the order of o.nodes, and real time running left to right. It answers to everything Polar does
   (pt, seg, slip, event, arc, and r and xy, which find the lane nearest an angle and the time of a radius, so that
   a book's own helpers draw on either), and adds op, a bar from invocation to response shaded down through every
   lane, dot and msg. On a phone the picture is half size, so its words, bars and dots are drawn 1.6 times larger. */
const PHONE=matchMedia("(max-width:600px)");
const LDK={"#9cb648":"#4f6d12","#e0b84a":"#8a6a00","#5b9be0":"#1f62ad",GREY:"#6e6e73"};
const MONO="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
function Lanes(svg,o){
  const f=PHONE.matches?1.6:1,fs=n=>`font-size:${(n*f).toFixed(1)}px`,mono=n=>`font-family:${MONO};${fs(n)}`,big=f>1?1.3:1;
  const keys=Object.keys(o.nodes),n=keys.length,G=n<=3?90:n===4?78:66,r0=o.r0||44,step=o.step||30,tEnd=o.tEnd||10;
  const W=620,TOP=70,Y0=110,BOT=Y0+(n-1)*G+40,H=BOT+50,X0=84+(f-1)*14,K=(W-26-X0)/(tEnd+.1);
  svg.innerHTML="";svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
  const id=svg.id,defs=el("defs",{},svg);
  const dots=el("pattern",{id:id+"-ld",width:16,height:16,patternUnits:"userSpaceOnUse"},defs);el("circle",{cx:8,cy:8,r:.9,fill:"#d9d9de"},dots);
  const mk=(key,col)=>{const m=el("marker",{id:`${id}-${key}`,markerWidth:9,markerHeight:9,refX:7.5,refY:3.2,orient:"auto"},defs);el("path",{d:"M0,0 L7.5,3.2 L0,6.4 z",fill:col},m)};
  mk("b","#136f9e");mk("r","#bf4a26");
  el("rect",{width:W,height:H,rx:18,fill:"#fff"},svg);el("rect",{width:W,height:H,rx:18,fill:`url(#${id}-ld)`},svg);
  const frame=el("g",{},svg),shade=el("g",{},svg),under=el("g",{},svg),slips=el("g",{},svg),evs=el("g",{},svg),over=el("g",{},svg);
  const Y={};keys.forEach((k,i)=>Y[k]=Y0+i*G);
  const x=t=>X0+K*t,y=(k,off=0)=>Y[k]+off*(f>1?4.6:3.4),placed=[];
  /* the lane whose node's angle is nearest, and how far round from it */
  const near=deg=>{let best=keys[0],d=1e9;for(const k of keys){const w=((deg-o.nodes[k][0])%360+540)%360-180;if(Math.abs(w)<Math.abs(d)){d=w;best=k}}return [best,d]};
  for(let t=0;t<=Math.floor(tEnd);t++)el("line",{class:"ln-grid",x1:x(t),x2:x(t),y1:TOP,y2:BOT},frame);
  for(const k of keys){
    el("line",{class:"ln-lane",x1:X0-12,x2:W-18,y1:Y[k],y2:Y[k]},frame);
    const g=el("g",{class:"ln-proc",transform:`translate(${36+(f-1)*14} ${Y[k]})`},frame);el("circle",{r:19*big},g);
    el("text",{style:fs(o.nodes[k][3]&&o.nodes[k][3].length>2?12:15)},g).textContent=o.nodes[k][3]||o.nodes[k][1]}
  el("text",{class:"ln-note",x:W-18,y:48,"text-anchor":"end",style:mono(13)},frame).textContent="real time →";
  const P={svg,under,slips,evs,over,shade,lanes:true,x,y,
    r:t=>r0+step*t,
    xy(deg,rr){const [k,d]=near(deg);return [x((rr-r0)/step),y(k,d)]},
    pt(k,t){return [x(t),y(k)]},
    arc(a,ta,b,tb){const pts=[];for(let i=0;i<=12;i++){const u=i/12;pts.push([x(ta+(tb-ta)*u),y(a)+(y(b)-y(a))*u])}return pts},
    slip(a,ta,b,tb,trim=17){const [x1,y1]=P.pt(a,ta),[x2,y2]=P.pt(b,tb),d=Math.hypot(x2-x1,y2-y1)||1,k=Math.max(0,d-trim*big)/d;
      const p=el("path",{class:"st-slip","marker-end":`url(#${id}-b)`,d:`M${x1.toFixed(1)},${y1.toFixed(1)} L${(x1+(x2-x1)*k).toFixed(1)},${(y1+(y2-y1)*k).toFixed(1)}`},slips);
      p.mid=[(x1+x2)/2,(y1+y2)/2];return p},
    seg(k,t1,t2){return el("line",{class:"st-seg",x1:x(t1),y1:y(k),x2:x(t2),y2:y(k)},under)},
    event(k,t,fill,rad=13){const g=el("g",{class:"st-ev",transform:`translate(${x(t).toFixed(1)} ${y(k).toFixed(1)})`},evs),r=rad*big;
      el("circle",{class:"halo2",r:r+5},g);el("circle",{class:"b",r,fill},g);g.label=el("text",f>1?{style:fs(15)}:{},g);el("circle",{r:r+8,fill:"transparent"},g);return g},
    /* an operation from s to e on a lane, its stretch of time shaded down through every lane; returns its group */
    op(k,s,e,col,label,off=0){
      const dk=LDK[col]||LDK.GREY,fill=LDK[col]?col:"#a1a1a6",yy=y(k,off),h=(off?26:32)*big;
      el("rect",{class:"ln-shade",x:x(s),y:TOP,width:x(e)-x(s),height:BOT-TOP,fill},shade);
      const g=el("g",{class:"ln-op"},evs);
      el("rect",{class:"ln-ring",x:x(s)-5,y:yy-h/2-5,width:x(e)-x(s)+10,height:h+10,rx:(h+10)/2},g);
      el("rect",{class:"pill",x:x(s),y:yy-h/2,width:x(e)-x(s),height:h,rx:h/2,fill,stroke:dk},g);
      /* a label too long for its bar sits just outside it: above the upper of two stacked bars, below the lower,
         and on the other side when one already placed on that lane would run into it */
      const lw=label.length*9.8*f,fits=lw+14<=x(e)-x(s),cx=(x(s)+x(e))/2;let below=off>0;
      if(!fits){const hit=b=>placed.some(q=>q.k===k&&q.below===b&&Math.abs(q.cx-cx)<(q.lw+lw)/2+8);
        if(hit(below)&&!hit(!below))below=!below;placed.push({k,below,cx,lw})}
      el("text",{x:cx,y:fits?yy+.5:below?yy+h/2+9+6*f:yy-h/2-8-6*f,fill:dk,style:mono(16)},g).textContent=label;
      return g},
    /* a moment on a lane: a small dot */
    dot(k,t,col,off=0,r=6){const g=el("g",{class:"ln-dot",transform:`translate(${x(t)} ${y(k,off)})`},over);el("circle",{r:r*(f>1?1.4:1),fill:LDK[col]||col||"#1d1d1f"},g);return g},
    /* a message: an arrow sloping right because it takes time */
    msg(a,ta,b,tb){return P.slip(a,ta,b,tb,10)}};
  return P;
}
/* Unfold: a place-from-above picture's computing twin, a timeline that grows as the reader acts.
   The picture (a Hill, an Isle, the Crown, the Tholos, the Chamber) stays as it is and shows in the allegory; a second
   svg after it shows in computing. The book's own calls feed it: wrap(H) relays the picture's mover (fly, road or run),
   its state, note and badge; the rest is said outright at the point it happens: reset, crash, down (a stretch with the
   process stopped), lose, cut, step, tick, turn, mark.
   A message is an arrow from the moment it is sent, dashed toward its receiver while in transit and solid once it
   lands (a mover's u at o.land or beyond, .879 unless said); a lost one ends part-way at a cross; a crash ends a lane.
   Time runs while a message flies, plus whatever tick and step add; views that are read side by side share a clock.
   o.alias names the lane of a place that is not a process (the podium is whoever holds it); a place with no lane is
   not drawn. o.labels writes each token's glyph (through o.vals) on its arrow. o.press {k:[label,fn]} makes a process's
   name a button, for a picture whose places the reader presses. Nothing the twin does can stop the picture.
     const L=Unfold(svg,{nodes, span, slide, clock}); L.wrap(H);   (o.clock: another Unfold's clock, to share it) */
function Unfold(src,o){
  const svg=src.cloneNode(false);svg.id=src.id+"-ln";svg.classList.add("m");src.classList.add("i");src.after(svg);
  if(src.dataset.alM)svg.setAttribute("aria-label",src.dataset.alM);
  const clock=o.clock||{t:0,owed:0,active:-1e9,raf:0,last:0,subs:[]};
  let msgs=[],states=[],steps=[],marks=[],bands=[],cuts=[],downs=[],badges={},crashes={},turnK=null,queued=false;
  const byTok=new Map(),land=o.land||.879,lane=k=>{k=o.alias&&o.alias[k]!=null?o.alias[k]:k;return o.nodes[k]?k:null};
  const safe=f=>{try{f()}catch(e){console.error(e)}};
  function wake(){if(!clock.raf){clock.last=performance.now();clock.raf=requestAnimationFrame(loop)}}
  function loop(now){const dt=Math.min(.1,(now-clock.last)/1000);clock.last=now;
    const flying=now-clock.active<160;let adv=flying?dt:0;
    if(clock.owed>0){const d=Math.min(clock.owed,dt*1.6);clock.owed-=d;adv=Math.max(adv,d)}
    clock.t+=adv;clock.subs.forEach(f=>f());clock.raf=flying||clock.owed>1e-4?requestAnimationFrame(loop):0}
  const render=()=>{if(queued||!isM())return;queued=true;requestAnimationFrame(()=>{queued=false;draw()})};
  clock.subs.push(render);onReg.push(()=>render());PHONE.addEventListener("change",render);
  function draw(){
    if(!isM())return;
    const span=o.span||6,off=o.slide?Math.max(0,clock.t-span*.86):0,X=t=>t-off,now=X(clock.t);
    const fk=svg.contains(document.activeElement)?document.activeElement.dataset.k:null;
    const P=Lanes(svg,{nodes:o.nodes,tEnd:span});svg.classList.add("lanes");
    const keys=Object.keys(o.nodes),big=PHONE.matches?1.6:1;
    /* a process the reader can press in the picture is pressed by its name here; a redraw keeps the focus */
    if(o.press){const gs=svg.querySelectorAll(".ln-proc");keys.forEach((k,i)=>{const p=o.press[k];if(!p)return;
      const g=gs[i];g.dataset.k=k;g.classList.add("ln-press");button(g,p[0],p[1]);if(fk===k)g.focus({preventScroll:true})})}
    /* the lane of a man who has crashed stops there */
    keys.forEach(k=>{if(crashes[k]==null)return;const t=Math.max(0,X(crashes[k])),[x,y]=P.pt(k,t);
      el("line",{class:"ln-gone",x1:x,y1:y,x2:P.x(span)+20,y2:y},P.shade);
      el("path",{class:"ln-x",d:`M${x-9},${y-9}L${x+9},${y+9}M${x-9},${y+9}L${x+9},${y-9}`},P.over)});
    /* a process that is down for a while: its lane is missing for as long as it lasts */
    for(const d of downs){const t0=Math.max(0,X(d.t0)),t1=d.t1!=null?X(d.t1):span+1;if(t1<0)continue;const [x,y]=P.pt(d.k,t0);
      el("line",{class:"ln-gone",x1:x,y1:y,x2:Math.min(P.x(t1),P.x(span)+20),y2:y},P.shade)}
    /* each process's input, beside its name */
    keys.forEach(k=>{const s=badges[k];if(!s)return;const [x,y]=P.pt(k,0),g=el("g",{class:"ln-in",transform:`translate(${x+14*big} ${y})`},P.over);
      el("rect",{x:-11*big,y:-11*big,width:22*big,height:22*big,rx:6*big},g);el("text",{style:`font-size:${13*big}px`},g).textContent=s});
    if(turnK!=null){const [x,y]=P.pt(turnK,0);el("circle",{class:"ln-turn",cx:x-48-(big-1)*14,cy:y,r:26*big},P.under)}
    /* a process cut off from the rest: its lane hatched for as long as it lasts */
    if(cuts.length){const pt=el("pattern",{id:svg.id+"-cut",width:8,height:8,patternUnits:"userSpaceOnUse",patternTransform:"rotate(45)"},$("defs",svg));
      el("line",{x1:0,y1:0,x2:0,y2:8,stroke:"#bf4a26","stroke-width":2.2,"stroke-opacity":.35},pt);
      for(const c of cuts){const t0=Math.max(0,X(c.t0)),t1=c.t1!=null?X(c.t1):now;if(t1<0)continue;const y=P.pt(c.k,0)[1],h=22*big;
        el("rect",{class:"ln-cut",x:P.x(t0),y:y-h,width:Math.max(2,P.x(Math.max(t1,t0+.05))-P.x(t0)),height:2*h,rx:6,fill:`url(#${svg.id}-cut)`},P.shade)}}
    /* a stretch of time with a name: a round of a protocol */
    for(const b of bands){const x1=P.x(X(b.t0)),x2=P.x(X(b.t1)),top=P.y(keys[0])-40,bot=P.y(keys[keys.length-1])+40;
      el("rect",{class:"ln-band"+(b.hot?" hot":""),x:x1,y:top,width:x2-x1,height:bot-top},P.shade);
      el("text",{class:"ln-bandl",x:(x1+x2)/2,y:b.low?bot+16*big:top-8,style:`font-size:${11.5*big}px`},P.over).textContent=b.lab}
    for(const r of msgs){
      const t0=X(r.t0);if((r.t1!=null&&X(r.t1)<0)||(r.lost!=null&&X(r.lost)<0))continue;
      const [x1,y1]=P.pt(r.a,Math.max(0,t0)),yb=P.pt(r.b,0)[1],ya=P.pt(r.a,0)[1];
      if(r.lost!=null){const tl=X(r.lost),x2=P.x(tl),y2=ya+(yb-ya)*.5;
        el("path",{class:"st-slip ln-lost",d:`M${x1},${y1}L${x2},${y2}`},P.slips);el("path",{class:"ln-x",d:`M${x2-7},${y2-7}L${x2+7},${y2+7}M${x2-7},${y2+7}L${x2+7},${y2-7}`},P.over);continue}
      const t1=r.t1!=null?X(r.t1):now,p=P.slip(r.a,Math.max(0,t0),r.b,Math.max(t1,t0+.02),r.t1!=null?7:4);
      if(r.cls){p.classList.add(r.cls);if(r.cls==="ln-red")p.setAttribute("marker-end",`url(#${svg.id}-r)`);if(r.cls==="ln-aside")p.removeAttribute("marker-end")}
      if(r.t1==null)p.classList.add("ln-pending");else P.dot(r.b,t1,r.fill);
      /* a label a third of the way along, so that arrows crossing at their middles keep theirs apart */
      if(r.lab){const [x2,y2]=P.pt(r.b,Math.max(t1,t0+.02)),mx=x1+(x2-x1)*.34,my=y1+(y2-y1)*.34;el("text",{class:"ln-mlab",x:mx,y:my-6*big,style:`font-size:${11.5*big}px`},P.over).textContent=r.lab}}
    for(const s of steps)if(X(s.t)>=0)P.dot(s.k,X(s.t),"#fff").classList.add("ln-step");
    /* labelled moments that all stay: every flip of a coin */
    for(const m of marks){if(X(m.t)<0)continue;const [x,y]=P.pt(m.k,X(m.t)),g=el("g",{class:"ln-mark",transform:`translate(${x} ${y})`},P.over);
      el("circle",{r:11*big,fill:m.col||"#fff"},g);el("text",{style:`font-size:${12*big}px`},g).textContent=m.lab}
    /* the latest state of each process, at the moment it changed */
    /* (one taken before a sliding timeline's window still holds, and stands at its left edge) */
    keys.forEach(k=>{const s=[...states].reverse().find(x=>String(x.k)===k);if(!s)return;const ts=Math.max(0,X(s.t)),[x,y]=P.pt(k,ts);
      /* a label that would run past the frame ends at its dot instead */
      P.dot(k,ts,"#1d1d1f");const lab=s.m||s.i,long=x+10+lab.length*7.7*big>P.x(span)+16;
      const t=el("text",{class:"ln-state",x:long?x-6:x+10,y:y-14*big,style:`font-size:${12.5*big}px`},P.over);t.textContent=lab;
      if(long)t.setAttribute("text-anchor","end")});
  }
  const L={svg,clock,
    /* relay a picture's own calls; a twin that fails leaves the picture running */
    wrap(H){for(const m of ["fly","road","run"])if(H[m]){const f=H[m];H[m]=(g,a,b,u)=>{f(g,a,b,u);safe(()=>L.fly(g,a,b,u))}}
      /* a note left empty only clears the picture's label; a state left empty clears the process's state */
      for(const m of ["state","note"])if(H[m]){const f=H[m];H[m]=(k,i,m2)=>{f(k,i,m2);if(m==="note"&&!i)return;safe(()=>L.state(k,i,m2===undefined&&o.mtext?o.mtext(i):m2))}}
      if(H.badge){const f=H.badge;H.badge=(k,s)=>{f(k,s);safe(()=>L.badge(k,s))}}
      if(o.labels&&H.token){const f=H.token;H.token=(fill,glyph,...r)=>{const g=f(fill,glyph,...r);g.lnLab=glyph==null||glyph===""?null:String((o.vals&&o.vals[glyph])||glyph);return g}}
      H.lanes=L;return H},
    fly(g,a,b,u){a=lane(a);b=lane(b);if(a==null||b==null||a==b)return;let r=byTok.get(g);
      /* a token that has landed starts a new flight only when it sets off again from near its sender */
      if(!r||r.a!=a||r.b!=b||((r.t1!=null||r.lost!=null)&&u<.5)){r={a:+a||a,b:+b||b,t0:clock.t,t1:null,lost:null,fill:o.nodes[a][2],lab:g.lnLab};msgs.push(r);byTok.set(g,r)}
      if(u>=land&&r.t1==null&&r.lost==null)r.t1=clock.t;clock.active=performance.now();wake();render()},
    lose(g){const r=byTok.get(g)||(g&&g.t0!=null?g:null);if(r&&r.t1==null){r.lost=clock.t;render()}},
    /* a state said again unchanged keeps the moment it first took */
    state(k,i,m){if(Array.isArray(i))[i,m]=i;k=lane(k);if(k==null)return;
      if(i){m=m===undefined?i:m;const last=[...states].reverse().find(x=>x.k==k);if(!last||last.i!==i||last.m!==m)states.push({k,t:clock.t,i,m})}
      else states=states.filter(s=>s.k!=k);render()},
    badge(k,s){badges[k]=s?((o.vals&&o.vals[s])||s):null;render()},
    crash(k,on=true){crashes[k]=on?clock.t:null;render()},
    cut(k,on){const c=cuts.find(x=>x.k==k&&x.t1==null);if(on&&!c)cuts.push({k,t0:clock.t,t1:null});else if(!on&&c)c.t1=clock.t;render()},
    down(k,on){const d=downs.find(x=>x.k==k&&x.t1==null);if(on&&!d)downs.push({k,t0:clock.t,t1:null});else if(!on&&d)d.t1=clock.t;render()},
    turn(k){turnK=k==null?null:lane(k);render()},
    mark(k,lab,col){marks.push({k,t:clock.t,lab,col});render()},
    step(k,dt=.6){steps.push({k,t:clock.t});clock.owed+=dt;wake();render()},
    tick(dt){clock.owed+=dt;wake()},
    /* for a scene told step by step: a message with its own times (t1 null: still in transit; cls "ln-red" for a marker,
       "ln-aside" for something carried outside the system), a named stretch of time (low: its name under the lanes,
       for a stretch inside another), the clock set outright */
    msg(a,b,t0,t1,lab,cls){a=lane(a);b=lane(b);if(a==null||b==null)return null;const r={a,b,t0,t1,lost:null,fill:cls==="ln-red"?"#bf4a26":o.nodes[a][2],lab,cls};msgs.push(r);render();return r},
    land(r,t=clock.t){if(r){r.t1=t;render()}},
    band(t0,t1,lab,hot,low){const b={t0,t1,lab,hot,low};bands.push(b);render();return b},
    setT(t){clock.t=t;render()},
    /* start the timeline again; inputs stay until badge changes them */
    reset(){msgs=[];states=[];steps=[];marks=[];bands=[];cuts=[];downs=[];crashes={};turnK=null;byTok.clear();clock.t=0;clock.owed=0;render()},
    render};
  render();
  return L;
}
/* For a picture a book draws from nothing each time: the engine for the register being read, and a way to draw it
   again when the register changes or, in computing, when a phone crosses the size where the lanes grow larger. */
function Space(svg,o){svg.classList.toggle("lanes",isM());return isM()?Lanes(svg,o):Polar(svg,o)}
function redrawOn(fn){onReg.push(()=>fn());PHONE.addEventListener("change",()=>{if(isM())fn()})}
/* A space-time picture in the register being read: in the round in the allegory, on lanes in computing.
   draw(P) builds it from nothing and puts back whatever the reader has chosen; it runs again when the register
   changes, and in computing when a phone crosses the size where the lanes grow larger. */
function Timeline(svg,o,draw){
  let kind=null;
  const go=force=>{const k=isM()?"m":"i";if(k===kind&&!force)return;kind=k;svg.classList.toggle("lanes",k==="m");draw(k==="m"?Lanes(svg,o):Polar(svg,o))};
  go();onReg.push(()=>go());PHONE.addEventListener("change",()=>{if(kind==="m")go(true)});
  return go;
}

/* lineage: draw the edges of a book's graph of papers, and say what an edge carries (lineage.py) */
(function(){
const NS="http://www.w3.org/2000/svg",wide=matchMedia("(min-width:860px)");
document.querySelectorAll(".lin").forEach(lin=>{
  const svg=lin.querySelector(".lin-edges"),say=lin.querySelector(".lin-say"),idle=say.innerHTML;
  const node=n=>lin.querySelector('[data-n="'+n+'"]');
  const links=[...lin.querySelectorAll(".lin-link")].map(el=>({el,side:el.dataset.side,from:el.dataset.from.split(" "),to:el.dataset.to.split(" "),g:null}));
  const box=el=>{const a=el.getBoundingClientRect(),b=lin.getBoundingClientRect();
    return {l:a.left-b.left,r:a.right-b.left,t:a.top-b.top,b:a.bottom-b.top,cx:(a.left+a.right)/2-b.left,cy:(a.top+a.bottom)/2-b.top}};
  const mk=(tag,at,to)=>{const e=document.createElementNS(NS,tag);for(const k in at)e.setAttribute(k,at[k]);to.appendChild(e);return e};
  const f=v=>v.toFixed(1);
  const path=(g,d)=>mk("path",{d},g);
  const flat=(g,x1,y1,x2,y2)=>path(g,`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`);
  const bend=(g,x1,y1,x2,y2)=>{const m=(x1+x2)/2;path(g,`M${f(x1)} ${f(y1)}C${f(m)} ${f(y1)} ${f(m)} ${f(y2)} ${f(x2)} ${f(y2)}`)};
  const head=(g,x,y,down)=>mk("polygon",{points:down?`${f(x-5)},${f(y-8)} ${f(x+5)},${f(y-8)} ${f(x)},${f(y)}`:`${f(x-8)},${f(y-5)} ${f(x-8)},${f(y+5)} ${f(x)},${f(y)}`},g);
  function draw(){
    svg.textContent="";
    if(!wide.matches)return;
    const R=lin.getBoundingClientRect();
    svg.setAttribute("width",R.width);svg.setAttribute("height",R.height);svg.setAttribute("viewBox",`0 0 ${f(R.width)} ${f(R.height)}`);
    const ports={};   // the edges that meet one side of a middle node share it out between them, in the order they come from
    const port=(n,side,y,then)=>(ports[n+side]=ports[n+side]||[]).push({n,side,y,then});
    links.forEach(k=>{
      const g=k.g=mk("g",{},svg),c=box(k.el.querySelector("em"));
      if(k.side==="in"){
        flat(g,box(node(k.from[0])).r,c.cy,c.l,c.cy);
        k.to.forEach(n=>port(n,"l",c.cy,(x,y)=>{bend(g,c.r,c.cy,x-7,y);head(g,x,y)}));
      }else if(k.side==="out"){
        const b=box(node(k.to[0]));
        flat(g,c.r,c.cy,b.l-7,c.cy);head(g,b.l,c.cy);
        k.from.forEach(n=>port(n,"r",c.cy,(x,y)=>bend(g,x,y,c.l,c.cy)));
      }else{
        const s=node(k.from[0]),t=node(k.to[0]),sb=box(s),tb=box(t);
        if(t.parentNode.previousElementSibling===s.parentNode)flat(g,c.cx,sb.b,c.cx,c.t);
        else{const y=sb.b-12,x=sb.r+20;   // round the papers between, outside their right edge
          path(g,`M${f(sb.r)} ${f(y)}H${f(x-10)}Q${f(x)} ${f(y)} ${f(x)} ${f(y+10)}V${f(c.cy-10)}Q${f(x)} ${f(c.cy)} ${f(x-10)} ${f(c.cy)}H${f(c.r)}`)}
        flat(g,c.cx,c.b,c.cx,tb.t-7);head(g,c.cx,tb.t,true);
      }
    });
    for(const key in ports){
      const list=ports[key].sort((a,b)=>a.y-b.y),b=box(node(list[0].n)),h=b.b-b.t;
      list.forEach((p,i)=>p.then(p.side==="l"?b.l:b.r,b.t+h*(.2+.6*(i+.5)/list.length)));
    }
  }
  function light(on,words){
    lin.classList.toggle("hot",on.length>0);
    const nodes=new Set(on.flatMap(k=>k.from.concat(k.to)));
    links.forEach(k=>{const is=on.includes(k);k.el.classList.toggle("on",is);if(k.g)k.g.classList.toggle("on",is)});
    lin.querySelectorAll(".lin-node").forEach(n=>n.classList.toggle("on",nodes.has(n.dataset.n)));
    say.innerHTML=words||idle;
  }
  const name=ns=>ns.map(n=>node(n).dataset.label).join(", ");
  links.forEach(k=>{
    const tell=()=>light([k],"<b>"+name(k.from)+" → "+name(k.to)+"</b>"+k.el.querySelector(".why").innerHTML);
    k.el.addEventListener("mouseenter",tell);k.el.addEventListener("focus",tell);k.el.addEventListener("click",tell);
  });
  lin.querySelectorAll(".lin-node").forEach(n=>{
    const mine=()=>light(links.filter(k=>k.from.concat(k.to).includes(n.dataset.n)));
    n.addEventListener("mouseenter",mine);n.addEventListener("focus",mine);
  });
  lin.addEventListener("mouseleave",()=>light([]));
  new ResizeObserver(draw).observe(lin);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);
  draw();
});
})();

window.BOOK={$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,mapPairs,Polar,Lanes,Timeline,Space,redrawOn,Unfold,init};
})();

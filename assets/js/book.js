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

window.BOOK={$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,mapPairs,Polar,Lanes,Timeline,Space,redrawOn,init};
})();

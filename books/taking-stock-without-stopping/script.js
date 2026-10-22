"use strict";
(function(){
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

/* ===== the two registers: see assets/js/registers.js ===== */
const {isM,dual,vis,dtext,onReg}=REG;

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

const HC={1:"#9cb648",2:"#e0b84a",3:"#5b9be0"};
/* a button on a drawing, labelled in each register */
const btn=(g,i,m,fn)=>{button(g,i,fn);onReg.push(()=>g.setAttribute("aria-label",isM()?m:i))};
const chip=(t,h)=>`<span class="chip"><i style="background:${HC[h]}"></i>${t}</span>`;

/* ===== Arche, seen from above: the same picture as every book on the ring road ===== */
function Isle(svg){
  const cx=235,cy=235,R=165,A={1:-90,2:30,3:150}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:86,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("text",{x:cx,y:cy-8,class:"lab i"},svg).textContent="Mount Phyle";
  el("circle",{cx,cy,r:R,fill:"none",stroke:"#b5602c","stroke-width":3,"stroke-dasharray":"3 8"},svg);
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const I={svg,cx,cy,R,A,under,over,house:{},
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:13,fill,stroke:"#1c1512","stroke-width":2.5},g);dtext(g,{},glyph,glyph);return g},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    /* u of the way along the direct stretch from house a to house b; each direction keeps to its own lane */
    road(g,a,b,u){const d=((A[b]-A[a]+540)%360)-180;I.put(g,...I.at(A[a]+d*u,R+(d>0?9:-9)))}
  };
  for(const h of [1,2,3]){const [x,y]=I.at(A[h]),g=el("g",{class:"site"},sites);I.put(g,x,y);el("rect",{x:-25,y:-17,width:50,height:34,rx:5,fill:HC[h]},g);dtext(g,{},"H"+h,"P"+h);I.house[h]={x,y,g}}
  return I;
}

/* ===== the count, run by the book's own rules =====
   Three houses, six one-way tracks, nothing overtaking on a track. Every event of the morning is
   listed with its time; the houses' records, the slates and the total are worked out by the
   rules of sending and receiving, so the page checks itself. */
function Census(){
  const S={1:100,2:80,3:90},truth=S[1]+S[2]+S[3],ch={},rec={},recT={},slate={},items=[],snaps=[],key=(a,b)=>a+">"+b;
  for(const a of [1,2,3])for(const b of [1,2,3])if(a!==b)ch[key(a,b)]=[];
  const send=(a,b,x,t)=>{x.id=items.length;x.a=a;x.b=b;x.sent=t;items.push(x);ch[key(a,b)].push(x);if(x.k==="cart")S[a]-=x.n};
  const cart=n=>({k:"cart",n}),sash=()=>({k:"sash"});
  /* the rule of sending: record the storehouse, then a sash down every road before anything else */
  function record(h,t){rec[h]=S[h];recT[h]=t;slate[h]={};for(const o of [1,2,3])if(o!==h)slate[h][o]={sum:0,closed:false};for(const o of [1,2,3])if(o!==h)send(h,o,sash(),t)}
  /* the rule of receiving */
  function arrive(a,b,t,want){const x=ch[key(a,b)].shift();if(!x||x.k!==want[0]||(x.n||0)!==(want[1]||0))throw new Error("a track was not first-in first-out at "+t);x.arr=t;
    if(x.k==="cart"){S[b]+=x.n;if(rec[b]!=null&&!slate[b][a].closed)slate[b][a].sum+=x.n}
    else if(rec[b]==null){record(b,t);slate[b][a].closed=true}else slate[b][a].closed=true}
  const ev=[[1.4,()=>send(3,2,cart(30),1.4)],[1.6,()=>send(2,3,cart(10),1.6)],[2.2,()=>send(3,2,cart(15),2.2)],
    [2.6,()=>record(1,2.6)],[3.0,()=>send(1,2,cart(20),3.0)],
    [3.6,()=>arrive(3,2,3.6,["cart",30])],[3.8,()=>arrive(1,2,3.8,["sash"])],
    [4.6,()=>arrive(1,2,4.6,["cart",20])],[5.4,()=>arrive(3,2,5.4,["cart",15])],
    [5.8,()=>arrive(1,3,5.8,["sash"])],[6.2,()=>arrive(2,3,6.2,["cart",10])],
    [6.8,()=>arrive(2,3,6.8,["sash"])],[7.0,()=>arrive(3,2,7.0,["sash"])],[7.2,()=>arrive(2,1,7.2,["sash"])],[7.4,()=>arrive(3,1,7.4,["sash"])]];
  const ends=[1.6,2.2,2.6,3.0,3.8,4.6,5.4,5.8,6.2,7.4,7.4];
  const snap=t=>({t,S:{...S},rec:{...rec},slate:JSON.parse(JSON.stringify(slate)),ch:Object.fromEntries(Object.entries(ch).map(([k,v])=>[k,v.map(x=>x.id)]))});
  let i=0;for(const e of ends){while(i<ev.length&&ev[i][0]<=e)ev[i++][1]();snaps.push(snap(e))}
  const R=[1,2,3].map(h=>rec[h]),L=[];for(const h of [1,2,3])for(const o of [1,2,3])if(o!==h)L.push(slate[h][o].sum);
  const total=R.reduce((a,b)=>a+b,0)+L.reduce((a,b)=>a+b,0);
  if(total!==truth||[1,2,3].some(h=>[1,2,3].some(o=>o!==h&&!slate[h][o].closed)))throw new Error("the count does not add up");
  return {items,snaps,ends,rec:R,recT,slate,truth,total};
}

/* the cover, in computing: three processes with messages in transit */
(function(){const I=Isle($("#coversvg"));
  [[1,2,.5],[2,3,.5],[3,1,.45],[1,3,.4]].forEach(([a,b,u])=>{const g=I.token(HC[a],"");g.setAttribute("opacity",1);I.road(g,a,b,u)})})();

/* ===== the nine places to count ===== */
(function(){
  const I=Isle($("#nine")),say=$("#ninesay"),cnt=$("#ninecount"),svg=I.svg,seen=new Set(),all=[];
  const defs=el("defs",{},svg),mk=el("marker",{id:"nine-ar",markerUnits:"userSpaceOnUse",markerWidth:11,markerHeight:11,refX:9,refY:5.5,orient:"auto"},defs);el("path",{d:"M0,0 L11,5.5 L0,11 z",fill:"#1c1512"},mk);
  const clear=()=>all.forEach(x=>{x.el.classList.remove("pick");if(x.road)x.el.classList.add("dim")});
  function pick(x,text){clear();x.el.classList.remove("dim");x.el.classList.add("pick");seen.add(x.id);
    say.innerHTML=text+(seen.size===9?dual(" <span class='ok'>All nine looked at.</span> A scribe can count three of them from a desk."," <span class='ok'>All nine looked at.</span> A process can record only three of them directly."):"");cnt.textContent=seen.size+" of nine looked at"}
  for(const [a,b] of [[1,2],[2,1],[1,3],[3,1],[2,3],[3,2]]){
    const d=((I.A[b]-I.A[a]+540)%360)-180,r=I.R+(d>0?9:-9),pts=[];
    for(let k=0;k<=14;k++)pts.push(I.at(I.A[a]+d*(.24+.52*k/14),r));
    const dd="M"+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L");
    const g=el("g",{class:"rd"},I.under);
    el("path",{d:dd,class:"rp",stroke:HC[a],"marker-end":"url(#nine-ar)"},g);
    el("path",{d:dd,fill:"none",stroke:"transparent","stroke-width":18,"pointer-events":"stroke"},g);
    const x={id:a+">"+b,el:g,road:true};all.push(x);
    btn(g,`The track from House ${a} to House ${b}`,`The channel from P${a} to P${b}`,()=>pick(x,dual(`<b>The track from House ${a} to House ${b}.</b> The carts that have left House ${a} and not yet reached House ${b}. Nobody at either house can see it.`,`<b>The channel from P${a} to P${b}.</b> The messages that have left P${a} and not yet reached P${b}. Neither process can see inside it.`)));
  }
  for(const h of [1,2,3]){const g=I.house[h].g,x={id:"h"+h,el:g};all.push(x);
    btn(g,`House ${h}'s storehouse`,`P${h}'s local state`,()=>pick(x,dual(`<b>House ${h}'s storehouse.</b> What sits under its roof. A scribe at that house can count it.`,`<b>P${h}'s local state.</b> What the process holds in its own memory. It can read it directly.`)))}
})();

/* ===== scroll: the count with red sashes ===== */
(function(){
  const C=Census(),I=Isle($("#sashsvg")),side=$("#sashside"),{items,snaps,ends}=C;
  const toks=items.map(x=>({x,g:I.token(x.k==="sash"?"#bf4a26":HC[x.a],x.k==="cart"?x.n:""),u:.1,run:0,shown:false}));
  const pos=(s,id)=>{for(const k in snaps[s].ch){const i=snaps[s].ch[k].indexOf(id);if(i>=0)return i}return -1};
  function card(h,S,done){
    const o=[1,2,3].filter(k=>k!==h),r=S.rec[h],sl=S.slate[h];
    const lines=r==null?dual("no slates yet","no channel records yet"):o.map(k=>dual(`from H${k}: ${sl[k].closed?"closed":"open"} ${sl[k].sum}`,`from P${k}: ${sl[k].closed?"closed":"open"} ${sl[k].sum}`)).join("<br>");
    return `<div class="hc${done?" done":""}"><h5>${dual("House "+h,"P"+h)}<span>${dual("stock ","state ")}${S.S[h]}</span></h5><div class="rc">${r==null?"not yet recorded":"recorded <b>"+r+"</b>"}</div><div class="chk">${lines}</div></div>`;
  }
  const last=snaps.length-1;
  $$("#sashsum,.sashsum2").forEach(e=>e.innerHTML=`${C.rec.join(" + ")} + ${C.slate[2][3].sum} + ${C.slate[3][2].sum} = <b>${C.total}</b>`);
  $$("#sashtruth,.sashtruth2").forEach(e=>e.textContent=C.truth);
  scrolly($("#sash"),s=>{
    const S=snaps[s];side.innerHTML=[1,2,3].map(h=>card(h,S,s===last)).join("");
    toks.forEach(k=>{const p=pos(s,k.x.id),id=++k.run;
      if(p>=0){const u1=Math.max(.14,.86-.2*p);if(!k.shown){k.shown=true;k.u=.06}k.g.setAttribute("opacity",1);const u0=k.u;
        tween(800,e=>{if(k.run!==id)return;k.u=u0+(u1-u0)*e;I.road(k.g,k.x.a,k.x.b,k.u)});return}
      const arrived=k.x.arr!=null&&k.x.arr<=ends[s];
      if(arrived&&k.shown){const u0=k.u;tween(700,e=>{if(k.run!==id)return;k.u=u0+(.96-u0)*e;I.road(k.g,k.x.a,k.x.b,k.u)}).then(()=>{if(k.run===id)k.g.setAttribute("opacity",0)})}
      else k.g.setAttribute("opacity",0);
      k.shown=false});
  });
})();

/* ===== a cut: where each cart of the morning was counted ===== */
(function(){
  const C=Census(),svg=$("#cutsvg"),say=$("#cutsay"),b1=$("#cutok"),b2=$("#cutbad");
  const nodes={1:[-90,"H1",HC[1],"P1"],2:[30,"H2",HC[2],"P2"],3:[150,"H3",HC[3],"P3"]};
  const P=Polar(svg,{vb:"0 0 620 600",cx:310,cy:330,r0:44,step:30,rings:7,tEnd:7.6,note:[14,24],nodes});
  const carts=C.items.filter(x=>x.k==="cart"),sashRec=C.recT;
  const whimRec={1:C.recT[1],2:4.8,3:C.recT[3]};   // House 2 counts after the cart of 20 came in
  const loop=el("path",{fill:"#e0b84a","fill-opacity":.22,stroke:"#1c1512","stroke-width":2.4,"stroke-dasharray":"7 5"},P.under);
  const dots=[1,2,3].map(h=>P.event(h,1.4,HC[h],8));
  const ang=[-90,30,150];
  function loopPath(rec){const pts=[];
    for(let a=-90;a<270;a+=4){const i=Math.min(2,Math.floor((a+90)/120)),j=(i+1)%3,f=(a-ang[i])/120,w=(1-Math.cos(Math.PI*f))/2,
      r=P.r(rec[i+1]+(rec[j+1]-rec[i+1])*w);pts.push(P.xy(a,r))}
    return "M"+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L")+"Z"}
  const lbl=[.5,.2,.8,.5];
  const arcs=carts.map((x,n)=>{const p=P.slip(x.a,x.sent,x.b,x.arr),d=p.getAttribute("d");
    const hit=el("path",{d,fill:"none",stroke:"transparent","stroke-width":18,"pointer-events":"stroke"},P.slips);
    const pts=P.arc(x.a,x.sent,x.b,x.arr),q=pts[Math.round((pts.length-1)*lbl[n])],t=el("text",{class:"tok-l",x:q[0],y:q[1]+5},P.over);t.textContent=x.n;
    return {x,p,hit,t}});
  /* where a cart was counted, given when each house recorded */
  const cls=(x,rec)=>{const early=x.sent<rec[x.a],arrIn=x.arr<rec[x.b];
    return early&&arrIn?"in":early&&!arrIn?"out":!early&&!arrIn?"after":"inward"};
  const says0={
    in:x=>`<b>The cart of ${x.n} jars from House ${x.a} to House ${x.b}</b> left before House ${x.a} recorded and arrived before House ${x.b} recorded. It lies wholly inside the loop, and the ${x.n} jars are counted in House ${x.b}'s stock.`,
    out:x=>`<b>The cart of ${x.n} jars from House ${x.a} to House ${x.b}</b> left before House ${x.a} recorded and arrived after House ${x.b} recorded. It crosses the loop outward: it was on the road at the time, and House ${x.b}'s slate for that road catches the ${x.n} jars.`,
    after:x=>`<b>The cart of ${x.n} jars from House ${x.a} to House ${x.b}</b> left after House ${x.a} recorded and arrived after House ${x.b} recorded. It lies wholly outside the loop. The ${x.n} jars are already in House ${x.a}'s recorded stock, and House ${x.b}'s slate for that road was closed before they came.`,
    inward:x=>`<b>The cart of ${x.n} jars from House ${x.a} to House ${x.b}</b> left after House ${x.a} recorded and arrived before House ${x.b} recorded. <span class="bad">It crosses the loop inward.</span> The ${x.n} jars are in House ${x.a}'s recorded stock, and counted again in House ${x.b}'s. Such an island never existed.`};
  const saysM={
    in:x=>`<b>The ${x.n}-unit message from P${x.a} to P${x.b}</b> was sent before P${x.a} recorded and arrived before P${x.b} recorded. It lies wholly inside the loop, and the ${x.n} units are counted in P${x.b}'s state.`,
    out:x=>`<b>The ${x.n}-unit message from P${x.a} to P${x.b}</b> was sent before P${x.a} recorded and arrived after P${x.b} recorded. It crosses the loop outward: it was in transit at the time, and P${x.b}'s record for that channel catches the ${x.n} units.`,
    after:x=>`<b>The ${x.n}-unit message from P${x.a} to P${x.b}</b> was sent after P${x.a} recorded and arrived after P${x.b} recorded. It lies wholly outside the loop. The ${x.n} units are already in P${x.a}'s recorded state, and P${x.b}'s record for that channel was closed before they came.`,
    inward:x=>`<b>The ${x.n}-unit message from P${x.a} to P${x.b}</b> was sent after P${x.a} recorded and arrived before P${x.b} recorded. <span class="bad">It crosses the loop inward.</span> The ${x.n} units are in P${x.a}'s recorded state, and counted again in P${x.b}'s. Such a state never existed.`};
  const says={};for(const k in says0)says[k]=x=>dual(says0[k](x),saysM[k](x));
  let rec=sashRec,sel=null,mode="ok";
  function paint(){
    loop.setAttribute("d",loopPath(rec));
    dots.forEach((g,i)=>{const [x,y]=P.pt(i+1,rec[i+1]);g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)});
    arcs.forEach(a=>{const c=cls(a.x,rec);a.c=c;a.p.classList.toggle("hi",c==="inward");a.p.classList.toggle("pick",a===sel&&c!=="inward");
      a.p.setAttribute("marker-end",`url(#${svg.id}-${c==="inward"?"r":"b"})`);a.t.classList.toggle("in",c==="inward")});
    const bad=arcs.filter(a=>a.c==="inward");
    if(sel)say.innerHTML=says[sel.c](sel.x);
    else if(bad.length)say.innerHTML=dual(`<b>Each house counted at an hour of its own choosing.</b> One cart crosses the loop inward. Choose it to see what that does to the count.`,`<b>Each process recorded at a time of its own choosing.</b> One message crosses the loop inward. Choose it to see what that does to the count.`);
    else say.innerHTML=dual(`<b>Each house recorded when the red sash reached it.</b> Every cart is wholly inside the loop, wholly outside it, or crosses it outward. Choose any cart to see where its jars were counted.`,`<b>Each process recorded when the marker reached it.</b> Every message is wholly inside the loop, wholly outside it, or crosses it outward. Choose any message to see where its units were counted.`)}
  arcs.forEach(a=>btn(a.hit,`The cart of ${a.x.n} jars from House ${a.x.a} to House ${a.x.b}`,`The ${a.x.n}-unit message from P${a.x.a} to P${a.x.b}`,()=>{sel=a;paint()}));
  function setMode(m){mode=m;rec=m==="ok"?sashRec:whimRec;sel=null;b1.classList.toggle("on",m==="ok");b2.classList.toggle("on",m!=="ok");
    if(m!=="ok")sel=arcs.find(a=>cls(a.x,rec)==="inward")||null;paint()}
  b1.onclick=()=>setMode("ok");b2.onclick=()=>setMode("bad");setMode("ok");
  if(arcs.some(a=>cls(a.x,sashRec)==="inward"))throw new Error("a cart crosses the cut upward under the sashes");
})();

/* ===== a morning nobody lived through: the sale and the milling ===== */
(function(){
  const lived=$("#mlived"),cens=$("#mcens"),say=$("#mosay"),bs=$("#moswap"),bj=$("#mojoin"),bb=$("#moback");
  const E={a:{h:1,t:dual("House 1 records its storehouse","P1 records its state")},b:{h:1,t:dual("House 1 sells forty jars into its port town","P1 spends forty units")},
           c:{h:2,t:dual("House 2 mills eighty measures of barley","P2 converts eighty units of one resource into another")},d:{h:2,t:dual("House 2 records its storehouse","P2 records its state")}};
  const WM={held:"held",sold:"spent",unmilled:"unconverted",milled:"converted"};
  const livedOrder=["a","b","c","d"],censusOrder=["a","c","d","b"];
  /* the state of the two goods after each entry: House 1's jars, House 2's barley */
  const states=order=>{let j="held",m="unmilled";return order.map(k=>{if(k==="b")j="sold";if(k==="c")m="milled";return {j,m}})};
  const matches=(o,s)=>states(o).some(x=>x.j===s.j&&x.m===s.m);
  const recorded={j:"held",m:"milled"};
  const html=(order,mark)=>{const st=states(order);return order.map((k,i)=>`<div class="ev ${mark&&mark.includes(k)?"mv":""} ${st[i].j===recorded.j&&st[i].m===recorded.m?"hit":""}" style="border-left-color:${HC[E[k].h]}"><span>${E[k].t}</span><span class="st">${dual(`jars ${st[i].j}<br>barley ${st[i].m}`,`P1's units ${WM[st[i].j]}<br>P2's units ${WM[st[i].m]}`)}</span></div>`).join("")};
  const base=()=>{lived.innerHTML=html(livedOrder);cens.innerHTML="<p style='font-size:.85rem;color:#6b5a48;margin:0'>Not yet drawn.</p>";bb.disabled=true;bs.disabled=false;
    say.innerHTML=dual("House 1 recorded first, and House 2 some while later. The count wrote down: House 1 still holds the jars, and House 2 has already milled its barley. Did the island ever stand so?","P1 recorded first, and P2 some while later. The snapshot wrote down: P1 still holds its units, and P2 has already converted its resource. Did the system ever stand so?")};
  bs.onclick=()=>{cens.innerHTML=html(censusOrder,["b","c"]);lived.innerHTML=html(livedOrder);bs.disabled=true;bb.disabled=false;
    say.innerHTML=dual(`Nothing joins the sale and the milling, so the count may take either first. <span class="${matches(livedOrder,recorded)?"bad":"ok"}">${matches(livedOrder,recorded)?"The morning as lived":"The morning as lived never"}</span> passed through the recorded picture; <span class="${matches(censusOrder,recorded)?"ok":"bad"}">the rearranged morning ${matches(censusOrder,recorded)?"does":"does not"}</span>, in the rows marked. Every one of its entries still happened, each house's own entries in their own order.`,
      `Nothing joins the spend and the conversion, so the snapshot may take either first. <span class="${matches(livedOrder,recorded)?"bad":"ok"}">${matches(livedOrder,recorded)?"The execution as it happened":"The execution as it happened never"}</span> passed through the recorded state; <span class="${matches(censusOrder,recorded)?"ok":"bad"}">the rearranged execution ${matches(censusOrder,recorded)?"does":"does not"}</span>, in the rows marked. Every one of its events still happened, each process's own events in their own order.`)};
  bj.onclick=()=>{say.innerHTML=dual("Could a cart tie the sale to the milling? A cart sent after House 1 recorded cannot reach House 2 before House 2 has recorded: the red sash is ahead of it on the track. So nothing joins an entry made after one house recorded to an entry made before the other recorded, and the two can always be swapped.","Could a message tie the spend to the conversion? A message sent after P1 recorded cannot reach P2 before P2 has recorded: the marker is ahead of it on the channel. So nothing joins an event made after one process recorded to an event made before the other recorded, and the two can always be swapped.")};
  bb.onclick=base;base();
})();

/* ===== what the total is good for: have the bandits robbed us? ===== */
(function(){
  const bs=$$("#dec .btn[data-case]"),tab=$("#dtab"),say=$("#decsay"),scrolls=270,cartSize=30;
  const cases={before:{name:"before",took:cartSize,after:0},after:{name:"after",took:0,after:cartSize},none:{name:"none",took:0,after:0}};
  /* a day with no buying or selling: only bandits can change the total */
  const deficit=held=>held<scrolls;
  function show(key){const c=cases[key];bs.forEach(b=>{b.classList.toggle("on",b.dataset.case===key);b.classList.toggle("alt",b.dataset.case!==key)});
    const atStart=scrolls-c.took,atCensus=scrolls-c.took,atEnd=scrolls-c.took-c.after;
    tab.innerHTML=`<tr><td>${dual("What the account scrolls say the houses hold","What the books say the processes hold")}</td><td>${scrolls}</td></tr><tr><td>${dual("The count's total, nine places","The snapshot's total, nine places")}</td><td>${atCensus}</td></tr><tr><td>Short by</td><td>${scrolls-atCensus}</td></tr><tr><td>${dual("The island when the count began","The system when the snapshot began")}</td><td>${deficit(atStart)?"short":"whole"}</td></tr><tr><td>${dual("The island when the count ended","The system when the snapshot ended")}</td><td>${deficit(atEnd)?"short":"whole"}</td></tr>`;
    if(deficit(atCensus)){if(!deficit(atEnd))throw new Error("a deficit was undone");
      say.innerHTML=dual(`<span class="bad">The count is short, so the houses have been robbed.</span> Being short is a settled property: once jars are gone that no trade between the houses can bring back, they stay gone. What is true of the recorded island is true of the island now, and the shortfall is what the bandits hold.`,`<span class="bad">The snapshot is short, so units have been lost.</span> Being short is a stable property: once units are gone that no exchange between the processes can bring back, they stay gone. What is true of the recorded state is true of the system now, and the shortfall is what the fault dropped.`)}
    else{if(deficit(atStart))throw new Error("the rule failed");
      say.innerHTML=dual(`<span class="ok">The count is whole, so nothing had been taken when it began.</span> That is all it says.${deficit(atEnd)?` <span class="bad">Here the bandits struck after the count ended, and the island is short now.</span> The count could not know, and does not claim to.`:" Here nothing has been taken since, either."}`,`<span class="ok">The snapshot is whole, so nothing had been lost when it began.</span> That is all it says.${deficit(atEnd)?` <span class="bad">Here the fault struck after the snapshot ended, and the system is short now.</span> The snapshot could not know, and does not claim to.`:" Here nothing has been lost since, either."}`)}
  }
  bs.forEach(b=>b.onclick=()=>show(b.dataset.case));show("before");
})();

/* ===== who is who ===== */
mapPairs($("#map"),[["A trading house","A process"],["A track, one way","A channel: FIFO, reliable, unbounded delay"],["What the road is holding","Channel state"],["The nine places","A global state: process states plus channel states"],["The red-sashed messenger","A marker message"],["The rule of sending","The marker-sending rule"],["The rule of receiving","The marker-receiving rule"],["A cut","A cut in a space-time diagram"],["Crossing the loop inward","An inconsistent cut"],["A settled property","A stable property"],["The island at the start, as recorded, at the end","S_begin, S*, S_end (S_ι, S*, S_φ in the paper)"]]);
REG.start();
})();

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

/* ===== the scholars' coast from above: the body of the island, its libraries each in a clearing, the stoa on the eastern shore ===== */
function Coast(svg,o={}){
  const n=o.n||8,W=440,H=340;
  svg.innerHTML="";svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
  el("path",{d:"M52 86C70 40 150 22 214 34c40 8 56-14 104 0 52 16 86 60 76 112-6 34 14 52-4 96-20 50-92 72-150 62-36-6-50 14-96 2C86 292 40 262 40 204c0-34-8-70 12-118z",fill:"#efe6cf",stroke:"#1c1512","stroke-width":5,class:"i"},svg);
  const under=el("g",{},svg),libs=el("g",{},svg),over=el("g",{},svg);
  /* the libraries' places, by number; the first few lie nearest the stoa */
  const AT=[[150,96],[262,84],[330,150],[306,236],[214,268],[112,236],[96,160],[212,168],[188,60],[356,96],[150,292],[66,112]];
  const C={svg,under,over,lib:[],stoa:[372,196],
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    pos(i){return i==="stoa"?C.stoa:[C.lib[i].x,C.lib[i].y]},
    fill(i,c){C.lib[i].b.setAttribute("fill",c)},
    note(i,s,m){C.lib[i].s[0].textContent=s;C.lib[i].s[1].textContent=m===undefined?s:m},
    way(a,b,cls="way"){const [x1,y1]=C.pos(a),[x2,y2]=C.pos(b);return el("path",{class:cls,d:`M${x1} ${y1}L${x2} ${y2}`},under)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:11,fill,stroke:"#1c1512","stroke-width":2.5},g);dtext(g,{},glyph,glyph);return g},
    run(g,a,b,u){const [x1,y1]=C.pos(a),[x2,y2]=C.pos(b);C.put(g,x1+(x2-x1)*u,y1+(y2-y1)*u)}
  };
  if(o.stoa!==false){el("rect",{x:C.stoa[0]-9,y:C.stoa[1]-26,width:18,height:52,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3,class:"i"},svg);
    el("text",{x:C.stoa[0]+2,y:C.stoa[1]+44,class:"lab halo i",style:"font-size:12px"},svg).textContent="the stoa";}
  for(let i=0;i<n;i++){const [x,y]=AT[i],g=el("g",{class:"lib"},libs);C.put(g,x,y);
    el("circle",{class:"ring",r:24},g);const b=el("circle",{class:"b",r:17,fill:"#fffaf0"},g);el("text",{},g).textContent=i+1;
    const s=dtext(g,{class:"lab halo",y:33,style:"font-size:12px;font-style:normal;font-family:var(--sans);font-weight:400"},"","");
    C.lib.push({x,y,g,b,s})}
  return C;
}
const seg=(box,opts,cur,fn)=>{box.innerHTML=opts.map(([v,t])=>`<button data-v="${v}" aria-pressed="${String(v)===String(cur)}">${t}</button>`).join("");
  $$("button",box).forEach(bt=>bt.onclick=()=>{$$("button",box).forEach(x=>x.setAttribute("aria-pressed",x===bt));fn(bt.dataset.v)})};
const oneIn=p=>p<=0?"none":p>=.95?"nearly all":p>=.095?`1 in ${Math.round(1/p)}`:`1 in ${Math.round(1/p).toLocaleString("en")}`;

/* the number of ways to choose r of n, and the chance that r home libraries heard from all lie among the n-w the edition has not reached */
const choose=(n,r)=>{if(r<0||r>n)return 0;let c=1;for(let i=1;i<=r;i++)c=c*(n-r+i)/i;return c};
const miss=(n,w,r)=>choose(n-w,r)/choose(n,r);
const pick=(n,k)=>{const a=[...Array(n).keys()];for(let i=0;i<k;i++){const j=i+rnd(n-i);[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,k)};
const pct=p=>p>=.9995?"more than 999 in 1,000":p>=.995?`${Math.round(p*1000)} in 1,000`:`${Math.round(p*100)} in 100`;

/* the cover, in computing: three replicas with messages in flight */
(function(){const C=Coast($("#coversvg"),{n:3,stoa:false});
  [[0,1,.5],[1,2,.45],[2,0,.4],[0,2,.6]].forEach(([a,b,u])=>{const g=C.token("#e0b84a","");g.setAttribute("opacity",1);C.run(g,a,b,u)})})();

/* ===== how many to wait for: three home libraries on the coast ===== */
(function(){
  const C=Coast($("#waitsvg"),{n:3,stoa:false}),say=$("#waitsay");let W=1,R=1;
  const clear=()=>{[0,1,2].forEach(i=>{C.fill(i,"#fffaf0");C.lib[i].g.classList.remove("mark");C.note(i,"")});
    say.innerHTML=W+R>3?dual(`${W} and ${R} add up to more than three. The two groups must share a home library.`,`${W} and ${R} add up to more than three. The two groups must share a replica.`):dual(`${W} and ${R} do not add up to more than three. The groups may miss each other.`,`${W} and ${R} do not add up to more than three. The groups may miss each other.`)};
  seg($("#ww"),[1,2,3].map(k=>[k,k]),W,v=>{W=+v;clear()});seg($("#wr"),[1,2,3].map(k=>[k,k]),R,v=>{R=+v;clear()});
  $("#waitgo").onclick=()=>{clear();const w=pick(3,W),r=pick(3,R);          // which home libraries answered the writer first, and which the reader hears from first
    w.forEach(i=>{C.fill(i,"#e0b84a");C.note(i,"new edition","new version")});[0,1,2].filter(i=>!w.includes(i)).forEach(i=>C.note(i,"old copy"));
    r.forEach(i=>C.lib[i].g.classList.add("mark"));
    const both=r.filter(i=>w.includes(i));
    const ls=r.map(i=>i+1).join(" and ");
    say.innerHTML=both.length?dual(`The reader hears from Library ${ls}. Library ${both[0]+1} holds the new edition, and the reader takes the newest copy heard. <span class="ok">The reader is handed the new edition.</span>`,`The client hears from Replica ${ls}. Replica ${both[0]+1} holds the new version, and the client takes the newest copy heard. <span class="ok">The client is handed the new version.</span>`)
      :dual(`The reader hears from Library ${ls}. ${r.length>1?"Neither holds":"It does not hold"} the new edition yet. <span class="bad">The reader is handed the old copy</span>, and nothing in the ${r.length>1?"replies says":"reply says"} so.`,`The client hears from Replica ${ls}. ${r.length>1?"Neither holds":"It does not hold"} the new version yet. <span class="bad">The client is handed the old copy</span>, and nothing in the ${r.length>1?"replies says":"reply says"} so.`)};
  clear();
})();

/* ===== the chance of a miss as the home libraries grow ===== */
$("#misstbl").innerHTML=`<tr><th>${dual("Home libraries","Replicas")}</th><th>Waited for, and asked</th><th>Chance of an old copy</th></tr>`+
  [[3,1],[10,3],[30,9],[100,30]].map(([n,k])=>{const p=miss(n,k,k);return `<tr><td>${n}</td><td>${k} and ${k}</td><td>${p>.05?pct(p):p>1e-4?`about 1 in ${Math.round(1/p)}`:`about ${(p*1e6).toFixed(1)} in a million`}</td></tr>`}).join("");

/* ===== leeway in editions ===== */
(function(){
  let W=1;const box=$("#kbars");
  const paint=()=>{const p=miss(3,W,1);box.innerHTML=[1,2,3,5,10].map(k=>{const ok=1-Math.pow(p,k);
    return `<div class="b"><span>${k===1?dual("the newest edition","the newest version"):`one of the newest ${k}`}</span><span class="v"><i style="width:${(ok*72).toFixed(1)}%"></i>${pct(ok)}</span></div>`}).join("")};
  seg($("#kw"),[[1,dual("one home library","one replica")],[2,dual("two home libraries","two replicas")]],W,v=>{W=+v;paint()});paint();
})();

/* ===== the four legs, drawn in the round ===== */
(function(){
  const P=Polar($("#legsvg"),{vb:"0 0 520 500",cx:260,cy:262,r0:40,step:26,rings:7,tEnd:7.6,note:[12,22],
    nodes:{W:[-90,"W","#e0b84a"],K:[30,"K","#f6eed6"],R:[150,"R","#8fb3d9"]}});
  const ev=(k,t,f,s)=>{P.event(k,t,f).label.textContent=s};
  P.slip("W",1.5,"K",6.6);P.slip("R",3.6,"K",4.9).classList.add("hi");P.slip("K",4.9,"R",6.2);
  ev("W",1.5,"#e0b84a",1);ev("W",2.7,"#e0b84a",2);ev("R",3.6,"#8fb3d9",3);ev("K",4.9,"#fde0d4",4);ev("K",6.6,"#e0b84a",5);
})();

/* ===== the replay (the paper's method): for each home library draw the four journeys; the edition is announced when the
   chosen number of acknowledgments is back; the reader asks t later and takes the first replies; the reader is
   behind when every one of those home libraries got the request before the edition. Journey times are drawn so that
   short ones are common and long ones rare (an exponential), with the edition's way out slowed by a chosen factor. ===== */
function replay(W,R,slow,t,runs){
  const ex=m=>-m*Math.log(1-Math.random());let stale=0;
  for(let n=0;n<runs;n++){const w=[],ack=[],req=[],back=[];
    for(let i=0;i<3;i++){w[i]=ex(slow);ack[i]=w[i]+ex(1);req[i]=ex(1);back[i]=req[i]+ex(1)}
    const told=[...ack].sort((a,b)=>a-b)[W-1];
    const first=[0,1,2].sort((a,b)=>back[a]-back[b]).slice(0,R);
    if(first.every(i=>told+t+req[i]<w[i]))stale++}
  return 1-stale/runs;
}
(function(){
  let W=1,R=1,slow=1;const box=$("#lbars"),say=$("#lsay");
  const blank=()=>{box.innerHTML="";say.textContent="Choose, then play."};
  seg($("#lw"),[1,2,3].map(k=>[k,k]),W,v=>{W=+v;blank()});seg($("#lr"),[1,2,3].map(k=>[k,k]),R,v=>{R=+v;blank()});
  seg($("#lslow"),[[.2,"five times quicker"],[1,"the same"],[10,"ten times slower"]],slow,v=>{slow=+v;blank()});
  $("#lgo").onclick=()=>{const ts=[0,1,3,10,30],res=ts.map(t=>replay(W,R,slow,t,10000));
    if(W+R>3&&res.some(p=>p<1))throw new Error("a stale reading with groups that must share a home library");
    box.innerHTML=`<h5>${dual("Chance of the new edition, a while after it is announced","Chance of the new version, a while after it is committed")}</h5>`+ts.map((t,k)=>`<div class="b"><span>${t?`${t} ${t>1?"journeys":"journey"} later`:"at once"}</span><span class="v"><i style="width:${(res[k]*68).toFixed(1)}%"></i>${pct(res[k])}</span></div>`).join("");
    say.innerHTML=W+R>3?dual(`<span class="ok">Never behind.</span> The groups share a home library, however the journeys fall.`,`<span class="ok">Never behind.</span> The groups share a replica, however the journeys fall.`):dual(`At once the reader is handed the new edition ${pct(res[0])}. A while is counted in ordinary journeys: the average time of one of the other three legs.`,`At once the client is handed the new version ${pct(res[0])}. A while is counted in ordinary journeys: the average time of one of the other three legs.`)};
})();

/* ===== the four coasts: the paper's measures ===== */
$("#cbars").innerHTML=[[dual("Quick roads, quick copying","Fast network, fast disks (LNKD-SSD)"),97.4],[dual("Long delays now and then","Occasional long delays (LNKD-DISK)"),89.3],[dual("Slow copying onto papyrus","Slow disk writes (YMMR)"),43.9],[dual("Home libraries on both sides of a sea","Replicas on both sides of an ocean (WAN)"),33]]
  .map(([t,v])=>`<div class="b"><span>${t}</span><span class="v"><i style="width:${(v*.7).toFixed(1)}%"></i>${v} in 100</span></div>`).join("");

/* ===== never going backwards ===== */
(function(){
  const p=miss(3,1,1);
  const paint=q=>{const k=1+q,bad=Math.pow(p,k);$("#bk").textContent=k;$("#bp").textContent=bad>.01?pct(bad):bad>1e-6?`1 in ${Math.round(1/bad).toLocaleString("en")}`:"less than 1 in a million";
    $("#bsay").innerHTML=q===0?dual("A reader who comes back before anything new is announced needs the very edition seen before, or a newer one that is on its way.","A client that comes back before anything new is committed needs the very version seen before, or a newer one that is on its way."):dual(`With ${q} announced between visits, any of the newest ${k} will do: ${k} chances of a miss, multiplied together.`,`With ${q} committed between visits, any of the newest ${k} will do: ${k} chances of a miss, multiplied together.`)};
  seg($("#bq"),[[0,"none"],[1,"1"],[4,"4"],[9,"9"],[99,"99"]],1,v=>paint(+v));paint(1);
})();

mapPairs($("#map"),[["A work's three home libraries","A data item's N replicas"],["An edition and its tally","A version and its timestamp"],["The writer sends the edition to every home library","The coordinator sends the write to all N replicas"],["Announced when enough home libraries have answered","The write commits after W acknowledgments"],["The reader takes the first few replies","The read returns after R responses"],["The two numbers add up to more than the home libraries","A strict quorum: R + W > N"],["The quick way: wait for one, ask one","A partial quorum"],["One of the newest few editions","k-staleness"],["The odds a while after the announcement","t-visibility"],["The four legs","The WARS model of message delays"],["The couriers' logbook, played over by lot","Measured latencies and Monte Carlo simulation"],["Never going backwards","Monotonic reads"],["Keeping to one home library","A sticky replica"]]);
REG.start();
})();

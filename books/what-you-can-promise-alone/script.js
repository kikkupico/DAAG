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
    now.textContent=cur.dataset.name||"";
    if(reduce)return;
    for(const d of dep){const r=d.parentElement.getBoundingClientRect(); const c=(r.top+r.height/2-innerHeight/2)/innerHeight; d.style.transform=`translateY(${(c*+d.dataset.depth).toFixed(1)}px)`+(d.classList.contains("tilt-r")?" rotate(1.2deg)":d.classList.contains("tilt-l")?" rotate(-1.4deg)":"")}
    for(const p of par){const r=p.parentElement.getBoundingClientRect(); const c=(r.top+r.height/2-innerHeight/2)/innerHeight; p.style.transform=`translateY(${(c*-9).toFixed(2)}%)`}
  });
}
addEventListener("scroll",onscroll,{passive:true}); addEventListener("resize",onscroll); onscroll();

/* ===== a scroll-driven stage: the step in the middle of the window drives render(i) ===== */
function stepDots(root,steps){
  const stage=$(".stage",root),nav=document.createElement("div"); nav.className="dots"; nav.setAttribute("role","group"); nav.setAttribute("aria-label","The steps of this picture");
  let cur=0; const go=i=>steps[i]&&steps[i].scrollIntoView({behavior:reduce?"auto":"smooth",block:"center"});
  const ctl=(cls,label,d,fn)=>{const b=document.createElement("button"); b.type="button"; b.className=cls; b.setAttribute("aria-label",label); b.title=label;
    if(d) b.innerHTML='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="'+d+'"/></svg>'; b.addEventListener("click",fn); return b};
  const prev=ctl("arr","Previous step","M7.5 2 3.5 6l4 4",()=>go(cur-1)), next=ctl("arr","Next step","M4.5 2l4 4-4 4",()=>go(cur+1)),
        back=ctl("arr back","Back to the first step","M2.6 6.4a3.5 3.5 0 1 0 1-2.8M2.4 1.6v2.2h2.2",()=>go(0));
  const dots=steps.map((s,i)=>{const h=$("h3",s); return ctl("dot","Step "+(i+1)+" of "+steps.length+(h?": "+h.textContent:""),"",()=>go(i))});
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
    el("rect",{x:-17,y:-12,width:34,height:24,rx:4,fill:nodes[k][2]||"#f6eed6"},g).style.fill=nodes[k][2]||"";el("text",{},g).textContent=nodes[k][1]}
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
  el("path",{d:"M52 86C70 40 150 22 214 34c40 8 56-14 104 0 52 16 86 60 76 112-6 34 14 52-4 96-20 50-92 72-150 62-36-6-50 14-96 2C86 292 40 262 40 204c0-34-8-70 12-118z",fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  const under=el("g",{},svg),libs=el("g",{},svg),over=el("g",{},svg);
  /* the libraries' places, by number; the first few lie nearest the stoa */
  const AT=[[150,96],[262,84],[330,150],[306,236],[214,268],[112,236],[96,160],[212,168],[188,60],[356,96],[150,292],[66,112]];
  const C={svg,under,over,lib:[],stoa:[372,196],
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    pos(i){return i==="stoa"?C.stoa:[C.lib[i].x,C.lib[i].y]},
    fill(i,c){C.lib[i].b.setAttribute("fill",c)},
    note(i,s){C.lib[i].s.textContent=s},
    way(a,b,cls="way"){const [x1,y1]=C.pos(a),[x2,y2]=C.pos(b);return el("path",{class:cls,d:`M${x1} ${y1}L${x2} ${y2}`},under)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:11,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph;return g},
    run(g,a,b,u){const [x1,y1]=C.pos(a),[x2,y2]=C.pos(b);C.put(g,x1+(x2-x1)*u,y1+(y2-y1)*u)}
  };
  if(o.stoa!==false){el("rect",{x:C.stoa[0]-9,y:C.stoa[1]-26,width:18,height:52,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3},svg);
    el("text",{x:C.stoa[0]+2,y:C.stoa[1]+44,class:"lab halo",style:"font-size:12px"},svg).textContent="the stoa";}
  for(let i=0;i<n;i++){const [x,y]=AT[i],g=el("g",{class:"lib"},libs);C.put(g,x,y);
    el("circle",{class:"ring",r:24},g);const b=el("circle",{class:"b",r:17,fill:"#fffaf0"},g);el("text",{},g).textContent=i+1;
    const s=el("text",{class:"lab halo",y:33,style:"font-size:12px;font-style:normal;font-family:var(--sans);font-weight:400"},g);
    C.lib.push({x,y,g,b,s})}
  return C;
}
const seg=(box,opts,cur,fn)=>{box.innerHTML=opts.map(([v,t])=>`<button data-v="${v}" aria-pressed="${String(v)===String(cur)}">${t}</button>`).join("");
  $$("button",box).forEach(bt=>bt.onclick=()=>{$$("button",box).forEach(x=>x.setAttribute("aria-pressed",x===bt));fn(bt.dataset.v)})};
const oneIn=p=>p<=0?"none":p>=.95?"nearly all":p>=.095?`1 in ${Math.round(1/p)}`:`1 in ${Math.round(1/p).toLocaleString("en")}`;

const shelfBox=(name,rows,foot="")=>`<div class="shelf"><h5>${name}</h5>${rows.join("")}${foot?`<div class="shown">${foot}</div>`:""}</div>`;
const it=(t,c="")=>`<span class="it${c?" "+c:""}">${t}</span>`;

/* ===== machines: read your writes across a partition ===== */
(function(){
  let a=0,b=0;const note=$("#mnote"),paint=()=>{$("#mxa").textContent=a;$("#mxb").textContent=b};
  $("#mw").onclick=()=>{a=1;paint();note.textContent="A commits the write. It cannot tell B, and it does not wait to."};
  $("#mra").onclick=()=>{note.innerHTML=`A answers ${a}.`+(a?` <span class="ok">The client reads its own write.</span>`:"")};
  $("#mrb").onclick=()=>{note.innerHTML=`B must answer, and answers ${b}.`+(a!==b?` <span class="bad">The client's own write is missing.</span> B has no way to learn of it.`:"")};
  paint();
})();

/* ===== the cord: a library shows a correction of a set only when the whole set has arrived ===== */
(function(){
  const box=$("#cshelves"),say=$("#csay");let cord=true,yHere,seen;
  /* what each library may show: with a cord, the new copy only once both corrections are in place */
  const shows=w=>{const here=w==="X"?true:yHere;return cord?(here&&yHere?"new":"old"):(here?"new":"old")};
  const paint=()=>{box.innerHTML=shelfBox("Library 1 · the work X",[it("correction to X, arrived",cord&&!yHere?"held":""),it("the old X","old")],`Shows a reader: <b>${shows("X")==="new"?"X corrected":"the old X"}</b>`)+
    shelfBox("Library 2 · the work Y",[yHere?it("correction to Y, arrived"):it("correction to Y, still on the road","none"),it("the old Y","old")],`Shows a reader: <b>${shows("Y")==="new"?"Y corrected":"the old Y"}</b>`)};
  function reset(){yHere=false;seen={};paint();say.textContent="The reader has asked for nothing yet."}
  const ask=w=>{seen[w]=shows(w);paint();const both=seen.X&&seen.Y;
    say.innerHTML=`The reader is shown ${seen[w]==="new"?w+" corrected":"the old "+w}.`+(both?(seen.X!==seen.Y?` <span class="bad">One work corrected and the other old: half of what was made together.</span>`:` <span class="ok">Both ${seen.X==="new"?"corrected":"old"}: the state ${seen.X==="new"?"after":"before"} the set, never between.</span>`):"")};
  $("#cx").onclick=()=>ask("X");$("#cy").onclick=()=>ask("Y");
  $("#carr").onclick=()=>{yHere=true;seen={};paint();say.textContent="The correction to Y is at Library 2, and the couriers' notes tell both libraries that the set is complete."};
  seg($("#cmode"),[["1","One cord round both corrections"],["0","No cord"]],"1",v=>{cord=v==="1";reset()});
  $("#creset").onclick=reset;reset();
})();

/* ===== the floor: every library shows only the edition it knows every library holds ===== */
(function(){
  const box=$("#fshelves"),say=$("#fsay");let h=[1,1,1],floor=1,newest=1;
  const paint=()=>{const f=Math.min(...h);if(f<floor)throw new Error("the floor fell");floor=f;
    box.innerHTML=h.map((e,i)=>shelfBox(`Library ${i+1}`,[it(`holds up to edition ${e}`,e>floor?"held":"")],`Shows a reader: <b>edition ${floor}</b>`)).join("");
    $("#ffloor").textContent=floor;$("#fnew").textContent=newest};
  $("#fwrite").onclick=()=>{h[0]=++newest;const was=floor;paint();say.innerHTML=`Edition ${newest} is at Library 1 only. Every library still shows edition ${floor}: the floor has not moved, and a reader may be ${newest-floor} ${newest-floor>1?"editions":"edition"} behind.`};
  const courier=i=>{const was=floor;h[i]=h[0];paint();say.innerHTML=floor>was?`Library ${i+1} now holds up to edition ${h[i]}. Edition ${floor} is everywhere, so <span class="ok">the floor rises to ${floor}</span> at every library.`:`Library ${i+1} now holds up to edition ${h[i]}. The floor stays at ${floor} until every library has it.`};
  $("#fc2").onclick=()=>courier(1);$("#fc3").onclick=()=>courier(2);paint();
})();

/* ===== staying with one library ===== */
(function(){
  const C=Coast($("#onesvg"),{n:2,stoa:false}),say=$("#onesay");let left=false;
  C.way(0,1,"way cut");C.note(0,"the old copy");C.note(1,"the old copy");
  $("#oleave").onclick=()=>{left=true;C.fill(0,"#e0b84a");C.note(0,"the correction");say.textContent="The correction is on Library 1's shelves. No courier can carry it to Library 2."};
  const back=i=>{if(!left){say.textContent="Leave a correction at Library 1 first.";return}
    [0,1].forEach(k=>C.lib[k].g.classList.toggle("mark",k===i));
    say.innerHTML=i===0?`Library 1 answers from its shelves. <span class="ok">The reader finds the correction.</span>`:`Library 2 must answer, from what it holds. <span class="bad">The reader's own correction is missing.</span> The librarian cannot find what nobody has brought.`};
  $("#oback1").onclick=()=>back(0);$("#oback2").onclick=()=>back(1);
})();

/* ===== a reply is held for its letter ===== */
(function(){
  const box=$("#lshelves"),say=$("#lsay");let hold=true,rep,let_;
  const shown=()=>{const s=[];if(let_)s.push("the letter");if(rep&&(let_||!hold))s.push("the reply");return s};
  const paint=()=>{const s=shown();box.innerHTML=shelfBox("Arrived at the reader's library",[let_?it("the letter"):it("the letter: not yet","none"),rep?it("the reply",hold&&!let_?"held":""):it("the reply: not yet","none")])+
    shelfBox("What a reader is shown",s.length?s.map(x=>it(x)):[it("neither, and whatever else the library holds","none")]);
    say.innerHTML=!rep&&!let_?"Neither has arrived.":s.includes("the reply")&&!s.includes("the letter")?`<span class="bad">The reader reads an answer to a question not yet seen.</span>`:rep&&!let_?"The reply is held back. The librarian still answers every other request.":s.length===2?`<span class="ok">The letter, and then the reply.</span>`:"The letter is shown. The reply has not arrived."};
  function reset(){rep=let_=false;paint()}
  $("#lrep").onclick=()=>{rep=true;paint()};$("#llet").onclick=()=>{let_=true;paint()};
  seg($("#lmode"),[["1","Replies are held for their letters"],["0","Everything is shown as it arrives"]],"1",v=>{hold=v==="1";reset()});
  $("#lreset").onclick=reset;reset();
})();

/* ===== the last copy ===== */
(function(){
  const box=$("#bshelves"),say=$("#bsay");let stopped=true,note,out;
  const paint=()=>box.innerHTML=[0,1].map(i=>shelfBox(`Library ${i+1}`,[it(`noted here: ${note[i]} ${note[i]===1?"copy":"copies"} on the shelf`,note[i]?"":"old")],out[i]?"A reader has borrowed the copy here.":"")).join("");
  function reset(){note=[1,1];out=[false,false];paint();say.textContent="Nobody has asked yet."}
  const borrow=i=>{if(note[i]<1){say.innerHTML=`Library ${i+1} has it noted as lent, and refuses. <span class="ok">One copy, one borrower.</span>`;return}
    note[i]=0;out[i]=true;if(!stopped)note[1-i]=0;paint();const n=out.filter(Boolean).length;
    say.innerHTML=n>1?`Library ${i+1} finds one copy noted and lends it. <span class="bad">Two readers now hold the one copy.</span> Each librarian was right by what could be seen.`:`Library ${i+1} finds one copy noted, lends it, and notes none.`+(stopped?" No courier carries the news.":" A courier carries the news to the other library.")};
  $("#b1").onclick=()=>borrow(0);$("#b2").onclick=()=>borrow(1);
  seg($("#bmode"),[["1","The couriers are stopped"],["0","The couriers are running"]],"1",v=>{stopped=v==="1";reset()});
  $("#breset").onclick=reset;reset();
})();

/* ===== the latest edition: any bound can be outlasted ===== */
(function(){
  const D={day:1,week:7,month:30},N={day:"a day",week:"a week",month:"a month"};let bound="day",stop="week";
  const paint=()=>{const broken=D[stop]>D[bound];
    $("#tsay").innerHTML=`On the last day of the stoppage Library 2 must still answer, with a copy ${N[stop]==="a day"?"a day":N[stop]} behind. `+(broken?`<span class="bad">That is more than ${N[bound]}: the promise is broken.</span>`:`That is within ${N[bound]}, this time. A longer stoppage would break it.`)};
  seg($("#tbound"),[["day","a day behind"],["week","a week behind"],["month","a month behind"]],bound,v=>{bound=v;paint()});
  seg($("#tstop"),[["day","a day"],["week","a week"],["month","a month"]],stop,v=>{stop=v;paint()});paint();
})();

mapPairs($("#map"),[["A library's reading room","A replica"],["A reader's visit","A transaction"],["The couriers stopped","A network partition"],["Answering alone, from one's own shelves","High availability"],["Staying with one library","Sticky availability"],["No half-made correction shown","Read committed"],["Corrections bound under one cord","Monotonic atomic view"],["The same answer twice in a visit","Repeatable reads of items and predicates"],["The floor of what every library holds","Reading at a lower bound every replica has"],["Never older than before","Monotonic reads"],["A reader finds their own corrections","Read your writes"],["A reply held for its letter","Writes follow reads"],["Two readers borrow the last copy","Lost update"],["A shelf left bare","Write skew"],["\"This is the latest edition\"","A recency guarantee; linearizability"]]);
})();

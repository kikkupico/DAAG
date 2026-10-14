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

/* ===== who is who: the setting on the left, the machine room on the right ===== */
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

/* ===== machines: a monotonic program and one that is not, on the same facts ===== */
(function(){
  const F=["copy(1)","copy(2)","claim(a)","copy(3)"];let n,out;
  const some=S=>S.some(f=>f.startsWith("copy"))?"{true}":"{}",none=S=>S.some(f=>f.startsWith("claim"))?"{}":"{true}";
  const paint=()=>{$("#mtbl").innerHTML="<tr><th>Input so far</th><th>“some copy exists”</th><th>“no claim exists”</th></tr>"+out.map(([i,a,b,r])=>`<tr><td>${i||"nothing"}</td><td>${a}</td><td${r?' class="was"':""}>${b}</td></tr>`).join("")};
  function reset(){n=0;out=[["",some([]),none([]),false]];paint();$("#mnote").textContent="Nothing has arrived. Each program outputs what it can."}
  $("#mnext").onclick=()=>{if(n>=F.length)return;n++;const S=F.slice(0,n),b=none(S),prev=out[out.length-1];
    if(prev[2]==="{true}"&&b==="{}"){prev[3]=true;$("#mnote").innerHTML=`<span class="bad">“No claim exists” had output true, and must retract it.</span> The other program has retracted nothing.`}
    else $("#mnote").textContent=n>=F.length?"All the input is in.":"The first program's output has only grown.";
    out.push([S.join(", "),some(S),b,false]);paint()};
  $("#mreset").onclick=reset;reset();
})();

/* ===== questions as rules on the facts heard so far ===== */
const anyCopy=S=>S.some(f=>f[0]==="copy"),noClaim=S=>!S.some(f=>f[0]==="claim");
(function(){
  const L=[["copy","Library 2 has made a copy"],["note","a reader is waiting"],["claim","Library 3 has claimed the work"],["copy","Library 4 has made a copy"]];
  let order,n,rows,took;const say=$("#gsay");
  const paint=()=>{$("#gtbl").innerHTML="<tr><th>Letter</th><th><i>Has any copy been made?</i></th><th><i>Has no one claimed this?</i></th></tr>"+rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]?"yes":"not yet known"}</td><td${r[3]?' class="was"':""}>${r[2]?"yes":"no"}</td></tr>`).join("")};
  function reset(){order=[0,1,2,3].sort(()=>Math.random()-.5);n=0;took=false;rows=[["none yet",anyCopy([]),noClaim([]),false]];paint();say.textContent="No letter has arrived. A library that answers the second question now is guessing."}
  $("#gnext").onclick=()=>{if(n>=4)return;n++;const S=order.slice(0,n).map(i=>L[i]),a=anyCopy(S),b=noClaim(S),p=rows[rows.length-1];
    if(p[1]&&!a)throw new Error("a growing question was taken back");
    if(p[2]&&!b){p[3]=true;took=true}
    rows.push([L[order[n-1]][1],a,b,false]);paint();
    say.innerHTML=p[2]&&!b?`<span class="bad">The yes to the second question must be taken back.</span>`:n>=4?`All four letters are in. The first question was never taken back${took?", in this order or any other":""}.`:a&&!p[1]?`<span class="ok">Yes to the first question</span>, and nothing still on the road can change it.`:"Nothing changes."};
  $("#greset").onclick=reset;reset();
})();

/* ===== the waiting chain and the unwanted work: links pooled as the libraries tell ===== */
(function(){
  const wait=[["A","B"],["B","C"],["C","A"]],cites=[["the canon","X"],["X","Y"],null];let told;
  const reach=(E,from,to)=>{const seen=new Set([from]),q=[from];while(q.length){const u=q.pop();E.forEach(([a,b])=>{if(a===u&&!seen.has(b)){seen.add(b);q.push(b)}})}return seen.has(to)};
  let ringFound;
  function paint(){const W=wait.filter((e,i)=>told[i]),Ci=cites.filter((e,i)=>e&&told[i]);
    const ring=W.some(([a,b])=>reach(W,b,a));if(ringFound&&!ring)throw new Error("a ring was unfound");ringFound=ring;
    $("#ring").innerHTML=wait.map(([a,b],i)=>`<li>Library ${i+1}: ${told[i]?`<b>${a} waits on ${b}</b>`:"has not told"}</li>`).join("");
    $("#ringsay").innerHTML=ring?`<span class="ok">A ring: nobody in it can go on.</span> No later news can undo it.`:"No ring found yet. That may change, and only one way.";
    const cited=reach(Ci,"the canon","Y");
    $("#cite").innerHTML=cites.map((e,i)=>`<li>Library ${i+1}: ${e?(told[i]?`<b>${e[0]} cites ${e[1]}</b>`:"has not told"):"holds Y, and knows of nothing citing it"}</li>`).join("");
    $("#citesay").innerHTML=cited?`<span class="bad">The canon reaches Y after all.</span> Had Library 3 thrown Y away on what it had heard, Y would be gone.`:`Nothing Library 3 has heard cites Y. It <i>looks</i> unwanted, and only hearing from everyone could make that sure.`}
  function reset(){told=[false,false,false];ringFound=false;paint()}
  [1,2,3].forEach(i=>$("#tell"+i).onclick=()=>{told[i-1]=true;paint()});$("#tellreset").onclick=reset;reset();
})();

/* ===== the roster ===== */
(function(){
  let roster=true,n;const TOTAL=4,say=$("#rsay");
  const paint=()=>{$("#rn").textContent=n;$("#rof").textContent=roster?TOTAL:"?";
    say.innerHTML=roster?(n>=TOTAL?`All ${TOTAL} libraries on the roster have been heard from. <span class="ok">Yes: every shelf is empty.</span>`:`${n} of ${TOTAL} heard from. The librarian waits for the other ${TOTAL-n}.`)
      :`${n} ${n===1?"name":"names"} heard. With no roster the librarian cannot tell the day the last name came in from a day it has not. <span class="bad">No answer can be given.</span>`};
  function reset(){n=0;paint()}
  $("#rnext").onclick=()=>{if(n<TOTAL)n++;paint()};$("#rreset").onclick=reset;
  seg($("#rmode"),[["1","The librarian has a roster"],["0","The librarian has no roster"]],"1",v=>{roster=v==="1";reset()});reset();
})();

/* ===== waiting only once: the reading list ===== */
(function(){
  const N=[{k:"add",t:"The Winds"},{k:"strike",t:"The Winds"},{k:"add",t:"The Tides"},{k:"close",names:[0,1,2]}];
  let manifest=true,got,closedWith;const box=$("#nshelves"),say=$("#nsay");
  const list=ids=>{const add=new Set(),struck=new Set();ids.forEach(i=>{if(N[i].k==="add")add.add(N[i].t);if(N[i].k==="strike")struck.add(N[i].t)});return [...add].filter(t=>!struck.has(t))};
  const full=list([0,1,2]).join();
  function paint(){const have=got.filter(i=>i<3);
    /* with a manifest the library closes when every notice it names has come; without, the moment the closing notice comes */
    if(closedWith===null&&got.includes(3)&&(!manifest||N[3].names.every(i=>got.includes(i))))closedWith=manifest?have.slice():got.slice(0,got.indexOf(3)).filter(i=>i<3);
    const held=got.includes(3)&&closedWith===null;
    box.innerHTML=`<div class="shelf"><h5>Arrived at the library</h5>${got.map(i=>`<span class="it${i===3&&held?" held":""}">${N[i].k==="close"?"closing notice"+(manifest?", naming three notices":""):`${N[i].k} <i>${N[i].t}</i>`}</span>`).join("")||'<span class="it none">nothing yet</span>'}</div>`+
      `<div class="shelf"><h5>${closedWith?"The list as closed":"The list so far"}</h5>${(closedWith?list(closedWith):list(have)).map(t=>`<span class="it"><i>${t}</i></span>`).join("")||'<span class="it none">no titles</span>'}</div>`;
    if(closedWith){const ok=list(closedWith).join()===full;
      if(manifest&&!ok)throw new Error("a list closed short with a manifest");
      say.innerHTML=ok?`The list is closed with everything the reader sent. <span class="ok">Only <i>The Tides</i> is fetched.</span>`:`<span class="bad">The list was closed the moment the closing notice came, without what was still on the road.</span> ${list(closedWith).length?"The library fetches <i>"+list(closedWith).join("</i> and <i>")+"</i>.":"The library fetches nothing."}`}
    else say.innerHTML=held?`The closing notice names three notices, and ${N[3].names.filter(i=>!got.includes(i)).length} of them ${N[3].names.filter(i=>!got.includes(i)).length===1?"has":"have"} not come. The library holds it, and waits for those and for no one else.`:got.length?"The library takes the notice in. Adds and strikes need no waiting, in any order.":"Nothing has arrived."}
  function reset(){got=[];closedWith=null;paint()}
  [0,1,2,3].forEach(i=>$("#n"+i).onclick=()=>{if(!got.includes(i)){got.push(i);paint()}});
  seg($("#nmode"),[["1","The closing notice carries a manifest"],["0","It carries none"]],"1",v=>{manifest=v==="1";reset()});
  $("#nreset").onclick=reset;reset();
})();

/* ===== the hall from above, and the sorting. Each question is a rule on a small set of possible facts;
   the page tries every set of facts and every larger set, and sends the question south only if no answer is ever lost. ===== */
(function(){
  const svg=$("#hallsvg");svg.setAttribute("viewBox","0 0 440 400");
  el("text",{x:220,y:26,class:"lab",style:"font-size:14px"},svg).textContent="north · the Chamber and the Tholos";
  el("text",{x:220,y:388,class:"lab",style:"font-size:14px"},svg).textContent="south · the scholars' coast";
  el("path",{class:"way",d:"M220 44V150"},svg);el("path",{class:"way",d:"M220 250V366"},svg);
  el("rect",{x:150,y:150,width:140,height:100,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  const dn=el("rect",{class:"door",x:196,y:138,width:48,height:22},svg),ds=el("rect",{class:"door",x:196,y:240,width:48,height:22},svg);
  el("text",{x:220,y:204,class:"lab",style:"font-size:13px"},svg).textContent="the hall";
  const tok=el("g",{class:"tok",opacity:0},svg);el("circle",{r:13,fill:"#e0b84a",stroke:"#1c1512","stroke-width":2.5},tok);el("text",{},tok).textContent="?";
  const paths=E=>{const r={};E.forEach(([a,b])=>{(r[a]=r[a]||new Set()).add(b)});return (from,to)=>{const seen=new Set([from]),q=[from];while(q.length){const u=q.pop();(r[u]||[]).forEach(b=>{if(!seen.has(b)){seen.add(b);q.push(b)}})}return seen.has(to)}};
  /* each: the possible facts, and the answers a set of facts supports */
  const Q=[
    {q:"Has at least one copy of this work been made?",U:["copy 1","copy 2","copy 3"],f:S=>S.length?["yes"]:[]},
    {q:"Is this every copy that has been made?",U:["copy 1","copy 2","copy 3","copy 4"],f:S=>S.includes("copy 4")?[]:["yes"]},
    {q:"Is there a ring of libraries each waiting on the next?",U:["A>B","B>C","C>A","C>D"],f:S=>{const E=S.map(x=>x.split(">")),p=paths(E);return E.some(([a,b])=>p(b,a))?["yes"]:[]}},
    {q:"Is this work cited by nothing the canon reaches?",U:["canon>X","X>Y","Z>Y"],f:S=>paths(S.map(x=>x.split(">")))("canon","Y")?[]:["yes"]},
    {q:"Which titles are on a catalogue that is only added to?",U:["add The Winds","add The Tides","add The Stars"],f:S=>S.map(x=>x.slice(4))},
    {q:"Which of two editions has the larger tally?",U:["edition at noon","edition at dusk"],f:S=>S.includes("edition at dusk")?["dusk or later"]:S.length?["noon or later"]:[],grow:(a,b)=>a.length===0||b.join()===a.join()||b[0]==="dusk or later"},
    {q:"Has the last copy been lent to no one else?",U:["lent at Library 1","lent at Library 2"],f:S=>S.length?[]:["yes"]},
    {q:"Is the shelf empty at every library?",U:["a scroll at Library 1","a scroll at Library 2","a scroll at Library 3"],f:S=>S.length?[]:["yes"]}];
  const subsets=U=>{const out=[];for(let m=0;m<1<<U.length;m++)out.push(U.filter((u,i)=>m>>i&1));return out};
  Q.forEach(o=>{const all=subsets(o.U);let tried=0,lost=null;
    for(const S of all)for(const T of all){if(!S.every(s=>T.includes(s)))continue;tried++;
      const a=o.f(S),b=o.f(T),ok=o.grow?o.grow(a,b):a.every(v=>b.includes(v));
      if(!ok&&!lost)lost=[S,T]}
    o.tried=tried;o.lost=lost});
  const box=$("#qs"),say=$("#qsay");
  box.innerHTML=Q.map((o,i)=>`<button data-i="${i}" aria-pressed="false">${o.q}</button>`).join("");
  $$("button",box).forEach(bt=>bt.onclick=async()=>{const o=Q[+bt.dataset.i],south=!o.lost;
    $$("button",box).forEach(b=>b.setAttribute("aria-pressed",b===bt));dn.classList.remove("on");ds.classList.remove("on");
    tok.setAttribute("opacity",1);tok.setAttribute("transform","translate(220 200)");
    say.innerHTML=south?`Tried on ${o.tried} pairs of a set of facts and a larger one: no answer given on the smaller was ever lost on the larger. It only grows. <span class="ok">It leaves by the scholars' door.</span>`
      :`Tried on ${o.tried} pairs. On <i>${o.lost[0].join(", ")||"no facts"}</i> the answer is yes; add <i>${o.lost[1].filter(v=>!o.lost[0].includes(v)).join(", ")}</i> and it is lost. It rests on an absence. <span class="bad">It leaves by the door of the assemblies.</span>`;
    await tween(900,u=>tok.setAttribute("transform",`translate(220 ${200+(south?1:-1)*110*u})`));(south?ds:dn).classList.add("on")});
})();

mapPairs($("#map"),[["A question brought to the hall","A program or query"],["The facts each library holds; the rest by courier","Input partitioned across machines; asynchronous messages"],["A question that only grows","A monotonic program"],["The same answers whatever the order of the news","Confluence"],["A question that rests on an absence","A non-monotonic program: negation, universal quantification"],["A ring of waiting","Deadlock detection"],["A work no one cites, thrown away","Garbage collection"],["The scholars' door","Coordination-free"],["The door of the assemblies","Coordination: consensus, commit protocols"],["The librarian with no roster","A machine that knows neither its own name nor the others'"],["The roster","Knowledge of the network's membership"],["The door that stays open when the couriers stop","Availability under partition"],["Closing a list with a manifest","Sealing the one non-monotonic step"],["Apologising for a lending","Compensation in place of coordination"]]);
})();

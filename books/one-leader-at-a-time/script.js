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

/* Schedia's five legislators, told apart by colour */
const WHO={O:{n:"Okios",g:"Ο",c:"#8fa3b8"},L:{n:"Liskovia",g:"Λ",c:"#e8b03a"},K:{n:"Kleon",g:"Κ",c:"#8fb35a"},M:{n:"Melissa",g:"Μ",c:"#cf5a4a"},T:{n:"Theron",g:"Θ",c:"#b3aea4"}};
const ALL=["O","L","K","M","T"];
const who=k=>`<span class="who"><i style="background:${WHO[k].c}"></i>${WHO[k].n}</span>`;
const yes=ok=>ok?"<span class='ok'>✓</span>":"<span class='bad'>✗</span>";
$("#cast").innerHTML=ALL.map(who).join("");

/* ===== machines: a primary, four backups, and what a majority holds ===== */
(function(){
  const box=$("#reps"),note=$("#mnote"),bo=$("#mop"),bf=$("#mfail"),names="ABCDE";
  let len,up,lead,ops;
  const committed=()=>[...len.filter((x,i)=>up[i])].sort((a,b)=>b-a)[2]||0;   // what at least three running machines hold
  function paint(){const c=Math.max(done,committed());done=c;box.innerHTML=len.map((n,i)=>`<div class="rep5${up[i]?"":" down"}${i===lead?" lead":""}"><h5>${names[i]}${i===lead?" · primary":up[i]?"":" · down"}</h5>${Array.from({length:n},(_,k)=>`<div class="op${k<c?" done":""}">op ${k+1}</div>`).slice(-6).join("")}</div>`).join("")}
  let done=0;
  function reset(){len=[2,2,2,2,2];up=[1,1,1,1,1];lead=0;ops=2;done=2;paint()}
  bo.onclick=()=>{ops=++len[lead];
    /* each backup is reached or not; one that is reached is brought fully up to date, in order */
    len.forEach((n,i)=>{if(i!==lead&&up[i]&&Math.random()<.6)len[i]=len[lead]});
    const c=committed();paint();
    note.innerHTML=c>=len[lead]?`Operation ${len[lead]} is held by a majority: <span class="ok">committed</span>.`:`Operation ${len[lead]} has not reached a majority yet. It is not committed, and nobody is told it is.`};
  bf.onclick=()=>{const was=done,old=lead;up[old]=0;
    const rest=[0,1,2,3,4].filter(i=>up[i]);
    if(rest.length<3){note.innerHTML="Fewer than three machines are running. No new primary can be chosen.";bo.disabled=bf.disabled=true;paint();return}
    /* three of those still running answer; the fullest log among them leads */
    const ans=rest.sort(()=>Math.random()-.5).slice(0,3),next=ans.reduce((a,b)=>len[b]>len[a]?b:a);
    if(len[next]<was)throw new Error("a committed operation was lost");
    const lost=Math.max(...len)-len[next];lead=next;len=len.map((n,i)=>up[i]?len[next]:n);paint();
    note.innerHTML=`${names[old]} fails. ${ans.map(i=>names[i]).join(", ")} answer, and ${names[next]} has the fullest log among them, so ${names[next]} becomes primary and the others take its log. <span class="ok">All ${was} committed operations are kept.</span>`+(lost>0?` ${lost} uncommitted ${lost>1?"operations are":"operation is"} lost.`:"");
    if(up.filter(Boolean).length<4){bf.disabled=true}};
  reset();
})();

/* ===== the Tholos, seen from above: the podium at the centre, five benches round the wall, the porch door below ===== */
function Tholos(svg,o={}){
  const cx=220,cy=215,rr=204,R=138,A={O:-90,L:-18,K:54,M:126,T:198};
  svg.innerHTML="";svg.setAttribute("viewBox","0 0 440 470");
  el("circle",{cx,cy,r:rr,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:R+36,fill:"none",stroke:"#b5602c","stroke-width":3,"stroke-dasharray":"3 8"},svg);
  el("rect",{x:cx-26,y:cy+rr-2,width:52,height:26,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3},svg);
  el("text",{x:cx,y:cy+rr+42,class:"lab",style:"font-size:12px"},svg).textContent="the porch";
  const under=el("g",{},svg),pod=el("g",{class:"podium"},svg),seats=el("g",{},svg),over=el("g",{},svg);
  const disc=el("circle",{cx,cy,r:34,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":4},pod),bt=el("text",{x:cx,y:cy},pod);
  const T={svg,cx,cy,under,over,seat:{},porch:[cx,cy+rr+12],
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    pos(k){return k==="P"?[cx,cy]:k==="porch"?T.porch:[T.seat[k].x,T.seat[k].y]},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:12,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph;return g},
    /* a runner or a note u of the way from one place to another */
    run(g,a,b,u){const [x1,y1]=T.pos(a),[x2,y2]=T.pos(b);T.put(g,x1+(x2-x1)*u,y1+(y2-y1)*u)},
    board(text,k){bt.textContent=text;disc.setAttribute("fill",k?WHO[k].c:"#d9cfb4");ALL.forEach(x=>T.seat[x].g.classList.toggle("holder",x===k))},
    note(k,s){T.seat[k].s.textContent=s},
    out(k,on){T.seat[k].g.classList.toggle("out",!!on)}
  };
  ALL.forEach(k=>{const [x,y]=T.at(A[k]),g=el("g",{class:"seat"},seats);T.put(g,x,y);
    el("circle",{class:"ring",r:31},g);el("circle",{class:"b",r:24,fill:WHO[k].c},g);el("text",{class:"g"},g).textContent=WHO[k].g;
    const s=el("text",{class:"s halo",y:A[k]<0&&A[k]>-180?-34:43},g);T.seat[k]={x,y,g,s}});
  return T;
}

/* ===== when a law passes: on the second word back ===== */
(function(){
  const T=Tholos($("#passsvg")),say=$("#passsay"),bw=$("#pwrite"),pl=$("#pline"),pp=$("#ppass");
  const hold={O:11,L:11,K:11,M:11,T:9},word={L:11,K:11,M:11,T:9},away={T:true},pace={L:800,K:1300,M:2400,T:1800};
  let line=11,passed=11,flying=0;
  T.board("board 6","O");
  function paint(){ALL.forEach(k=>{T.note(k,k==="O"?"":"to line "+hold[k]);T.out(k,away[k])});pl.textContent=line;pp.textContent=passed;bw.disabled=flying>0}
  /* a line has passed when two benches have sent word that they hold it and all before it */
  function count(){const n=Object.values(word).sort((a,b)=>b-a)[1];if(n>passed){passed=n;return true}return false}
  async function runner(k){
    if(away[k]||hold[k]>=line)return;flying++;paint();
    const g=T.token(WHO.O.c,line),carry=line;g.setAttribute("opacity",1);
    await tween(pace[k],u=>T.run(g,"P",k,.2+.62*u));
    if(away[k]){g.remove();flying--;paint();return}
    hold[k]=Math.max(hold[k],carry);paint();g.lastChild.textContent="✓";g.firstChild.setAttribute("fill",WHO[k].c);
    await tween(pace[k],u=>T.run(g,k,"P",.2+.62*u));g.remove();
    word[k]=Math.max(word[k],carry);flying--;
    const now=count();paint();
    if(now)say.innerHTML=`${WHO[k].n}'s word is the second to come back for line ${passed}. With Okios, three of five hold it: <span class="ok">line ${passed} has passed</span>, and the petitioner is told it is law.`;
    else if(passed>=carry)say.innerHTML=`${WHO[k].n}'s copy catches up to line ${carry}. The line had already passed, so nothing changes.`;
    else say.innerHTML=`${WHO[k].n} sends word: up to line ${carry}. One word is not enough. Line ${carry} is still a draft.`;
  }
  bw.onclick=()=>{line++;hold.O=line;const here=["L","K","M","T"].filter(k=>!away[k]);
    say.innerHTML=here.length?`Okios writes line ${line} and gives it to the runners.`:`Okios writes line ${line}, but no bench is within reach. It stays a draft.`;
    paint();here.forEach(runner)};
  ["L","K","M","T"].forEach(k=>{T.seat[k].g.classList.add("pick");button(T.seat[k].g,`${WHO[k].n}: step out or come back`,()=>{away[k]=!away[k];paint();
    if(away[k])say.innerHTML=`${WHO[k].n} steps out of reach. The tablets stay on the bench.`;
    else{say.innerHTML=`${WHO[k].n} is back within reach, and the runner brings every line missed, in order.`;runner(k)}})});
  paint();
})();

/* ===== board and line: which mark is the later ===== */
(function(){
  const M=[{b:6,w:"Okios",l:12},{b:6,w:"Okios",l:40},{b:7,w:"Kleon",l:3},{b:7,w:"Liskovia",l:1},{b:7,w:"Liskovia",l:12}],box=$("#marks"),say=$("#marksay");
  const name=m=>`board ${m.b}, ${m.w} · line ${m.l}`;let sel=[];
  /* boards by count, then by name in the order of the alphabet; under one board, by line */
  const cmp=(x,y)=>x.b-y.b||x.w.localeCompare(y.w)||x.l-y.l;
  box.innerHTML=M.map((m,i)=>`<button class="mark" data-i="${i}" aria-pressed="false">${name(m)}</button>`).join("");
  $$("button",box).forEach(bt=>bt.onclick=()=>{const i=+bt.dataset.i;if(sel.length===2||sel.includes(i))sel=[];sel.push(i);
    $$("button",box).forEach(x=>x.setAttribute("aria-pressed",sel.includes(+x.dataset.i)));
    if(sel.length<2){say.textContent="Now choose a second mark.";return}
    let [x,y]=sel.map(i=>M[i]);if(cmp(x,y)>0)[x,y]=[y,x];
    const why=x.b!==y.b?`board ${y.b} is the later board, whatever the line numbers`+(x.l>y.l?`. Line ${x.l} is a higher number than line ${y.l}, and still the older mark`:""):x.w!==y.w?`both are board ${y.b}, and ${x.w} comes before ${y.w} in the order of the alphabet`:`under the same board, the higher line is the later`;
    say.innerHTML=`<b>${name(y)}</b> is the later: ${why}.`});
})();

/* ===== the rule for forming a board, as the long edition states it =====
   Everyone last served under board 6, held by Okios; line 12 passed (Okios, Liskovia, Kleon). */
const HELD={O:12,L:12,K:12,M:10,T:10},PASSED=12;
function mayForm(ans){                       // ans[k]: "with" tablets, "without", or "none" (no answer)
  const w=ALL.filter(k=>ans[k]==="with"),x=ALL.filter(k=>ans[k]==="without");
  const maj=w.length+x.length>=3,c1=w.length>=3,c3=x.length>0&&ans.O==="with";
  /* the second condition needs a lost tablet from an older board; here every bench says board 6 */
  const forms=maj&&(c1||c3);
  let holder=null;
  if(forms){const top=Math.max(...w.map(k=>HELD[k])),best=w.filter(k=>HELD[k]===top);holder=best.includes("O")?"O":best[0]}
  return {maj,c1,c3,forms,holder,w,x};
}
/* try every way the five can answer: a board never forms without the passed line */
(function(){const opts=["with","without","none"];for(let n=0;n<243;n++){const a={};let m=n;ALL.forEach(k=>{a[k]=opts[m%3];m=Math.floor(m/3)});const r=mayForm(a);
  if(r.forms&&HELD[r.holder]<PASSED)throw new Error("a board formed without line 12: "+JSON.stringify(a))}})();
function verdict(r,checks,say){
  checks.innerHTML=`<li><b>A majority has answered</b> ${yes(r.maj)} (${r.w.length+r.x.length} of 5)</li>`+
    `<li><b>First:</b> a majority answered with tablets ${yes(r.c1)} (${r.w.length} of 5)</li>`+
    `<li><b>Third:</b> same board, and its holder Okios answered with tablets ${r.x.length?yes(r.c3):"· no tablets are lost"}</li>`;
  say.innerHTML=r.forms?`<span class="ok">Board 7 forms.</span> ${WHO[r.holder].n} shows the latest line${r.holder==="O"?" and held the podium before, so nothing changes but the board":""}, takes the podium holding line ${HELD[r.holder]}, and opens the board with the whole law.`
    :r.maj?`<span class="bad">No board forms.</span> A majority answered, but the answers cannot be sure of showing line 12. The caller waits and calls again.`
    :`<span class="bad">No board forms.</span> Fewer than three have answered. The caller waits and calls again.`;
}
(function(){
  const box=$("#formans"),checks=$("#formchecks"),say=$("#formsay"),ex={O:"without",L:"none",K:"none",M:"with",T:"with"};let ans={...ex};
  const lab={with:"with tablets",without:"without",none:"out of reach"};
  function paint(){box.innerHTML=ALL.map(k=>`<div class="r"><div>${who(k)}</div><div class="seg" role="group" aria-label="${WHO[k].n}'s answer">${Object.keys(lab).map(v=>`<button data-k="${k}" data-v="${v}" aria-pressed="${ans[k]===v}">${lab[v]}</button>`).join("")}</div></div>`).join("");
    $$("button",box).forEach(bt=>bt.onclick=()=>{ans[bt.dataset.k]=bt.dataset.v;paint();$(`button[data-k="${bt.dataset.k}"][data-v="${bt.dataset.v}"]`,box).focus()});
    verdict(mayForm(ans),checks,say)}
  $("#formreset").onclick=()=>{ans={...ex};paint()};paint();
})();

/* ===== scrollytelling: a change of board ===== */
(function(){
  const T=Tholos($("#changesvg")),side=$("#changeside");
  /* how things stand at each step: board and line at each bench, who is out, the board on the post */
  const b6=n=>`6 · ${n}`,b7=n=>`7 · ${n}`;
  const ST=[
    {post:["board 6","O"],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{},n:"Okios holds the podium"},
    {post:["board 6",null],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{O:1},n:"no note from Okios"},
    {post:["board 6",null],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{O:1},n:"Liskovia invites all to board 7"},
    {post:["board 6",null],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{O:1},n:"three answers, all with tablets"},
    {post:["board 7","L"],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{O:1},n:"Liskovia takes the podium"},
    {post:["board 7","L"],h:{O:b6(13),L:b7(1),K:b7(1),M:b7(1),T:b7(1)},out:{O:1},n:"the opening line: the whole law to line 12"},
    {post:["board 7","L"],h:{O:b7(1),L:b7(1),K:b7(1),M:b7(1),T:b7(1)},out:{},n:"Okios joins board 7; line 13 is smoothed away"}];
  /* notes and runners: from, to, glyph, colour, and where each is at which step */
  const toks=[["L","K","7","L",{2:.5}],["L","M","7","L",{2:.5}],["L","T","7","L",{2:.5,3:.62}],["L","O","7","L",{2:.45}],
              ["K","L","12","K",{3:.55}],["M","L","10","M",{3:.55}],
              ["P","K","1","L",{5:.6}],["P","M","1","L",{5:.6}],["P","T","1","L",{5:.6}],["P","O","1","L",{6:.6}]]
    .map(([a,b,g,c,plan])=>({a,b,plan,g:T.token(WHO[c].c,g),u:.2,run:0,end:Math.max(...Object.keys(plan))}));
  scrolly($("#change"),s=>{const S=ST[s];T.board(S.post[0],S.post[1]);
    ALL.forEach(k=>{T.out(k,S.out[k]);T.note(k,S.h[k])});
    side.innerHTML=ALL.map(k=>`<div class="hc"><h5>${WHO[k].n}</h5><div>board ${S.h[k].split(" · ")[0]}, line ${S.h[k].split(" · ")[1]}</div><div class="chk">${S.out[k]?"out of reach":k===S.post[1]?"holds the podium":""}</div></div>`).join("")+`<div class="hc" style="grid-column:1/-1;min-height:0"><div class="chk" style="margin:0">${S.n}</div></div>`;
    toks.forEach(k=>{const u=k.plan[s],id=++k.run;
      if(u==null){k.g.setAttribute("opacity",0);k.u=s>k.end?.8:.2;T.run(k.g,k.a,k.b,k.u);return}
      k.g.setAttribute("opacity",1);const u0=k.u;tween(800,e=>{if(k.run!==id)return;k.u=u0+(u-u0)*e;T.run(k.g,k.a,k.b,k.u)})});
  });
})();

/* ===== the holder who has not noticed: lines written on the porch reach nobody who will take them ===== */
(function(){
  const T=Tholos($("#porchsvg")),say=$("#porchsay"),bw=$("#porchwrite"),n=$("#porchn");
  let heard=false,busy=false;const og=T.token(WHO.O.c,WHO.O.g);
  T.board("board 7","L");T.out("O",true);T.note("O","on the porch");
  T.put(og,...T.porch);og.setAttribute("opacity",1);el("text",{class:"lab halo",x:T.porch[0]+48,y:T.porch[1]+4,style:"font-size:12px;text-anchor:start"},T.over).textContent="board 6";
  function paint(){["L","K","M"].forEach(k=>T.note(k,"board 7"));T.note("T",heard?"board 7":"board 6")}
  T.seat.T.g.classList.add("pick");
  button(T.seat.T.g,"Theron: has he heard of board 7?",()=>{if(busy)return;heard=!heard;paint();n.textContent=1;say.textContent=heard?"Theron has taken board 7.":"Theron has not heard of board 7."});
  bw.onclick=async()=>{busy=true;bw.disabled=true;let took=1;n.textContent=took;say.textContent="Okios writes a line under board 6 and sends it to every bench.";
    await Promise.all(["L","K","M","T"].map(async k=>{const g=T.token(WHO.O.c,"6");g.setAttribute("opacity",1);
      await tween(1300,u=>T.run(g,"porch",k,.1+.74*u));
      const takes=k==="T"&&!heard;g.lastChild.textContent=takes?"✓":"✗";g.firstChild.setAttribute("fill",takes?"#a9c25a":"#fde0d4");if(takes)took++;
      await sleep(900);g.remove()}));
    if(took>=3)throw new Error("a line passed under the old board");
    n.textContent=took;
    say.innerHTML=`Liskovia, Kleon and Melissa have taken board 7 and refuse any note that carries board 6. ${heard?"So does Theron.":"Theron takes the line."} ${took===1?"Only Okios holds it":"Two hold it"}, and a line needs three. <span class="bad">It cannot pass.</span> Board 7 formed on three, which leaves at most one other who might take his lines.`;
    busy=false;bw.disabled=false};
  paint();
})();

/* ===== wax and stone: who goes home, and whether a board can ever form again ===== */
(function(){
  const T=Tholos($("#waxsvg")),checks=$("#waxchecks"),say=$("#waxsay");let home={};
  T.board("board 6","O");
  function paint(){const ans={};ALL.forEach(k=>{ans[k]=home[k]?"without":"with";T.out(k,home[k]);T.note(k,home[k]?"smooth wax":"to line "+HELD[k])});
    const r=mayForm(ans);verdict(r,checks,say);
    if(!r.forms)say.innerHTML=`<span class="bad">No board forms, tonight or ever.</span> All five have answered, so there is nobody left to wait for, and too few answers can show what passed. The council stops for good. The law is lost, but no board starts without line 12.`}
  ALL.forEach(k=>{T.seat[k].g.classList.add("pick");button(T.seat[k].g,`${WHO[k].n}: go home or stay`,()=>{home[k]=!home[k];paint()})});
  $("#waxreset").onclick=()=>{home={};paint()};paint();
})();

/* ===== relevance map ===== */
mapPairs($("#map"),[["The council of five, each with a copy of the law","A group of replicas"],["The law; a line","The group's state; one record in the log"],["Slow or lost messengers","A network that loses and delays messages"],["Stepping out","Being cut off for a while"],["Going home","A crash that loses what was in memory"],["The podium and its holder","The primary"],["The benches","The backups"],["A runner who never skips a line","In-order delivery from primary to backup"],["A law passes","An operation is committed: a majority hold it"],["A board","A view"],["Board and line","A viewstamp"],["The roll; the caller","Liveness messages; the member that starts a view change"],["An answer with tablets, or without","An acceptance with state, or after a crash"],["The opening line","The new view's first record: the whole state"],["Wax and the stone","Volatile state, and the little kept on stable storage"]]);
})();

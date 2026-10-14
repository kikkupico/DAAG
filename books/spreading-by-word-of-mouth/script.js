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

/* ===== machines: mail loses some, and reconciling pairs at random catches them ===== */
(function(){
  const N=30,box=$("#mcells"),note=$("#mnote"),bm=$("#mmail"),br=$("#mrec");let has,round;
  box.innerHTML="<i></i>".repeat(N);const cell=$$("i",box);
  const paint=()=>cell.forEach((c,i)=>c.className=has[i]?"h":"");
  function reset(){has=Array(N).fill(false);has[0]=true;round=0;paint()}
  bm.onclick=()=>{reset();let lost=0;for(let i=1;i<N;i++){if(Math.random()<.15)lost++;else has[i]=true}
    if(!lost){has[1+rnd(N-1)]=false;lost=1}
    paint();has.forEach((h,i)=>{if(!h)cell[i].className="x"});br.disabled=false;
    note.innerHTML=`${lost} ${lost>1?"messages were":"message was"} lost. The sender does not know which, and the replicas that missed it do not know there was anything to miss.`};
  br.onclick=()=>{round++;const was=has.slice();
    for(let i=0;i<N;i++){let j=rnd(N-1);if(j>=i)j++;if(was[i]||was[j])has[i]=has[j]=true}   // each picks one at random, and the two reconcile
    paint();const left=has.filter(h=>!h).length;has.forEach((h,i)=>{if(!h)cell[i].className="x"});
    note.innerHTML=left?`Round ${round}: every replica picks another at random and the two reconcile. ${left} still lack the update.`:`Round ${round}: <span class="ok">every replica holds the update.</span> Nobody had to know who was missed.`;
    if(!left)br.disabled=true};
  reset();
})();

/* ===== the festival: every copyist draws one name by lot; the pair give, ask, or both ===== */
(function(){
  const N=100,box=$("#fcells"),say=$("#fsay"),fy=$("#fyear"),fh=$("#fhave"),go=$("#fgo");let has,year,mode="give";
  box.innerHTML="<i></i>".repeat(N);const cell=$$("i",box);
  const paint=()=>{cell.forEach((c,i)=>c.className=has[i]?"h":"");fy.textContent=year;fh.textContent=has.filter(Boolean).length};
  function reset(){has=Array(N).fill(false);has[rnd(N)]=true;year=0;go.disabled=false;paint();say.textContent="One library holds the new edition. Every copyist draws one name by lot."}
  seg($("#fmode"),[["give","the newer gives"],["ask","the older asks"],["both","both"]],mode,v=>{mode=v;reset()});
  go.onclick=()=>{year++;const was=has.slice();let gained=0;
    for(let i=0;i<N;i++){let j=rnd(N-1);if(j>=i)j++;                 // i has drawn j's name
      if(mode!=="ask"&&was[i]&&!has[j]){has[j]=true;gained++}        // giving: the one who drew hands the newer edition over
      if(mode!=="give"&&was[j]&&!has[i]){has[i]=true;gained++}}      // asking: the one who drew asks for it
    paint();const n=has.filter(Boolean).length;
    say.innerHTML=n===N?`After ${year} festivals <span class="ok">every library holds the new edition.</span>`:`Festival ${year}: ${gained} more ${gained===1?"library takes":"libraries take"} the new edition. ${N-n} still lack it.`;
    if(n===N)go.disabled=true};
  $("#freset").onclick=reset;reset();
  /* when few remain: the two rules, applied five times to one library in ten */
  const n=1000;let a=.1,g=.1,rows="<tr><th>After festival</th><th>asking: still without</th><th>giving: still without</th></tr>";
  for(let k=0;k<=5;k++){rows+=`<tr><td>${k||"at the start"}</td><td>${a*n<.5?"none on a coast of a thousand":oneIn(a)}</td><td>${oneIn(g)}</td></tr>`;a=a*a;g=g*Math.pow(1-1/n,n*(1-g))}
  $("#ftbl").innerHTML=rows;
})();

/* ===== word of mouth among a thousand libraries =====
   mode "tell": each day every scholar still telling picks one library by lot and tells it.
   mode "ask":  each day every library asks one other, and a scholar still telling hands the scrap over.
   A telling is idle when the hearer already had the scrap. Attentive scholars lose interest only on idle
   tellings, blind ones on any; by toss at one chance in the allowance, or by count once the allowance is reached.
   An attentive scholar who counts starts the count afresh after a telling that was needed, and judges a telling
   by what the hearer held when the day began: with those two the runs give the paper's Table 1. Its figures for
   the toss come from its continuous model, which a telling judged at the moment reproduces.
   A scholar who is asked by several in one day counts that day as idle only if none of them needed the scrap,
   and starts the count afresh if any did (the paper's note to Table 3). */
function gossip(N,o){
  const st=new Uint8Array(N),cnt=new Uint16Array(N);let sent=0,day=0;st[rnd(N)]=1;       // 0 has not heard, 1 still telling, 2 has stopped
  const tire=(i,idle)=>{if(o.attentive&&!idle){if(o.count)cnt[i]=0;return}
    if(o.count){if(++cnt[i]>=o.k)st[i]=2}else if(Math.random()<1/o.k)st[i]=2};
  function step(){day++;const was=st.slice(),asked=new Uint8Array(N);                    // asked: 1 idle so far today, 2 someone needed it
    for(let i=0;i<N;i++){let j=rnd(N-1);if(j>=i)j++;
      if(o.mode==="ask"){if(was[j]!==1)continue;
        sent++;if(st[i]===0){st[i]=1;asked[j]=2}else if(!asked[j])asked[j]=1;continue}
      if(was[i]!==1||st[i]!==1)continue;
      sent++;const idle=(o.count?was[j]:st[j])!==0;if(st[j]===0)st[j]=1;tire(i,idle)}
    if(o.mode==="ask")for(let j=0;j<N;j++)if(asked[j])tire(j,asked[j]===1);
    return st.some(x=>x===1)}
  return {st,step,get day(){return day},get m(){return sent/N},get left(){return st.reduce((a,x)=>a+(x===0),0)}};
}
function gossipWell(ids,opts,line){
  const N=1000,box=$(ids.cells),say=$(ids.say),go=$(ids.go);let run=0;
  box.innerHTML="<i></i>".repeat(N);const cell=$$("i",box),cls=["","t","d"];
  const show=G=>{for(let i=0;i<N;i++){const c=cls[G.st[i]];if(cell[i].className!==c)cell[i].className=c}
    $(ids.res).textContent=G.left;$(ids.m).textContent=G.m.toFixed(1);$(ids.day).textContent=G.day};
  go.onclick=async()=>{const id=++run,G=gossip(N,opts());let more=true;go.textContent="Start again";
    say.textContent="The scrap starts at one library.";
    while(more&&id===run){more=G.step();show(G);await sleep(110);
      if(box.getBoundingClientRect().bottom<0||box.getBoundingClientRect().top>innerHeight){more=false;say.textContent="Stopped: the telling is out of sight. Start again when you are back.";return}}
    if(id===run)say.innerHTML=line(G,N)};
  return ()=>{run++;cell.forEach(c=>c.className="");[ids.res,ids.m,ids.day].forEach(s=>$(s).textContent=0);go.textContent=ids.label;say.textContent=ids.idle};
}
(function(){
  const o={k:1,attentive:true,count:true,mode:"tell"};
  const reset=gossipWell({cells:"#gcells",say:"#gsay",go:"#ggo",res:"#gres",m:"#gm",day:"#gday",label:"Start the telling",idle:"Pale: has not heard. Gold: still telling. Green: has stopped."},()=>({...o}),
    (G,N)=>`The last teller stopped on day ${G.day}. <b>${G.left}</b> of ${N} libraries never heard, after ${G.m.toFixed(1)} tellings a library. One over the exponential of ${G.m.toFixed(1)} is about ${Math.round(N*Math.exp(-G.m))} in ${N}.`);
  seg($("#gk"),[1,2,3,4,5].map(k=>[k,k]),o.k,v=>{o.k=+v;reset()});
  seg($("#gfb"),[["1","attentive"],["0","blind"]],"1",v=>{o.attentive=v==="1";reset()});
  seg($("#gct"),[["1","by count"],["0","on a toss"]],"1",v=>{o.count=v==="1";reset()});
})();
(function(){
  const o={k:1,attentive:true,count:true,mode:"ask"};
  const reset=gossipWell({cells:"#acells",say:"#asay",go:"#ago",res:"#ares",m:"#am",day:"#aday",label:"Start",idle:"Choose telling or asking, and an allowance. A scholar asked by several in a day counts the day as wasted only if none of them needed the scrap, and starts the count afresh if any did."},()=>({...o}),
    (G,N)=>`It ended on day ${G.day}. <b>${G.left}</b> of ${N} libraries never heard, after ${G.m.toFixed(1)} tellings a library. ${o.mode==="ask"?(G.left<=Math.round(N*Math.exp(-G.m))?"That is fewer than telling leaves for the same number of tellings.":"A run can fall either side of what telling leaves; run it again."):"Telling pays the price of one over the exponential."}`);
  seg($("#amode"),[["tell","telling"],["ask","asking"]],o.mode,v=>{o.mode=v;reset()});
  seg($("#ak"),[1,2,3].map(k=>[k,k]),o.k,v=>{o.k=+v;reset()});
})();

/* ===== withdrawing: what a library holds of one work is nothing, an edition, or a notice; each has a tally ===== */
const itemHtml=x=>!x?'<span class="it none">nothing of the work</span>':x.gone?`<span class="it gone">edition, day ${x.t}</span>`:x.notice?`<span class="it nt">notice of withdrawal, day ${x.t}${x.woke?`, awake since day ${x.woke}`:""}</span>`:`<span class="it">edition, day ${x.t}</span>`;
const shelfHtml=(name,items)=>`<div class="shelf"><h5>${name}</h5>${items.map(itemHtml).join("")}</div>`;
/* when two libraries compare one work: the later tally stands on both shelves; a library holding nothing takes what the other has */
function meet(a,b){if(!a)return [b,b,"take"];if(!b)return [a,a,"take"];return a.t>=b.t?[a,a,"later"]:[b,b,"later"]}
(function(){
  const box=$("#wshelves"),say=$("#wsay"),go=$("#wgo");let mode="strike",a,b;
  function reset(){a=mode==="strike"?null:{notice:true,t:5};b={t:3};go.disabled=false;
    box.innerHTML=shelfHtml("Library 1",[a])+shelfHtml("Library 2",[b]);
    say.textContent=mode==="strike"?"Library 1 has struck the work off its shelf. Library 2 still holds the old edition, written on day 3.":"Library 1 has struck the work and keeps a notice of withdrawal, written on day 5. Library 2 still holds the old edition, written on day 3."}
  seg($("#wmode"),[["strike","It only struck the work"],["notice","It left a notice of withdrawal"]],mode,v=>{mode=v;reset()});
  go.onclick=()=>{const [x,y,why]=meet(a,b);box.innerHTML=shelfHtml("Library 1",[x])+shelfHtml("Library 2",x.notice?[{...b,gone:true},y]:[y]);go.disabled=true;
    say.innerHTML=x.notice?`The notice's tally is later than the edition's. Library 2 strikes its old edition and keeps the notice. <span class="ok">The work is withdrawn at both.</span>`
      :`Library 1 holds nothing of the work, so it takes Library 2's edition. <span class="bad">The work is back on its shelf.</span>`};
  $("#wreset").onclick=reset;reset();
})();
(function(){
  const box=$("#tshelves"),say=$("#tsay"),old={t:3},back={t:8};
  const start=()=>box.innerHTML=shelfHtml("A warden",[{notice:true,t:5},old])+shelfHtml("Another library",[back]);
  /* a notice strikes an edition exactly when the notice's first tally is the later */
  function wake(fresh){const n=fresh?{notice:true,t:10}:{notice:true,t:5,woke:10},hit=e=>({...e,gone:n.t>e.t});
    const o=hit(old),bk=hit(back);
    box.innerHTML=shelfHtml("A warden",[n,o])+shelfHtml("Another library",[n,bk]);
    say.innerHTML=fresh?`The woken notice carries day 10. It strikes the old edition of day 3, and ${bk.gone?`<span class="bad">it strikes the edition of day 8 as well</span>, which was written after the withdrawal to bring the work back.`:"spares the edition of day 8."}`
      :`The woken notice still says the work was withdrawn on day 5, and is awake since day 10, so it is carried again. It strikes the old edition of day 3. ${bk.gone?"It strikes day 8 as well.":`<span class="ok">The edition of day 8 stands.</span>`}`}
  $("#tone").onclick=()=>wake(true);$("#ttwo").onclick=()=>wake(false);start();
})();

/* ===== near partners: the paper's measures, drawn as bars ===== */
(function(){
  const rows=[["Meetings on the ferry at a festival",75.7,2.4],["Meetings on an average road",5.9,1.4],["Festivals until the last library hears",7.8,13.3]];
  $("#fbars").innerHTML=rows.map(([t,a,b])=>{const mx=Math.max(a,b);return `<h5>${t}</h5>`+
    `<div class="b"><span>partners by lot</span><span class="v"><i style="width:${(a/mx*78).toFixed(1)}%"></i>${a}</span></div>`+
    `<div class="b"><span>nearer first</span><span class="v"><i class="n" style="width:${(b/mx*78).toFixed(1)}%"></i>${b}</span></div>`}).join("");
})();

/* ===== relevance map ===== */
mapPairs($("#map"),[["A library, holding copies","A site with a replica of the database"],["A work; an edition","A key; its value"],["The tally; the larger tally wins","A timestamp; the later write wins"],["A scrap of papyrus","An update"],["Letters to every library","Direct mail"],["The festival: pairs by lot compare collections","Anti-entropy"],["Giving, asking, or both","Push, pull, push-pull"],["The catalogue sum","A checksum of the database"],["The scholars telling in the stoa","Rumor mongering"],["Has not heard; still telling; has stopped","Susceptible; infective; removed"],["The allowance","How often a site retries before losing interest"],["Those who never hear","The residue"],["A notice of withdrawal","A death certificate"],["A sleeping notice and its wardens","A dormant certificate at its retention sites"],["Preferring near partners; the ferry","A spatial distribution; a critical link"]]);
})();

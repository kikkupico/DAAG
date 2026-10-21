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

/* ===== machines: a plain counter merged two wrong ways ===== */
(function(){
  let a=0,b=0,t=0;const note=$("#mnote"),paint=()=>{$("#ma").textContent=a;$("#mb").textContent=b;$("#mt").textContent=t};
  $("#minc").onclick=()=>{a++;b++;t+=2;paint();note.textContent="Each replica counted one more. Neither knows of the other's."};
  $("#mmax").onclick=()=>{a=b=Math.max(a,b);paint();note.innerHTML=a<t?`Both now say ${a}. <span class="bad">${t} increments were made.</span> Keeping the larger loses the other replica's.`:`Both say ${a}.`};
  $("#madd").onclick=()=>{a=b=a+b;paint();note.innerHTML=a===t?`Both now say ${a}, which is right this once. Merge again.`:`Both now say ${a}. <span class="bad">${t} increments were made.</span> Adding counts the shared part again at every merge.`};
  paint();
})();

/* ===== a table of pebbles: a pile for every terrace, in white (made) and, when used, black (lost) ===== */
const TN=["terrace 1","terrace 2","terrace 3"];
const pile=(n,own,k)=>`<div class="col${own?" own":""}${k?" k":""}">${"<i></i>".repeat(Math.min(n,9))}</div>`;
function tableHtml(name,own,white,black,total){
  const cols=(v,k)=>`<div class="cols">${v.map((n,i)=>pile(n,i===own,k)).join("")}</div><div class="lbl">${v.map((n,i)=>`<span>${i+1}: ${n}</span>`).join("")}</div>`;
  return `<div class="ptab"><h5><span>${name}</span><span>count <b>${total}</b></span></h5>`+
    (black?`<div class="sets"><div><span class="t">made</span>${cols(white,false)}</div><div><span class="t">lost</span>${cols(black,true)}</div></div>`:cols(white,false))+`</div>`;
}
const sum=v=>v.reduce((a,b)=>a+b,0),larger=(x,y)=>x.map((n,i)=>Math.max(n,y[i]));

/* ===== one column each, take the larger ===== */
(function(){
  const box=$("#tabs"),say=$("#tsay");let T,made,rule="max",from=0,to=1;
  const paint=()=>{box.innerHTML=T.map((v,i)=>tableHtml("Table at "+TN[i],i,v,null,sum(v))).join("")};
  const verdict=()=>{const c=T.map(sum),same=c.every(x=>x===c[0]);
    return c.some(x=>x>made)?` <span class="bad">A table now shows more copies than the ${made} that were made.</span>`:same&&c[0]===made&&made?` <span class="ok">All three tables show ${made}, the copies made.</span>`:""};
  function reset(){T=[[0,0,0],[0,0,0],[0,0,0]];made=0;paint();say.textContent="Each table has a column for every terrace. The shaded column is the one its own scribe may add to."}
  $("#tmake").innerHTML=TN.map((n,i)=>`<button class="btn" data-i="${i}">${n}</button>`).join("");
  $$("button",$("#tmake")).forEach(bt=>bt.onclick=()=>{const i=+bt.dataset.i;T[i][i]++;made++;paint();say.innerHTML=`The scribe at ${TN[i]} adds a white pebble to column ${i+1} of the table there, and to no other.`});
  seg($("#trule"),[["max","takes the larger pile in each column"],["add","adds the piles together"]],rule,v=>{rule=v;reset()});
  seg($("#tfrom"),TN.map((n,i)=>[i,n]),from,v=>{from=+v});seg($("#tto"),TN.map((n,i)=>[i,n]),to,v=>{to=+v});
  $("#tsend").onclick=()=>{if(from===to){say.textContent="Choose two different terraces.";return}
    const before=T[to].join();T[to]=rule==="max"?larger(T[to],T[from]):T[to].map((n,i)=>n+T[from][i]);paint();
    say.innerHTML=(rule==="max"?(T[to].join()===before?`The table of ${TN[from]} reaches ${TN[to]} and changes nothing: ${TN[to]} already held all of it.`:`${TN[to]} takes the larger pile in each column.`):`${TN[to]} adds each arriving pile to its own.`)+verdict()};
  $("#treset").onclick=reset;reset();
})();

/* ===== the table or the change ===== */
(function(){
  const box=$("#wtabs"),say=$("#wsay");let t1,t2;
  const paint=()=>{box.innerHTML=tableHtml("Table at terrace 1",0,t1,null,sum(t1))+tableHtml("Table at terrace 2",1,t2,null,sum(t2));$("#wshown").textContent=sum(t2)};
  function reset(){t1=[1,0,0];t2=[0,0,0];paint();say.textContent="Terrace 2 has not heard yet."}
  $("#wtable").onclick=()=>{const b=t2.join();t2=larger(t2,t1);paint();say.innerHTML=t2.join()===b?`The same table again. Terrace 2 takes the larger pile in each column, and nothing changes. <span class="ok">Still ${sum(t2)}.</span>`:"Terrace 2 takes the larger pile in each column."};
  $("#wnote").onclick=()=>{t2[0]++;paint();say.innerHTML=sum(t2)>1?`<i>One more copy at terrace 1</i>, taken in again. Nothing in the notice says which copy. <span class="bad">Terrace 2 now shows ${sum(t2)} for one copy made.</span>`:"<i>One more copy at terrace 1.</i> Terrace 2 adds a pebble to column 1."};
  $("#wreset").onclick=reset;reset();
})();

/* ===== made and lost ===== */
(function(){
  const box=$("#ltabs"),say=$("#lsay");let W,K,rule="seen";
  const count=i=>sum(W[i])-sum(K[i]);
  const paint=()=>{box.innerHTML=[0,1].map(i=>tableHtml("Table at "+TN[i],i,W[i],K[i],count(i))).join("")};
  function reset(){W=[[1,0,0],[1,0,0]];K=[[0,0,0],[0,0,0]];paint();say.textContent="The one copy was made at terrace 1. Both tables show it."}
  /* seen: only if the scribe's own table shows a copy left; own: no more lost than were made at the scribe's own terrace */
  const may=i=>rule==="seen"?count(i)>0:W[i][i]-K[i][i]>0;
  const lose=i=>{if(!may(i)){say.innerHTML=rule==="seen"?`The table at ${TN[i]} shows no copy left, so its scribe may not mark one lost.`:`No copy was made at ${TN[i]} that is not already marked lost there, so its scribe may mark none, whatever the library holds.`;return}
    K[i][i]++;paint();say.innerHTML=`The scribe at ${TN[i]} adds a black pebble to column ${i+1}. That table now shows ${count(i)}.`};
  $("#l1").onclick=()=>lose(0);$("#l2").onclick=()=>lose(1);
  $("#lmeet").onclick=()=>{const w=larger(W[0],W[1]),k=larger(K[0],K[1]);W=[w.slice(),w.slice()];K=[k.slice(),k.slice()];paint();const c=count(0);
    say.innerHTML=c<0?`Each set of columns takes the larger pile. One made, ${sum(k)} lost: <span class="bad">the count is ${c}.</span> Each scribe kept the rule the table allowed.`:`Each set of columns takes the larger pile. Both tables show ${c}.`};
  seg($("#lrule"),[["seen","if the table shows a copy left"],["own","no more than were made at the scribe's own terrace"]],rule,v=>{rule=v;reset()});
  $("#lreset").onclick=reset;reset();
})();

/* ===== two hands on one work: the later wins, or both are kept ===== */
(function(){
  const E=[{by:"Library 1",t:"noon",n:1,after:[]},{by:"Library 2",t:"later that day",n:2,after:[]}];let rule="later",first=0;
  /* take in editions one at a time, in the order they arrive */
  function settle(order){let kept=[];
    order.forEach(i=>{const e=E[i];
      if(rule==="later"){if(!kept.length||e.n>kept[0].n)kept=[e]}
      else{if(kept.some(k=>k.after.includes(e)))return;kept=kept.filter(k=>!e.after.includes(k));kept.push(e)}});
    return kept.sort((a,b)=>a.n-b.n)}
  const show=k=>k.map(e=>`<span class="it">correction by ${e.by}, tally: ${e.t}</span>`).join("");
  function paint(){const a=settle([first,1-first]),b=settle([1-first,first]);
    if(a.map(e=>e.n).join()!==b.map(e=>e.n).join())throw new Error("the terraces settled differently");
    $("#hout").innerHTML=`<div class="shelf"><h5>A terrace that hears from ${E[first].by} first</h5>${show(a)}</div><div class="shelf"><h5>A terrace that hears from ${E[1-first].by} first</h5>${show(b)}</div>`;
    $("#hsay").innerHTML=rule==="later"?"Both terraces keep Library 2's correction, whichever arrived first. Library 1's is lost for good.":"Neither correction was written after the other, so both terraces keep both, and a reader is shown the two."}
  seg($("#hrule"),[["later","keep the later"],["both","keep both"]],rule,v=>{rule=v;paint()});
  seg($("#hord"),[[0,"Library 1"],[1,"Library 2"]],first,v=>{first=+v;paint()});paint();
})();

/* ===== a list where every writing of a title has its own tag: what is held is the tags written and the tags struck ===== */
function Marks(name){return {name,add:new Set(),struck:new Set(),n:0,
  write(title){const m=`${title}·${name}·${++this.n}`;this.add.add(m);return m},
  live(title){return [...this.add].filter(m=>m.startsWith(title+"·")&&!this.struck.has(m))},
  strike(title){const seen=this.live(title);seen.forEach(m=>this.struck.add(m));return seen},
  take(o){o.add.forEach(m=>this.add.add(m));o.struck.forEach(m=>this.struck.add(m))}}}
(function(){
  const box=$("#olibs"),say=$("#osay");let L;
  const lab=m=>{const [t,l,n]=m.split("·");return `tag ${l}-${n}`};
  const shelf=l=>`<div class="shelf"><h5>Library ${l.name}'s list</h5>${[...l.add].map(m=>`<span class="it${l.struck.has(m)?" gone":""}">the title, ${lab(m)}</span>`).join("")||'<span class="it none">nothing written yet</span>'}<div style="margin-top:6px">${l.live("T").length?'<span class="ok">The title is on the catalogue.</span>':'The title is not on the catalogue.'}</div></div>`;
  const paint=()=>box.innerHTML=L.map(shelf).join("");
  function reset(){L=[Marks("1"),Marks("2")];paint();say.textContent="Each library sees only its own list until the two exchange."}
  const add=i=>{const m=L[i].write("T");paint();say.innerHTML=`Library ${i+1} writes the title, with ${lab(m)}.`};
  const strike=i=>{const s=L[i].strike("T");paint();say.innerHTML=s.length?`Library ${i+1} strikes every tag of the title it can see: ${s.map(lab).join(", ")}.`:`Library ${i+1} sees no tag of the title, so there is nothing for it to strike.`};
  $("#oa1").onclick=()=>add(0);$("#oa2").onclick=()=>add(1);$("#os1").onclick=()=>strike(0);$("#os2").onclick=()=>strike(1);
  $("#omeet").onclick=()=>{L[0].take(L[1]);L[1].take(L[0]);paint();const on=L[0].live("T");
    say.innerHTML=on.length?`Each takes in the other's tags and strikes. ${on.map(lab).join(", ")} ${on.length>1?"were":"was"} never struck, so <span class="ok">the title is on the catalogue</span> at both.`:"Each takes in the other's tags and strikes. Every tag has been struck, so the title is off the catalogue at both."};
  $("#oreset").onclick=reset;reset();
})();

/* ===== not the same as one order: the four acts, worked by the same rule ===== */
(function(){
  const P=Polar($("#ordsvg"),{vb:"0 0 520 500",cx:260,cy:262,r0:40,step:26,rings:7,tEnd:7.6,note:[12,22],
    nodes:{A:[-90,"L1","#e0b84a"],B:[30,"L2","#8fb3d9"],T:[150,"T","#f6eed6"]}});
  const ev=(k,t,f,s)=>{P.event(k,t,f).label.textContent=s};
  ev("A",1.6,"#e0b84a","+E");ev("A",3.2,"#fde0d4","−F");ev("B",1.6,"#8fb3d9","+F");ev("B",3.2,"#fde0d4","−E");
  P.slip("A",3.6,"T",5.4);P.slip("B",3.6,"T",6.2);ev("T",5.4,"#f6eed6","");ev("T",6.2,"#a9c25a","");
  const a=Marks("1"),b=Marks("2"),t=Marks("T");
  a.write("E");const sf=a.strike("F");b.write("F");const se=b.strike("E");t.take(a);t.take(b);
  const on=["E","F"].filter(x=>t.live(x).length);
  /* every single order of the four acts that keeps each library's own two in turn */
  const acts=[["a","add","E"],["a","strike","F"],["b","add","F"],["b","strike","E"]],orders=[];
  (function go(done,ia,ib){if(done.length===4){orders.push(done);return}
    if(ia<2)go([...done,acts[ia]],ia+1,ib);if(ib<2)go([...done,acts[2+ib]],ia,ib+1)})([],0,0);
  const both=orders.filter(o=>{const s=new Set();o.forEach(([,k,x])=>k==="add"?s.add(x):s.delete(x));return s.has("E")&&s.has("F")}).length;
  $("#ordlist").innerHTML=`<li><b>L1</b> Library 1 · <b>L2</b> Library 2 · <b>T</b> a terrace</li><li>Library 1 adds E, then strikes F. It sees ${sf.length} ${sf.length===1?"tag":"tags"} of F.</li><li>Library 2 adds F, then strikes E. It sees ${se.length} ${se.length===1?"tag":"tags"} of E.</li><li>The terrace takes in both lists.</li>`;
  $("#ordsay").innerHTML=`On the terrace's list: <b>${on.join(" and ")||"neither"}</b>. Of the ${orders.length} single orders in which the four acts could be done one after another, ${both||"none"} ${both===1?"ends":"end"} with both titles on the list.`;
})();

mapPairs($("#map"),[["A terrace, its scribe and its table","A replica and its state"],["Terraces that heard the same news show the same count","Strong eventual consistency"],["A column for each terrace, written only by its own scribe","A vector with one entry per replica"],["Taking the larger pile in each column","Merge: the per-entry maximum"],["Any order, any grouping, as often as you like","Commutative, associative, idempotent"],["The table way","State-based replication"],["The notice way: exactly once, in order of dependence","Operation-based replication over reliable causal delivery"],["White pebbles and black","A counter that goes up and down: two grow-only counters"],["The later edition wins","A last-writer-wins register"],["Keeping both corrections","A multi-value register"],["The catalogue of titles","A grow-only set"],["The struck-off list","A two-phase set"],["A tag for every writing; a strike removes the tags seen","An observed-remove set"],["A limit on the whole coast's count","A global invariant, which needs coordination"]]);
})();

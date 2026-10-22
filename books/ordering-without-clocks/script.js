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
const GM={G:"!"};   /* the goatherd's token: a letter in the allegory, a mark in computing */
/* a label that says one thing in each register */
const dl=(parent,attrs)=>{const t=dtext(parent,attrs,"","");return {set(i,m){t[0].textContent=i;t[1].textContent=m===undefined?i:m}}};
const chip=(t,h)=>`<span class="chip"><i style="background:${HC[h]}"></i>${dual(`${t}·H${h}`,`${t}·P${h}`)}</span>`;

/* ===== Arche, seen from above: one picture reused wherever messengers are on the road ===== */
function Isle(svg){
  const cx=235,cy=235,R=165,A={1:-90,2:30,3:150}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:86,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("text",{x:cx,y:cy-8,class:"lab i"},svg).textContent="Mount Phyle";
  el("circle",{cx,cy,r:R,fill:"none",stroke:"#b5602c","stroke-width":3,"stroke-dasharray":"3 8"},svg);
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const I={svg,cx,cy,R,A,under,over,house:{},
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:13,fill,stroke:"#1c1512","stroke-width":2.5},g);dtext(g,{},glyph,GM[glyph]||glyph);return g},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    /* u of the way along the direct stretch from house a to house b; each direction keeps to its own lane */
    road(g,a,b,u){const d=((A[b]-A[a]+540)%360)-180;I.put(g,...I.at(A[a]+d*u,R+(d>0?9:-9)))}
  };
  for(const h of [1,2,3]){const [x,y]=I.at(A[h]),g=el("g",{class:"site"},sites);I.put(g,x,y);el("rect",{x:-25,y:-17,width:50,height:34,rx:5,fill:HC[h]},g);dtext(g,{},"H"+h,"P"+h);I.house[h]={x,y,g}}
  return I;
}

/* the cover, in computing: three processes in a ring with messages in transit */
(function(){const I=Isle($("#coversvg"));
  [[1,2,.5],[2,3,.5],[3,1,.45],[1,3,.4]].forEach(([a,b,u])=>{const g=I.token(HC[a],"✉");g.setAttribute("opacity",1);I.road(g,a,b,u)})})();

/* ===== the gate of House 3: arrival follows the quicker legs, not the earlier request ===== */
(function(){
  const I=Isle($("#race")),m1=I.token(HC[1],"✉"),m2=I.token(HC[2],"✉"),say=$("#racesay"),b1=$("#race1"),b2=$("#race2");
  const w1=dl(I.over,{class:"lab halo",x:I.house[1].x,y:I.house[1].y+40}),w2=dl(I.over,{class:"lab halo",x:I.house[2].x-16,y:I.house[2].y-28});
  let seen=0;
  async function run(fast){
    b1.disabled=b2.disabled=true;w1.set("");w2.set("");m1.setAttribute("opacity",0);m2.setAttribute("opacity",0);
    const ms=h=>h===fast?1700:3600;
    w2.set("wrote first","sent first");say.innerHTML=dual("House 2 writes its request and sends a messenger.","P2 makes its request and sends a message.");
    I.road(m2,2,3,.1);m2.setAttribute("opacity",1);const p2=tween(ms(2),u=>I.road(m2,2,3,.1+.78*u));
    await sleep(700);
    w1.set("wrote second","sent second");say.innerHTML=dual("A little later House 1 writes its own request and sends a messenger.","A little later P1 makes its own request and sends a message.");
    I.road(m1,1,3,.1);m1.setAttribute("opacity",1);const p1=tween(ms(1),u=>I.road(m1,1,3,.1+.78*u));
    await Promise.all([p1,p2]);seen|=fast;
    say.innerHTML=dual((fast===1?"<b>House 1's slip reaches the gate first.</b> Yet House 2 wrote first: the quicker messenger won.":"<b>House 2's slip reaches the gate first.</b> This time the request written first also arrives first, but only because its messenger kept ahead.")
      +(seen===3?" The same two requests, written in the same sequence; only the legs changed. Arrival at the gate cannot be the test.":""),
      (fast===1?"<b>P1's message reaches P3 first.</b> Yet P2 sent first: the faster delivery won.":"<b>P2's message reaches P3 first.</b> This time the request made first also arrives first, but only because its message kept ahead.")
      +(seen===3?" The same two requests, made in the same sequence; only the delivery times changed. Order of arrival cannot be the test.":""));
    b1.disabled=b2.disabled=false;
  }
  b1.onclick=()=>run(1);b2.onclick=()=>run(2);
})();

/* ===== one morning on Arche: ten entries and three slips, drawn in the round =====
   The tallies and columns are worked out here by the houses' own rules, and coming-before
   by following scroll lines and slips, so the page checks one against the other. */
function Morning(svg){
  const P=Polar(svg,{vb:"0 0 620 596",cx:310,cy:350,r0:44,step:30,rings:9,tEnd:9.5,note:[14,24],
    nodes:{1:[-90,"H1",HC[1],"P1"],2:[30,"H2",HC[2],"P2"],3:[150,"H3",HC[3],"P3"]}});
  const E=[
    {id:"a",h:1,t:1.2,d:"House 1 enters a request",m:"P1’s first event"},
    {id:"b",h:1,t:2.4,d:"House 1 sends a slip to House 2",m:"P1 sends a message to P2"},
    {id:"c",h:2,t:1.6,d:"House 2 enters a sale",m:"P2’s first event"},
    {id:"d",h:2,t:3.8,d:"House 2 receives House 1's slip",m:"P2 receives P1’s message",from:"b"},
    {id:"e",h:2,t:5,d:"House 2 sends a slip to House 3",m:"P2 sends a message to P3"},
    {id:"f",h:3,t:3,d:"House 3 enters a delivery",m:"P3’s first event"},
    {id:"g",h:3,t:4.6,d:"House 3 enters a request",m:"P3’s second event"},
    {id:"i",h:3,t:6.6,d:"House 3 receives House 2's slip",m:"P3 receives P2’s message",from:"e"},
    {id:"j",h:3,t:7.6,d:"House 3 sends a slip to House 1",m:"P3 sends a message to P1"},
    {id:"l",h:1,t:9,d:"House 1 receives House 3's slip",m:"P1 receives P3’s message",from:"j"}];
  const by={},T={1:0,2:0,3:0},V={1:[0,0,0],2:[0,0,0],3:[0,0,0]},last={};E.forEach(e=>by[e.id]=e);
  [...E].sort((a,b)=>a.t-b.t).forEach(e=>{const s=e.from&&by[e.from];e.pred=[];
    if(last[e.h]){e.pred.push(last[e.h]);e.seg=P.seg(e.h,last[e.h].t,e.t)}
    if(s){e.pred.push(s);e.slip=P.slip(s.h,s.t,e.h,e.t)}
    e.tally=T[e.h]=Math.max(T[e.h],s?s.tally:0)+1;                       // never lowered; past the slip's number
    const v=V[e.h];if(s)s.col.forEach((x,k)=>v[k]=Math.max(v[k],x));v[e.h-1]++;e.col=[...v];last[e.h]=e});
  E.forEach(e=>e.g=P.event(e.h,e.t,HC[e.h]));
  const past=e=>{const s=new Set();(function f(x){x.pred.forEach(p=>{if(!s.has(p)){s.add(p);f(p)}})})(e);return s};
  const M={P,E,by,
    before:(a,b)=>past(b).has(a),
    /* the links of one chain from a to b, as [earlier, later] pairs */
    chain(a,b){const next=new Map([[b,null]]),q=[b];while(q.length){const x=q.shift();if(x===a)break;x.pred.forEach(p=>{if(!next.has(p)){next.set(p,x);q.push(p)}})}
      const out=[];for(let x=a;next.get(x);x=next.get(x))out.push([x,next.get(x)]);return out},
    clear(){E.forEach(e=>{if(e.seg)e.seg.classList.remove("hi");if(e.slip){e.slip.classList.remove("hi");e.slip.setAttribute("marker-end",`url(#${svg.id}-b)`)}})},
    hi(links){M.clear();links.forEach(([x,n])=>{if(n.from===x.id){n.slip.classList.add("hi");n.slip.setAttribute("marker-end",`url(#${svg.id}-r)`)}else n.seg.classList.add("hi")})},
    text(e,s){e.g.label.textContent=s},
    /* let the reader choose two entries */
    pick(cb){let sel=[];E.forEach(e=>button(e.g,e.d,()=>{if(sel.length===2||sel.includes(e))sel=[];sel.push(e);E.forEach(x=>x.g.classList.toggle("sel",sel.includes(x)));cb(sel)}));
      onReg.push(()=>E.forEach(e=>e.g.setAttribute("aria-label",isM()?e.m:e.d)))}
  };
  return M;
}

/* ===== coming-before: choose two entries ===== */
(function(){
  const M=Morning($("#cbsvg")),say=$("#cbsay");
  M.pick(sel=>{
    if(sel.length<2){M.clear();say.innerHTML=dual(`<b>${sel[0].d}.</b> Now choose a second entry.`,`<b>${sel[0].m}.</b> Now choose a second event.`);return}
    let [a,b]=sel;if(M.before(b,a))[a,b]=[b,a];
    if(M.before(a,b)){M.hi(M.chain(a,b));say.innerHTML=dual(`<b>${a.d}</b> came before <b>${b.d}</b>. Follow the red chain: every link is a line of one house's scroll, or a slip on the road.`,`<b>${a.m}</b> happened before <b>${b.m}</b>. Follow the red chain: every link is a step in one process’s log, or a message on the network.`)}
    else{M.clear();say.innerHTML=dual(`<b>${a.d}</b>, and <b>${b.d}</b>: <span class="bad">unrelated</span>. No chain of scroll lines and slips joins them, so neither house could have known of the other's entry. One lies further out, later by the sun, but nothing the houses hold can tell them so.`,`<b>${a.m}</b>, and <b>${b.m}</b>: <span class="bad">concurrent</span>. No chain of local steps and messages joins them, so neither process could have known of the other’s event. One may be later in real time, but nothing the processes hold can tell them so.`)}
  });
})();

/* ===== scrollytelling: the tally ===== */
(function(){
  const M=Morning($("#tallysvg")),lab={};
  M.E.filter(e=>e.slip).forEach(e=>{const [x,y]=e.slip.mid,t=dtext(M.P.over,{class:"tok-l fade halo",x,y:y+4},"slip says "+M.by[e.from].tally,"message carries "+M.by[e.from].tally);lab[e.id]=t});
  const on=(t,v)=>t.forEach(x=>x.classList.toggle("on",v));
  const from={a:1,b:1,c:1,f:1,g:1,d:3,e:4,i:4,j:4,l:4}, B=M.by;
  const long=[[B.a,B.b],[B.b,B.d],[B.d,B.e],[B.e,B.i],[B.i,B.j],[B.j,B.l]];
  scrolly($("#tally"),s=>{
    M.E.forEach(e=>{M.text(e,s>=from[e.id]?e.tally:"");e.g.classList.toggle("mark",s===6&&(e===B.g||e===B.d));e.g.classList.toggle("dim",s===6&&e!==B.g&&e!==B.d)});
    on(lab.d,s>=2&&s<6);on(lab.i,s>=4&&s<6);on(lab.l,s>=4&&s<6);
    if(s===5)M.hi(long);else M.clear();
  });
})();

/* ===== precedence: three lists become one ===== */
(function(){
  const items=[[1,1],[1,2],[1,3],[2,1],[2,3],[3,2]],cols=[1,2,3].map(h=>$("#pq"+h)),say=$("#pqsay"),st=$("#pqstate"),bs=$("#pqsort"),bm=$("#pqmix");
  let lists;
  const mixed=()=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
  const paint=()=>cols.forEach((c,i)=>c.innerHTML=lists[i].map(([t,h])=>`<div class="e">${chip(t,h)}</div>`).join(""));
  /* no house hears of an entry ahead of one that came before it */
  const chains=[["1,1","2,1"],["2,1","3,2"],["1,2","3,2"],["1,3","2,3"]];
  const sound=l=>{const at=l.map(String);return chains.every(([a,b])=>at.indexOf(a)<at.indexOf(b))};
  const heard=()=>{let l;do{l=mixed()}while(!sound(l));return l};
  function mix(){do{lists=[heard(),heard(),heard()]}while(String(lists[0])===String(lists[1])||String(lists[1])===String(lists[2])||String(lists[0])===String(lists[2]));paint();
    st.innerHTML=dual("as each heard of them","as each received them");say.innerHTML=dual("Six entries from the morning, each marked with its tally and its house. Each house heard of them in a different sequence.","Six events from the execution, each marked with its timestamp and its process. Each process received them in a different sequence.");bs.disabled=false}
  bs.onclick=()=>{lists=lists.map(l=>[...l].sort((a,b)=>a[0]-b[0]||a[1]-b[1]));paint();bs.disabled=true;st.innerHTML=dual("by precedence","by precedence");
    say.innerHTML=dual("Lower tally first; where tallies tie, lower house number first. <span class='ok'>All three houses now hold the same list</span>, and none of them needed a clock.","Lower timestamp first; where timestamps tie, lower process number first. <span class='ok'>All three processes now hold the same list</span>, and none of them needed a clock.");};
  bm.onclick=mix;mix();
})();

/* ===== scrollytelling: the shared storehouse ===== */
(function(){
  const I=Isle($("#storesvg")),side=$("#storeside");
  const [sx,sy]=I.at(90,I.R-36),sg=el("g",{class:"site"},I.over);I.put(sg,sx,sy);
  const sr=el("rect",{x:-56,y:-14,width:112,height:28,rx:4,fill:"#fffaf0"},sg),stx=dtext(sg,{style:"font-size:12px"},"","");
  const r1=[2,1],r3=[2,3],both=[r1,r3];
  /* how things stand at each step: tallies, queues, who is loading, and the highest tally each asker has heard from the others */
  const ST=[
    {t:[1,1,1],q:[[],[],[]],in:0,h1:{},h3:{}},
    {t:[2,1,2],q:[[r1],[],[r3]],in:0,h1:{},h3:{}},
    {t:[2,1,2],q:[[r1],[],[r3]],in:0,h1:{},h3:{}},
    {t:[3,4,3],q:[both,both,both],in:0,h1:{3:2},h3:{1:2}},
    {t:[4,6,4],q:[both,both,both],in:0,h1:{3:2},h3:{1:2}},
    {t:[7,6,8],q:[both,both,both],in:1,h1:{2:5,3:4},h3:{1:4,2:6}},
    {t:[8,6,8],q:[[r3],both,both],in:0,h1:null,h3:{1:4,2:6}},
    {t:[8,9,9],q:[[r3],[r3],[r3]],in:3,h1:null,h3:{1:8,2:6}},
    {t:[8,9,9],q:[[r3],[r3],[r3]],in:3,h1:null,h3:{1:8,2:6}}];
  /* every slip of the story: sender, receiver, the tally it carries, and where it is at which step */
  const toks=[[1,2,2,{1:.3,2:.62}],[1,3,2,{1:.3,2:.62}],[3,1,2,{1:.3,2:.62}],[3,2,2,{1:.3,2:.62}],
              [2,1,5,{4:.5}],[2,3,6,{4:.5}],[3,1,4,{4:.5}],[1,3,4,{4:.5}],[1,2,8,{6:.5}],[1,3,8,{6:.5}]]
    .map(([a,b,n,plan])=>({a,b,plan,g:I.token(HC[a],n),u:.1,run:0,end:Math.max(...Object.keys(plan))}));
  const tick=ok=>ok?"<span class='ok'>✓</span>":"<span class='bad'>✗</span>";
  function card(h,S){
    const q=S.q[h-1],heard=h===1?S.h1:h===3?S.h3:null,mine=q.some(r=>r[1]===h);
    let chk="";
    if(h===2)chk="no request of its own";
    else if(!mine)chk="no request standing";
    else{const hs=p=>[1,2,3].filter(o=>o!==h).map(o=>`${p}${o} ${tick((heard[o]||0)>2)}`).join(" "),a=`first in its queue ${tick(q[0][1]===h)}<br>heard above 2 from `;chk=dual(a+hs("H"),a+hs("P"))}
    return `<div class="hc${S.in===h?" in":""}"><h5>${dual("House "+h,"P"+h)}<span>${dual("tally ","clock ")}${S.t[h-1]}</span></h5><div>${q.length?q.map(r=>chip(r[0],r[1])).join(""):"queue empty"}</div><div class="chk">${chk}</div></div>`;
  }
  scrolly($("#store"),s=>{
    const S=ST[s];side.innerHTML=[1,2,3].map(h=>card(h,S)).join("");
    sr.setAttribute("fill",S.in?HC[S.in]:"#fffaf0");stx[0].textContent=S.in?`House ${S.in} loading`:"storehouse: empty";stx[1].textContent=S.in?`P${S.in} in the resource`:"resource: free";
    toks.forEach(k=>{const u=k.plan[s],id=++k.run;
      if(u==null){k.g.setAttribute("opacity",0);k.u=s>k.end?.9:.1;I.road(k.g,k.a,k.b,k.u);return}
      k.g.setAttribute("opacity",1);const u0=k.u;tween(800,e=>{if(k.run!==id)return;k.u=u0+(u-u0)*e;I.road(k.g,k.a,k.b,k.u)})});
  });
})();

/* ===== the goatherd: a path that carries no slip ===== */
(function(){
  const I=Isle($("#goat")),say=$("#goatsay"),btn=$("#goatgo"),H1=I.house[1],H3=I.house[3];
  const gt=I.token("#fffaf0","G"),ms=I.token(HC[3],"9");
  const l3=dl(I.over,{class:"lab halo",x:H3.x+10,y:H3.y+38}),l1=dl(I.over,{class:"lab halo",x:H1.x+32,y:H1.y+36,style:"text-anchor:start"});
  const over=u=>{const v=1-u;I.put(gt,v*v*H3.x+2*u*v*I.cx+u*u*H1.x,v*v*H3.y+2*u*v*I.cy+u*u*H1.y)};
  function reset(){l3.set("tally 8","clock 8");l1.set("tally 3","clock 3");gt.setAttribute("opacity",0);ms.setAttribute("opacity",0)}
  btn.onclick=async()=>{btn.disabled=true;reset();
    l3.set("sale: tally 9","sale: clock 9");say.innerHTML=dual("House 3 enters a sale under tally <b>9</b>. A messenger sets out by the road with the official slip, and a goatherd sets out over the mountain with the news.","P3 records a sale under clock <b>9</b>. A message sets out over the network with the official stamp, and the news also goes out over the outside channel.");
    I.road(ms,3,1,.1);ms.setAttribute("opacity",1);over(.12);gt.setAttribute("opacity",1);
    const road=tween(6200,u=>I.road(ms,3,1,.1+.78*u));
    await tween(1900,u=>over(.12+.76*u));
    l1.set("request: tally 4","request: clock 4");say.innerHTML=dual("The goatherd is lucky. House 1 hears of the sale and at once enters a request because of it. Its quiet tally stood at 3, so the request goes in under <b>4</b>.","The outside channel is fast. P1 hears of the sale and at once makes a request because of it. Its quiet clock stood at 3, so the request goes in under <b>4</b>.");
    await road;ms.setAttribute("opacity",0);
    say.innerHTML=dual("Hours later the official slip arrives, marked 9, too late to correct anything. <span class='bad'>By the tallies, the request (4) came before the sale (9) that caused it.</span> The goatherd carried no slip, so the rules never saw the goatherd.","Hours later the official message arrives, stamped 9, too late to correct anything. <span class='bad'>By the clocks, the request (4) happened before the sale (9) that caused it.</span> The outside channel carried no message, so the rules never saw it.");
    btn.textContent="Again";btn.disabled=false};
  reset();
})();

/* ===== the column: compare two entries row by row ===== */
(function(){
  const M=Morning($("#colsvg")),out=$("#colout"),say=$("#colsay");M.E.forEach(e=>M.text(e,e.tally));
  const short=e=>dual(`H${e.h}'s ${e.tally}`,`P${e.h}'s ${e.tally}`);
  M.pick(sel=>{
    if(sel.length<2){M.clear();out.innerHTML="";say.innerHTML=dual(`<b>${sel[0].d}</b>, tally ${sel[0].tally}. Now choose a second entry.`,`<b>${sel[0].m}</b>, timestamp ${sel[0].tally}. Now choose a second event.`);return}
    const [a,b]=sel,le=a.col.every((x,k)=>x<=b.col[k]),ge=a.col.every((x,k)=>x>=b.col[k]);
    out.innerHTML=`<table class="cmp"><thead><tr><th>Row</th><th>${short(a)}</th><th></th><th>${short(b)}</th></tr></thead><tbody>`+
      a.col.map((x,k)=>`<tr class="${x<b.col[k]?"up":x>b.col[k]?"down":""}"><td>${dual("House "+(k+1),"P"+(k+1))}</td><td>${x}</td><td>${x<b.col[k]?"&lt;":x>b.col[k]?"&gt;":"="}</td><td>${b.col[k]}</td></tr>`).join("")+"</tbody></table>";
    if(le||ge){const [x,y]=le?[a,b]:[b,a];M.hi(M.chain(x,y));
      say.innerHTML=dual(`No row of the ${le?"first":"second"} column is greater than the other's, and the columns differ. So <b>${x.d}</b> <span class="ok">came before</span> <b>${y.d}</b>. Their tallies, ${x.tally} and ${y.tally}, agree with that, but could not have ruled out that the two were unrelated.`,
        `No entry of the ${le?"first":"second"} vector is greater than the other's, and the vectors differ. So <b>${x.m}</b> <span class="ok">happened before</span> <b>${y.m}</b>. Their timestamps, ${x.tally} and ${y.tally}, agree with that, but could not have ruled out that the two were concurrent.`)}
    else{M.clear();const up=a.col.findIndex((x,k)=>x>b.col[k]),dn=a.col.findIndex((x,k)=>x<b.col[k]);
      say.innerHTML=dual(`The first column is greater in the row for House ${up+1}, the second in the row for House ${dn+1}. Neither is at least the other, so the two entries are <span class="bad">unrelated</span>: each was made in ignorance of the other. Their tallies, ${a.tally} and ${b.tally}, ${a.tally===b.tally?"say nothing either way":"would have suggested a sequence that was never there"}.`,
        `The first vector is greater in the entry for P${up+1}, the second in the entry for P${dn+1}. Neither is at least the other, so the two events are <span class="bad">concurrent</span>: each was made in ignorance of the other. Their timestamps, ${a.tally} and ${b.tally}, ${a.tally===b.tally?"say nothing either way":"would have suggested a sequence that was never there"}.`)}
  });
})();

/* ===== relevance map ===== */
mapPairs($("#map"),[["A trading house","A process"],["A slip carried by a messenger","A message"],["No passing on the road","Messages between two processes arrive in the order sent"],["Water-clocks with no common hour","No synchronised clocks"],["Came before","Happened before"],["Unrelated","Concurrent"],["The tally","A Lamport logical clock"],["Precedence: tally, then house number","A total order, ties broken by process number"],["The shared storehouse","Mutual exclusion without a coordinator"],["The goatherd over the mountain","A cause that travels outside the system"],["The column","A vector clock"]]);
REG.start();
})();

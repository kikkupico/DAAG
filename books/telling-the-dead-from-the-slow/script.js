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

/* the four mercenaries, told apart by colour */
const TC={1:"#e0b84a",2:"#6583d6",3:"#c45448",4:"#9cb648"};
const T=[1,2,3,4],HOLD="#136f9e",ATT="#bf4a26";
const word={H:"hold",A:"attack"};
const tentChip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${TC[k]}"></i>Tent ${k}</span>`;
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const list=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" and "+a[a.length-1];
const tents=a=>(a.length>1?"tents ":"tent ")+list(a);
const cap=s=>s[0].toUpperCase()+s.slice(1);

/* ===== the arrangement for a strong slate, run by its rules =====
   o.sight {k:"A"|"H"}; o.c the man nobody chalks; o.dies {k:round} the round a man is killed in (0 = before sending anything,
   4 = while comparing); o.part {k:[tents]} who the last bird of a dying man reaches; o.skip(p,r) the tents p has chalked and stops waiting for. */
function runStrong(o){
  const V={},D={},snaps=[],dies=o.dies||{},part=o.part||{};
  T.forEach(k=>{V[k]={[k]:o.sight[k]};D[k]={[k]:o.sight[k]}});
  const clone=()=>({V:JSON.parse(JSON.stringify(V)),D:JSON.parse(JSON.stringify(D)),heard:{}});
  snaps.push(clone());
  const alive=(k,r)=>dies[k]==null||dies[k]>=r, finishes=k=>dies[k]==null;
  const sends=(q,r,p)=>dies[q]==null||r<dies[q]||(r===dies[q]&&(part[q]||[]).includes(p));
  for(let r=1;r<=4;r++){
    const msg={};T.forEach(q=>{if(alive(q,r))msg[q]=JSON.parse(JSON.stringify(r<4?D[q]:V[q]))});
    const S=clone();const nV={},nD={};
    for(const p of T){
      if(dies[p]!=null&&dies[p]<=r)continue;
      const sk=o.skip?o.skip(p,r):[],hs=T.filter(q=>q===p||(msg[q]&&sends(q,r,p)&&(q===o.c||!sk.includes(q))));
      S.heard[p]=hs;
      if(r<4){const v={...V[p]},d={};
        for(const q of hs)for(const k in msg[q])if(v[k]==null){v[k]=msg[q][k];d[k]=msg[q][k]}
        nV[p]=v;nD[p]=d}
      else{const v={...V[p]};for(const k in V[p])if(hs.some(q=>msg[q][k]==null))delete v[k];nV[p]=v}
    }
    for(const p in nV){V[p]=nV[p];if(r<4)D[p]=nD[p]}
    const s=clone();s.heard=S.heard;snaps.push(s);
  }
  const commit={};
  for(const p of T)if(finishes(p)){const k=T.find(k=>V[p][k]!=null);commit[p]=V[p][k]}
  return {snaps,V,commit,finish:T.filter(finishes)};
}

/* ===== rounds by turns, for slates that are right only in the end ===== */
function newNight(live,sight){const est={},ts={};T.forEach(k=>{est[k]=sight[k];ts[k]=0});return {live,est,ts,sight,commit:null,r:0,stuck:false}}
function playRound(st,calm,stormP=.5){
  const r=++st.r,owner=((r-1)%4)+1,out={r,owner},L=st.live;
  if(!L.includes(owner)){out.kind="deadowner";return out}
  if(L.length<3){out.kind="stuck";st.stuck=true;return out}
  const others=shuffle(L.filter(k=>k!==owner)).slice(0,2),gather=[owner,...others];
  const best=Math.max(...gather.map(k=>st.ts[k])),pick=shuffle(gather.filter(k=>st.ts[k]===best))[0],e=st.est[pick];
  out.gather=gather;out.best=best;out.e=e;out.pick=pick;out.calm=calm;
  const reply={};
  for(const q of L){if(q===owner||calm||Math.random()>=stormP){st.est[q]=e;st.ts[q]=r;reply[q]=true}else reply[q]=false}
  out.reply=reply;out.three=shuffle(L).slice(0,3);out.ok=out.three.every(k=>reply[k]);
  if(out.ok){st.commit=e;out.kind="parting"}else out.kind="failed";
  return out;
}

/* ===== machines: a guess about a machine that has gone quiet ===== */
(function(){
  const log=$("#guesslog"),note=$("#guessnote"),bc=$("#guessc"),bs=$("#guesss"),br=$("#guessr");let gen=0,seen={};
  const line=(t,s,cls="")=>{const d=document.createElement("div");d.className="e "+cls;d.innerHTML=`<b>${t}</b> ${s}`;log.appendChild(d)};
  async function run(slow){
    const g=++gen;bc.disabled=bs.disabled=true;br.hidden=true;log.innerHTML="";seen[slow?"s":"c"]=1;
    note.textContent=slow?"B is alive, and its reply is on the way.":"B has crashed.";
    line("0 s","A asks B for its value.");await sleep(700);if(g!==gen)return;
    line("1 s","No reply yet. A's failure detector puts B on its list of suspected machines.","bad");await sleep(900);if(g!==gen)return;
    if(slow){line("4 s","B's reply arrives after all. A takes B off the list.","good");note.textContent="A suspected a machine that was alive. The guess was wrong."}
    else{line("1 hour","Still nothing. B stays on the list.");await sleep(500);if(g!==gen)return;note.textContent="A suspected a machine that had crashed. The guess was right."}
    bc.disabled=bs.disabled=false;
    if(seen.s&&seen.c)note.textContent="At one second the two runs looked the same to A, and the guess was right in one and wrong in the other. A detector may be wrong, often. What does an algorithm need it to get right?";
    br.hidden=false;
  }
  bc.onclick=()=>run(false);bs.onclick=()=>run(true);
  br.onclick=()=>{gen++;seen={};log.innerHTML="";bc.disabled=bs.disabled=false;br.hidden=true;note.textContent="A has asked B for its value and is waiting for the reply. A's failure detector lists the machines A suspects."};
})();

/* ===== the hill, seen from above: one picture reused wherever ravens fly between the tents ===== */
function Hill(svg){
  const cx=235,cy=235,R=158,A={1:-90,2:0,3:90,4:180}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:96,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("circle",{cx,cy,r:24,fill:"#efe6cf",stroke:"#6b5a48","stroke-width":6},svg);
  el("text",{x:cx,y:cy+52,class:"lab"},svg).textContent="the crown";
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const H={svg,cx,cy,R,A,under,over,tent:{},
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:12,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph;return g},
    /* a raven u of the way from tent a to tent b, flying round the hill; each direction keeps its own line */
    fly(g,a,b,u){const d=((A[b]-A[a]+540)%360)-180;H.put(g,...H.at(A[a]+d*u,R-(d>0?24:46)*Math.sin(Math.PI*u)))},
    state(k,s){H.tent[k].st.textContent=s},
    badge(k,s){const b=H.tent[k].badge;b.setAttribute("opacity",s?1:0);b.lastChild.textContent=s||""}
  };
  for(const k of [1,2,3,4]){const a=A[k]*Math.PI/180,[x,y]=H.at(A[k]),g=el("g",{class:"site"},sites);H.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:TC[k]},g);el("text",{},g).textContent="T"+k;
    const st=el("text",{class:"state halo",x:-48*Math.cos(a),y:-46*Math.sin(a)},g);
    const badge=el("g",{class:"badge",opacity:0,transform:`translate(${(38*Math.cos(a)).toFixed(1)} ${(34*Math.sin(a)).toFixed(1)})`},g);el("circle",{r:11},badge);el("text",{},badge);
    H.tent[k]={x,y,g,st,badge}}
  return H;
}
/* a drawn line for a raven's flight from tent a to tent b, on the same route the tokens fly */
function route(H,a,b,u0=.14,u1=.86){const pts=[];for(let i=0;i<=14;i++){const u=u0+(u1-u0)*i/14,d=((H.A[b]-H.A[a]+540)%360)-180;pts.push(H.at(H.A[a]+d*u,H.R-(d>0?24:46)*Math.sin(Math.PI*u)))}
  return "M"+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L")}
const cross=(g,x,y,r=17)=>el("path",{d:`M${x-r},${y-r} L${x+r},${y+r} M${x-r},${y+r} L${x+r},${y-r}`,stroke:"#1c1512","stroke-width":5,fill:"none"},g);

/* ===== a slate that may be wrong, in two ways ===== */
(function(){
  const H=Hill($("#slatesvg")),say=$("#slatesay"),rows=$("#slaterows"),bR=$("#slatereveal"),bN=$("#slatenew");
  const K=[2,3,4];let truth,mark,shown,extra;
  function deal(){do{truth={};K.forEach(k=>truth[k]=["fine","slow","dead"][rnd(3)])}while(!K.some(k=>truth[k]!=="fine"));
    mark={};K.forEach(k=>mark[k]=false);shown=false;(extra||[]).forEach(e=>e.remove());extra=[];
    T.forEach(k=>{H.tent[k].g.classList.remove("out");H.state(k,"");H.badge(k,"")});H.tent[1].g.classList.add("turn");H.state(1,"you");
    bR.disabled=false;paint();
    say.textContent="Tent 1's man has had no bird from some tents. Which of them are dead? Chalk the ones you think are, then reveal the night."}
  const bird=k=>truth[k]==="fine"?"a bird came in":"no bird yet";
  function paint(){
    rows.innerHTML=K.map(k=>`<div class="srow">${tentChip(k)}<span class="sb">${bird(k)}</span><button class="btn alt" data-k="${k}" ${shown?"disabled":""}>${mark[k]?"Rub out":"Chalk"}</button><span class="sv" id="sv${k}"></span></div>`).join("");
    $$("button[data-k]",rows).forEach(b=>b.onclick=()=>{const k=+b.dataset.k;mark[k]=!mark[k];H.badge(k,mark[k]?"✗":"");paint()});
    if(shown)K.forEach(k=>{const dead=truth[k]==="dead",m=mark[k];$("#sv"+k).innerHTML=
      dead&&m?"<span class='ok'>Right.</span> Dead, and chalked.":
      dead&&!m?"<span class='bad'>Not yet.</span> Dead, and the row is clean.":
      m?"<span class='bad'>Wrong.</span> Alive"+(truth[k]==="slow"?", its bird only slow":"")+", and chalked.":
      "<span class='ok'>Right.</span> Alive, and the row is clean."})}
  bR.onclick=()=>{shown=true;bR.disabled=true;
    K.forEach(k=>{if(truth[k]==="dead"){H.tent[k].g.classList.add("out");H.state(k,"dead");extra.push(cross(H.over,H.tent[k].x,H.tent[k].y))}
      else if(truth[k]==="slow"){const g=H.token(TC[k],"");g.setAttribute("opacity",1);H.fly(g,k,1,.45);const [px,py]=H.at(H.A[k]+(((H.A[1]-H.A[k]+540)%360)-180)*.45,H.R-24*Math.sin(Math.PI*.45));
        const t=el("text",{class:"lab halo",x:px+(k===3?-4:6),y:py+30},H.over);t.textContent="in a pine";extra.push(g,t);H.state(k,"alive")}
      else H.state(k,"alive")});
    paint();
    const missed=K.filter(k=>truth[k]==="dead"&&!mark[k]).length,wrong=K.filter(k=>truth[k]!=="dead"&&mark[k]).length;
    say.innerHTML=!missed&&!wrong?"No mistake this time. But from where tent 1 sits, a dead man and a slow bird look the same, so a slate can only guess.":
      `This slate went wrong ${missed?"by leaving "+missed+" dead "+(missed>1?"men":"man")+" clean":""}${missed&&wrong?" and ":""}${wrong?"by chalking "+wrong+" living "+(wrong>1?"men":"man"):""}. <b>Those are the only two ways to go wrong.</b>`};
  bN.onclick=deal;deal();
})();

/* ===== copying marks: a second slate, rewritten by every bird ===== */
(function(){
  const rows=$("#copyrows"),say=$("#copysay"),bG=$("#copygo"),bR=$("#copyr");
  /* tent 4 is dead from dusk. Only tent 1 chalks it. Early on, tents 1 and 3 chalk a living man by mistake. */
  const LIVE=[1,2,3];
  const slate=(p,r)=>r<=2?({1:[2,4],2:[],3:[1]})[p]:({1:[4],2:[],3:[]})[p];
  let r,copy,order;
  function reset(){r=0;copy={};LIVE.forEach(p=>copy[p]=new Set());order={};paint();bG.disabled=false;
    say.textContent="Tent 4 is dead. Of the three living men, only tent 1 has chalked it. Send a round of birds: every living man sends the marks on the slate to every tent."}
  const marks=s=>s.size?[...s].sort().map(k=>tentChip(k)).join(""):"<i>none</i>";
  function paint(){
    rows.innerHTML=`<div class="chead"><span></span><span>the slate says</span><span>the copy holds</span><span>birds taken in, in order</span></div>`+
      LIVE.map(p=>`<div class="crow">${tentChip(p)}<span data-l="the slate says">${r===0?"<i>nothing sent yet</i>":marks(new Set(slate(p,r)))}</span><span data-l="the copy holds">${marks(copy[p])}</span><span data-l="birds in">${order[p]?order[p].map(q=>"from "+q).join(", "):"<i>none yet</i>"}</span></div>`).join("")+
      `<div class="crow dead"><span>${tentChip(4)}</span><span>killed</span><span></span><span>sends nothing</span></div>`}
  bG.onclick=()=>{r++;
    LIVE.forEach(p=>{order[p]=shuffle(LIVE);order[p].forEach(q=>{const c=copy[p];slate(q,r).forEach(k=>c.add(k));c.delete(q)})});
    paint();
    const all4=LIVE.every(p=>copy[p].has(4)),w=LIVE.some(p=>copy[p].has(2)||copy[p].has(1)||copy[p].has(3));
    say.innerHTML=`Round ${r}. Each man added the marks of every bird taken in, and rubbed out the mark against the tent the bird came from.`+
      (all4?` <b>Tent 4 is chalked in every copy,</b> and no bird from tent 4 will ever come to rub it out.`:"")+
      (r<3?(w?" Some copies still hold a mark against a living man. That is only the slates' mistake, passed on, and any bird from that man rubs it out.":""):
        " The slates are right about the living now. Every copy holds tent 4 and nobody else: the copy is only as wrong as the slates it was copied from, and it rights itself when they do.");
    if(r>=4)bG.disabled=true};
  bR.onclick=reset;reset();
})();

/* ===== scroll-driven: the arrangement for a strong slate, run in full ===== */
const strongRun=(function(){
  const skipTab={"1-1":[3],"3-1":[1],"1-2":[3],"2-2":[3]};
  return runStrong({sight:{1:"A",2:"H",3:"A",4:"H"},c:2,dies:{4:1},part:{4:[3]},skip:(p,r)=>skipTab[p+"-"+r]||[]});
})();
(function(){
  const R=strongRun,H=Hill($("#strongsvg")),side=$("#strongside"),svg=H.svg;
  const m=el("marker",{id:"strong-k",markerWidth:9,markerHeight:9,refX:7.5,refY:3.2,orient:"auto"},el("defs",{},svg));el("path",{d:"M0,0 L7.5,3.2 L0,6.4 z",fill:"#1c1512"},m);
  const arrows={};
  for(let r=1;r<=4;r++){arrows[r]=[];const hs=R.snaps[r].heard;for(const p in hs)hs[p].forEach(q=>{if(q!=+p)arrows[r].push(el("path",{class:"gr-arrow fade",d:route(H,q,+p),"marker-end":"url(#strong-k)"},H.under))})}
  H.state(2,"spared");
  const deadMark=cross(H.over,H.tent[4].x,H.tent[4].y);deadMark.setAttribute("opacity",0);
  const on=(e,v)=>e.classList.toggle("on",!!v);
  const rowCell=(V,P,k)=>{const v=V[k],was=P&&P[k];return `<span class="tc ${v?"f":""} ${v&&!was?"new":""} ${!v&&was?"gone":""}">${v||"–"}</span>`};
  const word2={A:"attack",H:"hold"};
  function card(p,i,snapI){
    const S=R.snaps[snapI],P=snapI>0?R.snaps[snapI-1]:null,gone=p===4&&i>=1,V=S.V[p];
    const head=`<h5>${tentChip(p)}<span>${gone?"killed":p===2?"never chalked":"alive"}</span></h5>`;
    const cells=`<div class="tally">${T.map(k=>rowCell(V,P&&P.V[p],k)).join("")}</div>`;
    const idx=`<div class="tidx"><span>1</span><span>2</span><span>3</span><span>4</span></div>`;
    const chk=i===5&&!gone?`<div class="chk"><b>commits to ${word2[T.map(k=>V[k]).find(Boolean)]}</b></div>`:`<div class="chk">${gone?"sends nothing more":""}</div>`;
    return `<div class="hc${gone?" gone":""}${i===5&&!gone?" in":""}">${head}${idx}${cells}${chk}</div>`}
  scrolly($("#strong"),i=>{
    const snapI=Math.min(i,4);
    side.innerHTML=T.map(p=>card(p,i,snapI)).join("");
    for(let r=1;r<=4;r++)arrows[r].forEach(a=>on(a,snapI===r&&i<5));
    deadMark.setAttribute("opacity",i>=1?1:0);H.tent[4].g.classList.toggle("out",i>=1);
  });
})();

/* ===== any night: deaths, wrong slates, and every sheet still ends the same ===== */
(function(){
  const out=$("#tryout"),say=$("#trysay"),btns=$$("[data-dead]");
  function go(n){
    const ks=shuffle(T),dead=ks.slice(0,n),live=ks.slice(n),c=live[rnd(live.length)];
    const sight={};T.forEach(k=>sight[k]=rnd(2)?"A":"H");
    const dies={},part={};dead.forEach(k=>{dies[k]=rnd(5);part[k]=T.filter(q=>q!==k&&rnd(2))});
    const skips={},o={sight,c,dies,part,skip:(p,r)=>skips[p+"-"+r]||(skips[p+"-"+r]=T.filter(q=>q!==p&&q!==c&&rnd(2)))};
    const R=runStrong(o),fin=R.finish,tallies=new Set(fin.map(p=>JSON.stringify(R.V[p]))),ans=new Set(Object.values(R.commit));
    const when=r=>r===0?"killed before sending anything":r<4?`killed in round ${r}`:"killed while comparing";
    out.innerHTML=`<div class="chead t"><span>tent</span><span>saw</span><span>fate</span><span>final sheet</span><span>commits to</span></div>`+
      T.map(p=>{const d=dies[p]!=null,V=R.V[p];
        return `<div class="crow t${d?" dead":""}">${tentChip(p)}<span><b>${sight[p]}</b></span><span>${d?when(dies[p]):p===c?"alive, never chalked":"alive"}</span>`+
          (d?`<span></span><span>–</span>`:`<span><div class="tally">${T.map(k=>`<span class="tc ${V[k]?"f":""}">${V[k]||"–"}</span>`).join("")}</div></span><span><b>${word[R.commit[p]]}</b></span>`)+`</div>`}).join("");
    const same=tallies.size===1,one=ans.size===1,seen=[...ans].every(a=>Object.values(sight).includes(a));
    say.innerHTML=`${n?cap(tents(dead))+(n>1?" are":" is")+" killed.":"Nobody is killed."} Tent ${c} lives and is never chalked, and every other living man may be chalked by anyone, over and over. `+
      `<span class="${same?"ok":"bad"}">${same?"Every living man ends with the same sheet.":"The sheets differ."}</span> `+
      `<span class="${one&&seen?"ok":"bad"}">${one&&seen?"All commit to "+word[[...ans][0]]+", an answer someone sighted.":"The answers differ."}</span>`;
  }
  btns.forEach(b=>b.onclick=()=>go(+b.dataset.dead));go(1);
})();

/* ===== rounds by turns ===== */
(function(){
  const rows=$("#turnrows"),log=$("#turnlog"),say=$("#turnsay"),bN=$("#turnnext"),bs=$$("[data-kill]"),bR=$("#turnr");
  let st=null;
  const word2=v=>`<b>${word[v]}</b>`;
  function paint(owner){
    rows.innerHTML=`<div class="chead t2"><span>tent</span><span>estimate</span><span>taken up in round</span><span></span></div>`+
      T.map(k=>{const live=st.live.includes(k),own=owner===k;
        return `<div class="crow t2${live?"":" dead"}${own?" owner":""}">${tentChip(k)}<span data-l="estimate">${word2(st.est[k])}</span><span data-l="taken up in round">${st.ts[k]||"its sighting"}</span><span>${!live?"killed":st.commit?"commits to "+word[st.commit]:own?"owner of this round":""}</span></div>`}).join("")}
  function start(nDead){const ks=shuffle(T),sight={};T.forEach(k=>sight[k]=rnd(2)?"A":"H");
    st=newNight(ks.slice(nDead).sort(),sight);log.innerHTML="";bN.disabled=false;bR.hidden=false;paint(null);
    say.innerHTML=`${nDead?(nDead>1?"Two men are":"One man is")+" killed.":"All four live."} For the first two rounds the slates are wrong: a man may chalk a round's owner who lives. From round 3 they are right. Take a round.`}
  const ev=(h,cls="")=>{const d=document.createElement("div");d.className="e "+cls;d.innerHTML=h;log.prepend(d);while(log.children.length>14)log.lastChild.remove()};
  bN.onclick=()=>{
    if(!st)return;const o=playRound(st,st.r>=2);paint(o.owner);
    const own=o.owner,H=`<b>Round ${o.r}</b> belongs to tent ${own}. `;
    if(o.kind==="deadowner"){ev(H+`Tent ${own} is dead. Every man chalks it in the end, and the round comes to nothing.`,"bad");say.textContent="A dead owner costs one round. Failing is always safe, and the next round begins with the next tent.";return}
    if(o.kind==="stuck"){ev(H+`The owner must wait for three estimates, and only two men live. It waits for ever.`,"bad");bN.disabled=true;
      say.innerHTML="Nobody can commit, and nobody commits to anything wrong. <b>With two of the four killed, this arrangement waits for ever.</b>";return}
    const how=o.best===0?`the sighting of tent ${o.pick}, since none has been taken up in any round yet`:`the one taken up most recently, in round ${o.best}, by tent ${o.pick}`;
    const others=T.filter(k=>st.live.includes(k)&&k!==own);
    const chalked=others.filter(k=>!o.reply[k]);
    let h=H+`Tent ${own} gathers three estimates, from ${tents(o.gather)}, and takes ${how}: ${word2(o.e)}. It sends it to every tent. `;
    h+=chalked.length?`${cap(tents(chalked))} ${chalked.length>1?"have":"has"} chalked the owner and answer${chalked.length>1?"":"s"} <i>not agreed</i>${others.length>chalked.length?"; "+tents(others.filter(k=>o.reply[k]))+" take"+(others.length-chalked.length>1?"":"s")+" it up and answer"+(others.length-chalked.length>1?"":"s")+" <i>agreed</i>":""}. `:
      `Every man takes it up and answers <i>agreed</i>. `;
    h+=`The owner waits for the first three replies, from ${tents(o.three.slice().sort())}. `;
    if(o.ok){ev(h+"<span class='ok'>All three say agreed: the parting bird goes out.</span>","good");bN.disabled=true;paint(own);
      say.innerHTML=`Everyone who lives takes in the parting bird, sends it on, and commits to <b>${word[o.e]}</b>.`+(st.sight&&Object.values(st.sight).includes(o.e)?" Someone sighted it.":"")+` Nobody commits to anything else, in this round or in any later one: three men took up this answer, and any three out of four share a man with them.`;paint(own)}
    else{ev(h+"<span class='bad'>One says not agreed: the round comes to nothing.</span>","bad");
      say.innerHTML=o.calm?"The round failed.":"The round failed because a slate chalked a living owner. The chalk can cost time. It can never cost agreement."}
  };
  bs.forEach(b=>b.onclick=()=>start(+b.dataset.kill));
  bR.onclick=()=>{st=null;rows.innerHTML="";log.innerHTML="";bN.disabled=true;bR.hidden=true;say.textContent="Choose a night."};
  bN.disabled=true;bR.hidden=true;
})();

/* ===== the three nights that split the four ===== */
(function(){
  const nodes={1:[225,"T1",TC[1]],2:[135,"T2",TC[2]],3:[315,"T3",TC[3]],4:[45,"T4",TC[4]]},svg=$("#halfsvg"),stand=$("#halfstand"),say=$("#halfsay"),bs=$$("[data-night]");
  const defs=[];
  function draw(n){
    const P=Polar(svg,{vb:"0 0 520 480",cx:260,cy:240,r0:40,step:27,rings:7,tEnd:7.4,nodes});
    const spokes=$$(".st-spoke",svg);
    const dead=n===1?[3,4]:n===2?[1,2]:[];
    dead.forEach(k=>{const [x,y]=P.pt(k,1);spokes[k-1].setAttribute("x2",x);spokes[k-1].setAttribute("y2",y);cross(P.over,x,y,12)});
    const live=T.filter(k=>!dead.includes(k)),ans={1:"H",2:"H",3:"A",4:"A"};
    const dot=(k,t,fill,txt)=>{const g=P.event(k,t,fill,10);g.style.cursor="default";g.label.textContent=txt||"";if(fill!=="#fffaf0")g.label.style.fill="#fff";return g};
    const pair=n===1?[1,2]:n===2?[3,4]:null;
    live.forEach(k=>dot(k,1.4,"#fffaf0",n===3?ans[k]:n===1?"H":"A"));
    const exch=(a,b)=>{P.slip(a,1.4,b,2.6,12);P.slip(b,1.4,a,2.6,12)};
    if(n===1)exch(1,2);else if(n===2)exch(3,4);else{exch(1,2);exch(3,4);
      [[1,3],[2,4],[3,1],[4,2]].forEach(([a,b])=>{const s=P.slip(a,1.4,b,7.2,14);s.classList.add("hi");s.style.strokeDasharray="6 4";s.style.strokeWidth=3.4})}
    live.forEach(k=>{const v=n===2?"A":n===1?"H":ans[k];dot(k,4.2,v==="H"?HOLD:ATT,v)});
    return live;
  }
  const texts={
    1:`<b>First night.</b> All four sighted hold. Tents 3 and 4 are dead from dusk, and tents 1 and 2 chalk them all night. That slate is in the end perfect: it chalks the dead, and nobody else. Tents 1 and 2 commit, within some time, and to hold, since only hold was sighted.`,
    2:`<b>Second night.</b> The same with the pairs and the answers swapped: all four sighted attack, tents 1 and 2 are dead from dusk, and tents 3 and 4 commit to attack within some time.`,
    3:`<b>Third night.</b> Tents 1 and 2 sighted hold, tents 3 and 4 attack. <span class="ok">Nobody dies.</span> Every bird between the two pairs sits in the pines until after both pairs have committed, and until then each pair chalks the other. Afterwards all the birds arrive and all the chalk is rubbed out. That slate is in the end perfect too. <span class="bad">Each pair sees exactly what it saw on its own night, and commits: one pair to hold, the other to attack.</span>`};
  const chalks={1:{1:[3,4],2:[3,4],3:[],4:[]},2:{1:[],2:[],3:[1,2],4:[1,2]},3:{1:[3,4],2:[3,4],3:[1,2],4:[1,2]}};
  function show(n){
    const live=draw(n);bs.forEach(b=>b.classList.toggle("on",+b.dataset.night===n));
    stand.innerHTML=T.map(k=>live.includes(k)?`<div>${tentChip(k)} chalks ${chalks[n][k].length?tents(chalks[n][k]):"nobody"}, and commits to <b>${word[n===3?(k<3?"H":"A"):n===1?"H":"A"]}</b></div>`:`<div>${tentChip(k)} <i>dead from dusk</i></div>`).join("");
    say.innerHTML=texts[n]}
  bs.forEach(b=>b.onclick=()=>show(+b.dataset.night));show(1);
})();

/* ===== a slate kept on a windy night ===== */
(function(){
  const tl=$("#windtl"),say=$("#windsay"),bL=$("#windlive"),bD=$("#winddead"),bR=$("#windr"),stat=$("#windstat");
  const N=30,WIND=14,DIE=9;let gen=0,visible=false;
  /* the watched man sends a bird every tick; in wind a bird takes 1 to 9 ticks, in still air 2. The watcher chalks him when
     the glass (g ticks) runs out with no bird, rubs the mark out when one comes after all, and waits longer next time. */
  function simulate(alive){
    const arr=Array.from({length:N+12},()=>0);
    for(let t=0;t<N;t++){if(!alive&&t>=DIE)break;const d=t<WIND?1+rnd(9):2;arr[t+d]++}
    let g=2,last=0,chalked=false,wrong=0;const cells=[];
    for(let t=0;t<N;t++){let rub=false,fresh=false;
      if(arr[t]){last=t;if(chalked){chalked=false;g++;rub=true}}
      if(!chalked&&t-last>g){chalked=true;fresh=true;if(alive||t<DIE)wrong++}
      cells.push({t,chalked,rub,fresh,g,birds:arr[t],wrong,wind:t<WIND})}
    return {cells,g,chalked,wrong};
  }
  function paintCell(c,i){return `<span class="wc${c.chalked?" ch":""}${c.wind?" wd":""}" title="tick ${i+1}">${c.chalked?"✗":c.rub?"↺":c.birds?"•":""}</span>`}
  function reset(){gen++;tl.innerHTML=Array.from({length:N},(_, i)=>`<span class="wc${i<WIND?" wd":""}"></span>`).join("");stat.innerHTML="";bL.disabled=bD.disabled=false;bR.hidden=true;
    say.textContent="A man at one tent watches another tent for a sign of life. Every man sends a bird to every tent, again and again, to say the sender is alive. Watch a night go by."}
  async function run(alive){
    const g=++gen,S=simulate(alive);bL.disabled=bD.disabled=true;bR.hidden=true;tl.innerHTML=Array.from({length:N},(_, i)=>`<span class="wc${i<WIND?" wd":""}"></span>`).join("");
    for(let i=0;i<N;i++){
      while(!visible&&!reduce){await sleep(300);if(g!==gen)return}
      if(g!==gen)return;
      const c=S.cells[i];tl.children[i].outerHTML=paintCell(c,i);
      stat.innerHTML=`<span><b>${c.g}</b>glass, in ticks</span><span><b>${c.wrong}</b>mistaken marks</span><span><b>${c.chalked?"chalked":"clean"}</b>the row now</span>`;
      await sleep(170)}
    if(g!==gen)return;
    say.innerHTML=alive?`The man lives, and the slate was wrong ${S.wrong} time${S.wrong===1?"":"s"} while the wind blew. Each late bird rubbed the mark out and lengthened the glass. Once the wind dropped and every bird came within a glass, the mark never stood again: <b>in the end, nobody living is chalked.</b>`:
      `The man was killed. Birds already in the air still came in, and each rubbed the mark out. Then none came, and the mark stayed: <b>a dead man's birds stop, so the dead man is chalked for good.</b>`;
    bR.hidden=false;bL.disabled=bD.disabled=false}
  bL.onclick=()=>run(true);bD.onclick=()=>run(false);bR.onclick=reset;reset();
  new IntersectionObserver(es=>{visible=es[0].isIntersecting},{threshold:.1}).observe(tl);
})();

/* ===== who is who ===== */
mapPairs($("#map"),[
 ["The four men; no longest flight; nobody lies; any may be killed","Asynchronous processes with reliable channels and crash failures (§2, n = 4)"],
 ["A sighting; committing","A proposed value; a decision (§5)"],
 ["The three demands","Agreement, uniform validity, termination (§5). The algorithms give uniform agreement: no two processes, correct or not, decide differently"],
 ["The slate; chalking a tent; rubbing it out","A local failure detector module; suspecting a process; ceasing to suspect it (§2.2)"],
 ["Chalking the dead, by every or by some living man","Strong and weak completeness (§2.3)"],
 ["The four ways of sparing the living","Strong, weak, eventual strong and eventual weak accuracy (§2.3)"],
 ["The eight kinds of slate","P, S, ◇P, ◇S, Q, W, ◇Q, ◇W (Fig. 1)"],
 ["Copying marks","The reduction from weak to strong completeness, preserving accuracy (Fig. 3, Theorem 1, Corollary 1)"],
 ["The sheet of sightings; spreading; comparing","The vector V_p; Phase 1's n − 1 rounds; Phase 2 (Fig. 5)"],
 ["One Man Never Chalked","Consensus is solvable with S, tolerating up to n − 1 crashes (Theorem 2; Corollary 2 for W)"],
 ["Turns in number order; the owner","The rotating coordinator, c = (r mod n) + 1 (§6.2)"],
 ["An estimate and the round it was taken up","estimate_p and its timestamp ts_p (Fig. 6)"],
 ["Agreed; not agreed","ack; nack (Fig. 6, Phase 3)"],
 ["The parting bird, sent on before committing","R-broadcast of the decision, relayed on first receipt (Fig. 4). Here a process halts after relaying, since committing is silence; the paper's processes keep running"],
 ["In the End, One Man Spared","Consensus is solvable with ◇S when fewer than half crash (Theorem 3; Corollary 3 for ◇W)"],
 ["More Than Half; the three nights","Consensus cannot be solved with ◇P when f ≥ n/2 (Theorem 5, runs R₀, R₁, R_A)"],
 ["Granted, not earned","Failure detectors are specified by properties, not implementations; none with ◇W's properties can be implemented in a purely asynchronous system (§1, footnote 6)"],
 ["A slate kept on a windy night","Timeouts that grow after each premature suspicion implement ◇P when bounds hold after an unknown time (Theorem 9, §9.1, Fig. 10)"],
 ["The weakest slate that will do","◇W₀ is the weakest failure detector for consensus with a majority correct (Theorem 4 and Corollary 4, from Chandra, Hadzilacos and Toueg; not proved in this paper)"],
 ["Agreeing on an order","Consensus and Atomic Broadcast are equivalent (§7, Corollary 5)"]]);
})();

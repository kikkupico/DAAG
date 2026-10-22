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

/* the four bandits, told apart by colour; bandit 1 is the chief */
const BC={1:"#a57fc0",2:"#9aa0a8",3:"#e8964d",4:"#b07a55"};
const yesno=ok=>ok?"<span class='ok'>✓</span>":"<span class='bad'>✗</span>";
const chip=k=>`<span class="chip"><i style="background:${BC[k]}"></i>${dual("bandit "+k,"R"+k)}</span>`;
const chips=a=>a.map(chip).join(" ");
const men=[1,2,3,4];

/* ===== the crown, seen from above: one picture reused wherever rats run between the posts ===== */
function Crown(svg){
  const cx=235,cy=235,R=158,A={2:-90,3:30,4:150};svg.innerHTML="";svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:96,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("circle",{cx,cy,r:42,class:"wall"},svg);
  el("text",{x:cx,y:cy-54,class:"lab i"},svg).textContent="ring wall";
  const sites=el("g",{},svg),over=el("g",{},svg),pos={1:[cx,cy]},C={svg,over,site:{},pos};
  for(const k of [2,3,4]){const a=A[k]*Math.PI/180;pos[k]=[cx+R*Math.cos(a),cy+R*Math.sin(a)]}
  const put=(g,x,y)=>g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  C.token=(fill,glyph)=>{const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:12,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph;return g};
  /* a rat u of the way from post a to post b; each direction keeps to its own lane */
  C.fly=(g,a,b,u)=>{const [x1,y1]=pos[a],[x2,y2]=pos[b],L=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/L,uy=(y2-y1)/L,s=a===1?46:32,e=L-(b===1?46:32),d=s+(e-s)*u;put(g,x1+ux*d-uy*7,y1+uy*d+ux*7)};
  C.state=(k,s)=>{const [i,m]=Array.isArray(s)?s:[s,s],t=C.site[k].st;t[0].textContent=i;t[1].textContent=m};
  const dy={1:72,2:-28,3:42,4:42};
  for(const k of men){const [x,y]=pos[k],g=el("g",{class:"site"},sites);put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:BC[k]},g);dtext(g,{},"B"+k,"R"+k);
    const st=dtext(g,{class:"state halo",x:0,y:dy[k]},"","");C.site[k]={g,st}}
  return C;
}

/* the cover, in computing: a leader and three replicas, with votes in transit */
(function(){const C=Crown($("#coversvg"));
  [[2,1,.5],[3,1,.5],[4,1,.5],[1,2,.4]].forEach(([a,b,u])=>{const g=C.token(BC[a],"");g.setAttribute("opacity",1);C.fly(g,a,b,u)})})();

/* ===== one stage on the crown, counted both ways ===== */
(function(){
  const C=Crown($("#votesvg")),say=$("#votesay"),cnt=$("#votecount"),b1=$("#voteall"),b2=$("#voteone");
  const flight=(a,b,fill,glyph,ms)=>{const g=C.token(fill,glyph);g.setAttribute("opacity",1);C.fly(g,a,b,0);return tween(ms,u=>C.fly(g,a,b,u)).then(()=>g.remove())};
  const lock=on=>b1.disabled=b2.disabled=on;
  b1.onclick=async()=>{lock(true);const pairs=[];for(const a of men)for(const b of men)if(a!==b)pairs.push([a,b]);
    cnt.textContent=pairs.length;say.innerHTML=dual("Every man writes to every other man.","Every replica messages every other replica.");
    await Promise.all(pairs.map(([a,b])=>flight(a,b,BC[a],"",1100+rnd(800))));
    say.innerHTML=dual(`<b>${pairs.length} rats</b> in one stage: each of the four men writes to the other three.`,`<b>${pairs.length} messages</b> in one phase: each of the four replicas messages the other three.`);lock(false)};
  b2.onclick=async()=>{lock(true);const votes=[2,3,4].map(k=>[k,1]),bundle=[2,3,4].map(k=>[1,k]);
    cnt.textContent=votes.length;say.innerHTML=dual("Each man sends their sealed vote to the registrar, bandit 1.","Each replica sends its signed vote to the leader, R1.");
    await Promise.all(votes.map(([a,b])=>flight(a,b,BC[a],"",1100+rnd(500))));
    cnt.textContent=votes.length+bundle.length;say.innerHTML=dual("The registrar has three votes, ties them into a bundle, and sends the bundle to the other three.","The leader has three votes, combines them into a certificate, and sends the certificate to the other three.");
    await Promise.all(bundle.map(([a,b])=>flight(a,b,BC[1],"3",1100+rnd(500))));
    say.innerHTML=dual(`<b>${votes.length+bundle.length} rats</b> in one stage: ${votes.length} votes in, ${bundle.length} bundles out.`,`<b>${votes.length+bundle.length} messages</b> in one phase: ${votes.length} votes in, ${bundle.length} certificates out.`);lock(false)};
})();

/* ===== scroll: one term, stage by stage ===== */
(function(){
  const C=Crown($("#termsvg")),posts=[2,3,4];let run=0,toks=[];
  const flight=(a,b,fill,glyph,ms,id)=>{const g=C.token(fill,glyph);toks.push(g);g.setAttribute("opacity",1);C.fly(g,a,b,0);return tween(ms,u=>{if(id===run)C.fly(g,a,b,u)}).then(()=>g.remove())};
  const wave=(pairs,glyph,id)=>Promise.all(pairs.map(([a,b])=>flight(a,b,BC[a],glyph,1000+rnd(400),id)));
  const vin=(id)=>wave(posts.map(k=>[k,1]),"",id),vout=(id,g)=>wave(posts.map(k=>[1,k]),g||"",id);
  const set=o=>men.forEach(k=>C.state(k,o[k]||""));
  const all=s=>({1:s,2:s,3:s,4:s});
  const S=[{1:"proposed",2:"has proposal",3:"has proposal",4:"has proposal"},
           {1:"has three votes",2:"voted",3:"voted",4:"voted"},
           all(["first bundle","first certificate"]),all("locked"),all(["entry written","block committed"]),{2:["has the job","is leader"]}];
  async function render(i){
    const id=++run;toks.forEach(g=>g.remove());toks=[];set(i?S[i-1]:{});
    const live=()=>id===run;
    if(i===0){await vin(id);if(!live())return;await vout(id);if(!live())return;set(S[0])}
    else if(i===1){await vin(id);if(!live())return;set(S[1])}
    else if(i===2||i===3){await vout(id,"3");if(!live())return;set(S[i]);await vin(id)}
    else if(i===4){await vout(id,"3");if(!live())return;set(S[4])}
    else{await wave([1,3,4].map(k=>[k,2]),"",id);if(!live())return;set(S[5])}
  }
  scrolly($("#term"),render);
})();

/* ===== the rule for the first vote, worked out for one man ===== */
(function(){
  const LOCK=4,box=$("#ruleopts"),L=[$("#rule1"),$("#rule2"),$("#rule3")],say=$("#rulesay");
  const opts=[[dual("On top of the locked entry","On top of the locked block"),true,4],[dual("On a rival entry, bundle from term 2","On a rival block, certificate from view 2"),false,2],[dual("On a rival entry, bundle from term 3","On a rival block, certificate from view 3"),false,3],[dual("On a rival entry, bundle from term 6","On a rival block, certificate from view 6"),false,6]];
  opts.forEach(([t,on,b],i)=>{const bt=document.createElement("button");bt.className="btn alt chipb";bt.innerHTML=t;box.appendChild(bt);
    bt.onclick=()=>{$("ul.checks").hidden=false;$$("button",box).forEach(x=>x.classList.toggle("on",x===bt));
      const h1=on,h2=b>LOCK,vote=h1||h2;
      L[0].innerHTML=dual(`<b>Lies on the chain of the entry they are locked on</b> ${yesno(h1)}`,`<b>Lies on the chain of the block it is locked on</b> ${yesno(h1)}`);
      L[1].innerHTML=dual(`<b>Carries a bundle from a later term than their lock</b> ${yesno(h2)}<br>the bundle is from term ${b}, the lock from term ${LOCK}`,`<b>Carries a certificate from a later view than its lock</b> ${yesno(h2)}<br>the certificate is from view ${b}, the lock from view ${LOCK}`);
      L[2].innerHTML=dual(`<b>Votes for the proposal</b> ${yesno(vote)}`,`<b>Votes for the proposal</b> ${yesno(vote)}`);
      say.innerHTML=h1?dual("<b>The first half holds.</b> The proposal builds on the entry the man is locked on, so voting for it helps nothing conflicting forward.","<b>The first half holds.</b> The proposal builds on the block the replica is locked on, so voting for it helps nothing conflicting forward.")
        :h2?dual(`<b>The second half holds.</b> The proposal conflicts with the lock, but the bundle it carries is from term ${b}, later than term ${LOCK}. The rest have gone past the lock, the man is shown that they have, and they let go.`,`<b>The second half holds.</b> The proposal conflicts with the lock, but the certificate it carries is from view ${b}, later than view ${LOCK}. The rest have gone past the lock, the replica is shown that they have, and it lets go.`)
        :dual(`<b>Neither half holds.</b> The proposal conflicts with the lock and carries no later bundle. The man refuses.`,`<b>Neither half holds.</b> The proposal conflicts with the lock and carries no later certificate. The replica refuses.`)}});
})();

/* ===== two bundles of the same stage share an honest man ===== */
(function(){
  const A=$("#lackA"),B=$("#lackB"),stand=$("#lackstand"),say=$("#lacksay");let a=null,b=null;
  function render(){
    $$("button",A).forEach(x=>x.classList.toggle("on",+x.dataset.k===a));$$("button",B).forEach(x=>x.classList.toggle("on",+x.dataset.k===b));
    if(a==null||b==null){stand.innerHTML="";say.innerHTML=dual("Pick one man for each bundle.","Pick one replica for each certificate.");return}
    const sealed=l=>men.filter(k=>k!==l),shared=men.filter(k=>k!==a&&k!==b);
    stand.innerHTML=`<div>${dual("Bundle A is sealed by","Certificate A is signed by")} ${chips(sealed(a))}</div><div>${dual("Bundle B is sealed by","Certificate B is signed by")} ${chips(sealed(b))}</div><div><b>${dual("Sealed both:","Signed both:")}</b> ${chips(shared)}</div>`;
    say.innerHTML=dual(`<b>${shared.length} men sealed both bundles.</b> If one of them lies, at least ${shared.length-1} honest ${shared.length-1>1?"men":"man"} still did. An honest man votes once a stage a term, so two bundles of the same stage cannot vouch for conflicting entries.`,`<b>${shared.length} replicas signed both certificates.</b> If one of them is faulty, at least ${shared.length-1} honest ${shared.length-1>1?"replicas":"replica"} still did. An honest replica votes once a phase in a view, so two certificates of the same phase cannot vouch for conflicting blocks.`)}
  [[A,k=>a=k],[B,k=>b=k]].forEach(([box,setk])=>men.forEach(k=>{const bt=document.createElement("button");bt.className="btn alt chipb";bt.dataset.k=k;bt.innerHTML=dual("bandit "+k,"R"+k);bt.onclick=()=>{setk(k);render()};box.appendChild(bt)}));
  render();
})();

/* ===== the hidden lock: what a new registrar hears with two stages and with three ===== */
(function(){
  const scene=$("#hidscene"),menBox=$("#hidmen"),slowBox=$("#hidslow"),say=$("#hidsay"),mode=$("#hidmode"),b2=$("#hid2"),b3=$("#hid3");
  let stages=2,slow=null;const LOCK=3;
  const holds=()=>stages===2?[3]:[2,3,4];
  function render(){
    b2.classList.toggle("on",stages===2);b3.classList.toggle("on",stages===3);b2.classList.toggle("alt",stages!==2);b3.classList.toggle("alt",stages!==3);
    mode.innerHTML=stages===2?dual("two stages","two phases"):dual("three stages","three phases");
    scene.innerHTML=stages===2?dual("A man locks as soon as they see a first bundle. In this term only <b>bandit 3</b> saw the first bundle before the sandglasses ran out, and bandit 3 is locked on it.","A replica locks as soon as it sees a first certificate. In this view only <b>R3</b> saw the first certificate before the timers ran out, and R3 is locked on it.")
      :dual("A man locks only on a second bundle, and a second bundle exists only because three men voted on a first bundle and kept it. Here <b>bandits 2, 3 and 4</b> hold the first bundle, and bandit 3 is locked on it.","A replica locks only on a second certificate, and a second certificate exists only because three replicas voted on a first certificate and kept it. Here <b>R2, R3 and R4</b> hold the first certificate, and R3 is locked on it.");
    menBox.innerHTML=men.map(k=>`<div class="pm${holds().includes(k)?" has":""}${k===LOCK?" lock":""}${k===slow?" slow":""}"><h5><i style="background:${BC[k]}"></i>${dual("bandit "+k,"R"+k)}</h5>${dual("first bundle:","first certificate:")} ${holds().includes(k)?"yes":"no"}<br>locked: ${k===LOCK?"yes":"no"}<br>${slow==null?"":k===slow?"answers last":"heard"}</div>`).join("");
    if(slow==null){say.innerHTML=dual("Pick the slowest man.","Pick the slowest replica.");return}
    const heard=men.filter(k=>k!==slow),who=heard.filter(k=>holds().includes(k));
    if(who.length)say.innerHTML=dual(`The registrar hears ${chips(heard)} and learns the latest first bundle from ${chips(who)}. `+(stages===3?"At least two honest men hold the first bundle, so any three answers include one of them. The lock cannot hide."
      :"Here nothing hides. But the registrar need only wait for three answers, and the three need not include bandit 3."),`The leader hears ${chips(heard)} and learns the latest first certificate from ${chips(who)}. `+(stages===3?"At least two honest replicas hold the first certificate, so any three answers include one of them. The lock cannot hide."
      :"Here nothing hides. But the leader need only wait for three answers, and the three need not include R3."));
    else say.innerHTML=dual(`The registrar hears ${chips(heard)}. <span class="bad">None of them has the first bundle.</span> The registrar proposes an entry that conflicts with bandit 3's lock, and bandit 3 refuses. The lock stayed hidden.`,`The leader hears ${chips(heard)}. <span class="bad">None of them has the first certificate.</span> The leader proposes a block that conflicts with R3's lock, and R3 refuses. The lock stayed hidden.`);
  }
  men.forEach(k=>{const bt=document.createElement("button");bt.className="btn alt chipb";bt.innerHTML=dual(`bandit ${k} answers last`,`R${k} answers last`);bt.onclick=()=>{slow=k;render()};slowBox.appendChild(bt)});
  b2.onclick=()=>{stages=2;render()};b3.onclick=()=>{stages=3;render()};render();
})();

/* ===== a new registrar every entry: terms in a row, read by the chain rule ===== */
(function(){
  const nodes={1:[-90,"B1",BC[1],"R1"],2:[0,"B2",BC[2],"R2"],3:[90,"B3",BC[3],"R3"],4:[180,"B4",BC[4],"R4"]};
  const P=Polar($("#chainsvg"),{vb:"0 0 560 560",cx:280,cy:280,r0:46,step:22,rings:10,tEnd:9.6,note:[12,22],nodes});
  const list=$("#chainlist"),say=$("#chainsay"),term=$("#chainterm"),bn=$("#chainnext"),br=$("#chainreset"),MAX=7;
  const registrar=k=>(k-1)%4+1,t=k=>1.4+1.2*(k-1);
  const kinds=[["new proposal","#fffaf0","#1c1512","","new proposal"],["first bundle","#fbe7a1","#1c1512","","first certificate"],["locked on","#f0b429","#1c1512","s-lock","locked on"],["stands","#3f7a2a","#fffaf0","s-stands","committed"]];
  let k=0,dots=[];
  /* the entry of term j has been carried by k-j proposals in a row: new, first bundle, locked on, stands */
  const stat=j=>kinds[Math.min(3,k-j)];
  function paint(){
    dots.forEach((g,i)=>{const s=stat(i+1);g.querySelector("circle.b").setAttribute("fill",s[1]);g.label.style.fill=s[2]});
    let h="";for(let j=k;j>=Math.max(1,k-3);j--){const s=stat(j);h+=`<div>${dual(`Entry of term ${j}:`,`Block of view ${j}:`)} <span class="stat ${s[3]}">${dual(s[0],s[4])}</span></div>`}
    if(k>4)h+=`<div>${dual("Every entry behind them stands.","Every block behind them is committed.")}</div>`;list.innerHTML=h}
  function next(){
    k++;const h=registrar(k),g=P.event(h,t(k),"#fffaf0",11);g.label.textContent=k;g.style.cursor="default";dots.push(g);
    if(k>1)P.slip(registrar(k-1),t(k-1),h,t(k),12);
    term.innerHTML=dual(`term ${k}`,`view ${k}`);paint();
    let s=`<b>Term ${k}.</b> Bandit ${h} proposes an entry`,m=`<b>View ${k}.</b> R${h} proposes a block`;
    if(k===1){s+=". There is no bundle for any entry yet.";m+=". There is no certificate for any block yet."}
    else{s+=` carrying the bundle for the entry of term ${k-1}, which now has its first bundle`;m+=` carrying the certificate for the block of view ${k-1}, which now has its first certificate`;if(k>=3){s+=`; the entry of term ${k-2} is ready to lock on`;m+=`; the block of view ${k-2} is ready to lock on`}if(k>=4){s+=`; and the entry of term ${k-3} stands`;m+=`; and the block of view ${k-3} is committed`}s+=".";m+="."}
    if(k===MAX){bn.disabled=true;s+=" Three proposals in a row stand behind each entry from now on, one more entry standing at every term.";m+=" Three proposals in a row stand behind each block from now on, one more block committed at every view."}
    say.innerHTML=dual(s,m)}
  function reset(){P.slips.innerHTML="";P.evs.innerHTML="";dots=[];k=0;bn.disabled=false;term.innerHTML=dual("no term yet","no view yet");list.innerHTML="";say.innerHTML=dual("The job starts at bandit 1. Press the button to run a term.","The leader's role starts at R1. Press the button to run a view.")}
  bn.onclick=next;br.onclick=reset;reset();
})();

/* ===== who is who ===== */
mapPairs($("#map"),[
 ["The four men; one may lie; the wind","n = 3f + 1 = 4; Byzantine faults; partial synchrony with GST (§3)"],
 ["The loot scroll; entries forming a chain","State machine replication; a tree of nodes with parent links; a branch (§4, §4.2)"],
 ["Conflicting entries","Neither branch extends the other (§4.2)"],
 ["A term; its registrar","A view; its leader (§4)"],
 ["A vote; a bundle of three","A partially signed vote; a quorum certificate of n − f votes (§4.1–4.2)"],
 ["A threshold seal","A (2f + 1, n)-threshold signature, combining partial signatures into one (§3)"],
 ["First, second, third votes and bundles","prepare, pre-commit, commit votes; prepareQC, precommitQC, commitQC (§4.1)"],
 ["The latest first bundle a man sends a new registrar","new-view carrying prepareQC; highQC (§4.1)"],
 ["The lock","lockedQC, set on the precommitQC (Algorithm 2, line 25)"],
 ["The rule for the first vote, its two halves","safeNode: the safety rule (extends the locked node) or the liveness rule (a higher view than the lock) (Algorithm 1)"],
 ["Never Two Entries","Conflicting nodes cannot both be committed by correct replicas (Lemma 1, Theorem 2)"],
 ["The hidden lock; two stages and a full sandglass","The livelessness of two-phase HotStuff; Tendermint and Casper's wait for Δ (§4.4; §7.3)"],
 ["Going at the Rats' Pace","Optimistic responsiveness; after GST a correct leader decides within a bounded time (Lemma 3, Theorem 4)"],
 ["Registrars in fixed order; doubling sandglasses","The leader function and nextView with exponential back-off: the Pacemaker (§4.4, §6)"],
 ["A new registrar every entry; three in a row","Chained HotStuff; One-, Two- and Three-Chains (§5, Algorithm 3, Theorem 5)"],
 ["Every man to every man; a heavy change","PBFT's quadratic normal case and cubic view change in authenticators (Table 1)"]]);
REG.start();
})();

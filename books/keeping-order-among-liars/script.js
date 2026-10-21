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

/* the four bandits, told apart by colour; Number 1 is the chief */
const BC={1:"#a57fc0",2:"#9aa0a8",3:"#e8964d",4:"#b07a55"};
const chip=k=>`<span class="chip"><i style="background:${BC[k]}"></i>Number ${k}</span>`;
const chips=a=>a.length?a.map(chip).join(""):"<i>nobody</i>";

/* a row of buttons for choosing one thing; keeps keyboard focus when it redraws */
function picker(host,label,opts,cur,on){
  const keep=host.dataset.f;delete host.dataset.f;host.innerHTML="";host.className="pick";
  const l=document.createElement("span");l.className="plab";l.textContent=label;host.appendChild(l);
  opts.forEach(([v,t],i)=>{const b=document.createElement("button");b.className="btn"+(v===cur?"":" alt");b.textContent=t;b.setAttribute("aria-pressed",v===cur);
    b.onclick=()=>{host.dataset.f=i;on(v)};host.appendChild(b);if(keep!=null&&+keep===i)b.focus()});
}

/* ===== machines: the same commands in two orders ===== */
(function(){
  const cmds={add:{t:"add 1",f:x=>x+1},dbl:{t:"double it",f:x=>x*2}},rows=$("#ordrows"),say=$("#ordsay"),bs=$("#ordsame"),bw=$("#ordswap");
  const run=order=>{let x=3;const lines=[`start at ${x}`];order.forEach(k=>{x=cmds[k].f(x);lines.push(`${cmds[k].t} → ${x}`)});return {x,lines}};
  const card=(n,r,bad)=>`<div class="copy${bad?" bad":""}"><h5>Copy ${n}</h5>${r.lines.map(l=>`<div class="e">${l}</div>`).join("")}<div class="fin">holds ${r.x}</div></div>`;
  function show(o2,which){
    const a=run(["add","dbl"]),b=run(o2),bad=a.x!==b.x;
    rows.innerHTML=card(1,a,bad)+card(2,b,bad);
    bs.classList.toggle("alt",which!=="same");bw.classList.toggle("alt",which!=="swap");
    say.innerHTML=bad?`<span class="bad">The copies now hold ${a.x} and ${b.x}.</span> The commands were the same. Only their order differed, and an honest copy cannot tell which order is the right one unless the replicas agree on it.`:`Both copies hold ${a.x}. Same commands in the same order, same result.`;
  }
  bs.onclick=()=>show(["add","dbl"],"same");bw.onclick=()=>show(["dbl","add"],"swap");
  rows.innerHTML=card(1,{x:3,lines:["start at 3"]})+card(2,{x:3,lines:["start at 3"]});
  rows.querySelectorAll(".fin").forEach(f=>f.textContent="holds 3");
})();

/* ===== the crown, seen from above: ring wall at the centre with Number 1, three posts on the slopes ===== */
function Crown(svg){
  const cx=235,cy=235,R=150,A={2:-90,3:30,4:150}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:105,fill:"none",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("circle",{cx,cy,r:48,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":9},svg);
  const sites=el("g",{},svg),over=el("g",{},svg);
  const C={svg,cx,cy,R,A,over,tent:{},
    pos(k){if(k===1)return [cx,cy];const a=A[k]*Math.PI/180;return [cx+R*Math.cos(a),cy+R*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:11,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph||"";return g},
    /* a rat u of the way from post a to post b; each direction keeps to its own side of the line */
    fly(g,a,b,u){const [x1,y1]=C.pos(a),[x2,y2]=C.pos(b),dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy),o=30*Math.sin(Math.PI*u);
      C.put(g,x1+dx*u-dy/l*o,y1+dy*u+dx/l*o)},
    state(k,s){C.tent[k].st.textContent=s}
  };
  for(const k of [1,2,3,4]){const [x,y]=C.pos(k),g=el("g",{class:"site"},sites);C.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:BC[k]},g);el("text",{},g).textContent="B"+k;
    const a=k===1?Math.PI/2:A[k]*Math.PI/180,r=k===1?68:48;
    const st=el("text",{class:"state halo",x:r*Math.cos(a)*(k===1?0:1),y:k===1?66:r*Math.sin(a)},g);
    C.tent[k]={x,y,g,st}}
  return C;
}

/* ===== why three seals, and four bandits: two groups always share an honest bandit ===== */
(function(){
  const C=Crown($("#sealsvg")),ctl=$("#sealctl"),stand=$("#sealstand"),say=$("#sealsay");
  let n=4,liar=null,x=1,y=3;
  const all=m=>[...Array(m)].map((_,i)=>i+1);
  /* the least number of honest bandits two groups can share, over every choice of leaving out, and every supposed liar */
  const least=m=>{let lo=99;all(m).forEach(a=>all(m).forEach(b=>all(m).forEach(l=>{
    const sh=all(m).filter(k=>k!==a&&k!==b&&k!==l);lo=Math.min(lo,sh.length)})));return lo};
  function paint(){
    const A=all(n),gx=A.filter(k=>k!==x),gy=A.filter(k=>k!==y),sh=gx.filter(k=>gy.includes(k)),hon=sh.filter(k=>k!==liar);
    [1,2,3,4].forEach(k=>{const g=C.tent[k].g;g.classList.toggle("gone",k>n);g.classList.toggle("shared",sh.includes(k));g.classList.toggle("sus",k===liar)});
    stand.innerHTML=`<div>First group (everyone but ${chip(x)}) ${gx.map(chip).join("")}</div><div>Second group (everyone but ${chip(y)}) ${gy.map(chip).join("")}</div><div>In both groups ${chips(sh)}</div><div>Honest, and in both ${liar==null?"<i>suppose one bandit lies</i>":chips(hon)}</div>`;
    if(liar==null)say.innerHTML=`Each group is three bandits out of four: all but one, since one may be a silent liar. Suppose one bandit lies, and see who is left in both groups.`.replace("three bandits out of four",n===4?"three bandits out of four":"two bandits out of three");
    else if(hon.length)say.innerHTML=`<span class="ok">An honest bandit sits in both groups.</span> An honest bandit seals only one entry for a number in a term, so the two groups cannot have sealed different entries.`;
    else say.innerHTML=`<span class="bad">The only bandit in both groups is the one who lies.</span> They could seal one entry to the first group and a different one to the second. With ${n} bandits, the groups can fail.`;
    say.innerHTML+=` Over every choice, the fewest honest bandits two groups can share is <b>${least(n)}</b>${n===4?"":", so three bandits are too few"}.`;
    const opts=A.map(k=>[k,"Number "+k]);
    picker($("#sealp1")||mk("sealp1"),"How many bandits?",[[3,"Three bandits"],[4,"Four bandits"]],n,v=>{n=v;if(liar>n)liar=null;if(x>n)x=1;if(y>n)y=n;paint()});
    picker($("#sealp2")||mk("sealp2"),"Suppose this one lies:",opts,liar,v=>{liar=v;paint()});
    picker($("#sealp3")||mk("sealp3"),"The first group leaves out:",opts,x,v=>{x=v;paint()});
    picker($("#sealp4")||mk("sealp4"),"The second group leaves out:",opts,y,v=>{y=v;paint()});
  }
  function mk(id){const d=document.createElement("div");d.id=id;ctl.appendChild(d);return d}
  paint();
})();

/* ===== changing the job: a term that stalls, and the wind that looks the same ===== */
(function(){
  const C=Crown($("#jobsvg")),say=$("#jobsay"),info=$("#jobinfo"),tEl=$("#jobterm"),sEl=$("#jobstood"),
    bF=$("#jobfile"),bN=$("#jobnum"),bS=$("#jobsilent"),bW=$("#jobwind"),bR=$("#jobreset");
  let term=1,waiting=false,wind=true,stood=0,busy=false;
  const registrar=t=>((t-1)%4)+1;
  function paint(){
    const h=registrar(term);[1,2,3,4].forEach(k=>C.tent[k].g.classList.toggle("turn",k===h));
    tEl.textContent=term;sEl.textContent=stood;info.textContent=`term ${term}, taken by Number ${h}`;
    bF.disabled=busy||waiting;bN.disabled=bS.disabled=busy||!waiting;bW.disabled=bR.disabled=busy;
    bW.textContent=wind?"The wind is blowing":"The wind has dropped";bW.setAttribute("aria-pressed",wind);
  }
  async function change(){
    busy=true;paint();const h=registrar(term),next=registrar(term+1),others=[1,2,3,4].filter(k=>k!==next);
    say.innerHTML=`The sandglasses run out. Each bandit who is waiting asks for a change: a sealed request for the next term, with proof of every entry readied at their post, goes to <b>Number ${next}</b>.`;
    const toks=others.map(k=>{const g=C.token(BC[k],"");g.setAttribute("opacity",1);C.fly(g,k,next,.1);return [k,g]});
    await Promise.all(toks.map(([k,g])=>tween(1100+rnd(700),u=>C.fly(g,k,next,.1+.8*u)).then(()=>g.remove())));
    term++;busy=false;paint();
    say.innerHTML=`Three requests are in, and three are enough. <b>Number ${next}</b> now has the job, in term ${term}. The entry is still waiting. Nobody judged whether Number ${h} stalled or the wind held the rats back.`;
  }
  bF.onclick=()=>{waiting=true;paint();say.innerHTML=`An entry is filed with <b>Number ${registrar(term)}</b>, who has the job, and the filer turns a sandglass. ${wind?"The wind is blowing.":"The wind has dropped."}`};
  bN.onclick=async()=>{const h=registrar(term);
    if(wind){say.innerHTML=`<b>Number ${h}</b> numbers the entry and sends the numbering out, but the wind holds the rats in their holes. The sandglass runs out first. From where anyone sits, this looks exactly like a registrar who said nothing.`;await sleep(900);await change();return}
    waiting=false;stood++;paint();
    say.innerHTML=`<b>Number ${h}</b> numbers the entry, the others echo it twice, and it <span class="ok">stands</span> before the sandglass runs out. The job stays where it is.`};
  bS.onclick=async()=>{const h=registrar(term);say.innerHTML=`<b>Number ${h}</b> numbers nothing. The sandglass runs out, and nobody can say whether that is a stall or the wind.`;await sleep(900);await change()};
  bW.onclick=()=>{wind=!wind;paint();say.innerHTML=wind?"The wind is blowing. Nobody can see it drop, and nobody can see it start.":"The wind has dropped, though nobody on the crown can tell. Runs are short again."};
  bR.onclick=()=>{term=1;waiting=false;wind=true;stood=0;paint();say.innerHTML="An entry is filed and waits to be numbered. The wind is blowing."};
  paint();
})();

/* ===== three requests always meet the bandits who hold the entry ===== */
(function(){
  const C=Crown($("#reqsvg")),ctl=$("#reqctl"),stand=$("#reqstand"),say=$("#reqsay");
  let out=4,liar=null,left=1;const registrar=2,all=[1,2,3,4];
  const mk=id=>{const d=document.createElement("div");d.id=id;ctl.appendChild(d);return d};
  function paint(){
    const E=all.filter(k=>k!==out),honE=E.filter(k=>k!==liar),R=all.filter(k=>k!==left),show=R.filter(k=>honE.includes(k));
    all.forEach(k=>{const g=C.tent[k].g;g.classList.toggle("shared",E.includes(k));g.classList.toggle("sus",k===liar);g.classList.toggle("out",k===left)});
    const line=k=>{const yes=honE.includes(k),isL=k===liar;
      return `<div class="rq${yes?" yes":""}">${chip(k)} ${yes?"shows X readied under 7, in term 1":isL?"may say anything at all":"may show it, or may show nothing"}</div>`};
    stand.innerHTML=`<div>Sent second echoes for X ${chips(E)}</div><div>Of them, honest ${liar==null?chips(E):chips(honE)} (they have X readied)</div><div>Number ${registrar} has the job in term 2, and collects requests from ${chips(R)}</div><div class="req">${R.map(line).join("")}</div>`;
    if(show.length)say.innerHTML=`<span class="ok">At least one request shows X readied under 7.</span> The new registrar must number X under 7, and the other bandits check that they do. For number 8 no request shows anything readied, so the new registrar numbers a blank entry there.`;
    else say.innerHTML=`<span class="bad">No request shows X.</span> This cannot happen: two honest bandits have X readied, and three requests out of four always include one of them.`;
    const opts=all.map(k=>[k,"Number "+k]);
    picker($("#reqp1")||mk("reqp1"),"Second echoes for X came from everyone but:",opts,out,v=>{out=v;paint()});
    picker($("#reqp2")||mk("reqp2"),"Suppose this one lies:",[[null,"Nobody"]].concat(opts),liar,v=>{liar=v;paint()});
    picker($("#reqp3")||mk("reqp3"),"The new registrar leaves out the request of:",all.filter(k=>k!==registrar).map(k=>[k,"Number "+k]),left,v=>{left=v;paint()});
  }
  paint();
})();

/* ===== going on once the wind drops: a doubling sandglass against a fixed one ===== */
(function(){
  const ctl=$("#gotctl"),list=$("#gotlist"),say=$("#gotsay"),run=$("#gotrun");
  const NEED=3;   /* a term's worth of short runs: the numbering and the two echoes, each at most one first glass */
  const winds=[[2,"The wind drops soon"],[20,"The wind blows a long time"],[Infinity,"The wind never drops"]];
  let dbl=true,W=2,gen=0;
  const registrar=k=>((k-1)%4)+1;
  function sim(){const rows=[];let t=0;for(let k=1;k<=12;k++){const g=dbl?2**(k-1):1,still=t>=W,ok=still&&g>=NEED;
    rows.push({k,h:registrar(k),t,g,kind:ok?"ok":!still?"wind":"short"});if(ok)break;t+=g}return rows}
  const why={ok:g=>`Still air, and the sandglass of ${g} outlasts three short runs. The entries stand.`,wind:()=>"The wind is still blowing when the term begins. Nothing stands.",short:g=>`Still air, but a sandglass of ${g} runs out before three short runs can finish. The job passes again.`};
  function pickers(){
    picker($("#gotp1")||mk("gotp1"),"The sandglass:",[[true,"Doubles at every change"],[false,"The same every time"]],dbl,v=>{dbl=v;reset()});
    picker($("#gotp2")||mk("gotp2"),"The wind:",winds.map(([w,t])=>[w,t]),W,v=>{W=v;reset()});
  }
  function mk(id){const d=document.createElement("div");d.id=id;ctl.appendChild(d);return d}
  function reset(){gen++;list.innerHTML="";run.disabled=false;pickers();say.textContent="Every registrar is honest in this picture, and the first sandglass is the time a short run takes at most. A term's worth is counted as three short runs: the numbering and the two echoes."}
  run.onclick=async()=>{const g0=++gen,rows=sim(),max=Math.max(...rows.map(r=>r.g));run.disabled=true;list.innerHTML="";
    for(const r of rows){if(g0!==gen)return;const d=document.createElement("div");d.className="trow "+r.kind;
      d.innerHTML=`<b>Term ${r.k}</b><span class="gl"><i style="width:${Math.max(4,r.g/max*100)}%"></i></span><em>Number ${r.h} has the job, glass ${r.g}. ${why[r.kind](r.g)}</em>`;list.appendChild(d);await sleep(450)}
    if(g0!==gen)return;const last=rows[rows.length-1];
    if(last.kind==="ok")say.innerHTML=`<span class="ok">The entries stand at term ${last.k}.</span> ${dbl?"The doubling sandglass grew past a term's worth of short runs, and the first term to begin in still air after that one worked.":"The sandglass never changed, and still air was enough because it was long enough from the start."}`;
    else{const d=document.createElement("div");d.className="trow more";d.textContent="…and so on, for ever";list.appendChild(d);
      say.innerHTML=W===Infinity?`<span class="bad">Nothing ever stands, and nothing wrong stands either.</span> Going on waits for the wind to drop.`:`<span class="bad">The changes never stop.</span> A sandglass that stays the same is always shorter than a term's worth of short runs, so every term runs out before it can finish.`}
    run.disabled=false};
  reset();
})();

/* ===== settling checkpoints: the allowed numbers, and a registrar who jumps ahead ===== */
(function(){
  const nE=$("#setN"),sE=$("#setS"),kE=$("#setK"),bar=$("#setbar"),meter=bar.parentNode,rng=$("#setrange"),say=$("#setsay"),
    bF=$("#setfile"),bS=$("#setsettle"),bB=$("#setbad"),bG=$("#setgood"),bR=$("#setreset");
  const DIST=200;   /* the picture's fixed distance beyond the last settled checkpoint */
  let N=0,S=0;
  function paint(){
    nE.textContent=N;sE.textContent=S;kE.textContent=N-S;bar.style.width=((N-S)/DIST*100)+"%";meter.classList.toggle("full",N-S>=DIST);
    rng.textContent=`Allowed numbers: ${S+1} to ${S+DIST}. ${N-S} of the ${DIST} ${N-S===1?"is":"are"} used.`;
    bF.disabled=N+50>S+DIST;bS.disabled=Math.floor(N/100)*100<=S;bG.disabled=N>=S+DIST;
  }
  bF.onclick=()=>{N+=50;paint();say.innerHTML=`Fifty more entries stand, up to number ${N}. Every echo for them is held, in case a change of job calls for it.${N+50>S+DIST?" <span class='bad'>No more numbers are allowed until a checkpoint settles.</span>":""}`};
  bS.onclick=()=>{const to=Math.floor(N/100)*100;S=to;paint();say.innerHTML=`Each bandit sealed a summary of their copy up to <b>${to}</b>. Three matching summaries settle the checkpoint: at least two honest bandits have the same scroll up to there. Every echo for numbers up to ${to} is thrown away, and the allowed numbers move up.`};
  bB.onclick=()=>{say.innerHTML=`<span class="bad">Refused.</span> Number 1,000,000 lies far beyond the last settled checkpoint plus ${DIST}. A registrar cannot use up the numbers by jumping to an enormous one.`};
  bG.onclick=()=>{N++;paint();say.innerHTML=`Number ${N} lies between the last settled checkpoint and ${S+DIST}, so it is allowed.`};
  bR.onclick=()=>{N=0;S=0;paint();say.innerHTML="Nothing is written yet. The picture's allowed numbers run two hundred beyond the last settled checkpoint."};
  paint();
})();

/* ===== scrollytelling: one entry, from filing to standing ===== */
(function(){
  const svg=$("#echosvg"),side=$("#echoside");
  const nodes={1:[-90,"B1",BC[1]],2:[0,"B2",BC[2]],3:[90,"B3",BC[3]],4:[180,"B4",BC[4]]};
  const P=Polar(svg,{vb:"0 0 620 600",cx:310,cy:300,r0:46,step:34,rings:7,tEnd:6.6,note:[14,24],nodes});
  const defs=$("defs",svg);
  [["o","#a8741a"],["g","#5f6e28"]].forEach(([k,c])=>{const m=el("marker",{id:`${svg.id}-${k}`,markerWidth:9,markerHeight:9,refX:7.5,refY:3.2,orient:"auto"},defs);el("path",{d:"M0,0 L7.5,3.2 L0,6.4 z",fill:c},m)});
  /* the rule: every rat is a row, sent at s and taken in at r */
  const HOLD=1,M=[];
  M.push({kind:"file",a:2,b:1,s:1.4,r:2.4});
  [2,3,4].forEach(b=>M.push({kind:"num",a:HOLD,b,s:2.4,r:3.4,held:b===4}));
  [2,3].forEach(a=>[1,2,3].filter(b=>b!==a).forEach(b=>M.push({kind:"first",a,b,s:3.4,r:4.4})));
  [1,2,3].forEach(a=>[1,2,3].filter(b=>b!==a).forEach(b=>M.push({kind:"second",a,b,s:4.4,r:5.4})));
  /* what each bandit holds at moment T, by the rules of the book */
  function know(k,T){
    const has=k===HOLD?T>=2.4:M.some(m=>m.kind==="num"&&m.b===k&&!m.held&&m.r<=T);
    const fe=M.filter(m=>m.kind==="first"&&m.b===k&&m.r<=T).map(m=>m.a),own1=k!==HOLD&&k!==4&&has&&T>=3.4;
    const first=fe.length+(own1?1:0),ready=has&&first>=2&&k!==4;
    const se=M.filter(m=>m.kind==="second"&&m.b===k&&m.r<=T).length,own2=ready&&T>=4.4,second=se+(own2?1:0);
    return {has,first,ready,second,stands:ready&&second>=3};
  }
  /* the picture: each mark appears at one step and stays */
  const items=[];const add=(e,from,to=99)=>{e.classList.add("fade");items.push({e,from,to});return e};
  const hot=p=>p;
  const dot=(k,t,fill,from)=>add(P.event(k,t,fill,9),from);
  const lbl=(k,t,s,from,to,col)=>{const [x,y]=P.pt(k,t),a=nodes[k][0],t2=el("text",{class:"lab halo",x:x+(a===-90||a===90?-14:0),y:y+(a===-90||a===90?5:-16)},P.over);t2.textContent=s;
    t2.style.textAnchor=a===-90||a===90?"end":"middle";if(col)t2.style.fill=col;return add(t2,from,to)};
  const slip=(m,from,col,mk,dash)=>{const p=P.slip(m.a,m.s,m.b,m.r,12);p.setAttribute("style",`stroke:${col};stroke-width:3.4`);p.setAttribute("marker-end",`url(#${svg.id}-${mk})`);if(dash)p.style.strokeDasharray="7 5";return add(p,from)};
  const holds=el("text",{class:"lab halo",x:292,y:261,style:"text-anchor:end"},P.over);holds.textContent="has the job";
  dot(2,1.4,"#fffaf0",0);M.filter(m=>m.kind==="file").forEach(m=>slip(m,0,"#136f9e","b"));lbl(2,1.4,"files",0,0);
  dot(1,2.4,"#fffaf0",1);lbl(1,2.4,"no. 7",1,1,"#bf4a26");
  M.filter(m=>m.kind==="num").forEach(m=>slip(m,1,"#bf4a26","r",m.held));
  lbl(4,4.9,"held by the wind",1,99);
  [2,3].forEach(k=>dot(k,3.4,"#fffaf0",2));
  M.filter(m=>m.kind==="first").forEach(m=>slip(m,2,"#a8741a","o"));
  [1,2,3].forEach(k=>dot(k,4.4,"#e0b84a",3));lbl(2,4.4,"readied",3,3);
  M.filter(m=>m.kind==="second").forEach(m=>slip(m,4,"#5f6e28","g"));
  [1,2,3].forEach(k=>dot(k,5.4,"#9cb648",5));lbl(2,5.4,"stands",5,5,"#2f5a1c");
  const Ts=[2.4,3.4,3.4,4.4,4.4,5.4];
  function card(k,s){
    const T=Ts[s],K=know(k,T),role=k===HOLD?"has the job":"";
    const note=[];
    if(k===4)return `<div class="hc dim"><h5><span><i class="dot" style="background:${BC[k]}"></i>Number 4</span></h5><div class="chk">${s>=1?"Rats held by the wind. Nobody waits for them.":"—"}</div></div>`;
    if(s===0&&k===2)note.push("filed the entry");
    note.push(K.has?(k===HOLD?"has numbered it":"holds the numbering"):"no numbering yet");
    if(s>=2&&k!==HOLD)note.push(`first echoes ${Math.min(K.first,2)} of 2`);
    else if(s>=2)note.push(`first echoes ${Math.min(K.first,2)} of 2`);
    if(s>=3&&K.ready)note.push("readied");
    if(s>=4)note.push(`second echoes ${Math.min(K.second,3)} of 3`);
    if(K.stands)note.push("<b>stands</b>");
    return `<div class="hc${K.stands?" done":""}"><h5><span><i class="dot" style="background:${BC[k]}"></i>Number ${k}</span><span>${role}</span></h5><div class="chk">${note.join("<br>")}</div></div>`;
  }
  scrolly($("#echo"),s=>{
    items.forEach(it=>it.e.classList.toggle("on",s>=it.from&&s<=it.to));
    side.innerHTML=[1,2,3,4].map(k=>card(k,s)).join("");
  });
})();

/* ===== who is who ===== */
mapPairs($("#map"),[
  ["Four bandits; one may lie","Replicas: n = 3f + 1 = 4, with f = 1 Byzantine (§2, §4)"],
  ["The wind, and its dropping","An asynchronous network; progress needs delay(t) not to outgrow t for ever (§2)"],
  ["Seal rings","Public-key signatures that an adversary cannot forge (§2); message digests are folded into the seal here"],
  ["The loot scroll; an entry","A deterministic replicated state machine; an operation request (§3–4)"],
  ["Order; going on","Safety (linearizability) and liveness (§3)"],
  ["The job; a term; the fixed order of registrars","The primary; a view; primary = v mod |R| (§4)"],
  ["Two matching sealed words to trust an entry","The client waits for f + 1 matching replies (§4.1); redundant for a replica acting as its own client"],
  ["Numbering; first echo; readied","Pre-prepare; prepare; prepared = pre-prepare + 2f matching prepares (§4.2)"],
  ["Second echo; stands","Commit; committed-local = prepared + 2f + 1 matching commits (§4.2)"],
  ["One Entry to a Number","If prepared(m, v, n, i) then not prepared(m′, v, n, j) for non-faulty j and m′ ≠ m (§4.2)"],
  ["Why four bandits","3f + 1 is optimal for asynchronous safety and liveness (§2, citing Bracha and Toueg)"],
  ["Asking for a change; the three requests; the new numbering; blank entries","View-change; new-view with 2f + 1 view-changes; the set O; null requests (§4.4)"],
  ["Order Across Terms","Non-faulty replicas agree on the sequence numbers of requests that commit locally, even in different views (§4.5.1; a sketch, with the full proof in Castro's thesis)"],
  ["Joining on two requests; no bandit forces a change; a lying registrar's single term","Join a view change on f + 1 view-changes; a change needs f + 1; a faulty primary for at most f consecutive views (§4.5.2)"],
  ["Doubling the sandglass","The view-change timeout doubles (§4.5.2)"],
  ["Settled checkpoints; the allowed numbers","Stable checkpoints with 2f + 1 matching messages; low and high water marks (§4.3)"],
  ["A nonsense entry","Faulty clients are observed consistently but can write garbage; access control limits them (§3)"],
  ["Keeps nothing secret","No fault-tolerant privacy (§2)"],
  ["Cheaper marks only the receiver can check","Message authentication codes and authenticators, with signatures kept for view changes (§5.2)"]]);
})();

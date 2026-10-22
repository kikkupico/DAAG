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

/* Schedia's five legislators, told apart by colour */
const WHO={O:{n:"Okios",m:"R1",gm:"R1",g:"Ο",c:"#8fa3b8"},L:{n:"Liskovia",m:"R2",gm:"R2",g:"Λ",c:"#e8b03a"},K:{n:"Kleon",m:"R3",gm:"R3",g:"Κ",c:"#8fb35a"},M:{n:"Melissa",m:"R4",gm:"R4",g:"Μ",c:"#cf5a4a"},T:{n:"Theron",m:"R5",gm:"R5",g:"Θ",c:"#b3aea4"}};
const ALL=["O","L","K","M","T"];
const who=k=>`<span class="who"><i style="background:${WHO[k].c}"></i>${dual(WHO[k].n,WHO[k].m)}</span>`;
/* a note on a bench, said again for computing */
const M_=s=>s.replace(/board/g,"view").replace(/to line/g,"to record").replace(/smooth wax/g,"state lost").replace(/on the porch/g,"cut off").replace(/\bline\b/g,"record");
const yes=ok=>ok?"<span class='ok'>✓</span>":"<span class='bad'>✗</span>";
$("#cast").innerHTML=ALL.map(who).join("");

/* ===== the Tholos, seen from above: the podium at the centre, five benches round the wall, the porch door below ===== */
function Tholos(svg,o={}){
  const cx=220,cy=215,rr=204,R=138,A={O:-90,L:-18,K:54,M:126,T:198};
  svg.innerHTML="";svg.setAttribute("viewBox","0 0 440 470");
  el("circle",{cx,cy,r:rr,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5,class:"i"},svg);
  el("circle",{cx,cy,r:R+36,fill:"none",stroke:"#b5602c","stroke-width":3,"stroke-dasharray":"3 8",class:"i"},svg);
  el("rect",{x:cx-26,y:cy+rr-2,width:52,height:26,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3,class:"i"},svg);
  el("text",{x:cx,y:cy+rr+42,class:"lab i",style:"font-size:12px"},svg).textContent="the porch";
  const under=el("g",{},svg),pod=el("g",{class:"podium"},svg),seats=el("g",{},svg),over=el("g",{},svg);
  const disc=el("circle",{cx,cy,r:34,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":4},pod),bt=dtext(pod,{x:cx,y:cy},"","");
  const T={svg,cx,cy,under,over,seat:{},porch:[cx,cy+rr+12],
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    pos(k){return k==="P"?[cx,cy]:k==="porch"?T.porch:[T.seat[k].x,T.seat[k].y]},
    token(fill,glyph,gm){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:12,fill,stroke:"#1c1512","stroke-width":2.5},g);dtext(g,{},glyph,gm===undefined?glyph:gm);return g},
    /* a runner or a note u of the way from one place to another */
    run(g,a,b,u){const [x1,y1]=T.pos(a),[x2,y2]=T.pos(b);T.put(g,x1+(x2-x1)*u,y1+(y2-y1)*u)},
    board(text,k){bt[0].textContent=text;bt[1].textContent=M_(text);disc.setAttribute("fill",k?WHO[k].c:"#d9cfb4");ALL.forEach(x=>T.seat[x].g.classList.toggle("holder",x===k))},
    note(k,s,m){const t=T.seat[k].s;t[0].textContent=s;t[1].textContent=m===undefined?M_(s):m},
    out(k,on){T.seat[k].g.classList.toggle("out",!!on)}
  };
  ALL.forEach(k=>{const [x,y]=T.at(A[k]),g=el("g",{class:"seat"},seats);T.put(g,x,y);
    el("circle",{class:"ring",r:31},g);el("circle",{class:"b",r:24,fill:WHO[k].c},g);dtext(g,{class:"g"},WHO[k].g,WHO[k].gm);
    const s=dtext(g,{class:"s halo",y:A[k]<0&&A[k]>-180?-34:43},"","");T.seat[k]={x,y,g,s}});
  return T;
}

/* the cover, in computing: five replicas, a primary at the centre, one cut off */
(function(){const T=Tholos($("#coversvg"));T.board("board 6","O");T.out("T",true);
  [["P","L",.5],["P","K",.4],["P","M",.55],["L","P",.4],["K","P",.5]].forEach(([a,b,u])=>{const g=T.token(WHO.O.c,"");g.setAttribute("opacity",1);T.run(g,a,b,u)})})();

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
    hold[k]=Math.max(hold[k],carry);paint();g.querySelectorAll("text").forEach(t=>t.textContent="✓");g.firstChild.setAttribute("fill",WHO[k].c);
    await tween(pace[k],u=>T.run(g,k,"P",.2+.62*u));g.remove();
    word[k]=Math.max(word[k],carry);flying--;
    const now=count();paint();
    if(now)say.innerHTML=dual(`${WHO[k].n}'s word is the second to come back for line ${passed}. With Okios, three of five hold it: <span class="ok">line ${passed} has passed</span>, and the petitioner is told it is law.`,`${WHO[k].m}'s acknowledgment is the second to come back for record ${passed}. With R1, three of five hold it: <span class="ok">record ${passed} has committed</span>, and the client is told.`);
    else if(passed>=carry)say.innerHTML=dual(`${WHO[k].n}'s copy catches up to line ${carry}. The line had already passed, so nothing changes.`,`${WHO[k].m}'s copy catches up to record ${carry}. The record had already committed, so nothing changes.`);
    else say.innerHTML=dual(`${WHO[k].n} sends word: up to line ${carry}. One word is not enough. Line ${carry} is still a draft.`,`${WHO[k].m} acknowledges up to record ${carry}. One acknowledgment is not enough. Record ${carry} is still a draft.`);
  }
  bw.onclick=()=>{line++;hold.O=line;const here=["L","K","M","T"].filter(k=>!away[k]);
    say.innerHTML=here.length?dual(`Okios writes line ${line} and gives it to the runners.`,`R1 appends record ${line} and sends it to the backups.`):dual(`Okios writes line ${line}, but no bench is within reach. It stays a draft.`,`R1 appends record ${line}, but no backup is reachable. It stays a draft.`);
    paint();here.forEach(runner)};
  ["L","K","M","T"].forEach(k=>{T.seat[k].g.classList.add("pick");button(T.seat[k].g,`${WHO[k].n}: step out or come back`,()=>{away[k]=!away[k];paint();
    if(away[k])say.innerHTML=dual(`${WHO[k].n} steps out of reach. The tablets stay on the bench.`,`${WHO[k].m} is cut off. Its state stays as it was.`);
    else{say.innerHTML=dual(`${WHO[k].n} is back within reach, and the runner brings every line missed, in order.`,`${WHO[k].m} is reachable again, and the primary sends every record missed, in order.`);runner(k)}})});
  paint();
})();

/* ===== board and line: which mark is the later ===== */
(function(){
  const M=[{b:6,w:"Okios",l:12},{b:6,w:"Okios",l:40},{b:7,w:"Kleon",l:3},{b:7,w:"Liskovia",l:1},{b:7,w:"Liskovia",l:12}],box=$("#marks"),say=$("#marksay");
  const MW={Okios:1,Liskovia:2,Kleon:3},name=m=>dual(`board ${m.b}, ${m.w} · line ${m.l}`,`view ${m.b}, R${MW[m.w]} · record ${m.l}`),nameM=m=>`view ${m.b}, R${MW[m.w]} · record ${m.l}`,nameI=m=>`board ${m.b}, ${m.w} · line ${m.l}`;let sel=[];
  /* boards by count, then by name in the order of the alphabet; under one board, by line */
  const cmp=(x,y)=>x.b-y.b||x.w.localeCompare(y.w)||x.l-y.l,cmpM=(x,y)=>x.b-y.b||MW[x.w]-MW[y.w]||x.l-y.l;
  box.innerHTML=M.map((m,i)=>`<button class="mark" data-i="${i}" aria-pressed="false">${name(m)}</button>`).join("");
  $$("button",box).forEach(bt=>bt.onclick=()=>{const i=+bt.dataset.i;if(sel.length===2||sel.includes(i))sel=[];sel.push(i);
    $$("button",box).forEach(x=>x.setAttribute("aria-pressed",sel.includes(+x.dataset.i)));
    if(sel.length<2){say.innerHTML=dual("Now choose a second mark.","Now choose a second viewstamp.");return}
    let [x,y]=sel.map(i=>M[i]),[xm,ym]=[x,y];if(cmp(x,y)>0)[x,y]=[y,x];if(cmpM(xm,ym)>0)[xm,ym]=[ym,xm];
    const why=x.b!==y.b?`board ${y.b} is the later board, whatever the line numbers`+(x.l>y.l?`. Line ${x.l} is a higher number than line ${y.l}, and still the older mark`:""):x.w!==y.w?`both are board ${y.b}, and ${x.w} comes before ${y.w} in the order of the alphabet`:`under the same board, the higher line is the later`;
    const whyM=xm.b!==ym.b?`view ${ym.b} is the later view, whatever the record numbers`+(xm.l>ym.l?`. Record ${xm.l} is a higher number than record ${ym.l}, and still the older viewstamp`:""):xm.w!==ym.w?`both are view ${ym.b}, and R${MW[xm.w]} comes before R${MW[ym.w]} in the order of the identifiers`:`within the same view, the higher timestamp is the later`;
    say.innerHTML=dual(`<b>${nameI(y)}</b> is the later: ${why}.`,`<b>${nameM(ym)}</b> is the later: ${whyM}.`)});
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
    `<li><b>First:</b> ${dual("a majority answered with tablets","a majority answered with intact state")} ${yes(r.c1)} (${r.w.length} of 5)</li>`+
    `<li><b>Third:</b> ${dual("same board, and its holder Okios answered with tablets","same view, and its primary R1 answered with intact state")} ${r.x.length?yes(r.c3):dual("· no tablets are lost","· no state is lost")}</li>`;
  say.innerHTML=r.forms?dual(`<span class="ok">Board 7 forms.</span> ${WHO[r.holder].n} shows the latest line${r.holder==="O"?" and held the podium before, so nothing changes but the board":""}, takes the podium holding line ${HELD[r.holder]}, and opens the board with the whole law.`,`<span class="ok">View 7 forms.</span> ${WHO[r.holder].m} shows the latest record${r.holder==="O"?" and was primary before, so nothing changes but the view":""}, becomes primary holding record ${HELD[r.holder]}, and opens the view with its whole log.`)
    :r.maj?dual(`<span class="bad">No board forms.</span> A majority answered, but the answers cannot be sure of showing line 12. The caller waits and calls again.`,`<span class="bad">No view forms.</span> A majority answered, but the answers cannot be sure of showing record 12. The view manager waits and tries again.`)
    :dual(`<span class="bad">No board forms.</span> Fewer than three have answered. The caller waits and calls again.`,`<span class="bad">No view forms.</span> Fewer than three have answered. The view manager waits and tries again.`);
}
(function(){
  const box=$("#formans"),checks=$("#formchecks"),say=$("#formsay"),ex={O:"without",L:"none",K:"none",M:"with",T:"with"};let ans={...ex};
  const lab={with:dual("with tablets","with state"),without:dual("without","without state"),none:dual("out of reach","unreachable")};
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
    {post:["board 6","O"],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{},n:dual("Okios holds the podium","R1 is the primary")},
    {post:["board 6",null],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{O:1},n:dual("no note from Okios","no message from R1")},
    {post:["board 6",null],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{O:1},n:dual("Liskovia invites all to board 7","R2 invites all to view 7")},
    {post:["board 6",null],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{O:1},n:dual("three answers, all with tablets","three answers, all with intact state")},
    {post:["board 7","L"],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{O:1},n:dual("Liskovia takes the podium","R2 becomes primary")},
    {post:["board 7","L"],h:{O:b6(13),L:b7(1),K:b7(1),M:b7(1),T:b7(1)},out:{O:1},n:dual("the opening line: the whole law to line 12","the opening record: the whole log to record 12")},
    {post:["board 7","L"],h:{O:b7(1),L:b7(1),K:b7(1),M:b7(1),T:b7(1)},out:{},n:dual("Okios joins board 7; line 13 is smoothed away","R1 joins view 7; record 13 is discarded")}];
  /* notes and runners: from, to, glyph, colour, and where each is at which step */
  const toks=[["L","K","7","L",{2:.5}],["L","M","7","L",{2:.5}],["L","T","7","L",{2:.5,3:.62}],["L","O","7","L",{2:.45}],
              ["K","L","12","K",{3:.55}],["M","L","10","M",{3:.55}],
              ["P","K","1","L",{5:.6}],["P","M","1","L",{5:.6}],["P","T","1","L",{5:.6}],["P","O","1","L",{6:.6}]]
    .map(([a,b,g,c,plan])=>({a,b,plan,g:T.token(WHO[c].c,g),u:.2,run:0,end:Math.max(...Object.keys(plan))}));
  scrolly($("#change"),s=>{const S=ST[s];T.board(S.post[0],S.post[1]);
    ALL.forEach(k=>{T.out(k,S.out[k]);T.note(k,S.h[k])});
    side.innerHTML=ALL.map(k=>`<div class="hc"><h5>${dual(WHO[k].n,WHO[k].m)}</h5><div>${dual(`board ${S.h[k].split(" · ")[0]}, line ${S.h[k].split(" · ")[1]}`,`view ${S.h[k].split(" · ")[0]}, record ${S.h[k].split(" · ")[1]}`)}</div><div class="chk">${S.out[k]?dual("out of reach","unreachable"):k===S.post[1]?dual("holds the podium","primary"):""}</div></div>`).join("")+`<div class="hc" style="grid-column:1/-1;min-height:0"><div class="chk" style="margin:0">${S.n}</div></div>`;
    toks.forEach(k=>{const u=k.plan[s],id=++k.run;
      if(u==null){k.g.setAttribute("opacity",0);k.u=s>k.end?.8:.2;T.run(k.g,k.a,k.b,k.u);return}
      k.g.setAttribute("opacity",1);const u0=k.u;tween(800,e=>{if(k.run!==id)return;k.u=u0+(u-u0)*e;T.run(k.g,k.a,k.b,k.u)})});
  });
})();

/* ===== the holder who has not noticed: lines written on the porch reach nobody who will take them ===== */
(function(){
  const T=Tholos($("#porchsvg")),say=$("#porchsay"),bw=$("#porchwrite"),n=$("#porchn");
  let heard=false,busy=false;const og=T.token(WHO.O.c,WHO.O.g,WHO.O.gm);
  T.board("board 7","L");T.out("O",true);T.note("O","on the porch");
  T.put(og,...T.porch);og.setAttribute("opacity",1);dtext(T.over,{class:"lab halo",x:T.porch[0]+48,y:T.porch[1]+4,style:"font-size:12px;text-anchor:start"},"board 6","view 6");
  function paint(){["L","K","M"].forEach(k=>T.note(k,"board 7"));T.note("T",heard?"board 7":"board 6")}
  T.seat.T.g.classList.add("pick");
  button(T.seat.T.g,"Theron: has he heard of board 7?",()=>{if(busy)return;heard=!heard;paint();n.textContent=1;say.innerHTML=heard?dual("Theron has taken board 7.","R5 has taken view 7."):dual("Theron has not heard of board 7.","R5 has not heard of view 7.")});
  bw.onclick=async()=>{busy=true;bw.disabled=true;let took=1;n.textContent=took;say.innerHTML=dual("Okios writes a line under board 6 and sends it to every bench.","R1 appends a record in view 6 and sends it to every backup.");
    await Promise.all(["L","K","M","T"].map(async k=>{const g=T.token(WHO.O.c,"6");g.setAttribute("opacity",1);
      await tween(1300,u=>T.run(g,"porch",k,.1+.74*u));
      const takes=k==="T"&&!heard;g.querySelectorAll("text").forEach(t=>t.textContent=takes?"✓":"✗");g.firstChild.setAttribute("fill",takes?"#a9c25a":"#fde0d4");if(takes)took++;
      await sleep(900);g.remove()}));
    if(took>=3)throw new Error("a line passed under the old board");
    n.textContent=took;
    say.innerHTML=dual(`Liskovia, Kleon and Melissa have taken board 7 and refuse any note that carries board 6. ${heard?"So does Theron.":"Theron takes the line."} ${took===1?"Only Okios holds it":"Two hold it"}, and a line needs three. <span class="bad">It cannot pass.</span> Board 7 formed on three, which leaves at most one other who might take his lines.`,`R2, R3 and R4 have taken view 7 and refuse any message that carries view 6. ${heard?"So does R5.":"R5 takes the record."} ${took===1?"Only R1 holds it":"Two hold it"}, and a record needs three. <span class="bad">It cannot commit.</span> View 7 formed on three, which leaves at most one other that might take its records.`);
    busy=false;bw.disabled=false};
  paint();
})();

/* ===== wax and stone: who goes home, and whether a board can ever form again ===== */
(function(){
  const T=Tholos($("#waxsvg")),checks=$("#waxchecks"),say=$("#waxsay");let home={};
  T.board("board 6","O");
  function paint(){const ans={};ALL.forEach(k=>{ans[k]=home[k]?"without":"with";T.out(k,home[k]);T.note(k,home[k]?"smooth wax":"to line "+HELD[k])});
    const r=mayForm(ans);verdict(r,checks,say);
    if(!r.forms)say.innerHTML=dual(`<span class="bad">No board forms, tonight or ever.</span> All five have answered, so there is nobody left to wait for, and too few answers can show what passed. The council stops for good. The law is lost, but no board starts without line 12.`,`<span class="bad">No view forms, now or ever.</span> All five have answered, so there is nobody left to wait for, and too few answers can show what committed. The group stops for good. The log is lost, but no view starts without record 12.`)}
  ALL.forEach(k=>{T.seat[k].g.classList.add("pick");button(T.seat[k].g,`${WHO[k].n}: go home or stay`,()=>{home[k]=!home[k];paint()})});
  $("#waxreset").onclick=()=>{home={};paint()};paint();
})();

/* ===== relevance map ===== */
mapPairs($("#map"),[["The council of five, each with a copy of the law","A group of replicas"],["The law; a line","The group's state; one record in the log"],["Slow or lost messengers","A network that loses and delays messages"],["Stepping out","Being cut off for a while"],["Going home","A crash that loses what was in memory"],["The podium and its holder","The primary"],["The benches","The backups"],["A runner who never skips a line","In-order delivery from primary to backup"],["A law passes","An operation is committed: a majority hold it"],["A board","A view"],["Board and line","A viewstamp"],["The roll; the caller","Liveness messages; the member that starts a view change"],["An answer with tablets, or without","An acceptance with state, or after a crash"],["The opening line","The new view's first record: the whole state"],["Wax and the stone","Volatile state, and the little kept on stable storage"]]);
REG.start();
})();

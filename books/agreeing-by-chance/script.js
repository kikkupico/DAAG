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

/* the rules of the round, worked in code and used by every widget below */
function sureOf(vals){for(const a of "HA")if(vals.filter(v=>v===a).length*2>4)return a;return null}
function settleRule(secs){const s=secs.filter(Boolean);if(!s.length)return{kind:"toss"};if(s.some(x=>x!==s[0]))throw new Error("two sure answers in one round");return{kind:s.length>1?"settle":"favour",a:s[0]}}
function pickTwo(xs){const a=xs.slice(),out=[];while(out.length<2)out.push(a.splice(rnd(a.length),1)[0]);return out}
/* one whole night. sight: {1:"H",...}. silent: a tent that never sends. reads(r,m,kind,others) names the two other tents man m hears from. */
function night(o){
  const sight=o.sight,silent=o.silent||0,toss=o.toss||(()=>"HA"[rnd(2)]),reads=o.reads||((r,m,kind,others)=>pickTwo(others)),max=o.max||300;
  const men=[1,2,3,4].filter(m=>m!==silent),fav={},parted={},rounds=[];men.forEach(m=>fav[m]=sight[m]);
  const active=men.slice();
  for(let r=1;r<=max&&active.length;r++){
    const send=men.filter(m=>active.includes(m)||(parted[m]&&parted[m].c===r-1));
    const rep={};send.forEach(m=>rep[m]=active.includes(m)?fav[m]:parted[m].a);
    const sure={},R={},S={},out={},sec={};
    active.forEach(m=>{const others=send.filter(x=>x!==m);if(others.length<2)throw new Error("a man would wait for ever");
      R[m]=reads(r,m,"rep",others);sure[m]=sureOf([rep[m],...R[m].map(x=>rep[x])])});
    send.forEach(m=>sec[m]=active.includes(m)?sure[m]:parted[m].a);
    active.forEach(m=>{const others=send.filter(x=>x!==m);S[m]=reads(r,m,"sec",others);
      const res=settleRule([sec[m],...S[m].map(x=>sec[x])]);if(res.kind==="toss")res.t=toss(r,m);out[m]=res});
    rounds.push({r,rep,sure,sec,R,S,out,active:active.slice(),parted:Object.keys(parted).map(Number),send});
    active.slice().forEach(m=>{const x=out[m];if(x.kind==="toss")fav[m]=x.t;else{fav[m]=x.a;if(x.kind==="settle"){parted[m]={c:r,a:x.a};active.splice(active.indexOf(m),1)}}});
  }
  const ans=Object.values(parted).map(p=>p.a);
  if(ans.some(a=>a!==ans[0]))throw new Error("two men committed to different answers");
  if([1,2,3,4].every(m=>sight[m]===sight[1])){if(rounds.length!==1||rounds[0].active.some(m=>rounds[0].out[m].kind!=="settle"))throw new Error("matching sightings were not followed in the first round")}
  return {rounds,parted,done:!active.length,men,silent};
}

/* the four mercenaries, told apart by colour */
const TC={1:"#e0b84a",2:"#6583d6",3:"#c45448",4:"#9cb648"};
const W={H:"hold",A:"attack"},FACE={H:"owl",A:"goddess"},GL={H:"0",A:"1"};   /* hold or attack, owl or goddess in the allegory; 0 or 1 in computing */
const WD=x=>dual(W[x],GL[x]);
const tentChip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${TC[k]}"></i>${dual("Tent "+k,"P"+k)}</span>`;
const list=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" and "+a[a.length-1];
const tents=a=>(a.length>1?"tents ":"tent ")+list(a), pn=a=>list(a.map(k=>"P"+k));

/* ===== the hill, seen from above ===== */
function Hill(svg){
  const cx=235,cy=235,R=158,A={1:-90,2:0,3:90,4:180}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:96,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("circle",{cx,cy,r:24,fill:"#efe6cf",stroke:"#6b5a48","stroke-width":6},svg);
  el("text",{x:cx,y:cy+52,class:"lab i"},svg).textContent="the crown";
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const H={svg,cx,cy,R,A,under,over,tent:{},
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:12,fill,stroke:"#1c1512","stroke-width":2.5},g);dtext(g,{},glyph,GL[glyph]||glyph);return g},
    fly(g,a,b,u){const d=((A[b]-A[a]+540)%360)-180;H.put(g,...H.at(A[a]+d*u,R-(d>0?24:46)*Math.sin(Math.PI*u)))},
    state(k,i,m){const t=H.tent[k].st;t[0].textContent=i;t[1].textContent=i&&(m||i)},
    badge(k,s){const b=H.tent[k].badge;b.setAttribute("opacity",s?1:0);b.t[0].textContent=s||"";b.t[1].textContent=GL[s]||""}
  };
  for(const k of [1,2,3,4]){const a=A[k]*Math.PI/180,[x,y]=H.at(A[k]),g=el("g",{class:"site"},sites);H.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:TC[k]},g);dtext(g,{},"T"+k,"P"+k);
    const st=dtext(g,{class:"state halo",x:-48*Math.cos(a),y:-46*Math.sin(a)},"","");
    const badge=el("g",{class:"badge",opacity:0,transform:`translate(${(38*Math.cos(a)).toFixed(1)} ${(34*Math.sin(a)).toFixed(1)})`},g);el("circle",{r:11},badge);badge.t=dtext(badge,{},"","");
    H.tent[k]={x,y,g,st,badge}}
  return H;
}

/* ===== a night, laid out: one row a round, one cell a tent ===== */
function cellHtml(rd,m,lv,silent){
  if(m===silent)return `<div class="nc gone"><span>${dual("silent","crashed")}</span></div>`;
  if(!rd.send.includes(m))return `<div class="nc gone"><span>${dual("gone","halted")}</span></div>`;
  const early=!rd.active.includes(m),rep=rd.rep[m],sec=rd.sec[m];
  const l1=lv>=1?`<span>${WD(rep)}</span>`:"<span>&nbsp;</span>";
  const l2=lv>=2?`<span>${sec?dual("sure of "+W[sec],`D(${GL[sec]})`):dual("unsure","?")}</span>`:"<span>&nbsp;</span>";
  let l3="<span>&nbsp;</span>",cls="";
  if(lv>=3){if(early){l3=`<span>${dual("sent as they left","sent on halting")}</span>`;cls=" early"}else{const o=rd.out[m];
    if(o.kind==="toss"){l3=`<span>${dual("tosses: "+FACE[o.t],"flips: "+GL[o.t])}</span>`;cls=" toss"}else if(o.kind==="favour"){l3=`<span>${dual("favours "+W[o.a],"favours "+GL[o.a])}</span>`;cls=" fav"}else{l3=`<span><b>${dual("settled: "+W[o.a],"decides "+GL[o.a])}</b></span>`;cls=" set"}}}
  return `<div class="nc${cls}">${l1}${l2}${l3}</div>`;
}
function grid(host,N,levels,labels,from=0){
  const rs=N.rounds;let h=`<div class="nrow hd"><div></div>${[1,2,3,4].map(k=>`<div>${tentChip(k)}</div>`).join("")}</div>`;
  if(from>0)h+=`<div class="nmore">${from} earlier round${from>1?"s":""} not shown</div>`;
  for(let i=from;i<rs.length;i++){const lv=levels===null?3:(levels[i]||0);if(!lv)continue;
    h+=`<div class="nrow"><div class="rl">${labels?labels[i]:"Round "+rs[i].r}</div>${[1,2,3,4].map(m=>cellHtml(rs[i],m,lv,N.silent)).join("")}</div>`}
  host.innerHTML=h;
}
function describeR(rd,c){
  const w=x=>c?GL[x]:W[x],fc=x=>c?GL[x]:FACE[x],tn=k=>c?"P"+k:"tent "+k,tl=a=>c?pn(a):tents(a);
  const act=rd.active;let s=`Reports: ${act.map(k=>`${tn(k)} ${w(rd.rep[k])}`).join(", ")}. `;
  const sures=act.filter(k=>rd.sure[k]);
  if(!sures.length){const n={H:0,A:0};act.forEach(k=>n[rd.rep[k]]++);const t=n.H>=n.A?"H":"A";
    s+=n[t]*2>act.length?(c?`${n[t]} of the ${act.length} favour ${w(t)}, but to be sure a process needs more than half of all four, which is three alike. `:`${n[t]} of the ${act.length} favour ${w(t)}, but to be sure a man needs more than half of all four, which is three alike. `):"";
    s+=c?"Nobody proposes a D-value. ":"Nobody is sure. "}
  else s+=c?`${tl(sures)} send${sures.length>1?"":"s"} D(${w(rd.sure[sures[0]])}). `:`${list(sures.map(k=>"tent "+k))} write${sures.length>1?"":"s"} sure of ${w(rd.sure[sures[0]])}. `;
  const g={toss:[],favour:[],settle:[]};act.forEach(k=>g[rd.out[k].kind].push(k));
  if(g.toss.length)s+=c?`Flipping: ${list(g.toss.map(k=>`${tn(k)} gets ${fc(rd.out[k].t)}`))}. `:`Tossing: ${list(g.toss.map(k=>`tent ${k} the ${fc(rd.out[k].t)}`))}. `;
  if(g.favour.length)s+=`Favouring ${w(rd.out[g.favour[0]].a)} from now on: ${tl(g.favour)}. `;
  if(g.settle.length)s+=c?`<b>Decided ${w(rd.out[g.settle[0]].a)}: ${tl(g.settle)}.</b> ${g.settle.length>1?"Each sends":"This process sends"} both messages of the next round at once, and halts.`:`<b>Settled on ${w(rd.out[g.settle[0]].a)}: ${tl(g.settle)}.</b> ${g.settle.length>1?"Each sends":"This tent sends"} both birds of the next round at once, and leaves.`;
  return s;
}
const describe=rd=>dual(describeR(rd,0),describeR(rd,1));

/* ===== a coin in each tent ===== */
(function(){
  const H=Hill($("#coinsvg")),say=$("#coinsay"),tally=$("#cointally"),bs=[1,2,3,4,"all"].map(k=>$("#coin"+k)),br=$("#coinr");
  let tl,busy=false;
  const paint=()=>tally.innerHTML=[1,2,3,4].map(k=>`<div>${tentChip(k)} ${dual(`owl ${tl[k][0]} · goddess ${tl[k][1]}`,`0: ${tl[k][0]} · 1: ${tl[k][1]}`)}</div>`).join("");
  async function toss(ks){if(busy)return;busy=true;bs.forEach(b=>b.disabled=true);ks.forEach(k=>H.state(k,"…"));say.textContent="The coin is in the air.";
    await sleep(500);const res=ks.map(k=>{const f=rnd(2)?"H":"A";tl[k][f==="H"?0:1]++;H.state(k,FACE[f],GL[f]);H.badge(k,f);return [k,f]});
    say.innerHTML=dual(res.map(([k,f])=>`<b>Tent ${k}</b>: ${FACE[f]}, so it favours ${W[f]}.`).join(" ")+" Each press differs, and nothing here says how the next toss will fall.",
      res.map(([k,f])=>`<b>P${k}</b> flips ${GL[f]}, so it favours ${GL[f]}.`).join(" ")+" Each press differs, and nothing here says how the next flip will fall.");
    paint();busy=false;bs.forEach(b=>b.disabled=false)}
  function reset(){tl={1:[0,0],2:[0,0],3:[0,0],4:[0,0]};[1,2,3,4].forEach(k=>{H.state(k,"");H.badge(k,"")});paint();say.innerHTML=dual("Four tents, four coins. Toss in one tent, or in all four.","Four processes, four coins. Flip at one process, or at all four.")}
  [1,2,3,4].forEach((k,i)=>bs[i].onclick=()=>toss([k]));bs[4].onclick=()=>toss([1,2,3,4]);br.onclick=reset;reset();
})();

/* ===== one round at one tent ===== */
(function(){
  const rep=["H","H","H"],secBird=[null,false,false];
  const rEl=$("#rrep"),sEl=$("#rsec"),out=$("#rout"),pick=$("#rpick");
  function paint(){
    const sure=sureOf(rep),own=sure,names=["its own report","a raven from another tent","a raven from a third tent"],namesM=["its own report","a report from another process","a report from a third process"];
    rEl.innerHTML=rep.map((a,i)=>`<button class="btn alt tg" data-i="${i}" aria-label="${(isM()?namesM:names)[i]}: ${isM()?GL[a]:W[a]}. Press to change.">${dual(i?"Raven":"Own report",i?"From another process":"Own report")}: <b>${WD(a)}</b></button>`).join("");
    $$("button",rEl).forEach(b=>b.onclick=()=>{const i=+b.dataset.i;rep[i]=rep[i]==="H"?"A":"H";paint()});
    /* tent 1 read two reports of one answer, so the other has at most two among the four and nobody can be sure of it */
    const ans=own||(rep.filter(a=>a==="H").length>=2?"H":"A"),other=ans==="H"?"A":"H";
    pick.innerHTML=own?`<span>${dual(`The sure birds this round can only name <b>${W[own]}</b>: tent 1 has written sure of ${W[own]}.`,`The D-messages this round can only name <b>${GL[own]}</b>: P1 has sent D(${GL[own]}).`)}</span>`:
      `<span>${dual(`The sure birds this round can only name <b>${W[ans]}</b>: tent 1 read two reports of ${W[ans]}, so at most two of the four name ${W[other]}, and sure of ${W[other]} needs three.`,`The D-messages this round can only name <b>${GL[ans]}</b>: P1 read two reports of ${GL[ans]}, so at most two of the four name ${GL[other]}, and D(${GL[other]}) needs three.`)}</span>`;
    const ownBird=own?`<span class="tg fixed">${dual(`Own second bird: <b>sure of ${W[own]}</b>`,`Own proposal: <b>D(${GL[own]})</b>`)}</span>`:`<span class="tg fixed">${dual("Own second bird: <b>unsure</b>","Own proposal: <b>?</b>")}</span>`;
    sEl.innerHTML=ownBird+[1,2].map(i=>`<button class="btn alt tg${secBird[i]?" on":""}" data-i="${i}">${dual(`Raven ${i}: <b>${secBird[i]?"sure of "+W[ans]:"unsure"}</b>`,`From another process: <b>${secBird[i]?"D("+GL[ans]+")":"?"}</b>`)}</button>`).join("");
    $$("button",sEl).forEach(b=>b.onclick=()=>{const i=+b.dataset.i;secBird[i]=!secBird[i];paint()});
    const secs=[own,secBird[1]?ans:null,secBird[2]?ans:null],r=settleRule(secs);
    const n=secs.filter(Boolean).length;
    out.innerHTML=dual((own?`The three reports read are all ${W[own]}: more than half of all four, so tent 1 writes <b>sure of ${W[own]}</b>. `:`The three reports read are not all alike, and more than half of all four means three alike. Tent 1 writes <b>unsure</b>. `)+
      (r.kind==="toss"?`None of the three second birds is sure, so tent 1 <b>tosses the coin</b> and favours the answer it shows.`:
       r.kind==="favour"?`One of the three second birds is sure of ${W[r.a]}, so tent 1 <b>favours ${W[r.a]}</b> from now on. That is one, not two, so it is not yet settled.`:
       `${n} of the three second birds are sure of ${W[r.a]}, so tent 1 is <b>settled on ${W[r.a]}</b>. Before it commits it sends both birds of the next round to all: the report ${W[r.a]}, and sure of ${W[r.a]}. Then it leaves.`),
      (own?`The three reports read are all ${GL[own]}: more than half of all four, so P1 sends <b>D(${GL[own]})</b>. `:`The three reports read are not all alike, and more than half of all four means three alike. P1 sends <b>?</b>. `)+
      (r.kind==="toss"?`None of the three proposals is a D-message, so P1 <b>flips its coin</b> and favours the value it shows.`:
       r.kind==="favour"?`One of the three proposals is D(${GL[r.a]}), so P1 <b>favours ${GL[r.a]}</b> from now on. That is one, not more than <var>t</var>, so it has not yet decided.`:
       `${n} of the three proposals are D(${GL[r.a]}), so P1 <b>decides ${GL[r.a]}</b>. Before it halts it sends both messages of the next round to all: the report ${GL[r.a]}, and D(${GL[r.a]}).`));
  }
  paint();onReg.push(paint);
})();

/* ===== never two answers: a scroll-driven stage worked out by the rules ===== */
(function(){
  const host=$("#nevergrid");
  const T={rep:{1:[2,4],2:[1,4],3:[1,2],4:[3,1]},sec:{1:[2,3],2:[3,4],3:[4,1],4:[3,2]}};
  const N=night({sight:{1:"H",2:"H",3:"A",4:"H"},reads:(r,m,k,o)=>r===1?T[k][m]:o.slice(0,2)});
  const L=[[1,0],[2,0],[3,0],[3,1],[3,3],[3,3]];
  scrolly($("#never"),i=>grid(host,N,L[Math.min(i,5)],["A round","Next round"]));
})();

/* ===== the toss: the night of the story, round by round ===== */
(function(){
  const host=$("#storygrid"),say=$("#storysay"),b=$("#storynext"),r=$("#storyr");let n=0;
  const N=night({sight:{1:"H",2:"A",3:"H",4:"A"},silent:4,toss:(rd,m)=>rd===1?{1:"A",2:"A",3:"H"}[m]:"H"});
  const draw=()=>grid(host,N,N.rounds.map((x,i)=>i<n?3:0));
  b.onclick=()=>{n++;draw();say.innerHTML=describe(N.rounds[n-1]);if(n>=N.rounds.length){b.disabled=true;
      say.innerHTML+=" "+dual("<span class='ok'>The tosses of round 2 happened to agree, so round 3 could not fail to settle.</span>","<span class='ok'>The flips of round 2 happened to agree, so round 3 could not fail to decide.</span>")}};
  r.onclick=()=>{n=0;b.disabled=false;draw();say.innerHTML=dual("Tent 4 is silent. Tents 1, 2 and 3 saw hold, attack and hold at dusk. These are the tosses of one night in the story.","P4 has crashed. P1, P2 and P3 have inputs 0, 1 and 0. These are the flips of one execution in the story.")};
  r.onclick();
})();

/* ===== with probability one: fresh nights ===== */
(function(){
  const host=$("#nightgrid"),say=$("#nightsay"),bs=$("#nightsight"),bq=$("#nightsilent"),run=$("#nightgo");
  const sight={1:"H",2:"A",3:"H",4:"A"};let silent=0;
  const paint=()=>{bs.innerHTML=[1,2,3,4].map(k=>`<button class="btn alt tg" data-k="${k}" aria-label="${isM()?`P${k} has input ${GL[sight[k]]}`:`Tent ${k} saw ${W[sight[k]]} at dusk`}. Press to change.">${dual(`T${k} saw <b>${W[sight[k]]}</b>`,`P${k} input <b>${GL[sight[k]]}</b>`)}</button>`).join("");
    $$("button",bs).forEach(x=>x.onclick=()=>{const k=+x.dataset.k;sight[k]=sight[k]==="H"?"A":"H";paint()});
    bq.innerHTML=dual(silent?"Tent 4 is silent":"All four tents speak",silent?"P4 is crashed":"All four processes run");bq.classList.toggle("on",!!silent)};
  bq.onclick=()=>{silent=silent?0:4;paint()};
  run.onclick=()=>{
    const N=night({sight,silent}),k=N.rounds.length,from=Math.max(0,k-12),toss=N.rounds.reduce((a,x)=>a+Object.values(x.out).filter(o=>o.kind==="toss").length,0);
    grid(host,N,null,null,from);
    const ans=Object.values(N.parted)[0].a,who=N.men.map(m=>m);
    say.innerHTML=dual(`<b>This night took ${k} round${k>1?"s":""}.</b> Every man who spoke committed to ${W[ans]}, and no two differed (worked out by the rules, not typed in). There were ${toss} toss${toss===1?"":"es"}. `+
      (toss===0?`Nobody tossed: the sightings left no room for a coin. `:"")+`Another night may take more or fewer rounds, and no round can be named in advance. Press again and the coins fall differently.`,
      `<b>This execution took ${k} round${k>1?"s":""}.</b> Every process that ran decided ${GL[ans]}, and no two differed (worked out by the rules, not typed in). There ${toss===1?"was 1 flip":`were ${toss} flips`}. `+
      (toss===0?`Nobody flipped: the inputs left no room for a coin. `:"")+`Another execution may take more or fewer rounds, and no round can be named in advance. Press again and the coins fall differently.`)};
  paint();onReg.push(paint);
})();

/* ===== half is too many ===== */
(function(){
  const H=Hill($("#halfsvg")),say=$("#halfsay"),b1=$("#half1"),b2=$("#half2"),b3=$("#half3"),br=$("#halfr");
  let d1,d2,toks;const S={1:"H",2:"H",3:"A",4:"A"};
  const hold=(a,b)=>{const g=H.token(TC[a],S[a]);H.fly(g,a,b,.45);g.setAttribute("opacity",1);toks.push([g,a,b])};
  function reset(){toks.forEach(t=>t[0].remove());toks=[];d1=d2=false;[1,2,3,4].forEach(k=>{H.badge(k,S[k]);H.state(k,"")});b1.disabled=b2.disabled=false;b3.disabled=true;
    say.innerHTML=dual("Tents 1 and 2 saw hold. Tents 3 and 4 saw attack. On this hill, two of the four may fall silent.","P1 and P2 have input 0. P3 and P4 have input 1. In this system, two of the four may crash.")}
  b1.onclick=()=>{d1=true;b1.disabled=true;hold(3,2);hold(4,1);H.state(1,"holds","decides 0");H.state(2,"holds","decides 0");b3.disabled=!(d1&&d2);
    say.innerHTML=dual("Every bird from tents 3 and 4 stays in the pines. Tents 1 and 2 hear only each other, and for all they can tell the other two are silent for good. That looks exactly like a night on which all four saw hold and the other two fell silent at the start, and there the second demand has them hold. Their coins make no difference. <b>So they hold.</b>","Every message from P3 and P4 is delayed. P1 and P2 hear only each other, and for all they can tell the other two have crashed for good. That looks exactly like an execution in which all four had input 0 and the other two crashed at the start, and there validity makes them decide 0. Their coins make no difference. <b>So they decide 0.</b>")};
  b2.onclick=()=>{d2=true;b2.disabled=true;hold(1,4);hold(2,3);H.state(3,"attacks","decides 1");H.state(4,"attacks","decides 1");b3.disabled=!(d1&&d2);
    say.innerHTML=dual("In the same way every bird from tents 1 and 2 stays in the pines, and tents 3 and 4 hear only each other. <b>So they attack.</b>","In the same way every message from P1 and P2 is delayed, and P3 and P4 hear only each other. <b>So they decide 1.</b>")};
  b3.onclick=async()=>{b3.disabled=true;await Promise.all(toks.map(([g,a,b])=>tween(1100,u=>H.fly(g,a,b,.45+.43*u)).then(()=>g.setAttribute("opacity",0))));
    say.innerHTML=dual("All four are alive and every bird was merely late, so neither pair could tell. <span class='bad'>The pairs have committed to different answers.</span> The first demand is broken. The picture shows the pattern of the argument, not a worked plan.","All four are alive and every message was merely late, so neither pair could tell. <span class='bad'>The pairs have decided different values.</span> Agreement is broken. The picture shows the pattern of the argument, not a worked protocol.")};
  br.onclick=reset;toks=[];reset();
})();

/* ===== who is who ===== */
mapPairs($("#map"),[
["The four tents","Processes. N = 4 asynchronous processes."],
["A sighting; attack or hold","Each process's input. A binary initial value x."],
["Committing","An irrevocable decision. Setting the write-once output register."],
["The three demands","Agreement; validity when all inputs are equal; termination. Consensus with correctness criterion (C1)."],
["Ravens that always arrive, with no longest flight, in any order","Reliable asynchronous message passing. The message buffer; every message is eventually delivered to a process that keeps taking steps."],
["A man killed; a silent tent","A crash failure, indistinguishable from slowness. A t-correct schedule, t = 1."],
["The arranger of the birds","The worst case over message orderings, chosen with knowledge of everything so far. The adversary scheduler, which knows all about the system."],
["The coin, owl or goddess, tossed alone in each tent","A private fair random bit at each process. Step 3(c): set x to 0 or 1 with probability 1/2 each (a local coin)."],
["A round; the report","A numbered phase; the first message of the round. Message (1, r, x)."],
["Sure of an answer; unsure","The second message. (2, r, v, D) when more than N/2 of the received values are v; (2, r, ?) otherwise."],
["Waiting for three birds","Waiting for all but t. Wait for N − t messages."],
["Favouring an answer on one sure bird; settled on two","Adopting a value; deciding. Step 3(a): one D-message; step 3(b): more than t D-messages."],
["The rule of parting","A decided process sends its next round's messages and halts. Not in the paper, where decided processes keep running; added here because committing is silence, and shown to change nothing."],
["Never two answers; the sightings respected","Agreement and validity, on every run. Theorem 1 (ii), (iii)."],
["Committing with probability one","Termination with probability 1 for N > 2t. Theorem 1 (i). The paper gives no proof; Aguilera and Toueg (2012) give a complete one."],
["Half is too many","No consensus when N ≤ 2t. The remark after Theorem 2: the schedule can simulate a partition."],
["Six men against one liar","Byzantine agreement for N > 5t, with authenticated senders. Protocol B, Theorem 2."],
["The happier case","Constant expected rounds when t = O(√N), run synchronously. Theorem 3."],
["No drawing lots","Deterministic processes. The assumption of FLP that randomization removes."]]);
REG.start();
})();

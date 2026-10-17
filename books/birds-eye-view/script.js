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


/* ================================================================ the bird's-eye view
   Each book is a dial: a round picture of one idea, with the book's ideas numbered round the rim.
   The cast keeps its colours from the books: Arche's houses, the Chamber's priests, Schedia's legislators. */
const HC={1:"#9cb648",2:"#e0b84a",3:"#5b9be0"};
const PC={A:"#e0b84a",B:"#5b9be0",G:"#e2564e",D:"#9cb648",E:"#b58be0",Z:"#e89a4d",H:"#5fbfae"};
const PG={A:"Α",B:"Β",G:"Γ",D:"Δ",E:"Ε",Z:"Ζ",H:"Η"};
const WHO={O:{n:"Okios",g:"Ο",c:"#8fa3b8"},L:{n:"Liskovia",g:"Λ",c:"#e8b03a"},K:{n:"Kleon",g:"Κ",c:"#8fb35a"},M:{n:"Melissa",g:"Μ",c:"#cf5a4a"},T:{n:"Theron",g:"Θ",c:"#b3aea4"}};
const THA={O:-90,L:-18,K:54,M:126,T:198};
const BOOK={
  arche:{c:"#b5602c",name:"Arche",title:"Ordering Without Clocks",line:"Three trading houses round a mountain, slips carried on one road, and no sun to tell the hour.",href:"../ordering-without-clocks/index.html"},
  paxos:{c:"#136f9e",name:"Paxos",title:"The Part-Time Parliament",line:"Legislators who wander in and out, scrolls in indelible ink, and decrees passed by ballot.",href:"../the-part-time-parliament/index.html"},
  schedia:{c:"#c8961c",name:"Schedia",title:"One Leader at a Time",line:"Five legislators, a law on wax tablets, and a podium that one of them holds at a time.",href:"../one-leader-at-a-time/index.html"}};
const ORDER=["arche","paxos","schedia"];
const narrow=matchMedia("(max-width:600px)");   // on a phone the figure fills more of the dial and its words are larger

/* ---------- small drawing parts ---------- */
function txt(p,x,y,s,cls="lab",extra={}){const ex=Object.assign({},extra);if(ex["text-anchor"]){ex.style=(ex.style?ex.style+";":"")+"text-anchor:"+ex["text-anchor"];delete ex["text-anchor"]}
  const t=el("text",Object.assign({x,y,class:cls},ex),p);t.textContent=s;return t}
function tag(p,x,y,s,cls=""){const g=el("g",{class:"tag "+cls,transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},p),r=el("rect",{y:-12,height:24,rx:4},g),t=el("text",{},g);
  g.set=(s,c)=>{t.textContent=s;const w=s.length*(narrow.matches?7.6:6.7)+16;r.setAttribute("x",-w/2);r.setAttribute("width",w);if(c!==undefined)g.setAttribute("class","tag "+c)};g.set(s);return g}
function cross(p,x,y,s=7){return el("path",{class:"cross",d:`M${x-s},${y-s}L${x+s},${y+s}M${x+s},${y-s}L${x-s},${y+s}`},p)}
function token(p,x,y,fill,glyph){const g=el("g",{class:"tok",transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},p);
  el("circle",{r:13,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph;return g}

/* Arche's ring road from above (the books' Isle) */
function Isle(svg){
  const cx=235,cy=235,R=165,A={1:-90,2:30,3:150}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:86,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("text",{x:cx,y:cy-8,class:"lab"},svg).textContent="Mount Phyle";
  el("circle",{cx,cy,r:R,fill:"none",stroke:"#b5602c","stroke-width":3,"stroke-dasharray":"3 8"},svg);
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const I={svg,cx,cy,R,A,under,over,house:{},
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    /* u of the way along the direct stretch from house a to house b; each direction keeps to its own lane */
    road(a,b,u){const d=((A[b]-A[a]+540)%360)-180;return I.at(A[a]+d*u,R+(d>0?9:-9))}
  };
  for(const h of [1,2,3]){const [x,y]=I.at(A[h]),g=el("g",{class:"site",transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},sites);
    el("rect",{x:-25,y:-17,width:50,height:34,rx:5,fill:HC[h]},g);el("text",{},g).textContent="H"+h;I.house[h]={x,y}}
  return I;
}

/* a round hall from above: the Chamber (one door) or the Tholos (a porch, a podium) */
function Room(svg,o){
  const cx=220,cy=215,rr=204,R=o.R||138; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 440 470");
  el("circle",{cx,cy,r:rr,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:R+36,fill:"none",stroke:"#b5602c","stroke-width":3,"stroke-dasharray":"3 8"},svg);
  if(o.porch){el("rect",{x:cx-26,y:cy+rr-2,width:52,height:26,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3},svg);txt(svg,cx,cy+rr+44,"the porch","lab sm")}
  else{el("rect",{x:cx-24,y:cy+rr-2,width:48,height:12,fill:"#6b4a2a",stroke:"#1c1512","stroke-width":3},svg);txt(svg,cx,cy+rr+28,"the one door","lab sm")}
  const under=el("g",{},svg),mid=el("g",{},svg),seats=el("g",{},svg),over=el("g",{},svg);
  const H={svg,cx,cy,R,rr,under,over,S:{},
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    /* a tag on the far side of a seat from the middle */
    note(k,s,cls="",d=56){const q=H.S[k],dx=q.x-cx,dy=q.y-cy,n=Math.hypot(dx,dy)||1;return tag(over,q.x+dx/n*d,q.y+dy/n*d,s,cls)}};
  if(o.podium){H.pod=el("g",{class:"podium"},mid);H.podD=el("circle",{cx,cy,r:36,fill:o.podiumFill||"#d9cfb4",stroke:"#1c1512","stroke-width":4},H.pod);H.podT=txt(H.pod,cx,cy+5,o.podium,"lab ink sm")}
  for(const k in o.seats){const [deg,glyph,fill]=o.seats[k],[x,y]=(o.place&&o.place[k])||H.at(deg);
    const g=el("g",{class:"seat"+((o.out||[]).includes(k)?" out":"")+((o.wax||[]).includes(k)?" wax":""),transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},seats);
    if((o.ring||[]).includes(k))el("circle",{class:"ring",r:31},g);
    el("circle",{class:"b",r:24,fill},g);el("text",{class:"g"},g).textContent=glyph;H.S[k]={x,y,g}}
  return H;
}
const tholosSeats=()=>Object.fromEntries(Object.keys(WHO).map(k=>[k,[THA[k],WHO[k].g,WHO[k].c]]));
const chamberSeats=(keys,ang)=>Object.fromEntries(keys.map((k,i)=>[k,[ang[i],PG[k],PC[k]]]));

/* slips that never arrive, and words carried by a slip */
function slip(P,a,ta,b,tb){const p=P.slip(a,ta,b,tb);p.pts=P.arc(a,ta,b,tb);return p}
function lostSlip(P,a,ta,b,tb,frac=.55){const pts=P.arc(a,ta,b,tb),n=Math.max(2,Math.round(pts.length*frac)),q=pts.slice(0,n),e=q[q.length-1];
  return [el("path",{class:"st-slip lost",d:"M"+q.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L")},P.slips),cross(P.over,e[0],e[1])]}
function slipTag(P,p,s,cls,at){const q=at?p.pts[Math.floor(p.pts.length*at)]:p.mid;return tag(P.over,q[0],q[1],s,cls)}

/* one morning on Arche: ten entries and three slips (the books' own morning) */
const MORN=[
  {id:"a",h:1,t:1.2,tally:1,col:[1,0,0]},{id:"b",h:1,t:2.4,tally:2,col:[2,0,0]},
  {id:"c",h:2,t:1.6,tally:1,col:[0,1,0]},{id:"d",h:2,t:3.8,tally:3,col:[2,2,0]},{id:"e",h:2,t:5,tally:4,col:[2,3,0]},
  {id:"f",h:3,t:3,tally:1,col:[0,0,1]},{id:"g",h:3,t:4.6,tally:2,col:[0,0,2]},{id:"i",h:3,t:6.6,tally:5,col:[2,3,3]},{id:"j",h:3,t:7.6,tally:6,col:[2,3,4]},
  {id:"l",h:1,t:9,tally:7,col:[3,3,4]}];
const MSLIPS=[["b","d"],["e","i"],["j","l"]];

/* ---------- the ideas, book by book ----------
   k: the short name on the ring; t: the title; p: on the island; m: in the machine room; a: where the book tells it */
const IDEAS={
arche:[
 {k:"The quicker legs",t:"The quicker legs win",a:"gate",
  p:["House 3 has grain for one buyer and will fill whichever request was placed first. Judging by whose slip reaches the gate first rewards the quicker messenger, and comparing hours written on slips compares two water-clocks that were never set together."],
  m:"Arrival order, and readings from clocks that drift apart, cannot say which of two events on different machines happened first."},
 {k:"What led to what",t:"What could have led to what",a:"before",
  p:["The houses trade the question nobody can answer for one every house can: could one entry have led to another? It did if it stands higher on the same scroll, if it sent the slip the other received, or through a chain of such steps.","Entries with no chain of slips between them, like the two circled, are unrelated, in whichever order the sun saw them."],
  m:"Lamport's happened-before relation: order within one machine, a send before its receipt, and chains of the two. Events it does not connect are concurrent."},
 {k:"The tally",t:"The tally",a:"tallysec",
  p:["Each counting room keeps a rising number. Every entry raises it, every slip carries it, and a house that receives a slip jumps past the number on it. Along any chain the tallies rise, so a cause always carries a smaller tally than its effect.","The reverse fails: the circled entries are unrelated, yet the later one by the sun carries the smaller tally."],
  m:"A Lamport logical clock. If one event happened before another it has the smaller timestamp, but a smaller timestamp does not show that two events are related."},
 {k:"Precedence",t:"Precedence",a:"ties",
  p:["To fill requests in one agreed sequence, every house sorts entries by the rule of precedence: the smaller tally first, and on a tie the lower house number. The number in each dot is its place in that sequence.","Every house computes the same sequence from the same entries, and it never puts an effect before its cause."],
  m:"Ordering by timestamp, then by process number, gives a total order that every machine computes alike and that respects cause and effect."},
 {k:"The storehouse",t:"One storehouse, no gatekeeper",a:"storesec",
  p:["Only one house may load at the common storehouse at a time, and nobody keeps the door. Each house sends its request to the others, keeps a waiting list in precedence, and answers every request it receives.","A house may enter only when its request stands first on its own list and it has heard a higher tally from every other house; when done, it sends a release. Since no messenger passes another, an earlier request is always on the list in time."],
  m:"Mutual exclusion with no coordinator, built from logical clocks and channels that deliver in order: request, acknowledge, release."},
 {k:"The column",t:"One number for each house",a:"column",
  p:["A single tally forgets whose news it carried, so each house keeps a column of three counts, one for each house. Count your own entries, send the whole column with every slip, and on receiving keep the larger of each row.","One entry came before another exactly when its column is nowhere larger. The circled pair are each larger in a different row, so they are unrelated."],
  m:"Vector clocks, from Fidge and Mattern: one event happened before another exactly when its vector is no larger in any entry; otherwise the two are concurrent."},
 {k:"The goatherd",t:"What no slip carries",a:"mountain",
  p:["A goatherd who scrambles over the mountain carries news that no slip records. A sale at House 3 can then cause a request at House 1 that carries the smaller tally.","Neither tally nor column can see a path that never went by slip. Only clocks kept in step with the sun could, and on cloudy Arche nobody can keep them so."],
  m:"Logical and vector clocks see only the messages inside the system. Matching causes that travel outside it needs physical clocks kept closely in step."}
],
paxos:[
 {k:"Two requirements",t:"Consistency, and progress",a:"law",
  p:["No two scrolls may ever hold different decrees under the same number. And if a majority stays in the Chamber long enough, with nobody coming or going, every decree proposed there must pass.","Wandering is the danger: a group that passes decree 37 and leaves for a banquet leaves a second group that knows nothing of it."],
  m:"Safety always: the logs never disagree. Progress only when a majority of machines is up and steady for long enough."},
 {k:"Shared member",t:"Any two majorities share a member",a:"majorities",
  p:["However the legislators wander, two majorities of the same Parliament can never be made of entirely different people.","The legislator who sits in both carries what the first majority decided into the second, even after everyone else from the first has gone."],
  m:"Quorum intersection: any two majorities of the machines share at least one, which carries forward what the earlier majority accepted."},
 {k:"Ballot rules",t:"The three rules of the ballot",a:"synod",
  p:["The priests of the Synod choose one decree by ballots. Every ballot has its own number, its quorum is a majority, and if anyone in the quorum has voted before, the ballot must be for the decree of the latest of those votes.","Here Γ last voted for β in ballot 5 and Δ for α in ballot 2, so ballot 27 must be for β."],
  m:"Unique ballot numbers, majority quorums, and a proposer bound to the value of the highest-numbered vote its quorum reports."},
 {k:"One ballot",t:"One ballot, step by step",a:"ballot",
  p:["Α asks the quorum for the latest vote each has cast and a promise never to vote in a lower ballot. Each writes the promise in ink and answers. Α proposes the decree the third rule allows, each member votes unless they have promised higher, and once every member has voted Α writes the decree down and tells everyone.","A lost messenger or a vanished priest only leaves a step undone, and a step done twice changes nothing."],
  m:"Two round trips, prepare and promise, then accept and accepted, followed by announcing the chosen value. Lost or repeated messages cannot break safety."},
 {k:"Rival presidents",t:"Two would-be presidents",a:"progress",
  p:["Each new ballot makes its quorum promise never to vote in a lower one, so two priests who keep starting higher ballots doom each other's, and nothing passes.","One president who alone starts ballots cures it. Two presidents at once only slow things down, because consistency never depended on who starts ballots."],
  m:"Duelling proposers can stall Paxos for ever; a single leader restores progress, while safety never relied on there being one."},
 {k:"A Synod per number",t:"A separate Synod for every number",a:"parliament",
  p:["Parliament runs one small Synod for each decree number, all under one president. A new president asks the opening question once, for every number still open, and each legislator answers once. Where an answer reports a vote for a number, the third rule binds the president to it; a number nobody has voted for is filled with a decree that changes nothing.","Here 126 is already in a scroll and 125 is a gap, filled with an olive day. From then on each new decree takes one ask, one vote and one announcement."],
  m:"Multi-Paxos: one prepare phase covers every open slot, gaps are filled with no-ops, and each further command costs one round trip from a stable leader."},
 {k:"Years of practice",t:"Governing asked for more",a:"grew",
  p:["Years of running the island added four habits. Every office runs for a fixed term, so it has one holder at a time. A question about the law never gets an older answer than an earlier question did.","Scrolls are folded down to the law as it stands with the number of its last decree, and legislators are added and removed by decree, through the same ballots."],
  m:"Leases, reads that never go back in time, snapshots of the state, and changes of membership made through the log itself."}
],
schedia:[
 {k:"The podium",t:"The podium",a:"podium",
  p:["One legislator at a time holds the podium. The holder writes each line, gives it the next number and hands it to the runners, one for each bench, who bring the lines in order and never skip one.","The benches copy what they are sent and nothing else, so a bench that holds line 12 holds lines 1 to 11 as well."],
  m:"One primary orders every operation and sends them to the backups in order."},
 {k:"Three hold it",t:"Passed means three hold it",a:"passes",
  p:["A line passes once a majority holds it and every line before it: the holder and two others. Only then does the holder tell the petitioner that the petition is law.","Lines no majority holds yet are drafts. A change of holder may lose one, and that harms nobody, because nobody was told it was law."],
  m:"An operation commits once a majority of replicas hold it, and only then is the client answered."},
 {k:"Board and line",t:"Board and line",a:"board",
  p:["Every spell at the podium gets a board, a count and the name of whoever raised it, ordered by count and then by name. A line is known by its board and its line.","Board 6, line 40 may hold far more lines than board 7, line 1, and it is still the older copy. Every board opens with the whole law as its holder has it, so a later mark holds everything that passed before it."],
  m:"A viewstamp pairs the view number with the position in the view, compared view first. Each new view starts from everything committed before it."},
 {k:"A new holder",t:"Who takes the podium",a:"takes",
  p:["When the roll goes unanswered, a caller raises a board higher than any they have seen and invites everyone. Once a majority has answered with their latest board and line, the answer showing the latest takes the podium and opens the board by sending the whole law.","Every passed line is held by three, and any two threes share a legislator, so nothing that passed is lost."],
  m:"A view change: collect a majority of viewstamps; the replica with the latest becomes primary and starts the view by sending its whole state."},
 {k:"Lost tablets",t:"When tablets are lost",a:"lost",
  p:["A legislator back from home has smooth wax and answers with only a board. A majority of answers is then not enough. The board may form only if a majority still has tablets, or the lost tablets were older than the latest shown, or the old holder still has theirs.","Here none holds, so the caller waits until Liskovia or Kleon is back."],
  m:"A replica that crashes loses its state. Extra conditions stop a view forming on answers that cannot show everything that was committed."},
 {k:"The porch",t:"The holder who has not noticed",a:"porch",
  p:["Okios steps onto the porch and misses the change: inside, a majority has raised board 7 and Liskovia holds the podium. Okios still believes board 6 is his and may go on writing lines.","Passing needs three, and a majority has already moved on, so nothing he writes can pass."],
  m:"A primary cut off from the rest can keep taking requests but cannot commit any, because it can no longer reach a majority."},
 {k:"Wax and ink",t:"Wax, not ink",a:"wax",
  p:["Schedia's wax is quick, but going home smooths it. If a majority go home on the same night, the council can stop for good: lost tablets can stop it for ever, but never let a board start without a law that passed.","Across the bay the Parliament's ink survives any absence, while any legislator may start a ballot. Both halls rest on one fact: any two majorities share a legislator."],
  m:"Viewstamped Replication keeps its state in memory and can stop for good if a majority crash at once; Paxos writes to lasting storage. Both rely on overlapping majorities, and were found independently."}
]};

/* ---------- animation ----------
   A figure marks its parts with the step they appear at, and play() shows them in turn: a slip draws itself along,
   anything else fades in. A.at(k,fn) runs fn at step k, and the next step waits for any promise it returns.
   A.hint(s) is the line under the picture that says what the reader can do with it; A.again() draws it afresh. */
const STEP=650;
function Anim(){
  const steps={},get=k=>steps[k]=steps[k]||{els:[],fns:[]},A={hintText:"",
    step(k,...els){els.flat().forEach(e=>{if(e)get(k).els.push(e)});return els[0]},
    at(k,fn){get(k).fns.push(fn)},
    hint(s){A.hintText=s},
    async play(){const id=++Anim.run,keys=Object.keys(steps).map(Number).sort((a,b)=>a-b);
      keys.forEach(k=>steps[k].els.forEach(hideEl));
      for(const k of keys){if(id!==Anim.run)return;steps[k].els.forEach(showEl);await Promise.all([sleep(STEP),...steps[k].fns.map(f=>f(id))])}}};
  return A;
}
Anim.run=0;
const live=id=>id===Anim.run;
const drawn=e=>e.tagName==="path"&&e.classList.contains("st-slip")&&!e.classList.contains("lost");
function hideEl(e){e.style.transition="none";
  if(drawn(e)){const L=e.getTotalLength();e._m=e.getAttribute("marker-end");e.removeAttribute("marker-end");e.style.strokeDasharray=L;e.style.strokeDashoffset=L}
  else e.style.opacity=0}
function showEl(e){void e.getBoundingClientRect();const t=reduce?0:1;
  if(drawn(e)){e.style.transition=`stroke-dashoffset ${.6*t}s ease`;e.style.strokeDashoffset=0;
    setTimeout(()=>{if(e._m)e.setAttribute("marker-end",e._m);e.style.strokeDasharray="";e.style.strokeDashoffset=""},600*t)}
  else{e.style.transition=`opacity ${.4*t}s`;e.style.opacity=1}}
const mv=(g,[x,y])=>g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`);
const trip=(g,path,ms)=>tween(ms,u=>mv(g,path(u)));
const line=([x1,y1],[x2,y2])=>u=>[x1+(x2-x1)*u,y1+(y2-y1)*u];
function pick(g,label,fn){g.classList.add("pick");button(g,label,fn)}
const FS={};   // what the reader has changed in the figure on show; cleared when another idea is chosen

/* one morning on Arche, drawn in the round; in every mode but precedence the reader can compare two entries */
const MEV=Object.fromEntries(MORN.map(e=>[e.id,e]));
const MNEXT=(()=>{const n={};MORN.forEach(e=>n[e.id]=[]);
  [1,2,3].forEach(h=>{const own=MORN.filter(e=>e.h===h).sort((a,b)=>a.t-b.t);own.slice(1).forEach((e,i)=>n[own[i].id].push(e.id))});
  MSLIPS.forEach(([s,r])=>n[s].push(r));return n})();
/* a chain from a to b, along a house's own scroll or by a slip, or null */
function mpath(a,b){const prev={[a]:null},q=[a];while(q.length){const x=q.shift();if(x===b){const p=[];for(let y=b;y;y=prev[y])p.unshift(y);return p}
  for(const y of MNEXT[x])if(!(y in prev)){prev[y]=x;q.push(y)}}return null}
function Morning(svg,A,mode){
  const P=Polar(svg,{vb:"0 0 620 596",cx:310,cy:350,r0:44,step:30,rings:9,tEnd:9.5,note:[14,24],
    nodes:{1:[-90,"H1",HC[1]],2:[30,"H2",HC[2]],3:[150,"H3",HC[3]]}});
  const rank=[...MORN].sort((x,y)=>x.tally-y.tally||x.h-y.h).map(e=>e.id),
    order=mode==="rank"?rank:[...MORN].sort((x,y)=>x.t-y.t).map(e=>e.id),slipTo={},G={};
  MSLIPS.forEach(([s,r])=>slipTo[r]=P.slip(MEV[s].h,MEV[s].t,MEV[r].h,MEV[r].t));
  order.forEach((id,k)=>{const e=MEV[id],g=P.event(e.h,e.t,HC[e.h],13);G[id]=g;A.step(k,g,slipTo[id]);
    if(mode==="tally")g.label.textContent=e.tally;
    if(mode==="rank")g.label.textContent=k+1;
    if(mode==="rank"||mode==="column"){const own=MORN.filter(q=>q.h===e.h),a=(e.h===1?-90:e.h===2?30:150)+(own.indexOf(e)%2?-90:90),[x,y]=P.pt(e.h,e.t),r=mode==="column"?46:38;
      A.step(k,tag(P.over,x+r*Math.cos(a*Math.PI/180),y+r*Math.sin(a*Math.PI/180),mode==="column"?e.col.join(" · "):e.tally+" · H"+e.h))}});
  if(mode==="rank"){A.hint("The entries light up in precedence order: smaller tally first, then the lower house.");return P}
  const say1=txt(P.over,310,556,"","lab ink"),say2=txt(P.over,310,577,"","lab sm");let segs=[],sel=[];
  const clear=()=>{segs.forEach(x=>x.remove());segs=[];Object.values(slipTo).forEach(x=>x.classList.remove("hi"));Object.values(G).forEach(g=>g.classList.remove("sel"))};
  function compare(a,b){clear();sel=[a,b];G[a].classList.add("sel");G[b].classList.add("sel");
    let p=mpath(a,b);if(!p&&(p=mpath(b,a)))[a,b]=[b,a];
    const x=MEV[a],y=MEV[b];
    if(p){for(let i=0;i+1<p.length;i++){const u=MEV[p[i]],v=MEV[p[i+1]];if(u.h===v.h){const sg=P.seg(u.h,u.t,v.t);sg.classList.add("hi");segs.push(sg)}else slipTo[v.id].classList.add("hi")}
      say1.textContent="Came before";
      say2.textContent=mode==="tally"?`a chain of slips joins them, and the tally rises from ${x.tally} to ${y.tally}`:mode==="column"?`its column ${x.col.join(" · ")} is nowhere larger than ${y.col.join(" · ")}`:"a chain of slips joins them"}
    else{say1.textContent="Unrelated";
      say2.textContent=mode==="tally"?`no chain of slips joins them, yet the tallies are ${x.tally} and ${y.tally}`:mode==="column"?`${x.col.join(" · ")} and ${y.col.join(" · ")}: each is larger in some row`:"no chain of slips joins them"}}
  Object.entries(G).forEach(([id,g])=>pick(g,`House ${MEV[id].h}'s entry`,()=>{
    if(sel.length!==1){clear();sel=[id];g.classList.add("sel");say1.textContent="";say2.textContent="now choose a second entry"}else if(sel[0]!==id)compare(sel[0],id)}));
  A.hint("Click any two entries to see whether one came before the other.");
  if(mode!=="column")A.at(order.length,()=>compare("a","l"));
  A.at(order.length+(mode==="column"?0:2),()=>compare("d","g"));
  return P;
}

/* Schedia's rule for when a board may form, from the book: with tablets, without, or no answer */
const HELD5={O:12,L:12,K:12,M:10,T:10},KS5=["O","L","K","M","T"];
function mayForm(ans){const w=KS5.filter(k=>ans[k]==="with"),x=KS5.filter(k=>ans[k]==="without");
  const maj=w.length+x.length>=3,forms=maj&&(w.length>=3||(x.length>0&&ans.O==="with"));
  let holder=null;if(forms){const top=Math.max(...w.map(k=>HELD5[k])),best=w.filter(k=>HELD5[k]===top);holder=best.includes("O")?"O":best[0]}
  return {maj,forms,holder,w,x}}

const FIGS={
arche:[
 /* the gate: two messengers race, and the reader chooses who has the quicker legs */
 function(svg,A){const I=Isle(svg);FS.quick=FS.quick||1;
   const m1=token(I.over,0,0,HC[1],"✉"),m2=token(I.over,0,0,HC[2],"✉"),q2=I.house[2],q1=I.house[1],q3=I.house[3];
   const w2=tag(I.over,q2.x,q2.y-38,"H2 writes first"),w1=tag(I.over,q1.x+92,q1.y,"H1 writes second");tag(I.over,q3.x,q3.y+38,"the gate");
   const r1=txt(I.over,235,258,"","lab red sm"),r2=txt(I.over,235,276,"","lab sm");
   mv(m1,I.road(1,3,.08));mv(m2,I.road(2,3,.08));
   const ms=h=>h===FS.quick?1500:3200;
   async function race(){r1.textContent=r2.textContent="";mv(m1,I.road(1,3,.08));mv(m2,I.road(2,3,.08));w1.style.opacity=0;
     const p2=trip(m2,u=>I.road(2,3,.08+.8*u),ms(2));await sleep(700);w1.style.opacity=1;
     const p1=trip(m1,u=>I.road(1,3,.08+.8*u),ms(1));
     const first=await Promise.race([p1.then(()=>1),p2.then(()=>2)]);
     r1.textContent=`H${first}'s slip arrives first`;r2.textContent=first===1?"though H2 wrote first":"only because its legs were quicker";await Promise.all([p1,p2])}
   pick(m1,"Give House 1's messenger the quicker legs",()=>{FS.quick=1;race()});pick(m2,"Give House 2's messenger the quicker legs",()=>{FS.quick=2;race()});
   A.step(0,w2);A.at(0,race);A.hint("Click a messenger to give it the quicker legs, and the race is run again.")},
 function(svg,A){Morning(svg,A,"before")},
 function(svg,A){Morning(svg,A,"tally")},
 function(svg,A){Morning(svg,A,"rank")},
 /* the storehouse: requests, replies, entry and release, run through once */
 function(svg,A){const I=Isle(svg),[sx,sy]=I.at(90,I.R);
   el("rect",{x:sx-38,y:sy-20,width:76,height:40,rx:4,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3},I.under);
   txt(I.over,sx,sy+40,"the storehouse","lab sm");
   const L={};for(const h of [1,2,3]){const q=I.house[h],g=el("g",{transform:`translate(${q.x+(h===1?0:h===2?-12:12)} ${q.y+(h===1?62:-66)})`},I.over);
     el("rect",{x:-44,y:-24,width:88,height:48,rx:4,fill:"#fffaf0",stroke:"#1c1512","stroke-width":2},g);L[h]=[txt(g,0,-5,"","lab ink sm"),txt(g,0,14,"","lab sm")]}
   const list=(h,rows)=>L[h].forEach((t,i)=>t.textContent=rows[i]?`${i+1}. ${rows[i]}`:"");
   const s1=txt(I.over,235,250,"","lab sm"),s2=txt(I.over,235,268,"","lab sm"),say=(a,b="")=>{s1.textContent=a;s2.textContent=b};
   const h1=token(I.over,0,0,HC[1],"1"),h3=token(I.over,0,0,HC[3],"3"),home1=[I.house[1].x,I.house[1].y+28];mv(h1,home1);mv(h3,[I.house[3].x+30,I.house[3].y]);
   const send=(glyph,a,b,ms=1700)=>{const g=token(I.over,0,0,"#fffaf0",glyph);return trip(g,u=>I.road(a,b,u),ms).then(()=>g.remove())};
   const along=(g,a0,a1,ms)=>trip(g,u=>I.at(a0+(a1-a0)*u),ms);
   A.at(0,async id=>{[1,2,3].forEach(h=>list(h,[]));
     say("H1 and H3 ask at once,","both under tally 2");list(1,["H1 · 2"]);list(3,["H3 · 2"]);
     await Promise.all([send("✉",1,2),send("✉",1,3),send("✉",3,1),send("✉",3,2)]);if(!live(id))return;
     [1,2,3].forEach(h=>list(h,["H1 · 2","H3 · 2"]));say("a tie goes to the lower house:","every list reads the same");await sleep(1200);if(!live(id))return;
     say("every request is answered,","with a higher tally");
     await Promise.all([send("✓",2,1,1400),send("✓",2,3,1400),send("✓",3,1,1400),send("✓",1,3,1400)]);if(!live(id))return;
     say("H1 is first on its list and has","heard from both: it enters");await along(h1,-90,90,1600);if(!live(id))return;
     say("H3 has heard from both too,","but stands second: it waits");await sleep(1300);if(!live(id))return;
     say("H1 sends a release,","and every list crosses it off");
     const back=along(h1,90,-90,1600);await Promise.all([send("↩",1,2,1300),send("↩",1,3,1300)]);[1,2,3].forEach(h=>list(h,["H3 · 2"]));await back;mv(h1,home1);if(!live(id))return;
     say("now H3 stands first,","and enters");await along(h3,150,90,1100)})},
 function(svg,A){Morning(svg,A,"column")},
 /* the goatherd beats the slip over the mountain */
 function(svg,A){const I=Isle(svg),q1=I.house[1],q3=I.house[3],p0=[q3.x+20,q3.y-12],c=[300,250],p2=[q1.x+4,q1.y+22],
     bz=t=>[0,1].map(k=>(1-t)*(1-t)*p0[k]+2*t*(1-t)*c[k]+t*t*p2[k]);
   A.step(0,el("path",{d:`M${p0} Q${c} ${p2}`,fill:"none",stroke:"#bf4a26","stroke-width":3,"stroke-dasharray":"7 6"},I.under));
   A.step(0,tag(I.over,q3.x+8,q3.y+38,"sale · tally 9"));A.step(2,tag(I.over,q1.x+92,q1.y+4,"request · tally 3","red"));
   const gt=token(I.over,...p0,"#d9cfb4","g"),st=token(I.over,...I.road(3,1,0),HC[3],"✉"),gl=tag(I.over,0,0,"the goatherd","red"),sl=tag(I.over,0,0,"slip, by the road");
   const s1=txt(I.over,235,346,"","lab sm"),s2=txt(I.over,235,364,"","lab sm");
   A.at(1,async id=>{const pg=trip(gt,bz,1500),ps=trip(st,u=>I.road(3,1,.9*u),4200);tween(1500,u=>mv(gl,bz(u).map((v,k)=>v+(k?28:6)))).then(()=>gl.remove());
     tween(4200,u=>{const [x,y]=I.road(3,1,.9*u);mv(sl,[x+80,y+4])}).then(()=>sl.remove());
     await pg;if(!live(id))return;s1.textContent="the request comes from the sale,";s2.textContent="yet carries the smaller tally";await ps});
   A.hint("A goatherd's news travels outside every slip, so no tally or column can see it.")}
],
paxos:[
 /* a group passes decree 37 and leaves; the reader sends legislators in and out */
 function(svg,A){const ks=["A","B","G","D","E","Z"],H=Room(svg,{seats:chamberSeats(ks,[215,270,325,20,70,160])}),out=new Set(["D","E","Z"]),N={};
   ks.forEach(k=>N[k]=H.note(k,out.has(k)?"away":"passes 37"));
   txt(H.over,H.cx,H.cy-14,"decree 37","lab ink");const c=txt(H.over,H.cx,H.cy+8,"","lab sm");A.step(2,txt(H.over,H.cx,H.cy+30,"must not be passed twice","lab red sm"));
   const paint=()=>{ks.forEach(k=>H.S[k].g.classList.toggle("out",out.has(k)));const n=6-out.size;c.textContent=`${n} of 6 here: ${n>=4?"a majority":"not a majority"}`};paint();
   A.step(0,ks.map(k=>N[k]));
   A.at(1,()=>{["A","B","G"].forEach(k=>{out.add(k);N[k].set("37 written, away","")});["D","E","Z"].forEach(k=>{out.delete(k);N[k].set("37: knows nothing","red")});paint()});
   ks.forEach(k=>pick(H.S[k].g,`Send ${PG[k]} out, or call them back`,()=>{out.has(k)?out.delete(k):out.add(k);paint()}));
   A.hint("Click a legislator to send them out or call them back.")},
 /* two majorities, drawn afresh at random whenever the reader asks */
 function(svg,A){const ks=["A","B","G","D","E","Z","H"],ang=ks.map((_,i)=>-90+i*360/7+11.5),H=Room(svg,{seats:chamberSeats(ks,ang)}),R=el("g",{},H.under),T=el("g",{},H.over);
   txt(H.over,H.cx,H.cy-20,"first majority","lab ink",{style:"fill:#136f9e"});txt(H.over,H.cx,H.cy+4,"second majority","lab ink",{style:"fill:#5f6e28"});const c=txt(H.over,H.cx,H.cy+28,"","lab sm");
   FS.maj=FS.maj||[["A","B","G","D"],["D","E","Z","H"]];
   const ring=(k,r,col)=>{const q=H.S[k];return el("circle",{cx:q.x,cy:q.y,r,fill:"none",stroke:col,"stroke-width":5},R)};
   async function show(){const id=Anim.run,[m1,m2]=FS.maj;R.innerHTML="";T.innerHTML="";c.textContent="";
     m1.forEach(k=>ring(k,31,"#136f9e"));await sleep(500);if(!live(id))return;m2.forEach(k=>ring(k,37,"#5f6e28"));await sleep(500);if(!live(id))return;
     const both=m1.filter(k=>m2.includes(k));both.forEach(k=>{ring(k,43,"#e0b84a");const q=H.S[k],dx=q.x-H.cx,dy=q.y-H.cy,n=Math.hypot(dx,dy);tag(T,q.x+dx/n*66,q.y+dy/n*66,"in both","hot")});
     c.textContent=`${both.length} sit${both.length===1?"s":""} in both`}
   const shuffle=()=>{const r=()=>[...ks].sort(()=>Math.random()-.5).slice(0,4);FS.maj=[r(),r()];show()};
   ks.forEach(k=>pick(H.S[k].g,"Gather two new majorities",shuffle));
   A.at(0,show);A.hint("Click any legislator to gather two new majorities at random. They always share someone.")},
 /* the quorum of ballot 27, which the reader may choose */
 function(svg,A){const ks=["A","B","G","D","E"],LAST={A:null,B:[14,"α"],G:[5,"β"],D:[2,"α"],E:[14,"α"]},H=Room(svg,{seats:chamberSeats(ks,[200,270,340,40,140])}),RG={},N={};
   FS.q=FS.q||["A","G","D"];
   ks.forEach(k=>{const q=H.S[k];RG[k]=el("circle",{cx:q.x,cy:q.y,r:31,fill:"none",stroke:"#e0b84a","stroke-width":6},H.under);N[k]=H.note(k,LAST[k]?`voted ${LAST[k][1]} in ${LAST[k][0]}`:"never voted","",58)});
   const b=txt(H.over,H.cx,H.cy-10,"ballot 27","lab ink",{style:"font-size:22px"}),r1=txt(H.over,H.cx,H.cy+16,"","lab red"),r2=txt(H.over,H.cx,H.cy+36,"","lab sm");
   function paint(){ks.forEach(k=>{RG[k].style.opacity=FS.q.includes(k)?1:0;N[k].set(N[k].querySelector("text").textContent,"")});
     if(FS.q.length<3){r1.textContent="";r2.textContent="choose a quorum of three";return}
     const v=FS.q.filter(k=>LAST[k]).sort((x,y)=>LAST[y][0]-LAST[x][0])[0];
     if(v){r1.textContent=`must be for ${LAST[v][1]}`;r2.textContent=`${PG[v]}'s vote in ballot ${LAST[v][0]} is the latest`;N[v].set(N[v].querySelector("text").textContent,"hot")}
     else{r1.textContent="free to choose";r2.textContent="nobody in the quorum has voted"}}
   ks.forEach(k=>pick(H.S[k].g,`Put ${PG[k]} in the quorum or take them out`,()=>{const q=FS.q;q.includes(k)?q.splice(q.indexOf(k),1):(q.push(k),q.length>3&&q.shift());paint()}));
   paint();A.step(0,ks.map(k=>RG[k]).filter(e=>FS.q.length&&e.style.opacity==="1"));ks.forEach((k,i)=>A.step(1+i,N[k]));A.step(6,b);A.step(7,r1,r2);
   A.hint("Click legislators to choose another quorum of three: the latest vote among them decides the decree.")},
 /* one ballot, phase by phase; the reader may send Γ out before the vote */
 function(svg,A){const gone=!!FS.gone,P=Polar(svg,{vb:"0 0 560 560",cx:280,cy:290,r0:58,step:25,rings:8,tEnd:8.2,note:[10,22],
     nodes:{A:[-90,"Α",PC.A],G:[-18,"Γ",PC.G],B:[54,"Β",PC.B],E:[126,"Ε",PC.E],D:[198,"Δ",PC.D]}});
   const ph=(k,s,t,side,cls="")=>{const [x,y]=P.pt("A",t);A.step(k,tag(P.over,x+side,y,s,cls))};
   A.step(0,P.event("A",.9,PC.A,9));["G","D"].forEach(k=>A.step(0,P.slip("A",.9,k,1.9)));ph(0,"1 · ask",.9,-58);
   ["G","D"].forEach(k=>A.step(1,P.slip(k,2.1,"A",3.1)));ph(1,"2 · promise",3.1,58);
   A.step(2,P.event("A",3.4,PC.A,9));["G","D"].forEach(k=>A.step(2,P.slip("A",3.4,k,4.4)));ph(2,"3 · propose",3.4,-58);
   A.step(3,P.slip("D",4.6,"A",5.6));A.step(3,gone?lostSlip(P,"G",4.6,"A",5.6,.5):P.slip("G",4.6,"A",5.6));ph(3,gone?"4 · Γ walked out":"4 · vote",5.6,58,gone?"red":"");
   if(gone)ph(4,"no decree yet: a step left undone",6.2,-50,"red");
   else{A.step(4,P.event("A",6,"#bf4a26",11));["B","G","D","E"].forEach(k=>A.step(4,P.slip("A",6,k,7)));ph(4,"5 · β chosen, tell all",6,-88,"hot")}
   const nd=$$(".st-node",svg)[1];pick(nd,gone?"Bring Γ back":"Send Γ out before the vote",()=>{FS.gone=!gone;A.again()});
   A.hint(gone?"Γ walked out, so the ballot waits; nothing goes wrong. Click Γ to bring them back.":"Click Γ to send them out before they vote.")},
 /* rival presidents; the reader may leave Α the only one */
 function(svg,A){const one=!!FS.one,P=Polar(svg,{vb:"0 0 560 560",cx:280,cy:300,r0:48,step:34,rings:6,tEnd:6.2,note:[10,22],
     nodes:{A:[150,"Α",PC.A],G:[-90,"Γ",PC.G],E:[30,"Ε",PC.E]}});
   const s=(k,a,ta,b,tb,label,cls,at)=>{const p=slip(P,a,ta,b,tb);A.step(k,p);if(label)A.step(k,slipTag(P,p,label,cls,at));return p};
   const x=(k,t,dx)=>{const [cx,cy]=P.pt("G",t);A.step(k,cross(P.over,cx+dx,cy))};
   if(!one){s(0,"A",.6,"G",1.6,"ask 27");s(1,"G",1.8,"A",2.8);s(2,"E",2,"G",3,"ask 28","",.62);s(3,"G",3.2,"E",4.2);
     s(4,"A",3.1,"G",4.1,"vote 27?","red",.3);x(4,4.1,-16);s(5,"A",4.4,"G",5.4,"ask 29","",.72);s(6,"E",4.6,"G",5.6,"vote 28?","red",.3);x(6,5.6,16);
     A.step(7,txt(P.over,280,552,"each ask dooms the other's ballot","lab sm"))}
   else{s(0,"A",.6,"G",1.6,"ask 27");s(1,"G",1.8,"A",2.8);s(2,"A",3,"G",4,"vote 27");s(3,"G",4.2,"A",5.2);A.step(4,P.event("A",5.4,"#bf4a26",11));
     const [ax,ay]=P.pt("A",5.4);A.step(4,tag(P.over,ax-10,ay+30,"27 passes","hot"));A.step(4,txt(P.over,280,552,"one president: the ballot runs undisturbed","lab sm"))}
   const nd=$$(".st-node",svg)[2];if(one)nd.style.opacity=.4;
   pick(nd,one?"Let Ε start ballots again":"Stop Ε starting ballots",()=>{FS.one=!one;A.again()});
   A.hint(one?"Only Α starts ballots now, and ballot 27 passes. Click Ε to let it compete again.":"Click Ε to stop it starting ballots, leaving Α the only president.")},
 /* a new president's scroll, filled in order */
 function(svg,A){const H=Room(svg,{seats:chamberSeats(["D","A","B","G","E"],[-90,-30,60,120,210]),ring:["D"]}),fill={k:"#d9cfb4",v:"#bfd6e6",o:"#e0b84a",n:"#fffaf0"};
   const q=H.S.D;A.step(1,["A","B","G","E"].map(k=>el("line",{x1:q.x,y1:q.y,x2:H.S[k].x,y2:H.S[k].y,stroke:"#6b5a48","stroke-width":2,"stroke-dasharray":"4 5"},H.under)));
   A.step(1,txt(H.over,H.cx,182,"one question, for every open number","lab sm"));
   const slot=(n,c,i)=>{const g=el("g",{class:"slot",transform:`translate(${H.cx-114+i*38} 238)`},H.over);el("rect",{x:-16,y:-16,width:32,height:32,rx:3,fill:fill[c],"stroke-dasharray":c==="n"?"4 3":"none"},g);el("text",{},g).textContent=n;return g};
   txt(H.over,H.cx,206,"the president's scroll","lab sm");
   A.step(0,[0,1,2].map(i=>slot(122+i,"k",i)),txt(H.over,H.cx-76,274,"known","lab sm"));
   A.step(2,slot(126,"v",4),txt(H.over,H.cx+38,274,"in a scroll","lab sm"));
   A.step(3,slot(125,"o",3),txt(H.over,H.cx,292,"olive day","lab sm"));
   A.step(4,slot(127,"n",5));A.step(5,slot(128,"n",6),txt(H.over,H.cx+95,292,"new","lab sm"));
   A.hint("The scroll fills in order: what everyone knows, what the answers bring back, the gap, then new decrees.")},
 /* four habits; each quarter lights under the pointer */
 function(svg,A){svg.innerHTML="";svg.setAttribute("viewBox","0 0 440 440");const cx=220,cy=220,r=200;
   el("circle",{cx,cy,r:204,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
   [[-1,-1,"One office,","one holder","fixed terms"],[1,-1,"Never an","older law","answers never go back"],[1,1,"Members","by decree","the same ballots"],[-1,1,"Fold the","scroll","the law as it stands"]].forEach(([sx,sy,a,b,c],i)=>{
     const g=el("g",{class:"quad"},svg),a0=-180+i*90,p=d=>[cx+r*Math.cos(d*Math.PI/180),cy+r*Math.sin(d*Math.PI/180)],[x0,y0]=p(a0),[x1,y1]=p(a0+90);
     el("path",{d:`M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`,fill:"#efe6cf"},g);
     const x=cx+sx*96,y=cy+sy*84;txt(g,x,y-14,a,"lab ink");txt(g,x,y+8,b,"lab ink");txt(g,x,y+32,c,"lab sm");A.step(i,g)});
   el("path",{d:`M${cx},18 V422 M18,${cy} H422`,stroke:"#b5602c","stroke-width":3,"stroke-dasharray":"3 8","pointer-events":"none"},svg);
   el("circle",{cx,cy,r:30,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3},svg)}
],
schedia:[
 /* the podium sends each line out by runner; the reader writes the next */
 function(svg,A){const H=Room(svg,{porch:true,podium:"board 6",podiumFill:WHO.O.c,seats:tholosSeats(),ring:["O"]}),N={},B=["L","K","M","T"];FS.line=FS.line||12;let busy=false;
   B.forEach(k=>{const q=H.S[k];el("line",{x1:H.cx,y1:H.cy,x2:q.x,y2:q.y,stroke:"#6b5a48","stroke-width":2,"stroke-dasharray":"4 5"},H.under);N[k]=H.note(k,`holds line ${FS.line}`)});
   N.O=H.note("O",`wrote line ${FS.line}`,"hot");
   async function write(){if(busy)return;busy=true;const n=++FS.line;N.O.set(`writes line ${n}`,"hot");
     await Promise.all(B.map(k=>{const g=token(H.over,H.cx,H.cy,"#fffaf0",String(n)),q=H.S[k];return trip(g,line([H.cx,H.cy],[q.x,q.y]),1000+rnd(1600)).then(()=>{g.remove();N[k].set(`holds line ${n}`)})}));busy=false}
   pick(H.pod,"Write the next line",write);A.step(0,[N.O,...B.map(k=>N[k])]);A.at(1,write);
   A.hint("Click the podium to write the next line and send it out.")},
 /* a line passes on the second word back; the reader steps benches out and writes more lines */
 function(svg,A){FS.out=FS.out||["T"];FS.held=FS.held||{O:12,L:12,K:12,M:12,T:10};const H=Room(svg,{porch:true,podium:"board 6",podiumFill:WHO.O.c,seats:tholosSeats(),ring:["O"]}),N={};let busy=false;
   const r1=txt(H.over,H.cx,H.cy+62,"","lab ink sm"),r2=txt(H.over,H.cx,H.cy+80,"","lab sm");
   const note=k=>FS.out.includes(k)?"stepped out":`to line ${FS.held[k]}`;
   KS5.forEach(k=>{N[k]=H.note(k,note(k));H.S[k].g.classList.toggle("out",FS.out.includes(k))});
   async function write(){if(busy)return;busy=true;const n=FS.held.O+1;FS.held.O=n;N.O.set(`to line ${n}`,"hot");r1.textContent=`line ${n} is a draft`;r2.textContent="the holder alone has it";
     let have=1;const reach=["L","K","M","T"].filter(k=>!FS.out.includes(k));
     await Promise.all(reach.map(k=>{const q=H.S[k],g=token(H.over,H.cx,H.cy,"#fffaf0",String(n)),ms=900+rnd(1500);
       return trip(g,line([H.cx,H.cy],[q.x,q.y]),ms).then(()=>{FS.held[k]=n;N[k].set(note(k));g.querySelector("text").textContent="✓";return trip(g,line([q.x,q.y],[H.cx,H.cy]),ms)})
         .then(()=>{g.remove();if(++have===3){r1.textContent=`line ${n} has passed`;r2.textContent="the holder and two others hold it";KS5.forEach(x=>{if(FS.held[x]>=n&&!FS.out.includes(x))N[x].set(note(x),"hot")})}})}));
     if(have<3){r1.textContent=`line ${n} waits`;r2.textContent=`only ${have} hold${have===1?"s":""} it, and nobody is told it is law`}busy=false}
   ["L","K","M","T"].forEach(k=>pick(H.S[k].g,`Step ${WHO[k].n} out, or bring them back`,()=>{const o=FS.out;o.includes(k)?o.splice(o.indexOf(k),1):o.push(k);H.S[k].g.classList.toggle("out",o.includes(k));N[k].set(note(k),"")}));
   pick(H.pod,"Write the next line",write);A.step(0,KS5.map(k=>N[k]));A.at(1,write);
   A.hint("Click a bench to step its legislator out or back, and the podium to write the next line.")},
 /* the boards grow outward, each line round its ring */
 function(svg,A){svg.innerHTML="";svg.setAttribute("viewBox","0 0 440 440");const cx=220,cy=220,
     at=(r,l)=>{const a=(-90+l*6)*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
     arcD=(r,l)=>{const [x0,y0]=at(r,0),[x1,y1]=at(r,Math.max(l,.3));return `M${x0},${y0} A${r},${r} 0 ${l*6>180?1:0} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`};
   el("circle",{cx,cy,r:204,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
   [[70,"board 5 · Okios",28,"#b9a77e",900],[120,"board 6 · Okios",40,WHO.O.c,1300],[170,"board 7 · Liskovia",1,WHO.L.c,400]].forEach(([r,s,l,c,ms],i)=>{
     el("circle",{cx,cy,r,fill:"none",stroke:"#b9a77e","stroke-width":1,"stroke-dasharray":"3 4"},svg);
     const p=el("path",{d:arcD(r,.3),fill:"none",stroke:c,"stroke-width":10,"stroke-linecap":"round"},svg);
     A.step(i,p,txt(svg,cx-18,cy-r+4,s,"lab sm",{"text-anchor":"end"}));A.at(i,()=>tween(ms,u=>p.setAttribute("d",arcD(r,l*u))))});
   const [ax,ay]=at(120,40),[bx,by]=at(170,1);
   A.step(3,el("circle",{cx:ax,cy:ay,r:8,fill:WHO.O.c,stroke:"#1c1512","stroke-width":2.5},svg),tag(svg,ax-10,ay+30,"board 6, line 40"));
   A.step(4,el("circle",{cx:bx,cy:by,r:8,fill:WHO.L.c,stroke:"#1c1512","stroke-width":2.5},svg),tag(svg,bx+86,by+22,"board 7, line 1: later","hot"));
   txt(svg,cx,cy-4,"later boards","lab sm");txt(svg,cx,cy+14,"further out","lab sm");txt(svg,cx,cy+50,"lines run round","lab sm");
   A.hint("Each board starts afresh at line 1, and a later board always outranks an earlier one.")},
 /* a change of board, message by message */
 function(svg,A){const P=Polar(svg,{vb:"0 0 560 560",cx:280,cy:285,r0:62,step:26,rings:7,tEnd:7.3,note:[10,22],
     nodes:Object.fromEntries(Object.keys(WHO).map(k=>[k,[THA[k],WHO[k].g,WHO[k].c]]))});
   const tagAt=(k,key,t,dx,dy,s,cls)=>{const [x,y]=P.pt(key,t);A.step(k,tag(P.over,x+dx,y+dy,s,cls))};
   tagAt(0,"O",2.2,-58,0,"stepped out");
   A.step(1,P.event("L",1,WHO.L.c,9),lostSlip(P,"L",1,"O",2));["K","M","T"].forEach(k=>A.step(1,P.slip("L",1,k,2)));tagAt(1,"L",1,30,-26,"invites board 7");
   const k1=slip(P,"K",2.3,"L",3.3),m1=slip(P,"M",2.3,"L",3.5);A.step(2,k1,m1,slipTag(P,k1,"6 · line 12"),slipTag(P,m1,"6 · line 10"));
   const sl=P.slip("T",2.3,"L",6.8);sl.classList.add("lost");A.step(2,sl);
   A.step(3,P.event("L",3.7,"#bf4a26",11));tagAt(3,"L",3.7,18,-28,"takes the podium","red");
   const ws=["K","M","T"].map(k=>P.slip("L",3.9,k,4.9));A.step(4,ws,slipTag(P,ws[1],"the whole law","hot"));
   A.hint("Theron's answer is slow, and nobody waits for it: three answers are a majority.")},
 /* when may board 7 form? the reader sets each answer */
 function(svg,A){FS.ans=FS.ans||{O:"without",L:"none",K:"none",M:"with",T:"with"};const H=Room(svg,{porch:true,podium:"board 7?",seats:tholosSeats()}),N={},RG={};
   KS5.forEach(k=>{const q=H.S[k];RG[k]=el("circle",{cx:q.x,cy:q.y,r:31,fill:"none",stroke:"#e0b84a","stroke-width":6,opacity:0},H.under);N[k]=H.note(k,"")});
   const r1=txt(H.over,H.cx,H.cy+62,"","lab ink sm"),r2=txt(H.over,H.cx,H.cy+80,"","lab sm");
   const lab={with:k=>`tablets · 6 · line ${HELD5[k]}`,without:()=>"no tablets · board 6",none:()=>"out of reach"};
   function paint(){const a=FS.ans,r=mayForm(a);
     KS5.forEach(k=>{H.S[k].g.classList.toggle("out",a[k]==="none");H.S[k].g.classList.toggle("wax",a[k]==="without");N[k].set(lab[a[k]](k),a[k]==="without"?"red":"");RG[k].setAttribute("opacity",r.holder===k?1:0)});
     H.podT.textContent=r.forms?"board 7":"board 7?";H.podD.setAttribute("fill",r.forms?WHO[r.holder].c:"#d9cfb4");
     if(r.forms){r1.textContent=`board 7 forms: ${WHO[r.holder].n} takes the podium`;r1.setAttribute("class","lab ink sm");r2.textContent=`holding line ${HELD5[r.holder]}, so line 12 survives`}
     else{r1.textContent="board 7 may not form";r1.setAttribute("class","lab red sm");r2.textContent=r.maj?"a majority answered, but none can show line 12":"fewer than three have answered"}}
   const next={with:"without",without:"none",none:"with"};
   KS5.forEach(k=>pick(H.S[k].g,`Change ${WHO[k].n}'s answer`,()=>{FS.ans[k]=next[FS.ans[k]];paint()}));
   paint();KS5.forEach((k,i)=>A.step(i,N[k]));A.step(5,r1,r2);
   A.hint("Line 12 passed with Okios, Liskovia and Kleon. Click a legislator to change their answer: with tablets, without, or out of reach.")},
 /* the holder on the porch writes a line nobody can pass */
 function(svg,A){const heard=!!FS.heard,H=Room(svg,{porch:true,podium:"board 7",podiumFill:WHO.L.c,seats:tholosSeats(),ring:["L"],place:{O:[220,422]}});
   {const [x,y]=H.at(-90);el("circle",{cx:x,cy:y,r:24,fill:"none",stroke:"#b9a77e","stroke-width":2,"stroke-dasharray":"4 4"},H.under)}
   const q=H.S.O,t=H.S.T;el("line",{x1:q.x,y1:q.y,x2:t.x,y2:t.y,stroke:"#6b5a48","stroke-width":2,"stroke-dasharray":"4 5"},H.under);
   const o=tag(H.over,H.cx,H.cy+70,"Okios, under board 6, writes line 13"),nt=H.note("T",heard?"board 7":"not yet heard of 7",heard?"hot":"");
   ["L","K","M"].forEach(k=>A.step(0,H.note(k,"board 7","hot")));A.step(0,o,nt);
   A.at(1,async id=>{const g=token(H.over,q.x,q.y,"#fffaf0","13");await trip(g,line([q.x,q.y],[t.x,t.y]),1400);if(!live(id))return;
     g.querySelector("text").textContent=heard?"✗":"✓";nt.set(heard?"refuses: board 7 stands":"holds line 13 of board 6",heard?"red":"");
     await trip(g,line([t.x,t.y],[q.x,q.y]),1400);g.remove();if(!live(id))return;o.set(heard?"nobody accepts line 13: it cannot pass":"only two hold line 13: it cannot pass","red")});
   pick(H.S.T.g,heard?"Theron has not heard of board 7":"Theron has heard of board 7",()=>{FS.heard=!heard;A.again()});
   A.hint("Click Θ to choose whether he has heard of board 7. Either way, nothing Okios writes can pass.")},
 /* wax and ink, row by row */
 function(svg,A){svg.innerHTML="";svg.setAttribute("viewBox","0 0 440 440");const cx=220,cy=220;
   el("path",{d:`M${cx},16 A204,204 0 0 0 ${cx},424 Z`,fill:"#f7e7bd"},svg);el("path",{d:`M${cx},16 A204,204 0 0 1 ${cx},424 Z`,fill:"#dceaf2"},svg);
   el("circle",{cx,cy,r:204,fill:"none",stroke:"#1c1512","stroke-width":5},svg);el("line",{x1:cx,y1:16,x2:cx,y2:424,stroke:"#1c1512","stroke-width":3},svg);
   [[-1,"Schedia","wax tablets","one trip out and back","passes a law","a majority gone home","can stop it for good"],
    [1,"Paxos","ink scrolls","survives any absence","","any legislator","may start a ballot"]].forEach(([s,a,b,c,d,e,f])=>{
     const x=cx+s*102;A.step(0,txt(svg,x,104,a,"lab ink",{style:"font-size:20px"}),txt(svg,x,128,b,"lab sm"));
     A.step(1,txt(svg,x,182,c,"lab sm"),txt(svg,x,200,d,"lab sm"));A.step(2,txt(svg,x,250,e,"lab sm"),txt(svg,x,268,f,"lab sm"))});
   A.step(3,tag(svg,cx,330,"any two majorities share a legislator","hot"))}
]};
ORDER.forEach(b=>FIGS[b].forEach((f,i)=>IDEAS[b][i].f=f));

/* ---------- the ring of ideas: every book's ideas round one circle ---------- */
/* slots round the ring: each book's ideas in a run, a gap after each book, the first gap at the top */
const SLOT={},SLOTS=ORDER.reduce((n,b)=>{SLOT[b]=n;return n+IDEAS[b].length+1},0),COUNT=SLOTS-ORDER.length;
const slot=(b,i)=>SLOT[b]+i;
/* labels run outward from the dots, with the books' names inside; or, with inward, the other way round */
function Ring(svg,onPick,o={}){
  svg.setAttribute("viewBox","0 0 720 720");const C=360,R=o.R||205,inward=!!o.inward,ang=s=>-90+360/SLOTS*(s+1),
    xy=(deg,r)=>[C+r*Math.cos(deg*Math.PI/180),C+r*Math.sin(deg*Math.PI/180)];
  const chords=el("g",{},svg),arcs=el("g",{},svg),labs=el("g",{class:"labs"},svg),art=o.art?o.art(svg):null,sts=el("g",{},svg),ctr=el("g",{class:"ctr-g"},svg),G={svg,C,R,xy,ang,chords,ctr,art,st:{}};
  el("circle",{cx:C,cy:C,r:R,fill:"none",stroke:"#b9a77e","stroke-width":1.2,"stroke-dasharray":"3 5"},arcs);
  ORDER.forEach((b,bi)=>{const B=BOOK[b],a0=ang(slot(b,0))-5,a1=ang(slot(b,IDEAS[b].length-1))+5,[x0,y0]=xy(a0,R),[x1,y1]=xy(a1,R);
    el("path",{d:`M${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`,fill:"none",stroke:B.c,"stroke-width":10,"stroke-linecap":"round",opacity:.3},arcs);
    const midA=(a0+a1)/2,low=Math.sin(midA*Math.PI/180)>.3,rn=inward?(low?R+33:R+22):(low?R-44:R-34),[p0x,p0y]=xy(low?a1:a0,rn),[p1x,p1y]=xy(low?a0:a1,rn),pid=svg.id+"-bk"+bi;
    el("path",{id:pid,fill:"none",d:`M${p0x.toFixed(1)},${p0y.toFixed(1)} A${rn},${rn} 0 0 ${low?0:1} ${p1x.toFixed(1)},${p1y.toFixed(1)}`},arcs);
    const t=el("text",{class:"bookname",fill:B.c},arcs),tp=el("textPath",{href:"#"+pid,startOffset:"50%","text-anchor":"middle"},t);tp.textContent=B.name;
    IDEAS[b].forEach((d,i)=>{const a=ang(slot(b,i)),[x,y]=xy(a,R),pos=`translate(${x.toFixed(1)} ${y.toFixed(1)})`,g=el("g",{class:"st",transform:pos},sts);
      el("title",{},g).textContent=`${B.name} ${i+1} · ${d.t}`;
      el("circle",{class:"b",r:12,fill:B.c},g);el("text",{},g).textContent=i+1;
      const right=Math.cos(a*Math.PI/180)>-1e-6,out=right!==inward,
        l=el("text",{class:"lab",style:"text-anchor:"+(out?"start":"end"),transform:`${pos} rotate(${(right?a:a+180).toFixed(1)}) translate(${out?20:-20} 0)`},labs);l.textContent=d.k;
      l.addEventListener("click",()=>onPick(b,i));
      button(g,`${B.title}, idea ${i+1}: ${d.t}`,()=>onPick(b,i));G.st[b+i]=g;g.label=l})});
  return G;
}

/* ---------- the explorer: every idea round one circle, and beside it a tree of books and ideas ----------
   Choosing an idea draws it in the middle of the circle and reads it out in the panel; Close goes back to the tree. */
const ALL=ORDER.flatMap(b=>IDEAS[b].map((d,i)=>({b,i,d})));
const goIdea=(function(){
  const fig=$("#wheel"),tree=$("#tree"),detail=$("#detail");let cur=-1,timer=0;
  const stacked=matchMedia("(max-width:859px)");   // the circle stands above the list, so choosing from the list brings it back into view
  const G=Ring(fig,(b,i)=>open(idx(b,i)),{R:318,inward:true,art:svg=>el("svg",{class:"art fig",id:"wheel-art"},svg)}),art=G.art;
  const words=["no","one","two","three","four","five","six","seven","eight","nine"];
  txt(G.ctr,360,346,String(COUNT),"ctr",{style:"font-size:64px;font-weight:700"});
  txt(G.ctr,360,382,`ideas, ${words[ORDER.length]||ORDER.length} settings`,"ctr",{style:"font-size:15px"});
  txt(G.ctr,360,406,"choose one","ctr",{style:"font-size:13px;font-style:italic;fill:#6b5a48"});
  const fit=()=>{const m=narrow.matches?60:84;art.setAttribute("x",m);art.setAttribute("y",m);art.setAttribute("width",720-2*m);art.setAttribute("height",720-2*m)};
  const idx=(b,i)=>ALL.findIndex(q=>q.b===b&&q.i===i);
  /* the tree: each book, its setting in a line, and its ideas */
  tree.innerHTML=`<div class="kicker">The books and their ideas</div>`+ORDER.map(b=>{const B=BOOK[b];
    return `<details open style="--c:${B.c}"><summary><span class="bk">${B.name}</span> <i>${B.title}</i></summary><p class="set">${B.line}</p><ol>`+
      IDEAS[b].map((d,i)=>`<li><button type="button" data-k="${idx(b,i)}"><span class="n">${i+1}</span>${d.t}</button></li>`).join("")+`</ol></details>`}).join("");
  const items=$$("button[data-k]",tree);
  items.forEach(btn=>{const q=ALL[+btn.dataset.k],st=G.st[q.b+q.i];btn.onclick=()=>{open(+btn.dataset.k);if(stacked.matches)$("#explore").scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"})};
    btn.onmouseenter=btn.onfocus=()=>st.classList.add("hi");btn.onmouseleave=btn.onblur=()=>st.classList.remove("hi")});
  for(const key in G.st){const q=ALL[idx(key.replace(/\d+$/,""),+key.match(/\d+$/)[0])],btn=items[ALL.indexOf(q)];
    G.st[key].addEventListener("mouseenter",()=>btn.classList.add("hi"));G.st[key].addEventListener("mouseleave",()=>btn.classList.remove("hi"))}
  function mark(){for(const key in G.st)G.st[key].classList.toggle("on",cur>=0&&key===ALL[cur].b+ALL[cur].i);fig.classList.toggle("open",cur>=0)}
  function draw(){const A=Anim(),d=ALL[cur].d;A.again=draw;art.innerHTML="";d.f(art,A);
    const h=$(".hint",detail);if(h)h.textContent=A.hintText;A.play()}
  function open(k){
    const next=Math.max(0,Math.min(ALL.length-1,k));if(next!==cur)for(const x in FS)delete FS[x];
    cur=next;const {b,i,d}=ALL[cur],B=BOOK[b];mark();
    clearTimeout(timer);Anim.run++;art.classList.add("hide");timer=setTimeout(()=>{draw();art.classList.remove("hide")},reduce?0:180);
    detail.innerHTML=`<div class="num" style="color:${B.c}">${B.name} · ${B.title} · idea ${i+1} of ${IDEAS[b].length}</div><h3>${d.t}</h3><div class="figbar"><button class="btn alt replay" type="button">↻ Play again</button><span class="hint"></span></div>`+d.p.map(x=>`<p>${x}</p>`).join("")+
      `<div class="mach"><b>In the machine room</b>${d.m}</div>`+
      `<div class="nav"><button class="btn alt" type="button" data-go="-1"${cur===0?" disabled":""}>← Back</button><button class="btn" type="button" data-go="1"${cur===ALL.length-1?" disabled":""}>Next →</button>`+
      `<button class="btn alt close" type="button" data-go="0">Close</button></div><a class="more" href="${B.href}#${d.a}">Read it in the book ↗</a>`;
    $$("button[data-go]",detail).forEach(x=>x.onclick=()=>+x.dataset.go?open(cur+ +x.dataset.go):close());$(".replay",detail).onclick=draw;
    tree.hidden=true;detail.hidden=false;detail.classList.remove("swap");void detail.offsetWidth;detail.classList.add("swap");
    try{history.replaceState(null,"","#"+b+"-"+(i+1))}catch(e){}
  }
  function close(){
    const was=cur;cur=-1;mark();clearTimeout(timer);Anim.run++;art.classList.add("hide");detail.hidden=true;tree.hidden=false;
    if(was>=0){const btn=items[was];btn.closest("details").open=true;btn.focus({preventScroll:true})}
    try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}
  }
  $("#explore").addEventListener("keydown",e=>{if(cur<0||e.target.closest("a,summary"))return;
    if(e.key==="ArrowRight"){e.preventDefault();open(cur+1)}if(e.key==="ArrowLeft"){e.preventDefault();open(cur-1)}if(e.key==="Escape"){e.preventDefault();close()}});
  narrow.addEventListener("change",()=>{fit();if(cur>=0)draw()});
  /* a link to #paxos-3 opens that idea */
  const fromHash=scroll=>{const m=/^#([a-z]+)-(\d+)$/.exec(location.hash),k=m?idx(m[1],+m[2]-1):-1;
    if(k>=0){open(k);if(scroll)$("#explore").scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"})}};
  addEventListener("hashchange",()=>fromHash(true));
  fit();art.classList.add("hide");fromHash(false);
  return (b,i)=>{open(idx(b,i));$("#explore").scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"})};
})();

/* ---------- threads: the same device in more than one setting ---------- */
const THREADS=[
 {t:"A number, and a name to break ties",c:"#bf4a26",at:[["arche",3],["paxos",2],["schedia",2]],
  p:"Each setting ranks things by a rising number and settles a tie by who wrote it, so no two marks are ever equal and everyone ranks them alike.",
  each:["On Arche, the tally first, then the lower house number.","In the Chamber, every ballot number belongs to one priest, so no two ballots share one.","In the Tholos, a board is a count and a name, ordered by count and then by name."]},
 {t:"Any two majorities share a member",c:"#136f9e",at:[["paxos",1],["paxos",2],["paxos",3],["schedia",1],["schedia",3],["schedia",6]],
  p:"Whatever one majority did, someone in the next majority was there for it, so a decision is carried forward after everyone else has gone.",
  each:["In the Chamber, the shared priest's last vote binds every later ballot.","In the Tholos, a line three hold is always found again among the next board's majority of answers."]},
 {t:"The same entries in the same order",c:"#5f6e28",at:[["arche",3],["arche",4],["paxos",5],["schedia",0]],
  p:"Copies that take the same entries in the same order end up the same. Each setting finds its own way to fix that one order.",
  each:["On Arche, every house sorts its waiting list by precedence and gets the same list.","In the Chamber, one Synod for every number puts the same decree at each number in every scroll.","In the Tholos, the holder numbers every line and the runners never skip one."]},
 {t:"One in charge, for speed and never for safety",c:"#a8741a",at:[["paxos",4],["schedia",0],["schedia",5]],
  p:"A single leader stops rivals from undoing each other's work. If two believe themselves in charge at once, the group slows down but never goes wrong.",
  each:["In the Chamber, two presidents only delay decrees.","In the Tholos, a holder who missed a later board can write lines but pass none."]},
 {t:"Stopped, never wrong",c:"#7a4fa0",at:[["paxos",0],["schedia",4],["schedia",6]],
  p:"When things go badly enough, each group stops rather than say something false, and promises progress only once things settle.",
  each:["In the Chamber, scrolls left blank never disagree, and decrees pass only when a majority stays long enough.","In the Tholos, a council that has lost too many tablets waits, or stops for good, rather than form a board without a passed law."]}];
(function(){
  const G=Ring($("#ring2"),goIdea),card=$("#threadcard");let cur=0;
  const chord=(b1,i1,b2,i2,c)=>{const s1=slot(b1,i1),s2=slot(b2,i2),[x1,y1]=G.xy(G.ang(s1),G.R-14),[x2,y2]=G.xy(G.ang(s2),G.R-14),
    mx=(x1+x2)/2,my=(y1+y2)/2,cx=G.C+(mx-G.C)*.25,cy=G.C+(my-G.C)*.25;
    return el("path",{class:"chord",stroke:c,d:`M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`},G.chords)};
  const lines=THREADS.map(T=>T.at.slice(1).map((q,j)=>chord(...T.at[j],...q,T.c)));
  const title=txt(G.ctr,360,366,"","ctr",{style:"font-size:15px;font-weight:700"});
  function show(i){cur=(i+THREADS.length)%THREADS.length;const T=THREADS[cur],on=new Set(T.at.map(([b,k])=>b+k));
    lines.forEach((ls,j)=>ls.forEach(p=>p.classList.toggle("on",j===cur)));
    for(const key in G.st)for(const x of [G.st[key],G.st[key].label]){x.classList.toggle("dim",!on.has(key));x.classList.toggle("lit",on.has(key))}
    title.textContent="thread "+(cur+1)+" of "+THREADS.length;title.style.fill=T.c;
    card.innerHTML=`<div class="num" style="color:${T.c}">Thread ${cur+1} of ${THREADS.length}</div><h3>${T.t}</h3><p>${T.p}</p>`+T.each.map(x=>`<p style="font-size:.96rem">${x}</p>`).join("")+
      `<div class="nav"><button class="btn alt" type="button">← Back</button><button class="btn" type="button">Next thread →</button></div>`;
    const [bp,bn]=$$("button",card);bp.onclick=()=>show(cur-1);bn.onclick=()=>show(cur+1);
    card.classList.remove("swap");void card.offsetWidth;card.classList.add("swap")}
  $(".dial.threads").addEventListener("keydown",e=>{if(e.key==="ArrowRight"){e.preventDefault();show(cur+1)}if(e.key==="ArrowLeft"){e.preventDefault();show(cur-1)}});
  show(0);
})();
})();

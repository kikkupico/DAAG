"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,Polar,Timeline,Unfold}=BOOK;
const {isM,dual,vis,dtext,onReg}=REG;
BOOK.init();

/* the four legislators in the Chamber, told apart by colour and bench */
const TC={1:"#e0b84a",2:"#6583d6",3:"#c45448",4:"#9cb648"};
const T=[1,2,3,4],HOLD="#136f9e",ATT="#bf4a26";
const word={H:"Decree 0",A:"Decree 1"},GL={H:"0",A:"1"};   /* Decree 0 or Decree 1 in allegory, 0 or 1 in computing */
const WD=x=>dual(word[x],GL[x]);
const legChip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${TC[k]}"></i>${dual("Legislator "+k,"P"+k)}</span>`;
const tentChip=legChip;
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const list=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" and "+a[a.length-1];
const legs=a=>(a.length>1?"legislators ":"legislator ")+list(a), pn=a=>list(a.map(k=>"P"+k)), legsD=a=>dual(legs(a),pn(a));
const tents=legs, tentsD=legsD;
const cap=s=>s[0].toUpperCase()+s.slice(1);

/* ===== the arrangement for a strong slate, run by its rules =====
   o.sight {k:"A"|"H"}; o.c the member nobody chalks; o.dies {k:round} the round a member steps out in (0 = before sending anything,
   4 = while comparing); o.part {k:[legs]} who the last note of an absent member reaches; o.skip(p,r) the members p has chalked and stops waiting for. */
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

/* ===== rounds by turns, for slates that are right only in the end (rotating presidency) ===== */
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

/* ===== the Chamber, seen from above: circular marble hall, colonnade, meridian line, door to grove ===== */
function Chamber(svg){
  const cx=235,cy=235,R=145,A={1:225,2:135,3:315,4:45}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5,class:"i"},svg);
  el("circle",{cx,cy,r:190,fill:"none",stroke:"#1c1512","stroke-width":2.5,class:"i"},svg);
  el("circle",{cx,cy,r:105,fill:"none",stroke:"#8c7e68","stroke-width":1.5,class:"i"},svg);
  /* bronze meridian line */
  el("line",{x1:cx,y1:cy-185,x2:cx,y2:cy+185,stroke:"#c89234","stroke-width":2.5,"stroke-dasharray":"6 4",class:"i"},svg);
  /* door to grove */
  el("rect",{x:cx-28,y:cy+185,width:56,height:26,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3,class:"i"},svg);
  el("text",{x:cx,y:cy+203,class:"lab i",style:"font-size:10px;text-anchor:middle;fill:#6b5a48"},svg).textContent="door to grove";
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const H={svg,cx,cy,R,A,under,over,tent:{},
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:12,fill,stroke:"#1c1512","stroke-width":2.5},g);dtext(g,{},glyph,GL[glyph]||glyph);return g},
    /* a messenger u of the way from bench a to bench b across the floor */
    fly(g,a,b,u){const d=((A[b]-A[a]+540)%360)-180;H.put(g,...H.at(A[a]+d*u,R-(d>0?24:46)*Math.sin(Math.PI*u)))},
    state(k,i,m){const t=H.tent[k].st;t[0].textContent=i;t[1].textContent=i&&(m||i)},
    badge(k,s){const b=H.tent[k].badge;b.setAttribute("opacity",s?1:0);b.t[0].textContent=s||"";b.t[1].textContent=GL[s]||s||""}
  };
  for(const k of [1,2,3,4]){const a=A[k]*Math.PI/180,[x,y]=H.at(A[k]),g=el("g",{class:"site"},sites);H.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:TC[k]},g);dtext(g,{},"L"+k,"P"+k);
    const st=dtext(g,{class:"state halo",x:-48*Math.cos(a),y:-46*Math.sin(a)},"","");
    const badge=el("g",{class:"badge",opacity:0,transform:`translate(${(38*Math.cos(a)).toFixed(1)} ${(34*Math.sin(a)).toFixed(1)})`},g);el("circle",{r:11},badge);badge.t=dtext(badge,{},"","");
    H.tent[k]={x,y,g,st,badge}}
  return H;
}
const Hill=Chamber;

/* a drawn line for a messenger's run from bench a to bench b */
function route(H,a,b,u0=.14,u1=.86){const pts=[];for(let i=0;i<=14;i++){const u=u0+(u1-u0)*i/14,d=((H.A[b]-H.A[a]+540)%360)-180;pts.push(H.at(H.A[a]+d*u,H.R-(d>0?24:46)*Math.sin(Math.PI*u)))}
  return "M"+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L")}
const cross=(g,x,y,r=17)=>el("path",{d:`M${x-r},${y-r} L${x+r},${y+r} M${x-r},${y+r} L${x+r},${y-r}`,stroke:"#1c1512","stroke-width":5,fill:"none"},g);

/* cover:start */
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · A FAILURE DETECTOR AT P1","◇P · eventually perfect");
  const x0=106,x1=488,ys=[106,154,202],T0=[0,1,2,3,4,5,6,7,8,9,10];
  const px=t=>x0+t*36;
  ys.forEach((y,j)=>{lane(g,x0-16,x1+6,y,{w:1.3,c:j===2?"red":null,dash:j===2?"4 4":null});node(g,40,y,14,"P"+(j+2),{s:10.5,k:j===2?P.red:P.ink,c:j===2?P.red:P.ink,f:j===2?P.redL:"#fff"})});
  T(g,26,70,"heartbeats arriving at P1",{a:"start",s:10,m:1,c:P.mute});
  const hb=(y,x,c)=>{el("line",{x1:x,x2:x,y1:y-9,y2:y+9,stroke:P[c||"blue"],"stroke-width":2.2,"stroke-linecap":"round"},g)};
  [0,1,2,5,6,7,8,9,10].forEach(t=>hb(ys[0],px(t)));
  hb(ys[0],px(3.9),"blue");
  [0,1,2,3,4,5,6,7,8,9,10].forEach(t=>hb(ys[1],px(t)));
  [0,1,2,3,4,5,6].forEach(t=>hb(ys[2],px(t)));
  /* the crash */
  el("path",{d:`M${px(6.9)-6} ${ys[2]-6}l12 12m0 -12l-12 12`,stroke:P.red,"stroke-width":2.6,"stroke-linecap":"round"},g);
  chip(g,px(7.6),ys[2]-22,"crash",{a:"start",m:1,s:8.5,pad:8,k:P.red,c:P.red,f:P.redL});
  /* the timeout brackets */
  const br=(y,xa,xb,c,t)=>{el("path",{d:`M${xa} ${y+14}v5h${xb-xa}v-5`,fill:"none",stroke:P[c],"stroke-width":1.3},g);T(g,(xa+xb)/2,y+30,t,{s:8.5,m:1,c:P[c]})};
  br(ys[0],px(2),px(3.5),"red","Δ");br(ys[0],px(5),px(7),"green","Δ′ > Δ");br(ys[2],px(6),px(9),"red","Δ″");
  chip(g,px(3.5)+4,ys[0]-22,"false suspicion",{a:"start",m:1,s:8.5,pad:8,k:P.red,c:P.red,f:P.redL});
  /* the suspect list over time */
  T(g,26,262,"suspect list at P1",{a:"start",s:10,m:1,c:P.mute});
  const sy=[288,318,348];
  const seg=(y,xa,xb,c)=>el("rect",{x:xa,y:y-7,width:xb-xa,height:14,rx:7,fill:c,opacity:.9},g);
  ys.forEach((_,j)=>node(g,40,sy[j],11,"P"+(j+2),{s:9,k:j===2?P.red:P.ink,c:j===2?P.red:P.ink}));
  seg(sy[0],x0-10,px(3.5),P.green);seg(sy[0],px(3.5),px(3.9),P.red);seg(sy[0],px(3.9),x1+4,P.green);
  seg(sy[1],x0-10,x1+4,P.green);
  seg(sy[2],x0-10,px(9),P.green);seg(sy[2],px(9),x1+4,P.red);
  T(g,x1+4,sy[0]+19,"trusted again",{a:"end",s:8.5,m:1,c:P.green});T(g,x1+4,sy[2]+19,"suspected, forever",{a:"end",s:8.5,m:1,c:P.red});
  [[P.green,"trusted"],[P.red,"suspected"]].forEach(([c,t],k)=>{dot(g,106+k*92,382,5,c);T(g,106+k*92+10,382,t,{a:"start",s:10,c:P.mute})});
  /* the timeout grows */
  T(g,W-26,400,"timeout grows with each false suspicion",{a:"end",s:9.5,m:1,c:P.mute});
  [36,54,72,90].forEach((w,k)=>el("rect",{x:W-26-210+k*54,y:478-w*.6,width:42,height:w*.6,rx:3,fill:P.blueL,stroke:P.blue,"stroke-width":1.2},g));
  T(g,26,430,"every live process",{a:"start",s:10,c:P.mute});T(g,26,446,"is eventually trusted;",{a:"start",s:10,c:P.mute});T(g,26,462,"every crashed one, suspected",{a:"start",s:10,c:P.mute});
};
COVERS.draw("#coversvg",COVER);COVERS.mount(COVER);
/* cover:end */

/* the four as lanes, for a Chamber picture's computing twin (Unfold in book.js) */
const LANES={1:[225,"L1",TC[1],"P1"],2:[135,"L2",TC[2],"P2"],3:[315,"L3",TC[3],"P3"],4:[45,"L4",TC[4],"P4"]};

/* ===== an attendance slate that may be wrong, in two ways ===== */
(function(){
  const H=Chamber($("#slatesvg")),L=Unfold(H.svg,{nodes:LANES,span:3}),say=$("#slatesay"),rows=$("#slaterows"),bR=$("#slatereveal"),bN=$("#slatenew");
  const K=[2,3,4];let truth,mark,shown,extra;
  function deal(){do{truth={};K.forEach(k=>truth[k]=["fine","slow","dead"][rnd(3)])}while(!K.some(k=>truth[k]!=="fine"));
    mark={};K.forEach(k=>mark[k]=false);shown=false;(extra||[]).forEach(e=>e.remove());extra=[];
    T.forEach(k=>{H.tent[k].g.classList.remove("out");H.state(k,"");H.badge(k,"");L.badge(k,"")});H.tent[1].g.classList.add("turn");H.state(1,"you");
    L.reset();L.turn(1);L.state(1,"you","you");K.forEach(k=>{if(truth[k]==="fine")L.msg(k,1,.3,1.1)});L.setT(2.4);
    bR.disabled=false;paint();
    say.innerHTML=dual("Legislator 1 has had no note from some members. Which of them have stepped out? Chalk the ones you suspect, then reveal the hall.","P1 has had no message from some processes. Which of them have crashed? Mark the ones you think have, then reveal the execution.")}
  const bird=k=>truth[k]==="fine"?dual("a note arrived","a message came in"):dual("no note yet","no message yet");
  function paint(){
    rows.innerHTML=K.map(k=>`<div class="srow">${legChip(k)}<span class="sb">${bird(k)}</span><button class="btn alt" data-k="${k}" ${shown?"disabled":""}>${mark[k]?dual("Rub out","Remove"):dual("Chalk","Suspect")}</button><span class="sv" id="sv${k}"></span></div>`).join("");
    $$("button[data-k]",rows).forEach(b=>b.onclick=()=>{const k=+b.dataset.k;mark[k]=!mark[k];H.badge(k,mark[k]?"✗":"");L.badge(k,mark[k]?"✗":"");paint()});
    if(shown)K.forEach(k=>{const dead=truth[k]==="dead",m=mark[k],slow=truth[k]==="slow";$("#sv"+k).innerHTML=
      dead&&m?dual("<span class='ok'>Right.</span> Absent, and chalked.","<span class='ok'>Right.</span> Crashed, and suspected."):
      dead&&!m?dual("<span class='bad'>Not yet.</span> Absent, and the slate is clean.","<span class='bad'>Not yet.</span> Crashed, and not suspected."):
      m?dual("<span class='bad'>Wrong.</span> Present"+(slow?", messenger only slow":"")+", and chalked.","<span class='bad'>Wrong.</span> Alive"+(slow?", its message only slow":"")+", and suspected."):
      dual("<span class='ok'>Right.</span> Present, and the slate is clean.","<span class='ok'>Right.</span> Alive, and not suspected.")})}
  bR.onclick=()=>{shown=true;bR.disabled=true;
    L.setT(0);K.forEach(k=>{if(truth[k]==="dead")L.crash(k);if(truth[k]==="slow")L.msg(k,1,.3,null)});L.setT(2.4);
    K.forEach(k=>{if(truth[k]==="dead"){H.tent[k].g.classList.add("out");H.state(k,"absent","crashed");L.state(k,"crashed","crashed");extra.push(cross(H.over,H.tent[k].x,H.tent[k].y))}
      else if(truth[k]==="slow"){const g=H.token(TC[k],"");g.setAttribute("opacity",1);H.fly(g,k,1,.45);const [px,py]=H.at(H.A[k]+(((H.A[1]-H.A[k]+540)%360)-180)*.45,H.R-24*Math.sin(Math.PI*.45));
        const t=dtext(H.over,{class:"lab halo",x:px+(k===3?-4:6),y:py+30},"delayed","delayed");extra.push(g,...t);H.state(k,"present");L.state(k,"alive","alive")}
      else{H.state(k,"present");L.state(k,"alive","alive")}});
    paint();
    const missed=K.filter(k=>truth[k]==="dead"&&!mark[k]).length,wrong=K.filter(k=>truth[k]!=="dead"&&mark[k]).length;
    say.innerHTML=!missed&&!wrong?dual("No mistake this time. But from where Legislator 1 sits, an absent colleague and a slow messenger look the same, so an attendance slate can only guess.","No mistake this time. But from where P1 sits, a crashed process and a slow message look the same, so a detector can only guess."):
      dual(`This slate went wrong ${missed?"by leaving "+missed+" absent "+(missed>1?"legislators":"legislator")+" clean":""}${missed&&wrong?" and ":""}${wrong?"by chalking "+wrong+" present "+(wrong>1?"legislators":"legislator"):""}. <b>Those are the only two ways to go wrong.</b>`,
        `This detector went wrong ${missed?"by leaving "+missed+" crashed "+(missed>1?"processes":"process")+" unsuspected":""}${missed&&wrong?" and ":""}${wrong?"by suspecting "+wrong+" live "+(wrong>1?"processes":"process"):""}. <b>Those are the only two ways to go wrong.</b>`)};
  bN.onclick=deal;deal();onReg.push(paint);
})();

/* ===== weak completeness becomes strong by copying marks ===== */
(function(){
  const box=$("#copyrows")||$("#copybox"),say=$("#copysay"),bG=$("#copygo"),bR=$("#copyr");
  const LIVE=[1,2,3];let r=0,copy={},order={};
  const slate=(p,round)=>{const out=[];if(round>=1)out.push(4);if(p===1&&round===1)out.push(2);if(p===3&&round===2)out.push(1);return out};
  function reset(){r=0;copy={1:new Set(),2:new Set(),3:new Set()};order={1:[1],2:[2],3:[3]};bG.disabled=false;paint();
    say.innerHTML=dual("Legislator 4 has stepped out. The door-slate only chalks Legislator 4 from the view of one bench; watch how copying notes spreads the suspicion to every bench.","P4 has crashed. Only one process's detector suspects it at first; watch how sharing suspicions spreads to every process.")}
  function paint(){
    box.innerHTML=`<div class="chead"><span>legislator</span><span>suspicions on their roster</span></div>`+
      LIVE.map(p=>`<div class="crow">${legChip(p)}<span class="chips">${copy[p].size?[...copy[p]].map(k=>legChip(k)).join(""):dual("<i>clean</i>","<i>none</i>")}</span></div>`).join("")}
  bG.onclick=()=>{r++;
    LIVE.forEach(p=>{order[p]=shuffle(LIVE);order[p].forEach(q=>{const c=copy[p];slate(q,r).forEach(k=>c.add(k));c.delete(q)})});
    paint();
    const all4=LIVE.every(p=>copy[p].has(4)),w=LIVE.some(p=>copy[p].has(2)||copy[p].has(1)||copy[p].has(3));
    say.innerHTML=dual(`Round ${r}. Each legislator added the marks of every note received, and rubbed out the mark against the legislator the note came from.`+
      (all4?` <b>Legislator 4 is chalked in every roster,</b> and no note from Legislator 4 will ever come to rub it out.`:"")+
      (r<3?(w?" Some rosters still hold a mark against a present legislator. That is only the scribes' mistake, passed on, and any note from that member rubs it out.":""):
        " The slates are right about the present now. Every copy holds Legislator 4 and nobody else: the copy is only as wrong as the slates it was copied from, and it rights itself when they do."),
      `Round ${r}. Each process added the suspicions in every message received, and removed the suspicion of the process the message came from.`+
      (all4?` <b>P4 is suspected in every copy,</b> and no message from P4 will ever come to remove it.`:"")+
      (r<3?(w?" Some copies still hold a suspicion of a live process. That is only the detectors' mistake, passed on, and any message from that process removes it.":""):
        " The detectors are right about the live now. Every copy holds P4 and nobody else: the copy is only as wrong as the lists it was copied from, and it rights itself when they do."));
    if(r>=4)bG.disabled=true};
  bR.onclick=reset;reset();onReg.push(paint);
})();

/* ===== scroll-driven: the arrangement for a strong slate, run in full ===== */
const strongRun=(function(){
  const skipTab={"1-1":[3],"3-1":[1],"1-2":[3],"2-2":[3]};
  return runStrong({sight:{1:"A",2:"H",3:"A",4:"H"},c:2,dies:{4:1},part:{4:[3]},skip:(p,r)=>skipTab[p+"-"+r]||[]});
})();
(function(){
  const R=strongRun,H=Chamber($("#strongsvg")),L=Unfold($("#strongsvg"),{nodes:LANES,span:4.6}),side=$("#strongside"),svg=H.svg;
  const m=el("marker",{id:"strong-k",markerWidth:9,markerHeight:9,refX:7.5,refY:3.2,orient:"auto"},el("defs",{},svg));el("path",{d:"M0,0 L7.5,3.2 L0,6.4 z",fill:"#1c1512"},m);
  const arrows={};
  for(let r=1;r<=4;r++){arrows[r]=[];const hs=R.snaps[r].heard;for(const p in hs)hs[p].forEach(q=>{if(q!=+p)arrows[r].push(el("path",{class:"gr-arrow fade",d:route(H,q,+p),"marker-end":"url(#strong-k)"},H.under))})}
  H.state(2,"spared","spared");
  const deadMark=cross(H.over,H.tent[4].x,H.tent[4].y);deadMark.setAttribute("opacity",0);
  const on=(e,v)=>e.classList.toggle("on",!!v);
  const rowCell=(V,P,k)=>{const v=V[k],was=P&&P[k];return `<span class="tc ${v?"f":""} ${v&&!was?"new":""} ${!v&&was?"gone":""}">${v?dual(v,GL[v]):"–"}</span>`};
  const word2={A:"Decree 1",H:"Decree 0"};
  function card(p,i,snapI){
    const S=R.snaps[snapI],P=snapI>0?R.snaps[snapI-1]:null,gone=p===4&&i>=1,V=S.V[p];
    const head=`<h5>${legChip(p)}<span>${gone?dual("absent","crashed"):p===2?dual("never chalked","never suspected"):"present"}</span></h5>`;
    const cells=`<div class="tally">${T.map(k=>rowCell(V,P&&P.V[p],k)).join("")}</div>`;
    const idx=`<div class="tidx"><span>1</span><span>2</span><span>3</span><span>4</span></div>`;
    const chk=i===5&&!gone?`<div class="chk"><b>${(x=>dual("commits to "+word2[x],"decides "+GL[x]))(T.map(k=>V[k]).find(Boolean))}</b></div>`:`<div class="chk">${gone?"dispatches nothing":""}</div>`;
    return `<div class="hc${gone?" gone":""}${i===5&&!gone?" in":""}">${head}${idx}${cells}${chk}</div>`}
  scrolly($("#strong"),i=>{
    const snapI=Math.min(i,4);
    side.innerHTML=T.map(p=>card(p,i,snapI)).join("");
    for(let r=1;r<=4;r++)arrows[r].forEach(a=>on(a,snapI===r&&i<5));
    deadMark.setAttribute("opacity",i>=1?1:0);H.tent[4].g.classList.toggle("out",i>=1);
    L.reset();L.setT(0);L.state(2,"spared","spared");
    for(let r=1;r<=snapI;r++){const hs=R.snaps[r].heard;L.band(r-1+.08,r-.08,"round "+r,r===snapI&&i<5);
      for(const p in hs)hs[p].forEach(q=>{if(q!=+p)L.msg(q,+p,r-1+.15,r-.15)})}
    if(i>=1){L.setT(.62);L.crash(4)}
    L.setT(Math.max(.05,Math.min(snapI,4)));
    if(i===5){L.setT(4.25);T.filter(p=>p!==4).forEach(p=>{const x=T.map(k=>R.snaps[4].V[p][k]).find(Boolean);L.state(p,"decides "+GL[x],"decides "+GL[x])})}
  });
})();

/* ===== any session: absences, wrong slates, and every roster still ends the same ===== */
(function(){
  const out=$("#tryout"),say=$("#trysay"),btns=$$("[data-dead]");
  function go(n){
    const ks=shuffle(T),dead=ks.slice(0,n),live=ks.slice(n),c=live[rnd(live.length)];
    const sight={};T.forEach(k=>sight[k]=rnd(2)?"A":"H");
    const dies={},part={};dead.forEach(k=>{dies[k]=rnd(5);part[k]=T.filter(q=>q!==k&&rnd(2))});
    const skips={},o={sight,c,dies,part,skip:(p,r)=>skips[p+"-"+r]||(skips[p+"-"+r]=T.filter(q=>q!==p&&q!==c&&rnd(2)))};
    const R=runStrong(o),fin=R.finish,tallies=new Set(fin.map(p=>JSON.stringify(R.V[p]))),ans=new Set(Object.values(R.commit));
    const when=r=>r===0?dual("stepped out before session","crashed before sending anything"):r<4?dual(`stepped out in round ${r}`,`crashed in round ${r}`):dual("stepped out while comparing","crashed while comparing");
    out.innerHTML=`<div class="chead t"><span>${dual("legislator","process")}</span><span>${dual("favoured","input")}</span><span>state</span><span>${dual("final sheet","final vector")}</span><span>${dual("commits to","decides")}</span></div>`+
      T.map(p=>{const d=dies[p]!=null,V=R.V[p];
        return `<div class="crow t${d?" dead":""}">${legChip(p)}<span><b>${dual(sight[p]==="A"?"1":"0",GL[sight[p]])}</b></span><span>${d?when(dies[p]):p===c?dual("present, never chalked","alive, never suspected"):"present"}</span>`+
          (d?`<span></span><span>–</span>`:`<span><div class="tally">${T.map(k=>`<span class="tc ${V[k]?"f":""}">${V[k]?dual(V[k]==="A"?"1":"0",GL[V[k]]):"–"}</span>`).join("")}</div></span><span><b>${WD(R.commit[p])}</b></span>`)+`</div>`}).join("");
    const same=tallies.size===1,one=ans.size===1,seen=[...ans].every(a=>Object.values(sight).includes(a));
    say.innerHTML=dual(`${n?cap(legs(dead))+(n>1?" have":" has")+" stepped out.":"Nobody has stepped out."} Legislator ${c} is present and never chalked, and every other present legislator may be chalked, over and over. `+
      `<span class="${same?"ok":"bad"}">${same?"Every present legislator ends with the same sheet.":"The sheets differ."}</span> `+
      `<span class="${one&&seen?"ok":"bad"}">${one&&seen?"All commit to "+word[[...ans][0]]+", a decree someone favoured.":"The decrees differ."}</span>`,
      `${n?cap(pn(dead))+(n>1?" crash.":" crashes."):"Nobody crashes."} P${c} stays correct and is never suspected, and every other correct process may be suspected by anyone, over and over. `+
      `<span class="${same?"ok":"bad"}">${same?"Every correct process ends with the same vector.":"The vectors differ."}</span> `+
      `<span class="${one&&seen?"ok":"bad"}">${one&&seen?"All decide "+GL[[...ans][0]]+", a value some process had as input.":"The decisions differ."}</span>`);
  }
  btns.forEach(b=>b.onclick=()=>go(+b.dataset.dead));go(1);
})();

/* ===== rounds by turns (rotating presidency) ===== */
(function(){
  const rows=$("#turnrows"),log=$("#turnlog"),say=$("#turnsay"),bN=$("#turnnext"),bs=$$("[data-kill]"),bR=$("#turnr");
  let st=null;
  const word2=v=>`<b>${WD(v)}</b>`,L=(a,b)=>isM()?b:a;
  function paint(owner){
    rows.innerHTML=`<div class="chead t2"><span>${dual("legislator","process")}</span><span>estimate</span><span>${dual("taken up in round","adopted in round")}</span><span></span></div>`+
      T.map(k=>{const live=st.live.includes(k),own=owner===k;
        return `<div class="crow t2${live?"":" dead"}${own?" owner":""}">${legChip(k)}<span data-l="estimate">${word2(st.est[k])}</span><span data-l="${L("taken up in round","adopted in round")}">${st.ts[k]||dual("initial opinion","its input")}</span><span>${!live?dual("absent","crashed"):st.commit?dual("commits to "+word[st.commit],"decides "+GL[st.commit]):own?dual("president of this round","coordinator of this round"):""}</span></div>`}).join("")}
  function start(nDead){const ks=shuffle(T),sight={};T.forEach(k=>sight[k]=rnd(2)?"A":"H");
    st=newNight(ks.slice(nDead).sort(),sight);log.innerHTML="";bN.disabled=false;bR.hidden=false;paint(null);
    say.innerHTML=dual(`${nDead?(nDead>1?"Two legislators are":"One legislator is")+" absent.":"All four are present."} For the first two rounds the slates are wrong: a present president may be falsely chalked. From round 3 they are right. Take a round.`,
      `${nDead?(nDead>1?"Two processes crash.":"One process crashes."):"All four run."} For the first two rounds the detectors are wrong: a process may suspect a round's coordinator that is correct. From round 3 they are right. Take a round.`)}
  const ev=(h,cls="")=>{const d=document.createElement("div");d.className="e "+cls;d.innerHTML=h;log.prepend(d);while(log.children.length>14)log.lastChild.remove()};
  bN.onclick=()=>{
    if(!st)return;const o=playRound(st,st.r>=2);paint(o.owner);
    const own=o.owner,H=dual(`<b>Round ${o.r}</b> belongs to Legislator ${own} as president. `,`<b>Round ${o.r}</b> belongs to P${own}. `);
    if(o.kind==="deadowner"){ev(H+dual(`Legislator ${own} is absent. Scribes chalk them in the end, and the round comes to nothing.`,`P${own} has crashed. Every process suspects it in the end, and the round comes to nothing.`),"bad");say.innerHTML=dual("An absent president costs one round. Failing is always safe, and the presidency passes to the next legislator.","A crashed coordinator costs one round. Failing is always safe, and the next round begins with the next process.");return}
    if(o.kind==="stuck"){ev(H+dual(`The president must wait for three estimates, and only two legislators are present. It waits forever.`,`The coordinator must wait for three estimates, and only two processes are alive. It waits forever.`),"bad");say.innerHTML=dual("<span class='bad'>The Chamber is deadlocked.</span> More than half must be present for a rotating presidency to work.","<span class='bad'>The system is deadlocked.</span> More than half must be correct for a rotating coordinator to work.");bN.disabled=true;return}
    ev(H+dual(`Legislator ${own} asks for estimates, and hears from ${legs(o.gather)}. The newest estimate among them is ${word2(o.e)}, adopted in round ${o.best||"at start"}. Legislator ${own} proposes ${word2(o.e)} to all.`,
      `P${own} gathers estimates from ${pn(o.gather)}. The highest timestamp among them is ${word2(o.e)}, from round ${o.best}. P${own} proposes ${word2(o.e)} to all.`));
    if(o.kind==="parting"){
      ev(dual(`The proposal reached a majority (${legs(o.three)}). All three adopt it and reply. <b>Legislator ${own} dispatches the decree to all: pass ${word2(o.e)}.</b> The decree is settled.`,
        `The proposal reached a majority (${pn(o.three)}). All three adopt it and reply. <b>P${own} broadcasts the decision: ${word2(o.e)}.</b> The consensus is settled.`),"ok");
      say.innerHTML=dual(`<b>A decree has passed!</b> Scribes spared Legislator ${own}, a majority confirmed the estimate, and the decree was dispatched. Take more rounds to see the decision stand.`,
        `<b>Consensus reached!</b> Detector spared P${own}, a majority acknowledged the proposal, and the decision was broadcast. Take more rounds to see the decision stand.`);
      bN.disabled=true;
    }else{
      ev(dual(`Scribes falsely suspected Legislator ${own}; the proposal was abandoned. The round failed safely.`,
        `A process falsely suspected P${own}; the proposal was abandoned. The round failed safely.`),"bad");
      say.innerHTML=dual("A false suspicion on the door-slate aborted the round. Safety is preserved, and the presidency rotates to the next legislator.",
        "A false suspicion aborted the round. Safety is preserved, and the coordinator rotates to the next process.");
    }
  };
  bs.forEach(b=>b.onclick=()=>{bs.forEach(x=>x.classList.toggle("on",x===b));start(+b.dataset.kill)});
  bR.onclick=()=>start(+($(".on[data-kill]",$("#turnbtns"))||$(".on[data-kill]")).dataset.kill);
  start(1);
})();

/* ===== why more than half: three sessions that split the four ===== */
(function(){
  const nodes={1:[225,"L1",TC[1],"P1"],2:[135,"L2",TC[2],"P2"],3:[315,"L3",TC[3],"P3"],4:[45,"L4",TC[4],"P4"]},svg=$("#halfsvg"),stand=$("#halfstand"),say=$("#halfsay"),bs=$$("[data-night]");
  const defs=[];
  let cur=1,tl=null,live=[];
  function draw(P,n){
    const spokes=$$(P.lanes?".ln-lane":".st-spoke",svg);
    const dead=n===1?[3,4]:n===2?[1,2]:[];
    dead.forEach(k=>{const [x,y]=P.pt(k,1);spokes[k-1].setAttribute("x2",x);spokes[k-1].setAttribute("y2",y);cross(P.over,x,y,12)});
    const live=T.filter(k=>!dead.includes(k)),ans={1:"H",2:"H",3:"A",4:"A"};
    const dot=(k,t,fill,txt)=>{const g=P.event(k,t,fill,10);g.style.cursor="default";g.label.remove();const lb=dtext(g,{},txt||"",GL[txt]||txt||"");if(fill!=="#fffaf0")lb.forEach(e=>e.style.fill="#fff");return g};
    live.forEach(k=>dot(k,1.4,"#fffaf0",n===3?ans[k]:n===1?"H":"A"));
    const exch=(a,b)=>{P.slip(a,1.4,b,2.6,12);P.slip(b,1.4,a,2.6,12)};
    if(n===1)exch(1,2);else if(n===2)exch(3,4);else{exch(1,2);exch(3,4);
      [[1,3],[2,4],[3,1],[4,2]].forEach(([a,b])=>{const s=P.slip(a,1.4,b,7.2,14);s.classList.add("hi");s.style.strokeDasharray="6 4";s.style.strokeWidth=3.4})}
    live.forEach(k=>dot(k,4.2,v==="H"?HOLD:ATT,v));
    return live;
  }
  const texts={
    1:dual(`<b>First session.</b> All four favoured Decree 0. Legislators 3 and 4 are absent from the start, and Legislators 1 and 2 chalk them all along. That slate is in the end perfect: it chalks the absent, and nobody else. Legislators 1 and 2 commit to Decree 0.`,
       `<b>First execution.</b> All four have input 0. P3 and P4 crash at the start, and P1 and P2 suspect them all along. That detector is in the end perfect: it suspects the crashed, and nobody else. P1 and P2 decide, within some time, and decide 0, since only 0 was an input.`),
    2:dual(`<b>Second session.</b> The same with the pairs and decrees swapped: all four favoured Decree 1, Legislators 1 and 2 are absent from the start, and Legislators 3 and 4 commit to Decree 1.`,
       `<b>Second execution.</b> The same with the pairs and the values swapped: all four have input 1, P1 and P2 crash at the start, and P3 and P4 decide 1 within some time.`),
    3:dual(`<b>Third session.</b> Legislators 1 and 2 favour Decree 0, Legislators 3 and 4 favour Decree 1. <span class="ok">Nobody is absent.</span> Every note between the two pairs is delayed across the hall until after both pairs have committed, and until then each pair chalks the other. Afterwards all notes arrive and all chalk is rubbed out. That slate is in the end perfect too. <span class="bad">Each pair sees exactly what it saw in its own session, and commits: one pair to Decree 0, the other to Decree 1.</span>`,
       `<b>Third execution.</b> P1 and P2 have input 0, P3 and P4 have input 1. <span class="ok">Nobody crashes.</span> Every message between the two pairs is delayed until after both pairs have decided, and until then each pair suspects the other. Afterwards all the messages arrive and all the suspicions are removed. That detector is in the end perfect too. <span class="bad">Each pair sees exactly what it saw in its own execution, and decides: one pair 0, the other 1.</span>`)};
  const chalks={1:{1:[3,4],2:[3,4],3:[],4:[]},2:{1:[],2:[],3:[1,2],4:[1,2]},3:{1:[3,4],2:[3,4],3:[1,2],4:[1,2]}};
  function show(n){cur=n;
    if(tl)tl(true);else tl=Timeline(svg,{vb:"0 0 520 480",cx:260,cy:240,r0:40,step:27,rings:7,tEnd:7.4,nodes},P=>{live=draw(P,cur)});
    bs.forEach(b=>b.classList.toggle("on",+b.dataset.night===n));
    stand.innerHTML=T.map(k=>{const a=n===3?(k<3?"H":"A"):n===1?"H":"A";return live.includes(k)?`<div>${legChip(k)} ${dual(`chalks ${chalks[n][k].length?legs(chalks[n][k]):"nobody"}, and commits to <b>${word[a]}</b>`,`suspects ${chalks[n][k].length?pn(chalks[n][k]):"nobody"}, and decides <b>${GL[a]}</b>`)}</div>`:`<div>${legChip(k)} ${dual("<i>absent from start</i>","<i>crashed from the start</i>")}</div>`}).join("");
    say.innerHTML=texts[n]}
  bs.forEach(b=>b.onclick=()=>show(+b.dataset.night));show(1);
})();

/* ===== an attendance slate kept when island messengers are delayed ===== */
(function(){
  const tl=$("#windtl"),say=$("#windsay"),bL=$("#windlive"),bD=$("#winddead"),bR=$("#windr"),stat=$("#windstat");
  const N=30,WIND=14,DIE=9;let gen=0,visible=false;
  function simulate(alive){
    const arr=Array.from({length:N+12},()=>0);
    for(let t=0;t<N;t++){if(!alive&&t>=DIE)break;const d=t<WIND?1+rnd(9):2;arr[t+d]++}
    const state=[],waits=[];let g=3;
    for(let t=0;t<N;t++){
      if(t===0){state.push("fine");waits.push(g);continue}
      const had=arr[t]>0;
      if(had){state.push("fine");waits.push(g)}
      else{
        let since=1;while(t-since>=0&&arr[t-since]===0)since++;
        if(since>g){state.push("chalked");g=Math.min(g+2,10);waits.push(g)}
        else{state.push("fine");waits.push(g)}
      }
    }
    return {state,waits,alive};
  }
  function paint(res){
    tl.innerHTML="";
    const head=document.createElement("div");head.className="whead";
    head.innerHTML=`<span>time</span>`+Array.from({length:N},(_,i)=>`<span>${i+1}</span>`).join("");
    tl.appendChild(head);
    const row=document.createElement("div");row.className="wrow";
    row.innerHTML=`<span>${dual("roster mark","detector")}</span>`+res.state.map((s,i)=>`<span class="wcell ${s==="chalked"?"bad":"ok"}">${s==="chalked"?"✗":"✓"}</span>`).join("");
    tl.appendChild(row);
    const wrow=document.createElement("div");wrow.className="wrow";
    wrow.innerHTML=`<span>${dual("wait","timeout")}</span>`+res.waits.map(w=>`<span class="wcell wait">${w}</span>`).join("");
    tl.appendChild(wrow);
  }
  function run(alive){
    const res=simulate(alive);paint(res);
    say.innerHTML=alive?
      dual("The legislator is present. Early delays on the road cause occasional false suspicions; by growing the wait whenever a mark is made, false marks cease entirely once messengers move freely. In the end, the legislator is never chalked.",
           "The process is live. Early delays cause occasional false suspicions; by growing the timeout whenever a false suspicion occurs, false suspicions cease entirely once the network settles. In the end, the process is never suspected."):
      dual("The legislator stepped out at step 9. Once the wait runs out, they are chalked permanently. The attendance slate is eventually perfect.",
           "The process crashed at step 9. Once the timeout expires, it is suspected permanently. The detector is eventually perfect.");
  }
  bL.onclick=()=>run(true);bD.onclick=()=>run(false);bR.onclick=()=>run(true);
  run(true);
})();

REG.start();
})();

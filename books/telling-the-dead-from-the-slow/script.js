"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,mapPairs,Polar}=BOOK;
const {isM,dual,vis,dtext,onReg}=REG;
BOOK.init();


/* the four mercenaries, told apart by colour */
const TC={1:"#e0b84a",2:"#6583d6",3:"#c45448",4:"#9cb648"};
const T=[1,2,3,4],HOLD="#136f9e",ATT="#bf4a26";
const word={H:"hold",A:"attack"},GL={H:"0",A:"1"};   /* hold or attack in the allegory, 0 or 1 in computing */
const WD=x=>dual(word[x],GL[x]);
const tentChip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${TC[k]}"></i>${dual("Tent "+k,"P"+k)}</span>`;
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const list=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" and "+a[a.length-1];
const tents=a=>(a.length>1?"tents ":"tent ")+list(a), pn=a=>list(a.map(k=>"P"+k)), tentsD=a=>dual(tents(a),pn(a));
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

/* ===== the hill, seen from above: one picture reused wherever ravens fly between the tents ===== */
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
    /* a raven u of the way from tent a to tent b, flying round the hill; each direction keeps its own line */
    fly(g,a,b,u){const d=((A[b]-A[a]+540)%360)-180;H.put(g,...H.at(A[a]+d*u,R-(d>0?24:46)*Math.sin(Math.PI*u)))},
    state(k,i,m){const t=H.tent[k].st;t[0].textContent=i;t[1].textContent=i&&(m||i)},
    badge(k,s){const b=H.tent[k].badge;b.setAttribute("opacity",s?1:0);b.t[0].textContent=s||"";b.t[1].textContent=GL[s]||s||""}
  };
  for(const k of [1,2,3,4]){const a=A[k]*Math.PI/180,[x,y]=H.at(A[k]),g=el("g",{class:"site"},sites);H.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:TC[k]},g);dtext(g,{},"T"+k,"P"+k);
    const st=dtext(g,{class:"state halo",x:-48*Math.cos(a),y:-46*Math.sin(a)},"","");
    const badge=el("g",{class:"badge",opacity:0,transform:`translate(${(38*Math.cos(a)).toFixed(1)} ${(34*Math.sin(a)).toFixed(1)})`},g);el("circle",{r:11},badge);badge.t=dtext(badge,{},"","");
    H.tent[k]={x,y,g,st,badge}}
  return H;
}
/* a drawn line for a raven's flight from tent a to tent b, on the same route the tokens fly */
function route(H,a,b,u0=.14,u1=.86){const pts=[];for(let i=0;i<=14;i++){const u=u0+(u1-u0)*i/14,d=((H.A[b]-H.A[a]+540)%360)-180;pts.push(H.at(H.A[a]+d*u,H.R-(d>0?24:46)*Math.sin(Math.PI*u)))}
  return "M"+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L")}
const cross=(g,x,y,r=17)=>el("path",{d:`M${x-r},${y-r} L${x+r},${y+r} M${x-r},${y+r} L${x+r},${y-r}`,stroke:"#1c1512","stroke-width":5,fill:"none"},g);

/* the cover, in computing: four processes, their inputs, one crashed, messages in transit */
(function(){
  const H=Hill($("#coversvg")),inp={1:"A",2:"H",3:"A",4:"A"},t=H.tent[3];
  [1,2,3,4].forEach(k=>H.badge(k,inp[k]));t.g.classList.add("out");
  el("path",{d:`M${t.x-17},${t.y-17} L${t.x+17},${t.y+17} M${t.x-17},${t.y+17} L${t.x+17},${t.y-17}`,stroke:"#1c1512","stroke-width":5,fill:"none"},H.over);
  [[1,2,.5],[4,1,.5],[2,4,.45],[1,4,.4]].forEach(([a,b,u])=>{const g=H.token(TC[a],inp[a]);g.setAttribute("opacity",1);H.fly(g,a,b,u)});
})();

/* ===== a slate that may be wrong, in two ways ===== */
(function(){
  const H=Hill($("#slatesvg")),say=$("#slatesay"),rows=$("#slaterows"),bR=$("#slatereveal"),bN=$("#slatenew");
  const K=[2,3,4];let truth,mark,shown,extra;
  function deal(){do{truth={};K.forEach(k=>truth[k]=["fine","slow","dead"][rnd(3)])}while(!K.some(k=>truth[k]!=="fine"));
    mark={};K.forEach(k=>mark[k]=false);shown=false;(extra||[]).forEach(e=>e.remove());extra=[];
    T.forEach(k=>{H.tent[k].g.classList.remove("out");H.state(k,"");H.badge(k,"")});H.tent[1].g.classList.add("turn");H.state(1,"you");
    bR.disabled=false;paint();
    say.innerHTML=dual("Tent 1's man has had no bird from some tents. Which of them are dead? Chalk the ones you think are, then reveal the night.","P1 has had no message from some processes. Which of them have crashed? Mark the ones you think have, then reveal the execution.")}
  const bird=k=>truth[k]==="fine"?dual("a bird came in","a message came in"):dual("no bird yet","no message yet");
  function paint(){
    rows.innerHTML=K.map(k=>`<div class="srow">${tentChip(k)}<span class="sb">${bird(k)}</span><button class="btn alt" data-k="${k}" ${shown?"disabled":""}>${mark[k]?dual("Rub out","Remove"):dual("Chalk","Suspect")}</button><span class="sv" id="sv${k}"></span></div>`).join("");
    $$("button[data-k]",rows).forEach(b=>b.onclick=()=>{const k=+b.dataset.k;mark[k]=!mark[k];H.badge(k,mark[k]?"✗":"");paint()});
    if(shown)K.forEach(k=>{const dead=truth[k]==="dead",m=mark[k],slow=truth[k]==="slow";$("#sv"+k).innerHTML=
      dead&&m?dual("<span class='ok'>Right.</span> Dead, and chalked.","<span class='ok'>Right.</span> Crashed, and suspected."):
      dead&&!m?dual("<span class='bad'>Not yet.</span> Dead, and the row is clean.","<span class='bad'>Not yet.</span> Crashed, and not suspected."):
      m?dual("<span class='bad'>Wrong.</span> Alive"+(slow?", its bird only slow":"")+", and chalked.","<span class='bad'>Wrong.</span> Alive"+(slow?", its message only slow":"")+", and suspected."):
      dual("<span class='ok'>Right.</span> Alive, and the row is clean.","<span class='ok'>Right.</span> Alive, and not suspected.")})}
  bR.onclick=()=>{shown=true;bR.disabled=true;
    K.forEach(k=>{if(truth[k]==="dead"){H.tent[k].g.classList.add("out");H.state(k,"dead","crashed");extra.push(cross(H.over,H.tent[k].x,H.tent[k].y))}
      else if(truth[k]==="slow"){const g=H.token(TC[k],"");g.setAttribute("opacity",1);H.fly(g,k,1,.45);const [px,py]=H.at(H.A[k]+(((H.A[1]-H.A[k]+540)%360)-180)*.45,H.R-24*Math.sin(Math.PI*.45));
        const t=dtext(H.over,{class:"lab halo",x:px+(k===3?-4:6),y:py+30},"in a pine","delayed");extra.push(g,...t);H.state(k,"alive")}
      else H.state(k,"alive")});
    paint();
    const missed=K.filter(k=>truth[k]==="dead"&&!mark[k]).length,wrong=K.filter(k=>truth[k]!=="dead"&&mark[k]).length;
    say.innerHTML=!missed&&!wrong?dual("No mistake this time. But from where tent 1 sits, a dead man and a slow bird look the same, so a slate can only guess.","No mistake this time. But from where P1 sits, a crashed process and a slow message look the same, so a detector can only guess."):
      dual(`This slate went wrong ${missed?"by leaving "+missed+" dead "+(missed>1?"men":"man")+" clean":""}${missed&&wrong?" and ":""}${wrong?"by chalking "+wrong+" living "+(wrong>1?"men":"man"):""}. <b>Those are the only two ways to go wrong.</b>`,
        `This detector went wrong ${missed?"by leaving "+missed+" crashed "+(missed>1?"processes":"process")+" unsuspected":""}${missed&&wrong?" and ":""}${wrong?"by suspecting "+wrong+" live "+(wrong>1?"processes":"process"):""}. <b>Those are the only two ways to go wrong.</b>`)};
  bN.onclick=deal;deal();
})();

/* ===== copying marks: a second slate, rewritten by every bird ===== */
(function(){
  const rows=$("#copyrows"),say=$("#copysay"),bG=$("#copygo"),bR=$("#copyr");
  /* tent 4 is dead from dusk. Only tent 1 chalks it. Early on, tents 1 and 3 chalk a living man by mistake. */
  const LIVE=[1,2,3];
  const slate=(p,r)=>r<=2?({1:[2,4],2:[],3:[1]})[p]:({1:[4],2:[],3:[]})[p];
  let r,copy,order;
  const L=(a,b)=>isM()?b:a;
  function reset(){r=0;copy={};LIVE.forEach(p=>copy[p]=new Set());order={};paint();bG.disabled=false;
    say.innerHTML=dual("Tent 4 is dead. Of the three living men, only tent 1 has chalked it. Send a round of birds: every living man sends the marks on the slate to every tent.","P4 has crashed. Of the three live processes, only P1 has suspected it. Send a round of messages: every live process sends the suspicions on its list to every process.")}
  const marks=s=>s.size?[...s].sort().map(k=>tentChip(k)).join(""):"<i>none</i>";
  function paint(){
    rows.innerHTML=`<div class="chead"><span></span><span>${dual("the slate says","the list says")}</span><span>${dual("the copy holds","the copy holds")}</span><span>${dual("birds taken in, in order","messages received, in order")}</span></div>`+
      LIVE.map(p=>`<div class="crow">${tentChip(p)}<span data-l="${L("the slate says","the list says")}">${r===0?"<i>nothing sent yet</i>":marks(new Set(slate(p,r)))}</span><span data-l="the copy holds">${marks(copy[p])}</span><span data-l="${L("birds in","messages in")}">${order[p]?order[p].map(q=>dual("from "+q,"from P"+q)).join(", "):"<i>none yet</i>"}</span></div>`).join("")+
      `<div class="crow dead"><span>${tentChip(4)}</span><span>${dual("killed","crashed")}</span><span></span><span>${dual("sends nothing","sends nothing")}</span></div>`}
  bG.onclick=()=>{r++;
    LIVE.forEach(p=>{order[p]=shuffle(LIVE);order[p].forEach(q=>{const c=copy[p];slate(q,r).forEach(k=>c.add(k));c.delete(q)})});
    paint();
    const all4=LIVE.every(p=>copy[p].has(4)),w=LIVE.some(p=>copy[p].has(2)||copy[p].has(1)||copy[p].has(3));
    say.innerHTML=dual(`Round ${r}. Each man added the marks of every bird taken in, and rubbed out the mark against the tent the bird came from.`+
      (all4?` <b>Tent 4 is chalked in every copy,</b> and no bird from tent 4 will ever come to rub it out.`:"")+
      (r<3?(w?" Some copies still hold a mark against a living man. That is only the slates' mistake, passed on, and any bird from that man rubs it out.":""):
        " The slates are right about the living now. Every copy holds tent 4 and nobody else: the copy is only as wrong as the slates it was copied from, and it rights itself when they do."),
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
  const R=strongRun,H=Hill($("#strongsvg")),side=$("#strongside"),svg=H.svg;
  const m=el("marker",{id:"strong-k",markerWidth:9,markerHeight:9,refX:7.5,refY:3.2,orient:"auto"},el("defs",{},svg));el("path",{d:"M0,0 L7.5,3.2 L0,6.4 z",fill:"#1c1512"},m);
  const arrows={};
  for(let r=1;r<=4;r++){arrows[r]=[];const hs=R.snaps[r].heard;for(const p in hs)hs[p].forEach(q=>{if(q!=+p)arrows[r].push(el("path",{class:"gr-arrow fade",d:route(H,q,+p),"marker-end":"url(#strong-k)"},H.under))})}
  H.state(2,"spared","spared");
  const deadMark=cross(H.over,H.tent[4].x,H.tent[4].y);deadMark.setAttribute("opacity",0);
  const on=(e,v)=>e.classList.toggle("on",!!v);
  const rowCell=(V,P,k)=>{const v=V[k],was=P&&P[k];return `<span class="tc ${v?"f":""} ${v&&!was?"new":""} ${!v&&was?"gone":""}">${v?dual(v,GL[v]):"–"}</span>`};
  const word2={A:"attack",H:"hold"};
  function card(p,i,snapI){
    const S=R.snaps[snapI],P=snapI>0?R.snaps[snapI-1]:null,gone=p===4&&i>=1,V=S.V[p];
    const head=`<h5>${tentChip(p)}<span>${gone?dual("killed","crashed"):p===2?dual("never chalked","never suspected"):"alive"}</span></h5>`;
    const cells=`<div class="tally">${T.map(k=>rowCell(V,P&&P.V[p],k)).join("")}</div>`;
    const idx=`<div class="tidx"><span>1</span><span>2</span><span>3</span><span>4</span></div>`;
    const chk=i===5&&!gone?`<div class="chk"><b>${(x=>dual("commits to "+word2[x],"decides "+GL[x]))(T.map(k=>V[k]).find(Boolean))}</b></div>`:`<div class="chk">${gone?"sends nothing more":""}</div>`;
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
    const when=r=>r===0?dual("killed before sending anything","crashed before sending anything"):r<4?dual(`killed in round ${r}`,`crashed in round ${r}`):dual("killed while comparing","crashed while comparing");
    out.innerHTML=`<div class="chead t"><span>${dual("tent","process")}</span><span>${dual("saw","input")}</span><span>fate</span><span>${dual("final sheet","final vector")}</span><span>${dual("commits to","decides")}</span></div>`+
      T.map(p=>{const d=dies[p]!=null,V=R.V[p];
        return `<div class="crow t${d?" dead":""}">${tentChip(p)}<span><b>${dual(sight[p],GL[sight[p]])}</b></span><span>${d?when(dies[p]):p===c?dual("alive, never chalked","alive, never suspected"):"alive"}</span>`+
          (d?`<span></span><span>–</span>`:`<span><div class="tally">${T.map(k=>`<span class="tc ${V[k]?"f":""}">${V[k]?dual(V[k],GL[V[k]]):"–"}</span>`).join("")}</div></span><span><b>${WD(R.commit[p])}</b></span>`)+`</div>`}).join("");
    const same=tallies.size===1,one=ans.size===1,seen=[...ans].every(a=>Object.values(sight).includes(a));
    say.innerHTML=dual(`${n?cap(tents(dead))+(n>1?" are":" is")+" killed.":"Nobody is killed."} Tent ${c} lives and is never chalked, and every other living man may be chalked by anyone, over and over. `+
      `<span class="${same?"ok":"bad"}">${same?"Every living man ends with the same sheet.":"The sheets differ."}</span> `+
      `<span class="${one&&seen?"ok":"bad"}">${one&&seen?"All commit to "+word[[...ans][0]]+", an answer someone sighted.":"The answers differ."}</span>`,
      `${n?cap(pn(dead))+(n>1?" crash.":" crashes."):"Nobody crashes."} P${c} stays correct and is never suspected, and every other correct process may be suspected by anyone, over and over. `+
      `<span class="${same?"ok":"bad"}">${same?"Every correct process ends with the same vector.":"The vectors differ."}</span> `+
      `<span class="${one&&seen?"ok":"bad"}">${one&&seen?"All decide "+GL[[...ans][0]]+", a value some process had as input.":"The decisions differ."}</span>`);
  }
  btns.forEach(b=>b.onclick=()=>go(+b.dataset.dead));go(1);
})();

/* ===== rounds by turns ===== */
(function(){
  const rows=$("#turnrows"),log=$("#turnlog"),say=$("#turnsay"),bN=$("#turnnext"),bs=$$("[data-kill]"),bR=$("#turnr");
  let st=null;
  const word2=v=>`<b>${WD(v)}</b>`,L=(a,b)=>isM()?b:a;
  function paint(owner){
    rows.innerHTML=`<div class="chead t2"><span>${dual("tent","process")}</span><span>estimate</span><span>${dual("taken up in round","adopted in round")}</span><span></span></div>`+
      T.map(k=>{const live=st.live.includes(k),own=owner===k;
        return `<div class="crow t2${live?"":" dead"}${own?" owner":""}">${tentChip(k)}<span data-l="estimate">${word2(st.est[k])}</span><span data-l="${L("taken up in round","adopted in round")}">${st.ts[k]||dual("its sighting","its input")}</span><span>${!live?dual("killed","crashed"):st.commit?dual("commits to "+word[st.commit],"decides "+GL[st.commit]):own?dual("owner of this round","coordinator of this round"):""}</span></div>`}).join("")}
  function start(nDead){const ks=shuffle(T),sight={};T.forEach(k=>sight[k]=rnd(2)?"A":"H");
    st=newNight(ks.slice(nDead).sort(),sight);log.innerHTML="";bN.disabled=false;bR.hidden=false;paint(null);
    say.innerHTML=dual(`${nDead?(nDead>1?"Two men are":"One man is")+" killed.":"All four live."} For the first two rounds the slates are wrong: a man may chalk a round's owner who lives. From round 3 they are right. Take a round.`,
      `${nDead?(nDead>1?"Two processes crash.":"One process crashes."):"All four run."} For the first two rounds the detectors are wrong: a process may suspect a round's coordinator that is correct. From round 3 they are right. Take a round.`)}
  const ev=(h,cls="")=>{const d=document.createElement("div");d.className="e "+cls;d.innerHTML=h;log.prepend(d);while(log.children.length>14)log.lastChild.remove()};
  bN.onclick=()=>{
    if(!st)return;const o=playRound(st,st.r>=2);paint(o.owner);
    const own=o.owner,H=dual(`<b>Round ${o.r}</b> belongs to tent ${own}. `,`<b>Round ${o.r}</b> belongs to P${own}. `);
    if(o.kind==="deadowner"){ev(H+dual(`Tent ${own} is dead. Every man chalks it in the end, and the round comes to nothing.`,`P${own} has crashed. Every process suspects it in the end, and the round comes to nothing.`),"bad");say.innerHTML=dual("A dead owner costs one round. Failing is always safe, and the next round begins with the next tent.","A crashed coordinator costs one round. Failing is always safe, and the next round begins with the next process.");return}
    if(o.kind==="stuck"){ev(H+dual(`The owner must wait for three estimates, and only two men live. It waits for ever.`,`The coordinator must wait for three estimates, and only two processes are correct. It waits for ever.`),"bad");bN.disabled=true;
      say.innerHTML=dual("Nobody can commit, and nobody commits to anything wrong. <b>With two of the four killed, this arrangement waits for ever.</b>","Nobody can decide, and nobody decides anything wrong. <b>With two of the four crashed, this algorithm waits for ever.</b>");return}
    const how=dual(o.best===0?`the sighting of tent ${o.pick}, since none has been taken up in any round yet`:`the one taken up most recently, in round ${o.best}, by tent ${o.pick}`,o.best===0?`the input of P${o.pick}, since none has been adopted in any round yet`:`the one adopted most recently, in round ${o.best}, by P${o.pick}`);
    const others=T.filter(k=>st.live.includes(k)&&k!==own);
    const chalked=others.filter(k=>!o.reply[k]),taking=others.filter(k=>o.reply[k]);
    const sI=chalked.length?`${cap(tents(chalked))} ${chalked.length>1?"have":"has"} chalked the owner and answer${chalked.length>1?"":"s"} <i>not agreed</i>${taking.length?"; "+tents(taking)+" take"+(taking.length>1?"":"s")+" it up and answer"+(taking.length>1?"":"s")+" <i>agreed</i>":""}. `:`Every man takes it up and answers <i>agreed</i>. `;
    const sM=chalked.length?`${cap(pn(chalked))} ${chalked.length>1?"suspect":"suspects"} the coordinator and answer${chalked.length>1?"":"s"} <i>nack</i>${taking.length?"; "+pn(taking)+" adopt"+(taking.length>1?"":"s")+" it and answer"+(taking.length>1?"":"s")+" <i>ack</i>":""}. `:`Every process adopts it and answers <i>ack</i>. `;
    let h=H+dual(`Tent ${own} gathers three estimates, from ${tents(o.gather)}, and takes `,`P${own} gathers three estimates, from ${pn(o.gather)}, and takes `)+how+`: ${word2(o.e)}. `+dual("It sends it to every tent. ","It sends it to every process. ")+dual(sI,sM);
    h+=dual(`The owner waits for the first three replies, from ${tents(o.three.slice().sort())}. `,`The coordinator waits for the first three replies, from ${pn(o.three.slice().sort())}. `);
    if(o.ok){ev(h+dual("<span class='ok'>All three say agreed: the parting bird goes out.</span>","<span class='ok'>All three say ack: the decision message goes out.</span>"),"good");bN.disabled=true;paint(own);
      say.innerHTML=dual(`Everyone who lives takes in the parting bird, sends it on, and commits to <b>${word[o.e]}</b>.`+(st.sight&&Object.values(st.sight).includes(o.e)?" Someone sighted it.":"")+` Nobody commits to anything else, in this round or in any later one: three men took up this answer, and any three out of four share a man with them.`,
        `Every correct process receives the decision message, sends it on, and decides <b>${GL[o.e]}</b>.`+(st.sight&&Object.values(st.sight).includes(o.e)?" Some process had it as input.":"")+` Nobody decides anything else, in this round or in any later one: three processes adopted this value, and any three out of four share a process with them.`);paint(own)}
    else{ev(h+dual("<span class='bad'>One says not agreed: the round comes to nothing.</span>","<span class='bad'>One says nack: the round comes to nothing.</span>"),"bad");
      say.innerHTML=o.calm?dual("The round failed.","The round failed."):dual("The round failed because a slate chalked a living owner. The chalk can cost time. It can never cost agreement.","The round failed because a detector suspected a correct coordinator. The suspicion can cost time. It can never cost agreement.")}
  };
  bs.forEach(b=>b.onclick=()=>start(+b.dataset.kill));
  bR.onclick=()=>{st=null;rows.innerHTML="";log.innerHTML="";bN.disabled=true;bR.hidden=true;say.innerHTML=dual("Choose a night.","Choose an execution.")};
  bN.disabled=true;bR.hidden=true;onReg.push(()=>{if(st)paint(null)});
})();

/* ===== the three nights that split the four ===== */
(function(){
  const nodes={1:[225,"T1",TC[1],"P1"],2:[135,"T2",TC[2],"P2"],3:[315,"T3",TC[3],"P3"],4:[45,"T4",TC[4],"P4"]},svg=$("#halfsvg"),stand=$("#halfstand"),say=$("#halfsay"),bs=$$("[data-night]");
  const defs=[];
  function draw(n){
    const P=Polar(svg,{vb:"0 0 520 480",cx:260,cy:240,r0:40,step:27,rings:7,tEnd:7.4,nodes});
    const spokes=$$(".st-spoke",svg);
    const dead=n===1?[3,4]:n===2?[1,2]:[];
    dead.forEach(k=>{const [x,y]=P.pt(k,1);spokes[k-1].setAttribute("x2",x);spokes[k-1].setAttribute("y2",y);cross(P.over,x,y,12)});
    const live=T.filter(k=>!dead.includes(k)),ans={1:"H",2:"H",3:"A",4:"A"};
    const dot=(k,t,fill,txt)=>{const g=P.event(k,t,fill,10);g.style.cursor="default";g.label.remove();const lb=dtext(g,{},txt||"",GL[txt]||txt||"");if(fill!=="#fffaf0")lb.forEach(e=>e.style.fill="#fff");return g};
    const pair=n===1?[1,2]:n===2?[3,4]:null;
    live.forEach(k=>dot(k,1.4,"#fffaf0",n===3?ans[k]:n===1?"H":"A"));
    const exch=(a,b)=>{P.slip(a,1.4,b,2.6,12);P.slip(b,1.4,a,2.6,12)};
    if(n===1)exch(1,2);else if(n===2)exch(3,4);else{exch(1,2);exch(3,4);
      [[1,3],[2,4],[3,1],[4,2]].forEach(([a,b])=>{const s=P.slip(a,1.4,b,7.2,14);s.classList.add("hi");s.style.strokeDasharray="6 4";s.style.strokeWidth=3.4})}
    live.forEach(k=>{const v=n===2?"A":n===1?"H":ans[k];dot(k,4.2,v==="H"?HOLD:ATT,v)});
    return live;
  }
  const texts={
    1:dual(`<b>First night.</b> All four sighted hold. Tents 3 and 4 are dead from dusk, and tents 1 and 2 chalk them all night. That slate is in the end perfect: it chalks the dead, and nobody else. Tents 1 and 2 commit, within some time, and to hold, since only hold was sighted.`,
       `<b>First execution.</b> All four have input 0. P3 and P4 crash at the start, and P1 and P2 suspect them all along. That detector is in the end perfect: it suspects the crashed, and nobody else. P1 and P2 decide, within some time, and decide 0, since only 0 was an input.`),
    2:dual(`<b>Second night.</b> The same with the pairs and the answers swapped: all four sighted attack, tents 1 and 2 are dead from dusk, and tents 3 and 4 commit to attack within some time.`,
       `<b>Second execution.</b> The same with the pairs and the values swapped: all four have input 1, P1 and P2 crash at the start, and P3 and P4 decide 1 within some time.`),
    3:dual(`<b>Third night.</b> Tents 1 and 2 sighted hold, tents 3 and 4 attack. <span class="ok">Nobody dies.</span> Every bird between the two pairs sits in the pines until after both pairs have committed, and until then each pair chalks the other. Afterwards all the birds arrive and all the chalk is rubbed out. That slate is in the end perfect too. <span class="bad">Each pair sees exactly what it saw on its own night, and commits: one pair to hold, the other to attack.</span>`,
       `<b>Third execution.</b> P1 and P2 have input 0, P3 and P4 have input 1. <span class="ok">Nobody crashes.</span> Every message between the two pairs is delayed until after both pairs have decided, and until then each pair suspects the other. Afterwards all the messages arrive and all the suspicions are removed. That detector is in the end perfect too. <span class="bad">Each pair sees exactly what it saw in its own execution, and decides: one pair 0, the other 1.</span>`)};
  const chalks={1:{1:[3,4],2:[3,4],3:[],4:[]},2:{1:[],2:[],3:[1,2],4:[1,2]},3:{1:[3,4],2:[3,4],3:[1,2],4:[1,2]}};
  function show(n){
    const live=draw(n);bs.forEach(b=>b.classList.toggle("on",+b.dataset.night===n));
    stand.innerHTML=T.map(k=>{const a=n===3?(k<3?"H":"A"):n===1?"H":"A";return live.includes(k)?`<div>${tentChip(k)} ${dual(`chalks ${chalks[n][k].length?tents(chalks[n][k]):"nobody"}, and commits to <b>${word[a]}</b>`,`suspects ${chalks[n][k].length?pn(chalks[n][k]):"nobody"}, and decides <b>${GL[a]}</b>`)}</div>`:`<div>${tentChip(k)} ${dual("<i>dead from dusk</i>","<i>crashed from the start</i>")}</div>`}).join("");
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
    say.innerHTML=dual("A man at one tent watches another tent for a sign of life. Every man sends a bird to every tent, again and again, to say the sender is alive. Watch a night go by.","One process watches another for a sign of life. Every process sends a heartbeat to every other process, again and again, to say it is alive. Watch an execution go by.")}
  async function run(alive){
    const g=++gen,S=simulate(alive);bL.disabled=bD.disabled=true;bR.hidden=true;tl.innerHTML=Array.from({length:N},(_, i)=>`<span class="wc${i<WIND?" wd":""}"></span>`).join("");
    for(let i=0;i<N;i++){
      while(!visible&&!reduce){await sleep(300);if(g!==gen)return}
      if(g!==gen)return;
      const c=S.cells[i];tl.children[i].outerHTML=paintCell(c,i);
      stat.innerHTML=`<span><b>${c.g}</b>${dual("glass, in ticks","timeout, in ticks")}</span><span><b>${c.wrong}</b>${dual("mistaken marks","false suspicions")}</span><span><b>${dual(c.chalked?"chalked":"clean",c.chalked?"suspected":"not suspected")}</b>${dual("the row now","the entry now")}</span>`;
      await sleep(170)}
    if(g!==gen)return;
    say.innerHTML=alive?dual(`The man lives, and the slate was wrong ${S.wrong} time${S.wrong===1?"":"s"} while the wind blew. Each late bird rubbed the mark out and lengthened the glass. Once the wind dropped and every bird came within a glass, the mark never stood again: <b>in the end, nobody living is chalked.</b>`,
      `The process is alive, and the detector was wrong ${S.wrong} time${S.wrong===1?"":"s"} while the network was unstable. Each late heartbeat removed the suspicion and lengthened the timeout. Once the network settled and every heartbeat came within the timeout, the suspicion never stood again: <b>in the end, no correct process is suspected.</b>`):
      dual(`The man was killed. Birds already in the air still came in, and each rubbed the mark out. Then none came, and the mark stayed: <b>a dead man's birds stop, so the dead man is chalked for good.</b>`,
      `The process crashed. Heartbeats already in transit still arrived, and each removed the suspicion. Then none came, and the suspicion stayed: <b>a crashed process's heartbeats stop, so it is suspected for good.</b>`);
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
REG.start();
})();

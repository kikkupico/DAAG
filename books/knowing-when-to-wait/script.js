"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,Polar}=BOOK;
const {isM,dual,vis,dtext,onReg}=REG;
BOOK.init();

/* ===== the scholars' coast from above: the body of the island, its libraries each in a clearing, the stoa on the eastern shore ===== */
function Coast(svg,o={}){
  const n=o.n||8,W=440,H=340;
  svg.innerHTML="";svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
  el("path",{d:"M52 86C70 40 150 22 214 34c40 8 56-14 104 0 52 16 86 60 76 112-6 34 14 52-4 96-20 50-92 72-150 62-36-6-50 14-96 2C86 292 40 262 40 204c0-34-8-70 12-118z",fill:"#efe6cf",stroke:"#1c1512","stroke-width":5,class:"i"},svg);
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

/* cover:start */
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · MONOTONE OR NOT?","CALM");
  const lx=134,rx=388;
  el("line",{x1:260,x2:260,y1:86,y2:392,stroke:P.line,"stroke-width":1.4,"stroke-dasharray":"3 5"},g);
  chip(g,lx,72,"no coordination needed",{m:1,s:10,k:P.blue,c:P.blue,f:P.blueL,w:600});chip(g,rx,72,"must wait for everyone",{m:1,s:10,k:P.red,c:P.red,f:P.redL,w:600});
  /* left: a deadlock ring only ever gains edges */
  const ra=[[lx,126],[lx-50,200],[lx+50,200]],nm=["A","B","C"];
  const rp=[[0,2],[2,1],[1,0]].map(([a,b],k)=>link(g,ra[a][0]+(ra[b][0]-ra[a][0])*.25,ra[a][1]+(ra[b][1]-ra[a][1])*.25,ra[b][0]-(ra[b][0]-ra[a][0])*.25,ra[b][1]-(ra[b][1]-ra[a][1])*.25,{c:"blue",w:2,bend:-14}));
  rp.forEach((p,k)=>packet(g,p,{c:"blue",dur:2.4,delay:k*.5,r:3.2}));
  ra.forEach(([x,y],k)=>node(g,x,y,15,nm[k],{k:P.blue,c:P.blue,f:P.blueL,s:12}));
  T(g,lx,236,"is there a cycle?",{s:10.5,c:P.ink,w:600});T(g,lx,252,"once found, found forever",{s:9.5,m:1,c:P.blue});
  /* right: garbage is the absence of a path */
  const gp=[[rx-68,150],[rx,150],[rx+68,150]],gn=["root","X","Y"];
  link(g,gp[0][0]+18,150,gp[1][0]-17,150,{c:"ink",w:1.8});
  link(g,gp[1][0]+17,150,gp[2][0]-17,150,{c:"red",w:1.6,dash:"4 4",head:false});
  T(g,rx+34,134,"?",{s:16,w:700,c:P.red});
  gp.forEach(([x,y],k)=>node(g,x,y,k==0?17:15,gn[k],{s:k==0?9.5:12,k:k==2?P.red:P.ink,c:k==2?P.red:P.ink,f:k==2?P.redL:"#fff"}));
  T(g,rx,196,"is Y unreachable?",{s:10.5,c:P.ink,w:600});T(g,rx,212,"a message may still be in flight",{s:9.5,m:1,c:P.red});
  chip(g,rx,238,"wait: has everyone reported?",{m:1,s:8.5,pad:10,k:P.red,c:P.red,f:"#fff"});
  /* growth of answers */
  const by=372;
  [20,36,52,68,84].forEach((h,k)=>{el("rect",{x:lx-70+k*30,y:by-h,width:22,height:h,rx:4,fill:P.blueL,stroke:P.blue,"stroke-width":1.3},g)});
    T(g,lx,by+16,"answers only ever grow",{s:10,m:1,c:P.blue});
  [20,36,52].forEach((h,k)=>el("rect",{x:rx-70+k*30,y:by-h,width:22,height:h,rx:4,fill:P.redL,stroke:P.red,"stroke-width":1.3},g));
  el("rect",{x:rx+20,y:by-28,width:22,height:28,rx:4,fill:"#fff",stroke:P.red,"stroke-width":1.3,"stroke-dasharray":"4 3"},g);
  el("rect",{x:rx+20,y:by-52,width:22,height:24,rx:4,fill:"none",stroke:P.red,"stroke-width":1,"stroke-dasharray":"2 3",opacity:.5},g);
  link(g,rx+31,by-58,rx+31,by-34,{c:"red",w:1.6});
  T(g,rx+31,by-72,"taken back",{s:8.5,m:1,c:P.red});
  T(g,rx,by+16,"a new fact retracts an answer",{s:10,m:1,c:P.red});
  chip(g,W/2,H-60,"coordination-free  ⇔  monotonic",{m:1,s:12,pad:30,k:P.ink,sw:1.5,f:P.bg,w:600});
  T(g,W/2,H-28,"not · none · every · only · highest · count  ⇒  wait",{s:9.5,m:1,c:P.faint});
};
COVERS.draw("#coversvg",COVER);COVERS.mount(COVER);
/* cover:end */

/* ===== questions as rules on the facts heard so far ===== */
const anyCopy=S=>S.some(f=>f[0]==="copy"),noClaim=S=>!S.some(f=>f[0]==="claim");
(function(){
  const L=[["copy","Library 2 has made a copy","Node 2 has made a copy"],["note","a reader is waiting","a client is waiting"],["claim","Library 3 has claimed the work","Node 3 has claimed the item"],["copy","Library 4 has made a copy","Node 4 has made a copy"]];
  let order,n,rows,took;const say=$("#gsay");
  const paint=()=>{$("#gtbl").innerHTML=`<tr><th>${dual("Letter","Message")}</th>`+"<th><i>Has any copy been made?</i></th><th><i>Has no one claimed this?</i></th></tr>"+rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]?"yes":"not yet known"}</td><td${r[3]?' class="was"':""}>${r[2]?"yes":"no"}</td></tr>`).join("")};
  function reset(){order=[0,1,2,3].sort(()=>Math.random()-.5);n=0;took=false;rows=[["none yet",anyCopy([]),noClaim([]),false]];paint();say.innerHTML=dual("No letter has arrived. A library that answers the second question now is guessing.","No message has arrived. A machine that answers the second question now is guessing.")}
  $("#gnext").onclick=()=>{if(n>=4)return;n++;const S=order.slice(0,n).map(i=>L[i]),a=anyCopy(S),b=noClaim(S),p=rows[rows.length-1];
    if(p[1]&&!a)throw new Error("a growing question was taken back");
    if(p[2]&&!b){p[3]=true;took=true}
    rows.push([dual(L[order[n-1]][1],L[order[n-1]][2]),a,b,false]);paint();
    say.innerHTML=p[2]&&!b?`<span class="bad">The yes to the second question must be taken back.</span>`:n>=4?dual(`All four letters are in. The first question was never taken back${took?", in this order or any other":""}.`,`All four messages are in. The first question was never taken back${took?", in this order or any other":""}.`):a&&!p[1]?dual(`<span class="ok">Yes to the first question</span>, and nothing still on the road can change it.`,`<span class="ok">Yes to the first question</span>, and nothing still in transit can change it.`):"Nothing changes."};
  $("#greset").onclick=reset;reset();
})();

/* ===== the waiting chain and the unwanted work: links pooled as the libraries tell ===== */
(function(){
  const wait=[["A","B"],["B","C"],["C","A"]],cites=[["the canon","X"],["X","Y"],null];let told;
  const reach=(E,from,to)=>{const seen=new Set([from]),q=[from];while(q.length){const u=q.pop();E.forEach(([a,b])=>{if(a===u&&!seen.has(b)){seen.add(b);q.push(b)}})}return seen.has(to)};
  let ringFound;
  function paint(){const W=wait.filter((e,i)=>told[i]),Ci=cites.filter((e,i)=>e&&told[i]);
    const ring=W.some(([a,b])=>reach(W,b,a));if(ringFound&&!ring)throw new Error("a ring was unfound");ringFound=ring;
    $("#ring").innerHTML=wait.map(([a,b],i)=>`<li>${dual("Library "+(i+1),"Node "+(i+1))}: ${told[i]?`<b>${a} waits on ${b}</b>`:"has not told"}</li>`).join("");
    $("#ringsay").innerHTML=ring?`<span class="ok">A ring: nobody in it can go on.</span> No later news can undo it.`:"No ring found yet. That may change, and only one way.";
    const cited=reach(Ci,"the canon","Y");
    $("#cite").innerHTML=cites.map((e,i)=>`<li>${dual("Library "+(i+1),"Node "+(i+1))}: ${e?(told[i]?`<b>${dual(`${e[0]} cites ${e[1]}`,`${e[0]==="the canon"?"the root":e[0]} references ${e[1]}`)}</b>`:"has not told"):dual("holds Y, and knows of nothing citing it","holds Y, and knows of no reference to it")}</li>`).join("");
    $("#citesay").innerHTML=cited?dual(`<span class="bad">The canon reaches Y after all.</span> Had Library 3 thrown Y away on what it had heard, Y would be gone.`,`<span class="bad">The root reaches Y after all.</span> Had Node 3 collected Y on what it had heard, Y would be gone.`):dual(`Nothing Library 3 has heard cites Y. It <i>looks</i> unwanted, and only hearing from everyone could make that sure.`,`Nothing Node 3 has heard references Y. It <i>looks</i> unreachable, and only hearing from everyone could make that sure.`)}
  function reset(){told=[false,false,false];ringFound=false;paint()}
  [1,2,3].forEach(i=>$("#tell"+i).onclick=()=>{told[i-1]=true;paint()});$("#tellreset").onclick=reset;reset();
})();

/* ===== the roster ===== */
(function(){
  let roster=true,n;const TOTAL=4,say=$("#rsay");
  const paint=()=>{$("#rn").textContent=n;$("#rof").textContent=roster?TOTAL:"?";
    say.innerHTML=roster?(n>=TOTAL?dual(`All ${TOTAL} libraries on the roster have been heard from. <span class="ok">Yes: every shelf is empty.</span>`,`All ${TOTAL} machines on the roster have been heard from. <span class="ok">Yes: every data set is empty.</span>`):dual(`${n} of ${TOTAL} heard from. The librarian waits for the other ${TOTAL-n}.`,`${n} of ${TOTAL} heard from. The machine waits for the other ${TOTAL-n}.`))
      :dual(`${n} ${n===1?"name":"names"} heard. With no roster the librarian cannot tell the day the last name came in from a day it has not. <span class="bad">No answer can be given.</span>`,`${n} ${n===1?"name":"names"} heard. With no roster the machine cannot tell the moment the last name came in from a moment it has not. <span class="bad">No answer can be given.</span>`)};
  function reset(){n=0;paint()}
  $("#rnext").onclick=()=>{if(n<TOTAL)n++;paint()};$("#rreset").onclick=reset;
  seg($("#rmode"),[["1",dual("The librarian has a roster","The machine has a roster")],["0",dual("The librarian has no roster","The machine has no roster")]],"1",v=>{roster=v==="1";reset()});reset();
})();

/* ===== waiting only once: the reading list ===== */
(function(){
  const TM={"The Winds":"item A","The Tides":"item B"},tt=t=>dual(`<i>${t}</i>`,`<i>${TM[t]}</i>`);
  const N=[{k:"add",t:"The Winds"},{k:"strike",t:"The Winds"},{k:"add",t:"The Tides"},{k:"close",names:[0,1,2]}];
  let manifest=true,got,closedWith;const box=$("#nshelves"),say=$("#nsay");
  const list=ids=>{const add=new Set(),struck=new Set();ids.forEach(i=>{if(N[i].k==="add")add.add(N[i].t);if(N[i].k==="strike")struck.add(N[i].t)});return [...add].filter(t=>!struck.has(t))};
  const full=list([0,1,2]).join();
  function paint(){const have=got.filter(i=>i<3);
    /* with a manifest the library closes when every notice it names has come; without, the moment the closing notice comes */
    if(closedWith===null&&got.includes(3)&&(!manifest||N[3].names.every(i=>got.includes(i))))closedWith=manifest?have.slice():got.slice(0,got.indexOf(3)).filter(i=>i<3);
    const held=got.includes(3)&&closedWith===null;
    box.innerHTML=`<div class="shelf"><h5>${dual("Arrived at the library","Arrived at the service")}</h5>${got.map(i=>`<span class="it${i===3&&held?" held":""}">${N[i].k==="close"?dual("closing notice"+(manifest?", naming three notices":""),"checkout message"+(manifest?", naming three messages":"")):`${dual(N[i].k,N[i].k==="strike"?"remove":N[i].k)} ${tt(N[i].t)}`}</span>`).join("")||'<span class="it none">nothing yet</span>'}</div>`+
      `<div class="shelf"><h5>${closedWith?dual("The list as closed","The cart as checked out"):dual("The list so far","The cart so far")}</h5>${(closedWith?list(closedWith):list(have)).map(t=>`<span class="it">${tt(t)}</span>`).join("")||`<span class="it none">${dual("no titles","no items")}</span>`}</div>`;
    if(closedWith){const ok=list(closedWith).join()===full;
      if(manifest&&!ok)throw new Error("a list closed short with a manifest");
      say.innerHTML=ok?dual(`The list is closed with everything the reader sent. <span class="ok">Only <i>The Tides</i> is fetched.</span>`,`The cart is checked out with everything the client sent. <span class="ok">Only <i>item B</i> is fetched.</span>`):dual(`<span class="bad">The list was closed the moment the closing notice came, without what was still on the road.</span> ${list(closedWith).length?"The library fetches <i>"+list(closedWith).join("</i> and <i>")+"</i>.":"The library fetches nothing."}`,`<span class="bad">The cart was checked out the moment the checkout message came, without what was still in transit.</span> ${list(closedWith).length?"The service fetches <i>"+list(closedWith).map(t=>TM[t]).join("</i> and <i>")+"</i>.":"The service fetches nothing."}`)}
    else{const k=N[3].names.filter(i=>!got.includes(i)).length;say.innerHTML=held?dual(`The closing notice names three notices, and ${k} of them ${k===1?"has":"have"} not come. The library holds it, and waits for those and for no one else.`,`The checkout message names three messages, and ${k} of them ${k===1?"has":"have"} not come. The service holds it, and waits for those and for no one else.`):got.length?dual("The library takes the notice in. Adds and strikes need no waiting, in any order.","The service takes the message in. Adds and removes need no waiting, in any order."):"Nothing has arrived."}}
  function reset(){got=[];closedWith=null;paint()}
  [0,1,2,3].forEach(i=>$("#n"+i).onclick=()=>{if(!got.includes(i)){got.push(i);paint()}});
  seg($("#nmode"),[["1",dual("The closing notice carries a manifest","The checkout message carries a manifest")],["0","It carries none"]],"1",v=>{manifest=v==="1";reset()});
  $("#nreset").onclick=reset;reset();
})();

/* ===== the oracle at the fork from above, and the counsel. Each question is a rule on a small set of possible facts;
   the page tries every set of facts and every larger set, and sends the group south only if no answer is ever lost. ===== */
(function(){
  const svg=$("#hallsvg");svg.setAttribute("viewBox","0 0 440 400");
  dtext(svg,{x:220,y:26,class:"lab",style:"font-size:14px"},"north · to live as legislators","north · needs coordination");
  dtext(svg,{x:220,y:388,class:"lab",style:"font-size:14px"},"south · to live as scholars","south · coordination-free");
  /* the road forks north of the sanctuary, one branch to each arm; south it runs down the stem */
  el("path",{class:"way",d:"M220 150V96L120 46M220 96L320 46"},svg);el("path",{class:"way",d:"M220 250V366"},svg);
  el("circle",{cx:220,cy:200,r:56,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{class:"i",cx:204,cy:196,r:21,fill:"#8a9550",stroke:"#1c1512","stroke-width":2.5},svg);el("rect",{class:"i",x:230,y:186,width:26,height:22,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":2.5},svg);
  const dn=el("rect",{class:"door",x:202,y:136,width:36,height:20},svg),ds=el("rect",{class:"door",x:202,y:244,width:36,height:20},svg);
  dtext(svg,{x:220,y:236,class:"lab",style:"font-size:13px"},"the oracle","the sort");
  const tok=el("g",{class:"tok",opacity:0},svg);el("circle",{r:13,fill:"#e0b84a",stroke:"#1c1512","stroke-width":2.5},tok);el("text",{},tok).textContent="?";
  const paths=E=>{const r={};E.forEach(([a,b])=>{(r[a]=r[a]||new Set()).add(b)});return (from,to)=>{const seen=new Set([from]),q=[from];while(q.length){const u=q.pop();(r[u]||[]).forEach(b=>{if(!seen.has(b)){seen.add(b);q.push(b)}})}return seen.has(to)}};
  /* each: the possible facts, and the answers a set of facts supports */
  const Q=[
    {q:"Has at least one copy of this work been made?",m:"Has at least one copy of this item been made?",U:["copy 1","copy 2","copy 3"],f:S=>S.length?["yes"]:[]},
    {q:"Is this every copy that has been made?",m:"Is this every copy that has been made?",U:["copy 1","copy 2","copy 3","copy 4"],f:S=>S.includes("copy 4")?[]:["yes"]},
    {q:"Is there a ring of libraries each waiting on the next?",m:"Is there a ring of machines each waiting on the next?",U:["A>B","B>C","C>A","C>D"],f:S=>{const E=S.map(x=>x.split(">")),p=paths(E);return E.some(([a,b])=>p(b,a))?["yes"]:[]}},
    {q:"Is this work cited by nothing the canon reaches?",m:"Is this object unreachable from every root?",UM:["root>X","X>Y","Z>Y"],U:["canon>X","X>Y","Z>Y"],f:S=>paths(S.map(x=>x.split(">")))("canon","Y")?[]:["yes"]},
    {q:"Which titles are on a catalogue that is only added to?",m:"Which items are in a set that is only added to?",UM:["add item A","add item B","add item C"],U:["add The Winds","add The Tides","add The Stars"],f:S=>S.map(x=>x.slice(4))},
    {q:"Which of two editions has the larger tally?",m:"Which of two versions has the larger timestamp?",UM:["version at noon","version at dusk"],U:["edition at noon","edition at dusk"],f:S=>S.includes("edition at dusk")?["dusk or later"]:S.length?["noon or later"]:[],grow:(a,b)=>a.length===0||b.join()===a.join()||b[0]==="dusk or later"},
    {q:"Has the last copy been lent to no one else?",m:"Has the last copy been sold to no one else?",UM:["sold at node 1","sold at node 2"],U:["lent at Library 1","lent at Library 2"],f:S=>S.length?[]:["yes"]},
    {q:"Is the shelf empty at every library?",m:"Is the data empty at every machine?",UM:["data at node 1","data at node 2","data at node 3"],U:["a scroll at Library 1","a scroll at Library 2","a scroll at Library 3"],f:S=>S.length?[]:["yes"]}];
  const subsets=U=>{const out=[];for(let m=0;m<1<<U.length;m++)out.push(U.filter((u,i)=>m>>i&1));return out};
  Q.forEach(o=>{const all=subsets(o.U);let tried=0,lost=null;
    for(const S of all)for(const T of all){if(!S.every(s=>T.includes(s)))continue;tried++;
      const a=o.f(S),b=o.f(T),ok=o.grow?o.grow(a,b):a.every(v=>b.includes(v));
      if(!ok&&!lost)lost=[S,T]}
    o.tried=tried;o.lost=lost});
  const box=$("#qs"),say=$("#qsay");
  box.innerHTML=Q.map((o,i)=>`<button data-i="${i}" aria-pressed="false">${dual(o.q,o.m)}</button>`).join("");
  $$("button",box).forEach(bt=>bt.onclick=async()=>{const o=Q[+bt.dataset.i],south=!o.lost;
    $$("button",box).forEach(b=>b.setAttribute("aria-pressed",b===bt));dn.classList.remove("on");ds.classList.remove("on");
    tok.setAttribute("opacity",1);tok.setAttribute("transform","translate(220 200)");
    const um=a=>a.map(x=>o.UM?o.UM[o.U.indexOf(x)]:x.replace("Library","node"));
    say.innerHTML=south?dual(`Tried on ${o.tried} pairs of a set of facts and a larger one: no answer given on the smaller was ever lost on the larger. It only grows. <span class="ok">The oracle sends the group south, to live as scholars.</span>`,`Tried on ${o.tried} pairs of a set of facts and a larger one: no answer given on the smaller was ever lost on the larger. It only grows. <span class="ok">It is coordination-free.</span>`)
      :dual(`Tried on ${o.tried} pairs. On <i>${o.lost[0].join(", ")||"no facts"}</i> the answer is yes; add <i>${o.lost[1].filter(v=>!o.lost[0].includes(v)).join(", ")}</i> and it is lost. It rests on an absence. <span class="bad">The oracle sends the group north, to live as legislators.</span>`,`Tried on ${o.tried} pairs. On <i>${um(o.lost[0]).join(", ")||"no facts"}</i> the answer is yes; add <i>${um(o.lost[1].filter(v=>!o.lost[0].includes(v))).join(", ")}</i> and it is lost. It rests on an absence. <span class="bad">It needs coordination.</span>`);
    await tween(900,u=>tok.setAttribute("transform",`translate(220 ${200+(south?1:-1)*110*u})`));(south?ds:dn).classList.add("on")});
})();

REG.start();
})();

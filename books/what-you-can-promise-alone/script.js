"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,Polar,Unfold}=BOOK;
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
    note(i,s,m){C.lib[i].s[0].textContent=s;C.lib[i].s[1].textContent=m===undefined?s:m},
    way(a,b,cls="way"){const [x1,y1]=C.pos(a),[x2,y2]=C.pos(b);return el("path",{class:cls,d:`M${x1} ${y1}L${x2} ${y2}`},under)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:11,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph;return g},
    run(g,a,b,u){const [x1,y1]=C.pos(a),[x2,y2]=C.pos(b);C.put(g,x1+(x2-x1)*u,y1+(y2-y1)*u)}
  };
  if(o.stoa!==false){el("rect",{x:C.stoa[0]-9,y:C.stoa[1]-26,width:18,height:52,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3},svg);
    el("text",{x:C.stoa[0]+2,y:C.stoa[1]+44,class:"lab halo",style:"font-size:12px"},svg).textContent="the stoa";}
  for(let i=0;i<n;i++){const [x,y]=AT[i],g=el("g",{class:"lib"},libs);C.put(g,x,y);
    el("circle",{class:"ring",r:24},g);const b=el("circle",{class:"b",r:17,fill:"#fffaf0"},g);el("text",{},g).textContent=i+1;
    const s=dtext(g,{class:"lab halo",y:33,style:"font-size:12px;font-style:normal;font-family:var(--sans);font-weight:400"},"","");
    C.lib.push({x,y,g,b,s})}
  return C;
}
const seg=(box,opts,cur,fn)=>{box.innerHTML=opts.map(([v,t])=>`<button data-v="${v}" aria-pressed="${String(v)===String(cur)}">${t}</button>`).join("");
  $$("button",box).forEach(bt=>bt.onclick=()=>{$$("button",box).forEach(x=>x.setAttribute("aria-pressed",x===bt));fn(bt.dataset.v)})};
const oneIn=p=>p<=0?"none":p>=.95?"nearly all":p>=.095?`1 in ${Math.round(1/p)}`:`1 in ${Math.round(1/p).toLocaleString("en")}`;

const shelfBox=(name,rows,foot="")=>`<div class="shelf"><h5>${name}</h5>${rows.join("")}${foot?`<div class="shown">${foot}</div>`:""}</div>`;
const it=(t,c="")=>`<span class="it${c?" "+c:""}">${t}</span>`;

/* cover:start */
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · WHAT A REPLICA CAN PROMISE ALONE","HAT");
  /* two replicas, cut off from one another */
  const A=[130,150],B=[390,150];
  el("path",{d:"M260 74l-12 26l24 26l-24 26l24 26l-24 26l12 24",fill:"none",stroke:P.red,"stroke-width":2.4,"stroke-linejoin":"round"},g);
  chip(g,260,64,"partition",{m:1,s:9,k:P.red,c:P.red,f:P.redL});
  node(g,A[0],A[1],24,"R1",{s:12,halo:P.blueL});node(g,B[0],B[1],24,"R2",{s:12,halo:P.blueL});
  chip(g,A[0],86,"T1: w(x) w(y) commit ✓",{m:1,s:9,k:P.blue,c:P.blue,f:"#fff"});chip(g,B[0],86,"T2: r(x) r(y) commit ✓",{m:1,s:9,k:P.blue,c:P.blue,f:"#fff"});
  [A,B].forEach(([x,y],k)=>{const p=link(g,x,102,x,y-28,{c:"blue",w:1.5});packet(g,p,{c:"blue",dur:1.8,delay:k*.4})});
  T(g,A[0],196,"always answers, never waits",{s:9.5,m:1,c:P.mute});T(g,B[0],196,"always answers, never waits",{s:9.5,m:1,c:P.mute});
  /* the three tiers */
  const tiers=[
   ["KEPT BY ANY REPLICA ALONE","green",["Read Committed","Monotonic Atomic View","Repeatable Reads","Monotonic Reads"]],
   ["KEPT IF THE CLIENT STAYS WITH ONE REPLICA","blue",["Read Your Writes","PRAM","Causal Consistency"]],
   ["KEPT BY NO REPLICA ALONE","red",["Lost Update","Write Skew","Linearizability"]]];
  tiers.forEach(([t,c,items],k)=>{const y=224+k*76;
    el("rect",{x:26,y,width:W-52,height:66,rx:14,fill:P[c+"L"],opacity:.55},g);el("rect",{x:26,y,width:6,height:66,rx:3,fill:P[c]},g);
    T(g,46,y+15,t,{a:"start",s:9,m:1,c:P[c],w:700});
    let x=46;items.forEach(s=>{const ch=chip(g,x,y+43,s,{a:"start",s:9.5,k:P[c],c:P.ink,f:"#fff"});x+=ch.w+8});
    if(k<2){const ar=el("path",{d:`M${W-48} ${y+70}l0 4`,stroke:P.faint},g)}});
  T(g,W-44,224+15,"✓",{a:"end",s:14,w:700,c:P.green});T(g,W-44,224+76+15,"✓",{a:"end",s:14,w:700,c:P.blue});T(g,W-44,224+152+15,"✗",{a:"end",s:14,w:700,c:P.red});
  chip(g,W/2,H-30,"high availability  ·  144 consistency and isolation levels sorted by what they need",{m:1,s:8.5,pad:18,k:P.line,c:P.mute});
};
COVERS.draw("#coversvg",COVER);COVERS.mount(COVER);
/* cover:end */

/* ===== the cord: a library shows a correction of a set only when the whole set has arrived ===== */
(function(){
  const box=$("#cshelves"),say=$("#csay");let cord=true,yHere,seen;
  /* what each library may show: with a cord, the new copy only once both corrections are in place */
  const shows=w=>{const here=w==="X"?true:yHere;return cord?(here&&yHere?"new":"old"):(here?"new":"old")};
  const paint=()=>{box.innerHTML=shelfBox(dual("Library 1 · the work X","Replica 1 · item X"),[it(dual("correction to X, arrived","write to X, arrived"),cord&&!yHere?"held":""),it("the old X","old")],`${dual("Shows a reader","Shows a client")}: <b>${shows("X")==="new"?dual("X corrected","X as written"):"the old X"}</b>`)+
    shelfBox(dual("Library 2 · the work Y","Replica 2 · item Y"),[yHere?it(dual("correction to Y, arrived","write to Y, arrived")):it(dual("correction to Y, still on the road","write to Y, still in transit"),"none"),it("the old Y","old")],`${dual("Shows a reader","Shows a client")}: <b>${shows("Y")==="new"?dual("Y corrected","Y as written"):"the old Y"}</b>`)};
  function reset(){yHere=false;seen={};paint();say.innerHTML=dual("The reader has asked for nothing yet.","The client has read nothing yet.")}
  const ask=w=>{seen[w]=shows(w);paint();const both=seen.X&&seen.Y;
    say.innerHTML=dual(`The reader is shown ${seen[w]==="new"?w+" corrected":"the old "+w}.`+(both?(seen.X!==seen.Y?` <span class="bad">One work corrected and the other old: half of what was made together.</span>`:` <span class="ok">Both ${seen.X==="new"?"corrected":"old"}: the state ${seen.X==="new"?"after":"before"} the set, never between.</span>`):""),`The client is shown ${seen[w]==="new"?w+" as written":"the old "+w}.`+(both?(seen.X!==seen.Y?` <span class="bad">One item as written and the other old: half of what was written together.</span>`:` <span class="ok">Both ${seen.X==="new"?"as written":"old"}: the state ${seen.X==="new"?"after":"before"} the transaction, never between.</span>`):""))};
  $("#cx").onclick=()=>ask("X");$("#cy").onclick=()=>ask("Y");
  $("#carr").onclick=()=>{yHere=true;seen={};paint();say.innerHTML=dual("The correction to Y is at Library 2, and the couriers' notes tell both libraries that the set is complete.","The write to Y is at replica 2, and the messages tell both replicas that the transaction is complete.")};
  seg($("#cmode"),[["1",dual("One cord round both corrections","One manifest for both writes")],["0",dual("No cord","No manifest")]],"1",v=>{cord=v==="1";reset()});
  $("#creset").onclick=reset;reset();
})();

/* ===== the floor: every library shows only the edition it knows every library holds ===== */
(function(){
  const box=$("#fshelves"),say=$("#fsay");let h=[1,1,1],floor=1,newest=1;
  const paint=()=>{const f=Math.min(...h);if(f<floor)throw new Error("the floor fell");floor=f;
    box.innerHTML=h.map((e,i)=>shelfBox(dual(`Library ${i+1}`,`Replica ${i+1}`),[it(dual(`holds up to edition ${e}`,`holds up to version ${e}`),e>floor?"held":"")],`${dual("Shows a reader","Shows a client")}: <b>${dual("edition","version")} ${floor}</b>`)).join("");
    $("#ffloor").textContent=floor;$("#fnew").textContent=newest};
  $("#fwrite").onclick=()=>{h[0]=++newest;const was=floor;paint();say.innerHTML=dual(`Edition ${newest} is at Library 1 only. Every library still shows edition ${floor}: the floor has not moved, and a reader may be ${newest-floor} ${newest-floor>1?"editions":"edition"} behind.`,`Version ${newest} is at replica 1 only. Every replica still shows version ${floor}: the stable version has not moved, and a client may be ${newest-floor} ${newest-floor>1?"versions":"version"} behind.`)};
  const courier=i=>{const was=floor;h[i]=h[0];paint();say.innerHTML=floor>was?dual(`Library ${i+1} now holds up to edition ${h[i]}. Edition ${floor} is everywhere, so <span class="ok">the floor rises to ${floor}</span> at every library.`,`Replica ${i+1} now holds up to version ${h[i]}. Version ${floor} is everywhere, so <span class="ok">the stable version rises to ${floor}</span> at every replica.`):dual(`Library ${i+1} now holds up to edition ${h[i]}. The floor stays at ${floor} until every library has it.`,`Replica ${i+1} now holds up to version ${h[i]}. The stable version stays at ${floor} until every replica has it.`)};
  $("#fc2").onclick=()=>courier(1);$("#fc3").onclick=()=>courier(2);paint();
})();

/* ===== staying with one library ===== */
(function(){
  const C=Coast($("#onesvg"),{n:2,stoa:false}),say=$("#onesay");let left=false;
  C.way(0,1,"way cut");C.note(0,"the old copy","the old value");C.note(1,"the old copy","the old value");
  /* computing: the client's visits on a timeline that slides as it runs, with the two replicas partitioned throughout */
  const L=Unfold(C.svg,{nodes:{C:[0,"C","#8fb3d9","C"],R1:[0,"1","#f6eed6","R1"],R2:[0,"2","#f6eed6","R2"]},span:5,slide:true});
  /* the partition lasts throughout, so its band spans whatever stretch is in view */
  const part=L.band(0,5,"R1 and R2 partitioned",false,true);
  const visit=(k,lab,back)=>{const t=L.clock.t;L.msg("C",k,t,t+.6,lab);L.msg(k,"C",t+.6,t+1.2,back);L.setT(t+1.3);part.t0=Math.max(0,L.clock.t-5*.86);part.t1=part.t0+5;L.render()};L.state("R1","old value");L.state("R2","old value");L.setT(.2);
  $("#oleave").onclick=()=>{left=true;visit("R1","write","ack");L.setT(L.clock.t-.7);L.state("R1","the write");L.setT(L.clock.t+.7);C.fill(0,"#e0b84a");C.note(0,"the correction","the write");say.innerHTML=dual("The correction is on Library 1's shelves. No courier can carry it to Library 2.","The write is at replica 1. No message can carry it to replica 2.")};
  const back=i=>{if(!left){say.innerHTML=dual("Leave a correction at Library 1 first.","Write at replica 1 first.");return}
    [0,1].forEach(k=>C.lib[k].g.classList.toggle("mark",k===i));visit("R"+(i+1),"read",i===0?"the write":"old value");L.state("C",i===0?"finds its write":"write missing");
    say.innerHTML=i===0?dual(`Library 1 answers from its shelves. <span class="ok">The reader finds the correction.</span>`,`Replica 1 answers from its own data. <span class="ok">The client finds its write.</span>`):dual(`Library 2 must answer, from what it holds. <span class="bad">The reader's own correction is missing.</span> The librarian cannot find what nobody has brought.`,`Replica 2 must answer, from what it holds. <span class="bad">The client's own write is missing.</span> The replica cannot return what nobody has sent it.`)};
  $("#oback1").onclick=()=>back(0);$("#oback2").onclick=()=>back(1);
})();

/* ===== a reply is held for its letter ===== */
(function(){
  const box=$("#lshelves"),say=$("#lsay");let hold=true,rep,let_;
  const shown=()=>{const s=[];if(let_)s.push("the letter");if(rep&&(let_||!hold))s.push("the reply");return s};
  const LM=x=>dual(x,x.replace("letter","message")),paint=()=>{const s=shown();box.innerHTML=shelfBox(dual("Arrived at the reader's library","Arrived at the client's replica"),[let_?it(LM("the letter")):it(LM("the letter: not yet"),"none"),rep?it("the reply",hold&&!let_?"held":""):it("the reply: not yet","none")])+
    shelfBox(dual("What a reader is shown","What a client is shown"),s.length?s.map(x=>it(LM(x))):[it(dual("neither, and whatever else the library holds","neither, and whatever else the replica holds"),"none")]);
    say.innerHTML=!rep&&!let_?"Neither has arrived.":s.includes("the reply")&&!s.includes("the letter")?dual(`<span class="bad">The reader reads an answer to a question not yet seen.</span>`,`<span class="bad">The client reads an answer to a message it has not yet seen.</span>`):rep&&!let_?dual("The reply is held back. The librarian still answers every other request.","The reply is held back. The replica still answers every other request."):s.length===2?dual(`<span class="ok">The letter, and then the reply.</span>`,`<span class="ok">The message, and then the reply.</span>`):dual("The letter is shown. The reply has not arrived.","The message is shown. The reply has not arrived.")};
  function reset(){rep=let_=false;paint()}
  $("#lrep").onclick=()=>{rep=true;paint()};$("#llet").onclick=()=>{let_=true;paint()};
  seg($("#lmode"),[["1",dual("Replies are held for their letters","Replies are held for their messages")],["0","Everything is shown as it arrives"]],"1",v=>{hold=v==="1";reset()});
  $("#lreset").onclick=reset;reset();
})();

/* ===== the last copy ===== */
(function(){
  const box=$("#bshelves"),say=$("#bsay");let stopped=true,note,out;
  const paint=()=>box.innerHTML=[0,1].map(i=>shelfBox(dual(`Library ${i+1}`,`Replica ${i+1}`),[it(dual(`noted here: ${note[i]} ${note[i]===1?"copy":"copies"} on the shelf`,`counted here: ${note[i]} ${note[i]===1?"unit":"units"} available`),note[i]?"":"old")],out[i]?dual("A reader has borrowed the copy here.","A client has bought the unit here."):"")).join("");
  function reset(){note=[1,1];out=[false,false];paint();say.textContent="Nobody has asked yet."}
  const borrow=i=>{if(note[i]<1){say.innerHTML=dual(`Library ${i+1} has it noted as lent, and refuses. <span class="ok">One copy, one borrower.</span>`,`Replica ${i+1} has it counted as sold, and refuses. <span class="ok">One unit, one buyer.</span>`);return}
    note[i]=0;out[i]=true;if(!stopped)note[1-i]=0;paint();const n=out.filter(Boolean).length;
    say.innerHTML=n>1?dual(`Library ${i+1} finds one copy noted and lends it. <span class="bad">Two readers now hold the one copy.</span> Each librarian was right by what could be seen.`,`Replica ${i+1} finds one unit counted and sells it. <span class="bad">Two clients now hold the one unit.</span> Each replica was right by what it could see.`):dual(`Library ${i+1} finds one copy noted, lends it, and notes none.`+(stopped?" No courier carries the news.":" A courier carries the news to the other library."),`Replica ${i+1} finds one unit counted, sells it, and counts none.`+(stopped?" No message carries the news.":" A message carries the news to the other replica."))};
  $("#b1").onclick=()=>borrow(0);$("#b2").onclick=()=>borrow(1);
  seg($("#bmode"),[["1",dual("The couriers are stopped","The messages are stopped")],["0",dual("The couriers are running","The messages are running")]],"1",v=>{stopped=v==="1";reset()});
  $("#breset").onclick=reset;reset();
})();

/* ===== the latest edition: any bound can be outlasted ===== */
(function(){
  const D={day:1,week:7,month:30},N={day:"a day",week:"a week",month:"a month"};let bound="day",stop="week";
  const paint=()=>{const broken=D[stop]>D[bound];
    $("#tsay").innerHTML=dual(`On the last day of the stoppage Library 2 must still answer, with a copy ${N[stop]==="a day"?"a day":N[stop]} behind. `+(broken?`<span class="bad">That is more than ${N[bound]}: the promise is broken.</span>`:`That is within ${N[bound]}, this time. A longer stoppage would break it.`),`On the last day of the partition replica 2 must still answer, with a version ${N[stop]} behind. `+(broken?`<span class="bad">That is more than ${N[bound]}: the promise is broken.</span>`:`That is within ${N[bound]}, this time. A longer partition would break it.`))};
  seg($("#tbound"),[["day","a day behind"],["week","a week behind"],["month","a month behind"]],bound,v=>{bound=v;paint()});
  seg($("#tstop"),[["day","a day"],["week","a week"],["month","a month"]],stop,v=>{stop=v;paint()});paint();
})();

REG.start();
})();

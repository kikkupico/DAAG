/* ===== the scholars' coast from above: the body of the island, its libraries each in a clearing, the stoa on the eastern shore ===== */
function Coast(svg,o={}){
  const n=o.n||8,W=440,H=340;
  svg.innerHTML="";svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
  el("path",{d:"M52 86C70 40 150 22 214 34c40 8 56-14 104 0 52 16 86 60 76 112-6 34 14 52-4 96-20 50-92 72-150 62-36-6-50 14-96 2C86 292 40 262 40 204c0-34-8-70 12-118z",fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
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

const shelfBox=(name,rows,foot="")=>`<div class="shelf"><h5>${name}</h5>${rows.join("")}${foot?`<div class="shown">${foot}</div>`:""}</div>`;
const it=(t,c="")=>`<span class="it${c?" "+c:""}">${t}</span>`;

/* ===== machines: read your writes across a partition ===== */
(function(){
  let a=0,b=0;const note=$("#mnote"),paint=()=>{$("#mxa").textContent=a;$("#mxb").textContent=b};
  $("#mw").onclick=()=>{a=1;paint();note.textContent="A commits the write. It cannot tell B, and it does not wait to."};
  $("#mra").onclick=()=>{note.innerHTML=`A answers ${a}.`+(a?` <span class="ok">The client reads its own write.</span>`:"")};
  $("#mrb").onclick=()=>{note.innerHTML=`B must answer, and answers ${b}.`+(a!==b?` <span class="bad">The client's own write is missing.</span> B has no way to learn of it.`:"")};
  paint();
})();

/* ===== the cord: a library shows a correction of a set only when the whole set has arrived ===== */
(function(){
  const box=$("#cshelves"),say=$("#csay");let cord=true,yHere,seen;
  /* what each library may show: with a cord, the new copy only once both corrections are in place */
  const shows=w=>{const here=w==="X"?true:yHere;return cord?(here&&yHere?"new":"old"):(here?"new":"old")};
  const paint=()=>{box.innerHTML=shelfBox("Library 1 · the work X",[it("correction to X, arrived",cord&&!yHere?"held":""),it("the old X","old")],`Shows a reader: <b>${shows("X")==="new"?"X corrected":"the old X"}</b>`)+
    shelfBox("Library 2 · the work Y",[yHere?it("correction to Y, arrived"):it("correction to Y, still on the road","none"),it("the old Y","old")],`Shows a reader: <b>${shows("Y")==="new"?"Y corrected":"the old Y"}</b>`)};
  function reset(){yHere=false;seen={};paint();say.textContent="The reader has asked for nothing yet."}
  const ask=w=>{seen[w]=shows(w);paint();const both=seen.X&&seen.Y;
    say.innerHTML=`The reader is shown ${seen[w]==="new"?w+" corrected":"the old "+w}.`+(both?(seen.X!==seen.Y?` <span class="bad">One work corrected and the other old: half of what was made together.</span>`:` <span class="ok">Both ${seen.X==="new"?"corrected":"old"}: the state ${seen.X==="new"?"after":"before"} the set, never between.</span>`):"")};
  $("#cx").onclick=()=>ask("X");$("#cy").onclick=()=>ask("Y");
  $("#carr").onclick=()=>{yHere=true;seen={};paint();say.textContent="The correction to Y is at Library 2, and the couriers' notes tell both libraries that the set is complete."};
  seg($("#cmode"),[["1","One cord round both corrections"],["0","No cord"]],"1",v=>{cord=v==="1";reset()});
  $("#creset").onclick=reset;reset();
})();

/* ===== the floor: every library shows only the edition it knows every library holds ===== */
(function(){
  const box=$("#fshelves"),say=$("#fsay");let h=[1,1,1],floor=1,newest=1;
  const paint=()=>{const f=Math.min(...h);if(f<floor)throw new Error("the floor fell");floor=f;
    box.innerHTML=h.map((e,i)=>shelfBox(`Library ${i+1}`,[it(`holds up to edition ${e}`,e>floor?"held":"")],`Shows a reader: <b>edition ${floor}</b>`)).join("");
    $("#ffloor").textContent=floor;$("#fnew").textContent=newest};
  $("#fwrite").onclick=()=>{h[0]=++newest;const was=floor;paint();say.innerHTML=`Edition ${newest} is at Library 1 only. Every library still shows edition ${floor}: the floor has not moved, and a reader may be ${newest-floor} ${newest-floor>1?"editions":"edition"} behind.`};
  const courier=i=>{const was=floor;h[i]=h[0];paint();say.innerHTML=floor>was?`Library ${i+1} now holds up to edition ${h[i]}. Edition ${floor} is everywhere, so <span class="ok">the floor rises to ${floor}</span> at every library.`:`Library ${i+1} now holds up to edition ${h[i]}. The floor stays at ${floor} until every library has it.`};
  $("#fc2").onclick=()=>courier(1);$("#fc3").onclick=()=>courier(2);paint();
})();

/* ===== keeping to one library ===== */
(function(){
  const C=Coast($("#onesvg"),{n:2,stoa:false}),say=$("#onesay");let left=false;
  C.way(0,1,"way cut");C.note(0,"the old copy");C.note(1,"the old copy");
  $("#oleave").onclick=()=>{left=true;C.fill(0,"#e0b84a");C.note(0,"the correction");say.textContent="The correction is on Library 1's shelves. No courier can carry it to Library 2."};
  const back=i=>{if(!left){say.textContent="Leave a correction at Library 1 first.";return}
    [0,1].forEach(k=>C.lib[k].g.classList.toggle("mark",k===i));
    say.innerHTML=i===0?`Library 1 answers from its shelves. <span class="ok">The reader finds the correction.</span>`:`Library 2 must answer, from what it holds. <span class="bad">The reader's own correction is missing.</span> The librarian cannot find what nobody has brought.`};
  $("#oback1").onclick=()=>back(0);$("#oback2").onclick=()=>back(1);
})();

/* ===== a reply is held for its letter ===== */
(function(){
  const box=$("#lshelves"),say=$("#lsay");let hold=true,rep,let_;
  const shown=()=>{const s=[];if(let_)s.push("the letter");if(rep&&(let_||!hold))s.push("the reply");return s};
  const paint=()=>{const s=shown();box.innerHTML=shelfBox("Arrived at the reader's library",[let_?it("the letter"):it("the letter: not yet","none"),rep?it("the reply",hold&&!let_?"held":""):it("the reply: not yet","none")])+
    shelfBox("What a reader is shown",s.length?s.map(x=>it(x)):[it("neither, and whatever else the library holds","none")]);
    say.innerHTML=!rep&&!let_?"Neither has arrived.":s.includes("the reply")&&!s.includes("the letter")?`<span class="bad">The reader reads an answer to a question not yet seen.</span>`:rep&&!let_?"The reply is held back. The librarian still answers every other request.":s.length===2?`<span class="ok">The letter, and then the reply.</span>`:"The letter is shown. The reply has not arrived."};
  function reset(){rep=let_=false;paint()}
  $("#lrep").onclick=()=>{rep=true;paint()};$("#llet").onclick=()=>{let_=true;paint()};
  seg($("#lmode"),[["1","Replies are held for their letters"],["0","Everything is shown as it arrives"]],"1",v=>{hold=v==="1";reset()});
  $("#lreset").onclick=reset;reset();
})();

/* ===== the last copy ===== */
(function(){
  const box=$("#bshelves"),say=$("#bsay");let stopped=true,note,out;
  const paint=()=>box.innerHTML=[0,1].map(i=>shelfBox(`Library ${i+1}`,[it(`noted here: ${note[i]} ${note[i]===1?"copy":"copies"} on the shelf`,note[i]?"":"old")],out[i]?"A reader has borrowed the copy here.":"")).join("");
  function reset(){note=[1,1];out=[false,false];paint();say.textContent="Nobody has asked yet."}
  const borrow=i=>{if(note[i]<1){say.innerHTML=`Library ${i+1} has it noted as lent, and refuses. <span class="ok">One copy, one borrower.</span>`;return}
    note[i]=0;out[i]=true;if(!stopped)note[1-i]=0;paint();const n=out.filter(Boolean).length;
    say.innerHTML=n>1?`Library ${i+1} finds one copy noted and lends it. <span class="bad">Two readers now hold the one copy.</span> Each librarian was right by what could be seen.`:`Library ${i+1} finds one copy noted, lends it, and notes none.`+(stopped?" No courier carries the news.":" A courier carries the news to the other library.")};
  $("#b1").onclick=()=>borrow(0);$("#b2").onclick=()=>borrow(1);
  seg($("#bmode"),[["1","The couriers are stopped"],["0","The couriers are running"]],"1",v=>{stopped=v==="1";reset()});
  $("#breset").onclick=reset;reset();
})();

/* ===== the latest edition: any bound can be outlasted ===== */
(function(){
  const D={day:1,week:7,month:30},N={day:"a day",week:"a week",month:"a month"};let bound="day",stop="week";
  const paint=()=>{const broken=D[stop]>D[bound];
    $("#tsay").innerHTML=`On the last day of the stoppage Library 2 must still answer, with a copy ${N[stop]==="a day"?"a day":N[stop]} behind. `+(broken?`<span class="bad">That is more than ${N[bound]}: the promise is broken.</span>`:`That is within ${N[bound]}, this time. A longer stoppage would break it.`)};
  seg($("#tbound"),[["day","a day behind"],["week","a week behind"],["month","a month behind"]],bound,v=>{bound=v;paint()});
  seg($("#tstop"),[["day","a day"],["week","a week"],["month","a month"]],stop,v=>{stop=v;paint()});paint();
})();

mapPairs($("#map"),[["A library's reading room","A replica"],["A reader's visit","A transaction"],["The couriers stopped","A network partition"],["Answering alone, from one's own shelves","High availability"],["Keeping to one library","Sticky availability"],["No half-made correction shown","Read committed"],["Corrections bound under one cord","Monotonic atomic view"],["The same answer twice in a visit","Repeatable reads of items and predicates"],["The floor of what every library holds","Reading at a lower bound every replica has"],["Never older than before","Monotonic reads"],["A reader finds their own corrections","Read your writes"],["A reply held for its letter","Writes follow reads"],["Two readers borrow the last copy","Lost update"],["A shelf left bare","Write skew"],["\"This is the latest edition\"","A recency guarantee; linearizability"]]);

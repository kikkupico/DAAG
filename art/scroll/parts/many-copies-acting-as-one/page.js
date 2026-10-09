const HC={1:"#9cb648",2:"#e0b84a",3:"#5b9be0"};
const chip=(t,h)=>`<span class="chip"><i style="background:${HC[h]}"></i>${t}</span>`;
const ANG={1:-90,2:30,3:150};
const NODES={1:[-90,"H1",HC[1]],2:[30,"H2",HC[2]],3:[150,"H3",HC[3]]};

/*LOGIC-START*/
/* ===== the rule of the board, as a checker =====
   An entry is {id, obj, p, i, kind:"enq"|"deq", item, ret, s, e}: which board, which house or loader (p) and
   its place in that one's own sequence (i), an order put on a board or a serving that returned an order,
   and the moment it began and ended by the sun. rt=true asks for the rule of the board (what finished before
   another began comes first); rt=false asks only that each one's own business keeps its own order. */
function lin(ops,rt=true,free=false){
  const n=ops.length,placed=new Array(n).fill(false),q={},seq=[];
  const before=(a,b)=>free?false:rt?a.e<b.s:(a.p===b.p&&a.i<b.i);
  function go(k){
    if(k===n)return true;
    for(let j=0;j<n;j++){if(placed[j])continue;const o=ops[j];
      if(ops.some((x,m)=>!placed[m]&&m!==j&&before(x,o)))continue;
      const Q=q[o.obj]=q[o.obj]||[];
      if(o.kind==="enq"){Q.push(o.item);placed[j]=true;seq.push(o);if(go(k+1))return true;seq.pop();placed[j]=false;Q.pop()}
      else if(Q.length&&Q[0]===o.ret){const h=Q.shift();placed[j]=true;seq.push(o);if(go(k+1))return true;seq.pop();placed[j]=false;Q.unshift(h)}}
    return false}
  const ok=go(0);return {ok,seq:ok?seq.slice():null};
}
/* why a history fails: no single keeper could have produced it at all, or only the sun forbids it */
function verdict(ops){
  if(lin(ops,true).ok)return "ok";
  return lin(ops,true,true).ok?"sun":"keeper";
}
/* is this exact sequence one the rule allows? */
function validSeq(seq,rt=true){
  const q={};
  for(let a=0;a<seq.length;a++)for(let b=a+1;b<seq.length;b++)if(rt&&seq[b].e<seq[a].s)return false;
  for(const o of seq){const Q=q[o.obj]=q[o.obj]||[];
    if(o.kind==="enq")Q.push(o.item);else{if(!Q.length||Q[0]!==o.ret)return false;Q.shift()}}
  return true}
/* tallies, by the rule of Ordering Without Clocks: every entry raises a house's tally, and a slip's arrival lifts it past the slip's number */
function Tally(start){const T={...start};
  return {T,
    local(h){return ++T[h]},
    send(h){return ++T[h]},
    recv(h,v){T[h]=Math.max(T[h],v)+1;return T[h]}}}
/* is there a chain of scroll lines and slips from event a to event b? (events: {id,h,t,from?}) */
function chained(E,a,b){
  const by={};E.forEach(e=>by[e.id]=e);
  const pred=e=>E.filter(x=>x.h===e.h&&x.t<e.t&&!E.some(y=>y.h===e.h&&y.t>x.t&&y.t<e.t)).concat(e.from?[by[e.from]]:[]);
  const seen=new Set();(function f(x){pred(x).forEach(p=>{if(!seen.has(p)){seen.add(p);f(p)}})})(by[b]);
  return seen.has(by[a])}
/* the tablet board of the busy house: slots numbered from 1, a peg at the first number nobody has been given */
function Board(){
  const B={peg:1,slot:{},A:{num:null,put:false},B:{num:null,put:false},L:{peg:null,at:null,took:null},log:[]};
  B.do=(w,a)=>{
    if(a==="take"){B[w].num=B.peg;B.peg++}
    else if(a==="put"){B.slot[B[w].num]=w;B[w].put=true}
    else if(a==="peg"){B.L.peg=B.peg;B.L.at=1}
    else if(a==="look"){const s=B.L.at;if(B.slot[s]){B.L.took=B.slot[s];B.L.from=s;delete B.slot[s]}else if(s+1>=B.L.peg){B.L.peg=B.peg;B.L.at=1}else B.L.at=s+1}
    return B};
  return B}
const aStep=(...xs)=>xs.map(x=>x.split("."));
/* the sequences a set of tablets in slots could stand for: x must stand ahead of y if x's tablet went in before y's clerk took a number */
function meanings(tabs){
  const out=[],k=tabs.length;
  (function perm(cur,rest){if(!rest.length){out.push(cur);return}
    rest.forEach((x,i)=>{const r=rest.filter((_,j)=>j!==i);
      if(r.every(y=>!(y.put<x.take)))perm(cur.concat(x),r)})})([],tabs);
  return out}
/*LOGIC-END*/

/* ===== drawing helpers: a span is a thick stretch of a place's line, a dot marks a moment ===== */
function mark(P,pl,t,fill,label,off=0,rad=12){
  const [x,y]=P.xy(ANG[pl]+off,P.r(t)),g=el("g",{class:"st-ev",transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},P.evs);
  el("circle",{class:"halo2",r:rad+5},g);el("circle",{class:"b",r:rad,fill},g);el("text",{},g).textContent=label;el("circle",{r:rad+8,fill:"transparent"},g);return g}
function band(P,pl,t1,t2,col,off=0,w=8){
  const [x1,y1]=P.xy(ANG[pl]+off,P.r(t1)),[x2,y2]=P.xy(ANG[pl]+off,P.r(t2));
  return el("line",{x1:x1.toFixed(1),y1:y1.toFixed(1),x2:x2.toFixed(1),y2:y2.toFixed(1),stroke:col,"stroke-width":w,"stroke-linecap":"round",opacity:.5},P.under)}

/* ===== machines: two copies of a queue, and the update that may be late ===== */
(function(){
  const A=$("#mcA"),B=$("#mcB"),va=$("b",A),vb=$("b",B),ar=$("#mcArrow"),calls=$("#mcCalls"),vd=$("#mcVerdict"),say=$("#mcSay"),bs=[$("#mcSync"),$("#mcStale"),$("#mcOver")];
  const C=[{upd:2.5,c1:[1,2],c2:[3,4],c3:[5,6]},{upd:7,c1:[1,2],c2:[3,4],c3:[5,6]},{upd:3.5,c1:[1,4],c2:[2,3],c3:[5,6]}];
  const EXPECT=["ok","sun","ok"];
  /* the copies are run by the events' own times; what the dequeue returns comes out of the copy it reached */
  function simulate(n){
    const c=C[n],log=[];let a=[],b=[],res=null;
    const ev=[[c.c1[0],"c1s","Client 1 calls enqueue x at copy A"],[c.c1[1],"c1e","Client 1's call returns"],[c.c2[0],"c2s","Client 2 calls enqueue y at copy B"],[c.c2[1],"c2e","Client 2's call returns"],
      [c.c3[0],"c3s","Client 3 calls dequeue at copy B"],[c.c3[1],"c3e",""],[c.upd,"upd","The update reaches copy B"]].sort((p,q)=>p[0]-q[0]);
    for(const [t,k,tx] of ev){
      if(k==="c1s")a=["x"];else if(k==="c2s")b.push("y");else if(k==="c3s")res=b.shift();else if(k==="upd")b.push("x");
      log.push({t,k,tx:k==="c3e"?"Client 3's call returns "+res:tx,a:[...a],b:[...b]})}
    const ops=[{id:"x",obj:"q",p:1,i:0,kind:"enq",item:"x",s:c.c1[0],e:c.c1[1]},{id:"y",obj:"q",p:2,i:0,kind:"enq",item:"y",s:c.c2[0],e:c.c2[1]},{id:"d",obj:"q",p:3,i:0,kind:"deq",ret:res,s:c.c3[0],e:c.c3[1]}];
    return {log,ops,res,v:verdict(ops)}}
  C.forEach((_,n)=>{if(simulate(n).v!==EXPECT[n])throw new Error("the copies' runs do not match the rule")});
  const txt=q=>q.length?q.join(", "):"empty";
  async function run(n){
    bs.forEach(b=>b.disabled=true);calls.innerHTML=vd.innerHTML="";va.textContent=vb.textContent="empty";ar.textContent="";
    const S=simulate(n);say.textContent="The run begins.";
    for(const L of S.log){
      va.textContent=txt(L.a);vb.textContent=txt(L.b);
      if(L.k==="c1s")ar.textContent="update →";if(L.k==="upd")ar.textContent="";
      A.classList.toggle("on",L.k==="c1s"||L.k==="c1e");B.classList.toggle("on",L.k!=="c1s"&&L.k!=="c1e");
      calls.insertAdjacentHTML("beforeend",`<div class="e">${L.tx}</div>`);await sleep(650)}
    A.classList.remove("on");B.classList.remove("on");
    const lab=o=>o.kind==="enq"?"enqueue "+o.item:"dequeue → "+o.ret;
    if(S.v==="ok"){const q=lin(S.ops,true).seq;vd.innerHTML=`<div class="e good"><b>Yes.</b> One queue could give this, taking the calls in this sequence:</div><div class="seqline">${q.map(o=>`<span class="chip">${lab(o)}</span>`).join(" ")}</div>`;
      say.innerHTML=n===2?`<span class="ok">Allowed.</span> The two enqueues overlapped, so either could go first, and y coming out first is fine.`:`<span class="ok">Allowed.</span> The update arrived in time, and the dequeue returns x.`}
    else{vd.innerHTML=`<div class="e bad"><b>No.</b> The enqueue of x returned before the enqueue of y began, so a single queue would return x first. Here the dequeue returned ${S.res}.</div>`;
      say.innerHTML=`<span class="bad">Not allowed.</span> Client 1 was told its call was done. Client 2 then wrote at a copy that had not heard, and the queue gave the later write first.`}
    bs.forEach(b=>b.disabled=false)}
  bs.forEach((b,n)=>b.onclick=()=>run(n));
})();

/* ===== Arche, seen from above: the same picture as every book on the ring road ===== */
function Isle(svg){
  const cx=235,cy=235,R=165,A={1:-90,2:30,3:150}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:86,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("text",{x:cx,y:cy-8,class:"lab"},svg).textContent="Mount Phyle";
  el("circle",{cx,cy,r:R,fill:"none",stroke:"#b5602c","stroke-width":3,"stroke-dasharray":"3 8"},svg);
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const I={svg,cx,cy,R,A,under,over,house:{},
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:13,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph;return g},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    /* u of the way along the direct stretch from house a to house b; each direction keeps to its own lane */
    road(g,a,b,u){const d=((A[b]-A[a]+540)%360)-180;I.put(g,...I.at(A[a]+d*u,R+(d>0?9:-9)))}
  };
  for(const h of [1,2,3]){const [x,y]=I.at(A[h]),g=el("g",{class:"site"},sites);I.put(g,x,y);el("rect",{x:-25,y:-17,width:50,height:34,rx:5,fill:HC[h]},g);el("text",{},g).textContent="H"+h;I.house[h]={x,y,g}}
  return I;
}

/* ===== scroll: the goatherd's morning, with tallies worked out by the rule ===== */
(function(){
  const I=Isle($("#goatsvg")),side=$("#goatside"),S=Tally({1:2,2:0,3:0}),st=[];
  const orders={1:null,2:null},board=[];
  const snap=()=>st.push({T:{...S.T},o:{...orders},board:board.map(b=>({...b}))});
  snap();                                                         // 0 the morning
  const n1=S.send(1);orders[1]=n1;snap();                         // 1 House 1 sends its order, its third entry
  S.recv(3,n1);board.push({h:1,n:n1});const n2=S.send(3);snap();  // 2 House 3 enters it and sends word back
  S.recv(1,n2);snap();                                            // 3 the confirmation arrives
  snap();                                                         // 4 the goatherd: no slip, no change
  const n3=S.send(2);orders[2]=n3;snap();                         // 5 House 2 orders at noon
  S.recv(3,n3);board.push({h:2,n:n3});snap();                     // 6 House 3 enters it
  $("#gt1").textContent=n1;$("#gt2").textContent=n2;$("#gt3").textContent=n3;
  if(!(n3<n1))throw new Error("House 2's order should carry the lower tally");
  const first=[...board].sort((a,b)=>a.n-b.n||a.h-b.h)[0].h;
  const toks=[[1,3,n1,{1:.35,2:.88}],[3,1,n2,{2:.2,3:.88}],[2,3,n3,{5:.35,6:.88}]].map(([a,b,n,plan])=>({a,b,plan,g:I.token(HC[a],n),u:.1,run:0,end:Math.max(...Object.keys(plan))}));
  const gt=I.token("#fffaf0","G"),H1=I.house[1],H2=I.house[2];
  const over=u=>{const v=1-u;I.put(gt,v*v*H1.x+2*u*v*I.cx+u*u*H2.x,v*v*H1.y+2*u*v*I.cy+u*u*H2.y)};let gr=0;
  function card(h,s){const X=st[s];let body;
    if(h===3)body=X.board.length?X.board.map(b=>chip(`House ${b.h}'s order · ${b.n}`,b.h)).join("")+(s===6?`<br><b>serves House ${first} first</b>`:""):"board empty";
    else body=X.o[h]!=null?`order sent, tally ${X.o[h]}`:h===1?"two entries so far":"no entries, no slips";
    return `<div class="hc${s===6&&h===first?" in":""}"><h5>House ${h}<span>tally ${X.T[h]}</span></h5><div class="chk">${body}</div></div>`}
  scrolly($("#goat"),s=>{
    side.innerHTML=[1,2,3].map(h=>card(h,s)).join("");
    toks.forEach(k=>{const u=k.plan[s],id=++k.run;
      if(u==null){k.g.setAttribute("opacity",0);k.u=s>k.end?.9:.1;I.road(k.g,k.a,k.b,k.u);return}
      k.g.setAttribute("opacity",1);const u0=k.u;tween(800,e=>{if(k.run!==id)return;k.u=u0+(u-u0)*e;I.road(k.g,k.a,k.b,k.u)})});
    const id=++gr;if(s===4){over(.12);gt.setAttribute("opacity",1);tween(1500,e=>{if(gr===id)over(.12+.76*e)})}else gt.setAttribute("opacity",0);
  });
})();

/* ===== before, or overlap: choose two orders ===== */
(function(){
  const svg=$("#spansvg"),say=$("#spansay");
  const P=Polar(svg,{vb:"0 0 640 470",cx:320,cy:290,r0:44,step:22,rings:10,tEnd:10.4,note:[14,24],nodes:NODES});
  const O=[{k:"A",pl:1,s:1.6,e:4.2,name:"House 1's order"},{k:"B",pl:2,s:3.0,e:5.4,name:"House 2's first order"},{k:"C",pl:2,s:7.0,e:9.4,name:"House 2's second order"}];
  O.forEach(o=>{band(P,o.pl,o.s,o.e,HC[o.pl]);mark(P,o.pl,o.e,HC[o.pl],"",0,6);o.g=mark(P,o.pl,o.s,HC[o.pl],o.k)});
  let sel=[];
  O.forEach(o=>button(o.g,o.name,()=>{if(sel.length===2||sel.includes(o))sel=[];sel.push(o);O.forEach(x=>x.g.classList.toggle("sel",sel.includes(x)));
    if(sel.length<2){say.innerHTML=`<b>${o.name}.</b> Now choose a second order.`;return}
    let [a,b]=sel;if(b.e<a.s)[a,b]=[b,a];
    say.innerHTML=a.e<b.s?`<b>${a.name}</b> was over before <b>${b.name}</b> began, so it came <span class="ok">before</span>.`
      :`<b>${a.name}</b> and <b>${b.name}</b> <span class="bad">overlap</span>: neither was over before the other began, so neither came first.`}));
})();

/* ===== four mornings, put to the rule by the checker ===== */
(function(){
  const svg=$("#fmsvg"),say=$("#fmsay"),vd=$("#fmverd"),nm=$("#fmname"),bs=$$("button[data-m]");
  const E=(id,h,s,e)=>({id,obj:"b",p:id,i:0,kind:"enq",item:h,h,pl:h,s,e,off:0});
  const D=(id,h,s,e,off=0)=>({id,obj:"b",p:id,i:0,kind:"deq",ret:h,h,pl:3,s,e,off});
  const M=[
    {n:"Two orders sent at the same time",v:"ok",ops:[E("a",1,1.6,4.0),E("b",2,2.4,4.8),D("c",2,6,7),D("d",1,7.5,8.5)],t:"Neither order is confirmed before the other is sent, and a loader serves House 2 first. The orders overlap, and the keeper may have entered House 2's first."},
    {n:"One order after the other",v:"sun",ops:[E("a",1,1.6,3.4),E("b",2,4.4,6.2),D("c",2,7,8),D("d",1,8.5,9.5)],t:"House 1's order is confirmed before House 2's is sent, and House 2 is served first. That is the goatherd's morning."},
    {n:"Served before the confirmation arrives",v:"ok",ops:[E("a",1,1.6,6.0),D("c",1,3.4,4.6)],t:"House 1's order is entered, and a loader serves it while word of the entry is still on the road. The order's moment came at its entry, and the house simply has not heard yet."},
    {n:"One order served twice",v:"keeper",ops:[E("b",2,1.6,3.4),D("c",2,4.4,5.4,-5),D("d",2,4.8,6.0,5)],t:"Two loaders each take House 2's single order and load grain for it."}];
  M.forEach(m=>{if(verdict(m.ops)!==m.v)throw new Error("a morning does not match the rule: "+m.n)});
  function show(n){const m=M[n],ops=m.ops;bs.forEach((b,i)=>{b.classList.toggle("on",i===n);b.classList.toggle("alt",i!==n)});nm.textContent=m.n;
    const P=Polar(svg,{vb:"0 0 640 470",cx:320,cy:290,r0:44,step:22,rings:10,tEnd:10.4,note:[14,24],nodes:NODES});
    ops.forEach(o=>{const col=o.kind==="enq"?HC[o.h]:"#8a7a62";band(P,o.pl,o.s,o.e,col,o.off);
      if(o.kind==="enq"){mark(P,o.pl,o.e,col,"",o.off,6);mark(P,o.pl,o.s,col,o.h,o.off)}
      else{mark(P,o.pl,o.s,col,"",o.off,6);mark(P,o.pl,o.e,HC[o.h],o.h,o.off)}});
    const v=verdict(ops);say.textContent=m.t;
    const lab=o=>chip(o.kind==="enq"?`enters House ${o.h}'s order`:`serves House ${o.h}'s order`,o.h);
    vd.innerHTML=v==="ok"?`<p class="say"><span class="ok">Allowed.</span> A single keeper could have produced it, in this sequence:</p><div class="seqline">${lin(ops,true).seq.map(lab).join(" ")}</div>`
      :v==="sun"?`<p class="say"><span class="bad">Forbidden.</span> Whatever sequence is tried, an order that was over before another began is served after it. That breaks the third demand.</p>`
      :`<p class="say"><span class="bad">Forbidden.</span> No single keeper serves one order twice, however the times fall. That breaks the first demand.</p>`}
  bs.forEach((b,i)=>b.onclick=()=>show(i));
})();

/* ===== two kinds of first: tallies, slips and spans, worked out ===== */
(function(){
  const svg=$("#fksvg"),tab=$("#fktab"),say=$("#fksay"),nm=$("#fkname"),bs=$$("button[data-k]");
  const base=[{id:"a1",h:1,t:1.0,k:"loc"},{id:"a2",h:1,t:2.0,k:"loc"},{id:"o1",h:1,t:3.0,k:"send"}];
  const K=[{n:"The goatherd's morning",ev:[...base,{id:"o2",h:2,t:7.0,k:"send"}],sp:{o1:[3.0,5.4],o2:[7.0,9.0]}},
           {n:"A slip joins the orders",ev:[...base,{id:"s1",h:1,t:4.0,k:"send"},{id:"r1",h:2,t:5.6,k:"recv",from:"s1"},{id:"o2",h:2,t:6.4,k:"send"}],sp:{o1:[3.0,8.0],o2:[6.4,9.0]}}];
  function work(k){const T=Tally({1:0,2:0,3:0}),tal={};[...k.ev].sort((a,b)=>a.t-b.t).forEach(e=>{tal[e.id]=e.k==="loc"?T.local(e.h):e.k==="send"?T.send(e.h):T.recv(e.h,tal[e.from])});return tal}
  const facts=k=>{const tal=work(k),ch=chained(k.ev,"o1","o2"),n1=tal.o1,n2=tal.o2,sunBefore=k.sp.o1[1]<k.sp.o2[0];return {tal,ch,n1,n2,sunBefore,tFirst:(n1<n2||(n1===n2))?1:2}};
  /* the book's two mornings, checked against what they say */
  {const f0=facts(K[0]),f1=facts(K[1]);
   if(f0.ch||f0.tFirst!==2||!f0.sunBefore||!f1.ch||f1.tFirst!==1||f1.sunBefore)throw new Error("the two mornings do not behave as the book says")}
  function show(i){const k=K[i],f=facts(k);bs.forEach((b,j)=>{b.classList.toggle("on",j===i);b.classList.toggle("alt",j!==i)});nm.textContent=k.n;
    const P=Polar(svg,{vb:"0 0 640 470",cx:320,cy:290,r0:44,step:22,rings:10,tEnd:10.4,note:[14,24],nodes:NODES});
    [["o1",1],["o2",2]].forEach(([id,h])=>band(P,h,k.sp[id][0],k.sp[id][1],HC[h]));
    k.ev.forEach(e=>{if(e.id==="o1"||e.id==="o2")mark(P,e.h,e.t,HC[e.h],f.tal[e.id]);else mark(P,e.h,e.t,HC[e.h],"",0,6)});
    k.ev.filter(e=>e.from).forEach(e=>{const s=k.ev.find(x=>x.id===e.from);P.slip(s.h,s.t,e.h,e.t)});
    [[1,k.sp.o1[1]],[2,k.sp.o2[1]]].forEach(([h,t])=>mark(P,h,t,HC[h],"",0,6));
    tab.innerHTML=`<tr><td>Does a chain of slips join the orders?</td><td>${f.ch?"yes":"no"}</td></tr>
      <tr><td>Tallies: House 1's order ${f.n1}, House 2's ${f.n2}</td><td>House ${f.tFirst} first${f.ch?"":" (arbitrary)"}</td></tr>
      <tr><td>The sun</td><td>${f.sunBefore?"House 1 first":"overlap"}</td></tr>
      <tr><td>May the rule serve House 2 first?</td><td>${f.sunBefore?"no":"yes"}</td></tr>`;
    say.innerHTML=!f.ch&&f.sunBefore?`No slip joins the orders, so the tallies may put either first, and here they put House 2 first. The sun puts House 1 first, because its order was over before House 2's began. <span class="bad">The two answers differ.</span>`
      :`A chain of slips joins the orders, so the tallies put House 1 first. But House 1's order was not over when House 2's began, so for the sun they overlap, and the rule would let House 2 go first. <span class="bad">The two answers differ.</span>`}
  bs.forEach((b,i)=>b.onclick=()=>show(i));
})();

/* ===== grain and oil: each board alone, and both together ===== */
(function(){
  const tab=$("#loctab"),say=$("#locsay"),nm=$("#locname"),b1=$("#locLoose"),b2=$("#locSun");
  const o=(id,obj,p,i,kind,x,s,e)=>({id,obj,p,i,kind,item:kind==="enq"?x:undefined,ret:kind==="deq"?x:undefined,s,e});
  const go=[o("G1","g",1,0,"enq","G1",1,2),o("O1","o",1,1,"enq","O1",3,4),o("O2","o",2,0,"enq","O2",4.5,5.5),o("G2","g",2,1,"enq","G2",6,7),
    o("do1","o",3,0,"deq","O1",8,9),o("do2","o",3,1,"deq","O2",9.5,10.5),o("dg1","g",4,0,"deq","G2",8,9),o("dg2","g",4,1,"deq","G1",9.5,10.5)];
  const NAME={G1:"House 1's grain",O1:"House 1's oil",O2:"House 2's oil",G2:"House 2's grain"};
  const on=b=>go.filter(x=>x.obj===b);
  const R=rt=>({g:lin(on("g"),rt).ok,o:lin(on("o"),rt).ok,all:lin(go,rt).ok});
  {const L=R(false),S=R(true);if(!(L.g&&L.o&&!L.all&&!S.g&&S.o&&!S.all))throw new Error("grain and oil do not behave as the book says")}
  /* the loop: each house's own business in order, and each board's serving order, as must-go-before arrows */
  function loop(){const edge={};const add=(a,b)=>(edge[a]=edge[a]||[]).push(b);
    go.filter(x=>x.kind==="enq").forEach(a=>go.filter(x=>x.kind==="enq"&&x.p===a.p&&x.i===a.i+1).forEach(b=>add(a.id,b.id)));
    for(const ob of ["g","o"]){const r=on(ob).filter(x=>x.kind==="deq").sort((a,b)=>a.s-b.s).map(x=>x.ret);for(let i=0;i+1<r.length;i++)add(r[i],r[i+1])}
    for(const start of ["G1","O1","O2","G2"]){const path=[],seen=new Set();
      const f=x=>{if(x===start&&path.length)return true;if(seen.has(x))return false;seen.add(x);path.push(x);for(const y of edge[x]||[])if(f(y))return true;path.pop();return false};
      if(f(start)){path.push(start);return path.map(x=>NAME[x]).join(" → ")}}
    return null}
  const cell=ok=>ok?'<span class="ok">passes</span>':'<span class="bad">fails</span>';
  function show(rt){b1.classList.toggle("on",!rt);b1.classList.toggle("alt",rt);b2.classList.toggle("on",rt);b2.classList.toggle("alt",!rt);
    nm.textContent=rt?"the rule of the board":"the looser rule";const r=R(rt);
    tab.innerHTML=`<tr><td>The grain board, by itself</td><td>${cell(r.g)}</td></tr><tr><td>The oil board, by itself</td><td>${cell(r.o)}</td></tr><tr><td>Both together</td><td>${cell(r.all)}</td></tr>`;
    say.innerHTML=!rt?`Each board can be explained alone, and together they cannot. With each house's own business kept in order, they run ${loop()}: a loop. Without the sun, the boards cannot be judged apart.`
      :`The grain board already fails by itself: House 1's grain was finished before House 2's began, yet House 2's was served first. Judged board by board, the fault shows where it is, and no loop is needed to find it.`}
  b1.onclick=()=>show(false);b2.onclick=()=>show(true);
})();

/* ===== nobody made to wait ===== */
(function(){
  const log=$("#wtlog"),say=$("#wtsay"),nm=$("#wtname"),bs=$$("button[data-w]");
  const enq=(id,item,s,e)=>({id,obj:"q",p:id,i:0,kind:"enq",item,s,e,h:item});
  const deq=(id,ret,s,e)=>({id,obj:"q",p:id,i:0,kind:"deq",ret,s,e,h:ret});
  const lab=o=>chip(o.kind==="enq"?`enters House ${o.h}'s order`:`serves House ${o.h}'s order`,o.h);
  const cases=[
    ()=>{const done=[enq("a",1,1,2),deq("c",1,2.5,3.5)],seq=lin(done,true).seq,b=enq("b",2,3,4);
      const ext=seq.concat(b);if(!validSeq(ext,true))throw new Error("the end of the sequence is not allowed");
      return {name:"a waiting order",html:`<div class="e">So far: House 1's order is entered and served. House 2's order has been sent, and no confirmation has come.</div><div class="e good">A sequence that shows the business so far keeps the rule:<div class="seqline">${seq.map(lab).join(" ")}</div></div><div class="e good">Put House 2's order at the end, and confirm it now:<div class="seqline">${ext.map(lab).join(" ")}</div></div>`,
        say:`<span class="ok">Nothing earlier changes, and nothing began after it finished.</span> The sequence still keeps the rule, so the order can be entered now.`}},
    ()=>{const done=[enq("a",1,1,2),deq("c",1,3,4)],seq=lin(done,true).seq,left=[];seq.forEach(o=>{if(o.kind==="enq")left.push(o.item);else left.shift()});
      return {name:"an empty board",html:`<div class="e">House 1's order was entered and served, so the board is empty.</div><div class="e bad">A loader comes and asks for the oldest order. Orders the board holds: ${left.length}. Answers it could give: ${left.length?left[0]:"none"}.</div>`,
        say:`<span class="bad">There is nothing to answer with.</span> A single keeper would make the loader wait until an order comes. That wait is asked for, not forced: <i>serve the oldest order</i> has no answer while there are no orders.`}},
    ()=>{/* House 1 looks at the oil board and, if empty, orders grain; House 2 looks at the grain board and, if empty, orders oil. Both look and find empty. */
      const groups={1:{look:"o",put:"g"},2:{look:"g",put:"o"}};let fits=0;
      for(const order of [[1,2],[2,1]]){const board={g:0,o:0};let ok=true;for(const h of order){const G=groups[h];if(board[G.look]!==0)ok=false;board[G.put]++}if(ok)fits++}
      if(fits!==0)throw new Error("two groups should not both fit");
      return {name:"two things as one",html:`<div class="e">House 1 looks at the oil board and, if it is empty, orders grain. House 2 looks at the grain board and, if it is empty, orders oil. Each does both as one thing, with nothing between.</div><div class="e bad">Both find their board empty. Tried with House 1's group first: House 2's look then finds the grain board holding an order. Tried with House 2's first: House 1's look finds the oil board holding one. Sequences that fit: ${fits}.</div>`,
        say:`<span class="bad">One of the two has to be called off.</span> Promises about such groups can force a house to undo its business. The rule of the board, whose business is always single, never does.`}}];
  bs.forEach((b,i)=>b.onclick=()=>{bs.forEach((x,j)=>{x.classList.toggle("on",j===i);x.classList.toggle("alt",j!==i)});const c=cases[i]();nm.textContent=c.name;log.innerHTML=c.html;say.innerHTML=c.say});
})();

/* ===== scroll: the race at the busy board ===== */
(function(){
  const svg=$("#boardsvg"),side=$("#boardside");
  const common=["A.take","B.take","B.put"];
  const plan=[[],["A.take"],["A.take","B.take"],common,common,[...common,"L.peg","L.look","L.look"],["A.take","B.take","B.put","A.put","L.peg","L.look"]];
  const sx=i=>30+(i-1)*80;
  const states=plan.map(p=>{const b=Board();aStep(...p).forEach(([w,a])=>b.do(w,a));return b});
  const f5=states[5],f6=states[6];
  if(f5.L.took!=="B"||f6.L.took!=="A"||f5.L.from!==2||f6.L.from!==1)throw new Error("the race does not run as the book says");
  const col={A:HC[1],B:HC[2]},hs={A:1,B:2};
  function draw(b){svg.innerHTML="";
    for(let i=1;i<=4;i++){el("rect",{x:sx(i),y:110,width:70,height:64,rx:4,fill:"#fffaf0",stroke:"#1c1512","stroke-width":3},svg);
      el("text",{x:sx(i)+35,y:196,"text-anchor":"middle","font-size":15},svg).textContent=i;
      const w=b.slot[i];if(w){el("rect",{x:sx(i)+12,y:124,width:46,height:36,rx:4,fill:col[w],stroke:"#1c1512","stroke-width":2.5},svg);el("text",{x:sx(i)+35,y:149,"text-anchor":"middle","font-size":20},svg).textContent=hs[w]}}
    if(b.peg<=4){const x=sx(b.peg)+35;el("path",{d:`M${x-12},84 L${x+12},84 L${x},104 Z`,fill:"#bf4a26",stroke:"#1c1512","stroke-width":2},svg);el("text",{x:x,y:76,"text-anchor":"middle","font-size":15,fill:"#bf4a26"},svg).textContent="peg"}
    for(const w of ["A","B"])if(b[w].num&&!b[w].put&&b[w].num<=4){const x=sx(b[w].num)+35;el("rect",{x:x-18,y:22,width:36,height:28,rx:4,fill:col[w],"fill-opacity":.45,stroke:"#1c1512","stroke-width":2,"stroke-dasharray":"4 3"},svg);el("text",{x:x,y:43,"text-anchor":"middle","font-size":17},svg).textContent=hs[w]}
    if(b.L.at&&!b.L.took){const x=sx(b.L.at)+35;el("path",{d:`M${x-10},222 L${x+10},222 L${x},206 Z`,fill:"#136f9e",stroke:"#1c1512","stroke-width":2},svg);el("text",{x:x,y:238,"text-anchor":"middle","font-size":14},svg).textContent="loader"}
    if(b.L.took){const x=sx(b.L.from)+35;el("path",{d:`M${x-10},222 L${x+10},222 L${x},206 Z`,fill:"#3f7a2a",stroke:"#1c1512","stroke-width":2},svg);el("text",{x:x,y:238,"text-anchor":"middle","font-size":14},svg).textContent="served"}}
  function cards(b){
    const clerk=(w)=>{const c=b[w];return c.put?`tablet in slot ${c.num}`:c.num?`has number ${c.num}, tablet not yet in`:"not begun"};
    const ld=b.L.took?`took House ${hs[b.L.took]}'s tablet from slot ${b.L.from}`:b.L.peg?`read the peg: ${b.L.peg}; at slot ${b.L.at}`:"not at the board";
    return [["Clerk, House 1's order",clerk("A"),b.A.put],["Clerk, House 2's order",clerk("B"),b.B.put],["Loader",ld,!!b.L.took]].map(([h,t,d])=>`<div class="hc${d?" in":""}"><h5>${h}</h5><div class="chk">${t}</div></div>`).join("")}
  scrolly($("#board"),s=>{draw(states[s]);side.innerHTML=cards(states[s])});
})();

/* ===== what the board could mean ===== */
(function(){
  const sl=$("#mnslots"),sq=$("#mnseqs"),say=$("#mnsay"),nm=$("#mnname"),bs=$$("button[data-n]"),ld=$("#mnload");
  /* the order each clerk's movements fall in: a number taken, a tablet put in */
  const runs=[{n:"the two clerks race",tabs:[{h:1,take:1,put:4,slot:1},{h:2,take:2,put:3,slot:2}]},
              {n:"one clerk done first",tabs:[{h:2,take:1,put:2,slot:1},{h:1,take:3,put:4,slot:2}]}];
  let cur=null,rest=null,slots=null;
  const seqs=tabs=>meanings(tabs);
  /* the business could have produced a sequence if it respects what finished before what began */
  const honest=(tabs,s)=>validSeq(s.map(t=>({kind:"enq",obj:"q",item:t.h,s:t.take,e:t.put})),true);
  runs.forEach(r=>{const all=seqs(r.tabs),ok=all.every(s=>honest(r.tabs,s));
    let n=0;(function p(cur,rem){if(!rem.length){if(honest(r.tabs,cur))n++;return}rem.forEach((x,i)=>p(cur.concat(x),rem.filter((_,j)=>j!==i)))})([],r.tabs);
    if(!ok||n!==all.length)throw new Error("the board's meanings and the business's differ")});
  const paint=()=>{
    sl.innerHTML=[1,2,3,4].map(i=>{const t=slots.find(x=>x.slot===i);return `<div class="e" style="border-left-color:${t?HC[t.h]:"#b9a77e"}">slot ${i}: ${t?"House "+t.h+"'s order":"empty"}</div>`}).join("");
    sq.innerHTML=rest.length?rest.map(s=>`<div class="e">${s.length?s.map(t=>`<span class="chip"><i style="background:${HC[t.h]}"></i>${t.h}</span>`).join(" then "):"nothing waiting"}</div>`).join(""):"<div class='e'>nothing waiting</div>"};
  function pick(i){const r=runs[i];cur=r;slots=r.tabs.map(t=>({...t}));rest=seqs(r.tabs);
    bs.forEach((b,j)=>{b.classList.toggle("on",j===i);b.classList.toggle("alt",j!==i)});nm.textContent=r.n;ld.disabled=false;paint();
    say.innerHTML=i===0?`Both clerks took their numbers before either tablet went in, so nothing forces one ahead of the other. The board could stand for either sequence. <span class="ok">Each is one the business could have produced:</span> the two orders overlapped.`
      :`House 2's tablet went in before the other clerk took a number, so it must come first. The board can stand for one sequence only. <span class="ok">It is one the business could have produced.</span>`}
  bs.forEach((b,i)=>b.onclick=()=>pick(i));
  ld.onclick=()=>{if(!slots.length)return;slots.sort((a,b)=>a.slot-b.slot);const t=slots[0],before=rest.length,first=rest.filter(s=>s[0].h===t.h).length;
    slots.shift();rest=[...new Set(rest.filter(s=>s[0].h===t.h).map(s=>s.slice(1)))].map(x=>x);
    paint();ld.disabled=!slots.length;
    say.innerHTML=`The loader goes up from slot 1 and takes the first tablet it finds: House ${t.h}'s order from slot ${t.slot}. <span class="ok">It could be first:</span> it leads ${first} of the ${before} sequence${before>1?"s":""} the board could stand for. The waiting orders are left standing for ${rest.length===1?"one sequence":rest.length+" sequences"}.`}
})();

/* ===== who is who ===== */
mapPairs($("#map"),[["A trading house; a loader; a clerk","A process: it waits for each answer before its next call"],["The board; placed first, filled first","A shared FIFO queue"],["An order; a serving","Enq; Deq"],["Sending an order; its confirmation","An invocation and its response"],["Before; overlap","Real-time order; concurrent calls"],["A single keeper with a single board","The object's sequential specification"],["The rule of the board","Linearizability"],["A moment inside the span","The linearization point"],["The tallies' first","Happened-before, extended by process number"],["The looser rule","Sequential consistency"],["One Board at a Time","Locality: check each object alone"],["No Order Waits on Another","The nonblocking property"],["Several things done as one","A transaction; serializability"],["The busy board: slots and a peg","A lock-free queue on an array and a counter"],["What the board could mean","An abstraction function to a set of values"],["A rule that only forbids","A safety property, with no promise of progress"]]);

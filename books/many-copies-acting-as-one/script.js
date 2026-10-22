"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,mapPairs,Polar}=BOOK;
const {isM,dual,vis,dtext,onReg}=REG;
BOOK.init();


const HC={1:"#9cb648",2:"#e0b84a",3:"#5b9be0"};
const chip=(t,h)=>`<span class="chip"><i style="background:${HC[h]}"></i>${t}</span>`;
const ANG={1:-90,2:30,3:150};
const NODES={1:[-90,"H1",HC[1],"P1"],2:[30,"H2",HC[2],"P2"],3:[150,"H3",HC[3],"P3"]};

/*LOGIC-START*/
/* ===== the rule of the board, as a checker =====
   An entry is {id, obj, p, i, kind:"enq"|"deq", item, ret, s, e}: which board, which house or loader (p) and
   its place in that one's own sequence (i), a request put on a board or a serving that returned a request,
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
/* why a history fails: no single steward could have produced it at all, or only the sun forbids it */
function verdict(ops){
  if(lin(ops,true).ok)return "ok";
  return lin(ops,true,true).ok?"sun":"steward";
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
/* a faint ring round the whole round for the same stretch of time, under everything but the frame, so that
   spans on different lines can be compared: where two rings overlap, so do their spans */
function spanRing(P,t1,t2,col){
  const R=P.rings||(P.rings=P.svg.insertBefore(el("g",{class:"st-spanrings"}),P.under));
  const ring=r=>`M${(P.cx+r).toFixed(1)},${P.cy} a${r.toFixed(1)},${r.toFixed(1)} 0 1 0 ${(-2*r).toFixed(1)},0 a${r.toFixed(1)},${r.toFixed(1)} 0 1 0 ${(2*r).toFixed(1)},0 Z`;
  return el("path",{class:"st-spanring",d:ring(P.r(t2))+" "+ring(P.r(t1)),"fill-rule":"evenodd",fill:col,stroke:col},R)}
function mark(P,pl,t,fill,label,off=0,rad=12){
  const [x,y]=P.xy(ANG[pl]+off,P.r(t)),g=el("g",{class:"st-ev",transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},P.evs);
  el("circle",{class:"halo2",r:rad+5},g);el("circle",{class:"b",r:rad,fill},g);el("text",{},g).textContent=label;el("circle",{r:rad+8,fill:"transparent"},g);return g}
function band(P,pl,t1,t2,col,off=0,w=8){
  spanRing(P,t1,t2,col);
  const [x1,y1]=P.xy(ANG[pl]+off,P.r(t1)),[x2,y2]=P.xy(ANG[pl]+off,P.r(t2));
  return el("line",{x1:x1.toFixed(1),y1:y1.toFixed(1),x2:x2.toFixed(1),y2:y2.toFixed(1),stroke:col,"stroke-width":w,"stroke-linecap":"round",opacity:.5},P.under)}

/* ===== Arche, seen from above: the same picture as every book on the ring road ===== */
function Isle(svg){
  const cx=235,cy=235,R=165,A={1:-90,2:30,3:150}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5,class:"i"},svg);
  el("circle",{cx,cy,r:86,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6",class:"i"},svg);
  el("text",{x:cx,y:cy-8,class:"lab i"},svg).textContent="Mount Phyle";
  el("circle",{cx,cy,r:R,fill:"none",stroke:"#b5602c","stroke-width":3,"stroke-dasharray":"3 8",class:"i"},svg);
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const I={svg,cx,cy,R,A,under,over,house:{},
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:13,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph;return g},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    /* u of the way along the direct stretch from house a to house b; each direction keeps to its own lane */
    road(g,a,b,u){const d=((A[b]-A[a]+540)%360)-180;I.put(g,...I.at(A[a]+d*u,R+(d>0?9:-9)))}
  };
  for(const h of [1,2,3]){const [x,y]=I.at(A[h]),g=el("g",{class:"site"},sites);I.put(g,x,y);el("rect",{x:-25,y:-17,width:50,height:34,rx:5,fill:HC[h]},g);dtext(g,{},"H"+h,"P"+h);I.house[h]={x,y,g}}
  return I;
}

/* cover:start */
COVERS.draw("#coversvg",(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · EVERY OPERATION TAKES EFFECT AT ONE INSTANT","linearizability");
  const Y=[112,176,240],lbl=["P1","P2","P3"];
  Y.forEach((y,j)=>{lane(g,64,500,y,{w:1.2});node(g,36,y,14,lbl[j],{s:10.5})});
  T(g,W-26,74,"real time →",{a:"end",s:9.5,m:1,c:P.faint});
  /* operations: lane, start, end, label, linearization point, colour */
  const O=[[0,74,214,"enq(x)",150,"blue"],[1,150,300,"enq(y)",236,"gold"],[2,262,414,"deq() → x",318,"red"],[0,340,490,"deq() → y",430,"green"]];
  O.forEach(([l,a,b,t,p,c],k)=>{const y=Y[l];
    el("rect",{x:a,y:y-16,width:b-a,height:32,rx:16,fill:P[c+"L"],stroke:P[c],"stroke-width":1.5},g);
    T(g,(a+b)/2,y-2,t,{s:10,m:1,w:600,c:P[c]==="#e0b84a"?"#8a6a00":P[c]});
    link(g,p,y+16,p,334,{c:"red",w:1,dash:"2 3",head:false,op:.55});
    el("path",{d:`M${p} ${y+9}l6 7l-6 7l-6 -7z`,fill:P.red,stroke:"#fff","stroke-width":1.2},g)});
  /* real-time order: one operation ends before the next begins */
  link(g,214,Y[0]+16,262,Y[2]-16,{c:"mute",w:1.1,dash:"4 3",bend:12,op:.7});
  chip(g,206,Y[1]+34,"returned before the next began",{a:"end",m:1,s:8.5,pad:8,k:P.line,c:P.mute});
  chip(g,372,Y[1]+8,"overlap: either order",{m:1,s:8.5,pad:8,k:P.line,c:P.mute});
  /* the one-at-a-time queue */
  const qy=334;lane(g,64,500,qy,{w:2,c:"ink"});
  O.forEach(([l,a,b,t,p,c])=>{dot(g,p,qy,5,P.red,"#fff")});
  T(g,26,qy-0,"",{});
  T(g,26,362,"a single queue, one step at a time",{a:"start",s:10,m:1,c:P.mute});
  const st=[[150,"enq x","[ x ]"],[236,"enq y","[ x y ]"],[318,"deq → x","[ y ]"],[430,"deq → y","[   ]"]];
  st.forEach(([x,t,q],k)=>{
    el("rect",{x:x-34,y:384,width:68,height:44,rx:10,fill:"#fff",stroke:P.line,"stroke-width":1.2},g);
    T(g,x,398,t,{s:9,m:1,c:P.mute});T(g,x,416,q,{s:12,m:1,w:700,c:P.ink})});
  st.slice(0,3).forEach(([x],k)=>link(g,x+36,406,st[k+1][0]-36,406,{c:"mute",w:1.2,op:.6}));
  chip(g,W/2,H-30,"copies, caches and workers behind it may do anything they like",{m:1,s:8.5,pad:16,k:P.line,c:P.mute});
});
/* cover:end */

/* ===== scroll: the goatherd's morning, with tallies worked out by the rule ===== */
(function(){
  const I=Isle($("#goatsvg")),side=$("#goatside"),S=Tally({1:2,2:0,3:0}),st=[];
  const orders={1:null,2:null},board=[];
  const snap=()=>st.push({T:{...S.T},o:{...orders},board:board.map(b=>({...b}))});
  snap();                                                         // 0 the morning
  const n1=S.send(1);orders[1]=n1;snap();                         // 1 House 1 sends its request, its third entry
  S.recv(3,n1);board.push({h:1,n:n1});const n2=S.send(3);snap();  // 2 House 3 enters it and sends word back
  S.recv(1,n2);snap();                                            // 3 the confirmation arrives
  snap();                                                         // 4 the goatherd: no slip, no change
  const n3=S.send(2);orders[2]=n3;snap();                         // 5 House 2 requests at noon
  S.recv(3,n3);board.push({h:2,n:n3});snap();                     // 6 House 3 enters it
  $$(".gt1").forEach(e=>e.textContent=n1);$$(".gt2").forEach(e=>e.textContent=n2);$$(".gt3").forEach(e=>e.textContent=n3);
  if(!(n3<n1))throw new Error("House 2's request should carry the lower tally");
  const first=[...board].sort((a,b)=>a.n-b.n||a.h-b.h)[0].h;
  const toks=[[1,3,n1,{1:.35,2:.88}],[3,1,n2,{2:.2,3:.88}],[2,3,n3,{5:.35,6:.88}]].map(([a,b,n,plan])=>({a,b,plan,g:I.token(HC[a],n),u:.1,run:0,end:Math.max(...Object.keys(plan))}));
  const gt=I.token("#fffaf0","G"),H1=I.house[1],H2=I.house[2];
  const over=u=>{const v=1-u;I.put(gt,v*v*H1.x+2*u*v*I.cx+u*u*H2.x,v*v*H1.y+2*u*v*I.cy+u*u*H2.y)};let gr=0;
  function card(h,s){const X=st[s];let body;
    if(h===3)body=X.board.length?X.board.map(b=>chip(dual(`House ${b.h}'s request · ${b.n}`,`P${b.h}'s request · ${b.n}`),b.h)).join("")+(s===6?dual(`<br><b>serves House ${first} first</b>`,`<br><b>serves P${first} first</b>`):""):dual("board empty","queue empty");
    else body=X.o[h]!=null?dual(`request sent, tally ${X.o[h]}`,`request sent, timestamp ${X.o[h]}`):h===1?dual("two entries so far","two local events so far"):dual("no entries, no slips","no events, no messages");
    return `<div class="hc${s===6&&h===first?" in":""}"><h5>${dual("House "+h,"P"+h)}<span>${dual("tally","timestamp")} ${X.T[h]}</span></h5><div class="chk">${body}</div></div>`}
  scrolly($("#goat"),s=>{
    side.innerHTML=[1,2,3].map(h=>card(h,s)).join("");
    toks.forEach(k=>{const u=k.plan[s],id=++k.run;
      if(u==null){k.g.setAttribute("opacity",0);k.u=s>k.end?.9:.1;I.road(k.g,k.a,k.b,k.u);return}
      k.g.setAttribute("opacity",1);const u0=k.u;tween(800,e=>{if(k.run!==id)return;k.u=u0+(u-u0)*e;I.road(k.g,k.a,k.b,k.u)})});
    const id=++gr;if(s===4){over(.12);gt.setAttribute("opacity",1);tween(1500,e=>{if(gr===id)over(.12+.76*e)})}else gt.setAttribute("opacity",0);
  });
})();

/* ===== before, or overlap: choose two requests ===== */
(function(){
  const svg=$("#spansvg"),say=$("#spansay");
  const P=Polar(svg,{vb:"0 0 640 570",cx:320,cy:290,r0:44,step:22,rings:10,tEnd:10.4,note:[14,24],nodes:NODES});
  const O=[{k:"A",pl:1,s:1.6,e:4.2,name:"House 1's request",nm:"P1's request"},{k:"B",pl:2,s:3.0,e:5.4,name:"House 2's first request",nm:"P2's first request"},{k:"C",pl:2,s:7.0,e:9.4,name:"House 2's second request",nm:"P2's second request"}];
  O.forEach(o=>{band(P,o.pl,o.s,o.e,HC[o.pl]);mark(P,o.pl,o.e,HC[o.pl],"",0,6);o.g=mark(P,o.pl,o.s,HC[o.pl],o.k)});
  let sel=[];
  O.forEach(o=>button(o.g,o.name,()=>{if(sel.length===2||sel.includes(o))sel=[];sel.push(o);O.forEach(x=>x.g.classList.toggle("sel",sel.includes(x)));
    if(sel.length<2){say.innerHTML=dual(`<b>${o.name}.</b> Now choose a second request.`,`<b>${o.nm}.</b> Now choose a second request.`);return}
    let [a,b]=sel;if(b.e<a.s)[a,b]=[b,a];
    say.innerHTML=a.e<b.s?dual(`<b>${a.name}</b> was over before <b>${b.name}</b> began, so it came <span class="ok">before</span>.`,`<b>${a.nm}</b> was over before <b>${b.nm}</b> began, so it came <span class="ok">before</span>.`)
      :dual(`<b>${a.name}</b> and <b>${b.name}</b> <span class="bad">overlap</span>: neither was over before the other began, so neither came first.`,`<b>${a.nm}</b> and <b>${b.nm}</b> <span class="bad">overlap</span>: neither was over before the other began, so neither came first.`)}));
})();

/* ===== four mornings, put to the rule by the checker ===== */
(function(){
  const svg=$("#fmsvg"),say=$("#fmsay"),vd=$("#fmverd"),nm=$("#fmname"),bs=$$("button[data-m]");
  const E=(id,h,s,e)=>({id,obj:"b",p:id,i:0,kind:"enq",item:h,h,pl:h,s,e,off:0});
  const D=(id,h,s,e,off=0)=>({id,obj:"b",p:id,i:0,kind:"deq",ret:h,h,pl:3,s,e,off});
  const M=[
    {n:dual("Two requests sent at the same time","Two requests made at the same time"),v:"ok",ops:[E("a",1,1.6,4.0),E("b",2,2.4,4.8),D("c",2,6,7),D("d",1,7.5,8.5)],t:dual("Neither request is confirmed before the other is sent, and a loader serves House 2 first. The requests overlap, and the steward may have entered House 2's first.","Neither request is confirmed before the other is made, and the queue serves P2 first. The requests overlap, and a sequential queue may have entered P2's first.")},
    {n:"One request after the other",v:"sun",ops:[E("a",1,1.6,3.4),E("b",2,4.4,6.2),D("c",2,7,8),D("d",1,8.5,9.5)],t:dual("House 1's request is confirmed before House 2's is sent, and House 2 is served first. That is the goatherd's morning.","P1's request is confirmed before P2's is made, and P2 is served first. That is the out-of-band execution.")},
    {n:dual("Served before the confirmation arrives","Served before the response arrives"),v:"ok",ops:[E("a",1,1.6,6.0),D("c",1,3.4,4.6)],t:dual("House 1's request is entered, and a loader serves it while word of the entry is still on the road. The request's moment came at its entry, and the house simply has not heard yet.","P1's request is entered, and a dequeue serves it while the response is still in transit. The request's moment came at its entry, and P1 simply has not heard yet.")},
    {n:"One request served twice",v:"steward",ops:[E("b",2,1.6,3.4),D("c",2,4.4,5.4,-5),D("d",2,4.8,6.0,5)],t:dual("Two loaders each take House 2's single request and load grain for it.","Two dequeues each take P2's single request.")}];
  M.forEach(m=>{if(verdict(m.ops)!==m.v)throw new Error("a morning does not match the rule: "+m.n)});
  function show(n){const m=M[n],ops=m.ops;bs.forEach((b,i)=>{b.classList.toggle("on",i===n);b.classList.toggle("alt",i!==n)});nm.innerHTML=m.n;
    const P=Polar(svg,{vb:"0 0 640 570",cx:320,cy:290,r0:44,step:22,rings:10,tEnd:10.4,note:[14,24],nodes:NODES});
    ops.forEach(o=>{const col=o.kind==="enq"?HC[o.h]:"#8a7a62";band(P,o.pl,o.s,o.e,col,o.off);
      if(o.kind==="enq"){mark(P,o.pl,o.e,col,"",o.off,6);mark(P,o.pl,o.s,col,o.h,o.off)}
      else{mark(P,o.pl,o.s,col,"",o.off,6);mark(P,o.pl,o.e,HC[o.h],o.h,o.off)}});
    const v=verdict(ops);say.innerHTML=m.t;
    const lab=o=>chip(dual(o.kind==="enq"?`enters House ${o.h}'s request`:`serves House ${o.h}'s request`,o.kind==="enq"?`enqueues P${o.h}'s request`:`dequeues P${o.h}'s request`),o.h);
    vd.innerHTML=v==="ok"?`<p class="say"><span class="ok">Allowed.</span> ${dual("A single steward could have produced it, in this sequence:","A single sequential queue could have produced it, in this sequence:")}</p><div class="seqline">${lin(ops,true).seq.map(lab).join(" ")}</div>`
      :v==="sun"?`<p class="say"><span class="bad">Forbidden.</span> Whatever sequence is tried, a request that was over before another began is served after it. That breaks the third demand.</p>`
      :`<p class="say"><span class="bad">Forbidden.</span> ${dual("No single steward serves one request twice, however the times fall.","No single sequential queue serves one request twice, however the times fall.")} That breaks the first demand.</p>`}
  bs.forEach((b,i)=>b.onclick=()=>show(i));
})();

/* ===== two kinds of first: tallies, slips and spans, worked out ===== */
(function(){
  const svg=$("#fksvg"),tab=$("#fktab"),say=$("#fksay"),nm=$("#fkname"),bs=$$("button[data-k]");
  const base=[{id:"a1",h:1,t:1.0,k:"loc"},{id:"a2",h:1,t:2.0,k:"loc"},{id:"o1",h:1,t:3.0,k:"send"}];
  const K=[{n:dual("The goatherd's morning","The out-of-band execution"),ev:[...base,{id:"o2",h:2,t:7.0,k:"send"}],sp:{o1:[3.0,5.4],o2:[7.0,9.0]}},
           {n:dual("A slip joins the requests","A message joins the requests"),ev:[...base,{id:"s1",h:1,t:4.0,k:"send"},{id:"r1",h:2,t:5.6,k:"recv",from:"s1"},{id:"o2",h:2,t:6.4,k:"send"}],sp:{o1:[3.0,8.0],o2:[6.4,9.0]}}];
  function work(k){const T=Tally({1:0,2:0,3:0}),tal={};[...k.ev].sort((a,b)=>a.t-b.t).forEach(e=>{tal[e.id]=e.k==="loc"?T.local(e.h):e.k==="send"?T.send(e.h):T.recv(e.h,tal[e.from])});return tal}
  const facts=k=>{const tal=work(k),ch=chained(k.ev,"o1","o2"),n1=tal.o1,n2=tal.o2,sunBefore=k.sp.o1[1]<k.sp.o2[0];return {tal,ch,n1,n2,sunBefore,tFirst:(n1<n2||(n1===n2))?1:2}};
  /* the book's two mornings, checked against what they say */
  {const f0=facts(K[0]),f1=facts(K[1]);
   if(f0.ch||f0.tFirst!==2||!f0.sunBefore||!f1.ch||f1.tFirst!==1||f1.sunBefore)throw new Error("the two mornings do not behave as the book says")}
  function show(i){const k=K[i],f=facts(k);bs.forEach((b,j)=>{b.classList.toggle("on",j===i);b.classList.toggle("alt",j!==i)});nm.innerHTML=k.n;
    const P=Polar(svg,{vb:"0 0 640 570",cx:320,cy:290,r0:44,step:22,rings:10,tEnd:10.4,note:[14,24],nodes:NODES});
    [["o1",1],["o2",2]].forEach(([id,h])=>band(P,h,k.sp[id][0],k.sp[id][1],HC[h]));
    k.ev.forEach(e=>{if(e.id==="o1"||e.id==="o2")mark(P,e.h,e.t,HC[e.h],f.tal[e.id]);else mark(P,e.h,e.t,HC[e.h],"",0,6)});
    k.ev.filter(e=>e.from).forEach(e=>{const s=k.ev.find(x=>x.id===e.from);P.slip(s.h,s.t,e.h,e.t)});
    [[1,k.sp.o1[1]],[2,k.sp.o2[1]]].forEach(([h,t])=>mark(P,h,t,HC[h],"",0,6));
    tab.innerHTML=`<tr><td>${dual("Does a chain of slips join the requests?","Does a chain of messages join the requests?")}</td><td>${f.ch?"yes":"no"}</td></tr>
      <tr><td>${dual(`Tallies: House 1's request ${f.n1}, House 2's ${f.n2}`,`Timestamps: P1's request ${f.n1}, P2's ${f.n2}`)}</td><td>${dual(`House ${f.tFirst} first${f.ch?"":" (arbitrary)"}`,`P${f.tFirst} first${f.ch?"":" (arbitrary)"}`)}</td></tr>
      <tr><td>${dual("The sun","Real time")}</td><td>${f.sunBefore?dual("House 1 first","P1 first"):"overlap"}</td></tr>
      <tr><td>${dual("May the rule serve House 2 first?","May linearizability serve P2 first?")}</td><td>${f.sunBefore?"no":"yes"}</td></tr>`;
    say.innerHTML=!f.ch&&f.sunBefore?dual(`No slip joins the requests, so the tallies may put either first, and here they put House 2 first. The sun puts House 1 first, because its request was over before House 2's began. <span class="bad">The two answers differ.</span>`,`No message joins the requests, so the timestamps may put either first, and here they put P2 first. Real time puts P1 first, because its request was over before P2's began. <span class="bad">The two answers differ.</span>`)
      :dual(`A chain of slips joins the requests, so the tallies put House 1 first. But House 1's request was not over when House 2's began, so for the sun they overlap, and the rule would let House 2 go first. <span class="bad">The two answers differ.</span>`,`A chain of messages joins the requests, so the timestamps put P1 first. But P1's request was not over when P2's began, so in real time they overlap, and linearizability would let P2 go first. <span class="bad">The two answers differ.</span>`)}
  bs.forEach((b,i)=>b.onclick=()=>show(i));
})();

/* ===== grain and oil: each board alone, and both together ===== */
(function(){
  const tab=$("#loctab"),say=$("#locsay"),nm=$("#locname"),b1=$("#locLoose"),b2=$("#locSun");
  const o=(id,obj,p,i,kind,x,s,e)=>({id,obj,p,i,kind,item:kind==="enq"?x:undefined,ret:kind==="deq"?x:undefined,s,e});
  const go=[o("G1","g",1,0,"enq","G1",1,2),o("O1","o",1,1,"enq","O1",3,4),o("O2","o",2,0,"enq","O2",4.5,5.5),o("G2","g",2,1,"enq","G2",6,7),
    o("do1","o",3,0,"deq","O1",8,9),o("do2","o",3,1,"deq","O2",9.5,10.5),o("dg1","g",4,0,"deq","G2",8,9),o("dg2","g",4,1,"deq","G1",9.5,10.5)];
  const NAME={G1:"House 1's grain",O1:"House 1's oil",O2:"House 2's oil",G2:"House 2's grain"},NAMEM={G1:"P1's request on G",O1:"P1's request on O",O2:"P2's request on O",G2:"P2's request on G"};
  const on=b=>go.filter(x=>x.obj===b);
  const R=rt=>({g:lin(on("g"),rt).ok,o:lin(on("o"),rt).ok,all:lin(go,rt).ok});
  {const L=R(false),S=R(true);if(!(L.g&&L.o&&!L.all&&!S.g&&S.o&&!S.all))throw new Error("grain and oil do not behave as the book says")}
  /* the loop: each house's own business in order, and each board's serving order, as must-go-before arrows */
  function loop(M){const edge={};const add=(a,b)=>(edge[a]=edge[a]||[]).push(b);
    go.filter(x=>x.kind==="enq").forEach(a=>go.filter(x=>x.kind==="enq"&&x.p===a.p&&x.i===a.i+1).forEach(b=>add(a.id,b.id)));
    for(const ob of ["g","o"]){const r=on(ob).filter(x=>x.kind==="deq").sort((a,b)=>a.s-b.s).map(x=>x.ret);for(let i=0;i+1<r.length;i++)add(r[i],r[i+1])}
    for(const start of ["G1","O1","O2","G2"]){const path=[],seen=new Set();
      const f=x=>{if(x===start&&path.length)return true;if(seen.has(x))return false;seen.add(x);path.push(x);for(const y of edge[x]||[])if(f(y))return true;path.pop();return false};
      if(f(start)){path.push(start);return path.map(x=>(M?NAMEM:NAME)[x]).join(" → ")}}
    return null}
  const cell=ok=>ok?'<span class="ok">passes</span>':'<span class="bad">fails</span>';
  function show(rt){b1.classList.toggle("on",!rt);b1.classList.toggle("alt",rt);b2.classList.toggle("on",rt);b2.classList.toggle("alt",!rt);
    nm.innerHTML=rt?dual("the rule of the board","linearizability"):dual("the looser rule","sequential consistency");const r=R(rt);
    tab.innerHTML=`<tr><td>${dual("The grain board, by itself","Queue G, by itself")}</td><td>${cell(r.g)}</td></tr><tr><td>${dual("The oil board, by itself","Queue O, by itself")}</td><td>${cell(r.o)}</td></tr><tr><td>Both together</td><td>${cell(r.all)}</td></tr>`;
    say.innerHTML=!rt?dual(`Each board can be explained alone, and together they cannot. With each house's own business kept in order, they run ${loop()}: a loop. Without the sun, the boards cannot be judged apart.`,`Each queue can be explained alone, and together they cannot. With each process's own operations kept in order, they run ${loop(true)}: a loop. Without real time, the queues cannot be judged apart.`)
      :dual(`The grain board already fails by itself: House 1's grain was finished before House 2's began, yet House 2's was served first. Judged board by board, the fault shows where it is, and no loop is needed to find it.`,`Queue G already fails by itself: P1's request was finished before P2's began, yet P2's was served first. Judged queue by queue, the fault shows where it is, and no loop is needed to find it.`)}
  b1.onclick=()=>show(false);b2.onclick=()=>show(true);
})();

/* ===== nobody made to wait ===== */
(function(){
  const log=$("#wtlog"),say=$("#wtsay"),nm=$("#wtname"),bs=$$("button[data-w]");
  const enq=(id,item,s,e)=>({id,obj:"q",p:id,i:0,kind:"enq",item,s,e,h:item});
  const deq=(id,ret,s,e)=>({id,obj:"q",p:id,i:0,kind:"deq",ret,s,e,h:ret});
  const lab=o=>chip(dual(o.kind==="enq"?`enters House ${o.h}'s request`:`serves House ${o.h}'s request`,o.kind==="enq"?`enqueues P${o.h}'s request`:`dequeues P${o.h}'s request`),o.h);
  const cases=[
    ()=>{const done=[enq("a",1,1,2),deq("c",1,2.5,3.5)],seq=lin(done,true).seq,b=enq("b",2,3,4);
      const ext=seq.concat(b);if(!validSeq(ext,true))throw new Error("the end of the sequence is not allowed");
      return {name:dual("a waiting request","a waiting request"),html:`<div class="e">${dual("So far: House 1's request is entered and served. House 2's request has been sent, and no confirmation has come.","So far: P1's request is entered and served. P2's request has been sent, and no response has come.")}</div><div class="e good">${dual("A sequence that shows the business so far keeps the rule:","A sequence that shows the operations so far is linearizable:")}<div class="seqline">${seq.map(lab).join(" ")}</div></div><div class="e good">${dual("Put House 2's request at the end, and confirm it now:","Put P2's request at the end, and respond now:")}<div class="seqline">${ext.map(lab).join(" ")}</div></div>`,
        say:dual(`<span class="ok">Nothing earlier changes, and nothing began after it finished.</span> The sequence still keeps the rule, so the request can be entered now.`,`<span class="ok">Nothing earlier changes, and nothing began after it finished.</span> The sequence is still linearizable, so the request can be entered now.`)}},
    ()=>{const done=[enq("a",1,1,2),deq("c",1,3,4)],seq=lin(done,true).seq,left=[];seq.forEach(o=>{if(o.kind==="enq")left.push(o.item);else left.shift()});
      return {name:dual("an empty board","an empty queue"),html:`<div class="e">${dual("House 1's request was entered and served, so the board is empty.","P1's request was entered and served, so the queue is empty.")}</div><div class="e bad">${dual(`A loader comes and asks for the oldest request. Requests the board holds: ${left.length}. Answers it could give: ${left.length?left[0]:"none"}.`,`A dequeue asks for the oldest request. Requests the queue holds: ${left.length}. Answers it could give: ${left.length?left[0]:"none"}.`)}</div>`,
        say:dual(`<span class="bad">There is nothing to answer with.</span> A single steward would make the loader wait until a request comes. That wait is asked for, not forced: <i>serve the oldest request</i> has no answer while there are no requests.`,`<span class="bad">There is nothing to answer with.</span> A single sequential queue would make the dequeue wait until a request comes. That wait is part of the operation, not imposed by linearizability: <i>dequeue the oldest request</i> has no answer while there are no requests.`)}},
    ()=>{/* House 1 looks at the oil board and, if empty, requests grain; House 2 looks at the grain board and, if empty, requests oil. Both look and find empty. */
      const groups={1:{look:"o",put:"g"},2:{look:"g",put:"o"}};let fits=0;
      for(const order of [[1,2],[2,1]]){const board={g:0,o:0};let ok=true;for(const h of order){const G=groups[h];if(board[G.look]!==0)ok=false;board[G.put]++}if(ok)fits++}
      if(fits!==0)throw new Error("two groups should not both fit");
      return {name:dual("two things as one","two things as one"),html:`<div class="e">${dual("House 1 looks at the oil board and, if it is empty, asks for grain. House 2 looks at the grain board and, if it is empty, asks for oil. Each does both as one thing, with nothing between.","P1 reads queue O and, if it is empty, enqueues on queue G. P2 reads queue G and, if it is empty, enqueues on queue O. Each does both as one transaction, with nothing between.")}</div><div class="e bad">${dual(`Both find their board empty. Tried with House 1's group first: House 2's look then finds the grain board holding a request. Tried with House 2's first: House 1's look finds the oil board holding one. Sequences that fit: ${fits}.`,`Both find the other queue empty. Tried with P1's transaction first: P2's read then finds queue G holding a request. Tried with P2's first: P1's read finds queue O holding one. Sequences that fit: ${fits}.`)}</div>`,
        say:dual(`<span class="bad">One of the two has to be called off.</span> Promises about such groups can force a house to undo its business. The rule of the board, whose business is always single, never does.`,`<span class="bad">One of the two has to be aborted.</span> Promises about such transactions can force a process to undo its work. Linearizability, which is about single operations, never does.`)}}];
  bs.forEach((b,i)=>b.onclick=()=>{bs.forEach((x,j)=>{x.classList.toggle("on",j===i);x.classList.toggle("alt",j!==i)});const c=cases[i]();nm.innerHTML=c.name;log.innerHTML=c.html;say.innerHTML=c.say});
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
    if(b.peg<=4){const x=sx(b.peg)+35;el("path",{d:`M${x-12},84 L${x+12},84 L${x},104 Z`,fill:"#bf4a26",stroke:"#1c1512","stroke-width":2},svg);dtext(svg,{x:x,y:76,"text-anchor":"middle","font-size":15,fill:"#bf4a26"},"peg","counter")}
    for(const w of ["A","B"])if(b[w].num&&!b[w].put&&b[w].num<=4){const x=sx(b[w].num)+35;el("rect",{x:x-18,y:22,width:36,height:28,rx:4,fill:col[w],"fill-opacity":.45,stroke:"#1c1512","stroke-width":2,"stroke-dasharray":"4 3"},svg);el("text",{x:x,y:43,"text-anchor":"middle","font-size":17},svg).textContent=hs[w]}
    if(b.L.at&&!b.L.took){const x=sx(b.L.at)+35;el("path",{d:`M${x-10},222 L${x+10},222 L${x},206 Z`,fill:"#136f9e",stroke:"#1c1512","stroke-width":2},svg);dtext(svg,{x:x,y:238,"text-anchor":"middle","font-size":14},"loader","dequeuer")}
    if(b.L.took){const x=sx(b.L.from)+35;el("path",{d:`M${x-10},222 L${x+10},222 L${x},206 Z`,fill:"#3f7a2a",stroke:"#1c1512","stroke-width":2},svg);el("text",{x:x,y:238,"text-anchor":"middle","font-size":14},svg).textContent="served"}}
  function cards(b){
    const clerk=(w)=>{const c=b[w];return c.put?dual(`tablet in slot ${c.num}`,`request in slot ${c.num}`):c.num?dual(`has number ${c.num}, tablet not yet in`,`has number ${c.num}, request not yet stored`):dual("not begun","not begun")};
    const ld=b.L.took?dual(`took House ${hs[b.L.took]}'s tablet from slot ${b.L.from}`,`took P${hs[b.L.took]}'s request from slot ${b.L.from}`):b.L.peg?dual(`read the peg: ${b.L.peg}; at slot ${b.L.at}`,`read the counter: ${b.L.peg}; at slot ${b.L.at}`):dual("not at the board","not at the array");
    return [[dual("Clerk, House 1's request","Enqueuer, P1's request"),clerk("A"),b.A.put],[dual("Clerk, House 2's request","Enqueuer, P2's request"),clerk("B"),b.B.put],[dual("Loader","Dequeuer"),ld,!!b.L.took]].map(([h,t,d])=>`<div class="hc${d?" in":""}"><h5>${h}</h5><div class="chk">${t}</div></div>`).join("")}
  scrolly($("#board"),s=>{draw(states[s]);side.innerHTML=cards(states[s])});
})();

/* ===== what the board could mean ===== */
(function(){
  const sl=$("#mnslots"),sq=$("#mnseqs"),say=$("#mnsay"),nm=$("#mnname"),bs=$$("button[data-n]"),ld=$("#mnload");
  /* the request each clerk's movements fall in: a number taken, a tablet put in */
  const runs=[{n:dual("the two clerks race","the two enqueuers race"),tabs:[{h:1,take:1,put:4,slot:1},{h:2,take:2,put:3,slot:2}]},
              {n:dual("one clerk done first","one enqueuer done first"),tabs:[{h:2,take:1,put:2,slot:1},{h:1,take:3,put:4,slot:2}]}];
  let cur=null,rest=null,slots=null;
  const seqs=tabs=>meanings(tabs);
  /* the business could have produced a sequence if it respects what finished before what began */
  const honest=(tabs,s)=>validSeq(s.map(t=>({kind:"enq",obj:"q",item:t.h,s:t.take,e:t.put})),true);
  runs.forEach(r=>{const all=seqs(r.tabs),ok=all.every(s=>honest(r.tabs,s));
    let n=0;(function p(cur,rem){if(!rem.length){if(honest(r.tabs,cur))n++;return}rem.forEach((x,i)=>p(cur.concat(x),rem.filter((_,j)=>j!==i)))})([],r.tabs);
    if(!ok||n!==all.length)throw new Error("the board's meanings and the business's differ")});
  const paint=()=>{
    sl.innerHTML=[1,2,3,4].map(i=>{const t=slots.find(x=>x.slot===i);return `<div class="e" style="border-left-color:${t?HC[t.h]:"#b9a77e"}">slot ${i}: ${t?dual("House "+t.h+"'s request","P"+t.h+"'s request"):"empty"}</div>`}).join("");
    sq.innerHTML=rest.length?rest.map(s=>`<div class="e">${s.length?s.map(t=>`<span class="chip"><i style="background:${HC[t.h]}"></i>${t.h}</span>`).join(" then "):"nothing waiting"}</div>`).join(""):"<div class='e'>nothing waiting</div>"};
  function pick(i){const r=runs[i];cur=r;slots=r.tabs.map(t=>({...t}));rest=seqs(r.tabs);
    bs.forEach((b,j)=>{b.classList.toggle("on",j===i);b.classList.toggle("alt",j!==i)});nm.innerHTML=r.n;ld.disabled=false;paint();
    say.innerHTML=i===0?dual(`Both clerks took their numbers before either tablet went in, so nothing forces one ahead of the other. The board could stand for either sequence. <span class="ok">Each is one the business could have produced:</span> the two requests overlapped.`,`Both enqueuers took their numbers before either request was stored, so nothing forces one ahead of the other. The array could stand for either sequence. <span class="ok">Each is one the operations could have produced:</span> the two requests overlapped.`)
      :dual(`House 2's tablet went in before the other clerk took a number, so it must come first. The board can stand for one sequence only. <span class="ok">It is one the business could have produced.</span>`,`P2's request was stored before the other enqueuer took a number, so it must come first. The array can stand for one sequence only. <span class="ok">It is one the operations could have produced.</span>`)}
  bs.forEach((b,i)=>b.onclick=()=>pick(i));
  ld.onclick=()=>{if(!slots.length)return;slots.sort((a,b)=>a.slot-b.slot);const t=slots[0],before=rest.length,first=rest.filter(s=>s[0].h===t.h).length;
    slots.shift();rest=[...new Set(rest.filter(s=>s[0].h===t.h).map(s=>s.slice(1)))].map(x=>x);
    paint();ld.disabled=!slots.length;
    say.innerHTML=dual(`The loader goes up from slot 1 and takes the first tablet it finds: House ${t.h}'s request from slot ${t.slot}. <span class="ok">It could be first:</span> it leads ${first} of the ${before} sequence${before>1?"s":""} the board could stand for. The waiting requests are left standing for ${rest.length===1?"one sequence":rest.length+" sequences"}.`,`The dequeuer scans up from slot 1 and takes the first request it finds: P${t.h}'s request from slot ${t.slot}. <span class="ok">It could be first:</span> it leads ${first} of the ${before} sequence${before>1?"s":""} the array could stand for. The waiting requests are left standing for ${rest.length===1?"one sequence":rest.length+" sequences"}.`)}
})();

/* ===== who is who ===== */
mapPairs($("#map"),[["A trading house; a loader; a clerk","A process: it waits for each answer before its next call"],["The board; placed first, filled first","A shared FIFO queue"],["A request; a serving","Enq; Deq"],["Sending a request; its confirmation","An invocation and its response"],["Before; overlap","Real-time order; concurrent calls"],["A single steward with a single board","The object's sequential specification"],["The rule of the board","Linearizability"],["A moment inside the span","The linearization point"],["The tallies' first","Happened-before, extended by process number"],["The looser rule","Sequential consistency"],["One Board at a Time","Locality: check each object alone"],["No Request Waits on Another","The nonblocking property"],["Several things done as one","A transaction; serializability"],["The busy board: slots and a peg","A lock-free queue on an array and a counter"],["What the board could mean","An abstraction function to a set of values"],["A rule that only forbids","A safety property, with no promise of progress"]]);
REG.start();
})();

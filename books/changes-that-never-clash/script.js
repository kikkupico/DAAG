"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,Polar,Timeline}=BOOK;
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
  const g=stage(svg,"FIG. 1 · JOIN SEMILATTICE","merge = entrywise max");
  const cx=260,Yt=118,Y2=214,Y1=316,Y0=412,dx=122;
  const N={top:[cx,Yt,"1,1,1"],ab:[cx-dx,Y2,"1,1,0"],ac:[cx,Y2,"1,0,1"],bc:[cx+dx,Y2,"0,1,1"],a:[cx-dx,Y1,"1,0,0"],b:[cx,Y1,"0,1,0"],c:[cx+dx,Y1,"0,0,1"],o:[cx,Y0,"0,0,0"]};
  const E=[["o","a"],["o","b"],["o","c"],["a","ab"],["a","ac"],["b","ab"],["b","bc"],["c","ac"],["c","bc"],["ab","top"],["ac","top"],["bc","top"]];
  const hot={a:"blue",b:"gold",c:"red"},paths={};
  for(const [u,v] of E)link(g,N[u][0],N[u][1],N[v][0],N[v][1],{c:"mute",op:.3,head:false,w:1.4});
  /* the three replicas' states join upward */
  const up=(u,v,c)=>{const p=link(g,N[u][0],N[u][1],N[v][0],N[v][1],{c,w:2.2,op:.9});return p};
  const pp=[up("a","ab","blue"),up("a","ac","blue"),up("b","ab","gold"),up("b","bc","gold"),up("c","ac","red"),up("c","bc","red"),up("ab","top","blue"),up("ac","top","blue"),up("bc","top","gold")];
  pp.forEach((p,k)=>packet(g,p,{c:["blue","blue","gold","gold","red","red","blue","blue","gold"][k],dur:2.6+(k%3)*.4,delay:k*.3,r:3.4}));
  for(const k in N){const [x,y,v]=N[k],h=hot[k],top=k==="top";
    const c=chip(g,x,y,"["+v+"]",{m:1,s:11,w:600,f:h?P[h+"L"]:top?P.ink:"#fff",k:h?P[h]:top?P.ink:P.line,c:top?"#fff":h?P[h]:P.ink,sw:h||top?1.6:1});
    if(h){node(g,x+(k==="a"?-82:k==="c"?82:0),y+(k==="b"?36:0),15,k==="a"?"R1":k==="b"?"R2":"R3",{k:P[h],c:P[h],f:"#fff",s:10.5,halo:P[h+"L"]});
      if(k!=="b")link(g,x+(k==="a"?-68:68),y,x+(k==="a"?-48:48),y,{c:h,w:1.4,head:false,dash:"2 3"})
      else link(g,x,y+21,x,y+11,{c:h,w:1.4,head:false,dash:"2 3"});
      const vx=x+(k==="a"?-82:k==="c"?82:0),vy=y+(k==="b"?72:40);
      vec(g,vx,vy,k==="a"?[3,0,0]:k==="b"?[0,2,0]:[0,0,4],{k:P[h],hi:[k==="a"?0:k==="b"?1:2],hf:P[h+"L"],hc:P[h],w:17,h:18,s:10});
      T(g,vx,vy+19,"+1 +1 +1".slice(0,k==="a"?8:k==="b"?5:11)+"",{s:8.5,m:1,c:P.faint})}}
  T(g,cx,Yt-30,"⊔  join: every replica converges here",{s:10.5,c:P.mute,m:1});
  T(g,cx,Y0+34,"each replica starts at ⊥",{s:10,c:P.faint,m:1});
  /* formula strip */
  const fy=H-38,fx=cx;
  chip(g,fx,fy,"[3,0,0] ⊔ [0,2,0] ⊔ [0,0,4] = [3,2,4]",{m:1,s:11.5,pad:26,k:P.ink,sw:1.4,f:P.bg});
  T(g,fx,fy+26,"commutative · associative · idempotent",{s:9.5,m:1,c:P.faint})
};
COVERS.draw("#coversvg",COVER);COVERS.mount(COVER);
/* cover:end */

/* ===== a table of pebbles: a pile for every library, in white (lent) and, when used, black (returned) ===== */
const TN=["library 1","library 2","library 3"],TM=["replica 1","replica 2","replica 3"];
const T_=i=>dual(TN[i],TM[i]),tn=i=>dual("Table at "+TN[i],"State at "+TM[i]),lends=i=>dual(`Library ${i+1} lends one`,`Replica ${i+1}`),Up=s=>s[0].toUpperCase()+s.slice(1);
const pile=(n,own,k)=>`<div class="col${own?" own":""}${k?" k":""}">${"<i></i>".repeat(Math.min(n,9))}</div>`;
function tableHtml(name,own,white,black,total){
  const cols=(v,k)=>`<div class="cols">${v.map((n,i)=>pile(n,i===own,k)).join("")}</div><div class="lbl">${v.map((n,i)=>`<span>${i+1}: ${n}</span>`).join("")}</div>`;
  return `<div class="ptab"><h5><span>${name}</span><span>${dual("out","value")} <b>${total}</b></span></h5>`+
    (black?`<div class="sets"><div><span class="t">${dual("lent","increments (P)")}</span>${cols(white,false)}</div><div><span class="t">${dual("returned","decrements (N)")}</span>${cols(black,true)}</div></div>`:cols(white,false))+`</div>`;
}
const sum=v=>v.reduce((a,b)=>a+b,0),larger=(x,y)=>x.map((n,i)=>Math.max(n,y[i]));

/* ===== one column each, take the larger ===== */
(function(){
  const box=$("#tabs"),say=$("#tsay");let T,made,rule="max",from=0,to=1;
  const paint=()=>{box.innerHTML=T.map((v,i)=>tableHtml(tn(i),i,v,null,sum(v))).join("")};
  const verdict=()=>{const c=T.map(sum),same=c.every(x=>x===c[0]);
    return c.some(x=>x>made)?` <span class="bad">${dual(`A table now shows more scrolls out than the ${made} he was lent.`,`A state now shows more increments than the ${made} that were made.`)}</span>`:same&&c[0]===made&&made?` <span class="ok">${dual(`All three tables show ${made}, the scrolls he has out.`,`All three states show ${made}, the increments made.`)}</span>`:""};
  function reset(){T=[[0,0,0],[0,0,0],[0,0,0]];made=0;paint();say.innerHTML=dual("Each table has a column for every library. The shaded column is the one its own librarian may add to.","Each state has an entry for every replica. The shaded entry is the one its own replica may increment.")}
  $("#tmake").innerHTML=TN.map((n,i)=>`<button class="btn" data-i="${i}">${lends(i)}</button>`).join("");
  $$("button",$("#tmake")).forEach(bt=>bt.onclick=()=>{const i=+bt.dataset.i;T[i][i]++;made++;paint();say.innerHTML=dual(`${TN[i][0].toUpperCase()+TN[i].slice(1)} lends him a scroll, and its librarian adds a white pebble to column ${i+1} of its own table, and to no other.`,`Replica ${i+1} increments Entry ${i+1} of its own state, and no other entry.`)});
  seg($("#trule"),[["max",dual("takes the larger pile in each column","takes the maximum in each entry")],["add",dual("adds the piles together","adds the entries together")]],rule,v=>{rule=v;reset()});
  seg($("#tfrom"),TN.map((n,i)=>[i,T_(i)]),from,v=>{from=+v});seg($("#tto"),TN.map((n,i)=>[i,T_(i)]),to,v=>{to=+v});
  $("#tsend").onclick=()=>{if(from===to){say.innerHTML=dual("Choose two different libraries.","Choose two different replicas.");return}
    const before=T[to].join();T[to]=rule==="max"?larger(T[to],T[from]):T[to].map((n,i)=>n+T[from][i]);paint();
    say.innerHTML=(rule==="max"?(T[to].join()===before?dual(`The table of ${TN[from]} reaches ${TN[to]} and changes nothing: ${TN[to]} already held all of it.`,`The state of ${TM[from]} reaches ${TM[to]} and changes nothing: ${TM[to]} already held all of it.`):dual(`${Up(TN[to])} takes the larger pile in each column.`,`${Up(TM[to])} takes the maximum in each entry.`)):dual(`${Up(TN[to])} adds each arriving pile to its own.`,`${Up(TM[to])} adds each arriving entry to its own.`))+verdict()};
  $("#treset").onclick=reset;reset();
})();

/* ===== the table or the change ===== */
(function(){
  const box=$("#wtabs"),say=$("#wsay");let t1,t2;
  const paint=()=>{box.innerHTML=tableHtml(tn(0),0,t1,null,sum(t1))+tableHtml(tn(1),1,t2,null,sum(t2));$("#wshown").textContent=sum(t2)};
  function reset(){t1=[1,0,0];t2=[0,0,0];paint();say.innerHTML=dual("Library 2 has not heard yet.","Replica 2 has not heard yet.")}
  $("#wtable").onclick=()=>{const b=t2.join();t2=larger(t2,t1);paint();say.innerHTML=t2.join()===b?dual(`The same table again. Library 2 takes the larger pile in each column, and nothing changes. <span class="ok">Still ${sum(t2)}.</span>`,`The same state again. Replica 2 takes the maximum in each entry, and nothing changes. <span class="ok">Still ${sum(t2)}.</span>`):dual("Library 2 takes the larger pile in each column.","Replica 2 takes the maximum in each entry.")};
  $("#wnote").onclick=()=>{t2[0]++;paint();say.innerHTML=sum(t2)>1?dual(`<i>One more scroll lent at library 1</i>, taken in again. Nothing in the notice says which loan. <span class="bad">Library 2 now shows ${sum(t2)} out for one scroll lent.</span>`,`<i>Increment Entry 1</i>, applied again. Nothing in the operation says which increment. <span class="bad">Replica 2 now shows ${sum(t2)} for one increment made.</span>`):dual("<i>One more scroll lent at library 1.</i> Library 2 adds a pebble to column 1.","<i>Increment Entry 1.</i> Replica 2 increments Entry 1.")};
  $("#wreset").onclick=reset;reset();
})();

/* ===== lent and returned, and the deposit's limit ===== */
(function(){
  const box=$("#ltabs"),say=$("#lsay");let W,K,rule="seen";
  /* the deposit lets him have three out at once; split in advance, library 1 holds two of it, library 2 one, library 3 none */
  const DEP=3,SHARE=[2,1,0];
  const count=i=>sum(W[i])-sum(K[i]),truth=()=>sum(larger(W[0],W[1]))-sum(larger(K[0],K[1]));
  const paint=()=>{box.innerHTML=[0,1].map(i=>tableHtml(tn(i),i,W[i],K[i],count(i))).join("")};
  const start=()=>rule==="seen"?dual(`His deposit lets him have ${DEP} scrolls out at once. Library 1 and Library 2 have each lent him one, and both tables show 2 out: room for one more.`,`The bound is ${DEP}. Replica 1 and Replica 2 have each incremented once, and both states show 2: one unit below the bound.`)
    :dual(`His deposit of ${DEP} was split before he began: ${SHARE[0]} to Library 1, ${SHARE[1]} to Library 2, none to Library 3. Each has lent him one.`,`The bound of ${DEP} was split in advance: ${SHARE[0]} to replica 1, ${SHARE[1]} to replica 2, 0 to replica 3. Each has incremented once.`);
  function reset(){W=[[1,1,0],[1,1,0]];K=[[0,0,0],[0,0,0]];paint();say.innerHTML=start()}
  /* seen: while its own table shows room under the deposit; own: while what it has lent, less what came back to it, is under its share */
  const may=i=>rule==="seen"?count(i)<DEP:W[i][i]-K[i][i]<SHARE[i];
  const lend=i=>{if(!may(i)){say.innerHTML=rule==="seen"?dual(`The table at ${TN[i]} shows ${count(i)} out, all the deposit allows, so its desk may not lend.`,`The state at ${TM[i]} shows ${count(i)}, the bound, so it may not increment.`):dual(`${TN[i][0].toUpperCase()+TN[i].slice(1)} has lent ${W[i][i]-K[i][i]} more than came back to it, all of its share, so its desk may not lend, whatever its table shows.`,`${TM[i][0].toUpperCase()+TM[i].slice(1)} has P − N = ${W[i][i]-K[i][i]} for its own entries, its whole share, so it may not increment, whatever its state shows.`);return}
    W[i][i]++;paint();say.innerHTML=dual(`${TN[i][0].toUpperCase()+TN[i].slice(1)} lends him a scroll and adds a white pebble to column ${i+1}. Its table now shows ${count(i)} out.`,`Replica ${i+1} adds one to Entry ${i+1} of its P vector. Its state now shows ${count(i)}.`)};
  $("#l1").onclick=()=>lend(0);$("#l2").onclick=()=>lend(1);
  $("#lret").onclick=()=>{if(truth()<1){say.innerHTML=dual("He has nothing out to return.","Nothing to decrement: the value is 0.");return}
    K[1][1]++;paint();say.innerHTML=dual(`He brings a scroll back to Library 2, whichever library lent it, and its librarian adds a black pebble to column 2. Its table now shows ${count(1)} out.`,`Replica 2 adds one to Entry 2 of its N vector. Its state now shows ${count(1)}.`)};
  $("#lmeet").onclick=()=>{const w=larger(W[0],W[1]),k=larger(K[0],K[1]);W=[w.slice(),w.slice()];K=[k.slice(),k.slice()];paint();const c=count(0);
    say.innerHTML=c>DEP?dual(`Each set of columns takes the larger pile. ${sum(w)} lent, ${sum(k)} returned: <span class="bad">he has ${c} out, and his deposit allows ${DEP}.</span> Each desk kept to what its table showed.`,`Each vector takes the maximum in each entry. <span class="bad">The value is ${c}, past the bound of ${DEP}.</span> Each replica kept the rule its state allowed.`):dual(`Each set of columns takes the larger pile. Both tables show ${c} out, <span class="ok">within the deposit of ${DEP}</span>.`,`Each vector takes the maximum in each entry. Both states show ${c}, <span class="ok">within the bound of ${DEP}</span>.`)};
  seg($("#lrule"),[["seen",dual("if its own table shows room","if its own state shows room")],["own",dual("only up to its own share of the deposit","only up to its own share of the bound")]],rule,v=>{rule=v;reset()});
  $("#lreset").onclick=reset;reset();
})();

/* ===== two hands on one work: the later wins, or both are kept ===== */
(function(){
  const E=[{by:"Library 1",byM:"Replica 1",t:"noon",n:1,after:[]},{by:"Library 2",byM:"Replica 2",t:"later that day",n:2,after:[]}];let rule="later",first=0;
  /* take in editions one at a time, in the order they arrive */
  function settle(order){let kept=[];
    order.forEach(i=>{const e=E[i];
      if(rule==="later"){if(!kept.length||e.n>kept[0].n)kept=[e]}
      else{if(kept.some(k=>k.after.includes(e)))return;kept=kept.filter(k=>!e.after.includes(k));kept.push(e)}});
    return kept.sort((a,b)=>a.n-b.n)}
  const show=k=>k.map(e=>`<span class="it">${dual(`correction by ${e.by}, tally: ${e.t}`,`write by ${e.byM}, timestamp: ${e.t}`)}</span>`).join("");
  function paint(){const a=settle([first,1-first]),b=settle([1-first,first]);
    if(a.map(e=>e.n).join()!==b.map(e=>e.n).join())throw new Error("the two orders settled differently");
    $("#hout").innerHTML=`<div class="shelf"><h5>${dual(`Library 3, hearing from ${E[first].by} first`,`Replica 3, receiving from ${E[first].byM} first`)}</h5>${show(a)}</div><div class="shelf"><h5>${dual(`Library 3, had it heard from ${E[1-first].by} first`,`Replica 3, had it received from ${E[1-first].byM} first`)}</h5>${show(b)}</div>`;
    $("#hsay").innerHTML=rule==="later"?dual("Library 3 keeps Library 2's correction, whichever arrives first. Library 1's is lost for good.","Replica 3 keeps Replica 2's write, whichever arrives first. Replica 1's is lost for good."):dual("Neither correction was written after the other, so Library 3 keeps both, whichever arrives first, and a reader is shown the two.","Neither write was made after the other, so Replica 3 keeps both, whichever arrives first, and a reader is shown the two.")}
  seg($("#hrule"),[["later","keep the later"],["both","keep both"]],rule,v=>{rule=v;paint()});
  seg($("#hord"),[[0,dual("Library 1","Replica 1")],[1,dual("Library 2","Replica 2")]],first,v=>{first=+v;paint()});paint();
})();

/* ===== a list where every writing of a title has its own tag: what is held is the tags written and the tags struck ===== */
function Marks(name){return {name,add:new Set(),struck:new Set(),n:0,
  write(title){const m=`${title}·${name}·${++this.n}`;this.add.add(m);return m},
  live(title){return [...this.add].filter(m=>m.startsWith(title+"·")&&!this.struck.has(m))},
  strike(title){const seen=this.live(title);seen.forEach(m=>this.struck.add(m));return seen},
  take(o){o.add.forEach(m=>this.add.add(m));o.struck.forEach(m=>this.struck.add(m))}}}
(function(){
  const box=$("#olibs"),say=$("#osay");let L;
  const lab=m=>{const [t,l,n]=m.split("·");return `tag ${l}-${n}`};
  const shelf=l=>`<div class="shelf"><h5>${dual(`Library ${l.name}'s list`,`Replica ${l.name}'s set`)}</h5>${[...l.add].map(m=>`<span class="it${l.struck.has(m)?" gone":""}">${dual("the title, ","the element, ")}${lab(m)}</span>`).join("")||`<span class="it none">${dual("nothing written yet","nothing added yet")}</span>`}<div style="margin-top:6px">${l.live("T").length?`<span class="ok">${dual("The title is on the catalogue.","The element is in the set.")}</span>`:dual("The title is not on the catalogue.","The element is not in the set.")}</div></div>`;
  const paint=()=>box.innerHTML=L.map(shelf).join("");
  function reset(){L=[Marks("1"),Marks("2")];paint();say.innerHTML=dual("Each library sees only its own list until the two exchange.","Each replica sees only its own set until the two exchange.")}
  const add=i=>{const m=L[i].write("T");paint();say.innerHTML=dual(`Library ${i+1} writes the title, with ${lab(m)}.`,`Replica ${i+1} adds the element, with ${lab(m)}.`)};
  const strike=i=>{const s=L[i].strike("T");paint();say.innerHTML=s.length?dual(`Library ${i+1} strikes every tag of the title it can see: ${s.map(lab).join(", ")}.`,`Replica ${i+1} removes every tag of the element it can see: ${s.map(lab).join(", ")}.`):dual(`Library ${i+1} sees no tag of the title, so there is nothing for it to strike.`,`Replica ${i+1} sees no tag of the element, so there is nothing for it to remove.`)};
  $("#oa1").onclick=()=>add(0);$("#oa2").onclick=()=>add(1);$("#os1").onclick=()=>strike(0);$("#os2").onclick=()=>strike(1);
  $("#omeet").onclick=()=>{L[0].take(L[1]);L[1].take(L[0]);paint();const on=L[0].live("T");
    say.innerHTML=on.length?dual(`Each takes in the other's tags and strikes. ${on.map(lab).join(", ")} ${on.length>1?"were":"was"} never struck, so <span class="ok">the title is on the catalogue</span> at both.`,`Each takes in the other's tags and removals. ${on.map(lab).join(", ")} ${on.length>1?"were":"was"} never removed, so <span class="ok">the element is in the set</span> at both.`):dual("Each takes in the other's tags and strikes. Every tag has been struck, so the title is off the catalogue at both.","Each takes in the other's tags and removals. Every tag has been removed, so the element is out of the set at both.")};
  $("#oreset").onclick=reset;reset();
})();

/* ===== not the same as one order: the four acts, worked by the same rule ===== */
(function(){
  Timeline($("#ordsvg"),{vb:"0 0 520 500",cx:260,cy:262,r0:40,step:26,rings:7,tEnd:7.6,note:[12,22],
    nodes:{A:[-90,"L1","#e0b84a","R1"],B:[30,"L2","#8fb3d9","R2"],T:[150,"L3","#f6eed6","R3"]}},P=>{
  const ev=(k,t,f,s)=>{P.event(k,t,f).label.textContent=s};
  ev("A",1.6,"#e0b84a","+E");ev("A",3.2,"#fde0d4","−F");ev("B",1.6,"#8fb3d9","+F");ev("B",3.2,"#fde0d4","−E");
  P.slip("A",3.6,"T",5.4);P.slip("B",3.6,"T",6.2);ev("T",5.4,"#f6eed6","");ev("T",6.2,"#a9c25a","");
  });
  const a=Marks("1"),b=Marks("2"),t=Marks("T");
  a.write("E");const sf=a.strike("F");b.write("F");const se=b.strike("E");t.take(a);t.take(b);
  const on=["E","F"].filter(x=>t.live(x).length);
  /* every single order of the four acts that keeps each library's own two in turn */
  const acts=[["a","add","E"],["a","strike","F"],["b","add","F"],["b","strike","E"]],orders=[];
  (function go(done,ia,ib){if(done.length===4){orders.push(done);return}
    if(ia<2)go([...done,acts[ia]],ia+1,ib);if(ib<2)go([...done,acts[2+ib]],ia,ib+1)})([],0,0);
  const both=orders.filter(o=>{const s=new Set();o.forEach(([,k,x])=>k==="add"?s.add(x):s.delete(x));return s.has("E")&&s.has("F")}).length;
  $("#ordlist").innerHTML=`<li>${dual("<b>L1</b> Library 1 · <b>L2</b> Library 2 · <b>L3</b> Library 3","<b>R1</b> Replica 1 · <b>R2</b> Replica 2 · <b>R3</b> a third replica")}</li><li>${dual(`Library 1 adds E, then strikes F. It sees ${sf.length} ${sf.length===1?"tag":"tags"} of F.`,`Replica 1 adds E, then removes F. It sees ${sf.length} ${sf.length===1?"tag":"tags"} of F.`)}</li><li>${dual(`Library 2 adds F, then strikes E. It sees ${se.length} ${se.length===1?"tag":"tags"} of E.`,`Replica 2 adds F, then removes E. It sees ${se.length} ${se.length===1?"tag":"tags"} of E.`)}</li><li>${dual("Library 3 takes in both lists.","The third replica takes in both states.")}</li>`;
  $("#ordsay").innerHTML=dual(`On Library 3's list: <b>${on.join(" and ")||"neither"}</b>. Of the ${orders.length} single orders in which the four acts could be done one after another, ${both||"none"} ${both===1?"ends":"end"} with both titles on the list.`,`In the third replica's set: <b>${on.join(" and ")||"neither"}</b>. Of the ${orders.length} single orders in which the four operations could be done one after another, ${both||"none"} ${both===1?"ends":"end"} with both elements in the set.`);
})();

REG.start();
})();

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

/* ===== machines: a plain counter merged two wrong ways ===== */
(function(){
  let a=0,b=0,t=0;const note=$("#mnote"),paint=()=>{$("#ma").textContent=a;$("#mb").textContent=b;$("#mt").textContent=t};
  $("#minc").onclick=()=>{a++;b++;t+=2;paint();note.textContent="Each replica counted one more. Neither knows of the other's."};
  $("#mmax").onclick=()=>{a=b=Math.max(a,b);paint();note.innerHTML=a<t?`Both now say ${a}. <span class="bad">${t} increments were made.</span> Keeping the larger loses the other replica's.`:`Both say ${a}.`};
  $("#madd").onclick=()=>{a=b=a+b;paint();note.innerHTML=a===t?`Both now say ${a}, which is right this once. Merge again.`:`Both now say ${a}. <span class="bad">${t} increments were made.</span> Adding counts the shared part again at every merge.`};
  paint();
})();

/* ===== a table of pebbles: a pile for every terrace, in white (made) and, when used, black (lost) ===== */
const TN=["terrace 1","terrace 2","terrace 3"];
const pile=(n,own,k)=>`<div class="col${own?" own":""}${k?" k":""}">${"<i></i>".repeat(Math.min(n,9))}</div>`;
function tableHtml(name,own,white,black,total){
  const cols=(v,k)=>`<div class="cols">${v.map((n,i)=>pile(n,i===own,k)).join("")}</div><div class="lbl">${v.map((n,i)=>`<span>${i+1}: ${n}</span>`).join("")}</div>`;
  return `<div class="ptab"><h5><span>${name}</span><span>count <b>${total}</b></span></h5>`+
    (black?`<div class="sets"><div><span class="t">made</span>${cols(white,false)}</div><div><span class="t">lost</span>${cols(black,true)}</div></div>`:cols(white,false))+`</div>`;
}
const sum=v=>v.reduce((a,b)=>a+b,0),larger=(x,y)=>x.map((n,i)=>Math.max(n,y[i]));

/* ===== one column each, take the larger ===== */
(function(){
  const box=$("#tabs"),say=$("#tsay");let T,made,rule="max",from=0,to=1;
  const paint=()=>{box.innerHTML=T.map((v,i)=>tableHtml("Table at "+TN[i],i,v,null,sum(v))).join("")};
  const verdict=()=>{const c=T.map(sum),same=c.every(x=>x===c[0]);
    return c.some(x=>x>made)?` <span class="bad">A table now shows more copies than the ${made} that were made.</span>`:same&&c[0]===made&&made?` <span class="ok">All three tables show ${made}, the copies made.</span>`:""};
  function reset(){T=[[0,0,0],[0,0,0],[0,0,0]];made=0;paint();say.textContent="Each table has a column for every terrace. The shaded column is the one its own scribe may add to."}
  $("#tmake").innerHTML=TN.map((n,i)=>`<button class="btn" data-i="${i}">${n}</button>`).join("");
  $$("button",$("#tmake")).forEach(bt=>bt.onclick=()=>{const i=+bt.dataset.i;T[i][i]++;made++;paint();say.innerHTML=`The scribe at ${TN[i]} adds a white pebble to column ${i+1} of the table there, and to no other.`});
  seg($("#trule"),[["max","takes the larger pile in each column"],["add","adds the piles together"]],rule,v=>{rule=v;reset()});
  seg($("#tfrom"),TN.map((n,i)=>[i,n]),from,v=>{from=+v});seg($("#tto"),TN.map((n,i)=>[i,n]),to,v=>{to=+v});
  $("#tsend").onclick=()=>{if(from===to){say.textContent="Choose two different terraces.";return}
    const before=T[to].join();T[to]=rule==="max"?larger(T[to],T[from]):T[to].map((n,i)=>n+T[from][i]);paint();
    say.innerHTML=(rule==="max"?(T[to].join()===before?`The table of ${TN[from]} reaches ${TN[to]} and changes nothing: ${TN[to]} already held all of it.`:`${TN[to]} takes the larger pile in each column.`):`${TN[to]} adds each arriving pile to its own.`)+verdict()};
  $("#treset").onclick=reset;reset();
})();

/* ===== the table or the change ===== */
(function(){
  const box=$("#wtabs"),say=$("#wsay");let t1,t2;
  const paint=()=>{box.innerHTML=tableHtml("Table at terrace 1",0,t1,null,sum(t1))+tableHtml("Table at terrace 2",1,t2,null,sum(t2));$("#wshown").textContent=sum(t2)};
  function reset(){t1=[1,0,0];t2=[0,0,0];paint();say.textContent="Terrace 2 has not heard yet."}
  $("#wtable").onclick=()=>{const b=t2.join();t2=larger(t2,t1);paint();say.innerHTML=t2.join()===b?`The same table again. Terrace 2 takes the larger pile in each column, and nothing changes. <span class="ok">Still ${sum(t2)}.</span>`:"Terrace 2 takes the larger pile in each column."};
  $("#wnote").onclick=()=>{t2[0]++;paint();say.innerHTML=sum(t2)>1?`<i>One more copy at terrace 1</i>, taken in again. Nothing in the notice says which copy. <span class="bad">Terrace 2 now shows ${sum(t2)} for one copy made.</span>`:"<i>One more copy at terrace 1.</i> Terrace 2 adds a pebble to column 1."};
  $("#wreset").onclick=reset;reset();
})();

/* ===== made and lost ===== */
(function(){
  const box=$("#ltabs"),say=$("#lsay");let W,K,rule="seen";
  const count=i=>sum(W[i])-sum(K[i]);
  const paint=()=>{box.innerHTML=[0,1].map(i=>tableHtml("Table at "+TN[i],i,W[i],K[i],count(i))).join("")};
  function reset(){W=[[1,0,0],[1,0,0]];K=[[0,0,0],[0,0,0]];paint();say.textContent="The one copy was made at terrace 1. Both tables show it."}
  /* seen: only if the scribe's own table shows a copy left; own: no more lost than were made at the scribe's own terrace */
  const may=i=>rule==="seen"?count(i)>0:W[i][i]-K[i][i]>0;
  const lose=i=>{if(!may(i)){say.innerHTML=rule==="seen"?`The table at ${TN[i]} shows no copy left, so its scribe may not mark one lost.`:`No copy was made at ${TN[i]} that is not already marked lost there, so its scribe may mark none, whatever the library holds.`;return}
    K[i][i]++;paint();say.innerHTML=`The scribe at ${TN[i]} adds a black pebble to column ${i+1}. That table now shows ${count(i)}.`};
  $("#l1").onclick=()=>lose(0);$("#l2").onclick=()=>lose(1);
  $("#lmeet").onclick=()=>{const w=larger(W[0],W[1]),k=larger(K[0],K[1]);W=[w.slice(),w.slice()];K=[k.slice(),k.slice()];paint();const c=count(0);
    say.innerHTML=c<0?`Each set of columns takes the larger pile. One made, ${sum(k)} lost: <span class="bad">the count is ${c}.</span> Each scribe kept the rule the table allowed.`:`Each set of columns takes the larger pile. Both tables show ${c}.`};
  seg($("#lrule"),[["seen","if the table shows a copy left"],["own","no more than were made at the scribe's own terrace"]],rule,v=>{rule=v;reset()});
  $("#lreset").onclick=reset;reset();
})();

/* ===== two hands on one work: the later wins, or both are kept ===== */
(function(){
  const E=[{by:"Library 1",t:"noon",n:1,after:[]},{by:"Library 2",t:"later that day",n:2,after:[]}];let rule="later",first=0;
  /* take in editions one at a time, in the order they arrive */
  function settle(order){let kept=[];
    order.forEach(i=>{const e=E[i];
      if(rule==="later"){if(!kept.length||e.n>kept[0].n)kept=[e]}
      else{if(kept.some(k=>k.after.includes(e)))return;kept=kept.filter(k=>!e.after.includes(k));kept.push(e)}});
    return kept.sort((a,b)=>a.n-b.n)}
  const show=k=>k.map(e=>`<span class="it">correction by ${e.by}, tally: ${e.t}</span>`).join("");
  function paint(){const a=settle([first,1-first]),b=settle([1-first,first]);
    if(a.map(e=>e.n).join()!==b.map(e=>e.n).join())throw new Error("the terraces settled differently");
    $("#hout").innerHTML=`<div class="shelf"><h5>A terrace that hears from ${E[first].by} first</h5>${show(a)}</div><div class="shelf"><h5>A terrace that hears from ${E[1-first].by} first</h5>${show(b)}</div>`;
    $("#hsay").innerHTML=rule==="later"?"Both terraces keep Library 2's correction, whichever arrived first. Library 1's is lost for good.":"Neither correction was written after the other, so both terraces keep both, and a reader is shown the two."}
  seg($("#hrule"),[["later","keep the later"],["both","keep both"]],rule,v=>{rule=v;paint()});
  seg($("#hord"),[[0,"Library 1"],[1,"Library 2"]],first,v=>{first=+v;paint()});paint();
})();

/* ===== a list where every writing of a title has its own mark: what is held is the marks written and the marks struck ===== */
function Marks(name){return {name,add:new Set(),struck:new Set(),n:0,
  write(title){const m=`${title}·${name}·${++this.n}`;this.add.add(m);return m},
  live(title){return [...this.add].filter(m=>m.startsWith(title+"·")&&!this.struck.has(m))},
  strike(title){const seen=this.live(title);seen.forEach(m=>this.struck.add(m));return seen},
  take(o){o.add.forEach(m=>this.add.add(m));o.struck.forEach(m=>this.struck.add(m))}}}
(function(){
  const box=$("#olibs"),say=$("#osay");let L;
  const lab=m=>{const [t,l,n]=m.split("·");return `mark ${l}-${n}`};
  const shelf=l=>`<div class="shelf"><h5>Library ${l.name}'s list</h5>${[...l.add].map(m=>`<span class="it${l.struck.has(m)?" gone":""}">the title, ${lab(m)}</span>`).join("")||'<span class="it none">nothing written yet</span>'}<div style="margin-top:6px">${l.live("T").length?'<span class="ok">The title is on the catalogue.</span>':'The title is not on the catalogue.'}</div></div>`;
  const paint=()=>box.innerHTML=L.map(shelf).join("");
  function reset(){L=[Marks("1"),Marks("2")];paint();say.textContent="Each library sees only its own list until the two exchange."}
  const add=i=>{const m=L[i].write("T");paint();say.innerHTML=`Library ${i+1} writes the title, with ${lab(m)}.`};
  const strike=i=>{const s=L[i].strike("T");paint();say.innerHTML=s.length?`Library ${i+1} strikes every mark of the title it can see: ${s.map(lab).join(", ")}.`:`Library ${i+1} sees no mark of the title, so there is nothing for it to strike.`};
  $("#oa1").onclick=()=>add(0);$("#oa2").onclick=()=>add(1);$("#os1").onclick=()=>strike(0);$("#os2").onclick=()=>strike(1);
  $("#omeet").onclick=()=>{L[0].take(L[1]);L[1].take(L[0]);paint();const on=L[0].live("T");
    say.innerHTML=on.length?`Each takes in the other's marks and strikes. ${on.map(lab).join(", ")} ${on.length>1?"were":"was"} never struck, so <span class="ok">the title is on the catalogue</span> at both.`:"Each takes in the other's marks and strikes. Every mark has been struck, so the title is off the catalogue at both."};
  $("#oreset").onclick=reset;reset();
})();

/* ===== not the same as one order: the four acts, worked by the same rule ===== */
(function(){
  const P=Polar($("#ordsvg"),{vb:"0 0 520 500",cx:260,cy:262,r0:40,step:26,rings:7,tEnd:7.6,note:[12,22],
    nodes:{A:[-90,"L1","#e0b84a"],B:[30,"L2","#8fb3d9"],T:[150,"T","#f6eed6"]}});
  const ev=(k,t,f,s)=>{P.event(k,t,f).label.textContent=s};
  ev("A",1.6,"#e0b84a","+E");ev("A",3.2,"#fde0d4","−F");ev("B",1.6,"#8fb3d9","+F");ev("B",3.2,"#fde0d4","−E");
  P.slip("A",3.6,"T",5.4);P.slip("B",3.6,"T",6.2);ev("T",5.4,"#f6eed6","");ev("T",6.2,"#a9c25a","");
  const a=Marks("1"),b=Marks("2"),t=Marks("T");
  a.write("E");const sf=a.strike("F");b.write("F");const se=b.strike("E");t.take(a);t.take(b);
  const on=["E","F"].filter(x=>t.live(x).length);
  /* every single order of the four acts that keeps each library's own two in turn */
  const acts=[["a","add","E"],["a","strike","F"],["b","add","F"],["b","strike","E"]],orders=[];
  (function go(done,ia,ib){if(done.length===4){orders.push(done);return}
    if(ia<2)go([...done,acts[ia]],ia+1,ib);if(ib<2)go([...done,acts[2+ib]],ia,ib+1)})([],0,0);
  const both=orders.filter(o=>{const s=new Set();o.forEach(([,k,x])=>k==="add"?s.add(x):s.delete(x));return s.has("E")&&s.has("F")}).length;
  $("#ordlist").innerHTML=`<li><b>L1</b> Library 1 · <b>L2</b> Library 2 · <b>T</b> a terrace</li><li>Library 1 adds E, then strikes F. It sees ${sf.length} ${sf.length===1?"mark":"marks"} of F.</li><li>Library 2 adds F, then strikes E. It sees ${se.length} ${se.length===1?"mark":"marks"} of E.</li><li>The terrace takes in both lists.</li>`;
  $("#ordsay").innerHTML=`On the terrace's list: <b>${on.join(" and ")||"neither"}</b>. Of the ${orders.length} single orders in which the four acts could be done one after another, ${both||"none"} ${both===1?"ends":"end"} with both titles on the list.`;
})();

mapPairs($("#map"),[["A terrace, its scribe and its table","A replica and its state"],["Terraces that heard the same news show the same count","Strong eventual consistency"],["A column for each terrace, written only by its own scribe","A vector with one entry per replica"],["Taking the larger pile in each column","Merge: the per-entry maximum"],["Any order, any grouping, as often as you like","Commutative, associative, idempotent"],["The table way","State-based replication"],["The notice way: exactly once, in order of dependence","Operation-based replication over reliable causal delivery"],["White pebbles and black","A counter that goes up and down: two grow-only counters"],["The later edition wins","A last-writer-wins register"],["Keeping both corrections","A multi-value register"],["The catalogue of titles","A grow-only set"],["The struck-off list","A two-phase set"],["A mark for every writing; a strike removes the marks seen","An observed-remove set"],["A limit on the whole coast's count","A global invariant, which needs coordination"]]);

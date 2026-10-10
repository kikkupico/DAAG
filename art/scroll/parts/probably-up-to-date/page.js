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

/* the number of ways to choose r of n, and the chance that r keepers heard from all lie among the n-w the edition has not reached */
const choose=(n,r)=>{if(r<0||r>n)return 0;let c=1;for(let i=1;i<=r;i++)c=c*(n-r+i)/i;return c};
const miss=(n,w,r)=>choose(n-w,r)/choose(n,r);
const pick=(n,k)=>{const a=[...Array(n).keys()];for(let i=0;i<k;i++){const j=i+rnd(n-i);[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,k)};
const pct=p=>p>=.9995?"more than 999 in 1,000":p>=.995?`${Math.round(p*1000)} in 1,000`:`${Math.round(p*100)} in 100`;

/* ===== machines: W acknowledged, R answers, both at random ===== */
(function(){
  let W=1,R=1,n=0,s=0;const note=$("#mnote");
  const reset=()=>{n=s=0;$("#mn").textContent=0;$("#ms").textContent=0;note.textContent=R+W>3?"R + W is more than 3: every read must meet the write.":"R + W is not more than 3: a read may miss the write."};
  seg($("#mw"),[1,2,3].map(k=>[k,k]),W,v=>{W=+v;reset()});seg($("#mr"),[1,2,3].map(k=>[k,k]),R,v=>{R=+v;reset()});
  $("#mgo").onclick=()=>{for(let i=0;i<100;i++){const w=pick(3,W),r=pick(3,R);n++;if(!r.some(x=>w.includes(x)))s++}
    $("#mn").textContent=n;$("#ms").textContent=s;
    note.innerHTML=R+W>3?`${n} reads, <span class="ok">none stale</span>. The two groups always share a replica.`:`${s} of ${n} reads were stale. The rule gives ${pct(miss(3,W,R))}.`};
  reset();
})();

/* ===== how many to wait for: three keepers on the coast ===== */
(function(){
  const C=Coast($("#waitsvg"),{n:3,stoa:false}),say=$("#waitsay");let W=1,R=1;
  const clear=()=>{[0,1,2].forEach(i=>{C.fill(i,"#fffaf0");C.lib[i].g.classList.remove("mark");C.note(i,"")});
    say.innerHTML=W+R>3?`${W} and ${R} add up to more than three. The two groups must share a keeper.`:`${W} and ${R} do not add up to more than three. The groups may miss each other.`};
  seg($("#ww"),[1,2,3].map(k=>[k,k]),W,v=>{W=+v;clear()});seg($("#wr"),[1,2,3].map(k=>[k,k]),R,v=>{R=+v;clear()});
  $("#waitgo").onclick=()=>{clear();const w=pick(3,W),r=pick(3,R);          // which keepers answered the writer first, and which the reader hears from first
    w.forEach(i=>{C.fill(i,"#e0b84a");C.note(i,"new edition")});[0,1,2].filter(i=>!w.includes(i)).forEach(i=>C.note(i,"old copy"));
    r.forEach(i=>C.lib[i].g.classList.add("mark"));
    const both=r.filter(i=>w.includes(i));
    say.innerHTML=both.length?`The reader hears from Library ${r.map(i=>i+1).join(" and ")}. Library ${both[0]+1} holds the new edition, and the reader takes the newest copy heard. <span class="ok">The reader is handed the new edition.</span>`
      :`The reader hears from Library ${r.map(i=>i+1).join(" and ")}. ${r.length>1?"Neither holds":"It does not hold"} the new edition yet. <span class="bad">The reader is handed the old copy</span>, and nothing in the ${r.length>1?"replies says":"reply says"} so.`};
  clear();
})();

/* ===== the chance of a miss as the keepers grow ===== */
$("#misstbl").innerHTML="<tr><th>Keepers</th><th>Waited for, and asked</th><th>Chance of an old copy</th></tr>"+
  [[3,1],[10,3],[30,9],[100,30]].map(([n,k])=>{const p=miss(n,k,k);return `<tr><td>${n}</td><td>${k} and ${k}</td><td>${p>.05?pct(p):p>1e-4?`about 1 in ${Math.round(1/p)}`:`about ${(p*1e6).toFixed(1)} in a million`}</td></tr>`}).join("");

/* ===== leeway in editions ===== */
(function(){
  let W=1;const box=$("#kbars");
  const paint=()=>{const p=miss(3,W,1);box.innerHTML=[1,2,3,5,10].map(k=>{const ok=1-Math.pow(p,k);
    return `<div class="b"><span>${k===1?"the newest edition":`one of the newest ${k}`}</span><span class="v"><i style="width:${(ok*72).toFixed(1)}%"></i>${pct(ok)}</span></div>`}).join("")};
  seg($("#kw"),[[1,"one keeper"],[2,"two keepers"]],W,v=>{W=+v;paint()});paint();
})();

/* ===== the four legs, drawn in the round ===== */
(function(){
  const P=Polar($("#legsvg"),{vb:"0 0 520 500",cx:260,cy:262,r0:40,step:26,rings:7,tEnd:7.6,note:[12,22],
    nodes:{W:[-90,"W","#e0b84a"],K:[30,"K","#f6eed6"],R:[150,"R","#8fb3d9"]}});
  const ev=(k,t,f,s)=>{P.event(k,t,f).label.textContent=s};
  P.slip("W",1.5,"K",6.6);P.slip("R",3.6,"K",4.9).classList.add("hi");P.slip("K",4.9,"R",6.2);
  ev("W",1.5,"#e0b84a",1);ev("W",2.7,"#e0b84a",2);ev("R",3.6,"#8fb3d9",3);ev("K",4.9,"#fde0d4",4);ev("K",6.6,"#e0b84a",5);
})();

/* ===== the replay (the paper's method): for each keeper draw the four journeys; the edition is announced when the
   chosen number of acknowledgments is back; the reader asks t later and takes the first replies; the reader is
   behind when every one of those keepers got the request before the edition. Journey times are drawn so that
   short ones are common and long ones rare (an exponential), with the edition's way out slowed by a chosen factor. ===== */
function replay(W,R,slow,t,runs){
  const ex=m=>-m*Math.log(1-Math.random());let stale=0;
  for(let n=0;n<runs;n++){const w=[],ack=[],req=[],back=[];
    for(let i=0;i<3;i++){w[i]=ex(slow);ack[i]=w[i]+ex(1);req[i]=ex(1);back[i]=req[i]+ex(1)}
    const told=[...ack].sort((a,b)=>a-b)[W-1];
    const first=[0,1,2].sort((a,b)=>back[a]-back[b]).slice(0,R);
    if(first.every(i=>told+t+req[i]<w[i]))stale++}
  return 1-stale/runs;
}
(function(){
  let W=1,R=1,slow=1;const box=$("#lbars"),say=$("#lsay");
  const blank=()=>{box.innerHTML="";say.textContent="Choose, then play."};
  seg($("#lw"),[1,2,3].map(k=>[k,k]),W,v=>{W=+v;blank()});seg($("#lr"),[1,2,3].map(k=>[k,k]),R,v=>{R=+v;blank()});
  seg($("#lslow"),[[.2,"five times quicker"],[1,"the same"],[10,"ten times slower"]],slow,v=>{slow=+v;blank()});
  $("#lgo").onclick=()=>{const ts=[0,1,3,10,30],res=ts.map(t=>replay(W,R,slow,t,10000));
    if(W+R>3&&res.some(p=>p<1))throw new Error("a stale reading with groups that must share a keeper");
    box.innerHTML="<h5>Chance of the new edition, a while after it is announced</h5>"+ts.map((t,k)=>`<div class="b"><span>${t?`${t} ${t>1?"journeys":"journey"} later`:"at once"}</span><span class="v"><i style="width:${(res[k]*68).toFixed(1)}%"></i>${pct(res[k])}</span></div>`).join("");
    say.innerHTML=W+R>3?`<span class="ok">Never behind.</span> The groups share a keeper, however the journeys fall.`:`At once the reader is handed the new edition ${pct(res[0])}. A while is counted in ordinary journeys: the average time of one of the other three legs.`};
})();

/* ===== the four coasts: the paper's measures ===== */
$("#cbars").innerHTML=[["Quick roads, quick copying",97.4],["Long delays now and then",89.3],["Slow copying onto papyrus",43.9],["Keepers on both sides of a sea",33]]
  .map(([t,v])=>`<div class="b"><span>${t}</span><span class="v"><i style="width:${(v*.7).toFixed(1)}%"></i>${v} in 100</span></div>`).join("");

/* ===== never going backwards ===== */
(function(){
  const p=miss(3,1,1);
  const paint=q=>{const k=1+q,bad=Math.pow(p,k);$("#bk").textContent=k;$("#bp").textContent=bad>.01?pct(bad):bad>1e-6?`1 in ${Math.round(1/bad).toLocaleString("en")}`:"less than 1 in a million";
    $("#bsay").innerHTML=q===0?"A reader who comes back before anything new is announced needs the very edition seen before, or a newer one that is on its way.":`With ${q} announced between visits, any of the newest ${k} will do, and the chance of a miss is multiplied by itself ${k} times.`};
  seg($("#bq"),[[0,"none"],[1,"1"],[4,"4"],[9,"9"],[99,"99"]],1,v=>paint(+v));paint(1);
})();

mapPairs($("#map"),[["A work's three keepers","A data item's N replicas"],["An edition and its tally","A version and its timestamp"],["The writer sends the edition to every keeper","The coordinator sends the write to all N replicas"],["Announced when enough keepers have answered","The write commits after W acknowledgments"],["The reader takes the first few replies","The read returns after R responses"],["The two numbers add up to more than the keepers","A strict quorum: R + W > N"],["The quick way: wait for one, ask one","A partial quorum"],["One of the newest few editions","k-staleness"],["The odds a while after the announcement","t-visibility"],["The four legs","The WARS model of message delays"],["The couriers' logbook, played over by lot","Measured latencies and Monte Carlo simulation"],["Never going backwards","Monotonic reads"],["Keeping to one keeper","A sticky replica"]]);

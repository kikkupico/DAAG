"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,mapPairs,Polar}=BOOK;
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
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:11,fill,stroke:"#1c1512","stroke-width":2.5},g);dtext(g,{},glyph,glyph);return g},
    run(g,a,b,u){const [x1,y1]=C.pos(a),[x2,y2]=C.pos(b);C.put(g,x1+(x2-x1)*u,y1+(y2-y1)*u)}
  };
  if(o.stoa!==false){el("rect",{x:C.stoa[0]-9,y:C.stoa[1]-26,width:18,height:52,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3,class:"i"},svg);
    el("text",{x:C.stoa[0]+2,y:C.stoa[1]+44,class:"lab halo i",style:"font-size:12px"},svg).textContent="the stoa";}
  for(let i=0;i<n;i++){const [x,y]=AT[i],g=el("g",{class:"lib"},libs);C.put(g,x,y);
    el("circle",{class:"ring",r:24},g);const b=el("circle",{class:"b",r:17,fill:"#fffaf0"},g);el("text",{},g).textContent=i+1;
    const s=dtext(g,{class:"lab halo",y:33,style:"font-size:12px;font-style:normal;font-family:var(--sans);font-weight:400"},"","");
    C.lib.push({x,y,g,b,s})}
  return C;
}
const seg=(box,opts,cur,fn)=>{box.innerHTML=opts.map(([v,t])=>`<button data-v="${v}" aria-pressed="${String(v)===String(cur)}">${t}</button>`).join("");
  $$("button",box).forEach(bt=>bt.onclick=()=>{$$("button",box).forEach(x=>x.setAttribute("aria-pressed",x===bt));fn(bt.dataset.v)})};
const oneIn=p=>p<=0?"none":p>=.95?"nearly all":p>=.095?`1 in ${Math.round(1/p)}`:`1 in ${Math.round(1/p).toLocaleString("en")}`;

/* the number of ways to choose r of n, and the chance that r home libraries heard from all lie among the n-w the edition has not reached */
const choose=(n,r)=>{if(r<0||r>n)return 0;let c=1;for(let i=1;i<=r;i++)c=c*(n-r+i)/i;return c};
const miss=(n,w,r)=>choose(n-w,r)/choose(n,r);
const pick=(n,k)=>{const a=[...Array(n).keys()];for(let i=0;i<k;i++){const j=i+rnd(n-i);[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,k)};
const pct=p=>p>=.9995?"more than 999 in 1,000":p>=.995?`${Math.round(p*1000)} in 1,000`:`${Math.round(p*100)} in 100`;

/* cover:start */
COVERS.draw("#coversvg",(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · A PARTIAL QUORUM: N = 3, W = 2, R = 1","PBS");
  const X=[96,260,424],cy=170,names=["R1","R2","R3"],ver=["v7","v7","v6"];
  /* the quorums */
  el("ellipse",{cx:178,cy,rx:132,ry:62,fill:P.blueL,opacity:.55,stroke:P.blue,"stroke-width":1.5,"stroke-dasharray":"5 4"},g);
  el("ellipse",{cx:424,cy,rx:62,ry:62,fill:P.goldL,opacity:.7,stroke:P.gold,"stroke-width":1.5,"stroke-dasharray":"5 4"},g);
  chip(g,178,cy-78,"write quorum, W = 2",{m:1,s:9,k:P.blue,c:P.blue});chip(g,424,cy-78,"read quorum, R = 1",{m:1,s:9,k:P.gold,c:"#8a6a00"});
  X.forEach((x,i)=>{const stale=i===2;
    el("rect",{x:x-42,y:cy-34,width:84,height:68,rx:14,fill:"#fff",stroke:stale?P.red:P.ink,"stroke-width":1.8},g);
    T(g,x,cy-16,names[i],{s:11,w:600,c:P.mute});T(g,x,cy+10,ver[i],{s:22,w:700,c:stale?P.red:P.blue});
    T(g,x,cy+27,stale?"stale":"newest",{s:8.5,m:1,c:stale?P.red:P.faint})});
  /* the writer and reader */
  chip(g,178,56,"writer · put(v7)",{m:1,s:9.5,k:P.blue,c:P.blue,f:"#fff",w:600});chip(g,424,56,"reader · get()",{m:1,s:9.5,k:P.gold,c:"#8a6a00",f:"#fff",w:600});
  const pw=[link(g,150,68,X[0]+14,cy-36,{c:"blue",w:1.6}),link(g,206,68,X[1]-14,cy-36,{c:"blue",w:1.6})];pw.forEach((p,k)=>packet(g,p,{c:"blue",dur:2,delay:k*.3}));
  const pr=link(g,424,68,424,cy-36,{c:"gold",w:1.6});packet(g,pr,{c:"gold",dur:2});
  const lt=link(g,X[1]+46,cy+8,X[2]-46,cy+8,{c:"mute",w:1.3,dash:"3 4",op:.6});
  chip(g,(X[1]+X[2])/2,cy+28,"v7 still in transit",{m:1,s:8.5,pad:8,k:P.line,c:P.mute});
  chip(g,424,cy+84,"read returns v6 ✗",{m:1,s:9.5,k:P.red,c:P.red,f:P.redL,w:600});
  /* the staleness curve */
  const cx0=70,cx1=482,cb=444,ct=292;
  T(g,26,266,"chance a read is current, t after the write commits",{a:"start",s:10,m:1,c:P.mute});
  [0,.5,1].forEach(f=>{const y=cb-(cb-ct)*f;el("line",{x1:cx0,x2:cx1,y1:y,y2:y,stroke:P.soft,"stroke-width":1},g)});
  el("line",{x1:cx0,x2:cx0,y1:ct-6,y2:cb,stroke:P.line,"stroke-width":1.4},g);el("line",{x1:cx0,x2:cx1,y1:cb,y2:cb,stroke:P.line,"stroke-width":1.4},g);
  const d=`M${cx0} ${cb-20}C${cx0+80} ${cb-24},${cx0+120} ${cb-96},${cx0+190} ${cb-122}S${cx0+330} ${ct+4},${cx1} ${ct}`;
  el("path",{d:d+`L${cx1} ${cb}L${cx0} ${cb}Z`,fill:P.blueL,opacity:.5},g);
  const cv=el("path",{d,fill:"none",stroke:P.blue,"stroke-width":2.4,"stroke-linecap":"round"},g);packet(g,cv,{c:"blue",dur:4.2,r:4});
  [[cx0,"0"],[cx0+110,"10 ms"],[cx0+230,"100 ms"],[cx1-20,"1 s"]].forEach(([x,t])=>{el("line",{x1:x,x2:x,y1:cb,y2:cb+5,stroke:P.faint,"stroke-width":1},g);T(g,x,cb+16,t,{s:9,m:1,c:P.faint})});
  T(g,cx0-6,ct,"100%",{a:"end",s:9,m:1,c:P.faint});T(g,cx0-6,(ct+cb)/2,"50%",{a:"end",s:9,m:1,c:P.faint});
  const pt=cv.getPointAtLength(cv.getTotalLength()*.62);dot(g,pt.x,pt.y,5,P.red,"#fff");
  chip(g,pt.x+12,pt.y+36,"99.9% current after t",{a:"start",m:1,s:9,k:P.red,c:P.red,f:"#fff"});link(g,pt.x+10,pt.y+30,pt.x+3,pt.y+6,{c:"red",w:1,head:false});
  chip(g,W-26,H-24,"R + W ≤ N → reads may be stale, rarely and briefly",{a:"end",m:1,s:9,k:P.line,c:P.mute});
});
/* cover:end */

/* ===== how many to wait for: three home libraries on the coast ===== */
(function(){
  const C=Coast($("#waitsvg"),{n:3,stoa:false}),say=$("#waitsay");let W=1,R=1;
  const clear=()=>{[0,1,2].forEach(i=>{C.fill(i,"#fffaf0");C.lib[i].g.classList.remove("mark");C.note(i,"")});
    say.innerHTML=W+R>3?dual(`${W} and ${R} add up to more than three. The two groups must share a home library.`,`${W} and ${R} add up to more than three. The two groups must share a replica.`):dual(`${W} and ${R} do not add up to more than three. The groups may miss each other.`,`${W} and ${R} do not add up to more than three. The groups may miss each other.`)};
  seg($("#ww"),[1,2,3].map(k=>[k,k]),W,v=>{W=+v;clear()});seg($("#wr"),[1,2,3].map(k=>[k,k]),R,v=>{R=+v;clear()});
  $("#waitgo").onclick=()=>{clear();const w=pick(3,W),r=pick(3,R);          // which home libraries answered the writer first, and which the reader hears from first
    w.forEach(i=>{C.fill(i,"#e0b84a");C.note(i,"new edition","new version")});[0,1,2].filter(i=>!w.includes(i)).forEach(i=>C.note(i,"old copy"));
    r.forEach(i=>C.lib[i].g.classList.add("mark"));
    const both=r.filter(i=>w.includes(i));
    const ls=r.map(i=>i+1).join(" and ");
    say.innerHTML=both.length?dual(`The reader hears from Library ${ls}. Library ${both[0]+1} holds the new edition, and the reader takes the newest copy heard. <span class="ok">The reader is handed the new edition.</span>`,`The client hears from Replica ${ls}. Replica ${both[0]+1} holds the new version, and the client takes the newest copy heard. <span class="ok">The client is handed the new version.</span>`)
      :dual(`The reader hears from Library ${ls}. ${r.length>1?"Neither holds":"It does not hold"} the new edition yet. <span class="bad">The reader is handed the old copy</span>, and nothing in the ${r.length>1?"replies says":"reply says"} so.`,`The client hears from Replica ${ls}. ${r.length>1?"Neither holds":"It does not hold"} the new version yet. <span class="bad">The client is handed the old copy</span>, and nothing in the ${r.length>1?"replies says":"reply says"} so.`)};
  clear();
})();

/* ===== the chance of a miss as the home libraries grow ===== */
$("#misstbl").innerHTML=`<tr><th>${dual("Home libraries","Replicas")}</th><th>Waited for, and asked</th><th>Chance of an old copy</th></tr>`+
  [[3,1],[10,3],[30,9],[100,30]].map(([n,k])=>{const p=miss(n,k,k);return `<tr><td>${n}</td><td>${k} and ${k}</td><td>${p>.05?pct(p):p>1e-4?`about 1 in ${Math.round(1/p)}`:`about ${(p*1e6).toFixed(1)} in a million`}</td></tr>`}).join("");

/* ===== leeway in editions ===== */
(function(){
  let W=1;const box=$("#kbars");
  const paint=()=>{const p=miss(3,W,1);box.innerHTML=[1,2,3,5,10].map(k=>{const ok=1-Math.pow(p,k);
    return `<div class="b"><span>${k===1?dual("the newest edition","the newest version"):`one of the newest ${k}`}</span><span class="v"><i style="width:${(ok*72).toFixed(1)}%"></i>${pct(ok)}</span></div>`}).join("")};
  seg($("#kw"),[[1,dual("one home library","one replica")],[2,dual("two home libraries","two replicas")]],W,v=>{W=+v;paint()});paint();
})();

/* ===== the four legs, drawn in the round ===== */
(function(){
  const P=Polar($("#legsvg"),{vb:"0 0 520 500",cx:260,cy:262,r0:40,step:26,rings:7,tEnd:7.6,note:[12,22],
    nodes:{W:[-90,"W","#e0b84a"],K:[30,"K","#f6eed6"],R:[150,"R","#8fb3d9"]}});
  const ev=(k,t,f,s)=>{P.event(k,t,f).label.textContent=s};
  P.slip("W",1.5,"K",6.6);P.slip("R",3.6,"K",4.9).classList.add("hi");P.slip("K",4.9,"R",6.2);
  ev("W",1.5,"#e0b84a",1);ev("W",2.7,"#e0b84a",2);ev("R",3.6,"#8fb3d9",3);ev("K",4.9,"#fde0d4",4);ev("K",6.6,"#e0b84a",5);
})();

/* ===== the replay (the paper's method): for each home library draw the four journeys; the edition is announced when the
   chosen number of acknowledgments is back; the reader asks t later and takes the first replies; the reader is
   behind when every one of those home libraries got the request before the edition. Journey times are drawn so that
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
    if(W+R>3&&res.some(p=>p<1))throw new Error("a stale reading with groups that must share a home library");
    box.innerHTML=`<h5>${dual("Chance of the new edition, a while after it is announced","Chance of the new version, a while after it is committed")}</h5>`+ts.map((t,k)=>`<div class="b"><span>${t?`${t} ${t>1?"journeys":"journey"} later`:"at once"}</span><span class="v"><i style="width:${(res[k]*68).toFixed(1)}%"></i>${pct(res[k])}</span></div>`).join("");
    say.innerHTML=W+R>3?dual(`<span class="ok">Never behind.</span> The groups share a home library, however the journeys fall.`,`<span class="ok">Never behind.</span> The groups share a replica, however the journeys fall.`):dual(`At once the reader is handed the new edition ${pct(res[0])}. A while is counted in ordinary journeys: the average time of one of the other three legs.`,`At once the client is handed the new version ${pct(res[0])}. A while is counted in ordinary journeys: the average time of one of the other three legs.`)};
})();

/* ===== the four coasts: the paper's measures ===== */
$("#cbars").innerHTML=[[dual("Quick roads, quick copying","Fast network, fast disks (LNKD-SSD)"),97.4],[dual("Long delays now and then","Occasional long delays (LNKD-DISK)"),89.3],[dual("Slow copying onto papyrus","Slow disk writes (YMMR)"),43.9],[dual("Home libraries on both sides of a sea","Replicas on both sides of an ocean (WAN)"),33]]
  .map(([t,v])=>`<div class="b"><span>${t}</span><span class="v"><i style="width:${(v*.7).toFixed(1)}%"></i>${v} in 100</span></div>`).join("");

/* ===== never going backwards ===== */
(function(){
  const p=miss(3,1,1);
  const paint=q=>{const k=1+q,bad=Math.pow(p,k);$("#bk").textContent=k;$("#bp").textContent=bad>.01?pct(bad):bad>1e-6?`1 in ${Math.round(1/bad).toLocaleString("en")}`:"less than 1 in a million";
    $("#bsay").innerHTML=q===0?dual("A reader who comes back before anything new is announced needs the very edition seen before, or a newer one that is on its way.","A client that comes back before anything new is committed needs the very version seen before, or a newer one that is on its way."):dual(`With ${q} announced between visits, any of the newest ${k} will do: ${k} chances of a miss, multiplied together.`,`With ${q} committed between visits, any of the newest ${k} will do: ${k} chances of a miss, multiplied together.`)};
  seg($("#bq"),[[0,"none"],[1,"1"],[4,"4"],[9,"9"],[99,"99"]],1,v=>paint(+v));paint(1);
})();

mapPairs($("#map"),[["A work's three home libraries","A data item's N replicas"],["An edition and its tally","A version and its timestamp"],["The writer sends the edition to every home library","The coordinator sends the write to all N replicas"],["Announced when enough home libraries have answered","The write commits after W acknowledgments"],["The reader takes the first few replies","The read returns after R responses"],["The two numbers add up to more than the home libraries","A strict quorum: R + W > N"],["The quick way: wait for one, ask one","A partial quorum"],["One of the newest few editions","k-staleness"],["The odds a while after the announcement","t-visibility"],["The four legs","The WARS model of message delays"],["The couriers' logbook, played over by lot","Measured latencies and Monte Carlo simulation"],["Never going backwards","Monotonic reads"],["Keeping to one home library","A sticky replica"]]);
REG.start();
})();

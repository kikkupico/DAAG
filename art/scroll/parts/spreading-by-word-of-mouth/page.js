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

/* ===== machines: mail loses some, and reconciling pairs at random catches them ===== */
(function(){
  const N=30,box=$("#mcells"),note=$("#mnote"),bm=$("#mmail"),br=$("#mrec");let has,round;
  box.innerHTML="<i></i>".repeat(N);const cell=$$("i",box);
  const paint=()=>cell.forEach((c,i)=>c.className=has[i]?"h":"");
  function reset(){has=Array(N).fill(false);has[0]=true;round=0;paint()}
  bm.onclick=()=>{reset();let lost=0;for(let i=1;i<N;i++){if(Math.random()<.15)lost++;else has[i]=true}
    if(!lost){has[1+rnd(N-1)]=false;lost=1}
    paint();has.forEach((h,i)=>{if(!h)cell[i].className="x"});br.disabled=false;
    note.innerHTML=`${lost} ${lost>1?"messages were":"message was"} lost. The sender does not know which, and the replicas that missed it do not know there was anything to miss.`};
  br.onclick=()=>{round++;const was=has.slice();
    for(let i=0;i<N;i++){let j=rnd(N-1);if(j>=i)j++;if(was[i]||was[j])has[i]=has[j]=true}   // each picks one at random, and the two reconcile
    paint();const left=has.filter(h=>!h).length;has.forEach((h,i)=>{if(!h)cell[i].className="x"});
    note.innerHTML=left?`Round ${round}: every replica picks another at random and the two reconcile. ${left} still lack the update.`:`Round ${round}: <span class="ok">every replica holds the update.</span> Nobody had to know who was missed.`;
    if(!left)br.disabled=true};
  reset();
})();

/* ===== the festival: every copyist draws one name by lot; the pair give, ask, or both ===== */
(function(){
  const N=100,box=$("#fcells"),say=$("#fsay"),fy=$("#fyear"),fh=$("#fhave"),go=$("#fgo");let has,year,mode="give";
  box.innerHTML="<i></i>".repeat(N);const cell=$$("i",box);
  const paint=()=>{cell.forEach((c,i)=>c.className=has[i]?"h":"");fy.textContent=year;fh.textContent=has.filter(Boolean).length};
  function reset(){has=Array(N).fill(false);has[rnd(N)]=true;year=0;go.disabled=false;paint();say.textContent="One library holds the new edition. Every copyist draws one name by lot."}
  seg($("#fmode"),[["give","the newer gives"],["ask","the older asks"],["both","both"]],mode,v=>{mode=v;reset()});
  go.onclick=()=>{year++;const was=has.slice();let gained=0;
    for(let i=0;i<N;i++){let j=rnd(N-1);if(j>=i)j++;                 // i has drawn j's name
      if(mode!=="ask"&&was[i]&&!has[j]){has[j]=true;gained++}        // giving: the one who drew hands the newer edition over
      if(mode!=="give"&&was[j]&&!has[i]){has[i]=true;gained++}}      // asking: the one who drew asks for it
    paint();const n=has.filter(Boolean).length;
    say.innerHTML=n===N?`After ${year} festivals <span class="ok">every library holds the new edition.</span>`:`Festival ${year}: ${gained} more ${gained===1?"library takes":"libraries take"} the new edition. ${N-n} still lack it.`;
    if(n===N)go.disabled=true};
  $("#freset").onclick=reset;reset();
  /* when few remain: the two rules, applied five times to one library in ten */
  const n=1000;let a=.1,g=.1,rows="<tr><th>After festival</th><th>asking: still without</th><th>giving: still without</th></tr>";
  for(let k=0;k<=5;k++){rows+=`<tr><td>${k||"at the start"}</td><td>${a*n<.5?"none on a coast of a thousand":oneIn(a)}</td><td>${oneIn(g)}</td></tr>`;a=a*a;g=g*Math.pow(1-1/n,n*(1-g))}
  $("#ftbl").innerHTML=rows;
})();

/* ===== word of mouth among a thousand libraries =====
   mode "tell": each day every scholar still telling picks one library by lot and tells it.
   mode "ask":  each day every library asks one other, and a scholar still telling hands the scrap over.
   A telling is idle when the hearer already had the scrap. Attentive scholars lose interest only on idle
   tellings, blind ones on any; by toss at one chance in the allowance, or by count once the allowance is reached.
   A scholar who is asked by several in one day counts that day as idle only if none of them needed the scrap. */
function gossip(N,o){
  const st=new Uint8Array(N),cnt=new Uint16Array(N);let sent=0,day=0;st[rnd(N)]=1;       // 0 has not heard, 1 still telling, 2 has stopped
  const tire=(i,idle)=>{if(o.attentive&&!idle)return;
    if(o.count){if(++cnt[i]>=o.k)st[i]=2}else if(Math.random()<1/o.k)st[i]=2};
  function step(){day++;const was=st.slice(),asked=new Uint8Array(N);                    // asked: 1 idle so far today, 2 someone needed it
    for(let i=0;i<N;i++){let j=rnd(N-1);if(j>=i)j++;
      if(o.mode==="ask"){if(was[j]!==1)continue;
        sent++;if(st[i]===0){st[i]=1;asked[j]=2}else if(!asked[j])asked[j]=1;continue}
      if(was[i]!==1||st[i]!==1)continue;
      sent++;const idle=st[j]!==0;if(!idle)st[j]=1;tire(i,idle)}
    if(o.mode==="ask")for(let j=0;j<N;j++)if(asked[j])tire(j,asked[j]===1);
    return st.some(x=>x===1)}
  return {st,step,get day(){return day},get m(){return sent/N},get left(){return st.reduce((a,x)=>a+(x===0),0)}};
}
function gossipWell(ids,opts,line){
  const N=1000,box=$(ids.cells),say=$(ids.say),go=$(ids.go);let run=0;
  box.innerHTML="<i></i>".repeat(N);const cell=$$("i",box),cls=["","t","d"];
  const show=G=>{for(let i=0;i<N;i++){const c=cls[G.st[i]];if(cell[i].className!==c)cell[i].className=c}
    $(ids.res).textContent=G.left;$(ids.m).textContent=G.m.toFixed(1);$(ids.day).textContent=G.day};
  go.onclick=async()=>{const id=++run,G=gossip(N,opts());let more=true;go.textContent="Start again";
    say.textContent="The scrap starts at one library.";
    while(more&&id===run){more=G.step();show(G);await sleep(110);
      if(box.getBoundingClientRect().bottom<0||box.getBoundingClientRect().top>innerHeight){more=false;say.textContent="Stopped: the telling is out of sight. Start again when you are back.";return}}
    if(id===run)say.innerHTML=line(G,N)};
  return ()=>{run++;cell.forEach(c=>c.className="");[ids.res,ids.m,ids.day].forEach(s=>$(s).textContent=0);go.textContent=ids.label;say.textContent=ids.idle};
}
(function(){
  const o={k:1,attentive:true,count:true,mode:"tell"};
  const reset=gossipWell({cells:"#gcells",say:"#gsay",go:"#ggo",res:"#gres",m:"#gm",day:"#gday",label:"Start the telling",idle:"Pale: has not heard. Gold: still telling. Green: has stopped."},()=>({...o}),
    (G,N)=>`The last teller stopped on day ${G.day}. <b>${G.left}</b> of ${N} libraries never heard, after ${G.m.toFixed(1)} tellings a library. One over the exponential of ${G.m.toFixed(1)} is about ${Math.round(N*Math.exp(-G.m))} in ${N}.`);
  seg($("#gk"),[1,2,3,4,5].map(k=>[k,k]),o.k,v=>{o.k=+v;reset()});
  seg($("#gfb"),[["1","attentive"],["0","blind"]],"1",v=>{o.attentive=v==="1";reset()});
  seg($("#gct"),[["1","by count"],["0","on a toss"]],"1",v=>{o.count=v==="1";reset()});
})();
(function(){
  const o={k:1,attentive:true,count:true,mode:"ask"};
  const reset=gossipWell({cells:"#acells",say:"#asay",go:"#ago",res:"#ares",m:"#am",day:"#aday",label:"Start",idle:"Choose telling or asking, and an allowance. A scholar asked by several in a day counts the day as wasted only if none of them needed the scrap."},()=>({...o}),
    (G,N)=>`It ended on day ${G.day}. <b>${G.left}</b> of ${N} libraries never heard, after ${G.m.toFixed(1)} tellings a library. ${o.mode==="ask"?(G.left<=Math.round(N*Math.exp(-G.m))?"That is fewer than telling leaves for the same number of tellings.":"A run can fall either side of what telling leaves; run it again."):"Telling pays the price of one over the exponential."}`);
  seg($("#amode"),[["tell","telling"],["ask","asking"]],o.mode,v=>{o.mode=v;reset()});
  seg($("#ak"),[1,2,3].map(k=>[k,k]),o.k,v=>{o.k=+v;reset()});
})();

/* ===== withdrawing: what a library holds of one work is nothing, an edition, or a notice; each has a tally ===== */
const itemHtml=x=>!x?'<span class="it none">nothing of the work</span>':x.gone?`<span class="it gone">edition, day ${x.t}</span>`:x.notice?`<span class="it nt">notice of withdrawal, day ${x.t}${x.woke?`, awake since day ${x.woke}`:""}</span>`:`<span class="it">edition, day ${x.t}</span>`;
const shelfHtml=(name,items)=>`<div class="shelf"><h5>${name}</h5>${items.map(itemHtml).join("")}</div>`;
/* when two libraries compare one work: the later tally stands on both shelves; a library holding nothing takes what the other has */
function meet(a,b){if(!a)return [b,b,"take"];if(!b)return [a,a,"take"];return a.t>=b.t?[a,a,"later"]:[b,b,"later"]}
(function(){
  const box=$("#wshelves"),say=$("#wsay"),go=$("#wgo");let mode="strike",a,b;
  function reset(){a=mode==="strike"?null:{notice:true,t:5};b={t:3};go.disabled=false;
    box.innerHTML=shelfHtml("Library 1",[a])+shelfHtml("Library 2",[b]);
    say.textContent=mode==="strike"?"Library 1 has struck the work off its shelf. Library 2 still holds the old edition, written on day 3.":"Library 1 has struck the work and keeps a notice of withdrawal, written on day 5. Library 2 still holds the old edition, written on day 3."}
  seg($("#wmode"),[["strike","It only struck the work"],["notice","It left a notice of withdrawal"]],mode,v=>{mode=v;reset()});
  go.onclick=()=>{const [x,y,why]=meet(a,b);box.innerHTML=shelfHtml("Library 1",[x])+shelfHtml("Library 2",x.notice?[{...b,gone:true},y]:[y]);go.disabled=true;
    say.innerHTML=x.notice?`The notice's tally is later than the edition's. Library 2 strikes its old edition and keeps the notice. <span class="ok">The work is withdrawn at both.</span>`
      :`Library 1 holds nothing of the work, so it takes Library 2's edition. <span class="bad">The work is back on its shelf.</span>`};
  $("#wreset").onclick=reset;reset();
})();
(function(){
  const box=$("#tshelves"),say=$("#tsay"),old={t:3},back={t:8};
  const start=()=>box.innerHTML=shelfHtml("A keeper",[{notice:true,t:5},old])+shelfHtml("Another library",[back]);
  /* a notice strikes an edition exactly when the notice's first tally is the later */
  function wake(fresh){const n=fresh?{notice:true,t:10}:{notice:true,t:5,woke:10},hit=e=>({...e,gone:n.t>e.t});
    const o=hit(old),bk=hit(back);
    box.innerHTML=shelfHtml("A keeper",[n,o])+shelfHtml("Another library",[n,bk]);
    say.innerHTML=fresh?`The woken notice carries day 10. It strikes the old edition of day 3, and ${bk.gone?`<span class="bad">it strikes the edition of day 8 as well</span>, which was written after the withdrawal to bring the work back.`:"spares the edition of day 8."}`
      :`The woken notice still says the work was withdrawn on day 5, and is awake since day 10, so it is carried again. It strikes the old edition of day 3. ${bk.gone?"It strikes day 8 as well.":`<span class="ok">The edition of day 8 stands.</span>`}`}
  $("#tone").onclick=()=>wake(true);$("#ttwo").onclick=()=>wake(false);start();
})();

/* ===== near partners: the paper's measures, drawn as bars ===== */
(function(){
  const rows=[["Meetings on the ferry at a festival",75.7,2.4],["Meetings on an average road",5.9,1.4],["Festivals until the last library hears",7.8,13.3]];
  $("#fbars").innerHTML=rows.map(([t,a,b])=>{const mx=Math.max(a,b);return `<h5>${t}</h5>`+
    `<div class="b"><span>partners by lot</span><span class="v"><i style="width:${(a/mx*78).toFixed(1)}%"></i>${a}</span></div>`+
    `<div class="b"><span>nearer first</span><span class="v"><i class="n" style="width:${(b/mx*78).toFixed(1)}%"></i>${b}</span></div>`}).join("");
})();

/* ===== relevance map ===== */
mapPairs($("#map"),[["A library, holding copies","A site with a replica of the database"],["A work; an edition","A key; its value"],["The tally; the larger tally wins","A timestamp; the later write wins"],["A scrap of papyrus","An update"],["Letters to every library","Direct mail"],["The festival: pairs by lot compare collections","Anti-entropy"],["Giving, asking, or both","Push, pull, push-pull"],["The catalogue mark","A checksum of the database"],["The scholars telling in the stoa","Rumor mongering"],["Has not heard; still telling; has stopped","Susceptible; infective; removed"],["The allowance","How often a site retries before losing interest"],["Those who never hear","The residue"],["A notice of withdrawal","A death certificate"],["A sleeping notice and its keepers","A dormant certificate at its retention sites"],["Preferring near partners; the ferry","A spatial distribution; a critical link"]]);

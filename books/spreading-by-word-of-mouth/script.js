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
  const g=stage(svg,"FIG. 1 · EPIDEMIC REPLICATION","S → I → R");
  const R=rnd32(11),n=19,sp=22,x0=(W-(n-1)*sp)/2,y0=78,seed=[6,5];
  const cells=[];
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const d=Math.hypot(i-seed[0],j-seed[1])*(0.8+0.45*R());
    cells.push({i,j,x:x0+i*sp,y:y0+j*sp,d,far:R()<.035})}
  const st=c=>c.d<4.4?"R":c.d<6.3||c.far?"I":"S";
  const fill={S:"#e6e6eb",I:P.gold,R:"#9ccf9c"};
  const lay=el("g",{},g);
  for(const c of cells){const s=st(c);
    if(s==="I")el("circle",{cx:c.x,cy:c.y,r:11,fill:P.goldL,opacity:.8},lay);
    el("circle",{cx:c.x,cy:c.y,r:s==="S"?5.6:7.2,fill:fill[s]},lay)}
  /* anti-entropy and rumour arcs between sites */
  const inf=cells.filter(c=>st(c)==="I"),rem=cells.filter(c=>st(c)==="R"),arcs=el("g",{},g),paths=[];
  const sd=cells.find(c=>c.i===seed[0]&&c.j===seed[1]);
  for(let k=0;k<8;k++){
    const a=k<5?sd:rem[Math.floor(R()*rem.length)],b=inf[Math.floor(R()*inf.length)];
    if(!a||!b||a===b)continue;
    paths.push(link(arcs,a.x,a.y,b.x,b.y,{c:"blue",w:1.2,bend:(R()<.5?-1:1)*(26+R()*34),op:.55}))}
  paths.slice(0,5).forEach((p,k)=>packet(g,p,{c:"blue",dur:3+k*.45,delay:k*.5}));
  /* the seed and the callouts */
  node(g,sd.x,sd.y,9,null,{k:P.red,f:P.red,sw:2,halo:P.redL});
  dot(g,sd.x,sd.y,3,"#fff");
  const far=cells.filter(c=>st(c)==="S"&&c.i>13&&c.j>12)[3]||cells[cells.length-30];
  const tomb=rem[Math.floor(rem.length*.6)];
  el("path",{d:`M${tomb.x-4} ${tomb.y-4}l8 8m0 -8l-8 8`,stroke:P.red,"stroke-width":2,"stroke-linecap":"round"},g);
  chip(g,sd.x-22,sd.y-30,"seed · update u, ts 17",{a:"start",m:1,s:9.5,k:P.red,c:P.red});
  link(g,sd.x-8,sd.y-26+8,sd.x-4,sd.y-10,{c:"red",w:1,head:false});
  chip(g,tomb.x+14,tomb.y+30,"death certificate",{a:"start",m:1,s:9.5,k:P.red,c:P.red});
  link(g,tomb.x+8,tomb.y+22,tomb.x+2,tomb.y+5,{c:"red",w:1,head:false});
  chip(g,far.x+10,far.y-20,"not yet received",{a:"end",m:1,s:9.5,k:P.line,c:P.mute});
  /* legend */
  const ly=H-30;let lx=26;
  for(const [k,t] of [["S","susceptible"],["I","infective"],["R","removed"]]){
    dot(g,lx+6,ly,6,fill[k]);T(g,lx+18,ly,t,{a:"start",s:11,c:P.mute});lx+=t.length*6.1+44}
  T(g,W-26,ly,"push · pull · push-pull",{a:"end",s:10,c:P.faint,m:1})
};
COVERS.draw("#coversvg",COVER);COVERS.mount(COVER);
/* cover:end */

/* ===== the festival: every copyist draws one name by lot; the pair give, ask, or both ===== */
(function(){
  const N=100,box=$("#fcells"),say=$("#fsay"),fy=$("#fyear"),fh=$("#fhave"),go=$("#fgo");let has,year,mode="give";
  box.innerHTML="<i></i>".repeat(N);const cell=$$("i",box);
  const paint=()=>{cell.forEach((c,i)=>c.className=has[i]?"h":"");fy.textContent=year;fh.textContent=has.filter(Boolean).length};
  function reset(){has=Array(N).fill(false);has[rnd(N)]=true;year=0;go.disabled=false;paint();say.innerHTML=dual("One library holds the new edition. Every copyist draws one name by lot.","One site holds the new value. Every site picks one other at random.")}
  seg($("#fmode"),[["give",dual("the newer gives","the newer pushes")],["ask",dual("the older asks","the older pulls")],["both","both"]],mode,v=>{mode=v;reset()});
  go.onclick=()=>{year++;const was=has.slice();let gained=0;
    for(let i=0;i<N;i++){let j=rnd(N-1);if(j>=i)j++;                 // i has drawn j's name
      if(mode!=="ask"&&was[i]&&!has[j]){has[j]=true;gained++}        // giving: the one who drew hands the newer edition over
      if(mode!=="give"&&was[j]&&!has[i]){has[i]=true;gained++}}      // asking: the one who drew asks for it
    paint();const n=has.filter(Boolean).length;
    say.innerHTML=n===N?dual(`After ${year} festivals <span class="ok">every library holds the new edition.</span>`,`After ${year} cycles <span class="ok">every site holds the new value.</span>`):dual(`Festival ${year}: ${gained} more ${gained===1?"library takes":"libraries take"} the new edition. ${N-n} still lack it.`,`Cycle ${year}: ${gained} more ${gained===1?"site takes":"sites take"} the new value. ${N-n} still lack it.`);
    if(n===N)go.disabled=true};
  $("#freset").onclick=reset;reset();
  /* when few remain: the two rules, applied five times to one library in ten */
  const n=1000;let a=.1,g=.1,rows=`<tr><th>${dual("After festival","After cycle")}</th><th>${dual("asking: still without","pull: still without")}</th><th>${dual("giving: still without","push: still without")}</th></tr>`;
  for(let k=0;k<=5;k++){rows+=`<tr><td>${k||"at the start"}</td><td>${a*n<.5?dual("none on a coast of a thousand","none in a system of a thousand"):oneIn(a)}</td><td>${oneIn(g)}</td></tr>`;a=a*a;g=g*Math.pow(1-1/n,n*(1-g))}
  $("#ftbl").innerHTML=rows;
})();

/* ===== word of mouth among a thousand libraries =====
   mode "tell": each day every scholar still telling picks one library by lot and tells it.
   mode "ask":  each day every library asks one other, and a scholar still telling hands the scrap over.
   A telling is idle when the hearer already had the scrap. Attentive scholars lose interest only on idle
   tellings, blind ones on any; by toss at one chance in the allowance, or by count once the allowance is reached.
   An attentive scholar who counts starts the count afresh after a telling that was needed, and judges a telling
   by what the hearer held when the day began: with those two the runs give the paper's Table 1. Its figures for
   the toss come from its continuous model, which a telling judged at the moment reproduces.
   A scholar who is asked by several in one day counts that day as idle only if none of them needed the scrap,
   and starts the count afresh if any did (the paper's note to Table 3). */
function gossip(N,o){
  const st=new Uint8Array(N),cnt=new Uint16Array(N);let sent=0,day=0;st[rnd(N)]=1;       // 0 has not heard, 1 still telling, 2 has stopped
  const tire=(i,idle)=>{if(o.attentive&&!idle){if(o.count)cnt[i]=0;return}
    if(o.count){if(++cnt[i]>=o.k)st[i]=2}else if(Math.random()<1/o.k)st[i]=2};
  function step(){day++;const was=st.slice(),asked=new Uint8Array(N);                    // asked: 1 idle so far today, 2 someone needed it
    for(let i=0;i<N;i++){let j=rnd(N-1);if(j>=i)j++;
      if(o.mode==="ask"){if(was[j]!==1)continue;
        sent++;if(st[i]===0){st[i]=1;asked[j]=2}else if(!asked[j])asked[j]=1;continue}
      if(was[i]!==1||st[i]!==1)continue;
      sent++;const idle=(o.count?was[j]:st[j])!==0;if(st[j]===0)st[j]=1;tire(i,idle)}
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
    say.innerHTML=dual("The scrap starts at one library.","The update starts at one site.");
    while(more&&id===run){more=G.step();show(G);await sleep(110);
      if(box.getBoundingClientRect().bottom<0||box.getBoundingClientRect().top>innerHeight){more=false;say.innerHTML=dual("Stopped: the telling is out of sight. Start again when you are back.","Stopped: the spreading is out of sight. Start again when you are back.");return}}
    if(id===run)say.innerHTML=line(G,N)};
  return ()=>{run++;cell.forEach(c=>c.className="");[ids.res,ids.m,ids.day].forEach(s=>$(s).textContent=0);go.innerHTML=ids.label;say.innerHTML=ids.idle};
}
(function(){
  const o={k:1,attentive:true,count:true,mode:"tell"};
  const reset=gossipWell({cells:"#gcells",say:"#gsay",go:"#ggo",res:"#gres",m:"#gm",day:"#gday",label:dual("Start the telling","Start the spreading"),idle:dual("Pale: has not heard. Gold: still telling. Green: has stopped.","Pale: has not received it. Gold: still spreading. Green: has stopped.")},()=>({...o}),
    (G,N)=>dual(`The last teller stopped on day ${G.day}. <b>${G.left}</b> of ${N} libraries never heard, after ${G.m.toFixed(1)} tellings a library. One over the exponential of ${G.m.toFixed(1)} is about ${Math.round(N*Math.exp(-G.m))} in ${N}.`,`The last spreader stopped in cycle ${G.day}. <b>${G.left}</b> of ${N} sites never heard, after ${G.m.toFixed(1)} messages a site. One over the exponential of ${G.m.toFixed(1)} is about ${Math.round(N*Math.exp(-G.m))} in ${N}.`));
  seg($("#gk"),[1,2,3,4,5].map(k=>[k,k]),o.k,v=>{o.k=+v;reset()});
  seg($("#gfb"),[["1",dual("attentive","with feedback")],["0","blind"]],"1",v=>{o.attentive=v==="1";reset()});
  seg($("#gct"),[["1",dual("by count","by counter")],["0",dual("on a toss","by coin")]],"1",v=>{o.count=v==="1";reset()});
})();
(function(){
  const o={k:1,attentive:true,count:true,mode:"ask"};
  const reset=gossipWell({cells:"#acells",say:"#asay",go:"#ago",res:"#ares",m:"#am",day:"#aday",label:"Start",idle:dual("Choose telling or asking, and an allowance. A scholar asked by several in a day counts the day as wasted only if none of them needed the scrap, and starts the count afresh if any did.","Choose push or pull, and an allowance. A site asked by several in a cycle counts the cycle as wasted only if none of them needed the update, and starts the count afresh if any did.")},()=>({...o}),
    (G,N)=>dual(`It ended on day ${G.day}. <b>${G.left}</b> of ${N} libraries never heard, after ${G.m.toFixed(1)} tellings a library. ${o.mode==="ask"?(G.left<=Math.round(N*Math.exp(-G.m))?"That is fewer than telling leaves for the same number of tellings.":"A run can fall either side of what telling leaves; run it again."):"Telling pays the price of one over the exponential."}`,`It ended in cycle ${G.day}. <b>${G.left}</b> of ${N} sites never heard, after ${G.m.toFixed(1)} messages a site. ${o.mode==="ask"?(G.left<=Math.round(N*Math.exp(-G.m))?"That is fewer than push leaves for the same number of messages.":"A run can fall either side of what push leaves; run it again."):"Push pays the price of one over the exponential."}`));
  seg($("#amode"),[["tell",dual("telling","push")],["ask",dual("asking","pull")]],o.mode,v=>{o.mode=v;reset()});
  seg($("#ak"),[1,2,3].map(k=>[k,k]),o.k,v=>{o.k=+v;reset()});
})();

/* ===== withdrawing: what a library holds of one work is nothing, an edition, or a notice; each has a tally ===== */
const itemHtml=x=>!x?`<span class="it none">${dual("nothing of the work","nothing for the key")}</span>`:x.gone?`<span class="it gone">${dual(`edition, day ${x.t}`,`value, day ${x.t}`)}</span>`:x.notice?`<span class="it nt">${dual(`notice of withdrawal, day ${x.t}${x.woke?`, awake since day ${x.woke}`:""}`,`death certificate, day ${x.t}${x.woke?`, awake since day ${x.woke}`:""}`)}</span>`:`<span class="it">${dual(`edition, day ${x.t}`,`value, day ${x.t}`)}</span>`;
const nmS=s=>dual(s,s.replace("Library","Site").replace("A warden","A retention site").replace("Another library","Another site"));
const shelfHtml=(name,items)=>`<div class="shelf"><h5>${nmS(name)}</h5>${items.map(itemHtml).join("")}</div>`;
/* when two libraries compare one work: the later tally stands on both shelves; a library holding nothing takes what the other has */
function meet(a,b){if(!a)return [b,b,"take"];if(!b)return [a,a,"take"];return a.t>=b.t?[a,a,"later"]:[b,b,"later"]}
(function(){
  const box=$("#wshelves"),say=$("#wsay"),go=$("#wgo");let mode="strike",a,b;
  function reset(){a=mode==="strike"?null:{notice:true,t:5};b={t:3};go.disabled=false;
    box.innerHTML=shelfHtml("Library 1",[a])+shelfHtml("Library 2",[b]);
    say.innerHTML=mode==="strike"?dual("Library 1 has struck the work off its shelf. Library 2 still holds the old edition, written on day 3.","Site 1 has deleted the key. Site 2 still holds the old value, written on day 3."):dual("Library 1 has struck the work and keeps a notice of withdrawal, written on day 5. Library 2 still holds the old edition, written on day 3.","Site 1 has deleted the key and keeps a death certificate, written on day 5. Site 2 still holds the old value, written on day 3.")}
  seg($("#wmode"),[["strike",dual("It only struck the work","It only deleted the key")],["notice",dual("It left a notice of withdrawal","It left a death certificate")]],mode,v=>{mode=v;reset()});
  go.onclick=()=>{const [x,y,why]=meet(a,b);box.innerHTML=shelfHtml("Library 1",[x])+shelfHtml("Library 2",x.notice?[{...b,gone:true},y]:[y]);go.disabled=true;
    say.innerHTML=x.notice?dual(`The notice's tally is later than the edition's. Library 2 strikes its old edition and keeps the notice. <span class="ok">The work is withdrawn at both.</span>`,`The certificate's timestamp is later than the value's. Site 2 replaces its old value with the certificate. <span class="ok">The key is deleted at both.</span>`)
      :dual(`Library 1 holds nothing of the work, so it takes Library 2's edition. <span class="bad">The work is back on its shelf.</span>`,`Site 1 holds nothing for the key, so it takes Site 2's value. <span class="bad">The key is back.</span>`)};
  $("#wreset").onclick=reset;reset();
})();
(function(){
  const box=$("#tshelves"),say=$("#tsay"),old={t:3},back={t:8};
  const start=()=>box.innerHTML=shelfHtml("A warden",[{notice:true,t:5},old])+shelfHtml("Another library",[back]);
  /* a notice strikes an edition exactly when the notice's first tally is the later */
  function wake(fresh){const n=fresh?{notice:true,t:10}:{notice:true,t:5,woke:10},hit=e=>({...e,gone:n.t>e.t});
    const o=hit(old),bk=hit(back);
    box.innerHTML=shelfHtml("A warden",[n,o])+shelfHtml("Another library",[n,bk]);
    say.innerHTML=fresh?dual(`The woken notice carries day 10. It strikes the old edition of day 3, and ${bk.gone?`<span class="bad">it strikes the edition of day 8 as well</span>, which was written after the withdrawal to bring the work back.`:"spares the edition of day 8."}`,`The woken certificate carries day 10. It replaces the old value of day 3, and ${bk.gone?`<span class="bad">it replaces the value of day 8 as well</span>, which was written after the deletion to bring the key back.`:"spares the value of day 8."}`)
      :dual(`The woken notice still says the work was withdrawn on day 5, and is awake since day 10, so it is carried again. It strikes the old edition of day 3. ${bk.gone?"It strikes day 8 as well.":`<span class="ok">The edition of day 8 stands.</span>`}`,`The woken certificate still says the key was deleted on day 5, and is awake since day 10, so it is carried again. It replaces the old value of day 3. ${bk.gone?"It replaces day 8 as well.":`<span class="ok">The value of day 8 stands.</span>`}`)}
  $("#tone").onclick=()=>wake(true);$("#ttwo").onclick=()=>wake(false);start();
})();

/* ===== near partners: the paper's measures, drawn as bars ===== */
(function(){
  const rows=[[dual("Meetings on the ferry at a festival","Exchanges across the critical link in a cycle"),75.7,2.4],[dual("Meetings on an average road","Exchanges on an average link"),5.9,1.4],[dual("Festivals until the last library hears","Cycles until the last site hears"),7.8,13.3]];
  $("#fbars").innerHTML=rows.map(([t,a,b])=>{const mx=Math.max(a,b);return `<h5>${t}</h5>`+
    `<div class="b"><span>${dual("partners by lot","random partners")}</span><span class="v"><i style="width:${(a/mx*78).toFixed(1)}%"></i>${a}</span></div>`+
    `<div class="b"><span>nearer first</span><span class="v"><i class="n" style="width:${(b/mx*78).toFixed(1)}%"></i>${b}</span></div>`}).join("");
})();

REG.start();
})();

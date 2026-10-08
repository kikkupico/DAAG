/* the four mercenaries, told apart by colour */
const TC={1:"#e0b84a",2:"#6583d6",3:"#c45448",4:"#9cb648"};
const yesno=ok=>ok?"<span class='ok'>✓</span>":"<span class='bad'>✗</span>";
const tentChip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${TC[k]}"></i>Tent ${k}</span>`;

/* ===== machines: waiting tells A nothing ===== */
(function(){
  const waits=["1 second","2 seconds","5 seconds","30 seconds","5 minutes","1 hour","1 day"],log=$("#waitlog"),note=$("#waitnote"),b=$("#waitb"),r=$("#waitr");let i=0;
  b.onclick=()=>{const w=waits[i++],d=document.createElement("div");d.className="e";d.textContent=`waited ${w} ▸ no reply from B`;log.appendChild(d);while(log.children.length>5)log.firstChild.remove();
    note.textContent=i===1?"No reply. Has B stopped, or is its reply still on the way?":i<waits.length?`After ${w}, A knows exactly what it knew after one second.`:"A can wait as long as it likes. No length of waiting tells a machine that has stopped from one that is slow.";
    if(i>=waits.length){b.disabled=true;r.hidden=false}};
  r.onclick=()=>{i=0;log.innerHTML="";b.disabled=false;r.hidden=true;note.textContent="A has asked B for its value and is waiting for the reply."};
})();

/* ===== the hill, seen from above: one picture reused wherever ravens fly between the tents ===== */
function Hill(svg){
  const cx=235,cy=235,R=158,A={1:-90,2:0,3:90,4:180}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:96,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("circle",{cx,cy,r:24,fill:"#efe6cf",stroke:"#6b5a48","stroke-width":6},svg);
  el("text",{x:cx,y:cy+52,class:"lab"},svg).textContent="the crown";
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const H={svg,cx,cy,R,A,under,over,tent:{},
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:12,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph;return g},
    /* a raven u of the way from tent a to tent b, flying round the hill; each direction keeps its own line */
    fly(g,a,b,u){const d=((A[b]-A[a]+540)%360)-180;H.put(g,...H.at(A[a]+d*u,R-(d>0?24:46)*Math.sin(Math.PI*u)))},
    state(k,s){H.tent[k].st.textContent=s},
    badge(k,s){const b=H.tent[k].badge;b.setAttribute("opacity",s?1:0);b.lastChild.textContent=s||""}
  };
  for(const k of [1,2,3,4]){const a=A[k]*Math.PI/180,[x,y]=H.at(A[k]),g=el("g",{class:"site"},sites);H.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:TC[k]},g);el("text",{},g).textContent="T"+k;
    const st=el("text",{class:"state halo",x:-48*Math.cos(a),y:-46*Math.sin(a)},g);
    const badge=el("g",{class:"badge",opacity:0,transform:`translate(${(38*Math.cos(a)).toFixed(1)} ${(34*Math.sin(a)).toFixed(1)})`},g);el("circle",{r:11},badge);el("text",{},badge);
    H.tent[k]={x,y,g,st,badge}}
  return H;
}

/* ===== two easy plans, each giving up one demand ===== */
(function(){
  const H=Hill($("#plansvg")),say=$("#plansay"),D=[1,2,3].map(i=>$("#d"+i)),btn=["plan1","plan2","plan3","plannew"].map(i=>$("#"+i));
  const names=["No two commit differently","Both answers stay possible","Somebody eventually commits"],T=[1,2,3,4];
  let sight={},toks=[];
  const checks=(v,why)=>D.forEach((li,i)=>li.innerHTML=`<b>${names[i]}</b> ${v[i]==null?"":yesno(v[i])}${why[i]?"<br>"+why[i]:""}`);
  const lock=on=>btn.forEach(b=>b.disabled=on);
  function clear(){toks.forEach(g=>g.remove());toks=[];T.forEach(k=>{H.state(k,"");H.tent[k].g.classList.remove("out")})}
  function deal(){T.forEach(k=>{sight[k]=rnd(2)?"A":"H";H.badge(k,sight[k])});clear();checks([null,null,null],["","",""]);say.textContent="Each easy plan keeps two demands. Find the one it gives up."}
  /* every man in `from` sends what he saw to the other three; the birds take as long as they take */
  function birds(from){const ps=[];from.forEach(a=>T.forEach(b=>{if(b===a)return;const g=H.token(TC[a],sight[a]);toks.push(g);H.fly(g,a,b,.12);g.setAttribute("opacity",1);
    ps.push(tween(900+rnd(1900),u=>H.fly(g,a,b,.12+.76*u)).then(()=>g.setAttribute("opacity",0)))}));return Promise.all(ps)}
  btn[0].onclick=()=>{clear();T.forEach(k=>H.state(k,"holds"));
    checks([true,false,true],["All four hold.","They hold whatever anyone saw, so the evening was pointless.","Everyone commits at once."]);
    say.innerHTML="<b>Always hold</b> keeps the first and third demands, and gives up the second."};
  btn[1].onclick=async()=>{lock(true);clear();checks([null,null,null],["","",""]);say.textContent="Every man sends what he saw to the other three, and waits until he holds all four sightings.";
    await birds(T);const n=T.filter(k=>sight[k]==="A").length,att=n>=3;T.forEach(k=>H.state(k,att?"attacks":"holds"));
    checks([true,true,true],["All four apply one rule to the same four sightings.",`${n} of the 4 saw attack, so tonight the rule says ${att?"attack":"hold"}. Other sightings would say otherwise.`,"Everyone commits once the last bird is in."]);
    say.innerHTML="On a night when every man lives, <b>waiting for every report</b> keeps all three demands. The rule used here: attack if at least three saw attack, otherwise hold.";lock(false)};
  btn[2].onclick=async()=>{lock(true);clear();checks([null,null,null],["","",""]);H.tent[3].g.classList.add("out");H.state(3,"silent");say.textContent="Suppose nothing ever comes from tent 3. The other three send what they saw, and wait for all four sightings.";
    await birds([1,2,4]);[1,2,4].forEach(k=>H.state(k,"waits"));
    checks([true,true,false],["Nobody commits, so no two differ.","The rule still depends on what was seen.","Three men wait on a tent that will never answer, and can never learn that it will not."]);
    say.innerHTML="With one tent silent, <b>waiting for every report</b> gives up the third demand. Nobody at the foot can tell this night from one in which tent 3's bird is merely slow.";lock(false)};
  btn[3].onclick=deal;deal();
})();

/* ===== two nights that look the same from tent 2's perch ===== */
(function(){
  const HA=Hill($("#worldA")),HB=Hill($("#worldB")),say=$("#worldsay"),b=$("#worldb");let h=0;
  const t=HA.tent[1];t.g.classList.add("out");
  el("path",{d:`M${t.x-17},${t.y-17} L${t.x+17},${t.y+17} M${t.x-17},${t.y+17} L${t.x+17},${t.y-17}`,stroke:"#1c1512","stroke-width":5,fill:"none"},HA.over);
  const rv=HB.token(TC[1],"");rv.setAttribute("opacity",1);HB.fly(rv,1,2,.45);
  const [px,py]=HB.at(-90+90*.45,HB.R-24*Math.sin(Math.PI*.45));el("text",{class:"lab halo",x:px+6,y:py+30},HB.over).textContent="in a pine";
  b.onclick=()=>{h++;tween(500,u=>HB.fly(rv,1,2,.45+.025*Math.sin(u*Math.PI)));
    say.innerHTML=`<b>${h} hour${h>1?"s":""}</b> of waiting. Both perches are empty. Nothing tent 2 can see, measure or wait for tells the two nights apart.`+(h>=4?" Since no bird has a longest flight, waiting longer never turns one night into the other. It only makes the wait longer.":"")};
})();

/* ===== separate folds: two runs of arrivals with no man in common, in either order ===== */
(function(){
  const P=Polar($("#foldsvg"),{vb:"0 0 520 480",cx:260,cy:240,r0:40,step:27,rings:7,tEnd:7.4,
    nodes:{1:[225,"T1",TC[1]],2:[135,"T2",TC[2]],3:[315,"T3",TC[3]],4:[45,"T4",TC[4]]}});
  const stand=$("#foldstand"),say=$("#foldsay"),b12=$("#fold12"),b34=$("#fold34"),br=$("#foldr");
  let done=[],took={},last=null;
  const paint=()=>stand.innerHTML=[1,2,3,4].map(k=>`<div>${tentChip(k)} ${took[k]?`has taken in the raven from tent ${took[k]}`:"has taken in nothing yet"}</div>`).join("");
  const dot=(k,t)=>{const g=P.event(k,t,"#fffaf0",8);g.classList.add("st-new");g.style.cursor="default"};
  const arc=(a,ta,b,tb)=>P.slip(a,ta,b,tb,12).classList.add("st-new");
  function run(a,b,btn){
    const t=1.4+3.1*done.length;dot(a,t);arc(a,t,b,t+1.1);dot(b,t+1.1);arc(b,t+1.1,a,t+2.2);dot(a,t+2.2);
    took[b]=a;took[a]=b;done.push(a);btn.disabled=true;paint();
    if(done.length<2){say.innerHTML=`Tents ${a} and ${b} trade ravens. Nothing in that touched the other two tents.`;return}
    const order=done.join();
    say.innerHTML=`Now tents ${a} and ${b} trade. Every man has taken in his partner's raven, and no raven is left aloft. `+
      (last&&last!==order?"<span class='ok'>It is the same standing as last time</span>, when the other pair went first. The ravens and the tents they reach are the same; only the moments swapped.":"Start the night again, and let the other pair go first.");
    last=order;
  }
  function reset(){P.slips.innerHTML="";P.evs.innerHTML="";done=[];took={};b12.disabled=b34.disabled=false;paint();say.textContent="Tents 1 and 2 have ravens to trade, and so have tents 3 and 4. Which pair goes first?"}
  b12.onclick=()=>run(1,2,b12);b34.onclick=()=>run(3,4,b34);br.onclick=reset;reset();
})();

/* ===== the dusk that settles nothing: however the row is settled, two neighbours split ===== */
(function(){
  const box=$("#dusk"),say=$("#dusksay"),B=[0,1,2,3,4].map(n=>[1,2,3,4].map(k=>k<=n?"A":"H")),fate=["H","H","H","A","A"];
  const word={H:"hold",A:"attack"},ing={H:"holding",A:"attacking"};
  function render(focus){
    const i=fate.findIndex((f,j)=>j<4&&f!==fate[j+1]),p=i+1;
    box.innerHTML=B.map((b,j)=>{const end=j===0||j===4,tag=end?"div":"button",hot=j===i||j===i+1;
      return `<${tag} class="beg${hot?" split":""}"${end?"":` data-j="${j}" aria-label="A beginning settled for ${word[fate[j]]}. Press to change it."`}><div class="sq">${b.map((s,k)=>`<span style="background:${TC[k+1]}"${hot&&k+1===p?' class="p"':""}>${s}</span>`).join("")}</div><small>settled for<b class="${fate[j]==="H"?"hold":"att"}">${word[fate[j]]}</b>${end?"forced":"&nbsp;"}</small></${tag}>`}).join("");
    $$("button",box).forEach(bt=>bt.onclick=()=>{const j=+bt.dataset.j;fate[j]=fate[j]==="H"?"A":"H";render(j)});
    if(focus!=null)$(`button[data-j="${focus}"]`,box).focus();
    const x=fate[i],y=fate[i+1];
    say.innerHTML=`The two marked beginnings are settled opposite ways, and differ only in what <b>tent ${p}</b> saw. Take a night from the one settled for ${word[x]} in which tent ${p} never stirs, as the one silent man may. It ends in ${ing[x]}. Run the same night from its neighbour: tent ${p} has told nobody what he saw, so the other three see the same ravens in the same order, and it ends in ${ing[x]} there too. <span class="bad">But that beginning was settled for ${word[y]}.</span> However you settle the row, some pair splits like this. So some beginning is not settled at all.`;
  }
  render();
})();

/* ===== scrollytelling: the raven that would settle it can be held back ===== */
(function(){
  const svg=$("#defersvg");svg.setAttribute("viewBox","0 0 640 470");
  const HOLD="#136f9e",ATT="#bf4a26",PLAIN="#f3ead0",X=[110,250,390,530],YT=200,YB=350;
  const m=el("marker",{id:"defer-k",markerWidth:9,markerHeight:9,refX:7.5,refY:3.2,orient:"auto"},el("defs",{},svg));el("path",{d:"M0,0 L7.5,3.2 L0,6.4 z",fill:"#1c1512"},m);
  const kinds={open:[HOLD,ATT,""],H:[HOLD,HOLD,"H"],A:[ATT,ATT,"A"],q:["#b9a77e","#b9a77e","?"],plain:[PLAIN,PLAIN,""]};
  function node(x,y){const n=el("g",{class:"gr-node fade",transform:`translate(${x} ${y})`},svg),l=el("path",{d:"M0,-28 A28,28 0 0 0 0,28 z"},n),r=el("path",{d:"M0,-28 A28,28 0 0 1 0,28 z"},n);
    el("circle",{class:"rim",r:28},n);const t=el("text",{},n);n.set=k=>{l.setAttribute("fill",kinds[k][0]);r.setAttribute("fill",kinds[k][1]);t.textContent=kinds[k][2]};return n}
  const arrow=(x1,y1,x2,y2,cls="")=>el("line",{class:"gr-arrow fade "+cls,x1,y1,x2,y2,"marker-end":"url(#defer-k)"},svg);
  const label=(x,y,s,anchor)=>{const t=el("text",{class:"gr-lab fade",x,y},svg);t.textContent=s;if(anchor)t.style.textAnchor=anchor;return t};
  const mark=(x,y,ok)=>{const t=el("text",{class:(ok?"gr-ok":"gr-x")+" fade",x,y},svg);t.textContent=ok?"✓":"✗";return t};
  const box=el("rect",{class:"gr-box fade",x:X[1]-46,y:YT-46,width:X[2]-X[1]+92,height:YB-YT+92,rx:14},svg);
  const right=[0,1,2].map(i=>arrow(X[i]+34,YT,X[i+1]-38,YT)),down=X.map(x=>arrow(x,YT+34,x,YB-38));
  const top=X.map(x=>node(x,YT)),bot=X.map(x=>node(x,YB));
  const l0=label(X[0]+46,YT+6,"one raven is waiting to land","start"),lt=label(320,YT-56,"the night goes on while the raven waits"),ld=label(X[0]+12,(YT+YB)/2+6,"the raven lands","start");
  const below=arrow(X[1]+34,YB,X[2]-38,YB),bx=mark(320,YB-24,false);
  const quiet=node(320,64),qa=arrow(X[1]+16,YT-34,302,92,"dash"),ql=label(398,58,"the other three finish","start"),ql2=label(398,80,"without him: open still","start"),qx=mark(372,64,false),ok=mark(X[1]+46,YB-30,true);
  quiet.set("open");
  /* the key along the bottom */
  [["H","settled for holding",40],["A","settled for attacking",235],["open","open",445]].forEach(([k,s,x])=>{const n=node(x,440);n.setAttribute("transform",`translate(${x} 440) scale(.42)`);n.set(k);n.classList.add("on");n.lastChild.textContent="";label(x+20,445,s,"start").classList.add("on")});
  const on=(e,v)=>e.classList.toggle("on",!!v);
  scrolly($("#defer"),s=>{
    top.forEach((n,i)=>{on(n,i===0||s>=1);n.set(i===0?"open":"plain")});
    bot.forEach((n,i)=>{on(n,s>=1);n.set(s<2?"q":s<6?"HHAA"[i]:i===1?"open":"q")});
    right.forEach(a=>on(a,s>=1));down.forEach(a=>on(a,s>=1));
    on(l0,s===0);on(lt,s>=1&&s!==5);on(ld,s>=1);on(box,s>=3&&s<6);
    on(below,s===4);on(bx,s===4);[quiet,qa,ql,ql2,qx].forEach(e=>on(e,s===5));on(ok,s===6);
  });
})();

/* ===== a fair night in which nothing is settled; and the same night once birds have a longest flight ===== */
(function(){
  const H=Hill($("#nightsvg")),qEl=$("#nightq"),say=$("#nightsay"),mode=$("#nightmode"),nA=$("#narr"),nL=$("#naloft"),nC=$("#ncom"),bRun=$("#nightrun"),bB=$("#nightbound"),bR=$("#nightreset"),T=[1,2,3,4];
  let queue=[],aloft=[],arr=0,com=0,timer=null,want=false,busy=false,seq=0,gen=0;
  function paint(){qEl.innerHTML="The queue: "+queue.map((k,i)=>tentChip(k,i?"":' style="box-shadow:0 0 0 3px var(--gold)"')).join("");
    nA.textContent=arr;nL.textContent=aloft.length;nC.textContent=com;T.forEach(k=>H.tent[k].g.classList.toggle("turn",want&&k===queue[0]))}
  function send(a,quick){let b;do{b=1+rnd(4)}while(b===a);const r={a,b,n:seq++,u:.4+Math.random()*.2,g:H.token(TC[a],"")};aloft.push(r);H.fly(r.g,a,b,.12);r.g.setAttribute("opacity",1);
    return tween(quick?0:600,u=>H.fly(r.g,a,b,.12+(r.u-.12)*u))}
  const land=r=>tween(600,u=>H.fly(r.g,r.a,r.b,r.u+(.88-r.u)*u)).then(()=>r.g.remove());
  function stop(){clearInterval(timer);timer=null}
  function go(){if(!timer&&want){turn();timer=setInterval(turn,1700)}}
  /* the man at the head of the queue takes in the raven longest aloft for him, or comes back empty-handed */
  async function turn(){
    if(busy)return;busy=true;const g0=gen,k=queue[0],r=aloft.filter(x=>x.b===k).sort((x,y)=>x.n-y.n)[0];
    if(r){aloft.splice(aloft.indexOf(r),1);say.innerHTML=`<b>Tent ${k}</b> takes in the raven longest aloft for him, from tent ${r.a}, and writes one more. The night is open still.`;
      await land(r);if(g0!==gen)return;arr++;await send(k)}
    else{say.innerHTML=`Nothing is waiting for <b>tent ${k}</b>. He walks to his perch and back, empty-handed. The night is open still.`;await sleep(700)}
    if(g0!==gen)return;queue.push(queue.shift());paint();busy=false;
  }
  function reset(){gen++;stop();want=busy=false;aloft.forEach(r=>r.g.remove());queue=[1,2,3,4];aloft=[];arr=com=0;T.forEach(k=>{H.state(k,"");send(k,true)});
    mode.textContent="not yet begun";say.textContent="No man is starved of his turn, and every raven is taken in at last.";bRun.disabled=bB.disabled=false;paint()}
  bRun.onclick=()=>{want=true;bRun.disabled=true;mode.textContent="open, and staying open";paint();go()};
  bB.onclick=async()=>{const g0=++gen;stop();want=false;busy=true;bRun.disabled=bB.disabled=true;paint();mode.textContent="the birds have a longest flight";
    say.innerHTML="Now no raven is ever aloft longer than a time all four know. Each man waits that long.";
    await sleep(1200);if(g0!==gen)return;const n=aloft.length;await Promise.all(aloft.map(land));if(g0!==gen)return;
    aloft=[];arr+=n;com=4;T.forEach(k=>H.state(k,"commits"));mode.textContent="closed";paint();
    say.innerHTML="When that time has passed, an empty perch means something: every raven that was sent is in, so a silent tent is a dead one. <span class='ok'>All four can apply one rule to the same reports, and commit.</span>"};
  bR.onclick=reset;
  new IntersectionObserver(es=>{if(es[0].isIntersecting)go();else stop()},{threshold:.1}).observe($("#nightsvg"));
  reset();
})();

/* ===== relevance map ===== */
mapPairs($("#map"),[["Four tents, one man in each","Processes"],["Attack or hold","A decision between two values"],["What a man saw at dusk","His input value"],["Committing: leaving the tent","Deciding, once and for good"],["A raven","A message"],["No longest flight","Asynchrony: no bound on message delay"],["A tent that falls silent","A crash, which looks exactly like slowness"],["No drawing lots","A deterministic protocol"],["A standing","A configuration"],["An arrival","A step: one process receiving one message"],["Open / closed","Bivalent / univalent"],["The three demands","Agreement, validity, termination"]]);

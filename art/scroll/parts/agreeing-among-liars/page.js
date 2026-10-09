/* the four bandits, told apart by colour; bandit 1 is the chief inside the ring wall */
const BC={1:"#a57fc0",2:"#9aa0a8",3:"#e8964d",4:"#b07a55"};
const ORD={H:"hold",S:"scatter"},OC={H:"#136f9e",S:"#bf4a26"};
const yesno=ok=>ok?"<span class='ok'>✓</span>":"<span class='bad'>✗</span>";
const chip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${BC[k]}"></i>Bandit ${k}</span>`;
const word=w=>`<b style="color:${OC[w]}">${ORD[w]}</b>`;
const mkBtn=(p,fn,cls="btn alt")=>{const b=document.createElement("button");b.className=cls;b.onclick=fn;p.appendChild(b);return b};

/* ===== the crown from above: the ring wall at the centre with the chief inside, three posts out on the slopes ===== */
function Crown(svg){
  const cx=235,cy=235,R=160,A={2:-90,3:30,4:150}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:112,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("circle",{cx,cy,r:56,fill:"#efe6cf",stroke:"#6b5a48","stroke-width":9},svg);
  el("text",{x:cx,y:cy-70,class:"lab halo"},svg).textContent="ring wall";
  const sites=el("g",{},svg),over=el("g",{},svg);
  const H={svg,over,site:{},
    pos(k){if(k===1)return [cx,cy];const a=A[k]*Math.PI/180;return [cx+R*Math.cos(a),cy+R*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:12,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph;return g},
    /* a rat u of the way from post a to post b; each direction keeps its own line */
    fly(g,a,b,u){const [x1,y1]=H.pos(a),[x2,y2]=H.pos(b),dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),bow=16*Math.sin(Math.PI*u);H.put(g,x1+dx*u-dy/L*bow,y1+dy*u+dx/L*bow)},
    state(k,s){H.site[k].st.textContent=s},
    mark(k,on){H.site[k].g.classList.toggle("turn",on)}};
  for(const k of [1,2,3,4]){const [x,y]=H.pos(k),g=el("g",{class:"site"},sites);H.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:BC[k]},g);el("text",{},g).textContent="B"+k;
    const a=(A[k]||0)*Math.PI/180,st=el("text",{class:"state halo",x:k===1?0:-48*Math.cos(a),y:k===1?80:-46*Math.sin(a)},g);
    H.site[k]={g,st}}
  return H;
}
/* a slip drawn as an arc in the round, in the colour of what it says */
function slip(P,a,ta,b,tb,w,lab=true,at=.5){const p=P.slip(a,ta,b,tb,14);p.style.stroke=OC[w];p.setAttribute("marker-end",`url(#${P.svg.id}-${w==="S"?"r":"b"})`);
  if(lab){const pts=P.arc(a,ta,b,tb),q=pts[Math.round((pts.length-1)*at)],t=el("text",{class:"lab halo k",x:q[0],y:q[1]+4},P.over);t.style.fill=OC[w];t.textContent=ORD[w]}return p}
const dot=(P,k,t,fill="#fffaf0")=>{const g=P.event(k,t,fill,8);g.style.cursor="default";return g};

/* ===== machines: the same two messages, two explanations ===== */
(function(){
  const hold=$("#mqhold"),note=$("#mqnote"),bc=$("#mqc"),bb=$("#mqb");
  const W={c:{sentA:1,sentB:0,toldA:0,says:"C sent 1 to A and 0 to B, and B reported what it was sent."},
           b:{sentA:1,sentB:1,toldA:0,says:"C sent 1 to both. B reported 0 to A, which is false."}};
  const ev=w=>[w.sentA,w.toldA],base=JSON.stringify(ev(W.c));
  const holds=`<div><b>A holds</b></div><div class="e">from C: “the order is 1”</div><div class="e">from B: “C told me the order was 0”</div>`;
  hold.innerHTML=holds;
  const show=k=>{const w=W[k];hold.innerHTML=holds+`<div style="margin-top:6px"><b>What happened</b></div><div class="e">${w.says}</div>`;
    note.innerHTML=`A holds ${JSON.stringify(ev(w))===base?"exactly the same two messages in the other case too":"different messages"} ${yesno(JSON.stringify(ev(w))===base)} A cannot tell which machine is faulty, and a decision that follows C's order in one case is wrong in the other.`};
  bc.onclick=()=>show("c");bb.onclick=()=>show("b");
})();

/* ===== the two conditions, tested on whatever is supposed ===== */
(function(){
  const H=Crown($("#condsvg")),ctl=$("#condctl"),gb=$("#condguards"),c1=$("#c1"),c2=$("#c2"),say=$("#condsay"),T=[1,2,3,4];
  let chief=1,liar=0,ord="H";const act={1:"H",2:"H",3:"H",4:"H"};
  const bC=mkBtn(ctl,()=>{chief=chief%4+1;paint()}),bL=mkBtn(ctl,()=>{liar=(liar+1)%5;paint()}),bO=mkBtn(ctl,()=>{ord=ord==="H"?"S":"H";paint()});
  const gbt={};T.forEach(k=>gbt[k]=mkBtn(gb,()=>{act[k]=act[k]==="H"?"S":"H";paint()}));
  function paint(){
    const guards=T.filter(k=>k!==chief),honest=guards.filter(k=>k!==liar),cl=liar===chief;
    bC.textContent=`Whose account is going round: bandit ${chief}`;
    bL.textContent=liar?`Suppose bandit ${liar} lies`:"Suppose nobody lies";
    bO.textContent=cl?"The chief sends different orders to different guards":`The chief sends: ${ORD[ord]}`;bO.disabled=cl;
    T.forEach(k=>{const g=k!==chief;gbt[k].style.display=g?"":"none";gbt[k].disabled=k===liar;
      gbt[k].textContent=k===liar?`Bandit ${k} may do anything`:`Bandit ${k} obeys: ${ORD[act[k]]}`;
      H.mark(k,k===chief);H.state(k,k===chief?(cl?"chief, supposed liar":"chief"):k===liar?"supposed liar":ORD[act[k]])});
    const same=new Set(honest.map(k=>act[k])).size<=1,obeyed=honest.every(k=>act[k]===ord);
    c1.innerHTML=`<b>The first: every honest guard obeys the same order</b> ${yesno(same)}<br>${honest.map(k=>`bandit ${k} ${act[k]==="H"?"holds":"scatters"}`).join(", ")}`;
    c2.innerHTML=cl?`<b>The second: an honest chief is obeyed</b><br>It promises nothing here, because the chief is the supposed liar.`:
      `<b>The second: an honest chief is obeyed</b> ${yesno(obeyed)}<br>The chief sent ${ORD[ord]}.`;
    say.innerHTML=cl?"Suppose the chief lies. The second condition says nothing, while the first still stands: make the honest guards end together, whatever the chief sent.":
      same&&obeyed?"Both conditions hold. Now press a guard to change what they obey, or change who lies.":
      !same?"<span class='bad'>Two honest guards obey different orders.</span> The first condition fails.":
      "<span class='bad'>The honest guards agree with each other but not with the chief's order.</span> The second condition fails.";
  }
  paint();
})();

/* ===== a round of rats: arrival, the knots, silence ===== */
(function(){
  const AUTO=-1;
  const H=Crown($("#ratsvg")),say=$("#ratsay"),box=$("#ratacc"),bs=["rat1","rat2","rat3"].map(i=>$("#"+i));
  const all=[[1,2,"S"],[1,3,"S"],[1,4,"S"]];
  const SC=[
    {rounds:[all],say:"Every slip arrived as written, and the knots on each cord name the sender. Each guard now holds what the chief sent."},
    {rounds:[[[1,2,"S"],[1,4,"S"]]],say:"The glass has run out. Nothing came to bandit 3 within the round, so nothing was sent, and the empty post counts as hold. Hold is only the definite answer, not the wiser one."},
    {rounds:[all,[[2,3,"S"],[2,4,"S"],[3,2,"H"],[3,4,"H"],[4,2,"S"],[4,3,"S"]]],say:"Suppose bandit 3 wrote hold, though the chief's slip to bandit 3 said scatter. The slip arrived as written, with bandit 3's knots on its cord. Bandits 2 and 4 hold a word they have no way to check."}];
  let toks=[],busy=false;
  const clear=()=>{toks.forEach(g=>g.remove());toks=[];box.innerHTML="";[1,2,3,4].forEach(k=>H.state(k,""))};
  function accounts(S){box.innerHTML=[2,3,4].map(k=>{
    const lines=[S.rounds[0].some(r=>r[1]===k)?`<div class="e">from the chief: ${word("S")}</div>`:`<div class="e">from the chief: nothing came within the round, so ${word("H")}</div>`];
    (S.rounds[1]||[]).filter(r=>r[1]===k).forEach(([a,,w])=>lines.push(`<div class="e">from bandit ${a}: “the chief sent me ${ORD[w]}”</div>`));
    return `<div>${chip(k)}${lines.join("")}</div>`}).join("")}
  async function run(i){
    if(busy)return;busy=true;bs.forEach(b=>b.disabled=true);clear();const S=SC[i];say.textContent="The slips go out, and the glass runs.";
    for(let r=0;r<S.rounds.length;r++){const ps=[];
      S.rounds[r].forEach(([a,b,w])=>{const g=H.token(BC[a],w);toks.push(g);H.fly(g,a,b,.12);g.setAttribute("opacity",1);
        ps.push(tween(1000,u=>H.fly(g,a,b,.12+.76*u)).then(()=>g.setAttribute("opacity",0)))});
      await Promise.all(ps);
      if(r<S.rounds.length-1){say.textContent="Next, each guard writes what the chief sent them to the other two.";await sleep(300)}}
    accounts(S);say.innerHTML=S.say;busy=false;bs.forEach(b=>b.disabled=false)}
  bs.forEach((b,i)=>b.onclick=()=>run(i));
  if(AUTO>=0)run(AUTO);
})();

/* ===== two nights that look the same from bandit 2's post ===== */
(function(){
  const AUTO=0;
  const NB={1:[-90,"B1",BC[1]],2:[150,"B2",BC[2]],3:[30,"B3",BC[3]]};
  const mk=svg=>Polar(svg,{vb:"0 0 360 320",cx:180,cy:165,r0:30,step:25,rings:5,tEnd:4.8,nodes:NB});
  let PA=mk($("#worldA")),PB=mk($("#worldB"));
  /* what each night is: what the chief sent each guard, and what each guard told the other */
  const N={A:{send:{2:"H",3:"H"},tell:{"3>2":"S","2>3":"H"}},   // the chief is honest; bandit 3 lies to bandit 2
           B:{send:{2:"H",3:"S"},tell:{"3>2":"S","2>3":"H"}},   // the chief lies; both guards report truthfully
           C:{send:{2:"S",3:"S"},tell:{"3>2":"S","2>3":"H"}}};  // the mirror of A: the chief is honest; bandit 2 lies to bandit 3
  const ev=(n,k)=>k===2?[N[n].send[2],N[n].tell["3>2"]]:[N[n].send[3],N[n].tell["2>3"]];
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const text=(n,k)=>{const e=ev(n,k),o=k===2?3:2;return `bandit ${k}: from the chief “${ORD[e[0]]}”, from bandit ${o} “the chief sent me ${ORD[e[1]]}”`};
  const say=$("#worldsay"),eA=$("#evA"),eB=$("#evB"),b=[1,2,3,4].map(i=>$("#wb"+i)),br=$("#wbr");
  function draw(P,n,stage){P.slips.innerHTML="";P.evs.innerHTML="";P.over.innerHTML="";
    if(stage>=1){[2,3].forEach(k=>slip(P,1,1.4,k,2.7,N[n].send[k]));dot(P,1,1.4,BC[1]);dot(P,2,2.7,BC[2]);dot(P,3,2.7,BC[3])}
    if(stage>=2){[[3,2],[2,3]].forEach(([a,c])=>slip(P,a,3.0,c,4.3,N[n].tell[a+">"+c],true,a===3?.3:.7));dot(P,2,4.3,BC[2]);dot(P,3,4.3,BC[3])}}
  const lock=s=>b.forEach((x,i)=>x.disabled=i!==s);
  function go(s){
    if(s===0){draw(PA,"A",1);draw(PB,"B",1);say.innerHTML=`In the first night the chief sends ${word("H")} to both guards. In the second, ${word("H")} to bandit 2 and ${word("S")} to bandit 3.`}
    if(s===1){draw(PA,"A",2);draw(PB,"B",2);eA.textContent=text("A",2);eB.textContent=text("B",2);
      say.innerHTML="Each guard tells the other what the chief sent them. Bandit 3 is the one who lies in the first night, and in the second tells the truth."}
    if(s===2){const eq=same(ev("A",2),ev("B",2));eA.classList.toggle("same",eq);eB.classList.toggle("same",eq);
      say.innerHTML=`In the first night the chief is honest, so by the second condition bandit 2 must ${word("H")}. In the second night bandit 2 holds exactly the same two slips ${yesno(eq)} and cannot tell the nights apart, so ${word("H")}s there too.`}
    if(s===3){const eq=same(ev("B",3),ev("C",3));
      say.innerHTML=`Run the same argument on bandit 3. In a third night, the mirror of the first, the chief is honest and sends ${word("S")} to both, and suppose bandit 2 lies. Bandit 3 would then have to ${word("S")}, and holds in that night exactly what bandit 3 holds in the second ${yesno(eq)}: from the chief “${ORD[ev("B",3)[0]]}”, from bandit 2 “the chief sent me ${ORD[ev("B",3)[1]]}”. So in the second night bandit 2 holds, bandit 3 scatters, and both are honest. <span class='bad'>The first condition fails.</span>`}
    lock(s+1);}
  let s=0;
  b.forEach((x,i)=>x.onclick=()=>{if(i===s)go(s++)});
  function reset(){PA=mk($("#worldA"));PB=mk($("#worldB"));eA.textContent=eB.textContent="bandit 2 holds: nothing yet";eA.classList.remove("same");eB.classList.remove("same");s=0;lock(0);say.textContent="Press the buttons in turn."}
  br.onclick=reset;reset();for(let i=0;i<AUTO;i++)go(s++);
})();

/* ===== the price of a liar ===== */
(function(){
  const nm=$("#pm"),nn=$("#pn"),nr=$("#pr"),ns=$("#ps"),say=$("#pricesay"),up=$("#pup"),dn=$("#pdown");let m=1;
  function paint(){
    nm.textContent=m;nn.textContent=3*m+1;nr.textContent=m+1;ns.textContent=m+2;up.disabled=m>=6;dn.disabled=m<=1;
    const plain=4>3*m,sealed=4>=m+2;
    say.innerHTML=`With plain slips the crown's four men ${plain?"are enough":"are too few"} ${yesno(plain)}, since it takes more than ${3*m} men. Under seal four men ${sealed?"are enough":"leave too few honest men for agreement to mean anything"} ${yesno(sealed)}, since the question needs at least two men more than there are liars.`}
  up.onclick=()=>{m++;paint()};dn.onclick=()=>{m--;paint()};paint();
})();

/* ===== scrollytelling: the Repeating, twice ===== */
(function(){
  const STEP=null;
  const svg=$("#repsvg"),side=$("#repside");
  const NB={1:[-90,"B1",BC[1]],2:[0,"B2",BC[2]],3:[90,"B3",BC[3]],4:[180,"B4",BC[4]]};
  /* two nights, one liar in each: a supposed guard with an honest chief, then the chief with three honest guards */
  const SC={honest:{liar:3,r1:{2:"S",3:"S",4:"S"},tell:a=>a===3?"H":"S"},
            lying:{liar:1,r1:{2:"S",3:"H",4:"S"},tell:a=>SC.lying.r1[a]}};
  const maj=l=>l.filter(x=>x==="S").length*2>l.length?"S":"H";   // two values only, and three accounts: one has most
  const accounts=(S,k)=>[S.r1[k],...[2,3,4].filter(j=>j!==k).map(j=>S.tell(j,k))];
  /* per step: night, rounds drawn, count shown */
  const ST=[null,["honest",1,0],["honest",2,0],["honest",2,1],["lying",1,0],["lying",2,0],["lying",2,1]];
  const card=(k,S,rounds,count)=>{
    if(!S)return `<div class="hc"><h5>${chip(k)}</h5><div class="chk">Nothing sent yet.</div></div>`;
    const isL=k===S.liar,acc=accounts(S,k),w=maj(acc);
    const lines=[rounds>=1?`from the chief: ${word(acc[0])}`:"",
      ...(rounds>=2?[2,3,4].filter(j=>j!==k).map((j,n)=>`from bandit ${j}: ${word(acc[n+1])}`):[])].filter(Boolean);
    return `<div class="hc${count&&!isL?" in":""}"><h5>${chip(k)}<span>${count&&!isL?"obeys "+ORD[w]:isL?"supposed liar":""}</span></h5><div class="chk">${isL&&k!==1?"Its word is not counted.":lines.join("<br>")}</div></div>`};
  function render(i){
    const P=Polar(svg,{vb:"0 0 440 440",cx:220,cy:220,r0:34,step:28,rings:6,tEnd:5.4,nodes:NB,note:[12,430]}),s=ST[i];
    [["hold","H",20],["scatter","S",40]].forEach(([t,w,y])=>{const e=el("text",{class:"lab k",x:12,y},P.over);e.style.textAnchor="start";e.style.fontSize="18px";e.style.fill=OC[w];e.textContent="■ "+t});
    if(s){const S=SC[s[0]],rounds=s[1],count=s[2];dot(P,1,1.4,BC[1]);
      if(rounds>=1)[2,3,4].forEach(k=>{slip(P,1,1.4,k,2.6,S.r1[k],false);dot(P,k,2.6,BC[k])});
      if(rounds>=2)[2,3,4].forEach(a=>[2,3,4].filter(b=>b!==a).forEach(b=>slip(P,a,2.9,b,4.1,S.tell(a,b),false)));
      if(rounds>=2)[2,3,4].forEach(k=>dot(P,k,4.1,BC[k]));
      if(count)[2,3,4].filter(k=>k!==S.liar).forEach(k=>{const [x,y]=P.pt(k,4.1),w=maj(accounts(S,k)),a=NB[k][0]*Math.PI/180,
        t=el("text",{class:"lab halo k",x:x+Math.cos(a)*40,y:y+Math.sin(a)*26+4},P.over);t.style.fill=OC[w];t.style.fontSize="18px";t.textContent=ORD[w]})}
    side.innerHTML=[2,3,4].map(k=>card(k,s&&SC[s[0]],s?s[1]:0,s?s[2]:0)).join("");
  }
  scrolly($("#rep"),i=>render(i));
  if(STEP!==null)render(STEP);
})();

/* ===== seals: relay by the rule, and read the sheaves ===== */
(function(){
  const AUTO=null;
  const NB={1:[-90,"B1",BC[1]],2:[0,"B2",BC[2]],3:[90,"B3",BC[3]],4:[180,"B4",BC[4]]};
  const svg=$("#sealsvg"),ctl=$("#sealctl"),tab=$("#sealtab"),k1=$("#k1"),k2=$("#k2"),say=$("#sealsay");
  const liars=new Set([1]);let split=0;
  const SP=[{t:"hold to bandit 2, scatter to bandits 3 and 4",o:{2:"H",3:"S",4:"S"}},
            {t:"hold to bandits 2 and 3, scatter to bandit 4",o:{2:"H",3:"H",4:"S"}},
            {t:"hold to bandit 2 only, nothing to the others",o:{2:"H"}}];
  const guards=[2,3,4],rule=sh=>sh.size===1?[...sh.keys()][0]:"H";   // an example standing rule: one order gives that order, anything else gives hold
  function sim(){
    const m=liars.size,cl=liars.has(1),sheaf={2:new Map(),3:new Map(),4:new Map()},slips=[];
    const first=cl?SP[split].o:{2:"S",3:"S",4:"S"};
    let wave=Object.keys(first).map(g=>({from:1,to:+g,w:first[g],seals:[1],r:1}));
    while(wave.length){const next=[];
      for(const s of wave){slips.push(s);const sh=sheaf[s.to];if(sh.has(s.w))continue;sh.set(s.w,s.seals);
        if(liars.has(s.to))continue;                                   // a supposed liar guard passes nothing on
        if(s.seals.length-1<m)for(const g of guards)if(!s.seals.includes(g)&&g!==s.to)   // fewer than m guards' seals, the chief's not counted
          next.push({from:s.to,to:g,w:s.w,seals:[...s.seals,s.to],r:s.r+1})}
      wave=next}
    return {m,cl,sheaf,slips};
  }
  const bl={};[1,2,3,4].forEach(k=>{bl[k]=mkBtn(ctl,()=>{liars.has(k)?liars.delete(k):liars.add(k);paint()});bl[k].setAttribute("aria-pressed","false")});
  const bs=mkBtn(ctl,()=>{split=(split+1)%SP.length;paint()});
  function paint(){
    const {m,cl,sheaf,slips}=sim(),honest=guards.filter(k=>!liars.has(k));
    [1,2,3,4].forEach(k=>{bl[k].setAttribute("aria-pressed",liars.has(k));bl[k].textContent=`${liars.has(k)?"Supposing":"Suppose"} bandit ${k} lies`});
    bs.style.display=cl?"":"none";bs.textContent="The chief seals: "+SP[split].t;
    const P=Polar(svg,{vb:"0 0 440 440",cx:220,cy:220,r0:34,step:28,rings:6,tEnd:6,nodes:NB});
    dot(P,1,1.4,BC[1]);slips.forEach(s=>{const t0=1.4+1.5*(s.r-1);slip(P,s.from,t0,s.to,t0+1.2,s.w,false);dot(P,s.to,t0+1.2,BC[s.to])});
    const ans={};honest.forEach(k=>ans[k]=rule(sheaf[k]));
    tab.innerHTML=guards.map(k=>{
      if(liars.has(k))return `<div>${chip(k)} supposed liar: passes nothing on</div>`;
      const items=[...sheaf[k].entries()].map(([w,s])=>`<span class="term" style="color:${OC[w]}">${ORD[w]} : ${s.join(" : ")}</span>`);
      return `<div>${chip(k)} sheaf: ${items.join(" · ")||"empty"} → obeys ${word(ans[k])}</div>`}).join("");
    const same=new Set(Object.values(ans)).size<=1,obeys=honest.every(k=>ans[k]==="S");
    k1.innerHTML=`<b>The first: every honest guard obeys the same order</b> ${yesno(same)}<br>${honest.length<2?"Fewer than two honest guards remain, so agreement among them means little.":"Honest guards: "+honest.map(k=>"bandit "+k).join(", ")+"."}`;
    k2.innerHTML=cl?`<b>The second: an honest chief is obeyed</b><br>It promises nothing here, because the chief is a supposed liar.`:`<b>The second: an honest chief is obeyed</b> ${yesno(obeys)}<br>The chief sealed scatter.`;
    const two=honest.some(k=>sheaf[k].size>1);
    say.innerHTML=`The party is built to bear <b>${m}</b> ${m===1?"liar":"liars"}, so a guard passes a slip on while fewer than ${m} ${m===1?"guard's seal stands":"guards' seals stand"} on it. ${two?"A sheaf now holds two orders under the chief's seal, which an honest chief would never have sealed: <b>the chief has convicted themselves</b>, of lying and of nothing else. ":""}${cl&&!two&&honest.length?"The chief sealed only one order that reached an honest guard, so nothing marks the chief. ":""}`;
  }
  paint();
  if(AUTO)AUTO();
})();

/* ===== who is who ===== */
mapPairs($("#map"),[
  ["The chief inside the ring wall, three guards on the slopes","n generals; here n = 4, exactly 3m + 1 for one traitor"],
  ["The chief, a job passed round","The commanding general: whoever's value is going round"],
  ["Hold / scatter","ATTACK and RETREAT; which is better is never at issue"],
  ["Silence counts as hold","The default order, RETREAT: fixed and known beforehand"],
  ["The two conditions","IC1 and IC2, the interactive consistency conditions"],
  ["Running it four times, once for each man","Interactive consistency proper: the solution run once per general"],
  ["A rat to one post, not a shout to all","Point-to-point messages, and no broadcast: a commander heard by all at once could not equivocate"],
  ["Slips arrive as written; the knots name the sender","Assumptions A1 and A2"],
  ["A round; short watched runs; glasses turned together at dusk","A3 and the synchronous round: bounded message time plus synchronised clocks"],
  ["A plain slip says whatever its writer chose","Oral messages: content entirely under the sender's control"],
  ["A liar may send anything, or nothing, and two may agree their lies","Byzantine faults, collusion permitted"],
  ["The Repeating; the greater count","Algorithm OM(m) and the function majority"],
  ["Three cannot be brought to agree","Section 2; the rigorous proof is in Pease, Shostak and Lamport 1980"],
  ["More than three men to a liar; one man playing several parts","n ≥ 3m + 1, by the Albanian-generals simulation"],
  ["Acting at about the same time is as hard as acting together","The approximate-agreement reduction, IC1′ and IC2′"],
  ["The seal rings; the line of stamps along a slip","Unforgeable signatures, A4; the notation v : 0 : j₁ : … : jₖ"],
  ["Liars may lend each other rings; a slip may be withheld but not altered","Nothing is assumed of a traitor's signature; A4(a) does not prevent withholding"],
  ["The Sealed Repeating; the sheaf; the standing rule","Algorithm SM(m); the set Vᵢ; the function choice"],
  ["Relaying only while fewer than m guards' seals stand on a slip","SM(m) step (2)(B)(ii): forward only if k < m, k counting lieutenants' signatures"],
  ["Any number of liars, whatever the size of the party","Theorem 2; the problem is merely vacuous below m + 2 men"],
  ["The chief's seal on two orders convicts the chief","SM(1) with three generals, the paper's Fig. 5"],
  ["Every post can reach every other","Section 5 treats parties where that fails: 3m-regular graphs, and SM(m + d − 1) for a loyal subgraph of diameter d. Not modelled here"]]);

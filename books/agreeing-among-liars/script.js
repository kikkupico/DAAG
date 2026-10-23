"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,Polar,Space,redrawOn,Unfold}=BOOK;
const {isM,dual,vis,dtext,onReg}=REG;
BOOK.init();

/* the four bandits, told apart by colour; bandit 1 is the chief inside the ring wall */
const BC={1:"#a57fc0",2:"#9aa0a8",3:"#e8964d",4:"#b07a55"};
const ORD={H:"hold",S:"scatter"},OC={H:"#136f9e",S:"#bf4a26"},V={H:"0",S:"1"},GL=V;
const yesno=ok=>ok?"<span class='ok'>✓</span>":"<span class='bad'>✗</span>";
const chip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${BC[k]}"></i>${dual("Bandit "+k,"P"+k)}</span>`;
const word=w=>`<b style="color:${OC[w]}">${dual(ORD[w],V[w])}</b>`;
const mkBtn=(p,fn,cls="btn alt")=>{const b=document.createElement("button");b.className=cls;b.onclick=fn;p.appendChild(b);return b};

/* ===== the crown from above: the ring wall at the centre with the chief inside, three posts out on the slopes ===== */
function Crown(svg){
  const cx=235,cy=235,R=160,A={2:-90,3:30,4:150}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5,class:"i"},svg);
  el("circle",{cx,cy,r:112,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6",class:"i"},svg);
  el("circle",{cx,cy,r:56,fill:"#efe6cf",stroke:"#6b5a48","stroke-width":9,class:"i"},svg);
  el("text",{x:cx,y:cy-70,class:"lab halo i"},svg).textContent="ring wall";
  const sites=el("g",{},svg),over=el("g",{},svg);
  const H={svg,over,site:{},
    pos(k){if(k===1)return [cx,cy];const a=A[k]*Math.PI/180;return [cx+R*Math.cos(a),cy+R*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:12,fill,stroke:"#1c1512","stroke-width":2.5},g);dtext(g,{},glyph,GL[glyph]||glyph);return g},
    /* a rat u of the way from post a to post b; each direction keeps its own line */
    fly(g,a,b,u){const [x1,y1]=H.pos(a),[x2,y2]=H.pos(b),dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),bow=16*Math.sin(Math.PI*u);H.put(g,x1+dx*u-dy/L*bow,y1+dy*u+dx/L*bow)},
    state(k,i,m){const t=H.site[k].st;t[0].textContent=i;t[1].textContent=m===undefined?i:m},
    mark(k,on){H.site[k].g.classList.toggle("turn",on)}};
  for(const k of [1,2,3,4]){const [x,y]=H.pos(k),g=el("g",{class:"site"},sites);H.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:BC[k]},g);dtext(g,{},"B"+k,"P"+k);
    const a=(A[k]||0)*Math.PI/180,st=dtext(g,{class:"state halo",x:k===1?0:-48*Math.cos(a),y:k===1?80:-46*Math.sin(a)},"","");
    H.site[k]={g,st}}
  return H;
}
/* a slip drawn as an arc in the round, in the colour of what it says */
function slip(P,a,ta,b,tb,w,lab=true,at=.5){const p=P.slip(a,ta,b,tb,14);p.style.stroke=OC[w];p.setAttribute("marker-end",`url(#${P.svg.id}-${w==="S"?"r":"b"})`);
  if(lab){const pts=P.arc(a,ta,b,tb),q=pts[Math.round((pts.length-1)*at)];dtext(P.over,{class:"lab halo k",x:q[0],y:q[1]+4},ORD[w],V[w]).forEach(t=>t.style.fill=OC[w])}return p}
const dot=(P,k,t,fill="#fffaf0")=>{const g=P.event(k,t,fill,8);g.style.cursor="default";return g};

/* cover:start */
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · OM(1): TWO ROUNDS, THEN A MAJORITY","n = 3m + 1 = 4");
  const C=[260,100],L=[[100,238],[260,300],[420,238]],nm=["P2","P3","P4"],bad=1;
  /* the three-process impossibility, as an inset */
  const ix=446,iy=84;[[ix-18,iy+14],[ix+18,iy+14],[ix,iy-14]].forEach(([x,y],k)=>{node(g,x,y,5.5,null,{k:k===0?P.red:P.ink,f:k===0?P.redL:"#fff",sw:1.4})});
  el("path",{d:`M${ix-9} ${iy-9}l18 18m0 -18l-18 18`,stroke:P.red,"stroke-width":2.2,"stroke-linecap":"round",opacity:.85},g);
  T(g,ix,iy+36,"3 processes: impossible",{s:8.5,m:1,c:P.red});
  T(g,26,150,"ROUND 1",{a:"start",s:9.5,m:1,c:P.blue,w:600});
  /* round 1 */
  const p1=L.map(([x,y],k)=>{const p=link(g,C[0],C[1]+20,x,y-20,{c:"blue",w:1.8});const m=[C[0]+(x-C[0])*.34,C[1]+20+(y-40-C[1])*.34];chip(g,m[0],m[1],"1",{m:1,s:10,pad:9,k:P.blue,c:P.blue,w:600});return p});
  p1.forEach((p,k)=>packet(g,p,{c:"blue",dur:2.4,delay:k*.3}));
  /* round 2: every lieutenant relays what it heard */
  T(g,26,282,"ROUND 2",{a:"start",s:9.5,m:1,c:P.blue,w:600});
  const rel=(a,b,bend)=>{const A=L[a],B=L[b],liar=a===bad,v=liar?"0":"1",x1=A[0]+(B[0]>A[0]?19:-19),x2=B[0]+(B[0]>A[0]?-19:19),y1=A[1],y2=B[1];
    link(g,x1,y1,x2,y2,{c:liar?"red":"blue",w:1.3,bend,dash:liar?"4 3":null,op:.85});
    const m=mid(x1,y1,x2,y2,bend);chip(g,m[0],m[1],v,{m:1,s:9,pad:8,k:liar?P.red:P.blue,c:liar?P.red:P.blue,f:liar?P.redL:"#fff"})};
  rel(0,1,20);rel(1,0,20);rel(1,2,20);rel(2,1,20);rel(0,2,64);rel(2,0,64);
  L.forEach(([x,y],k)=>node(g,x,y,19,nm[k],{k:k===bad?P.red:P.ink,c:k===bad?P.red:P.ink,f:k===bad?P.redL:"#fff",halo:k===bad?P.redL:null,s:12}));
  node(g,C[0],C[1],21,"P1",{s:13,halo:P.blueL});
  chip(g,C[0]+34,C[1]-18,"commander · v = 1",{a:"start",m:1,s:9,k:P.blue,c:P.blue});
  chip(g,L[bad][0]+44,L[bad][1]+4,"traitor",{a:"start",m:1,s:9,k:P.red,c:P.red,f:P.redL});
  /* the tallies */
  [0,2].forEach(k=>{const [x,y]=L[k];
    link(g,x,y+22,x,y+74,{c:"mute",w:1,op:.5,head:false});
    vec(g,x,y+90,[1,0,1],{hi:[1],hf:P.redL,hc:P.red,w:24,h:24,s:12});
    T(g,x,y+112,"from P1 · P3 · "+(k===0?"P4":"P2"),{s:8.5,m:1,c:P.faint});
    link(g,x,y+120,x,y+142,{c:"green",w:1.6});
    chip(g,x,y+158,"majority → 1",{m:1,s:10,k:P.green,c:P.green,f:P.greenL,w:600})});
  vec(g,L[bad][0],L[0][1]+90,["?","?","?"],{w:24,h:24,s:12,k:P.line});T(g,L[bad][0],L[0][1]+112,"no need to decide",{s:8.5,m:1,c:P.faint});
  T(g,W/2,H-26,"honest lieutenants agree, and obey an honest commander",{s:10,m:1,c:P.mute});
};
COVERS.draw("#coversvg",COVER);COVERS.mount(COVER);
/* cover:end */

/* ===== the two conditions, tested on whatever is supposed ===== */
(function(){
  const H=Crown($("#condsvg")),ctl=$("#condctl"),gb=$("#condguards"),c1=$("#c1"),c2=$("#c2"),say=$("#condsay"),T=[1,2,3,4];
  let chief=1,liar=0,ord="H";const act={1:"H",2:"H",3:"H",4:"H"};
  const bC=mkBtn(ctl,()=>{chief=chief%4+1;paint()}),bL=mkBtn(ctl,()=>{liar=(liar+1)%5;paint()}),bO=mkBtn(ctl,()=>{ord=ord==="H"?"S":"H";paint()});
  const gbt={};T.forEach(k=>gbt[k]=mkBtn(gb,()=>{act[k]=act[k]==="H"?"S":"H";paint()}));
  function paint(){
    const guards=T.filter(k=>k!==chief),honest=guards.filter(k=>k!==liar),cl=liar===chief;
    bC.innerHTML=dual(`Whose account is going round: bandit ${chief}`,`Which process is the commander: P${chief}`);
    bL.innerHTML=liar?dual(`Suppose bandit ${liar} lies`,`Suppose P${liar} is faulty`):dual("Suppose nobody lies","Suppose no process is faulty");
    bO.innerHTML=cl?dual("The chief sends different orders to different guards","The commander sends different values to different lieutenants"):dual(`The chief sends: ${ORD[ord]}`,`The commander sends: ${V[ord]}`);bO.disabled=cl;
    T.forEach(k=>{const g=k!==chief;gbt[k].style.display=g?"":"none";gbt[k].disabled=k===liar;
      gbt[k].innerHTML=k===liar?dual(`Bandit ${k} may do anything`,`P${k} may do anything`):dual(`Bandit ${k} obeys: ${ORD[act[k]]}`,`P${k} obeys: ${V[act[k]]}`);
      H.mark(k,k===chief);H.state(k,k===chief?(cl?"chief, supposed liar":"chief"):k===liar?"supposed liar":ORD[act[k]],k===chief?(cl?"commander, faulty":"commander"):k===liar?"faulty":V[act[k]])});
    const same=new Set(honest.map(k=>act[k])).size<=1,obeyed=honest.every(k=>act[k]===ord);
    c1.innerHTML=dual(`<b>The first: every honest guard obeys the same order</b> ${yesno(same)}<br>${honest.map(k=>`bandit ${k} ${act[k]==="H"?"holds":"scatters"}`).join(", ")}`,`<b>IC1: every honest lieutenant obeys the same value</b> ${yesno(same)}<br>${honest.map(k=>`P${k} obeys ${V[act[k]]}`).join(", ")}`);
    c2.innerHTML=cl?dual(`<b>The second: an honest chief is obeyed</b><br>It promises nothing here, because the chief is the supposed liar.`,`<b>IC2: an honest commander is obeyed</b><br>It promises nothing here, because the commander is the faulty process.`):
      dual(`<b>The second: an honest chief is obeyed</b> ${yesno(obeyed)}<br>The chief sent ${ORD[ord]}.`,`<b>IC2: an honest commander is obeyed</b> ${yesno(obeyed)}<br>The commander sent ${V[ord]}.`);
    say.innerHTML=cl?dual("Suppose the chief lies. The second condition says nothing, while the first still stands: make the honest guards end together, whatever the chief sent.","Suppose the commander is faulty. The second condition says nothing, while the first still stands: make the honest lieutenants end together, whatever the commander sent."):
      same&&obeyed?dual("Both conditions hold. Now press a guard to change what they obey, or change who lies.","Both conditions hold. Now press a lieutenant to change what it obeys, or change which process is faulty."):
      !same?dual("<span class='bad'>Two honest guards obey different orders.</span> The first condition fails.","<span class='bad'>Two honest lieutenants obey different values.</span> The first condition fails."):
      dual("<span class='bad'>The honest guards agree with each other but not with the chief's order.</span> The second condition fails.","<span class='bad'>The honest lieutenants agree with each other but not with the commander's value.</span> The second condition fails.");
  }
  paint();
})();

/* ===== a round of rats: arrival, the knots, silence ===== */
(function(){
  const AUTO=-1;
  const H=Crown($("#ratsvg")),say=$("#ratsay"),box=$("#ratacc"),bs=["rat1","rat2","rat3"].map(i=>$("#"+i));
  /* computing: the round as a timeline, each message labelled with the value it carries, each round a band */
  const L=Unfold(H.svg,{nodes:{1:[-90,"B1",BC[1],"P1"],2:[150,"B2",BC[2],"P2"],3:[30,"B3",BC[3],"P3"],4:[90,"B4",BC[4],"P4"]},span:2.6,labels:true,vals:V});L.wrap(H);
  const all=[[1,2,"S"],[1,3,"S"],[1,4,"S"]];
  const SC=[
    {rounds:[all],say:dual("Every slip arrived as written, and the knots on each cord name the sender. Each guard now holds what the chief sent.","Every message arrived as written, and the channel names the sender. Each lieutenant now holds what the commander sent.")},
    {rounds:[[[1,2,"S"],[1,4,"S"]]],say:dual("The glass has run out. Nothing came to bandit 3 within the round, so nothing was sent, and the empty post counts as hold. Hold is only the definite answer, not the wiser one.","The round has ended. Nothing came to P3 within the round, so nothing was sent, and the missing message counts as 0. 0 is only the definite answer, not the wiser one.")},
    {rounds:[all,[[2,3,"S"],[2,4,"S"],[3,2,"H"],[3,4,"H"],[4,2,"S"],[4,3,"S"]]],say:dual("Suppose bandit 3 wrote hold, though the chief's slip to bandit 3 said scatter. The slip arrived as written, with bandit 3's knots on its cord. Bandits 2 and 4 hold a word they have no way to check.","Suppose P3 sent 0, though the commander's message to P3 said 1. The message arrived as written, over P3’s channel. P2 and P4 hold a value they have no way to check.")}];
  let toks=[],busy=false;
  const clear=()=>{L.reset();toks.forEach(g=>g.remove());toks=[];box.innerHTML="";[1,2,3,4].forEach(k=>H.state(k,""))};
  function accounts(S){box.innerHTML=[2,3,4].map(k=>{
    const lines=[S.rounds[0].some(r=>r[1]===k)?`<div class="e">${dual("from the chief","from the commander")}: ${word("S")}</div>`:`<div class="e">${dual("from the chief: nothing came within the round, so ","from the commander: nothing arrived within the round, so ")}${word("H")}</div>`];
    (S.rounds[1]||[]).filter(r=>r[1]===k).forEach(([a,,w])=>lines.push(`<div class="e">${dual(`from bandit ${a}: “the chief sent me ${ORD[w]}”`,`from P${a}: “the commander sent me ${V[w]}”`)}</div>`));
    return `<div>${chip(k)}${lines.join("")}</div>`}).join("")}
  async function run(i){
    if(busy)return;busy=true;bs.forEach(b=>b.disabled=true);clear();const S=SC[i];say.innerHTML=dual("The slips go out, and the glass runs.","The messages go out, and the round runs.");
    for(let r=0;r<S.rounds.length;r++){const ps=[],t0=L.clock.t;
      S.rounds[r].forEach(([a,b,w])=>{const g=H.token(BC[a],w);toks.push(g);H.fly(g,a,b,.12);g.setAttribute("opacity",1);
        ps.push(tween(1000,u=>H.fly(g,a,b,.12+.76*u)).then(()=>g.setAttribute("opacity",0)))});
      await Promise.all(ps);L.band(t0,L.clock.t+.05,"round "+(r+1));
      if(r<S.rounds.length-1){say.innerHTML=dual("Next, each guard writes what the chief sent them to the other two.","Next, each lieutenant sends the other two what the commander sent it.");L.tick(.25);await sleep(300)}}
    if(i===1)L.state(3,"nothing: 0");
    accounts(S);say.innerHTML=S.say;busy=false;bs.forEach(b=>b.disabled=false)}
  bs.forEach((b,i)=>b.onclick=()=>run(i));
  if(AUTO>=0)run(AUTO);
})();

/* ===== two nights that look the same from bandit 2's post ===== */
(function(){
  const AUTO=0;
  const NB={1:[-90,"B1",BC[1],"P1"],2:[150,"B2",BC[2],"P2"],3:[30,"B3",BC[3],"P3"]};
  const mk=svg=>Space(svg,{vb:"0 0 360 320",cx:180,cy:165,r0:30,step:25,rings:5,tEnd:4.8,nodes:NB});
  let PA=mk($("#worldA")),PB=mk($("#worldB"));
  /* what each night is: what the chief sent each guard, and what each guard told the other */
  const N={A:{send:{2:"H",3:"H"},tell:{"3>2":"S","2>3":"H"}},   // the chief is honest; bandit 3 lies to bandit 2
           B:{send:{2:"H",3:"S"},tell:{"3>2":"S","2>3":"H"}},   // the chief lies; both guards report truthfully
           C:{send:{2:"S",3:"S"},tell:{"3>2":"S","2>3":"H"}}};  // the mirror of A: the chief is honest; bandit 2 lies to bandit 3
  const ev=(n,k)=>k===2?[N[n].send[2],N[n].tell["3>2"]]:[N[n].send[3],N[n].tell["2>3"]];
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const text=(n,k)=>{const e=ev(n,k),o=k===2?3:2;return dual(`bandit ${k}: from the chief “${ORD[e[0]]}”, from bandit ${o} “the chief sent me ${ORD[e[1]]}”`,`P${k}: from the commander “${V[e[0]]}”, from P${o} “the commander sent me ${V[e[1]]}”`)};
  const say=$("#worldsay"),eA=$("#evA"),eB=$("#evB"),b=[1,2,3,4].map(i=>$("#wb"+i)),br=$("#wbr");
  function draw(P,n,stage){P.slips.innerHTML="";P.evs.innerHTML="";P.over.innerHTML="";
    if(stage>=1){[2,3].forEach(k=>slip(P,1,1.4,k,2.7,N[n].send[k]));dot(P,1,1.4,BC[1]);dot(P,2,2.7,BC[2]);dot(P,3,2.7,BC[3])}
    if(stage>=2){[[3,2],[2,3]].forEach(([a,c])=>slip(P,a,3.0,c,4.3,N[n].tell[a+">"+c],true,a===3?.3:.7));dot(P,2,4.3,BC[2]);dot(P,3,4.3,BC[3])}}
  const lock=s=>b.forEach((x,i)=>x.disabled=i!==s);
  function go(s){
    if(s===0){draw(PA,"A",1);draw(PB,"B",1);say.innerHTML=dual(`In the first night the chief sends ${word("H")} to both guards. In the second, ${word("H")} to bandit 2 and ${word("S")} to bandit 3.`,`In the first execution the commander sends ${word("H")} to both lieutenants. In the second, ${word("H")} to P2 and ${word("S")} to P3.`)}
    if(s===1){draw(PA,"A",2);draw(PB,"B",2);eA.innerHTML=text("A",2);eB.innerHTML=text("B",2);
      say.innerHTML=dual("Each guard tells the other what the chief sent them. Bandit 3 is the one who lies in the first night, and in the second tells the truth.","Each lieutenant tells the other what the commander sent it. P3 is the one that lies in the first execution, and in the second tells the truth.")}
    if(s===2){const eq=same(ev("A",2),ev("B",2));eA.classList.toggle("same",eq);eB.classList.toggle("same",eq);
      say.innerHTML=dual(`In the first night the chief is honest, so by the second condition bandit 2 must ${word("H")}. In the second night bandit 2 holds exactly the same two slips ${yesno(eq)} and cannot tell the nights apart, so ${word("H")}s there too.`,`In the first execution the commander is honest, so by the second condition P2 must decide ${word("H")}. In the second execution P2 receives exactly the same two messages ${yesno(eq)} and cannot tell the executions apart, so it decides ${word("H")} there too.`)}
    if(s===3){const eq=same(ev("B",3),ev("C",3));
      say.innerHTML=dual(`Run the same argument on bandit 3. In a third night, the mirror of the first, the chief is honest and sends ${word("S")} to both, and suppose bandit 2 lies. Bandit 3 would then have to ${word("S")}, and holds in that night exactly what bandit 3 holds in the second ${yesno(eq)}: from the chief “${ORD[ev("B",3)[0]]}”, from bandit 2 “the chief sent me ${ORD[ev("B",3)[1]]}”. So in the second night bandit 2 holds, bandit 3 scatters, and both are honest. <span class='bad'>The first condition fails.</span>`,`Run the same argument on P3. In a third execution, the mirror of the first, the commander is honest and sends ${word("S")} to both, and suppose P2 is faulty. P3 would then have to decide ${word("S")}, and receives in that execution exactly what P3 receives in the second ${yesno(eq)}: from the commander “${V[ev("B",3)[0]]}”, from P2 “the commander sent me ${V[ev("B",3)[1]]}”. So in the second execution P2 decides ${word("H")}, P3 decides ${word("S")}, and both are honest. <span class='bad'>The first condition fails.</span>`)}
    lock(s+1);}
  let s=0;
  b.forEach((x,i)=>x.onclick=()=>{if(i===s)go(s++)});
  function reset(){PA=mk($("#worldA"));PB=mk($("#worldB"));eA.innerHTML=eB.innerHTML=dual("bandit 2 holds: nothing yet","P2 holds: nothing yet");eA.classList.remove("same");eB.classList.remove("same");s=0;lock(0);say.textContent="Press the buttons in turn."}
  br.onclick=reset;reset();for(let i=0;i<AUTO;i++)go(s++);
  /* in the other register the two nights are drawn again as far as the reader has gone */
  redrawOn(()=>{PA=mk($("#worldA"));PB=mk($("#worldB"));const st=s>=2?2:s;if(st){draw(PA,"A",st);draw(PB,"B",st)}});
})();

/* ===== the price of a liar ===== */
(function(){
  const nm=$("#pm"),nn=$("#pn"),nr=$("#pr"),say=$("#pricesay"),up=$("#pup"),dn=$("#pdown");let m=1;
  function paint(){
    nm.textContent=m;nn.textContent=3*m+1;nr.textContent=m+1;up.disabled=m>=6;dn.disabled=m<=1;
    const plain=4>3*m;
    say.innerHTML=dual(`With plain slips the crown's four men ${plain?"are enough":"are too few"} ${yesno(plain)}, since it takes more than ${3*m} men.`,`With plain messages the system's four processes ${plain?"are enough":"are too few"} ${yesno(plain)}, since it takes more than ${3*m} processes.`)}
  up.onclick=()=>{m++;paint()};dn.onclick=()=>{m--;paint()};paint();
})();

/* ===== scrollytelling: the Repeating, twice ===== */
(function(){
  const STEP=null;
  const svg=$("#repsvg"),side=$("#repside");
  const NB={1:[-90,"B1",BC[1],"P1"],2:[0,"B2",BC[2],"P2"],3:[90,"B3",BC[3],"P3"],4:[180,"B4",BC[4],"P4"]};
  /* two nights, one liar in each: a supposed guard with an honest chief, then the chief with three honest guards */
  const SC={honest:{liar:3,r1:{2:"S",3:"S",4:"S"},tell:a=>a===3?"H":"S"},
            lying:{liar:1,r1:{2:"S",3:"H",4:"S"},tell:a=>SC.lying.r1[a]}};
  const maj=l=>l.filter(x=>x==="S").length*2>l.length?"S":"H";   // two values only, and three accounts: one has most
  const accounts=(S,k)=>[S.r1[k],...[2,3,4].filter(j=>j!==k).map(j=>S.tell(j,k))];
  /* per step: night, rounds drawn, count shown */
  const ST=[null,["honest",1,0],["honest",2,0],["honest",2,1],["lying",1,0],["lying",2,0],["lying",2,1]];
  const card=(k,S,rounds,count)=>{
    if(!S)return `<div class="hc"><h5>${chip(k)}</h5><div class="chk">${dual("Nothing sent yet.","Nothing sent yet.")}</div></div>`;
    const isL=k===S.liar,acc=accounts(S,k),w=maj(acc);
    const lines=[rounds>=1?`${dual("from the chief","from the commander")}: ${word(acc[0])}`:"",
      ...(rounds>=2?[2,3,4].filter(j=>j!==k).map((j,n)=>`${dual("from bandit "+j,"from P"+j)}: ${word(acc[n+1])}`):[])].filter(Boolean);
    return `<div class="hc${count&&!isL?" in":""}"><h5>${chip(k)}<span>${count&&!isL?dual("obeys "+ORD[w],"obeys "+V[w]):isL?dual("supposed liar","faulty"):""}</span></h5><div class="chk">${isL&&k!==1?dual("Its word is not counted.","Its value is not counted."):lines.join("<br>")}</div></div>`};
  let cur=0;
  function render(i){
    cur=i;const P=Space(svg,{vb:"0 0 440 440",cx:220,cy:220,r0:34,step:28,rings:6,tEnd:5.4,nodes:NB,note:[12,430]}),s=ST[i];
    [["hold","H",20],["scatter","S",40]].forEach(([t,w,y])=>dtext(P.over,{class:"lab k",x:12,y},"■ "+t,"■ "+V[w]).forEach(e=>{e.style.textAnchor="start";e.style.fontSize="18px";e.style.fill=OC[w]}));
    if(s){const S=SC[s[0]],rounds=s[1],count=s[2];dot(P,1,1.4,BC[1]);
      if(rounds>=1)[2,3,4].forEach(k=>{slip(P,1,1.4,k,2.6,S.r1[k],false);dot(P,k,2.6,BC[k])});
      if(rounds>=2)[2,3,4].forEach(a=>[2,3,4].filter(b=>b!==a).forEach(b=>slip(P,a,2.9,b,4.1,S.tell(a,b),false)));
      if(rounds>=2)[2,3,4].forEach(k=>dot(P,k,4.1,BC[k]));
      if(count)[2,3,4].filter(k=>k!==S.liar).forEach(k=>{const [x,y]=P.pt(k,4.1),w=maj(accounts(S,k)),a=(P.lanes?0:NB[k][0])*Math.PI/180,
        t=dtext(P.over,{class:"lab halo k",x:x+Math.cos(a)*40,y:y+Math.sin(a)*26+4},ORD[w],V[w]);t.forEach(e=>{e.style.fill=OC[w];e.style.fontSize="18px"})})}
    side.innerHTML=[2,3,4].map(k=>card(k,s&&SC[s[0]],s?s[1]:0,s?s[2]:0)).join("");
  }
  scrolly($("#rep"),i=>render(i));redrawOn(()=>render(cur));
  if(STEP!==null)render(STEP);
})();

/* ===== seals: relay by the rule, and read the sheaves ===== */
(function(){
  const AUTO=null;
  const NB={1:[-90,"B1",BC[1],"P1"],2:[0,"B2",BC[2],"P2"],3:[90,"B3",BC[3],"P3"],4:[180,"B4",BC[4],"P4"]};
  const svg=$("#sealsvg"),ctl=$("#sealctl"),tab=$("#sealtab"),k1=$("#k1"),k2=$("#k2"),say=$("#sealsay");
  const liars=new Set([1]);let split=0;
  const SP=[{t:dual("hold to bandit 2, scatter to bandits 3 and 4","0 to P2, 1 to P3 and P4"),o:{2:"H",3:"S",4:"S"}},
            {t:dual("hold to bandits 2 and 3, scatter to bandit 4","0 to P2 and P3, 1 to P4"),o:{2:"H",3:"H",4:"S"}},
            {t:dual("hold to bandit 2 only, nothing to the others","0 to P2 only, nothing to the others"),o:{2:"H"}}];
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
    [1,2,3,4].forEach(k=>{bl[k].setAttribute("aria-pressed",liars.has(k));bl[k].innerHTML=dual(`${liars.has(k)?"Supposing":"Suppose"} bandit ${k} lies`,`${liars.has(k)?"Supposing":"Suppose"} P${k} is faulty`)});
    bs.style.display=cl?"":"none";bs.innerHTML=dual("The chief seals: ","The commander signs: ")+SP[split].t;
    const P=Space(svg,{vb:"0 0 440 440",cx:220,cy:220,r0:34,step:28,rings:6,tEnd:6,nodes:NB});
    dot(P,1,1.4,BC[1]);slips.forEach(s=>{const t0=1.4+1.5*(s.r-1);slip(P,s.from,t0,s.to,t0+1.2,s.w,false);dot(P,s.to,t0+1.2,BC[s.to])});
    const ans={};honest.forEach(k=>ans[k]=rule(sheaf[k]));
    tab.innerHTML=guards.map(k=>{
      if(liars.has(k))return `<div>${chip(k)} ${dual("supposed liar: passes nothing on","faulty: passes nothing on")}</div>`;
      const items=[...sheaf[k].entries()].map(([w,s])=>`<span class="term" style="color:${OC[w]}">${dual(ORD[w],V[w])} : ${s.join(" : ")}</span>`);
      return `<div>${chip(k)} ${dual("sheaf","set")}: ${items.join(" · ")||"empty"} → obeys ${word(ans[k])}</div>`}).join("");
    const same=new Set(Object.values(ans)).size<=1,obeys=honest.every(k=>ans[k]==="S");
    k1.innerHTML=dual(`<b>The first: every honest guard obeys the same order</b> ${yesno(same)}<br>${honest.length<2?"Fewer than two honest guards remain, so agreement among them means little.":"Honest guards: "+honest.map(k=>"bandit "+k).join(", ")+"."}`,`<b>IC1: every honest lieutenant obeys the same value</b> ${yesno(same)}<br>${honest.length<2?"Fewer than two honest lieutenants remain, so agreement among them means little.":"Honest lieutenants: "+honest.map(k=>"P"+k).join(", ")+"."}`);
    k2.innerHTML=cl?dual(`<b>The second: an honest chief is obeyed</b><br>It promises nothing here, because the chief is a supposed liar.`,`<b>IC2: an honest commander is obeyed</b><br>It promises nothing here, because the commander is faulty.`):dual(`<b>The second: an honest chief is obeyed</b> ${yesno(obeys)}<br>The chief sealed scatter.`,`<b>IC2: an honest commander is obeyed</b> ${yesno(obeys)}<br>The commander signed 1.`);
    const two=honest.some(k=>sheaf[k].size>1);
    say.innerHTML=dual(`The party is built to bear <b>${m}</b> ${m===1?"liar":"liars"}, so a guard passes a slip on while fewer than ${m} ${m===1?"guard's seal stands":"guards' seals stand"} on it. ${two?"A sheaf now holds two orders under the chief's seal, which an honest chief would never have sealed: <b>the chief has convicted themselves</b>, of lying and of nothing else. ":""}${cl&&!two&&honest.length?"The chief sealed only one order that reached an honest guard, so nothing marks the chief. ":""}`,`The system is built to bear <b>${m}</b> ${m===1?"traitor":"traitors"}, so a lieutenant passes a message on while fewer than ${m} ${m===1?"lieutenant's signature stands":"lieutenants' signatures stand"} on it. ${two?"A set now holds two values under the commander's signature, which an honest commander would never have signed: <b>the commander has convicted itself</b>, of lying and of nothing else. ":""}${cl&&!two&&honest.length?"The commander signed only one value that reached an honest lieutenant, so nothing marks the commander. ":""}`);
  }
  paint();redrawOn(paint);
  if(AUTO)AUTO();
})();

REG.start();
})();

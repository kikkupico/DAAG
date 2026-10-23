"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,mapPairs,Polar,Timeline,Unfold}=BOOK;
const {isM,dual,vis,dtext,onReg}=REG;
BOOK.init();


/* the four mercenaries, told apart by colour */
const TC={1:"#e0b84a",2:"#6583d6",3:"#c45448",4:"#9cb648"};
const HOLD="#136f9e",ATT="#bf4a26",PC={hold:HOLD,attack:ATT},PL={hold:"H",attack:"A"};
const GL={H:"0",A:"1"},V={hold:"0",attack:"1"};   /* the plan, hold or attack in the allegory; the value 0 or 1 in computing */
const pv=x=>dual(x,V[x]);
const Dk=k=>dual("Tent "+k,"P"+k);
/* an event's label, one per register */
const evLabel=(e,i,m)=>{e.label.remove();dtext(e,{},i,m).forEach(x=>x.style.fill="#fffaf0")};
const yesno=ok=>ok?"<span class='ok'>✓</span>":"<span class='bad'>✗</span>";
const dash="<span class='dash'>—</span>";
const tentChip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${TC[k]}"></i>${dual("Tent "+k,"P"+k)}</span>`;

/* ===== the hill, seen from above: one picture reused wherever ravens fly between the tents ===== */
function Hill(svg){
  const cx=235,cy=235,R=158,A={1:-90,2:0,3:90,4:180}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:96,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("circle",{cx,cy,r:24,fill:"#efe6cf",stroke:"#6b5a48","stroke-width":6},svg);
  el("text",{x:cx,y:cy+52,class:"lab i"},svg).textContent="the crown";
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const H={svg,cx,cy,R,A,under,over,tent:{},
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:12,fill,stroke:"#1c1512","stroke-width":2.5},g);dtext(g,{},glyph,GL[glyph]||glyph);return g},
    /* a raven u of the way from tent a to tent b, flying round the hill; each direction keeps its own line */
    fly(g,a,b,u){const d=((A[b]-A[a]+540)%360)-180;H.put(g,...H.at(A[a]+d*u,R-(d>0?24:46)*Math.sin(Math.PI*u)))},
    state(k,i,m){const t=H.tent[k].st;t[0].textContent=i;t[1].textContent=i&&(m||i)},
    badge(k,s){const b=H.tent[k].badge;b.setAttribute("opacity",s?1:0);b.t[0].textContent=s||"";b.t[1].textContent=GL[s]||s||""}
  };
  for(const k of [1,2,3,4]){const a=A[k]*Math.PI/180,[x,y]=H.at(A[k]),g=el("g",{class:"site"},sites);H.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:TC[k]},g);dtext(g,{},"T"+k,"P"+k);
    const st=dtext(g,{class:"state halo",x:-48*Math.cos(a),y:-46*Math.sin(a)},"","");
    const badge=el("g",{class:"badge",opacity:0,transform:`translate(${(38*Math.cos(a)).toFixed(1)} ${(34*Math.sin(a)).toFixed(1)})`},g);el("circle",{r:11},badge);badge.t=dtext(badge,{},"","");
    H.tent[k]={x,y,g,st,badge}}
  return H;
}
/* hawks, and the fold they keep */
/* a hill picture with its computing twin, a timeline that grows as the reader acts (Unfold in book.js) */
const twin=(H,o)=>{Unfold(H.svg,Object.assign({nodes:{1:[-90,"T1",TC[1],"P1"],2:[0,"T2",TC[2],"P2"],3:[90,"T3",TC[3],"P3"],4:[180,"T4",TC[4],"P4"]}},o)).wrap(H);return H};
function hawkShape(parent,x,y,s){const g=el("g",{transform:`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s||1})`},parent);
  el("path",{d:"M-13,-2 Q-6,-12 0,-1 Q6,-12 13,-2 Q6,-5 0,3 Q-6,-5 -13,-2z",fill:"#5a4632",stroke:"#1c1512","stroke-width":1.5,"stroke-linejoin":"round",class:"i"},g);
  el("path",{d:"M-9,-9 L9,9 M-9,9 L9,-9",stroke:ATT,"stroke-width":4,fill:"none","stroke-linecap":"round",class:"m"},g);return g}
function hawkFold(H,k){const t=H.tent[k],g=el("g",{class:"hawkset",opacity:0},H.under);
  let dx=t.x-H.cx,dy=t.y-H.cy;const n=Math.hypot(dx,dy);dx/=n;dy/=n;const px=-dy,py=dx;
  el("circle",{cx:t.x,cy:t.y,r:42,fill:"none",stroke:ATT,"stroke-width":3,"stroke-dasharray":"6 5"},g);
  hawkShape(g,t.x+dx*62+px*22,t.y+dy*62+py*22,1.1);hawkShape(g,t.x+dx*62-px*22,t.y+dy*62-py*22,1.1);
  return {show(on){g.setAttribute("opacity",on?1:0);if(H.lanes)H.lanes.cut(k,on)}}}
function whereIs(g){const m=/translate\(([-\d.]+) ([-\d.]+)\)/.exec(g.getAttribute("transform"));return [+m[1],+m[2]]}
function takeBird(H,g){const [x,y]=whereIs(g);if(H.lanes)H.lanes.lose(g);g.remove();const h=hawkShape(H.over,x,y,1.2);h.classList.add("puff");setTimeout(()=>h.remove(),1700)}
/* a raven from tent a to tent b: it lands, or a hawk takes it on the way */
async function trip(H,a,b,lost){const g=H.token(TC[a],"");g.setAttribute("opacity",1);H.fly(g,a,b,.12);
  await tween(1100,u=>H.fly(g,a,b,.12+(lost?.34:.76)*u));if(lost)takeBird(H,g);else{await sleep(120);g.remove()}}

/* what a man at tent 4 can go on: his note, the birds that reached him, how long he waited */
const view4=(birds,askAt)=>({note:"hold",birds:birds.filter(b=>b.to===4&&!b.lost).map(b=>b.plan),askAt});
const answer4=v=>v.birds.length?v.birds[v.birds.length-1]:v.note;
/* what a single record says: the last move finished before the question began, else hold */
const record=(moves,askAt)=>{const done=moves.filter(m=>m.end<askAt).sort((a,b)=>a.end-b.end);return done.length?done[done.length-1].plan:"hold"};

/* cover:start */
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · A WRITE ON ONE SIDE, A READ ON THE OTHER","C · A · P");
  const N={1:[150,150],2:[88,262],3:[212,276],4:[420,214]},val={1:1,2:1,3:1,4:0};
  /* the partition */
  el("path",{d:"M300 70l-14 34l28 34l-28 34l28 34l-28 34l28 34l-28 34l28 34l-14 30",fill:"none",stroke:P.red,"stroke-width":2.4,"stroke-linejoin":"round","stroke-dasharray":"2 0",opacity:.85},g);
  el("rect",{x:300,y:60,width:220,height:390,fill:P.redL,opacity:.18},g);
  chip(g,300,64,"network partition",{m:1,s:9.5,k:P.red,c:P.red,f:P.redL});
  /* messages inside the left island */
  [[2,1],[2,3],[1,3],[3,1]].forEach(([a,b],k)=>{const A=N[a],B=N[b],d=Math.hypot(B[0]-A[0],B[1]-A[1]),u=[(B[0]-A[0])/d,(B[1]-A[1])/d];
    const p=link(g,A[0]+u[0]*24,A[1]+u[1]*24,B[0]-u[0]*26,B[1]-u[1]*26,{c:"blue",w:1.5,bend:k===3?14:k===2?-14:0});packet(g,p,{c:"blue",dur:2.2+k*.3,delay:k*.4})});
  /* the update that cannot cross */
  const x0=N[2][0]+24,y0=N[2][1]-8,xe=294,ye=N[2][1]-8+(N[4][1]-N[2][1])*(294-x0)/(N[4][0]-x0)*1;
  const pc=link(g,x0,y0,xe,ye,{c:"red",w:1.5,dash:"5 3",head:false});packet(g,pc,{c:"red",dur:2.6,delay:.2,r:3.4});
  el("path",{d:`M${xe-6} ${ye-6}l12 12m0 -12l-12 12`,stroke:P.red,"stroke-width":2.6,"stroke-linecap":"round"},g);
  link(g,xe+14,ye+4,N[4][0]-26,N[4][1]-4,{c:"red",w:1,dash:"2 5",head:false,op:.5});
  chip(g,xe-8,ye-30,"update(1) lost",{a:"end",m:1,s:8.5,k:P.line,c:P.red});
  /* nodes with their copies */
  for(const k in N){const [x,y]=N[k],c=k==4?"gold":"blue";
    node(g,x,y,22,"P"+k,{s:12,halo:P[c+"L"],k:P.ink});
    chip(g,x+(k==4?0:0),y+36,"value = "+val[k],{m:1,s:8.5,pad:8,k:val[k]?P.blue:P.red,c:val[k]?P.blue:P.red,f:val[k]?P.blueL:P.redL})}
  /* the clients */
  chip(g,88,336,"client · write(1) → ok ✓",{a:"start",m:1,s:9,k:P.blue,c:P.blue});
  link(g,100,328,92,288,{c:"blue",w:1,dash:"3 3",head:false});
  chip(g,N[4][0]+8,284,"client · read() → 0 ✗",{m:1,s:9,k:P.red,c:P.red,f:P.redL,w:600});
  link(g,N[4][0],270,N[4][0],244,{c:"red",w:1,dash:"3 3",head:false});
  T(g,318,330,"answers anyway → stale",{s:9.5,m:1,c:P.red,a:"start"});
  T(g,318,348,"or refuses → unavailable",{s:9.5,m:1,c:P.mute,a:"start"});
  /* the triangle */
  const tx=140,ty=392,tri=[[tx,ty-4,"P"],[tx-62,ty+60,"C"],[tx+62,ty+60,"A"]];
  tri.forEach(([x1,y1],i)=>{const [x2,y2]=tri[(i+1)%3];link(g,x1,y1,x2,y2,{c:"mute",w:1.4,head:false,op:.5})});
  tri.forEach(([x,y,t],i)=>node(g,x,y,13,t,{s:11,k:i===0?P.red:P.ink,c:i===0?P.red:P.ink,f:i===0?P.redL:"#fff"}));
  T(g,tx,ty+90,"pick any two, but P is not optional",{s:9,m:1,c:P.faint});
  chip(g,W-26,ty+24,"every request answered",{a:"end",m:1,s:9,k:P.line,c:P.mute});chip(g,W-26,ty+52,"every read sees the latest write",{a:"end",m:1,s:9,k:P.line,c:P.mute});
};
COVERS.draw("#coversvg",COVER);COVERS.mount(COVER);
/* cover:end */

/* ===== ravens and hawks ===== */
(function(){
  const H=twin(Hill($("#birdsvg")),{span:6,slide:true}),hk=hawkFold(H,4),say=$("#bsay"),stand=$("#bstand"),bs=[["#bs21",2,1],["#bs24",2,4],["#bs43",4,3]].map(([s,a,b])=>({b:$(s),a,to:b})),bh=$("#bhawk"),bf=$("#bflight");
  let hawks=false,pend=null,busy=false;
  const paint=()=>{stand.innerHTML=`<div>${dual("Hawks in the fold of tent 4:","P4 cut off:")} <b>${hawks?"yes":"no"}</b></div><div>${pend?(pend.known?dual(`Number ${pend.to} knows the raven from tent ${pend.a} was lost, and not what it carried.`,`P${pend.to} knows the message from P${pend.a} was lost, and not what it carried.`):dual(`Number ${pend.to} is waiting on a raven from tent ${pend.a}.`,`P${pend.to} is waiting on a message from P${pend.a}.`)):dual("No man is waiting on a bird.","No node is waiting on a message.")}</div>`;
    bf.disabled=busy||!pend||pend.known;bs.forEach(x=>x.b.disabled=busy);bh.disabled=busy};
  bs.forEach(x=>x.b.onclick=async()=>{const lost=hawks&&(x.a===4||x.to===4);busy=true;pend=null;paint();
    say.innerHTML=dual(`A raven leaves tent ${x.a} for tent ${x.to}.`,`A message leaves P${x.a} for P${x.to}.`);await trip(H,x.a,x.to,lost);busy=false;
    if(lost){pend={a:x.a,to:x.to,known:false};say.innerHTML=dual(`No bird has come. No man at the foot saw it go, and Number ${x.to} cannot yet say whether it is lost or only slow.`,`No message has arrived. Nobody saw it dropped, and P${x.to} cannot yet say whether it is lost or only slow.`)}
    else say.innerHTML=dual(`The raven lands at tent ${x.to}, within a flight.`,`The message arrives at P${x.to}, within a delivery time.`);paint()});
  bf.onclick=()=>{pend.known=true;H.lanes.tick(1.1);say.innerHTML=dual(`<b>A whole flight has passed</b> and the raven from tent ${pend.a} has not come. A slow bird would have come by now, so Number ${pend.to} can say it was lost. Nothing says what it carried.`,`<b>A whole delivery time has passed</b> and the message from P${pend.a} has not arrived. A slow message would have arrived by now, so P${pend.to} can say it was lost. Nothing says what it carried.`);paint()};
  bh.onclick=()=>{hawks=!hawks;hk.show(hawks);bh.innerHTML=dual(hawks?"Hawks leave tent 4's fold":"Hawks come to tent 4's fold",hawks?"Restore the network":"Cut P4 off");
    say.innerHTML=hawks?dual("Hawks keep to the fold of tent 4. Every bird between tent 4 and the other three is lost for as long as they stay: tent 4 is cut off.","P4 is cut off. Every message between P4 and the other three is lost for as long as the failure lasts."):dual("The hawks have gone, and birds fly freely again.","The network is restored, and messages flow freely again.");paint()};
  paint();
})();

/* ===== two ways to answer badly ===== */
(function(){
  const H=twin(Hill($("#owesvg")),{span:4}),hk=hawkFold(H,3),say=$("#owesay"),D=[$("#ow1"),$("#ow2")],b1=$("#owehold"),b2=$("#owewait"),br=$("#owereset");
  const moves=[{by:2,plan:"attack",end:1}],askAt=2,right=record(moves,askAt);
  const nm=[dual("Answering as one","Acting as one copy"),dual("Every man is answered","Every request is answered")];
  const show=(given,why)=>{const one=given==null?null:given===right,ev=given!=null;
    D[0].innerHTML=`<b>${nm[0]}</b> ${one==null?dash:yesno(one)}<br>${why[0]}`;D[1].innerHTML=`<b>${nm[1]}</b> ${yesno(ev)}<br>${why[1]}`};
  function reset(){H.lanes.reset();H.state(2,"attack","1");H.state(3,"note: hold","copy: 0");hk.show(false);D.forEach((d,i)=>d.innerHTML=`<b>${nm[i]}</b>`);
    say.innerHTML=dual("Number 3 asks which plan stands. How might tent 3 answer?","A client reads at P3. How might P3 answer?");b1.disabled=b2.disabled=false}
  b1.onclick=()=>{b1.disabled=b2.disabled=true;H.lanes.setT(1.4);H.state(3,"says hold","answers 0");
    show("hold",[dual(`A single record says ${right}, because Number 2's move was finished before the question began.`,`A single object would return ${V[right]}, because the write was finished before the read began.`),dual("Number 3 is answered at once.","The client at P3 is answered at once.")]);
    say.innerHTML=dual("A tent that says <b>hold</b> to every question has answered, but wrongly whenever attack stands.","A node that answers <b>0</b> to every read has answered, but wrongly whenever 1 stands.")};
  b2.onclick=()=>{b1.disabled=b2.disabled=true;H.lanes.setT(1);H.state(3,"waits","waiting");hk.show(true);H.lanes.tick(2.6);
    show(null,[dual("Nothing is said, so nothing is wrong.","Nothing is said, so nothing is wrong."),dual("Waiting is not an answer: the hawks may stay all night.","Waiting is not an answer: the failure may last forever.")]);
    say.innerHTML=dual("<b>Wait until the hawks leave</b> is not an answer, since the hawks may stay all night.","<b>Wait until the network recovers</b> is not an answer, since the failure may last forever.")};
  br.onclick=reset;reset();
})();

/* ===== scrolly: two nights, and a man who cannot tell them apart ===== */
(function(){
  const svg=$("#cutsvg"),side=$("#cutside");
  let P,gA,gB,gC,cur=0;
  const grp=()=>el("g",{class:"fade"},P.over);
  const dot=(g,k,t,plan)=>{const e=P.event(k,t,plan?PC[plan]:"#1c1512",plan?12:6);if(plan)evLabel(e,PL[plan],V[plan]);e.style.cursor="default";g.appendChild(e);return e};
  const lostArc=(g,a,ta,b,tb,frac)=>{const pts=P.arc(a,ta,b,tb),n=Math.round((pts.length-1)*frac),q=pts.slice(0,n+1);
    g.appendChild(el("path",{d:"M"+q.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L"),fill:"none",stroke:ATT,"stroke-width":2.6,"stroke-dasharray":"6 4"}));
    hawkShape(g,...q[q.length-1],.9)};
  /* the nights, as data */
  const T=1.2,mv1=1.4,askAt=mv1+T+1.6,ansAt=askAt+1;
  const night1={moves:[{by:2,plan:"attack",begin:mv1,end:mv1+T}],birds:[{from:2,to:4,sent:mv1,lost:true,plan:"attack"}]};
  const night2={moves:[],birds:[]};
  const ans=answer4(view4(night1.birds,askAt));
  const mk=(h,r,c)=>`<div class="hc"><h5>${h}</h5><div class="rc">${r}</div><div class="chk">${c||""}</div></div>`;
  const same=JSON.stringify(view4(night1.birds,askAt))===JSON.stringify(view4(night2.birds,askAt));
  const rec1=record(night1.moves.map(m=>({plan:m.plan,end:m.end})),askAt),rec2=record(night2.moves,askAt);
  const one=dual("A single record","A single object"),a2=answer4(view4(night2.birds,askAt));
  const cards=[
    [mk(Dk(2),dual("note: hold","copy: 0")),mk(Dk(4),dual("note: hold<br>cut off","copy: 0<br>cut off")),mk(one,pv("hold"))],
    [mk(Dk(2),dual("moves the plan to attack<br>told it stands","writes 1<br>told it took effect")),mk(Dk(4),"nothing has come in"),mk(one,dual("hold, then attack","0, then 1"))],
    [mk(Dk(2),"nothing happens"),mk(Dk(4),dual(`asks<br>note hold, no bird, glass run<br>answers <b>${a2}</b>`,`reads<br>copy 0, no message, timer run<br>answers <b>${V[a2]}</b>`)),mk(one,`${pv(rec2)}: ${yesno(a2===rec2)}`)],
    [mk(Dk(2),dual("moves the plan to attack<br>told it stands","writes 1<br>told it took effect")),mk(Dk(4),dual(`inputs the same as the second night: ${same?"yes":"no"}`,`inputs the same as the second execution: ${same?"yes":"no"}`)),mk(one,pv("attack"))],
    [mk(Dk(2),dual("moved the plan to attack","wrote 1")),mk(Dk(4),`${dual("answers","answers")} <b>${pv(ans)}</b>`),mk(one,`${pv(rec1)} ${yesno(ans===rec1)}`)]];
  const show=[[0,0,1],[1,0,1],[0,1,1],[1,1,1],[1,1,1]];
  const apply=s=>{cur=s;
    [gA,gB,gC].forEach((g,i)=>g.classList.toggle("on",!!show[s][i]&&!(i===2&&s===0&&false)));
    gC.classList.add("on");
    side.innerHTML=cards[s].join("");
    $$(".st-ev",gB).forEach(e=>e.classList.toggle("mark",s===4));
  };
  /* drawn in the round, or on lanes in computing, at the step the reader has reached */
  Timeline(svg,{vb:"0 0 520 480",cx:260,cy:240,r0:40,step:27,rings:7,tEnd:7.4,note:[10,20],nodes:{1:[225,"T1",TC[1],"P1"],2:[135,"T2",TC[2],"P2"],3:[315,"T3",TC[3],"P3"],4:[45,"T4",TC[4],"P4"]}},Q=>{P=Q;
  gA=grp();gB=grp();gC=grp();
  /* night one among the three */
  P.seg(2,mv1,mv1+T).classList.add("hi");gA.appendChild(P.under.lastChild);
  dot(gA,2,mv1);lostArc(gA,2,mv1,4,mv1+1.6,.55);dot(gA,2,mv1+T,"attack");
  /* night two at tent 4 */
  P.seg(4,askAt,ansAt).classList.add("hi");gB.appendChild(P.under.lastChild);
  dot(gB,4,askAt);dot(gB,4,ansAt,ans);
  /* tent 4, cut off */
  const [cx4,cy4]=P.pt(4,0);hawkShape(gC,cx4+30,cy4+30,1);hawkShape(gC,cx4+44,cy4-12,1);
    apply(cur);
  });
  scrolly($("#cut"),apply);
  if(!same||ans===rec1)throw new Error("the two nights must look alike to tent 4 and the answer must break answering as one");
})();

/* ===== the muster-master's arrangement: any two ===== */
(function(){
  const H=twin(Hill($("#keepsvg")),{span:5.6}),hk=hawkFold(H,4),say=$("#keepsay"),D=[1,2,3].map(i=>$("#kd"+i)),bt=["#kp1","#kp2","#kp3"].map(s=>$(s));
  H.state(1,"muster-master","primary");
  const names=[dual("Answering as one","Acting as one copy"),dual("Every man is answered","Every request is answered"),dual("Carrying on while birds can be lost","Carrying on while messages can be lost")];
  const right=record([{plan:"attack",end:1}],2);
  function line(i,v,why){D[i].innerHTML=`<b>${names[i]}</b> ${v==null?dash:yesno(v)}<br>${why}`}
  async function run(kind){bt.forEach(b=>b.disabled=true);H.lanes.reset();H.lanes.state(1,"muster-master","primary");const hawks=kind!=="muster-master-clear";hk.show(hawks);
    [2,3,4].forEach(k=>H.state(k,""));D.forEach((d,i)=>d.innerHTML=`<b>${names[i]}</b>`);
    let ans;
    say.innerHTML=dual("Number 2 moves the plan to attack.","A client writes 1 at P2.");
    if(kind==="own"){H.lanes.tick(.9);H.state(2,"told: stands","write acked");await sleep(900)}
    else{await trip(H,2,1,false);await trip(H,1,2,false);H.state(2,"told: stands","write acked")}
    say.innerHTML=dual("Later, Number 4 asks which plan stands.","Later, a client reads at P4.");
    if(kind==="own"){ans="hold";H.lanes.tick(.7);await sleep(700);H.state(4,"says hold","answers 0")}
    else if(kind==="muster-master-clear"){await trip(H,4,1,false);await trip(H,1,4,false);ans="attack";H.state(4,"told: attack","answers 1")}
    else{await trip(H,4,1,true);ans=null;H.state(4,"no answer")}
    const one=ans==null?true:ans===right,every=ans!=null;
    line(0,one,ans==null?dual("Every answer that is given is right.","Every answer that is given is right."):one?dual("Number 4 hears attack, which is what a single record says.","The client at P4 reads 1, which is what a single object returns."):dual(`Number 4 says ${ans}, though Number 2's move was finished before they asked. A single record says ${right}.`,`P4 answers ${V[ans]}, though the write was finished before the read began. A single object returns ${V[right]}.`));
    line(1,every,every?(kind==="own"?dual("Number 4 is answered at once, from their own note.","The client at P4 is answered at once, from P4's own copy."):dual("Both men are answered.","Both clients are answered.")):dual("Number 4 is alive and well and is not answered.","P4 is up and well and its client is not answered."));
    line(2,hawks?true:null,hawks?(kind==="own"?dual("Nobody waits for a bird.","Nobody waits for a message."):dual("Tent 4 is cut off, and nothing the four say is wrong.","P4 is cut off, and nothing the four say is wrong.")):dual("No bird is lost tonight, so this night does not test it.","No message is lost in this execution, so it does not test this."));
    say.innerHTML=kind==="muster-master-clear"?dual("With no hawks, the muster-master's arrangement gives <b>answering as one</b> and an answer for every man.","With no failure, the primary-copy protocol gives <b>consistency</b> and an answer for every request."):kind==="muster-master"?dual("With tent 4 cut off, the muster-master's arrangement gives up <b>answering every man</b>.","With P4 cut off, the primary-copy protocol gives up <b>availability</b>."):dual("Answering from their own notes gives up <b>answering as one</b>.","Answering from their own copies gives up <b>consistency</b>.");
    bt.forEach(b=>b.disabled=false)}
  bt[0].onclick=()=>run("muster-master-clear");bt[1].onclick=()=>run("muster-master");bt[2].onclick=()=>run("own");
  D.forEach((d,i)=>d.innerHTML=`<b>${names[i]}</b>`);
})();

/* ===== waiting a glass ===== */
(function(){
  const H=twin(Hill($("#glasssvg")),{span:7,slide:true}),hk=hawkFold(H,4),say=$("#gsay"),stand=$("#gstand"),fill=$("#gfill"),bs={ask:$("#gask"),move:$("#gmove"),ask2:$("#gask2"),hawk:$("#ghawk"),reset:$("#greset")};
  H.state(1,"muster-master","primary");
  let hawks,K,N,own,done,answers,everLost,busy;
  const hawkLabel=()=>dual(hawks?"Hawks leave tent 4's fold":"Hawks come to tent 4's fold",hawks?"Restore the network":"Cut P4 off");
  function init(){H.lanes.reset();H.lanes.state(1,"muster-master","primary");hawks=false;K="attack";N={4:"hold"};own={4:null};done=[{by:2,plan:"attack"}];answers=[];everLost=false;busy=false;hk.show(false);
    bs.hawk.innerHTML=hawkLabel();fill.style.width="0";fill.classList.remove("out");
    say.innerHTML=dual("Number 4 may ask, or move the plan. With hawks in the fold, the glass will run out.","A client may read at P4, or write. With P4 cut off, the timer will run out.");paint()}
  function paint(){
    stand.innerHTML=`<div>${dual("Muster-master's note:","Primary's copy:")} <b>${pv(K)}</b></div><div>${dual("Tent 4's note:","P4's copy:")} <b>${pv(N[4])}</b>${own[4]?dual(`; their own move, not known to the muster-master: <b>${own[4]}</b>`,`; its own write, not known to the primary: <b>${V[own[4]]}</b>`):""}</div>
      <div>${dual("Hawks in the fold of tent 4:","P4 cut off:")} <b>${hawks?"yes":"no"}</b></div>
      <div style="margin-top:6px">${dual("Answers given:","Answers given:")} ${answers.length?answers.map(a=>`${dual("Number "+a.k,"P"+a.k)}: ${pv(a.given)} ${yesno(a.ok)}`).join("; "):"none"}</div>`;
    Object.values(bs).forEach(b=>b.disabled=busy)}
  async function ask(k){busy=true;paint();const lost=hawks&&k===4,right=record(done.map(m=>({plan:m.plan,end:0})),1);let given;
    fill.classList.remove("out");fill.style.width="0";say.innerHTML=dual(`Number ${k} asks, sends a bird to the muster-master and starts the glass.`,`A client reads at P${k}; the node sends a message to the primary and starts the timer.`);
    if(!lost){const w=35+rnd(45);await trip(H,k,1,false);await trip(H,1,k,false);fill.style.width=w+"%";given=K;if(k===4)N[4]=K;
      say.innerHTML=dual(`The muster-master's answer came <b>before the glass ran out</b>, and Number ${k} takes it: ${given}.`,`The primary's answer came <b>before the timer ran out</b>, and P${k} takes it: ${V[given]}.`)}
    else{everLost=true;const p=trip(H,4,1,true);fill.style.width="100%";await p;H.lanes.tick(.6);await sleep(600);fill.classList.add("out");
      given=own[4]!=null?own[4]:N[4];
      say.innerHTML=dual(`<b>The glass ran out.</b> Number 4 answers from their own note: ${given}${own[4]!=null?", their own move, since they have moved the plan since":""}.`,`<b>The timer ran out.</b> P4 answers from its own copy: ${V[given]}${own[4]!=null?", its own write, since it has written since":""}.`)}
    const ok=given===right;if(!ok&&!everLost)throw new Error("a wrong answer on a night with no lost bird");
    answers.push({k,given,ok});if(!ok)say.innerHTML+=dual(` <span class="bad">A single record says ${right}.</span>`+(everLost&&!hawks?" The hawks are gone, but a bird was lost earlier tonight.":" This happens only because a bird is lost."),` <span class="bad">A single object returns ${V[right]}.</span>`+(everLost&&!hawks?" The network is restored, but a message was lost earlier.":" This happens only because a message is lost."));
    busy=false;paint()}
  async function move(p){busy=true;paint();const lost=hawks;fill.classList.remove("out");fill.style.width="0";
    say.innerHTML=dual(`Number 4 moves the plan to ${p}, sends the move to the muster-master and starts the glass.`,`A client writes ${V[p]} at P4; the node sends the write to the primary and starts the timer.`);
    if(!lost){await trip(H,4,1,false);await trip(H,1,4,false);K=p;own[4]=null;N[4]=p;fill.style.width=(35+rnd(45))+"%";say.innerHTML=dual("The muster-master answered in time: the move stands, and the muster-master's note changes.","The primary answered in time: the write takes effect, and the primary's copy changes.")}
    else{everLost=true;const q=trip(H,4,1,true);fill.style.width="100%";await q;H.lanes.tick(.6);await sleep(600);fill.classList.add("out");own[4]=p;
      say.innerHTML=dual("<b>The glass ran out.</b> Number 4 is told the move stands. The muster-master never heard of it.","<b>The timer ran out.</b> The client at P4 is told the write took effect. The primary never heard of it.")}
    done.push({by:4,plan:p});busy=false;paint()}
  bs.ask.onclick=()=>ask(4);bs.ask2.onclick=()=>ask(2);bs.move.onclick=()=>move("hold");
  bs.hawk.onclick=()=>{hawks=!hawks;hk.show(hawks);bs.hawk.innerHTML=hawkLabel();
    say.innerHTML=hawks?dual("Hawks keep to the fold of tent 4.","P4 is cut off."):dual("The hawks have gone. Nothing here tells the muster-master what Number 4 may have moved while they stayed.","The network is restored. Nothing here tells the primary what P4 may have written while it was cut off.");paint()};
  bs.reset.onclick=init;init();
})();

/* ===== scrolly: the damage mends ===== */
(function(){
  const svg=$("#spansvg"),side=$("#spanside");
  let P,gs=[],cur=0;
  /* the times, in glass units: a flight, the muster-master's time to answer, the span, the moment the hawks leave */
  const f=.7,aT=.2,S=3.2,G=2*f+aT,rs=S/2-f,mv=1.4,h=3.5;
  const sends=[];for(let t=mv;;t+=rs){sends.push({t,lost:t<h});if(t>=h)break}
  const first=sends.find(x=>!x.lost),arrK=first.t+f,arrAll=arrK+f,spanEnd=h+S,askT=spanEnd+.2,ansT=askT+G;
  if(mv+G>=h||arrK-h>S/2||arrAll>spanEnd||ansT>9.2)throw new Error("the span figure breaks its own rules");
  const grp=()=>el("g",{class:"fade"},P.over);
  const dot=(g,k,t,plan,txt)=>{const e=P.event(k,t,plan?PC[plan]:"#1c1512",plan?12:6);if(plan)evLabel(e,txt||PL[plan],txt||V[plan]);e.style.cursor="default";g.appendChild(e)};
  const arrow=(g,a,ta,b,tb)=>g.appendChild(P.slip(a,ta,b,tb,12));
  const lostArc=(g,a,ta,b,tb,frac)=>{const pts=P.arc(a,ta,b,tb),q=pts.slice(0,Math.round((pts.length-1)*frac)+1);
    g.appendChild(el("path",{d:"M"+q.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L"),fill:"none",stroke:ATT,"stroke-width":2.6,"stroke-dasharray":"6 4"}));hawkShape(g,...q[q.length-1],.9)};
  const seg=(g,k,a,b)=>{const s=P.seg(k,a,b);s.classList.add("hi");g.appendChild(s)};
  const mk=(h,r)=>`<div class="hc"><h5>${h}</h5><div class="rc">${r}</div></div>`;
  const t1=dual("Tent 1, the muster-master","P1, the primary"),t3=Dk(3),t4=Dk(4),as=dual("attack, stamp 1","1, sequence number 1");
  const cards=[
    [mk(t1,dual("note: hold<br>nothing heard","copy: 0<br>nothing heard")),mk(t3,dual("note: hold","copy: 0")),mk(t4,dual("moved the plan to attack<br>told it stands","wrote 1<br>told it took effect"))],
    [mk(t1,dual("note: hold<br>nothing heard","copy: 0<br>nothing heard")),mk(t3,dual("note: hold","copy: 0")),mk(t4,dual("sends the move again<br>no bird gets through","sends the write again<br>no message gets through"))],
    [mk(t1,as),mk(t3,dual("note: hold","copy: 0")),mk(t4,"not yet acknowledged")],
    [mk(t1,as),mk(t3,as),mk(t4,dual("attack, stamp 1<br>acknowledged","1, sequence number 1<br>acknowledged"))],
    [mk(t1,as),mk(t3,as),mk(t4,dual("attack, stamp 1<br>a span has passed, no bird lost","1, sequence number 1<br>a span has passed, no message lost"))],
    [mk(t1,as),mk(t3,dual("asks<br>answered <b>attack</b>","reads<br>answered <b>1</b>")),mk(t4,as)]];
  const apply=s=>{cur=s;gs.forEach((g,i)=>g.classList.toggle("on",i<=s));side.innerHTML=cards[s].join("")};
  /* drawn in the round, or on lanes in computing, at the step the reader has reached */
  Timeline(svg,{vb:"0 0 620 600",cx:310,cy:300,r0:44,step:30,rings:9,tEnd:9.4,note:[14,24],nodes:{1:[225,"T1",TC[1],"P1"],2:[135,"T2",TC[2],"P2"],3:[315,"T3",TC[3],"P3"],4:[45,"T4",TC[4],"P4"]}},Q=>{P=Q;
  const G1=grp(),G2=grp(),G3=grp(),G4=grp(),G5=grp(),G6=grp();
  seg(G1,4,mv,mv+G);dot(G1,4,mv);lostArc(G1,4,mv,1,mv+f,.5);dot(G1,4,mv+G,"attack");
  sends.filter(x=>x.lost).slice(1).forEach(x=>lostArc(G2,4,x.t,1,x.t+f,.5));
  /* the moment the hawks leave: a tick across tent 4's line (across its lane in computing) */
  {const [x,y]=P.pt(4,h);const a=(P.lanes?90:135)*Math.PI/180;G2.appendChild(el("line",{x1:x+14*Math.cos(a),y1:y+14*Math.sin(a),x2:x-14*Math.cos(a),y2:y-14*Math.sin(a),stroke:"#1c1512","stroke-width":4}));
    dtext(G2,{class:"st-note",x:x+18,y:y+20},"hawks leave","network recovers")}
  arrow(G3,4,first.t,1,arrK);dot(G3,1,arrK,"attack","1");
  [2,3,4].forEach(k=>{arrow(G4,1,arrK,k,arrAll);dot(G4,k,arrAll,"attack","1")});
  seg(G5,4,h,spanEnd);
  dot(G6,3,askT);arrow(G6,3,askT,1,askT+f);arrow(G6,1,askT+f+aT,3,ansT);dot(G6,3,ansT,"attack");
  gs=[G1,G2,G3,G4,G5,G6];
    apply(cur);
  });
  scrolly($("#span"),apply);
})();

/* ===== two men move the plan during a loss ===== */
(function(){
  const tab=$("#twotab"),say=$("#twosay"),bn=$("#twonext"),br=$("#tworeset");
  let K,view,i;
  const beats=[
    ()=>dual("The plan stands at attack, stamp 1, at every tent. Hawks are in the fold of tent 4.","The value stands at 1, sequence number 1, at every node. P4 is cut off."),
    ()=>{K={plan:"hold",n:2};[1,2,3].forEach(k=>view[k]={plan:"hold",n:2});view[4]={plan:"attack",n:dual("own move","own write")};
      return dual("Number 2 moves the plan to hold. The muster-master stamps it 2 and sends it round, and Number 2 is told it stands. Number 4, cut off, moves it to attack and after a glass is told it stands too. Two men are each told a different plan stands.","A client writes 0 at P2. The primary gives it sequence number 2 and sends it round, and the client is told it took effect. A client at P4, cut off, writes 1 and after a timeout is told it took effect too. Two clients are each told a different value stands.")},
    ()=>{K={plan:"attack",n:3};return dual("The hawks leave. Number 4's move reaches the muster-master, who stamps it 3.","The network recovers. P4's write reaches the primary, which gives it sequence number 3.")},
    ()=>{[1,2,3,4].forEach(k=>view[k]={plan:K.plan,n:K.n});return dual("The muster-master sends attack, stamp 3, to every tent. The plan ends at whichever move was stamped later.","The primary sends 1, sequence number 3, to every node. The value ends at whichever write was sequenced later.")}];
  function paint(t){tab.innerHTML=`<tr><th>${dual("Tent","Node")}</th><th>${dual("Holds, or was told","Holds, or was told")}</th><th>${dual("Stamp","Sequence number")}</th></tr>`+[1,2,3,4].map(k=>`<tr><td>${tentChip(k)}${k===1?dual(" muster-master"," primary"):""}</td><td>${pv(k===1?K.plan:view[k].plan)}</td><td>${k===1?K.n:view[k].n}</td></tr>`).join("");say.innerHTML=t;bn.disabled=i>=beats.length-1}
  function reset(){K={plan:"attack",n:1};view={};[1,2,3,4].forEach(k=>view[k]={plan:"attack",n:1});i=0;paint(beats[0]())}
  bn.onclick=()=>{i++;paint(beats[i]())};
  br.onclick=reset;reset();
})();

/* ===== two windy nights ===== */
(function(){
  const HA=twin(Hill($("#windA")),{span:4.5}),HB=twin(Hill($("#windB")),{span:4.5,clock:HA.lanes.clock}),say=$("#windsay"),b1=$("#windask"),b2=$("#windans"),b3=$("#windgo"),br=$("#windreset");
  const asks=3,moves=[{plan:"attack",end:1}],right=record(moves,asks);
  let stage,rv;
  function setup(H){H.state(2,"attack","1");H.state(4,"note: hold","copy: 0");[1,3].forEach(k=>H.state(k,k===1?"":""))}
  async function both(fn){await Promise.all([fn(HA,true),fn(HB,false)])}
  function reset(){HA.lanes.reset();HB.lanes.reset();setup(HA);setup(HB);$$(".pine,.puff",document).forEach(e=>e.remove());stage=0;b1.disabled=false;b2.disabled=b3.disabled=true;
    say.innerHTML=dual("Number 2 has moved the plan to attack and been told it stands. Number 4 now asks which plan stands.","A client has written 1 at P2 and been told it took effect. A client now reads at P4.")}
  b1.onclick=async()=>{b1.disabled=true;
    const ga=HA.token(TC[4],""),gb=HB.token(TC[4],"");[ga,gb].forEach(g=>g.setAttribute("opacity",1));HA.fly(ga,4,1,.12);HB.fly(gb,4,1,.12);
    await Promise.all([tween(1100,u=>HA.fly(ga,4,1,.12+.34*u)),tween(1100,u=>HB.fly(gb,4,1,.12+.34*u))]);
    takeBird(HA,ga);const [x,y]=whereIs(gb);rv=gb;const pn=el("path",{class:"pine i",d:"M0,-16 L11,5 L-11,5z M-2,5 h4 v8 h-4z",fill:"#4f6b2e",stroke:"#1c1512","stroke-width":1.5},HB.over);HB.put(pn,x+16,y-6);
    dtext(HB.over,{class:"lab halo pine",x:x+16,y:y+26},"in a pine","delayed");
    say.innerHTML=dual("No bird has come on either night. In a wind nobody can say how long a bird may sit in the pines, so Number 4 can wait any length of time and learn nothing.","No message has arrived in either execution. With unbounded delay nobody can say how long a message may be delayed, so P4 can wait any length of time and learn nothing.");b2.disabled=false};
  b2.onclick=()=>{b2.disabled=true;HA.lanes.tick(.6);const v=view4([],asks),a=answer4(v);HA.state(4,"says "+a,"answers "+V[a]);HB.state(4,"says "+a,"answers "+V[a]);
    say.innerHTML=dual(`Every man must be answered, so Number 4 answers: <b>${a}</b>. Their inputs are the same on both nights, so the answer is the same. A single record says ${right}, so <span class="bad">it is wrong.</span>`,`Every request must be answered, so P4 answers: <b>${V[a]}</b>. Its inputs are the same in both executions, so the answer is the same. A single object returns ${V[right]}, so <span class="bad">it is wrong.</span>`);b3.disabled=false};
  b3.onclick=async()=>{b3.disabled=true;HB.fly(rv,4,1,.46);await tween(1100,u=>HB.fly(rv,4,1,.46+.42*u));rv.remove();$$(".pine",HB.svg).forEach(e=>e.remove());
    say.innerHTML=dual("On the left night the bird was lost for good. On the right night it was only slow, and lands at last: <b>no bird was lost</b>. The answer was given before it landed, so it is still wrong.","In the left execution the message was lost for good. In the right execution it was only delayed, and arrives at last: <b>no message was lost</b>. The answer was given before it arrived, so it is still wrong.")};
  br.onclick=reset;reset();
})();

/* ===== who is who ===== */
mapPairs($("#map"),[
 ["The four tents, one man in each","The nodes of the service, each also issuing requests for its client"],
 ["The standing plan; moving it; asking","An atomic read/write object with values hold and attack: a move is a write, a question a read, hold at dusk the initial value (§2.1)"],
 ["Answering as one","Atomic (linearizable) consistency: any read that begins after a write completes must return that value, or a later one (§2.1)"],
 ["Every man is answered","Availability: every request at a non-failed node eventually gets a response (§2.2)"],
 ["A lost bird; a cut-off tent","A lost message; a partition, in which every message between two components is lost: partition tolerance (§2.3)"],
 ["A flight; a man's time to answer","Known bounds on delivery of messages that are not lost, and on local processing: t_msg, t_local (§4.1)"],
 ["Glasses that run alike","Local timers at the same rate, not synchronised: the partially synchronous model (§4.1)"],
 ["The claim, any two of three","At most two of consistency, availability and partition tolerance: Brewer's conjecture, PODC 2000"],
 ["The Cut-Off Tent; the two nights","No algorithm guarantees availability and atomic consistency when messages may be lost, even with timers and a delivery bound; the executions α and α′₂ (Theorem 2; Theorem 1 in the asynchronous model)"],
 ["The muster-master's arrangement","A designated node holds the object; others forward requests and wait: the centralized algorithm (§3.2)"],
 ["Answering from one's own note","Returning local, possibly stale, data: available and partition tolerant (§3.2.3)"],
 ["Waiting a glass","A timeout after which the node answers with the best value it knows: 2 t_msg + t_local (§4.3)"],
 ["The promise of the span","A partial order that is atomic when no message is lost, and that orders any operation completed before a loss-free interval longer than t ahead of any operation begun after it: delayed-t consistency (Definition 3)"],
 ["The muster-master's stamps; sending again; every bird carrying the unacknowledged moves","The central node's sequence numbers and retransmission. Carrying the unacknowledged writes on every message stands in for ordered channels, which ravens do not give (Theorem 4)"],
 ["The wind; the Wind result","No bound on message delay: availability cannot be combined with atomicity even in executions where no messages are lost (asynchronous model, §3; Corollary 1.1)"],
 ["Which number each tent bears","A service needing no coordination: a trivial service, outside the theorem (2012, §2)"],
 ["The camps' impossibility","FLP: consensus with one crash, no message loss. Neither FLP nor CAP implies the other (2012, footnote 2)"],
 ["Dividing the choice","Partitioning by data or by operation (2012, §4.3–4.4)"]]);
REG.start();
})();

/* the four mercenaries, told apart by colour */
const TC={1:"#e0b84a",2:"#6583d6",3:"#c45448",4:"#9cb648"};
const HOLD="#136f9e",ATT="#bf4a26",PC={hold:HOLD,attack:ATT},PL={hold:"H",attack:"A"};
const yesno=ok=>ok?"<span class='ok'>✓</span>":"<span class='bad'>✗</span>";
const dash="<span class='dash'>—</span>";
const tentChip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${TC[k]}"></i>Tent ${k}</span>`;

/* ===== machines: answer from a copy that may be stale, or wait ===== */
(function(){
  const log=$("#cutlog"),note=$("#cutnote"),vA=$("#vA"),vB=$("#vB"),bw=$("#cutw"),ba=$("#cuta"),bz=$("#cutwait"),bm=$("#cutm"),br=$("#cutr");
  const add=(t,c)=>{const d=document.createElement("div");d.className="e "+(c||"");d.textContent=t;log.appendChild(d);while(log.children.length>5)log.firstChild.remove()};
  function reset(){log.innerHTML="";vA.textContent=vB.textContent="1";bw.disabled=false;ba.disabled=bz.disabled=true;bm.hidden=br.hidden=true;
    note.textContent="Both machines hold the value 1, and every message between them is lost."}
  bw.onclick=()=>{vA.textContent="2";add("write 2 at A: done","good");bw.disabled=true;ba.disabled=bz.disabled=false;
    note.textContent="The write finished at A, and A's message to B was lost. Now a client reads from B."};
  const fin=()=>{ba.disabled=bz.disabled=true};
  ba.onclick=()=>{fin();add("read at B: answered 1","bad");br.hidden=false;
    note.textContent="B answered, so the service is available. The answer is stale, because the write finished before the read began, so it is not consistent. B could not know: a copy that says 1 is right whenever no write came."};
  bz.onclick=()=>{fin();add("read at B: waiting for A…");bm.hidden=false;br.hidden=false;
    note.textContent="B cannot answer without hearing from A. While the link stays cut, B answers no one: consistent, but not available. Waiting longer changes nothing."};
  bm.onclick=()=>{bm.hidden=true;vB.textContent="2";add("link mended: B asks A, A says 2");add("read at B: answered 2","good");
    note.textContent="Once messages get through again, B can answer, and the answer is right. The wait lasted as long as the cut."};
  br.onclick=reset;reset();
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
/* hawks, and the fold they keep */
function hawkShape(parent,x,y,s){const g=el("g",{transform:`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s||1})`},parent);
  el("path",{d:"M-13,-2 Q-6,-12 0,-1 Q6,-12 13,-2 Q6,-5 0,3 Q-6,-5 -13,-2z",fill:"#5a4632",stroke:"#1c1512","stroke-width":1.5,"stroke-linejoin":"round"},g);return g}
function hawkFold(H,k){const t=H.tent[k],g=el("g",{class:"hawkset",opacity:0},H.under);
  let dx=t.x-H.cx,dy=t.y-H.cy;const n=Math.hypot(dx,dy);dx/=n;dy/=n;const px=-dy,py=dx;
  el("circle",{cx:t.x,cy:t.y,r:42,fill:"none",stroke:ATT,"stroke-width":3,"stroke-dasharray":"6 5"},g);
  hawkShape(g,t.x+dx*62+px*22,t.y+dy*62+py*22,1.1);hawkShape(g,t.x+dx*62-px*22,t.y+dy*62-py*22,1.1);
  return {show(on){g.setAttribute("opacity",on?1:0)}}}
function whereIs(g){const m=/translate\(([-\d.]+) ([-\d.]+)\)/.exec(g.getAttribute("transform"));return [+m[1],+m[2]]}
function takeBird(H,g){const [x,y]=whereIs(g);g.remove();const h=hawkShape(H.over,x,y,1.2);h.classList.add("puff");setTimeout(()=>h.remove(),1700)}
/* a raven from tent a to tent b: it lands, or a hawk takes it on the way */
async function trip(H,a,b,lost){const g=H.token(TC[a],"");g.setAttribute("opacity",1);H.fly(g,a,b,.12);
  await tween(1100,u=>H.fly(g,a,b,.12+(lost?.34:.76)*u));if(lost)takeBird(H,g);else{await sleep(120);g.remove()}}

/* what a man at tent 4 can go on: his note, the birds that reached him, how long he waited */
const view4=(birds,askAt)=>({note:"hold",birds:birds.filter(b=>b.to===4&&!b.lost).map(b=>b.plan),askAt});
const answer4=v=>v.birds.length?v.birds[v.birds.length-1]:v.note;
/* what a single record says: the last move finished before the question began, else hold */
const record=(moves,askAt)=>{const done=moves.filter(m=>m.end<askAt).sort((a,b)=>a.end-b.end);return done.length?done[done.length-1].plan:"hold"};

/* ===== ravens and hawks ===== */
(function(){
  const H=Hill($("#birdsvg")),hk=hawkFold(H,4),say=$("#bsay"),stand=$("#bstand"),bs=[["#bs21",2,1],["#bs24",2,4],["#bs43",4,3]].map(([s,a,b])=>({b:$(s),a,to:b})),bh=$("#bhawk"),bf=$("#bflight");
  let hawks=false,pend=null,busy=false;
  const paint=()=>{stand.innerHTML=`<div>Hawks in the fold of tent 4: <b>${hawks?"yes":"no"}</b></div><div>${pend?(pend.known?`Number ${pend.to} knows the raven from tent ${pend.a} was lost, and not what it carried.`:`Number ${pend.to} is waiting on a raven from tent ${pend.a}.`):"No man is waiting on a bird."}</div>`;
    bf.disabled=busy||!pend||pend.known;bs.forEach(x=>x.b.disabled=busy);bh.disabled=busy};
  bs.forEach(x=>x.b.onclick=async()=>{const lost=hawks&&(x.a===4||x.to===4);busy=true;pend=null;paint();
    say.textContent=`A raven leaves tent ${x.a} for tent ${x.to}.`;await trip(H,x.a,x.to,lost);busy=false;
    if(lost){pend={a:x.a,to:x.to,known:false};say.textContent=`No bird has come. No man at the foot saw it go, and Number ${x.to} cannot yet say whether it is lost or only slow.`}
    else say.textContent=`The raven lands at tent ${x.to}, within a flight.`;paint()});
  bf.onclick=()=>{pend.known=true;say.innerHTML=`<b>A whole flight has passed</b> and the raven from tent ${pend.a} has not come. A slow bird would have come by now, so Number ${pend.to} can say it was lost. Nothing says what it carried.`;paint()};
  bh.onclick=()=>{hawks=!hawks;hk.show(hawks);bh.textContent=hawks?"Hawks leave tent 4's fold":"Hawks come to tent 4's fold";
    say.textContent=hawks?"Hawks keep to the fold of tent 4. Every bird between tent 4 and the other three is lost for as long as they stay: tent 4 is cut off.":"The hawks have gone, and birds fly freely again.";paint()};
  paint();
})();

/* ===== two ways to answer badly ===== */
(function(){
  const H=Hill($("#owesvg")),hk=hawkFold(H,3),say=$("#owesay"),D=[$("#ow1"),$("#ow2")],b1=$("#owehold"),b2=$("#owewait"),br=$("#owereset");
  const moves=[{by:2,plan:"attack",end:1}],askAt=2,right=record(moves,askAt);
  const show=(given,why)=>{const one=given==null?null:given===right,ev=given!=null;
    D[0].innerHTML=`<b>Answering as one</b> ${one==null?dash:yesno(one)}<br>${why[0]}`;D[1].innerHTML=`<b>Every man is answered</b> ${yesno(ev)}<br>${why[1]}`};
  function reset(){H.state(2,"attack");H.state(3,"note: hold");hk.show(false);D.forEach((d,i)=>d.innerHTML=`<b>${["Answering as one","Every man is answered"][i]}</b>`);
    say.textContent="Number 3 asks which plan stands. How might tent 3 answer?";b1.disabled=b2.disabled=false}
  b1.onclick=()=>{b1.disabled=b2.disabled=true;H.state(3,"says hold");
    show("hold",[`A single record says ${right}, because Number 2's move was finished before the question began.`,"Number 3 is answered at once."]);
    say.innerHTML="A tent that says <b>hold</b> to every question has answered, but wrongly whenever attack stands."};
  b2.onclick=()=>{b1.disabled=b2.disabled=true;H.state(3,"waits");hk.show(true);
    show(null,["Nothing is said, so nothing is wrong.","Waiting is not an answer: the hawks may stay all night."]);
    say.innerHTML="<b>Wait until the hawks leave</b> is not an answer, since the hawks may stay all night."};
  br.onclick=reset;reset();
})();

/* ===== scrolly: two nights, and a man who cannot tell them apart ===== */
(function(){
  const svg=$("#cutsvg"),side=$("#cutside");
  const P=Polar(svg,{vb:"0 0 520 480",cx:260,cy:240,r0:40,step:27,rings:7,tEnd:7.4,note:[10,20],nodes:{1:[225,"T1",TC[1]],2:[135,"T2",TC[2]],3:[315,"T3",TC[3]],4:[45,"T4",TC[4]]}});
  const grp=()=>el("g",{class:"fade"},P.over);
  const dot=(g,k,t,plan)=>{const e=P.event(k,t,plan?PC[plan]:"#1c1512",plan?12:6);if(plan){e.label.textContent=PL[plan];e.label.style.fill="#fffaf0"}e.style.cursor="default";g.appendChild(e);return e};
  const lostArc=(g,a,ta,b,tb,frac)=>{const pts=P.arc(a,ta,b,tb),n=Math.round((pts.length-1)*frac),q=pts.slice(0,n+1);
    g.appendChild(el("path",{d:"M"+q.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L"),fill:"none",stroke:ATT,"stroke-width":2.6,"stroke-dasharray":"6 4"}));
    hawkShape(g,...q[q.length-1],.9)};
  /* the nights, as data */
  const T=1.2,mv1=1.4,askAt=mv1+T+1.6,ansAt=askAt+1;
  const night1={moves:[{by:2,plan:"attack",begin:mv1,end:mv1+T}],birds:[{from:2,to:4,sent:mv1,lost:true,plan:"attack"}]};
  const night2={moves:[],birds:[]};
  const gA=grp(),gB=grp(),gC=grp();
  /* night one among the three */
  P.seg(2,mv1,mv1+T).classList.add("hi");gA.appendChild(P.under.lastChild);
  dot(gA,2,mv1);lostArc(gA,2,mv1,4,mv1+1.6,.55);dot(gA,2,mv1+T,"attack");
  /* night two at tent 4 */
  P.seg(4,askAt,ansAt).classList.add("hi");gB.appendChild(P.under.lastChild);
  dot(gB,4,askAt);const ans=answer4(view4(night1.birds,askAt));dot(gB,4,ansAt,ans);
  /* tent 4, cut off */
  const [cx4,cy4]=P.pt(4,0);hawkShape(gC,cx4+30,cy4+30,1);hawkShape(gC,cx4+44,cy4-12,1);
  const mk=(h,r,c)=>`<div class="hc"><h5>${h}</h5><div class="rc">${r}</div><div class="chk">${c||""}</div></div>`;
  const same=JSON.stringify(view4(night1.birds,askAt))===JSON.stringify(view4(night2.birds,askAt));
  const rec1=record(night1.moves.map(m=>({plan:m.plan,end:m.end})),askAt),rec2=record(night2.moves,askAt);
  const cards=[
    [mk("Tent 2","note: hold"),mk("Tent 4","note: hold<br>cut off"),mk("A single record","hold")],
    [mk("Tent 2","moves the plan to attack<br>told it stands"),mk("Tent 4","nothing has come in"),mk("A single record","hold, then attack")],
    [mk("Tent 2","nothing happens"),mk("Tent 4",`asks<br>note hold, no bird, glass run<br>answers <b>${answer4(view4(night2.birds,askAt))}</b>`),mk("A single record",`${rec2}: ${yesno(answer4(view4(night2.birds,askAt))===rec2)}`)],
    [mk("Tent 2","moves the plan to attack<br>told it stands"),mk("Tent 4",`inputs the same as the second night: ${same?"yes":"no"}`),mk("A single record",`attack`)],
    [mk("Tent 2","moved the plan to attack"),mk("Tent 4",`answers <b>${ans}</b>`),mk("A single record",`${rec1} ${yesno(ans===rec1)}`)]];
  const show=[[0,0,1],[1,0,1],[0,1,1],[1,1,1],[1,1,1]];
  scrolly($("#cut"),s=>{
    [gA,gB,gC].forEach((g,i)=>g.classList.toggle("on",!!show[s][i]&&!(i===2&&s===0&&false)));
    gC.classList.add("on");
    side.innerHTML=cards[s].join("");
    $$(".st-ev",gB).forEach(e=>e.classList.toggle("mark",s===4));
  });
  if(!same||ans===rec1)throw new Error("the two nights must look alike to tent 4 and the answer must break answering as one");
})();

/* ===== the keeper's arrangement: any two ===== */
(function(){
  const H=Hill($("#keepsvg")),hk=hawkFold(H,4),say=$("#keepsay"),D=[1,2,3].map(i=>$("#kd"+i)),bt=["#kp1","#kp2","#kp3"].map(s=>$(s));
  H.state(1,"keeper");
  const names=["Answering as one","Every man is answered","Carrying on while birds can be lost"];
  const right=record([{plan:"attack",end:1}],2);
  function line(i,v,why){D[i].innerHTML=`<b>${names[i]}</b> ${v==null?dash:yesno(v)}<br>${why}`}
  async function run(kind){bt.forEach(b=>b.disabled=true);const hawks=kind!=="keeper-clear";hk.show(hawks);
    [2,3,4].forEach(k=>H.state(k,""));D.forEach((d,i)=>d.innerHTML=`<b>${names[i]}</b>`);
    let ans;
    say.textContent="Number 2 moves the plan to attack.";
    if(kind==="own"){H.state(2,"told: stands");await sleep(900)}
    else{await trip(H,2,1,false);await trip(H,1,2,false);H.state(2,"told: stands")}
    say.textContent="Later, Number 4 asks which plan stands.";
    if(kind==="own"){ans="hold";await sleep(700);H.state(4,"says hold")}
    else if(kind==="keeper-clear"){await trip(H,4,1,false);await trip(H,1,4,false);ans="attack";H.state(4,"told: attack")}
    else{await trip(H,4,1,true);ans=null;H.state(4,"no answer")}
    const one=ans==null?true:ans===right,every=ans!=null;
    line(0,one,ans==null?"Every answer that is given is right.":one?"Number 4 hears attack, which is what a single record says.":`Number 4 says ${ans}, though Number 2's move was finished before they asked. A single record says ${right}.`);
    line(1,every,every?(kind==="own"?"Number 4 is answered at once, from their own note.":"Both men are answered."):"Number 4 is alive and well and is not answered.");
    line(2,hawks?true:null,hawks?(kind==="own"?"Nobody waits for a bird.":"Tent 4 is cut off, and nothing the four say is wrong."):"No bird is lost tonight, so this night does not test it.");
    say.innerHTML=kind==="keeper-clear"?"With no hawks, the keeper's arrangement gives <b>answering as one</b> and an answer for every man.":kind==="keeper"?"With tent 4 cut off, the keeper's arrangement gives up <b>answering every man</b>.":"Answering from their own notes gives up <b>answering as one</b>.";
    bt.forEach(b=>b.disabled=false)}
  bt[0].onclick=()=>run("keeper-clear");bt[1].onclick=()=>run("keeper");bt[2].onclick=()=>run("own");
  D.forEach((d,i)=>d.innerHTML=`<b>${names[i]}</b>`);
})();

/* ===== waiting a glass ===== */
(function(){
  const H=Hill($("#glasssvg")),hk=hawkFold(H,4),say=$("#gsay"),stand=$("#gstand"),fill=$("#gfill"),bs={ask:$("#gask"),move:$("#gmove"),ask2:$("#gask2"),hawk:$("#ghawk"),reset:$("#greset")};
  H.state(1,"keeper");
  let hawks,K,N,own,done,answers,everLost,busy;
  function init(){hawks=false;K="attack";N={4:"hold"};own={4:null};done=[{by:2,plan:"attack"}];answers=[];everLost=false;busy=false;hk.show(false);
    bs.hawk.textContent="Hawks come to tent 4's fold";fill.style.width="0";fill.classList.remove("out");
    say.textContent="Number 4 may ask, or move the plan. With hawks in the fold, the glass will run out.";paint()}
  function paint(){
    stand.innerHTML=`<div>Keeper's note: <b>${K}</b></div><div>Tent 4's note: <b>${N[4]}</b>${own[4]?`; their own move, not known to the keeper: <b>${own[4]}</b>`:""}</div>
      <div>Hawks in the fold of tent 4: <b>${hawks?"yes":"no"}</b></div>
      <div style="margin-top:6px">Answers given: ${answers.length?answers.map(a=>`Number ${a.k}: ${a.given} ${yesno(a.ok)}`).join("; "):"none"}</div>`;
    Object.values(bs).forEach(b=>b.disabled=busy)}
  async function ask(k){busy=true;paint();const lost=hawks&&k===4,right=record(done.map(m=>({plan:m.plan,end:0})),1);let given;
    fill.classList.remove("out");fill.style.width="0";say.textContent=`Number ${k} asks, sends a bird to the keeper and turns the glass.`;
    if(!lost){const w=35+rnd(45);await trip(H,k,1,false);await trip(H,1,k,false);fill.style.width=w+"%";given=K;if(k===4)N[4]=K;
      say.innerHTML=`The keeper's answer came <b>before the glass ran out</b>, and Number ${k} takes it: ${given}.`}
    else{everLost=true;const p=trip(H,4,1,true);fill.style.width="100%";await p;await sleep(600);fill.classList.add("out");
      given=own[4]!=null?own[4]:N[4];
      say.innerHTML=`<b>The glass ran out.</b> Number 4 answers from their own note: ${given}${own[4]!=null?", their own move, since they have moved the plan since":""}.`}
    const ok=given===right;if(!ok&&!everLost)throw new Error("a wrong answer on a night with no lost bird");
    answers.push({k,given,ok});if(!ok)say.innerHTML+=` <span class="bad">A single record says ${right}.</span>`+(everLost&&!hawks?" The hawks are gone, but a bird was lost earlier tonight.":" This happens only because a bird is lost.");
    busy=false;paint()}
  async function move(p){busy=true;paint();const lost=hawks;fill.classList.remove("out");fill.style.width="0";
    say.textContent=`Number 4 moves the plan to ${p}, sends the move to the keeper and turns the glass.`;
    if(!lost){await trip(H,4,1,false);await trip(H,1,4,false);K=p;own[4]=null;N[4]=p;fill.style.width=(35+rnd(45))+"%";say.innerHTML="The keeper answered in time: the move stands, and the keeper's note changes."}
    else{everLost=true;const q=trip(H,4,1,true);fill.style.width="100%";await q;await sleep(600);fill.classList.add("out");own[4]=p;
      say.innerHTML="<b>The glass ran out.</b> Number 4 is told the move stands. The keeper never heard of it."}
    done.push({by:4,plan:p});busy=false;paint()}
  bs.ask.onclick=()=>ask(4);bs.ask2.onclick=()=>ask(2);bs.move.onclick=()=>move("hold");
  bs.hawk.onclick=()=>{hawks=!hawks;hk.show(hawks);bs.hawk.textContent=hawks?"Hawks leave tent 4's fold":"Hawks come to tent 4's fold";
    say.textContent=hawks?"Hawks keep to the fold of tent 4.":"The hawks have gone. Nothing here tells the keeper what Number 4 may have moved while they stayed.";paint()};
  bs.reset.onclick=init;init();
})();

/* ===== scrolly: the damage mends ===== */
(function(){
  const svg=$("#spansvg"),side=$("#spanside");
  const P=Polar(svg,{vb:"0 0 620 600",cx:310,cy:300,r0:44,step:30,rings:9,tEnd:9.4,note:[14,24],nodes:{1:[225,"T1",TC[1]],2:[135,"T2",TC[2]],3:[315,"T3",TC[3]],4:[45,"T4",TC[4]]}});
  /* the times, in glass units: a flight, the keeper's time to answer, the span, the moment the hawks leave */
  const f=.7,aT=.2,S=3.2,G=2*f+aT,rs=S/2-f,mv=1.4,h=3.5;
  const sends=[];for(let t=mv;;t+=rs){sends.push({t,lost:t<h});if(t>=h)break}
  const first=sends.find(x=>!x.lost),arrK=first.t+f,arrAll=arrK+f,spanEnd=h+S,askT=spanEnd+.2,ansT=askT+G;
  if(mv+G>=h||arrK-h>S/2||arrAll>spanEnd||ansT>9.2)throw new Error("the span figure breaks its own rules");
  const grp=()=>el("g",{class:"fade"},P.over);
  const dot=(g,k,t,plan,txt)=>{const e=P.event(k,t,plan?PC[plan]:"#1c1512",plan?12:6);if(plan){e.label.textContent=txt||PL[plan];e.label.style.fill="#fffaf0"}e.style.cursor="default";g.appendChild(e)};
  const arrow=(g,a,ta,b,tb)=>g.appendChild(P.slip(a,ta,b,tb,12));
  const lostArc=(g,a,ta,b,tb,frac)=>{const pts=P.arc(a,ta,b,tb),q=pts.slice(0,Math.round((pts.length-1)*frac)+1);
    g.appendChild(el("path",{d:"M"+q.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L"),fill:"none",stroke:ATT,"stroke-width":2.6,"stroke-dasharray":"6 4"}));hawkShape(g,...q[q.length-1],.9)};
  const seg=(g,k,a,b)=>{const s=P.seg(k,a,b);s.classList.add("hi");g.appendChild(s)};
  const G1=grp(),G2=grp(),G3=grp(),G4=grp(),G5=grp(),G6=grp();
  seg(G1,4,mv,mv+G);dot(G1,4,mv);lostArc(G1,4,mv,1,mv+f,.5);dot(G1,4,mv+G,"attack");
  sends.filter(x=>x.lost).slice(1).forEach(x=>lostArc(G2,4,x.t,1,x.t+f,.5));
  {const [x,y]=P.pt(4,h);const a=135*Math.PI/180;G2.appendChild(el("line",{x1:x+14*Math.cos(a),y1:y+14*Math.sin(a),x2:x-14*Math.cos(a),y2:y-14*Math.sin(a),stroke:"#1c1512","stroke-width":4}));
    const t=el("text",{class:"st-note",x:x+18,y:y+20},G2);t.textContent="hawks leave"}
  arrow(G3,4,first.t,1,arrK);dot(G3,1,arrK,"attack","1");
  [2,3,4].forEach(k=>{arrow(G4,1,arrK,k,arrAll);dot(G4,k,arrAll,"attack","1")});
  seg(G5,4,h,spanEnd);
  dot(G6,3,askT);arrow(G6,3,askT,1,askT+f);arrow(G6,1,askT+f+aT,3,ansT);dot(G6,3,ansT,"attack");
  const gs=[G1,G2,G3,G4,G5,G6];
  const mk=(h,r)=>`<div class="hc"><h5>${h}</h5><div class="rc">${r}</div></div>`;
  const cards=[
    [mk("Tent 1, the keeper","note: hold<br>nothing heard"),mk("Tent 3","note: hold"),mk("Tent 4","moved the plan to attack<br>told it stands")],
    [mk("Tent 1, the keeper","note: hold<br>nothing heard"),mk("Tent 3","note: hold"),mk("Tent 4","sends the move again<br>no bird gets through")],
    [mk("Tent 1, the keeper","attack, number 1"),mk("Tent 3","note: hold"),mk("Tent 4","not yet acknowledged")],
    [mk("Tent 1, the keeper","attack, number 1"),mk("Tent 3","attack, number 1"),mk("Tent 4","attack, number 1<br>acknowledged")],
    [mk("Tent 1, the keeper","attack, number 1"),mk("Tent 3","attack, number 1"),mk("Tent 4","attack, number 1<br>a span has passed, no bird lost")],
    [mk("Tent 1, the keeper","attack, number 1"),mk("Tent 3","asks<br>answered <b>attack</b>"),mk("Tent 4","attack, number 1")]];
  scrolly($("#span"),s=>{gs.forEach((g,i)=>g.classList.toggle("on",i<=s));side.innerHTML=cards[s].join("")});
})();

/* ===== two men move the plan during a loss ===== */
(function(){
  const tab=$("#twotab"),say=$("#twosay"),bn=$("#twonext"),br=$("#tworeset");
  let K,view,i;
  const beats=[
    ()=>"The plan stands at attack, number 1, at every tent. Hawks are in the fold of tent 4.",
    ()=>{K={plan:"hold",n:2};[1,2,3].forEach(k=>view[k]={plan:"hold",n:2});view[4]={plan:"attack",n:"own move"};
      return "Number 2 moves the plan to hold. The keeper numbers it 2 and sends it round, and Number 2 is told it stands. Number 4, cut off, moves it to attack and after a glass is told it stands too. Two men are each told a different plan stands."},
    ()=>{K={plan:"attack",n:3};return "The hawks leave. Number 4's move reaches the keeper, who numbers it 3."},
    ()=>{[1,2,3,4].forEach(k=>view[k]={plan:K.plan,n:K.n});return "The keeper sends attack, number 3, to every tent. The plan ends at whichever move was numbered later."}];
  function paint(t){tab.innerHTML="<tr><th>Tent</th><th>Holds, or was told</th><th>Number</th></tr>"+[1,2,3,4].map(k=>`<tr><td>${tentChip(k)}${k===1?" keeper":""}</td><td>${k===1?K.plan:view[k].plan}</td><td>${k===1?K.n:view[k].n}</td></tr>`).join("");say.textContent=t;bn.disabled=i>=beats.length-1}
  function reset(){K={plan:"attack",n:1};view={};[1,2,3,4].forEach(k=>view[k]={plan:"attack",n:1});i=0;paint(beats[0]())}
  bn.onclick=()=>{i++;paint(beats[i]())};
  br.onclick=reset;reset();
})();

/* ===== two windy nights ===== */
(function(){
  const HA=Hill($("#windA")),HB=Hill($("#windB")),say=$("#windsay"),b1=$("#windask"),b2=$("#windans"),b3=$("#windgo"),br=$("#windreset");
  const asks=3,moves=[{plan:"attack",end:1}],right=record(moves,asks);
  let stage,rv;
  function setup(H){H.state(2,"attack");H.state(4,"note: hold");[1,3].forEach(k=>H.state(k,k===1?"":""))}
  async function both(fn){await Promise.all([fn(HA,true),fn(HB,false)])}
  function reset(){setup(HA);setup(HB);$$(".pine,.puff",document).forEach(e=>e.remove());stage=0;b1.disabled=false;b2.disabled=b3.disabled=true;
    say.textContent="Number 2 has moved the plan to attack and been told it stands. Number 4 now asks which plan stands."}
  b1.onclick=async()=>{b1.disabled=true;
    const ga=HA.token(TC[4],""),gb=HB.token(TC[4],"");[ga,gb].forEach(g=>g.setAttribute("opacity",1));HA.fly(ga,4,1,.12);HB.fly(gb,4,1,.12);
    await Promise.all([tween(1100,u=>HA.fly(ga,4,1,.12+.34*u)),tween(1100,u=>HB.fly(gb,4,1,.12+.34*u))]);
    takeBird(HA,ga);const [x,y]=whereIs(gb);rv=gb;const pn=el("path",{class:"pine",d:"M0,-16 L11,5 L-11,5z M-2,5 h4 v8 h-4z",fill:"#4f6b2e",stroke:"#1c1512","stroke-width":1.5},HB.over);HB.put(pn,x+16,y-6);
    el("text",{class:"lab halo",x:x+16,y:y+26},HB.over).classList.add("pine");HB.over.lastChild.textContent="in a pine";
    say.textContent="No bird has come on either night. In a wind nobody can say how long a bird may sit in the pines, so Number 4 can wait any length of time and learn nothing.";b2.disabled=false};
  b2.onclick=()=>{b2.disabled=true;const v=view4([],asks),a=answer4(v);HA.state(4,"says "+a);HB.state(4,"says "+a);
    say.innerHTML=`Every man must be answered, so Number 4 answers: <b>${a}</b>. Their inputs are the same on both nights, so the answer is the same. A single record says ${right}, so <span class="bad">it is wrong.</span>`;b3.disabled=false};
  b3.onclick=async()=>{b3.disabled=true;HB.fly(rv,4,1,.46);await tween(1100,u=>HB.fly(rv,4,1,.46+.42*u));rv.remove();$$(".pine",HB.svg).forEach(e=>e.remove());
    say.innerHTML="On the left night the bird was lost for good. On the right night it was only slow, and lands at last: <b>no bird was lost</b>. The answer was given before it landed, so it is still wrong."};
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
 ["The keeper's arrangement","A designated node holds the object; others forward requests and wait: the centralized algorithm (§3.2)"],
 ["Answering from one's own note","Returning local, possibly stale, data: available and partition tolerant (§3.2.3)"],
 ["Waiting a glass","A timeout after which the node answers with the best value it knows: 2 t_msg + t_local (§4.3)"],
 ["The promise of the span","A partial order that is atomic when no message is lost, and that orders any operation completed before a loss-free interval longer than t ahead of any operation begun after it: delayed-t consistency (Definition 3)"],
 ["The keeper's numbers; sending again; every bird carrying the unacknowledged moves","The central node's sequence numbers and retransmission. Carrying the unacknowledged writes on every message stands in for ordered channels, which ravens do not give (Theorem 4)"],
 ["The wind; the Wind result","No bound on message delay: availability cannot be combined with atomicity even in executions where no messages are lost (asynchronous model, §3; Corollary 1.1)"],
 ["Which number each tent bears","A service needing no coordination: a trivial service, outside the theorem (2012, §2)"],
 ["The camps' impossibility","FLP: consensus with one crash, no message loss. Neither FLP nor CAP implies the other (2012, footnote 2)"],
 ["Dividing the choice","Partitioning by data or by operation (2012, §4.3–4.4)"]]);

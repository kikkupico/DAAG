"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,Polar,Timeline,Unfold}=BOOK;
const {isM,dual,vis,dtext,onReg}=REG;
BOOK.init();

/* the four stewards in the Tholos, told apart by colour; Steward 1 opens the first term */
const BC={1:"#a57fc0",2:"#9aa0a8",3:"#e8964d",4:"#b07a55"};
const chip=k=>`<span class="chip"><i style="background:${BC[k]}"></i>${dual("Steward "+k,"R"+k)}</span>`;
const chips=a=>a.length?a.map(chip).join(""):`<i>${dual("nobody","nobody")}</i>`;

/* a row of buttons for choosing one thing; keeps keyboard focus when it redraws */
function picker(host,label,opts,cur,on){
  const keep=host.dataset.f;delete host.dataset.f;host.innerHTML="";host.className="pick";
  const l=document.createElement("span");l.className="plab";l.innerHTML=label;host.appendChild(l);
  opts.forEach(([v,t],i)=>{const b=document.createElement("button");b.className="btn"+(v===cur?"":" alt");b.innerHTML=t;b.setAttribute("aria-pressed",v===cur);
    b.onclick=()=>{host.dataset.f=i;on(v)};host.appendChild(b);if(keep!=null&&+keep===i)b.focus()});
}

/* ===== the Tholos, seen from above: circular limestone floor, four benches along the wall, porch door below ===== */
function Tholos(svg){
  const cx=235,cy=215,rr=200,R=145,A={1:-135,2:-45,3:45,4:135};
  svg.innerHTML="";svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:rr,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5,class:"i"},svg);
  el("circle",{cx,cy,r:R+32,fill:"none",stroke:"#1c1512","stroke-width":2.5,class:"i"},svg);
  el("circle",{cx,cy,r:100,fill:"none",stroke:"#8c7e68","stroke-width":1.5,class:"i"},svg);
  el("circle",{cx,cy,r:24,fill:"none",stroke:"#8c7e68","stroke-width":1.2,class:"i"},svg);
  const floorG=el("g",{class:"i"},svg);
  for(let j=0;j<16;j++){
    const aj=j*Math.PI*2/16,r0=24,r1=100;
    const x0=cx+r0*Math.cos(aj),y0=cy+r0*Math.sin(aj);
    const x1=cx+r1*Math.cos(aj+0.42),y1=cy+r1*Math.sin(aj+0.42);
    const mx=cx+60*Math.cos(aj+0.18),my=cy+60*Math.sin(aj+0.18);
    el("path",{d:`M${x0.toFixed(1)} ${y0.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`,fill:"none",stroke:"#c8bea2","stroke-width":1},floorG);
    const x2=cx+r1*Math.cos(aj-0.42),y2=cy+r1*Math.sin(aj-0.42);
    const mx2=cx+60*Math.cos(aj-0.18),my2=cy+60*Math.sin(aj-0.18);
    el("path",{d:`M${x0.toFixed(1)} ${y0.toFixed(1)} Q${mx2.toFixed(1)} ${my2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,fill:"none",stroke:"#c8bea2","stroke-width":1},floorG);
  }
  el("rect",{x:cx-26,y:cy+rr-2,width:52,height:24,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3,class:"i"},svg);
  el("text",{x:cx,y:cy+rr+36,class:"lab i",style:"font-size:12px;text-anchor:middle"},svg).textContent="the door";
  const sites=el("g",{},svg),over=el("g",{},svg);
  const C={svg,cx,cy,R,A,over,tent:{},
    pos(k){const a=A[k]*Math.PI/180;return [cx+R*Math.cos(a),cy+R*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:11,fill,stroke:"#1c1512","stroke-width":2.5},g);dtext(g,{},glyph||"",glyph||"");return g},
    /* a runner u of the way from bench a to bench b; each direction keeps to its own side of the line */
    fly(g,a,b,u){const [x1,y1]=C.pos(a),[x2,y2]=C.pos(b),dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy),o=26*Math.sin(Math.PI*u);
      C.put(g,x1+dx*u-dy/l*o,y1+dy*u+dx/l*o)},
    state(k,i,m){const t=C.tent[k].st;t[0].textContent=i;t[1].textContent=m===undefined?i:m}
  };
  for(const k of [1,2,3,4]){const [x,y]=C.pos(k),g=el("g",{class:"site"},sites);C.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:BC[k]},g);dtext(g,{},"S"+k,"R"+k);
    const in_a=(A[k]+180)*Math.PI/180;
    const st=dtext(g,{class:"state halo",x:42*Math.cos(in_a),y:42*Math.sin(in_a)+4},"","");
    C.tent[k]={x,y,g,st}}
  return C;
}

/* cover:start */
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · THREE PHASES, ONE ORDER","n = 3f + 1 = 4");
  const X=[116,194,272,350,428],Xe=496,Y={C:112,1:184,2:250,3:316,4:382},cols=["request","pre-prepare","prepare","commit","reply"];
  cols.forEach((c,i)=>{
    const x=X[i]-26,w=i<4?(X[i+1]-X[i]):(Xe-X[i]+26);
    bandX(g,i===0?X[0]-26:X[i]-0,i===0?X[1]-X[0]+26:w,64,420,i%2?"#fafafc":P.bg);
    T(g,(i===0?X[0]+10:X[i]+w/2),80,c,{s:9.5,m:1,c:P.mute})});
  for(const k of["C",1,2,3,4]){
    lane(g,62,508,Y[k],{c:k===4?"red":null,dash:k===4?"4 4":null,w:1.5});
    node(g,40,Y[k],k==="C"?13:15,k==="C"?"C":"R"+k,{k:k===4?P.red:P.ink,c:k===4?P.red:P.ink,s:k==="C"?11:10.5,f:k===4?P.redL:"#fff"})}
  const L=(a,xa,b,xb,o={})=>link(g,xa,Y[a],xb,Y[b],{w:1,c:"blue",op:.5,...o});
  const ps=[];
  ps.push(L("C",X[0],1,X[1],{op:.9,w:1.6}));
  for(const b of[2,3,4])ps.push(L(1,X[1],b,X[2],{op:.9,w:1.4,c:b===4?"blue":"blue"}));
  for(const a of[2,3,4])for(const b of[1,2,3,4])if(a!==b)L(a,X[2],b,X[3],{c:a===4?"red":"blue",op:a===4?.7:.45,dash:a===4?"3 3":null});
  for(const a of[1,2,3,4])for(const b of[1,2,3,4])if(a!==b)L(a,X[3],b,X[4],{c:a===4?"red":"blue",op:a===4?.7:.4,dash:a===4?"3 3":null});
  for(const a of[1,2,3])ps.push(L(a,X[4],"C",Xe-12,{c:"green",op:.8,w:1.3}));
  X.forEach((x,i)=>{for(const k of["C",1,2,3,4]){if(k==="C"&&i>0&&i<4)continue;if(i===4&&k===4)continue;dot(g,x,Y[k],3.1,k===4?P.red:P.ink)}});
  dot(g,Xe-12,Y.C,3.1,P.green);
  ps.slice(0,5).forEach((p,k)=>packet(g,p,{c:k?"blue":"gold",dur:2.6+k*.3,delay:k*.35,r:3.4}));
  chip(g,X[1]+4,Y[4]+34,"⟨pre-prepare, v=0, n=7, d⟩",{a:"start",m:1,s:9,k:P.blueL,c:P.blue});
  chip(g,X[2]+0,Y[4]-24,"d′ ≠ d",{m:1,s:9,k:P.red,c:P.red,f:P.redL});
  /* quorum brackets */
  const br=(x1,x2,t,c,a,tx)=>{const y=Y[4]+66;el("path",{d:`M${x1} ${y-6}V${y}H${x2}V${y-6}`,fill:"none",stroke:P[c],"stroke-width":1.4},g);T(g,tx,y+14,t,{s:9.5,m:1,c:P[c],a})};
  br(X[2],X[3]-3,"2f+1 prepares","blue","end",X[3]-3);br(X[3]+3,X[4],"2f+1 commits","green","start",X[3]+3);
  /* the log */
  const ly=H-26;T(g,26,ly,"log",{a:"start",s:10,m:1,c:P.mute});
  [5,6,7,8].forEach((s,i)=>{const x=64+i*52;el("rect",{x,y:ly-11,width:46,height:22,rx:5,fill:s===7?P.blueL:"#fff",stroke:s===7?P.blue:P.line,"stroke-width":s===7?1.6:1},g);T(g,x+23,ly+.5,s===7?"req 7":String(s),{s:10,m:1,c:s===7?P.blue:P.faint,w:s===7?600:400})});
  chip(g,W-26,ly,"view v = 0 · primary R1",{a:"end",m:1,s:9.5,c:P.mute})
};
COVERS.draw("#coversvg",COVER);COVERS.mount(COVER);
/* cover:end */

/* ===== why three seals, and four stewards: two groups always share an honest steward ===== */
(function(){
  const C=Tholos($("#sealsvg")),ctl=$("#sealctl"),stand=$("#sealstand"),say=$("#sealsay");
  let n=4,liar=null,x=1,y=3;
  const all=m=>[...Array(m)].map((_,i)=>i+1);
  /* the least number of honest stewards two groups can share, over every choice of leaving out, and every supposed liar */
  const least=m=>{let lo=99;all(m).forEach(a=>all(m).forEach(b=>all(m).forEach(l=>{
    const sh=all(m).filter(k=>k!==a&&k!==b&&k!==l);lo=Math.min(lo,sh.length)})));return lo};
  function paint(){
    const A=all(n),gx=A.filter(k=>k!==x),gy=A.filter(k=>k!==y),sh=gx.filter(k=>gy.includes(k)),hon=sh.filter(k=>k!==liar);
    [1,2,3,4].forEach(k=>{const g=C.tent[k].g;g.classList.toggle("gone",k>n);g.classList.toggle("shared",sh.includes(k));g.classList.toggle("sus",k===liar)});
    stand.innerHTML=`<div>First group (everyone but ${chip(x)}) ${gx.map(chip).join("")}</div><div>Second group (everyone but ${chip(y)}) ${gy.map(chip).join("")}</div><div>In both groups ${chips(sh)}</div><div>Honest, and in both ${liar==null?dual("<i>suppose one steward lies</i>","<i>suppose one replica is faulty</i>"):chips(hon)}</div>`;
    if(liar==null)say.innerHTML=dual(`Each group is ${n===4?"three stewards out of four":"two stewards out of three"}: all but one, since one may be a silent liar. Suppose one steward lies, and see who is left in both groups.`,`Each group is ${n===4?"three replicas out of four":"two replicas out of three"}: all but one, since one may be a silent faulty replica. Suppose one replica is faulty, and see who is left in both groups.`);
    else if(hon.length)say.innerHTML=dual(`<span class="ok">An honest steward sits in both groups.</span> An honest steward seals only one line for a number in a term, so the two groups cannot have sealed different lines.`,`<span class="ok">An honest replica sits in both groups.</span> An honest replica signs only one request for a number in a view, so the two groups cannot have signed different requests.`);
    else say.innerHTML=dual(`<span class="bad">The only steward in both groups is the one who lies.</span> They could seal one line to the first group and a different one to the second. With ${n} stewards, the groups can fail.`,`<span class="bad">The only replica in both groups is the faulty one.</span> It could sign one request for the first group and a different one for the second. With ${n} replicas, the groups can fail.`);
    say.innerHTML+=dual(` Over every choice, the fewest honest stewards two groups can share is <b>${least(n)}</b>${n===4?"":", so three stewards are too few"}.`,` Over every choice, the fewest honest replicas two groups can share is <b>${least(n)}</b>${n===4?"":", so three replicas are too few"}.`);
    const opts=A.map(k=>[k,dual("Steward "+k,"R"+k)]);
    picker($("#sealp1")||mk("sealp1"),dual("How many stewards?","How many replicas?"),[[3,dual("Three stewards","Three replicas")],[4,dual("Four stewards","Four replicas")]],n,v=>{n=v;if(liar>n)liar=null;if(x>n)x=1;if(y>n)y=n;paint()});
    picker($("#sealp2")||mk("sealp2"),dual("Suppose this steward lies:","Suppose this replica is faulty:"),opts,liar,v=>{liar=v;paint()});
    picker($("#sealp3")||mk("sealp3"),dual("The first group leaves out:","The first group leaves out:"),opts,x,v=>{x=v;paint()});
    picker($("#sealp4")||mk("sealp4"),dual("The second group leaves out:","The second group leaves out:"),opts,y,v=>{y=v;paint()});
  }
  function mk(id){const d=document.createElement("div");d.id=id;ctl.appendChild(d);return d}
  paint();
})();

/* ===== changing the office: a term that stalls, and delays that look the same ===== */
(function(){
  const C=Tholos($("#jobsvg")),say=$("#jobsay"),info=$("#jobinfo"),tEl=$("#jobterm"),sEl=$("#jobstood"),
    bF=$("#jobfile"),bN=$("#jobnum"),bS=$("#jobsilent"),bW=$("#jobwind"),bR=$("#jobreset");
  let term=1,waiting=false,delayed=true,stood=0,busy=false;
  const writer=t=>((t-1)%4)+1;
  /* computing: the views as one timeline that slides as it runs, each view a band and the primary's name ringed;
     a numbering held up by the network is a dashed arrow that lands only after the view has changed */
  const L=Unfold(C.svg,{nodes:{1:[-135,"S1",BC[1],"R1"],2:[-45,"S2",BC[2],"R2"],3:[45,"S3",BC[3],"R3"],4:[135,"S4",BC[4],"R4"]},span:7,slide:true});
  let vT=0,held=[];
  function paint(){
    const h=writer(term);[1,2,3,4].forEach(k=>C.tent[k].g.classList.toggle("turn",k===h));L.turn(h);
    tEl.textContent=term;sEl.textContent=stood;info.innerHTML=dual(`term ${term}, writer Steward ${h}`,`view ${term}, primary R${h}`);
    bF.disabled=busy||waiting;bN.disabled=bS.disabled=busy||!waiting;bW.disabled=bR.disabled=busy;
    bW.innerHTML=delayed?dual("Messengers are delayed","Messages are delayed"):dual("Messengers cross quickly","Delays are short");bW.setAttribute("aria-pressed",delayed);
  }
  async function change(){
    busy=true;paint();const h=writer(term),next=writer(term+1),others=[1,2,3,4].filter(k=>k!==next);
    L.band(vT,L.clock.t,"view "+term);[1,2,3,4].forEach(k=>L.state(k,"timer expired"));
    say.innerHTML=dual(`The sandglasses run out. Each steward who is waiting asks for a change: a sealed request for the next term, with proof of every line readied at their bench, goes to <b>Steward ${next}</b>.`,`The timers expire. Each replica that is waiting asks for a view change: a signed request for the next view, with proof of every request prepared at that replica, goes to <b>R${next}</b>.`);
    const toks=others.map(k=>{const g=C.token(BC[k],"");g.setAttribute("opacity",1);C.fly(g,k,next,.1);L.fly(g,k,next,.1);return [k,g]});
    await Promise.all(toks.map(([k,g])=>tween(1100+rnd(700),u=>{C.fly(g,k,next,.1+.8*u);L.fly(g,k,next,.1+.8*u)}).then(()=>g.remove())));
    held.forEach(r=>L.land(r));held=[];vT=L.clock.t;L.state(next,"primary, view "+(term+1));
    term++;busy=false;paint();
    say.innerHTML=dual(`Three requests are in, and three are enough. <b>Steward ${next}</b> now holds the writer's office, in term ${term}. The line is still waiting. Nobody judged whether Steward ${h} stalled or messengers dawdled across the floor.`,`Three requests are in, and three are enough. <b>R${next}</b> is now the primary, in view ${term}. The request is still waiting. Nobody judged whether R${h} stalled or the network delayed its messages.`);
  }
  bF.onclick=()=>{waiting=true;L.tick(.35);L.state(writer(term),"has request");paint();say.innerHTML=dual(`A line is petitioned at <b>Steward ${writer(term)}'s</b> bench, who holds the writer's office, and the steward turns a sandglass. ${delayed?"Messengers are delayed across the floor.":"Messengers cross the floor quickly."}`,`A request is submitted to <b>R${writer(term)}</b>, the primary, and the client starts a timer. ${delayed?"Messages are being delayed.":"Delays are short."}`)};
  bN.onclick=async()=>{const h=writer(term);
    if(delayed){say.innerHTML=dual(`<b>Steward ${h}</b> numbers the line and sends the numbering out, but messengers are delayed across the stone floor. The sandglass runs out first. From where anyone sits, this looks exactly like a writer who said nothing.`,`<b>R${h}</b> numbers the request and sends the numbering out, but the network delays the messages. The timer expires first. From where anyone sits, this looks exactly like a primary that said nothing.`);
      [1,2,3,4].filter(k=>k!==h).forEach(k=>held.push(L.msg(h,k,L.clock.t,null)));L.tick(.9);await sleep(900);await change();return}
    const t=L.clock.t;[1,2,3,4].filter(k=>k!==h).forEach(k=>L.msg(h,k,t,t+.5));L.band(t+.55,t+1.35,"prepare · commit",false,true);L.setT(t+1.4);[1,2,3,4].forEach(k=>L.state(k,"committed"));
    waiting=false;stood++;paint();
    say.innerHTML=dual(`<b>Steward ${h}</b> numbers the line, the others echo it twice, and it <span class="ok">stands</span> before the sandglass runs out. The writer's office stays where it is.`,`<b>R${h}</b> numbers the request, the others echo it twice, and it <span class="ok">commits</span> before the timer expires. The primary stays where it is.`)};
  bS.onclick=async()=>{const h=writer(term);say.innerHTML=dual(`<b>Steward ${h}</b> numbers nothing. The sandglass runs out, and nobody can say whether that is a stall or slow messengers.`,`<b>R${h}</b> numbers nothing. The timer expires, and nobody can say whether that is a stall or network delay.`);L.tick(.9);await sleep(900);await change()};
  bW.onclick=()=>{delayed=!delayed;paint();say.innerHTML=delayed?dual("Messengers are delayed across the floor. Nobody can see delays end, and nobody can see them start.","Messages are being delayed. Nobody can see the delays end, and nobody can see them start."):dual("Messengers cross the floor quickly again, though nobody sitting at their bench can tell. Runs are short again.","Delays have become short, though no replica can tell. Message runs are short again.")};
  bR.onclick=()=>{term=1;waiting=false;delayed=true;stood=0;L.reset();vT=0;held=[];paint();say.innerHTML=dual("A line is petitioned and waits to be numbered. Messengers are delayed across the floor.","A request is submitted and waits to be numbered. Messages are being delayed.")};
  paint();
})();

/* ===== three requests always meet the stewards who hold the line ===== */
(function(){
  const C=Tholos($("#reqsvg")),ctl=$("#reqctl"),stand=$("#reqstand"),say=$("#reqsay");
  let out=4,liar=null,left=1;const writer=2,all=[1,2,3,4];
  const mk=id=>{const d=document.createElement("div");d.id=id;ctl.appendChild(d);return d};
  function paint(){
    const E=all.filter(k=>k!==out),honE=E.filter(k=>k!==liar),R=all.filter(k=>k!==left),show=R.filter(k=>honE.includes(k));
    all.forEach(k=>{const g=C.tent[k].g;g.classList.toggle("shared",E.includes(k));g.classList.toggle("sus",k===liar);g.classList.toggle("out",k===left)});
    const line=k=>{const yes=honE.includes(k),isL=k===liar;
      return `<div class="rq${yes?" yes":""}">${chip(k)} ${yes?dual("shows line X readied under 7, in term 1","shows X prepared under 7, in view 1"):isL?dual("may say anything at all","may say anything at all"):dual("may show it, or may show nothing","may show it, or may show nothing")}</div>`};
    stand.innerHTML=`<div>${dual("Sent second echoes for line X","Sent commits for X")} ${chips(E)}</div><div>${dual("Of them, honest","Of them, honest")} ${liar==null?chips(E):chips(honE)} ${dual("(they have line X readied)","(they have X prepared)")}</div><div>${dual(`Steward ${writer} has the writer's office in term 2, and collects requests from`,`R${writer} is the primary in view 2, and collects requests from`)} ${chips(R)}</div><div class="req">${R.map(line).join("")}</div>`;
    if(show.length)say.innerHTML=dual(`<span class="ok">At least one request shows line X readied under 7.</span> The new writer must number X under 7, and the other stewards check that they do. For number 8 no request shows anything readied, so the new writer numbers a blank line there.`,`<span class="ok">At least one request shows X prepared under 7.</span> The new primary must number X under 7, and the other replicas check that it does. For number 8 no request shows anything prepared, so the new primary numbers a null request there.`);
    else say.innerHTML=dual(`<span class="bad">No request shows X.</span> This cannot happen: two honest stewards have line X readied, and three requests out of four always include one of them.`,`<span class="bad">No request shows X.</span> This cannot happen: two honest replicas have X prepared, and three requests out of four always include one of them.`);
    const opts=all.map(k=>[k,dual("Steward "+k,"R"+k)]);
    picker($("#reqp1")||mk("reqp1"),dual("Second echoes for X came from everyone but:","Commits for X came from everyone but:"),opts,out,v=>{out=v;paint()});
    picker($("#reqp2")||mk("reqp2"),dual("Suppose this steward lies:","Suppose this replica is faulty:"),[[null,dual("Nobody","Nobody")]].concat(opts),liar,v=>{liar=v;paint()});
    picker($("#reqp3")||mk("reqp3"),dual("The new writer leaves out the request of:","The new primary leaves out the request of:"),all.filter(k=>k!==writer).map(k=>[k,dual("Steward "+k,"R"+k)]),left,v=>{left=v;paint()});
  }
  paint();
})();

/* ===== going on once delays settle: a doubling sandglass against a fixed one ===== */
(function(){
  const ctl=$("#gotctl"),list=$("#gotlist"),say=$("#gotsay"),run=$("#gotrun");
  const NEED=3;   /* a term's worth of short runs: the numbering and the two echoes, each at most one first glass */
  const delayScenarios=[[2,dual("Delays settle soon","Delays end soon")],[20,dual("Delays last a long time","Delays last a long time")],[Infinity,dual("Delays never settle","Delays never end")]];
  let dbl=true,W=2,gen=0;
  const writer=k=>((k-1)%4)+1;
  function sim(){const rows=[];let t=0;for(let k=1;k<=12;k++){const g=dbl?2**(k-1):1,still=t>=W,ok=still&&g>=NEED;
    rows.push({k,h:writer(k),t,g,kind:ok?"ok":!still?"delayed":"short"});if(ok)break;t+=g}return rows}
  const why={
    ok:g=>dual(`Messengers cross briskly, and the sandglass of ${g} outlasts three short runs. The lines stand.`,`Delays are short, and a timeout of ${g} outlasts three short runs. The requests commit.`),
    delayed:()=>dual("Messengers are still delayed across the floor when the term begins. Nothing stands.","Delays are still long when the view begins. Nothing commits."),
    short:g=>dual(`Messengers cross briskly, but a sandglass of ${g} runs out before three short runs can finish. The writer's office passes again.`,`Delays are short, but a timeout of ${g} expires before three short runs can finish. The primary changes again.`)
  };
  function pickers(){
    picker($("#gotp1")||mk("gotp1"),dual("The sandglass:","The timeout:"),[[true,"Doubles at every change"],[false,"The same every time"]],dbl,v=>{dbl=v;reset()});
    picker($("#gotp2")||mk("gotp2"),dual("The delays:","The delays:"),delayScenarios.map(([w,t])=>[w,t]),W,v=>{W=v;reset()});
  }
  function mk(id){const d=document.createElement("div");d.id=id;ctl.appendChild(d);return d}
  function reset(){gen++;list.innerHTML="";run.disabled=false;pickers();say.innerHTML=dual("Every writer is honest in this picture, and the first sandglass is the time a short run across the floor takes at most. A term's worth is counted as three short runs: the numbering and the two echoes.","Every primary is honest in this picture, and the first timeout is the time a short message run takes at most. A view's worth is counted as three short runs: the numbering and the two echoes.")}
  run.onclick=async()=>{const g0=++gen,rows=sim(),max=Math.max(...rows.map(r=>r.g));run.disabled=true;list.innerHTML="";
    for(const r of rows){if(g0!==gen)return;const d=document.createElement("div");d.className="trow "+r.kind;
      d.innerHTML=`<b>${dual("Term","View")} ${r.k}</b><span class="gl"><i style="width:${Math.max(4,r.g/max*100)}%"></i></span><em>${dual(`Steward ${r.h} has the writer's office, glass ${r.g}.`,`R${r.h} is the primary, timeout ${r.g}.`)} ${why[r.kind](r.g)}</em>`;list.appendChild(d);await sleep(450)}
    if(g0!==gen)return;const last=rows[rows.length-1];
    if(last.kind==="ok")say.innerHTML=dual(`<span class="ok">The lines stand at term ${last.k}.</span> ${dbl?"The doubling sandglass grew past a term's worth of short runs across the floor, and the first term to begin with prompt messengers after that worked.":"The sandglass never changed, and prompt messengers were enough because it was long enough from the start."}`,`<span class="ok">The requests commit in view ${last.k}.</span> ${dbl?"The doubling timeout grew past a view's worth of short runs, and the first view to begin with short delays after that one worked.":"The timeout never changed, and short delays were enough because it was long enough from the start."}`);
    else{const d=document.createElement("div");d.className="trow more";d.textContent="…and so on, for ever";list.appendChild(d);
      say.innerHTML=W===Infinity?dual(`<span class="bad">Nothing ever stands, and nothing wrong stands either.</span> Going on waits for delays to settle.`,`<span class="bad">Nothing ever commits, and nothing wrong commits either.</span> Progress waits for delays to become short.`):dual(`<span class="bad">The office changes never stop.</span> A sandglass that stays the same is always shorter than a term's worth of short runs, so every term runs out before it can finish.`,`<span class="bad">The view changes never stop.</span> A timeout that stays the same is always shorter than a view's worth of short runs, so every view expires before it can finish.`)}
    run.disabled=false};
  reset();
})();

/* ===== settling checkpoints: the allowed numbers, and a writer who jumps ahead ===== */
(function(){
  const nE=$("#setN"),sE=$("#setS"),kE=$("#setK"),bar=$("#setbar"),meter=bar.parentNode,rng=$("#setrange"),say=$("#setsay"),
    bF=$("#setfile"),bS=$("#setsettle"),bB=$("#setbad"),bG=$("#setgood"),bR=$("#setreset");
  const DIST=200;   /* the picture's fixed distance beyond the last settled checkpoint */
  let N=0,S=0;
  function paint(){
    nE.textContent=N;sE.textContent=S;kE.textContent=N-S;bar.style.width=((N-S)/DIST*100)+"%";meter.classList.toggle("full",N-S>=DIST);
    rng.innerHTML=dual(`Allowed numbers: ${S+1} to ${S+DIST}. ${N-S} of the ${DIST} ${N-S===1?"is":"are"} used.`,`Allowed numbers, between the water marks: ${S+1} to ${S+DIST}. ${N-S} of the ${DIST} ${N-S===1?"is":"are"} used.`);
    bF.disabled=N+50>S+DIST;bS.disabled=Math.floor(N/100)*100<=S;bG.disabled=N>=S+DIST;
  }
  bF.onclick=()=>{N+=50;paint();say.innerHTML=dual(`Fifty more lines stand, up to line ${N}. Every echo for them is held, in case a change of office calls for it.${N+50>S+DIST?" <span class='bad'>No more numbers are allowed until a checkpoint settles.</span>":""}`,`Fifty more requests commit, up to number ${N}. Every message for them is held, in case a view change calls for it.${N+50>S+DIST?" <span class='bad'>No more numbers are allowed until a checkpoint becomes stable.</span>":""}`)};
  bS.onclick=()=>{const to=Math.floor(N/100)*100;S=to;paint();say.innerHTML=dual(`Each steward sealed a summary of their copy up to <b>${to}</b>. Three matching summaries settle the checkpoint: at least two honest stewards have the same scroll up to there. Every echo for lines up to ${to} is thrown away, and the allowed numbers move up.`,`Each replica signed a summary of its state up to <b>${to}</b>. Three matching summaries make the checkpoint stable: at least two honest replicas have the same state up to there. Every message for numbers up to ${to} is discarded, and the allowed numbers move up.`)};
  bB.onclick=()=>{say.innerHTML=dual(`<span class="bad">Refused.</span> Line 1,000,000 lies far beyond the last settled checkpoint plus ${DIST}. A writer cannot use up the numbers by jumping to an enormous one.`,`<span class="bad">Refused.</span> Number 1,000,000 lies far beyond the last stable checkpoint plus ${DIST}. A primary cannot use up the numbers by jumping to an enormous one.`)};
  bG.onclick=()=>{N++;paint();say.innerHTML=dual(`Line ${N} lies between the last settled checkpoint and ${S+DIST}, so it is allowed.`,`Number ${N} lies between the last stable checkpoint and ${S+DIST}, so it is allowed.`)};
  bR.onclick=()=>{N=0;S=0;paint();say.innerHTML=dual("Nothing is written yet. The allowed numbers run two hundred beyond the last settled checkpoint.","Nothing is executed yet. The water marks run two hundred beyond the last stable checkpoint.")};
  paint();
})();

/* ===== scrollytelling: one line, from petition to standing ===== */
(function(){
  const svg=$("#echosvg"),side=$("#echoside");
  const nodes={1:[-135,"S1",BC[1],"R1"],2:[-45,"S2",BC[2],"R2"],3:[45,"S3",BC[3],"R3"],4:[135,"S4",BC[4],"R4"]};
  let P,items=[],cur=0;
  /* the rule: every note is a row, sent at s and taken in at r */
  const HOLD=1,M=[];
  M.push({kind:"file",a:2,b:1,s:1.4,r:2.4});
  [2,3,4].forEach(b=>M.push({kind:"num",a:HOLD,b,s:2.4,r:3.4,held:b===4}));
  [2,3].forEach(a=>[1,2,3].filter(b=>b!==a).forEach(b=>M.push({kind:"first",a,b,s:3.4,r:4.4})));
  [1,2,3].forEach(a=>[1,2,3].filter(b=>b!==a).forEach(b=>M.push({kind:"second",a,b,s:4.4,r:5.4})));
  /* what each steward holds at moment T, by the rules of the book */
  function know(k,T){
    const has=k===HOLD?T>=2.4:M.some(m=>m.kind==="num"&&m.b===k&&!m.held&&m.r<=T);
    const fe=M.filter(m=>m.kind==="first"&&m.b===k&&m.r<=T).map(m=>m.a),own1=k!==HOLD&&k!==4&&has&&T>=3.4;
    const first=fe.length+(own1?1:0),ready=has&&first>=2&&k!==4;
    const se=M.filter(m=>m.kind==="second"&&m.b===k&&m.r<=T).length,own2=ready&&T>=4.4,second=se+(own2?1:0);
    return {has,first,ready,second,stands:ready&&second>=3};
  }
  const Ts=[2.4,3.4,3.4,4.4,4.4,5.4];
  function card(k,s){
    const T=Ts[s],K=know(k,T),role=k===HOLD?dual("writer","primary"):"";
    const note=[];
    if(k===4)return `<div class="hc dim"><h5><span><i class="dot" style="background:${BC[k]}"></i>${dual("Steward 4","R4")}</span></h5><div class="chk">${s>=1?dual("Messenger delayed across the floor. Nobody waits for them.","Messages delayed. Nobody waits for them."):", "}</div></div>`;
    if(s===0&&k===2)note.push(dual("petitioned the line","submitted the request"));
    note.push(K.has?(k===HOLD?dual("has numbered it","has numbered it"):dual("holds the numbering","holds the pre-prepare")):dual("no numbering yet","no numbering yet"));
    if(s>=2)note.push(dual(`first echoes ${Math.min(K.first,2)} of 2`,`prepares ${Math.min(K.first,2)} of 2`));
    if(s>=3&&K.ready)note.push(dual("readied","prepared"));
    if(s>=4)note.push(dual(`second echoes ${Math.min(K.second,3)} of 3`,`commits ${Math.min(K.second,3)} of 3`));
    if(K.stands)note.push(dual("<b>stands</b>","<b>committed</b>"));
    return `<div class="hc${K.stands?" done":""}"><h5><span><i class="dot" style="background:${BC[k]}"></i>${dual("Steward "+k,"R"+k)}</span><span>${role}</span></h5><div class="chk">${note.join("<br>")}</div></div>`;
  }
  const apply=s=>{cur=s;
    items.forEach(it=>it.e.classList.toggle("on",s>=it.from&&s<=it.to));
    side.innerHTML=[1,2,3,4].map(k=>card(k,s)).join("");
  };
  /* drawn in the round, or on lanes in computing, at the step the reader has reached */
  Timeline(svg,{vb:"0 0 620 600",cx:310,cy:300,r0:46,step:34,rings:7,tEnd:6.6,note:[14,24],nodes},Q=>{P=Q;items=[];
  const defs=$("defs",svg);
  [["o","#a8741a"],["g","#5f6e28"]].forEach(([k,c])=>{const m=el("marker",{id:`${svg.id}-${k}`,markerWidth:9,markerHeight:9,refX:7.5,refY:3.2,orient:"auto"},defs);el("path",{d:"M0,0 L7.5,3.2 L0,6.4 z",fill:c},m)});
  /* the picture: each mark appears at one step and stays */
  const add=(e,from,to=99)=>{e.classList.add("fade");items.push({e,from,to});return e};
  const dot=(k,t,fill,from)=>add(P.event(k,t,fill,9),from);
  const lbl=(k,t,s,from,to,col,sm)=>{
    const [x,y]=P.pt(k,t);
    const anchor=P.lanes?"middle":(x<P.cx-20?"end":x>P.cx+20?"start":"middle");
    const dx=P.lanes?0:(anchor==="end"?-12:anchor==="start"?12:0);
    const dy=P.lanes?-14:(y<P.cy?-14:16);
    dtext(P.over,{class:"lab halo",x:x+dx,y:y+dy},s,sm===undefined?s:sm).forEach(t2=>{
      t2.style.textAnchor=anchor;if(col)t2.style.fill=col;add(t2,from,to)});
  };
  const slip=(m,from,col,mk,dash)=>{const p=P.slip(m.a,m.s,m.b,m.r,12);p.setAttribute("style",`stroke:${col};stroke-width:3.4`);p.setAttribute("marker-end",`url(#${svg.id}-${mk})`);if(dash)p.style.strokeDasharray="7 5";return add(p,from)};
  /* who holds the office: at the center in polar, beside R1's lane in computing */
  if(P.lanes){const [x,y]=P.pt(1,0);dtext(P.over,{class:"lab halo",x:x+4,y:y-24,style:"text-anchor:start"},"writer","primary")}
  else dtext(P.over,{class:"lab halo",x:292,y:261,style:"text-anchor:end"},"writer","primary");
  dot(2,1.4,"#fffaf0",0);M.filter(m=>m.kind==="file").forEach(m=>slip(m,0,"#136f9e","b"));lbl(2,1.4,"petitions",0,0,undefined,"submits");
  dot(1,2.4,"#fffaf0",1);lbl(1,2.4,"no. 7",1,1,"#bf4a26");
  M.filter(m=>m.kind==="num").forEach(m=>slip(m,1,"#bf4a26","r",m.held));
  lbl(4,4.9,"delayed across the floor",1,99,undefined,"delayed");
  [2,3].forEach(k=>dot(k,3.4,"#fffaf0",2));
  M.filter(m=>m.kind==="first").forEach(m=>slip(m,2,"#a8741a","o"));
  [1,2,3].forEach(k=>dot(k,4.4,"#e0b84a",3));lbl(2,4.4,"readied",3,3,undefined,"prepared");
  M.filter(m=>m.kind==="second").forEach(m=>slip(m,4,"#5f6e28","g"));
  [1,2,3].forEach(k=>dot(k,5.4,"#9cb648",5));lbl(2,5.4,"stands",5,5,"#2f5a1c","committed");
    apply(cur);
  });
  scrolly($("#echo"),apply);
})();

REG.start();
})();
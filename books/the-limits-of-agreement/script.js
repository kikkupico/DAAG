"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,Polar,Timeline,Unfold}=BOOK;
const {isM,dual,vis,dtext,onReg}=REG;
const GL={H:"0",A:"1","0":"0","1":"1"};   /* initial opinion: blue (H, 0) or red (A, 1); the allegory shows paint, the computing register 0 or 1 */
const PAINT={H:"#136f9e",A:"#bf4a26"};
BOOK.init();

/* the four legislators in the Chamber, one neutral grey, told apart by bench and number (colour is the thing being decided) */
const GREY="#b4b4b4";
const TC={1:GREY,2:GREY,3:GREY,4:GREY};
const yesno=ok=>ok?"<span class='ok'>✓</span>":"<span class='bad'>✗</span>";
const legChip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${TC[k]}"></i>${dual("Legislator "+k,"P"+k)}</span>`;
const tentChip=legChip;

/* ===== the Chamber, seen from above: circular marble hall, colonnade, meridian line and benches ===== */
function Chamber(svg){
  const cx=235,cy=235,R=145,A={1:225,2:135,3:315,4:45}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5,class:"i"},svg);
  el("circle",{cx,cy,r:190,fill:"none",stroke:"#1c1512","stroke-width":2.5,class:"i"},svg);
  el("circle",{cx,cy,r:105,fill:"none",stroke:"#8c7e68","stroke-width":1.5,class:"i"},svg);
  /* bronze meridian line */
  el("line",{x1:cx,y1:cy-185,x2:cx,y2:cy+185,stroke:"#c89234","stroke-width":2.5,"stroke-dasharray":"6 4",class:"i"},svg);
  /* door to the olive grove */
  el("rect",{x:cx-28,y:cy+185,width:56,height:26,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3,class:"i"},svg);
  el("text",{x:cx,y:cy+203,class:"lab i",style:"font-size:10px;text-anchor:middle;fill:#6b5a48"},svg).textContent="door to grove";
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const H={svg,cx,cy,R,A,under,over,tent:{},
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:12,fill,stroke:"#1c1512","stroke-width":2.5},g);if(PAINT[glyph])el("circle",{class:"i",r:5.5,style:`fill:${PAINT[glyph]}`},g);dtext(g,{},"",GL[glyph]||glyph);return g},
    /* a messenger u of the way from bench a to bench b across the black-and-white marble floor */
    fly(g,a,b,u){const d=((A[b]-A[a]+540)%360)-180;H.put(g,...H.at(A[a]+d*u,R-(d>0?24:46)*Math.sin(Math.PI*u)))},
    state(k,i,m){const t=H.tent[k].st;t[0].textContent=i;t[1].textContent=i&&(m||i)},
    badge(k,s){const b=H.tent[k].badge;b.setAttribute("opacity",s?1:0);b.t[0].textContent="";b.t[1].textContent=GL[s]||"";if(PAINT[s])b.paint.style.fill=PAINT[s]}
  };
  for(const k of [1,2,3,4]){const a=A[k]*Math.PI/180,[x,y]=H.at(A[k]),g=el("g",{class:"site"},sites);H.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:TC[k]},g);dtext(g,{},"L"+k,"P"+k);
    const st=dtext(g,{class:"state halo",x:-48*Math.cos(a),y:-46*Math.sin(a)},"","");
    const badge=el("g",{class:"badge",opacity:0,transform:`translate(${(38*Math.cos(a)).toFixed(1)} ${(34*Math.sin(a)).toFixed(1)})`},g);el("circle",{class:"m",r:11},badge);badge.paint=el("circle",{class:"i",r:11},badge);badge.t=dtext(badge,{},"","");
    H.tent[k]={x,y,g,st,badge}}
  return H;
}
const Hill=Chamber;

/* cover:start */
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · AN EXECUTION THAT NEVER DECIDES","FLP");
  const R=rnd32(5),xs=[62,126,190,254,318,382,446],ys=[238,214,256,224,260,228,246];
  const biv=(x,y,r)=>{const n=el("g",{transform:`translate(${x} ${y})`},g);
    el("path",{d:`M0 ${-r}A${r} ${r} 0 0 0 0 ${r}Z`,fill:P.blue},n);el("path",{d:`M0 ${-r}A${r} ${r} 0 0 1 0 ${r}Z`,fill:P.red},n);
    el("circle",{r,fill:"none",stroke:P.ink,"stroke-width":1.8},n);el("line",{y1:-r,y2:r,stroke:"#fff","stroke-width":1.6},n);return n};
  let lx=26;[["0-valent",P.blue],["1-valent",P.red]].forEach(([t,c])=>{dot(g,lx+5,52,5.5,c);T(g,lx+16,52,t,{a:"start",s:10.5,c:P.mute});lx+=t.length*6+36});
  biv(lx+5,52,5.5);T(g,lx+16,52,"bivalent: both outcomes still open",{a:"start",s:10.5,c:P.mute});
  /* the leaves: executions that do decide, hanging off every step */
  xs.forEach((x,i)=>{const y=ys[i];
    for(const [dir,c] of [[-1,"blue"],[1,"red"]]){
      const lx2=x+26+R()*6,ly=y+dir*(62+R()*14);
      link(g,x,y,lx2,ly,{c:"mute",w:1.1,head:false,op:.5,bend:dir*8});
      for(const [ox,oy] of [[16,-13],[18,9]]){link(g,lx2,ly,lx2+ox,ly+dir*Math.abs(oy)+(dir>0?6:-6),{c:"mute",w:.9,head:false,op:.35});dot(g,lx2+ox,ly+dir*Math.abs(oy)+(dir>0?6:-6),3.4,P[c])}
      dot(g,lx2,ly,8,P[c],"#fff")}});
  /* the path that stays bivalent */
  const ps=[];
  for(let i=0;i<6;i++)ps.push(link(g,xs[i],ys[i],xs[i+1],ys[i+1],{c:"gold",w:3.4,head:false,bend:i%2?10:-10}));
  ps.forEach((p,k)=>packet(g,p,{c:"gold",r:3.6,dur:2.4,delay:k*.4}));
  xs.forEach((x,i)=>biv(x,ys[i],i?10.5:12.5));
  ["deliver m₁","m₂","m₃","m₄","m₅"].forEach((t,i)=>{const m=mid(xs[i],ys[i],xs[i+1],ys[i+1],i%2?10:-10);chip(g,m[0],m[1]+(i%2?18:-18),t,{m:1,s:8.5,pad:8,k:P.line,c:P.mute})});
  T(g,xs[6]+0,ys[6]+26,"…",{s:18,c:P.gold,w:700});
  chip(g,W-26,150,"never decides",{a:"end",m:1,s:9.5,k:P.gold,c:"#8a6a00",f:P.goldL});
  /* initial configurations */
  const by=432,cf=["0000","1000","1100","1110","1111"],cc=[P.blue,P.blue,null,P.red,P.red],bx=i=>86+i*84;
  T(g,26,by-34,"initial configurations, one input flipped at a time",{a:"start",s:10,m:1,c:P.mute});
  cf.forEach((t,i)=>{
    const x=bx(i);if(i<4)link(g,x+31,by,bx(i+1)-31,by,{c:"mute",w:1,op:.5});
    el("rect",{x:x-30,y:by-14,width:60,height:28,rx:8,fill:cc[i]?(cc[i]===P.blue?P.blueL:P.redL):P.goldL,stroke:cc[i]||P.gold,"stroke-width":i===2?2:1.4},g);
    T(g,x,by+.5,t,{s:11.5,m:1,w:600,c:cc[i]||"#8a6a00"})});
  const q=el("path",{d:`M${bx(1)-24} ${by+22}V${by+28}H${bx(2)+24}V${by+22}`,fill:"none",stroke:P.mute,"stroke-width":1.2},g);
  T(g,(bx(1)+bx(2))/2,by+42,"neighbours that must split",{s:9.5,m:1,c:P.mute});
  link(g,bx(2),by-16,xs[0]+4,ys[0]+16,{c:"gold",w:1.4,dash:"4 4",bend:-40});
};
COVERS.draw("#coversvg",COVER);COVERS.mount(COVER);
/* cover:end */

/* the four as lanes, for a Chamber picture's computing twin (Unfold in book.js) */
const LANES={1:[225,"L1",TC[1],"P1"],2:[135,"L2",TC[2],"P2"],3:[315,"L3",TC[3],"P3"],4:[45,"L4",TC[4],"P4"]};

/* ===== the first two rules: always blue, and wait for every note ===== */
(function(){
  const H=Chamber($("#plansvg")),L=Unfold(H.svg,{nodes:LANES,span:3.2,vals:GL}),say=$("#plansay"),D=[1,2,3].map(i=>$("#d"+i)),btn=["plan1","plan2","plan3","plannew"].map(i=>$("#"+i));
  const names=[dual("No two commit differently","No two processes decide differently"),dual("A unanimous opinion wins","A shared input wins"),dual("Somebody eventually commits","Some process eventually decides")],T=[1,2,3,4];
  let sight={},toks=[];L.wrap(H);
  const checks=(v,why)=>D.forEach((li,i)=>li.innerHTML=`<b>${names[i]}</b> ${v[i]==null?"":yesno(v[i])}${why[i]?"<br>"+why[i]:""}`);
  const lock=on=>btn.forEach(b=>b.disabled=on);
  function clear(){toks.forEach(g=>g.remove());toks=[];L.reset();T.forEach(k=>{H.state(k,"");H.tent[k].g.classList.remove("out")})}
  function deal(){T.forEach(k=>{sight[k]=rnd(2)?"A":"H";H.badge(k,sight[k])});clear();checks([null,null,null],["","",""]);say.innerHTML=dual("Try a rule, and see which demands it keeps.","Try a protocol, and see which properties it keeps.")}
  /* every legislator in `from` sends their initial opinion to the other three; messengers take as long as they take */
  function birds(from){const ps=[];from.forEach(a=>T.forEach(b=>{if(b===a)return;const g=H.token(TC[a],sight[a]);toks.push(g);H.fly(g,a,b,.12);g.setAttribute("opacity",1);
    ps.push(tween(900+rnd(1900),u=>H.fly(g,a,b,.12+.76*u)).then(()=>g.setAttribute("opacity",0)))}));return Promise.all(ps)}
  btn[0].onclick=()=>{clear();T.forEach(k=>H.state(k,"blue","decides 0"));
    checks([true,false,true],[dual("All four paint it blue.","All four decide 0."),dual("If all four favour red, they still paint it blue.","If every input is 1, they still decide 0."),dual("Everyone commits at once.","Everyone decides at once.")]);
    say.innerHTML=dual("<b>Always blue</b> keeps the first and third demands, and gives up the second.","<b>Always decide 0</b> keeps agreement and termination, and gives up validity.")};
  btn[1].onclick=async()=>{lock(true);clear();checks([null,null,null],["","",""]);say.innerHTML=dual("Every legislator sends their opinion to the other three, and waits until holding all four notes.","Every process sends its input to the other three, and waits until it holds all four inputs.");
    await birds(T);const n=T.filter(k=>sight[k]==="A").length,att=n>=3;T.forEach(k=>H.state(k,att?"red":"blue",att?"decides 1":"decides 0"));
    checks([true,true,true],[dual("All four apply one rule to the same four notes.","All four apply one rule to the same four inputs."),dual(`${n} of the 4 favoured red, so the rule says ${att?"red":"blue"}. If all four favour one colour, all four notes say so, and the rule picks it.`,`${n} of the 4 inputs are 1, so the rule says ${att?1:0}. If every input is the same, all four messages say so, and the rule picks it.`),dual("Everyone commits once the last note arrives.","Everyone decides once the last message is in.")]);
    say.innerHTML=dual("On a session when every legislator stays in the hall, <b>waiting for every note</b> keeps all three demands. The rule used here: paint it red if at least three favour it, otherwise blue.","When no process crashes, <b>waiting for every input</b> keeps all three properties. The rule used here: decide 1 if at least three inputs are 1, otherwise 0.");lock(false)};
  btn[2].onclick=async()=>{lock(true);clear();checks([null,null,null],["","",""]);H.tent[3].g.classList.add("out");L.crash(3);H.state(3,"silent","crashed");say.innerHTML=dual("Suppose Legislator 3 has gone home. The other three send what they hold, and wait for all four notes.","Suppose P3 has crashed and nothing ever comes from it. The other three send their inputs, and wait for all four.");
    await birds([1,2,4]);[1,2,4].forEach(k=>H.state(k,"waits","waiting"));
    checks([true,true,false],[dual("Nobody commits, so no two differ.","Nobody decides, so no two differ."),dual("Nobody paints a colour against a unanimous opinion.","No process decides against a shared input."),dual("Three legislators wait on a member who has gone home, and can never learn that they have left.","Three processes wait on a process that will never answer, and can never learn that it will not.")]);
    say.innerHTML=dual("With one member absent, <b>waiting for every note</b> gives up the third demand. Nobody in the hall can tell this session from one in which Legislator 3's messenger is merely slow.","With one process crashed, <b>waiting for every input</b> gives up termination. None of the other three can tell this execution from one in which P3's message is merely slow.");lock(false)};
  btn[3].onclick=deal;deal();
})();

/* ===== two more rules that go on without one bench: the first three opinions, and one chooser ===== */
(function(){
  const H=Chamber($("#threesvg")),L=Unfold(H.svg,{nodes:LANES,span:7,slide:true,vals:GL}),say=$("#threesay"),D=[1,2,3].map(i=>$("#t"+i)),btn=["three1","three2","three3"].map(i=>$("#"+i));
  const names=[dual("No two commit differently","No two processes decide differently"),dual("A unanimous opinion wins","A shared input wins"),dual("Somebody eventually commits","Some process eventually decides")],T=[1,2,3,4];
  /* opinions divided two against two, so that the bench a legislator misses decides their colour */
  const OP={1:"H",2:"A",3:"A",4:"H"},word={H:"blue",A:"red"},val={H:0,A:1};
  let toks=[];L.wrap(H);
  const checks=(v,why)=>D.forEach((li,i)=>li.innerHTML=`<b>${names[i]}</b> ${v[i]==null?"":yesno(v[i])}${why[i]?"<br>"+why[i]:""}`);
  const lock=on=>btn.forEach(b=>b.disabled=on);
  const paint=(k,s)=>H.state(k,word[s],"decides "+val[s]);
  function clear(){toks.forEach(g=>g.remove());toks=[];L.reset();T.forEach(k=>{H.state(k,"");H.tent[k].g.classList.remove("out");H.badge(k,OP[k])});checks([null,null,null],["","",""])}
  /* a messenger from a to b, carrying glyph, walking from u0 to u1 of the way in ms */
  const walk=(g,a,b,u0,u1,ms)=>tween(ms,u=>H.fly(g,a,b,u0+(u1-u0)*u));
  function send(a,b,glyph){const g=H.token(TC[a],glyph);toks.push(g);H.fly(g,a,b,.12);g.setAttribute("opacity",1);return g}
  const land=(g,a,b,u0,ms)=>walk(g,a,b,u0,.88,ms).then(()=>g.setAttribute("opacity",0));
  /* the first rule: paint the majority of the first three opinions held; four notes are slow, one to each bench,
     and only the quick ones count, so the colours do not hang on the animation */
  btn[0].onclick=async()=>{lock(true);clear();
    say.innerHTML=dual("Every legislator sends their opinion to the other three, and paints as soon as they hold three opinions, their own among them.","Every process sends its input to the other three, and decides as soon as it holds three inputs, its own among them.");
    const SLOW=new Set(["3>1","4>2","1>3","2>4"]),held={};T.forEach(k=>held[k]=[OP[k]]);const ps=[];
    T.forEach(a=>T.forEach(b=>{if(a===b)return;const g=send(a,b,OP[a]),slow=SLOW.has(a+">"+b);
      ps.push(land(g,a,b,.12,slow?4600+rnd(500):900+rnd(900)).then(()=>{if(slow)return;held[b].push(OP[a]);
        if(held[b].length===3){const red=held[b].filter(s=>s==="A").length>=2;paint(b,red?"A":"H")}}))}));
    await Promise.all(ps);
    checks([false,true,true],[dual("Legislators 1 and 4 paint it blue, and Legislators 2 and 3 paint it red.","P1 and P4 decide 0, and P2 and P3 decide 1."),dual("If all four favour one colour, any three opinions agree on it.","If every input is the same, any three inputs agree on it."),dual("Every bench paints after three opinions, even with one member gone home.","Every process decides after three inputs, even with one crashed.")]);
    say.innerHTML=dual("<b>Following the first three opinions</b> keeps the second and third demands, and gives up the first. Each bench missed a different note, and the notes they missed arrived after the paint was dry.","<b>Majority of the first three inputs</b> keeps validity and termination, and gives up agreement. Each process missed a different input, and the late messages were delivered after the decisions.");lock(false)};
  /* the second rule, waiting: the chooser has gone home before choosing */
  btn[1].onclick=async()=>{lock(true);clear();H.tent[1].g.classList.add("out");L.crash(1);H.state(1,"gone home","crashed");
    say.innerHTML=dual("Legislator 1 is to choose, paint their own opinion, and send it to the others. Suppose Legislator 1 has gone home before choosing.","P1 is to choose its own input, decide it, and send it to the others. Suppose P1 has crashed before choosing.");
    [2,3,4].forEach(k=>H.state(k,"waits","waiting"));L.tick(3);await sleep(reduce?0:1800);
    checks([true,true,false],[dual("Nobody paints, so no two differ.","Nobody decides, so no two differ."),dual("The chooser paints their own opinion, so a unanimous opinion wins.","The chooser decides its own input, so a shared input wins."),dual("Three legislators wait for a note that will never come, and cannot tell that it will not.","Three processes wait for a message that will never come, and cannot tell that it will not.")]);
    say.innerHTML=dual("<b>Waiting for the chooser</b> keeps the first two demands, and gives up the third: it is waiting for every note again, with one bench in place of four.","<b>Waiting for P1</b> keeps agreement and validity, and gives up termination: it is waiting for every input again, with one process in place of four.");lock(false)};
  /* the second rule, with a successor: the chooser is present, but their messengers are slow */
  btn[2].onclick=async()=>{lock(true);clear();
    say.innerHTML=dual("Legislator 1 favours blue, paints it, and sends word to the other three. The messengers are slow.","P1 decides its input, 0, and sends it to the other three. The messages are slow.");
    paint(1,"H");const late=[2,3,4].map(b=>({b,g:send(1,b,"H")}));[2,3,4].forEach(k=>H.state(k,"waits","waiting"));
    await Promise.all(late.map(({b,g})=>walk(g,1,b,.12,.4,1300)));
    L.tick(3);await sleep(reduce?0:1600);
    say.innerHTML=dual("After a long while with no note, the others take Legislator 1 for gone. Legislator 2 chooses instead, paints their own opinion, red, and sends word.","After a timeout with no message, P1 is taken for crashed. P2 chooses instead, decides its own input, 1, and sends it.");
    paint(2,"A");await Promise.all([1,3,4].map(b=>land(send(2,b,"A"),2,b,.12,1000+rnd(500)).then(()=>{if(b!==1)paint(b,"A")})));
    await Promise.all(late.map(({b,g})=>land(g,1,b,.4,1200)));
    checks([false,true,true],[dual("Legislator 1 painted blue before anyone gave up on them, and the other three painted red.","P1 decided 0 before the timeout, and the other three decided 1."),dual("Whoever chooses paints their own opinion, so a unanimous opinion wins.","Whoever chooses decides its own input, so a shared input wins."),dual("Everyone paints, even when the chooser has truly gone home.","Everyone decides, even when P1 has truly crashed.")]);
    say.innerHTML=dual("<b>Naming a successor</b> keeps the second and third demands, and gives up the first. Legislator 1 had not gone home: their messengers were only slow, and their notes arrived after Legislator 2 had chosen.","<b>Taking over on timeout</b> keeps validity and termination, and gives up agreement. P1 had not crashed: its messages were only slow, and were delivered after P2 had chosen.");lock(false)};
  clear();say.innerHTML=dual("Neither rule waits for all four benches. Find what each gives up instead.","Neither protocol waits for all four processes. Find what each gives up instead.");
})();

/* ===== two sessions that look the same from legislator 2's bench ===== */
(function(){
  const HA=Chamber($("#worldA")),HB=Chamber($("#worldB")),say=$("#worldsay"),b=$("#worldb");let h=0;
  const LA=Unfold(HA.svg,{nodes:LANES,span:5,slide:true}),LB=Unfold(HB.svg,{nodes:LANES,span:5,slide:true,clock:LA.clock});LA.wrap(HA);LB.wrap(HB);
  [LA,LB].forEach(L=>L.state(2,"desk empty","inbox empty"));
  const t=HA.tent[1];t.g.classList.add("out");LA.crash(1);
  el("path",{d:`M${t.x-17},${t.y-17} L${t.x+17},${t.y+17} M${t.x-17},${t.y+17} L${t.x+17},${t.y-17}`,stroke:"#1c1512","stroke-width":5,fill:"none"},HA.over);
  const rv=HB.token(TC[1],"");rv.setAttribute("opacity",1);HB.fly(rv,1,2,.45);
  const d12=((HB.A[2]-HB.A[1]+540)%360)-180;
  const [px,py]=HB.at(HB.A[1]+d12*.45,HB.R-(d12>0?24:46)*Math.sin(Math.PI*.45));
  dtext(HB.over,{class:"lab halo",x:px+32,y:py+4},"delayed","delayed");
  b.onclick=()=>{h++;LA.tick(.5);tween(500,u=>HB.fly(rv,1,2,.45+.025*Math.sin(u*Math.PI)));
    const hrs=`<b>${h} hour${h>1?"s":""}</b> of waiting. `;
    say.innerHTML=dual(hrs+"Both desks are empty. Nothing Legislator 2 can see, measure or wait for tells the two sessions apart."+(h>=4?" Since no messenger has a guaranteed deadline, waiting longer never turns one session into the other. It only makes the wait longer.":""),hrs+"Both inboxes are empty. Nothing P2 can observe, measure or wait for tells the two executions apart."+(h>=4?" Since there is no bound on message delay, waiting longer never turns one execution into the other. It only makes the wait longer.":""))};
})();

/* ===== separate benches: two runs of deliveries with no legislator in common, in either order ===== */
(function(){
  const stand=$("#foldstand"),say=$("#foldsay"),b12=$("#fold12"),b34=$("#fold34"),br=$("#foldr");
  let done=[],took={},last=null,P;
  const paint=()=>stand.innerHTML=[1,2,3,4].map(k=>`<div>${legChip(k)} ${took[k]?dual(`has received the note from Legislator ${took[k]}`,`has received the message from P${took[k]}`):dual("has received no note yet","has received nothing yet")}</div>`).join("");
  const dot=(k,t)=>{const g=P.event(k,t,"#fffaf0",8);g.classList.add("st-new");g.style.cursor="default"};
  const arc=(a,ta,b,tb)=>P.slip(a,ta,b,tb,12).classList.add("st-new");
  /* one pair's trade, the nth to happen */
  const trade=(a,b,n)=>{const t=1.4+3.1*n;dot(a,t);arc(a,t,b,t+1.1);dot(b,t+1.1);arc(b,t+1.1,a,t+2.2);dot(a,t+2.2)};
  /* drawn in the round, or on lanes in computing, with the trades made so far */
  Timeline($("#foldsvg"),{vb:"0 0 520 480",cx:260,cy:240,r0:40,step:27,rings:7,tEnd:7.4,
    nodes:{1:[225,"L1",TC[1],"P1"],2:[135,"L2",TC[2],"P2"],3:[315,"L3",TC[3],"P3"],4:[45,"L4",TC[4],"P4"]}},Q=>{P=Q;
      /* in the round, each bench's line is named at its outer end too, where the later arcs are drawn */
      if(!isM())[1,2,3,4].forEach(k=>{const [x,y]=Q.pt(k,8.2);const t=el("text",{class:"lab halo",x,y:y+5,style:"font-size:15px;text-anchor:middle"},Q.over);t.textContent="Legislator "+k});
      done.forEach((a,n)=>trade(a,took[a],n))});
  function run(a,b,btn){
    trade(a,b,done.length);
    took[b]=a;took[a]=b;done.push(a);btn.disabled=true;paint();
    if(done.length<2){say.innerHTML=dual(`Legislators ${a} and ${b} trade notes across the floor. Nothing in that touched the other two benches.`,`P${a} and P${b} exchange messages. Nothing in that touched the other two processes.`);return}
    const order=done.join();
    const again=last&&last!==order;
    say.innerHTML=dual(`Now Legislators ${a} and ${b} trade. Every legislator has received the partner's note, and no messenger is left in transit. `+
      (again?"<span class='ok'>It is the same position as last time</span>, when the other pair went first. The notes and the benches they reach are the same; only the moments swapped.":"Start the session again, and let the other pair go first."),
      `Now P${a} and P${b} exchange. Every process has received its partner's message, and no message is left in transit. `+
      (again?"<span class='ok'>It is the same configuration as last time</span>, when the other pair went first. The messages and the processes they reach are the same; only the order of the steps differs.":"Start over, and let the other pair go first."));
    last=order;
  }
  function reset(){P.slips.innerHTML="";P.evs.innerHTML="";done=[];took={};b12.disabled=b34.disabled=false;paint();say.innerHTML=dual("Legislators 1 and 2 have notes to trade, and so have Legislators 3 and 4. Which pair goes first?","P1 and P2 have messages to exchange, and so have P3 and P4. Which pair goes first?")}
  b12.onclick=()=>run(1,2,b12);b34.onclick=()=>run(3,4,b34);br.onclick=reset;reset();
})();

/* ===== the opening that settles nothing: a row of beginnings, one legislator to a line, and the reader tries to close them all ===== */
(function(){
  const box=$("#dusk"),say=$("#dusksay"),T=[1,2,3,4];
  /* beginning j: Legislators 1 to j favour red, the rest blue; the second demand fixes the two ends */
  const B=[0,1,2,3,4].map(n=>T.map(k=>k<=n?"A":"H")),fate=["H","H","H","A","A"];
  const NEXT={H:"A",A:"O",O:"H"},word={H:"blue",A:"red"},val={H:0,A:1};
  const code=j=>B[j].map(s=>GL[s]).join("");
  const verdict=f=>f==="O"?dual("<b>open</b>","<b>bivalent</b>"):dual(`<span class="long">closed for </span><b>${word[f]}</b>`,`<b>${val[f]}</b>-valent`);
  const cls=f=>f==="O"?"open":f==="H"?"hold":"att";
  const and=a=>a.length>1?a.slice(0,-1).join(", ")+" and "+a[a.length-1]:a[0];
  const named=j=>isM()?code(j):j===1?"the beginning where only Legislator 1 favours red":`the beginning where Legislators ${and(T.slice(0,j))} favour red`;
  function render(focus){
    /* the first pair of neighbours closed for opposite colours, if any; they differ in Legislator i+1 */
    const i=fate.findIndex((f,j)=>j<4&&f!=="O"&&fate[j+1]!=="O"&&f!==fate[j+1]),p=i+1,hot=j=>i>=0&&(j===i||j===i+1);
    const cell=(j,inner,c="")=>`<div class="c${c}${hot(j)?" split":""}">${inner}</div>`;
    let h=`<div class="c lg"></div>`+B.map((b,j)=>cell(j,j===0?dual("all blue","0000"):j===4?dual("all red","1111"):dual("&nbsp;",code(j))," hd")).join("");
    T.forEach(k=>{
      h+=`<div class="c lg${i>=0&&k===p?" p":""}">${dual(`<span class="long">Legislator </span><span class="short">L</span>${k}`,"P"+k)}</div>`;
      B.forEach((b,j)=>{const s=b[k-1],home=hot(j)&&k===p;
        h+=cell(j,`<span class="op${home?" home":""}" style="--paint:${PAINT[s]}">${dual(word[s],GL[s])}</span>`)})});
    h+=`<div class="c lg vd">${dual("the rule leaves it","valency")}</div>`;
    h+=fate.map((f,j)=>{const end=j===0||j===4,tag=end?"div":"button";
      const lab=`${isM()?"Configuration "+code(j):"Beginning "+(j+1)+" of 5"}: ${isM()?(f==="O"?"bivalent":val[f]+"-valent"):(f==="O"?"open":"closed for "+word[f])}. Press to change it.`;
      return cell(j,`<${tag} class="vb ${cls(f)}"${end?"":` data-j="${j}" aria-label="${lab}"`}>${verdict(f)}${end?`<small>${dual("by the second demand","by validity")}</small>`:""}</${tag}>`)}).join("");
    box.innerHTML=h;
    $$("button",box).forEach(bt=>bt.onclick=()=>{const j=+bt.dataset.j;fate[j]=NEXT[fate[j]];render(j)});
    if(focus!=null)$(`button[data-j="${focus}"]`,box).focus();
    if(i>=0)say.innerHTML=dual(`<span class="bad">Neighbours closed for opposite colours.</span> The two marked beginnings differ only in what <b>Legislator ${p}</b> favoured. Let Legislator ${p} go home before sending a single note, as one member may. The other three hold the same opinions in both beginnings and receive the same notes, so whatever colour they paint in one, they paint in the other. One of the two cannot be closed the way it is marked. Change one of them.`,
      `<span class="bad">Neighbours univalent for opposite values.</span> The two marked configurations differ only in the input of <b>P${p}</b>. Let P${p} crash before sending a single message. The other three hold the same inputs in both and receive the same messages, so whatever value they decide in one, they decide in the other. One of the two cannot be univalent the way it is marked. Change one of them.`);
    else{const o=fate.map((f,j)=>f==="O"?j:-1).filter(j=>j>=0).map(named),are=o.length>1?"are":"is";
      say.innerHTML=dual(`<span class="ok">No neighbours are closed for opposite colours</span>, but only because ${and(o)} ${are} open. The row has to turn from blue to red somewhere, and the only way across is through an open beginning. However you mark it, the row cannot be closed all the way.`,
        `<span class="ok">No neighbours are univalent for opposite values</span>, but only because ${and(o)} ${are} bivalent. The row has to turn from 0 to 1 somewhere, and the only way across is through a bivalent configuration. However you mark it, the row cannot be univalent all the way.`)}
  }
  render();onReg.push(()=>render());
})();

/* ===== scrollytelling: the note that would settle it can be held back ===== */
(function(){
  const svg=$("#defersvg");svg.setAttribute("viewBox","0 0 640 470");
  const HOLD="#136f9e",ATT="#bf4a26",PLAIN="#f3ead0",X=[110,250,390,530],YT=200,YB=350;
  const m=el("marker",{id:"defer-k",markerWidth:9,markerHeight:9,refX:7.5,refY:3.2,orient:"auto"},el("defs",{},svg));el("path",{d:"M0,0 L7.5,3.2 L0,6.4 z",fill:"#1c1512"},m);
  const kinds={open:[HOLD,ATT,""],H:[HOLD,HOLD,"0"],A:[ATT,ATT,"1"],q:["#b9a77e","#b9a77e","?"],plain:[PLAIN,PLAIN,""]};
  function node(x,y){const n=el("g",{class:"gr-node fade",transform:`translate(${x} ${y})`},svg),l=el("path",{d:"M0,-28 A28,28 0 0 0 0,28 z"},n),r=el("path",{d:"M0,-28 A28,28 0 0 1 0,28 z"},n);
    el("circle",{class:"rim",r:28},n);const t=dtext(n,{},"","");n.set=k=>{l.setAttribute("fill",kinds[k][0]);r.setAttribute("fill",kinds[k][1]);t[0].textContent=PAINT[kinds[k][2]]?"":kinds[k][2];t[1].textContent=GL[kinds[k][2]]||kinds[k][2]};return n}
  const arrow=(x1,y1,x2,y2,cls="")=>el("line",{class:"gr-arrow fade "+cls,x1,y1,x2,y2,"marker-end":"url(#defer-k)"},svg);
  const label=(x,y,s,m,anchor)=>{const t=dtext(svg,{class:"gr-lab fade",x,y},s,m);if(anchor)t.forEach(e=>e.style.textAnchor=anchor);return t};
  const mark=(x,y,ok)=>{const t=el("text",{class:(ok?"gr-ok":"gr-x")+" fade",x,y},svg);t.textContent=ok?"✓":"✗";return t};
  const box=el("rect",{class:"gr-box fade",x:X[1]-46,y:YT-46,width:X[2]-X[1]+92,height:YB-YT+92,rx:14},svg);
  const right=[0,1,2].map(i=>arrow(X[i]+34,YT,X[i+1]-38,YT)),down=X.map(x=>arrow(x,YT+34,x,YB-38));
  const top=X.map(x=>node(x,YT)),bot=X.map(x=>node(x,YB));
  const l0=label(X[0]+46,YT+6,"one note is waiting to be delivered","one message is waiting to be delivered","start"),lt=label(320,YT-56,"the session goes on while the note waits","the execution goes on while the message waits"),ld=label(X[0]+12,(YT+YB)/2+6,"the note is delivered","the message is delivered","start");
  const below=arrow(X[1]+34,YB,X[2]-38,YB),bx=mark(320,YB-24,false);
  const quiet=node(320,64),qa=arrow(X[1]+16,YT-34,302,92,"dash"),ql=label(398,58,"the other three finish","the other three finish","start"),ql2=label(398,80,"without that member: open still","without that process: bivalent still","start"),qx=mark(372,64,false),ok=mark(X[1]+46,YB-30,true);
  quiet.set("open");
  /* the key along the bottom */
  [["H","settled for blue","0-valent",40],["A","settled for red","1-valent",235],["open","open","bivalent",445]].forEach(([k,s,m,x])=>{const n=node(x,440);n.setAttribute("transform",`translate(${x} 440) scale(.42)`);n.set(k);n.classList.add("on");n.lastChild.textContent=n.lastChild.previousSibling.textContent="";label(x+20,445,s,m,"start").forEach(e=>e.classList.add("on"))});
  const on=(e,v)=>[].concat(e).forEach(x=>x.classList.toggle("on",!!v));
  scrolly($("#defer"),s=>{
    top.forEach((n,i)=>{on(n,i===0||s>=1);n.set(i===0?"open":"plain")});
    bot.forEach((n,i)=>{on(n,s>=1);n.set(s<2?"q":s<6?"HHAA"[i]:i===1?"open":"q")});
    right.forEach(a=>on(a,s>=1));down.forEach(a=>on(a,s>=1));
    on(l0,s===0);on(lt,s>=1&&s!==5);on(ld,s>=1);on(box,s>=3&&s<6);
    on(below,s===4);on(bx,s===4);[quiet,qa,ql,ql2,qx].forEach(e=>on(e,s===5));on(ok,s===6);
  });
})();

/* ===== a fair session in which nothing is settled; and the same session once messengers have a deadline ===== */
(function(){
  const H=Chamber($("#nightsvg")),L=Unfold($("#nightsvg"),{nodes:LANES,span:10,slide:true}),qEl=$("#nightq"),say=$("#nightsay"),mode=$("#nightmode"),nA=$("#narr"),nL=$("#naloft"),nC=$("#ncom"),bRun=$("#nightrun"),bB=$("#nightbound"),bR=$("#nightreset"),T=[1,2,3,4];
  let queue=[],aloft=[],arr=0,com=0,timer=null,want=false,busy=false,seq=0,gen=0;L.wrap(H);
  function paint(){qEl.innerHTML=dual("The queue: ","The queue: ")+queue.map((k,i)=>legChip(k,i?"":' style="box-shadow:0 0 0 3px var(--gold)"')).join("");
    nA.textContent=arr;nL.textContent=aloft.length;nC.textContent=com;T.forEach(k=>H.tent[k].g.classList.toggle("turn",want&&k===queue[0]));L.turn(want?queue[0]:null)}
  function send(a,quick){let b;do{b=1+rnd(4)}while(b===a);const r={a,b,n:seq++,u:.4+Math.random()*.2,g:H.token(TC[a],"")};aloft.push(r);H.fly(r.g,a,b,.12);r.g.setAttribute("opacity",1);
    return tween(quick?0:600,u=>H.fly(r.g,a,b,.12+(r.u-.12)*u))}
  const land=r=>tween(600,u=>H.fly(r.g,r.a,r.b,r.u+(.88-r.u)*u)).then(()=>r.g.remove());
  function stop(){clearInterval(timer);timer=null}
  function go(){if(!timer&&want){turn();timer=setInterval(turn,1700)}}
  /* the legislator at the head of the queue takes in the note longest in transit for their bench, or waits */
  async function turn(){
    if(busy)return;busy=true;const g0=gen,k=queue[0],r=aloft.filter(x=>x.b===k).sort((x,y)=>x.n-y.n)[0];
    if(r){aloft.splice(aloft.indexOf(r),1);say.innerHTML=dual(`<b>Legislator ${k}</b> receives the note longest in transit for their bench, from Legislator ${r.a}, and dispatches one more. The session is open still.`,`<b>P${k}</b> receives the message that has been in transit longest for it, from P${r.a}, and sends one more. The configuration is bivalent still.`);
      await land(r);if(g0!==gen)return;arr++;await send(k)}
    else{say.innerHTML=dual(`No note is waiting for <b>Legislator ${k}</b>. The legislator checks their empty desk and sits back. The session is open still.`,`Nothing is waiting for <b>P${k}</b>. It takes a step with an empty inbox. The configuration is bivalent still.`);L.step(k,.7);await sleep(700)}
    if(g0!==gen)return;queue.push(queue.shift());paint();busy=false;
  }
  function reset(){gen++;stop();want=busy=false;aloft.forEach(r=>r.g.remove());L.reset();queue=[1,2,3,4];aloft=[];arr=com=0;T.forEach(k=>{H.state(k,"");send(k,true)});
    mode.innerHTML=dual("not yet begun","not yet started");say.innerHTML=dual("No legislator is starved of a turn, and every note is delivered at last.","No process is starved of a turn, and every message is delivered at last.");bRun.disabled=bB.disabled=false;paint()}
  bRun.onclick=()=>{want=true;bRun.disabled=true;mode.innerHTML=dual("open, and staying open","bivalent, and staying bivalent");paint();go()};
  bB.onclick=async()=>{const g0=++gen;stop();want=false;busy=true;bRun.disabled=bB.disabled=true;paint();mode.innerHTML=dual("messengers have a deadline","messages have a maximum delay");
    say.innerHTML=dual("Now no messenger is ever crossing longer than a deadline all four know. Each legislator waits that long.","Now no message is ever in transit longer than a time all four know. Each process waits that long.");
    await sleep(1200);if(g0!==gen)return;const n=aloft.length;await Promise.all(aloft.map(land));if(g0!==gen)return;
    aloft=[];arr+=n;com=4;T.forEach(k=>H.state(k,"commits","decides"));mode.innerHTML=dual("closed","univalent");paint();
    say.innerHTML=dual("When that deadline passes, an empty desk means something: every note dispatched has arrived, so an absent legislator has truly gone home. <span class='ok'>All four can apply one rule to the same notes, and commit.</span>","When that time has passed, an empty inbox means something: every message that was sent has arrived, so a silent process has crashed. <span class='ok'>All four can apply one rule to the same inputs, and decide.</span>")};
  bR.onclick=reset;
  /* it runs while the picture is on screen, in either register */
  new IntersectionObserver(es=>{if(es[0].isIntersecting)go();else stop()},{threshold:.1}).observe($("#nightsvg").parentElement);
  reset();
})();

REG.start();
})();

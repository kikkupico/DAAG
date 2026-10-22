"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,mapPairs,Polar}=BOOK;
const {isM,dual,vis,dtext,onReg}=REG;
BOOK.init();


/* Schedia's five legislators, told apart by colour */
const WHO={O:{n:"Okios",m:"R1",gm:"R1",g:"Ο",c:"#8fa3b8"},L:{n:"Liskovia",m:"R2",gm:"R2",g:"Λ",c:"#e8b03a"},K:{n:"Kleon",m:"R3",gm:"R3",g:"Κ",c:"#8fb35a"},M:{n:"Melissa",m:"R4",gm:"R4",g:"Μ",c:"#cf5a4a"},T:{n:"Theron",m:"R5",gm:"R5",g:"Θ",c:"#b3aea4"}};
const ALL=["O","L","K","M","T"];
const who=k=>`<span class="who"><i style="background:${WHO[k].c}"></i>${dual(WHO[k].n,WHO[k].m)}</span>`;
/* a note on a bench, said again for computing */
const M_=s=>s.replace(/board/g,"view").replace(/to line/g,"to record").replace(/smooth wax/g,"state lost").replace(/on the porch/g,"cut off").replace(/\bline\b/g,"record");
const yes=ok=>ok?"<span class='ok'>✓</span>":"<span class='bad'>✗</span>";
$("#cast").innerHTML=ALL.map(who).join("");

/* ===== the Tholos, seen from above: the podium at the centre, five benches round the wall, the porch door below ===== */
function Tholos(svg,o={}){
  const cx=220,cy=215,rr=204,R=138,A={O:-90,L:-18,K:54,M:126,T:198};
  svg.innerHTML="";svg.setAttribute("viewBox","0 0 440 470");
  el("circle",{cx,cy,r:rr,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5,class:"i"},svg);
  el("circle",{cx,cy,r:R+36,fill:"none",stroke:"#b5602c","stroke-width":3,"stroke-dasharray":"3 8",class:"i"},svg);
  el("rect",{x:cx-26,y:cy+rr-2,width:52,height:26,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3,class:"i"},svg);
  el("text",{x:cx,y:cy+rr+42,class:"lab i",style:"font-size:12px"},svg).textContent="the porch";
  const under=el("g",{},svg),pod=el("g",{class:"podium"},svg),seats=el("g",{},svg),over=el("g",{},svg);
  const disc=el("circle",{cx,cy,r:34,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":4},pod),bt=dtext(pod,{x:cx,y:cy},"","");
  const T={svg,cx,cy,under,over,seat:{},porch:[cx,cy+rr+12],
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    pos(k){return k==="P"?[cx,cy]:k==="porch"?T.porch:[T.seat[k].x,T.seat[k].y]},
    token(fill,glyph,gm){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:12,fill,stroke:"#1c1512","stroke-width":2.5},g);dtext(g,{},glyph,gm===undefined?glyph:gm);return g},
    /* a runner or a note u of the way from one place to another */
    run(g,a,b,u){const [x1,y1]=T.pos(a),[x2,y2]=T.pos(b);T.put(g,x1+(x2-x1)*u,y1+(y2-y1)*u)},
    board(text,k){bt[0].textContent=text;bt[1].textContent=M_(text);disc.setAttribute("fill",k?WHO[k].c:"#d9cfb4");ALL.forEach(x=>T.seat[x].g.classList.toggle("holder",x===k))},
    note(k,s,m){const t=T.seat[k].s;t[0].textContent=s;t[1].textContent=m===undefined?M_(s):m},
    out(k,on){T.seat[k].g.classList.toggle("out",!!on)}
  };
  ALL.forEach(k=>{const [x,y]=T.at(A[k]),g=el("g",{class:"seat"},seats);T.put(g,x,y);
    el("circle",{class:"ring",r:31},g);el("circle",{class:"b",r:24,fill:WHO[k].c},g);dtext(g,{class:"g"},WHO[k].g,WHO[k].gm);
    const s=dtext(g,{class:"s halo",y:A[k]<0&&A[k]>-180?-34:43},"","");T.seat[k]={x,y,g,s}});
  return T;
}

/* cover:start */
COVERS.draw("#coversvg",(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · ONE PRIMARY, A COMMIT POINT, A VIEW CHANGE","view 6 → 7");
  const Y=[108,160,212,264,316],len=[13,12,12,10,9],sx=104,sw=28,cm=12;
  const nm=["R1","R2","R3","R4","R5"];
  /* the commit line */
  const lxn=sx+cm*sw-2;
  el("rect",{x:sx-6,y:Y[0]-22,width:cm*sw+2,height:Y[4]-Y[0]+44,rx:10,fill:P.blueL,opacity:.28},g);
  el("line",{x1:lxn,x2:lxn,y1:Y[0]-30,y2:Y[4]+26,stroke:P.ink,"stroke-width":1.5,"stroke-dasharray":"5 4"},g);
  chip(g,lxn-20,Y[0]-40,"commit point · record 12",{m:1,s:9,k:P.ink,sw:1.2});
  Y.forEach((y,j)=>{
    const cut=j===4,pr=j===0;
    node(g,38,y,14,nm[j],{s:10.5,k:cut?P.red:pr?P.blue:P.ink,c:cut?P.red:pr?P.blue:P.ink,f:cut?P.redL:pr?P.blueL:"#fff"});
    for(let s=1;s<=len[j];s++){const c=s<=cm,x=sx+(s-1)*sw;
      el("rect",{x,y:y-11,width:sw-4,height:22,rx:5,fill:cut?"#fff":c?P.blueL:P.goldL,stroke:cut?P.red:c?P.blue:P.gold,"stroke-width":1.2,"stroke-dasharray":cut?"3 3":null},g);
      if(s>cm-2&&s<=len[j]||s===1)T(g,x+(sw-4)/2,y+.5,String(s),{s:8.5,m:1,c:cut?P.red:c?P.blue:"#8a6a00"})}});
  chip(g,sx+13*sw+4,Y[0],"draft",{a:"start",m:1,s:8,pad:8,k:P.gold,c:"#8a6a00",f:P.goldL});
  chip(g,sx+9*sw+8,Y[4],"cut off",{a:"start",m:1,s:8,pad:8,k:P.red,c:P.red,f:P.redL});
  /* the primary's replies, then silence */
  /* quorum intersection */
  const qy=396,xs=[88,150,212,274,336];
  el("ellipse",{cx:150,cy:qy,rx:92,ry:26,fill:P.blueL,opacity:.6,stroke:P.blue,"stroke-width":1.4,"stroke-dasharray":"4 3"},g);
  el("ellipse",{cx:274,cy:qy,rx:92,ry:26,fill:P.goldL,opacity:.6,stroke:P.gold,"stroke-width":1.4,"stroke-dasharray":"4 3"},g);
  xs.forEach((x,k)=>{node(g,x,qy,12,"R"+(k+1),{s:9,k:k===2?P.ink:P.faint,c:k===2?P.ink:P.mute,sw:k===2?2:1.4})});
  T(g,212,qy+44,"any two majorities share a replica",{s:9.5,m:1,c:P.mute});
  /* the view change */
  const vx=384;
  chip(g,vx,372,"view 6 · primary R1",{a:"start",m:1,s:9,k:P.line,c:P.mute});
  link(g,vx+80,382,vx+80,398,{c:"red",w:1.4});T(g,vx+86,390,"silent",{a:"start",s:8,m:1,c:P.red});
  chip(g,vx,408,"view 7 · primary R2",{a:"start",m:1,s:9,k:P.blue,c:P.blue,f:P.blueL,w:600});
  T(g,W/2,H-24,"a new view forms on a majority that holds every committed record",{s:9,m:1,c:P.faint});
});
/* cover:end */

/* ===== when a law passes: on the second word back ===== */
(function(){
  const T=Tholos($("#passsvg")),say=$("#passsay"),bw=$("#pwrite"),pl=$("#pline"),pp=$("#ppass");
  const hold={O:11,L:11,K:11,M:11,T:9},word={L:11,K:11,M:11,T:9},away={T:true},pace={L:800,K:1300,M:2400,T:1800};
  let line=11,passed=11,flying=0;
  T.board("board 6","O");
  function paint(){ALL.forEach(k=>{T.note(k,k==="O"?"":"to line "+hold[k]);T.out(k,away[k])});pl.textContent=line;pp.textContent=passed;bw.disabled=flying>0}
  /* a line has passed when two benches have sent word that they hold it and all before it */
  function count(){const n=Object.values(word).sort((a,b)=>b-a)[1];if(n>passed){passed=n;return true}return false}
  async function runner(k){
    if(away[k]||hold[k]>=line)return;flying++;paint();
    const g=T.token(WHO.O.c,line),carry=line;g.setAttribute("opacity",1);
    await tween(pace[k],u=>T.run(g,"P",k,.2+.62*u));
    if(away[k]){g.remove();flying--;paint();return}
    hold[k]=Math.max(hold[k],carry);paint();g.querySelectorAll("text").forEach(t=>t.textContent="✓");g.firstChild.setAttribute("fill",WHO[k].c);
    await tween(pace[k],u=>T.run(g,k,"P",.2+.62*u));g.remove();
    word[k]=Math.max(word[k],carry);flying--;
    const now=count();paint();
    if(now)say.innerHTML=dual(`${WHO[k].n}'s word is the second to come back for line ${passed}. With Okios, three of five hold it: <span class="ok">line ${passed} has passed</span>, and the petitioner is told it is law.`,`${WHO[k].m}'s acknowledgment is the second to come back for record ${passed}. With R1, three of five hold it: <span class="ok">record ${passed} has committed</span>, and the client is told.`);
    else if(passed>=carry)say.innerHTML=dual(`${WHO[k].n}'s copy catches up to line ${carry}. The line had already passed, so nothing changes.`,`${WHO[k].m}'s copy catches up to record ${carry}. The record had already committed, so nothing changes.`);
    else say.innerHTML=dual(`${WHO[k].n} sends word: up to line ${carry}. One word is not enough. Line ${carry} is still a draft.`,`${WHO[k].m} acknowledges up to record ${carry}. One acknowledgment is not enough. Record ${carry} is still a draft.`);
  }
  bw.onclick=()=>{line++;hold.O=line;const here=["L","K","M","T"].filter(k=>!away[k]);
    say.innerHTML=here.length?dual(`Okios writes line ${line} and gives it to the runners.`,`R1 appends record ${line} and sends it to the backups.`):dual(`Okios writes line ${line}, but no bench is within reach. It stays a draft.`,`R1 appends record ${line}, but no backup is reachable. It stays a draft.`);
    paint();here.forEach(runner)};
  ["L","K","M","T"].forEach(k=>{T.seat[k].g.classList.add("pick");button(T.seat[k].g,`${WHO[k].n}: step out or come back`,()=>{away[k]=!away[k];paint();
    if(away[k])say.innerHTML=dual(`${WHO[k].n} steps out of reach. The tablets stay on the bench.`,`${WHO[k].m} is cut off. Its state stays as it was.`);
    else{say.innerHTML=dual(`${WHO[k].n} is back within reach, and the runner brings every line missed, in order.`,`${WHO[k].m} is reachable again, and the primary sends every record missed, in order.`);runner(k)}})});
  paint();
})();

/* ===== board and line: which mark is the later ===== */
(function(){
  const M=[{b:6,w:"Okios",l:12},{b:6,w:"Okios",l:40},{b:7,w:"Kleon",l:3},{b:7,w:"Liskovia",l:1},{b:7,w:"Liskovia",l:12}],box=$("#marks"),say=$("#marksay");
  const MW={Okios:1,Liskovia:2,Kleon:3},name=m=>dual(`board ${m.b}, ${m.w} · line ${m.l}`,`view ${m.b}, R${MW[m.w]} · record ${m.l}`),nameM=m=>`view ${m.b}, R${MW[m.w]} · record ${m.l}`,nameI=m=>`board ${m.b}, ${m.w} · line ${m.l}`;let sel=[];
  /* boards by count, then by name in the order of the alphabet; under one board, by line */
  const cmp=(x,y)=>x.b-y.b||x.w.localeCompare(y.w)||x.l-y.l,cmpM=(x,y)=>x.b-y.b||MW[x.w]-MW[y.w]||x.l-y.l;
  box.innerHTML=M.map((m,i)=>`<button class="mark" data-i="${i}" aria-pressed="false">${name(m)}</button>`).join("");
  $$("button",box).forEach(bt=>bt.onclick=()=>{const i=+bt.dataset.i;if(sel.length===2||sel.includes(i))sel=[];sel.push(i);
    $$("button",box).forEach(x=>x.setAttribute("aria-pressed",sel.includes(+x.dataset.i)));
    if(sel.length<2){say.innerHTML=dual("Now choose a second mark.","Now choose a second viewstamp.");return}
    let [x,y]=sel.map(i=>M[i]),[xm,ym]=[x,y];if(cmp(x,y)>0)[x,y]=[y,x];if(cmpM(xm,ym)>0)[xm,ym]=[ym,xm];
    const why=x.b!==y.b?`board ${y.b} is the later board, whatever the line numbers`+(x.l>y.l?`. Line ${x.l} is a higher number than line ${y.l}, and still the older mark`:""):x.w!==y.w?`both are board ${y.b}, and ${x.w} comes before ${y.w} in the order of the alphabet`:`under the same board, the higher line is the later`;
    const whyM=xm.b!==ym.b?`view ${ym.b} is the later view, whatever the record numbers`+(xm.l>ym.l?`. Record ${xm.l} is a higher number than record ${ym.l}, and still the older viewstamp`:""):xm.w!==ym.w?`both are view ${ym.b}, and R${MW[xm.w]} comes before R${MW[ym.w]} in the order of the identifiers`:`within the same view, the higher timestamp is the later`;
    say.innerHTML=dual(`<b>${nameI(y)}</b> is the later: ${why}.`,`<b>${nameM(ym)}</b> is the later: ${whyM}.`)});
})();

/* ===== the rule for forming a board, as the long edition states it =====
   Everyone last served under board 6, held by Okios; line 12 passed (Okios, Liskovia, Kleon). */
const HELD={O:12,L:12,K:12,M:10,T:10},PASSED=12;
function mayForm(ans){                       // ans[k]: "with" tablets, "without", or "none" (no answer)
  const w=ALL.filter(k=>ans[k]==="with"),x=ALL.filter(k=>ans[k]==="without");
  const maj=w.length+x.length>=3,c1=w.length>=3,c3=x.length>0&&ans.O==="with";
  /* the second condition needs a lost tablet from an older board; here every bench says board 6 */
  const forms=maj&&(c1||c3);
  let holder=null;
  if(forms){const top=Math.max(...w.map(k=>HELD[k])),best=w.filter(k=>HELD[k]===top);holder=best.includes("O")?"O":best[0]}
  return {maj,c1,c3,forms,holder,w,x};
}
/* try every way the five can answer: a board never forms without the passed line */
(function(){const opts=["with","without","none"];for(let n=0;n<243;n++){const a={};let m=n;ALL.forEach(k=>{a[k]=opts[m%3];m=Math.floor(m/3)});const r=mayForm(a);
  if(r.forms&&HELD[r.holder]<PASSED)throw new Error("a board formed without line 12: "+JSON.stringify(a))}})();
function verdict(r,checks,say){
  checks.innerHTML=`<li><b>A majority has answered</b> ${yes(r.maj)} (${r.w.length+r.x.length} of 5)</li>`+
    `<li><b>First:</b> ${dual("a majority answered with tablets","a majority answered with intact state")} ${yes(r.c1)} (${r.w.length} of 5)</li>`+
    `<li><b>Third:</b> ${dual("same board, and its holder Okios answered with tablets","same view, and its primary R1 answered with intact state")} ${r.x.length?yes(r.c3):dual("· no tablets are lost","· no state is lost")}</li>`;
  say.innerHTML=r.forms?dual(`<span class="ok">Board 7 forms.</span> ${WHO[r.holder].n} shows the latest line${r.holder==="O"?" and held the podium before, so nothing changes but the board":""}, takes the podium holding line ${HELD[r.holder]}, and opens the board with the whole law.`,`<span class="ok">View 7 forms.</span> ${WHO[r.holder].m} shows the latest record${r.holder==="O"?" and was primary before, so nothing changes but the view":""}, becomes primary holding record ${HELD[r.holder]}, and opens the view with its whole log.`)
    :r.maj?dual(`<span class="bad">No board forms.</span> A majority answered, but the answers cannot be sure of showing line 12. The caller waits and calls again.`,`<span class="bad">No view forms.</span> A majority answered, but the answers cannot be sure of showing record 12. The view manager waits and tries again.`)
    :dual(`<span class="bad">No board forms.</span> Fewer than three have answered. The caller waits and calls again.`,`<span class="bad">No view forms.</span> Fewer than three have answered. The view manager waits and tries again.`);
}
(function(){
  const box=$("#formans"),checks=$("#formchecks"),say=$("#formsay"),ex={O:"without",L:"none",K:"none",M:"with",T:"with"};let ans={...ex};
  const lab={with:dual("with tablets","with state"),without:dual("without","without state"),none:dual("out of reach","unreachable")};
  function paint(){box.innerHTML=ALL.map(k=>`<div class="r"><div>${who(k)}</div><div class="seg" role="group" aria-label="${WHO[k].n}'s answer">${Object.keys(lab).map(v=>`<button data-k="${k}" data-v="${v}" aria-pressed="${ans[k]===v}">${lab[v]}</button>`).join("")}</div></div>`).join("");
    $$("button",box).forEach(bt=>bt.onclick=()=>{ans[bt.dataset.k]=bt.dataset.v;paint();$(`button[data-k="${bt.dataset.k}"][data-v="${bt.dataset.v}"]`,box).focus()});
    verdict(mayForm(ans),checks,say)}
  $("#formreset").onclick=()=>{ans={...ex};paint()};paint();
})();

/* ===== scrollytelling: a change of board ===== */
(function(){
  const T=Tholos($("#changesvg")),side=$("#changeside");
  /* how things stand at each step: board and line at each bench, who is out, the board on the post */
  const b6=n=>`6 · ${n}`,b7=n=>`7 · ${n}`;
  const ST=[
    {post:["board 6","O"],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{},n:dual("Okios holds the podium","R1 is the primary")},
    {post:["board 6",null],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{O:1},n:dual("no note from Okios","no message from R1")},
    {post:["board 6",null],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{O:1},n:dual("Liskovia invites all to board 7","R2 invites all to view 7")},
    {post:["board 6",null],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{O:1},n:dual("three answers, all with tablets","three answers, all with intact state")},
    {post:["board 7","L"],h:{O:b6(13),L:b6(12),K:b6(12),M:b6(10),T:b6(10)},out:{O:1},n:dual("Liskovia takes the podium","R2 becomes primary")},
    {post:["board 7","L"],h:{O:b6(13),L:b7(1),K:b7(1),M:b7(1),T:b7(1)},out:{O:1},n:dual("the opening line: the whole law to line 12","the opening record: the whole log to record 12")},
    {post:["board 7","L"],h:{O:b7(1),L:b7(1),K:b7(1),M:b7(1),T:b7(1)},out:{},n:dual("Okios joins board 7; line 13 is smoothed away","R1 joins view 7; record 13 is discarded")}];
  /* notes and runners: from, to, glyph, colour, and where each is at which step */
  const toks=[["L","K","7","L",{2:.5}],["L","M","7","L",{2:.5}],["L","T","7","L",{2:.5,3:.62}],["L","O","7","L",{2:.45}],
              ["K","L","12","K",{3:.55}],["M","L","10","M",{3:.55}],
              ["P","K","1","L",{5:.6}],["P","M","1","L",{5:.6}],["P","T","1","L",{5:.6}],["P","O","1","L",{6:.6}]]
    .map(([a,b,g,c,plan])=>({a,b,plan,g:T.token(WHO[c].c,g),u:.2,run:0,end:Math.max(...Object.keys(plan))}));
  scrolly($("#change"),s=>{const S=ST[s];T.board(S.post[0],S.post[1]);
    ALL.forEach(k=>{T.out(k,S.out[k]);T.note(k,S.h[k])});
    side.innerHTML=ALL.map(k=>`<div class="hc"><h5>${dual(WHO[k].n,WHO[k].m)}</h5><div>${dual(`board ${S.h[k].split(" · ")[0]}, line ${S.h[k].split(" · ")[1]}`,`view ${S.h[k].split(" · ")[0]}, record ${S.h[k].split(" · ")[1]}`)}</div><div class="chk">${S.out[k]?dual("out of reach","unreachable"):k===S.post[1]?dual("holds the podium","primary"):""}</div></div>`).join("")+`<div class="hc" style="grid-column:1/-1;min-height:0"><div class="chk" style="margin:0">${S.n}</div></div>`;
    toks.forEach(k=>{const u=k.plan[s],id=++k.run;
      if(u==null){k.g.setAttribute("opacity",0);k.u=s>k.end?.8:.2;T.run(k.g,k.a,k.b,k.u);return}
      k.g.setAttribute("opacity",1);const u0=k.u;tween(800,e=>{if(k.run!==id)return;k.u=u0+(u-u0)*e;T.run(k.g,k.a,k.b,k.u)})});
  });
})();

/* ===== the holder who has not noticed: lines written on the porch reach nobody who will take them ===== */
(function(){
  const T=Tholos($("#porchsvg")),say=$("#porchsay"),bw=$("#porchwrite"),n=$("#porchn");
  let heard=false,busy=false;const og=T.token(WHO.O.c,WHO.O.g,WHO.O.gm);
  T.board("board 7","L");T.out("O",true);T.note("O","on the porch");
  T.put(og,...T.porch);og.setAttribute("opacity",1);dtext(T.over,{class:"lab halo",x:T.porch[0]+48,y:T.porch[1]+4,style:"font-size:12px;text-anchor:start"},"board 6","view 6");
  function paint(){["L","K","M"].forEach(k=>T.note(k,"board 7"));T.note("T",heard?"board 7":"board 6")}
  T.seat.T.g.classList.add("pick");
  button(T.seat.T.g,"Theron: has he heard of board 7?",()=>{if(busy)return;heard=!heard;paint();n.textContent=1;say.innerHTML=heard?dual("Theron has taken board 7.","R5 has taken view 7."):dual("Theron has not heard of board 7.","R5 has not heard of view 7.")});
  bw.onclick=async()=>{busy=true;bw.disabled=true;let took=1;n.textContent=took;say.innerHTML=dual("Okios writes a line under board 6 and sends it to every bench.","R1 appends a record in view 6 and sends it to every backup.");
    await Promise.all(["L","K","M","T"].map(async k=>{const g=T.token(WHO.O.c,"6");g.setAttribute("opacity",1);
      await tween(1300,u=>T.run(g,"porch",k,.1+.74*u));
      const takes=k==="T"&&!heard;g.querySelectorAll("text").forEach(t=>t.textContent=takes?"✓":"✗");g.firstChild.setAttribute("fill",takes?"#a9c25a":"#fde0d4");if(takes)took++;
      await sleep(900);g.remove()}));
    if(took>=3)throw new Error("a line passed under the old board");
    n.textContent=took;
    say.innerHTML=dual(`Liskovia, Kleon and Melissa have taken board 7 and refuse any note that carries board 6. ${heard?"So does Theron.":"Theron takes the line."} ${took===1?"Only Okios holds it":"Two hold it"}, and a line needs three. <span class="bad">It cannot pass.</span> Board 7 formed on three, which leaves at most one other who might take his lines.`,`R2, R3 and R4 have taken view 7 and refuse any message that carries view 6. ${heard?"So does R5.":"R5 takes the record."} ${took===1?"Only R1 holds it":"Two hold it"}, and a record needs three. <span class="bad">It cannot commit.</span> View 7 formed on three, which leaves at most one other that might take its records.`);
    busy=false;bw.disabled=false};
  paint();
})();

/* ===== wax and stone: who goes home, and whether a board can ever form again ===== */
(function(){
  const T=Tholos($("#waxsvg")),checks=$("#waxchecks"),say=$("#waxsay");let home={};
  T.board("board 6","O");
  function paint(){const ans={};ALL.forEach(k=>{ans[k]=home[k]?"without":"with";T.out(k,home[k]);T.note(k,home[k]?"smooth wax":"to line "+HELD[k])});
    const r=mayForm(ans);verdict(r,checks,say);
    if(!r.forms)say.innerHTML=dual(`<span class="bad">No board forms, tonight or ever.</span> All five have answered, so there is nobody left to wait for, and too few answers can show what passed. The council stops for good. The law is lost, but no board starts without line 12.`,`<span class="bad">No view forms, now or ever.</span> All five have answered, so there is nobody left to wait for, and too few answers can show what committed. The group stops for good. The log is lost, but no view starts without record 12.`)}
  ALL.forEach(k=>{T.seat[k].g.classList.add("pick");button(T.seat[k].g,`${WHO[k].n}: go home or stay`,()=>{home[k]=!home[k];paint()})});
  $("#waxreset").onclick=()=>{home={};paint()};paint();
})();

/* ===== relevance map ===== */
mapPairs($("#map"),[["The council of five, each with a copy of the law","A group of replicas"],["The law; a line","The group's state; one record in the log"],["Slow or lost messengers","A network that loses and delays messages"],["Stepping out","Being cut off for a while"],["Going home","A crash that loses what was in memory"],["The podium and its holder","The primary"],["The benches","The backups"],["A runner who never skips a line","In-order delivery from primary to backup"],["A law passes","An operation is committed: a majority hold it"],["A board","A view"],["Board and line","A viewstamp"],["The roll; the caller","Liveness messages; the member that starts a view change"],["An answer with tablets, or without","An acceptance with state, or after a crash"],["The opening line","The new view's first record: the whole state"],["Wax and the stone","Volatile state, and the little kept on stable storage"]]);
REG.start();
})();

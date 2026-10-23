"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,Unfold}=BOOK;
const {isM,dual,vis,dtext,onReg}=REG;
BOOK.init();

/* the processes, in computing */
const GM={"Α":"P1","Β":"P2","Γ":"P3","Δ":"P4","Ε":"P5","Ζ":"P6","Η":"P7"};
/* a stand-in for one SVG element that is really a pair, one per register */
const pair=ts=>({setAttribute(k,v){ts.forEach(e=>e.setAttribute(k,v))},classList:{toggle(c,on){ts.forEach(e=>e.classList.toggle(c,on))}}});

/* ===== the Chamber, seen from above: one picture reused wherever people sit in the hall ===== */
function Hall(svg,o={}){
  const cx=o.cx||220, cy=o.cy||220, rr=o.rr||204, R=o.R||135;
  svg.innerHTML=""; svg.setAttribute("viewBox",o.vb||"0 0 440 460");
  el("circle",{cx,cy,r:rr,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5,class:"i"},svg);
  el("circle",{cx,cy,r:R+34,fill:"none",stroke:"#b5602c","stroke-width":3,"stroke-dasharray":"3 8",class:"i"},svg);
  el("rect",{x:cx-24,y:cy+rr-2,width:48,height:12,fill:"#6b4a2a",stroke:"#1c1512","stroke-width":3,class:"i"},svg);
  if(o.doorText!==false){const t=el("text",{x:cx,y:cy+rr+26,"text-anchor":"middle","font-size":12,"font-style":"italic",fill:"#6b5a48",class:"i"},svg);t.textContent="the one door"}
  const under=el("g",{},svg), seatsG=el("g",{},svg), over=el("g",{},svg);
  const H={svg,cx,cy,rr,R,under,over,
    at(deg,r=R){const a=deg*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]},
    place(s,x,y){s.x=x;s.y=y;s.g.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`},
    seat(label,color,deg){const g=el("g",{class:"seat"},seatsG);el("circle",{class:"b",r:24,fill:color},g);dtext(g,{},label,GM[label]||label);const s={g,color,deg};H.place(s,...H.at(deg));return s}
  };
  return H;
}


/* cover:start */
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · BALLOTS, VOTES AND A CHOSEN VALUE","Paxos");
  const cols=[2,5,18,27],cx=i=>166+i*88,ry=j=>148+j*46;
  /* the four messages of a ballot */
  [["NextBallot","blue"],["LastVote","blue"],["BeginBallot","green"],["Voted","green"]].forEach(([t,c],k)=>{const x=70+k*112;chip(g,x,56,t,{m:1,s:9,k:P[c],c:P[c],f:"#fff"});if(k<3)link(g,x+46,56,x+112-48,56,{c:"mute",w:1,op:.6})});
  /* the table of ballots */
  cols.forEach((b,i)=>{chip(g,cx(i),100,"ballot "+b,{m:1,s:9.5,k:i===3?P.blue:P.line,c:i===3?P.blue:P.mute,f:i===3?P.blueL:"#fff",w:i===3?600:400})});
  el("rect",{x:cx(3)-42,y:112,width:84,height:ry(4)-ry(0)+52,rx:14,fill:P.blueL,opacity:.35,stroke:P.blue,"stroke-width":1.4,"stroke-dasharray":"5 4"},g);
  const votes={"0,3":"β","2,3":"β","3,3":"β","3,0":"α","2,1":"β","4,1":"β","1,2":"β"};  /* row,col */
  for(let j=0;j<5;j++){
    node(g,52,ry(j),14,"P"+(j+1),{s:10.5});
    lane(g,70,cx(3)+52,ry(j),{w:1});
    cols.forEach((b,i)=>{const v=votes[j+","+i];
      if(v){const c=v==="α"?"gold":"blue";el("rect",{x:cx(i)-20,y:ry(j)-15,width:40,height:30,rx:10,fill:P[c+"L"],stroke:P[c],"stroke-width":i===3?2:1.4},g);T(g,cx(i),ry(j)+.5,v,{s:15,w:700,c:c==="gold"?"#8a6a00":P.blue})}
      else dot(g,cx(i),ry(j),3,P.line)})}
  /* rule three: reuse the highest earlier vote in the quorum */
  const pr=link(g,cx(1)+20,ry(2)+14,cx(3)-24,ry(2)+14,{c:"red",w:1.5,bend:30,dash:"4 3"});packet(g,pr,{c:"red",dur:2.6,r:3.4});
  chip(g,200,ry(4)+30,"highest earlier vote in the quorum → β",{m:1,s:8.5,pad:8,k:P.red,c:P.red,f:"#fff"});
  chip(g,cx(3),ry(4)+30,"quorum P1 · P3 · P4",{m:1,s:8.5,pad:8,k:P.blue,c:P.blue,f:"#fff"});
  /* the log */
  const ly=428;T(g,26,ly-34,"log, slot by slot",{a:"start",s:10,m:1,c:P.mute});
  [["124","a"],["125","noop"],["126","b"],["127","β"],["128","…"]].forEach(([s,v],k)=>{const x=60+k*84,hi=k===3;
    el("rect",{x:x-34,y:ly-14,width:68,height:34,rx:9,fill:hi?P.blueL:k===1?P.goldL:"#fff",stroke:hi?P.blue:k===1?P.gold:P.line,"stroke-width":hi?1.8:1.2},g);
    T(g,x,ly-4,s,{s:8.5,m:1,c:P.faint});T(g,x,ly+10,v,{s:11,m:1,w:600,c:hi?P.blue:k===1?"#8a6a00":P.ink})});
  chip(g,W-26,H-24,"any two majorities share a process",{a:"end",m:1,s:9,k:P.line,c:P.mute});
};
COVERS.draw("#coversvg",COVER);COVERS.mount(COVER);
/* cover:end */

/* ===== consistency: two banquets, in the Chamber ===== */
(function(){
  const H=Hall($("#banq"),{vb:"0 0 440 545"});
  const C=["#e0b84a","#5b9be0","#e2564e","#9cb648","#b58be0","#e89a4d"], gl=["Α","Β","Γ","Δ","Ε","Ζ"];
  const home=[215,270,325,20,70,160], away=[[45,495],[130,495],[215,495],[290,495],[340,495],[390,495]];
  const S=gl.map((l,i)=>H.seat(l,C[i],home[i]));
  /* computing: the two groups on a timeline; a process that is down has no lane for as long as it is down */
  const L=Unfold(H.svg,{nodes:Object.fromEntries(gl.map((g,i)=>[i,[0,g,C[i],GM[g]]])),span:2.8});
  const bn=pair(dtext(H.over,{x:130,y:448,"text-anchor":"middle","font-size":13,"font-style":"italic",fill:"#6b5a48",opacity:0},"at the banquet","stopped"));
  function lbl(s,t,m){s.g.querySelectorAll(".lbl").forEach(x=>x.remove());dtext(s.g,{class:"lbl",y:40},t,m)}
  function reset(){S.forEach((s,i)=>{H.place(s,...(i<3?H.at(home[i]):away[i]));s.g.setAttribute("opacity",i<3?1:0);s.g.classList.remove("clash");s.g.querySelectorAll(".lbl").forEach(x=>x.remove())});bn.setAttribute("opacity",0);
    L.reset();[3,4,5].forEach(i=>L.down(i,true));L.setT(.2)}
  const say=$("#scrsay"),b1=$("#bq1"),b2=$("#bq2"),br=$("#bqr");
  b1.onclick=async()=>{b1.disabled=true;
    [0,1,2].forEach(i=>lbl(S[i],"37: no painting","37: x"));L.setT(.4);[0,1,2].forEach(i=>L.state(i,"37: x"));L.setT(.6);
    say.innerHTML=dual("Three legislators pass decree 37 and write it in their scrolls. Then they leave for a banquet.","Three processes decide slot 37 and write it in their logs. Then they stop.");
    await sleep(reduce?0:1300); [0,1,2].forEach(i=>{H.place(S[i],...away[i]);S[i].g.setAttribute("opacity",.55)}); bn.setAttribute("opacity",1);
    L.setT(1.2);[0,1,2].forEach(i=>L.down(i,true));L.setT(1.4);
    say.innerHTML=dual("The first group is at the banquet. Everyone left in the Chamber knows nothing of decree 37, and that is allowed.","The first group is down. Every process now running knows nothing of slot 37, and that is allowed.");b2.disabled=false};
  b2.onclick=async()=>{b2.disabled=true;
    [3,4,5].forEach(i=>{S[i].g.setAttribute("opacity",1);H.place(S[i],...H.at(home[i]));lbl(S[i],"37: art is free","37: y")});
    L.setT(1.6);[3,4,5].forEach(i=>L.down(i,false));L.setT(1.9);[3,4,5].forEach(i=>L.state(i,"37: y"));L.setT(2.1);
    await sleep(reduce?0:900); S.forEach(s=>s.g.classList.add("clash"));L.band(.3,2.3,"two values in slot 37",true);
    say.innerHTML=dual("<span class='bad'>Two scrolls, two different decrees numbered 37.</span> Consistency is lost for good, because the ink is indelible. Parliament must never let this happen.","<span class='bad'>Two logs, two different values in slot 37.</span> Consistency is lost for good, because decided values are never undone. The protocol must never let this happen.");br.hidden=false};
  br.onclick=()=>{reset();say.innerHTML=dual("Three legislators are in the Chamber, with decree 37 before them. The other three are away.","Three processes are running, with slot 37 before them. The other three are down.");b1.disabled=false;br.hidden=true};
  reset();
})();

/* ===== messenger lottery, across the Chamber ===== */
(function(){
  const H=Hall($("#lane"),{vb:"0 0 440 490"});
  const A=H.seat("Α","#e0b84a",200), B=H.seat("Β","#5b9be0",340);
  const door=[H.cx,H.cy+H.rr+6];
  const voy=pair(dtext(H.over,{x:H.cx,y:480,"text-anchor":"middle","font-size":14,"font-style":"italic",fill:"#bf4a26",opacity:0},"…off on a long voyage","…lost in transit"));
  function mkm(){const g=el("g",{opacity:0},H.over);el("circle",{r:13,fill:"#fffaf0",stroke:"#1c1512","stroke-width":3},g);const t=el("text",{"text-anchor":"middle","dominant-baseline":"central","font-size":14},g);t.textContent="✉";return g}
  const m1=mkm(),m2=mkm(),btn=$("#send"),say=$("#sendsay"),T={ok:0,two:0,lost:0};
  /* computing: each send on a timeline: delivered once, twice, or never, the lost one ending at a cross */
  const L=Unfold(H.svg,{nodes:{A:[0,"Α","#e0b84a","P1"],B:[0,"Β","#5b9be0","P2"]},span:4.4});
  L.svg.style.width="min(100%,560px)";
  const send=ms=>{const r=L.msg("A","B",L.clock.t,null);L.tick(ms/1000);return r};
  function fly(g,p,q,ms){return new Promise(res=>{const t0=performance.now();g.setAttribute("opacity",1);
    (function f(t){const u=Math.min(1,(t-t0)/ms),e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;g.setAttribute("transform",`translate(${p[0]+(q[0]-p[0])*e} ${p[1]+(q[1]-p[1])*e})`);if(u<1)requestAnimationFrame(f);else res()})(t0)})}
  const pa=[A.x+34,A.y+6], pb=[B.x-34,B.y+6];
  btn.onclick=async()=>{
    btn.disabled=true;voy.setAttribute("opacity",0);m1.setAttribute("opacity",0);m2.setAttribute("opacity",0);
    const r=Math.random(),dur=reduce?1:1500;L.reset();L.setT(.2);
    if(r<.4){const x=send(dur);await fly(m1,pa,pb,dur);L.land(x);L.state("B","delivered");m1.setAttribute("opacity",0);T.ok++;say.innerHTML="<b>Delivered, once.</b> The easy case."}
    else if(r<.7){const x=send(dur);await fly(m1,pa,pb,dur);L.land(x);L.state("B","delivered");m1.setAttribute("opacity",0);say.innerHTML="Delivered… ";L.tick(.5);await sleep(reduce?1:500);
      const y=L.msg("A","B",x.t0,null);L.tick(dur/1000);await fly(m2,pa,pb,dur);L.land(y);L.state("B","delivered twice");m2.setAttribute("opacity",0);T.two++;say.innerHTML=dual("<b>Delivered twice.</b> The messenger forgot they'd already been.","<b>Delivered twice.</b> The network duplicated it.")}
    else{const x=send(dur*1.1);await fly(m1,pa,[pa[0]+(pb[0]-pa[0])*.25,pa[1]+(pb[1]-pa[1])*.25],dur*.4);L.lose(x);await fly(m1,[pa[0]+(pb[0]-pa[0])*.25,pa[1]],door,dur*.7);voy.setAttribute("opacity",1);await sleep(reduce?1:700);m1.setAttribute("opacity",0);T.lost++;say.innerHTML=dual("<b>Never arrived.</b> The messenger walked out of the one door and set off on a long voyage. Nobody can tell this from “very slow”.","<b>Never arrived.</b> The message was lost in transit. Nobody can tell this from “very slow”.")}
    $("#t-ok").textContent=T.ok;$("#t-two").textContent=T.two;$("#t-lost").textContent=T.lost;btn.disabled=false};
})();

/* ===== majorities ===== */
(function(){
  const N=7,cx=220,cy=205,R=135; const cols=["#e0b84a","#5b9be0","#e2564e","#9cb648","#b58be0","#e89a4d","#5fbfae"]; const gl=["Α","Β","Γ","Δ","Ε","Ζ","Η"];
  const g=$("#seats"); const seats=[];
  for(let i=0;i<N;i++){
    const a=-Math.PI/2+i*2*Math.PI/N+.2, x=cx+R*Math.cos(a), y=cy+R*Math.sin(a);
    const s=el("g",{class:"seat",transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},g);
    el("circle",{class:"glow",r:33},s); el("circle",{class:"mr ringA",r:30},s); el("circle",{class:"mr ringB",r:30},s);
    el("circle",{class:"b",r:24,fill:cols[i]},s); dtext(s,{},gl[i],GM[gl[i]]);
    el("rect",{class:"ink",x:-9,y:30,width:18,height:22,rx:3},s);
    s.setAttribute("tabindex",0); s.setAttribute("role","button");
    seats.push({el:s,name:gl[i],in:true,A:false,B:false,knows:false});
  }
  const say=$("#majsay"),count=$("#count"),b1=$("#maj1"),b2=$("#maj2");
  function paint(){
    seats.forEach(s=>{s.el.setAttribute("aria-label",isM()?`Process ${GM[s.name]}, ${s.in?"running":"stopped"}`:`Legislator ${s.name}, ${s.in?"in the Chamber":"out of the Chamber"}`);s.el.classList.toggle("out",!s.in);s.el.classList.toggle("inA",s.A);s.el.classList.toggle("inB",s.B);s.el.classList.toggle("both",s.A&&s.B);s.el.classList.toggle("knows",s.knows)});
    const n=seats.filter(s=>s.in).length; count.innerHTML=`<b>${n}</b> of 7 ${dual("in the Chamber","running")} · `+(n>=4?"<span class='ok'>a majority</span>":"<span class='bad'>not a majority</span>");
  }
  onReg.push(paint);
  seats.forEach(s=>{const flip=()=>{s.in=!s.in;paint()};s.el.addEventListener("click",flip);s.el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();flip()}})});
  function pick(pool,k){const a=[...pool];for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,k)}
  let fresh=true;
  b1.onclick=()=>{
    seats.forEach(s=>{s.A=s.B=s.knows=false; if(!fresh)s.in=true});
    const here=seats.filter(s=>s.in);
    if(here.length<4){say.innerHTML=dual(`Only ${here.length} of 7 ${here.length===1?"is":"are"} in the Chamber. <span class='bad'>That is not a majority, so nothing can pass.</span> Call someone back.`,`Only ${here.length} of 7 ${here.length===1?"is":"are"} running. <span class='bad'>That is not a majority, so nothing can be decided.</span> Start someone again.`);paint();return}
    pick(here,4).forEach(s=>{s.A=true;s.knows=true});
    say.innerHTML=dual("Four of those present (blue rings) pass a decree and ink it into their scrolls.","Four of the running processes (blue rings) decide a value and write it to stable storage.");
    fresh=false;b1.disabled=true;b2.disabled=false;paint();
  };
  b2.onclick=()=>{
    b2.disabled=true;
    seats.forEach(s=>{s.in=!s.A}); paint();
    setTimeout(()=>{
      let B; do{B=pick(seats,4)}while(B.every(s=>s.A));
      seats.forEach(s=>{s.B=B.includes(s);s.in=s.B});
      const both=seats.filter(s=>s.A&&s.B).length;
      say.innerHTML=dual(`The first four wander off. A different four (red rings) gather. <b>${both} of them ${both>1?"were":"was"} in the first majority</b> (gold), and ${both>1?"they remember":"that one remembers"} the decree. It could not have been otherwise: two groups of four cannot fit among seven without sharing someone.`,`The first four stop. A different four (red rings) start. <b>${both} of them ${both>1?"were":"was"} in the first majority</b> (gold), and ${both>1?"they remember":"that one remembers"} the value. It could not have been otherwise: two groups of four cannot fit among seven without sharing someone.`);
      paint(); b1.disabled=false; b1.textContent="Try another pair";
    },reduce?0:900);
  };
})();

/* ===== manuscript ===== */
(function(){
  const P=["Α","Β","Γ","Δ","Ε"];
  const B=[{n:2,d:"α",q:["Α","Β","Γ","Δ"],v:["Δ"]},{n:5,d:"β",q:["Α","Β","Γ","Ε"],v:["Γ"]},{n:14,d:"α",q:["Β","Δ","Ε"],v:["Β","Ε"]},{n:27,d:"β",q:["Α","Γ","Δ"],v:["Α","Γ","Δ"]},{n:29,d:"β",q:["Β","Γ","Δ"],v:["Β"]}];
  const body=$("#msrows"),x=$("#msx"); let sel=null;
  function chips(b,hl){return b.q.map(p=>`<span class="pc ${b.v.includes(p)?"v":""} ${hl&&hl.includes(p)?"hl":""}">${dual(p,GM[p])}</span>`).join("")}
  function render(){
    body.innerHTML=B.map(b=>`<tr data-n="${b.n}" tabindex="0" class="${sel===b.n?"sel":""}"><td><b>${b.n}</b></td><td><span class="pc dec">${b.d}</span></td><td>${chips(b)}</td></tr>`).join("");
    $$("tr",body).forEach(tr=>{tr.onclick=()=>{sel=+tr.dataset.n;explain()};tr.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();sel=+tr.dataset.n;explain();$(`tr[data-n="${sel}"]`,body).focus()}}});
  }
  function explain(){
    const b=B.find(b=>b.n===sel);
    const prev=b.q.map(p=>{let best=null;B.forEach(e=>{if(e.n<b.n&&e.v.includes(p)&&(!best||e.n>best.n))best=e});return best?{p,e:best}:null}).filter(Boolean);
    let h;
    if(!prev.length) h=dual(`<b>Ballot ${b.n}</b>: nobody in its quorum had voted before, so it was free to carry <i>any</i> decree.`,`<b>Ballot ${b.n}</b>: nobody in its quorum had voted before, so it was free to carry <i>any</i> value.`);
    else{const latest=prev.reduce((a,c)=>c.e.n>a.e.n?c:a);
      const ok=latest.e.d===b.d?"<span class='ok'>It does.</span>":"<span class='bad'>It doesn't!</span>",done=b.q.every(p=>b.v.includes(p));
      h=dual(`<b>Ballot ${b.n}</b> looks back: `+prev.map(o=>`${o.p} voted in ballot ${o.e.n} (${o.e.d})`).join(", ")+`. The latest is ballot ${latest.e.n}, so ballot ${b.n} <b>must</b> carry <span class="pc dec">${latest.e.d}</span>. `+ok+` <i>(${done?"Everyone voted: this ballot succeeded.":"Not everyone voted, so this ballot has not succeeded."})</i>`,
        `<b>Ballot ${b.n}</b> looks back: `+prev.map(o=>`${GM[o.p]} voted in ballot ${o.e.n} (${o.e.d})`).join(", ")+`. The latest is ballot ${latest.e.n}, so ballot ${b.n} <b>must</b> carry <span class="pc dec">${latest.e.d}</span>. `+ok+` <i>(${done?"Everyone voted: this ballot succeeded.":"Not everyone voted, so this ballot has not succeeded."})</i>`);
      render(); $$("tr",body).find(tr=>+tr.dataset.n===sel).children[2].innerHTML=chips(b,prev.filter(o=>o.e.n===latest.e.n).map(o=>o.p)); }
    if(!prev.length) render();
    $$("tr",body).forEach(tr=>tr.classList.toggle("sel",+tr.dataset.n===sel));
    x.innerHTML=h;
  }
  render();
})();

/* ===== scrollytelling: one ballot, in the Chamber ===== */
(function(){
  const svg=$("#balsvg"); const H=Hall(svg,{vb:"0 0 900 490",cx:235,cy:235,rr:215,R:140,doorText:false}); svg.classList.add("fig");
  const C={A:"#e0b84a",B:"#5b9be0",G:"#e2564e",D:"#9cb648",E:"#b58be0"}, ang={A:200,B:270,G:340,D:40,E:140}, lab={A:"Α",B:"Β",G:"Γ",D:"Δ",E:"Ε"};
  const Q=["A","G","D"], q=["G","D"], all=["A","B","G","D","E"]; const S={}; all.forEach(k=>S[k]=H.seat(lab[k],C[k],ang[k]));
  /* computing: the ballot so far as one timeline, a step to each unit of time and each kind of message a band */
  const L=Unfold(svg,{nodes:Object.fromEntries(all.map((k,i)=>[k,[0,lab[k],C[k],"P"+(i+1)]])),span:6.4});
  const MS=[[1,"NextBallot"],[2,"LastVote"],[4,"BeginBallot"],[5,"Voted"],[6,"Success"]];
  function lanes(s){L.reset();L.turn("A");const at=k=>[k-1+.2,k-.25];
    MS.forEach(([k,lab])=>{if(k<=s)L.band(k-1+.08,k-.1,lab,k===s)});
    if(s>=1){const [a,b]=at(1);Q.filter(k=>k!=="A").forEach(k=>L.msg("A",k,a,b))}
    if(s>=2){const [a,b]=at(2);L.setT(a);Q.forEach(k=>L.state(k,"promised ≥ 27"));L.msg("G","A",a,b,"5, β");L.msg("D","A",a,b,"2, α")}
    if(s>=3){L.setT(2.55);L.state("A","value forced: β")}
    if(s>=4){const [a,b]=at(4);q.forEach(k=>L.msg("A",k,a,b,k==="G"?"27, β":""))}
    if(s>=5){const [a,b]=at(5);L.setT(a);q.forEach(k=>{L.state(k,"voted 27, β");L.msg(k,"A",a,b)})}
    if(s>=6){const [a,b]=at(6);L.setT(a);L.state("A","chose β");["B","G","D","E"].forEach(k=>L.msg("A",k,a,b,k==="B"?"β":""));L.setT(b);["B","E"].forEach(k=>L.state(k,"β"))}
    L.setT(Math.max(.2,s))}
  const O=H.over; const set=(e,on)=>e.classList.toggle("on",!!on);
  const rings={}; Q.forEach(k=>rings[k]=el("circle",{cx:S[k].x,cy:S[k].y,r:36,class:"ring"},H.under));
  const iniT=el("text",{x:S.A.x,y:S.A.y+46,class:"lab"},O); iniT.textContent="initiator";
  const balT=el("text",{x:H.cx,y:H.cy+8,class:"lab fade",style:"font-size:26px;fill:#1c1512"},O); balT.textContent="ballot 27";
  const quT=pair(dtext(O,{x:H.cx,y:H.cy+34,class:"lab fade"},"quorum: Α, Γ, Δ","quorum: P1, P3, P4"));
  const tags={},chips={},sp={},tp={};
  all.forEach(k=>{const [ax,ay]=[S.A.x,S.A.y],[bx,by]=[S[k].x,S[k].y];const d=Math.hypot(bx-ax,by-ay)||1,ux=(bx-ax)/d,uy=(by-ay)/d;
    sp[k]=[ax+ux*40,ay+uy*40]; tp[k]=[bx-ux*40,by-uy*40];
    const [ox,oy]=H.at(ang[k],H.R+52); const c=el("g",{class:"tag fade",transform:`translate(${ox} ${oy})`},O); el("rect",{x:-34,y:-14,width:68,height:28},c); const t=el("text",{},c); t.textContent="27: β"; chips[k]=c;
    if(q.includes(k)){const [px,py]=H.at(ang[k],H.R-56); const g=el("g",{class:"tag fade",transform:`translate(${px} ${py})`},O); el("rect",{x:-32,y:-14,width:64,height:28},g); const tt=el("text",{},g); tt.textContent="≥ 27"; tags[k]=g}});
  {const g=el("g",{class:"tag fade",transform:`translate(${S.A.x} ${S.A.y-50})`},O); el("rect",{x:-32,y:-14,width:64,height:28},g); el("text",{},g).textContent="≥ 27"; tags.A=g}
  // the replies stand beside the hall; a phone has no room for them, and the step cards say the same
  const PG=el("g",{},O), tall=matchMedia("(max-width:640px)");
  function lay(){svg.setAttribute("viewBox",tall.matches?"0 0 470 470":"0 0 900 490");PG.style.display=tall.matches?"none":""}
  tall.addEventListener("change",lay); lay();
  const rt=el("text",{x:520,y:100,class:"lab fade",style:"text-anchor:start"},PG); rt.textContent="The quorum's latest votes";
  const repg={}; [["A","Α: no vote yet","P1: no vote yet"],["G","Γ: ballot 5, decree β","P3: ballot 5, value β"],["D","Δ: ballot 2, decree α","P4: ballot 2, value α"]].forEach(([k,t,m],i)=>{const g=el("g",{class:"reply fade",transform:`translate(520 ${118+i*46})`},PG); el("rect",{width:270,height:36},g); dtext(g,{x:14,y:19},t,m); repg[k]=g});
  const forced=el("g",{class:"fade",transform:"translate(520 290)"},PG);
  el("rect",{width:150,height:70,rx:10,fill:"#e3ecc4",stroke:"#5f6e28","stroke-width":4},forced);
  const fb=el("text",{x:75,y:36,"text-anchor":"middle","dominant-baseline":"central",style:"font-size:40px;fill:#5f6e28"},forced); fb.textContent="β";
  const ft=el("text",{x:520,y:392,class:"lab fade",style:"fill:#5f6e28;font-size:16px;text-anchor:start"},PG); ft.textContent="forced by the latest vote";
  function mk(color,glyph){const g=el("g",{class:"tok",opacity:0},O); el("circle",{r:14,fill:color,stroke:"#1c1512","stroke-width":2},g); const t=el("text",{style:"fill:#1c1512;font-size:16px;text-anchor:middle;dominant-baseline:central;font-weight:700"},g); t.textContent=glyph; return g}
  const tq={},tr={},tpp={},tv={},tt={}; q.forEach(k=>{tq[k]=mk("#fffaf0","?");tr[k]=mk("#8fc4de","·");tpp[k]=mk("#a9c25a","β");tv[k]=mk("#a9c25a","✓")}); all.filter(k=>k!=="A").forEach(k=>tt[k]=mk("#a9c25a","β"));
  function put(g,k,u){const x=sp[k][0]+(tp[k][0]-sp[k][0])*u,y=sp[k][1]+(tp[k][1]-sp[k][1])*u;g.style.transform=`translate(${x}px,${y}px)`}
  const show=(g,on)=>g.setAttribute("opacity",on?1:0);
  function render(s){lanes(s);
    Q.forEach(k=>{set(rings[k],true);set(tags[k],s>=2);set(repg[k],s>=2);set(chips[k],s>=5)});
    q.forEach(k=>{
      show(tq[k],s>=1&&s<2);put(tq[k],k,s>=1?1:0);
      show(tr[k],s>=2&&s<3);put(tr[k],k,s>=2?0:1);
      show(tpp[k],s>=4&&s<5);put(tpp[k],k,s>=4?1:0);
      show(tv[k],s>=5&&s<6);put(tv[k],k,s>=5?0:1)});
    ["B","E"].forEach(k=>S[k].g.setAttribute("opacity",s>=6?1:.4));
    set(balT,true);set(quT,true);set(rt,s>=2);
    repg.G.classList.toggle("hi",s>=3);set(forced,s>=3);set(ft,s>=3);
    set(chips.B,s>=6);set(chips.E,s>=6);
    Object.keys(tt).forEach(k=>{show(tt[k],s>=6&&s<7);put(tt[k],k,s>=6?1:0)});
  }
  const steps=$$("#bal .step"),mark=stepDots($("#bal"),steps);
  render(0); mark(0);
  const so=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ const i=steps.indexOf(e.target); steps.forEach((s,j)=>s.classList.toggle("on",j===i)); mark(i); render(i); } }),{rootMargin:"-45% 0px -45% 0px"});
  steps.forEach(s=>so.observe(s));
})();

/* ===== rival presidents, in the Chamber ===== */
(function(){
  const svg=$("#duelsvg"), log=$("#dlog"), pass=$("#dpassed"), hb=$("#dballot"), mode=$("#duelmode");
  const H=Hall(svg,{vb:"0 0 440 450"});
  const C={A:"#e0b84a",E:"#b58be0",B:"#5b9be0",G:"#e2564e",D:"#9cb648"};
  const S={A:H.seat("Α",C.A,205),E:H.seat("Ε",C.E,335),B:H.seat("Β",C.B,20),G:H.seat("Γ",C.G,160),D:H.seat("Δ",C.D,270)};
  /* computing: the ballots on a timeline that slides as it runs: each start goes to the three as arrows labelled with
     its number, a ballot refused is crossed on its starter's lane, and a ballot that succeeds is marked */
  const L=Unfold(svg,{nodes:{A:[0,"Α",C.A,"P1"],B:[0,"Β",C.B,"P2"],G:[0,"Γ",C.G,"P3"],D:[0,"Δ",C.D,"P4"],E:[0,"Ε",C.E,"P5"]},span:8,slide:true});
  L.svg.style.maxWidth="620px";L.svg.setAttribute("role","img");L.svg.setAttribute("aria-label","Five lanes with real time running left to right: each ballot started goes to P2, P3 and P4 as arrows labelled with its number, a refused ballot is crossed on its starter's lane, and a decided value is ticked");
  const out=(p,lab)=>{const t=L.clock.t;["B","G","D"].forEach((k,i)=>L.msg(p,k,t,t+.6,i?"":lab))};
  const lines=[]; ["A","E"].forEach(p=>["B","G","D"].forEach(k=>{const l=el("line",{x1:S[p].x,y1:S[p].y,x2:S[k].x,y2:S[k].y,stroke:C[p],"stroke-width":3,opacity:.3},H.under);lines.push({p,l})}));
  const meters={}; ["B","G","D"].forEach(k=>{const [x,y]=H.at(S[k].deg,H.R-72);const t=el("text",{x,y,"text-anchor":"middle","dominant-baseline":"central","font-size":14,"font-family":"Optima,sans-serif",fill:"#1c1512"},H.over);t.textContent="promised ≥ 0";meters[k]=t});
  const who={A:"Α",E:"Ε"},whoM={A:"P1",E:"P5"},W=k=>dual(who[k],whoM[k]);
  let ballot=0,passed=0,timer=null,want=false,pres=null,turn="A",phase=0,pending={A:null,E:null};
  function say(h){const d=document.createElement("div");d.innerHTML=h;log.prepend(d);while(log.children.length>40)log.lastChild.remove()}
  function flash(p,on){lines.forEach(o=>{if(o.p===p)o.l.setAttribute("opacity",on?.95:.3)})}
  function setMeters(n){["B","G","D"].forEach(k=>meters[k].textContent="promised ≥ "+n)}
  function tickF(){
    const p=pres||turn, other=p==="A"?"E":"A", nm=W(p);
    if(!pres){
      ballot++;setMeters(ballot);hb.textContent=ballot;flash(p,true);setTimeout(()=>flash(p,false),500);
      out(p,String(ballot));["B","G","D"].forEach(k=>L.state(k,"promised ≥ "+ballot));
      say(`<b>${nm}</b> starts ballot ${ballot}: everyone promises nothing lower.`);
      if(pending[other]!==null){L.mark(other,"✗","#fde0d4");say(`<span class="bad">…${W(other)}'s ballot ${pending[other]} is refused: ${dual("they","it")} already promised ${ballot}.</span>`)}
      pending[p]=ballot;pending[other]=null;turn=other;
    }else{
      if(phase===0){ballot++;setMeters(ballot);hb.textContent=ballot;flash(p,true);out(p,String(ballot));["B","G","D"].forEach(k=>L.state(k,"promised ≥ "+ballot));say(`<b>${nm}</b> starts ballot ${ballot}. Nobody else is starting any.`);phase=1}
      else if(phase===1){const t=L.clock.t;["B","G","D"].forEach(k=>L.msg(k,p,t,t+.6));say(`The quorum votes in ballot ${ballot}.`);phase=2}
      else{passed++;pass.textContent=passed;flash(p,false);L.mark(p,"✓","#c9d98a");L.state(p,"decided "+passed);say(`<span class="ok">${dual(`Ballot ${ballot} succeeded: decree ${passed} is passed.`,`Ballot ${ballot} succeeded: value ${passed} is decided.`)}</span>`);phase=0}
    }
  }
  function go(){if(timer)return;timer=setInterval(()=>{tickF();L.tick(.95)},reduce?500:950)}
  function stop(){clearInterval(timer);timer=null}
  $("#drun").onclick=()=>{if(pres){flash(pres,false);say(dual("<i>Ε no longer accepts that Α is president.</i>","<i>P5 no longer accepts that P1 is leader.</i>"))}pres=null;turn="A";pending={A:null,E:null};S.E.g.setAttribute("opacity",1);L.state("E","");mode.innerHTML=dual("two priests each sure they are in charge","two processes each sure they are leader");want=true;go();$("#drun").disabled=true};
  $("#dpres").onclick=()=>{pres="A";phase=0;pending={A:null,E:null};S.E.g.setAttribute("opacity",.35);L.state("E","waits");mode.innerHTML=dual("Α is president, Ε waits","P1 is leader, P5 waits");say(dual("<i>Α is appointed president. Ε no longer starts ballots.</i>","<i>P1 is appointed leader. P5 no longer starts ballots.</i>"));want=true;go();$("#drun").disabled=false};
  $("#dreset").onclick=()=>{stop();want=false;flash("A",false);flash("E",false);ballot=0;passed=0;pres=null;phase=0;pending={A:null,E:null};turn="A";hb.textContent=0;pass.textContent=0;setMeters(0);log.innerHTML="";L.reset();S.E.g.setAttribute("opacity",1);mode.textContent="no one is in charge";$("#drun").disabled=false};
  new IntersectionObserver(es=>{if(!es[0].isIntersecting)stop();else if(want)go()},{threshold:.1}).observe($("#duel"));
})();

/* ===== parliament: the president asks the Chamber, then fills the gap ===== */
(function(){
  const svg=$("#parsvg"); const H=Hall(svg,{vb:"0 0 900 490",cx:235,cy:235,rr:215,R:140,doorText:false});
  const C={P:"#e0b84a",B:"#5b9be0",G:"#e2564e",D:"#9cb648",E:"#b58be0"}, ang={P:200,B:270,G:340,D:40,E:140}, lab={P:"Α",B:"Β",G:"Γ",D:"Δ",E:"Ε"};
  const others=["B","G","D","E"], S={}; Object.keys(ang).forEach(k=>S[k]=H.seat(lab[k],C[k],ang[k]));
  const O=H.over, set=(e,on)=>e.classList.toggle("on",!!on), show=(g,on)=>g.setAttribute("opacity",on?1:0);
  dtext(O,{x:S.P.x,y:S.P.y+46,class:"lab"},"new president","new leader");
  // what each legislator reports
  const rep={B:["holds decree 126",true],G:["nothing past 124",false],D:["nothing past 124",false],E:["nothing past 124",false]};
  const sp={},tp={},chips={};
  others.forEach(k=>{const dx=S[k].x-S.P.x,dy=S[k].y-S.P.y,d=Math.hypot(dx,dy),ux=dx/d,uy=dy/d;sp[k]=[S.P.x+ux*40,S.P.y+uy*40];tp[k]=[S[k].x-ux*40,S[k].y-uy*40];
    const ox=S[k].x,oy=S[k].y+(S[k].y<H.cy?-42:42);const c=el("g",{class:"tag fade",transform:`translate(${ox} ${oy})`},O);el("rect",{x:-62,y:-14,width:124,height:28},c);dtext(c,{},rep[k][0],rep[k][0].replace("decree","slot"));chips[k]=c});
  function mk(color,glyph){const g=el("g",{class:"tok",opacity:0},O);el("circle",{r:14,fill:color,stroke:"#1c1512","stroke-width":2},g);const t=el("text",{style:"fill:#1c1512;font-size:15px;text-anchor:middle;dominant-baseline:central;font-weight:700"},g);t.textContent=glyph;return g}
  const tq={},tr={},td={};others.forEach(k=>{tq[k]=mk("#fffaf0","?");tr[k]=mk("#8fc4de","·");td[k]=mk("#c9d98a","✎")});
  function put(g,k,u){const x=sp[k][0]+(tp[k][0]-sp[k][0])*u,y=sp[k][1]+(tp[k][1]-sp[k][1])*u;g.style.transform=`translate(${x}px,${y}px)`}
  others.forEach(k=>{put(tq[k],k,0);put(tr[k],k,1);put(td[k],k,0)});
  // the president's scroll
  const SG=el("g",{},O), tall=matchMedia("(max-width:640px)");
  function lay(){svg.setAttribute("viewBox",tall.matches?"0 0 470 960":"0 0 900 490");SG.setAttribute("transform",tall.matches?"translate(-455 460)":"")}
  tall.addEventListener("change",lay); lay();
  dtext(SG,{x:520,y:42,class:"lab",style:"text-anchor:start;font-size:18px"},"The president's scroll","The leader's log");
  const MT={"Tax on olives":"set tax = 4","Lamps burn olive oil":"set lamp = 1","Roads kept by the town":"set road = 1","Port dues set":"set dues = 2","? nobody has voted for 125":"? no vote for slot 125","Ides of February: olive day":"no-op","Lamps burn only olive oil":"set lamp = 2","Market opens at dawn":"set market = 1"};
  const rows={}; const base=[[122,"Tax on olives"],[123,"Lamps burn olive oil"],[124,"Roads kept by the town"],[125,""],[126,""],[127,""],[128,""],[129,""],[130,""]];
  base.forEach(([n,t],i)=>{const g=el("g",{transform:`translate(520 ${58+i*46})`,class:"row"},SG);const r=el("rect",{width:340,height:38,rx:6},g);const nn=el("text",{x:14,y:20,style:"font-family:Optima,sans-serif;font-weight:700;font-size:17px;dominant-baseline:central;fill:#1c1512"},g);nn.textContent=n;const tx=dtext(g,{x:62,y:20,style:"font-size:16px;dominant-baseline:central;fill:#1c1512"},t,MT[t]||t);rows[n]={g,r,tx}});
  function row(n,cls,text){const o=rows[n];o.r.setAttribute("class","r "+cls);if(text!==undefined){o.tx[0].textContent=text;o.tx[1].textContent=MT[text]||text}o.g.classList.remove("pop2");void o.g.getBoundingClientRect();o.g.classList.add("pop2")}
  function reset(){
    base.forEach(([n,t])=>row(n,n<=124?"has":"future",t));
    others.forEach(k=>{set(chips[k],false);show(tq[k],false);show(tr[k],false);show(td[k],false);put(tq[k],k,0);put(tr[k],k,1);put(td[k],k,0)});
    Object.values(rows).forEach(o=>o.g.classList.remove("pop2"));
    say.innerHTML=dual("Decrees 122 to 124 are in everyone's scroll. The new president knows nothing beyond that. Press the first button.","Slots 122 to 124 are in every log. The new leader knows nothing beyond that. Press the first button.");st.innerHTML=dual("newly appointed","newly elected");b1.disabled=false;b2.disabled=b3.disabled=true;br.hidden=true}
  const say=$("#parsay"),st=$("#parstate"),b1=$("#par1"),b2=$("#par2"),b3=$("#par3"),br=$("#parr");
  b1.onclick=async()=>{b1.disabled=true;
    others.forEach(k=>{show(tq[k],true);put(tq[k],k,1)});say.innerHTML=dual("One question goes to everyone, covering every open number at once: <i>what have you voted for, and what is already in your scroll?</i>","One question goes to everyone, covering every open slot at once: <i>what have you voted for, and what is already in your log?</i>");
    await sleep(reduce?0:1300);
    others.forEach(k=>{show(tq[k],false);show(tr[k],true);put(tr[k],k,0);set(chips[k],true)});await sleep(reduce?0:1300);others.forEach(k=>show(tr[k],false));
    row(126,"has","Port dues set");row(125,"gap","? nobody has voted for 125");
    say.innerHTML=dual("Replies are in. Β's scroll already holds decree <b>126</b>, passed before everyone went home. Nobody has any vote at all for <b class='bad'>125</b>. A hole in the law.","Replies are in. P2's log already holds slot <b>126</b>, decided before everyone stopped. Nobody has any vote at all for <b class='bad'>125</b>. A hole in the log.");st.innerHTML=dual("holding the replies","holding the replies");b2.disabled=false};
  b2.onclick=async()=>{b2.disabled=true;
    row(125,"fill","Ides of February: olive day");others.forEach(k=>{show(td[k],true);put(td[k],k,1)});await sleep(reduce?0:1300);others.forEach(k=>{show(td[k],false);put(td[k],k,0)});
    say.innerHTML=dual("The president fills the gap with a harmless decree: <i>the ides of February is national olive day.</i> The hole is closed, and nothing that mattered is lost.","The leader fills the gap with a harmless no-op value. The hole is closed, and nothing that mattered is lost.");st.innerHTML=dual("gap filled","gap filled");b3.disabled=false};
  b3.onclick=async()=>{b3.disabled=true;
    for(const [n,t] of [[127,"Lamps burn only olive oil"],[128,"Market opens at dawn"]]){
      ["B","G","D"].forEach(k=>{show(td[k],true);put(td[k],k,1)});row(n,"has",t);await sleep(reduce?0:1100);["B","G","D"].forEach(k=>{show(td[k],false);put(td[k],k,0)})}
    say.innerHTML=dual("Only now does the president pass new decrees, in order after everything already in the scroll.","Only now does the leader decide new values, in order after everything already in the log.");st.innerHTML=dual("governing","leading");br.hidden=false};
  br.onclick=reset; reset();
})();

/* ===== fold the scroll ===== */
(function(){
  const f=$("#fold"); for(let i=0;i<30;i++){const e=document.createElement("div");e.className="e";f.insertBefore(e,f.lastElementChild)}
  let on=false; const b=$("#foldb");
  b.onclick=()=>{on=!on; const es=$$(".e",f); es.forEach((e,i)=>setTimeout(()=>e.classList.toggle("gone",on),reduce?0:i*20)); f.classList.toggle("folded",on); b.innerHTML=on?dual("Unfold it again","Unfold it again"):dual("Fold the scroll","Fold the log")};
})();

REG.start();
})();

"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,mapPairs,Polar}=BOOK;
const {isM,dual,vis,dtext,onReg}=REG;
BOOK.init();


/* the four mercenaries, told apart by colour */
const TC={1:"#e0b84a",2:"#6583d6",3:"#c45448",4:"#9cb648"};
const tentChip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${TC[k]}"></i>${dual("Tent "+k,"P"+k)}</span>`;
const WORD={H:"hold",A:"attack"},GL={H:"0",A:"1"};   /* hold or attack in the allegory; 0 or 1 in computing */
/* a row of buttons of which one is picked */
function picker(box,items,fn){box.innerHTML="";
  const bs=items.map(([v,l])=>{const b=document.createElement("button");b.className="btn alt";b.innerHTML=l;b.setAttribute("aria-pressed","false");b.onclick=()=>fn(v);box.appendChild(b);return [v,b]});
  return {set(v){bs.forEach(([x,b])=>{b.classList.toggle("sel",x===v);b.setAttribute("aria-pressed",x===v?"true":"false")})},
          enable(f){bs.forEach(([x,b])=>b.disabled=!f(x))}};
}

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

/* cover:start */
COVERS.draw("#coversvg",(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · UNSTABLE, THEN SETTLED","GST");
  const ys=[128,184,240,296],xl=70,xr=502,GST=262,ax=352;
  bandX(g,xl-6,GST-xl+6,78,ax-12,"#fbefe9");bandX(g,GST,xr-GST+4,78,ax-12,"#edf4fc");
  T(g,(xl+GST)/2,92,"unstable: delays unbounded",{s:9.5,m:1,c:P.red});T(g,(GST+xr)/2,92,"settled: every message within Δ",{s:9.5,m:1,c:P.blue});
  ys.forEach((y,j)=>{lane(g,xl,xr,y,{w:1.3});node(g,42,y,14,"P"+(j+1),{s:10.5})});
  /* before GST: slow, tangled, out of order */
  const late=[[0,100,2,236],[1,92,3,214],[3,112,0,250],[2,150,1,226],[0,176,3,244]];
  late.forEach(([a,xa,b,xb],k)=>{link(g,xa,ys[a],xb,ys[b],{c:"red",w:1.2,dash:"5 3",op:.65,bend:k%2?10:-10});dot(g,xa,ys[a],3,P.ink)});
  chip(g,150,ys[1]+0.5-1,"late",{m:1,s:8.5,pad:8,k:P.red,c:P.red,f:P.redL});
  /* after GST: four-round phases, coordinator P2 */
  const tk=[GST+14,GST+68,GST+122,GST+176,GST+230],nm=["ask","propose","ack","release"],pa=[];
  tk.slice(0,4).forEach((x,i)=>{const x2=tk[i+1];T(g,(x+x2)/2,ax-0+0-250+0,"",{});
    el("rect",{x:x+1,y:ax-4,width:x2-x-2,height:5,rx:2.5,fill:i%2?P.blueL:"#bcd8f3"},g);T(g,(x+x2)/2,ax+20,nm[i],{s:9.5,m:1,c:P.blue})});
  tk.forEach(x=>{el("line",{x1:x,x2:x,y1:ax-6,y2:ax+4,stroke:P.blue,"stroke-width":1.2},g)});
  tk.forEach((x,i)=>{el("line",{x1:x,x2:x,y1:ys[0]-10,y2:ys[3]+10,stroke:P.blue,"stroke-width":.8,"stroke-dasharray":"2 4",opacity:.35},g)});
  const co=1;
  for(const a of[0,2,3])pa.push(link(g,tk[0],ys[a],tk[1],ys[co],{c:"blue",w:1.2,op:.8}));
  for(const b of[0,2,3])pa.push(link(g,tk[1],ys[co],tk[2],ys[b],{c:"blue",w:1.5}));
  for(const a of[0,2])pa.push(link(g,tk[2],ys[a],tk[3],ys[co],{c:"green",w:1.2,op:.85}));
  for(const b of[0,2,3])pa.push(link(g,tk[3],ys[co],tk[4],ys[b],{c:"green",w:1.5}));
  tk.forEach((x,i)=>ys.forEach((y,j)=>{if(i<4||j!==3)dot(g,x,y,2.8,P.ink)}));
  pa.slice(3,9).forEach((p,k)=>packet(g,p,{c:"blue",dur:2.2,delay:k*.25,r:3.2}));
  /* locks and decisions */
  const lk=(x,y)=>{el("rect",{x:x-6,y:y-1,width:12,height:9,rx:2,fill:P.ink},g);el("path",{d:`M${x-3.4} ${y-1}v-3a3.4 3.4 0 0 1 6.8 0v3`,fill:"none",stroke:P.ink,"stroke-width":1.5},g)};
  [0,2].forEach(j=>{lk(tk[3]-14,ys[j]-14);chip(g,tk[3]+6,ys[j]-14,"0 · ph 5",{a:"start",m:1,s:8,pad:8,k:P.line,c:P.mute})});
  [0,1,2].forEach(j=>{const x=xr-8;node(g,x,ys[j],7.5,null,{k:P.green,f:P.green,sw:1});el("path",{d:`M${x-3} ${ys[j]}l2.2 2.4l4-4.6`,stroke:"#fff","stroke-width":1.6,fill:"none",stroke_linecap:"round"},g)});
  /* GST */
  el("line",{x1:GST,x2:GST,y1:70,y2:ax+8,stroke:P.ink,"stroke-width":1.6,"stroke-dasharray":"6 4"},g);
  chip(g,GST,66,"GST",{m:1,s:10,w:600,k:P.ink,f:P.ink,c:"#fff",sw:1});
  /* the axis */
  link(g,xl,ax,xr+4,ax,{c:"mute",w:1.3,op:.7});T(g,xl,ax+20,"time",{a:"start",s:9.5,m:1,c:P.faint});
  T(g,W/2,H-68,"a phase is four rounds, each as long as the timeout",{s:10,m:1,c:P.mute});
  chip(g,W/2-96,H-34,"no deciding unless a majority locks",{m:1,s:9,k:P.line,c:P.mute});chip(g,W/2+150,H-34,"safe even before GST",{m:1,s:9,k:P.line,c:P.mute});
});
/* cover:end */

/* ===== the wind: birds let go one span at a time ===== */
(function(){
  const box=$("#spans"),say=$("#windsay"),nx=$("#windnext"),sh=$("#windshow"),rs=$("#windreset"),cl=$("#wlet"),ci=$("#win"),N=10;
  let cur,D,a,shown;
  function render(){
    let inTime=0;box.innerHTML="";
    for(let n=1;n<=N;n++){
      const row=document.createElement("div");row.className="sp";
      let txt="";
      if(n>cur){row.classList.add("empty");txt="<span class='pine'>not yet</span>"}
      else if(a[n]===n){inTime++;txt=`<span class='ok'>${dual("✓ taken in within its span","✓ received within its span")}</span>`}
      else if(a[n]<=cur)txt=`<span class='bad'>${dual(`taken in late, in span ${a[n]}`,`received late, in span ${a[n]}`)}</span>`;
      else txt=`<span class='pine'>${dual("still in the pines","still in transit")}</span>`;
      if(shown&&n===D)row.classList.add("cut");
      row.innerHTML=`<b>${dual("Span ","Span ")}${n}</b>${txt}`;box.appendChild(row);
    }
    cl.textContent=cur;ci.textContent=inTime;
  }
  function init(){cur=0;D=3+rnd(4);a=[];shown=false;nx.disabled=false;sh.disabled=true;
    say.innerHTML=dual("In each span, tent 1 lets a bird go to tent 2. Let the spans pass and watch which birds come in time.","In each span, P1 sends a message to P2. Let the spans pass and watch which messages arrive in time.");render()}
  nx.onclick=()=>{cur++;a[cur]=cur>D?cur:(Math.random()<.35?cur:cur+1+rnd(8));
    sh.disabled=false;if(cur>=N)nx.disabled=true;
    say.innerHTML=a[cur]===cur?dual(`Span ${cur}: the bird came in within its span. Is the wind down, or is this a lull?`,`Span ${cur}: the message arrived within its span. Is the network settled, or is this a lull?`):dual(`Span ${cur}: the bird is in the pines. Is the wind up, or is this bird just slow?`,`Span ${cur}: the message is still in transit. Is the network unstable, or is this message just slow?`);render()};
  sh.onclick=()=>{
    if(cur<=D){say.innerHTML=dual(`The wind has not dropped yet. It drops after span ${D}, which has not passed. Every bird so far was let go in the wind, and some came in time by luck.`,`The network has not settled yet. It settles after span ${D}, which has not passed. Every message so far was sent while it was unstable, and some arrived in time by luck.`);return}
    shown=true;sh.disabled=true;
    let luck=0,after=0;for(let n=1;n<=D;n++){if(a[n]===n)luck++;else if(a[n]>D)after++}
    say.innerHTML=dual(`The wind dropped after span ${D}. From span ${D+1} on every bird came in within its span. Of the ${D} birds let go in the wind, <b>${luck}</b> came in time by luck and <b>${after}</b> were still in the pines after the wind had dropped. At the tents, nothing told span ${D+1} from a lull.`,
      `The network settled after span ${D}. From span ${D+1} on every message arrived within its span. Of the ${D} messages sent while it was unstable, <b>${luck}</b> arrived in time by luck and <b>${after}</b> were still in transit after the network had settled. At the processes, nothing told span ${D+1} from a lull.`);render()};
  rs.onclick=init;init();
})();

/* ===== a bird comes in: read, or set aside ===== */
(function(){
  const pole=$("#pole"),say=$("#polesay"),nx=$("#polenext"),rs=$("#poler"),cc=$("#pcount"),ca=$("#paside");
  let g,rows,counted,aside;
  function init(){g=4;rows=[];counted=aside=0;pole.innerHTML="";cc.textContent=ca.textContent=0;say.innerHTML=dual("A bird comes in at tent 2. Is it taken in, or set aside?","A message arrives at P2. Is it counted, or set aside?")}
  nx.onclick=()=>{
    g+=1+rnd(2);const s=[1,3,4][rnd(3)],parting=Math.random()<.2,w=g-[0,0,0,0,1,1,2,3][rnd(8)];
    let ok,txt;
    if(parting){ok=true;txt=dual(`${tentChip(s)} <b>parting bird</b>, taken in during glass ${g} ▸ taken in whenever it comes`,`${tentChip(s)} <b>decision message</b>, received during round ${g} ▸ accepted whenever it arrives`);say.innerHTML=dual("A parting bird carries no glass, and is never set aside.","A decision message carries no round, and is never set aside.")}
    else if(w===g){ok=true;txt=dual(`${tentChip(s)} strip written in glass ${w}, taken in during glass ${g} ▸ same glass: it counts`,`${tentChip(s)} message sent in round ${w}, received during round ${g} ▸ same round: it counts`);say.innerHTML=dual("Written in the glass it arrived in: <b>it counts</b>.","Sent in the round it arrived in: <b>it counts</b>.")}
    else{ok=false;txt=dual(`${tentChip(s)} strip written in glass ${w}, taken in during glass ${g} ▸ a later glass: set aside`,`${tentChip(s)} message sent in round ${w}, received during round ${g} ▸ a later round: set aside`);say.innerHTML=dual(`Written in glass ${w}, taken in during glass ${g}: <b>read, and set aside</b>. Nothing in it counts.`,`Sent in round ${w}, received during round ${g}: <b>read, and set aside</b>. Nothing in it counts.`)}
    if(ok)counted++;else aside++;
    const d=document.createElement("div");d.className="e "+(ok?"ok2":"late");d.innerHTML=txt;pole.appendChild(d);while(pole.children.length>5)pole.firstChild.remove();
    cc.textContent=counted;ca.textContent=aside};
  rs.onclick=init;init();
})();

/* ===== one turn, glass by glass, in still air ===== */
(function(){
  const svg=$("#turnsvg"),side=$("#turnside"),H=Hill(svg),T=[1,2,3,4],OWNER=1,TURN=5;
  const sight={1:"H",2:"H",3:"A",4:"H"},list=new Set(["H","A"]);
  const pl0={1:[],2:[["A",2]],3:[],4:[]};
  /* the rules of the four glasses, applied to the starting pledges */
  const can=(k,x,pl)=>!pl[k].some(p=>p[0]!==x);
  const names={};T.forEach(k=>names[k]=["H","A"].filter(x=>list.has(x)&&can(k,x,pl0)));
  const count={H:T.filter(k=>names[k].includes("H")).length,A:T.filter(k=>names[k].includes("A")).length};
  const cand=["H","A"].filter(x=>count[x]>=3),call=cand.includes("H")?"H":cand[0];
  const pl1={};T.forEach(k=>pl1[k]=pl0[k].filter(p=>p[0]!==call).concat([[call,TURN]]));
  const pledged=T.length,commits=pledged>=2;
  const all=[].concat(...T.map(k=>pl1[k]));
  const pl2={};T.forEach(k=>pl2[k]=pl1[k].filter(p=>!all.some(q=>q[0]!==p[0]&&q[1]>=p[1])));
  const pw=p=>dual(`${WORD[p[0]]}, turn ${p[1]}`,`${GL[p[0]]}, phase ${p[1]}`),pls=pl=>pl.length?pl.map(pw).join("; "):"none";
  const nm=k=>names[k].length===2?dual("hold or attack","0 or 1"):dual(WORD[names[k][0]]+" only",GL[names[k][0]]+" only");
  $("#turnc2").innerHTML=dual(`Tent 2 holds a pledge to attack, so it cannot accept hold, and names ${nm(2)}. The other three can accept either and name ${nm(1)}. Names sent to tent 1: <b>${count.H}</b> for hold, <b>${count.A}</b> for attack.`,
    `P2 holds a lock on 1, so it cannot accept 0, and names ${nm(2)}. The other three can accept either and name ${nm(1)}. Names sent to P1: <b>${count.H}</b> for 0, <b>${count.A}</b> for 1.`);
  $("#turnc3").innerHTML=dual(`Three or more men named ${cand.map(x=>WORD[x]).join(" and ")}, so tent 1 may call ${cand.length>1?"either":WORD[cand[0]]}. Tent 1 calls ${WORD[call]}, to every tent, itself included.`,
    `Three or more processes named ${cand.map(x=>GL[x]).join(" and ")}, so P1 may propose ${cand.length>1?"either":GL[cand[0]]}. P1 proposes ${GL[call]}, to every process, itself included.`);
  $("#turnc4").innerHTML=dual(`All ${pledged} men take in the call and tie <i>${WORD[call]}, turn ${TURN}</i>. Tent 2 keeps its older pledge to attack, since that is on the other answer. Each sends <i>pledged</i> to tent 1. Tent 1 takes in ${pledged}, at least two, and ${commits?`<b>commits to ${WORD[call]}</b>`:"does not commit"}.`,
    `All ${pledged} processes receive the proposal and take the lock <i>${GL[call]}, phase ${TURN}</i>. P2 keeps its older lock on 1, since that is on the other value. Each sends <i>ack</i> to P1. P1 receives ${pledged}, at least two, and ${commits?`<b>decides ${GL[call]}</b>`:"does not decide"}.`);
  const gone=pl1[2].filter(p=>!pl2[2].includes(p));
  $("#turnc5").innerHTML=dual(`Every man sends every tent all their pledges. Tent 2 learns of <i>${WORD[call]}, turn ${TURN}</i>, a pledge on the other answer at a turn later than its own, so it unties <i>${gone.map(pw).join("; ")}</i>. Every pledge left stands on ${WORD[call]}.`,
    `Every process sends every process all its locks. P2 learns of <i>${GL[call]}, phase ${TURN}</i>, a lock on the other value at a phase later than its own, so it releases <i>${gone.map(pw).join("; ")}</i>. Every lock left stands on ${GL[call]}.`);
  const tok=[];
  const put=(a,b,glyph,gm)=>{const g=H.token(TC[a],glyph);g.lastChild.textContent=gm;H.fly(g,a,b,.5);g.setAttribute("opacity",1);tok.push(g)};
  function card(k,s){
    const pl=s<3?pl0[k]:s===3?pl1[k]:pl2[k];
    let line="";
    if(s===0)line=k===OWNER?dual("owner of turn five","coordinator of phase five"):"";
    if(s===1)line=dual("names: ","names: ")+nm(k);
    if(s===2)line=k===OWNER?dual(`counts: hold ${count.H}, attack ${count.A}`,`counts: 0 × ${count.H}, 1 × ${count.A}`):dual("takes in the call","receives the proposal");
    if(s===3)line=k===OWNER&&commits?dual(`commits to ${WORD[call]}`,`decides ${GL[call]}`):dual("ties "+WORD[call]+", turn "+TURN,`takes lock ${GL[call]}, phase ${TURN}`);
    if(s===4)line=pl1[k].length!==pl2[k].length?dual("unties ","releases ")+pls(pl1[k].filter(p=>!pl2[k].includes(p))):dual("nothing to untie","nothing to release");
    return `<div class="hc${k===OWNER?" own":""}"><h5>${tentChip(k)}<span>${dual("saw "+WORD[sight[k]],"input "+GL[sight[k]])}</span></h5><div class="chk">${dual("pledges:","locks:")} ${pls(pl)}<br>${line}</div></div>`;
  }
  scrolly($("#turn"),s=>{
    tok.splice(0).forEach(g=>g.remove());
    T.forEach(k=>{H.state(k,"");H.tent[k].g.classList.toggle("turn",k===OWNER)});
    if(s===1)T.filter(k=>k!==OWNER).forEach(k=>put(k,OWNER,names[k].map(x=>x).join(""),names[k].map(x=>GL[x]).join("")));
    if(s===2)T.filter(k=>k!==OWNER).forEach(k=>put(OWNER,k,call,GL[call]));
    if(s===3){T.filter(k=>k!==OWNER).forEach(k=>put(k,OWNER,"P","✓"));if(commits)H.state(OWNER,"commits","decides")}
    if(s===4)T.filter(k=>k!==2).forEach(k=>put(k,2,WORD[call][0].toUpperCase()+TURN,GL[call]+"·"+TURN));
    if(s===0)H.state(OWNER,"owner","coordinator");
    side.innerHTML=T.map(k=>card(k,s)).join("");
  });
})();

/* ===== pledges in turn five, and a call to attack later ===== */
(function(){
  const pk=picker($("#pickk"),[1,2,3,4].map(v=>[v,String(v)]),v=>{K=v;if(M!=null&&M>K)M=null;draw()});
  const pm=picker($("#pickm"),[0,1,2,3,4].map(v=>[v,String(v)]),v=>{M=v;draw()});
  const row=$("#menrow"),verdict=$("#verdict");let K=null,M=null;
  function draw(){
    pk.set(K);pm.set(M);pm.enable(v=>K!=null&&v<=K);
    row.innerHTML=K==null?"":[1,2,3,4].map(i=>`<div class="${i<=K?"pl":""}"><i style="background:${TC[i]}"></i>${dual("Tent "+i,"P"+i)}<br>${i<=K?dual("hold, turn 5","lock 0, phase 5"):dual("no pledge on hold","no lock on 0")}</div>`).join("");
    if(K==null){verdict.innerHTML=dual("Choose how many men tie the pledge to hold in turn five.","Choose how many processes take the lock on 0 in phase five.");return}
    if(M==null){verdict.innerHTML=dual("Now choose how many of their pledged birds reach tent 1 in time. Tent 1 itself is one of the men who pledge.","Now choose how many of their ack messages reach P1 in time. P1 itself is one of the processes that lock.");return}
    const com=M>=2,free=4-K;
    let s=com?dual(`Tent 1 takes in ${M} <i>pledged</i>, at least two, and <b>commits to hold</b>.`,`P1 receives ${M} <i>ack</i>, at least two, and <b>decides 0</b>.`):dual(`Tent 1 takes in only ${M} <i>pledged</i> in time and does not commit.`,`P1 receives only ${M} <i>ack</i> in time and does not decide.`);
    s+=dual(` In a later turn, ${free} ${free===1?"man has":"men have"} no pledge to hold, and so can accept attack. A call needs three. `,` In a later phase, ${free} ${free===1?"process has":"processes have"} no lock on 0, and so can accept 1. A proposal needs three. `);
    if(free>=3)s+=dual(`<span class="ok">Attack can be called.</span> Nobody committed to hold, so nothing is broken: a call to attack makes the pledge to hold be untied, and the night starts clean.`,`<span class="ok">1 can be proposed.</span> Nobody decided 0, so nothing is broken: a proposal of 1 makes the lock on 0 be released, and the execution starts clean.`);
    else s+=dual(`<span class="ok">Attack can never be called</span> while these pledges stand, and they are untied only by a pledge to attack. ${com?"Nobody can ever commit to attack.":"Only hold can be called from here, so nobody can ever commit to attack."}`,`<span class="ok">1 can never be proposed</span> while these locks stand, and they are released only by a lock on 1. ${com?"Nobody can ever decide 1.":"Only 0 can be proposed from here, so nobody can ever decide 1."}`);
    verdict.innerHTML=s;
  }
  draw();
})();

/* ===== when the wind drops, and how many glasses until the four commit ===== */
(function(){
  const row=$("#nightrow"),say=$("#nightsay2");let D=null,G=null;
  const pt=picker($("#pickt"),[1,2,3,4].map(v=>[v,String(v)]),v=>{D=v;draw()});
  const pg=picker($("#pickg"),[1,2,3,4].map(v=>[v,String(v)]),v=>{G=v;draw()});
  const own=n=>((n-1)%4)+1;
  function draw(){
    pt.set(D);pg.set(G);
    const W=D!=null&&G!=null?4*(D-1)+G:null,t1=W&&D+2,t2=W&&D+3;
    row.innerHTML="";
    for(let n=1;n<=7;n++){
      const d=document.createElement("div");d.className="nt"+(n===t1?" own1":"")+(n===t2?" own2":"");
      let cells="";
      for(let g=1;g<=4;g++){const x=4*(n-1)+g;let c="";
        if(W&&x===W)c="drop";else if(W&&x>W)c="still";
        if(W&&n===t1&&g===3)c="c1";if(W&&n===t2&&g===3)c="c2";
        cells+=`<i class="${c}"></i>`}
      d.innerHTML=`<small>${dual("Turn ","Phase ")}${n}</small><div class="gl">${cells}</div><span class="who"><i style="display:inline-block;width:.7em;height:.7em;border-radius:50%;border:1.5px solid #1c1512;background:${TC[own(n)]}"></i> ${dual("T"+own(n),"P"+own(n))}</span>`;
      row.appendChild(d);
    }
    if(W==null){say.innerHTML=dual("Choose when the wind drops. The men cannot see it. Only the page knows.","Choose when the network settles. The processes cannot see it. Only the page knows.");return}
    const c1=4*(t1-1)+3,c2=4*(t2-1)+3,o1=own(t1);
    say.innerHTML=dual(`The wind drops in glass ${W}, during turn ${D}. The proof counts on turn ${t1}, whose owner is tent ${o1}. If every man lives, tent ${o1} calls in glass ${c1-1}, takes in the <i>pledged</i> birds in glass ${c1} and commits: <b>${c1-W} glasses</b> after the drop. If tent ${o1} were the silent one, turn ${t2} would do it instead, in glass ${c2}: <b>${c2-W} glasses</b>. Both are inside the twenty. Nobody at the tents could say which glass was ${W}. If a man had already committed before the drop, the rest commit when that man's parting birds arrive, and no count of glasses bounds that.`,
      `The network settles in round ${W}, during phase ${D}. The proof counts on phase ${t1}, whose coordinator is P${o1}. If every process is correct, P${o1} proposes in round ${c1-1}, receives the <i>ack</i> messages in round ${c1} and decides: <b>${c1-W} rounds</b> after the settling. If P${o1} were the crashed one, phase ${t2} would do it instead, in round ${c2}: <b>${c2-W} rounds</b>. Both are inside the twenty. Nobody could say which round was ${W}. If a process had already decided before the settling, the rest decide when that process's decision messages arrive, and no count of rounds bounds that.`);
  }
  draw();
})();

/* ===== two against two: three nights, and the pairs that cannot tell them apart ===== */
(function(){
  const box=$("#nights"),say=$("#twosay"),bg=$("#twoglass"),ba=$("#twoa"),bb=$("#twob"),br=$("#twor"),N=12;
  let g,A,B;
  const chips=(a,b)=>tentChip(a)+tentChip(b);
  const bar=(on,mk,mk2,held)=>{let s='<div class="gbar">';for(let i=1;i<=N;i++){let c=held&&i<=held?"held":"";if(i<=on)c=held?c:"on";if(i===mk)c="mk";if(i===mk2)c="mk2";s+=`<i class="${c}"></i>`}return s+"</div>"};
  function draw(){
    const both=A!=null&&B!=null,top=both?Math.max(A,B):null;
    const n1=`<div class="nightc"><h5>${dual("First night","First execution")}</h5><p>${dual("Suppose tents 3 and 4 are silent from dusk. Tents 1 and 2 sighted hold, and every bird between them comes within its glass.","Suppose P3 and P4 crash at the start. P1 and P2 have input 0, and every message between them arrives within its round.")}</p>
      <div class="pairs"><div class="pair">${chips(1,2)}<br>${dual("sighted hold","input 0")}</div><div class="pair quiet">${chips(3,4)}<br>${dual("silent","crashed")}</div></div>${bar(g,A,0)}
      <span>${A==null?dual("Tents 1 and 2 are waiting.","P1 and P2 are waiting."):dual(`They cannot wait for a pair that may be dead, and the third demand says the living commit. They commit to <b>hold</b> in glass ${A}. Attack would break the second demand on a night when all four live and sighted hold.`,`They cannot wait for a pair that may have crashed, and the third property says the correct ones decide. They decide <b>0</b> in round ${A}. Deciding 1 would break unanimity in an execution where all four are alive and have input 0.`)}</span></div>`;
    const n2=`<div class="nightc"><h5>${dual("Second night","Second execution")}</h5><p>${dual("Suppose tents 1 and 2 are silent from dusk. Tents 3 and 4 sighted attack, and every bird between them comes within its glass.","Suppose P1 and P2 crash at the start. P3 and P4 have input 1, and every message between them arrives within its round.")}</p>
      <div class="pairs"><div class="pair quiet">${chips(1,2)}<br>${dual("silent","crashed")}</div><div class="pair">${chips(3,4)}<br>${dual("sighted attack","input 1")}</div></div>${bar(g,B,0)}
      <span>${B==null?dual("Tents 3 and 4 are waiting.","P3 and P4 are waiting."):dual(`The same, with the pairs and answers swapped. They commit to <b>attack</b> in glass ${B}.`,`The same, with the pairs and values swapped. They decide <b>1</b> in round ${B}.`)}</span></div>`;
    const n3=`<div class="nightc"><h5>${dual("Third night","Third execution")}</h5><p>${dual("Nobody is silent. Tents 1 and 2 sighted hold, tents 3 and 4 attack, and the wind holds every bird between the pairs.","Nobody crashes. P1 and P2 have input 0, P3 and P4 have input 1, and the network holds every message between the pairs.")}</p>
      <div class="pairs"><div class="pair">${chips(1,2)}<br>${dual("sighted hold","input 0")}</div><div class="pair">${chips(3,4)}<br>${dual("sighted attack","input 1")}</div></div>${bar(g,A,B,both?top:g)}
      <span>${both?dual(`Tents 1 and 2 have heard nothing from the others for ${A} ${A===1?"glass":"glasses"}, which is exactly what they saw in the first night, so they commit to <b>hold</b>. Tents 3 and 4 see the second night, and commit to <b>attack</b>. The wind drops after glass ${top}, too late. <span class="bad">Two answers: the first demand is broken.</span>`,`P1 and P2 have heard nothing from the others for ${A} ${A===1?"round":"rounds"}, which is exactly what they saw in the first execution, so they decide <b>0</b>. P3 and P4 see the second execution, and decide <b>1</b>. The network settles after round ${top}, too late. <span class="bad">Two values: the first property is broken.</span>`):dual("The birds between the pairs are in the pines.","The messages between the pairs are delayed.")}</span></div>`;
    box.innerHTML=n1+n2+n3;
    bg.disabled=g>=N||both;ba.disabled=g<1||A!=null;bb.disabled=g<1||B!=null;
    if(both)say.innerHTML=dual(`Each pair gave up waiting at a glass you chose. The wind can hold every bird between the pairs for more than ${A} and more than ${B} glasses, so the pairs cannot tell the third night from their own. Whatever glasses the arrangement allows, the wind can do this.`,`Each pair gave up waiting at a round you chose. The network can hold every message between the pairs for more than ${A} and more than ${B} rounds, so the pairs cannot tell the third execution from their own. Whatever rounds the protocol allows, the network can do this.`);
    else if(A!=null)say.innerHTML=dual("Now say when tents 3 and 4 give up waiting.","Now say when P3 and P4 give up waiting.");
    else if(B!=null)say.innerHTML=dual("Now say when tents 1 and 2 give up waiting.","Now say when P1 and P2 give up waiting.");
    else say.innerHTML=g?dual("Say when either pair gives up waiting, or let more glasses pass.","Say when either pair gives up waiting, or let more rounds pass."):dual("Let some glasses pass, then say when tents 1 and 2 give up waiting for tents 3 and 4.","Let some rounds pass, then say when P1 and P2 give up waiting for P3 and P4.");
  }
  bg.onclick=()=>{g++;draw()};ba.onclick=()=>{A=g;draw()};bb.onclick=()=>{B=g;draw()};
  br.onclick=()=>{g=0;A=B=null;draw()};g=0;A=B=null;draw();
})();

/* ===== how many men are enough, by the paper's table ===== */
(function(){
  const out=$("#need");let W=null,F=null,C=null;
  const rules={die:[null,2,"drop"],omit:[null,2,"drop"],seal:[null,3,"drop"],noseal:[3,3,"drop"]};
  const pw=picker($("#pickw"),[["none",dual("No wind","Synchronous")],["drops",dual("Wind that drops","Partially synchronous")],["ever",dual("Wind for ever","Asynchronous")]],v=>{W=v;draw()});
  const pf=picker($("#pickf"),[["die",dual("Die","Crash")],["omit",dual("Drop birds","Drop messages")],["seal",dual("Lie, with seals","Lie, with signatures")],["noseal",dual("Lie, without seals","Lie, without signatures")]],v=>{F=v;draw()});
  const pc=picker($("#pickc"),[1,2,3].map(v=>[v,String(v)]),v=>{C=v;draw()});
  function draw(){
    pw.set(W);pf.set(F);pc.set(C);
    if(W==null||F==null||C==null){out.innerHTML=dual("Choose the wind, the trouble, and how many men it may touch.","Choose the network, the trouble, and how many processes it may touch.");return}
    const kind=F==="die"?"die":F==="omit"?"drop birds or fail to take them in":F==="seal"?"lie, with seals no one can forge":"lie, without seals";
    const kindM=F==="die"?"crash":F==="omit"?"drop messages or fail to receive them":F==="seal"?"lie, with unforgeable signatures":"lie, without signatures";
    const mult=F==="die"||F==="omit"?2:3;
    if(W==="ever"){out.innerHTML=dual(`<b class="n">No arrangement.</b> With the wind for ever, no number of men meets the three demands, whatever may befall them.`,`<b class="n">No protocol.</b> With asynchronous delays, no number of processes meets the three properties, whatever may befall them.`);return}
    if(W==="none"&&(F==="die"||F==="omit"||F==="seal")){out.innerHTML=dual(`<b class="n">Any number.</b> With no wind, any number of men can be borne ${F==="seal"?"lying, with seals":"failing this way"}, whatever ${C===1?"the one":C+" of them"} may do.`,`<b class="n">Any number.</b> With synchronous delays, any number of processes can be borne ${F==="seal"?"lying, with signatures":"failing this way"}, whatever ${C===1?"the one":C+" of them"} may do.`);return}
    const N=mult*C+1;
    out.innerHTML=dual(`<b class="n">${N} men</b> are needed when ${C} may ${kind}: more than ${mult===2?"twice":"three times"} as many as may fail, ${mult} × ${C} + 1. Four men ${4>=N?"are enough":"are not enough"}.${W==="drops"&&F==="seal"?" Seals change nothing here: the answer is the same without them.":""}`,
      `<b class="n">${N} processes</b> are needed when ${C} may ${kindM}: more than ${mult===2?"twice":"three times"} as many as may fail, ${mult} × ${C} + 1. Four processes ${4>=N?"are enough":"are not enough"}.${W==="drops"&&F==="seal"?" Signatures change nothing here: the answer is the same without them.":""}`);
  }
  draw();
})();

/* ===== back to machines ===== */
mapPairs($("#map"),[["Four tents, one man in each","Processors"],["Attack or hold","A decision between two values"],["A sighting","A processor's initial value"],["Committing","An irrevocable decision"],["The three demands","Consistency, strong unanimity, termination"],["A man who may be killed","A fail-stop fault: at most one of four"],["A raven, never lost","A message, delayed but never lost"],["The wind, and its dropping","Unbounded delay until an unknown time, then a known bound"],["No man knows it has dropped","The stabilization time is unknown to the processors"],["The glasses, and the common count","Synchronous processors with a common step count"],["A glass","One round"],["A late bird, set aside","A message from an earlier round is ignored"],["A turn, its owner by tent number","A phase, its coordinator in rotation"],["The sighted answers","The set of proper values"],["A pledge on the tent pole","A lock, with its phase number"],["The four glasses of a turn","Ask, propose, acknowledge, release locks"],["Never Two Answers","Safety under any delay"],["Committing After the Wind","Termination soon after stabilization"],["A parting bird","A decision announced to all, accepted at any time"],["Two against two","No resilience when half may fail"],["Liars and seals","Byzantine faults and authentication"],["A clock kept by ravens","Distributed clocks for partially synchronous processors"]]);
REG.start();
})();

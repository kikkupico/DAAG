/* the four bandits, told apart by colour; Number 1 is the chief */
const BC={1:"#a57fc0",2:"#9aa0a8",3:"#e8964d",4:"#b07a55"};
const chip=k=>`<span class="chip"><i style="background:${BC[k]}"></i>Number ${k}</span>`;
const chips=a=>a.length?a.map(chip).join(""):"<i>nobody</i>";

/* a row of buttons for choosing one thing; keeps keyboard focus when it redraws */
function picker(host,label,opts,cur,on){
  const keep=host.dataset.f;delete host.dataset.f;host.innerHTML="";host.className="pick";
  const l=document.createElement("span");l.className="plab";l.textContent=label;host.appendChild(l);
  opts.forEach(([v,t],i)=>{const b=document.createElement("button");b.className="btn"+(v===cur?"":" alt");b.textContent=t;b.setAttribute("aria-pressed",v===cur);
    b.onclick=()=>{host.dataset.f=i;on(v)};host.appendChild(b);if(keep!=null&&+keep===i)b.focus()});
}

/* ===== machines: the same commands in two orders ===== */
(function(){
  const cmds={add:{t:"add 1",f:x=>x+1},dbl:{t:"double it",f:x=>x*2}},rows=$("#ordrows"),say=$("#ordsay"),bs=$("#ordsame"),bw=$("#ordswap");
  const run=order=>{let x=3;const lines=[`start at ${x}`];order.forEach(k=>{x=cmds[k].f(x);lines.push(`${cmds[k].t} → ${x}`)});return {x,lines}};
  const card=(n,r,bad)=>`<div class="copy${bad?" bad":""}"><h5>Copy ${n}</h5>${r.lines.map(l=>`<div class="e">${l}</div>`).join("")}<div class="fin">holds ${r.x}</div></div>`;
  function show(o2,which){
    const a=run(["add","dbl"]),b=run(o2),bad=a.x!==b.x;
    rows.innerHTML=card(1,a,bad)+card(2,b,bad);
    bs.classList.toggle("alt",which!=="same");bw.classList.toggle("alt",which!=="swap");
    say.innerHTML=bad?`<span class="bad">The copies now hold ${a.x} and ${b.x}.</span> The commands were the same. Only their order differed, and an honest copy cannot tell which order is the right one unless the replicas agree on it.`:`Both copies hold ${a.x}. Same commands in the same order, same result.`;
  }
  bs.onclick=()=>show(["add","dbl"],"same");bw.onclick=()=>show(["dbl","add"],"swap");
  rows.innerHTML=card(1,{x:3,lines:["start at 3"]})+card(2,{x:3,lines:["start at 3"]});
  rows.querySelectorAll(".fin").forEach(f=>f.textContent="holds 3");
})();

/* ===== the crown, seen from above: ring wall at the centre with Number 1, three posts on the slopes ===== */
function Crown(svg){
  const cx=235,cy=235,R=150,A={2:-90,3:30,4:150}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:105,fill:"none",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("circle",{cx,cy,r:48,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":9},svg);
  const sites=el("g",{},svg),over=el("g",{},svg);
  const C={svg,cx,cy,R,A,over,tent:{},
    pos(k){if(k===1)return [cx,cy];const a=A[k]*Math.PI/180;return [cx+R*Math.cos(a),cy+R*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    token(fill,glyph){const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:11,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph||"";return g},
    /* a rat u of the way from post a to post b; each direction keeps to its own side of the line */
    fly(g,a,b,u){const [x1,y1]=C.pos(a),[x2,y2]=C.pos(b),dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy),o=30*Math.sin(Math.PI*u);
      C.put(g,x1+dx*u-dy/l*o,y1+dy*u+dx/l*o)},
    state(k,s){C.tent[k].st.textContent=s}
  };
  for(const k of [1,2,3,4]){const [x,y]=C.pos(k),g=el("g",{class:"site"},sites);C.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:BC[k]},g);el("text",{},g).textContent="B"+k;
    const a=k===1?Math.PI/2:A[k]*Math.PI/180,r=k===1?68:48;
    const st=el("text",{class:"state halo",x:r*Math.cos(a)*(k===1?0:1),y:k===1?66:r*Math.sin(a)},g);
    C.tent[k]={x,y,g,st}}
  return C;
}

/* ===== why three seals, and four bandits: two groups always share an honest bandit ===== */
(function(){
  const C=Crown($("#sealsvg")),ctl=$("#sealctl"),stand=$("#sealstand"),say=$("#sealsay");
  let n=4,liar=null,x=1,y=3;
  const all=m=>[...Array(m)].map((_,i)=>i+1);
  /* the least number of honest bandits two groups can share, over every choice of leaving out, and every supposed liar */
  const least=m=>{let lo=99;all(m).forEach(a=>all(m).forEach(b=>all(m).forEach(l=>{
    const sh=all(m).filter(k=>k!==a&&k!==b&&k!==l);lo=Math.min(lo,sh.length)})));return lo};
  function paint(){
    const A=all(n),gx=A.filter(k=>k!==x),gy=A.filter(k=>k!==y),sh=gx.filter(k=>gy.includes(k)),hon=sh.filter(k=>k!==liar);
    [1,2,3,4].forEach(k=>{const g=C.tent[k].g;g.classList.toggle("gone",k>n);g.classList.toggle("shared",sh.includes(k));g.classList.toggle("sus",k===liar)});
    stand.innerHTML=`<div>First group (everyone but ${chip(x)}) ${gx.map(chip).join("")}</div><div>Second group (everyone but ${chip(y)}) ${gy.map(chip).join("")}</div><div>In both groups ${chips(sh)}</div><div>Honest, and in both ${liar==null?"<i>suppose one bandit lies</i>":chips(hon)}</div>`;
    if(liar==null)say.innerHTML=`Each group is three bandits out of four: all but one, since one may be a silent liar. Suppose one bandit lies, and see who is left in both groups.`.replace("three bandits out of four",n===4?"three bandits out of four":"two bandits out of three");
    else if(hon.length)say.innerHTML=`<span class="ok">An honest bandit sits in both groups.</span> An honest bandit seals only one entry for a number in a term, so the two groups cannot have sealed different entries.`;
    else say.innerHTML=`<span class="bad">The only bandit in both groups is the one who lies.</span> They could seal one entry to the first group and a different one to the second. With ${n} bandits, the groups can fail.`;
    say.innerHTML+=` Over every choice, the fewest honest bandits two groups can share is <b>${least(n)}</b>${n===4?"":", so three bandits are too few"}.`;
    const opts=A.map(k=>[k,"Number "+k]);
    picker($("#sealp1")||mk("sealp1"),"How many bandits?",[[3,"Three bandits"],[4,"Four bandits"]],n,v=>{n=v;if(liar>n)liar=null;if(x>n)x=1;if(y>n)y=n;paint()});
    picker($("#sealp2")||mk("sealp2"),"Suppose this one lies:",opts,liar,v=>{liar=v;paint()});
    picker($("#sealp3")||mk("sealp3"),"The first group leaves out:",opts,x,v=>{x=v;paint()});
    picker($("#sealp4")||mk("sealp4"),"The second group leaves out:",opts,y,v=>{y=v;paint()});
  }
  function mk(id){const d=document.createElement("div");d.id=id;ctl.appendChild(d);return d}
  paint();
})();

/* ===== changing the job: a term that stalls, and the wind that looks the same ===== */
(function(){
  const C=Crown($("#jobsvg")),say=$("#jobsay"),info=$("#jobinfo"),tEl=$("#jobterm"),sEl=$("#jobstood"),
    bF=$("#jobfile"),bN=$("#jobnum"),bS=$("#jobsilent"),bW=$("#jobwind"),bR=$("#jobreset");
  let term=1,waiting=false,wind=true,stood=0,busy=false;
  const holder=t=>((t-1)%4)+1;
  function paint(){
    const h=holder(term);[1,2,3,4].forEach(k=>C.tent[k].g.classList.toggle("turn",k===h));
    tEl.textContent=term;sEl.textContent=stood;info.textContent=`term ${term}, held by Number ${h}`;
    bF.disabled=busy||waiting;bN.disabled=bS.disabled=busy||!waiting;bW.disabled=bR.disabled=busy;
    bW.textContent=wind?"The wind is blowing":"The wind has dropped";bW.setAttribute("aria-pressed",wind);
  }
  async function change(){
    busy=true;paint();const h=holder(term),next=holder(term+1),others=[1,2,3,4].filter(k=>k!==next);
    say.innerHTML=`The sandglasses run out. Each bandit who is waiting asks for a change: a sealed request for the next term, with proof of every entry readied at their post, goes to <b>Number ${next}</b>.`;
    const toks=others.map(k=>{const g=C.token(BC[k],"");g.setAttribute("opacity",1);C.fly(g,k,next,.1);return [k,g]});
    await Promise.all(toks.map(([k,g])=>tween(1100+rnd(700),u=>C.fly(g,k,next,.1+.8*u)).then(()=>g.remove())));
    term++;busy=false;paint();
    say.innerHTML=`Three requests are in, and three are enough. <b>Number ${next}</b> now holds the job, in term ${term}. The entry is still waiting. Nobody judged whether Number ${h} stalled or the wind held the rats back.`;
  }
  bF.onclick=()=>{waiting=true;paint();say.innerHTML=`An entry is filed with <b>Number ${holder(term)}</b>, who holds the job, and the filer turns a sandglass. ${wind?"The wind is blowing.":"The wind has dropped."}`};
  bN.onclick=async()=>{const h=holder(term);
    if(wind){say.innerHTML=`<b>Number ${h}</b> numbers the entry and sends the numbering out, but the wind holds the rats in their holes. The sandglass runs out first. From where anyone sits, this looks exactly like a holder who said nothing.`;await sleep(900);await change();return}
    waiting=false;stood++;paint();
    say.innerHTML=`<b>Number ${h}</b> numbers the entry, the others echo it twice, and it <span class="ok">stands</span> before the sandglass runs out. The job stays where it is.`};
  bS.onclick=async()=>{const h=holder(term);say.innerHTML=`<b>Number ${h}</b> numbers nothing. The sandglass runs out, and nobody can say whether that is a stall or the wind.`;await sleep(900);await change()};
  bW.onclick=()=>{wind=!wind;paint();say.innerHTML=wind?"The wind is blowing. Nobody can see it drop, and nobody can see it start.":"The wind has dropped, though nobody on the crown can tell. Runs are short again."};
  bR.onclick=()=>{term=1;waiting=false;wind=true;stood=0;paint();say.innerHTML="An entry is filed and waits to be numbered. The wind is blowing."};
  paint();
})();

/* ===== three requests always meet the bandits who hold the entry ===== */
(function(){
  const C=Crown($("#reqsvg")),ctl=$("#reqctl"),stand=$("#reqstand"),say=$("#reqsay");
  let out=4,liar=null,left=1;const holder=2,all=[1,2,3,4];
  const mk=id=>{const d=document.createElement("div");d.id=id;ctl.appendChild(d);return d};
  function paint(){
    const E=all.filter(k=>k!==out),honE=E.filter(k=>k!==liar),R=all.filter(k=>k!==left),show=R.filter(k=>honE.includes(k));
    all.forEach(k=>{const g=C.tent[k].g;g.classList.toggle("shared",E.includes(k));g.classList.toggle("sus",k===liar);g.classList.toggle("out",k===left)});
    const line=k=>{const yes=honE.includes(k),isL=k===liar;
      return `<div class="rq${yes?" yes":""}">${chip(k)} ${yes?"shows X readied under 7, in term 1":isL?"may say anything at all":"may show it, or may show nothing"}</div>`};
    stand.innerHTML=`<div>Sent second echoes for X ${chips(E)}</div><div>Of them, honest ${liar==null?chips(E):chips(honE)} (they have X readied)</div><div>Number ${holder} holds the job in term 2, and collects requests from ${chips(R)}</div><div class="req">${R.map(line).join("")}</div>`;
    if(show.length)say.innerHTML=`<span class="ok">At least one request shows X readied under 7.</span> The new holder must number X under 7, and the other bandits check that they do. For number 8 no request shows anything readied, so the new holder numbers a blank entry there.`;
    else say.innerHTML=`<span class="bad">No request shows X.</span> This cannot happen: two honest bandits have X readied, and three requests out of four always include one of them.`;
    const opts=all.map(k=>[k,"Number "+k]);
    picker($("#reqp1")||mk("reqp1"),"Second echoes for X came from everyone but:",opts,out,v=>{out=v;paint()});
    picker($("#reqp2")||mk("reqp2"),"Suppose this one lies:",[[null,"Nobody"]].concat(opts),liar,v=>{liar=v;paint()});
    picker($("#reqp3")||mk("reqp3"),"The new holder leaves out the request of:",all.filter(k=>k!==holder).map(k=>[k,"Number "+k]),left,v=>{left=v;paint()});
  }
  paint();
})();

/* ===== going on once the wind drops: a doubling sandglass against a fixed one ===== */
(function(){
  const ctl=$("#gotctl"),list=$("#gotlist"),say=$("#gotsay"),run=$("#gotrun");
  const NEED=3;   /* a term's worth of short runs: the numbering and the two echoes, each at most one first glass */
  const winds=[[2,"The wind drops soon"],[20,"The wind blows a long time"],[Infinity,"The wind never drops"]];
  let dbl=true,W=2,gen=0;
  const holder=k=>((k-1)%4)+1;
  function sim(){const rows=[];let t=0;for(let k=1;k<=12;k++){const g=dbl?2**(k-1):1,still=t>=W,ok=still&&g>=NEED;
    rows.push({k,h:holder(k),t,g,kind:ok?"ok":!still?"wind":"short"});if(ok)break;t+=g}return rows}
  const why={ok:g=>`Still air, and the sandglass of ${g} outlasts three short runs. The entries stand.`,wind:()=>"The wind is still blowing when the term begins. Nothing stands.",short:g=>`Still air, but a sandglass of ${g} runs out before three short runs can finish. The job passes again.`};
  function pickers(){
    picker($("#gotp1")||mk("gotp1"),"The sandglass:",[[true,"Doubles at every change"],[false,"The same every time"]],dbl,v=>{dbl=v;reset()});
    picker($("#gotp2")||mk("gotp2"),"The wind:",winds.map(([w,t])=>[w,t]),W,v=>{W=v;reset()});
  }
  function mk(id){const d=document.createElement("div");d.id=id;ctl.appendChild(d);return d}
  function reset(){gen++;list.innerHTML="";run.disabled=false;pickers();say.textContent="Every holder is honest in this picture, and the first sandglass is the time a short run takes at most. A term's worth is counted as three short runs: the numbering and the two echoes."}
  run.onclick=async()=>{const g0=++gen,rows=sim(),max=Math.max(...rows.map(r=>r.g));run.disabled=true;list.innerHTML="";
    for(const r of rows){if(g0!==gen)return;const d=document.createElement("div");d.className="trow "+r.kind;
      d.innerHTML=`<b>Term ${r.k}</b><span class="gl"><i style="width:${Math.max(4,r.g/max*100)}%"></i></span><em>Number ${r.h} holds the job, glass ${r.g}. ${why[r.kind](r.g)}</em>`;list.appendChild(d);await sleep(450)}
    if(g0!==gen)return;const last=rows[rows.length-1];
    if(last.kind==="ok")say.innerHTML=`<span class="ok">The entries stand at term ${last.k}.</span> ${dbl?"The doubling sandglass grew past a term's worth of short runs, and the first term to begin in still air after that one worked.":"The sandglass never changed, and still air was enough because it was long enough from the start."}`;
    else{const d=document.createElement("div");d.className="trow more";d.textContent="…and so on, for ever";list.appendChild(d);
      say.innerHTML=W===Infinity?`<span class="bad">Nothing ever stands, and nothing wrong stands either.</span> Going on waits for the wind to drop.`:`<span class="bad">The changes never stop.</span> A sandglass that stays the same is always shorter than a term's worth of short runs, so every term runs out before it can finish.`}
    run.disabled=false};
  reset();
})();

/* ===== settling columns: the allowed numbers, and a holder who jumps ahead ===== */
(function(){
  const nE=$("#setN"),sE=$("#setS"),kE=$("#setK"),bar=$("#setbar"),meter=bar.parentNode,rng=$("#setrange"),say=$("#setsay"),
    bF=$("#setfile"),bS=$("#setsettle"),bB=$("#setbad"),bG=$("#setgood"),bR=$("#setreset");
  const DIST=200;   /* the picture's fixed distance beyond the last settled column */
  let N=0,S=0;
  function paint(){
    nE.textContent=N;sE.textContent=S;kE.textContent=N-S;bar.style.width=((N-S)/DIST*100)+"%";meter.classList.toggle("full",N-S>=DIST);
    rng.textContent=`Allowed numbers: ${S+1} to ${S+DIST}. ${N-S} of the ${DIST} are used.`;
    bF.disabled=N+50>S+DIST;bS.disabled=Math.floor(N/100)*100<=S;bG.disabled=N>=S+DIST;
  }
  bF.onclick=()=>{N+=50;paint();say.innerHTML=`Fifty more entries stand, up to number ${N}. Every echo for them is kept, in case a change of job calls for it.${N+50>S+DIST?" <span class='bad'>No more numbers are allowed until a column settles.</span>":""}`};
  bS.onclick=()=>{const to=Math.floor(N/100)*100;S=to;paint();say.innerHTML=`Each bandit sealed a summary of their copy up to <b>${to}</b>. Three matching summaries settle the column: at least two honest bandits have the same scroll up to there. Every echo for numbers up to ${to} is thrown away, and the allowed numbers move up.`};
  bB.onclick=()=>{say.innerHTML=`<span class="bad">Refused.</span> Number 1,000,000 lies far beyond the last settled column plus ${DIST}. A holder cannot use up the numbers by jumping to an enormous one.`};
  bG.onclick=()=>{N++;paint();say.innerHTML=`Number ${N} lies between the last settled column and ${S+DIST}, so it is allowed.`};
  bR.onclick=()=>{N=0;S=0;paint();say.innerHTML="Nothing is written yet. The picture's allowed numbers run two hundred beyond the last settled column."};
  paint();
})();

/* ===== scrollytelling: one entry, from filing to standing ===== */
(function(){
  const svg=$("#echosvg"),side=$("#echoside");
  const nodes={1:[-90,"B1",BC[1]],2:[0,"B2",BC[2]],3:[90,"B3",BC[3]],4:[180,"B4",BC[4]]};
  const P=Polar(svg,{vb:"0 0 620 600",cx:310,cy:300,r0:46,step:34,rings:7,tEnd:6.6,note:[14,24],nodes});
  const defs=$("defs",svg);
  [["o","#a8741a"],["g","#5f6e28"]].forEach(([k,c])=>{const m=el("marker",{id:`${svg.id}-${k}`,markerWidth:9,markerHeight:9,refX:7.5,refY:3.2,orient:"auto"},defs);el("path",{d:"M0,0 L7.5,3.2 L0,6.4 z",fill:c},m)});
  /* the rule: every rat is a row, sent at s and taken in at r */
  const HOLD=1,M=[];
  M.push({kind:"file",a:2,b:1,s:1.4,r:2.4});
  [2,3,4].forEach(b=>M.push({kind:"num",a:HOLD,b,s:2.4,r:3.4,held:b===4}));
  [2,3].forEach(a=>[1,2,3].filter(b=>b!==a).forEach(b=>M.push({kind:"first",a,b,s:3.4,r:4.4})));
  [1,2,3].forEach(a=>[1,2,3].filter(b=>b!==a).forEach(b=>M.push({kind:"second",a,b,s:4.4,r:5.4})));
  /* what each bandit holds at moment T, by the rules of the book */
  function know(k,T){
    const has=k===HOLD?T>=2.4:M.some(m=>m.kind==="num"&&m.b===k&&!m.held&&m.r<=T);
    const fe=M.filter(m=>m.kind==="first"&&m.b===k&&m.r<=T).map(m=>m.a),own1=k!==HOLD&&k!==4&&has&&T>=3.4;
    const first=fe.length+(own1?1:0),ready=has&&first>=2&&k!==4;
    const se=M.filter(m=>m.kind==="second"&&m.b===k&&m.r<=T).length,own2=ready&&T>=4.4,second=se+(own2?1:0);
    return {has,first,ready,second,stands:ready&&second>=3};
  }
  /* the picture: each mark appears at one step and stays */
  const items=[];const add=(e,from,to=99)=>{e.classList.add("fade");items.push({e,from,to});return e};
  const hot=p=>p;
  const dot=(k,t,fill,from)=>add(P.event(k,t,fill,9),from);
  const lbl=(k,t,s,from,to,col)=>{const [x,y]=P.pt(k,t),a=nodes[k][0],t2=el("text",{class:"lab halo",x:x+(a===-90||a===90?-14:0),y:y+(a===-90||a===90?5:-16)},P.over);t2.textContent=s;
    t2.style.textAnchor=a===-90||a===90?"end":"middle";if(col)t2.style.fill=col;return add(t2,from,to)};
  const slip=(m,from,col,mk,dash)=>{const p=P.slip(m.a,m.s,m.b,m.r,12);p.setAttribute("style",`stroke:${col};stroke-width:3.4`);p.setAttribute("marker-end",`url(#${svg.id}-${mk})`);if(dash)p.style.strokeDasharray="7 5";return add(p,from)};
  const holds=el("text",{class:"lab halo",x:292,y:261,style:"text-anchor:end"},P.over);holds.textContent="holds the job";
  dot(2,1.4,"#fffaf0",0);M.filter(m=>m.kind==="file").forEach(m=>slip(m,0,"#136f9e","b"));lbl(2,1.4,"files",0,0);
  dot(1,2.4,"#fffaf0",1);lbl(1,2.4,"no. 7",1,1,"#bf4a26");
  M.filter(m=>m.kind==="num").forEach(m=>slip(m,1,"#bf4a26","r",m.held));
  lbl(4,4.9,"held by the wind",1,99);
  [2,3].forEach(k=>dot(k,3.4,"#fffaf0",2));
  M.filter(m=>m.kind==="first").forEach(m=>slip(m,2,"#a8741a","o"));
  [1,2,3].forEach(k=>dot(k,4.4,"#e0b84a",3));lbl(2,4.4,"readied",3,3);
  M.filter(m=>m.kind==="second").forEach(m=>slip(m,4,"#5f6e28","g"));
  [1,2,3].forEach(k=>dot(k,5.4,"#9cb648",5));lbl(2,5.4,"stands",5,5,"#2f5a1c");
  const Ts=[2.4,3.4,3.4,4.4,4.4,5.4];
  function card(k,s){
    const T=Ts[s],K=know(k,T),role=k===HOLD?"holds the job":"";
    const note=[];
    if(k===4)return `<div class="hc dim"><h5><span><i class="dot" style="background:${BC[k]}"></i>Number 4</span></h5><div class="chk">${s>=1?"Rats held by the wind. Nobody waits for them.":"—"}</div></div>`;
    if(s===0&&k===2)note.push("filed the entry");
    note.push(K.has?(k===HOLD?"has numbered it":"holds the numbering"):"no numbering yet");
    if(s>=2&&k!==HOLD)note.push(`first echoes ${Math.min(K.first,2)} of 2`);
    else if(s>=2)note.push(`first echoes ${Math.min(K.first,2)} of 2`);
    if(s>=3&&K.ready)note.push("readied");
    if(s>=4)note.push(`second echoes ${Math.min(K.second,3)} of 3`);
    if(K.stands)note.push("<b>stands</b>");
    return `<div class="hc${K.stands?" done":""}"><h5><span><i class="dot" style="background:${BC[k]}"></i>Number ${k}</span><span>${role}</span></h5><div class="chk">${note.join("<br>")}</div></div>`;
  }
  scrolly($("#echo"),s=>{
    items.forEach(it=>it.e.classList.toggle("on",s>=it.from&&s<=it.to));
    side.innerHTML=[1,2,3,4].map(k=>card(k,s)).join("");
  });
})();

/* ===== who is who ===== */
mapPairs($("#map"),[
  ["Four bandits; one may lie","Replicas: n = 3f + 1 = 4, with f = 1 Byzantine (§2, §4)"],
  ["The wind, and its dropping","An asynchronous network; progress needs delay(t) not to outgrow t for ever (§2)"],
  ["Seal rings","Public-key signatures that an adversary cannot forge (§2); message digests are folded into the seal here"],
  ["The loot scroll; an entry","A deterministic replicated state machine; an operation request (§3–4)"],
  ["Order; going on","Safety (linearizability) and liveness (§3)"],
  ["The job; a term; the fixed order of holders","The primary; a view; primary = v mod |R| (§4)"],
  ["Two matching sealed words to trust an entry","The client waits for f + 1 matching replies (§4.1); redundant for a replica acting as its own client"],
  ["Numbering; first echo; readied","Pre-prepare; prepare; prepared = pre-prepare + 2f matching prepares (§4.2)"],
  ["Second echo; stands","Commit; committed-local = prepared + 2f + 1 matching commits (§4.2)"],
  ["One Entry to a Number","If prepared(m, v, n, i) then not prepared(m′, v, n, j) for non-faulty j and m′ ≠ m (§4.2)"],
  ["Why four bandits","3f + 1 is optimal for asynchronous safety and liveness (§2, citing Bracha and Toueg)"],
  ["Asking for a change; the three requests; the new numbering; blank entries","View-change; new-view with 2f + 1 view-changes; the set O; null requests (§4.4)"],
  ["Order Across Terms","Non-faulty replicas agree on the sequence numbers of requests that commit locally, even in different views (§4.5.1; a sketch, with the full proof in Castro's thesis)"],
  ["Joining on two requests; no bandit forces a change; a lying holder's single term","Join a view change on f + 1 view-changes; a change needs f + 1; a faulty primary for at most f consecutive views (§4.5.2)"],
  ["Doubling the sandglass","The view-change timeout doubles (§4.5.2)"],
  ["Settled columns; the allowed numbers","Stable checkpoints with 2f + 1 matching messages; low and high water marks (§4.3)"],
  ["A nonsense entry","Faulty clients are observed consistently but can write garbage; access control limits them (§3)"],
  ["Keeps nothing secret","No fault-tolerant privacy (§2)"],
  ["Cheaper marks only the receiver can check","Message authentication codes and authenticators, with signatures kept for view changes (§5.2)"]]);

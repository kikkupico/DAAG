/* the four mercenaries, told apart by colour */
const TC={1:"#e0b84a",2:"#6583d6",3:"#c45448",4:"#9cb648"};
const tentChip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${TC[k]}"></i>Tent ${k}</span>`;
const WORD={H:"hold",A:"attack"};
/* a row of buttons of which one is picked */
function picker(box,items,fn){box.innerHTML="";
  const bs=items.map(([v,l])=>{const b=document.createElement("button");b.className="btn alt";b.textContent=l;b.setAttribute("aria-pressed","false");b.onclick=()=>fn(v);box.appendChild(b);return [v,b]});
  return {set(v){bs.forEach(([x,b])=>{b.classList.toggle("sel",x===v);b.setAttribute("aria-pressed",x===v?"true":"false")})},
          enable(f){bs.forEach(([x,b])=>b.disabled=!f(x))}};
}

/* ===== machines: delays that settle, at a moment nobody sees ===== */
(function(){
  const log=$("#replylog"),note=$("#replynote"),b=$("#askb"),sh=$("#askshow"),r=$("#askr"),LIMIT=2;
  let n,S,lucky,run,t;
  const r1=x=>Math.round(x*10)/10;
  function init(){n=0;S=4+rnd(4);lucky=0;run=0;log.innerHTML="";b.disabled=false;sh.disabled=true;r.hidden=true;
    note.textContent=`A asks B for a reply and allows ${LIMIT} seconds for it.`}
  b.onclick=()=>{n++;
    const luck=n<=S&&Math.random()<.3;
    t=(n>S||luck)?r1(.4+Math.random()*(LIMIT-.4)):r1(LIMIT+1+Math.random()*27);
    if(luck)lucky++;
    const ok=t<=LIMIT;run=ok?run+1:0;
    const d=document.createElement("div");d.className="e "+(ok?"ok2":"late");
    d.textContent=`ask ${n} ▸ reply after ${t} s ▸ ${ok?"on time":"late"}`;log.appendChild(d);
    while(log.children.length>6)log.firstChild.remove();
    note.textContent=!ok?"Late. Has B stopped, or has the network not settled? A cannot tell.":
      run>=3?"Several on time in a row. It looks like calm, but no run of replies proves that the delays have settled.":
      "On time. Settled, or luck? A cannot tell from one reply.";
    sh.disabled=false;r.hidden=false;if(n>=14)b.disabled=true};
  sh.onclick=()=>{note.innerHTML=n<=S?
      `Not yet. The delays settle after ask ${S}, and ${n===S?"this was the last ask before that":"A has asked "+n+" times"}. ${lucky} of the replies so far were on time by luck.`:
      `The delays settled after ask ${S}. From ask ${S+1} on, every reply is within ${LIMIT} seconds. Before that, ${lucky} of the ${S} replies were on time by luck. A saw only the replies, never the moment.`;
    sh.disabled=true};
  r.onclick=init;init();
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
      else if(a[n]===n){inTime++;txt="<span class='ok'>✓ taken in within its span</span>"}
      else if(a[n]<=cur)txt=`<span class='bad'>taken in late, in span ${a[n]}</span>`;
      else txt="<span class='pine'>still in the pines</span>";
      if(shown&&n===D)row.classList.add("cut");
      row.innerHTML=`<b>Span ${n}</b>${txt}`;box.appendChild(row);
    }
    cl.textContent=cur;ci.textContent=inTime;
  }
  function init(){cur=0;D=3+rnd(4);a=[];shown=false;nx.disabled=false;sh.disabled=true;
    say.textContent="In each span, tent 1 lets a bird go to tent 2. Let the spans pass and watch which birds come in time.";render()}
  nx.onclick=()=>{cur++;a[cur]=cur>D?cur:(Math.random()<.35?cur:cur+1+rnd(8));
    sh.disabled=false;if(cur>=N)nx.disabled=true;
    say.innerHTML=a[cur]===cur?`Span ${cur}: the bird came in within its span. Is the wind down, or is this a lull?`:`Span ${cur}: the bird is in the pines. Is the wind up, or is this bird just slow?`;render()};
  sh.onclick=()=>{
    if(cur<=D){say.innerHTML=`The wind has not dropped yet. It drops after span ${D}, which has not passed. Every bird so far was let go in the wind, and some came in time by luck.`;return}
    shown=true;sh.disabled=true;
    let luck=0,after=0;for(let n=1;n<=D;n++){if(a[n]===n)luck++;else if(a[n]>D)after++}
    say.innerHTML=`The wind dropped after span ${D}. From span ${D+1} on every bird came in within its span. Of the ${D} birds let go in the wind, <b>${luck}</b> came in time by luck and <b>${after}</b> were still in the pines after the wind had dropped. At the tents, nothing told span ${D+1} from a lull.`;render()};
  rs.onclick=init;init();
})();

/* ===== a bird comes in: read, or set aside ===== */
(function(){
  const pole=$("#pole"),say=$("#polesay"),nx=$("#polenext"),rs=$("#poler"),cc=$("#pcount"),ca=$("#paside");
  let g,rows,counted,aside;
  function init(){g=4;rows=[];counted=aside=0;pole.innerHTML="";cc.textContent=ca.textContent=0;say.textContent="A bird comes in at tent 2. Is it taken in, or set aside?"}
  nx.onclick=()=>{
    g+=1+rnd(2);const s=[1,3,4][rnd(3)],parting=Math.random()<.2,w=g-[0,0,0,0,1,1,2,3][rnd(8)];
    let ok,txt;
    if(parting){ok=true;txt=`${tentChip(s)} <b>parting bird</b>, taken in during glass ${g} ▸ taken in whenever it comes`;say.innerHTML="A parting bird carries no glass, and is never set aside."}
    else if(w===g){ok=true;txt=`${tentChip(s)} strip written in glass ${w}, taken in during glass ${g} ▸ same glass: it counts`;say.innerHTML="Written in the glass it arrived in: <b>it counts</b>."}
    else{ok=false;txt=`${tentChip(s)} strip written in glass ${w}, taken in during glass ${g} ▸ a later glass: set aside`;say.innerHTML=`Written in glass ${w}, taken in during glass ${g}: <b>read, and set aside</b>. Nothing in it counts.`}
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
  const pw=p=>`${WORD[p[0]]}, turn ${p[1]}`,pls=pl=>pl.length?pl.map(pw).join("; "):"none";
  const nm=k=>names[k].length===2?"hold or attack":WORD[names[k][0]]+" only";
  $("#turnc2").innerHTML=`Tent 2 holds a pledge to attack, so it cannot accept hold, and names ${nm(2)}. The other three can accept either and name ${nm(1)}. Names sent to tent 1: <b>${count.H}</b> for hold, <b>${count.A}</b> for attack.`;
  $("#turnc3").innerHTML=`Three or more men named ${cand.map(x=>WORD[x]).join(" and ")}, so tent 1 may call ${cand.length>1?"either":WORD[cand[0]]}. Tent 1 calls ${WORD[call]}, to every tent, itself included.`;
  $("#turnc4").innerHTML=`All ${pledged} men take in the call and tie <i>${WORD[call]}, turn ${TURN}</i>. Tent 2 keeps its older pledge to attack, since that is on the other answer. Each sends <i>pledged</i> to tent 1. Tent 1 takes in ${pledged}, at least two, and ${commits?`<b>commits to ${WORD[call]}</b>`:"does not commit"}.`;
  const gone=pl1[2].filter(p=>!pl2[2].includes(p));
  $("#turnc5").innerHTML=`Every man sends every tent all their pledges. Tent 2 learns of <i>${WORD[call]}, turn ${TURN}</i>, a pledge on the other answer at a turn later than its own, so it unties <i>${gone.map(pw).join("; ")}</i>. Every pledge left stands on ${WORD[call]}.`;
  const tok=[];
  const put=(a,b,glyph)=>{const g=H.token(TC[a],glyph);H.fly(g,a,b,.5);g.setAttribute("opacity",1);tok.push(g)};
  function card(k,s){
    const pl=s<3?pl0[k]:s===3?pl1[k]:pl2[k];
    let line="";
    if(s===0)line=k===OWNER?"owner of turn five":"";
    if(s===1)line="names: "+nm(k);
    if(s===2)line=k===OWNER?`counts: hold ${count.H}, attack ${count.A}`:"takes in the call";
    if(s===3)line=k===OWNER&&commits?`commits to ${WORD[call]}`:"ties "+WORD[call]+", turn "+TURN;
    if(s===4)line=pl1[k].length!==pl2[k].length?"unties "+pls(pl1[k].filter(p=>!pl2[k].includes(p))):"nothing to untie";
    return `<div class="hc${k===OWNER?" own":""}"><h5>${tentChip(k)}<span>saw ${WORD[sight[k]]}</span></h5><div class="chk">pledges: ${pls(pl)}<br>${line}</div></div>`;
  }
  scrolly($("#turn"),s=>{
    tok.splice(0).forEach(g=>g.remove());
    T.forEach(k=>{H.state(k,"");H.tent[k].g.classList.toggle("turn",k===OWNER)});
    if(s===1)T.filter(k=>k!==OWNER).forEach(k=>put(k,OWNER,names[k].map(x=>x).join("")));
    if(s===2)T.filter(k=>k!==OWNER).forEach(k=>put(OWNER,k,call));
    if(s===3){T.filter(k=>k!==OWNER).forEach(k=>put(k,OWNER,"P"));if(commits)H.state(OWNER,"commits")}
    if(s===4)T.filter(k=>k!==2).forEach(k=>put(k,2,WORD[call][0].toUpperCase()+TURN));
    if(s===0)H.state(OWNER,"owner");
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
    row.innerHTML=K==null?"":[1,2,3,4].map(i=>`<div class="${i<=K?"pl":""}"><i style="background:${TC[i]}"></i>Tent ${i}<br>${i<=K?"hold, turn 5":"no pledge on hold"}</div>`).join("");
    if(K==null){verdict.textContent="Choose how many men tie the pledge to hold in turn five.";return}
    if(M==null){verdict.textContent="Now choose how many of their pledged birds reach tent 1 in time. Tent 1 itself is one of the men who pledge.";return}
    const com=M>=2,free=4-K;
    let s=com?`Tent 1 takes in ${M} <i>pledged</i>, at least two, and <b>commits to hold</b>.`:`Tent 1 takes in only ${M} <i>pledged</i> in time and does not commit.`;
    s+=` In a later turn, ${free} ${free===1?"man has":"men have"} no pledge to hold, and so can accept attack. A call needs three. `;
    if(free>=3)s+=`<span class="ok">Attack can be called.</span> Nobody committed to hold, so nothing is broken: a call to attack makes the pledge to hold be untied, and the night starts clean.`;
    else s+=`<span class="ok">Attack can never be called</span> while these pledges stand, and they are untied only by a pledge to attack. ${com?"Nobody can ever commit to attack.":"Only hold can be called from here, so nobody can ever commit to attack."}`;
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
      d.innerHTML=`<small>Turn ${n}</small><div class="gl">${cells}</div><span class="who"><i style="display:inline-block;width:.7em;height:.7em;border-radius:50%;border:1.5px solid #1c1512;background:${TC[own(n)]}"></i> T${own(n)}</span>`;
      row.appendChild(d);
    }
    if(W==null){say.textContent="Choose when the wind drops. The men cannot see it. Only the page knows.";return}
    const c1=4*(t1-1)+3,c2=4*(t2-1)+3,o1=own(t1);
    say.innerHTML=`The wind drops in glass ${W}, during turn ${D}. The proof counts on turn ${t1}, whose owner is tent ${o1}. If every man lives, tent ${o1} calls in glass ${c1-1}, takes in the <i>pledged</i> birds in glass ${c1} and commits: <b>${c1-W} glasses</b> after the drop. If tent ${o1} were the silent one, turn ${t2} would do it instead, in glass ${c2}: <b>${c2-W} glasses</b>. Both are inside the twenty. Nobody at the tents could say which glass was ${W}. If a man had already committed before the drop, the rest commit when that man's parting birds arrive, and no count of glasses bounds that.`;
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
    const n1=`<div class="nightc"><h5>First night</h5><p>Suppose tents 3 and 4 are silent from dusk. Tents 1 and 2 sighted hold, and every bird between them comes within its glass.</p>
      <div class="pairs"><div class="pair">${chips(1,2)}<br>sighted hold</div><div class="pair quiet">${chips(3,4)}<br>silent</div></div>${bar(g,A,0)}
      <span>${A==null?"Tents 1 and 2 are waiting.":`They cannot wait for a pair that may be dead, and the third demand says the living commit. They commit to <b>hold</b> in glass ${A}. Attack would break the second demand on a night when all four live and sighted hold.`}</span></div>`;
    const n2=`<div class="nightc"><h5>Second night</h5><p>Suppose tents 1 and 2 are silent from dusk. Tents 3 and 4 sighted attack, and every bird between them comes within its glass.</p>
      <div class="pairs"><div class="pair quiet">${chips(1,2)}<br>silent</div><div class="pair">${chips(3,4)}<br>sighted attack</div></div>${bar(g,B,0)}
      <span>${B==null?"Tents 3 and 4 are waiting.":`The same, with the pairs and answers swapped. They commit to <b>attack</b> in glass ${B}.`}</span></div>`;
    const n3=`<div class="nightc"><h5>Third night</h5><p>Nobody is silent. Tents 1 and 2 sighted hold, tents 3 and 4 attack, and the wind holds every bird between the pairs.</p>
      <div class="pairs"><div class="pair">${chips(1,2)}<br>sighted hold</div><div class="pair">${chips(3,4)}<br>sighted attack</div></div>${bar(g,A,B,both?top:g)}
      <span>${both?`Tents 1 and 2 have heard nothing from the others for ${A} glasses, which is exactly what they saw in the first night, so they commit to <b>hold</b>. Tents 3 and 4 see the second night, and commit to <b>attack</b>. The wind drops after glass ${top}, too late. <span class="bad">Two answers: the first demand is broken.</span>`:"The birds between the pairs are in the pines."}</span></div>`;
    box.innerHTML=n1+n2+n3;
    bg.disabled=g>=N||both;ba.disabled=g<1||A!=null;bb.disabled=g<1||B!=null;
    if(both)say.innerHTML=`Each pair gave up waiting at a glass you chose. The wind can hold every bird between the pairs for more than ${A} and more than ${B} glasses, so the pairs cannot tell the third night from their own. Whatever glasses the arrangement allows, the wind can do this.`;
    else if(A!=null)say.textContent="Now say when tents 3 and 4 give up waiting.";
    else if(B!=null)say.textContent="Now say when tents 1 and 2 give up waiting.";
    else say.textContent=g?"Say when either pair gives up waiting, or let more glasses pass.":"Let some glasses pass, then say when tents 1 and 2 give up waiting for tents 3 and 4.";
  }
  bg.onclick=()=>{g++;draw()};ba.onclick=()=>{A=g;draw()};bb.onclick=()=>{B=g;draw()};
  br.onclick=()=>{g=0;A=B=null;draw()};g=0;A=B=null;draw();
})();

/* ===== how many men are enough, by the paper's table ===== */
(function(){
  const out=$("#need");let W=null,F=null,C=null;
  const rules={die:[null,2,"drop"],omit:[null,2,"drop"],seal:[null,3,"drop"],noseal:[3,3,"drop"]};
  const pw=picker($("#pickw"),[["none","No wind"],["drops","Wind that drops"],["ever","Wind for ever"]],v=>{W=v;draw()});
  const pf=picker($("#pickf"),[["die","Die"],["omit","Drop birds"],["seal","Lie, with seals"],["noseal","Lie, without seals"]],v=>{F=v;draw()});
  const pc=picker($("#pickc"),[1,2,3].map(v=>[v,String(v)]),v=>{C=v;draw()});
  function draw(){
    pw.set(W);pf.set(F);pc.set(C);
    if(W==null||F==null||C==null){out.textContent="Choose the wind, the trouble, and how many men it may touch.";return}
    const kind=F==="die"?"die":F==="omit"?"drop birds or fail to take them in":F==="seal"?"lie, with seals no one can forge":"lie, without seals";
    const mult=F==="die"||F==="omit"?2:3;
    if(W==="ever"){out.innerHTML=`<b class="n">No arrangement.</b> With the wind for ever, no number of men meets the three demands, whatever may befall them.`;return}
    if(W==="none"&&(F==="die"||F==="omit"||F==="seal")){out.innerHTML=`<b class="n">Any number.</b> With no wind, any number of men can be borne ${F==="seal"?"lying, with seals":"failing this way"}, whatever ${C===1?"the one":C+" of them"} may do.`;return}
    const N=mult*C+1;
    out.innerHTML=`<b class="n">${N} men</b> are needed when ${C} may ${kind}: more than ${mult===2?"twice":"three times"} as many as may fail, ${mult} × ${C} + 1. Four men ${4>=N?"are enough":"are not enough"}.${W==="drops"&&F==="seal"?" Seals change nothing here: the answer is the same without them.":""}`;
  }
  draw();
})();

/* ===== back to machines ===== */
mapPairs($("#map"),[["Four tents, one man in each","Processors"],["Attack or hold","A decision between two values"],["A sighting","A processor's initial value"],["Committing","An irrevocable decision"],["The three demands","Consistency, strong unanimity, termination"],["A man who may be killed","A fail-stop fault: at most one of four"],["A raven, never lost","A message, delayed but never lost"],["The wind, and its dropping","Unbounded delay until an unknown time, then a known bound"],["No man knows it has dropped","The stabilization time is unknown to the processors"],["The glasses, and the common count","Synchronous processors with a common step count"],["A glass","One round"],["A late bird, set aside","A message from an earlier round is ignored"],["A turn, its owner by tent number","A phase, its coordinator in rotation"],["The sighted answers","The set of proper values"],["A pledge on the tent pole","A lock, with its phase number"],["The four glasses of a turn","Ask, propose, acknowledge, release locks"],["Never Two Answers","Safety under any delay"],["Committing After the Wind","Termination soon after stabilization"],["A parting bird","A decision announced to all, accepted at any time"],["Two against two","No resilience when half may fail"],["Liars and seals","Byzantine faults and authentication"],["A clock kept by ravens","Distributed clocks for partially synchronous processors"]]);

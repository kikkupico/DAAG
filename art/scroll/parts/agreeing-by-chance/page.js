/* the rules of the round, worked in code and used by every widget below */
function sureOf(vals){for(const a of "HA")if(vals.filter(v=>v===a).length*2>4)return a;return null}
function settleRule(secs){const s=secs.filter(Boolean);if(!s.length)return{kind:"toss"};if(s.some(x=>x!==s[0]))throw new Error("two sure answers in one round");return{kind:s.length>1?"settle":"favour",a:s[0]}}
function pickTwo(xs){const a=xs.slice(),out=[];while(out.length<2)out.push(a.splice(rnd(a.length),1)[0]);return out}
/* one whole night. sight: {1:"H",...}. silent: a tent that never sends. reads(r,m,kind,others) names the two other tents man m hears from. */
function night(o){
  const sight=o.sight,silent=o.silent||0,toss=o.toss||(()=>"HA"[rnd(2)]),reads=o.reads||((r,m,kind,others)=>pickTwo(others)),max=o.max||300;
  const men=[1,2,3,4].filter(m=>m!==silent),fav={},parted={},rounds=[];men.forEach(m=>fav[m]=sight[m]);
  const active=men.slice();
  for(let r=1;r<=max&&active.length;r++){
    const send=men.filter(m=>active.includes(m)||(parted[m]&&parted[m].c===r-1));
    const rep={};send.forEach(m=>rep[m]=active.includes(m)?fav[m]:parted[m].a);
    const sure={},R={},S={},out={},sec={};
    active.forEach(m=>{const others=send.filter(x=>x!==m);if(others.length<2)throw new Error("a man would wait for ever");
      R[m]=reads(r,m,"rep",others);sure[m]=sureOf([rep[m],...R[m].map(x=>rep[x])])});
    send.forEach(m=>sec[m]=active.includes(m)?sure[m]:parted[m].a);
    active.forEach(m=>{const others=send.filter(x=>x!==m);S[m]=reads(r,m,"sec",others);
      const res=settleRule([sec[m],...S[m].map(x=>sec[x])]);if(res.kind==="toss")res.t=toss(r,m);out[m]=res});
    rounds.push({r,rep,sure,sec,R,S,out,active:active.slice(),parted:Object.keys(parted).map(Number),send});
    active.slice().forEach(m=>{const x=out[m];if(x.kind==="toss")fav[m]=x.t;else{fav[m]=x.a;if(x.kind==="settle"){parted[m]={c:r,a:x.a};active.splice(active.indexOf(m),1)}}});
  }
  const ans=Object.values(parted).map(p=>p.a);
  if(ans.some(a=>a!==ans[0]))throw new Error("two men committed to different answers");
  if([1,2,3,4].every(m=>sight[m]===sight[1])){if(rounds.length!==1||rounds[0].active.some(m=>rounds[0].out[m].kind!=="settle"))throw new Error("matching sightings were not followed in the first round")}
  return {rounds,parted,done:!active.length,men,silent};
}

/* the four mercenaries, told apart by colour */
const TC={1:"#e0b84a",2:"#6583d6",3:"#c45448",4:"#9cb648"};
const W={H:"hold",A:"attack"},FACE={H:"owl",A:"goddess"};
const tentChip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${TC[k]}"></i>Tent ${k}</span>`;
const list=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" and "+a[a.length-1];
const tents=a=>(a.length>1?"tents ":"tent ")+list(a);

/* ===== machines: a split no fixed rule need ever break ===== */
(function(){
  let v,rounds;const box=$("#mvals"),say=$("#msay"),bF=$("#mfixed"),bC=$("#mcoin"),bR=$("#mreset");
  const paint=()=>{box.innerHTML=v.map((x,i)=>`<div class="mach4"><b>Machine ${i+1}</b><span>${x}</span></div>`).join("");
    bF.disabled=!(v.filter(x=>x===1).length===2)};
  function reset(){v=[0,0,1,1];rounds=0;paint();say.textContent="Four machines hold 0, 0, 1 and 1. A machine that cannot be sure of a value must still pick one."}
  bF.onclick=()=>{
    /* the order of messages is arranged: each machine hears from its own value and from two machines holding the other value, and adopts the majority of the three it read */
    const nv=v.map((x,i)=>{const other=v.map((y,j)=>j).filter(j=>v[j]!==x).slice(0,2),seen=[x,...other.map(j=>v[j])];return seen.filter(y=>y===1).length>=2?1:0});
    v=nv;rounds++;paint();say.innerHTML=`Round ${rounds} with a fixed rule, adopt the majority of the three values read, and the messages arranged to arrive in the worst order. Every machine ended up holding the other value. <b>Still two against two.</b> The same arrangement works again.`};
  bC.onclick=()=>{v=v.map(()=>rnd(2));rounds=0;paint();const ones=v.filter(x=>x===1).length;
    say.innerHTML=ones===0||ones===4?`The coins fell <b>${v.join(", ")}</b>. All four hold the same value, so every machine now reads three alike and nothing can move them.`:`The coins fell <b>${v.join(", ")}</b>: ${ones} hold 1 and ${4-ones} hold 0. Press again, and the coins will fall differently. Each run differs, and no press is certain to end it.`};
  bR.onclick=reset;reset();
})();

/* ===== the hill, seen from above ===== */
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

/* ===== a night, laid out: one row a round, one cell a tent ===== */
function cellHtml(rd,m,lv,silent){
  if(m===silent)return `<div class="nc gone"><span>silent</span></div>`;
  if(!rd.send.includes(m))return `<div class="nc gone"><span>gone</span></div>`;
  const early=!rd.active.includes(m),rep=rd.rep[m],sec=rd.sec[m];
  const l1=lv>=1?`<span>${W[rep]}</span>`:"<span>&nbsp;</span>";
  const l2=lv>=2?`<span>${sec?"sure of "+W[sec]:"unsure"}</span>`:"<span>&nbsp;</span>";
  let l3="<span>&nbsp;</span>",cls="";
  if(lv>=3){if(early){l3="<span>sent as they left</span>";cls=" early"}else{const o=rd.out[m];
    if(o.kind==="toss"){l3=`<span>tosses: ${FACE[o.t]}</span>`;cls=" toss"}else if(o.kind==="favour"){l3=`<span>favours ${W[o.a]}</span>`;cls=" fav"}else{l3=`<span><b>settled: ${W[o.a]}</b></span>`;cls=" set"}}}
  return `<div class="nc${cls}">${l1}${l2}${l3}</div>`;
}
function grid(host,N,levels,labels,from=0){
  const rs=N.rounds;let h=`<div class="nrow hd"><div></div>${[1,2,3,4].map(k=>`<div>${tentChip(k)}</div>`).join("")}</div>`;
  if(from>0)h+=`<div class="nmore">${from} earlier round${from>1?"s":""} not shown</div>`;
  for(let i=from;i<rs.length;i++){const lv=levels===null?3:(levels[i]||0);if(!lv)continue;
    h+=`<div class="nrow"><div class="rl">${labels?labels[i]:"Round "+rs[i].r}</div>${[1,2,3,4].map(m=>cellHtml(rs[i],m,lv,N.silent)).join("")}</div>`}
  host.innerHTML=h;
}
function describe(rd){
  const act=rd.active;let s=`Reports: ${act.map(m=>`tent ${m} ${W[rd.rep[m]]}`).join(", ")}. `;
  const sures=act.filter(m=>rd.sure[m]);
  if(!sures.length){const c={H:0,A:0};act.forEach(m=>c[rd.rep[m]]++);const t=c.H>=c.A?"H":"A";
    s+=c[t]*2>act.length?`${c[t]} of the ${act.length} favour ${W[t]}, but to be sure a man needs more than half of all four, which is three alike. `:"";
    s+="Nobody is sure. "}
  else s+=`${list(sures.map(m=>"tent "+m))} write${sures.length>1?"":"s"} sure of ${W[rd.sure[sures[0]]]}. `;
  const g={toss:[],favour:[],settle:[]};act.forEach(m=>g[rd.out[m].kind].push(m));
  if(g.toss.length)s+=`Tossing: ${list(g.toss.map(m=>`tent ${m} the ${FACE[rd.out[m].t]}`))}. `;
  if(g.favour.length)s+=`Favouring ${W[rd.out[g.favour[0]].a]} from now on: ${tents(g.favour)}. `;
  if(g.settle.length)s+=`<b>Settled on ${W[rd.out[g.settle[0]].a]}: ${tents(g.settle)}.</b> ${g.settle.length>1?"Each sends":"This tent sends"} both birds of the next round at once, and leaves.`;
  return s;
}

/* ===== a coin in each tent ===== */
(function(){
  const H=Hill($("#coinsvg")),say=$("#coinsay"),tally=$("#cointally"),bs=[1,2,3,4,"all"].map(k=>$("#coin"+k)),br=$("#coinr");
  let tl,busy=false;
  const paint=()=>tally.innerHTML=[1,2,3,4].map(k=>`<div>${tentChip(k)} owl ${tl[k][0]} · goddess ${tl[k][1]}</div>`).join("");
  async function toss(ks){if(busy)return;busy=true;bs.forEach(b=>b.disabled=true);ks.forEach(k=>H.state(k,"…"));say.textContent="The coin is in the air.";
    await sleep(500);const res=ks.map(k=>{const f=rnd(2)?"H":"A";tl[k][f==="H"?0:1]++;H.state(k,FACE[f]);H.badge(k,f);return [k,f]});
    say.innerHTML=res.map(([k,f])=>`<b>Tent ${k}</b>: ${FACE[f]}, so it favours ${W[f]}.`).join(" ")+" Each press differs, and nothing here says how the next toss will fall.";
    paint();busy=false;bs.forEach(b=>b.disabled=false)}
  function reset(){tl={1:[0,0],2:[0,0],3:[0,0],4:[0,0]};[1,2,3,4].forEach(k=>{H.state(k,"");H.badge(k,"")});paint();say.textContent="Four tents, four coins. Toss in one tent, or in all four."}
  [1,2,3,4].forEach((k,i)=>bs[i].onclick=()=>toss([k]));bs[4].onclick=()=>toss([1,2,3,4]);br.onclick=reset;reset();
})();

/* ===== one round at one tent ===== */
(function(){
  const rep=["H","H","H"],secBird=[null,false,false];let sel="H";
  const rEl=$("#rrep"),sEl=$("#rsec"),out=$("#rout"),pick=$("#rpick");
  function paint(){
    const sure=sureOf(rep),own=sure,names=["its own report","a raven from another tent","a raven from a third tent"];
    rEl.innerHTML=rep.map((a,i)=>`<button class="btn alt tg" data-i="${i}" aria-label="${names[i]}: ${W[a]}. Press to change.">${i?"Raven":"Own report"}: <b>${W[a]}</b></button>`).join("");
    $$("button",rEl).forEach(b=>b.onclick=()=>{const i=+b.dataset.i;rep[i]=rep[i]==="H"?"A":"H";paint()});
    const ans=own||sel;
    pick.innerHTML=own?`<span>The sure birds this round can only name <b>${W[own]}</b>: tent 1 has written sure of ${W[own]}.</span>`:
      ["H","A"].map(a=>`<button class="btn alt tg${sel===a?" on":""}" data-a="${a}">Sure birds name ${W[a]}</button>`).join("");
    $$("button",pick).forEach(b=>b.onclick=()=>{sel=b.dataset.a;paint()});
    const ownBird=own?`<span class="tg fixed">Own second bird: <b>sure of ${W[own]}</b></span>`:`<span class="tg fixed">Own second bird: <b>unsure</b></span>`;
    sEl.innerHTML=ownBird+[1,2].map(i=>`<button class="btn alt tg${secBird[i]?" on":""}" data-i="${i}">Raven ${i}: <b>${secBird[i]?"sure of "+W[ans]:"unsure"}</b></button>`).join("");
    $$("button",sEl).forEach(b=>b.onclick=()=>{const i=+b.dataset.i;secBird[i]=!secBird[i];paint()});
    const secs=[own,secBird[1]?ans:null,secBird[2]?ans:null],r=settleRule(secs);
    const n=secs.filter(Boolean).length;
    out.innerHTML=(own?`The three reports read are all ${W[own]}: more than half of all four, so tent 1 writes <b>sure of ${W[own]}</b>. `:`The three reports read are not all alike, and more than half of all four means three alike. Tent 1 writes <b>unsure</b>. `)+
      (r.kind==="toss"?`None of the three second birds is sure, so tent 1 <b>tosses the coin</b> and favours the answer it shows.`:
       r.kind==="favour"?`One of the three second birds is sure of ${W[r.a]}, so tent 1 <b>favours ${W[r.a]}</b> from now on. That is one, not two, so it is not yet settled.`:
       `${n} of the three second birds are sure of ${W[r.a]}, so tent 1 is <b>settled on ${W[r.a]}</b>. Before it commits it sends both birds of the next round to all: the report ${W[r.a]}, and sure of ${W[r.a]}. Then it leaves.`);
  }
  paint();
})();

/* ===== never two answers: a scroll-driven stage worked out by the rules ===== */
(function(){
  const host=$("#nevergrid");
  const T={rep:{1:[2,4],2:[1,4],3:[1,2],4:[3,1]},sec:{1:[2,3],2:[3,4],3:[4,1],4:[3,2]}};
  const N=night({sight:{1:"H",2:"H",3:"A",4:"H"},reads:(r,m,k,o)=>r===1?T[k][m]:o.slice(0,2)});
  const L=[[1,0],[2,0],[3,0],[3,1],[3,3],[3,3]];
  scrolly($("#never"),i=>grid(host,N,L[Math.min(i,5)],["A round","Next round"]));
})();

/* ===== the toss: the night of the story, round by round ===== */
(function(){
  const host=$("#storygrid"),say=$("#storysay"),b=$("#storynext"),r=$("#storyr");let n=0;
  const N=night({sight:{1:"H",2:"A",3:"H",4:"A"},silent:4,toss:(rd,m)=>rd===1?{1:"A",2:"A",3:"H"}[m]:"H"});
  const draw=()=>grid(host,N,N.rounds.map((x,i)=>i<n?3:0));
  b.onclick=()=>{n++;draw();say.innerHTML=describe(N.rounds[n-1])+(n===N.rounds.length?"":"");if(n>=N.rounds.length){b.disabled=true;
      say.innerHTML+=" <span class='ok'>The tosses of round 2 happened to agree, so round 3 could not fail to settle.</span>"}};
  r.onclick=()=>{n=0;b.disabled=false;draw();say.textContent="Tent 4 is silent. Tents 1, 2 and 3 saw hold, attack and hold at dusk. These are the tosses of one night in the story."};
  r.onclick();
})();

/* ===== with probability one: fresh nights ===== */
(function(){
  const host=$("#nightgrid"),say=$("#nightsay"),bs=$("#nightsight"),bq=$("#nightsilent"),run=$("#nightgo");
  const sight={1:"H",2:"A",3:"H",4:"A"};let silent=0;
  const paint=()=>{bs.innerHTML=[1,2,3,4].map(k=>`<button class="btn alt tg" data-k="${k}" aria-label="Tent ${k} saw ${W[sight[k]]} at dusk. Press to change.">T${k} saw <b>${W[sight[k]]}</b></button>`).join("");
    $$("button",bs).forEach(x=>x.onclick=()=>{const k=+x.dataset.k;sight[k]=sight[k]==="H"?"A":"H";paint()});
    bq.textContent=silent?"Tent 4 is silent":"All four tents speak";bq.classList.toggle("on",!!silent)};
  bq.onclick=()=>{silent=silent?0:4;paint()};
  run.onclick=()=>{
    const N=night({sight,silent}),k=N.rounds.length,from=Math.max(0,k-12),toss=N.rounds.reduce((a,x)=>a+Object.values(x.out).filter(o=>o.kind==="toss").length,0);
    grid(host,N,null,null,from);
    const ans=Object.values(N.parted)[0].a,who=N.men.map(m=>m);
    say.innerHTML=`<b>This night took ${k} round${k>1?"s":""}.</b> Every man who spoke committed to ${W[ans]}, and no two differed (worked out by the rules, not typed in). There were ${toss} toss${toss===1?"":"es"}. `+
      (toss===0?`Nobody tossed: the sightings left no room for a coin. `:"")+`Another night may take more or fewer rounds, and no round can be named in advance. Press again and the coins fall differently.`};
  paint();
})();

/* ===== half is too many ===== */
(function(){
  const H=Hill($("#halfsvg")),say=$("#halfsay"),b1=$("#half1"),b2=$("#half2"),b3=$("#half3"),br=$("#halfr");
  let d1,d2,toks;const S={1:"H",2:"H",3:"A",4:"A"};
  const hold=(a,b)=>{const g=H.token(TC[a],S[a]);H.fly(g,a,b,.45);g.setAttribute("opacity",1);toks.push([g,a,b])};
  function reset(){toks.forEach(t=>t[0].remove());toks=[];d1=d2=false;[1,2,3,4].forEach(k=>{H.badge(k,S[k]);H.state(k,"")});b1.disabled=b2.disabled=false;b3.disabled=true;
    say.textContent="Tents 1 and 2 saw hold. Tents 3 and 4 saw attack. On this hill, two of the four may fall silent."}
  b1.onclick=()=>{d1=true;b1.disabled=true;hold(3,2);hold(4,1);H.state(1,"holds");H.state(2,"holds");b3.disabled=!(d1&&d2);
    say.innerHTML="Every bird from tents 3 and 4 stays in the pines. Tents 1 and 2 hear only each other, and for all they can tell the other two are silent for good. That looks exactly like a night on which all four saw hold and the other two fell silent at the start, and there the second demand has them hold. Their coins make no difference. <b>So they hold.</b>"};
  b2.onclick=()=>{d2=true;b2.disabled=true;hold(1,4);hold(2,3);H.state(3,"attacks");H.state(4,"attacks");b3.disabled=!(d1&&d2);
    say.innerHTML="In the same way every bird from tents 1 and 2 stays in the pines, and tents 3 and 4 hear only each other. <b>So they attack.</b>"};
  b3.onclick=async()=>{b3.disabled=true;await Promise.all(toks.map(([g,a,b])=>tween(1100,u=>H.fly(g,a,b,.45+.43*u)).then(()=>g.setAttribute("opacity",0))));
    say.innerHTML="All four are alive and every bird was merely late, so neither pair could tell. <span class='bad'>The pairs have committed to different answers.</span> The first demand is broken. The picture shows the pattern of the argument, not a worked plan."};
  br.onclick=reset;toks=[];reset();
})();

/* ===== who is who ===== */
mapPairs($("#map"),[
["The four tents","Processes. N = 4 asynchronous processes."],
["A sighting; attack or hold","Each process's input. A binary initial value x."],
["Committing","An irrevocable decision. Setting the write-once output register."],
["The three demands","Agreement; validity when all inputs are equal; termination. Consensus with correctness criterion (C1)."],
["Ravens that always arrive, with no longest flight, in any order","Reliable asynchronous message passing. The message buffer; every message is eventually delivered to a process that keeps taking steps."],
["A man killed; a silent tent","A crash failure, indistinguishable from slowness. A t-correct schedule, t = 1."],
["The arranger of the birds","The worst case over message orderings, chosen with knowledge of everything so far. The adversary scheduler, which knows all about the system."],
["The coin, owl or goddess, tossed alone in each tent","A private fair random bit at each process. Step 3(c): set x to 0 or 1 with probability 1/2 each (a local coin)."],
["A round; the report","A numbered phase; the first message of the round. Message (1, r, x)."],
["Sure of an answer; unsure","The second message. (2, r, v, D) when more than N/2 of the received values are v; (2, r, ?) otherwise."],
["Waiting for three birds","Waiting for all but t. Wait for N − t messages."],
["Favouring an answer on one sure bird; settled on two","Adopting a value; deciding. Step 3(a): one D-message; step 3(b): more than t D-messages."],
["The rule of parting","A decided process sends its next round's messages and halts. Not in the paper, where decided processes keep running; added here because committing is silence, and shown to change nothing."],
["Never two answers; the sightings respected","Agreement and validity, on every run. Theorem 1 (ii), (iii)."],
["Committing with probability one","Termination with probability 1 for N > 2t. Theorem 1 (i). The paper gives no proof; Aguilera and Toueg (2012) give a complete one."],
["Half is too many","No consensus when N ≤ 2t. The remark after Theorem 2: the schedule can simulate a partition."],
["Six men against one liar","Byzantine agreement for N > 5t, with authenticated senders. Protocol B, Theorem 2."],
["The happier case","Constant expected rounds when t = O(√N), run synchronously. Theorem 3."],
["No drawing lots","Deterministic processes. The assumption of FLP that randomization removes."]]);

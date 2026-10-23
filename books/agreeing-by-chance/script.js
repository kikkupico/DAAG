"use strict";
(function(){
const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,mapPairs,Polar,Unfold}=BOOK;
const {isM,dual,vis,dtext,onReg}=REG;
BOOK.init();


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
const W={H:"hold",A:"attack"},FACE={H:"owl",A:"goddess"},GL={H:"0",A:"1"};   /* hold or attack, owl or goddess in the allegory; 0 or 1 in computing */
const WD=x=>dual(W[x],GL[x]);
const tentChip=(k,extra="")=>`<span class="chip"${extra}><i style="background:${TC[k]}"></i>${dual("Tent "+k,"P"+k)}</span>`;
const list=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" and "+a[a.length-1];
const tents=a=>(a.length>1?"tents ":"tent ")+list(a), pn=a=>list(a.map(k=>"P"+k));

/* ===== the hill, seen from above ===== */
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
    fly(g,a,b,u){const d=((A[b]-A[a]+540)%360)-180;H.put(g,...H.at(A[a]+d*u,R-(d>0?24:46)*Math.sin(Math.PI*u)))},
    state(k,i,m){const t=H.tent[k].st;t[0].textContent=i;t[1].textContent=i&&(m||i)},
    badge(k,s){const b=H.tent[k].badge;b.setAttribute("opacity",s?1:0);b.t[0].textContent=s||"";b.t[1].textContent=GL[s]||""}
  };
  for(const k of [1,2,3,4]){const a=A[k]*Math.PI/180,[x,y]=H.at(A[k]),g=el("g",{class:"site"},sites);H.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:TC[k]},g);dtext(g,{},"T"+k,"P"+k);
    const st=dtext(g,{class:"state halo",x:-48*Math.cos(a),y:-46*Math.sin(a)},"","");
    const badge=el("g",{class:"badge",opacity:0,transform:`translate(${(38*Math.cos(a)).toFixed(1)} ${(34*Math.sin(a)).toFixed(1)})`},g);el("circle",{r:11},badge);badge.t=dtext(badge,{},"","");
    H.tent[k]={x,y,g,st,badge}}
  return H;
}

/* ===== a night, laid out: one row a round, one cell a tent ===== */
function cellHtml(rd,m,lv,silent){
  if(m===silent)return `<div class="nc gone"><span>${dual("silent","crashed")}</span></div>`;
  if(!rd.send.includes(m))return `<div class="nc gone"><span>${dual("gone","halted")}</span></div>`;
  const early=!rd.active.includes(m),rep=rd.rep[m],sec=rd.sec[m];
  const l1=lv>=1?`<span>${WD(rep)}</span>`:"<span>&nbsp;</span>";
  const l2=lv>=2?`<span>${sec?dual("sure of "+W[sec],`D(${GL[sec]})`):dual("unsure","?")}</span>`:"<span>&nbsp;</span>";
  let l3="<span>&nbsp;</span>",cls="";
  if(lv>=3){if(early){l3=`<span>${dual("sent as they left","sent on halting")}</span>`;cls=" early"}else{const o=rd.out[m];
    if(o.kind==="toss"){l3=`<span>${dual("tosses: "+FACE[o.t],"flips: "+GL[o.t])}</span>`;cls=" toss"}else if(o.kind==="favour"){l3=`<span>${dual("favours "+W[o.a],"favours "+GL[o.a])}</span>`;cls=" fav"}else{l3=`<span><b>${dual("settled: "+W[o.a],"decides "+GL[o.a])}</b></span>`;cls=" set"}}}
  return `<div class="nc${cls}">${l1}${l2}${l3}</div>`;
}
function grid(host,N,levels,labels,from=0){
  const rs=N.rounds;let h=`<div class="nrow hd"><div></div>${[1,2,3,4].map(k=>`<div>${tentChip(k)}</div>`).join("")}</div>`;
  if(from>0)h+=`<div class="nmore">${from} earlier round${from>1?"s":""} not shown</div>`;
  for(let i=from;i<rs.length;i++){const lv=levels===null?3:(levels[i]||0);if(!lv)continue;
    h+=`<div class="nrow"><div class="rl">${labels?labels[i]:"Round "+rs[i].r}</div>${[1,2,3,4].map(m=>cellHtml(rs[i],m,lv,N.silent)).join("")}</div>`}
  host.innerHTML=h;
}
function describeR(rd,c){
  const w=x=>c?GL[x]:W[x],fc=x=>c?GL[x]:FACE[x],tn=k=>c?"P"+k:"tent "+k,tl=a=>c?pn(a):tents(a);
  const act=rd.active;let s=`Reports: ${act.map(k=>`${tn(k)} ${w(rd.rep[k])}`).join(", ")}. `;
  const sures=act.filter(k=>rd.sure[k]);
  if(!sures.length){const n={H:0,A:0};act.forEach(k=>n[rd.rep[k]]++);const t=n.H>=n.A?"H":"A";
    s+=n[t]*2>act.length?(c?`${n[t]} of the ${act.length} favour ${w(t)}, but to be sure a process needs more than half of all four, which is three alike. `:`${n[t]} of the ${act.length} favour ${w(t)}, but to be sure a man needs more than half of all four, which is three alike. `):"";
    s+=c?"Nobody proposes a D-value. ":"Nobody is sure. "}
  else s+=c?`${tl(sures)} send${sures.length>1?"":"s"} D(${w(rd.sure[sures[0]])}). `:`${list(sures.map(k=>"tent "+k))} write${sures.length>1?"":"s"} sure of ${w(rd.sure[sures[0]])}. `;
  const g={toss:[],favour:[],settle:[]};act.forEach(k=>g[rd.out[k].kind].push(k));
  if(g.toss.length)s+=c?`Flipping: ${list(g.toss.map(k=>`${tn(k)} gets ${fc(rd.out[k].t)}`))}. `:`Tossing: ${list(g.toss.map(k=>`tent ${k} the ${fc(rd.out[k].t)}`))}. `;
  if(g.favour.length)s+=`Favouring ${w(rd.out[g.favour[0]].a)} from now on: ${tl(g.favour)}. `;
  if(g.settle.length)s+=c?`<b>Decided ${w(rd.out[g.settle[0]].a)}: ${tl(g.settle)}.</b> ${g.settle.length>1?"Each sends":"This process sends"} both messages of the next round at once, and halts.`:`<b>Settled on ${w(rd.out[g.settle[0]].a)}: ${tl(g.settle)}.</b> ${g.settle.length>1?"Each sends":"This tent sends"} both birds of the next round at once, and leaves.`;
  return s;
}
const describe=rd=>dual(describeR(rd,0),describeR(rd,1));

/* the four as lanes, for a hill picture's computing twin (Unfold in book.js) */
const LANES={1:[-90,"T1",TC[1],"P1"],2:[0,"T2",TC[2],"P2"],3:[90,"T3",TC[3],"P3"],4:[180,"T4",TC[4],"P4"]};

/* ===== a coin in each tent ===== */
(function(){
  const H=Hill($("#coinsvg")),L=Unfold(H.svg,{nodes:LANES,span:6,slide:true}),say=$("#coinsay"),tally=$("#cointally"),bs=[1,2,3,4,"all"].map(k=>$("#coin"+k)),br=$("#coinr");
  let tl,busy=false;
  const paint=()=>tally.innerHTML=[1,2,3,4].map(k=>`<div>${tentChip(k)} ${dual(`owl ${tl[k][0]} · goddess ${tl[k][1]}`,`0: ${tl[k][0]} · 1: ${tl[k][1]}`)}</div>`).join("");
  async function toss(ks){if(busy)return;busy=true;bs.forEach(b=>b.disabled=true);ks.forEach(k=>H.state(k,"…"));say.textContent="The coin is in the air.";
    L.tick(.5);await sleep(500);const res=ks.map(k=>{const f=rnd(2)?"H":"A";tl[k][f==="H"?0:1]++;H.state(k,FACE[f],GL[f]);H.badge(k,f);L.mark(k,GL[f]);return [k,f]});
    say.innerHTML=dual(res.map(([k,f])=>`<b>Tent ${k}</b>: ${FACE[f]}, so it favours ${W[f]}.`).join(" ")+" Each press differs, and nothing here says how the next toss will fall.",
      res.map(([k,f])=>`<b>P${k}</b> flips ${GL[f]}, so it favours ${GL[f]}.`).join(" ")+" Each press differs, and nothing here says how the next flip will fall.");
    paint();busy=false;bs.forEach(b=>b.disabled=false)}
  function reset(){L.reset();tl={1:[0,0],2:[0,0],3:[0,0],4:[0,0]};[1,2,3,4].forEach(k=>{H.state(k,"");H.badge(k,"")});paint();say.innerHTML=dual("Four tents, four coins. Toss in one tent, or in all four.","Four processes, four coins. Flip at one process, or at all four.")}
  [1,2,3,4].forEach((k,i)=>bs[i].onclick=()=>toss([k]));bs[4].onclick=()=>toss([1,2,3,4]);br.onclick=reset;reset();
})();

/* ===== one round at one tent ===== */
(function(){
  const rep=["H","H","H"],secBird=[null,false,false];
  const rEl=$("#rrep"),sEl=$("#rsec"),out=$("#rout"),pick=$("#rpick");
  function paint(){
    const sure=sureOf(rep),own=sure,names=["its own report","a raven from another tent","a raven from a third tent"],namesM=["its own report","a report from another process","a report from a third process"];
    rEl.innerHTML=rep.map((a,i)=>`<button class="btn alt tg" data-i="${i}" aria-label="${(isM()?namesM:names)[i]}: ${isM()?GL[a]:W[a]}. Press to change.">${dual(i?"Raven":"Own report",i?"From another process":"Own report")}: <b>${WD(a)}</b></button>`).join("");
    $$("button",rEl).forEach(b=>b.onclick=()=>{const i=+b.dataset.i;rep[i]=rep[i]==="H"?"A":"H";paint()});
    /* tent 1 read two reports of one answer, so the other has at most two among the four and nobody can be sure of it */
    const ans=own||(rep.filter(a=>a==="H").length>=2?"H":"A"),other=ans==="H"?"A":"H";
    pick.innerHTML=own?`<span>${dual(`The sure birds this round can only name <b>${W[own]}</b>: tent 1 has written sure of ${W[own]}.`,`The D-messages this round can only name <b>${GL[own]}</b>: P1 has sent D(${GL[own]}).`)}</span>`:
      `<span>${dual(`The sure birds this round can only name <b>${W[ans]}</b>: tent 1 read two reports of ${W[ans]}, so at most two of the four name ${W[other]}, and sure of ${W[other]} needs three.`,`The D-messages this round can only name <b>${GL[ans]}</b>: P1 read two reports of ${GL[ans]}, so at most two of the four name ${GL[other]}, and D(${GL[other]}) needs three.`)}</span>`;
    const ownBird=own?`<span class="tg fixed">${dual(`Own second bird: <b>sure of ${W[own]}</b>`,`Own proposal: <b>D(${GL[own]})</b>`)}</span>`:`<span class="tg fixed">${dual("Own second bird: <b>unsure</b>","Own proposal: <b>?</b>")}</span>`;
    sEl.innerHTML=ownBird+[1,2].map(i=>`<button class="btn alt tg${secBird[i]?" on":""}" data-i="${i}">${dual(`Raven ${i}: <b>${secBird[i]?"sure of "+W[ans]:"unsure"}</b>`,`From another process: <b>${secBird[i]?"D("+GL[ans]+")":"?"}</b>`)}</button>`).join("");
    $$("button",sEl).forEach(b=>b.onclick=()=>{const i=+b.dataset.i;secBird[i]=!secBird[i];paint()});
    const secs=[own,secBird[1]?ans:null,secBird[2]?ans:null],r=settleRule(secs);
    const n=secs.filter(Boolean).length;
    out.innerHTML=dual((own?`The three reports read are all ${W[own]}: more than half of all four, so tent 1 writes <b>sure of ${W[own]}</b>. `:`The three reports read are not all alike, and more than half of all four means three alike. Tent 1 writes <b>unsure</b>. `)+
      (r.kind==="toss"?`None of the three second birds is sure, so tent 1 <b>tosses the coin</b> and favours the answer it shows.`:
       r.kind==="favour"?`One of the three second birds is sure of ${W[r.a]}, so tent 1 <b>favours ${W[r.a]}</b> from now on. That is one, not two, so it is not yet settled.`:
       `${n} of the three second birds are sure of ${W[r.a]}, so tent 1 is <b>settled on ${W[r.a]}</b>. Before it commits it sends both birds of the next round to all: the report ${W[r.a]}, and sure of ${W[r.a]}. Then it leaves.`),
      (own?`The three reports read are all ${GL[own]}: more than half of all four, so P1 sends <b>D(${GL[own]})</b>. `:`The three reports read are not all alike, and more than half of all four means three alike. P1 sends <b>?</b>. `)+
      (r.kind==="toss"?`None of the three proposals is a D-message, so P1 <b>flips its coin</b> and favours the value it shows.`:
       r.kind==="favour"?`One of the three proposals is D(${GL[r.a]}), so P1 <b>favours ${GL[r.a]}</b> from now on. That is one, not more than <var>t</var>, so it has not yet decided.`:
       `${n} of the three proposals are D(${GL[r.a]}), so P1 <b>decides ${GL[r.a]}</b>. Before it halts it sends both messages of the next round to all: the report ${GL[r.a]}, and D(${GL[r.a]}).`));
  }
  paint();onReg.push(paint);
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
  b.onclick=()=>{n++;draw();say.innerHTML=describe(N.rounds[n-1]);if(n>=N.rounds.length){b.disabled=true;
      say.innerHTML+=" "+dual("<span class='ok'>The tosses of round 2 happened to agree, so round 3 could not fail to settle.</span>","<span class='ok'>The flips of round 2 happened to agree, so round 3 could not fail to decide.</span>")}};
  r.onclick=()=>{n=0;b.disabled=false;draw();say.innerHTML=dual("Tent 4 is silent. Tents 1, 2 and 3 saw hold, attack and hold at dusk. These are the tosses of one night in the story.","P4 has crashed. P1, P2 and P3 have inputs 0, 1 and 0. These are the flips of one execution in the story.")};
  r.onclick();
})();

/* ===== with probability one: fresh nights ===== */
(function(){
  const host=$("#nightgrid"),say=$("#nightsay"),bs=$("#nightsight"),bq=$("#nightsilent"),run=$("#nightgo");
  const sight={1:"H",2:"A",3:"H",4:"A"};let silent=0;
  const paint=()=>{bs.innerHTML=[1,2,3,4].map(k=>`<button class="btn alt tg" data-k="${k}" aria-label="${isM()?`P${k} has input ${GL[sight[k]]}`:`Tent ${k} saw ${W[sight[k]]} at dusk`}. Press to change.">${dual(`T${k} saw <b>${W[sight[k]]}</b>`,`P${k} input <b>${GL[sight[k]]}</b>`)}</button>`).join("");
    $$("button",bs).forEach(x=>x.onclick=()=>{const k=+x.dataset.k;sight[k]=sight[k]==="H"?"A":"H";paint()});
    bq.innerHTML=dual(silent?"Tent 4 is silent":"All four tents speak",silent?"P4 is crashed":"All four processes run");bq.classList.toggle("on",!!silent)};
  bq.onclick=()=>{silent=silent?0:4;paint()};
  run.onclick=()=>{
    const N=night({sight,silent}),k=N.rounds.length,from=Math.max(0,k-12),toss=N.rounds.reduce((a,x)=>a+Object.values(x.out).filter(o=>o.kind==="toss").length,0);
    grid(host,N,null,null,from);
    const ans=Object.values(N.parted)[0].a,who=N.men.map(m=>m);
    say.innerHTML=dual(`<b>This night took ${k} round${k>1?"s":""}.</b> Every man who spoke committed to ${W[ans]}, and no two differed (worked out by the rules, not typed in). There were ${toss} toss${toss===1?"":"es"}. `+
      (toss===0?`Nobody tossed: the sightings left no room for a coin. `:"")+`Another night may take more or fewer rounds, and no round can be named in advance. Press again and the coins fall differently.`,
      `<b>This execution took ${k} round${k>1?"s":""}.</b> Every process that ran decided ${GL[ans]}, and no two differed (worked out by the rules, not typed in). There ${toss===1?"was 1 flip":`were ${toss} flips`}. `+
      (toss===0?`Nobody flipped: the inputs left no room for a coin. `:"")+`Another execution may take more or fewer rounds, and no round can be named in advance. Press again and the coins fall differently.`)};
  paint();onReg.push(paint);
})();

/* ===== half is too many ===== */
(function(){
  const H=Hill($("#halfsvg")),L=Unfold($("#halfsvg"),{nodes:LANES,span:4.4,vals:GL}),say=$("#halfsay"),b1=$("#half1"),b2=$("#half2"),b3=$("#half3"),br=$("#halfr");
  let d1,d2,toks;const S={1:"H",2:"H",3:"A",4:"A"};L.wrap(H);
  const hold=(a,b)=>{const g=H.token(TC[a],S[a]);H.fly(g,a,b,.45);g.setAttribute("opacity",1);toks.push([g,a,b])};
  function reset(){toks.forEach(t=>t[0].remove());toks=[];L.reset();d1=d2=false;[1,2,3,4].forEach(k=>{H.badge(k,S[k]);H.state(k,"")});b1.disabled=b2.disabled=false;b3.disabled=true;
    say.innerHTML=dual("Tents 1 and 2 saw hold. Tents 3 and 4 saw attack. On this hill, two of the four may fall silent.","P1 and P2 have input 0. P3 and P4 have input 1. In this system, two of the four may crash.")}
  b1.onclick=()=>{d1=true;b1.disabled=true;hold(3,2);hold(4,1);L.setT(L.clock.t+1.2);H.state(1,"holds","decides 0");H.state(2,"holds","decides 0");b3.disabled=!(d1&&d2);
    say.innerHTML=dual("Every bird from tents 3 and 4 stays in the pines. Tents 1 and 2 hear only each other, and for all they can tell the other two are silent for good. That looks exactly like a night on which all four saw hold and the other two fell silent at the start, and there the second demand has them hold. Their coins make no difference. <b>So they hold.</b>","Every message from P3 and P4 is delayed. P1 and P2 hear only each other, and for all they can tell the other two have crashed for good. That looks exactly like an execution in which all four had input 0 and the other two crashed at the start, and there validity makes them decide 0. Their coins make no difference. <b>So they decide 0.</b>")};
  b2.onclick=()=>{d2=true;b2.disabled=true;hold(1,4);hold(2,3);L.setT(L.clock.t+1.2);H.state(3,"attacks","decides 1");H.state(4,"attacks","decides 1");b3.disabled=!(d1&&d2);
    say.innerHTML=dual("In the same way every bird from tents 1 and 2 stays in the pines, and tents 3 and 4 hear only each other. <b>So they attack.</b>","In the same way every message from P1 and P2 is delayed, and P3 and P4 hear only each other. <b>So they decide 1.</b>")};
  b3.onclick=async()=>{b3.disabled=true;await Promise.all(toks.map(([g,a,b])=>tween(1100,u=>H.fly(g,a,b,.45+.43*u)).then(()=>g.setAttribute("opacity",0))));
    say.innerHTML=dual("All four are alive and every bird was merely late, so neither pair could tell. <span class='bad'>The pairs have committed to different answers.</span> The first demand is broken. The picture shows the pattern of the argument, not a worked plan.","All four are alive and every message was merely late, so neither pair could tell. <span class='bad'>The pairs have decided different values.</span> Agreement is broken. The picture shows the pattern of the argument, not a worked protocol.")};
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
/* cover:start */
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · ROUNDS OF REPORT AND PROPOSAL, THEN COINS","randomised consensus");
  const ys=[134,188,242,296],xs=[110,180,250,320,390,460],hd=["report","propose","coin","report","propose","decide"];
  const val=[[0,1,0,1],["?","?","?","?"],[1,1,0,1],[1,1,0,1],["D1","D1","D1","D1"],[1,1,1,1]];
  /* round bands */
  bandX(g,xs[0]-34,xs[2]-xs[0]+68,70,336,P.bg);bandX(g,xs[3]-34,xs[5]-xs[3]+68,70,336,"#fafafc");
  T(g,(xs[0]+xs[2])/2,86,"ROUND 1",{s:9.5,m:1,c:P.blue,w:600});T(g,(xs[3]+xs[5])/2,86,"ROUND 2",{s:9.5,m:1,c:P.blue,w:600});
  xs.forEach((x,i)=>T(g,x,104-0,"",{}));
  ys.forEach((y,j)=>{lane(g,70,500,y,{w:1.2});node(g,42,y,14,"P"+(j+1),{s:10.5})});
  /* all-to-all traffic between columns */
  for(const i of[0,3])for(let a=0;a<4;a++)for(let b=0;b<4;b++)if(a!==b)link(g,xs[i]+15,ys[a],xs[i+1]-15,ys[b],{c:"blue",w:.9,op:.22,head:false});
  const ps=[];for(let a=0;a<4;a++){ps.push(link(g,xs[1]+15,ys[a],xs[2]-15,ys[a],{c:"mute",w:1,op:.3,head:false}));ps.push(link(g,xs[4]+15,ys[a],xs[5]-15,ys[a],{c:"green",w:1.2,op:.6,head:false}))}
  ys.forEach((y,j)=>{for(const i of[2]){link(g,xs[i]+15,y,xs[i+1]-15,y,{c:"mute",w:1,op:.3,head:false})}});
  const col=v=>v===0?"blue":v===1?"red":v==="?"?"gold":"green";
  xs.forEach((x,i)=>{
    const hy=98;
    T(g,x,hy,hd[i],{s:9.5,m:1,c:P.mute});
    ys.forEach((y,j)=>{const v=val[i][j],c=col(v);
      if(i===2){el("circle",{cx:x,cy:y,r:14,fill:"#fff",stroke:P.faint,"stroke-width":1.4,"stroke-dasharray":"3 3"},g);el("circle",{cx:x,cy:y,r:9,fill:P[c+"L"],stroke:P[c],"stroke-width":1.4},g);T(g,x,y+.5,String(v),{s:10,m:1,w:600,c:P[c]})}
      else if(i===5){node(g,x,y,14,"1",{k:P.green,f:P.green,c:"#fff",s:11,sw:1.6})}
      else if(i===4){el("rect",{x:x-16,y:y-12,width:32,height:24,rx:12,fill:P.greenL,stroke:P.green,"stroke-width":1.4},g);T(g,x,y+.5,"D(1)",{s:9.5,m:1,w:600,c:P.green})}
      else if(v==="?"){node(g,x,y,13,"?",{k:P.gold,f:P.goldL,c:"#8a6a00",s:11,sw:1.5})}
      else node(g,x,y,13,String(v),{k:P[c],f:P[c+"L"],c:P[c],s:11,sw:1.5})})});
  /* a faulty split in round 1 needs the coin */
  chip(g,xs[2],sy(),"no majority → flip",{m:1,s:8.5,pad:8,k:P.gold,c:"#8a6a00",f:P.goldL});
  function sy(){return 328}
  /* the odds */
  const by=474,bw=26;T(g,26,372,"chance still undecided after r rounds",{a:"start",s:10,m:1,c:P.mute});
  for(let k=0;k<7;k++){const h=80*Math.pow(.5,k),x=64+k*58;el("rect",{x,y:by-h,width:bw+10,height:h,rx:3,fill:k===0?P.blueL:P.blueL,stroke:P.blue,"stroke-width":1.2,opacity:1-.08*k},g);T(g,x+(bw+10)/2,by+13,"r="+(k+1),{s:8.5,m:1,c:P.faint})}
  T(g,W-26,H-96,"→ 0 with probability 1",{a:"end",s:10.5,m:1,c:P.blue,w:600});
  link(g,330,by-62,470,by-8,{c:"blue",w:1.2,bend:-26,op:.6});
};
COVERS.draw("#coversvg",COVER);COVERS.mount(COVER);
/* cover:end */

REG.start();
})();

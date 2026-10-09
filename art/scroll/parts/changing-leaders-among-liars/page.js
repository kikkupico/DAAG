/* the four bandits, told apart by colour; bandit 1 is the chief */
const BC={1:"#a57fc0",2:"#9aa0a8",3:"#e8964d",4:"#b07a55"};
const yesno=ok=>ok?"<span class='ok'>✓</span>":"<span class='bad'>✗</span>";
const chip=k=>`<span class="chip"><i style="background:${BC[k]}"></i>bandit ${k}</span>`;
const chips=a=>a.map(chip).join(" ");
const men=[1,2,3,4];

/* ===== machines: how many messages one step costs ===== */
(function(){
  const sizes=[4,10,40],all=$("#mall"),lead=$("#mlead"),ab=$("#mallbar"),lb=$("#mleadbar"),say=$("#msay");
  sizes.forEach(n=>{const b=$("#mn"+n);b.onclick=()=>{
    const f=(n-1)/3,every=n*(n-1),viaLeader=2*(n-1);
    sizes.forEach(m=>$("#mn"+m).classList.toggle("on",m===n));
    all.textContent=every;lead.textContent=viaLeader;ab.style.width="100%";lb.style.width=(viaLeader/every*100).toFixed(1)+"%";
    say.textContent=`With ${n} machines, up to ${f} of them lying, every machine telling every other sends ${every} messages in a step. Votes to one leader, and one certificate back out to the rest, send ${viaLeader}. The first grows with every pair of machines, the second only with the number of machines.`}});
})();

/* ===== the crown, seen from above: one picture reused wherever rats run between the posts ===== */
function Crown(svg){
  const cx=235,cy=235,R=158,A={2:-90,3:30,4:150};svg.innerHTML="";svg.setAttribute("viewBox","0 0 470 470");
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:96,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("circle",{cx,cy,r:42,class:"wall"},svg);
  el("text",{x:cx,y:cy-54,class:"lab"},svg).textContent="ring wall";
  const sites=el("g",{},svg),over=el("g",{},svg),pos={1:[cx,cy]},C={svg,over,site:{},pos};
  for(const k of [2,3,4]){const a=A[k]*Math.PI/180;pos[k]=[cx+R*Math.cos(a),cy+R*Math.sin(a)]}
  const put=(g,x,y)=>g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  C.token=(fill,glyph)=>{const g=el("g",{class:"tok",opacity:0},over);el("circle",{r:12,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph;return g};
  /* a rat u of the way from post a to post b; each direction keeps to its own lane */
  C.fly=(g,a,b,u)=>{const [x1,y1]=pos[a],[x2,y2]=pos[b],L=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/L,uy=(y2-y1)/L,s=a===1?46:32,e=L-(b===1?46:32),d=s+(e-s)*u;put(g,x1+ux*d-uy*7,y1+uy*d+ux*7)};
  C.state=(k,s)=>{C.site[k].st.textContent=s};
  const dy={1:72,2:-28,3:42,4:42};
  for(const k of men){const [x,y]=pos[k],g=el("g",{class:"site"},sites);put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:BC[k]},g);el("text",{},g).textContent="B"+k;
    const st=el("text",{class:"state halo",x:0,y:dy[k]},g);C.site[k]={g,st}}
  return C;
}

/* ===== one stage on the crown, counted both ways ===== */
(function(){
  const C=Crown($("#votesvg")),say=$("#votesay"),cnt=$("#votecount"),b1=$("#voteall"),b2=$("#voteone");
  const flight=(a,b,fill,glyph,ms)=>{const g=C.token(fill,glyph);g.setAttribute("opacity",1);C.fly(g,a,b,0);return tween(ms,u=>C.fly(g,a,b,u)).then(()=>g.remove())};
  const lock=on=>b1.disabled=b2.disabled=on;
  b1.onclick=async()=>{lock(true);const pairs=[];for(const a of men)for(const b of men)if(a!==b)pairs.push([a,b]);
    cnt.textContent=pairs.length;say.textContent="Every man writes to every other man.";
    await Promise.all(pairs.map(([a,b])=>flight(a,b,BC[a],"",1100+rnd(800))));
    say.innerHTML=`<b>${pairs.length} rats</b> in one stage: each of the four men writes to the other three.`;lock(false)};
  b2.onclick=async()=>{lock(true);const votes=[2,3,4].map(k=>[k,1]),bundle=[2,3,4].map(k=>[1,k]);
    cnt.textContent=votes.length;say.textContent="Each man sends their sealed vote to the holder, bandit 1.";
    await Promise.all(votes.map(([a,b])=>flight(a,b,BC[a],"",1100+rnd(500))));
    cnt.textContent=votes.length+bundle.length;say.textContent="The holder has three votes, ties them into a bundle, and sends the bundle to the other three.";
    await Promise.all(bundle.map(([a,b])=>flight(a,b,BC[1],"3",1100+rnd(500))));
    say.innerHTML=`<b>${votes.length+bundle.length} rats</b> in one stage: ${votes.length} votes in, ${bundle.length} bundles out.`;lock(false)};
})();

/* ===== scroll: one term, stage by stage ===== */
(function(){
  const C=Crown($("#termsvg")),posts=[2,3,4];let run=0,toks=[];
  const flight=(a,b,fill,glyph,ms,id)=>{const g=C.token(fill,glyph);toks.push(g);g.setAttribute("opacity",1);C.fly(g,a,b,0);return tween(ms,u=>{if(id===run)C.fly(g,a,b,u)}).then(()=>g.remove())};
  const wave=(pairs,glyph,id)=>Promise.all(pairs.map(([a,b])=>flight(a,b,BC[a],glyph,1000+rnd(400),id)));
  const vin=(id)=>wave(posts.map(k=>[k,1]),"",id),vout=(id,g)=>wave(posts.map(k=>[1,k]),g||"",id);
  const set=o=>men.forEach(k=>C.state(k,o[k]||""));
  const all=s=>({1:s,2:s,3:s,4:s});
  const S=[{1:"proposed",2:"has proposal",3:"has proposal",4:"has proposal"},
           {1:"has three votes",2:"voted",3:"voted",4:"voted"},
           all("first bundle"),all("locked"),all("entry written"),{2:"holds the job"}];
  async function render(i){
    const id=++run;toks.forEach(g=>g.remove());toks=[];set(i?S[i-1]:{});
    const live=()=>id===run;
    if(i===0){await vin(id);if(!live())return;await vout(id);if(!live())return;set(S[0])}
    else if(i===1){await vin(id);if(!live())return;set(S[1])}
    else if(i===2||i===3){await vout(id,"3");if(!live())return;set(S[i]);await vin(id)}
    else if(i===4){await vout(id,"3");if(!live())return;set(S[4])}
    else{await wave([1,3,4].map(k=>[k,2]),"",id);if(!live())return;set(S[5])}
  }
  scrolly($("#term"),render);
})();

/* ===== the rule for the first vote, worked out for one man ===== */
(function(){
  const LOCK=4,box=$("#ruleopts"),L=[$("#rule1"),$("#rule2"),$("#rule3")],say=$("#rulesay");
  const opts=[["On top of the locked entry",true,4],["On a rival entry, bundle from term 2",false,2],["On a rival entry, bundle from term 3",false,3],["On a rival entry, bundle from term 6",false,6]];
  opts.forEach(([t,on,b],i)=>{const bt=document.createElement("button");bt.className="btn alt chipb";bt.textContent=t;box.appendChild(bt);
    bt.onclick=()=>{$("ul.checks").hidden=false;$$("button",box).forEach(x=>x.classList.toggle("on",x===bt));
      const h1=on,h2=b>LOCK,vote=h1||h2;
      L[0].innerHTML=`<b>Lies on the chain of the entry they are locked on</b> ${yesno(h1)}`;
      L[1].innerHTML=`<b>Carries a bundle from a later term than their lock</b> ${yesno(h2)}<br>the bundle is from term ${b}, the lock from term ${LOCK}`;
      L[2].innerHTML=`<b>Votes for the proposal</b> ${yesno(vote)}`;
      say.innerHTML=h1?"<b>The first half holds.</b> The proposal builds on the entry the man is locked on, so voting for it helps nothing conflicting forward."
        :h2?`<b>The second half holds.</b> The proposal conflicts with the lock, but the bundle it carries is from term ${b}, later than term ${LOCK}. The rest have gone past the lock, the man is shown that they have, and they let go.`
        :`<b>Neither half holds.</b> The proposal conflicts with the lock and carries no later bundle. The man refuses.`}});
})();

/* ===== two bundles of the same stage share an honest man ===== */
(function(){
  const A=$("#lackA"),B=$("#lackB"),stand=$("#lackstand"),say=$("#lacksay");let a=null,b=null;
  function render(){
    $$("button",A).forEach(x=>x.classList.toggle("on",+x.dataset.k===a));$$("button",B).forEach(x=>x.classList.toggle("on",+x.dataset.k===b));
    if(a==null||b==null){stand.innerHTML="";say.textContent="Pick one man for each bundle.";return}
    const sealed=l=>men.filter(k=>k!==l),shared=men.filter(k=>k!==a&&k!==b);
    stand.innerHTML=`<div>Bundle A is sealed by ${chips(sealed(a))}</div><div>Bundle B is sealed by ${chips(sealed(b))}</div><div><b>Sealed both:</b> ${chips(shared)}</div>`;
    say.innerHTML=`<b>${shared.length} men sealed both bundles.</b> If one of them lies, at least ${shared.length-1} honest ${shared.length-1>1?"men":"man"} still did. An honest man votes once a stage a term, so two bundles of the same stage cannot vouch for conflicting entries.`}
  [[A,k=>a=k],[B,k=>b=k]].forEach(([box,setk])=>men.forEach(k=>{const bt=document.createElement("button");bt.className="btn alt chipb";bt.dataset.k=k;bt.textContent="bandit "+k;bt.onclick=()=>{setk(k);render()};box.appendChild(bt)}));
  render();
})();

/* ===== the hidden lock: what a new holder hears with two stages and with three ===== */
(function(){
  const scene=$("#hidscene"),menBox=$("#hidmen"),slowBox=$("#hidslow"),say=$("#hidsay"),mode=$("#hidmode"),b2=$("#hid2"),b3=$("#hid3");
  let stages=2,slow=null;const LOCK=3;
  const holds=()=>stages===2?[3]:[2,3,4];
  function render(){
    b2.classList.toggle("on",stages===2);b3.classList.toggle("on",stages===3);b2.classList.toggle("alt",stages!==2);b3.classList.toggle("alt",stages!==3);
    mode.textContent=stages===2?"two stages":"three stages";
    scene.innerHTML=stages===2?"A man locks as soon as they see a first bundle. In this term only <b>bandit 3</b> saw the first bundle before the sandglasses ran out, and bandit 3 is locked on it."
      :"A man locks only on a second bundle, and a second bundle exists only because three men voted on a first bundle and kept it. Here <b>bandits 2, 3 and 4</b> hold the first bundle, and bandit 3 is locked on it.";
    menBox.innerHTML=men.map(k=>`<div class="pm${holds().includes(k)?" has":""}${k===LOCK?" lock":""}${k===slow?" slow":""}"><h5><i style="background:${BC[k]}"></i>bandit ${k}</h5>first bundle: ${holds().includes(k)?"yes":"no"}<br>locked: ${k===LOCK?"yes":"no"}<br>${slow==null?"":k===slow?"answers last":"heard"}</div>`).join("");
    if(slow==null){say.textContent="Pick the slowest man.";return}
    const heard=men.filter(k=>k!==slow),who=heard.filter(k=>holds().includes(k));
    if(who.length)say.innerHTML=`The holder hears ${chips(heard)} and learns the latest first bundle from ${chips(who)}. `+(stages===3?"At least two honest men hold the first bundle, so any three answers include one of them. The lock cannot hide."
      :"Here nothing hides. But the holder need only wait for three answers, and the three need not include bandit 3.");
    else say.innerHTML=`The holder hears ${chips(heard)}. <span class="bad">None of them has the first bundle.</span> The holder proposes an entry that conflicts with bandit 3's lock, and bandit 3 refuses. The lock stayed hidden.`;
  }
  men.forEach(k=>{const bt=document.createElement("button");bt.className="btn alt chipb";bt.textContent=`bandit ${k} answers last`;bt.onclick=()=>{slow=k;render()};slowBox.appendChild(bt)});
  b2.onclick=()=>{stages=2;render()};b3.onclick=()=>{stages=3;render()};render();
})();

/* ===== a new holder every entry: terms in a row, read by the chain rule ===== */
(function(){
  const nodes={1:[-90,"B1",BC[1]],2:[0,"B2",BC[2]],3:[90,"B3",BC[3]],4:[180,"B4",BC[4]]};
  const P=Polar($("#chainsvg"),{vb:"0 0 560 560",cx:280,cy:280,r0:46,step:22,rings:10,tEnd:9.6,note:[12,22],nodes});
  const list=$("#chainlist"),say=$("#chainsay"),term=$("#chainterm"),bn=$("#chainnext"),br=$("#chainreset"),MAX=7;
  const holder=k=>(k-1)%4+1,t=k=>1.4+1.2*(k-1);
  const kinds=[["new proposal","#fffaf0","#1c1512",""],["first bundle","#fbe7a1","#1c1512",""],["locked on","#f0b429","#1c1512","s-lock"],["stands","#3f7a2a","#fffaf0","s-stands"]];
  let k=0,dots=[];
  /* the entry of term j has been carried by k-j proposals in a row: new, first bundle, locked on, stands */
  const stat=j=>kinds[Math.min(3,k-j)];
  function paint(){
    dots.forEach((g,i)=>{const s=stat(i+1);g.querySelector("circle.b").setAttribute("fill",s[1]);g.label.style.fill=s[2]});
    let h="";for(let j=k;j>=Math.max(1,k-3);j--){const s=stat(j);h+=`<div>Entry of term ${j}: <span class="stat ${s[3]}">${s[0]}</span></div>`}
    if(k>4)h+=`<div>Every entry behind them stands.</div>`;list.innerHTML=h}
  function next(){
    k++;const h=holder(k),g=P.event(h,t(k),"#fffaf0",11);g.label.textContent=k;g.style.cursor="default";dots.push(g);
    if(k>1)P.slip(holder(k-1),t(k-1),h,t(k),12);
    term.textContent=`term ${k}`;paint();
    let s=`<b>Term ${k}.</b> Bandit ${h} proposes an entry`;
    if(k===1)s+=". There is no bundle for any entry yet.";
    else{s+=` carrying the bundle for the entry of term ${k-1}, which now has its first bundle`;if(k>=3)s+=`; the entry of term ${k-2} is ready to lock on`;if(k>=4)s+=`; and the entry of term ${k-3} stands`;s+="."}
    if(k===MAX){bn.disabled=true;s+=" Three proposals in a row stand behind each entry from now on, one more entry standing at every term."}
    say.innerHTML=s}
  function reset(){P.slips.innerHTML="";P.evs.innerHTML="";dots=[];k=0;bn.disabled=false;term.textContent="no term yet";list.innerHTML="";say.textContent="The job starts at bandit 1. Press the button to run a term."}
  bn.onclick=next;br.onclick=reset;reset();
})();

/* ===== who is who ===== */
mapPairs($("#map"),[
 ["The four men; one may lie; the wind","n = 3f + 1 = 4; Byzantine faults; partial synchrony with GST (§3)"],
 ["The loot scroll; entries forming a chain","State machine replication; a tree of nodes with parent links; a branch (§4, §4.2)"],
 ["Conflicting entries","Neither branch extends the other (§4.2)"],
 ["A term; its holder","A view; its leader (§4)"],
 ["A vote; a bundle of three","A partially signed vote; a quorum certificate of n − f votes (§4.1–4.2)"],
 ["A threshold seal","A (2f + 1, n)-threshold signature, combining partial signatures into one (§3)"],
 ["First, second, third votes and bundles","prepare, pre-commit, commit votes; prepareQC, precommitQC, commitQC (§4.1)"],
 ["The latest first bundle a man sends a new holder","new-view carrying prepareQC; highQC (§4.1)"],
 ["The lock","lockedQC, set on the precommitQC (Algorithm 2, line 25)"],
 ["The rule for the first vote, its two halves","safeNode: the safety rule (extends the locked node) or the liveness rule (a higher view than the lock) (Algorithm 1)"],
 ["Never Two Entries","Conflicting nodes cannot both be committed by correct replicas (Lemma 1, Theorem 2)"],
 ["The hidden lock; two stages and a full sandglass","The livelessness of two-phase HotStuff; Tendermint and Casper's wait for Δ (§4.4; §7.3)"],
 ["Going at the Rats' Pace","Optimistic responsiveness; after GST a correct leader decides within a bounded time (Lemma 3, Theorem 4)"],
 ["Holders in fixed order; doubling sandglasses","The leader function and nextView with exponential back-off: the Pacemaker (§4.4, §6)"],
 ["A new holder every entry; three in a row","Chained HotStuff; One-, Two- and Three-Chains (§5, Algorithm 3, Theorem 5)"],
 ["Every man to every man; a heavy change","PBFT's quadratic normal case and cubic view change in authenticators (Table 1)"]]);

/* Every book's computing cover, copied from the cover:start … cover:end block of its script.js by
   scroll/book_covers.py. Do not edit here: change the book's script.js and rerun that script.
   Draw one with  COVERS.draw(svg, BOOK_COVERS[slug]) ; needs assets/js/covers.js. */
"use strict";
window.BOOK_COVERS={};
BOOK_COVERS["agreeing-among-liars"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · OM(1): TWO ROUNDS, THEN A MAJORITY","n = 3m + 1 = 4");
  const C=[260,100],L=[[100,238],[260,300],[420,238]],nm=["P2","P3","P4"],bad=1;
  /* the three-process impossibility, as an inset */
  const ix=446,iy=84;[[ix-18,iy+14],[ix+18,iy+14],[ix,iy-14]].forEach(([x,y],k)=>{node(g,x,y,5.5,null,{k:k===0?P.red:P.ink,f:k===0?P.redL:"#fff",sw:1.4})});
  el("path",{d:`M${ix-9} ${iy-9}l18 18m0 -18l-18 18`,stroke:P.red,"stroke-width":2.2,"stroke-linecap":"round",opacity:.85},g);
  T(g,ix,iy+36,"3 processes: impossible",{s:8.5,m:1,c:P.red});
  T(g,26,150,"ROUND 1",{a:"start",s:9.5,m:1,c:P.blue,w:600});
  /* round 1 */
  const p1=L.map(([x,y],k)=>{const p=link(g,C[0],C[1]+20,x,y-20,{c:"blue",w:1.8});const m=[C[0]+(x-C[0])*.34,C[1]+20+(y-40-C[1])*.34];chip(g,m[0],m[1],"1",{m:1,s:10,pad:9,k:P.blue,c:P.blue,w:600});return p});
  p1.forEach((p,k)=>packet(g,p,{c:"blue",dur:2.4,delay:k*.3}));
  /* round 2: every lieutenant relays what it heard */
  T(g,26,282,"ROUND 2",{a:"start",s:9.5,m:1,c:P.blue,w:600});
  const rel=(a,b,bend)=>{const A=L[a],B=L[b],liar=a===bad,v=liar?"0":"1",x1=A[0]+(B[0]>A[0]?19:-19),x2=B[0]+(B[0]>A[0]?-19:19),y1=A[1],y2=B[1];
    link(g,x1,y1,x2,y2,{c:liar?"red":"blue",w:1.3,bend,dash:liar?"4 3":null,op:.85});
    const m=mid(x1,y1,x2,y2,bend);chip(g,m[0],m[1],v,{m:1,s:9,pad:8,k:liar?P.red:P.blue,c:liar?P.red:P.blue,f:liar?P.redL:"#fff"})};
  rel(0,1,20);rel(1,0,20);rel(1,2,20);rel(2,1,20);rel(0,2,64);rel(2,0,64);
  L.forEach(([x,y],k)=>node(g,x,y,19,nm[k],{k:k===bad?P.red:P.ink,c:k===bad?P.red:P.ink,f:k===bad?P.redL:"#fff",halo:k===bad?P.redL:null,s:12}));
  node(g,C[0],C[1],21,"P1",{s:13,halo:P.blueL});
  chip(g,C[0]+34,C[1]-18,"commander · v = 1",{a:"start",m:1,s:9,k:P.blue,c:P.blue});
  chip(g,L[bad][0]+44,L[bad][1]+4,"traitor",{a:"start",m:1,s:9,k:P.red,c:P.red,f:P.redL});
  /* the tallies */
  [0,2].forEach(k=>{const [x,y]=L[k];
    link(g,x,y+22,x,y+74,{c:"mute",w:1,op:.5,head:false});
    vec(g,x,y+90,[1,0,1],{hi:[1],hf:P.redL,hc:P.red,w:24,h:24,s:12});
    T(g,x,y+112,"from P1 · P3 · "+(k===0?"P4":"P2"),{s:8.5,m:1,c:P.faint});
    link(g,x,y+120,x,y+142,{c:"green",w:1.6});
    chip(g,x,y+158,"majority → 1",{m:1,s:10,k:P.green,c:P.green,f:P.greenL,w:600})});
  vec(g,L[bad][0],L[0][1]+90,["?","?","?"],{w:24,h:24,s:12,k:P.line});T(g,L[bad][0],L[0][1]+112,"no need to decide",{s:8.5,m:1,c:P.faint});
  T(g,W/2,H-26,"honest lieutenants agree, and obey an honest commander",{s:10,m:1,c:P.mute});
};
return COVER;})();

BOOK_COVERS["agreeing-by-chance"]=(()=>{
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
return COVER;})();

BOOK_COVERS["agreeing-when-messages-run-late"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
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
};
return COVER;})();

BOOK_COVERS["answering-while-cut-off"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · A WRITE ON ONE SIDE, A READ ON THE OTHER","C · A · P");
  const N={1:[150,150],2:[88,262],3:[212,276],4:[420,214]},val={1:1,2:1,3:1,4:0};
  /* the partition */
  el("path",{d:"M300 70l-14 34l28 34l-28 34l28 34l-28 34l28 34l-28 34l28 34l-14 30",fill:"none",stroke:P.red,"stroke-width":2.4,"stroke-linejoin":"round","stroke-dasharray":"2 0",opacity:.85},g);
  el("rect",{x:300,y:60,width:220,height:390,fill:P.redL,opacity:.18},g);
  chip(g,300,64,"network partition",{m:1,s:9.5,k:P.red,c:P.red,f:P.redL});
  /* messages inside the left island */
  [[2,1],[2,3],[1,3],[3,1]].forEach(([a,b],k)=>{const A=N[a],B=N[b],d=Math.hypot(B[0]-A[0],B[1]-A[1]),u=[(B[0]-A[0])/d,(B[1]-A[1])/d];
    const p=link(g,A[0]+u[0]*24,A[1]+u[1]*24,B[0]-u[0]*26,B[1]-u[1]*26,{c:"blue",w:1.5,bend:k===3?14:k===2?-14:0});packet(g,p,{c:"blue",dur:2.2+k*.3,delay:k*.4})});
  /* the update that cannot cross */
  const x0=N[2][0]+24,y0=N[2][1]-8,xe=294,ye=N[2][1]-8+(N[4][1]-N[2][1])*(294-x0)/(N[4][0]-x0)*1;
  const pc=link(g,x0,y0,xe,ye,{c:"red",w:1.5,dash:"5 3",head:false});packet(g,pc,{c:"red",dur:2.6,delay:.2,r:3.4});
  el("path",{d:`M${xe-6} ${ye-6}l12 12m0 -12l-12 12`,stroke:P.red,"stroke-width":2.6,"stroke-linecap":"round"},g);
  link(g,xe+14,ye+4,N[4][0]-26,N[4][1]-4,{c:"red",w:1,dash:"2 5",head:false,op:.5});
  chip(g,xe-8,ye-30,"update(1) lost",{a:"end",m:1,s:8.5,k:P.line,c:P.red});
  /* nodes with their copies */
  for(const k in N){const [x,y]=N[k],c=k==4?"gold":"blue";
    node(g,x,y,22,"P"+k,{s:12,halo:P[c+"L"],k:P.ink});
    chip(g,x+(k==4?0:0),y+36,"value = "+val[k],{m:1,s:8.5,pad:8,k:val[k]?P.blue:P.red,c:val[k]?P.blue:P.red,f:val[k]?P.blueL:P.redL})}
  /* the clients */
  chip(g,88,336,"client · write(1) → ok ✓",{a:"start",m:1,s:9,k:P.blue,c:P.blue});
  link(g,100,328,92,288,{c:"blue",w:1,dash:"3 3",head:false});
  chip(g,N[4][0]+8,284,"client · read() → 0 ✗",{m:1,s:9,k:P.red,c:P.red,f:P.redL,w:600});
  link(g,N[4][0],270,N[4][0],244,{c:"red",w:1,dash:"3 3",head:false});
  T(g,318,330,"answers anyway → stale",{s:9.5,m:1,c:P.red,a:"start"});
  T(g,318,348,"or refuses → unavailable",{s:9.5,m:1,c:P.mute,a:"start"});
  /* the triangle */
  const tx=140,ty=392,tri=[[tx,ty-4,"P"],[tx-62,ty+60,"C"],[tx+62,ty+60,"A"]];
  tri.forEach(([x1,y1],i)=>{const [x2,y2]=tri[(i+1)%3];link(g,x1,y1,x2,y2,{c:"mute",w:1.4,head:false,op:.5})});
  tri.forEach(([x,y,t],i)=>node(g,x,y,13,t,{s:11,k:i===0?P.red:P.ink,c:i===0?P.red:P.ink,f:i===0?P.redL:"#fff"}));
  T(g,tx,ty+90,"pick any two, but P is not optional",{s:9,m:1,c:P.faint});
  chip(g,W-26,ty+24,"every request answered",{a:"end",m:1,s:9,k:P.line,c:P.mute});chip(g,W-26,ty+52,"every read sees the latest write",{a:"end",m:1,s:9,k:P.line,c:P.mute});
};
return COVER;})();

BOOK_COVERS["changes-that-never-clash"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · JOIN SEMILATTICE","merge = entrywise max");
  const cx=260,Yt=118,Y2=214,Y1=316,Y0=412,dx=122;
  const N={top:[cx,Yt,"1,1,1"],ab:[cx-dx,Y2,"1,1,0"],ac:[cx,Y2,"1,0,1"],bc:[cx+dx,Y2,"0,1,1"],a:[cx-dx,Y1,"1,0,0"],b:[cx,Y1,"0,1,0"],c:[cx+dx,Y1,"0,0,1"],o:[cx,Y0,"0,0,0"]};
  const E=[["o","a"],["o","b"],["o","c"],["a","ab"],["a","ac"],["b","ab"],["b","bc"],["c","ac"],["c","bc"],["ab","top"],["ac","top"],["bc","top"]];
  const hot={a:"blue",b:"gold",c:"red"},paths={};
  for(const [u,v] of E)link(g,N[u][0],N[u][1],N[v][0],N[v][1],{c:"mute",op:.3,head:false,w:1.4});
  /* the three replicas' states join upward */
  const up=(u,v,c)=>{const p=link(g,N[u][0],N[u][1],N[v][0],N[v][1],{c,w:2.2,op:.9});return p};
  const pp=[up("a","ab","blue"),up("a","ac","blue"),up("b","ab","gold"),up("b","bc","gold"),up("c","ac","red"),up("c","bc","red"),up("ab","top","blue"),up("ac","top","blue"),up("bc","top","gold")];
  pp.forEach((p,k)=>packet(g,p,{c:["blue","blue","gold","gold","red","red","blue","blue","gold"][k],dur:2.6+(k%3)*.4,delay:k*.3,r:3.4}));
  for(const k in N){const [x,y,v]=N[k],h=hot[k],top=k==="top";
    const c=chip(g,x,y,"["+v+"]",{m:1,s:11,w:600,f:h?P[h+"L"]:top?P.ink:"#fff",k:h?P[h]:top?P.ink:P.line,c:top?"#fff":h?P[h]:P.ink,sw:h||top?1.6:1});
    if(h){node(g,x+(k==="a"?-82:k==="c"?82:0),y+(k==="b"?36:0),15,k==="a"?"R1":k==="b"?"R2":"R3",{k:P[h],c:P[h],f:"#fff",s:10.5,halo:P[h+"L"]});
      if(k!=="b")link(g,x+(k==="a"?-68:68),y,x+(k==="a"?-48:48),y,{c:h,w:1.4,head:false,dash:"2 3"})
      else link(g,x,y+21,x,y+11,{c:h,w:1.4,head:false,dash:"2 3"});
      const vx=x+(k==="a"?-82:k==="c"?82:0),vy=y+(k==="b"?72:40);
      vec(g,vx,vy,k==="a"?[3,0,0]:k==="b"?[0,2,0]:[0,0,4],{k:P[h],hi:[k==="a"?0:k==="b"?1:2],hf:P[h+"L"],hc:P[h],w:17,h:18,s:10});
      T(g,vx,vy+19,"+1 +1 +1".slice(0,k==="a"?8:k==="b"?5:11)+"",{s:8.5,m:1,c:P.faint})}}
  T(g,cx,Yt-30,"⊔  join: every replica converges here",{s:10.5,c:P.mute,m:1});
  T(g,cx,Y0+34,"each replica starts at ⊥",{s:10,c:P.faint,m:1});
  /* formula strip */
  const fy=H-38,fx=cx;
  chip(g,fx,fy,"[3,0,0] ⊔ [0,2,0] ⊔ [0,0,4] = [3,2,4]",{m:1,s:11.5,pad:26,k:P.ink,sw:1.4,f:P.bg});
  T(g,fx,fy+26,"commutative · associative · idempotent",{s:9.5,m:1,c:P.faint})
};
return COVER;})();

BOOK_COVERS["changing-leaders-among-liars"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · A CHAIN OF CERTIFIED BLOCKS","three-chain commit");
  const by=140,bx=i=>74+i*96,st=["green","green","blue","blue","gold"],tx=["committed","committed","locked","prepared","proposed"];
  /* parent links and certificates */
  for(let i=1;i<5;i++){link(g,bx(i)-34,by,bx(i-1)+34,by,{c:"mute",w:1.6});
    chip(g,bx(i)-48,by-40,"QC",{m:1,s:8.5,pad:8,k:P.gold,c:"#8a6a00",f:P.goldL});link(g,bx(i)-48,by-31,bx(i)-48,by-22,{c:"gold",w:1.2,head:false})}
  st.forEach((c,i)=>{
    el("rect",{x:bx(i)-34,y:by-24,width:68,height:48,rx:12,fill:P[c+"L"],stroke:P[c],"stroke-width":1.8},g);
    T(g,bx(i),by-8,"b"+"₁₂₃₄₅"[i],{s:15,w:700,c:c==="gold"?"#8a6a00":P[c]});
    T(g,bx(i),by+11,"view "+(i+7),{s:8.5,m:1,c:P.mute});
    T(g,bx(i),by+40,tx[i],{s:8.5,m:1,c:c==="gold"?"#8a6a00":P[c]})});
  const bk=el("path",{d:`M${bx(2)-34} ${by+62}v6H${bx(4)+34}v-6`,fill:"none",stroke:P.ink,"stroke-width":1.4},g);
  T(g,(bx(2)+bx(4))/2,by+84,"three certificates in a row ⇒ b₃ commits",{s:9.5,m:1,c:P.ink,w:600});
  /* the star: a leader gathers votes and sends one certificate back */
  const sx=130,sy=356,ra=[[sx-66,sy-50],[sx+66,sy-50],[sx-66,sy+50],[sx+66,sy+50]],lp=[];
  T(g,26,254,"EACH PHASE: ONE LEADER, n REPLICAS",{a:"start",s:9.5,m:1,c:P.mute,w:600});
  ra.forEach(([x,y],k)=>{const bad=k===3;
    const dx=sx-x,dy=sy-y,d=Math.hypot(dx,dy),u=[dx/d,dy/d];
    const v=link(g,x+u[0]*13,y+u[1]*13,sx-u[0]*20,sy-u[1]*20,{c:bad?"red":"blue",w:1.4,bend:7,dash:bad?"3 3":null});
    const q=link(g,sx-u[0]*20,sy-u[1]*20,x+u[0]*13,y+u[1]*13,{c:"gold",w:1.4,bend:7});
    packet(g,v,{c:bad?"red":"blue",dur:2,delay:k*.3,r:3});packet(g,q,{c:"gold",dur:2,delay:1+k*.3,r:3});
    node(g,x,y,12,"R"+(k+2),{s:9,k:bad?P.red:P.ink,c:bad?P.red:P.ink,f:bad?P.redL:"#fff"})});
  node(g,sx,sy,19,"L",{s:13,halo:P.blueL,k:P.blue,c:P.blue});
  T(g,sx,sy+84,"votes in, certificate out",{s:9.5,m:1,c:P.mute});T(g,sx,sy+100,"O(n) messages, not O(n²)",{s:9.5,m:1,c:P.blue,w:600});
  /* views rotate the leader */
  const vx=316,vy=[286,328,370,412],vt=[["view 7 · leader R3",null],["view 8 · leader R4 (faulty)","red"],["timeout → next view",null],["view 9 · leader R1","blue"]];
  vt.forEach(([t,c],k)=>{chip(g,vx,vy[k],t,{a:"start",m:1,s:9,k:c?P[c]:P.line,c:c?P[c]:P.mute,f:c==="red"?P.redL:c==="blue"?P.blueL:"#fff",w:c?600:400});
    if(k<3)link(g,vx+14,vy[k]+12,vx+14,vy[k+1]-12,{c:"mute",w:1.1,op:.6})});
  T(g,vx,252,"THE LEADER ROTATES EVERY VIEW",{a:"start",s:9.5,m:1,c:P.mute,w:600});
};
return COVER;})();

BOOK_COVERS["keeping-order-among-liars"]=(()=>{
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
return COVER;})();

BOOK_COVERS["knowing-when-to-wait"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · MONOTONE OR NOT?","CALM");
  const lx=134,rx=388;
  el("line",{x1:260,x2:260,y1:86,y2:392,stroke:P.line,"stroke-width":1.4,"stroke-dasharray":"3 5"},g);
  chip(g,lx,72,"no coordination needed",{m:1,s:10,k:P.blue,c:P.blue,f:P.blueL,w:600});chip(g,rx,72,"must wait for everyone",{m:1,s:10,k:P.red,c:P.red,f:P.redL,w:600});
  /* left: a deadlock ring only ever gains edges */
  const ra=[[lx,126],[lx-50,200],[lx+50,200]],nm=["A","B","C"];
  const rp=[[0,2],[2,1],[1,0]].map(([a,b],k)=>link(g,ra[a][0]+(ra[b][0]-ra[a][0])*.25,ra[a][1]+(ra[b][1]-ra[a][1])*.25,ra[b][0]-(ra[b][0]-ra[a][0])*.25,ra[b][1]-(ra[b][1]-ra[a][1])*.25,{c:"blue",w:2,bend:-14}));
  rp.forEach((p,k)=>packet(g,p,{c:"blue",dur:2.4,delay:k*.5,r:3.2}));
  ra.forEach(([x,y],k)=>node(g,x,y,15,nm[k],{k:P.blue,c:P.blue,f:P.blueL,s:12}));
  T(g,lx,236,"is there a cycle?",{s:10.5,c:P.ink,w:600});T(g,lx,252,"once found, found forever",{s:9.5,m:1,c:P.blue});
  /* right: garbage is the absence of a path */
  const gp=[[rx-68,150],[rx,150],[rx+68,150]],gn=["root","X","Y"];
  link(g,gp[0][0]+18,150,gp[1][0]-17,150,{c:"ink",w:1.8});
  link(g,gp[1][0]+17,150,gp[2][0]-17,150,{c:"red",w:1.6,dash:"4 4",head:false});
  T(g,rx+34,134,"?",{s:16,w:700,c:P.red});
  gp.forEach(([x,y],k)=>node(g,x,y,k==0?17:15,gn[k],{s:k==0?9.5:12,k:k==2?P.red:P.ink,c:k==2?P.red:P.ink,f:k==2?P.redL:"#fff"}));
  T(g,rx,196,"is Y unreachable?",{s:10.5,c:P.ink,w:600});T(g,rx,212,"a message may still be in flight",{s:9.5,m:1,c:P.red});
  chip(g,rx,238,"wait: has everyone reported?",{m:1,s:8.5,pad:10,k:P.red,c:P.red,f:"#fff"});
  /* growth of answers */
  const by=372;
  [20,36,52,68,84].forEach((h,k)=>{el("rect",{x:lx-70+k*30,y:by-h,width:22,height:h,rx:4,fill:P.blueL,stroke:P.blue,"stroke-width":1.3},g)});
    T(g,lx,by+16,"answers only ever grow",{s:10,m:1,c:P.blue});
  [20,36,52].forEach((h,k)=>el("rect",{x:rx-70+k*30,y:by-h,width:22,height:h,rx:4,fill:P.redL,stroke:P.red,"stroke-width":1.3},g));
  el("rect",{x:rx+20,y:by-28,width:22,height:28,rx:4,fill:"#fff",stroke:P.red,"stroke-width":1.3,"stroke-dasharray":"4 3"},g);
  el("rect",{x:rx+20,y:by-52,width:22,height:24,rx:4,fill:"none",stroke:P.red,"stroke-width":1,"stroke-dasharray":"2 3",opacity:.5},g);
  link(g,rx+31,by-58,rx+31,by-34,{c:"red",w:1.6});
  T(g,rx+31,by-72,"taken back",{s:8.5,m:1,c:P.red});
  T(g,rx,by+16,"a new fact retracts an answer",{s:10,m:1,c:P.red});
  chip(g,W/2,H-60,"coordination-free  ⇔  monotonic",{m:1,s:12,pad:30,k:P.ink,sw:1.5,f:P.bg,w:600});
  T(g,W/2,H-28,"not · none · every · only · highest · count  ⇒  wait",{s:9.5,m:1,c:P.faint});
};
return COVER;})();

BOOK_COVERS["many-copies-acting-as-one"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · EVERY OPERATION TAKES EFFECT AT ONE INSTANT","linearizability");
  const Y=[112,176,240],lbl=["P1","P2","P3"];
  Y.forEach((y,j)=>{lane(g,64,500,y,{w:1.2});node(g,36,y,14,lbl[j],{s:10.5})});
  T(g,W-26,74,"real time →",{a:"end",s:9.5,m:1,c:P.faint});
  /* operations: lane, start, end, label, linearization point, colour */
  const O=[[0,74,214,"enq(x)",150,"blue"],[1,150,300,"enq(y)",236,"gold"],[2,262,414,"deq() → x",318,"red"],[0,340,490,"deq() → y",430,"green"]];
  O.forEach(([l,a,b,t,p,c],k)=>{const y=Y[l];
    el("rect",{x:a,y:y-16,width:b-a,height:32,rx:16,fill:P[c+"L"],stroke:P[c],"stroke-width":1.5},g);
    T(g,(a+b)/2,y-2,t,{s:10,m:1,w:600,c:P[c]==="#e0b84a"?"#8a6a00":P[c]});
    link(g,p,y+16,p,334,{c:"red",w:1,dash:"2 3",head:false,op:.55});
    el("path",{d:`M${p} ${y+9}l6 7l-6 7l-6 -7z`,fill:P.red,stroke:"#fff","stroke-width":1.2},g)});
  /* real-time order: one operation ends before the next begins */
  link(g,214,Y[0]+16,262,Y[2]-16,{c:"mute",w:1.1,dash:"4 3",bend:12,op:.7});
  chip(g,206,Y[1]+34,"returned before the next began",{a:"end",m:1,s:8.5,pad:8,k:P.line,c:P.mute});
  chip(g,372,Y[1]+8,"overlap: either order",{m:1,s:8.5,pad:8,k:P.line,c:P.mute});
  /* the one-at-a-time queue */
  const qy=334;lane(g,64,500,qy,{w:2,c:"ink"});
  O.forEach(([l,a,b,t,p,c])=>{dot(g,p,qy,5,P.red,"#fff")});
  T(g,26,qy-0,"",{});
  T(g,26,362,"a single queue, one step at a time",{a:"start",s:10,m:1,c:P.mute});
  const st=[[150,"enq x","[ x ]"],[236,"enq y","[ x y ]"],[318,"deq → x","[ y ]"],[430,"deq → y","[   ]"]];
  st.forEach(([x,t,q],k)=>{
    el("rect",{x:x-34,y:384,width:68,height:44,rx:10,fill:"#fff",stroke:P.line,"stroke-width":1.2},g);
    T(g,x,398,t,{s:9,m:1,c:P.mute});T(g,x,416,q,{s:12,m:1,w:700,c:P.ink})});
  st.slice(0,3).forEach(([x],k)=>link(g,x+36,406,st[k+1][0]-36,406,{c:"mute",w:1.2,op:.6}));
  chip(g,W/2,H-30,"copies, caches and workers behind it may do anything they like",{m:1,s:8.5,pad:16,k:P.line,c:P.mute});
};
return COVER;})();

BOOK_COVERS["one-leader-at-a-time"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
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
};
return COVER;})();

BOOK_COVERS["ordering-without-clocks"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · HAPPENED-BEFORE, WITH NO SHARED CLOCK","L(e) · V(e)");
  const Y=[126,230,334],X0=66,X1=498;
  ["P1","P2","P3"].forEach((n,j)=>{lane(g,X0,X1,Y[j],{w:1.5});node(g,34,Y[j],14,n,{s:10.5})});
  /* events: lane, x, lamport, vector */
  const E={a:[0,104,1,"[1,0,0]"],b:[1,184,2,"[1,1,0]"],c:[1,246,3,"[1,2,0]"],x:[2,126,1,"[0,0,1]"],d:[2,326,4,"[1,2,2]"],e:[2,386,5,"[1,2,3]"],f:[0,458,6,"[2,2,3]"]};
  const M=[["a","b"],["c","d"],["e","f"]];
  /* the causal chain, thick */
  const ps=M.map(([u,v],k)=>link(g,E[u][1],Y[E[u][0]],E[v][1],Y[E[v][0]],{c:"blue",w:2.2,bend:k===2?-18:0}));
  link(g,E.b[1],Y[1],E.c[1],Y[1],{c:"blue",w:2.2,head:false});link(g,E.d[1],Y[2],E.e[1],Y[2],{c:"blue",w:2.2,head:false});
  ps.forEach((p,k)=>packet(g,p,{c:"gold",dur:2.4,delay:k*.5}));
  /* concurrent: x and a */
  link(g,E.x[1]+8,Y[2]-8,E.a[1]+4,Y[0]+10,{c:"red",w:1.2,dash:"3 3",head:false,op:.8});
  T(g,26,Y[1]-40,"concurrent:",{a:"start",s:9.5,m:1,c:P.red,w:600});T(g,26,Y[1]-26,"a ∥ x",{a:"start",s:9.5,m:1,c:P.red});
  /* the outside channel */
  el("path",{d:`M${E.f[1]+16} ${Y[0]+14}C ${W-10} ${Y[0]+110} ${W-10} ${Y[2]-110} ${E.e[1]+30} ${Y[2]-8}`,fill:"none",stroke:P.faint,"stroke-width":1.4,"stroke-dasharray":"2 5"},g);
  T(g,W-30,Y[1]+8,"phone call",{s:8.5,m:1,c:P.faint,a:"end"});T(g,W-30,Y[1]+22,"(no message)",{s:8.5,m:1,c:P.faint,a:"end"});
  for(const k in E){const [l,x,L,V]=E[k],y=Y[l];
    node(g,x,y,8,null,{k:P.ink,f:k==="a"||k==="x"?P.goldL:"#fff",sw:1.8});
    chip(g,x,y-24,String(L),{m:1,s:10.5,pad:8,w:600,k:P.blue,c:P.blue,f:P.blueL});
    T(g,x,y+22,V,{s:9,m:1,c:P.mute})}
  /* the rule */
  const ry=420;
  el("rect",{x:26,y:ry-22,width:W-52,height:62,rx:14,fill:P.bg},g);
  T(g,48,ry-4,"L(receive) = max(L(own), L(msg)) + 1",{a:"start",s:11,m:1,c:P.blue});
  T(g,48,ry+18,"V(receive) = max(V(own), V(msg)), own entry + 1",{a:"start",s:11,m:1,c:P.mute});
  T(g,W-48,ry+4,"a → b ⇔ V(a) < V(b)",{a:"end",s:11,m:1,w:600,c:P.ink});
  T(g,W/2,H-34,"Lamport stamp above each event, vector clock below",{s:9.5,m:1,c:P.faint});
};
return COVER;})();

BOOK_COVERS["probably-up-to-date"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · A PARTIAL QUORUM: N = 3, W = 2, R = 1","PBS");
  const X=[96,260,424],cy=170,names=["R1","R2","R3"],ver=["v7","v7","v6"];
  /* the quorums */
  el("ellipse",{cx:178,cy,rx:132,ry:62,fill:P.blueL,opacity:.55,stroke:P.blue,"stroke-width":1.5,"stroke-dasharray":"5 4"},g);
  el("ellipse",{cx:424,cy,rx:62,ry:62,fill:P.goldL,opacity:.7,stroke:P.gold,"stroke-width":1.5,"stroke-dasharray":"5 4"},g);
  chip(g,178,cy-78,"write quorum, W = 2",{m:1,s:9,k:P.blue,c:P.blue});chip(g,424,cy-78,"read quorum, R = 1",{m:1,s:9,k:P.gold,c:"#8a6a00"});
  X.forEach((x,i)=>{const stale=i===2;
    el("rect",{x:x-42,y:cy-34,width:84,height:68,rx:14,fill:"#fff",stroke:stale?P.red:P.ink,"stroke-width":1.8},g);
    T(g,x,cy-16,names[i],{s:11,w:600,c:P.mute});T(g,x,cy+10,ver[i],{s:22,w:700,c:stale?P.red:P.blue});
    T(g,x,cy+27,stale?"stale":"newest",{s:8.5,m:1,c:stale?P.red:P.faint})});
  /* the writer and reader */
  chip(g,178,56,"writer · put(v7)",{m:1,s:9.5,k:P.blue,c:P.blue,f:"#fff",w:600});chip(g,424,56,"reader · get()",{m:1,s:9.5,k:P.gold,c:"#8a6a00",f:"#fff",w:600});
  const pw=[link(g,150,68,X[0]+14,cy-36,{c:"blue",w:1.6}),link(g,206,68,X[1]-14,cy-36,{c:"blue",w:1.6})];pw.forEach((p,k)=>packet(g,p,{c:"blue",dur:2,delay:k*.3}));
  const pr=link(g,424,68,424,cy-36,{c:"gold",w:1.6});packet(g,pr,{c:"gold",dur:2});
  const lt=link(g,X[1]+46,cy+8,X[2]-46,cy+8,{c:"mute",w:1.3,dash:"3 4",op:.6});
  chip(g,(X[1]+X[2])/2,cy+28,"v7 still in transit",{m:1,s:8.5,pad:8,k:P.line,c:P.mute});
  chip(g,424,cy+84,"read returns v6 ✗",{m:1,s:9.5,k:P.red,c:P.red,f:P.redL,w:600});
  /* the staleness curve */
  const cx0=70,cx1=482,cb=444,ct=292;
  T(g,26,266,"chance a read is current, t after the write commits",{a:"start",s:10,m:1,c:P.mute});
  [0,.5,1].forEach(f=>{const y=cb-(cb-ct)*f;el("line",{x1:cx0,x2:cx1,y1:y,y2:y,stroke:P.soft,"stroke-width":1},g)});
  el("line",{x1:cx0,x2:cx0,y1:ct-6,y2:cb,stroke:P.line,"stroke-width":1.4},g);el("line",{x1:cx0,x2:cx1,y1:cb,y2:cb,stroke:P.line,"stroke-width":1.4},g);
  const d=`M${cx0} ${cb-20}C${cx0+80} ${cb-24},${cx0+120} ${cb-96},${cx0+190} ${cb-122}S${cx0+330} ${ct+4},${cx1} ${ct}`;
  el("path",{d:d+`L${cx1} ${cb}L${cx0} ${cb}Z`,fill:P.blueL,opacity:.5},g);
  const cv=el("path",{d,fill:"none",stroke:P.blue,"stroke-width":2.4,"stroke-linecap":"round"},g);packet(g,cv,{c:"blue",dur:4.2,r:4});
  [[cx0,"0"],[cx0+110,"10 ms"],[cx0+230,"100 ms"],[cx1-20,"1 s"]].forEach(([x,t])=>{el("line",{x1:x,x2:x,y1:cb,y2:cb+5,stroke:P.faint,"stroke-width":1},g);T(g,x,cb+16,t,{s:9,m:1,c:P.faint})});
  T(g,cx0-6,ct,"100%",{a:"end",s:9,m:1,c:P.faint});T(g,cx0-6,(ct+cb)/2,"50%",{a:"end",s:9,m:1,c:P.faint});
  const pt=cv.getPointAtLength(cv.getTotalLength()*.62);dot(g,pt.x,pt.y,5,P.red,"#fff");
  chip(g,pt.x+12,pt.y+36,"99.9% current after t",{a:"start",m:1,s:9,k:P.red,c:P.red,f:"#fff"});link(g,pt.x+10,pt.y+30,pt.x+3,pt.y+6,{c:"red",w:1,head:false});
  chip(g,W-26,H-24,"R + W ≤ N → reads may be stale, rarely and briefly",{a:"end",m:1,s:9,k:P.line,c:P.mute});
};
return COVER;})();

BOOK_COVERS["spreading-by-word-of-mouth"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · EPIDEMIC REPLICATION","S → I → R");
  const R=rnd32(11),n=19,sp=22,x0=(W-(n-1)*sp)/2,y0=78,seed=[6,5];
  const cells=[];
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const d=Math.hypot(i-seed[0],j-seed[1])*(0.8+0.45*R());
    cells.push({i,j,x:x0+i*sp,y:y0+j*sp,d,far:R()<.035})}
  const st=c=>c.d<4.4?"R":c.d<6.3||c.far?"I":"S";
  const fill={S:"#e6e6eb",I:P.gold,R:"#9ccf9c"};
  const lay=el("g",{},g);
  for(const c of cells){const s=st(c);
    if(s==="I")el("circle",{cx:c.x,cy:c.y,r:11,fill:P.goldL,opacity:.8},lay);
    el("circle",{cx:c.x,cy:c.y,r:s==="S"?5.6:7.2,fill:fill[s]},lay)}
  /* anti-entropy and rumour arcs between sites */
  const inf=cells.filter(c=>st(c)==="I"),rem=cells.filter(c=>st(c)==="R"),arcs=el("g",{},g),paths=[];
  const sd=cells.find(c=>c.i===seed[0]&&c.j===seed[1]);
  for(let k=0;k<8;k++){
    const a=k<5?sd:rem[Math.floor(R()*rem.length)],b=inf[Math.floor(R()*inf.length)];
    if(!a||!b||a===b)continue;
    paths.push(link(arcs,a.x,a.y,b.x,b.y,{c:"blue",w:1.2,bend:(R()<.5?-1:1)*(26+R()*34),op:.55}))}
  paths.slice(0,5).forEach((p,k)=>packet(g,p,{c:"blue",dur:3+k*.45,delay:k*.5}));
  /* the seed and the callouts */
  node(g,sd.x,sd.y,9,null,{k:P.red,f:P.red,sw:2,halo:P.redL});
  dot(g,sd.x,sd.y,3,"#fff");
  const far=cells.filter(c=>st(c)==="S"&&c.i>13&&c.j>12)[3]||cells[cells.length-30];
  const tomb=rem[Math.floor(rem.length*.6)];
  el("path",{d:`M${tomb.x-4} ${tomb.y-4}l8 8m0 -8l-8 8`,stroke:P.red,"stroke-width":2,"stroke-linecap":"round"},g);
  chip(g,sd.x-22,sd.y-30,"seed · update u, ts 17",{a:"start",m:1,s:9.5,k:P.red,c:P.red});
  link(g,sd.x-8,sd.y-26+8,sd.x-4,sd.y-10,{c:"red",w:1,head:false});
  chip(g,tomb.x+14,tomb.y+30,"death certificate",{a:"start",m:1,s:9.5,k:P.red,c:P.red});
  link(g,tomb.x+8,tomb.y+22,tomb.x+2,tomb.y+5,{c:"red",w:1,head:false});
  chip(g,far.x+10,far.y-20,"not yet received",{a:"end",m:1,s:9.5,k:P.line,c:P.mute});
  /* legend */
  const ly=H-30;let lx=26;
  for(const [k,t] of [["S","susceptible"],["I","infective"],["R","removed"]]){
    dot(g,lx+6,ly,6,fill[k]);T(g,lx+18,ly,t,{a:"start",s:11,c:P.mute});lx+=t.length*6.1+44}
  T(g,W-26,ly,"push · pull · push-pull",{a:"end",s:10,c:P.faint,m:1})
};
return COVER;})();

BOOK_COVERS["taking-stock-without-stopping"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · A SNAPSHOT TAKEN WHILE UNITS ARE IN FLIGHT","Chandy–Lamport");
  const N={1:[260,128,"P1",40],2:[118,326,"P2",60],3:[402,326,"P3",50]};
  /* the cut, drawn behind everything */
  el("path",{d:"M52 232C150 276 230 196 330 238S440 214 482 196",fill:"none",stroke:P.red,"stroke-width":1.6,"stroke-dasharray":"6 5",opacity:.7},g);
  chip(g,468,176,"consistent cut",{a:"end",m:1,s:9,k:P.red,c:P.red,f:P.redL});
  /* channels */
  const ch=[[1,2,-22,[1]],[2,1,-22,[]],[1,3,-22,[1]],[3,1,-22,[]],[2,3,-22,[]],[3,2,-22,[1,2]]],ps=[];
  ch.forEach(([a,b,bd,u],k)=>{const A=N[a],B=N[b],d=Math.hypot(B[0]-A[0],B[1]-A[1]),e=[(B[0]-A[0])/d,(B[1]-A[1])/d];
    const p=link(g,A[0]+e[0]*36,A[1]+e[1]*36,B[0]-e[0]*40,B[1]-e[1]*40,{c:"mute",w:1.6,bend:-bd,op:.75});ps.push(p);
    const Ln=p.getTotalLength();
    u.forEach((_,i)=>{const q=p.getPointAtLength(Ln*(.3+i*.2+k%2*.1));el("circle",{cx:q.x,cy:q.y,r:5,fill:P.gold,stroke:"#fff","stroke-width":1.4},g)})});
  /* markers moving out from the initiator */
  const mk=(p,delay)=>{const m=el("path",{d:"M0 -6.5L6.5 0L0 6.5L-6.5 0z",fill:P.red,stroke:"#fff","stroke-width":1.2},g);
    if(reduce){const q=p.getPointAtLength(p.getTotalLength()*.55);m.setAttribute("transform",`translate(${q.x} ${q.y})`)}
    else el("animateMotion",{dur:"3.2s",begin:delay+"s",repeatCount:"indefinite",path:p.getAttribute("d")},m)};
  mk(ps[0],0);mk(ps[2],.3);mk(ps[3],1.2);
  /* processes */
  for(const k in N){const [x,y,t,u]=N[k],rec=k!=3;
    if(rec)el("circle",{cx:x,cy:y,r:40,fill:"none",stroke:P.green,"stroke-width":1.6,"stroke-dasharray":"4 4"},g);
    else el("circle",{cx:x,cy:y,r:40,fill:"none",stroke:P.faint,"stroke-width":1.4,"stroke-dasharray":"2 5"},g);
    node(g,x,y,29,t,{s:14,halo:rec?P.greenL:null,k:P.ink});
  }
  [[1,-58,"local: 40 u"],[2,56,"local: 60 u"],[3,56,"not recorded yet"]].forEach(([k,dy,t])=>{const [x,y]=N[k];chip(g,x,y+dy,t,{m:1,s:9,k:k==3?P.line:P.green,c:k==3?P.mute:P.green,f:k==3?"#fff":P.greenL})});
  chip(g,194,282,"channel: 20 u",{m:1,s:8.5,pad:8,k:P.line,c:P.mute});chip(g,334,196,"channel: 10 u",{m:1,s:8.5,pad:8,k:P.line,c:P.mute});
  /* legend and the sum */
  const ly=H-70;dot(g,40,ly,5.5,P.gold);T(g,52,ly,"unit",{a:"start",s:10.5,c:P.mute});
  el("path",{d:`M110 ${ly-6}L116 ${ly}L110 ${ly+6}L104 ${ly}z`,fill:P.red},g);T(g,124,ly,"marker",{a:"start",s:10.5,c:P.mute});
  el("circle",{cx:196,cy:ly,r:5.5,fill:"none",stroke:P.green,"stroke-width":1.5,"stroke-dasharray":"2 2"},g);T(g,208,ly,"state recorded",{a:"start",s:10.5,c:P.mute});
  chip(g,W/2,H-32,"Σ local states + Σ channel records = 200  ✓  nothing lost",{m:1,s:10.5,pad:26,k:P.ink,sw:1.4,f:P.bg,w:600});
};
return COVER;})();

BOOK_COVERS["telling-the-dead-from-the-slow"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · A FAILURE DETECTOR AT P1","◇P · eventually perfect");
  const x0=106,x1=488,ys=[106,154,202],T0=[0,1,2,3,4,5,6,7,8,9,10];
  const px=t=>x0+t*36;
  ys.forEach((y,j)=>{lane(g,x0-16,x1+6,y,{w:1.3,c:j===2?"red":null,dash:j===2?"4 4":null});node(g,40,y,14,"P"+(j+2),{s:10.5,k:j===2?P.red:P.ink,c:j===2?P.red:P.ink,f:j===2?P.redL:"#fff"})});
  T(g,26,70,"heartbeats arriving at P1",{a:"start",s:10,m:1,c:P.mute});
  const hb=(y,x,c)=>{el("line",{x1:x,x2:x,y1:y-9,y2:y+9,stroke:P[c||"blue"],"stroke-width":2.2,"stroke-linecap":"round"},g)};
  [0,1,2,5,6,7,8,9,10].forEach(t=>hb(ys[0],px(t)));  /* P2: one late heartbeat, at t=3.8 */
  hb(ys[0],px(3.9),"blue");
  [0,1,2,3,4,5,6,7,8,9,10].forEach(t=>hb(ys[1],px(t)));
  [0,1,2,3,4,5,6].forEach(t=>hb(ys[2],px(t)));
  /* the crash */
  el("path",{d:`M${px(6.9)-6} ${ys[2]-6}l12 12m0 -12l-12 12`,stroke:P.red,"stroke-width":2.6,"stroke-linecap":"round"},g);
  chip(g,px(7.6),ys[2]-22,"crash",{a:"start",m:1,s:8.5,pad:8,k:P.red,c:P.red,f:P.redL});
  /* the timeout brackets */
  const br=(y,xa,xb,c,t)=>{el("path",{d:`M${xa} ${y+14}v5h${xb-xa}v-5`,fill:"none",stroke:P[c],"stroke-width":1.3},g);T(g,(xa+xb)/2,y+30,t,{s:8.5,m:1,c:P[c]})};
  br(ys[0],px(2),px(3.5),"red","Δ");br(ys[0],px(5),px(7),"green","Δ′ > Δ");br(ys[2],px(6),px(9),"red","Δ″");
  chip(g,px(3.5)+4,ys[0]-22,"false suspicion",{a:"start",m:1,s:8.5,pad:8,k:P.red,c:P.red,f:P.redL});
  /* the suspect list over time */
  T(g,26,262,"suspect list at P1",{a:"start",s:10,m:1,c:P.mute});
  const sy=[288,318,348];
  const seg=(y,xa,xb,c)=>el("rect",{x:xa,y:y-7,width:xb-xa,height:14,rx:7,fill:c,opacity:.9},g);
  ys.forEach((_,j)=>node(g,40,sy[j],11,"P"+(j+2),{s:9,k:j===2?P.red:P.ink,c:j===2?P.red:P.ink}));
  seg(sy[0],x0-10,px(3.5),P.green);seg(sy[0],px(3.5),px(3.9),P.red);seg(sy[0],px(3.9),x1+4,P.green);
  seg(sy[1],x0-10,x1+4,P.green);
  seg(sy[2],x0-10,px(9),P.green);seg(sy[2],px(9),x1+4,P.red);
  T(g,x1+4,sy[0]+19,"trusted again",{a:"end",s:8.5,m:1,c:P.green});T(g,x1+4,sy[2]+19,"suspected, forever",{a:"end",s:8.5,m:1,c:P.red});
  [[P.green,"trusted"],[P.red,"suspected"]].forEach(([c,t],k)=>{dot(g,106+k*92,382,5,c);T(g,106+k*92+10,382,t,{a:"start",s:10,c:P.mute})});
  /* the timeout grows */
  T(g,W-26,400,"timeout grows with each false suspicion",{a:"end",s:9.5,m:1,c:P.mute});
  [36,54,72,90].forEach((w,k)=>el("rect",{x:W-26-210+k*54,y:478-w*.6,width:42,height:w*.6,rx:3,fill:P.blueL,stroke:P.blue,"stroke-width":1.2},g));
  T(g,26,430,"every live process",{a:"start",s:10,c:P.mute});T(g,26,446,"is eventually trusted;",{a:"start",s:10,c:P.mute});T(g,26,462,"every crashed one, suspected",{a:"start",s:10,c:P.mute});
};
return COVER;})();

BOOK_COVERS["the-limits-of-agreement"]=(()=>{
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
return COVER;})();

BOOK_COVERS["the-part-time-parliament"]=(()=>{
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
return COVER;})();

BOOK_COVERS["what-you-can-promise-alone"]=(()=>{
const COVER=(svg,{P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,el,reduce})=>{
  const g=stage(svg,"FIG. 1 · WHAT A REPLICA CAN PROMISE ALONE","HAT");
  /* two replicas, cut off from one another */
  const A=[130,150],B=[390,150];
  el("path",{d:"M260 74l-12 26l24 26l-24 26l24 26l-24 26l12 24",fill:"none",stroke:P.red,"stroke-width":2.4,"stroke-linejoin":"round"},g);
  chip(g,260,64,"partition",{m:1,s:9,k:P.red,c:P.red,f:P.redL});
  node(g,A[0],A[1],24,"R1",{s:12,halo:P.blueL});node(g,B[0],B[1],24,"R2",{s:12,halo:P.blueL});
  chip(g,A[0],86,"T1: w(x) w(y) commit ✓",{m:1,s:9,k:P.blue,c:P.blue,f:"#fff"});chip(g,B[0],86,"T2: r(x) r(y) commit ✓",{m:1,s:9,k:P.blue,c:P.blue,f:"#fff"});
  [A,B].forEach(([x,y],k)=>{const p=link(g,x,102,x,y-28,{c:"blue",w:1.5});packet(g,p,{c:"blue",dur:1.8,delay:k*.4})});
  T(g,A[0],196,"always answers, never waits",{s:9.5,m:1,c:P.mute});T(g,B[0],196,"always answers, never waits",{s:9.5,m:1,c:P.mute});
  /* the three tiers */
  const tiers=[
   ["KEPT BY ANY REPLICA ALONE","green",["Read Committed","Monotonic Atomic View","Repeatable Reads","Monotonic Reads"]],
   ["KEPT IF THE CLIENT STAYS WITH ONE REPLICA","blue",["Read Your Writes","PRAM","Causal Consistency"]],
   ["KEPT BY NO REPLICA ALONE","red",["Lost Update","Write Skew","Linearizability"]]];
  tiers.forEach(([t,c,items],k)=>{const y=224+k*76;
    el("rect",{x:26,y,width:W-52,height:66,rx:14,fill:P[c+"L"],opacity:.55},g);el("rect",{x:26,y,width:6,height:66,rx:3,fill:P[c]},g);
    T(g,46,y+15,t,{a:"start",s:9,m:1,c:P[c],w:700});
    let x=46;items.forEach(s=>{const ch=chip(g,x,y+43,s,{a:"start",s:9.5,k:P[c],c:P.ink,f:"#fff"});x+=ch.w+8});
    if(k<2){const ar=el("path",{d:`M${W-48} ${y+70}l0 4`,stroke:P.faint},g)}});
  T(g,W-44,224+15,"✓",{a:"end",s:14,w:700,c:P.green});T(g,W-44,224+76+15,"✓",{a:"end",s:14,w:700,c:P.blue});T(g,W-44,224+152+15,"✗",{a:"end",s:14,w:700,c:P.red});
  chip(g,W/2,H-30,"high availability  ·  144 consistency and isolation levels sorted by what they need",{m:1,s:8.5,pad:18,k:P.line,c:P.mute});
};
return COVER;})();

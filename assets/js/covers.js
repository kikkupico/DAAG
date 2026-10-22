/* The computing covers: one drawn figure per book, in the computing dress.
   Load after book.js, before script.js.  A book calls  COVERS.draw("#coversvg","name").
   The kit draws on a 520 x 520 card: dot-grid ground, process lanes, nodes, packets and labels. */
(function(){
const {el,reduce}=BOOK;
const P={ink:"#1d1d1f",mute:"#6e6e73",faint:"#a1a1a6",line:"#d2d2d7",soft:"#ececf0",bg:"#f5f5f7",
  blue:"#0a6fc2",blueL:"#d7e8fa",red:"#bf4a26",redL:"#f8e1d8",gold:"#e0b84a",goldL:"#f8edc9",green:"#2f8a3a",greenL:"#dff0d6"};
const MONO="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const W=520,H=520;

/* ---------- the kit ---------- */
function stage(svg,cap,tag){
  svg.setAttribute("viewBox",`0 0 ${W} ${H}`);svg.setAttribute("class","cover-fig");svg.textContent="";
  const d=el("defs",{},svg);
  const pt=el("pattern",{id:"cv-dots",width:16,height:16,patternUnits:"userSpaceOnUse"},d);
  el("circle",{cx:8,cy:8,r:.9,fill:"#d9d9de"},pt);
  for(const k of["ink","blue","red","mute","gold","green"]){
    const m=el("marker",{id:"cvah-"+k,viewBox:"0 0 10 10",refX:8.5,refY:5,markerWidth:6.5,markerHeight:6.5,orient:"auto"},d);
    el("path",{d:"M1 1.5L8.8 5L1 8.5z",fill:P[k]},m)}
  const g=el("g",{},svg);
  el("rect",{width:W,height:H,fill:"#fff"},g);
  el("rect",{width:W,height:H,fill:"url(#cv-dots)"},g);
  if(cap&&!svg.dataset.crop)T(g,26,26,cap,{a:"start",s:10,c:P.mute,m:1,w:600,ls:".06em"});
  if(tag&&!svg.dataset.crop)T(g,W-26,26,tag,{a:"end",s:10,c:P.faint,m:1});
  return g}
function T(g,x,y,s,o={}){
  const t=el("text",{x,y,"font-size":o.s||11,fill:o.c||P.ink,"text-anchor":o.a||"middle","font-weight":o.w||400,"dominant-baseline":"central"},g);
  let st="";if(o.m)st+=`font-family:${MONO};`;if(o.ls)st+=`letter-spacing:${o.ls};`;if(o.i)st+="font-style:italic;";
  if(st)t.setAttribute("style",st);if(o.op)t.setAttribute("opacity",o.op);t.textContent=s;return t}
function chip(g,x,y,s,o={}){
  const sz=o.s||10,w=Math.max(sz*1.9,s.length*sz*(o.m?.62:.56)+(o.pad||14)),h=sz+9,a=o.a||"middle";
  const x0=a==="start"?x:a==="end"?x-w:x-w/2;
  const c=el("g",{},g);
  el("rect",{x:x0,y:y-h/2,width:w,height:h,rx:o.r??h/2,fill:o.f||"#fff",stroke:o.k||P.line,"stroke-width":o.sw||1},c);
  T(c,x0+w/2,y+.5,s,{s:sz,c:o.c||P.ink,m:o.m,w:o.w});c.w=w;c.h=h;c.x0=x0;return c}
function node(g,x,y,r,label,o={}){
  const n=el("g",{transform:`translate(${x} ${y})`},g);
  if(o.halo)el("circle",{r:r+5,fill:o.halo,opacity:.55},n);
  el("circle",{r,fill:o.f||"#fff",stroke:o.k||P.ink,"stroke-width":o.sw||1.8,"stroke-dasharray":o.dash||null},n);
  if(label!=null)T(n,0,.5,label,{s:o.s||r*.85,w:600,c:o.c||P.ink});return n}
function link(g,x1,y1,x2,y2,o={}){
  const L=Math.hypot(x2-x1,y2-y1)||1,b=o.bend||0,cx=(x1+x2)/2-(y2-y1)/L*b,cy=(y1+y2)/2+(x2-x1)/L*b;
  const d=b?`M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`:`M${x1} ${y1}L${x2} ${y2}`;
  const a={d,fill:"none",stroke:P[o.c||"ink"],"stroke-width":o.w||1.3,"stroke-linecap":"round"};
  if(o.dash)a["stroke-dasharray"]=o.dash;if(o.op!=null)a.opacity=o.op;if(o.head!==false)a["marker-end"]=`url(#cvah-${o.c||"ink"})`;
  return el("path",a,g)}
function mid(x1,y1,x2,y2,b=0){const L=Math.hypot(x2-x1,y2-y1)||1,cx=(x1+x2)/2-(y2-y1)/L*b,cy=(y1+y2)/2+(x2-x1)/L*b;return[(x1+2*cx+x2)/4,(y1+2*cy+y2)/4]}
function packet(g,path,o={}){
  const c=el("circle",{r:o.r||3.6,fill:P[o.c||"blue"],stroke:"#fff","stroke-width":1.2},g);
  if(reduce){const Ln=path.getTotalLength(),p=path.getPointAtLength(Ln*(o.at??.5));c.setAttribute("cx",p.x);c.setAttribute("cy",p.y);return c}
  el("animateMotion",{dur:(o.dur||3.4)+"s",begin:(o.delay||0)+"s",repeatCount:"indefinite",path:path.getAttribute("d")},c);return c}
function lane(g,x1,x2,y,o={}){return el("line",{x1,x2,y1:y,y2:y,stroke:o.c?P[o.c]:P.line,"stroke-width":o.w||1.6,"stroke-dasharray":o.dash||null,"stroke-linecap":"round"},g)}
function dot(g,x,y,r,f,k){return el("circle",{cx:x,cy:y,r,fill:f||P.ink,stroke:k||"none","stroke-width":1.2},g)}
function vec(g,x,y,vals,o={}){   /* a vector clock or counter: small boxes, centred on x */
  const w=o.w||19,h=o.h||20,n=vals.length,x0=x-n*w/2,c=el("g",{},g);
  vals.forEach((v,i)=>{
    el("rect",{x:x0+i*w,y:y-h/2,width:w,height:h,fill:(o.hi&&o.hi.includes(i))?(o.hf||P.blueL):"#fff",stroke:o.k||P.ink,"stroke-width":1.2},c);
    T(c,x0+i*w+w/2,y+.5,String(v),{s:o.s||11,m:1,w:600,c:(o.hi&&o.hi.includes(i))?(o.hc||P.blue):P.ink})});
  return c}
function bandX(g,x,w,y1,y2,f){return el("rect",{x,y:y1,width:w,height:y2-y1,fill:f||P.bg,rx:8},g)}
function rnd32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const K={P,W,H,stage,T,chip,node,link,mid,packet,lane,dot,vec,bandX,rnd32,MONO,el,reduce};

/* a book draws its own cover:  const COVER=(svg,K)=>{ ... };  COVERS.draw("#coversvg",COVER);  COVERS.mount(COVER);  with K the kit above */
window.COVERS={K,draw(sel,fn){const s=typeof sel==="string"?document.querySelector(sel):sel;if(s)fn(s,K)},
  /* the same figure, cropped, beside the text it illustrates:  <svg data-crop="x y w h"> */
  mount(fn){document.querySelectorAll("svg[data-crop]").forEach(s=>{fn(s,K);s.setAttribute("viewBox",s.dataset.crop);s.classList.add("cover-crop")})}};
})();

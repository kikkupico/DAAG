"use strict";
/* The landing page: the tour order, the premise's words, the books' drawn covers in computing, then the register.
   Uses $, $$, reduce from art/scroll/shell.js, REG from assets/js/registers.js, and COVERS and BOOK_COVERS
   from assets/js/covers.js and assets/js/book-covers.js. */
(function(){

/* ===== the tour: the settings in the order the reader chose; the start buttons follow its first book ===== */
const TOURS={
  paxos:["the-chamber","schedia","the-ring-road","the-foot-of-mount-phyle","the-crown-of-mount-phyle","the-scholars-coast","the-hall-of-two-doors"],
  basics:["the-ring-road","the-foot-of-mount-phyle","the-crown-of-mount-phyle","the-chamber","schedia","the-scholars-coast","the-hall-of-two-doors"]
};
const tourEl=$("#tour"), head=$("#books");
function lay(name){
  let after=head;
  TOURS[name].forEach((id,i)=>{
    const s=document.getElementById(id), light=i%2===1;
    after.after(s); after=s;
    s.classList.toggle("light",light); s.classList.toggle("dark",!light);
    /* the torn edge is the colour of the spread above it */
    $(".tear",s).style.setProperty("--prev",light?"#eae4d4":"#f6eed6");
  });
  const first=$(".bk",document.getElementById(TOURS[name][0])), a=$("a",first), t=$("h3",first).textContent;
  $("#startBtn").href=a.getAttribute("href"); $("#startTitle").textContent=t;
  dispatchEvent(new Event("scroll"));
}
let saved; try{saved=localStorage.getItem("tour")}catch(e){}
if(TOURS[saved]&&saved!=="paxos"){tourEl.querySelector(`[value=${saved}]`).checked=true; lay(saved)}
tourEl.addEventListener("change",e=>{lay(e.target.value); try{localStorage.setItem("tour",e.target.value)}catch(err){}});

/* ===== the premise: each word lights once it rises past the middle of the screen ===== */
const words=[];
$$(".premise [data-words]").forEach(p=>{
  const parts=p.textContent.trim().split(/\s+/); p.textContent="";
  parts.forEach((w,i)=>{const s=document.createElement("span"); s.className="w"; s.textContent=w; p.append(s); if(i<parts.length-1)p.append(" "); words.push(s)});
});
let wt=false;
function light(){wt=false; const line=innerHeight*.62; for(const w of words){const r=w.getBoundingClientRect(); if(r.height)w.classList.toggle("lit",reduce||r.top<line)}}
addEventListener("scroll",()=>{if(!wt){wt=true;requestAnimationFrame(light)}},{passive:true});
addEventListener("resize",light);

/* ===== computing: each book's drawn cover, drawn the first time computing shows; a cover off screen stops moving ===== */
let drawn=false;
const still=new IntersectionObserver(es=>es.forEach(e=>{const s=e.target; if(s.pauseAnimations)(e.isIntersecting?s.unpauseAnimations():s.pauseAnimations())}));
function covers(){
  if(drawn||!REG.isM()||!window.BOOK_COVERS)return; drawn=true;
  $$("svg[data-cover]").forEach(s=>{const f=BOOK_COVERS[s.dataset.cover]; if(f){COVERS.draw(s,f); still.observe(s)}});
}
/* the bar names each setting by its place in the allegory and by its topic in computing */
const named=$$("[data-name-m]");
named.forEach(s=>s.dataset.nameI=s.dataset.name);
REG.onReg.push(r=>{
  covers();
  named.forEach(s=>s.dataset.name=r==="m"?s.dataset.nameM:s.dataset.nameI);
  dispatchEvent(new Event("scroll"));
});

/* ===== the register ===== */
REG.after=light;
REG.start();
light();
})();

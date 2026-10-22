"use strict";
/* The two registers of a book: allegory (.i, the default) and computing (.m). Both are always in the page, so a switch
   loses no state. A book's script reads window.REG, registers its own hooks in REG.onReg, sets REG.after to its scroll
   handler, and calls REG.start() last. The choice is kept in the setting the scroll page uses, so it follows the reader. */
(function(){
const KEY="daag-apart-reg", NS="http://www.w3.org/2000/svg", onReg=[];
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const isM=()=>document.body.getAttribute("data-reg")==="m";
/* a pair of spans, for HTML written from a script */
const dual=(i,m)=>`<span class="i">${i}</span><span class="m">${m}</span>`;
/* the text of whichever register shows */
const vis=e=>{const x=e.querySelector(isM()?".m":".i");return (x||e).textContent};
/* a pair of SVG texts, one per register */
function dtext(parent,attrs,i,m){return [["i",i],["m",m]].map(([r,t])=>{const e=document.createElementNS(NS,"text");
  for(const k in attrs)e.setAttribute(k,attrs[k]);e.setAttribute("class",((attrs.class||"")+" "+r).trim());e.textContent=t;parent.appendChild(e);return e})}
const TITLE=document.title, TITLE_M=(document.querySelector("title")||{dataset:{}}).dataset.m;
const REG={isM,dual,vis,dtext,onReg,after:null};
function anchorEl(){const y=innerHeight*.5;let best=null,bh=1e9;
  for(const e of $$(".wrap > *, .narrow > *, .hall-title, .pins, .step")){const r=e.getBoundingClientRect();if(r.height>0&&r.top<=y&&r.bottom>=y&&r.height<bh){best=e;bh=r.height}}return best}
function setReg(r,keep){
  const a=keep?anchorEl():null,before=a?a.getBoundingClientRect().top:0;
  document.body.setAttribute("data-reg",r);
  if(TITLE_M)document.title=r==="m"?TITLE_M:TITLE;
  $$(".segb").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.reg===r)));
  $$("[data-al-m]").forEach(e=>e.setAttribute("aria-label",r==="m"?e.dataset.alM:e.dataset.alI));
  onReg.forEach(f=>f(r));
  if(a&&a.getBoundingClientRect().height>0){const d=a.getBoundingClientRect().top-before;if(d)scrollTo({top:scrollY+d,behavior:"instant"})}
  if(REG.after)REG.after();
}
REG.start=function(){
  $$("[data-al-m]").forEach(e=>e.dataset.alI=e.getAttribute("aria-label"));
  $$(".segb").forEach(b=>b.addEventListener("click",()=>{setReg(b.dataset.reg,true);try{localStorage.setItem(KEY,b.dataset.reg)}catch(e){}}));
  let saved=null;try{saved=localStorage.getItem(KEY)}catch(e){}
  setReg(saved==="m"?"m":"i",false);
};
window.REG=REG;
})();

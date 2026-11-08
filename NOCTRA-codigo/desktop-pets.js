const $=id=>document.getElementById(id),toggle=$('petsEnabled'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const layer=document.createElement('div');layer.className='desktop-pets';layer.setAttribute('aria-hidden','true');document.body.append(layer);
let enabled=true;try{enabled=localStorage.getItem('noctra-pets')!=='off'}catch{}
toggle.checked=enabled;
const pets=[['.miku-mascot',36],['.giratina-mascot',108]].map(([selector,x],i)=>{const node=document.createElement('div');node.className='desktop-pet';const svg=document.querySelector(selector+' svg');if(svg)node.append(svg.cloneNode(true));layer.append(node);return {node,x,y:Math.max(0,innerHeight-115),index:i};});
let target={x:innerWidth/2,y:innerHeight-130},hasPointer=false,last=0,frameId=null;
const clamp=(v,min,max)=>Math.max(min,Math.min(Math.max(min,max),v));
function paint(pet){const size=innerWidth<=650?52:64;pet.x=clamp(pet.x,0,innerWidth-size);pet.y=clamp(pet.y,0,innerHeight-size-37);pet.node.style.transform='translate3d('+pet.x+'px,'+pet.y+'px,0)';}
function park(){pets.forEach((pet,i)=>{pet.x=20+i*72;pet.y=innerHeight-112;pet.node.classList.remove('walking');paint(pet);});}
function tick(time){frameId=null;if(!enabled||document.hidden||reduced.matches)return;const dt=last?Math.min((time-last)/1000,.05):0;last=time;pets.forEach(pet=>{const size=innerWidth<=650?52:64;const tx=hasPointer?clamp(target.x+(pet.index?20:-75),0,innerWidth-size):20+pet.index*72;const ty=hasPointer?clamp(target.y+24,0,innerHeight-size-40):innerHeight-112;const dx=tx-pet.x,dy=ty-pet.y,dist=Math.hypot(dx,dy);pet.node.classList.toggle('walking',dist>7);if(Math.abs(dx)>5)pet.node.classList.toggle('facing-left',dx<0);if(dist>1){const step=Math.min(dist,dt*(pet.index?165:145));pet.x+=dx/dist*step;pet.y+=dy/dist*step;}paint(pet);});frameId=requestAnimationFrame(tick);}
function resume(){last=0;if(frameId!==null)cancelAnimationFrame(frameId);frameId=null;if(enabled&&!reduced.matches&&!document.hidden)frameId=requestAnimationFrame(tick);}
function apply(){layer.hidden=!enabled;document.body.classList.toggle('pets-following',enabled);if(reduced.matches)park();resume();}
toggle.addEventListener('change',()=>{enabled=toggle.checked;try{localStorage.setItem('noctra-pets',enabled?'on':'off')}catch{}apply();});
window.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;target={x:event.clientX,y:event.clientY};hasPointer=true;},{passive:true});
window.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){target={x:event.clientX,y:event.clientY};hasPointer=true;}},{passive:true});
window.addEventListener('resize',()=>{pets.forEach(paint);if(reduced.matches)park();});
document.addEventListener('visibilitychange',resume);
reduced.addEventListener('change',apply);
pets.forEach(paint);apply();

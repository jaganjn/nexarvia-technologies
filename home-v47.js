(()=>{'use strict';
const ready=()=>{
  const carousel=document.querySelector('[data-nx47-carousel]');
  if(!carousel)return;
  const track=carousel.querySelector('[data-nx47-track]');
  const cards=[...carousel.querySelectorAll('[data-nx47-card]')];
  const dots=[...carousel.querySelectorAll('[data-nx47-dot]')];
  const prev=carousel.querySelector('[data-nx47-prev]');
  const next=carousel.querySelector('[data-nx47-next]');
  const viewport=carousel.querySelector('.nx47-viewport');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mq=matchMedia('(max-width: 820px)');
  let index=0,timer=null,startX=0,deltaX=0,dragging=false;
  const interval=5200;
  const progress=()=>carousel.querySelector('.nx47-progress i');
  const restartProgress=()=>{const el=progress();if(!el)return;el.style.animation='none';void el.offsetWidth;el.style.animation='';};
  const render=(animate=true)=>{
    if(!mq.matches){track.style.transform='';cards.forEach(c=>c.classList.remove('is-active'));dots.forEach(d=>d.classList.remove('is-active'));return;}
    if(!animate)track.style.transition='none';
    track.style.transform=`translate3d(${-index*100}%,0,0)`;
    cards.forEach((c,i)=>{c.classList.toggle('is-active',i===index);c.setAttribute('aria-hidden',i===index?'false':'true');});
    dots.forEach((d,i)=>{d.classList.toggle('is-active',i===index);d.setAttribute('aria-current',i===index?'true':'false');});
    if(!animate){void track.offsetWidth;track.style.transition='';}
    restartProgress();
  };
  const stop=()=>{if(timer){clearInterval(timer);timer=null;}carousel.classList.add('is-paused');};
  const start=()=>{if(!mq.matches||reduce)return;stop();carousel.classList.remove('is-paused');timer=setInterval(()=>{index=(index+1)%cards.length;render();},interval);restartProgress();};
  const go=(i,user=false)=>{index=(i+cards.length)%cards.length;render();if(user)start();};
  prev?.addEventListener('click',e=>{e.preventDefault();go(index-1,true)});
  next?.addEventListener('click',e=>{e.preventDefault();go(index+1,true)});
  dots.forEach((d,i)=>d.addEventListener('click',e=>{e.preventDefault();go(i,true)}));
  viewport?.addEventListener('pointerdown',e=>{if(!mq.matches)return;dragging=true;startX=e.clientX;deltaX=0;stop();viewport.setPointerCapture?.(e.pointerId)});
  viewport?.addEventListener('pointermove',e=>{if(!dragging||!mq.matches)return;deltaX=e.clientX-startX;const base=-index*100;const px=(deltaX/Math.max(viewport.clientWidth,1))*100;track.style.transition='none';track.style.transform=`translate3d(calc(${base}% + ${px}%),0,0)`;});
  const endDrag=()=>{if(!dragging)return;dragging=false;track.style.transition='';if(Math.abs(deltaX)>45)index=(index+(deltaX<0?1:-1)+cards.length)%cards.length;render();start();};
  viewport?.addEventListener('pointerup',endDrag);viewport?.addEventListener('pointercancel',endDrag);
  cards.forEach(card=>card.addEventListener('click',e=>{if(Math.abs(deltaX)>18){e.preventDefault();deltaX=0;}}));
  carousel.addEventListener('mouseenter',()=>{if(mq.matches)stop()});carousel.addEventListener('mouseleave',()=>{if(mq.matches)start()});
  carousel.addEventListener('focusin',()=>{if(mq.matches)stop()});carousel.addEventListener('focusout',()=>{if(mq.matches)start()});
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  mq.addEventListener?.('change',()=>{stop();index=0;render(false);start()});
  render(false);start();
};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',ready,{once:true}):ready();
})();

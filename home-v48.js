(()=>{'use strict';
const ready=()=>{
  const carousel=document.querySelector('[data-nx47-carousel]');
  if(carousel){
    const track=carousel.querySelector('[data-nx47-track]');
    const cards=[...carousel.querySelectorAll('[data-nx47-card]')];
    const dots=[...carousel.querySelectorAll('[data-nx47-dot]')];
    const prev=carousel.querySelector('[data-nx47-prev]');
    const next=carousel.querySelector('[data-nx47-next]');
    const viewport=carousel.querySelector('.nx47-viewport');
    const mq=matchMedia('(max-width: 820px)');
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interval=2000;
    let index=0,timer=null,startX=0,deltaX=0,dragging=false,shiftTimer=null,wasSwipe=false;

    const progress=()=>carousel.querySelector('.nx47-progress i');
    const restartProgress=()=>{
      const el=progress(); if(!el)return;
      el.style.animation='none'; void el.offsetWidth; el.style.animation='';
    };
    const markDirection=(direction)=>{
      clearTimeout(shiftTimer);
      carousel.classList.remove('is-shifting-next','is-shifting-prev');
      carousel.classList.add(direction>0?'is-shifting-next':'is-shifting-prev');
      shiftTimer=setTimeout(()=>carousel.classList.remove('is-shifting-next','is-shifting-prev'),540);
    };
    const render=(animate=true,direction=1)=>{
      if(!mq.matches){
        track.style.transform='';
        cards.forEach(c=>{c.classList.remove('is-active');c.removeAttribute('aria-hidden')});
        dots.forEach(d=>d.classList.remove('is-active'));
        return;
      }
      if(animate)markDirection(direction);
      else track.style.transition='none';
      track.style.transform=`translate3d(${-index*100}%,0,0)`;
      cards.forEach((c,i)=>{
        const active=i===index;
        c.classList.toggle('is-active',active);
        c.setAttribute('aria-hidden',active?'false':'true');
        c.tabIndex=active?0:-1;
      });
      dots.forEach((d,i)=>{
        const active=i===index;
        d.classList.toggle('is-active',active);
        d.setAttribute('aria-current',active?'true':'false');
      });
      if(!animate){void track.offsetWidth;track.style.transition='';}
      restartProgress();
    };
    const stop=()=>{if(timer){clearInterval(timer);timer=null;}carousel.classList.add('is-paused')};
    const start=()=>{
      if(!mq.matches||reduce)return;
      if(timer)clearInterval(timer);
      carousel.classList.remove('is-paused');
      timer=setInterval(()=>{
        index=(index+1)%cards.length;
        render(true,1);
      },interval);
      restartProgress();
    };
    const go=(nextIndex,user=false)=>{
      const old=index;
      index=(nextIndex+cards.length)%cards.length;
      let direction=index===old?1:(nextIndex>old?1:-1);
      if(old===cards.length-1&&index===0)direction=1;
      if(old===0&&index===cards.length-1)direction=-1;
      render(true,direction);
      if(user)start();
    };

    prev?.addEventListener('click',e=>{e.preventDefault();go(index-1,true)});
    next?.addEventListener('click',e=>{e.preventDefault();go(index+1,true)});
    dots.forEach((d,i)=>d.addEventListener('click',e=>{e.preventDefault();go(i,true)}));

    viewport?.addEventListener('pointerdown',e=>{
      if(!mq.matches)return;
      dragging=true;startX=e.clientX;deltaX=0;wasSwipe=false;stop();
      viewport.setPointerCapture?.(e.pointerId);
    });
    viewport?.addEventListener('pointermove',e=>{
      if(!dragging||!mq.matches)return;
      deltaX=e.clientX-startX;
      if(Math.abs(deltaX)>16)wasSwipe=true;
      const base=-index*100;
      const offset=(deltaX/Math.max(viewport.clientWidth,1))*100;
      track.style.transition='none';
      track.style.transform=`translate3d(calc(${base}% + ${offset}%),0,0)`;
    });
    const endDrag=()=>{
      if(!dragging)return;
      dragging=false;track.style.transition='';
      if(Math.abs(deltaX)>42){
        const direction=deltaX<0?1:-1;
        index=(index+direction+cards.length)%cards.length;
        render(true,direction);
      }else render(true,deltaX<0?1:-1);
      deltaX=0;start();
    };
    viewport?.addEventListener('pointerup',endDrag);
    viewport?.addEventListener('pointercancel',endDrag);
    cards.forEach(card=>card.addEventListener('click',e=>{if(wasSwipe){e.preventDefault();wasSwipe=false;}}));

    document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
    mq.addEventListener?.('change',()=>{stop();index=0;render(false);start()});
    render(false);start();
  }

  /* Additional vertical storytelling motion for the corporate content. */
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionNodes=[...document.querySelectorAll(
    '.nx47-head,.nx47-intro-statement,.nx47-intro-copy,.nx47-info-card,.nx47-step,.nx47-mv article,.nx47-audience article,.nx47-final-box'
  )];
  const approach=document.querySelector('.nx47-approach');
  if(approach)motionNodes.push(approach);
  motionNodes.forEach((el,i)=>{
    el.classList.add('nx48-motion');
    el.style.setProperty('--nx48-delay',`${Math.min((i%4)*70,210)}ms`);
  });
  if(reduce||!('IntersectionObserver' in window)){
    motionNodes.forEach(el=>el.classList.add('is-nx48-visible'));
  }else{
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('is-nx48-visible');
        observer.unobserve(entry.target);
      });
    },{threshold:.12,rootMargin:'0px 0px -7% 0px'});
    motionNodes.forEach(el=>observer.observe(el));
  }
};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',ready,{once:true}):ready();
})();

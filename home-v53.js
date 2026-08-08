(()=>{'use strict';
const ready=()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const makeCarousel=(root)=>{
    const track=root.querySelector('.nx53-track');
    const cards=[...root.querySelectorAll('.nx53-track > *')];
    if(!track||cards.length<2)return;
    const dotsWrap=root.querySelector('.nx53-dots');
    const progress=root.querySelector('.nx53-progress i');
    let index=0,timer=null,raf=0,dragging=false,startX=0,deltaX=0,manual=false,visible=false;
    const viewport=root.querySelector('.nx53-viewport');
    const stepPx=()=>{
      if(!cards[0])return 0;
      const a=cards[0].getBoundingClientRect();
      const b=cards[1]?.getBoundingClientRect();
      return b?b.left-a.left:a.width+18;
    };
    const renderDots=()=>{
      if(!dotsWrap)return;
      dotsWrap.innerHTML='';
      cards.forEach((_,i)=>{const d=document.createElement('span');d.className='nx53-dot'+(i===index?' is-active':'');d.setAttribute('aria-hidden','true');dotsWrap.appendChild(d)});
    };
    const restartProgress=()=>{
      if(!progress)return;
      progress.style.animation='none';void progress.offsetWidth;progress.style.animation='nx53-progress 2s linear forwards';
    };
    const render=(animate=true)=>{
      const step=stepPx();
      if(!step)return;
      const viewportWidth=viewport?.clientWidth||root.clientWidth||0;
      const cardWidth=cards[0].getBoundingClientRect().width;
      const centerOffset=Math.max(0,(viewportWidth-cardWidth)/2);
      const target=Math.max(0,index*step-centerOffset);
      if(!animate)track.style.transition='none';
      track.style.transform=`translate3d(${-target}px,0,0)`;
      cards.forEach((card,i)=>card.classList.toggle('is-nx53-active',i===index));
      renderDots();
      if(!animate){void track.offsetWidth;track.style.transition='';}
      restartProgress();
    };
    const stop=()=>{if(timer){clearTimeout(timer);timer=null;}root.classList.add('is-paused')};
    const schedule=()=>{
      stop();
      if(reduce||document.hidden||!visible)return;
      root.classList.remove('is-paused');
      timer=setTimeout(()=>{
        if(!visible||document.hidden)return;
        index=(index+1)%cards.length;
        render(true);
        schedule();
      },2000);
    };
    const reset=()=>{stop();index=0;render(false);if(visible)schedule()};
    const onResize=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>render(false))};
    viewport?.addEventListener('pointerdown',e=>{
      dragging=true;manual=true;startX=e.clientX;deltaX=0;stop();viewport.setPointerCapture?.(e.pointerId);track.style.transition='none';
    });
    viewport?.addEventListener('pointermove',e=>{if(!dragging)return;deltaX=e.clientX-startX;const step=stepPx();const viewportWidth=viewport.clientWidth;const cardWidth=cards[0].getBoundingClientRect().width;const centerOffset=Math.max(0,(viewportWidth-cardWidth)/2);const target=Math.max(0,index*step-centerOffset)-deltaX;track.style.transform=`translate3d(${-target}px,0,0)`});
    const end=()=>{if(!dragging)return;dragging=false;track.style.transition='';if(Math.abs(deltaX)>45){index=(index+(deltaX<0?1:-1)+cards.length)%cards.length}manual=false;render(true);schedule();};
    viewport?.addEventListener('pointerup',end);viewport?.addEventListener('pointercancel',end);
    addEventListener('resize',onResize,{passive:true});
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){
        visible=true;
        /* Every fresh section entry begins at item 01, never a stale middle card. */
        index=0;render(false);schedule();
      }else{visible=false;stop();}
    }),{threshold:.28});
    observer.observe(root);
    renderDots();
    /* Explicit first-card state immediately, before the section is visible. */
    index=0;render(false);
  };
  document.querySelectorAll('[data-nx53-carousel]').forEach(makeCarousel);

  const mission=document.querySelector('#mission');
  if(mission&&!mission.querySelector('.nx53-shooting-star')){
    const star=document.createElement('span');
    star.className='nx53-shooting-star';star.setAttribute('aria-hidden','true');mission.appendChild(star);
  }
  /* Give approach steps stable 01–04 labels without relying on generated counters. */
  document.querySelectorAll('#approach .nx47-step').forEach((el,i)=>el.setAttribute('data-step',String(i+1).padStart(2,'0')));
  /* Restart the page's automated sections from item 01 after a real page load. */
  addEventListener('pageshow',()=>{
    document.querySelectorAll('[data-nx53-carousel]').forEach(root=>{
      const track=root.querySelector('.nx53-track');
      const cards=[...root.querySelectorAll('.nx53-track > *')];
      if(!track||!cards.length)return;
      cards.forEach((c,i)=>c.classList.toggle('is-nx53-active',i===0));
      track.style.transform='translate3d(0,0,0)';
    });
  },{once:true});
};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',ready,{once:true}):ready();
})();

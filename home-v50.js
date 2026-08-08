(()=>{'use strict';
const ready=()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile=matchMedia('(max-width: 820px)');

  /* ---------------------------------------------------------
     PATH CAROUSEL — 2s readable hold + 580ms card transition
     --------------------------------------------------------- */
  const carousel=document.querySelector('[data-nx47-carousel]');
  if(carousel){
    const track=carousel.querySelector('[data-nx47-track]');
    const cards=[...carousel.querySelectorAll('[data-nx47-card]')];
    const dots=[...carousel.querySelectorAll('[data-nx47-dot]')];
    const prev=carousel.querySelector('[data-nx47-prev]');
    const next=carousel.querySelector('[data-nx47-next]');
    const viewport=carousel.querySelector('.nx47-viewport');
    const progress=carousel.querySelector('.nx47-progress i');
    const HOLD=2000;
    const SHIFT=580;
    let index=0;
    let holdTimer=null;
    let settleTimer=null;
    let shiftClassTimer=null;
    let startX=0;
    let deltaX=0;
    let dragging=false;
    let swiped=false;

    const clearTimers=()=>{
      clearTimeout(holdTimer); holdTimer=null;
      clearTimeout(settleTimer); settleTimer=null;
      clearTimeout(shiftClassTimer); shiftClassTimer=null;
    };
    const resetProgress=()=>{
      if(!progress)return;
      progress.style.animation='none';
      void progress.offsetWidth;
      progress.style.animation='';
    };
    const pauseProgress=()=>{if(progress)progress.style.animationPlayState='paused';};
    const resumeProgress=()=>{if(progress)progress.style.animationPlayState='running';};
    const markDirection=(direction)=>{
      carousel.classList.remove('is-shifting-next','is-shifting-prev');
      carousel.classList.add(direction>0?'is-shifting-next':'is-shifting-prev');
      clearTimeout(shiftClassTimer);
      shiftClassTimer=setTimeout(()=>carousel.classList.remove('is-shifting-next','is-shifting-prev'),SHIFT+40);
    };
    const setA11y=()=>{
      cards.forEach((card,i)=>{
        const active=i===index;
        card.classList.toggle('is-active',active);
        card.setAttribute('aria-hidden',active?'false':'true');
        card.tabIndex=active?0:-1;
      });
      dots.forEach((dot,i)=>{
        const active=i===index;
        dot.classList.toggle('is-active',active);
        dot.setAttribute('aria-current',active?'true':'false');
      });
    };
    const scheduleHold=()=>{
      clearTimeout(holdTimer);
      if(reduce||!mobile.matches||document.hidden)return;
      resetProgress();
      resumeProgress();
      holdTimer=setTimeout(()=>go(index+1,false),HOLD);
    };
    const render=(animate=true,direction=1)=>{
      if(!mobile.matches){
        clearTimers();
        track.style.transform='';
        track.style.transition='';
        cards.forEach(c=>{c.classList.remove('is-active');c.removeAttribute('aria-hidden');c.removeAttribute('tabindex');});
        dots.forEach(d=>d.classList.remove('is-active'));
        return;
      }
      clearTimeout(holdTimer);
      if(animate)markDirection(direction);
      else track.style.transition='none';
      track.style.transform=`translate3d(${-index*100}%,0,0)`;
      setA11y();
      if(!animate){
        void track.offsetWidth;
        track.style.transition='';
        scheduleHold();
      }else{
        pauseProgress();
        clearTimeout(settleTimer);
        settleTimer=setTimeout(scheduleHold,SHIFT);
      }
    };
    const go=(target,user)=>{
      const old=index;
      const nextIndex=(target+cards.length)%cards.length;
      let direction=nextIndex===old?1:(target>old?1:-1);
      if(old===cards.length-1&&nextIndex===0)direction=1;
      if(old===0&&nextIndex===cards.length-1)direction=-1;
      index=nextIndex;
      render(true,direction);
      if(user)carousel.classList.add('nx50-user-touched');
    };
    const stop=()=>{clearTimers();pauseProgress();};

    prev?.addEventListener('click',e=>{e.preventDefault();stop();go(index-1,true);});
    next?.addEventListener('click',e=>{e.preventDefault();stop();go(index+1,true);});
    dots.forEach((dot,i)=>dot.addEventListener('click',e=>{e.preventDefault();stop();go(i,true);}));

    viewport?.addEventListener('pointerdown',e=>{
      if(!mobile.matches)return;
      dragging=true;swiped=false;startX=e.clientX;deltaX=0;stop();
      viewport.setPointerCapture?.(e.pointerId);
    });
    viewport?.addEventListener('pointermove',e=>{
      if(!dragging||!mobile.matches)return;
      deltaX=e.clientX-startX;
      if(Math.abs(deltaX)>14)swiped=true;
      const base=-index*100;
      const offset=(deltaX/Math.max(viewport.clientWidth,1))*100;
      track.style.transition='none';
      track.style.transform=`translate3d(calc(${base}% + ${offset}%),0,0)`;
    });
    const endDrag=()=>{
      if(!dragging)return;
      dragging=false;track.style.transition='';
      if(Math.abs(deltaX)>44){
        const direction=deltaX<0?1:-1;
        index=(index+direction+cards.length)%cards.length;
        render(true,direction);
      }else render(true,deltaX<0?1:-1);
      deltaX=0;
    };
    viewport?.addEventListener('pointerup',endDrag);
    viewport?.addEventListener('pointercancel',endDrag);
    cards.forEach(card=>card.addEventListener('click',e=>{if(swiped){e.preventDefault();swiped=false;}}));

    document.addEventListener('visibilitychange',()=>document.hidden?stop():scheduleHold());
    mobile.addEventListener?.('change',()=>{stop();index=0;render(false);});
    render(false);
  }

  /* ---------------------------------------------------------
     STORYTELLING MOTION — content first, motion second
     --------------------------------------------------------- */
  const sections=[...document.querySelectorAll('.nx47-section,.nx47-final')];
  sections.forEach((section,sectionIndex)=>{
    section.classList.add('nx50-scene');
    section.style.setProperty('--nx50-scene-index',sectionIndex);
    const accent=document.createElement('span');
    accent.className='nx50-scene-accent';accent.setAttribute('aria-hidden','true');
    const glow=document.createElement('span');
    glow.className='nx50-scene-glow';glow.setAttribute('aria-hidden','true');
    section.append(accent,glow);
  });

  const about=document.querySelector('#about');
  if(about){
    about.querySelector('.nx47-intro-statement')?.classList.add('nx50-foundation');
    [...about.querySelectorAll('.nx47-intro-copy p')].forEach((p,i)=>{
      p.classList.add('nx50-piece','nx50-copy-line');
      p.style.setProperty('--nx50-delay',`${700+i*170}ms`);
    });
  }

  const iconSets={
    capabilities:['⌁','</>','↻','◇'],
    principles:['✓','◎','◇','↗'],
    audience:['◉','↗','◇','▦']
  };
  const addCardIcons=(selector,icons)=>{
    [...document.querySelectorAll(selector)].forEach((card,i)=>{
      const icon=document.createElement('span');
      icon.className='nx50-card-icon';icon.setAttribute('aria-hidden','true');
      icon.textContent=icons[i]||'◇';
      card.prepend(icon);
    });
  };
  addCardIcons('#capabilities .nx47-info-card',iconSets.capabilities);
  addCardIcons('#principles .nx47-info-card',iconSets.principles);
  addCardIcons('#audience .nx47-audience article',iconSets.audience);

  const approach=document.querySelector('.nx47-approach');
  let flowFill=null;
  if(approach){
    approach.classList.add('nx50-flow');
    const rail=document.createElement('span');rail.className='nx50-flow-rail';rail.setAttribute('aria-hidden','true');
    flowFill=document.createElement('i');rail.appendChild(flowFill);approach.prepend(rail);
    const symbols=['◎','◇','▦','↗'];
    [...approach.querySelectorAll('.nx47-step')].forEach((step,i)=>{
      step.style.setProperty('--nx50-step',i);
      const symbol=document.createElement('span');symbol.className='nx50-step-symbol';symbol.setAttribute('aria-hidden','true');symbol.textContent=symbols[i];
      step.appendChild(symbol);
    });
  }

  const mv=document.querySelector('.nx47-mv');
  if(mv){
    const bridge=document.createElement('span');bridge.className='nx50-mv-bridge';bridge.setAttribute('aria-hidden','true');mv.appendChild(bridge);
  }

  /* Reveal hierarchy: heading -> pause -> content -> stagger. */
  document.querySelectorAll('.nx47-head').forEach(head=>{
    head.classList.add('nx50-piece','nx50-heading');
    head.style.setProperty('--nx50-delay','0ms');
  });
  const groups=[
    ['#about .nx47-intro-statement',620,0],
    ['#capabilities .nx47-info-card',620,150],
    ['#principles .nx47-info-card',620,150],
    ['#approach .nx47-step',520,170],
    ['#mission .nx47-mv article',620,230],
    ['#audience .nx47-audience article',560,145],
    ['.nx47-final-box',250,0]
  ];
  groups.forEach(([selector,base,step])=>{
    [...document.querySelectorAll(selector)].forEach((el,i)=>{
      el.classList.add('nx50-piece');
      el.style.setProperty('--nx50-delay',`${base+i*step}ms`);
    });
  });

  const footer=document.querySelector('.nx-footer');
  if(footer){
    footer.classList.add('nx50-footer');
    [...footer.querySelectorAll('.nx-footer-brand,.nx-footer-grid>div:not(.nx-footer-brand),.nx-footer-bottom')].forEach((el,i)=>{
      el.classList.add('nx50-piece');el.style.setProperty('--nx50-delay',`${120+i*90}ms`);
    });
  }

  const activate=(section)=>{
    section.classList.add('nx50-active');
    section.querySelectorAll('.nx50-piece').forEach(el=>el.classList.add('nx50-visible'));
  };
  if(reduce||!('IntersectionObserver' in window)){
    sections.forEach(activate);if(footer)activate(footer);
  }else{
    const sectionObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        activate(entry.target);
        sectionObserver.unobserve(entry.target);
      });
    },{threshold:.13,rootMargin:'0px 0px -8% 0px'});
    sections.forEach(section=>sectionObserver.observe(section));
    if(footer)sectionObserver.observe(footer);
  }

  /* Scroll-synchronised progress for Approach and audience journey. */
  const audience=document.querySelector('.nx47-audience');
  let scrollRaf=0;
  const updateScrollScenes=()=>{
    scrollRaf=0;
    if(approach&&flowFill){
      const rect=approach.getBoundingClientRect();
      const start=innerHeight*.78;
      const end=innerHeight*.24;
      const p=Math.max(0,Math.min(1,(start-rect.top)/Math.max(rect.height+(start-end),1)));
      approach.style.setProperty('--nx50-flow-progress',p.toFixed(3));
      const steps=[...approach.querySelectorAll('.nx47-step')];
      steps.forEach((step,i)=>step.classList.toggle('nx50-current',p>=(i+.22)/steps.length));
    }
    if(audience){
      const rect=audience.getBoundingClientRect();
      const p=Math.max(0,Math.min(1,(innerHeight*.82-rect.top)/Math.max(rect.height,1)));
      audience.style.setProperty('--nx50-audience-progress',p.toFixed(3));
      const cards=[...audience.querySelectorAll('article')];
      cards.forEach((card,i)=>card.classList.toggle('nx50-current',p>=(i+.18)/cards.length));
    }
  };
  addEventListener('scroll',()=>{if(!scrollRaf)scrollRaf=requestAnimationFrame(updateScrollScenes)},{passive:true});
  addEventListener('resize',updateScrollScenes,{passive:true});
  updateScrollScenes();

  /* Back-to-top gets one calm cue only at the end. */
  const backTop=document.querySelector('.nx-back-top');
  if(backTop&&footer&&!reduce&&'IntersectionObserver' in window){
    const bottomObserver=new IntersectionObserver(entries=>entries.forEach(e=>backTop.classList.toggle('nx50-cue',e.isIntersecting)),{threshold:.12});
    bottomObserver.observe(footer);
  }
};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',ready,{once:true}):ready();
})();

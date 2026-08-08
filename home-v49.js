(()=>{'use strict';
const onReady=()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Make the existing V48 carousel satisfy the final 1-second timing request.
     We replace only the interval behavior; V48 still owns drag/arrow/dot mechanics. */
  const carousel=document.querySelector('[data-nx47-carousel]');
  if(carousel){
    const autoText=carousel.querySelector('.nx47-auto span:first-child');
    if(autoText)autoText.textContent='Auto-switching every 1s';

    /* V48 interval is scoped inside its closure, so dispatch a Next click once per second.
       Native click keeps the same render/direction code and restarts V48's own timer safely. */
    const next=carousel.querySelector('[data-nx47-next]');
    const mq=matchMedia('(max-width: 820px)');
    let fastTimer=null;
    const stopFast=()=>{if(fastTimer){clearInterval(fastTimer);fastTimer=null;}};
    const startFast=()=>{
      stopFast();
      if(reduce||!mq.matches||document.hidden||!next)return;
      fastTimer=setInterval(()=>{if(!document.hidden)next.click();},1000);
    };
    document.addEventListener('visibilitychange',()=>document.hidden?stopFast():startFast());
    mq.addEventListener?.('change',startFast);
    startFast();
  }

  /* Scroll progress. */
  const progress=document.createElement('div');
  progress.className='nx49-scroll-progress';
  progress.setAttribute('aria-hidden','true');
  progress.innerHTML='<i></i>';
  document.body.appendChild(progress);
  const progressBar=progress.firstElementChild;
  let raf=0;
  const updateProgress=()=>{
    raf=0;
    const max=Math.max(document.documentElement.scrollHeight-innerHeight,1);
    const ratio=Math.min(1,Math.max(0,scrollY/max));
    progressBar.style.transform=`scaleX(${ratio})`;
  };
  addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(updateProgress)},{passive:true});
  addEventListener('resize',updateProgress,{passive:true});
  updateProgress();

  /* Add lightweight graphic atoms to each content section without changing content/theme. */
  document.querySelectorAll('.nx47-section').forEach(section=>{
    const beam=document.createElement('span'); beam.className='nx49-section-beam'; beam.setAttribute('aria-hidden','true');
    const orbit=document.createElement('span'); orbit.className='nx49-orbit'; orbit.setAttribute('aria-hidden','true');
    section.append(beam,orbit);
  });
  document.querySelectorAll('.nx47-mv article').forEach(card=>{
    const halo=document.createElement('span'); halo.className='nx49-halo'; halo.setAttribute('aria-hidden','true'); card.appendChild(halo);
  });

  /* Richer reveal map for every section. */
  const groups=[
    ['.nx47-head',''],
    ['.nx47-intro-statement','nx49-from-left'],
    ['.nx47-intro-copy','nx49-from-right'],
    ['#capabilities .nx47-info-card','nx49-zoom'],
    ['#principles .nx47-info-card',''],
    ['.nx47-step',''],
    ['.nx47-mv article','nx49-zoom'],
    ['.nx47-audience article',''],
    ['.nx47-final-box','nx49-zoom']
  ];
  const revealNodes=[];
  groups.forEach(([selector,extra])=>{
    [...document.querySelectorAll(selector)].forEach((el,i)=>{
      el.classList.add('nx49-reveal');
      if(extra)el.classList.add(extra);
      el.style.setProperty('--nx49-delay',`${Math.min((i%4)*85,255)}ms`);
      revealNodes.push(el);
    });
  });

  const sections=[...document.querySelectorAll('.nx47-section,.nx47-final')];
  const footer=document.querySelector('.nx-footer');
  if(footer)footer.classList.add('nx49-footer-ready');

  if(reduce||!('IntersectionObserver' in window)){
    revealNodes.forEach(el=>el.classList.add('nx49-visible'));
    sections.forEach(s=>s.classList.add('nx49-section-active'));
    footer?.classList.add('nx49-footer-visible');
  }else{
    const revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('nx49-visible');
        revealObserver.unobserve(entry.target);
      });
    },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    revealNodes.forEach(el=>revealObserver.observe(el));

    const sectionObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting)entry.target.classList.add('nx49-section-active');
      });
    },{threshold:.18});
    sections.forEach(s=>sectionObserver.observe(s));

    if(footer){
      const footerObserver=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{if(entry.isIntersecting){footer.classList.add('nx49-footer-visible');footerObserver.disconnect();}});
      },{threshold:.08});
      footerObserver.observe(footer);
    }
  }
};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',onReady,{once:true}):onReady();
})();

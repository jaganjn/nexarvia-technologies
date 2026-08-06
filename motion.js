(()=>{"use strict";
const ready=()=>{
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const selectors=[
    'main > section','.nx-section','.nx24-section','.nx24-horizontal-section','.application-zone',
    '.panel','.metric-card','.nx-card','.nx24-path-card','.nx25-programme-card','.nx33-service-card',
    '.nx34-trust-card','.nx27-project-card','.nx24-journey-step','.nx32-stage','.nx38-mobile-card',
    '.crm-login-card','.crm-login-intro','.nx-student-copy','.nx-student-card'
  ];
  const nodes=[...new Set(selectors.flatMap(s=>[...document.querySelectorAll(s)]))];
  nodes.forEach((el,i)=>{
    if(!el.hasAttribute('data-nx-motion')){
      const variant=el.matches('.crm-login-intro,.nx-student-copy')?'left':el.matches('.crm-login-card,.nx-student-card')?'right':el.matches('.metric-card')?'scale':'up';
      el.setAttribute('data-nx-motion',variant);
    }
    el.style.setProperty('--nx-motion-delay',`${Math.min((i%5)*65,260)}ms`);
  });
  document.querySelectorAll('h1,h2,.nx-heading,.nx24-section-head h2,.panel h2').forEach(h=>h.classList.add('nx-motion-heading'));
  document.querySelectorAll('.nx-btn,.panel-action,.crm-login-button').forEach(b=>b.classList.add('nx-premium-action'));
  document.querySelectorAll('.nx-card,.nx24-path-card,.nx25-programme-card,.nx33-service-card,.nx34-trust-card,.panel,.metric-card').forEach(c=>c.classList.add('nx-motion-card'));
  document.querySelectorAll('.nx-core,.nx24-parent-node,.nx31-hub,.nx27-project-icon,.nx32-journey-title i').forEach(x=>x.classList.add('nx-motion-pulse'));
  root.classList.add('nx-motion-ready');
  if(reduced||!('IntersectionObserver'in window)){nodes.forEach(n=>n.classList.add('is-nx-visible'));return}
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-nx-visible');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px',threshold:.08});
  nodes.forEach(n=>io.observe(n));
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){
    document.querySelectorAll('.nx-motion-card').forEach(card=>card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--nx-mx',`${e.clientX-r.left}px`);card.style.setProperty('--nx-my',`${e.clientY-r.top}px`)}));
  }
};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',ready,{once:true}):ready();
})();

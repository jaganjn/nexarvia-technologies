(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mark intentional division entry from the common corporate home.
  $$('[data-division-link]').forEach(link=>link.addEventListener('click',()=>{try{sessionStorage.setItem('nexarviaDivisionEntry',link.dataset.divisionLink||'selected')}catch{}}));

  // Responsive navigation.
  const menuButton=$('[data-nx-menu-button]'), drawer=$('[data-nx-drawer]'), overlay=$('[data-nx-overlay]'), close=$('[data-nx-drawer-close]');
  const setMenu=open=>{if(!menuButton||!drawer||!overlay)return;menuButton.setAttribute('aria-expanded',String(open));drawer.classList.toggle('is-open',open);overlay.classList.toggle('is-open',open);drawer.setAttribute('aria-hidden',String(!open));document.body.classList.toggle('nx-menu-open',open);if(open)setTimeout(()=>drawer.querySelector('a')?.focus(),50)};
  menuButton?.addEventListener('click',()=>setMenu(menuButton.getAttribute('aria-expanded')!=='true'));close?.addEventListener('click',()=>setMenu(false));overlay?.addEventListener('click',()=>setMenu(false));drawer?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});addEventListener('resize',()=>{if(innerWidth>1250)setMenu(false)},{passive:true});

  // Safe scroll entrance motion.
  if(!reduced&&'IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;e.target.animate([{opacity:.01,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:620,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});io.unobserve(e.target)}),{threshold:.1,rootMargin:'0px 0px -35px'});$$('.nx-reveal').forEach(io.observe.bind(io))}

  // Back to top visibility.
  const top=$('.nx-back-top');const updateTop=()=>top?.classList.toggle('is-visible',scrollY>700);addEventListener('scroll',updateTop,{passive:true});updateTop();

  // Public notification panel backed by Firebase announcements.
  const noticeButton=$('[data-nx-notification-button]'),noticePanel=$('[data-nx-notification-panel]'),noticeOverlay=$('[data-nx-notification-overlay]'),noticeClose=$('[data-nx-notification-close]'),noticeList=$('[data-nx-notification-list]'),noticeBadge=$('[data-nx-notification-badge]');
  const setNotices=open=>{noticePanel?.classList.toggle('is-open',open);noticeOverlay?.classList.toggle('is-open',open);noticePanel?.setAttribute('aria-hidden',String(!open));noticeButton?.setAttribute('aria-expanded',String(open));};noticeButton?.addEventListener('click',()=>setNotices(!noticePanel?.classList.contains('is-open')));noticeClose?.addEventListener('click',()=>setNotices(false));noticeOverlay?.addEventListener('click',()=>setNotices(false));
  const renderNotices=items=>{if(!noticeList)return;const audience=document.body.dataset.notificationAudience||'corporate';const rows=items.filter(x=>x.active!==false&&['all',audience].includes(x.audience||'all')).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));noticeList.innerHTML=rows.length?rows.map(x=>`<article class="nx-notice"><strong>${escapeHtml(x.title||'Website update')}</strong><p>${escapeHtml(x.message||'')}</p><small>${formatTime(x.createdAt)}</small></article>`).join(''):'<div class="nx-notice-empty">No current announcements for this page.</div>';if(noticeBadge){noticeBadge.textContent=String(Math.min(rows.length,99));noticeBadge.classList.toggle('has-items',rows.length>0)}};
  if(typeof db!=='undefined'){db.ref('publicAnnouncements').on('value',s=>renderNotices(Object.values(s.val()||{})),()=>renderNotices([]))}else renderNotices([]);

  // Technology Services enquiry submission is handled by technology-inquiry.js.

  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function formatTime(v){const n=Number(v)||Date.parse(v||'');return n?new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(n)):'Current notice'}
})();

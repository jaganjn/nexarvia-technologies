
(()=>{const portalButtons=document.querySelectorAll('[data-learning-portal-preview]');portalButtons.forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();const el=document.getElementById('portal');if(el)el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}));})();

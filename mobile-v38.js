(()=>{"use strict";
const mq=matchMedia("(max-width: 767px)"),body=document.body;let cleanup=[];
const icons={
 home:'<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>',
 learn:'<svg viewBox="0 0 24 24"><path d="m3 6 9-3 9 3-9 3-9-3Z"/><path d="M7 8v5c0 2 2.2 3.5 5 3.5s5-1.5 5-3.5V8"/><path d="M21 6v7"/></svg>',
 services:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/></svg>',
 journey:'<svg viewBox="0 0 24 24"><path d="M4 18c4-9 8 2 12-7"/><path d="m14 7 4 4-4 4"/></svg>',
 portal:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 8h8M8 12h5M8 16h8"/></svg>',
 apply:'<svg viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
 enquiry:'<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 9h8M8 13h5"/></svg>',
 process:'<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><path d="M8 6h4a4 4 0 0 1 4 4M8 18h4a4 4 0 0 0 4-4"/></svg>',
 dashboard:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
 applications:'<svg viewBox="0 0 24 24"><path d="M7 3h10v4H7z"/><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M8 11h8M8 15h8"/></svg>',
 referrals:'<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="7" r="2"/><path d="M3 20c0-4 2-6 5-6s5 2 5 6M14 14c3 0 5 2 5 5"/></svg>',
 menu:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
};
function nav(items,cls){const n=document.createElement('nav');n.className=cls;n.setAttribute('aria-label','Mobile navigation');n.innerHTML=items.map((x,i)=>`<${x.button?'button type="button"':'a href="'+x.href+'"'} class="${i===0?'is-active':''}" data-mobile-target="${x.target||''}">${icons[x.icon]}<span>${x.label}</span></${x.button?'button':'a'}>`).join('');body.append(n);return n}
function publicNav(type){if(document.querySelector('.nx38-bottom-nav'))return;let items;
if(type==='home')items=[
  {href:'index.html',icon:'home',label:'Home'},
  {href:'#mission',icon:'journey',label:'Mission'},
  {href:'#contact',icon:'enquiry',label:'Contact'}
];
else if(type==='learning')items=[{href:'#overview',icon:'home',label:'Home'},{href:'#programmes',icon:'learn',label:'Programs'},{href:'#experience',icon:'journey',label:'Journey'},{href:'student-login.html',icon:'portal',label:'Login'},{href:'#apply',icon:'apply',label:'Apply'}];
else items=[{href:'#overview',icon:'home',label:'Home'},{href:'#services',icon:'services',label:'Services'},{href:'#process',icon:'process',label:'Process'},{href:'#inquiry',icon:'enquiry',label:'Enquiry'},{href:'#contact',icon:'menu',label:'Contact'}];
const n=nav(items,'nx38-bottom-nav');const links=[...n.querySelectorAll('a[href^="#"]')];
const onScroll=()=>{let active=n.querySelector('a');for(const a of links){const t=document.querySelector(a.hash);if(t&&t.getBoundingClientRect().top<=170)active=a}n.querySelectorAll('a').forEach(a=>a.classList.toggle('is-active',a===active))};
addEventListener('scroll',onScroll,{passive:true});cleanup.push(()=>removeEventListener('scroll',onScroll));
}
function swipeNotes(){document.querySelectorAll('.nx25-programme-grid').forEach(el=>{if(el.nextElementSibling?.classList.contains('nx38-swipe-note'))return;const d=document.createElement('div');d.className='nx38-swipe-note';d.textContent='Swipe to compare programmes';el.after(d)})}
function labelTables(){document.querySelectorAll('.table-wrap table').forEach(t=>{const h=[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());t.querySelectorAll('tbody tr').forEach(r=>[...r.children].forEach((d,i)=>{if(!d.hasAttribute('colspan'))d.dataset.label=h[i]||'Detail'}))})}
function adminScreens(){const side=document.querySelector('.sidebar'),top=document.querySelector('.topbar'),work=document.querySelector('.workspace');if(!side||!top||!work)return;
const ov=document.createElement('div');ov.className='nx38-admin-overlay';body.append(ov);const b=document.createElement('button');b.className='nx38-admin-menu';b.type='button';b.setAttribute('aria-label','Open admin menu');b.innerHTML=icons.menu;top.prepend(b);
const open=v=>{side.classList.toggle('nx38-open',v);ov.classList.toggle('is-open',v);body.style.overflow=v?'hidden':''};b.addEventListener('click',()=>open(true));ov.addEventListener('click',()=>open(false));side.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>open(false)));
const n=nav([{button:true,target:'dashboard',icon:'dashboard',label:'Dashboard'},{button:true,target:'applications',icon:'applications',label:'Applications'},{button:true,target:'enquiries',icon:'enquiry',label:'Enquiries'},{button:true,target:'referrals',icon:'referrals',label:'Referrals'},{button:true,target:'more',icon:'menu',label:'More'}],'nx38-admin-nav');
const hero=document.querySelector('#dashboard'),metrics=document.querySelector('.metric-grid'),grid=document.querySelector('.dashboard-grid'),app=document.querySelector('#applications'),refHead=document.querySelector('#referralOverview'),techHead=document.querySelector('#technologyInquiries'),ann=document.querySelector('#announcements'),settings=document.querySelector('#settings');
const all=[...work.children].filter(x=>!x.classList.contains('topbar'));
function range(start,end){const out=[];let on=false;for(const x of all){if(x===start)on=true;if(on)out.push(x);if(x===end)break}return out}
const referralNodes=refHead&&techHead?range(refHead,all[all.indexOf(techHead)-1]):[];const enquiryNodes=techHead&&ann?range(techHead,all[all.indexOf(ann)-1]):[];
function show(name){all.forEach(x=>x.classList.add('nx38-mobile-screen-hidden'));if(name==='dashboard'){[hero,metrics,grid].forEach(x=>x?.classList.remove('nx38-mobile-screen-hidden'));if(grid){[...grid.children].forEach(c=>c.classList.remove('nx38-mobile-screen-hidden'));app?.classList.add('nx38-mobile-screen-hidden')}}else if(name==='applications'){grid?.classList.remove('nx38-mobile-screen-hidden');if(grid)[...grid.children].forEach(c=>c.classList.toggle('nx38-mobile-screen-hidden',c!==app))}else if(name==='enquiries')enquiryNodes.forEach(x=>x.classList.remove('nx38-mobile-screen-hidden'));else if(name==='referrals')referralNodes.forEach(x=>x.classList.remove('nx38-mobile-screen-hidden'));else [ann,settings].forEach(x=>x?.classList.remove('nx38-mobile-screen-hidden'));n.querySelectorAll('button').forEach(x=>x.classList.toggle('is-active',x.dataset.mobileTarget===name));scrollTo({top:0,behavior:'smooth'})}
n.querySelectorAll('button').forEach(x=>x.addEventListener('click',()=>{if(x.dataset.mobileTarget==='more')open(true);show(x.dataset.mobileTarget)}));show('dashboard');labelTables();const mo=new MutationObserver(labelTables);document.querySelectorAll('.table-wrap tbody').forEach(x=>mo.observe(x,{childList:true,subtree:true}));
cleanup.push(()=>{mo.disconnect();b.remove();ov.remove();n.remove();side.classList.remove('nx38-open');body.style.overflow='';all.forEach(x=>x.classList.remove('nx38-mobile-screen-hidden'))})}
function init(){if(!mq.matches||body.classList.contains('nx38-mobile-ready'))return;body.classList.add('nx38-mobile-ready');if(body.classList.contains('nx24-home-page'))publicNav('home');else if(body.classList.contains('nx24-learning-page'))publicNav('learning');else if(body.classList.contains('nx24-services-page'))publicNav('services');else if(body.classList.contains('admin-page'))adminScreens();swipeNotes()}
function destroy(){if(mq.matches)return;body.classList.remove('nx38-mobile-ready');document.querySelectorAll('.nx38-bottom-nav,.nx38-admin-nav,.nx38-admin-overlay,.nx38-admin-menu,.nx38-swipe-note').forEach(x=>x.remove());cleanup.forEach(f=>{try{f()}catch{}});cleanup=[];document.querySelector('.sidebar')?.classList.remove('nx38-open');document.querySelectorAll('.nx38-mobile-screen-hidden').forEach(x=>x.classList.remove('nx38-mobile-screen-hidden'));body.style.overflow=''}
const sync=()=>mq.matches?init():destroy();document.readyState==='loading'?document.addEventListener('DOMContentLoaded',sync,{once:true}):sync();mq.addEventListener?.('change',sync)
})();

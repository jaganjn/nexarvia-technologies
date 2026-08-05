(() => {
  const root = document.querySelector('[data-nx48-journey]');
  if (!root) return;
  const steps = [...root.querySelectorAll('.nx48-steps button')];
  const bar = root.querySelector('[data-nx48-progress]');
  const knob = root.querySelector('[data-nx48-knob]');
  const percent = root.querySelector('[data-nx48-percent]');
  const title = root.querySelector('[data-nx48-title]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = 0;
  const outcome = ['Choose a clear direction with confidence.','Build knowledge through structured learning.','Turn concepts into practical evidence.','Create work you can explain and demonstrate.','Present practical work with confidence.'];
  function activate(index){
    active=index;
    steps.forEach((step,i)=>step.classList.toggle('active',i===index));
    const value=Number(steps[index].dataset.progress||20);
    bar.style.width=value+'%';
    knob.style.left=`calc(${value}% - 10px)`;
    percent.textContent=value+'% COMPLETE';
    title.textContent=outcome[index];
  }
  steps.forEach((step,i)=>{
    step.addEventListener('click',()=>activate(i));
    step.addEventListener('mouseenter',()=>activate(i));
    step.addEventListener('focus',()=>activate(i));
  });
  activate(0);
  if(!reduced) setInterval(()=>activate((active+1)%steps.length),3200);
})();

(function(){
  const dataUrl=()=>new URL((/\/pages\//i.test(window.location.pathname)?'../':'')+'IMAGES/data/skills.json',window.location.href);
  const includesCategory=(skill,category)=>category==='all'||skill.category===category||skill.additionalCategories?.includes(category);
  const rangeFor=(ranges,value)=>ranges.find(range=>value>=range.min&&value<=range.max)?.label||'Foundation';
  const levelFor=(skill,ranges)=>skill.level||rangeFor(ranges,skill.proficiency||0);
  const valueFor=(skill,ranges)=>{
    if(typeof skill.proficiency==='number')return skill.proficiency;
    const level=levelFor(skill,ranges);
    const range=ranges.find(item=>item.label===level);
    return range?Math.round((range.min+range.max)/2):60;
  };

  const pageInitializations=new WeakMap();
  const initSkillsPage=async()=>{
    const page=document.querySelector('.skills-page');
    if(!page||page.dataset.skillsReady==='true')return;
    if(pageInitializations.has(page))return pageInitializations.get(page);

    const featured=page.querySelector('[data-skills-featured]');
    const filters=page.querySelector('[data-stack-filters]');
    const stack=page.querySelector('[data-skills-stack]');
    const proficiency=page.querySelector('[data-skills-proficiency]');
    const work=page.querySelector('[data-skills-work]');
    if(!featured||!filters||!stack||!proficiency||!work)return;

    const initialization=(async()=>{
    const response=await fetch(dataUrl());
    if(!response.ok)throw new Error('Unable to load skills data');
    const data=await response.json();
    let selectedCategory='all';

    const skillsById=new Map(data.skills.map(skill=>[skill.id,skill]));
    const categories=[{id:'all',label:'All'},...data.categories];
    const filteredSkills=()=>data.skills.filter(skill=>includesCategory(skill,selectedCategory));

    featured.innerHTML=data.featuredAreas.map(area=>{
      const skillNames=area.skillIds.map(id=>skillsById.get(id)?.name).filter(Boolean).join(', ');
      const skill=skillsById.get(area.proficiencySkillId);
      const value=skill?valueFor(skill,data.proficiencyRanges):0;
      return `<article class="skills-feature-card">
        <div class="skills-card-head"><span class="skills-tech-icon">${area.icon}</span><h3>${area.title}</h3></div>
        <p>${area.description}</p>
        <div class="skills-card-stack">${skillNames}</div>
        <div class="skills-meter"><div><span>${skill?.name||area.title}</span><strong>${value}%</strong></div><i style="--value:${value}%"></i></div>
      </article>`;
    }).join('');

    work.innerHTML=data.workWith.map(item=>{
      const skillNames=item.skillIds.map(id=>skillsById.get(id)?.name).filter(Boolean).join(', ');
      return `<article><h3>${item.title}</h3><p>${skillNames}</p></article>`;
    }).join('');

    filters.innerHTML=categories.map(category=>`<button class="skills-filter${category.id==='all'?' is-active':''}" type="button" data-category="${category.id}">${category.label}</button>`).join('');

    const render=()=>{
      const currentSkills=filteredSkills();
      stack.innerHTML=currentSkills.map(skill=>`<article class="skills-tech-card">
        <span>${skill.icon}</span>
        <div><h3>${skill.name}</h3><p>${data.categories.find(category=>category.id===skill.category)?.label||skill.category}</p><strong>${levelFor(skill,data.proficiencyRanges)}</strong></div>
      </article>`).join('');

      proficiency.innerHTML=currentSkills.map(skill=>{
        const value=valueFor(skill,data.proficiencyRanges);
        return `<article class="skills-proficiency-row">
          <div><span>${skill.proficiencyName||skill.name}</span><em>${levelFor(skill,data.proficiencyRanges)}</em><strong>${value}%</strong></div>
          <i style="--value:${value}%"></i>
        </article>`;
      }).join('');

      filters.querySelectorAll('.skills-filter').forEach(button=>{
        button.classList.toggle('is-active',button.dataset.category===selectedCategory);
      });
      requestAnimationFrame(matchProficiencyHeight);
    };

    const matchProficiencyHeight=()=>{
      const leftColumn=page.querySelector('.skills-dashboard-main');
      const panel=page.querySelector('.skills-proficiency-panel');
      if(!leftColumn||!panel)return;
      panel.style.setProperty('--skills-proficiency-height',`${leftColumn.offsetHeight}px`);
    };

    filters.addEventListener('click',event=>{
      const button=event.target.closest('.skills-filter');
      if(!button)return;
      selectedCategory=button.dataset.category;
      render();
    });

    render();
    window.addEventListener('resize',matchProficiencyHeight);
    page.dataset.skillsReady='true';
    })();
    pageInitializations.set(page,initialization);
    try {
      await initialization;
    } catch (error) {
      pageInitializations.delete(page);
      console.error('Skills content could not be initialized.',error);
    }
  };

  window.initSkillsPage=initSkillsPage;
  initSkillsPage();
  document.addEventListener('DOMContentLoaded',initSkillsPage);
  document.addEventListener('portfolio-page-ready',initSkillsPage);
})();

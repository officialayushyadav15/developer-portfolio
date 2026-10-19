(function(){
  if(window.__developerPortfolioSkillsLoaded)return;

  const dataUrl=()=>new URL((/\/pages\//i.test(window.location.pathname)?'../':'')+'IMAGES/data/skills.json',window.location.href);
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,character=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[character]));
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
  let resizeController=null;
  const matchProficiencyHeight=()=>{
    const page=document.querySelector('.skills-page');
    const leftColumn=page?.querySelector('.skills-dashboard-main');
    const panel=page?.querySelector('.skills-proficiency-panel');
    if(!leftColumn||!panel)return;
    panel.style.setProperty('--skills-proficiency-height',`${leftColumn.offsetHeight}px`);
  };

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
    if(!page.isConnected||document.querySelector('.skills-page')!==page)return;
    let selectedCategory='all';

    const skillsById=new Map(data.skills.map(skill=>[skill.id,skill]));
    const categories=[{id:'all',label:'All'},...data.categories];
    const filteredSkills=()=>data.skills.filter(skill=>includesCategory(skill,selectedCategory));

    featured.innerHTML=data.featuredAreas.map(area=>{
      const skillNames=area.skillIds.map(id=>skillsById.get(id)?.name).filter(Boolean).join(', ');
      const skill=skillsById.get(area.proficiencySkillId);
      const value=skill?valueFor(skill,data.proficiencyRanges):0;
      return `<article class="skills-feature-card">
        <div class="skills-card-head"><span class="skills-tech-icon" aria-hidden="true">${escapeHtml(area.icon)}</span><h3>${escapeHtml(area.title)}</h3></div>
        <p>${escapeHtml(area.description)}</p>
        <div class="skills-card-stack">${escapeHtml(skillNames)}</div>
        <div class="skills-meter"><div><span>${escapeHtml(skill?.name||area.title)}</span><strong>${value}%</strong></div><i style="--value:${value}%"></i></div>
      </article>`;
    }).join('');

    work.innerHTML=data.workWith.map(item=>{
      const skillNames=item.skillIds.map(id=>skillsById.get(id)?.name).filter(Boolean).join(', ');
      return `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(skillNames)}</p></article>`;
    }).join('');

    filters.innerHTML=categories.map(category=>`<button class="skills-filter${category.id==='all'?' is-active':''}" type="button" data-category="${escapeHtml(category.id)}" aria-pressed="${category.id==='all'}">${escapeHtml(category.label)}</button>`).join('');

    const render=(updateSkillLists=true)=>{
      const currentSkills=filteredSkills();
      if(updateSkillLists){
        stack.innerHTML=currentSkills.map(skill=>`<article class="skills-tech-card">
          <span aria-hidden="true">${escapeHtml(skill.icon)}</span>
          <div><h3>${escapeHtml(skill.name)}</h3><p>${escapeHtml(data.categories.find(category=>category.id===skill.category)?.label||skill.category)}</p><strong>${escapeHtml(levelFor(skill,data.proficiencyRanges))}</strong></div>
        </article>`).join('');

        proficiency.innerHTML=currentSkills.map(skill=>{
          const value=valueFor(skill,data.proficiencyRanges);
          return `<article class="skills-proficiency-row">
            <div><span>${escapeHtml(skill.proficiencyName||skill.name)}</span><em>${escapeHtml(levelFor(skill,data.proficiencyRanges))}</em><strong>${value}%</strong></div>
            <i style="--value:${value}%"></i>
          </article>`;
        }).join('');
      }

      filters.querySelectorAll('.skills-filter').forEach(button=>{
        const isActive=button.dataset.category===selectedCategory;
        button.classList.toggle('is-active',isActive);
        button.setAttribute('aria-pressed',String(isActive));
      });
      requestAnimationFrame(matchProficiencyHeight);
    };

    filters.addEventListener('click',event=>{
      const button=event.target.closest('.skills-filter');
      if(!button)return;
      selectedCategory=button.dataset.category;
      render();
    });

    render(false);
    resizeController?.abort();
    resizeController=new AbortController();
    window.addEventListener('resize',matchProficiencyHeight,{signal:resizeController.signal});
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

  window.__developerPortfolioSkillsLoaded=true;
  window.initSkillsPage=initSkillsPage;
  initSkillsPage();
  document.addEventListener('DOMContentLoaded',initSkillsPage);
  document.addEventListener('portfolio-page-ready',()=>{
    if(!document.querySelector('.skills-page')){
      resizeController?.abort();
      resizeController=null;
      return;
    }
    initSkillsPage();
  });
})();

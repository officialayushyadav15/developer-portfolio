document.addEventListener('DOMContentLoaded',async()=>{
  const shell=document.querySelector('.app-shell');
  if(!shell)return;

  const linkedIn='https://www.linkedin.com/in/ayush-yadav-dev/';
  const github='https://github.com/officialayushyadav15';
  const email='officialayushyadav15@gmail.com';
  let main=shell.querySelector('.dashboard-main');

  const updateContacts=()=>{
    document.querySelectorAll('a[href="https://linkedin.com"]').forEach(link=>link.href=linkedIn);
    document.querySelectorAll('a[href="https://github.com"]').forEach(link=>link.href=github);
    document.querySelectorAll('a[href="mailto:your-email@example.com"]').forEach(link=>{
      link.href=`mailto:${email}`;
      if(link.textContent.includes('your-email'))link.textContent=email;
    });
  };

  const isPagesRoute = () => /\/pages\//i.test(window.location.pathname);

  const normalizeSharedPath = value => {
    if (!value || value.startsWith('http') || value.startsWith('mailto:') || value.startsWith('#') || value.startsWith('/') || value.startsWith('data:')) {
      return value;
    }

    let normalized = value.replace(/\\/g, '/');

    if (normalized.startsWith('../pages/')) {
      normalized = normalized.replace(/^\.\.\/pages\//, 'pages/');
    }

    if (normalized === 'index.html' || normalized === '../index.html' || normalized === 'pages/../index.html') {
      return isPagesRoute() ? '../index.html' : 'index.html';
    }

    if (normalized.startsWith('pages/')) {
      return isPagesRoute() ? normalized.replace(/^pages\//, '') : normalized;
    }

    if (normalized.endsWith('.html')) {
      return isPagesRoute() ? normalized : `pages/${normalized}`;
    }

    return normalized;
  };

  const fixSharedComponentPaths = () => {
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');

        if (!href) return;

        if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) {
            return;
        }

        link.setAttribute('href', normalizeSharedPath(href));
    });

    const profile = document.querySelector('.portrait img');

      if (profile) {
          profile.src = isPagesRoute() ? '../IMAGES/PROFILE.png' : 'IMAGES/PROFILE.png';
      }
  };

  const updateActiveNavigation=()=>{
    const currentPath=window.location.pathname.replace(/\/$/,'/index.html');
    document.querySelectorAll('.sidebar-nav a').forEach(link=>{
      const linkPath=new URL(link.href,window.location.href).pathname.replace(/\/$/,'/index.html');
      link.classList.toggle('active',linkPath===currentPath);
    });
  };

  const buildFallbackShell=()=>{
    const fallbackHeader=`<header class="topbar">
      <button class="menu-button" type="button" aria-label="Open navigation" aria-expanded="false"><span></span><span></span><span></span></button>
      <strong class="topbar-name">Ayush Yadav</strong>
      <div class="topbar-actions">
        <button class="icon-button theme-toggle" type="button" aria-label="Toggle colour theme" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 15.6A8.7 8.7 0 0 1 8.4 3.2 8.7 8.7 0 1 0 20.8 15.6Z"/></svg></button>
        <a class="icon-button linkedin" href="https://www.linkedin.com/in/ayush-yadav-dev/" aria-label="LinkedIn" target="_blank" rel="noreferrer">in</a>
        <a class="icon-button" href="https://github.com/officialayushyadav15" aria-label="GitHub" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6a9.5 9.5 0 0 0-3 18.5c.5.1.6-.2.6-.5v-1.8c-2.5.5-3-1.1-3-1.1-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.3 2.1 1 2.6.7.1-.6.3-1 .6-1.2-2-.2-4.1-1-4.1-4.5 0-1 .4-1.8 1-2.4-.1-.2-.4-1.2.1-2.4 0 0 .8-.3 2.5.9a8.6 8.6 0 0 1 4.6 0c1.8-1.2 2.5-.9 2.5-.9.5 1.3.2 2.2.1 2.4.6.7 1 1.5 1 2.4 0 3.5-2.1 4.3-4.1 4.5.3.3.6.9.6 1.8v2.6c0 .3.2.6.6.5A9.5 9.5 0 0 0 12 2.6Z"/></svg></a>
        <a class="contact-top" href="${normalizeSharedPath('contact.html')}" aria-label="Contact Me"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3zM3 6l9 7 9-7"/></svg>Contact Me</a>
      </div>
    </header>`;

    const fallbackSidebar=`<aside class="sidebar" aria-label="Main navigation">
      <div class="identity">
        <div class="portrait"><img src="${isPagesRoute() ? '../IMAGES/PROFILE.png' : 'IMAGES/PROFILE.png'}" alt="Ayush Yadav"></div>
        <strong class="identity-name">Ayush Yadav</strong>
        <p>Salesforce Developer</p>
      </div>
      <nav class="sidebar-nav">
        <a href="${normalizeSharedPath('index.html')}" class="active">Home</a>
        <a href="${normalizeSharedPath('pages/about.html')}">About</a>
        <a href="${normalizeSharedPath('pages/skills.html')}">Skills</a>
        <a href="${normalizeSharedPath('pages/experience.html')}">Experience</a>
        <a href="${normalizeSharedPath('pages/projects.html')}">Projects</a>
        <a href="${normalizeSharedPath('pages/certifications.html')}">Certifications</a>
        <a href="${normalizeSharedPath('pages/resume.html')}">Resume</a>
        <a href="${normalizeSharedPath('pages/contact.html')}">Contact Me</a>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-foot">
          <strong>Contact Me</strong>
          <div class="social-links">
            <a href="https://www.linkedin.com/in/ayush-yadav-dev/" aria-label="LinkedIn" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.5H3.2V21h3.3V8.5ZM4.85 3C3.75 3 3 3.75 3 4.75s.72 1.75 1.82 1.75h.03c1.13 0 1.83-.75 1.83-1.75C6.65 3.75 5.97 3 4.85 3ZM21 13.84c0-3.77-2.01-5.52-4.69-5.52-2.16 0-3.13 1.19-3.67 2.03V8.5H9.3c.04 1.23 0 12.5 0 12.5h3.34v-6.98c0-.37.03-.74.14-1.01.24-.74.8-1.5 1.73-1.5 1.22 0 1.71.93 1.71 2.3V21H19.55v-7.16H21Z"/></svg></a>
            <a href="https://github.com/officialayushyadav15" aria-label="GitHub" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6a9.5 9.5 0 0 0-3 18.5c.5.1.6-.2.6-.5v-1.8c-2.5.5-3-1.1-3-1.1-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.3 2.1 1 2.6.7.1-.6.3-1 .6-1.2-2-.2-4.1-1-4.1-4.5 0-1 .4-1.8 1-2.4-.1-.2-.4-1.2.1-2.4 0 0 .8-.3 2.5.9a8.6 8.6 0 0 1 4.6 0c1.8-1.2 2.5-.9 2.5-.9.5 1.3.2 2.2.1 2.4.6.7 1 1.5 1 2.4 0 3.5-2.1 4.3-4.1 4.5.3.3.6.9.6 1.8v2.6c0 .3.2.6.6.5A9.5 9.5 0 0 0 12 2.6Z"/></svg></a>
            <a href="mailto:officialayushyadav15@gmail.com" aria-label="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3zM3 6l9 7 9-7"/></svg></a>
          </div>
          <p class="sidebar-email"><span>Email:</span><a href="mailto:officialayushyadav15@gmail.com">officialayushyadav15@gmail.com</a></p>
        </div>
        <small class="sidebar-copyright">© 2026 Ayush Yadav<br>All Rights Reserved</small>
      </div>
    </aside>`;

    return fallbackHeader + fallbackSidebar;
  };

  const loadSharedShell=async()=>{
    if(shell.querySelector('.topbar,.sidebar'))return;

    if (window.location.protocol === 'file:') {
      shell.insertAdjacentHTML('afterbegin', buildFallbackShell());
      document.dispatchEvent(new Event('portfolio-shell-ready'));
      return;
    }

    const componentBase = new URL(isPagesRoute() ? '../components/' : 'components/', document.baseURI);
    const loadComponent=async name=>{
      const response=await fetch(new URL(name,componentBase));
      if(!response.ok)throw new Error(`Unable to load shared ${name}`);
      return response.text();
    };

    try {
      const [header,sidebar]=await Promise.all([loadComponent('header.html'),loadComponent('sidebar.html')]);
      const normalizedMarkup = `${header}${sidebar}`;
      const template=document.createElement('template');
      template.innerHTML = normalizedMarkup;
      template.content.querySelectorAll('a[href], img[src]').forEach(node => {
        if (node.hasAttribute('href')) node.setAttribute('href', normalizeSharedPath(node.getAttribute('href')));
        if (node.hasAttribute('src')) node.setAttribute('src', normalizeSharedPath(node.getAttribute('src')));
      });
      shell.insertAdjacentHTML('afterbegin', template.innerHTML);
    } catch (error) {
      console.warn('Shared shell failed to load; using inline fallback markup.', error);
      shell.insertAdjacentHTML('afterbegin', buildFallbackShell());
    }

    document.dispatchEvent(new Event('portfolio-shell-ready'));
  };

  const ensureRouteStyles=async(documentFragment,routeUrl)=>{
    const styles=[...documentFragment.querySelectorAll('link[rel="stylesheet"]')];
    await Promise.all(styles.map(link=>{
      const href=new URL(link.getAttribute('href'),routeUrl).href;
      if([...document.styleSheets].some(sheet=>sheet.href===href))return Promise.resolve();
      return new Promise((resolve,reject)=>{
        const stylesheet=document.createElement('link');
        stylesheet.rel='stylesheet';
        stylesheet.href=href;
        stylesheet.addEventListener('load',resolve,{once:true});
        stylesheet.addEventListener('error',reject,{once:true});
        document.head.append(stylesheet);
      });
    }));
  };

  const navigate=async(routeUrl,{push=false,restoreY=0}={})=>{
    const response=await fetch(routeUrl,{headers:{'X-Requested-With':'portfolio-navigation'}});
    if(!response.ok)throw new Error(`Unable to load ${routeUrl.pathname}`);
    const routeDocument=new DOMParser().parseFromString(await response.text(),'text/html');
    const nextMain=routeDocument.querySelector('.dashboard-main');
    if(!nextMain)throw new Error(`Route ${routeUrl.pathname} does not provide application content`);
    await ensureRouteStyles(routeDocument,routeUrl);
    const isContactRoute=/\/contact\.html$/i.test(routeUrl.pathname);
    if(isContactRoute)await ensureContactScripts();
    main.replaceWith(nextMain);
    main=nextMain;
    document.title=routeDocument.title;
    if(push){
      history.replaceState({scrollY:window.scrollY},'',window.location.href);
      history.pushState({scrollY:0},'',routeUrl.href);
    }
    fixSharedComponentPaths();
    updateActiveNavigation();
    if(nextMain.querySelector('[data-project-logo]')){
      if(window.applyProjectLogos){
        window.applyProjectLogos();
      }else{
        const logoScript=document.createElement('script');
        logoScript.src=isPagesRoute() ? '../JS/project-logos.js' : 'JS/project-logos.js';
        document.body.append(logoScript);
      }
    }
    if(/\/projects\.html$/i.test(routeUrl.pathname)){
      if(window.applyProjectLinks){
        window.applyProjectLinks();
      }else{
        const script=document.createElement('script');
        script.src=isPagesRoute() ? '../JS/project-links.js' : 'JS/project-links.js';
        await new Promise((resolve,reject)=>{
          script.addEventListener('load',()=>{
            window.applyProjectLinks?.();
            resolve();
          },{once:true});
          script.addEventListener('error',reject,{once:true});
          document.body.append(script);
        });
      }
    }
    if(/\/skills\.html$/i.test(routeUrl.pathname)){
      if(window.initSkillsPage){
        window.initSkillsPage();
      }else{
        const script=document.createElement('script');
        script.src=isPagesRoute() ? '../JS/skills.js' : 'JS/skills.js';
        document.body.append(script);
      }
    }
    window.scrollTo(0,restoreY);
    if(isContactRoute)window.initContactForm?.();
    document.dispatchEvent(new Event('portfolio-page-ready'));
  };

  let contactScriptsPromise;
  const ensureContactScripts=()=>{
    const configPath=isPagesRoute() ? '../JS/contact-config.js' : 'JS/contact-config.js';
    const handlerPath=isPagesRoute() ? '../JS/contact.js' : 'JS/contact.js';
    const configUrl=new URL(configPath,document.baseURI).href;
    const handlerUrl=new URL(handlerPath,document.baseURI).href;
    const loadScript=(url,existing)=>new Promise((resolve,reject)=>{
      if(existing?.dataset.loadState==='loaded'){
        resolve(existing);
        return;
      }
      const script=existing||document.createElement('script');
      if(!existing){
        script.src=url;
        script.dataset.loadState='loading';
      }
      let timeout;
      const cleanup=()=>{
        clearTimeout(timeout);
        script.removeEventListener('load',onLoad);
        script.removeEventListener('error',onError);
      };
      const onLoad=()=>{
        cleanup();
        script.dataset.loadState='loaded';
        resolve(script);
      };
      const onError=()=>{
        cleanup();
        script.dataset.loadState='failed';
        script.remove();
        reject(new Error(`Unable to load ${url}`));
      };
      script.addEventListener('load',onLoad,{once:true});
      script.addEventListener('error',onError,{once:true});
      timeout=setTimeout(()=>{
        cleanup();
        script.dataset.loadState='failed';
        script.remove();
        reject(new Error(`Timed out loading ${url}`));
      },12_000);
      if(!existing)document.body.append(script);
    });

    if(contactScriptsPromise)return contactScriptsPromise;
    contactScriptsPromise=(async()=>{
      const scripts=[...document.scripts];
      const configScript=scripts.find(script=>script.src===configUrl);
      const handlerScript=scripts.find(script=>script.src===handlerUrl);
      if(!window.CONTACT_FORM_CONFIG)await loadScript(configUrl,configScript);
      if(!window.initContactForm)await loadScript(handlerUrl,handlerScript);
      if(!window.CONTACT_FORM_CONFIG||typeof window.initContactForm!=='function'){
        throw new Error('Contact scripts loaded without exposing their expected initialization.');
      }
      window.initContactForm();
    })().catch(error=>{
      contactScriptsPromise=null;
      throw error;
    });
    return contactScriptsPromise;
  };

  try{
    await loadSharedShell();
    fixSharedComponentPaths();
    ensureContactScripts().catch(error=>{
      console.error('Contact form scripts could not be initialized.',error);
    });
  }catch(error){
    console.error('Shared application shell could not be loaded.',error);
  }

  updateContacts();
  updateActiveNavigation();

  const button=document.querySelector('.menu-button');
  const sidebar=document.querySelector('.sidebar');
  const closeNavigation=()=>{
    if(!sidebar||!button)return;
    sidebar.classList.remove('open');
    button.setAttribute('aria-expanded','false');
  };
  button?.addEventListener('click',()=>{
    const open=sidebar?.classList.toggle('open');
    button.setAttribute('aria-expanded',String(open));
  });

  document.addEventListener('click',event=>{
    const link=event.target.closest('a');
    if(link&&link.origin===window.location.origin&&!link.target&&!link.hasAttribute('download')&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){
      const href = link.getAttribute('href');
      if (!href) return;
      if (
          href.startsWith('http') ||
          href.startsWith('mailto:') ||
          href.startsWith('#')
      ) {
          return;
      }
      const routeUrl = new URL(normalizeSharedPath(href), window.location.href);
      if(routeUrl.pathname!==window.location.pathname){
        event.preventDefault();
        if(window.innerWidth<=760)closeNavigation();
        navigate(routeUrl,{push:true}).catch(error=>{
          console.error('Client-side navigation failed; using the browser navigation instead.',error);
          window.location.assign(routeUrl.href);
        });
        return;
      }
    }
    if(!sidebar||!button||window.innerWidth>760||!sidebar.classList.contains('open')||sidebar.contains(event.target)||button.contains(event.target))return;
    closeNavigation();
  });

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&sidebar?.classList.contains('open'))closeNavigation();
  });

  history.replaceState({scrollY:window.scrollY},'',window.location.href);
  window.addEventListener('popstate',event=>{
    navigate(new URL(window.location.href),{restoreY:event.state?.scrollY||0}).catch(error=>{
      console.error('History navigation failed; reloading the route.',error);
      window.location.reload();
    });
  });
});

/* ==========================================
   SCROLL.JS
========================================== */

/* ==========================================
   ACTIVE NAVIGATION
========================================== */

const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".sidebar-nav a");

function highlightNav(){

    let current = "";

    sections.forEach(section => {

        const sectionTop = section.offsetTop - 120;
        const sectionHeight = section.offsetHeight;

        if(window.scrollY >= sectionTop &&
           window.scrollY < sectionTop + sectionHeight){

            current = section.getAttribute("id");

        }

    });

    navLinks.forEach(link => {

        link.classList.remove("active");

        if(link.getAttribute("href") === "#" + current){

            link.classList.add("active");

        }

    });

}

/* ==========================================
   HEADER SHADOW
========================================== */

const header = document.querySelector(".header");

function headerShadow(){

    if(window.scrollY > 40){

        header.classList.add("scrolled");

    }else{

        header.classList.remove("scrolled");

    }

}

/* ==========================================
   BACK TO TOP
========================================== */

const backToTop = document.querySelector(".back-to-top");

function toggleBackToTop(){

    if(!backToTop) return;

    if(window.scrollY > 300){

        backToTop.classList.add("show");

    }else{

        backToTop.classList.remove("show");

    }

}

if(backToTop){

    backToTop.addEventListener("click",()=>{

        window.scrollTo({

            top:0,

            behavior:"smooth"

        });

    });

}

/* ==========================================
   SCROLL PROGRESS BAR
========================================== */

const progressBar = document.querySelector(".progress-bar");

function updateProgress(){

    if(!progressBar) return;

    const scrollTop = document.documentElement.scrollTop;

    const scrollHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

    const progress =
        (scrollTop / scrollHeight) * 100;

    progressBar.style.width = progress + "%";

}

/* ==========================================
   SCROLL REVEAL
========================================== */

const revealElements = document.querySelectorAll(

".card, .stat-card, .tech-card, .about-card, .projects-card, .certificate-card"

);

const observer = new IntersectionObserver(

(entries)=>{

    entries.forEach(entry=>{

        if(entry.isIntersecting){

            entry.target.classList.add("fade-up");

        }

    });

},

{

    threshold:0.15

}

);

revealElements.forEach(element=>{

    observer.observe(element);

});

/* ==========================================
   WINDOW SCROLL
========================================== */

window.addEventListener("scroll",()=>{

    highlightNav();

    headerShadow();

    toggleBackToTop();

    updateProgress();

});

/* ==========================================
   INITIAL CALL
========================================== */

highlightNav();

headerShadow();

toggleBackToTop();

updateProgress();
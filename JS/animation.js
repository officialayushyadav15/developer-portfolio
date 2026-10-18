/* ==========================================
   ANIMATION.JS
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    typingAnimation();

    animateCounters();

    tiltCards();

    floatingAnimation();

});


/* ==========================================
   TYPING EFFECT
========================================== */

function typingAnimation(){

    const element = document.querySelector(".typing");

    if(!element) return;

    const words = [

        "Salesforce Developer",

        "Frontend Developer",

        "Apex Developer",

        "LWC Developer"

    ];

    let wordIndex = 0;

    let letterIndex = 0;

    let deleting = false;

    function type(){

        const currentWord = words[wordIndex];

        if(!deleting){

            element.textContent =
                currentWord.substring(0, letterIndex++);

            if(letterIndex > currentWord.length){

                deleting = true;

                setTimeout(type,1500);

                return;

            }

        }

        else{

            element.textContent =
                currentWord.substring(0,--letterIndex);

            if(letterIndex === 0){

                deleting = false;

                wordIndex++;

                if(wordIndex >= words.length){

                    wordIndex = 0;

                }

            }

        }

        setTimeout(type, deleting ? 60 : 120);

    }

    type();

}


/* ==========================================
   COUNTER ANIMATION
========================================== */

function animateCounters(){

    const counters =
        document.querySelectorAll(".counter");

    const speed = 50;

    counters.forEach(counter=>{

        const target =
            Number(counter.dataset.target);

        let count = 0;

        function update(){

            const increment =
                Math.ceil(target / speed);

            if(count < target){

                count += increment;

                counter.innerText = count;

                requestAnimationFrame(update);

            }

            else{

                counter.innerText = target;

            }

        }

        update();

    });

}


/* ==========================================
   TILT EFFECT
========================================== */

function tiltCards(){

    const cards = document.querySelectorAll(

        ".card,.stat-card,.tech-card"

    );

    cards.forEach(card=>{

        card.addEventListener("mousemove",(e)=>{

            const rect =
                card.getBoundingClientRect();

            const x =
                e.clientX - rect.left;

            const y =
                e.clientY - rect.top;

            const rotateX =
                ((y / rect.height)-0.5)*12;

            const rotateY =
                ((x / rect.width)-0.5)*-12;

            card.style.transform =

                `perspective(800px)
                 rotateX(${rotateX}deg)
                 rotateY(${rotateY}deg)
                 translateY(-8px)`;

        });

        card.addEventListener("mouseleave",()=>{

            card.style.transform =

                "perspective(800px) rotateX(0) rotateY(0)";

        });

    });

}


/* ==========================================
   FLOATING HERO IMAGE
========================================== */

function floatingAnimation(){

    const heroImage =
        document.querySelector(".hero-right img");

    if(!heroImage) return;

    let angle = 0;

    function animate(){

        angle += 0.02;

        heroImage.style.transform =

            `translateY(${Math.sin(angle)*10}px)`;

        requestAnimationFrame(animate);

    }

    animate();

}


/* ==========================================
   PARALLAX EFFECT
========================================== */

window.addEventListener("scroll",()=>{

    const hero =
        document.querySelector(".hero-right");

    if(!hero) return;

    const scroll = window.scrollY;

    hero.style.transform =

        `translateY(${scroll * 0.08}px)`;

});


/* ==========================================
   BUTTON RIPPLE
========================================== */

document.querySelectorAll(".btn-primary")

.forEach(button=>{

    button.addEventListener("click",(e)=>{

        const ripple =
            document.createElement("span");

        ripple.classList.add("ripple");

        const rect =
            button.getBoundingClientRect();

        ripple.style.left =
            (e.clientX - rect.left)+"px";

        ripple.style.top =
            (e.clientY - rect.top)+"px";

        button.appendChild(ripple);

        setTimeout(()=>{

            ripple.remove();

        },600);

    });

});
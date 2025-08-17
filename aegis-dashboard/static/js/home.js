// static/js/home.js
document.addEventListener('DOMContentLoaded', () => {

  // === HERO PARTICLE BACKGROUND ===
  const canvas = document.getElementById('heroParticles');
  if (canvas) {
    const dpr = window.devicePixelRatio || 1;
    let width = 0, height = 0;
    const ctx = canvas.getContext('2d');
    const PARTICLES = 50;
    let particles = [];

    function resize() {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    window.addEventListener('resize', resize);
    resize();

    function createParticles() {
      particles = [];
      for (let i = 0; i < PARTICLES; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 1.5 + Math.random() * 2.5,
          dx: (Math.random() - 0.5) * 0.7,
          dy: (Math.random() - 0.5) * 0.7,
          alpha: 0.4 + Math.random() * 0.5,
          color: `rgba(79,70,229,0.6)`, // brand purple
        });
      }
    }
    createParticles();

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = '#4338CA';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        p.x += p.dx;
        p.y += p.dy;

        // Wrap around edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      });
      ctx.globalAlpha = 1.0;
      ctx.restore();
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  // --- STAGGERED FEATURE CARDS ENTRANCE AND MICRO-INTERACTIONS ---
  const featureCards = document.querySelectorAll('.feature-card');
  const staggerDelay = 120; // ms delay between animations
  let cardsRevealed = false;

  // Intersection Observer to reveal cards staggered
  const featureObserver = new IntersectionObserver((entries, observer) => {
    if (cardsRevealed) return;
    entries.forEach(() => {
      cardsRevealed = true;
      featureCards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add('is-visible');
        }, index * staggerDelay);
      });
      observer.disconnect();
    });
  }, { threshold: 0.2 });

  if (featureCards.length) {
    featureCards.forEach(card => featureObserver.observe(card));
  }

  // Micro-interactions: grow, glow, and icon animate on hover/touch
  featureCards.forEach(card => {
    const icon = card.querySelector('i');
    card.addEventListener('mouseenter', () => {
      card.classList.add('active');
      if (icon) icon.classList.add('icon-animate');
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('active');
      if (icon) icon.classList.remove('icon-animate');
    });
    // Touch events for mobile
    card.addEventListener('touchstart', () => {
      card.classList.add('active');
      if (icon) icon.classList.add('icon-animate');
    });
    card.addEventListener('touchend', () => {
      card.classList.remove('active');
      if (icon) icon.classList.remove('icon-animate');
    });
  });

  // Feature card hover/tap: grow, glow, icon anim
featureCards.forEach(card => {
  const icon = card.querySelector('i');
  card.addEventListener('mouseenter', () => {
    card.classList.add('active');
    if (icon) icon.classList.add('icon-animate');
  });
  card.addEventListener('mouseleave', () => {
    card.classList.remove('active');
    if (icon) icon.classList.remove('icon-animate');
  });
  // For touch (mobile)
  card.addEventListener('touchstart', () => {
    card.classList.add('active');
    if (icon) icon.classList.add('icon-animate');
  });
  card.addEventListener('touchend', () => {
    card.classList.remove('active');
    if (icon) icon.classList.remove('icon-animate');
  });
});


  // --- TYPEWRITER EFFECT ---
  const typewriterElement = document.querySelector('.typewriter');
  if (typewriterElement) {
    const words = ["LLM", "AI", "GPT"];
    let wordIndex = 0;
    let letterIndex = 0;
    let isDeleting = false;

    function type() {
      const currentWord = words[wordIndex];
      if (isDeleting) {
        typewriterElement.textContent = currentWord.substring(0, letterIndex - 1);
        letterIndex--;
      } else {
        typewriterElement.textContent = currentWord.substring(0, letterIndex + 1);
        letterIndex++;
      }

      if (!isDeleting && letterIndex === currentWord.length) {
        setTimeout(() => { isDeleting = true; type(); }, 2000);
        return;
      } else if (isDeleting && letterIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
      }

      setTimeout(type, isDeleting ? 100 : 200);
    }
    type();
  }

  // --- OBSERVER FOR CTA PROGRESS BAR AND FEATURE CARDS AS FALLBACK ---
  const generalObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.classList.contains('progress-bar-container')) {
          const progressFill = entry.target.querySelector('.progress-bar-fill');
          if (progressFill) {
            progressFill.classList.add('start-animation');
          }
        }
      }
    });
  }, { threshold: 0.1 });

  // Observe progress bar container
  const ctaProgressBarContainer = document.querySelector('.progress-bar-container');
  if (ctaProgressBarContainer) generalObserver.observe(ctaProgressBarContainer);

  // --- STICKY HEADER SCROLL EFFECT ---
  const header = document.querySelector('.main-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // --- SIGN-IN MODAL LOGIC ---
  const signInBtn = document.querySelector('.nav-links a[href*="login"]');
  const overlay = document.getElementById('signInOverlay');
  const closeModalBtn = document.getElementById('closeModalBtn');

  if (signInBtn && overlay && closeModalBtn) {
    signInBtn.addEventListener('click', e => {
      e.preventDefault(); // prevent navigation
      overlay.classList.add('is-visible');
    });

    const closeModal = () => {
      overlay.classList.remove('is-visible');
    };

    closeModalBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) { // close if click outside modal content
        closeModal();
      }
    });
  }

  
 // --- DYNAMIC DETAILED LOGO ANIMATION ---
const aegisLogo = document.getElementById('aegisLogo');
if (aegisLogo) {
  const spark = aegisLogo.getElementById('spark');
  const midline = aegisLogo.getElementById('shield-midline');
  let angle = 0;
  let pulse = 1;

  function animateLogo() {
    // Spark orbits around the shield's upper core.
    angle = (angle + 1.4) % 360;
    const rad = angle * Math.PI / 180;
    // Orbit path: ellipse near shield top
    const cx = 32 + 13 * Math.cos(rad);
    const cy = 17 + 5.5 * Math.sin(rad);
    if (spark) {
      spark.setAttribute('cx', cx);
      spark.setAttribute('cy', cy);
      // Spark glows/pulses
      pulse = 0.65 + 0.38 * Math.abs(Math.sin(rad * 1.6));
      spark.setAttribute('opacity', pulse);
      spark.setAttribute('r', (3.1 + 1.3 * pulse).toFixed(2));
    }
    // (Optional) Animate midline dash offset for subtle techy movement
    if (midline) {
      const dashOffset = 20 * Math.sin(rad / 2);
      midline.setAttribute('stroke-dashoffset', dashOffset);
    }
    requestAnimationFrame(animateLogo);
  }
  animateLogo();
}


});

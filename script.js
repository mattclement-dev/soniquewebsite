/* ==========================================================================
   SONIQUE — Site interactions (shared across all pages)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initMobileMenu();
  initHeroScroll(prefersReducedMotion);
  initScrollReveal(prefersReducedMotion);
  initSignupForm();
  initFooterYear();
});

/* ---------- Hero: scroll the name away and deepen the opening image ---------- */
function initHeroScroll(prefersReducedMotion) {
  const hero = document.querySelector('.hero-scroll');
  const title = document.querySelector('.hero-scroll-title');
  const shade = document.querySelector('.site-backdrop-shade');
  if (!hero || !title || !shade) return;

  document.body.classList.toggle('hero-scroll-enabled', !prefersReducedMotion);
  let frameRequested = false;
  const update = () => {
    const progress = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)));
    if (!prefersReducedMotion) {
      title.style.transform = `translate3d(-50%, ${-progress * 92}vh, 0)`;
      title.style.opacity = String(Math.max(0, 1 - progress * 1.4));
    }
    shade.style.setProperty('--hero-shade', String(progress * 0.84));
    frameRequested = false;
  };

  const onScroll = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

/* ---------- Mobile menu toggle ---------- */
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  nav.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

/* ---------- Reveal sections as they scroll into view ---------- */
function initScrollReveal(prefersReducedMotion) {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* ---------- Newsletter signup (front-end only placeholder) ----------
   Kept for any other page that may still include a #signup-form.
   The homepage no longer has this form, so this simply no-ops there. */
function initSignupForm() {
  const form = document.getElementById('signup-form');
  const note = document.getElementById('form-note');
  if (!form || !note) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const emailInput = form.querySelector('#email');
    const email = emailInput ? emailInput.value.trim() : '';
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValid) {
      note.textContent = 'Please enter a valid email address.';
      note.style.color = '#c0716f';
      return;
    }

    // NOTE: This is a front-end placeholder only.
    // Connect this to Mailchimp, ConvertKit, Formspree, etc. to actually collect emails.
    note.textContent = `Thanks — you're on the list, ${email}.`;
    note.style.color = '';
    form.reset();
  });
}

/* ---------- Footer year ---------- */
function initFooterYear() {
  document.querySelectorAll('.js-year').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}
/* ==========================================================================
   SONIQUE — Site interactions (shared across all pages)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initHeaderScroll();
  initMobileMenu();
  initScrollReveal(prefersReducedMotion);
  initSignupForm();
  initFooterYear();
});

/* ---------- Header: add background once page is scrolled ---------- */
function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
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
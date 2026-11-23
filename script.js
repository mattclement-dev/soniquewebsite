/* ==========================================================================
   SONIQUE — Site interactions (shared across all pages)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initMobileMenu();
  initHeroScroll(prefersReducedMotion);
  initScrollReveal(prefersReducedMotion);
  initCarouselWheelScroll();
  initCarouselMouseDrag(prefersReducedMotion);
  initCarouselArrows(prefersReducedMotion);
  initSongTextFit();
  initSectionSnap(prefersReducedMotion);
  initSignupForm();
  initFooterYear();
});

/* ---------- Hero: scroll the name away ---------- */
function initHeroScroll(prefersReducedMotion) {
  const hero = document.querySelector('.hero-scroll');
  const title = document.querySelector('.hero-scroll-title');
  if (!hero || !title) return;

  document.body.classList.toggle('hero-scroll-enabled', !prefersReducedMotion);
  let frameRequested = false;
  const update = () => {
    const progress = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)));
    if (!prefersReducedMotion) {
      title.style.transform = `translate3d(-50%, ${-progress * 92}vh, 0)`;
      title.style.opacity = String(Math.max(0, 1 - progress * 1.4));
    }
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

/* ---------- Scroll carousels horizontally with a mouse wheel ---------- */
function initCarouselWheelScroll() {
  document.querySelectorAll('.release-carousel, .video-carousel, .photo-carousel').forEach((carousel) => {
    carousel.addEventListener('wheel', (event) => {
      const wheelDelta = event.deltaX || event.deltaY;
      if (wheelDelta === 0) return;

      const deltaMultiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? carousel.clientWidth
          : 1;
      const scrollDelta = wheelDelta * deltaMultiplier;

      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      const nextScrollLeft = Math.max(0, Math.min(maxScroll, carousel.scrollLeft + scrollDelta));
      if (nextScrollLeft === carousel.scrollLeft) return;

      event.preventDefault();
      carousel.scrollLeft = nextScrollLeft;
    }, { passive: false });
  });
}

/* ---------- Drag carousels with the mouse (left button) ----------
   Touch already swipes natively; this gives mouse users the same feel.
   A short drag still counts as a click on a cover/video; a real drag
   swallows that click so you don't accidentally open a link. */
function initCarouselMouseDrag(prefersReducedMotion) {
  const DRAG_THRESHOLD = 6; // px of movement before it counts as a drag

  document.querySelectorAll('.release-carousel, .video-carousel').forEach((carousel) => {
    let pointerId = null;
    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0; // px per ms

    // Stop the browser's native image/link drag ghost.
    carousel.addEventListener('dragstart', (event) => event.preventDefault());

    carousel.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      startScroll = carousel.scrollLeft;
      lastTime = performance.now();
      velocity = 0;
      dragging = false;
    });

    carousel.addEventListener('pointermove', (event) => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;

      if (!dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        dragging = true;
        carousel.classList.add('is-dragging');
        carousel.setPointerCapture(pointerId);
      }

      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      velocity = (event.clientX - lastX) / dt;
      lastX = event.clientX;
      lastTime = now;

      carousel.scrollLeft = startScroll - dx;
    });

    const endDrag = (event) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      if (!dragging) return;

      carousel.classList.remove('is-dragging');
      if (carousel.hasPointerCapture(event.pointerId)) carousel.releasePointerCapture(event.pointerId);

      // Swallow the click that follows a drag so links don't open.
      const blockClick = (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      };
      carousel.addEventListener('click', blockClick, { capture: true, once: true });
      setTimeout(() => carousel.removeEventListener('click', blockClick, { capture: true }), 0);

      // A little momentum so a flick keeps gliding.
      const glide = -velocity * 250;
      if (!prefersReducedMotion && Math.abs(glide) > 20) {
        carousel.scrollBy({ left: glide, behavior: 'smooth' });
      }
      dragging = false;
    };

    carousel.addEventListener('pointerup', endDrag);
    carousel.addEventListener('pointercancel', endDrag);
  });
}

/* ---------- Carousel hint arrows (shown on mobile via CSS) ----------
   Each arrow hides itself when there is nothing more to scroll that way. */
function initCarouselArrows(prefersReducedMotion) {
  document.querySelectorAll('.carousel-frame').forEach((frame) => {
    const carousel = frame.querySelector('.release-carousel, .video-carousel');
    const prev = frame.querySelector('.carousel-arrow-prev');
    const next = frame.querySelector('.carousel-arrow-next');
    if (!carousel || !prev || !next) return;

    const update = () => {
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      prev.hidden = carousel.scrollLeft <= 4;
      next.hidden = carousel.scrollLeft >= maxScroll - 4;
    };

    const step = (direction) => {
      const item = carousel.querySelector('li');
      const gap = parseFloat(getComputedStyle(carousel).columnGap) || 0;
      const distance = item ? item.offsetWidth + gap : carousel.clientWidth * 0.8;
      carousel.scrollBy({ left: direction * distance, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    };

    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    carousel.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('load', update);
    update();
  });
}

/* ---------- Song pages: line the text up with the cover art ----------
   When the cover and text sit side by side, find the font size (within a
   readable range) at which the text block is exactly as tall as the square
   cover, so their tops and bottoms line up. Stacked layouts use the CSS size. */
const SONG_SIDE_BY_SIDE = '(min-width: 1024px)';
const SONG_FONT_MIN = 13;  // px — never shrink text below this
const SONG_FONT_MAX = 19;  // px

function initSongTextFit() {
  const cover = document.querySelector('.song-cover');
  const body = document.querySelector('.song-body');
  if (!cover || !body) return;

  const sideBySide = window.matchMedia(SONG_SIDE_BY_SIDE);

  const fit = () => {
    body.style.fontSize = '';
    if (!sideBySide.matches) return;

    const target = cover.offsetHeight;
    if (!target) return;

    // Text height grows with font size, so binary-search the size.
    let lo = SONG_FONT_MIN;
    let hi = SONG_FONT_MAX;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      body.style.fontSize = `${mid}px`;
      if (body.offsetHeight > target) hi = mid;
      else lo = mid;
    }
    body.style.fontSize = `${lo}px`;
  };

  let frame = 0;
  const scheduleFit = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(fit);
  };

  fit();
  window.addEventListener('resize', scheduleFit, { passive: true });
  window.addEventListener('load', scheduleFit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleFit);
  const img = cover.querySelector('img');
  if (img && !img.complete) img.addEventListener('load', scheduleFit);
}

/* ---------- Settle on the nearest section when scrolling stops ----------
   Sections that fit on screen are centred in the area below the fixed
   header. Sections taller than the screen can be scrolled through freely;
   they only snap to their top or bottom edge when one is partly in view. */
function initSectionSnap(prefersReducedMotion) {
  const contentMask = document.querySelector('.site-content-mask');
  if (!contentMask || prefersReducedMotion) return;

  const sections = Array.from(document.querySelectorAll('#main > section, .site-content-mask > section'));
  const header = document.getElementById('site-header');
  const nav = document.getElementById('main-nav');
  // The footer is framed together with the last section (Contact), so
  // settling there shows the copyright line instead of snapping above it.
  const footer = document.querySelector('.site-footer');
  const lastSection = sections[sections.length - 1];
  if (!sections.length) return;

  const SETTLE_DELAY = 160;
  const MIN_DISTANCE = 4;
  let settleTimer = null;
  let pointerDown = false;
  let scrolledWhileDown = false;

  // Returns the scroll position that frames this section, or null when the
  // section is taller than the screen and already fills it (free reading).
  const snapTargetFor = (section, scrollY, headerHeight, viewHeight) => {
    const rect = section.getBoundingClientRect();
    const endRect = section === lastSection && footer ? footer.getBoundingClientRect() : rect;
    const top = rect.top + scrollY;
    const bottom = endRect.bottom + scrollY;
    const height = bottom - top;
    const visibleHeight = viewHeight - headerHeight;

    if (height <= visibleHeight) {
      return top - headerHeight - (visibleHeight - height) / 2;
    }

    const fillsScreen = top <= scrollY + headerHeight && bottom >= scrollY + viewHeight;
    if (fillsScreen) return null;

    const alignTop = top - headerHeight;
    const alignBottom = bottom - viewHeight;
    return Math.abs(alignTop - scrollY) < Math.abs(alignBottom - scrollY) ? alignTop : alignBottom;
  };

  const settle = () => {
    if (pointerDown || (nav && nav.classList.contains('open'))) return;

    const scrollY = window.scrollY;
    const viewHeight = window.innerHeight;
    const headerHeight = header ? header.offsetHeight : 0;
    const maxScroll = document.documentElement.scrollHeight - viewHeight;

    let bestTarget = null;
    let bestDistance = Infinity;
    for (const section of sections) {
      const target = snapTargetFor(section, scrollY, headerHeight, viewHeight);
      if (target === null) return; // reading inside a tall section — leave it alone
      const clamped = Math.max(0, Math.min(maxScroll, target));
      const distance = Math.abs(clamped - scrollY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestTarget = clamped;
      }
    }

    if (bestTarget === null || bestDistance < MIN_DISTANCE) return;
    window.scrollTo({ top: bestTarget, behavior: 'smooth' });
  };

  const scheduleSettle = () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, SETTLE_DELAY);
  };

  // While a finger or the mouse (e.g. dragging the scrollbar) is held down,
  // wait for release; only settle afterwards if the page actually moved.
  const press = () => { pointerDown = true; scrolledWhileDown = false; clearTimeout(settleTimer); };
  const release = () => {
    if (!pointerDown) return;
    pointerDown = false;
    if (scrolledWhileDown) scheduleSettle();
  };

  window.addEventListener('scroll', () => {
    if (pointerDown) scrolledWhileDown = true;
    else scheduleSettle();
  }, { passive: true });
  window.addEventListener('mousedown', press, { passive: true });
  window.addEventListener('mouseup', release, { passive: true });
  window.addEventListener('touchstart', press, { passive: true });
  window.addEventListener('touchend', release, { passive: true });
  window.addEventListener('touchcancel', release, { passive: true });
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
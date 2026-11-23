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
  initAboutTextFit();
  initSectionUrls(prefersReducedMotion);
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

/* ---------- Line text blocks up with the image beside them ----------
   When text sits next to an image (song cover, About photo), find the font
   size, within a readable range, at which the text block is exactly as tall
   as the image, so their tops and bottoms line up. Spacing inside the text
   uses em, so it scales with the size. Outside the given layout the CSS
   size is used. */
function fitTextToImage({ text, image, media, minPx, maxPx }) {
  if (!text || !image) return;
  const layout = window.matchMedia(media);

  const fit = () => {
    text.style.fontSize = '';
    if (!layout.matches) return;

    const target = image.offsetHeight;
    if (!target) return;

    // Measure the text at its natural height, even if the grid stretches it.
    const previousAlign = text.style.alignSelf;
    text.style.alignSelf = 'start';

    // Text height grows with font size, so binary-search the size.
    let lo = minPx;
    let hi = maxPx;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      text.style.fontSize = `${mid}px`;
      if (text.offsetHeight > target) hi = mid;
      else lo = mid;
    }
    text.style.fontSize = `${lo}px`;
    text.style.alignSelf = previousAlign;
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
  const img = image.tagName === 'IMG' ? image : image.querySelector('img');
  if (img && !img.complete) img.addEventListener('load', scheduleFit);
}

// Song pages: text beside the square cover (side-by-side from 1024px).
// Keep the breakpoint in sync with the song-page media query in styles.css.
function initSongTextFit() {
  fitTextToImage({
    text: document.querySelector('.song-body'),
    image: document.querySelector('.song-cover'),
    media: '(min-width: 1024px)',
    minPx: 13,
    maxPx: 19,
  });
}

// Homepage About: bio beside the photo (side-by-side from 861px).
function initAboutTextFit() {
  fitTextToImage({
    text: document.querySelector('.home-page .about-copy'),
    image: document.querySelector('.home-page .bio-photo-frame'),
    media: '(min-width: 861px)',
    minPx: 14,
    maxPx: 22,
  });
}

/* ---------- Clean section URLs (homepage) ----------
   The menu shows /about, /music, ... instead of #about. Clicking a section
   link glides there and updates the address bar without reloading; the
   address also follows along as visitors page through, and back/forward
   return to earlier sections. Opening /music directly is handled by the tiny
   music/index.html page, which hands the section over (sessionStorage) and
   returns to the homepage. Old #music links are converted too. */
function initSectionUrls(prefersReducedMotion) {
  if (!document.body.classList.contains('home-page') || !window.history.pushState) return;

  const SLUGS = ['about', 'music', 'videos', 'events', 'contact'];
  const isSlug = (slug) => SLUGS.includes(slug);
  const sectionFor = (slug) => document.getElementById(slug);

  // The homepage folder, e.g. "/" or "/soniquewebsite/", whatever the current URL.
  const slugAtEnd = new RegExp('(?:' + SLUGS.join('|') + ')/?$');
  const base = window.location.pathname
    .replace(/index\.html$/, '')
    .replace(slugAtEnd, '')
    .replace(/\/?$/, '/');
  const urlFor = (slug) => base + (isSlug(slug) ? slug : '');
  const slugFromPath = () => window.location.pathname.slice(base.length).replace(/\/$/, '');
  let currentSlug = null;

  const setUrl = (slug, push) => {
    currentSlug = slug;
    const url = urlFor(slug);
    if (url === window.location.pathname && !window.location.hash) return;
    try {
      window.history[push ? 'pushState' : 'replaceState']({ section: slug }, '', url);
    } catch (_) { /* some browsers rate-limit history updates */ }
  };

  const goTo = (slug, smooth) => {
    const section = sectionFor(slug);
    if (!section) return;
    const top = slug === 'home' ? 0 : section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: smooth && !prefersReducedMotion ? 'smooth' : 'instant' });
  };

  // Section links: <a href="music" data-section="music">
  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[data-section]');
    if (!link || event.defaultPrevented || event.button !== 0
      || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const slug = link.dataset.section;
    if (!sectionFor(slug)) return;
    event.preventDefault();
    goTo(slug, true);
    setUrl(slug, true);
  });

  window.addEventListener('popstate', () => {
    const slug = isSlug(slugFromPath()) ? slugFromPath() : 'home';
    currentSlug = slug;
    goTo(slug, true);
  });

  // Where to start: /music opened directly (handed over by music/index.html,
  // or a server that serves the homepage there), or an old #music link.
  let start = null;
  try {
    start = window.sessionStorage.getItem('sonique-section');
    window.sessionStorage.removeItem('sonique-section');
  } catch (_) { /* storage blocked */ }
  if (!isSlug(start)) start = slugFromPath();
  if (!isSlug(start)) start = window.location.hash.slice(1);
  if (isSlug(start)) {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    setUrl(start, false);
    goTo(start, false);
    // Images and fonts can shift the layout as they load; land again after.
    window.addEventListener('load', () => { if (currentSlug === start) goTo(start, false); }, { once: true });
  }

  // Follow along: once scrolling stops, the section across the middle of the
  // screen names the URL (the hero, above About, is the plain homepage URL).
  const sections = ['home', ...SLUGS].map(sectionFor).filter(Boolean);
  let followTimer = 0;
  const follow = () => {
    const middle = window.innerHeight / 2;
    const here = sections.find((s) => {
      const rect = s.getBoundingClientRect();
      return rect.top <= middle && rect.bottom > middle;
    });
    // Past the last section (the footer) still counts as Contact.
    const slug = here ? here.id : (window.scrollY > 0 ? SLUGS[SLUGS.length - 1] : 'home');
    if (slug !== currentSlug) setUrl(slug, false);
  };
  window.addEventListener('scroll', () => {
    clearTimeout(followTimer);
    followTimer = setTimeout(follow, 150);
  }, { passive: true });
}

/* ---------- Page-by-page section scrolling (homepage) ----------
   Each wheel notch / trackpad gesture / swipe / Page key moves exactly one
   section, with a smooth glide and a short pause on arrival so continuous
   scrolling steps through calmly instead of racing. Sections that fit on
   screen are centred below the fixed header. Sections taller than the screen
   (e.g. About, Contact + footer) scroll normally inside; the next scroll past
   their top or bottom edge steps to the neighbouring section. */
function initSectionSnap(prefersReducedMotion) {
  const contentMask = document.querySelector('.site-content-mask');
  if (!contentMask || prefersReducedMotion) return;

  const sections = Array.from(document.querySelectorAll('#main > section, .site-content-mask > section'));
  if (!sections.length) return;
  const nav = document.getElementById('main-nav');
  // The footer is framed together with the last section (Contact), so the
  // copyright line is shown there instead of being snapped away.
  const footer = document.querySelector('.site-footer');
  const lastSection = sections[sections.length - 1];

  const GLIDE_MIN = 480;      // ms — shortest page-to-page glide
  const GLIDE_MAX = 720;      // ms — longest
  const PAUSE = 150;          // ms — break after arriving before the next step
  const SWIPE_MIN = 40;       // px a finger must travel to change page
  const FIT_TOLERANCE = 1.15; // up to 15% taller than the screen still "fits"
  const SETTLE_DELAY = 160;   // ms of stillness before tidying a native scroll
  const MIN_MOVE = 10;        // px
  const MIN_DISTANCE = 4;     // px

  let animating = false;
  let pauseUntil = 0;
  let settledAt = window.scrollY;
  let jumpedByLink = false;
  let lastWheelTime = 0;
  let lastWheelSize = 0;

  const isLocked = () => animating || performance.now() < pauseUntil;
  const navOpen = () => nav && nav.classList.contains('open');

  /* ---- Geometry ---- */
  // Rest positions per section: short ones have a single centred stop;
  // tall ones a start (top edge) and end (bottom edge) with free reading between.
  const getStops = () => {
    const scrollY = window.scrollY;
    const viewHeight = window.innerHeight;
    // The homepage header is a transparent overlay (just the menu button),
    // so sections are framed against the full window.
    const headerHeight = 0;
    const visibleHeight = viewHeight - headerHeight;
    const maxScroll = document.documentElement.scrollHeight - viewHeight;
    const clamp = (y) => Math.max(0, Math.min(maxScroll, y));

    return sections.map((section) => {
      const rect = section.getBoundingClientRect();
      const endRect = section === lastSection && footer ? footer.getBoundingClientRect() : rect;
      const top = rect.top + scrollY;
      const bottom = endRect.bottom + scrollY;
      const height = bottom - top;

      // Sections only slightly taller than the screen (mostly padding) are
      // treated as fitting, so they don't need an extra scroll to get past.
      if (height <= visibleHeight * FIT_TOLERANCE) {
        const centre = clamp(top - headerHeight - (visibleHeight - height) / 2);
        return { start: centre, end: centre };
      }
      return { start: clamp(top - headerHeight), end: clamp(bottom - viewHeight) };
    });
  };
  const pointsOf = (stops) => stops.flatMap((s) => (s.start === s.end ? [s.start] : [s.start, s.end]));

  // How far the page may scroll natively in this direction before reaching
  // the edge of the tall section it's in (0 = not in a tall section / at edge).
  const roomInTallSection = (dir) => {
    const y = window.scrollY;
    for (const s of getStops()) {
      if (s.start === s.end || y < s.start - 1 || y > s.end + 1) continue;
      return dir > 0 ? Math.max(0, s.end - y) : Math.max(0, y - s.start);
    }
    return 0;
  };

  /* ---- Moving ---- */
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const glideTo = (target) => {
    const from = window.scrollY;
    const distance = target - from;
    settledAt = target;
    if (Math.abs(distance) < MIN_DISTANCE) return;

    const duration = Math.min(GLIDE_MAX, Math.max(GLIDE_MIN, 360 + Math.abs(distance) * 0.2));
    const startTime = performance.now();
    animating = true;

    const frame = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      window.scrollTo({ top: from + distance * easeInOutCubic(t), behavior: 'instant' });
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        animating = false;
        pauseUntil = performance.now() + PAUSE;
      }
    };
    requestAnimationFrame(frame);
  };

  // Move one section in the given direction (1 = down, -1 = up).
  const step = (dir) => {
    const y = window.scrollY;
    const ahead = pointsOf(getStops()).filter((p) => (dir > 0 ? p > y + 2 : p < y - 2));
    if (!ahead.length) return;
    const target = ahead.reduce((a, b) => (Math.abs(a - y) < Math.abs(b - y) ? a : b));
    glideTo(target);
  };

  // Either let the browser scroll (inside a tall section) or step a page.
  // Returns true when we handled it and the native scroll must be cancelled.
  const handleIntent = (dir, nativeDistance) => {
    const room = roomInTallSection(dir);
    if (room > 1) {
      if (nativeDistance <= room) return false; // keep reading normally
      // This scroll would overshoot the section edge: stop exactly on it.
      glideTo(window.scrollY + dir * room);
      return true;
    }
    step(dir);
    return true;
  };

  /* ---- Mouse wheel / trackpad ---- */
  window.addEventListener('wheel', (event) => {
    if (event.defaultPrevented || event.ctrlKey || navOpen()) return; // carousel scroll, pinch-zoom, menu
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;      // sideways trackpad gesture

    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    const size = Math.abs(event.deltaY * unit);
    const now = performance.now();
    const gap = now - lastWheelTime;
    const previousSize = lastWheelSize;
    lastWheelTime = now;
    lastWheelSize = size;
    if (size < 1) return;

    if (isLocked()) { event.preventDefault(); return; }

    // Trackpad momentum: a stream of shrinking deltas right after a step.
    // Ignore it so one flick = one page. (A mouse wheel repeats equal deltas,
    // so continuous wheel scrolling still advances after the pause.)
    if (gap < 120 && size < previousSize) { event.preventDefault(); return; }

    if (handleIntent(Math.sign(event.deltaY), size)) event.preventDefault();
  }, { passive: false });

  /* ---- Keyboard ---- */
  window.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || navOpen()) return;
    const el = event.target;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;

    const keys = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1, ' ': event.shiftKey ? -1 : 1 };
    const dir = keys[event.key];
    if (!dir) return;
    if (isLocked()) { event.preventDefault(); return; }

    const distance = event.key.startsWith('Arrow') ? 40 : window.innerHeight * 0.85;
    if (handleIntent(dir, distance)) event.preventDefault();
  });

  /* ---- Touch ---- */
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMode = null; // null (undecided) | 'native' | 'page' | 'ignore'
  let touchDir = 0;

  window.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1 || navOpen()) { touchMode = 'ignore'; return; }
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchMode = null;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    if (touchMode === 'ignore' || touchMode === 'native') return;
    if (touchMode === 'page') { event.preventDefault(); return; }

    const dx = event.touches[0].clientX - touchStartX;
    const dy = event.touches[0].clientY - touchStartY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;

    if (Math.abs(dx) > Math.abs(dy)) { touchMode = 'ignore'; return; } // carousel swipe
    touchDir = dy < 0 ? 1 : -1; // finger up = scroll down

    if (isLocked() || roomInTallSection(touchDir) <= 1) {
      touchMode = 'page';
      event.preventDefault();
    } else {
      touchMode = 'native'; // reading inside a tall section
    }
  }, { passive: false });

  window.addEventListener('touchend', (event) => {
    if (touchMode === 'page' && !isLocked()) {
      const dy = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dy) >= SWIPE_MIN) step(touchDir);
    }
    if (touchMode === 'native') scheduleSettle();
    touchMode = null;
  }, { passive: true });

  /* ---- Tidy up after native scrolling ----
     Scrollbar drags, Home/End, in-page links and native scrolling inside tall
     sections can leave the page between sections; once it's still, carry on
     to the next section in the direction travelled (or the nearest one after
     a link jump). */
  let settleTimer = null;
  let mouseDown = false;

  document.addEventListener('click', (event) => {
    if (event.target.closest && event.target.closest('a[href^="#"], a[data-section]')) jumpedByLink = true;
  });

  const settle = () => {
    if (animating || mouseDown || touchMode === 'native' || navOpen()) return;

    const y = window.scrollY;
    const stops = getStops();
    if (stops.some((s) => y > s.start + 1 && y < s.end - 1)) { settledAt = y; return; }

    const points = pointsOf(stops);
    const moved = y - settledAt;
    let target = null;
    if (Math.abs(moved) >= MIN_MOVE && !jumpedByLink) {
      const ahead = points.filter((p) => (moved > 0 ? p >= y - 1 : p <= y + 1));
      if (ahead.length) target = ahead.reduce((a, b) => (Math.abs(a - y) < Math.abs(b - y) ? a : b));
    }
    if (target === null) target = points.reduce((a, b) => (Math.abs(a - y) < Math.abs(b - y) ? a : b));

    jumpedByLink = false;
    glideTo(target);
  };

  function scheduleSettle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, SETTLE_DELAY);
  }

  window.addEventListener('scroll', () => { if (!animating) scheduleSettle(); }, { passive: true });
  window.addEventListener('mousedown', () => { mouseDown = true; }, { passive: true });
  window.addEventListener('mouseup', () => { mouseDown = false; scheduleSettle(); }, { passive: true });
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
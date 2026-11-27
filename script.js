document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initMobileMenu();
  initHeroScroll(reducedMotion);
  initScrollReveal(reducedMotion);
  initCarouselWheelScroll();
  initCarouselMouseDrag(reducedMotion);
  initCarouselArrows(reducedMotion);
  initVideoLoops(reducedMotion);
  initTextFit();
  initSectionUrls(reducedMotion);
  initSectionSnap(reducedMotion);
  initFooterYear();
  initEpkDownload();
  initHomeHeaderSignature();
});

const CAROUSELS = '.release-carousel, .video-carousel';

const isModifiedClick = (event) =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

const nearest = (points, y) => points.reduce((a, b) => (Math.abs(a - y) < Math.abs(b - y) ? a : b));

/* Fade the hero name out and up as the page scrolls. */
function initHeroScroll(reducedMotion) {
  const title = document.querySelector('.hero-scroll-title');
  if (!title || reducedMotion) return;

  document.body.classList.add('hero-scroll-enabled');
  let frameRequested = false;
  const update = () => {
    const progress = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)));
    title.style.transform = `translate3d(-50%, ${-progress * 92}vh, 0)`;
    title.style.opacity = String(Math.max(0, 1 - progress * 1.4));
    frameRequested = false;
  };
  const onScroll = () => {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.querySelectorAll('.nav-link').forEach((link) => link.addEventListener('click', () => setOpen(false)));
}

/* Let a vertical mouse wheel scroll carousels sideways. */
function initCarouselWheelScroll() {
  document.querySelectorAll(CAROUSELS).forEach((carousel) => {
    carousel.addEventListener('wheel', (event) => {
      const delta = event.deltaX || event.deltaY;
      if (delta === 0) return;

      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? carousel.clientWidth
          : 1;
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      const next = Math.max(0, Math.min(maxScroll, carousel.scrollLeft + delta * unit));
      if (next === carousel.scrollLeft) return;

      event.preventDefault();
      carousel.scrollLeft = next;
    }, { passive: false });
  });
}

/* Drag carousels with the mouse, without breaking clicks on their links. */
function initCarouselMouseDrag(reducedMotion) {
  const DRAG_THRESHOLD = 6;

  document.querySelectorAll(CAROUSELS).forEach((carousel) => {
    let pointerId = null;
    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;

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
      velocity = (event.clientX - lastX) / Math.max(1, now - lastTime);
      lastX = event.clientX;
      lastTime = now;
      carousel.scrollLeft = startScroll - dx;
    });

    const endDrag = (event) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      if (!dragging) return;
      dragging = false;

      carousel.classList.remove('is-dragging');
      if (carousel.hasPointerCapture(event.pointerId)) carousel.releasePointerCapture(event.pointerId);

      // Swallow the click that follows a drag so links don't open.
      const blockClick = (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      };
      carousel.addEventListener('click', blockClick, { capture: true, once: true });
      setTimeout(() => carousel.removeEventListener('click', blockClick, { capture: true }), 0);

      const glide = -velocity * 250;
      if (!reducedMotion && Math.abs(glide) > 20) carousel.scrollBy({ left: glide, behavior: 'smooth' });
    };

    carousel.addEventListener('pointerup', endDrag);
    carousel.addEventListener('pointercancel', endDrag);
  });
}

/* Prev/next arrows (small screens); each hides when there is nothing more that way. */
function initCarouselArrows(reducedMotion) {
  document.querySelectorAll('.carousel-frame').forEach((frame) => {
    const carousel = frame.querySelector(CAROUSELS);
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
      carousel.scrollBy({ left: direction * distance, behavior: reducedMotion ? 'auto' : 'smooth' });
    };

    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    carousel.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('load', update);
    update();
  });
}

/* Looping video previews: landscape clips on desktop, portrait clips on phones.
   Each clip loads when it first comes into view and only plays while visible.
   The breakpoint must match the phone carousel in styles.css. */
function initVideoLoops(reducedMotion) {
  const videos = Array.from(document.querySelectorAll('.video-loop'));
  if (!videos.length) return;

  const portrait = window.matchMedia('(max-width: 860px)');
  // Resolve paths now, before section URLs (/videos etc.) change the page address.
  const resolve = (path) => new URL(path, document.baseURI).href;
  const clips = new Map(videos.map((video) => [video, {
    landscape: resolve(video.dataset.landscape),
    portrait: resolve(video.dataset.portrait),
    poster: video.getAttribute('poster'),
    visible: false,
  }]));

  const play = (video) => {
    const promise = video.play();
    if (promise) promise.catch(() => { /* autoplay blocked (e.g. low power mode): the poster or first frame stays */ });
  };

  const load = (video) => {
    const clip = clips.get(video);
    const src = portrait.matches ? clip.portrait : clip.landscape;
    // YouTube thumbnails are landscape, so portrait cards wait for the clip itself.
    if (portrait.matches) video.removeAttribute('poster');
    else if (clip.poster) video.setAttribute('poster', clip.poster);

    video.muted = true;
    if (reducedMotion) {
      // Show a still frame instead of motion.
      video.preload = 'metadata';
      video.src = `${src}#t=0.1`;
      return;
    }
    video.preload = 'auto';
    video.src = src;
    if (clip.visible) play(video);
  };

  if (!('IntersectionObserver' in window)) {
    videos.forEach((video) => { clips.get(video).visible = true; load(video); });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target: video, isIntersecting }) => {
      const clip = clips.get(video);
      clip.visible = isIntersecting;
      if (!isIntersecting) { video.pause(); return; }
      if (!video.getAttribute('src')) load(video);
      else if (!reducedMotion) play(video);
    });
  }, { threshold: 0.25 });
  videos.forEach((video) => observer.observe(video));

  // Crossing the breakpoint (e.g. rotating a tablet) swaps loaded clips to the other shape.
  portrait.addEventListener('change', () => {
    videos.forEach((video) => { if (video.getAttribute('src')) load(video); });
  });
}

/* Size text so it is exactly as tall as the image beside it, within a readable range. */
function fitTextToImage({ text, image, media, minPx, maxPx }) {
  if (!text || !image) return;
  const layout = window.matchMedia(media);

  const fit = () => {
    text.style.fontSize = '';
    if (!layout.matches) return;

    const target = image.offsetHeight;
    if (!target) return;

    // Measure natural height even if the grid would stretch it.
    const previousAlign = text.style.alignSelf;
    text.style.alignSelf = 'start';

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
  if (document.fonts) document.fonts.ready.then(scheduleFit);
  const img = image.tagName === 'IMG' ? image : image.querySelector('img');
  if (img && !img.complete) img.addEventListener('load', scheduleFit);
}

// Media queries must match the side-by-side breakpoints in styles.css.
function initTextFit() {
  fitTextToImage({
    text: document.querySelector('.song-body'),
    image: document.querySelector('.song-cover'),
    media: '(min-width: 1024px)',
    minPx: 13,
    maxPx: 19,
  });
  fitTextToImage({
    text: document.querySelector('.home-page .about-copy'),
    image: document.querySelector('.home-page .bio-photo-frame'),
    media: '(min-width: 861px)',
    minPx: 14,
    maxPx: 22,
  });
}

/* Keep homepage section URLs (/about, /music, ...) and browser history in sync with scrolling. */
function initSectionUrls(reducedMotion) {
  if (!document.body.classList.contains('home-page')) return;

  const SLUGS = ['about', 'music', 'videos', 'events', 'contact'];
  const isSlug = (slug) => SLUGS.includes(slug);
  const sectionFor = (slug) => document.getElementById(slug);

  // Homepage folder, so this also works when the site is served from a subdirectory.
  const slugAtEnd = new RegExp(`(?:${SLUGS.join('|')})/?$`);
  const base = location.pathname
    .replace(/index\.html$/, '')
    .replace(slugAtEnd, '')
    .replace(/\/?$/, '/');
  const urlFor = (slug) => base + (isSlug(slug) ? slug : '');
  const slugFromPath = () => location.pathname.slice(base.length).replace(/\/$/, '');
  let currentSlug = null;

  const setUrl = (slug, push) => {
    currentSlug = slug;
    const url = urlFor(slug);
    if (url === location.pathname && !location.hash) return;
    try {
      history[push ? 'pushState' : 'replaceState']({ section: slug }, '', url);
    } catch (_) { /* some browsers rate-limit history updates */ }
  };

  const goTo = (slug, smooth) => {
    const section = sectionFor(slug);
    if (!section) return;
    const top = slug === 'home' ? 0 : section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: smooth && !reducedMotion ? 'smooth' : 'instant' });
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-section]');
    if (!link || event.defaultPrevented || isModifiedClick(event)) return;
    const slug = link.dataset.section;
    if (!sectionFor(slug)) return;
    event.preventDefault();
    setUrl(slug, true);
    // initSectionSnap handles the scroll itself if it's active.
    const navigation = new CustomEvent('sonique:section-navigation', { detail: { slug }, cancelable: true });
    window.dispatchEvent(navigation);
    if (!navigation.defaultPrevented) goTo(slug, true);
  });

  window.addEventListener('popstate', () => {
    const slug = isSlug(slugFromPath()) ? slugFromPath() : 'home';
    currentSlug = slug;
    goTo(slug, true);
  });

  // Deep links: /about etc. redirect here and leave the section in sessionStorage.
  let start = null;
  try {
    start = sessionStorage.getItem('sonique-section');
    sessionStorage.removeItem('sonique-section');
  } catch (_) { /* storage blocked */ }
  if (!isSlug(start)) start = slugFromPath();
  if (!isSlug(start)) start = location.hash.slice(1);
  if (isSlug(start)) {
    history.scrollRestoration = 'manual';
    setUrl(start, false);
    goTo(start, false);
    // Images and fonts can shift the layout as they load.
    window.addEventListener('load', () => { if (currentSlug === start) goTo(start, false); }, { once: true });
  }

  // Once scrolling stops, the section across the middle of the screen names the URL.
  const sections = ['home', ...SLUGS].map(sectionFor).filter(Boolean);
  let followTimer = 0;
  const follow = () => {
    const middle = window.innerHeight / 2;
    const here = sections.find((s) => {
      const rect = s.getBoundingClientRect();
      return rect.top <= middle && rect.bottom > middle;
    });
    // Below the last section (the footer) still counts as Contact.
    const slug = here ? here.id : (window.scrollY > 0 ? SLUGS[SLUGS.length - 1] : 'home');
    if (slug !== currentSlug) setUrl(slug, false);
  };
  window.addEventListener('scroll', () => {
    clearTimeout(followTimer);
    followTimer = setTimeout(follow, 150);
  }, { passive: true });
}

/* Homepage paging: wheel, keys and swipes move one section at a time.
   Sections taller than the screen (About on phones) scroll within their own
   edges first, so a hard swipe can't carry past them. */
function initSectionSnap(reducedMotion) {
  if (!document.querySelector('.site-content-mask')) return;

  const sections = Array.from(document.querySelectorAll('#main > section, .site-content-mask > section'));
  if (!sections.length) return;
  const nav = document.getElementById('main-nav');
  const footer = document.querySelector('.site-footer');
  const lastSection = sections[sections.length - 1];

  const GLIDE_MIN = 480;      // ms
  const GLIDE_MAX = 720;      // ms
  const PAUSE = 150;          // ms after arriving before the next step
  const SWIPE_MIN = 40;       // px
  const FIT_TOLERANCE = 1.15; // sections up to 15% taller than the screen still count as fitting
  const SETTLE_DELAY = 160;   // ms of stillness before tidying a native scroll
  const MIN_MOVE = 10;        // px
  const MIN_DISTANCE = 4;     // px
  const FLING = 300;          // ms of finger velocity carried on after a swipe inside a tall section

  let animating = false;
  let pauseUntil = 0;
  let settledAt = window.scrollY;
  let jumpedByLink = false;
  const GESTURE_GAP = 220;     // ms of wheel silence that ends a gesture
  const WHEEL_STEP_MIN = 30;   // px of wheel travel before a page turn
  const WHEEL_PUSH_MIN = 30;   // px: a new push mid-momentum must be at least this big...
  const WHEEL_PUSH_RATIO = 2;  // ...and this many times the previous event

  let lastWheelTime = 0;
  let lastWheelSize = 0;
  let wheelDir = 0;
  let wheelSpent = false; // this gesture has already turned a page
  let wheelTravel = 0;    // px of wheel input in this gesture so far

  const isLocked = () => animating || performance.now() < pauseUntil;
  const navOpen = () => nav && nav.classList.contains('open');

  // Rest positions: short sections have one centred stop; tall ones have a
  // start and end stop with free scrolling between. The footer belongs to the last section.
  const getStops = () => {
    const scrollY = window.scrollY;
    const viewHeight = window.innerHeight;
    const maxScroll = document.documentElement.scrollHeight - viewHeight;
    const clamp = (y) => Math.max(0, Math.min(maxScroll, y));

    return sections.map((section) => {
      const rect = section.getBoundingClientRect();
      const endRect = section === lastSection && footer ? footer.getBoundingClientRect() : rect;
      const top = rect.top + scrollY;
      const bottom = endRect.bottom + scrollY;
      const height = bottom - top;

      // Contact and the footer sit flush with the bottom of the screen, so the footer always shows.
      if (section === lastSection && height <= viewHeight * FIT_TOLERANCE) {
        const end = clamp(bottom - viewHeight);
        return { start: end, end };
      }
      if (height <= viewHeight * FIT_TOLERANCE) {
        const centre = clamp(top - (viewHeight - height) / 2);
        return { start: centre, end: centre };
      }
      return { start: clamp(top), end: clamp(bottom - viewHeight) };
    });
  };
  const pointsOf = (stops) => stops.flatMap((s) => (s.start === s.end ? [s.start] : [s.start, s.end]));

  // The tall section the page is currently inside, if any.
  const tallSectionHere = () => {
    const y = window.scrollY;
    return getStops().find((s) => s.start !== s.end && y >= s.start - 1 && y <= s.end + 1) || null;
  };

  // Distance left to scroll inside the current tall section (0 if not in one).
  const roomInTallSection = (dir) => {
    const s = tallSectionHere();
    if (!s) return 0;
    const y = window.scrollY;
    return dir > 0 ? Math.max(0, s.end - y) : Math.max(0, y - s.start);
  };

  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  let glideId = 0;
  let glideCancelable = false;

  const glideTo = (target, { duration, ease = easeInOutCubic, pause = PAUSE, cancelable = false } = {}) => {
    const from = window.scrollY;
    const distance = target - from;
    settledAt = target;
    if (Math.abs(distance) < MIN_DISTANCE) return;

    if (reducedMotion) {
      window.scrollTo({ top: target, behavior: 'instant' });
      pauseUntil = performance.now() + pause;
      return;
    }

    const time = duration ?? Math.min(GLIDE_MAX, Math.max(GLIDE_MIN, 360 + Math.abs(distance) * 0.2));
    const startTime = performance.now();
    const id = ++glideId;
    glideCancelable = cancelable;
    animating = true;

    const frame = (now) => {
      if (id !== glideId) return;
      const t = Math.min(1, (now - startTime) / time);
      window.scrollTo({ top: from + distance * ease(t), behavior: 'instant' });
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        animating = false;
        pauseUntil = performance.now() + pause;
      }
    };
    requestAnimationFrame(frame);
  };

  const cancelGlide = () => {
    glideId++;
    animating = false;
    settledAt = window.scrollY;
  };

  window.addEventListener('sonique:section-navigation', (event) => {
    const index = sections.findIndex((section) => section.id === event.detail.slug);
    if (index < 0) return;
    event.preventDefault();
    glideTo(getStops()[index].start);
  });

  const step = (dir, options) => {
    const y = window.scrollY;
    const ahead = pointsOf(getStops()).filter((p) => (dir > 0 ? p > y + 2 : p < y - 2));
    if (ahead.length) glideTo(nearest(ahead, y), options);
  };

  // Scroll natively inside a tall section, otherwise step a page.
  // Returns true when the native scroll must be cancelled.
  const handleIntent = (dir, nativeDistance) => {
    const room = roomInTallSection(dir);
    if (room > 1) {
      if (nativeDistance <= room) return false;
      glideTo(window.scrollY + dir * room); // would overshoot: stop on the edge
      return true;
    }
    step(dir);
    return true;
  };

  window.addEventListener('wheel', (event) => {
    if (event.defaultPrevented || event.ctrlKey || navOpen()) return; // carousel, pinch-zoom, menu
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    const size = Math.abs(event.deltaY * unit);
    const now = performance.now();
    const gap = now - lastWheelTime;
    const previousSize = lastWheelSize;
    lastWheelTime = now;
    lastWheelSize = size;
    if (size < 1) return;

    // One wheel gesture (a trackpad flick and its momentum, or a burst of wheel
    // notches) turns at most one page. A pause, a change of direction, or a
    // clearly harder push mid-momentum starts a new gesture.
    const dir = Math.sign(event.deltaY);
    const freshPush = size >= WHEEL_PUSH_MIN && size > previousSize * WHEEL_PUSH_RATIO;
    if (gap > GESTURE_GAP || dir !== wheelDir || freshPush) {
      wheelSpent = false;
      wheelTravel = 0;
    }
    wheelDir = dir;

    if (isLocked() || wheelSpent) { event.preventDefault(); return; }

    const room = roomInTallSection(dir);
    if (room > 1 && size <= room) return; // scroll natively inside a tall section

    // A light brush of the trackpad shouldn't turn the page.
    wheelTravel += size;
    if (room <= 1 && wheelTravel < WHEEL_STEP_MIN) { event.preventDefault(); return; }

    if (handleIntent(dir, size)) {
      event.preventDefault();
      wheelSpent = true;
    }
  }, { passive: false });

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

  // Swipes inside a tall section move the page with the finger (clamped to the
  // section's edges, with a short fling on release); anywhere else a swipe steps a page.
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMode = null; // null (undecided) | 'drag' | 'page' | 'ignore'
  let touchDir = 0;
  let fingerDown = false;
  let stepped = false; // this swipe has already moved a page
  let drag = null; // { bounds, startY, startScroll }

  // Swipe steps start fast and ease into place, so the page responds straight away.
  const swipeStep = () => {
    if (stepped || isLocked()) return;
    stepped = true;
    step(touchDir, { ease: easeOutCubic });
  };
  let lastTouchY = 0;
  let lastTouchTime = 0;
  let velocity = 0; // px per ms, in the finger's direction

  window.addEventListener('touchstart', (event) => {
    fingerDown = true;
    stepped = false;
    if (animating && glideCancelable) cancelGlide(); // catch a fling in progress
    if (event.touches.length !== 1 || navOpen()) { touchMode = 'ignore'; return; }
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchMode = null;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    if (touchMode === 'ignore') return;
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    const now = performance.now();

    // Move as soon as the swipe is clearly a page change, without waiting for release.
    if (touchMode === 'page') {
      event.preventDefault();
      if (Math.abs(y - touchStartY) >= SWIPE_MIN) swipeStep();
      return;
    }

    if (touchMode === 'drag') {
      event.preventDefault();
      velocity = (y - lastTouchY) / Math.max(1, now - lastTouchTime);
      lastTouchY = y;
      lastTouchTime = now;
      const top = drag.startScroll - (y - drag.startY);
      window.scrollTo({ top: Math.max(drag.bounds.start, Math.min(drag.bounds.end, top)), behavior: 'instant' });
      return;
    }

    const dx = x - touchStartX;
    const dy = y - touchStartY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;

    if (Math.abs(dx) > Math.abs(dy)) { touchMode = 'ignore'; return; } // carousel swipe
    touchDir = dy < 0 ? 1 : -1; // finger up = scroll down
    event.preventDefault();

    if (!isLocked() && roomInTallSection(touchDir) > 1) {
      touchMode = 'drag';
      drag = { bounds: tallSectionHere(), startY: y, startScroll: window.scrollY };
      lastTouchY = y;
      lastTouchTime = now;
      velocity = 0;
    } else {
      touchMode = 'page';
    }
  }, { passive: false });

  const endTouch = (event) => {
    fingerDown = event.touches.length > 0;
    if (touchMode === 'page') {
      // A quick flick can end before a touchmove passes the threshold.
      const dy = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dy) >= SWIPE_MIN) swipeStep();
    } else if (touchMode === 'drag') {
      const stillFor = performance.now() - lastTouchTime;
      const fling = stillFor > 100 ? 0 : -velocity * FLING;
      const target = Math.max(drag.bounds.start, Math.min(drag.bounds.end, window.scrollY + fling));
      if (!reducedMotion && Math.abs(target - window.scrollY) > 20) {
        glideTo(target, { duration: 600, ease: easeOutCubic, pause: 0, cancelable: true });
      } else {
        settledAt = window.scrollY;
      }
      drag = null;
    }
    touchMode = null;
  };
  window.addEventListener('touchend', endTouch, { passive: true });
  window.addEventListener('touchcancel', endTouch, { passive: true });

  // After native scrolling (scrollbar drag, Home/End, in-page links) leaves the
  // page between stops, carry on in the direction travelled, or to the nearest
  // stop after a link jump.
  let settleTimer = null;
  let mouseDown = false;

  document.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#"]')) jumpedByLink = true;
  });

  const settle = () => {
    if (animating || mouseDown || fingerDown || navOpen()) return;

    const y = window.scrollY;
    const stops = getStops();
    if (stops.some((s) => y > s.start + 1 && y < s.end - 1)) { settledAt = y; return; }

    const points = pointsOf(stops);
    const moved = y - settledAt;
    let target = null;
    if (Math.abs(moved) >= MIN_MOVE && !jumpedByLink) {
      const ahead = points.filter((p) => (moved > 0 ? p >= y - 1 : p <= y + 1));
      if (ahead.length) target = nearest(ahead, y);
    }
    if (target === null) target = nearest(points, y);

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

function initScrollReveal(reducedMotion) {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px 20% 0px' }); // start just before it scrolls into view

  revealEls.forEach((el) => observer.observe(el));
}

function initFooterYear() {
  const year = new Date().getFullYear();
  document.querySelectorAll('.js-year').forEach((el) => { el.textContent = year; });
}

/* Download the EPK as well as opening it in a new tab. */
function initEpkDownload() {
  const link = document.querySelector('.epk-button');
  if (!link) return;

  link.addEventListener('click', (event) => {
    if (isModifiedClick(event)) return;
    const download = document.createElement('a');
    download.href = link.href;
    download.download = link.pathname.split('/').pop();
    document.body.appendChild(download);
    download.click();
    download.remove();
  });
}

/* Show the header signature once the hero has scrolled away. */
function initHomeHeaderSignature() {
  const signature = document.querySelector('.home-header-signature');
  const about = document.getElementById('about');
  if (!signature || !about) return;

  const update = () => signature.classList.toggle('is-visible', about.getBoundingClientRect().top <= 0);
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

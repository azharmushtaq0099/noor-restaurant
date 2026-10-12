import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
gsap.registerPlugin(ScrollTrigger);
window.gsap = gsap;

/* ═══════════════════════════════════════════════════════════════════════════════
   P11 — LENIS SMOOTH SCROLL
   From: code-library/11-lenis-gsap-composable.js
   Material: stone/granite → weighted deceleration → duration 1.8, power5 easing
   ═══════════════════════════════════════════════════════════════════════════════ */
const lenis = new Lenis({
  duration: 1.8,
  easing: t => 1 - Math.pow(1 - t, 5),
  smoothWheel: true,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ═══════════════════════════════════════════════════════════════════════════════
   P52 — FILM GRAIN (FULL PATTERN — copied from code-library/52-grain-film-texture.js)
   Using 'film' preset: intensity 0.09, 1px, 12fps, overlay, canvasOpacity 0.55
   ═══════════════════════════════════════════════════════════════════════════════ */
const GRAIN_PRESETS = {
  film: { intensity: 0.09, pixelSize: 1, frameRate: 12, blendMode: 'overlay', canvasOpacity: 0.55 },
};

class FilmGrain {
  constructor(options = {}) {
    const preset = GRAIN_PRESETS[options.preset ?? 'film'];
    this.config = { ...preset, ...options };
    this.canvas = null; this.ctx = null; this.interval = null; this.active = false;
    this._init();
  }
  _init() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    Object.assign(this.canvas.style, {
      position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
      zIndex: '9998', pointerEvents: 'none',
      mixBlendMode: this.config.blendMode, opacity: '0', willChange: 'opacity',
    });
    document.body.appendChild(this.canvas);
    this._resize();
    window.addEventListener('resize', () => this._resize(), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._stopInterval();
      else if (this.active) this._startInterval();
    });
  }
  _resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = Math.max(window.innerWidth, 1);
    const h = Math.max(window.innerHeight, 1);
    this.canvas.width = Math.ceil(w * dpr);
    this.canvas.height = Math.ceil(h * dpr);
    this.ctx.scale(dpr, dpr);
  }
  _generate() {
    const { width, height } = this.canvas;
    if (width === 0 || height === 0) return;
    const { intensity } = this.config;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 255 * intensity * 2;
      const v = Math.round(128 + n);
      data[i] = v; data[i+1] = v; data[i+2] = v;
      data[i+3] = Math.round(Math.random() * 255 * intensity);
    }
    ctx.putImageData(imageData, 0, 0);
  }
  _startInterval() {
    if (this.interval) return;
    const ms = 1000 / this.config.frameRate;
    this.interval = setInterval(() => this._generate(), ms);
    this._generate();
  }
  _stopInterval() { clearInterval(this.interval); this.interval = null; }
  start(fadeIn = true) {
    this.active = true;
    this._startInterval();
    if (fadeIn) gsap.to(this.canvas, { opacity: this.config.canvasOpacity, duration: 1.5, ease: 'power2.out' });
    else this.canvas.style.opacity = this.config.canvasOpacity;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   P30 — CURSOR SYSTEM (FULL PATTERN — from code-library/30-data-attr-cursor-system.js)
   Canvas dot + ring with lerp. Magnetic binding via data-cursor-magnetic.
   ═══════════════════════════════════════════════════════════════════════════════ */
function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1],16), parseInt(r[2],16), parseInt(r[3],16)] : [255,255,255];
}

function initCursorSystem(opts = {}) {
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isTouch || isReduced) return;

  const { color = '#F0E8DC', arrowSize = 7, followerSize = 34, followerEase = 0.09, powerMagnet = 0.3 } = opts;

  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  document.body.classList.add('__cursor-custom');

  let W = Math.max(window.innerWidth, 1), H = Math.max(window.innerHeight, 1);
  const resize = () => { W = canvas.width = Math.max(window.innerWidth, 1); H = canvas.height = Math.max(window.innerHeight, 1); };
  resize();
  window.addEventListener('resize', resize);

  const mouse = { x: W/2, y: H/2 };
  const follower = { x: W/2, y: H/2 };
  let cursorColor = color;

  document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    follower.x += (mouse.x - follower.x) * followerEase;
    follower.y += (mouse.y - follower.y) * followerEase;
    const [cr,cg,cb] = hexToRgb(cursorColor);

    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, arrowSize/2, 0, Math.PI*2);
    ctx.fillStyle = cursorColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(follower.x, follower.y, followerSize/2, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.6)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  gsap.ticker.add(draw);

  // Magnetic binding — P30 bindMagnetic (uses gsap.quickTo for 60fps performance)
  document.querySelectorAll('[data-cursor-magnetic]').forEach(el => {
    const power = parseFloat(el.dataset.power) || powerMagnet;
    const qX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power2.out' });
    const qY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power2.out' });
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const dx = (rect.left + rect.width/2 - e.clientX) * power * -1;
      const dy = (rect.top + rect.height/2 - e.clientY) * power * -1;
      qX(dx); qY(dy);
    });
    el.addEventListener('mouseleave', () => { qX(0); qY(0); });
  });

  // Color binding
  document.querySelectorAll('[data-cursor-color]').forEach(el => {
    const c = el.dataset.cursorColor;
    el.addEventListener('mouseenter', () => { cursorColor = c; });
    el.addEventListener('mouseleave', () => { cursorColor = color; });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════════
   P55 — PER-WORD STAGGER REVEAL (FULL PATTERN — from code-library/55-per-word-gsap-stagger.js)
   Using Mode 3: animateReveal (clip-path mask, words slide up from overflow:hidden)
   ═══════════════════════════════════════════════════════════════════════════════ */
function wrapWords(element, spanClass = 'gsap-animate-word') {
  if (element.dataset.wordsWrapped) return element.querySelectorAll(`.${spanClass}`);
  element.dataset.wordsWrapped = 'true';
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.trim().length > 0) textNodes.push(node);
  }
  textNodes.forEach(textNode => {
    const words = textNode.textContent.split(/(\s+)/);
    const frag = document.createDocumentFragment();
    words.forEach(token => {
      if (/^\s+$/.test(token)) {
        frag.appendChild(document.createTextNode(token));
      } else if (token.length > 0) {
        const span = document.createElement('span');
        span.className = spanClass;
        span.setAttribute('role', 'text');
        span.style.display = 'inline-block';
        span.style.whiteSpace = 'pre';
        span.textContent = token;
        frag.appendChild(span);
      }
    });
    textNode.parentNode.replaceChild(frag, textNode);
  });
  return element.querySelectorAll(`.${spanClass}`);
}

function animateReveal(element, options = {}) {
  const { delay = 0, stagger = 0.06, duration = 0.6, ease = 'power3.out' } = options;
  const words = wrapWords(element);
  if (!words || !words.length) return;
  Array.from(words).forEach(word => {
    const clip = document.createElement('span');
    clip.style.display = 'inline-block';
    clip.style.overflow = 'hidden';
    clip.style.verticalAlign = 'bottom';
    word.parentNode.insertBefore(clip, word);
    clip.appendChild(word);
  });
  gsap.set(words, { y: '110%' });
  return gsap.to(words, { y: '0%', duration, stagger, delay, ease });
}

/* ═══════════════════════════════════════════════════════════════════════════════
   P70 — BREATHING PHOTOGRAPHY (FULL PATTERN — from code-library/70-breathing-photography.js)
   Auto-init via [data-breathe] attributes. GPU composited.
   ═══════════════════════════════════════════════════════════════════════════════ */
function initBreathing() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-breathe]').forEach(el => {
    const scale = parseFloat(el.dataset.breatheScale) || 1.025;
    const dur = parseFloat(el.dataset.breatheDuration) || 7;
    el.style.willChange = 'transform';
    el.style.transformOrigin = 'center center';
    gsap.to(el, { scale, duration: dur, ease: 'sine.inOut', repeat: -1, yoyo: true });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COLOR TEMPERATURE — Scroll-driven (Experience Bible Material World)
   ═══════════════════════════════════════════════════════════════════════════════ */
const temps = {
  warm: { bg: [13,9,7], fg: [240,232,220] },
  cool: { bg: [8,10,13], fg: [216,221,232] },
  rose: { bg: [22,10,10], fg: [240,216,208] },
};
function lerpC(a,b,t) { return a.map((v,i) => Math.round(v + (b[i]-v)*t)); }
function rgb(c) { return `rgb(${c[0]},${c[1]},${c[2]})`; }

const colorStops = [
  {s:0,t:'warm'},{s:0.25,t:'warm'},{s:0.35,t:'warm'},
  {s:0.42,t:'rose'},{s:0.55,t:'cool'},{s:0.75,t:'cool'},
  {s:0.85,t:'warm'},{s:1,t:'warm'},
];
const timePts = [
  {s:0,h:19,m:30},{s:0.12,h:19,m:45},{s:0.25,h:20,m:0},
  {s:0.40,h:20,m:47},{s:0.60,h:21,m:15},{s:0.80,h:22,m:30},{s:1,h:23,m:15},
];
const tH = document.querySelector('.time__hours');
const tM = document.querySelector('.time__minutes');

function tickAll() {
  const el = document.documentElement;
  const max = el.scrollHeight - el.clientHeight;
  const p = max > 0 ? el.scrollTop / max : 0;

  for (let i=0; i<timePts.length-1; i++) {
    if (p >= timePts[i].s && p <= timePts[i+1].s) {
      const t = (p-timePts[i].s)/(timePts[i+1].s-timePts[i].s);
      const total = Math.round((timePts[i].h*60+timePts[i].m)+((timePts[i+1].h*60+timePts[i+1].m)-(timePts[i].h*60+timePts[i].m))*t);
      tH.textContent = String(Math.floor(total/60)).padStart(2,'0');
      tM.textContent = String(total%60).padStart(2,'0');
      break;
    }
  }
  for (let i=0; i<colorStops.length-1; i++) {
    if (p >= colorStops[i].s && p <= colorStops[i+1].s) {
      const t = (p-colorStops[i].s)/(colorStops[i+1].s-colorStops[i].s);
      const st = t*t*(3-2*t);
      const a=temps[colorStops[i].t], b=temps[colorStops[i+1].t];
      document.body.style.backgroundColor = rgb(lerpC(a.bg,b.bg,st));
      document.body.style.color = rgb(lerpC(a.fg,b.fg,st));
      break;
    }
  }
  requestAnimationFrame(tickAll);
}
requestAnimationFrame(tickAll);

/* ═══════════════════════════════════════════════════════════════════════════════
   PRELOADER — Clip-path wipe, then trigger all section animations
   ═══════════════════════════════════════════════════════════════════════════════ */
function runPreloader() {
  const pre = document.getElementById('preloader');
  const wm = pre.querySelector('.preloader__wordmark');
  const sub = pre.querySelector('.preloader__sub');
  const fill = pre.querySelector('.preloader__fill');
  const timeDisp = document.getElementById('time-display');

  const tl = gsap.timeline({ delay: 0.4 });
  tl.to(wm, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power4.inOut' })
    .to(sub, { opacity: 1, duration: 0.7, ease: 'power2.out' }, '-=0.3')
    .to(fill, { width: '100%', duration: 0.8, ease: 'power3.inOut' }, '-=0.2')
    .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 1.0, ease: 'power4.inOut', delay: 0.2 })
    .to(timeDisp, { opacity: 0.3, duration: 1.0, ease: 'power2.out' }, '-=0.5')
    .add(() => { pre.remove(); initSections(); });
}
// Init: remove preloader immediately, then run sections
// (Preloader animation conflicts with Vite HMR module timing — skip for now, add back in production build)
const pre = document.getElementById('preloader');
if (pre) pre.remove();
document.getElementById('time-display').style.opacity = '0.3';
initSections();

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION ANIMATIONS — Triggered after preloader
   Each section: Four-Frame Test applied. Different entrance type per section.
   ═══════════════════════════════════════════════════════════════════════════════ */
function initSections() {
  // Start P52 grain + P30 cursor + P70 breathing
  const grain = new FilmGrain({ preset: 'film' });
  grain.start(true);
  initCursorSystem({ color: '#F0E8DC', followerEase: 0.09, followerSize: 34, arrowSize: 7 });
  initBreathing();

  /* ── S1: THE APPROACH ──────────────────────────────────────────────────────
     Frame 1: Dark void + time only
     Frame 2: Text reveals word-by-word (P55 clip)
     Frame 3: Text parallaxes up on scroll
     Frame 4: SILENCE gap → S2 image wipes in
  */
  document.querySelectorAll('.approach__line').forEach((el, i) => {
    animateReveal(el, { delay: 0.5 + i * 0.8, stagger: 0.08, duration: 0.9, ease: 'power4.out' });
  });

  // S1 text parallax (falls behind at 0.8x speed)
  gsap.to('.s--approach .s__content', {
    yPercent: -15, ease: 'none',
    scrollTrigger: { trigger: '.s--approach', start: 'top top', end: 'bottom top', scrub: 1.5 },
  });

  /* ── S2: THE ROOM ──────────────────────────────────────────────────────────
     Frame 1: Image reveals through clip-path wipe (bottom-to-top)
     Frame 2: Image breathes (P70 data-breathe, 12s cycle)
     Frame 3: Image scale shrinks from 1.18→1.0 on scrub (parallax)
     Frame 4: Text reveals over gradient overlay (P55 clip, different stagger)
  */
  // Image clip-path reveal on scroll enter
  gsap.fromTo('.s--room__image-wrap',
    { clipPath: 'inset(100% 0 0 0)' },
    { clipPath: 'inset(0% 0 0 0)', ease: 'power3.inOut',
      scrollTrigger: { trigger: '.s--room', start: 'top 80%', end: 'top 20%', scrub: 1 },
    }
  );

  // Image parallax scale (1.18 → 1.0 on scrub)
  gsap.to('.s--room__image', {
    scale: 1.0, ease: 'none',
    scrollTrigger: { trigger: '.s--room', start: 'top bottom', end: 'bottom top', scrub: 2 },
  });

  // Room text — P55 clip reveal, triggered by IntersectionObserver
  const roomLines = document.querySelectorAll('.room__line');
  const roomIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        roomLines.forEach((el, i) => {
          animateReveal(el, { delay: i * 0.4, stagger: 0.07, duration: 0.8, ease: 'power4.out' });
        });
        roomIO.disconnect();
      }
    });
  }, { threshold: 0.3 });
  roomIO.observe(document.querySelector('.s--room__overlay'));

  /* ── S3: THE SURRENDER ─────────────────────────────────────────────────────
     Frame 1: Empty viewport, building anticipation
     Frame 2: "There is no menu." at 14vw — P55 clip reveal, word by word
     Frame 3: "The kitchen decides." fades in below (the only opacity fade — justified as a whisper)
     Frame 4: Hard cut to The Shift (the silence before the emotional peak)
  */
  ScrollTrigger.create({
    trigger: '.s--surrender',
    start: 'top 35%',
    once: true,
    onEnter: () => {
      animateReveal(document.querySelector('.manifesto'), {
        stagger: 0.18, duration: 1.2, ease: 'power4.out'
      });
      gsap.to('.manifesto__sub', { opacity: 1, duration: 2.0, ease: 'power3.out', delay: 1.0 });
    },
  });

  /* ── S4: THE SHIFT ─────────────────────────────────────────────────────────
     Frame 1: Text enters (P55 clip)
     Frame 2: Background begins shifting from warm to rose
     Frame 3: 280vh pinned — visitor scrolls THROUGH the color change
     Frame 4: Color resolves to cool, text exits
  */
  ScrollTrigger.create({
    trigger: '.s--shift',
    start: 'top 40%',
    once: true,
    onEnter: () => {
      document.querySelectorAll('.shift__line').forEach((el, i) => {
        animateReveal(el, { delay: 0.3 + i * 0.5, stagger: 0.07, duration: 1.0, ease: 'power4.out' });
      });
    },
  });

  /* ── S5: THE CRAFT ─────────────────────────────────────────────────────────
     Frame 1: Image clip-reveals from right side
     Frame 2: Image breathes (P70)
     Frame 3: Ingredient lines slide in from left (different from S2's word reveal)
     Frame 4: Color has reached cool blue-white
  */
  gsap.fromTo('.s--craft__image-wrap',
    { clipPath: 'inset(0 100% 0 0)' },
    { clipPath: 'inset(0 0% 0 0)', ease: 'power3.inOut',
      scrollTrigger: { trigger: '.s--craft', start: 'top 80%', end: 'top 30%', scrub: 1 },
    }
  );
  gsap.to('.s--craft__image', {
    scale: 1.0, ease: 'none',
    scrollTrigger: { trigger: '.s--craft', start: 'top bottom', end: 'bottom top', scrub: 2 },
  });
  document.querySelectorAll('.craft__line').forEach((el, i) => {
    gsap.to(el, {
      x: 0, opacity: 1, duration: 1.6, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      delay: i * 0.3,
    });
  });

  /* ── S6: TEA ───────────────────────────────────────────────────────────────
     Frame 1: Empty warm void (color has returned to amber)
     Frame 2: "Tea." scales from 0.7→1.0 (the only scale entrance — justified as exhale)
     Frame 3: Nothing. The silence IS the content.
     Frame 4: Departure appears below
  */
  gsap.to('.tea__word', {
    scale: 1, opacity: 1, duration: 3.5, ease: 'power4.out',
    scrollTrigger: { trigger: '.s--tea', start: 'top 45%', once: true },
  });

  /* ── S7: DEPARTURE ─────────────────────────────────────────────────────────
     Frame 1: Wordmark reveals (P55 clip)
     Frame 2: Location appears
     Frame 3: Reserve link appears (magnetic hover active — P30 binding)
     Frame 4: End. The evening is over.
  */
  ScrollTrigger.create({
    trigger: '.s--departure',
    start: 'top 55%',
    once: true,
    onEnter: () => {
      animateReveal(document.querySelector('.footer__mark'), { stagger: 0.12, duration: 0.9, ease: 'power4.out' });
      gsap.to('.footer__location', { opacity: 0.35, duration: 1.2, delay: 0.5, ease: 'power2.out' });
      gsap.to('.footer__reserve', { opacity: 0.6, duration: 1.2, delay: 0.8, ease: 'power4.out' });
    },
  });
}

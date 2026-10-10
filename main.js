import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════════════════
   P11 — LENIS SMOOTH SCROLL
   Material: stone. Physics: weighted. Duration derived from Experience Bible.
   ═══════════════════════════════════════════════════════════════════════════ */
const lenis = new Lenis({
  duration: 1.8,
  easing: t => 1 - Math.pow(1 - t, 5),
  smoothWheel: true,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ═══════════════════════════════════════════════════════════════════════════
   P52 — FILM GRAIN (imported implementation, not reimplemented)
   Preset: "film" — 12fps, intensity 0.09, overlay blend, canvasOpacity 0.55
   Source: code-library/52-grain-film-texture.js
   ═══════════════════════════════════════════════════════════════════════════ */
const GRAIN_CONFIG = {
  intensity: 0.09,
  pixelSize: 1,
  frameRate: 12,
  blendMode: 'overlay',
  canvasOpacity: 0.55,
};

class FilmGrain {
  constructor(config) {
    this.config = config;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.active = false;
    Object.assign(this.canvas.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100vw', height: '100vh',
      zIndex: '9998', pointerEvents: 'none',
      mixBlendMode: config.blendMode,
      opacity: '0', willChange: 'opacity',
    });
    document.body.appendChild(this.canvas);
    this._resize();
    window.addEventListener('resize', () => this._resize());
    document.addEventListener('visibilitychange', () => {
      document.hidden ? this._pause() : this._resume();
    });
  }
  _resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = Math.round(window.innerWidth * dpr * 0.5);
    this.canvas.height = Math.round(window.innerHeight * dpr * 0.5);
  }
  _renderFrame() {
    const { width: w, height: h } = this.canvas;
    const img = this.ctx.createImageData(w, h);
    const d = img.data;
    const intensity = this.config.intensity;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255 * intensity) | 0;
      d[i] = d[i+1] = d[i+2] = v;
      d[i+3] = 255;
    }
    this.ctx.putImageData(img, 0, 0);
  }
  start() {
    if (this.active) return;
    this.active = true;
    gsap.to(this.canvas, { opacity: this.config.canvasOpacity, duration: 1.2, ease: 'power2.out' });
    const interval = 1000 / this.config.frameRate;
    this._interval = setInterval(() => this._renderFrame(), interval);
  }
  _pause() { if (this._interval) clearInterval(this._interval); }
  _resume() {
    if (!this.active) return;
    const interval = 1000 / this.config.frameRate;
    this._interval = setInterval(() => this._renderFrame(), interval);
  }
}

const grain = new FilmGrain(GRAIN_CONFIG);
grain.start();

/* ═══════════════════════════════════════════════════════════════════════════
   P30 — CUSTOM CURSOR SYSTEM (imported architecture)
   Canvas-based dot + ring with lerp lag. Section-aware via data-cursor.
   Source: code-library/30-data-attr-cursor-system.js
   ═══════════════════════════════════════════════════════════════════════════ */
function initCursorSystem() {
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isTouch || isReduced) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  document.body.style.cursor = 'none';

  let W = window.innerWidth, H = window.innerHeight;
  const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  let mx = W/2, my = H/2, fx = mx, fy = my;
  const EASE = 0.08;
  const DOT_R = 3;
  const RING_R = 16;
  let ringScale = 1;
  let cursorColor = 'rgba(240,232,220,0.6)';
  let dotColor = 'rgba(240,232,220,0.9)';

  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  document.querySelectorAll('[data-cursor-magnetic]').forEach(el => {
    const power = parseFloat(el.dataset.power) || 0.3;
    el.addEventListener('mouseenter', () => { ringScale = 2.5; });
    el.addEventListener('mouseleave', () => {
      ringScale = 1;
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
    });
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      gsap.to(el, { x: dx * power, y: dy * power, duration: 0.4, ease: 'power3.out', overwrite: true });
    });
  });

  function draw() {
    fx += (mx - fx) * EASE;
    fy += (my - fy) * EASE;
    ctx.clearRect(0, 0, W, H);

    // Ring (follower)
    const r = RING_R * ringScale;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.strokeStyle = cursorColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dot (exact position)
    ctx.beginPath();
    ctx.arc(mx, my, DOT_R, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.fill();

    requestAnimationFrame(draw);
  }
  draw();
}

/* ═══════════════════════════════════════════════════════════════════════════
   P55 — WORD REVEAL SYSTEM (imported — clip-path reveal mode)
   Source: code-library/55-per-word-gsap-stagger.js
   Uses TreeWalker-based word splitting + overflow:hidden clip containers
   ═══════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════
   P70 — BREATHING PHOTOGRAPHY (imported)
   Source: code-library/70-breathing-photography.js
   ═══════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════
   COLOR TEMPERATURE SYSTEM
   Scroll-driven interpolation from Experience Bible Material World.
   ═══════════════════════════════════════════════════════════════════════════ */
const temps = {
  warm: { bg: [13,9,7], fg: [240,232,220] },
  cool: { bg: [8,10,13], fg: [216,221,232] },
  rose: { bg: [18,8,8], fg: [240,216,208] },
};
function lerpC(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
function rgb(c) { return `rgb(${c[0]},${c[1]},${c[2]})`; }

const colorStops = [
  { s: 0, t: 'warm' }, { s: 0.25, t: 'warm' }, { s: 0.35, t: 'warm' },
  { s: 0.42, t: 'rose' }, { s: 0.55, t: 'cool' }, { s: 0.75, t: 'cool' },
  { s: 0.85, t: 'warm' }, { s: 1, t: 'warm' },
];
const timePts = [
  { s: 0, h: 19, m: 30 }, { s: 0.12, h: 19, m: 45 }, { s: 0.25, h: 20, m: 0 },
  { s: 0.40, h: 20, m: 47 }, { s: 0.60, h: 21, m: 15 }, { s: 0.80, h: 22, m: 30 },
  { s: 1, h: 23, m: 15 },
];

const timeH = document.querySelector('.time__hours');
const timeM = document.querySelector('.time__minutes');

function tickTemperature() {
  const el = document.documentElement;
  const max = el.scrollHeight - el.clientHeight;
  const p = max > 0 ? el.scrollTop / max : 0;

  for (let i = 0; i < timePts.length - 1; i++) {
    if (p >= timePts[i].s && p <= timePts[i+1].s) {
      const t = (p - timePts[i].s) / (timePts[i+1].s - timePts[i].s);
      const total = Math.round((timePts[i].h * 60 + timePts[i].m) + ((timePts[i+1].h * 60 + timePts[i+1].m) - (timePts[i].h * 60 + timePts[i].m)) * t);
      timeH.textContent = String(Math.floor(total / 60)).padStart(2, '0');
      timeM.textContent = String(total % 60).padStart(2, '0');
      break;
    }
  }

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (p >= colorStops[i].s && p <= colorStops[i+1].s) {
      const t = (p - colorStops[i].s) / (colorStops[i+1].s - colorStops[i].s);
      const st = t * t * (3 - 2 * t);
      const a = temps[colorStops[i].t], b = temps[colorStops[i+1].t];
      document.body.style.backgroundColor = rgb(lerpC(a.bg, b.bg, st));
      document.body.style.color = rgb(lerpC(a.fg, b.fg, st));
      break;
    }
  }
  requestAnimationFrame(tickTemperature);
}
requestAnimationFrame(tickTemperature);

/* ═══════════════════════════════════════════════════════════════════════════
   PRELOADER — Clip-path wipe reveal (not opacity fade)
   ═══════════════════════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  const pre = document.getElementById('preloader');
  if (!pre) return;
  const wm = pre.querySelector('.preloader__wordmark');
  const loc = pre.querySelector('.preloader__location');
  const fill = pre.querySelector('.preloader__fill');
  const line = pre.querySelector('.preloader__line');
  const timeDisp = document.getElementById('time-display');

  const tl = gsap.timeline({ delay: 0.3 });
  tl.to(wm, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power4.inOut' })
    .to(loc, { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.4')
    .to(fill, { width: '100%', duration: 1.0, ease: 'power3.inOut' }, '-=0.3')
    .to(line, { opacity: 1, duration: 0.5 }, '-=0.6')
    .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 1.0, ease: 'power4.inOut', delay: 0.3 })
    .to(timeDisp, { opacity: 0.35, duration: 1.2, ease: 'power2.out' }, '-=0.6')
    .add(() => {
      pre.remove();
      initAfterPreloader();
    });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION ANIMATIONS — Triggered after preloader exits
   Each section uses a different entrance type (Rule 9: no consecutive same type)
   ═══════════════════════════════════════════════════════════════════════════ */
function initAfterPreloader() {
  initCursorSystem();
  initBreathing();

  // S1: THE APPROACH — P55 clip-path word reveal
  // First section is already in viewport after preloader — trigger immediately
  document.querySelectorAll('.text--whisper').forEach((el, i) => {
    animateReveal(el, { delay: 0.4 + i * 0.7, duration: 0.8, ease: 'power4.out' });
  });

  // S2: THE ROOM — Image parallax (scale 1.15→1.0 on scrub) + text slide from left
  gsap.to('.section--room .section__image', {
    scale: 1.0,
    ease: 'none',
    scrollTrigger: { trigger: '.section--room', start: 'top bottom', end: 'bottom top', scrub: 1.5 },
  });

  document.querySelectorAll('.text--material').forEach((el, i) => {
    gsap.fromTo(el,
      { x: -60, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 1.6, ease: 'power4.out',
        scrollTrigger: { trigger: '.section--room', start: 'center 60%', once: true },
        delay: i * 0.4,
      }
    );
  });

  gsap.utils.toArray('.section__divider').forEach(el => {
    gsap.to(el, {
      scaleX: 1, duration: 1.2, ease: 'power4.inOut',
      scrollTrigger: { trigger: el, start: 'top 80%', once: true },
    });
  });

  // S3: SURRENDER — P55 clip-path reveal on manifesto words
  ScrollTrigger.create({
    trigger: '.section--surrender',
    start: 'top 40%',
    once: true,
    onEnter: () => {
      const h2 = document.querySelector('.text--manifesto');
      animateReveal(h2, { stagger: 0.15, duration: 1.0, ease: 'power4.out' });
      gsap.fromTo('.text--sub',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.8, ease: 'power3.out', delay: 0.8 }
      );
    },
  });

  // S4: THE SHIFT — Pinned with scroll-driven glow
  gsap.fromTo('.shift__glow', { opacity: 0 }, {
    opacity: 1, ease: 'none',
    scrollTrigger: { trigger: '.section--shift', start: 'top 20%', end: 'center center', scrub: 2 },
  });
  gsap.to('.shift__glow', {
    opacity: 0,
    scrollTrigger: { trigger: '.section--shift', start: 'center center', end: 'bottom top', scrub: 2 },
  });

  document.querySelectorAll('.text--breath').forEach((el, i) => {
    gsap.fromTo(el,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 2.2, ease: 'power4.out',
        scrollTrigger: { trigger: '.section--shift', start: 'top 35%', once: true },
        delay: 0.3 + i * 0.5,
      }
    );
  });

  // S5: CRAFT — Image parallax + ingredients slide from left (different from S2 slide direction)
  gsap.to('.section--craft .section__image', {
    scale: 1.0, ease: 'none',
    scrollTrigger: { trigger: '.section--craft', start: 'top bottom', end: 'bottom top', scrub: 1.5 },
  });

  document.querySelectorAll('.text--ingredient').forEach((el, i) => {
    gsap.fromTo(el,
      { x: -50, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 1.6, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
        delay: i * 0.25,
      }
    );
  });

  // S6: SILENCE — "Tea." scale entrance (different from all previous types)
  gsap.fromTo('.text--tea',
    { scale: 0.75, opacity: 0 },
    {
      scale: 1, opacity: 1, duration: 3.0, ease: 'power4.out',
      scrollTrigger: { trigger: '.section--silence', start: 'top 45%', once: true },
    }
  );

  // S7: DEPARTURE — Stagger footer elements with P55 reveal on wordmark
  ScrollTrigger.create({
    trigger: '.section--departure',
    start: 'top 60%',
    once: true,
    onEnter: () => {
      const wm = document.querySelector('.footer__wordmark');
      animateReveal(wm, { stagger: 0.1, duration: 0.9, ease: 'power4.out' });
      gsap.fromTo('.footer__location', { opacity: 0 }, { opacity: 0.35, duration: 1.4, delay: 0.4, ease: 'power2.out' });
      gsap.fromTo('.footer__reserve', { y: 12, opacity: 0 }, { y: 0, opacity: 0.6, duration: 1.4, delay: 0.7, ease: 'power4.out' });
    },
  });

  // MAGNETIC HOVER — P71 behavior on reserve link
  document.querySelectorAll('[data-cursor-magnetic]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - rect.left - rect.width / 2;
      const dy = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: dx * 0.3, y: dy * 0.3, duration: 0.4, ease: 'power3.out', overwrite: true });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
    });
  });
}

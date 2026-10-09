import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════
   LENIS — Weighted smooth scroll (stone physics)
   ═══════════════════════════════════════════════ */
const lenis = new Lenis({
  duration: 1.8,
  easing: t => 1 - Math.pow(1 - t, 5),
  smoothWheel: true,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ═══════════════════════════════════════════════
   CUSTOM CURSOR — Lerped ring + dot + label
   ═══════════════════════════════════════════════ */
let mx = window.innerWidth / 2, my = window.innerHeight / 2;
let cx = mx, cy = my;

window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

function tickCursor() {
  const cursor = document.querySelector('.cursor');
  const cursorDot = document.querySelector('.cursor__dot');
  const cursorLabel = document.querySelector('.cursor__label');
  if (!cursor || !cursorDot) { requestAnimationFrame(tickCursor); return; }
  cx += (mx - cx) * 0.12;
  cy += (my - cy) * 0.12;
  cursor.style.left = cx + 'px';
  cursor.style.top = cy + 'px';
  cursorDot.style.left = mx + 'px';
  cursorDot.style.top = my + 'px';
  if (cursorLabel) {
    cursorLabel.style.left = mx + 'px';
    cursorLabel.style.top = my + 'px';
  }
  requestAnimationFrame(tickCursor);
}
tickCursor();

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      const c = document.querySelector('.cursor');
      const cl = document.querySelector('.cursor__label');
      if (c) c.classList.add('cursor--hover');
      const label = el.dataset.cursor || '';
      if (label && cl) {
        cl.textContent = label;
        cl.classList.add('cursor__label--visible');
      }
    });
    el.addEventListener('mouseleave', () => {
      const c = document.querySelector('.cursor');
      const cl = document.querySelector('.cursor__label');
      if (c) c.classList.remove('cursor--hover');
      if (cl) cl.classList.remove('cursor__label--visible');
    });
  });
});

/* ═══════════════════════════════════════════════
   FILM GRAIN (P52) — 12fps canvas noise
   ═══════════════════════════════════════════════ */
const grainCanvas = document.getElementById('grain');
const gCtx = grainCanvas.getContext('2d');
function resizeGrain() {
  grainCanvas.width = window.innerWidth / 3;
  grainCanvas.height = window.innerHeight / 3;
}
resizeGrain();
window.addEventListener('resize', resizeGrain);

let grainFrame = 0;
function renderGrain() {
  grainFrame++;
  if (grainFrame % 5 !== 0) { requestAnimationFrame(renderGrain); return; }
  const w = grainCanvas.width, h = grainCanvas.height;
  const img = gCtx.createImageData(w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() * 255;
    d[i] = d[i+1] = d[i+2] = v;
    d[i+3] = 255;
  }
  gCtx.putImageData(img, 0, 0);
  requestAnimationFrame(renderGrain);
}
renderGrain();

/* ═══════════════════════════════════════════════
   COLOR TEMPERATURE — Scroll-driven interpolation
   ═══════════════════════════════════════════════ */
const temps = {
  warm:  { bg: [13,9,7],   fg: [240,232,220], accent: [196,149,106] },
  cool:  { bg: [8,10,13],  fg: [216,221,232], accent: [160,170,190] },
  rose:  { bg: [18,8,8],   fg: [240,216,208], accent: [212,132,122] },
};

function lerpColor(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
function toCSS(c) { return `rgb(${c[0]},${c[1]},${c[2]})`; }

const colorStops = [
  { scroll: 0,    temp: 'warm' },
  { scroll: 0.25, temp: 'warm' },
  { scroll: 0.35, temp: 'warm' },
  { scroll: 0.42, temp: 'rose' },
  { scroll: 0.55, temp: 'cool' },
  { scroll: 0.75, temp: 'cool' },
  { scroll: 0.85, temp: 'warm' },
  { scroll: 1.00, temp: 'warm' },
];

const timeline = [
  { scroll: 0,    h: 19, m: 30 },
  { scroll: 0.12, h: 19, m: 45 },
  { scroll: 0.25, h: 20, m:  0 },
  { scroll: 0.40, h: 20, m: 47 },
  { scroll: 0.60, h: 21, m: 15 },
  { scroll: 0.80, h: 22, m: 30 },
  { scroll: 1.00, h: 23, m: 15 },
];

const timeH = document.querySelector('.time__hours');
const timeM = document.querySelector('.time__minutes');
const progressBar = document.getElementById('scroll-progress');

function updateTemperature() {
  const scrollEl = document.documentElement;
  const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
  const progress = maxScroll > 0 ? scrollEl.scrollTop / maxScroll : 0;

  // Progress bar
  if (progressBar) progressBar.style.width = (progress * 100) + '%';

  // Time
  for (let i = 0; i < timeline.length - 1; i++) {
    if (progress >= timeline[i].scroll && progress <= timeline[i+1].scroll) {
      const t = (progress - timeline[i].scroll) / (timeline[i+1].scroll - timeline[i].scroll);
      const totalA = timeline[i].h * 60 + timeline[i].m;
      const totalB = timeline[i+1].h * 60 + timeline[i+1].m;
      const total = Math.round(totalA + (totalB - totalA) * t);
      timeH.textContent = String(Math.floor(total / 60)).padStart(2, '0');
      timeM.textContent = String(total % 60).padStart(2, '0');
      break;
    }
  }

  // Color
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (progress >= colorStops[i].scroll && progress <= colorStops[i+1].scroll) {
      const t = (progress - colorStops[i].scroll) / (colorStops[i+1].scroll - colorStops[i].scroll);
      const smoothT = t * t * (3 - 2 * t);
      const a = temps[colorStops[i].temp];
      const b = temps[colorStops[i+1].temp];
      const bg = lerpColor(a.bg, b.bg, smoothT);
      const fg = lerpColor(a.fg, b.fg, smoothT);
      const ac = lerpColor(a.accent, b.accent, smoothT);
      document.body.style.backgroundColor = toCSS(bg);
      document.body.style.color = toCSS(fg);
      document.documentElement.style.setProperty('--fg', toCSS(fg));
      document.documentElement.style.setProperty('--bg', toCSS(bg));
      document.documentElement.style.setProperty('--accent', toCSS(ac));
      break;
    }
  }
  requestAnimationFrame(updateTemperature);
}
requestAnimationFrame(updateTemperature);

/* ═══════════════════════════════════════════════
   PRELOADER — Clip-path reveal + bar fill
   ═══════════════════════════════════════════════ */
window.addEventListener('load', () => {
  const pre = document.getElementById('preloader');
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
    .to(pre, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1.0,
      ease: 'power4.inOut',
      delay: 0.3,
    })
    .to(timeDisp, { opacity: 0.35, duration: 1.2, ease: 'power2.out' }, '-=0.6')
    .add(() => pre.remove());
});

/* ═══════════════════════════════════════════════
   SECTION ANIMATIONS
   ═══════════════════════════════════════════════ */

// S1: APPROACH — Whisper text stagger reveal
gsap.utils.toArray('.text--whisper').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0,
    duration: 2.0,
    ease: 'power4.out',
    scrollTrigger: {
      trigger: '.section--approach',
      start: 'top 60%',
      toggleActions: 'play none none none',
    },
    delay: 0.8 + i * 0.8,
  });
});

// S2: ROOM — Image parallax + scale reveal + text reveal
gsap.to('.section--room .section__image', {
  scale: 1.0,
  ease: 'none',
  scrollTrigger: {
    trigger: '.section--room',
    start: 'top bottom',
    end: 'bottom top',
    scrub: 1.5,
  },
});

gsap.utils.toArray('.text--material').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0,
    duration: 1.6,
    ease: 'power4.out',
    scrollTrigger: {
      trigger: '.section--room',
      start: 'center 60%',
      toggleActions: 'play none none none',
    },
    delay: i * 0.5,
  });
});

// Dividers
gsap.utils.toArray('.section__divider').forEach(el => {
  gsap.to(el, {
    scaleX: 1,
    duration: 1.2,
    ease: 'power4.inOut',
    scrollTrigger: {
      trigger: el,
      start: 'top 80%',
      toggleActions: 'play none none none',
    },
  });
});

// S3: SURRENDER — Clip-path word reveal (the big moment)
const words = gsap.utils.toArray('.text--manifesto .word');
words.forEach((word, i) => {
  gsap.to(word, {
    clipPath: 'inset(0 0 0% 0)',
    y: 0,
    duration: 1.4,
    ease: 'power4.out',
    scrollTrigger: {
      trigger: '.section--surrender',
      start: 'top 40%',
      toggleActions: 'play none none none',
    },
    delay: i * 0.2,
  });
});

gsap.to('.text--sub', {
  opacity: 1, y: 0,
  duration: 1.8,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.section--surrender',
    start: 'top 25%',
    toggleActions: 'play none none none',
  },
});

// S4: THE SHIFT — Pinned section + scroll-driven glow
gsap.utils.toArray('.text--breath').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0,
    duration: 2.0,
    ease: 'power4.out',
    scrollTrigger: {
      trigger: '.section--shift',
      start: 'top 40%',
      toggleActions: 'play none none none',
    },
    delay: 0.4 + i * 0.6,
  });
});

// The glow — appears during the shift
gsap.to('.shift__glow', {
  opacity: 1,
  duration: 3,
  ease: 'power2.inOut',
  scrollTrigger: {
    trigger: '.section--shift',
    start: 'top 20%',
    end: 'center center',
    scrub: 2,
  },
});
gsap.to('.shift__glow', {
  opacity: 0,
  scrollTrigger: {
    trigger: '.section--shift',
    start: 'center center',
    end: 'bottom top',
    scrub: 2,
  },
});

// S5: CRAFT — Ingredients slide from left
gsap.utils.toArray('.text--ingredient').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, x: 0,
    duration: 1.6,
    ease: 'power4.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 80%',
      toggleActions: 'play none none none',
    },
    delay: i * 0.3,
  });
});

// S6: SILENCE — Scale up + fade
gsap.to('.text--tea', {
  opacity: 1, scale: 1,
  duration: 3.0,
  ease: 'power4.out',
  scrollTrigger: {
    trigger: '.section--silence',
    start: 'top 45%',
    toggleActions: 'play none none none',
  },
});

// S7: DEPARTURE — Stagger footer elements
gsap.to('.footer__wordmark', {
  opacity: 1, y: 0,
  duration: 1.8,
  ease: 'power4.out',
  scrollTrigger: {
    trigger: '.section--departure',
    start: 'top 60%',
    toggleActions: 'play none none none',
  },
});
gsap.to('.footer__location', {
  opacity: 0.35,
  duration: 1.4,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '.section--departure',
    start: 'top 55%',
    toggleActions: 'play none none none',
  },
  delay: 0.4,
});
gsap.to('.footer__reserve', {
  opacity: 0.6, y: 0,
  duration: 1.4,
  ease: 'power4.out',
  scrollTrigger: {
    trigger: '.section--departure',
    start: 'top 50%',
    toggleActions: 'play none none none',
  },
  delay: 0.7,
});

/* ═══════════════════════════════════════════════
   IMAGE BREATHING — Slow scale pulse on scroll-visible images
   ═══════════════════════════════════════════════ */
gsap.utils.toArray('.section__image').forEach(img => {
  gsap.to(img, {
    filter: 'brightness(0.75) saturate(0.9)',
    ease: 'none',
    scrollTrigger: {
      trigger: img.closest('.section'),
      start: 'top bottom',
      end: 'bottom top',
      scrub: 2,
    },
  });
});

/* ═══════════════════════════════════════════════
   MAGNETIC HOVER — Reserve link
   ═══════════════════════════════════════════════ */
const magneticEls = document.querySelectorAll('.footer__reserve');
magneticEls.forEach(el => {
  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: 'power3.out' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
  });
});

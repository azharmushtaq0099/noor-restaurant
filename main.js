import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ── Lenis smooth scroll (weighted, slow — stone physics) ── */
const lenis = new Lenis({
  duration: 1.6,
  easing: t => 1 - Math.pow(1 - t, 4), // power4.out
  smoothWheel: true,
});
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ── Film grain (P52) ── */
const grainCanvas = document.getElementById('grain');
const gCtx = grainCanvas.getContext('2d');
function resizeGrain() {
  grainCanvas.width = window.innerWidth / 2;
  grainCanvas.height = window.innerHeight / 2;
}
resizeGrain();
window.addEventListener('resize', resizeGrain);

let grainFrame = 0;
function renderGrain() {
  grainFrame++;
  if (grainFrame % 3 !== 0) { requestAnimationFrame(renderGrain); return; }
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

/* ── Color temperature system ── */
const temps = {
  warm:   { bg: [13,9,7],   fg: [240,232,220], accent: [196,149,106] },
  cool:   { bg: [8,10,13],  fg: [216,221,232], accent: [160,170,190] },
  rose:   { bg: [18,8,8],   fg: [240,216,208], accent: [212,132,122] },
};

function lerpColor(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}
function toCSS(c) { return `rgb(${c[0]},${c[1]},${c[2]})`; }

/* ── Time display ── */
const timeH = document.querySelector('.time__hours');
const timeM = document.querySelector('.time__minutes');

const timeline = [
  { scroll: 0,    h: 19, m: 30 },
  { scroll: 0.12, h: 19, m: 45 },
  { scroll: 0.25, h: 20, m:  0 },
  { scroll: 0.40, h: 20, m: 47 },
  { scroll: 0.60, h: 21, m: 15 },
  { scroll: 0.80, h: 22, m: 30 },
  { scroll: 1.00, h: 23, m: 15 },
];

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

function updateTimeAndColor() {
  const scrollEl = document.documentElement;
  const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
  const progress = maxScroll > 0 ? scrollEl.scrollTop / maxScroll : 0;

  // Time interpolation
  let tSeg = timeline[timeline.length - 1];
  for (let i = 0; i < timeline.length - 1; i++) {
    if (progress >= timeline[i].scroll && progress <= timeline[i+1].scroll) {
      const t = (progress - timeline[i].scroll) / (timeline[i+1].scroll - timeline[i].scroll);
      const totalA = timeline[i].h * 60 + timeline[i].m;
      const totalB = timeline[i+1].h * 60 + timeline[i+1].m;
      const total = Math.round(totalA + (totalB - totalA) * t);
      tSeg = { h: Math.floor(total / 60), m: total % 60 };
      break;
    }
  }
  timeH.textContent = String(tSeg.h).padStart(2, '0');
  timeM.textContent = String(tSeg.m).padStart(2, '0');

  // Color temperature interpolation
  let bgColor = temps.warm.bg;
  let fgColor = temps.warm.fg;
  let acColor = temps.warm.accent;
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (progress >= colorStops[i].scroll && progress <= colorStops[i+1].scroll) {
      const t = (progress - colorStops[i].scroll) / (colorStops[i+1].scroll - colorStops[i].scroll);
      const a = temps[colorStops[i].temp];
      const b = temps[colorStops[i+1].temp];
      bgColor = lerpColor(a.bg, b.bg, t);
      fgColor = lerpColor(a.fg, b.fg, t);
      acColor = lerpColor(a.accent, b.accent, t);
      break;
    }
  }
  document.body.style.backgroundColor = toCSS(bgColor);
  document.body.style.color = toCSS(fgColor);
  document.documentElement.style.setProperty('--fg', toCSS(fgColor));
  document.documentElement.style.setProperty('--bg', toCSS(bgColor));
  document.documentElement.style.setProperty('--accent', toCSS(acColor));

  requestAnimationFrame(updateTimeAndColor);
}
requestAnimationFrame(updateTimeAndColor);

/* ── GSAP scroll-driven reveals ── */

// S1: Whisper text
gsap.utils.toArray('.text--whisper').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 1.4, ease: 'power4.out',
    scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none none' },
    delay: i * 0.6,
  });
});

// S2: Material text
gsap.utils.toArray('.text--material').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 1.2, ease: 'power4.out',
    scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
    delay: i * 0.4,
  });
});

// S3: Manifesto words
gsap.utils.toArray('.text--manifesto .word').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 1.0, ease: 'power4.out',
    scrollTrigger: { trigger: '.section--surrender', start: 'top 50%', toggleActions: 'play none none none' },
    delay: i * 0.25,
  });
});
gsap.to('.text--sub', {
  opacity: 1, duration: 1.4, ease: 'power3.out',
  scrollTrigger: { trigger: '.section--surrender', start: 'top 30%', toggleActions: 'play none none none' },
});

// S4: Breath text
gsap.utils.toArray('.text--breath').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 1.6, ease: 'power4.out',
    scrollTrigger: { trigger: '.section--shift', start: 'top 55%', toggleActions: 'play none none none' },
    delay: i * 0.5,
  });
});

// S5: Ingredients
gsap.utils.toArray('.text--ingredient').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 1.2, ease: 'power4.out',
    scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
    delay: i * 0.35,
  });
});

// S6: Tea
gsap.to('.text--tea', {
  opacity: 1, y: 0, duration: 2.0, ease: 'power4.out',
  scrollTrigger: { trigger: '.section--silence', start: 'top 50%', toggleActions: 'play none none none' },
});

/* ── Preloader ── */
window.addEventListener('load', () => {
  const inner = document.querySelector('.preloader__inner');
  const fill = document.querySelector('.preloader__fill');
  const preloader = document.getElementById('preloader');

  const tl = gsap.timeline();
  tl.to(inner, { opacity: 1, duration: 0.6, ease: 'power2.out' })
    .to(fill, { width: '100%', duration: 0.9, ease: 'power3.inOut' })
    .to(inner, { opacity: 0, y: -16, duration: 0.55, ease: 'expo.out' })
    .to(preloader, {
      opacity: 0, duration: 0.4, ease: 'power2.out',
      onComplete: () => preloader.remove()
    });
});

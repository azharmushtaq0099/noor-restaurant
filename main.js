import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
gsap.registerPlugin(ScrollTrigger);
window.gsap = gsap;

/* ── P11: Lenis smooth scroll ── */
const lenis = new Lenis({ duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* ── P52: Film grain (production pattern) ── */
const GRAIN = { intensity: 0.09, frameRate: 12, blendMode: 'overlay', canvasOpacity: 0.5 };
const grainCanvas = document.createElement('canvas');
const gCtx = grainCanvas.getContext('2d');
Object.assign(grainCanvas.style, {
  position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
  zIndex: '9998', pointerEvents: 'none', mixBlendMode: GRAIN.blendMode, opacity: '0',
});
document.body.appendChild(grainCanvas);
function grainResize() {
  const d = Math.min(devicePixelRatio, 2), w = Math.max(innerWidth, 1), h = Math.max(innerHeight, 1);
  grainCanvas.width = Math.ceil(w * d); grainCanvas.height = Math.ceil(h * d);
}
grainResize(); addEventListener('resize', grainResize);
setInterval(() => {
  const { width: w, height: h } = grainCanvas;
  if (!w || !h) return;
  const img = gCtx.createImageData(w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 255 * GRAIN.intensity * 2;
    d[i] = d[i+1] = d[i+2] = Math.round(128 + n);
    d[i+3] = Math.round(Math.random() * 255 * GRAIN.intensity);
  }
  gCtx.putImageData(img, 0, 0);
}, 1000 / GRAIN.frameRate);
gsap.to(grainCanvas, { opacity: GRAIN.canvasOpacity, duration: 2, ease: 'power2.out', delay: 0.5 });

/* ── P30: Cursor system (canvas dot + ring + magnetic) ── */
function hexToRgb(h) { const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return r ? [parseInt(r[1],16),parseInt(r[2],16),parseInt(r[3],16)] : [240,232,220]; }
(function initCursor() {
  if (matchMedia('(hover:none),(pointer:coarse)').matches || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const c = document.createElement('canvas');
  c.id = 'cursor-canvas';
  c.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  document.body.classList.add('__cursor-custom');
  let W = Math.max(innerWidth,1), H = Math.max(innerHeight,1);
  const resize = () => { W = c.width = Math.max(innerWidth,1); H = c.height = Math.max(innerHeight,1); };
  resize(); addEventListener('resize', resize);
  const m = { x: W/2, y: H/2 }, f = { x: W/2, y: H/2 };
  const col = '#F0E8DC', [cr,cg,cb] = hexToRgb(col);
  addEventListener('mousemove', e => { m.x = e.clientX; m.y = e.clientY; });
  gsap.ticker.add(() => {
    ctx.clearRect(0, 0, W, H);
    f.x += (m.x - f.x) * 0.09; f.y += (m.y - f.y) * 0.09;
    ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI*2); ctx.fillStyle = col; ctx.fill();
    ctx.beginPath(); ctx.arc(f.x, f.y, 17, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.5)`; ctx.lineWidth = 1; ctx.stroke();
  });
  document.querySelectorAll('[data-cursor-magnetic]').forEach(el => {
    const pw = parseFloat(el.dataset.power) || 0.3;
    const qX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power2.out' });
    const qY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power2.out' });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      qX((r.left + r.width/2 - e.clientX) * pw * -1);
      qY((r.top + r.height/2 - e.clientY) * pw * -1);
    });
    el.addEventListener('mouseleave', () => { qX(0); qY(0); });
  });
})();

/* ── P70: Breathing photography ── */
if (!matchMedia('(prefers-reduced-motion:reduce)').matches) {
  document.querySelectorAll('[data-breathe]').forEach(el => {
    el.style.willChange = 'transform'; el.style.transformOrigin = 'center';
    gsap.to(el, { scale: parseFloat(el.dataset.breatheScale)||1.025, duration: parseFloat(el.dataset.breatheDuration)||7, ease: 'sine.inOut', repeat: -1, yoyo: true });
  });
}

/* ── P55: Word reveal (clip-path mode) ── */
function wrapWords(el) {
  if (el.dataset.wordsWrapped) return el.querySelectorAll('.w');
  el.dataset.wordsWrapped = '1';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = []; let n;
  while ((n = walker.nextNode())) { if (n.textContent.trim()) nodes.push(n); }
  nodes.forEach(tn => {
    const frag = document.createDocumentFragment();
    tn.textContent.split(/(\s+)/).forEach(tok => {
      if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); }
      else if (tok) {
        const s = document.createElement('span'); s.className = 'w';
        s.style.cssText = 'display:inline-block;white-space:pre;'; s.textContent = tok;
        frag.appendChild(s);
      }
    });
    tn.parentNode.replaceChild(frag, tn);
  });
  return el.querySelectorAll('.w');
}
function revealWords(el, opts = {}) {
  const { delay = 0, stagger = 0.06, duration = 0.7, ease = 'power4.out' } = opts;
  const words = wrapWords(el); if (!words.length) return;
  words.forEach(w => {
    const clip = document.createElement('span');
    clip.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;';
    w.parentNode.insertBefore(clip, w); clip.appendChild(w);
  });
  gsap.set(words, { y: '110%' });
  return gsap.to(words, { y: '0%', duration, stagger, delay, ease });
}

/* ═══════════════════════════════════════════════
   SECTION ANIMATIONS
   ═══════════════════════════════════════════════ */

// HERO: clip-path wordmark reveal + image parallax
gsap.to('.hero__mark', { clipPath: 'inset(0 0% 0 0)', duration: 1.4, ease: 'power4.inOut', delay: 0.3 });
gsap.to('.hero__sub', { opacity: 1, duration: 1.2, ease: 'power2.out', delay: 1.2 });
gsap.to('.hero__img', { scale: 1.0, ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
});

// PHILOSOPHY: P55 word reveal on headline
ScrollTrigger.create({ trigger: '.philosophy', start: 'top 60%', once: true,
  onEnter: () => revealWords(document.querySelector('.philosophy__headline'), { stagger: 0.1, duration: 0.9 })
});

// ROOM: image parallax + stat counter scrub
gsap.to('.room__img', { scale: 1.0, ease: 'none',
  scrollTrigger: { trigger: '.room', start: 'top bottom', end: 'bottom top', scrub: 2 }
});
document.querySelectorAll('.stat__number').forEach(el => {
  const target = parseInt(el.textContent);
  el.textContent = '0';
  ScrollTrigger.create({ trigger: '.room', start: 'top 60%', once: true,
    onEnter: () => {
      gsap.to({ v: 0 }, { v: target, duration: 2, ease: 'power3.out',
        onUpdate: function() { el.textContent = Math.round(this.targets()[0].v); }
      });
    }
  });
});

// SPACE: image parallax + text entrance
gsap.to('.space__image', { scale: 1.0, ease: 'none',
  scrollTrigger: { trigger: '.space', start: 'top bottom', end: 'bottom top', scrub: 2 }
});
ScrollTrigger.create({ trigger: '.space', start: 'top 55%', once: true,
  onEnter: () => revealWords(document.querySelector('.space__headline'), { stagger: 0.08, duration: 0.8 })
});

// LIGHT: pinned section with scroll-driven color shift
gsap.fromTo('#lightBg',
  { background: 'radial-gradient(ellipse at center, rgba(196,149,106,0.15) 0%, transparent 60%)' },
  { background: 'radial-gradient(ellipse at center, rgba(212,132,122,0.25) 0%, transparent 60%)',
    ease: 'none',
    scrollTrigger: { trigger: '.light', start: 'top top', end: 'bottom bottom', scrub: 2 }
  }
);
ScrollTrigger.create({ trigger: '.light', start: 'top 40%', once: true,
  onEnter: () => revealWords(document.querySelector('.light__headline'), { stagger: 0.08, duration: 0.9 })
});

// INGREDIENTS: divider lines + text entrance
document.querySelectorAll('.ingredient__divider').forEach((el, i) => {
  gsap.to(el, { scaleY: 1, duration: 1.2, ease: 'power4.inOut',
    scrollTrigger: { trigger: el, start: 'top 80%', once: true }, delay: i * 0.15
  });
});
document.querySelectorAll('.ingredient__name').forEach((el, i) => {
  gsap.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out',
    scrollTrigger: { trigger: el, start: 'top 80%', once: true }, delay: i * 0.2
  });
});

// PRESS: quote entrance
ScrollTrigger.create({ trigger: '.press', start: 'top 55%', once: true,
  onEnter: () => revealWords(document.querySelector('.press__quote'), { stagger: 0.06, duration: 0.7 })
});

// FOOTER: wordmark reveal
ScrollTrigger.create({ trigger: '.footer', start: 'top 60%', once: true,
  onEnter: () => revealWords(document.querySelector('.footer__mark'), { stagger: 0.1, duration: 0.8 })
});

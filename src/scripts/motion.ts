import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fade-up elements marked with [data-reveal] once they enter the viewport. */
function initReveals() {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (reducedMotion) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  items.forEach((el) => io.observe(el));
}

/** Split [data-split] headings into words and slide them up line by line. */
function initSplits() {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const words = (el.textContent ?? '').trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.replaceChildren(
      ...words.flatMap((w, i) => {
        const outer = document.createElement('span');
        const inner = document.createElement('span');
        outer.className = 'split-word';
        outer.setAttribute('aria-hidden', 'true');
        inner.textContent = w;
        outer.append(inner);
        return i ? [' ', outer] : [outer];
      }),
    );
    if (reducedMotion) return;
    const inner = el.querySelectorAll('.split-word > span');
    const immediate = el.dataset.split === 'load';
    gsap.from(inner, {
      yPercent: 110,
      rotate: 4,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.06,
      delay: immediate ? 0.35 : 0,
      scrollTrigger: immediate ? undefined : { trigger: el, start: 'top 85%' },
    });
  });
}

/** Count numbers up from 0 when visible. */
function initCounters() {
  document.querySelectorAll<HTMLElement>('[data-counter]').forEach((el) => {
    const target = Number(el.dataset.counter);
    if (reducedMotion || !Number.isFinite(target)) return;
    const obj = { v: 0 };
    el.textContent = '0';
    gsap.to(obj, {
      v: target,
      duration: 1.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: () => {
        el.textContent = Math.round(obj.v).toString();
      },
    });
  });
}

/** Vertical parallax: [data-parallax="0.15"] moves by that fraction of its height while scrolling. */
function initParallax() {
  if (reducedMotion) return;
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = Number(el.dataset.parallax) || 0.15;
    gsap.fromTo(
      el,
      { yPercent: -amount * 100 },
      {
        yPercent: amount * 100,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

initSplits();
initReveals();
initCounters();
initParallax();
window.addEventListener('load', () => ScrollTrigger.refresh());

export { gsap, ScrollTrigger };

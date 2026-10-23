// Sections below the fold fade up once as they scroll into view. Anything already on screen at load is
// left alone, so nothing flashes, and without JS (or with reduced motion) every section is simply there.
export function revealSections() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const below = [...document.querySelectorAll<HTMLElement>('main section[id]:not(#hello)')].filter(
    (el) => el.getBoundingClientRect().top > innerHeight * 0.9,
  );
  if (!below.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        el.dataset.in = 'yes';
        // Drop the hook once it has played, so nothing else (chaos monkey, print) has to work around it.
        setTimeout(() => delete el.dataset.in, 900);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  for (const el of below) {
    el.dataset.in = 'no';
    io.observe(el);
  }
}

// Konami code (↑ ↑ ↓ ↓ ← → ← → B A), or dev.chaos() in the console: a chaos monkey takes down every section,
// and each one restarts on its own, like pods in CrashLoopBackOff coming back after their health checks pass.
import { unlock } from './eggs';

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let running = false;

export async function chaos() {
  if (running) return 'Already running.';
  running = true;
  const spans = [...document.querySelectorAll<HTMLElement>('main section[id]')];
  const pods = spans.map((s) => {
    const pod = document.createElement('p');
    pod.className = 'pod mono';
    pod.setAttribute('role', 'status');
    s.classList.add('chaos');
    s.prepend(pod);
    return { s, pod };
  });
  const set = (p: (typeof pods)[number], state: string, text: string) => {
    p.s.dataset.pod = state;
    p.pod.textContent = text;
  };

  // Down they go, one after another.
  for (const p of pods) {
    set(p, 'crash', `${p.s.id}: CrashLoopBackOff`);
    await wait(120);
  }
  // Each restarts after its own back-off, sometimes failing a health check first.
  await Promise.all(
    pods.map(async (p, i) => {
      await wait(900 + i * 260 + Math.random() * 500);
      const tries = 1 + Math.floor(Math.random() * 3);
      for (let t = 1; t <= tries; t++) {
        set(p, 'restart', `${p.s.id}: restarting, attempt ${t} of ${tries}`);
        await wait(600 + Math.random() * 500);
      }
      set(p, 'up', `${p.s.id}: running, health check passed`);
      await wait(1100);
      p.pod.remove();
      p.s.classList.remove('chaos');
      delete p.s.dataset.pod;
    }),
  );
  running = false;
  unlock('chaos');
  console.log(`Chaos test passed: ${pods.length} of ${pods.length} sections recovered.`);
  return 'Chaos started.';
}

// The terminal's `sudo chaos` lands here as /?chaos.
if (new URLSearchParams(location.search).has('chaos') && document.querySelector('main section[id]')) {
  history.replaceState(null, '', location.pathname + location.hash);
  setTimeout(chaos, 600);
}

let i = 0;
addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('input, textarea, [contenteditable]')) return;
  // A wrong key starts over, though an extra ↑ still counts as the start of the code.
  i = e.key.toLowerCase() === CODE[i].toLowerCase() ? i + 1 : e.key === CODE[0] ? (i === 2 ? 2 : 1) : 0;
  if (i === CODE.length) {
    i = 0;
    chaos();
  }
});

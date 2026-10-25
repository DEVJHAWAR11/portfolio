// The easter eggs, tracked per visitor in this browser only. Finding one shows a small toast,
// and the footer keeps the count with a hint for each one still hidden.
import { sfx } from './sfx';

export const EGGS = [
  { id: 'secrets', name: 'Read the secrets', hint: 'The logo has more to say. Keep clicking.' },
  { id: 'pacman', name: 'Fed Pac-Man', hint: 'Someone is hungry in the open source map.' },
  { id: 'palette', name: 'Searched everything', hint: 'Press Ctrl K, or tap the search button.' },
  { id: 'cli', name: 'Used the terminal', hint: 'There is a terminal at /cli.' },
  { id: 'chaos', name: 'Survived the chaos monkey', hint: 'An old cheat code still works here. So does sudo chaos.' },
  { id: 'console', name: 'Opened the hood', hint: 'Developers check the DevTools console.' },
  { id: 'flame', name: 'Sat still for a minute', hint: 'On the home page, stop and do nothing for a minute.' },
  { id: 'cord', name: 'Snapped the cord', hint: 'The lamp cord only stretches so far.' },
] as const;

export type EggId = (typeof EGGS)[number]['id'];
const KEY = 'eggs';

export function found(): EggId[] {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return EGGS.map((e) => e.id).filter((id) => ids.includes(id));
  } catch {
    return [];
  }
}

let toast: HTMLElement | null = null;
let hide = 0;

export function unlock(id: EggId) {
  const have = found();
  if (have.includes(id)) return;
  have.push(id);
  try {
    localStorage.setItem(KEY, JSON.stringify(have));
  } catch {}
  const egg = EGGS.find((e) => e.id === id)!;
  document.dispatchEvent(new CustomEvent('eggs'));
  sfx.unlock();

  if (!toast) {
    toast = document.createElement('p');
    toast.className = 'egg-toast mono';
    toast.setAttribute('role', 'status');
    document.body.append(toast);
  }
  const all = have.length === EGGS.length;
  toast.innerHTML = `<b>${all ? 'All found' : 'Easter egg found'}</b><span></span>`;
  toast.querySelector('span')!.textContent = all
    ? `${EGGS.length} of ${EGGS.length}. You've seen everything. Say hi?`
    : `${egg.name}. ${have.length} of ${EGGS.length} found.`;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(hide);
  hide = window.setTimeout(() => toast?.classList.remove('show'), 4200);
}

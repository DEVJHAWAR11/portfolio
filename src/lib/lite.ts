// Phones and laptops that get the still version of the page's ambient motion: data saver on, or under 4GB of memory
// or under 4 cores. Everything else gets the motion, and the loops still watch their own frame rate and stop early
// on a device that can't keep up. Portrait.astro repeats this check inline, before paint.
const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
export const lite = !!nav.connection?.saveData || (nav.deviceMemory ?? 8) < 4 || (nav.hardwareConcurrency || 8) < 4;

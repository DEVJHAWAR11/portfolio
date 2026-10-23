// Quick notes from the contact form, delivered to my inbox through Resend.
// Needs RESEND_API_KEY in the Vercel environment. NOTE_TO picks the inbox; without it, the email in profile.json.
// With Resend's shared sender (no domain set up), it can only deliver to the address the Resend account uses.
import profile from '../src/data/profile.json' with { type: 'json' };

// A few notes per visitor an hour. Kept in memory, so it's best effort, but enough to stop someone holding Enter.
const LIMIT = 5;
const sent = new Map<string, number[]>();

const reply = (status: number, error?: string) => Response.json(error ? { error } : { ok: true }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: Request) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return reply(503, 'off');

  let body: { from?: unknown; msg?: unknown; site?: unknown; t?: unknown };
  try {
    body = await req.json();
  } catch {
    return reply(400, 'bad');
  }
  const from = String(body.from ?? '').trim().slice(0, 120);
  const msg = String(body.msg ?? '').trim();
  // "site" is a field people never see. Bots fill it in; so does anyone submitting faster than a person could type.
  if (body.site || Number(body.t) < 2500) return reply(200);
  if (msg.length < 2 || msg.length > 2000) return reply(400, 'length');

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '?';
  const now = Date.now();
  const recent = (sent.get(ip) ?? []).filter((t) => now - t < 36e5);
  if (recent.length >= LIMIT) return reply(429, 'limit');
  sent.set(ip, [...recent, now]);

  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from) ? from : undefined;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'devjhawar.com <onboarding@resend.dev>',
      to: process.env.NOTE_TO || profile.email,
      subject: `Note from ${from || 'someone'} on devjhawar.com`,
      text: `${msg}\n\nFrom: ${from || '(no name left)'}\nSent: ${new Date(now).toUTCString()}`,
      ...(email ? { reply_to: email } : {}),
    }),
  }).catch(() => null);
  return res?.ok ? reply(200) : reply(502, 'send');
}

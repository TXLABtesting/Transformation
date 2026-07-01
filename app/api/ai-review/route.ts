import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Proxies the "مراجعة ذكية" prompt to the internal, self-hosted model.
// Any OpenAI-compatible /chat/completions endpoint works. If AI_API_BASE_URL
// is unset or the call fails, we return 503 so the client uses its built-in
// deterministic Arabic heuristic (identical to the prototype's fallback).
export async function POST(req: NextRequest) {
  // Reject oversized bodies before parsing (defense against abuse).
  const len = Number(req.headers.get('content-length') || 0);
  if (len > 64_000) return NextResponse.json({ error: 'payload-too-large' }, { status: 413 });

  let prompt = '';
  try {
    const body = await req.json();
    prompt = typeof body?.prompt === 'string' ? body.prompt : '';
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
  if (!prompt) return NextResponse.json({ error: 'empty-prompt' }, { status: 400 });
  if (prompt.length > 20_000)
    return NextResponse.json({ error: 'prompt-too-long' }, { status: 413 });

  const base = process.env.AI_API_BASE_URL;
  if (!base) {
    // No model configured → let the client fall back to the heuristic.
    return NextResponse.json({ error: 'no-model' }, { status: 503 });
  }

  try {
    const res = await fetch(base.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.AI_API_KEY
          ? { Authorization: `Bearer ${process.env.AI_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'default',
        messages: [
          {
            role: 'system',
            content:
              'أنت مساعد تدقيق محتوى حكومي. تُعيد إجابات موجزة بصيغة JSON عربية فقط.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 700,
      }),
      // Guard against a slow/hung internal endpoint.
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return NextResponse.json({ error: 'upstream' }, { status: 502 });
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: 'upstream-failed' }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Persists the whole app-state blob to Postgres (server / Docker mode). The
// client store mirrors its localStorage payload here when
// NEXT_PUBLIC_DATA_MODE=api, giving durable multi-session persistence without
// re-modelling every action as a REST endpoint.
export async function GET() {
  try {
    const row = await prisma.appState.findUnique({ where: { id: 'singleton' } });
    return NextResponse.json({ data: row?.data ?? null });
  } catch {
    return NextResponse.json({ data: null, error: 'db' }, { status: 200 });
  }
}

export async function PUT(req: NextRequest) {
  // Optional shared-secret guard: when STATE_API_TOKEN is set, writes must
  // present it as a Bearer token. (The demo runs single-tenant without it.)
  const required = process.env.STATE_API_TOKEN;
  if (required && req.headers.get('authorization') !== `Bearer ${required}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const len = Number(req.headers.get('content-length') || 0);
  if (len > 2_000_000) return NextResponse.json({ error: 'payload-too-large' }, { status: 413 });

  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
  if (data === null || typeof data !== 'object') {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
  try {
    await prisma.appState.upsert({
      where: { id: 'singleton' },
      update: { data: data as object },
      create: { id: 'singleton', data: data as object },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'db' }, { status: 200 });
  }
}

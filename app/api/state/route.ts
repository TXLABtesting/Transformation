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
  let data: unknown;
  try {
    data = await req.json();
  } catch {
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

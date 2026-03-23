import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export async function GET() {
  try {
    const snap = await getDb().collection('users').limit(1).get();
    return NextResponse.json({
      status: 'ok',
      database: 'firebase-connected',
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', database: 'disconnected', error: e.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const result = db.prepare('SELECT COUNT(*) as users FROM users').get() as any;
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      users: result.users,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ status: 'error', database: 'disconnected' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, data: { message: 'تم تسجيل الخروج' } });
  response.cookies.set('token', '', { httpOnly: true, maxAge: 0, path: '/' });
  return response;
}

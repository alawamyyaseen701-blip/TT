import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'trustdeal-super-secret-key-2025';
const JWT_EXPIRES = '7d';

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return verifyToken(authHeader.slice(7));
  }
  const cookie = req.cookies.get('token')?.value;
  if (cookie) return verifyToken(cookie);
  return null;
}

export function generateDealId(): string {
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `TRD-${num}`;
}

export function generateId(): string {
  return crypto.randomUUID();
}


export function generateDisputeId(): string {
  const num = Math.floor(Math.random() * 900) + 100;
  return `DSP-${num.toString().padStart(3, '0')}`;
}

export function apiSuccess(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export const COMMISSION_RATE = 0.05;

export function calculateCommission(amount: number) {
  const commission = amount * COMMISSION_RATE;
  return {
    commission: parseFloat(commission.toFixed(2)),
    sellerNet: parseFloat((amount - commission).toFixed(2)),
  };
}

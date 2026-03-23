import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { findOne, setDoc, getDoc } from '@/lib/firebase';
import { signToken, apiSuccess, apiError } from '@/lib/auth';

function getAdminApp() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
  return getApps()[0];
}

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return apiError('idToken مطلوب');

    // Verify the Google ID token via Firebase Admin
    getAdminApp();
    const decoded = await getAuth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decoded;

    if (!email) return apiError('لم نتمكن من الحصول على البريد الإلكتروني');

    // Find or create user
    let user = await findOne('users', 'email', email);

    if (!user) {
      // New user — create from Google data
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') +
        Math.random().toString(36).slice(2, 5);

      const userId = `user_google_${uid}`;
      await setDoc('users', userId, {
        username,
        email,
        phone: null,
        password_hash: null, // Google users have no password
        display_name: name || username,
        avatar: picture || null,
        bio: null,
        country: 'SA',
        role: 'user',
        status: 'active',
        rating: 0,
        total_deals: 0,
        total_reviews: 0,
        wallet_balance: 0,
        escrow_balance: 0,
        platform_balance: 0,
        is_email_verified: true, // Google emails are verified
        is_phone_verified: false,
        google_uid: uid,
        last_seen: new Date().toISOString(),
      });

      user = await getDoc('users', userId);
    } else {
      // Update last seen
      const { updateDoc } = await import('@/lib/firebase');
      await updateDoc('users', user.id, { last_seen: new Date().toISOString(), avatar: picture || user.avatar });
    }

    if (user!.status === 'banned') return apiError('تم حظر هذا الحساب', 403);

    const token = signToken({ userId: user!.id, username: user!.username, role: user!.role });

    const response = apiSuccess({
      token,
      user: {
        id: user!.id,
        username: user!.username,
        displayName: user!.display_name,
        email: user!.email,
        role: user!.role,
        avatar: user!.avatar,
        walletBalance: user!.wallet_balance,
        rating: user!.rating,
      },
    });

    const res = new Response(response.body, response);
    res.headers.set('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`);
    return res;
  } catch (e: any) {
    console.error('[google-auth]', e);
    return apiError('فشل التحقق من حساب Google: ' + (e?.message || ''), 500);
  }
}

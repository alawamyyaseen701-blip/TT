import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/auth';

// ── Platform verifiers ─────────────────────────────────────────────────────

async function verifyYouTube(username: string) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { error: 'YOUTUBE_API_KEY not set', platform: 'youtube' };

  // Try by handle (@username) first
  const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(username)}&key=${key}`;
  const res       = await fetch(handleUrl);
  const data      = await res.json();

  if (data.items?.length) {
    const ch   = data.items[0];
    const subs = parseInt(ch.statistics?.subscriberCount || '0');
    return {
      platform:   'youtube',
      verified:   true,
      username:   ch.snippet?.customUrl?.replace('@', '') || username,
      name:       ch.snippet?.title,
      avatar:     ch.snippet?.thumbnails?.medium?.url,
      followers:  subs,
      views:      parseInt(ch.statistics?.viewCount || '0'),
      videos:     parseInt(ch.statistics?.videoCount || '0'),
      createdAt:  ch.snippet?.publishedAt,
      profileUrl: `https://youtube.com/@${username}`,
    };
  }
  return { platform: 'youtube', verified: false, error: 'Channel not found' };
}

async function verifyInstagram(username: string) {
  // Use unofficial public endpoint (works for public accounts)
  try {
    const res  = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`, {
      headers: {
        'User-Agent':  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept':      'application/json',
        'Referer':     `https://www.instagram.com/${username}/`,
        'X-Asbd-Id':   '129477',
        'X-Ig-App-Id': '936619743392459',
      },
    });
    const data = await res.json();
    const user = data?.data?.user;
    if (!user) return { platform: 'instagram', verified: false, error: 'Account not found or private' };
    return {
      platform:   'instagram',
      verified:   true,
      username:   user.username,
      name:       user.full_name,
      avatar:     user.profile_pic_url,
      followers:  user.edge_followed_by?.count || 0,
      following:  user.edge_follow?.count || 0,
      posts:      user.edge_owner_to_timeline_media?.count || 0,
      isPrivate:  user.is_private,
      isVerified: user.is_verified,
      bio:        user.biography,
      profileUrl: `https://instagram.com/${username}`,
    };
  } catch {
    return { platform: 'instagram', verified: false, error: 'Could not reach Instagram' };
  }
}

async function verifyTikTok(username: string) {
  try {
    const res  = await fetch(`https://www.tiktok.com/@${encodeURIComponent(username)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    const html = await res.text();

    // Extract JSON data embedded in the page
    const match = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return { platform: 'tiktok', verified: false, error: 'Account not found' };

    const json     = JSON.parse(match[1]);
    const userData = json?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo;
    if (!userData) return { platform: 'tiktok', verified: false, error: 'Could not parse TikTok data' };

    const user  = userData.user;
    const stats = userData.stats;
    return {
      platform:   'tiktok',
      verified:   true,
      username:   user.uniqueId,
      name:       user.nickname,
      avatar:     user.avatarMedium,
      followers:  stats.followerCount,
      following:  stats.followingCount,
      likes:      stats.heartCount,
      videos:     stats.videoCount,
      isVerified: user.verified,
      bio:        user.signature,
      profileUrl: `https://tiktok.com/@${username}`,
    };
  } catch {
    return { platform: 'tiktok', verified: false, error: 'Could not reach TikTok' };
  }
}

async function verifyGitHub(username: string) {
  try {
    const res  = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'TrustDeal-Verifier' },
    });
    if (!res.ok) return { platform: 'github', verified: false, error: 'Account not found' };
    const data = await res.json();
    return {
      platform:   'github',
      verified:   true,
      username:   data.login,
      name:       data.name,
      avatar:     data.avatar_url,
      followers:  data.followers,
      following:  data.following,
      repos:      data.public_repos,
      bio:        data.bio,
      createdAt:  data.created_at,
      profileUrl: data.html_url,
    };
  } catch {
    return { platform: 'github', verified: false, error: 'GitHub API error' };
  }
}

async function verifyTwitter(username: string) {
  // Use Syndication API (public, no key needed)
  try {
    const res  = await fetch(`https://syndication.twitter.com/srv/timeline-profile/screen-name/${encodeURIComponent(username)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return { platform: 'twitter', verified: false, error: 'Account not found' };
    const html = await res.text();
    const match = html.match(/"followers_count":(\d+)/);
    const nameMatch = html.match(/"name":"([^"]+)"/);
    return {
      platform:   'twitter',
      verified:   !!match,
      username,
      name:       nameMatch?.[1],
      followers:  match ? parseInt(match[1]) : 0,
      profileUrl: `https://x.com/${username}`,
    };
  } catch {
    return { platform: 'twitter', verified: false, error: 'Could not reach X/Twitter' };
  }
}

// ── Risk Score Calculator ──────────────────────────────────────────────────

function calculateRiskScore(data: any, claimedFollowers: number): {
  score: number; // 0-100, higher = safer
  flags: string[];
  badge: 'verified' | 'suspicious' | 'unverified';
} {
  const flags: string[] = [];
  let score = 100;

  if (!data.verified) return { score: 0, flags: ['❌ لم يتم التحقق من الحساب'], badge: 'unverified' };

  // Followers check
  const actualFollowers = data.followers || 0;
  if (claimedFollowers > 0) {
    const diff = Math.abs(actualFollowers - claimedFollowers) / Math.max(claimedFollowers, 1);
    if (diff > 0.5) { score -= 40; flags.push(`⚠️ عدد المتابعين الفعلي (${actualFollowers.toLocaleString('ar-EG')}) يختلف ${Math.round(diff * 100)}% عما أعلنه البائع`); }
    else if (diff > 0.2) { score -= 15; flags.push(`⚠️ عدد المتابعين قريب لكن هناك فرق بسيط`); }
  }

  // Account age check (if available)
  if (data.createdAt) {
    const ageMonths = (Date.now() - new Date(data.createdAt).getTime()) / (30 * 24 * 3_600_000);
    if (ageMonths < 3)  { score -= 30; flags.push('🆕 الحساب أقل من 3 أشهر — خطر عالي'); }
    else if (ageMonths < 12) { score -= 10; flags.push('🕒 الحساب أقل من سنة'); }
  }

  // Private account
  if (data.isPrivate) { score -= 20; flags.push('🔒 الحساب خاص — لا يمكن التحقق الكامل'); }

  // Platform verified
  if (data.isVerified) { score += 10; flags.push('✅ حساب موثّق رسمياً من المنصة'); }

  if (flags.length === 0 || (data.isVerified && score >= 90)) flags.push('✅ كل البيانات تطابق ما أعلنه البائع');

  const badge = score >= 75 ? 'verified' : score >= 40 ? 'suspicious' : 'unverified';
  return { score: Math.max(0, Math.min(100, score)), flags, badge };
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform         = searchParams.get('platform')?.toLowerCase();
    const username         = searchParams.get('username')?.replace('@', '').trim();
    const claimedFollowers = parseInt(searchParams.get('followers') || '0');

    if (!platform || !username) return apiError('platform و username مطلوبان');

    let accountData: any;
    switch (platform) {
      case 'youtube':   accountData = await verifyYouTube(username);   break;
      case 'instagram': accountData = await verifyInstagram(username);  break;
      case 'tiktok':    accountData = await verifyTikTok(username);     break;
      case 'twitter':
      case 'x':         accountData = await verifyTwitter(username);    break;
      case 'github':    accountData = await verifyGitHub(username);     break;
      default: return apiError(`منصة غير مدعومة: ${platform}`);
    }

    const risk = calculateRiskScore(accountData, claimedFollowers);

    return apiSuccess({
      ...accountData,
      riskScore: risk.score,
      riskFlags: risk.flags,
      badge:     risk.badge,
      checkedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[verify-account]', e);
    return apiError('خطأ في التحقق: ' + e.message, 500);
  }
}

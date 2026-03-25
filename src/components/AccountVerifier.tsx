'use client';
import { useState } from 'react';

const SUPPORTED_PLATFORMS: Record<string, { label: string; icon: string; color: string; hint: string }> = {
  youtube:   { label: 'YouTube',    icon: '▶️', color: '#FF0000', hint: 'أدخل اسم القناة أو الـ handle بدون @' },
  instagram: { label: 'Instagram',  icon: '📸', color: '#E1306C', hint: 'أدخل اسم المستخدم بدون @' },
  tiktok:    { label: 'TikTok',     icon: '🎵', color: '#010101', hint: 'أدخل اسم المستخدم بدون @' },
  twitter:   { label: 'Twitter / X',icon: '🐦', color: '#1DA1F2', hint: 'أدخل اسم المستخدم بدون @' },
  github:    { label: 'GitHub',     icon: '💻', color: '#24292E', hint: 'أدخل اسم المستخدم' },
};

const BADGE_CONFIG = {
  verified:   { label: '✅ تم التحقق — حساب آمن',      color: '#059669', bg: '#F0FDF4', border: '#A7F3D0' },
  suspicious: { label: '⚠️ يبدو مشبوهاً — راجع البيانات', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  unverified: { label: '❌ لم يتم التحقق',               color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

interface VerifyResult {
  verified: boolean;
  username?: string;
  name?: string;
  avatar?: string;
  followers?: number;
  views?: number;
  videos?: number;
  posts?: number;
  repos?: number;
  likes?: number;
  isVerified?: boolean;
  isPrivate?: boolean;
  bio?: string;
  createdAt?: string;
  profileUrl?: string;
  riskScore: number;
  riskFlags: string[];
  badge: 'verified' | 'suspicious' | 'unverified';
  error?: string;
}

interface Props {
  platform: string;          // e.g. 'youtube', 'instagram'
  claimedFollowers?: number; // what seller claims
  onVerified?: (result: VerifyResult) => void;
}

export default function AccountVerifier({ platform, claimedFollowers = 0, onVerified }: Props) {
  const [username, setUsername] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<VerifyResult | null>(null);
  const [error,    setError]    = useState('');

  const config = SUPPORTED_PLATFORMS[platform?.toLowerCase()];
  if (!config) return null; // unsupported platform

  const verify = async () => {
    const u = username.trim().replace('@', '');
    if (!u) { setError('أدخل اسم المستخدم أولاً'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res  = await fetch(`/api/verify-account?platform=${platform.toLowerCase()}&username=${encodeURIComponent(u)}&followers=${claimedFollowers}`);
      const data = await res.json();
      if (!data.success) { setError(data.error || 'فشل التحقق'); return; }
      setResult(data.data);
      onVerified?.(data.data);
    } catch { setError('خطأ في الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  const badge = result ? BADGE_CONFIG[result.badge] : null;

  return (
    <div style={{ borderRadius: 16, border: '2px solid #E2E8F0', overflow: 'hidden', fontFamily: 'Tajawal, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,#F8FAFC,#F1F5F9)', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>{config.icon}</span>
        <div>
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>🤖 التحقق التلقائي من الحساب</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>نتحقق من وجود الحساب وبياناته لحماية المشترين</div>
        </div>
      </div>

      <div style={{ padding: '18px' }}>
        {/* Input */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 13 }}>@</span>
            <input
              id="verify-username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verify()}
              placeholder={config.hint}
              style={{ width: '100%', padding: '12px 32px 12px 14px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', color: '#0F172A', boxSizing: 'border-box', background: 'white' }}
            />
          </div>
          <button
            id="verify-btn"
            onClick={verify}
            disabled={loading}
            style={{ padding: '12px 22px', background: loading ? '#CBD5E1' : 'linear-gradient(135deg,#2563EB,#1E3A8A)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {loading ? '⏳ جاري...' : '🔍 تحقق الآن'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            ❌ {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748B', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            جاري التحقق من الحساب على {config.label}...
          </div>
        )}

        {/* Result */}
        {result && badge && (
          <div style={{ borderRadius: 14, border: `1.5px solid ${badge.border}`, overflow: 'hidden' }}>
            {/* Badge header */}
            <div style={{ padding: '12px 16px', background: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, color: badge.color, fontSize: 14 }}>{badge.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>نقاط الأمان</span>
                <div style={{ position: 'relative', width: 56, height: 56 }}>
                  <svg viewBox="0 0 36 36" style={{ width: 56, height: 56, transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={result.riskScore >= 75 ? '#10B981' : result.riskScore >= 40 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="3"
                      strokeDasharray={`${result.riskScore} 100`}
                      strokeLinecap="round" />
                  </svg>
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#0F172A' }}>
                    {result.riskScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Account info */}
            {result.verified && (
              <div style={{ padding: '16px', background: 'white' }}>
                {/* Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  {result.avatar ? (
                    <img src={result.avatar} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E2E8F0' }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${config.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{config.icon}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 900, color: '#0F172A', fontSize: 15 }}>{result.name || result.username}</span>
                      {result.isVerified && <span style={{ fontSize: 12 }}>✅</span>}
                      {result.isPrivate && <span style={{ fontSize: 11, background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>🔒 خاص</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>@{result.username}</div>
                    {result.bio && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, lineHeight: 1.5, maxWidth: 260 }}>{result.bio.slice(0, 80)}{result.bio.length > 80 ? '...' : ''}</div>}
                  </div>
                  {result.profileUrl && (
                    <a href={result.profileUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: config.color, fontWeight: 700, textDecoration: 'none', border: `1.5px solid ${config.color}30`, padding: '5px 10px', borderRadius: 8 }}>
                      فتح ↗
                    </a>
                  )}
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10, marginBottom: 14 }}>
                  {result.followers !== undefined && (
                    <StatBox label="المتابعون" value={formatNumber(result.followers)} icon="👥"
                      warn={claimedFollowers > 0 && Math.abs((result.followers - claimedFollowers) / Math.max(claimedFollowers, 1)) > 0.2} />
                  )}
                  {result.views    !== undefined && <StatBox label="المشاهدات"  value={formatNumber(result.views)}    icon="👁️" />}
                  {result.videos   !== undefined && <StatBox label="الفيديوهات" value={formatNumber(result.videos)}   icon="🎬" />}
                  {result.posts    !== undefined && <StatBox label="المنشورات"  value={formatNumber(result.posts)}    icon="📸" />}
                  {result.likes    !== undefined && <StatBox label="الإعجابات"  value={formatNumber(result.likes)}    icon="❤️" />}
                  {result.repos    !== undefined && <StatBox label="المستودعات" value={formatNumber(result.repos)}    icon="💾" />}
                  {result.createdAt && <StatBox label="عمر الحساب" value={accountAge(result.createdAt)} icon="📅" />}
                </div>

                {/* Risk flags */}
                <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>📋 تقرير التحقق:</div>
                  {result.riskFlags.map((f, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#374151', lineHeight: 1.7 }}>{f}</div>
                  ))}
                </div>
              </div>
            )}

            {!result.verified && result.error && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                {result.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, warn }: { label: string; value: string; icon: string; warn?: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 8px', background: warn ? '#FFF7ED' : '#F8FAFC', border: `1px solid ${warn ? '#FDE68A' : '#E2E8F0'}`, borderRadius: 10 }}>
      <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 900, color: warn ? '#D97706' : '#0F172A' }}>{value}</div>
      <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{label}</div>
      {warn && <div style={{ fontSize: 9, color: '#D97706', marginTop: 2 }}>⚠️ يختلف</div>}
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function accountAge(dateStr: string): string {
  const months = Math.floor((Date.now() - new Date(dateStr).getTime()) / (30 * 24 * 3_600_000));
  if (months < 1)  return 'أقل من شهر';
  if (months < 12) return `${months} شهر`;
  const years = Math.floor(months / 12);
  return `${years} سنة`;
}

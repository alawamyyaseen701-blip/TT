'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 60%, #0F172A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'Tajawal, sans-serif', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid BG */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      {/* Floating shapes */}
      {['💎', '📱', '🤝', '🔒', '⭐'].map((emoji, i) => (
        <div key={i} style={{
          position: 'absolute', fontSize: 32, opacity: 0.12,
          top: `${15 + i * 18}%`, left: i % 2 === 0 ? `${8 + i * 6}%` : undefined, right: i % 2 !== 0 ? `${8 + i * 6}%` : undefined,
          animation: 'float 4s ease-in-out infinite', animationDelay: `${i * 0.8}s`,
        }}>{emoji}</div>
      ))}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 404 */}
        <div style={{ fontSize: 'clamp(80px, 15vw, 160px)', fontWeight: 900, lineHeight: 1, marginBottom: 16, background: 'linear-gradient(135deg, #10B981, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          404
        </div>

        <div style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 12 }}>
          هذه الصفحة غير موجودة!
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.7, marginBottom: 40, maxWidth: 420 }}>
          يبدو أن الرابط الذي تبحث عنه غير موجود أو تم حذفه. لكن لا تقلق — المنصة ما زالت هنا!
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button id="back-home-btn" style={{
              padding: '14px 32px', background: 'linear-gradient(135deg, #10B981, #2563EB)',
              border: 'none', borderRadius: 14, color: 'white', fontWeight: 800, fontSize: 16,
              cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
              boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
            }}>
              🏠 الصفحة الرئيسية
            </button>
          </Link>
          <Link href="/search" style={{ textDecoration: 'none' }}>
            <button id="search-btn-404" style={{
              padding: '14px 32px', background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 14,
              color: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
            }}>
              🔍 بحث في المنصة
            </button>
          </Link>
        </div>

        {/* Quick links */}
        <div style={{ marginTop: 48, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { href: '/social-accounts', label: '📱 حسابات سوشيال' },
            { href: '/digital-assets', label: '💎 أصول رقمية' },
            { href: '/subscriptions', label: '⭐ اشتراكات' },
            { href: '/auctions', label: '🔨 مزادات' },
          ].map(link => (
            <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 13, padding: '8px 16px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'block', transition: 'all 0.2s', fontFamily: 'Tajawal, sans-serif' }}>
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

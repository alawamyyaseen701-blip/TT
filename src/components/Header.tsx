'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserData {
  id: string;
  username: string;
  display_name: string;
  role: string;
  rating?: number;
}

export default function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch { setUser(null); }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUserMenuOpen(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/social-accounts', label: 'حسابات سوشيال', icon: '📱' },
    { href: '/digital-assets', label: 'أصول رقمية', icon: '💎' },
    { href: '/store', label: 'المتجر', icon: '🛒' },
    { href: '/subscriptions', label: 'اشتراكات', icon: '⭐' },
    { href: '/services', label: 'خدمات', icon: '⚡' },
    { href: '/requests', label: 'طلبات', icon: '📋' },
    { href: '/auctions', label: 'مزادات', icon: '🔨' },
  ];

  const userInitial = user?.display_name?.charAt(0) || user?.username?.charAt(0) || '؟';

  return (
    <>
      <header
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          transition: 'all 0.3s ease',
          background: scrolled ? 'rgba(15,23,42,0.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
          padding: '0 24px',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', height: 72, gap: 24 }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #2563EB, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>🔁</div>
              <div>
                <div style={{ color: 'white', fontWeight: 900, fontSize: 18, lineHeight: 1.1 }}>Trust🔁Deal</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }}>منصة الأمان الرقمي</div>
              </div>
            </div>
          </Link>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center', flexWrap: 'nowrap' }}>
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'; }}>
                  <span style={{ fontSize: 14 }}>{link.icon}</span>
                  {link.label}
                </div>
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button id="notifications-btn" onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, position: 'relative', transition: 'all 0.2s' }}>
                🔔
                <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#EF4444', border: '2px solid #0F172A' }} />
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 300, background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>الإشعارات</span>
                  </div>
                  {[
                    { icon: '💰', text: 'تم تأكيد الدفع لصفقتك #1234', time: 'قبل 5 دقائق', color: '#10B981' },
                    { icon: '📩', text: 'رسالة جديدة من محمد أحمد', time: 'قبل 20 دقيقة', color: '#2563EB' },
                    { icon: '⚠️', text: 'تم فتح نزاع على الصفقة #1230', time: 'قبل ساعة', color: '#F59E0B' },
                  ].map((n, i) => (
                    <div key={i} style={{ padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${n.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{n.icon}</div>
                      <div>
                        <div style={{ color: 'white', fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{n.text}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                  <Link href="/notifications" onClick={() => setNotifOpen(false)} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '12px 20px', textAlign: 'center', color: '#2563EB', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>عرض جميع الإشعارات →</div>
                  </Link>
                </div>
              )}
            </div>

            {/* Add Listing */}
            <Link href="/listings/create" style={{ textDecoration: 'none' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'linear-gradient(135deg, #10B981, #34D399)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                <span style={{ fontSize: 16 }}>+</span>
                إضافة إعلان
              </button>
            </Link>

            {/* User Area */}
            {!mounted ? null : user ? (
              <div style={{ position: 'relative' }}>
                <button id="user-menu-btn" onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 6px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #1E3A8A, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 16 }}>
                    {userInitial}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{user.display_name || user.username}</div>
                    {user.role === 'admin' && <div style={{ fontSize: 10, color: '#EF4444', fontWeight: 700 }}>مدير</div>}
                    {user.role === 'verified' && <div style={{ fontSize: 10, color: '#10B981', fontWeight: 700 }}>✅ موثق</div>}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>▼</span>
                </button>

                {userMenuOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 220, background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', zIndex: 50, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>{user.display_name || user.username}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>@{user.username}</div>
                    </div>
                    {[
                      { href: '/dashboard', icon: '📊', label: 'لوحة التحكم' },
                      { href: `/profile/${user.username}`, icon: '👤', label: 'ملفي الشخصي' },
                      { href: '/messages', icon: '💬', label: 'الرسائل' },
                      { href: '/favorites', icon: '❤️', label: 'المفضلة' },
                      { href: '/notifications', icon: '🔔', label: 'الإشعارات' },
                      { href: '/settings', icon: '⚙️', label: 'الإعدادات' },
                      ...(user.role === 'admin' ? [{ href: '/admin', icon: '🛡️', label: 'لوحة الإدارة' }] : []),
                    ].map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)} style={{ textDecoration: 'none' }}>
                        <div style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'background 0.15s', fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                          <span>{item.icon}</span> {item.label}
                        </div>
                      </Link>
                    ))}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>
                      <button id="logout-btn" onClick={handleLogout}
                        style={{ width: '100%', padding: '10px 16px', border: 'none', borderRadius: 10, background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
                        🚪 تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                  <button id="login-btn" style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    تسجيل الدخول
                  </button>
                </Link>
                <Link href="/auth/register" style={{ textDecoration: 'none' }}>
                  <button id="register-btn" style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #2563EB, #1E3A8A)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    سجل مجاناً
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Click outside to close */}
      {(notifOpen || userMenuOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999 }}
          onClick={() => { setNotifOpen(false); setUserMenuOpen(false); }} />
      )}
    </>
  );
}

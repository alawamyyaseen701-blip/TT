'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TABS = [
  { id: 'overview',   label: 'نظرة عامة',  icon: '📊' },
  { id: 'deals',      label: 'الصفقات',    icon: '🤝' },
  { id: 'purchases',  label: 'مشترياتي',   icon: '🛒' },
  { id: 'listings',   label: 'إعلاناتي',   icon: '📋' },
  { id: 'wallet',     label: 'المحفظة',    icon: '💰' },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  in_escrow:       { bg: 'rgba(245,158,11,0.1)',  color: '#D97706', label: 'في Escrow' },
  completed:       { bg: 'rgba(16,185,129,0.1)',  color: '#059669', label: 'مكتملة' },
  disputed:        { bg: 'rgba(239,68,68,0.1)',   color: '#DC2626', label: 'نزاع' },
  pending_payment: { bg: 'rgba(148,163,184,0.1)', color: '#64748B', label: 'انتظار دفع' },
  delivered:       { bg: 'rgba(37,99,235,0.1)',   color: '#2563EB', label: 'مُسلَّمة' },
  cancelled:       { bg: 'rgba(148,163,184,0.1)', color: '#94A3B8', label: 'ملغاة' },
  clawback:        { bg: 'rgba(239,68,68,0.1)',   color: '#DC2626', label: 'استرداد' },
  active:          { bg: 'rgba(16,185,129,0.1)',  color: '#059669', label: 'نشط' },
  pending:         { bg: 'rgba(245,158,11,0.1)',  color: '#D97706', label: 'مراجعة' },
  rejected:        { bg: 'rgba(239,68,68,0.1)',   color: '#DC2626', label: 'مرفوض' },
  sold:            { bg: 'rgba(148,163,184,0.1)', color: '#64748B', label: 'مباع' },
};

const LISTING_TYPES: Record<string, string> = {
  social: '📱 سوشيال', asset: '💎 أصول', store: '🛒 منتج', subscription: '⭐ اشتراك', service: '⚡ خدمة',
};

// ── Purchase Card: shows credentials securely ──
function PurchaseCard({ deal, userId }: { deal: any; userId: string }) {
  const [showCreds, setShowCreds]   = useState(false);
  const [creds, setCreds]           = useState<any>(null);
  const [loadingCreds, setLoading]  = useState(false);
  const [copyMsg, setCopyMsg]       = useState('');

  const isBuyer = deal.buyer_id === userId;
  if (!isBuyer || deal.status !== 'completed') return null;

  const fetchCreds = async () => {
    if (creds) { setShowCreds(s => !s); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/deals/${deal.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data.deliveryCredentials) {
        const c = data.data.deliveryCredentials;
        if (!c.locked) setCreds(c);
        else setCreds(null);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); setShowCreds(true); }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyMsg(`✅ تم نسخ ${label}`);
      setTimeout(() => setCopyMsg(''), 2000);
    });
  };

  return (
    <div style={{ background: 'white', border: '1.5px solid #F1F5F9', borderRadius: 16, padding: 20, marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 15, marginBottom: 4 }}>
            {deal.listing_title || 'مشترى'}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>
            #{deal.id?.slice(0, 10)} · {deal.listing_type ? LISTING_TYPES[deal.listing_type] || deal.listing_type : ''} · {new Date(deal.completed_at || deal.created_at).toLocaleDateString('ar-EG')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 900, color: '#10B981', fontSize: 16 }}>${deal.amount}</span>
          <Link href={`/deals/${deal.id}`} style={{ textDecoration: 'none' }}>
            <button style={{ padding: '6px 14px', background: 'rgba(37,99,235,0.08)', border: 'none', borderRadius: 8, color: '#2563EB', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>عرض الصفقة</button>
          </Link>
        </div>
      </div>

      {/* GitHub link if available */}
      {deal.github_url && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>🐙 رابط GitHub</span>
          <a href={deal.github_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>فتح Repository ↗</a>
        </div>
      )}

      {/* Credentials button */}
      <button id={`show-creds-${deal.id}`} onClick={fetchCreds} disabled={loadingCreds}
        style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1.5px dashed #CBD5E1', background: showCreds ? 'rgba(239,68,68,0.03)' : 'rgba(30,58,138,0.04)', color: '#1E3A8A', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {loadingCreds ? '⏳ جاري التحميل...' : showCreds ? '🔒 إخفاء بيانات الحساب' : '🔑 عرض بيانات الحساب / الباسورد'}
      </button>

      {/* Credentials panel */}
      {showCreds && creds && (
        <div style={{ marginTop: 12, padding: '16px', borderRadius: 14, background: '#FFF7ED', border: '1.5px solid #FED7AA' }}>
          <div style={{ fontSize: 12, color: '#92400E', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            🔑 بيانات الحساب — احتفظ بها في مكان آمن
          </div>

          {copyMsg && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#065F46', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{copyMsg}</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {creds.email && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'white', borderRadius: 10, border: '1px solid #FED7AA' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600, marginBottom: 2 }}>📧 الإيميل / البريد الإلكتروني</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{creds.email}</div>
                </div>
                <button onClick={() => copy(creds.email, 'الإيميل')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid #FED7AA', borderRadius: 8, color: '#92400E', fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600 }}>نسخ</button>
              </div>
            )}
            {creds.password && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'white', borderRadius: 10, border: '1px solid #FED7AA' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600, marginBottom: 2 }}>🔑 كلمة المرور</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{creds.password}</div>
                </div>
                <button onClick={() => copy(creds.password, 'الباسورد')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid #FED7AA', borderRadius: 8, color: '#92400E', fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600 }}>نسخ</button>
              </div>
            )}
            {creds.phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'white', borderRadius: 10, border: '1px solid #FED7AA' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600, marginBottom: 2 }}>📱 رقم الهاتف</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{creds.phone}</div>
                </div>
                <button onClick={() => copy(creds.phone, 'رقم الهاتف')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid #FED7AA', borderRadius: 8, color: '#92400E', fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600 }}>نسخ</button>
              </div>
            )}
            {creds.extra && (
              <div style={{ padding: '10px 14px', background: 'white', borderRadius: 10, border: '1px solid #FED7AA' }}>
                <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600, marginBottom: 4 }}>📝 معلومات إضافية</div>
                <div style={{ fontSize: 13, color: '#0F172A', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{creds.extra}</div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 11, color: '#DC2626' }}>
            ⚠️ لا تشارك هذه البيانات مع أي شخص آخر. أنت المسؤول عن الحفاظ عليها.
          </div>
        </div>
      )}

      {showCreds && !creds && !loadingCreds && (
        <div style={{ marginTop: 10, padding: '12px 16px', borderRadius: 12, background: '#F8FAFC', color: '#64748B', fontSize: 13, textAlign: 'center' }}>
          لا توجد بيانات حساب مرفقة بهذه الصفقة
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser]           = useState<any>(null);
  const [deals, setDeals]         = useState<any[]>([]);
  const [listings, setListings]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/auth/login?redirect=/dashboard'); return; }
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchData(token);
  }, []);

  const fetchData = async (token: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [meRes, dealsRes, listingsRes] = await Promise.all([
        fetch('/api/users/me', { headers }),
        fetch('/api/deals', { headers }),
        fetch('/api/listings?seller_id=me', { headers }),
      ]);
      const [me, dealsData, listingsData] = await Promise.all([
        meRes.json(), dealsRes.json(), listingsRes.json(),
      ]);
      if (me.success) setUser(me.data);
      if (dealsData.success) setDeals(dealsData.data?.deals || []);
      if (listingsData.success) setListings(listingsData.data?.listings || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ color: '#64748B', fontSize: 16, fontFamily: 'Tajawal, sans-serif' }}>جاري التحميل...</div>
      </div>
    </div>
  );

  const wallet       = { balance: user?.wallet_balance || 0, escrow: user?.escrow_balance || 0, pending: user?.pendingBalance || 0 };
  const activeDeals  = deals.filter(d => d.status === 'in_escrow' || d.status === 'delivered').length;
  const completedDeals = deals.filter(d => d.status === 'completed').length;
  const myListings   = listings.filter(l => l.seller_id === user?.id);
  // Deals where current user is the BUYER and deal is completed
  const myPurchases  = deals.filter(d => d.buyer_id === user?.id && d.status === 'completed');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Tajawal, sans-serif' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

          {/* Welcome */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>
                مرحباً، {user?.display_name || user?.username} 👋
              </h1>
              <p style={{ color: '#64748B', fontSize: 14 }}>@{user?.username} · {user?.role === 'admin' ? '🛡️ مدير' : user?.role === 'verified' ? '✅ موثق' : '👤 مستخدم'}</p>
            </div>
            <Link href="/listings/create">
              <button style={{ padding: '11px 24px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                + إضافة إعلان
              </button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'الرصيد المتاح',  val: `$${wallet.balance.toFixed(2)}`,  icon: '💰', color: '#10B981', sub: 'قابل للسحب' },
              { label: 'في Escrow',       val: `$${wallet.escrow.toFixed(2)}`,   icon: '🔒', color: '#F59E0B', sub: 'محتجز' },
              { label: 'صفقات نشطة',     val: activeDeals.toString(),            icon: '🤝', color: '#2563EB', sub: 'جارية' },
              { label: 'مشترياتي',       val: myPurchases.length.toString(),     icon: '🛒', color: '#8B5CF6', sub: 'مكتملة', onClick: () => setActiveTab('purchases') },
            ].map(s => (
              <div key={s.label} onClick={(s as any).onClick} style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1.5px solid #F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: (s as any).onClick ? 'pointer' : 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{s.sub}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.val}</div>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 14, padding: 6, border: '1.5px solid #F1F5F9', marginBottom: 24, flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t.id} id={`tab-${t.id}`} onClick={() => setActiveTab(t.id)}
                style={{ padding: '9px 18px', border: 'none', borderRadius: 10, background: activeTab === t.id ? 'linear-gradient(135deg, #0F172A, #1E293B)' : 'transparent', color: activeTab === t.id ? 'white' : '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s' }}>
                {t.icon} {t.label}
                {t.id === 'purchases' && myPurchases.length > 0 && (
                  <span style={{ padding: '1px 7px', borderRadius: 100, background: '#8B5CF6', color: 'white', fontSize: 10, fontWeight: 800 }}>{myPurchases.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #F1F5F9', padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>آخر الصفقات</h2>
                  <button onClick={() => setActiveTab('deals')} style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'Tajawal, sans-serif' }}>عرض الكل →</button>
                </div>
                {deals.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🤝</div>
                    <div style={{ fontSize: 14 }}>لا توجد صفقات بعد</div>
                    <Link href="/"><button style={{ marginTop: 12, padding: '8px 20px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: 'white', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600, fontSize: 13, color: '#0F172A' }}>تصفح الإعلانات</button></Link>
                  </div>
                ) : deals.slice(0, 3).map(d => (
                  <Link key={d.id} href={`/deals/${d.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '14px 0', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14, marginBottom: 3 }}>{d.listing_title || 'صفقة'}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>#{d.id?.slice(0, 8)} · {d.buyer_id === user?.id ? '🛒 مشتري' : '🏷️ بائع'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>${d.amount}</span>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, ...STATUS_COLORS[d.status] }}>{STATUS_COLORS[d.status]?.label || d.status}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {myPurchases.length > 0 && (
                <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #F1F5F9', padding: 24, marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>🛒 آخر مشترياتي</h2>
                    <button onClick={() => setActiveTab('purchases')} style={{ background: 'none', border: 'none', color: '#8B5CF6', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'Tajawal, sans-serif' }}>عرض الكل →</button>
                  </div>
                  {myPurchases.slice(0, 2).map(d => (
                    <PurchaseCard key={d.id} deal={d} userId={user?.id} />
                  ))}
                </div>
              )}

              <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #F1F5F9', padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>إعلاناتي الأخيرة</h2>
                  <button onClick={() => setActiveTab('listings')} style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'Tajawal, sans-serif' }}>عرض الكل →</button>
                </div>
                {myListings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
                    <div style={{ fontSize: 14 }}>لم تضف أي إعلانات بعد</div>
                    <Link href="/listings/create"><button style={{ marginTop: 12, padding: '8px 20px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 13 }}>+ إضافة أول إعلان</button></Link>
                  </div>
                ) : myListings.slice(0, 3).map(l => (
                  <div key={l.id} style={{ padding: '14px 0', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14, marginBottom: 3 }}>{l.title}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{LISTING_TYPES[l.type] || l.type} · 👁️ {l.views || 0}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>${l.price}</span>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, ...STATUS_COLORS[l.status] }}>{STATUS_COLORS[l.status]?.label || l.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DEALS ── */}
          {activeTab === 'deals' && (
            <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #F1F5F9', padding: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>جميع الصفقات ({deals.length})</h2>
              {deals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
                  <div>لا توجد صفقات بعد</div>
                </div>
              ) : deals.map(d => (
                <Link key={d.id} href={`/deals/${d.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '16px 0', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 15, marginBottom: 4 }}>{d.listing_title || 'صفقة'}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>#{d.id?.slice(0, 8)} · {d.buyer_id === user?.id ? '🛒 مشتري' : '🏷️ بائع'} · {new Date(d.created_at).toLocaleDateString('ar-EG')}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 900, color: '#0F172A', fontSize: 16 }}>${d.amount}</span>
                      <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, ...STATUS_COLORS[d.status] }}>{STATUS_COLORS[d.status]?.label || d.status}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ── PURCHASES ── */}
          {activeTab === 'purchases' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>🛒 مشترياتي ({myPurchases.length})</h2>
                <span style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', padding: '4px 10px', borderRadius: 8 }}>اضغط "عرض بيانات الحساب" لرؤية الباسورد</span>
              </div>
              {myPurchases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 16, border: '1.5px solid #F1F5F9', color: '#94A3B8' }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🛒</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>لا توجد مشتريات مكتملة بعد</div>
                  <div style={{ fontSize: 14, marginBottom: 24 }}>ستظهر هنا مشترياتك بعد اكتمال الصفقة وتأكيد الاستلام</div>
                  <Link href="/"><button style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>تصفح الإعلانات</button></Link>
                </div>
              ) : myPurchases.map(d => (
                <PurchaseCard key={d.id} deal={d} userId={user?.id} />
              ))}
            </div>
          )}

          {/* ── LISTINGS ── */}
          {activeTab === 'listings' && (
            <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #F1F5F9', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>إعلاناتي ({myListings.length})</h2>
                <Link href="/listings/create"><button style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>+ إعلان جديد</button></Link>
              </div>
              {myListings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                  <div>لا توجد إعلانات</div>
                </div>
              ) : myListings.map(l => (
                <div key={l.id} style={{ padding: '16px 0', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 15, marginBottom: 4 }}>{l.title}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>{LISTING_TYPES[l.type] || l.type} · 👁️ {l.views || 0} مشاهدة · ❤️ {l.favorites || 0}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 900, color: '#0F172A', fontSize: 16 }}>${l.price}</span>
                    <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, ...STATUS_COLORS[l.status] }}>{STATUS_COLORS[l.status]?.label || l.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── WALLET ── */}
          {activeTab === 'wallet' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'الرصيد المتاح',    val: `$${wallet.balance.toFixed(2)}`, icon: '💰', color: '#10B981', desc: 'يمكنك سحبه الآن' },
                  { label: 'محتجز في Escrow',  val: `$${wallet.escrow.toFixed(2)}`,  icon: '🔒', color: '#F59E0B', desc: 'يُحرَّر بعد التأكيد' },
                  { label: 'في فترة الحماية',  val: `$${wallet.pending.toFixed(2)}`, icon: '⏳', color: '#8B5CF6', desc: 'يُحرَّر بعد 72 ساعة' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: '24px', border: '1.5px solid #F1F5F9' }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.val}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>{s.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <Link href="/withdrawal"><button style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>💸 سحب الأرباح</button></Link>
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
}

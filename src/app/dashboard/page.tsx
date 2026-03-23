'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TABS = [
  { id: 'overview', label: 'نظرة عامة', icon: '📊' },
  { id: 'deals', label: 'الصفقات', icon: '🤝' },
  { id: 'listings', label: 'إعلاناتي', icon: '📋' },
  { id: 'wallet', label: 'المحفظة', icon: '💰' },
  { id: 'favorites', label: 'المفضلة', icon: '❤️' },
  { id: 'withdrawal', label: 'السحب', icon: '💸' },
];

const MOCK_DEALS = [
  { id: 'TRD-11234', title: 'قناة يوتيوب تقنية', amount: 12000, status: 'in_escrow', role: 'buyer', partner: 'أحمد يوتيوبر', created_at: '2025-03-20' },
  { id: 'TRD-21345', title: 'اشتراك ChatGPT Plus', amount: 25, status: 'completed', role: 'seller', partner: 'سارة العلي', created_at: '2025-03-18' },
  { id: 'TRD-38456', title: 'حساب انستغرام', amount: 4500, status: 'disputed', role: 'buyer', partner: 'خالد البائع', created_at: '2025-03-15' },
];

const MOCK_LISTINGS = [
  { id: 1, title: 'اشتراك Spotify Premium', type: 'subscription', price: 15, status: 'active', views: 89, favorites: 4 },
  { id: 2, title: 'قالب تصميم Canva Pro', type: 'store', price: 40, status: 'pending', views: 0, favorites: 0 },
  { id: 3, title: 'خدمة مونتاج احترافي', type: 'service', price: 150, status: 'active', views: 234, favorites: 12 },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  in_escrow: { bg: 'rgba(245,158,11,0.1)', color: '#D97706', label: 'في Escrow' },
  completed: { bg: 'rgba(16,185,129,0.1)', color: '#059669', label: 'مكتملة' },
  disputed: { bg: 'rgba(239,68,68,0.1)', color: '#DC2626', label: 'نزاع' },
  pending_payment: { bg: 'rgba(148,163,184,0.1)', color: '#64748B', label: 'انتظار دفع' },
  delivered: { bg: 'rgba(37,99,235,0.1)', color: '#2563EB', label: 'مُسلَّمة' },
  cancelled: { bg: 'rgba(148,163,184,0.1)', color: '#94A3B8', label: 'ملغاة' },
  active: { bg: 'rgba(16,185,129,0.1)', color: '#059669', label: 'نشط' },
  pending: { bg: 'rgba(245,158,11,0.1)', color: '#D97706', label: 'مراجعة' },
  rejected: { bg: 'rgba(239,68,68,0.1)', color: '#DC2626', label: 'مرفوض' },
};

const LISTING_TYPES: Record<string, string> = {
  social: '📱 سوشيال ميديا', asset: '💎 أصول رقمية', store: '🛒 منتج رقمي',
  subscription: '⭐ اشتراك', service: '⚡ خدمة',
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const user = { display_name: 'أحمد محمد', username: 'ahmed_2025', role: 'user', rating: 4.8, total_deals: 5 };
  const wallet = { balance: 235.50, escrow: 12000, total_earned: 1250 };

  const activeDeals = MOCK_DEALS.filter(d => d.status === 'in_escrow' || d.status === 'delivered').length;
  const completedDeals = MOCK_DEALS.filter(d => d.status === 'completed').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

          {/* Welcome */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>
                مرحباً، {user.display_name}! 👋
              </h1>
              <div style={{ fontSize: 14, color: '#64748B' }}>هذه لوحة تحكمك الشخصية</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/listings/create">
                <button id="add-listing-btn" style={{ padding: '14px 28px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 8px 20px rgba(30,58,138,0.25)' }}>
                  + نشر إعلان جديد
                </button>
              </Link>
              <Link href="/withdrawal">
                <button id="withdraw-btn" style={{ padding: '14px 24px', border: '1.5px solid #10B981', borderRadius: 14, background: 'rgba(16,185,129,0.06)', color: '#10B981', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  💸 سحب أموال
                </button>
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'start' }}>

            {/* Sidebar */}
            <div>
              {/* Avatar */}
              <div style={{ background: 'white', borderRadius: 20, padding: 20, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 16 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #1E3A8A, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 32, margin: '0 auto 12px' }}>
                  {user.display_name.charAt(0)}
                </div>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>{user.display_name}</div>
                <div style={{ color: '#94A3B8', fontSize: 13 }}>@{user.username}</div>
                <div style={{ marginTop: 12, padding: '8px 16px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 12, fontWeight: 700 }}>
                  ★ {user.rating} — {user.total_deals} صفقة
                </div>
                <Link href={`/profile/${user.username}`}>
                  <button style={{ width: '100%', marginTop: 12, padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: 'white', color: '#1E3A8A', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    عرض الملف العام
                  </button>
                </Link>
              </div>

              {/* Nav */}
              <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                {TABS.map(tab => (
                  <button key={tab.id} id={`dash-tab-${tab.id}`} onClick={() => setActiveTab(tab.id)}
                    style={{ width: '100%', padding: '14px 16px', border: 'none', background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(30,58,138,0.08), rgba(16,185,129,0.05))' : 'white', color: activeTab === tab.id ? '#1E3A8A' : '#64748B', fontWeight: activeTab === tab.id ? 800 : 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', gap: 10, borderRight: activeTab === tab.id ? '3px solid #1E3A8A' : '3px solid transparent', textAlign: 'right' }}>
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              {activeTab === 'overview' && (
                <>
                  {/* Quick stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                    {[
                      { label: 'رصيد المحفظة', value: `$${wallet.balance}`, icon: '💵', color: '#10B981', sub: 'متاح للسحب' },
                      { label: 'في Escrow', value: `$${wallet.escrow.toLocaleString()}`, icon: '🔒', color: '#F59E0B', sub: 'محتجز' },
                      { label: 'صفقات نشطة', value: activeDeals, icon: '🤝', color: '#2563EB', sub: 'جارية' },
                      { label: 'مكتملة', value: completedDeals, icon: '✅', color: '#8B5CF6', sub: 'هذا الشهر' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent deals */}
                  <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>آخر الصفقات</h2>
                      <button id="see-all-deals" onClick={() => setActiveTab('deals')} style={{ fontSize: 13, color: '#1E3A8A', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>عرض الكل</button>
                    </div>
                    {MOCK_DEALS.map(deal => {
                      const st = STATUS_COLORS[deal.status] || STATUS_COLORS.pending;
                      return (
                        <Link key={deal.id} href={`/deals/${deal.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{deal.title}</div>
                              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                                {deal.id} · {deal.role === 'buyer' ? '🛒 مشتري' : '🏪 بائع'} · مع {deal.partner}
                              </div>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: 16, fontWeight: 900, color: '#1E3A8A' }}>${deal.amount.toLocaleString()}</div>
                              <span style={{ padding: '3px 10px', borderRadius: 100, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700 }}>
                                {st.label}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}

              {activeTab === 'deals' && (
                <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>صفقاتي</h2>
                  {MOCK_DEALS.map(deal => {
                    const st = STATUS_COLORS[deal.status] || STATUS_COLORS.pending;
                    return (
                      <Link key={deal.id} href={`/deals/${deal.id}`} style={{ textDecoration: 'none' }}>
                        <div id={`deal-row-${deal.id}`} style={{ padding: 18, marginBottom: 12, borderRadius: 16, border: '1.5px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#1E3A8A'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{deal.title}</div>
                            <div style={{ fontSize: 12, color: '#94A3B8' }}>#{deal.id} · {deal.role === 'buyer' ? 'مشتري' : 'بائع'} · {deal.partner} · {deal.created_at}</div>
                          </div>
                          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#1E3A8A' }}>${deal.amount.toLocaleString()}</div>
                            <span style={{ padding: '4px 12px', borderRadius: 100, background: st.bg, color: st.color, fontSize: 12, fontWeight: 700 }}>{st.label}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {activeTab === 'listings' && (
                <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>إعلاناتي</h2>
                    <Link href="/listings/create">
                      <button style={{ padding: '10px 20px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        + إضافة إعلان
                      </button>
                    </Link>
                  </div>
                  {MOCK_LISTINGS.map(l => {
                    const st = STATUS_COLORS[l.status] || STATUS_COLORS.pending;
                    return (
                      <div key={l.id} id={`my-listing-${l.id}`} style={{ padding: 16, marginBottom: 12, borderRadius: 14, border: '1.5px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{l.title}</div>
                          <div style={{ fontSize: 12, color: '#94A3B8' }}>{LISTING_TYPES[l.type]} · 👁️ {l.views} مشاهدة · ❤️ {l.favorites}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#1E3A8A' }}>${l.price}</div>
                          <span style={{ padding: '4px 12px', borderRadius: 100, background: st.bg, color: st.color, fontSize: 12, fontWeight: 700 }}>{st.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'wallet' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    {[
                      { label: 'الرصيد المتاح', value: `$${wallet.balance}`, icon: '💵', color: '#10B981', desc: 'يمكن سحبه الآن' },
                      { label: 'في Escrow', value: `$${wallet.escrow.toLocaleString()}`, icon: '🔒', color: '#F59E0B', desc: 'محجوز في صفقات' },
                      { label: 'إجمالي الأرباح', value: `$${wallet.total_earned.toLocaleString()}`, icon: '📈', color: '#8B5CF6', desc: 'منذ التسجيل' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'white', borderRadius: 18, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{s.label}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>{s.desc}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>طلب سحب</h3>
                    <div style={{ display: 'grid', gap: 12 }}>
                      <input id="withdrawal-amount" type="number" placeholder="المبلغ ($)" style={{ padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }} />
                      <select id="withdrawal-method" style={{ padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', background: 'white' }}>
                        <option value="">اختر طريقة السحب</option>
                        <option value="bank">تحويل بنكي</option>
                        <option value="paypal">PayPal</option>
                        <option value="usdt">USDT</option>
                        <option value="wise">Wise</option>
                      </select>
                      <input id="withdrawal-account" placeholder="تفاصيل الحساب (رقم IBAN أو EMAIL...)" style={{ padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }} />
                      <button id="submit-withdrawal" style={{ padding: '14px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #10B981, #2563EB)', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        💸 إرسال طلب السحب
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'favorites' && (
                <div style={{ background: 'white', borderRadius: 20, padding: '60px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>❤️</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>لا توجد مفضلة بعد</div>
                  <div style={{ color: '#64748B', marginBottom: 24 }}>ابدأ بتصفح الإعلانات وحفظ ما يعجبك</div>
                  <Link href="/social-accounts">
                    <button style={{ padding: '13px 28px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                      تصفح الإعلانات
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

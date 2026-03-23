'use client';
import { useState } from 'react';
import Link from 'next/link';

const ADMIN_NAV = [
  { id: 'dashboard', icon: '📊', label: 'لوحة التحكم' },
  { id: 'users', icon: '👥', label: 'المستخدمون' },
  { id: 'listings', icon: '📋', label: 'الإعلانات' },
  { id: 'deals', icon: '🤝', label: 'الصفقات' },
  { id: 'disputes', icon: '⚖️', label: 'النزاعات', badge: 4 },
  { id: 'verifications', icon: '✅', label: 'التوثيق', badge: 12 },
  { id: 'payments', icon: '💳', label: 'المدفوعات' },
  { id: 'categories', icon: '🗂️', label: 'التصنيفات' },
  { id: 'settings', icon: '⚙️', label: 'الإعدادات' },
];

const USERS_DATA = [
  { id: 1, name: 'محمد أحمد', email: 'mohammed@email.com', role: 'user', status: 'active', deals: 24, joined: '2024-01-15', verified: true, rating: 4.9 },
  { id: 2, name: 'سارة الأحمدي', email: 'sarah@email.com', role: 'user', status: 'active', deals: 8, joined: '2024-03-10', verified: false, rating: 4.7 },
  { id: 3, name: 'خالد العمري', email: 'khalid@email.com', role: 'user', status: 'suspended', deals: 45, joined: '2023-09-05', verified: true, rating: 4.2 },
  { id: 4, name: 'نورة القحطاني', email: 'noura@email.com', role: 'user', status: 'active', deals: 3, joined: '2025-01-20', verified: false, rating: 5.0 },
];

const DISPUTES_DATA = [
  { id: 'DSP-001', title: 'عدم تسليم قناة يوتيوب', deal: 'TRD-1220', amount: 52000, buyer: 'خالد.ر', seller: 'أحمد.ع', status: 'open', opened: '15 مارس 2025' },
  { id: 'DSP-002', title: 'اشتراك منتهي الصلاحية', deal: 'TRD-1199', amount: 120, buyer: 'محمد.ع', seller: 'سارة.م', status: 'under_review', opened: '12 مارس 2025' },
  { id: 'DSP-003', title: 'الحساب ليس كما وصف', deal: 'TRD-1180', amount: 3200, buyer: 'نورة.ف', seller: 'خالد.ر', status: 'resolved_buyer', opened: '5 مارس 2025' },
];

const DEALS_DATA = [
  { id: 'TRD-11234', title: 'قناة يوتيوب تقنية 120K', buyer: 'محمد أحمد', seller: 'أحمد يوتيوبر', amount: 12000, status: 'in_escrow', created: '2025-03-20' },
  { id: 'TRD-21345', title: 'اشتراك ChatGPT Plus', buyer: 'سارة العلي', seller: 'خالد البائع', amount: 25, status: 'completed', created: '2025-03-18' },
  { id: 'TRD-38456', title: 'حساب انستغرام أزياء', buyer: 'نورة محمد', seller: 'ريم المصممة', amount: 4500, status: 'disputed', created: '2025-03-15' },
  { id: 'TRD-44567', title: 'خدمة مونتاج شهري', buyer: 'عبدالله سالم', seller: 'محمد المونتير', amount: 200, status: 'in_delivery', created: '2025-03-14' },
];

const WITHDRAWALS_DATA = [
  { id: 'WD-001', user: 'أحمد يوتيوبر', amount: 3200, method: 'bank', account: 'IBAN SA000...', status: 'pending', requested: '2025-03-21' },
  { id: 'WD-002', user: 'خالد البائع', amount: 500, method: 'paypal', account: 'khalid@paypal.com', status: 'pending', requested: '2025-03-20' },
  { id: 'WD-003', user: 'ريم المصممة', amount: 1200, method: 'usdt', account: 'TRX...abc123', status: 'paid', requested: '2025-03-18' },
];

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [userAction, setUserAction] = useState<{ id: number; action: string } | null>(null);
  const [disputeAction, setDisputeAction] = useState<string | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Header */}
      <header style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 64, gap: 20 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #2563EB, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔁</div>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>Trust🔁Deal</div>
              <div style={{ color: '#EF4444', fontSize: 11, fontWeight: 700 }}>لوحة الإدارة</div>
            </div>
          </Link>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: '5px 14px', borderRadius: 100, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 12, fontWeight: 700 }}>🔴 Admin</div>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>← الموقع</button>
            </Link>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ width: 220, background: '#1E293B', borderLeft: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, padding: '16px 8px' }}>
          {ADMIN_NAV.map(item => (
            <button id={`admin-nav-${item.id}`} key={item.id} onClick={() => setActiveSection(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontFamily: 'Tajawal, sans-serif', fontSize: 13, fontWeight: 600,
                marginBottom: 4, transition: 'all 0.2s', position: 'relative',
                background: activeSection === item.id ? 'rgba(37,99,235,0.15)' : 'transparent',
                color: activeSection === item.id ? '#2563EB' : 'rgba(255,255,255,0.55)',
              }}>
              <span style={{ fontSize: 17 }}>{item.icon}</span>
              {item.label}
              {item.badge && (
                <span style={{ marginRight: 'auto', padding: '2px 7px', borderRadius: 100, background: '#EF4444', color: 'white', fontSize: 11, fontWeight: 700 }}>{item.badge}</span>
              )}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
          {activeSection === 'dashboard' && (
            <>
              <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, marginBottom: 8 }}>لوحة تحكم الإدارة</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32 }}>نظرة عامة على منصة Trust🔁Deal</p>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 32 }}>
                {[
                  { icon: '👥', label: 'إجمالي المستخدمين', val: '52,840', change: '+124 اليوم', color: '#2563EB' },
                  { icon: '📋', label: 'الإعلانات النشطة', val: '18,320', change: '+45 اليوم', color: '#10B981' },
                  { icon: '🤝', label: 'الصفقات المكتملة', val: '124,500', change: '+89 اليوم', color: '#F59E0B' },
                  { icon: '💰', label: 'الإيراد الكلي', val: '$245,800', change: '+$3,200 اليوم', color: '#8B5CF6' },
                  { icon: '⚖️', label: 'نزاعات مفتوحة', val: '4', change: '⚠️ تحتاج مراجعة', color: '#EF4444' },
                  { icon: '⏳', label: 'انتظار التوثيق', val: '12', change: '🔔 طلبات جديدة', color: '#F97316' },
                ].map((kpi, i) => (
                  <div key={i} style={{ padding: '20px', borderRadius: 16, background: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{kpi.icon}</div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 4 }}>{kpi.val}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{kpi.label}</div>
                    <div style={{ fontSize: 11, color: kpi.color }}>{kpi.change}</div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>⚖️ النزاعات الأخيرة</span>
                  </div>
                  {DISPUTES_DATA.slice(0, 2).map(d => (
                    <div key={d.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ color: 'white', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{d.title}</div>
                          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{d.deal} · ${d.amount.toLocaleString('en-US')}</div>
                        </div>
                        <button id={`admin-dispute-review-${d.id}`} onClick={() => { setActiveSection('disputes'); setDisputeAction(d.id); }}
                          style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                          مراجعة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>📊 إحصائيات الأسبوع</span>
                  </div>
                  <div style={{ padding: '20px' }}>
                    {[
                      { label: 'مستخدمون جدد', val: 847, max: 1000, color: '#2563EB' },
                      { label: 'صفقات مكتملة', val: 623, max: 800, color: '#10B981' },
                      { label: 'إيراد العمولة', val: 8420, max: 10000, color: '#F59E0B' },
                    ].map((stat, i) => (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{stat.label}</span>
                          <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{stat.val.toLocaleString('en-US')}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.08)' }}>
                          <div style={{ height: '100%', borderRadius: 6, background: stat.color, width: `${(stat.val / stat.max) * 100}%`, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'users' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900 }}>إدارة المستخدمين</h1>
                <input id="user-search" placeholder="🔍 بحث عن مستخدم..." style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', width: 260 }} />
              </div>
              <div style={{ background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['المستخدم', 'البريد', 'الصفقات', 'التقييم', 'الحالة', 'التوثيق', 'الإجراءات'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {USERS_DATA.map(user => (
                      <tr key={user.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👤</div>
                            <div>
                              <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{user.name}</div>
                              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>انضم {user.joined}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{user.email}</td>
                        <td style={{ padding: '14px 16px', color: 'white', fontSize: 14, fontWeight: 700 }}>{user.deals}</td>
                        <td style={{ padding: '14px 16px', color: '#F59E0B', fontSize: 13, fontWeight: 700 }}>★ {user.rating}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 100, background: user.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: user.status === 'active' ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                            {user.status === 'active' ? 'نشط' : 'موقوف'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 11, color: user.verified ? '#10B981' : 'rgba(255,255,255,0.3)' }}>
                            {user.verified ? '✅ موثق' : '⏳ غير موثق'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button id={`admin-view-user-${user.id}`} style={{ padding: '5px 12px', background: 'rgba(37,99,235,0.15)', border: 'none', borderRadius: 7, color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>عرض</button>
                            <button id={`admin-suspend-user-${user.id}`} onClick={() => setUserAction({ id: user.id, action: user.status === 'active' ? 'suspend' : 'activate' })}
                              style={{ padding: '5px 12px', background: user.status === 'active' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', border: 'none', borderRadius: 7, color: user.status === 'active' ? '#EF4444' : '#10B981', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                              {user.status === 'active' ? 'إيقاف' : 'تفعيل'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSection === 'disputes' && (
            <>
              <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, marginBottom: 24 }}>إدارة النزاعات</h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {DISPUTES_DATA.map(d => (
                  <div key={d.id} style={{ background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ color: 'white', fontSize: 16, fontWeight: 800 }}>{d.title}</span>
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: d.status === 'open' ? 'rgba(239,68,68,0.15)' : d.status === 'under_review' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: d.status === 'open' ? '#EF4444' : d.status === 'under_review' ? '#F59E0B' : '#10B981', fontWeight: 700 }}>
                              {d.status === 'open' ? 'مفتوح' : d.status === 'under_review' ? 'قيد المراجعة' : 'محلول'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                            <span>📋 {d.deal}</span>
                            <span>💰 ${d.amount.toLocaleString('en-US')}</span>
                            <span>🛒 المشتري: {d.buyer}</span>
                            <span>🏷️ البائع: {d.seller}</span>
                            <span>📅 {d.opened}</span>
                          </div>
                        </div>
                        {d.status !== 'resolved_buyer' && (
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button id={`release-seller-${d.id}`} style={{ padding: '9px 18px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, color: '#10B981', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                              ✅ للبائع
                            </button>
                            <button id={`refund-buyer-${d.id}`} style={{ padding: '9px 18px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 10, color: '#2563EB', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                              🔄 للمشتري
                            </button>
                            <button id={`partial-${d.id}`} style={{ padding: '9px 18px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, color: '#F59E0B', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                              ⚖️ جزئي
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === 'deals' && (
            <>
              <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, marginBottom: 24 }}>إدارة الصفقات</h1>
              <div style={{ background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['رقم الصفقة', 'الإعلان', 'المشتري', 'البائع', 'المبلغ', 'الحالة', 'الإجراءات'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEALS_DATA.map(d => {
                      const colors: Record<string, { bg: string; c: string; label: string }> = {
                        in_escrow: { bg: 'rgba(245,158,11,0.15)', c: '#F59E0B', label: 'في Escrow' },
                        completed: { bg: 'rgba(16,185,129,0.15)', c: '#10B981', label: 'مكتملة' },
                        disputed: { bg: 'rgba(239,68,68,0.15)', c: '#EF4444', label: 'نزاع' },
                        in_delivery: { bg: 'rgba(37,99,235,0.15)', c: '#2563EB', label: 'تسليم' },
                      };
                      const st = colors[d.status] || colors.completed;
                      return (
                        <tr key={d.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px 16px', color: '#2563EB', fontSize: 13, fontWeight: 700 }}>{d.id}</td>
                          <td style={{ padding: '12px 16px', color: 'white', fontSize: 13 }}>{d.title}</td>
                          <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{d.buyer}</td>
                          <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{d.seller}</td>
                          <td style={{ padding: '12px 16px', color: '#10B981', fontSize: 14, fontWeight: 800 }}>${d.amount.toLocaleString('en-US')}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 100, background: st.bg, color: st.c, fontWeight: 700 }}>{st.label}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {d.status === 'in_escrow' && <button id={`admin-force-complete-${d.id}`} style={{ padding: '5px 10px', background: 'rgba(16,185,129,0.15)', border: 'none', borderRadius: 7, color: '#10B981', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إتمام</button>}
                              {['in_escrow', 'in_delivery'].includes(d.status) && <button id={`admin-force-cancel-${d.id}`} style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 7, color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSection === 'payments' && (
            <>
              <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, marginBottom: 24 }}>طلبات السحب</h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {WITHDRAWALS_DATA.map(w => (
                  <div key={w.id} style={{ background: '#1E293B', borderRadius: 16, padding: '18px 24px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <div style={{ color: 'white', fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{w.user}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{w.id} · {w.method.toUpperCase()} · {w.account} · {w.requested}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981' }}>${w.amount.toLocaleString('en-US')}</div>
                      {w.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button id={`approve-wd-${w.id}`} style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, color: '#10B981', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>✓ قبول</button>
                          <button id={`reject-wd-${w.id}`} style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#EF4444', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>✕ رفض</button>
                        </div>
                      ) : (
                        <span style={{ padding: '6px 14px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 12, fontWeight: 700 }}>✓ تم التحويل</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!['dashboard', 'users', 'disputes', 'deals', 'payments'].includes(activeSection) && (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>{ADMIN_NAV.find(n => n.id === activeSection)?.icon}</div>
              <div style={{ color: 'white', fontSize: 24, fontWeight: 800 }}>{ADMIN_NAV.find(n => n.id === activeSection)?.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginTop: 10 }}>هذا القسم في مرحلة التطوير</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

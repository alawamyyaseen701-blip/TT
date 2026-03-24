'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ADMIN_NAV = [
  { id: 'dashboard', icon: '📊', label: 'لوحة التحكم' },
  { id: 'users',    icon: '👥', label: 'المستخدمون' },
  { id: 'listings', icon: '📋', label: 'الإعلانات' },
  { id: 'deals',    icon: '🤝', label: 'الصفقات' },
  { id: 'disputes', icon: '⚖️', label: 'النزاعات' },
  { id: 'payments', icon: '💳', label: 'طلبات السحب' },
  { id: 'settings', icon: '⚙️', label: 'الإعدادات' },
];

const STATUS_COLORS: Record<string, { bg: string; c: string; label: string }> = {
  active:          { bg: 'rgba(16,185,129,0.15)',  c: '#10B981', label: 'نشط' },
  suspended:       { bg: 'rgba(239,68,68,0.15)',   c: '#EF4444', label: 'موقوف' },
  in_escrow:       { bg: 'rgba(245,158,11,0.15)',  c: '#F59E0B', label: 'Escrow' },
  completed:       { bg: 'rgba(16,185,129,0.15)',  c: '#10B981', label: 'مكتملة' },
  disputed:        { bg: 'rgba(239,68,68,0.15)',   c: '#EF4444', label: 'نزاع' },
  in_delivery:     { bg: 'rgba(37,99,235,0.15)',   c: '#2563EB', label: 'تسليم' },
  cancelled:       { bg: 'rgba(100,116,139,0.15)', c: '#64748B', label: 'ملغاة' },
  pending:         { bg: 'rgba(245,158,11,0.15)',  c: '#F59E0B', label: 'انتظار' },
  open:            { bg: 'rgba(239,68,68,0.15)',   c: '#EF4444', label: 'مفتوح' },
  under_review:    { bg: 'rgba(245,158,11,0.15)',  c: '#F59E0B', label: 'مراجعة' },
  resolved_buyer:  { bg: 'rgba(16,185,129,0.15)',  c: '#10B981', label: 'حُسم للمشتري' },
  resolved_seller: { bg: 'rgba(16,185,129,0.15)',  c: '#10B981', label: 'حُسم للبائع' },
  paid:            { bg: 'rgba(16,185,129,0.15)',  c: '#10B981', label: 'تم الدفع' },
  pending_payment: { bg: 'rgba(100,116,139,0.15)', c: '#94A3B8', label: 'انتظار دفع' },
  payment_sent:    { bg: 'rgba(245,158,11,0.2)',  c: '#FBBF24', label: 'دفعة أُرسلت ⏳' },
  approved:        { bg: 'rgba(16,185,129,0.15)',  c: '#10B981', label: 'موافق عليه' },
  rejected:        { bg: 'rgba(239,68,68,0.15)',   c: '#EF4444', label: 'مرفوض' },
};

function Badge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || { bg: 'rgba(100,116,139,0.15)', c: '#94A3B8', label: status };
  return <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 100, background: s.bg, color: s.c, fontWeight: 700, whiteSpace: 'nowrap' }}>{s.label}</span>;
}

function StatCard({ icon, label, val, color, sub }: { icon: string; label: string; val: string | number; color: string; sub?: string }) {
  return (
    <div style={{ padding: 20, borderRadius: 16, background: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 4 }}>{val}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [token, setToken] = useState('');

  // Data states
  const [stats, setStats] = useState({ users: 0, listings: 0, deals: 0, disputes: 0, withdrawals: 0, revenue: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [withdrawals,      setWithdrawals]      = useState<any[]>([]);
  const [walletRequests,   setWalletRequests]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const apiFetch = async (url: string, opts: RequestInit = {}) => {
    const t = localStorage.getItem('token');
    return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}`, ...(opts.headers || {}) } });
  };

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!t || !u) return router.replace('/auth/login');
    const user = JSON.parse(u);
    if (user.role !== 'admin') return router.replace('/');
    setToken(t);
    loadAll(t);
  }, []);

  const loadAll = async (t: string) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${t}` };
      const [usersRes, listingsRes, dealsRes, disputesRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/listings?limit=50', { headers }),
        fetch('/api/admin/deals', { headers }),
        fetch('/api/admin/disputes', { headers }),
      ]);
      const [ud, ld, dd, disd] = await Promise.all([usersRes.json(), listingsRes.json(), dealsRes.json(), disputesRes.json()]);

      const userList   = ud.success   ? ud.data.users    || [] : [];
      const listList   = ld.success   ? ld.data.listings  || [] : [];
      const dealList   = dd.success   ? dd.data.deals     || [] : [];
      const dispList   = disd.success ? disd.data.disputes|| [] : [];

      setUsers(userList);
      setListings(listList);
      setDeals(dealList);
      setDisputes(dispList);

      const walletRes = await fetch('/api/admin/wallet?status=pending', { headers });
      const wd = await walletRes.json();
      const wRequests = wd.success ? wd.data.requests || [] : [];
      setWalletRequests(wRequests);

      const pending_deals = dealList.filter((d:any) => ['pending_payment','payment_sent'].includes(d.status)).length;
      const revenue = dealList.filter((d:any) => d.status === 'completed').reduce((sum:number, d:any) => sum + (d.amount * 0.05), 0);

      setStats({
        users: userList.length,
        listings: listList.length,
        deals: dealList.length,
        disputes: dispList.filter((d:any) => d.status === 'open').length,
        withdrawals: pending_deals + wRequests.length,
        revenue: Math.round(revenue),
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const adminAction = async (endpoint: string, body: object, successMsg: string) => {
    try {
      const res = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
      const d = await res.json();
      if (d.success) { showToast('✅ ' + successMsg); loadAll(localStorage.getItem('token') || ''); }
      else showToast('❌ ' + (d.error || 'حدث خطأ'));
    } catch { showToast('❌ خطأ في الاتصال'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', flexDirection: 'column', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}

      {/* Admin Header */}
      <header style={{ background: 'rgba(15,23,42,0.98)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 64, gap: 20 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #2563EB, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔁</div>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>Trust🔁Deal</div>
              <div style={{ color: '#EF4444', fontSize: 11, fontWeight: 700 }}>لوحة الإدارة</div>
            </div>
          </Link>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            <button key={item.id} id={`admin-nav-${item.id}`} onClick={() => setActiveSection(item.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: 13, fontWeight: 600, marginBottom: 4, transition: 'all 0.2s', background: activeSection === item.id ? 'rgba(37,99,235,0.15)' : 'transparent', color: activeSection === item.id ? '#60A5FA' : 'rgba(255,255,255,0.55)' }}>
              <span style={{ fontSize: 17 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: 32, overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <div>جاري تحميل البيانات من Firebase...</div>
            </div>
          ) : (
            <>
              {/* ── DASHBOARD ── */}
              {activeSection === 'dashboard' && (
                <>
                  <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, marginBottom: 8 }}>لوحة تحكم الإدارة</h1>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32 }}>بيانات حقيقية من Firebase — Trust🔁Deal</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 32 }}>
                    <StatCard icon="👥" label="إجمالي المستخدمين" val={stats.users} color="#2563EB" />
                    <StatCard icon="📋" label="الإعلانات النشطة"  val={stats.listings} color="#10B981" />
                    <StatCard icon="🤝" label="إجمالي الصفقات"     val={stats.deals} color="#F59E0B" />
                    <StatCard icon="💰" label="إيراد العمولة (5%)" val={`$${stats.revenue.toLocaleString('en-US')}`} color="#8B5CF6" />
                    <StatCard icon="⚖️" label="نزاعات مفتوحة"     val={stats.disputes} color="#EF4444" sub={stats.disputes > 0 ? '⚠️ تحتاج مراجعة' : '✅ لا يوجد'} />
                    <StatCard icon="⏳" label="صفقات في Escrow"   val={stats.withdrawals} color="#F97316" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {/* Recent Disputes */}
                    <div style={{ background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>⚖️ آخر النزاعات</span>
                      </div>
                      {disputes.length === 0 ? (
                        <div style={{ padding: 24, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: 13 }}>✅ لا توجد نزاعات</div>
                      ) : disputes.slice(0, 3).map(d => (
                        <div key={d.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ color: 'white', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{d.reason || d.title || 'بدون عنوان'}</div>
                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>${(d.amount || 0).toLocaleString('en-US')}</div>
                          </div>
                          <Badge status={d.status} />
                        </div>
                      ))}
                    </div>

                    {/* Recent Deals */}
                    <div style={{ background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>🤝 آخر الصفقات</span>
                      </div>
                      {deals.length === 0 ? (
                        <div style={{ padding: 24, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: 13 }}>لا توجد صفقات بعد</div>
                      ) : deals.slice(0, 4).map(d => (
                        <div key={d.id} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{d.listing_title || d.id.slice(0, 12)}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: '#10B981', fontWeight: 700 }}>${(d.amount || 0).toLocaleString('en-US')}</span>
                            <Badge status={d.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── USERS ── */}
              {activeSection === 'users' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900 }}>إدارة المستخدمين <span style={{ color: '#10B981', fontSize: 16 }}>({users.length})</span></h1>
                  </div>
                  {users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>لا يوجد مستخدمون بعد</div>
                  ) : (
                    <div style={{ background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                            {['المستخدم', 'البريد', 'الحالة', 'الدور', 'التقييم', 'الإجراءات'].map(h => (
                              <th key={h} style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {users.map(user => (
                            <tr key={user.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14 }}>
                                    {(user.display_name || user.username || '?').charAt(0)}
                                  </div>
                                  <div>
                                    <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{user.display_name || user.username}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>@{user.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{user.email}</td>
                              <td style={{ padding: '14px 16px' }}><Badge status={user.status || 'active'} /></td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: user.role === 'admin' ? 'rgba(239,68,68,0.15)' : 'rgba(30,58,138,0.2)', color: user.role === 'admin' ? '#EF4444' : '#60A5FA', fontWeight: 700 }}>{user.role || 'user'}</span>
                              </td>
                              <td style={{ padding: '14px 16px', color: '#F59E0B', fontSize: 13, fontWeight: 700 }}>★ {(user.rating || 0).toFixed(1)}</td>
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <Link href={`/profile/${user.username}`} target="_blank" style={{ textDecoration: 'none' }}>
                                    <button style={{ padding: '5px 10px', background: 'rgba(37,99,235,0.15)', border: 'none', borderRadius: 7, color: '#60A5FA', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>عرض</button>
                                  </Link>
                                  {user.role !== 'admin' && (
                                    <button id={`admin-suspend-${user.id}`} onClick={() => adminAction('/api/admin/users', { userId: user.id, action: user.status === 'suspended' ? 'activate' : 'suspend' }, user.status === 'suspended' ? 'تم تفعيل الحساب' : 'تم إيقاف الحساب')}
                                      style={{ padding: '5px 10px', background: user.status === 'suspended' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 7, color: user.status === 'suspended' ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                                      {user.status === 'suspended' ? 'تفعيل' : 'إيقاف'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* ── LISTINGS ── */}
              {activeSection === 'listings' && (
                <>
                  <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, marginBottom: 24 }}>الإعلانات <span style={{ color: '#10B981', fontSize: 16 }}>({listings.length})</span></h1>
                  {listings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>لا توجد إعلانات بعد</div>
                  ) : (
                    <div style={{ background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                            {['العنوان', 'النوع', 'السعر', 'الحالة', 'الإجراءات'].map(h => (
                              <th key={h} style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {listings.map(l => (
                            <tr key={l.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '12px 16px', color: 'white', fontSize: 13, fontWeight: 600, maxWidth: 200 }}>{l.title}</td>
                              <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{l.type} {l.platform && `/ ${l.platform}`}</td>
                              <td style={{ padding: '12px 16px', color: '#10B981', fontWeight: 800 }}>${(l.price || 0).toLocaleString('en-US')}</td>
                              <td style={{ padding: '12px 16px' }}><Badge status={l.status} /></td>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <Link href={`/listings/${l.id}`} target="_blank" style={{ textDecoration: 'none' }}>
                                    <button style={{ padding: '5px 10px', background: 'rgba(37,99,235,0.15)', border: 'none', borderRadius: 7, color: '#60A5FA', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>عرض</button>
                                  </Link>
                                  <button id={`admin-del-listing-${l.id}`} onClick={() => adminAction('/api/admin/listings', { listingId: l.id, action: 'delete' }, 'تم حذف الإعلان')}
                                    style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 7, color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>حذف</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* ── DEALS ── */}
              {activeSection === 'deals' && (
                <>
                  <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, marginBottom: 24 }}>الصفقات <span style={{ color: '#10B981', fontSize: 16 }}>({deals.length})</span></h1>
                  {deals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>لا توجد صفقات بعد</div>
                  ) : (
                    <div style={{ background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                            {['ID', 'الإعلان', 'المبلغ', 'الحالة', 'الإجراءات'].map(h => (
                              <th key={h} style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {deals.map(d => (
                             <tr key={d.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '12px 16px', color: '#60A5FA', fontSize: 12, fontFamily: 'monospace' }}>{d.id.slice(0, 12)}</td>
                              <td style={{ padding: '12px 16px', color: 'white', fontSize: 13 }}>{d.listing_title || 'صفقة'}</td>
                              <td style={{ padding: '12px 16px', color: '#10B981', fontSize: 14, fontWeight: 800 }}>${(d.amount || 0).toLocaleString('en-US')}</td>
                              <td style={{ padding: '12px 16px' }}><Badge status={d.status} /></td>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {/* Admin confirms buyer's payment → in_escrow */}
                                  {['pending_payment', 'payment_sent'].includes(d.status) && (
                                    <button id={`admin-approve-pay-${d.id}`}
                                      onClick={async () => {
                                        const res = await apiFetch(`/api/deals/${d.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'approve_payment' }) });
                                        const data = await res.json();
                                        if (data.success) { showToast('✅ تم تأكيد الدفع — الصفقة نشطة'); loadAll(localStorage.getItem('token') || ''); }
                                        else showToast('❌ ' + (data.error || 'خطأ'));
                                      }}
                                      style={{ padding: '5px 12px', background: 'rgba(245,158,11,0.2)', border: '1px solid #F59E0B', borderRadius: 7, color: '#FBBF24', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                                      ✅ تأكيد الدفع
                                    </button>
                                  )}
                                  {d.status === 'in_escrow' && <>
                                    <button id={`admin-complete-${d.id}`} onClick={() => adminAction('/api/admin/deals', { dealId: d.id, action: 'complete' }, 'تم إتمام الصفقة')} style={{ padding: '5px 10px', background: 'rgba(16,185,129,0.15)', border: 'none', borderRadius: 7, color: '#10B981', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إتمام</button>
                                    <button id={`admin-cancel-${d.id}`} onClick={() => adminAction('/api/admin/deals', { dealId: d.id, action: 'cancel' }, 'تم إلغاء الصفقة')} style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 7, color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
                                  </>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* ── DISPUTES ── */}
              {activeSection === 'disputes' && (
                <>
                  <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, marginBottom: 24 }}>النزاعات <span style={{ color: '#EF4444', fontSize: 16 }}>({disputes.length})</span></h1>
                  {disputes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                      <div>لا توجد نزاعات — المنصة تعمل بسلام</div>
                    </div>
                  ) : disputes.map(d => (
                    <div key={d.id} style={{ background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ color: 'white', fontSize: 15, fontWeight: 800 }}>{d.reason || 'نزاع'}</span>
                            <Badge status={d.status} />
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                            💰 ${(d.amount || 0).toLocaleString('en-US')} · 📋 {d.deal_id?.slice(0, 12) || '–'}
                          </div>
                        </div>
                        {d.status === 'open' && (
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button id={`resolve-seller-${d.id}`} onClick={() => adminAction('/api/admin/disputes', { disputeId: d.id, action: 'resolve_seller' }, 'تم الحسم للبائع')} style={{ padding: '9px 18px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, color: '#10B981', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>✅ للبائع</button>
                            <button id={`resolve-buyer-${d.id}`} onClick={() => adminAction('/api/admin/disputes', { disputeId: d.id, action: 'resolve_buyer' }, 'تم الحسم للمشتري')} style={{ padding: '9px 18px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 10, color: '#2563EB', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>🔄 للمشتري</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {activeSection === 'payments' && (
                <>
                  <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, marginBottom: 8 }}>💳 إدارة الدفعات والسحوبات</h1>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>طلبات الإيداع والسحب من المستخدمين — تحقق من كل طلب قبل الموافقة</p>

                  {walletRequests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                      <div>لا توجد طلبات معلقة</div>
                    </div>
                  ) : walletRequests.map((r: any) => {
                    const isDeposit = r.type === 'deposit';
                    return (
                      <div key={r.id} style={{ background: '#1E293B', borderRadius: 16, border: `1px solid ${isDeposit ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, padding: '20px 24px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <span style={{ fontSize: 20 }}>{isDeposit ? '⬇️' : '⬆️'}</span>
                              <span style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>
                                {isDeposit ? 'طلب إيداع' : 'طلب سحب'} — {r.username}
                              </span>
                              <span style={{ fontSize: 22, fontWeight: 900, color: isDeposit ? '#10B981' : '#EF4444' }}>
                                {isDeposit ? '+' : '-'}${r.amount}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                              <span>📡 {r.method?.replace('_', ' ')}</span>
                              {r.tx_id    && <span>🔑 TxID: <code style={{ color: '#60A5FA' }}>{r.tx_id}</code></span>}
                              {r.address  && <span>📬 العنوان: <code style={{ color: '#FBBF24', wordBreak: 'break-all' }}>{r.address}</code></span>}
                              {r.notes    && <span>📝 {r.notes}</span>}
                              <span>🕐 {new Date(r.created_at).toLocaleString('ar-EG')}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              id={`approve-wallet-${r.id}`}
                              onClick={async () => {
                                const res  = await apiFetch('/api/admin/wallet', { method: 'PATCH', body: JSON.stringify({ requestId: r.id, action: 'approve' }) });
                                const data = await res.json();
                                if (data.success) { showToast(isDeposit ? '✅ تم الإيداع وإضافة الرصيد' : '✅ تم قبول السحب وخصم الرصيد'); loadAll(localStorage.getItem('token') || ''); }
                                else showToast('❌ ' + (data.error || 'خطأ'));
                              }}
                              style={{ padding: '9px 20px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, color: '#10B981', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                              ✅ {isDeposit ? 'تأكيد الإيداع' : 'تأكيد السحب'}
                            </button>
                            <button
                              id={`reject-wallet-${r.id}`}
                              onClick={async () => {
                                const res  = await apiFetch('/api/admin/wallet', { method: 'PATCH', body: JSON.stringify({ requestId: r.id, action: 'reject', adminNote: 'تم الرفض' }) });
                                const data = await res.json();
                                if (data.success) { showToast('❌ تم رفض الطلب'); loadAll(localStorage.getItem('token') || ''); }
                                else showToast('❌ ' + (data.error || 'خطأ'));
                              }}
                              style={{ padding: '9px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#EF4444', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                              ❌ رفض
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* ── SETTINGS ── */}
              {activeSection === 'settings' && (
                <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                  <div style={{ fontSize: 64, marginBottom: 20 }}>⚙️</div>
                  <div style={{ color: 'white', fontSize: 24, fontWeight: 800 }}>إعدادات المنصة</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginTop: 10 }}>قيد التطوير</div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

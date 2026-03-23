'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: '🔍' },
  { id: 'social', label: 'حسابات سوشيال', icon: '📱' },
  { id: 'asset', label: 'أصول رقمية', icon: '💎' },
  { id: 'subscription', label: 'اشتراكات', icon: '⭐' },
  { id: 'service', label: 'خدمات', icon: '⚡' },
  { id: 'store', label: 'منتجات رقمية', icon: '🛒' },
];

const MOCK_REQUESTS = [
  {
    id: 1, title: 'أبحث عن قناة يوتيوب تقنية', category: 'social',
    budget_min: 500, budget_max: 2000, deadline_days: 7,
    offers_count: 4, status: 'open',
    user: { display_name: 'محمد أحمد', rating: 4.8, role: 'verified' },
    created_at: '2025-03-21T10:00:00Z',
    description: 'أبحث عن قناة يوتيوب في مجال التقنية والبرمجة، عدد مشتركين لا يقل عن 50K',
  },
  {
    id: 2, title: 'أريد اشتراك ChatGPT Plus', category: 'subscription',
    budget_min: 20, budget_max: 30, deadline_days: 3,
    offers_count: 9, status: 'open',
    user: { display_name: 'سارة العلي', rating: 4.5, role: 'user' },
    created_at: '2025-03-20T08:00:00Z',
    description: 'أريد اشتراك ChatGPT Plus شهر كامل',
  },
  {
    id: 3, title: 'أبحث عن مونتير محترف للريلز', category: 'service',
    budget_min: 100, budget_max: 300, deadline_days: 14,
    offers_count: 6, status: 'open',
    user: { display_name: 'أحمد سالم', rating: 4.9, role: 'verified' },
    created_at: '2025-03-19T16:00:00Z',
    description: 'أحتاج مونتير يتعامل مع ريلز انستغرام، ٣٠ ريلز شهرياً',
  },
  {
    id: 4, title: 'موقع متجر إلكتروني بالكامل', category: 'asset',
    budget_min: 2000, budget_max: 8000, deadline_days: 30,
    offers_count: 2, status: 'open',
    user: { display_name: 'نورة محمد', rating: 4.7, role: 'user' },
    created_at: '2025-03-18T14:00:00Z',
    description: 'أبحث عن متجر إلكتروني جاهز في مجال الأزياء والملابس',
  },
  {
    id: 5, title: 'قالب تصميم احترافي لسوشيال ميديا', category: 'store',
    budget_min: 50, budget_max: 150, deadline_days: 5,
    offers_count: 11, status: 'open',
    user: { display_name: 'خالد السعيد', rating: 4.6, role: 'user' },
    created_at: '2025-03-17T09:00:00Z',
    description: 'أريد حزمة قوالب كانفا لإنستغرام، أكثر من 50 قالب',
  },
  {
    id: 6, title: 'حساب انستغرام في مجال الطبخ', category: 'social',
    budget_min: 300, budget_max: 1500, deadline_days: 10,
    offers_count: 3, status: 'open',
    user: { display_name: 'ريم الحربي', rating: 5.0, role: 'verified' },
    created_at: '2025-03-16T12:00:00Z',
    description: 'أبحث عن حساب انستغرام في مجال الطبخ والأكل لا يقل عن 30K متابع',
  },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days >= 1) return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
  return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
}

export default function RequestsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'social', budget_min: '', budget_max: '', deadline_days: '7' });

  const filtered = MOCK_REQUESTS.filter(r => activeCategory === 'all' || r.category === activeCategory);

  const catLabel = (cat: string) => CATEGORIES.find(c => c.id === cat)?.label || cat;
  const catIcon = (cat: string) => CATEGORIES.find(c => c.id === cat)?.icon || '📦';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, #0F172A, #1A2040)', padding: '120px 24px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#A78BFA', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                📋 لوحة الطلبات
              </div>
              <h1 style={{ color: 'white', fontWeight: 900, fontSize: 40, marginBottom: 12 }}>
                اطلب ما تريده{' '}
                <span style={{ background: 'linear-gradient(135deg, #8B5CF6, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  والبائعون يأتون إليك
                </span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, maxWidth: 500 }}>
                لم تجد ما تبحث عنه؟ انشر طلبك واستقبل عروضاً من البائعين الموثوقين
              </p>
            </div>
            <button id="open-request-modal" onClick={() => setShowModal(true)}
              style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #8B5CF6, #2563EB)', border: 'none', borderRadius: 16, color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 8px 24px rgba(139,92,246,0.4)' }}>
              + نشر طلب جديد
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, marginTop: 40, flexWrap: 'wrap' }}>
            {[
              { label: 'طلب نشط', value: MOCK_REQUESTS.length, color: '#8B5CF6' },
              { label: 'عرض مقدّم', value: MOCK_REQUESTS.reduce((s, r) => s + r.offers_count, 0), color: '#10B981' },
              { label: 'معدل الاستجابة', value: '< 2 ساعة', color: '#F59E0B' },
            ].map(stat => (
              <div key={stat.label} style={{ padding: '16px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} id={`req-cat-${cat.id}`} onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '10px 18px', borderRadius: 100, fontSize: 13, fontWeight: 700, border: '1.5px solid',
                  fontFamily: 'Tajawal, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
                  borderColor: activeCategory === cat.id ? '#8B5CF6' : '#E2E8F0',
                  background: activeCategory === cat.id ? '#8B5CF6' : 'white',
                  color: activeCategory === cat.id ? 'white' : '#64748B',
                }}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests Grid */}
      <section style={{ flex: 1, padding: '40px 24px 80px', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 20, color: '#64748B', fontSize: 14 }}>
            <span style={{ fontWeight: 700, color: '#0F172A' }}>{filtered.length}</span> طلب
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {filtered.map(req => (
              <Link key={req.id} href={`/requests/${req.id}`} style={{ textDecoration: 'none' }}>
                <div id={`request-card-${req.id}`} className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s', padding: 0, overflow: 'hidden' }}>
                  {/* Card header */}
                  <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {catIcon(req.category)}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase' }}>{catLabel(req.category)}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(req.created_at)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 700 }}>
                        {req.offers_count} عروض
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '12px 20px' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 8, lineHeight: 1.4 }}>{req.title}</h3>
                    <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
                      {req.description.slice(0, 100)}...
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>الميزانية</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#10B981' }}>
                          ${req.budget_min} - ${req.budget_max}
                        </div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>مدة الاستقبال</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>{req.deadline_days} أيام</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', fontWeight: 800 }}>
                        {req.user.display_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {req.user.display_name}
                          {req.user.role === 'verified' && <span style={{ color: '#2563EB', fontSize: 11 }}>✓</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>★ {req.user.rating}</div>
                      </div>
                    </div>
                    <div style={{ padding: '6px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #8B5CF6, #2563EB)', color: 'white', fontWeight: 700, fontSize: 12 }}>
                      إرسال عرض
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Post Request Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>نشر طلب جديد</h2>
              <button id="close-modal" onClick={() => setShowModal(false)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #E2E8F0', background: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>القسم</label>
                <select id="req-category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', background: 'white' }}>
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>عنوان الطلب *</label>
                <input id="req-title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: أبحث عن قناة يوتيوب تقنية"
                  style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>تفاصيل الطلب *</label>
                <textarea id="req-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="اشرح ما تريده بالتفصيل..." rows={4}
                  style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>الميزانية من ($)</label>
                  <input id="req-budget-min" type="number" value={form.budget_min} onChange={e => setForm({ ...form, budget_min: e.target.value })} placeholder="100"
                    style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>الميزانية إلى ($)</label>
                  <input id="req-budget-max" type="number" value={form.budget_max} onChange={e => setForm({ ...form, budget_max: e.target.value })} placeholder="1000"
                    style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>مدة استقبال العروض (أيام)</label>
                <input id="req-deadline" type="number" value={form.deadline_days} onChange={e => setForm({ ...form, deadline_days: e.target.value })} min={1} max={30}
                  style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }} />
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '14px', border: '1.5px solid #E2E8F0', borderRadius: 14, background: 'white', color: '#64748B', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                إلغاء
              </button>
              <button id="submit-request" onClick={() => { setShowModal(false); alert('تم نشر طلبك!'); }}
                style={{ flex: 2, padding: '14px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #8B5CF6, #2563EB)', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                🚀 نشر الطلب
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

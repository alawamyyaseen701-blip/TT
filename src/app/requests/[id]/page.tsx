'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const MOCK_REQUEST = {
  id: 1,
  title: 'أبحث عن قناة يوتيوب تقنية متميزة',
  category: 'social',
  description: `أبحث عن قناة يوتيوب متخصصة في مجال التقنية والبرمجة بالمواصفات التالية:
  
- عدد المشتركين: لا يقل عن 50,000 مشترك
- نسبة التفاعل: لا تقل عن 3%
- المحتوى: تقنية، برمجة، مراجعات أجهزة
- الدولة: يفضل السعودية أو مصر
- مفعّلة الربح: يفضل مفعّلة
- الأرباح الشهرية: تقريبية لا تقل عن 300$

الميزانية قابلة للتفاوض حسب جودة القناة.`,
  budget_min: 500,
  budget_max: 2000,
  deadline_days: 7,
  offers_count: 4,
  status: 'open',
  created_at: '2025-03-21T10:00:00Z',
  user: {
    username: 'ahmed_2025',
    display_name: 'محمد أحمد',
    rating: 4.8,
    total_deals: 12,
    role: 'verified',
    joined_at: '2024-01-01T00:00:00Z',
  },
  offers: [
    { id: 1, price: 1200, delivery_days: 2, message: 'لدي قناة مطابقة 100% للمواصفات، 85K مشترك، مفعّلة الربح', seller: { username: 'seller_1', display_name: 'أحمد يوتيوب', rating: 4.9, role: 'verified' }, status: 'pending', created_at: '2025-03-21T12:00:00Z' },
    { id: 2, price: 800, delivery_days: 1, message: 'عندي قناة 55K مشترك تقنية، أرباح 400$ شهرياً', seller: { username: 'seller_2', display_name: 'خالد تقني', rating: 4.7, role: 'user' }, status: 'pending', created_at: '2025-03-21T14:00:00Z' },
    { id: 3, price: 1800, delivery_days: 3, message: 'قناة 120K مشترك، مفعّلة وأرباحها 900$/شهر', seller: { username: 'seller_3', display_name: 'YouTube Pro', rating: 5.0, role: 'verified' }, status: 'pending', created_at: '2025-03-22T08:00:00Z' },
  ],
};

export default function RequestDetailPage() {
  const params = useParams();
  const [offerForm, setOfferForm] = useState({ price: '', delivery_days: '', message: '' });
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const req = MOCK_REQUEST;

  const handleSubmitOffer = () => {
    if (!offerForm.price || !offerForm.message) return;
    setSubmitted(true);
    setShowOfferForm(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>

          {/* Left Column — Request Details */}
          <div>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>
              <Link href="/" style={{ color: '#94A3B8', textDecoration: 'none' }}>الرئيسية</Link>
              <span>›</span>
              <Link href="/requests" style={{ color: '#94A3B8', textDecoration: 'none' }}>الطلبات</Link>
              <span>›</span>
              <span style={{ color: '#64748B' }}>تفاصيل الطلب</span>
            </div>

            {/* Title */}
            <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ padding: '5px 12px', borderRadius: 100, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontSize: 12, fontWeight: 700 }}>
                  📱 حسابات سوشيال ميديا
                </span>
                <span style={{ padding: '5px 12px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 12, fontWeight: 700 }}>
                  🟢 مفتوح — {req.offers_count} عروض
                </span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 12, lineHeight: 1.4 }}>{req.title}</h1>

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', padding: '16px 0', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>الميزانية</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981' }}>${req.budget_min} - ${req.budget_max}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>مدة الاستقبال</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{req.deadline_days} أيام</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>تاريخ النشر</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B' }}>
                    {new Date(req.created_at).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>

              <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, color: '#374151', lineHeight: 1.8 }}>
                {req.description}
              </div>
            </div>

            {/* Offers */}
            <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>
                العروض المقدمة ({req.offers.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {req.offers.map(offer => (
                  <div key={offer.id} id={`offer-${offer.id}`} style={{ padding: 20, borderRadius: 16, border: '1.5px solid #E2E8F0', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#8B5CF6'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16 }}>
                          {offer.seller.display_name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {offer.seller.display_name}
                            {offer.seller.role === 'verified' && <span style={{ color: '#2563EB', fontSize: 12 }}>✓ موثق</span>}
                          </div>
                          <div style={{ fontSize: 12, color: '#94A3B8' }}>★ {offer.seller.rating}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981' }}>${offer.price}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>خلال {offer.delivery_days} أيام</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 14 }}>{offer.message}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button id={`contact-seller-${offer.id}`} style={{ flex: 1, padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: 'white', color: '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        💬 مراسلة
                      </button>
                      <button id={`accept-offer-${offer.id}`} style={{ flex: 2, padding: '10px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #10B981, #2563EB)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        ✓ قبول العرض
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ position: 'sticky', top: 90 }}>
            {/* Requester Card */}
            <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>صاحب الطلب</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 22 }}>
                  {req.user.display_name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {req.user.display_name}
                    {req.user.role === 'verified' && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(37,99,235,0.1)', color: '#2563EB', fontWeight: 700 }}>✓ موثق</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#94A3B8' }}>@{req.user.username}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'التقييم', value: `★ ${req.user.rating}`, color: '#F59E0B' },
                  { label: 'الصفقات', value: req.user.total_deals, color: '#10B981' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '12px', borderRadius: 12, background: '#F8FAFC', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <Link href={`/profile/${req.user.username}`}>
                <button style={{ width: '100%', padding: '12px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: 'white', color: '#1E3A8A', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  عرض الملف الشخصي
                </button>
              </Link>
            </div>

            {/* Send Offer */}
            {!submitted ? (
              <div style={{ background: 'linear-gradient(135deg, #1E3A8A, #8B5CF6)', borderRadius: 20, padding: 24, color: 'white' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>🚀 لديك ما يناسب هذا الطلب؟</h3>
                <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 20, lineHeight: 1.6 }}>
                  أرسل عرضك الآن وابدأ التفاوض مع صاحب الطلب
                </p>

                {!showOfferForm ? (
                  <button id="show-offer-form" onClick={() => setShowOfferForm(true)}
                    style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    + إرسال عرض
                  </button>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16 }}>
                    <input id="offer-price" type="number" placeholder="السعر ($)" value={offerForm.price} onChange={e => setOfferForm({ ...offerForm, price: e.target.value })}
                      style={{ width: '100%', padding: '12px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', marginBottom: 10 }} />
                    <input id="offer-days" type="number" placeholder="مدة التنفيذ (أيام)" value={offerForm.delivery_days} onChange={e => setOfferForm({ ...offerForm, delivery_days: e.target.value })}
                      style={{ width: '100%', padding: '12px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', marginBottom: 10 }} />
                    <textarea id="offer-message" placeholder="رسالتك للعميل..." value={offerForm.message} onChange={e => setOfferForm({ ...offerForm, message: e.target.value })} rows={3}
                      style={{ width: '100%', padding: '12px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', resize: 'none', marginBottom: 12 }} />
                    <button id="submit-offer" onClick={handleSubmitOffer}
                      style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'white', border: 'none', color: '#1E3A8A', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                      إرسال العرض ✓
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: 20, padding: 24, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 800, color: '#10B981', fontSize: 16 }}>تم إرسال عرضك!</div>
                <div style={{ color: '#64748B', fontSize: 13, marginTop: 8 }}>سيتم إشعارك عند رد صاحب الطلب</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

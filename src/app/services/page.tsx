'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const SERVICES = [
  { id: 1, cat: 'سوشيال ميديا', title: 'زيادة متابعين إنستغرام حقيقيين', platform: 'Instagram', icon: '📸', price: 150, duration: '7 أيام', rating: 4.9, reviews: 84, seller: 'نور_ديجيتال', sellerRating: 4.95, color: '#E1306C' },
  { id: 2, cat: 'تسويق رقمي', title: 'إدارة إعلانات فيسبوك وإنستغرام', platform: 'Facebook/Instagram', icon: '📣', price: 500, duration: 'شهر', rating: 4.8, reviews: 42, seller: 'ميركت_برو', sellerRating: 4.88, color: '#1877F2' },
  { id: 3, cat: 'محتوى', title: 'مونتاج فيديو احترافي', platform: 'عام', icon: '🎬', price: 200, duration: '3 أيام', rating: 4.9, reviews: 127, seller: 'كريم_إيدت', sellerRating: 4.97, color: '#8B5CF6' },
  { id: 4, cat: 'تسويق رقمي', title: 'تحسين SEO وزيادة الظهور', platform: 'عام', icon: '🔍', price: 350, duration: '30 يوم', rating: 4.7, reviews: 58, seller: 'SEO_ماستر', sellerRating: 4.82, color: '#10B981' },
  { id: 5, cat: 'سوشيال ميديا', title: 'إدارة حساب تيكتوك شهرياً', platform: 'TikTok', icon: '🎵', price: 400, duration: 'شهر', rating: 4.8, reviews: 31, seller: 'تيكتوك_برو', sellerRating: 4.9, color: '#010101' },
  { id: 6, cat: 'محتوى', title: 'تصميم بنر وهوية بصرية', platform: 'عام', icon: '🎨', price: 180, duration: '2 يوم', rating: 4.9, reviews: 95, seller: 'ديزاين_بلس', sellerRating: 4.93, color: '#F59E0B' },
  { id: 7, cat: 'تسويق رقمي', title: 'إدارة حملات Google Ads', platform: 'Google', icon: '🌐', price: 600, duration: 'شهر', rating: 4.8, reviews: 22, seller: 'جوجل_إكسبرت', sellerRating: 4.85, color: '#4285F4' },
  { id: 8, cat: 'سوشيال ميديا', title: 'نشر محتوى يومي على سناب', platform: 'Snapchat', icon: '👻', price: 300, duration: 'شهر', rating: 4.7, reviews: 19, seller: 'سناب_كريتر', sellerRating: 4.78, color: '#FFFC00' },
];

const CATS = ['الكل', 'سوشيال ميديا', 'تسويق رقمي', 'محتوى'];

export default function ServicesPage() {
  const [activeCat, setActiveCat] = useState('الكل');
  const filtered = SERVICES.filter(s => activeCat === 'الكل' || s.cat === activeCat);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <section style={{ background: 'linear-gradient(160deg, #0F172A, #1A0F2E, #0F172A)', padding: '120px 24px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>⚡ الخدمات</div>
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: 40, marginBottom: 12 }}>
            خدمات رقمية{' '}
            <span style={{ background: 'linear-gradient(135deg, #EF4444, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>باحتراف</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.7 }}>سوشيال ميديا، تسويق رقمي، وصناعة محتوى — من نخبة مزودي الخدمات الموثوقين</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 40, flexWrap: 'wrap' }}>
            {CATS.map(c => (
              <button key={c} id={`srv-cat-${c}`} onClick={() => setActiveCat(c)}
                style={{ padding: '9px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, border: '1.5px solid', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer', transition: 'all 0.2s', borderColor: activeCat === c ? '#EF4444' : 'rgba(255,255,255,0.15)', background: activeCat === c ? '#EF4444' : 'rgba(255,255,255,0.06)', color: activeCat === c ? 'white' : 'rgba(255,255,255,0.6)' }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 24px 80px', flex: 1, background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {filtered.map(srv => (
              <div key={srv.id} className="card">
                <div style={{ padding: '20px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${srv.color}15`, border: `2px solid ${srv.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{srv.icon}</div>
                    <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 100, background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontWeight: 700 }}>{srv.cat}</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6, lineHeight: 1.3 }}>{srv.title}</h3>
                  <div style={{ fontSize: 12, color: '#64748B' }}>📱 {srv.platform}</div>
                </div>

                <div style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: '#64748B' }}>⏰ مدة التنفيذ</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{srv.duration}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: s <= Math.floor(srv.rating) ? '#F59E0B' : '#CBD5E1' }}>★</span>)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{srv.rating}</span>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>({srv.reviews})</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{srv.seller}</div>
                      <div style={{ fontSize: 11, color: '#F59E0B' }}>★ {srv.sellerRating}</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '14px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#1E3A8A' }}>${srv.price}</div>
                  <Link href={`/listings/${srv.id}`} style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #EF4444, #F97316)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>طلب الخدمة</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

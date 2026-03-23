'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ASSETS = [
  { id: 1, type: 'موقع إلكتروني', icon: '🌐', name: 'موقع أخبار تقني', profit: '$1,200/شهر', visitors: '85K', source: 'SEO', platform: 'WordPress', age: '4 سنوات', price: 28000, country: '🇸🇦', rating: 4.9, verified: true, domain: 'تقنية' },
  { id: 2, type: 'متجر إلكتروني', icon: '🛍️', name: 'متجر ملابس عصرية', profit: '$3,500/شهر', visitors: '45K', source: 'إعلانات', platform: 'Shopify', age: '2 سنة', price: 52000, country: '🇦🇪', rating: 4.8, verified: true, domain: 'تجارة' },
  { id: 3, type: 'تطبيق موبايل', icon: '📱', name: 'تطبيق لياقة بدنية', profit: '$800/شهر', visitors: '22K', source: 'App Store', platform: 'React Native', age: '1.5 سنة', price: 18000, country: '🇸🇦', rating: 4.7, verified: true, domain: 'صحة' },
  { id: 4, type: 'دومين', icon: '🔗', name: 'tech-arabia.com', profit: '—', visitors: '—', source: '—', platform: '—', age: '3 سنوات', price: 3500, country: '🌍', rating: 4.5, verified: false, domain: 'تقنية' },
  { id: 5, type: 'متجر إلكتروني', icon: '🛍️', name: 'متجر إكسسوارات تقنية', profit: '$1,800/شهر', visitors: '31K', source: 'SEO + إعلانات', platform: 'WooCommerce', age: '2.5 سنة', price: 35000, country: '🇸🇦', rating: 4.8, verified: true, domain: 'تقنية' },
  { id: 6, type: 'موقع إلكتروني', icon: '🌐', name: 'مدونة طعام وسياحة', profit: '$600/شهر', visitors: '120K', source: 'SEO', platform: 'WordPress', age: '5 سنوات', price: 15000, country: '🇪🇬', rating: 4.6, verified: true, domain: 'سياحة' },
];

export default function DigitalAssetsPage() {
  const [activeType, setActiveType] = useState('الكل');
  const [favs, setFavs] = useState<number[]>([]);
  const types = ['الكل', 'موقع إلكتروني', 'متجر إلكتروني', 'تطبيق موبايل', 'دومين'];

  const filtered = ASSETS.filter(a => activeType === 'الكل' || a.type === activeType);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <section style={{
        background: 'linear-gradient(160deg, #0F172A 0%, #1E2D5A 60%, #0F172A 100%)',
        padding: '120px 24px 60px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', color: '#2563EB', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                💎 الأصول الرقمية
              </div>
              <h1 style={{ color: 'white', fontWeight: 900, fontSize: 40, marginBottom: 12, lineHeight: 1.2 }}>
                اشترِ مشاريع رقمية{' '}
                <span style={{ background: 'linear-gradient(135deg, #2563EB, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>مربحة</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.7 }}>
                مواقع، متاجر، تطبيقات ودومينات — مع تقارير مالية موثقة وضمان نقل الملكية الكامل
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/listings/create" style={{ textDecoration: 'none' }}>
                <button style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #2563EB, #10B981)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>+ أضف أصلك</button>
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 40, flexWrap: 'wrap' }}>
            {types.map(t => (
              <button key={t} id={`type-${t}`} onClick={() => setActiveType(t)}
                style={{
                  padding: '9px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                  border: '1.5px solid', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
                  borderColor: activeType === t ? '#2563EB' : 'rgba(255,255,255,0.15)',
                  background: activeType === t ? '#2563EB' : 'rgba(255,255,255,0.06)',
                  color: activeType === t ? 'white' : 'rgba(255,255,255,0.6)',
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 24px 80px', flex: 1, background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {filtered.map(asset => (
              <div key={asset.id} className="card" style={{ position: 'relative' }}>
                <button id={`fav-asset-${asset.id}`} onClick={() => setFavs(p => p.includes(asset.id) ? p.filter(f => f !== asset.id) : [...p, asset.id])}
                  style={{ position: 'absolute', top: 14, left: 14, zIndex: 2, width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  {favs.includes(asset.id) ? '❤️' : '🤍'}
                </button>

                <div style={{ padding: '20px', background: 'linear-gradient(135deg, #F1F5F9, #F8FAFC)', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, boxShadow: '0 4px 12px rgba(30,58,138,0.2)' }}>{asset.icon}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: '#1E3A8A', color: 'white', fontWeight: 700 }}>{asset.type}</span>
                      {asset.verified && <span style={{ fontSize: 11, color: '#10B981' }}>✅</span>}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{asset.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{asset.platform} · {asset.country}</div>
                  </div>
                </div>

                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: '💰 الأرباح', val: asset.profit },
                      { label: '👥 الزوار', val: asset.visitors !== '—' ? `${asset.visitors}/شهر` : '—' },
                      { label: '🔗 مصدر الزوار', val: asset.source },
                      { label: '⏰ العمر', val: asset.age },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>{item.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{item.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: s <= Math.floor(asset.rating) ? '#F59E0B' : '#CBD5E1' }}>★</span>)}
                    <span style={{ fontSize: 12, color: '#64748B', marginRight: 6 }}>({asset.rating})</span>
                  </div>
                </div>

                <div style={{ padding: '14px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>السعر الكامل</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1E3A8A' }}>${asset.price.toLocaleString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/listings/${asset.id}`} style={{ textDecoration: 'none' }}>
                      <button style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>التفاصيل</button>
                    </Link>
                  </div>
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

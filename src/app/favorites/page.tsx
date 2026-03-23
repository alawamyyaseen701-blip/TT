'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const MOCK_FAVORITES = [
  { id: 1, type: 'social', platform: 'YouTube', title: 'قناة يوتيوب تقنية — 120K مشترك', price: 12000, followers: '120K', monetized: true, featured: true, rating: 4.9 },
  { id: 2, type: 'social', platform: 'Instagram', title: 'حساب انستغرام أزياء — 85K متابع', price: 4500, followers: '85K', monetized: false, featured: false, rating: 4.7 },
  { id: 3, type: 'subscription', platform: 'Netflix', title: 'اشتراك Netflix Premium 4K', price: 18, followers: null, monetized: false, featured: false, rating: 4.5 },
  { id: 4, type: 'service', platform: 'Design', title: 'خدمة تصميم هوية بصرية كاملة', price: 250, followers: null, monetized: false, featured: true, rating: 5.0 },
  { id: 5, type: 'store', platform: 'Canva', title: 'حزمة قوالب Canva Pro — 120 قالب', price: 35, followers: null, monetized: false, featured: false, rating: 4.8 },
];

const TYPE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  social: { bg: 'rgba(139,92,246,0.1)', color: '#8B5CF6', label: 'سوشيال ميديا' },
  subscription: { bg: 'rgba(245,158,11,0.1)', color: '#D97706', label: 'اشتراك' },
  service: { bg: 'rgba(16,185,129,0.1)', color: '#059669', label: 'خدمة' },
  store: { bg: 'rgba(37,99,235,0.1)', color: '#2563EB', label: 'منتج رقمي' },
  asset: { bg: 'rgba(239,68,68,0.1)', color: '#DC2626', label: 'أصل رقمي' },
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState(MOCK_FAVORITES);

  const removeFav = (id: number) => setFavorites(f => f.filter(x => x.id !== id));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>
                ❤️ المفضلة
              </h1>
              <p style={{ color: '#64748B', fontSize: 14 }}>{favorites.length} إعلان محفوظ</p>
            </div>
            <Link href="/social-accounts">
              <button style={{ padding: '12px 24px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                + استكشاف المزيد
              </button>
            </Link>
          </div>

          {favorites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 24 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>💔</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>لا توجد مفضلات بعد</div>
              <p style={{ color: '#64748B', marginBottom: 24 }}>تصفح الإعلانات وأضف ما يعجبك للمفضلة</p>
              <Link href="/social-accounts">
                <button style={{ padding: '13px 32px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  تصفح الإعلانات
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {favorites.map(item => {
                const tc = TYPE_COLORS[item.type] || TYPE_COLORS.asset;
                return (
                  <div key={item.id} id={`fav-${item.id}`} style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}>
                    {/* Header */}
                    <div style={{ padding: '16px 18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 100, background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 700 }}>
                          {tc.label}
                        </span>
                        {item.featured && (
                          <span style={{ padding: '4px 10px', borderRadius: 100, background: 'rgba(245,158,11,0.1)', color: '#D97706', fontSize: 11, fontWeight: 700 }}>⭐ مميز</span>
                        )}
                      </div>
                      <button id={`remove-fav-${item.id}`} onClick={() => removeFav(item.id)}
                        style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #FEE2E2', background: '#FEF2F2', color: '#EF4444', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        ✕
                      </button>
                    </div>

                    <Link href={`/listings/${item.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '12px 18px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 15, marginBottom: 6, lineHeight: 1.4 }}>{item.title}</div>
                        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                          📱 {item.platform} {item.followers && `· ${item.followers}`} {item.monetized && '· 💰 مفعّلة'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color: '#1E3A8A' }}>${item.price.toLocaleString()}</div>
                          <div style={{ fontSize: 13, color: '#F59E0B' }}>★ {item.rating}</div>
                        </div>
                      </div>
                    </Link>

                    <div style={{ padding: '12px 18px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8 }}>
                      <Link href={`/listings/${item.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                        <button style={{ width: '100%', padding: '10px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                          عرض التفاصيل
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

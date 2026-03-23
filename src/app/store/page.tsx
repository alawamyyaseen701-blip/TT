'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PRODUCTS = [
  { id: 1, cat: 'تصميم', name: 'قالب Landing Page احترافي', icon: '🎨', price: 45, rating: 4.9, reviews: 124, downloads: 890, seller: 'ديزاين_برو', preview: '🖼️', tags: ['HTML', 'CSS', 'Bootstrap'] },
  { id: 2, cat: 'فيديو', name: 'حزمة موشن جرافيك للريلز', icon: '🎬', price: 120, rating: 4.8, reviews: 67, downloads: 430, seller: 'موشن_ستوديو', preview: '🎥', tags: ['After Effects', 'Premiere'] },
  { id: 3, cat: 'برمجة', name: 'سكريبت متجر إلكتروني كامل', icon: '💻', price: 280, rating: 4.7, reviews: 38, downloads: 185, seller: 'كود_ماستر', preview: '📦', tags: ['PHP', 'Laravel', 'MySQL'] },
  { id: 4, cat: 'تعليم', name: 'كورس تصميم UI/UX كامل', icon: '📚', price: 200, rating: 5.0, reviews: 210, downloads: 1240, seller: 'أكاديمي_برو', preview: '🎓', tags: ['Figma', 'Adobe XD'] },
  { id: 5, cat: 'تسويق', name: 'حزمة قوالب سوشيال ميديا', icon: '📊', price: 60, rating: 4.8, reviews: 95, downloads: 670, seller: 'كريتيف_هب', preview: '✨', tags: ['Canva', 'PSD'] },
  { id: 6, cat: 'تصميم', name: 'خطوط عربية احترافية (10 خطوط)', icon: '✍️', price: 35, rating: 4.9, reviews: 156, downloads: 1100, seller: 'فونت_ستور', preview: '🔤', tags: ['TTF', 'OTF'] },
  { id: 7, cat: 'برمجة', name: 'إضافة WordPress متقدمة', icon: '🔌', price: 150, rating: 4.7, reviews: 43, downloads: 220, seller: 'WP_ديف', preview: '⚙️', tags: ['PHP', 'WordPress'] },
  { id: 8, cat: 'فيديو', name: 'مؤثرات صوتية احترافية', icon: '🎵', price: 80, rating: 4.6, reviews: 29, downloads: 340, seller: 'ساوند_برو', preview: '🔊', tags: ['MP3', 'WAV'] },
];

const CATS = ['الكل', 'تصميم', 'فيديو', 'برمجة', 'تعليم', 'تسويق'];

export default function StorePage() {
  const [activeCat, setActiveCat] = useState('الكل');
  const [sortBy, setSortBy] = useState('bestseller');
  const [cart, setCart] = useState<number[]>([]);

  const filtered = PRODUCTS.filter(p => activeCat === 'الكل' || p.cat === activeCat);
  const sortedFiltered = [...filtered].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.downloads - a.downloads;
  });

  const addToCart = (id: number) => {
    if (!cart.includes(id)) setCart([...cart, id]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <section style={{ background: 'linear-gradient(160deg, #0F172A, #1A2040, #0F172A)', padding: '120px 24px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>🛒 المتجر الرقمي</div>
              <h1 style={{ color: 'white', fontWeight: 900, fontSize: 40, marginBottom: 12 }}>
                منتجات رقمية{' '}
                <span style={{ background: 'linear-gradient(135deg, #10B981, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>جاهزة</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.7 }}>قوالب، كورسات، خطوط، أكواد، وأكثر — كل ما تحتاجه لمشروعك الرقمي</p>
            </div>
            {cart.length > 0 && (
              <div style={{ padding: '14px 24px', borderRadius: 14, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>🛒</span>
                <div>
                  <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>{cart.length} منتج في الحقيبة</div>
                  <div style={{ color: '#10B981', fontSize: 13 }}>
                    الإجمالي: ${PRODUCTS.filter(p => cart.includes(p.id)).reduce((s, p) => s + p.price, 0)}
                  </div>
                </div>
                <button id="checkout-btn" style={{ padding: '8px 18px', background: '#10B981', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>الدفع</button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginTop: 40, flexWrap: 'wrap' }}>
            {CATS.map(c => (
              <button key={c} id={`store-cat-${c}`} onClick={() => setActiveCat(c)}
                style={{ padding: '9px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, border: '1.5px solid', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer', transition: 'all 0.2s', borderColor: activeCat === c ? '#10B981' : 'rgba(255,255,255,0.15)', background: activeCat === c ? '#10B981' : 'rgba(255,255,255,0.06)', color: activeCat === c ? 'white' : 'rgba(255,255,255,0.6)' }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 24px 80px', flex: 1, background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ color: '#64748B', fontSize: 14 }}><span style={{ fontWeight: 700, color: '#0F172A' }}>{sortedFiltered.length}</span> منتج</div>
            <select id="store-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontFamily: 'Tajawal, sans-serif', fontSize: 13, background: 'white', outline: 'none' }}>
              <option value="bestseller">الأكثر مبيعاً</option>
              <option value="rating">الأعلى تقييماً</option>
              <option value="price_low">السعر: الأقل</option>
              <option value="price_high">السعر: الأعلى</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {sortedFiltered.map(product => (
              <div key={product.id} className="card">
                {/* Preview */}
                <div style={{ padding: '40px 20px', background: 'linear-gradient(135deg, #F1F5F9, #EFF6FF)', borderBottom: '1px solid #E8EDF5', textAlign: 'center', position: 'relative' }}>
                  <div style={{ fontSize: 56, marginBottom: 8 }}>{product.preview}</div>
                  <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 100, background: 'rgba(30,58,138,0.08)', color: '#1E3A8A', fontWeight: 700 }}>{product.cat}</span>
                </div>

                <div style={{ padding: '16px 20px' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 8, lineHeight: 1.3 }}>{product.name}</h3>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {product.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#F1F5F9', color: '#64748B', fontWeight: 600 }}>{tag}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: s <= Math.floor(product.rating) ? '#F59E0B' : '#CBD5E1' }}>★</span>)}
                      <span style={{ fontSize: 12, color: '#64748B', marginRight: 4 }}>({product.reviews})</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>📥 {product.downloads.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 14 }}>
                    <span>👤 {product.seller}</span>
                  </div>
                </div>

                <div style={{ padding: '14px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#1E3A8A' }}>${product.price}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button id={`cart-btn-${product.id}`} onClick={() => addToCart(product.id)}
                      style={{ padding: '9px 16px', background: cart.includes(product.id) ? 'rgba(16,185,129,0.1)' : '#F8FAFC', border: `1.5px solid ${cart.includes(product.id) ? '#10B981' : '#E2E8F0'}`, borderRadius: 10, color: cart.includes(product.id) ? '#10B981' : '#64748B', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                      {cart.includes(product.id) ? '✓' : '🛒'}
                    </button>
                    <Link href={`/listings/${product.id}`} style={{ textDecoration: 'none' }}>
                      <button style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>شراء</button>
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

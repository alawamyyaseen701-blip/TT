'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return setLoading(false);
    fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setFavorites(d.data?.favorites || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const removeFav = async (listingId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ listingId }) });
    setFavorites(prev => prev.filter(f => f.listing_id !== listingId));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Tajawal, sans-serif' }}>
      <Header />
      <div style={{ paddingTop: 72, flex: 1, background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 28 }}>❤️ المفضلة</h1>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>جاري التحميل...
            </div>
          ) : favorites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🤍</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>لا توجد مفضلات بعد</h2>
              <p style={{ color: '#64748B', marginBottom: 24 }}>أضف إعلانات إلى مفضلتك لتجدها هنا</p>
              <Link href="/social-accounts">
                <button style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  تصفح الإعلانات
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {favorites.map(fav => {
                const l = fav.listing;
                if (!l) return null;
                return (
                  <div key={fav.id} className="card" style={{ position: 'relative' }}>
                    <button onClick={() => removeFav(fav.listing_id)} style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>❤️</button>
                    <div style={{ padding: '48px 20px 16px', background: 'linear-gradient(135deg, rgba(37,99,235,0.05), #F8FAFC)', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{l.title}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{l.type} {l.platform && `· ${l.platform}`}</div>
                    </div>
                    <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#1E3A8A' }}>${l.price?.toLocaleString('en-US')}</div>
                      <Link href={`/listings/${l.id}`} style={{ textDecoration: 'none' }}>
                        <button style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>عرض</button>
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

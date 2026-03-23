'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const SUBS = [
  { id: 1, cat: 'ذكاء اصطناعي', service: 'ChatGPT Plus', icon: '🤖', plan: 'فردي', duration: '11 شهراً', price: 180, method: 'بيانات حساب', color: '#10A37F', rating: 5.0 },
  { id: 2, cat: 'ذكاء اصطناعي', service: 'Midjourney', icon: '🎨', plan: 'Basic', duration: '8 أشهر', price: 120, method: 'بيانات حساب', color: '#8B5CF6', rating: 4.9 },
  { id: 3, cat: 'فيديو', service: 'Netflix', icon: '🎬', plan: 'بريميم 4K', duration: '9 أشهر', price: 95, method: 'مشاركة عائلية', color: '#E50914', rating: 4.8 },
  { id: 4, cat: 'يوتيوب', service: 'YouTube Premium', icon: '▶️', plan: 'عائلي', duration: '12 شهراً', price: 75, method: 'دعوة عائلية', color: '#FF0000', rating: 4.9 },
  { id: 5, cat: 'موسيقى', service: 'Spotify', icon: '🎵', plan: 'بريميم', duration: '6 أشهر', price: 45, method: 'بيانات حساب', color: '#1DB954', rating: 4.7 },
  { id: 6, cat: 'تصميم', service: 'Canva Pro', icon: '✏️', plan: 'فردي', duration: '10 أشهر', price: 90, method: 'بيانات حساب', color: '#00C4CC', rating: 4.8 },
  { id: 7, cat: 'تصميم', service: 'Adobe Creative Cloud', icon: '🅰️', plan: 'كامل', duration: '7 أشهر', price: 220, method: 'بيانات حساب', color: '#FF0000', rating: 4.6 },
  { id: 8, cat: 'ذكاء اصطناعي', service: 'Gemini Advanced', icon: '⚡', plan: 'فردي', duration: '11 شهراً', price: 85, method: 'بيانات حساب', color: '#4285F4', rating: 4.7 },
  { id: 9, cat: 'فيديو', service: 'Disney+', icon: '🏰', plan: 'بريميم', duration: '5 أشهر', price: 60, method: 'بيانات حساب', color: '#0F4F9A', rating: 4.6 },
  { id: 10, cat: 'عمل', service: 'Microsoft 365', icon: '🪟', plan: 'Personal', duration: '9 أشهر', price: 70, method: 'بيانات حساب', color: '#0078D4', rating: 4.7 },
  { id: 11, cat: 'ذكاء اصطناعي', service: 'ElevenLabs', icon: '🎤', plan: 'Starter', duration: '6 أشهر', price: 55, method: 'بيانات حساب', color: '#6C47FF', rating: 4.8 },
  { id: 12, cat: 'موسيقى', service: 'Anghami Plus', icon: '🎶', plan: 'فردي', duration: '8 أشهر', price: 35, method: 'بيانات حساب', color: '#E14B9D', rating: 4.5 },
];

const CATS = ['الكل', 'ذكاء اصطناعي', 'فيديو', 'موسيقى', 'يوتيوب', 'تصميم', 'عمل'];

export default function SubscriptionsPage() {
  const [activeCat, setActiveCat] = useState('الكل');
  const filtered = SUBS.filter(s => activeCat === 'الكل' || s.cat === activeCat);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <section style={{ background: 'linear-gradient(160deg, #0F172A, #1E3A8A, #0F172A)', padding: '120px 24px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>⭐ الاشتراكات الرقمية</div>
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: 40, marginBottom: 12, lineHeight: 1.2 }}>
            اشتراكات بأسعار{' '}
            <span style={{ background: 'linear-gradient(135deg, #F59E0B, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>مخفضة</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.7 }}>أكثر من 5,600 اشتراك متاح — ChatGPT، Netflix، Spotify وأكثر بضمان نظام Escrow</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 40, flexWrap: 'wrap' }}>
            {CATS.map(c => (
              <button key={c} id={`cat-sub-${c}`} onClick={() => setActiveCat(c)}
                style={{
                  padding: '9px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                  border: '1.5px solid', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
                  borderColor: activeCat === c ? '#F59E0B' : 'rgba(255,255,255,0.15)',
                  background: activeCat === c ? '#F59E0B' : 'rgba(255,255,255,0.06)',
                  color: activeCat === c ? '#0F172A' : 'rgba(255,255,255,0.6)',
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 24px 80px', flex: 1, background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {filtered.map(sub => (
              <div key={sub.id} className="card">
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `${sub.color}18`, border: `2px solid ${sub.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
                  }}>{sub.icon}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{sub.service}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{sub.cat}</div>
                  </div>
                </div>

                <div style={{ padding: '16px 20px' }}>
                  {[
                    { label: '📋 الخطة', val: sub.plan },
                    { label: '⏰ المتبقي', val: sub.duration },
                    { label: '📦 التسليم', val: sub.method },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: '#F8FAFC' }}>
                      <span style={{ fontSize: 13, color: '#64748B' }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{item.val}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 8 }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 14, color: s <= Math.floor(sub.rating) ? '#F59E0B' : '#CBD5E1' }}>★</span>)}
                    <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 700, marginRight: 6 }}>{sub.rating}</span>
                  </div>
                </div>

                <div style={{ padding: '14px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#1E3A8A' }}>${sub.price}</div>
                  <Link href={`/listings/${sub.id}`} style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #F59E0B, #F97316)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>اشترِ الآن</button>
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

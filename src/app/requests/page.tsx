'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/requests?limit=24')
      .then(r => r.json())
      .then(d => { if (d.success) setRequests(d.data?.requests || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Tajawal, sans-serif' }}>
      <Header />
      <div style={{ paddingTop: 72, flex: 1 }}>
        {/* Hero */}
        <section style={{ background: 'linear-gradient(160deg, #0F172A, #0F4C75)', padding: '100px 24px 60px', position: 'relative' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ color: 'white', fontSize: 36, fontWeight: 900, marginBottom: 12 }}>📋 طلبات المستخدمين</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 32 }}>ابحث عن ما تحتاج أو ارسل طلبك واستقبل العروض</p>
            <Link href="/listings/create">
              <button style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #06B6D4, #2563EB)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                + أضف طلبك
              </button>
            </Link>
          </div>
        </section>

        <section style={{ padding: '40px 24px 80px', background: '#F8FAFC' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                <div>جاري التحميل...</div>
              </div>
            ) : requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>لا توجد طلبات بعد</h2>
                <p style={{ color: '#64748B', marginBottom: 24 }}>كن أول من يضيف طلباً</p>
                <Link href="/listings/create">
                  <button style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #06B6D4, #2563EB)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    + أضف طلبك
                  </button>
                </Link>
              </div>
            ) : requests.map(req => (
              <Link key={req.id} href={`/requests/${req.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ padding: '20px 24px', borderRadius: 16, border: '1.5px solid #E2E8F0', background: 'white', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2563EB'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(37,99,235,0.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📋</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#0F172A', marginBottom: 4 }}>{req.title}</div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>
                      {req.budget && `💰 ${req.budget} · `}
                      {req.buyer_name && `👤 ${req.buyer_name}`}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

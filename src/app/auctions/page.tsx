'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AUCTIONS = [
  { id: 1, title: 'قناة يوتيوب تقنية 800K مشترك', icon: '▶️', type: 'YouTube', starting: 15000, currentBid: 18500, bids: 12, endsIn: 3600 * 2 + 1800, country: '🇸🇦', verified: true, featured: true },
  { id: 2, title: 'متجر Shopify - ربح $5K/شهر', icon: '🛍️', type: 'متجر', starting: 30000, currentBid: 42000, bids: 8, endsIn: 3600 * 5, country: '🇦🇪', verified: true, featured: false },
  { id: 3, title: 'حساب إنستغرام موضة - 500K', icon: '📸', type: 'Instagram', starting: 5000, currentBid: 7200, bids: 21, endsIn: 3600, country: '🇸🇦', verified: true, featured: true },
  { id: 4, title: 'موقع خبري SEO - 200K زيارة', icon: '🌐', type: 'موقع', starting: 8000, currentBid: 11000, bids: 5, endsIn: 3600 * 8, country: '🇪🇬', verified: false, featured: false },
];

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    const timer = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(timer);
  }, []);
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function AuctionCard({ auction }: { auction: typeof AUCTIONS[0] }) {
  const countdown = useCountdown(auction.endsIn);
  const [bidAmount, setBidAmount] = useState('');
  const [showBid, setShowBid] = useState(false);
  const [bidLoading, setBidLoading] = useState(false);
  const [bidMsg, setBidMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentBid, setCurrentBid] = useState(auction.currentBid);
  const [bidsCount, setBidsCount] = useState(auction.bids);

  const submitBid = async () => {
    const amount = parseFloat(bidAmount);
    if (!amount || amount <= currentBid) {
      setBidMsg({ type: 'error', text: `يجب أن يكون المبلغ أكبر من $${currentBid.toLocaleString()}` });
      return;
    }
    setBidLoading(true); setBidMsg(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setBidMsg({ type: 'error', text: 'يجب تسجيل الدخول للمزايدة' }); return; }
      const res = await fetch(`/api/auctions/${auction.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!data.success) { setBidMsg({ type: 'error', text: data.error || 'فشل في تقديم المزايدة' }); return; }
      setCurrentBid(amount);
      setBidsCount(c => c + 1);
      setBidAmount('');
      setShowBid(false);
      setBidMsg({ type: 'success', text: `✅ تم تسجيل مزايدتك بـ $${amount.toLocaleString()}` });
    } catch { setBidMsg({ type: 'error', text: 'خطأ في الاتصال بالخادم' }); }
    finally { setBidLoading(false); }
  };

  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', position: 'relative', transition: 'transform 0.2s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}>
      {auction.featured && (
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100 }}>🔥 مرتفع</div>
      )}
      <div style={{ padding: '20px', background: 'linear-gradient(135deg, #FFF7ED, #fff)', borderBottom: '1px solid #FED7AA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(249,115,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{auction.icon}</div>
          <div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{auction.type} {auction.country} {auction.verified && '✅'}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{auction.title}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 20px', background: '#FFF7ED', borderBottom: '1px solid #FED7AA', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#F97316', fontWeight: 600, marginBottom: 4 }}>⏰ ينتهي في</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: auction.endsIn < 3600 ? '#EF4444' : '#F97316', letterSpacing: 3, fontVariantNumeric: 'tabular-nums' as const }}>
          {countdown}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>السعر المبدئي</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#64748B' }}>${auction.starting.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>أعلى مزايدة</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981' }}>${currentBid.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: '#F8FAFC', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#64748B' }}>عدد المزايدات</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{bidsCount} مزايدة</span>
        </div>

        {bidMsg && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: bidMsg.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${bidMsg.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: bidMsg.type === 'success' ? '#059669' : '#DC2626' }}>
            {bidMsg.text}
          </div>
        )}

        {showBid ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input id={`bid-amount-${auction.id}`} type="number" placeholder={`أكثر من $${currentBid}`} value={bidAmount}
              onChange={e => setBidAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitBid()}
              style={{ flex: 1, padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontFamily: 'Tajawal, sans-serif', fontSize: 13, outline: 'none' }} />
            <button id={`bid-submit-${auction.id}`} onClick={submitBid} disabled={bidLoading}
              style={{ padding: '11px 16px', background: bidLoading ? 'rgba(249,115,22,0.5)' : 'linear-gradient(135deg, #F97316, #EF4444)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: bidLoading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', whiteSpace: 'nowrap' }}>
              {bidLoading ? '...' : 'زايد!'}
            </button>
            <button onClick={() => { setShowBid(false); setBidMsg(null); }} style={{ padding: '11px 13px', background: '#F1F5F9', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16, color: '#64748B' }}>✕</button>
          </div>
        ) : (
          <button id={`bid-btn-${auction.id}`} onClick={() => setShowBid(true)}
            style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #F97316, #EF4444)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 6px 20px rgba(249,115,22,0.25)' }}>
            🔨 زايد الآن
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuctionsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <section style={{ background: 'linear-gradient(160deg, #0F172A, #1A0A05, #0F172A)', padding: '120px 24px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', color: '#F97316', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>🔨 المزادات المباشرة</div>
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: 40, marginBottom: 12, lineHeight: 1.2 }}>
            مزادات{' '}
            <span style={{ background: 'linear-gradient(135deg, #F97316, #EF4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>لحظية</span>
            {' '}على أصول رقمية
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16 }}>زايد مباشرة وانتظر انتهاء المزاد — الفائز يحصل على الأصل بضمان كامل</p>
        </div>
      </section>

      <section style={{ padding: '40px 24px 80px', flex: 1, background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}>
            {[
              { icon: '🔥', val: '24', label: 'مزاد نشط' },
              { icon: '💰', val: '$450K+', label: 'حجم المزايدات' },
              { icon: '👥', val: '1,240', label: 'مشارك اليوم' },
              { icon: '✅', val: '98%', label: 'معدل الإتمام' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, minWidth: 160, padding: '16px 20px', borderRadius: 16, background: 'white', border: '1.5px solid #E2E8F0', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#1E3A8A' }}>{s.val}</div>
                <div style={{ fontSize: 13, color: '#94A3B8' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {AUCTIONS.map(a => <AuctionCard key={a.id} auction={a} />)}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

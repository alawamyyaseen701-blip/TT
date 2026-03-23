'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TYPE_ICONS: Record<string, string> = {
  deal_update: '🤝', payment_released: '💰', new_offer: '📩',
  dispute_resolved: '⚖️', withdrawal_approved: '🏦', new_bid: '🔨',
  new_message: '💬', deal_created: '📋', deal_completed: '✅',
  deal_disputed: '🚨', review_received: '⭐', default: '🔔',
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days >= 1) return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
  if (h >= 1) return `منذ ${h} ${h === 1 ? 'ساعة' : 'ساعات'}`;
  return `منذ ${mins || 1} دقيقة`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) setNotifications(data.data.notifications);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markAllRead = async () => {
    setNotifications(n => n.map(x => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({}),
    }).catch(() => {});
  };

  const markRead = async (id: number) => {
    setNotifications(n => n.map(x => x.id === id ? { ...x, read_at: new Date().toISOString() } : x));
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {});
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read_at) : notifications;
  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                الإشعارات
                {unreadCount > 0 && (
                  <span style={{ padding: '3px 10px', borderRadius: 100, background: '#EF4444', color: 'white', fontSize: 13, fontWeight: 800 }}>
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p style={{ color: '#64748B', fontSize: 14 }}>جميع تنبيهاتك في مكان واحد</p>
            </div>
            <button id="mark-all-read" onClick={markAllRead}
              style={{ padding: '10px 20px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: 'white', color: '#1E3A8A', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
              تحديد الكل كمقروء ✓
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[
              { id: 'all' as const, label: `الكل (${notifications.length})` },
              { id: 'unread' as const, label: `غير مقروء (${unreadCount})` },
            ].map(f => (
              <button key={f.id} id={`filter-${f.id}`} onClick={() => setFilter(f.id)}
                style={{ padding: '9px 20px', borderRadius: 100, border: '1.5px solid', fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                  borderColor: filter === f.id ? '#1E3A8A' : '#E2E8F0',
                  background: filter === f.id ? '#1E3A8A' : 'white',
                  color: filter === f.id ? 'white' : '#64748B' }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ height: 80, borderRadius: 16, background: 'white', border: '1.5px solid #F1F5F9', animation: 'pulse-glow 1.5s infinite' }} />
              ))
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>لا توجد إشعارات</div>
                <div style={{ fontSize: 14, color: '#94A3B8' }}>ستظهر هنا عند وجود تحديثات</div>
              </div>
            ) : filtered.map(n => (
              <div key={n.id} id={`notif-${n.id}`}
                onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}
                style={{ padding: '16px 20px', borderRadius: 16, display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', transition: 'all 0.2s',
                  background: n.read_at ? 'white' : 'rgba(30,58,138,0.04)',
                  border: `1.5px solid ${n.read_at ? '#F1F5F9' : 'rgba(30,58,138,0.12)'}` }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: n.read_at ? '#F8FAFC' : 'rgba(30,58,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {TYPE_ICONS[n.type] || TYPE_ICONS.default}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: n.read_at ? 600 : 800, color: '#0F172A', fontSize: 14 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0, marginRight: 8 }}>{timeAgo(n.created_at)}</div>
                  </div>
                  {n.body && <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>{n.body}</div>}
                </div>
                {!n.read_at && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1E3A8A', flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

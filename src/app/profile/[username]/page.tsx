'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const COUNTRY_FLAGS: Record<string, string> = { SA: '🇸🇦', AE: '🇦🇪', EG: '🇪🇬', KW: '🇰🇼', QA: '🇶🇦' };
const TYPE_LABELS: Record<string, string> = { social: '📱 سوشيال ميديا', asset: '💎 أصول رقمية', store: '🛒 متجر', subscription: '⭐ اشتراك', service: '⚡ خدمة' };

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');
  const [notFound, setNotFound] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, listingsRes] = await Promise.all([
          fetch(`/api/users/${params.username}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          fetch(`/api/listings?sellerId=${params.username}&status=active&limit=20`),
        ]);
        const profileData = await profileRes.json();
        if (!profileData.success) { setNotFound(true); return; }
        setUser(profileData.data.user);
        setReviews(profileData.data.reviews || []);

        const listingsData = await listingsRes.json();
        if (listingsData.success) setListings(listingsData.data.listings);
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    };
    if (params.username) load();
  }, [params.username]);

  const handleMessage = () => {
    if (!token) { router.push('/auth/login'); return; }
    router.push(`/messages?with=${user?.id}`);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>⏳</div><div style={{ marginTop: 12, color: '#64748B' }}>جاري تحميل الملف الشخصي...</div></div>
      </div>
    </div>
  );

  if (notFound || !user) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>😕</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>المستخدم غير موجود</div>
          <Link href="/"><button style={{ padding: '12px 28px', border: 'none', borderRadius: 12, background: '#1E3A8A', color: 'white', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 700 }}>← العودة للرئيسية</button></Link>
        </div>
      </div>
    </div>
  );

  const yearJoined = new Date(user.joined_at).getFullYear();
  const ratingBars = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter((r: any) => r.rating === star).length;
    return { star, count, pct: reviews.length ? (count / reviews.length) * 100 : 0 };
  });
  const flag = COUNTRY_FLAGS[user.country] || '🌍';
  const isOwn = currentUser && (currentUser.username === user.username || currentUser.id === String(user.id));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        {/* Cover */}
        <div style={{ height: 180, background: 'linear-gradient(135deg, #0F172A, #1E3A8A, #10B981)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          {/* Profile Header */}
          <div style={{ background: 'white', borderRadius: 24, padding: '0 28px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', marginTop: -60, marginBottom: 24, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #1E3A8A, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 44, border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', flexShrink: 0, marginTop: 20 }}>
                {user.display_name?.charAt(0) || '؟'}
              </div>
              <div style={{ flex: 1, marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0 }}>{user.display_name}</h1>
                  {user.role === 'verified' && (
                    <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(37,99,235,0.1)', color: '#2563EB', fontSize: 12, fontWeight: 800 }}>✓ موثق رسمياً</span>
                  )}
                  {user.role === 'admin' && (
                    <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 12, fontWeight: 800 }}>🛡️ مدير</span>
                  )}
                </div>
                <div style={{ color: '#94A3B8', fontSize: 14, margin: '4px 0' }}>@{user.username} · {flag} · عضو منذ {yearJoined}</div>
                {user.bio && <p style={{ fontSize: 14, color: '#64748B', marginTop: 8, lineHeight: 1.6, maxWidth: 500 }}>{user.bio}</p>}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                {isOwn ? (
                  <Link href="/settings">
                    <button id="edit-profile-btn" style={{ padding: '12px 24px', border: '1.5px solid #1E3A8A', borderRadius: 12, background: 'white', color: '#1E3A8A', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                      ✏️ تعديل الملف
                    </button>
                  </Link>
                ) : (
                  <button id="contact-btn" onClick={handleMessage} style={{ padding: '12px 24px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    💬 مراسلة
                  </button>
                )}
                <button id="report-profile-btn" style={{ padding: '12px 20px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: 'white', color: '#94A3B8', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>🚩</button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 24, marginTop: 24, paddingTop: 24, borderTop: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
              {[
                { label: 'التقييم', value: `★ ${Number(user.rating || 0).toFixed(1)}`, color: '#F59E0B' },
                { label: 'الصفقات المكتملة', value: user.total_deals || 0, color: '#10B981' },
                { label: 'التقييمات', value: reviews.length, color: '#8B5CF6' },
                { label: 'الإعلانات النشطة', value: listings.length, color: '#2563EB' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs + Content */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start', paddingBottom: 60 }}>
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'white', borderRadius: 14, padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                {[
                  { id: 'listings' as const, label: `الإعلانات (${listings.length})` },
                  { id: 'reviews' as const, label: `التقييمات (${reviews.length})` },
                ].map(tab => (
                  <button key={tab.id} id={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id)}
                    style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 10, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', background: activeTab === tab.id ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : 'transparent', color: activeTab === tab.id ? 'white' : '#64748B' }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'listings' && (
                listings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div style={{ fontSize: 15, color: '#64748B' }}>لا توجد إعلانات نشطة</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {listings.map((l: any) => (
                      <Link key={l.id} href={`/listings/${l.id}`} style={{ textDecoration: 'none' }}>
                        <div id={`listing-row-${l.id}`} style={{ background: 'white', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'}>
                          <div>
                            {l.featured && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(245,158,11,0.1)', color: '#D97706', fontWeight: 700, marginBottom: 6, display: 'inline-block' }}>⭐ مميز</span>}
                            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>{l.title}</div>
                            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
                              {TYPE_LABELS[l.type] || l.type} {l.platform && `· ${l.platform}`} {l.followers && `· ${l.followers}`} {l.monetized ? '· 💰 مفعّلة الربح' : ''}
                            </div>
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#1E3A8A' }}>${Number(l.price).toLocaleString()}</div>
                            <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>شراء الآن</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'reviews' && (
                reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
                    <div style={{ fontSize: 15, color: '#64748B' }}>لا توجد تقييمات بعد</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reviews.map((r: any, i: number) => (
                      <div key={i} style={{ background: 'white', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.reviewer_name || 'مستخدم'}</div>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 14, color: s <= r.rating ? '#F59E0B' : '#CBD5E1' }}>★</span>)}
                          </div>
                        </div>
                        {r.comment && <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Rating Sidebar */}
            <div>
              <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>التقييم التفصيلي</h3>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: '#F59E0B' }}>{Number(user.rating || 0).toFixed(1)}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 2, margin: '4px 0' }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 18, color: s <= Math.round(user.rating || 0) ? '#F59E0B' : '#CBD5E1' }}>★</span>)}
                  </div>
                  <div style={{ fontSize: 13, color: '#94A3B8' }}>بناءً على {reviews.length} تقييم</div>
                </div>
                {ratingBars.map(rb => (
                  <div key={rb.star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748B', width: 20 }}>{rb.star}★</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                      <div style={{ width: `${rb.pct}%`, height: '100%', background: '#F59E0B', borderRadius: 3, transition: 'width 1s ease' }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#94A3B8', width: 16 }}>{rb.count}</span>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              {!isOwn && (
                <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <button onClick={handleMessage} style={{ width: '100%', padding: '12px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', marginBottom: 10 }}>
                    💬 إرسال رسالة
                  </button>
                  {!token && (
                    <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
                      <Link href="/auth/login" style={{ color: '#1E3A8A', fontWeight: 700, textDecoration: 'none' }}>سجل دخولك</Link> للتواصل
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CATEGORIES = [
  { icon: '📱', label: 'حسابات سوشيال', href: '/social-accounts', color: '#8B5CF6' },
  { icon: '💎', label: 'أصول رقمية', href: '/digital-assets', color: '#2563EB' },
  { icon: '🛒', label: 'منتج رقمي', href: '/store', color: '#10B981' },
  { icon: '⭐', label: 'اشتراكات', href: '/subscriptions', color: '#F59E0B' },
  { icon: '⚡', label: 'خدمات', href: '/services', color: '#EF4444' },
  { icon: '📋', label: 'طلبات', href: '/requests', color: '#06B6D4' },
  { icon: '🔨', label: 'مزادات', href: '/auctions', color: '#F97316' },
];


const ESCROW_STEPS = [
  { num: 1, icon: '🤝', title: 'الاتفاق', desc: 'يتفق البائع والمشتري على الشروط' },
  { num: 2, icon: '💳', title: 'الدفع', desc: 'يدفع المشتري عبر المنصة الآمنة' },
  { num: 3, icon: '🔒', title: 'التجميد', desc: 'تُجمَّد الأموال في حساب الوساطة' },
  { num: 4, icon: '📦', title: 'التسليم', desc: 'يسلم البائع المنتج أو الخدمة' },
  { num: 5, icon: '✅', title: 'التأكيد', desc: 'يؤكد المشتري استلام المنتج' },
  { num: 6, icon: '💰', title: 'التحويل', desc: 'يُحوَّل المبلغ للبائع بعد خصم 5%' },
];

function StatCard({ val, label, icon }: { val: string; label: string; icon: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '32px 24px',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 20,
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s',
    }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#10B981', marginBottom: 6 }}>{val}</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{label}</div>
    </div>
  );
}

function ListingCard({ item }: { item: any }) {
  const [fav, setFav] = useState(false);
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      {item.featured && (
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 2,
          background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
          color: 'white', fontSize: 11, fontWeight: 700,
          padding: '4px 10px', borderRadius: 100,
        }}>⭐ مميز</div>
      )}
      <button
        id={`fav-btn-${item.id}`}
        onClick={() => setFav(!fav)}
        style={{
          position: 'absolute', top: 12, left: 12, zIndex: 2,
          width: 34, height: 34, borderRadius: 10,
          background: 'rgba(255,255,255,0.9)',
          border: 'none', cursor: 'pointer', fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s',
        }}
      >{fav ? '❤️' : '🤍'}</button>

      {/* Card Header */}
      <div style={{
        padding: '48px 20px 20px',
        background: `linear-gradient(135deg, ${item.platform === 'YouTube' ? '#FF0000' : item.platform === 'Instagram' ? '#E1306C' : item.platform === 'TikTok' ? '#000000' : item.platform === 'ChatGPT Plus' ? '#10A37F' : '#2563EB'}18, #F8FAFC)`,
        borderBottom: '1px solid #F1F5F9',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, fontSize: 28,
          background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>{item.icon}</div>
        <div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 3 }}>
            {item.type} {item.country}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{item.name}</div>
          {item.verified && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <span style={{ fontSize: 12, color: '#10B981' }}>✅</span>
              <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>موثق</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '16px 20px', display: 'flex', gap: 16 }}>
        {item.followers !== '—' && (
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1E3A8A' }}>{item.followers}</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>متابع</div>
          </div>
        )}
        {item.engagement !== '—' && (
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#10B981' }}>{item.engagement}</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>تفاعل</div>
          </div>
        )}
        {item.monetized && (
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#F59E0B' }}>✓</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>مربحة</div>
          </div>
        )}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#F59E0B' }}>{item.rating}</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>التقييم</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid #F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>السعر</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#1E3A8A' }}>
            ${item.price}
          </div>
        </div>
        <Link href={`/listings/${item.id}`} style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '9px 20px',
            background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
            border: 'none', borderRadius: 10,
            color: 'white', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
          }}>عرض التفاصيل</button>
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('جميع الأقسام');
  const [heroVisible, setHeroVisible] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=${encodeURIComponent(searchType)}`);
    } else {
      router.push('/search');
    }
  };

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* HERO */}
      <section className="hero-section" style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 50%, #0F172A 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', padding: '120px 24px 80px',
      }}>
        {/* Background elements */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: '10%', right: '5%',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '10%', left: '5%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)',
          }} />
          {/* Floating icons */}
          {['📱','💎','🛒','⭐','⚡','🔒','💰','🤝'].map((icon, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${10 + (i * 11) % 80}%`,
              left: `${(i * 13) % 90}%`,
              fontSize: 24,
              opacity: 0.08,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}>{icon}</div>
          ))}
          {/* Grid lines */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div style={{
          maxWidth: 900, textAlign: 'center', position: 'relative', zIndex: 1,
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(32px)',
          transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 100,
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            marginBottom: 28,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse-glow 2s infinite' }} />
            <span style={{ color: '#10B981', fontSize: 14, fontWeight: 600 }}>🔒 نظام Escrow الآمن — تحويل الأموال فقط بعد التأكيد</span>
          </div>

          <h1 className="hero-title" style={{
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 900,
            color: 'white',
            lineHeight: 1.15,
            marginBottom: 20,
          }}>
            بيع وشراء{' '}
            <span style={{
              background: 'linear-gradient(135deg, #10B981, #2563EB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>الأصول الرقمية</span>
            <br />بأمان تام وثقة كاملة
          </h1>

          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.8, marginBottom: 40,
            maxWidth: 680, margin: '0 auto 40px',
          }}>
            Trust🔁Deal هي منصتك الموثوقة لتبادل الحسابات، الأصول الرقمية، الاشتراكات والخدمات — بوساطة أمينة تضمن حقوق الجميع.
          </p>

          {/* Search Bar */}
          <div className="hero-search-bar" style={{
            display: 'flex', gap: 0, maxWidth: 700,
            margin: '0 auto 40px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 16, overflow: 'hidden',
            backdropFilter: 'blur(10px)',
          }}>
            <select value={searchType} onChange={e => setSearchType(e.target.value)} style={{ padding: '16px 16px', background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'Tajawal, sans-serif', cursor: 'pointer', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              <option style={{ background: '#1E293B' }}>جميع الأقسام</option>
              <option style={{ background: '#1E293B' }}>حسابات سوشيال</option>
              <option style={{ background: '#1E293B' }}>أصول رقمية</option>
              <option style={{ background: '#1E293B' }}>اشتراكات</option>
              <option style={{ background: '#1E293B' }}>خدمات</option>
            </select>
            <input
              id="hero-search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="ابحث عن حساب، خدمة، أو اشتراك..."
              style={{ flex: 1, padding: '16px 20px', background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: 15, fontFamily: 'Tajawal, sans-serif' }}
            />
            <button id="hero-search-btn" onClick={handleSearch} style={{ padding: '16px 28px', background: 'linear-gradient(135deg, #10B981, #2563EB)', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: 15, fontFamily: 'Tajawal, sans-serif' }}>
              🔍 بحث
            </button>
          </div>

          {/* CTAs */}
          <div className="hero-cta" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/social-accounts" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '16px 36px', fontSize: 16, fontWeight: 800,
                background: 'linear-gradient(135deg, #10B981, #34D399)',
                border: 'none', borderRadius: 14, color: 'white', cursor: 'pointer',
                fontFamily: 'Tajawal, sans-serif',
                boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
                transition: 'all 0.3s',
              }}>🛒 تصفح الإعلانات</button>
            </Link>
            <Link href="/listings/create" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '16px 36px', fontSize: 16, fontWeight: 800,
                background: 'rgba(255,255,255,0.08)',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: 14, color: 'white', cursor: 'pointer',
                fontFamily: 'Tajawal, sans-serif',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s',
              }}>+ أضف إعلانك</button>
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{
            display: 'flex', gap: 24, justifyContent: 'center',
            marginTop: 48, flexWrap: 'wrap',
          }}>
            {['🔒 مدفوعات آمنة 100%', '✅ نظام Escrow مضمون', '⚡ إنجاز سريع', '💬 دعم 24/7'].map((badge, i) => (
              <div key={i} style={{
                color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>{badge}</div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          color: 'rgba(255,255,255,0.3)', fontSize: 12,
          animation: 'float 2s ease-in-out infinite',
        }}>
          <div>اكتشف المزيد</div>
          <div style={{ fontSize: 20 }}>↓</div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-block', padding: '6px 18px', borderRadius: 100,
              background: 'rgba(37,99,235,0.08)', color: '#2563EB',
              fontSize: 13, fontWeight: 700, marginBottom: 12,
            }}>الأقسام الرئيسية</div>
            <h2 className="section-title">اكتشف ما تبحث عنه</h2>
            <p className="section-subtitle">7 أقسام متخصصة لكل ما يتعلق بالأصول الرقمية</p>
          </div>
          <div className="cat-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 20,
          }}>
            {CATEGORIES.map(cat => (
              <Link key={cat.href} href={cat.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '28px 20px', borderRadius: 20, textAlign: 'center',
                  border: '1.5px solid #E2E8F0',
                  background: 'white',
                  cursor: 'pointer', transition: 'all 0.3s',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(-8px)';
                  el.style.borderColor = cat.color;
                  el.style.boxShadow = `0 20px 40px ${cat.color}20`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(0)';
                  el.style.borderColor = '#E2E8F0';
                  el.style.boxShadow = 'none';
                }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 16, fontSize: 28,
                    background: `${cat.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 14px',
                  }}>{cat.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>{cat.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BROWSE CTA */}
      <section style={{ padding: '60px 24px', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 100, background: 'rgba(16,185,129,0.08)', color: '#10B981', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>ابدأ الآن</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', marginBottom: 12 }}>اكتشف الإعلانات المتاحة</h2>
          <p style={{ color: '#64748B', fontSize: 16, marginBottom: 32, lineHeight: 1.7 }}>
            تصفح الإعلانات المنشورة من بائعين موثوقين وابدأ صفقتك بأمان عبر نظام Escrow
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/social-accounts" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>🛒 تصفح الإعلانات</button>
            </Link>
            <Link href="/listings/create" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '14px 32px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 14, color: '#0F172A', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>+ أضف إعلانك</button>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW ESCROW WORKS */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(160deg, #0F172A, #1E3A8A)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{
              display: 'inline-block', padding: '6px 18px', borderRadius: 100,
              background: 'rgba(16,185,129,0.1)', color: '#10B981',
              fontSize: 13, fontWeight: 700, marginBottom: 12,
              border: '1px solid rgba(16,185,129,0.2)',
            }}>نظام الوساطة الأمينة</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: 'white', marginBottom: 12 }}>
              كيف يعمل نظام <span style={{
                background: 'linear-gradient(135deg, #10B981, #34D399)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Escrow</span>؟
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>
              6 خطوات بسيطة تضمن حقوق البائع والمشتري معاً
            </p>
          </div>

          <div className="escrow-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 24,
          }}>
            {ESCROW_STEPS.map((step, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '32px 20px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.3s',
                position: 'relative',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: i === 2 || i === 5
                    ? 'linear-gradient(135deg, #10B981, #2563EB)'
                    : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, margin: '0 auto 16px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  boxShadow: i === 2 || i === 5 ? '0 8px 20px rgba(16,185,129,0.3)' : 'none',
                }}>{step.icon}</div>
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(16,185,129,0.15)',
                  color: '#10B981', fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{step.num}</div>
                <div style={{ color: 'white', fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{step.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 48, padding: 28,
            background: 'rgba(16,185,129,0.08)',
            borderRadius: 20,
            border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', gap: 20,
            flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 40 }}>💡</div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                نظام الإفراج التلقائي
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7 }}>
                إذا سلّم البائع المنتج ولم يرد المشتري خلال 3 أيام، يتم الإفراج عن المبلغ تلقائياً للبائع — حماية عادلة للجميع.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY TRUST DEAL */}
      <section style={{ padding: '80px 24px', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: 100,
            background: 'rgba(245,158,11,0.08)', color: '#F59E0B',
            fontSize: 13, fontWeight: 700, marginBottom: 16,
          }}>لماذا تختارنا</div>
          <h2 className="section-title">مزايا Trust🔁Deal</h2>
          <p className="section-subtitle">الأمان والثقة في كل خطوة</p>
          <div className="features-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24, marginTop: 8,
          }}>
            {[
              { icon: '🔒', title: 'أمان مالي تام', desc: 'نظام Escrow يضمن تأمين أموالك حتى اكتمال الصفقة بنجاح', color: '#2563EB' },
              { icon: '✅', title: 'حسابات موثقة', desc: 'نظام توثيق متكامل يضمن مصداقية البائعين والمشترين', color: '#10B981' },
              { icon: '⚡', title: 'إنجاز سريع', desc: 'معالجة فورية للمدفوعات وإشعارات فورية في كل مرحلة', color: '#F59E0B' },
              { icon: '⚖️', title: 'نزاعات عادلة', desc: 'فريق متخصص لحل النزاعات باحترافية وشفافية تامة', color: '#EF4444' },
              { icon: '💬', title: 'دعم 24/7', desc: 'فريق دعم متاح على مدار الساعة لمساعدتك في أي وقت', color: '#8B5CF6' },
              { icon: '📊', title: 'عمولة شفافة', desc: 'عمولة ثابتة 5% فقط، بدون رسوم خفية أو مفاجآت', color: '#06B6D4' },
            ].map((feat, i) => (
              <div key={i} style={{
                padding: '32px 24px', borderRadius: 20,
                background: 'white',
                border: '1.5px solid #E2E8F0',
                textAlign: 'center', transition: 'all 0.3s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = feat.color;
                el.style.transform = 'translateY(-6px)';
                el.style.boxShadow = `0 16px 32px ${feat.color}15`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = '#E2E8F0';
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
              }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: 18, fontSize: 32,
                  background: `${feat.color}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>{feat.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#0F172A', marginBottom: 10 }}>{feat.title}</div>
                <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{feat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #1E3A8A 0%, #10B981 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: 'white', marginBottom: 16 }}>
            ابدأ رحلتك الآن 🚀
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', marginBottom: 40, lineHeight: 1.7 }}>
            انضم إلى منصة Trust🔁Deal وابدأ البيع والشراء بأمان تام عبر نظام Escrow الاحترافي
          </p>
          <div className="cta-btns" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '18px 48px', fontSize: 18, fontWeight: 800,
                background: 'white',
                color: '#1E3A8A',
                border: 'none', borderRadius: 16, cursor: 'pointer',
                fontFamily: 'Tajawal, sans-serif',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                transition: 'all 0.3s',
              }}>إنشاء حساب مجاني</button>
            </Link>
            <Link href="/how-it-works" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '18px 48px', fontSize: 18, fontWeight: 800,
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: 16, cursor: 'pointer',
                fontFamily: 'Tajawal, sans-serif',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s',
              }}>كيف تعمل المنصة؟</button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

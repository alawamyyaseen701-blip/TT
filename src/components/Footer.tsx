import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)',
      color: 'white',
      padding: '64px 24px 32px',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Top Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 48,
          marginBottom: 48,
          paddingBottom: 48,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, #2563EB, #10B981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>🔁</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 20 }}>Trust🔁Deal</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>منصة الأمان الرقمي</div>
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              منصة الوساطة الأمينة لبيع وشراء الأصول الرقمية بشكل آمن وموثوق.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {['𝕏', '📘', '📺', '💬'].map((icon, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 16,
                  transition: 'all 0.2s',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>{icon}</div>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: '#10B981' }}>الأقسام الرئيسية</div>
            {[
              { href: '/social-accounts', label: '📱 حسابات سوشيال ميديا' },
              { href: '/digital-assets', label: '💎 الأصول الرقمية' },
              { href: '/store', label: '🛒 متجر المنتجات الرقمية' },
              { href: '/subscriptions', label: '⭐ الاشتراكات الرقمية' },
              { href: '/services', label: '⚡ الخدمات' },
              { href: '/auctions', label: '🔨 المزادات' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{
                display: 'block', color: 'rgba(255,255,255,0.55)',
                textDecoration: 'none', fontSize: 14,
                marginBottom: 10, transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'white'}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'}
              >{link.label}</Link>
            ))}
          </div>

          {/* How it works */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: '#10B981' }}>كيف تعمل</div>
            {[
              { href: '/how-it-works', label: 'نظام الوساطة Escrow' },
              { href: '/requests', label: 'نظام الطلبات' },
              { href: '/deals', label: 'صفقاتي' },
              { href: '/disputes', label: 'نظام النزاعات' },
              { href: '/verification', label: 'التوثيق الموثوق' },
              { href: '/auctions', label: 'المزادات المباشرة' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{
                display: 'block', color: 'rgba(255,255,255,0.55)',
                textDecoration: 'none', fontSize: 14,
                marginBottom: 10,
              }}>{link.label}</Link>
            ))}
          </div>

          {/* Support */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: '#10B981' }}>الدعم والمساعدة</div>
            <div style={{
              padding: 16, borderRadius: 14,
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>هل تحتاج مساعدة؟</div>
              <div style={{ fontSize: 20, marginBottom: 6 }}>💬</div>
              <div style={{ color: '#10B981', fontWeight: 700, fontSize: 14 }}>الدعم الفوري</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>متاح 24/7</div>
            </div>
            {[
              { href: '/faq', label: 'الأسئلة الشائعة' },
              { href: '/privacy', label: 'سياسة الخصوصية' },
              { href: '/terms', label: 'شروط الاستخدام' },
              { href: '/contact', label: 'تواصل معنا' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{
                display: 'block', color: 'rgba(255,255,255,0.55)',
                textDecoration: 'none', fontSize: 14,
                marginBottom: 10,
              }}>{link.label}</Link>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'flex', gap: 32, justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 32,
          padding: '24px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {[
            { val: '+50,000', label: 'مستخدم نشط' },
            { val: '+120,000', label: 'صفقة مكتملة' },
            { val: '0 اختراق', label: 'سجل أمان' },
            { val: '5%', label: 'فقط عمولة' },
            { val: '24/7', label: 'دعم مستمر' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: '#10B981' }}>{stat.val}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16,
          color: 'rgba(255,255,255,0.3)', fontSize: 13,
        }}>
          <div>© 2025 Trust🔁Deal. جميع الحقوق محفوظة.</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#10B981', display: 'inline-block',
              animation: 'pulse-glow 2s infinite',
            }}/>
            جميع الأنظمة تعمل بشكل طبيعي
          </div>
        </div>
      </div>
    </footer>
  );
}

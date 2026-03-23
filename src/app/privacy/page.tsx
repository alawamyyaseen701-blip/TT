'use client';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ marginBottom: 32 }}>
            <Link href="/" style={{ color: '#64748B', textDecoration: 'none', fontSize: 13 }}>← الرئيسية</Link>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0F172A', marginTop: 16, marginBottom: 8 }}>سياسة الخصوصية</h1>
            <p style={{ color: '#64748B', fontSize: 14 }}>آخر تحديث: مارس 2025</p>
          </div>

          {[
            { title: '1. جمع البيانات', content: 'نجمع فقط البيانات الضرورية لتشغيل المنصة: الاسم، البريد الإلكتروني، رقم الهاتف، وبيانات المعاملات. لا نبيع بياناتك لأطراف ثالثة أبداً.' },
            { title: '2. استخدام البيانات', content: 'تُستخدم بياناتك لإنشاء حسابك، معالجة الصفقات، إرسال الإشعارات، وتحسين خدماتنا. لا يُشارَك بريدك الإلكتروني مع مستخدمين آخرين.' },
            { title: '3. أمان البيانات', content: 'نستخدم تشفير AES-256 لحماية بيانات الحسابات الحساسة، وTLS/HTTPS لتشفير كل الاتصالات. كلمات المرور مشفرة ببروتوكول bcrypt ولا يمكن لأحد الاطلاع عليها.' },
            { title: '4. ملفات تعريف الارتباط (Cookies)', content: 'نستخدم Cookies لإبقائك مسجلاً الدخول فقط. لا نستخدم Cookies تتبعية لأغراض إعلانية.' },
            { title: '5. حقوقك', content: 'يمكنك في أي وقت طلب حذف حسابك وجميع بياناتك عبر صفحة الإعدادات أو التواصل معنا مباشرة.' },
            { title: '6. التواصل', content: 'لأي استفسار بخصوص الخصوصية، تواصل معنا عبر صفحة الرسائل أو البريد الإلكتروني المدرج في الموقع.' },
          ].map(section => (
            <div key={section.title} style={{ background: 'white', borderRadius: 16, padding: '24px 28px', border: '1.5px solid #E2E8F0', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>{section.title}</h2>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.8 }}>{section.content}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

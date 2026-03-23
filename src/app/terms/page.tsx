'use client';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ marginBottom: 32 }}>
            <Link href="/" style={{ color: '#64748B', textDecoration: 'none', fontSize: 13 }}>← الرئيسية</Link>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0F172A', marginTop: 16, marginBottom: 8 }}>الشروط والأحكام</h1>
            <p style={{ color: '#64748B', fontSize: 14 }}>آخر تحديث: مارس 2025</p>
          </div>

          {[
            { title: '1. القبول', content: 'باستخدامك لمنصة Trust🔁Deal فإنك توافق على هذه الشروط. إذا لم توافق، يرجى عدم استخدام المنصة.' },
            { title: '2. نظام Escrow', content: 'تعمل المنصة كوسيط أمين — أموال المشتري تُحتجز لدينا حتى يتحقق من استلام الأصل. لا يُطلق المال للبائع إلا بعد تأكيد المشتري أو بعد 72 ساعة من التأكيد.' },
            { title: '3. العمولة', content: 'تأخذ المنصة عمولة 5% من قيمة كل صفقة مكتملة. يحصل البائع على 95% من قيمة البيع.' },
            { title: '4. المحتوى المحظور', content: 'يُحظر بيع: حسابات مسروقة، محتوى مخالف للقانون، أي أصل تم الحصول عليه بطرق غير مشروعة. المخالفة تؤدي للحذف الفوري وإبلاغ الجهات المختصة.' },
            { title: '5. النزاعات', content: 'في حالة النزاع، يتدخل فريق المنصة للبت في القضية خلال 48 ساعة. قراراتنا نهائية وملزمة للطرفين.' },
            { title: '6. فترة الحماية', content: 'بعد تأكيد المشتري يبدأ 72 ساعة فترة حماية. خلالها يمكن للمشتري الإبلاغ عن استرداد الحساب وتجميد أموال البائع فوراً.' },
            { title: '7. المسؤولية', content: 'المنصة وسيط فقط ولا تتحمل مسؤولية جودة الأصول المباعة. نوفر نظام Escrow كضمان للمعاملة الآمنة.' },
            { title: '8. تعديل الشروط', content: 'يحق لنا تعديل هذه الشروط في أي وقت مع إشعار المستخدمين بالبريد الإلكتروني أو عبر الإشعارات.' },
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

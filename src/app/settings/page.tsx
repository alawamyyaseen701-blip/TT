'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const SETTINGS_TABS = [
  { id: 'notifications', label: '🔔 الإشعارات' },
  { id: 'privacy', label: '🔒 الخصوصية' },
  { id: 'appearance', label: '🎨 المظهر' },
  { id: 'danger', label: '⚠️ منطقة الخطر' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifSettings, setNotifSettings] = useState({
    newOffer: true, dealUpdate: true, payment: true, newMessage: true,
    marketingEmails: false, weeklyReport: true,
  });
  const [privacySettings, setPrivacySettings] = useState({
    showPhone: false, showEmail: false, allowMessages: true, showOnlineStatus: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, background: value ? '#10B981' : '#CBD5E1', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, right: value ? 3 : 23, transition: 'right 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );

  const SettingRow = ({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: () => void }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
      <div>
        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{desc}</div>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'start' }}>

          {/* Sidebar */}
          <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '16px 16px 8px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>الإعدادات</div>
            {SETTINGS_TABS.map(tab => (
              <button key={tab.id} id={`settings-tab-${tab.id}`} onClick={() => setActiveTab(tab.id)}
                style={{ width: '100%', padding: '12px 16px', border: 'none', background: activeTab === tab.id ? 'rgba(30,58,138,0.07)' : 'white', color: activeTab === tab.id ? '#1E3A8A' : '#64748B', fontWeight: activeTab === tab.id ? 800 : 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', textAlign: 'right', borderRight: activeTab === tab.id ? '3px solid #1E3A8A' : '3px solid transparent' }}>
                {tab.label}
              </button>
            ))}
            <div style={{ padding: '8px 16px 16px' }}>
              <Link href="/profile/edit">
                <button style={{ width: '100%', padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: 'white', color: '#1E3A8A', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  ← تعديل الملف
                </button>
              </Link>
            </div>
          </div>

          {/* Content */}
          <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {saved && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
                ✓ تم حفظ الإعدادات بنجاح
              </div>
            )}

            {activeTab === 'notifications' && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>إعدادات الإشعارات</h2>
                <SettingRow label="عروض جديدة" desc="عند تلقي عرض على طلباتك" value={notifSettings.newOffer} onChange={() => setNotifSettings(s => ({ ...s, newOffer: !s.newOffer }))} />
                <SettingRow label="تحديثات الصفقات" desc="عند تغيير حالة صفقة نشطة" value={notifSettings.dealUpdate} onChange={() => setNotifSettings(s => ({ ...s, dealUpdate: !s.dealUpdate }))} />
                <SettingRow label="تحويلات المدفوعات" desc="عند تحرير أموال Escrow" value={notifSettings.payment} onChange={() => setNotifSettings(s => ({ ...s, payment: !s.payment }))} />
                <SettingRow label="رسائل جديدة" desc="عند وصول رسالة من مستخدم" value={notifSettings.newMessage} onChange={() => setNotifSettings(s => ({ ...s, newMessage: !s.newMessage }))} />
                <SettingRow label="إيميلات تسويقية" desc="عروض وأخبار المنصة" value={notifSettings.marketingEmails} onChange={() => setNotifSettings(s => ({ ...s, marketingEmails: !s.marketingEmails }))} />
                <SettingRow label="تقرير أسبوعي" desc="ملخص أسبوعي لنشاطك" value={notifSettings.weeklyReport} onChange={() => setNotifSettings(s => ({ ...s, weeklyReport: !s.weeklyReport }))} />
              </>
            )}

            {activeTab === 'privacy' && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>إعدادات الخصوصية</h2>
                <SettingRow label="إظهار رقم الهاتف" desc="للمستخدمين الآخرين في الملف العام" value={privacySettings.showPhone} onChange={() => setPrivacySettings(s => ({ ...s, showPhone: !s.showPhone }))} />
                <SettingRow label="إظهار البريد الإلكتروني" desc="للمستخدمين الآخرين في الملف العام" value={privacySettings.showEmail} onChange={() => setPrivacySettings(s => ({ ...s, showEmail: !s.showEmail }))} />
                <SettingRow label="السماح بالرسائل" desc="السماح للمستخدمين بمراسلتك" value={privacySettings.allowMessages} onChange={() => setPrivacySettings(s => ({ ...s, allowMessages: !s.allowMessages }))} />
                <SettingRow label="إظهار حالة الاتصال" desc="إظهار 'متصل الآن' للآخرين" value={privacySettings.showOnlineStatus} onChange={() => setPrivacySettings(s => ({ ...s, showOnlineStatus: !s.showOnlineStatus }))} />
              </>
            )}

            {activeTab === 'appearance' && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>إعدادات المظهر</h2>
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.8, padding: '20px', background: '#F8FAFC', borderRadius: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🌙</div>
                  الوضع الداكن والإعدادات المتقدمة قيد التطوير
                </div>
              </>
            )}

            {activeTab === 'danger' && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#DC2626', marginBottom: 20 }}>⚠️ منطقة الخطر</h2>
                <div style={{ padding: 20, borderRadius: 16, border: '1.5px solid #FEE2E2', background: '#FFF5F5' }}>
                  <div style={{ fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>حذف الحساب نهائياً</div>
                  <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
                    سيتم حذف جميع بياناتك وإعلاناتك بشكل نهائي ولا يمكن التراجع. يجب إتمام أو إلغاء جميع الصفقات النشطة أولاً.
                  </div>
                  <button id="delete-account-btn" style={{ padding: '11px 24px', border: 'none', borderRadius: 12, background: '#EF4444', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
                    onClick={() => confirm('هل أنت متأكد؟ هذا الإجراء لا يمكن التراجع عنه.')}>
                    🗑️ حذف حسابي نهائياً
                  </button>
                </div>
              </>
            )}

            {activeTab !== 'danger' && activeTab !== 'appearance' && (
              <button id="save-settings-btn" onClick={handleSave}
                style={{ marginTop: 24, padding: '13px 32px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                حفظ الإعدادات
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

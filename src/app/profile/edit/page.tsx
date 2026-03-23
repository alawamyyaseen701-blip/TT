'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const COUNTRIES = ['SA', 'EG', 'AE', 'KW', 'QA', 'BH', 'JO', 'IQ', 'SY', 'MA', 'DZ', 'TN', 'LY', 'YE', 'Other'];
const COUNTRY_NAMES: Record<string, string> = {
  SA: '🇸🇦 السعودية', EG: '🇪🇬 مصر', AE: '🇦🇪 الإمارات', KW: '🇰🇼 الكويت', QA: '🇶🇦 قطر',
  BH: '🇧🇭 البحرين', JO: '🇯🇴 الأردن', IQ: '🇮🇶 العراق', SY: '🇸🇾 سوريا', MA: '🇲🇦 المغرب',
  DZ: '🇩🇿 الجزائر', TN: '🇹🇳 تونس', LY: '🇱🇾 ليبيا', YE: '🇾🇪 اليمن', Other: '🌍 أخرى',
};

export default function EditProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: 'أحمد محمد',
    username: 'ahmed_2025',
    bio: 'متداول في الأصول الرقمية منذ 3 سنوات.',
    country: 'SA',
    phone: '+966 5xxxxxxxx',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ displayName: form.displayName, bio: form.bio, country: form.country, phone: form.phone }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'خطأ في الحفظ'); return; }
      setSuccess('تم حفظ الملف الشخصي بنجاح ✓');
    } catch { setError('خطأ في الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { setError('كلمات المرور الجديدة غير متطابقة'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'خطأ في تغيير كلمة المرور'); return; }
      setSuccess('تم تغيير كلمة المرور بنجاح ✓');
      setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch { setError('خطأ في الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12,
    fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', background: 'white',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1E3A8A, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 28 }}>
              {form.displayName.charAt(0)}
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>تعديل الملف الشخصي</h1>
              <p style={{ color: '#64748B', fontSize: 14 }}>@{form.username}</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'white', borderRadius: 14, padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {[
              { id: 'profile' as const, label: '👤 البيانات الأساسية' },
              { id: 'security' as const, label: '🔐 كلمة المرور' },
            ].map(tab => (
              <button key={tab.id} id={`edit-tab-${tab.id}`} onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 10, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#64748B' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {(success || error) && (
            <div style={{ padding: '14px 18px', borderRadius: 14, marginBottom: 20,
              background: success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: success ? '#059669' : '#DC2626', fontSize: 14, fontWeight: 600 }}>
              {success || `⚠️ ${error}`}
            </div>
          )}

          <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {activeTab === 'profile' ? (
              <form onSubmit={handleSaveProfile}>
                <div style={{ display: 'grid', gap: 18 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>الاسم الظاهر *</label>
                    <input id="edit-display-name" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })}
                      required style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>نبذة شخصية</label>
                    <textarea id="edit-bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3}
                      placeholder="أخبر الآخرين عن نفسك..." style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>رقم الهاتف</label>
                      <input id="edit-phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>الدولة</label>
                      <select id="edit-country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}
                        style={{ ...inputStyle, background: 'white' }}>
                        {COUNTRIES.map(c => <option key={c} value={c}>{COUNTRY_NAMES[c]}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button type="button" onClick={() => router.back()} style={{ flex: 1, padding: '13px', border: '1.5px solid #E2E8F0', borderRadius: 14, background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    إلغاء
                  </button>
                  <button id="save-profile-btn" type="submit" disabled={loading}
                    style={{ flex: 2, padding: '13px', border: 'none', borderRadius: 14, background: loading ? 'rgba(30,58,138,0.5)' : 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    {loading ? '⏳ جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePassword}>
                <div style={{ display: 'grid', gap: 18 }}>
                  {[
                    { id: 'current-pw', key: 'currentPassword', label: 'كلمة المرور الحالية' },
                    { id: 'new-pw', key: 'newPassword', label: 'كلمة المرور الجديدة' },
                    { id: 'confirm-pw', key: 'confirmPassword', label: 'تأكيد كلمة المرور الجديدة' },
                  ].map(f => (
                    <div key={f.id}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>{f.label}</label>
                      <input id={f.id} type="password" required value={form[f.key as keyof typeof form] as string}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder="••••••••" style={inputStyle} />
                    </div>
                  ))}
                  {form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword && (
                    <div style={{ color: '#DC2626', fontSize: 13 }}>⚠️ كلمات المرور الجديدة غير متطابقة</div>
                  )}
                </div>
                <button id="change-password-btn" type="submit" disabled={loading}
                  style={{ width: '100%', marginTop: 24, padding: '13px', border: 'none', borderRadius: 14, background: loading ? 'rgba(239,68,68,0.5)' : '#EF4444', color: 'white', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  {loading ? '⏳ جاري التغيير...' : '🔐 تغيير كلمة المرور'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

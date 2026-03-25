'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = { auto: '⚡ تلقائي', manual: '🖐️ يدوي' };
const TYPE_COLORS: Record<string, string> = { auto: '#10B981', manual: '#F59E0B' };

export default function PaymentMethodsAdminPage() {
  const [methods,  setMethods]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState('');
  const [editing,  setEditing]  = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [msg,      setMsg]      = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetch('/api/admin/payment-methods', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setMethods(d.data.methods); })
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id: string, enabled: boolean) => {
    setSaving(id);
    const res  = await fetch('/api/admin/payment-methods', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, enabled }),
    });
    const data = await res.json();
    if (data.success) setMethods(m => m.map(x => x.id === id ? { ...x, enabled } : x));
    setSaving('');
  };

  const startEdit = (method: any) => {
    setEditing(method.id);
    setEditData({ address: method.address || '', label: method.label, description: method.description });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(editing);
    const res  = await fetch('/api/admin/payment-methods', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: editing, ...editData }),
    });
    const data = await res.json();
    if (data.success) {
      setMethods(m => m.map(x => x.id === editing ? { ...x, ...editData } : x));
      setMsg('✅ تم الحفظ بنجاح');
      setTimeout(() => setMsg(''), 3000);
    }
    setSaving(''); setEditing(null);
  };

  const activeCount  = methods.filter(m => m.enabled).length;
  const manualCount  = methods.filter(m => m.enabled && m.type === 'manual').length;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0F172A,#1E3A8A)', padding: '20px 24px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>← لوحة التحكم</Link>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>💳 طرق الدفع</div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { icon: '✅', val: activeCount,           label: 'طريقة مفعّلة',   color: '#10B981' },
            { icon: '🖐️', val: manualCount,            label: 'يدوية (تحقق)',   color: '#F59E0B' },
            { icon: '📦', val: methods.length,          label: 'إجمالي الطرق',   color: '#6366F1' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E2E8F0', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {msg && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)', color: '#059669', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
            {msg}
          </div>
        )}

        {/* Methods list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontSize: 40 }}>⏳</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {methods.map(m => (
              <div key={m.id} style={{ background: 'white', borderRadius: 18, border: `2px solid ${m.enabled ? '#10B981' : '#E2E8F0'}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'border-color 0.3s' }}>
                {/* Method header */}
                <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: m.enabled ? 'linear-gradient(135deg,#10B98120,#10B98108)' : '#F8FAFC', border: `1.5px solid ${m.enabled ? '#10B98140' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    {m.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{m.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLORS[m.type], background: `${TYPE_COLORS[m.type]}15`, padding: '2px 8px', borderRadius: 100 }}>
                        {TYPE_LABELS[m.type]}
                      </span>
                      {!m.enabled && <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', background: '#F1F5F9', padding: '2px 8px', borderRadius: 100 }}>معطّل</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{m.description}</div>
                    {m.address && m.enabled && (
                      <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 4, background: '#F0FDF4', padding: '4px 10px', borderRadius: 8, display: 'inline-block' }}>
                        📍 {m.address}
                      </div>
                    )}
                    {m.type === 'manual' && m.enabled && !m.address && (
                      <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, marginTop: 4 }}>⚠️ العنوان غير مضبوط — لن يظهر للمشتري!</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                    {/* Edit btn */}
                    <button onClick={() => startEdit(m)} style={{ padding: '8px 16px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: 'white', color: '#374151', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                      ✏️ تعديل
                    </button>
                    {/* Toggle switch */}
                    <button
                      id={`toggle-${m.id}`}
                      onClick={() => toggle(m.id, !m.enabled)}
                      disabled={saving === m.id}
                      style={{ position: 'relative', width: 56, height: 30, borderRadius: 100, border: 'none', background: m.enabled ? '#10B981' : '#CBD5E1', cursor: saving === m.id ? 'wait' : 'pointer', transition: 'background 0.3s', flexShrink: 0 }}>
                      <span style={{ position: 'absolute', top: 3, right: m.enabled ? 3 : 'auto', left: m.enabled ? 'auto' : 3, width: 24, height: 24, borderRadius: '50%', background: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', transition: 'all 0.3s', display: 'block' }} />
                    </button>
                  </div>
                </div>

                {/* Edit panel */}
                {editing === m.id && (
                  <div style={{ padding: '0 22px 20px', borderTop: '1px solid #F1F5F9', paddingTop: 16, background: '#FAFBFC' }}>
                    {m.type === 'manual' && (
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                          📍 {m.note}
                        </label>
                        <input
                          value={editData.address}
                          onChange={e => setEditData({ ...editData, address: e.target.value })}
                          placeholder="أدخل العنوان أو الـ ID..."
                          style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>🏷️ الاسم (اختياري)</label>
                      <input
                        value={editData.label}
                        onChange={e => setEditData({ ...editData, label: e.target.value })}
                        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={saveEdit} disabled={saving === m.id} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: 13 }}>
                        {saving === m.id ? '⏳ جاري...' : '💾 حفظ'}
                      </button>
                      <button onClick={() => setEditing(null)} style={{ padding: '10px 20px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: 13 }}>
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

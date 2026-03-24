'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { Suspense } from 'react';

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  /* activeConvId is always a STRING (Firebase user IDs are strings) */
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeName,   setActiveName]   = useState<string>('');
  const [messages,     setMessages]     = useState<any[]>([]);
  const [input,        setInput]        = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs,  setLoadingMsgs]  = useState(false);
  const [sending,      setSending]      = useState(false);
  const [searchQ,      setSearchQ]      = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef        = useRef<NodeJS.Timeout | null>(null);

  const token       = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

  /* ── Fetch conversation list ── */
  const fetchConversations = useCallback(async () => {
    try {
      const res  = await fetch('/api/messages', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) setConversations(data.data?.conversations || []);
    } catch { /* ignore */ }
    finally { setLoadingConvs(false); }
  }, [token]);

  /* ── Fetch messages for a specific user ── */
  const fetchMessages = useCallback(async (otherId: string) => {
    setLoadingMsgs(true);
    try {
      const res  = await fetch(`/api/messages?with=${otherId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) setMessages(data.data?.messages || []);
    } catch { /* ignore */ }
    finally { setLoadingMsgs(false); }
  }, [token]);

  /* ── Open a conversation with a specific user ID ──
     Called both from ?with= query param and from conversation list click */
  const openConversation = useCallback((otherId: string, displayName?: string) => {
    setActiveConvId(otherId);
    if (displayName) setActiveName(displayName);
    fetchMessages(otherId);
    // Start polling
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchMessages(otherId), 5000);
  }, [fetchMessages]);

  /* ── Initial load + handle ?with= query param ── */
  useEffect(() => {
    if (!token) { router.replace('/auth/login?redirect=/messages'); return; }
    fetchConversations();

    const withParam = searchParams.get('with');
    if (withParam) {
      // withParam is the seller's user ID (string)
      openConversation(withParam);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  /* ── Send message ── */
  const sendMessage = async () => {
    if (!input.trim() || !activeConvId) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    // Optimistic
    const optimistic = {
      id: `opt-${Date.now()}`,
      sender_id: currentUser?.id,
      content: text,
      type: 'text',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ receiverId: activeConvId, content: text }),
      });
      await fetchMessages(activeConvId);
      await fetchConversations();
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  /* ── Helpers ── */
  // Find current active conversation from list (string comparison)
  const activeConv = conversations.find(
    (c: any) => String(c.other_user_id) === String(activeConvId)
  ) || null;

  const displayName = activeConv?.other_display_name || activeConv?.other_username || activeName || `مستخدم`;

  const filtered = conversations.filter((c: any) =>
    !searchQ || c.other_display_name?.toLowerCase().includes(searchQ.toLowerCase())
  );

  const formatTime = (iso: string) => {
    const d    = new Date(iso);
    const now  = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000)  return d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'أمس';
    return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 72px)', marginTop: 72, overflow: 'hidden' }}>

        {/* ── Conversations List ── */}
        <div style={{ width: 320, background: 'white', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '20px 16px', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>الرسائل 💬</div>
            <input
              id="conv-search"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="🔍 بحث في المحادثات..."
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 13, outline: 'none', background: '#F8FAFC', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConvs ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ margin: '8px 12px', height: 64, borderRadius: 12, background: '#F8FAFC', animation: 'pulse 1.5s infinite' }} />
              ))
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94A3B8' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
                <div style={{ fontSize: 13 }}>لا توجد محادثات بعد</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>اضغط "مراسلة البائع" من أي إعلان لبدء محادثة</div>
              </div>
            ) : filtered.map((conv: any) => {
              const isActive = String(conv.other_user_id) === String(activeConvId);
              const initials = (conv.other_display_name || conv.other_username || 'م').charAt(0);
              return (
                <div
                  key={conv.other_user_id}
                  id={`conv-${conv.other_user_id}`}
                  onClick={() => openConversation(String(conv.other_user_id), conv.other_display_name || conv.other_username)}
                  style={{ padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', background: isActive ? 'rgba(30,58,138,0.06)' : 'transparent', borderRight: isActive ? '3px solid #1E3A8A' : '3px solid transparent', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: isActive ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: isActive ? 'white' : '#64748B', fontWeight: 900, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.other_display_name || conv.other_username}
                      </span>
                      <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0, marginRight: 4 }}>
                        {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {conv.last_message || 'ابدأ المحادثة...'}
                      </span>
                      {conv.unread_count > 0 && (
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#EF4444', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 4 }}>
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Chat Area ── */}
        {!activeConvId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 64 }}>💬</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>اختر محادثة</div>
            <div style={{ fontSize: 14, color: '#94A3B8' }}>أو اضغط "مراسلة البائع" من أي إعلان</div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Chat Header */}
            <div style={{ padding: '14px 24px', background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'white', fontWeight: 900, flexShrink: 0 }}>
                {displayName.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>{displayName}</div>
                {activeConv?.other_username && (
                  <Link href={`/profile/${activeConv.other_username}`} style={{ fontSize: 12, color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
                    عرض الملف الشخصي ←
                  </Link>
                )}
              </div>
              {activeConv?.deal_id && (
                <Link href={`/deals/${activeConv.deal_id}`} style={{ textDecoration: 'none' }}>
                  <button style={{ padding: '8px 16px', background: 'rgba(30,58,138,0.06)', border: '1.5px solid #E2E8F0', borderRadius: 10, color: '#1E3A8A', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    🤝 الصفقة
                  </button>
                </Link>
              )}
              <button id="report-conv-btn" style={{ width: 38, height: 38, borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚠️</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingMsgs ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>⏳ جاري التحميل...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>👋</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>ابدأ المحادثة الآن</div>
                  <div style={{ fontSize: 13 }}>اكتب رسالتك أدناه</div>
                </div>
              ) : messages.map((msg: any) => {
                const isMe = String(msg.sender_id) === String(currentUser?.id);
                if (msg.type === 'system') return (
                  <div key={msg.id} style={{ textAlign: 'center', margin: '8px 0' }}>
                    <div style={{ display: 'inline-block', padding: '8px 18px', borderRadius: 100, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981', fontSize: 12, fontWeight: 600 }}>
                      🔒 {msg.content}
                    </div>
                  </div>
                );
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-start' : 'flex-end', gap: 8 }}>
                    {!isMe && (
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, alignSelf: 'flex-end', fontWeight: 900 }}>
                        {displayName.charAt(0)}
                      </div>
                    )}
                    <div style={{ maxWidth: '65%', padding: '12px 16px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : 'white', color: isMe ? 'white' : '#0F172A', fontSize: 14, lineHeight: 1.6, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: !isMe ? '1px solid #E2E8F0' : 'none' }}>
                      <div>{msg.content}</div>
                      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, textAlign: isMe ? 'left' : 'right' }}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '16px 24px', background: 'white', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <textarea
                id="message-input-chat"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="اكتب رسالتك..."
                rows={1}
                style={{ flex: 1, padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: 14, fontFamily: 'Tajawal, sans-serif', fontSize: 14, resize: 'none', outline: 'none', maxHeight: 120, overflowY: 'auto', transition: 'border-color 0.2s' }}
                onFocus={e  => e.target.style.borderColor = '#2563EB'}
                onBlur={e   => e.target.style.borderColor = '#E2E8F0'}
              />
              <button
                id="send-btn"
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                style={{ width: 44, height: 44, borderRadius: 14, background: (input.trim() && !sending) ? 'linear-gradient(135deg, #10B981, #2563EB)' : '#F1F5F9', border: 'none', cursor: (input.trim() && !sending) ? 'pointer' : 'default', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
              >
                {sending ? '⏳' : '➤'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: 48 }}>⏳</div></div>}>
      <MessagesContent />
    </Suspense>
  );
}

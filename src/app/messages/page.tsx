'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { Suspense } from 'react';

/* ── Read-receipt tick component ── */
function Ticks({ msg, currentUserId }: { msg: any; currentUserId: string }) {
  const isMe = String(msg.sender_id) === String(currentUserId);
  if (!isMe) return null;

  const seen = !!msg.read_at;
  return (
    <span style={{ marginRight: 4, fontSize: 13, display: 'inline-flex', alignItems: 'center' }}>
      {seen ? (
        // ✓✓ green = seen
        <span title="تمت المشاهدة" style={{ color: '#10B981', fontWeight: 900, letterSpacing: -2 }}>✓✓</span>
      ) : (
        // ✓✓ grey = delivered (sent)
        <span title="تم الإرسال" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: -2 }}>✓✓</span>
      )}
    </span>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId,  setActiveConvId]  = useState<string | null>(null);
  const [activeName,    setActiveName]    = useState<string>('');
  const [messages,      setMessages]      = useState<any[]>([]);
  const [input,         setInput]         = useState('');
  const [loadingConvs,  setLoadingConvs]  = useState(true);
  const [loadingMsgs,   setLoadingMsgs]   = useState(false);
  const [sending,       setSending]       = useState(false);
  const [searchQ,       setSearchQ]       = useState('');
  const [isTyping,      setIsTyping]      = useState(false);   // other user typing?
  const [typingTimer,   setTypingTimer]   = useState<NodeJS.Timeout | null>(null);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const pollMsgRef      = useRef<NodeJS.Timeout | null>(null);
  const pollConvRef     = useRef<NodeJS.Timeout | null>(null);
  const pollTypingRef   = useRef<NodeJS.Timeout | null>(null);
  const activeConvIdRef = useRef<string | null>(null);

  const token       = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  /* ── Fetch conversations ── */
  const fetchConversations = useCallback(async () => {
    try {
      const res  = await fetch('/api/messages', { headers });
      const data = await res.json();
      if (data.success) setConversations(data.data?.conversations || []);
    } catch { /* ignore */ }
    finally { setLoadingConvs(false); }
  }, []);

  /* ── Fetch messages for active conversation ── */
  const fetchMessages = useCallback(async (otherId: string, markRead = false) => {
    try {
      const res  = await fetch(`/api/messages?with=${otherId}`, { headers });
      const data = await res.json();
      if (data.success) setMessages(data.data?.messages || []);

      // Mark as read
      if (markRead) {
        fetch(`/api/messages/read?with=${otherId}`, { method: 'PATCH', headers }).catch(() => {});
      }
    } catch { /* ignore */ }
    finally { setLoadingMsgs(false); }
  }, []);

  /* ── Check if other user is typing ── */
  const checkTyping = useCallback(async (otherId: string) => {
    try {
      const res  = await fetch(`/api/messages/typing?with=${otherId}`, { headers });
      const data = await res.json();
      setIsTyping(data.data?.typing || false);
    } catch { /* ignore */ }
  }, []);

  /* ── Tell server I'm typing ── */
  const sendTyping = useCallback((isT: boolean, otherId: string) => {
    fetch('/api/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ receiverId: otherId, isTyping: isT }),
    }).catch(() => {});
  }, []);

  /* ── Open conversation ── */
  const openConversation = useCallback((otherId: string, displayName?: string) => {
    // Clear previous polling
    if (pollMsgRef.current)    clearInterval(pollMsgRef.current);
    if (pollTypingRef.current) clearInterval(pollTypingRef.current);

    setActiveConvId(otherId);
    activeConvIdRef.current = otherId;
    if (displayName) setActiveName(displayName);
    setMessages([]);
    setIsTyping(false);
    setLoadingMsgs(true);

    fetchMessages(otherId, true);

    // Poll messages every 2 sec
    pollMsgRef.current = setInterval(() => {
      if (activeConvIdRef.current) fetchMessages(activeConvIdRef.current, true);
    }, 2000);

    // Poll typing every 1.5 sec
    pollTypingRef.current = setInterval(() => {
      if (activeConvIdRef.current) checkTyping(activeConvIdRef.current);
    }, 1500);
  }, [fetchMessages, checkTyping]);

  /* ── Init ── */
  useEffect(() => {
    if (!token) { router.replace('/auth/login?redirect=/messages'); return; }
    fetchConversations();

    // Poll conversations every 5 sec (for new message badges)
    pollConvRef.current = setInterval(fetchConversations, 5000);

    const withParam = searchParams.get('with');
    if (withParam) openConversation(withParam);

    return () => {
      if (pollMsgRef.current)    clearInterval(pollMsgRef.current);
      if (pollConvRef.current)   clearInterval(pollConvRef.current);
      if (pollTypingRef.current) clearInterval(pollTypingRef.current);
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* ── Input: handle typing indicator ── */
  const handleInput = (val: string) => {
    setInput(val);
    if (!activeConvIdRef.current) return;

    sendTyping(true, activeConvIdRef.current);

    // Stop typing after 3 sec idle
    if (typingTimer) clearTimeout(typingTimer);
    const t = setTimeout(() => sendTyping(false, activeConvIdRef.current!), 3000);
    setTypingTimer(t);
  };

  /* ── Send message ── */
  const sendMessage = async () => {
    if (!input.trim() || !activeConvId) return;
    const text = input.trim();
    setInput('');
    if (typingTimer) clearTimeout(typingTimer);
    sendTyping(false, activeConvId);
    setSending(true);

    // Optimistic
    const optimistic = {
      id: `opt-${Date.now()}`,
      sender_id: currentUser?.id,
      content: text,
      type: 'text',
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ receiverId: activeConvId, content: text }),
      });
      fetchMessages(activeConvId);
      fetchConversations();
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  /* ── Helpers ── */
  const activeConv = conversations.find(
    (c: any) => String(c.other_user_id) === String(activeConvId)
  ) || null;

  const displayName = activeConv?.other_display_name || activeConv?.other_username || activeName || 'محادثة';

  const filtered = conversations.filter((c: any) =>
    !searchQ || (c.other_display_name || c.other_username || '').toLowerCase().includes(searchQ.toLowerCase())
  );

  const formatTime = (iso: string) => {
    const d    = new Date(iso);
    const now  = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000)  return d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'أمس';
    return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      <Header />
      <div className="messages-layout" style={{ display: 'flex', flex: 1, height: 'calc(100vh - 72px)', marginTop: 72, overflow: 'hidden' }}>

        {/* ── Sidebar: Conversations ── */}
        <div className="messages-sidebar" style={{ width: 320, background: 'white', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>الرسائل 💬</div>
              {totalUnread > 0 && (
                <span style={{ padding: '2px 8px', borderRadius: 100, background: '#EF4444', color: 'white', fontSize: 11, fontWeight: 800 }}>
                  {totalUnread}
                </span>
              )}
            </div>
            <input
              id="conv-search"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="🔍 بحث..."
              style={{ width: '100%', padding: '9px 14px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 13, outline: 'none', background: '#F8FAFC', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConvs ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ margin: '8px 12px', height: 64, borderRadius: 12, background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              ))
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94A3B8' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>لا توجد محادثات بعد</div>
                <div style={{ fontSize: 12 }}>اضغط "مراسلة البائع" من أي إعلان</div>
              </div>
            ) : filtered.map((conv: any) => {
              const isActive = String(conv.other_user_id) === String(activeConvId);
              const initials = (conv.other_display_name || conv.other_username || 'م').charAt(0);
              return (
                <div
                  key={conv.other_user_id}
                  id={`conv-${conv.other_user_id}`}
                  onClick={() => openConversation(String(conv.other_user_id), conv.other_display_name || conv.other_username)}
                  style={{ padding: '13px 16px', cursor: 'pointer', background: isActive ? 'rgba(30,58,138,0.05)' : 'transparent', borderRight: isActive ? '3px solid #1E3A8A' : '3px solid transparent', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: isActive ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : 'linear-gradient(135deg, #F1F5F9, #E2E8F0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: isActive ? 'white' : '#64748B', fontWeight: 900, flexShrink: 0 }}>
                      {initials}
                    </div>
                    {/* online dot placeholder */}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.other_display_name || conv.other_username}
                      </span>
                      <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0, marginRight: 4 }}>
                        {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: conv.unread_count > 0 ? '#0F172A' : '#94A3B8', fontWeight: conv.unread_count > 0 ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {conv.last_message || 'ابدأ المحادثة...'}
                      </span>
                      {conv.unread_count > 0 && (
                        <span style={{ minWidth: 20, height: 20, padding: '0 5px', borderRadius: 100, background: '#EF4444', color: 'white', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 4 }}>
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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#94A3B8' }}>
            <div style={{ fontSize: 72, opacity: 0.3 }}>💬</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>اختر محادثة</div>
            <div style={{ fontSize: 14 }}>أو اضغط "مراسلة البائع" من أي إعلان</div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Chat Header */}
            <div style={{ padding: '12px 24px', background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'white', fontWeight: 900, flexShrink: 0 }}>
                {displayName.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>{displayName}</div>
                <div style={{ fontSize: 12, color: isTyping ? '#10B981' : '#94A3B8', fontWeight: isTyping ? 700 : 400, transition: 'color 0.3s' }}>
                  {isTyping ? '✏️ يكتب الآن...' : (activeConv?.other_username ? `@${activeConv.other_username}` : '')}
                </div>
              </div>
              {activeConv?.deal_id && (
                <Link href={`/deals/${activeConv.deal_id}`} style={{ textDecoration: 'none' }}>
                  <button style={{ padding: '8px 16px', background: 'rgba(30,58,138,0.06)', border: '1.5px solid #E2E8F0', borderRadius: 10, color: '#1E3A8A', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    🤝 الصفقة
                  </button>
                </Link>
              )}
            </div>

            {/* Messages */}
            <div
              style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8, background: '#F8FAFC' }}
            >
              {loadingMsgs ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>⏳ جاري التحميل...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>👋</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>ابدأ المحادثة</div>
                  <div style={{ fontSize: 13 }}>اكتب رسالتك أدناه</div>
                </div>
              ) : messages.map((msg: any) => {
                const isMe = String(msg.sender_id) === String(currentUser?.id);
                if (msg.type === 'system') return (
                  <div key={msg.id} style={{ textAlign: 'center', margin: '6px 0' }}>
                    <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 100, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981', fontSize: 12, fontWeight: 600 }}>
                      🔒 {msg.content}
                    </span>
                  </div>
                );
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-start' : 'flex-end', gap: 8, alignItems: 'flex-end' }}>
                    {!isMe && (
                      <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, #F1F5F9, #E2E8F0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, fontWeight: 800, color: '#64748B' }}>
                        {displayName.charAt(0)}
                      </div>
                    )}
                    <div style={{ maxWidth: '62%' }}>
                      <div style={{ padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : 'white', color: isMe ? 'white' : '#0F172A', fontSize: 14, lineHeight: 1.6, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: !isMe ? '1px solid #E2E8F0' : 'none' }}>
                        {msg.content}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-start' : 'flex-end', gap: 4, marginTop: 3, paddingInline: 4 }}>
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>{formatTime(msg.created_at)}</span>
                        {isMe && <Ticks msg={msg} currentUserId={currentUser?.id} />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, #F1F5F9, #E2E8F0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#64748B' }}>
                    {displayName.charAt(0)}
                  </div>
                  <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'white', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ animation: 'bounce 1s infinite 0ms',    width: 7, height: 7, borderRadius: '50%', background: '#94A3B8', display: 'inline-block' }} />
                      <span style={{ animation: 'bounce 1s infinite 150ms',  width: 7, height: 7, borderRadius: '50%', background: '#94A3B8', display: 'inline-block' }} />
                      <span style={{ animation: 'bounce 1s infinite 300ms',  width: 7, height: 7, borderRadius: '50%', background: '#94A3B8', display: 'inline-block' }} />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 20px', background: 'white', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 10, alignItems: 'flex-end', boxShadow: '0 -2px 8px rgba(0,0,0,0.03)' }}>
              <textarea
                id="message-input-chat"
                value={input}
                onChange={e => handleInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="اكتب رسالتك..."
                rows={1}
                style={{ flex: 1, padding: '11px 16px', border: '1.5px solid #E2E8F0', borderRadius: 14, fontFamily: 'Tajawal, sans-serif', fontSize: 14, resize: 'none', outline: 'none', maxHeight: 120, overflowY: 'auto', transition: 'border-color 0.2s', background: '#F8FAFC' }}
                onFocus={e  => e.target.style.borderColor = '#2563EB'}
                onBlur={e   => e.target.style.borderColor = '#E2E8F0'}
              />
              <button
                id="send-btn"
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                style={{ width: 44, height: 44, borderRadius: 14, background: (input.trim() && !sending) ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : '#E2E8F0', border: 'none', cursor: (input.trim() && !sending) ? 'pointer' : 'default', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0, boxShadow: (input.trim() && !sending) ? '0 4px 12px rgba(30,58,138,0.3)' : 'none' }}
              >
                {sending ? '⏳' : '➤'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes bounce  { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
      `}</style>
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

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

// GET /api/messages — get conversations list
export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);
    const db = getDb();

    const { searchParams } = new URL(req.url);
    const conversationWith = searchParams.get('with');

    if (conversationWith) {
      // Get messages in a specific conversation
      const messages = db.prepare(`
        SELECT m.*, 
          s.username as sender_username, s.display_name as sender_name,
          r.username as receiver_username, r.display_name as receiver_name
        FROM messages m
        JOIN users s ON s.id = m.sender_id
        JOIN users r ON r.id = m.receiver_id
        WHERE (m.sender_id = ? AND m.receiver_id = ?)
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC LIMIT 100
      `).all(user.userId, conversationWith, conversationWith, user.userId);

      // Mark messages as read
      db.prepare(`
        UPDATE messages SET read_at = datetime('now')
        WHERE receiver_id = ? AND sender_id = ? AND read_at IS NULL
      `).run(user.userId, conversationWith);

      return apiSuccess({ messages });
    }

    // Get conversation list (latest message per user)
    const conversations = db.prepare(`
      SELECT 
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        u.username as other_username, u.display_name as other_display_name,
        u.role as other_role,
        m.content as last_message,
        m.created_at as last_message_at,
        SUM(CASE WHEN m.receiver_id = ? AND m.read_at IS NULL THEN 1 ELSE 0 END) as unread_count
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY other_user_id
      ORDER BY m.created_at DESC
      LIMIT 50
    `).all(user.userId, user.userId, user.userId, user.userId, user.userId);

    return apiSuccess({ conversations });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// POST /api/messages — send a message
export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { receiverId, content, dealId } = await req.json();
    if (!receiverId || !content?.trim()) return apiError('receiverId و content مطلوبان');
    if (receiverId === user.userId) return apiError('لا يمكنك مراسلة نفسك');

    const db = getDb();
    const receiver = db.prepare('SELECT id, username FROM users WHERE id = ?').get(receiverId);
    if (!receiver) return apiError('المستخدم غير موجود', 404);

    const result = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content, deal_id)
      VALUES (?, ?, ?, ?)
    `).run(user.userId, receiverId, content.trim(), dealId || null);

    // Notify receiver
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (?, 'new_message', '💬 رسالة جديدة', ?, ?)
    `).run(receiverId, `رسالة من ${user.username}: ${content.slice(0, 60)}`, `/messages`);

    return apiSuccess({ messageId: result.lastInsertRowid, message: 'تم إرسال الرسالة' });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let db: Firestore;

export function getDb(): Firestore {
  if (!db) {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    db = getFirestore();
  }
  return db;
}

// ── Helper Types ─────────────────────────────────────────
export type DocData = Record<string, any>;

// ── Helper Functions ──────────────────────────────────────

/** Get a single document by ID */
export async function getDoc(col: string, id: string): Promise<DocData | null> {
  const snap = await getDb().collection(col).doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

/** Get all documents matching a query */
export async function getDocs(
  col: string,
  filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [],
  opts: { orderBy?: string; direction?: 'asc' | 'desc'; limit?: number; offset?: number } = {}
): Promise<DocData[]> {
  let q: FirebaseFirestore.Query = getDb().collection(col);
  for (const f of filters) q = q.where(f.field, f.op, f.value);
  if (opts.orderBy) q = q.orderBy(opts.orderBy, opts.direction || 'desc');
  if (opts.limit) q = q.limit(opts.limit);
  if (opts.offset) q = q.offset(opts.offset);
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Count documents matching query */
export async function countDocs(
  col: string,
  filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = []
): Promise<number> {
  let q: FirebaseFirestore.Query = getDb().collection(col);
  for (const f of filters) q = q.where(f.field, f.op, f.value);
  const snap = await q.count().get();
  return snap.data().count;
}

/** Create document (auto ID) */
export async function createDoc(col: string, data: DocData): Promise<string> {
  const ref = await getDb().collection(col).add({
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  return ref.id;
}

/** Create document with specific ID */
export async function setDoc(col: string, id: string, data: DocData): Promise<void> {
  await getDb().collection(col).doc(id).set({
    ...data,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

/** Update document */
export async function updateDoc(col: string, id: string, data: DocData): Promise<void> {
  await getDb().collection(col).doc(id).update({
    ...data,
    updated_at: new Date().toISOString(),
  });
}

/** Delete document */
export async function deleteDoc(col: string, id: string): Promise<void> {
  await getDb().collection(col).doc(id).delete();
}

/** Find single document by field value */
export async function findOne(
  col: string,
  field: string,
  value: any
): Promise<DocData | null> {
  const snap = await getDb().collection(col).where(field, '==', value).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/** Find document by one of multiple fields (OR) */
export async function findByEmailOrUsername(email: string, username: string): Promise<DocData | null> {
  const emailSnap = await getDb().collection('users').where('email', '==', email).limit(1).get();
  if (!emailSnap.empty) return { id: emailSnap.docs[0].id, ...emailSnap.docs[0].data() };
  const userSnap = await getDb().collection('users').where('username', '==', username).limit(1).get();
  if (!userSnap.empty) return { id: userSnap.docs[0].id, ...userSnap.docs[0].data() };
  return null;
}

/** Batch write */
export async function batchWrite(ops: { type: 'set' | 'update' | 'delete'; col: string; id: string; data?: DocData }[]): Promise<void> {
  const batch = getDb().batch();
  for (const op of ops) {
    const ref = getDb().collection(op.col).doc(op.id);
    if (op.type === 'set') batch.set(ref, { ...op.data, updated_at: new Date().toISOString() });
    else if (op.type === 'update') batch.update(ref, { ...op.data, updated_at: new Date().toISOString() });
    else batch.delete(ref);
  }
  await batch.commit();
}

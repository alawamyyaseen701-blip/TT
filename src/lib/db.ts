import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'trustdeal.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      country TEXT DEFAULT 'SA',
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'verified', 'admin')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'banned')),
      rating REAL DEFAULT 0,
      total_deals INTEGER DEFAULT 0,
      total_reviews INTEGER DEFAULT 0,
      wallet_balance REAL DEFAULT 0,
      escrow_balance REAL DEFAULT 0,
      platform_balance REAL DEFAULT 0,
      is_email_verified INTEGER DEFAULT 0,
      is_phone_verified INTEGER DEFAULT 0,
      joined_at TEXT DEFAULT (datetime('now')),
      last_seen TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK(type IN ('social', 'asset', 'store', 'subscription', 'service')),
      platform TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      country TEXT DEFAULT 'SA',
      domain TEXT,
      followers TEXT,
      engagement REAL,
      monthly_profit REAL,
      age_months INTEGER,
      monetized INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'sold', 'rejected', 'paused')),
      featured INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      favorites INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      listing_id INTEGER REFERENCES listings(id),
      buyer_id INTEGER NOT NULL REFERENCES users(id),
      seller_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      commission REAL NOT NULL,
      seller_net REAL NOT NULL,
      status TEXT DEFAULT 'pending_payment' CHECK(status IN (
        'pending_payment','in_escrow','in_delivery',
        'delivered','confirmed','completed',
        'disputed','cancelled','refunded','clawback'
      )),
      auto_release_at TEXT,
      delivery_data TEXT,
      buyer_confirmed_at TEXT,
      protection_expires_at TEXT,
      payout_released INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deal_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id TEXT NOT NULL REFERENCES deals(id),
      step INTEGER NOT NULL,
      label TEXT NOT NULL,
      completed_at TEXT,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id TEXT REFERENCES deals(id),
      sender_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text' CHECK(type IN ('text', 'image', 'system')),
      read_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id TEXT NOT NULL REFERENCES deals(id),
      reviewer_id INTEGER NOT NULL REFERENCES users(id),
      reviewed_id INTEGER NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL REFERENCES deals(id),
      opened_by INTEGER NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open','under_review','resolved_buyer','resolved_seller','resolved_partial')),
      resolution_note TEXT,
      resolved_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      budget_min REAL,
      budget_max REAL,
      deadline_days INTEGER DEFAULT 7,
      status TEXT DEFAULT 'open' CHECK(status IN ('open','in_progress','closed')),
      offers_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      link TEXT,
      read_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL REFERENCES users(id),
      listing_id INTEGER NOT NULL REFERENCES listings(id),
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, listing_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS listing_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS listing_attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      attr_key TEXT NOT NULL,
      attr_value TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS listing_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      file_url TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS request_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL REFERENCES requests(id),
      seller_id INTEGER NOT NULL REFERENCES users(id),
      price REAL NOT NULL,
      delivery_days INTEGER,
      message TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','withdrawn')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auctions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id),
      seller_id INTEGER NOT NULL REFERENCES users(id),
      starting_price REAL NOT NULL,
      min_increment REAL DEFAULT 1,
      current_price REAL,
      winner_id INTEGER REFERENCES users(id),
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled','live','ended','cancelled')),
      bids_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auction_bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auction_id INTEGER NOT NULL REFERENCES auctions(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      bid_amount REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      method TEXT NOT NULL,
      account_details TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','paid')),
      admin_note TEXT,
      processed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
    CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
    CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
    CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(featured);
    CREATE INDEX IF NOT EXISTS idx_deals_buyer ON deals(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_deals_seller ON deals(seller_id);
    CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_messages_deal ON messages(deal_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_at);
    CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
    CREATE INDEX IF NOT EXISTS idx_request_offers_request ON request_offers(request_id);
    CREATE INDEX IF NOT EXISTS idx_disputes_deal ON disputes(deal_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_id);
    CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON auction_bids(auction_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON listing_images(listing_id);
  `);

  // Seed admin user if no users exist
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (count.c === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('Admin@123', 10);
    db.prepare(`
      INSERT INTO users (username, email, password_hash, display_name, role, status, is_email_verified)
      VALUES (?, ?, ?, ?, 'admin', 'active', 1)
    `).run('admin', 'admin@trustdeal.com', hash, 'مدير المنصة');
  }
}

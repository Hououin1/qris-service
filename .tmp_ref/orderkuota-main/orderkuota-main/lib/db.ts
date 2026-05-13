import { createClient, Client } from '@libsql/client';
import { PendingTransaction, PaidTransaction } from './types.js';

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL || '',
      authToken: process.env.TURSO_AUTH_TOKEN || '',
    });
  }
  return client;
}

export async function initDb(): Promise<void> {
  const db = getDb();
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pending_transactions (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      base_amount INTEGER NOT NULL,
      unique_suffix INTEGER NOT NULL,
      final_amount INTEGER NOT NULL,
      qris_string TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS paid_transactions (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      final_amount INTEGER NOT NULL,
      paid_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);

  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_suffix 
    ON pending_transactions(username, unique_suffix)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_pending_expires 
    ON pending_transactions(expires_at)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_paid_expires 
    ON paid_transactions(expires_at)
  `);
}

export async function cleanupExpired(): Promise<void> {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  await db.execute({
    sql: 'DELETE FROM pending_transactions WHERE expires_at < ?',
    args: [now],
  });

  await db.execute({
    sql: 'DELETE FROM paid_transactions WHERE expires_at < ?',
    args: [now],
  });
}

export async function getAvailableSuffix(username: string): Promise<number> {
  await cleanupExpired();
  
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT unique_suffix FROM pending_transactions WHERE username = ?',
    args: [username],
  });

  const usedSet = new Set(result.rows.map(r => r.unique_suffix as number));

  for (let i = 1; i <= 500; i++) {
    if (!usedSet.has(i)) return i;
  }
  for (let i = 501; i <= 999; i++) {
    if (!usedSet.has(i)) return i;
  }

  throw new Error('No suffix available');
}

export async function createPendingTransaction(tx: PendingTransaction): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO pending_transactions 
          (id, username, base_amount, unique_suffix, final_amount, qris_string, created_at, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [tx.id, tx.username, tx.base_amount, tx.unique_suffix, tx.final_amount, tx.qris_string, tx.created_at, tx.expires_at],
  });
}

export async function getPendingTransaction(id: string): Promise<PendingTransaction | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM pending_transactions WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id as string,
    username: row.username as string,
    base_amount: row.base_amount as number,
    unique_suffix: row.unique_suffix as number,
    final_amount: row.final_amount as number,
    qris_string: row.qris_string as string,
    created_at: row.created_at as number,
    expires_at: row.expires_at as number,
  };
}

export async function deletePendingTransaction(id: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM pending_transactions WHERE id = ?',
    args: [id],
  });
}

export async function createPaidTransaction(tx: PaidTransaction): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO paid_transactions (id, username, final_amount, paid_at, expires_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [tx.id, tx.username, tx.final_amount, tx.paid_at, tx.expires_at],
  });
}

export async function getPaidTransaction(id: string): Promise<PaidTransaction | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM paid_transactions WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id as string,
    username: row.username as string,
    final_amount: row.final_amount as number,
    paid_at: row.paid_at as number,
    expires_at: row.expires_at as number,
  };
}

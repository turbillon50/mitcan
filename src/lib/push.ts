import webpush from "web-push";
import { prisma } from "./prisma";

/**
 * Web Push (VAPID). Subscriptions live in `push_subscriptions`, created
 * lazily with raw SQL so the existing pulled schema stays untouched.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:turbillon50@gmail.com";

export function pushEnabled() {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY);
}

let configured = false;
function configure() {
  if (!configured && pushEnabled()) {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
  }
}

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint   text PRIMARY KEY,
      user_id    text,
      data       jsonb NOT NULL,
      created_at timestamptz DEFAULT now()
    )`);
}

export async function saveSubscription(userId: string, sub: unknown) {
  const endpoint = (sub as { endpoint?: string })?.endpoint;
  if (!endpoint) throw new Error("invalid subscription");
  await ensureTable();
  await prisma.$executeRawUnsafe(
    `INSERT INTO push_subscriptions (endpoint, user_id, data)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = $2, data = $3::jsonb`,
    endpoint,
    userId,
    JSON.stringify(sub)
  );
}

export async function deleteSubscription(endpoint: string) {
  await ensureTable();
  await prisma.$executeRawUnsafe(`DELETE FROM push_subscriptions WHERE endpoint = $1`, endpoint);
}

type PushPayload = { title: string; body: string; url?: string };

async function sendTo(rows: Array<{ endpoint: string; data: unknown }>, payload: PushPayload) {
  configure();
  const body = JSON.stringify(payload);
  await Promise.allSettled(
    rows.map(async (r) => {
      try {
        await webpush.sendNotification(r.data as webpush.PushSubscription, body);
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) await deleteSubscription(r.endpoint).catch(() => {});
      }
    })
  );
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!pushEnabled()) return;
  await ensureTable();
  const rows = await prisma.$queryRawUnsafe<Array<{ endpoint: string; data: unknown }>>(
    `SELECT endpoint, data FROM push_subscriptions WHERE user_id = $1`,
    userId
  );
  await sendTo(rows, payload);
}

export async function sendPushToAll(payload: PushPayload) {
  if (!pushEnabled()) return;
  await ensureTable();
  const rows = await prisma.$queryRawUnsafe<Array<{ endpoint: string; data: unknown }>>(
    `SELECT endpoint, data FROM push_subscriptions`
  );
  await sendTo(rows, payload);
}

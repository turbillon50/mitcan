import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth";
import { saveSubscription, deleteSubscription, pushEnabled } from "@/lib/push";

export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!pushEnabled()) return NextResponse.json({ error: "push disabled" }, { status: 503 });
  const sub = await req.json().catch(() => null);
  if (!sub?.endpoint) return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  await saveSubscription(user.id, sub);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { endpoint } = await req.json().catch(() => ({}));
  if (endpoint) await deleteSubscription(endpoint);
  return NextResponse.json({ ok: true });
}

import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { transactions } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const idParam = url.searchParams.get("id");

  if (req.method === "GET" && !idParam) {
    const all = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.updatedAt));
    return Response.json(all);
  }

  if (req.method === "GET" && idParam) {
    const [row] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, idParam));
    if (!row) return new Response("Not found", { status: 404 });
    return Response.json(row);
  }

  if (req.method === "POST") {
    const body = await req.json();
    const id = body.id || "tx_" + Math.random().toString(36).slice(2, 9);
    const now = new Date();
    const [row] = await db
      .insert(transactions)
      .values({
        id,
        buyer: body.buyer ?? null,
        seller: body.seller ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return Response.json(row, { status: 201 });
  }

  if (req.method === "PUT" && idParam) {
    const body = await req.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.buyer !== undefined) updates.buyer = body.buyer;
    if (body.seller !== undefined) updates.seller = body.seller;

    const [row] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, idParam))
      .returning();
    if (!row) return new Response("Not found", { status: 404 });
    return Response.json(row);
  }

  if (req.method === "DELETE" && idParam) {
    await db.delete(transactions).where(eq(transactions.id, idParam));
    return new Response(null, { status: 204 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/transactions",
};

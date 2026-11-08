import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { circleMembers } from "@/db/schema";

/**
 * THE circle-isolation check. Every query/action that touches circle data
 * must pass through this (or an equivalent membership filter).
 */
export async function getMembership(circleId: string, userId: string) {
  const [row] = await db
    .select()
    .from(circleMembers)
    .where(
      and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
    )
    .limit(1);
  return row ?? null;
}

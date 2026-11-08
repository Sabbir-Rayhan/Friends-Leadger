"use server";

import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { circleMembers, circles } from "@/db/schema";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/lib/types";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion
function makeInviteCode() {
  return Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

export async function createCircle(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = z
    .object({ name: z.string().trim().min(1, "Give your circle a name").max(60) })
    .safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const id = randomUUID();
  await db.batch([
    db.insert(circles).values({
      id,
      name: parsed.data.name,
      inviteCode: makeInviteCode(),
      createdBy: user.id,
    }),
    db.insert(circleMembers).values({ circleId: id, userId: user.id, role: "admin" }),
  ]);
  revalidatePath("/", "layout");
  redirect(`/circles/${id}`);
}

async function addMemberByCode(
  code: string,
  userId: string
): Promise<{ error: string } | { circleId: string }> {
  const [circle] = await db
    .select({ id: circles.id })
    .from(circles)
    .where(eq(circles.inviteCode, code.trim().toUpperCase()))
    .limit(1);
  if (!circle) return { error: "That invite code doesn't match any circle." };
  await db
    .insert(circleMembers)
    .values({ circleId: circle.id, userId })
    .onConflictDoNothing();
  return { circleId: circle.id };
}

/** Used by the "join with code" form on /circles */
export async function joinCircleWithCode(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const code = String(formData.get("code") ?? "");
  if (code.trim().length < 4) return { error: "Enter the invite code." };
  const result = await addMemberByCode(code, user.id);
  if ("error" in result) return result;
  revalidatePath("/", "layout");
  redirect(`/circles/${result.circleId}`);
}

/** Used by the "Join" button on /join/[code] */
export async function joinCircleByLink(code: string): Promise<void> {
  const user = await requireUser();
  const result = await addMemberByCode(code, user.id);
  if ("error" in result) throw new Error(result.error);
  revalidatePath("/", "layout");
  redirect(`/circles/${result.circleId}`);
}

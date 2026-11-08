"use server";

import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { circleMembers, circles } from "@/db/schema";
import { getI18n } from "@/i18n/server";
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
  const { t } = await getI18n();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: t("e_groupName") };
  if (name.length > 60) return { error: t("e_groupNameLong") };

  const id = randomUUID();
  await db.batch([
    db.insert(circles).values({ id, name, inviteCode: makeInviteCode(), createdBy: user.id }),
    db.insert(circleMembers).values({ circleId: id, userId: user.id, role: "admin" }),
  ]);
  revalidatePath("/", "layout");
  redirect(`/circles/${id}`);
}

async function addMemberByCode(
  code: string,
  userId: string
): Promise<{ notFound: true } | { circleId: string }> {
  const [circle] = await db
    .select({ id: circles.id })
    .from(circles)
    .where(eq(circles.inviteCode, code.trim().toUpperCase()))
    .limit(1);
  if (!circle) return { notFound: true };
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
  const { t } = await getI18n();
  const code = String(formData.get("code") ?? "");
  if (code.trim().length < 4) return { error: t("e_codeMissing") };
  const result = await addMemberByCode(code, user.id);
  if ("notFound" in result) return { error: t("e_codeInvalid") };
  revalidatePath("/", "layout");
  redirect(`/circles/${result.circleId}`);
}

/** Used by the "Join" button on /join/[code] */
export async function joinCircleByLink(code: string): Promise<void> {
  const user = await requireUser();
  const { t } = await getI18n();
  const result = await addMemberByCode(code, user.id);
  if ("notFound" in result) throw new Error(t("e_codeInvalid"));
  revalidatePath("/", "layout");
  redirect(`/circles/${result.circleId}`);
}

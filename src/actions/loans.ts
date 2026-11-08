"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { loans, notifications } from "@/db/schema";
import { getI18n } from "@/i18n/server";
import { getMembership } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { isValidDate, paisaToNumeric, parseAmount } from "@/lib/money";
import type { ActionState } from "@/lib/types";

/** Lender records a loan. It stays "pending" until the borrower confirms. */
export async function createLoan(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getI18n();

  const circleId = String(formData.get("circleId") ?? "");
  const borrowerId = String(formData.get("borrowerId") ?? "");
  const amount = String(formData.get("amount") ?? "");
  const loanDate = String(formData.get("loanDate") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!z.uuid().safeParse(circleId).success) return { error: t("e_notMember") };
  if (!borrowerId) return { error: t("e_chooseFriend") };
  if (note.length > 200) return { error: t("e_noteLong") };

  const paisa = parseAmount(amount);
  if (!paisa) return { error: t("e_amount") };
  if (!isValidDate(loanDate)) return { error: t("e_date") };
  if (borrowerId === user.id) return { error: t("e_self") };

  // Both people must belong to this circle.
  if (!(await getMembership(circleId, user.id))) return { error: t("e_notMember") };
  if (!(await getMembership(circleId, borrowerId))) return { error: t("e_friendNotMember") };

  const loanId = randomUUID();
  await db.batch([
    db.insert(loans).values({
      id: loanId,
      circleId,
      lenderId: user.id, // always the logged-in user: you can only record your own lending
      borrowerId,
      amount: paisaToNumeric(paisa),
      note: note || null,
      loanDate,
    }),
    db.insert(notifications).values({ userId: borrowerId, type: "loan_requested", loanId }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Borrower confirms or rejects a pending loan. */
export async function respondToLoan(
  loanId: string,
  decision: "confirmed" | "rejected"
): Promise<void> {
  const user = await requireUser();
  const { t } = await getI18n();
  z.uuid().parse(loanId);

  // The WHERE clause itself enforces: only the borrower, only while pending.
  const [updated] = await db
    .update(loans)
    .set({ status: decision, respondedAt: new Date() })
    .where(
      and(eq(loans.id, loanId), eq(loans.borrowerId, user.id), eq(loans.status, "pending"))
    )
    .returning({ lenderId: loans.lenderId });
  if (!updated) throw new Error(t("e_cantRespondLoan"));

  await db.insert(notifications).values({
    userId: updated.lenderId,
    type: decision === "confirmed" ? "loan_confirmed" : "loan_rejected",
    loanId,
  });
  revalidatePath("/", "layout");
}

/** Lender withdraws a loan that the borrower hasn't answered yet. */
export async function cancelLoan(loanId: string): Promise<void> {
  const user = await requireUser();
  const { t } = await getI18n();
  z.uuid().parse(loanId);
  const [updated] = await db
    .update(loans)
    .set({ status: "cancelled", respondedAt: new Date() })
    .where(
      and(eq(loans.id, loanId), eq(loans.lenderId, user.id), eq(loans.status, "pending"))
    )
    .returning({ id: loans.id });
  if (!updated) throw new Error(t("e_cantCancel"));
  revalidatePath("/", "layout");
}

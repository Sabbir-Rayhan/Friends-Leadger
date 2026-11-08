"use server";

import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { loans, notifications, repayments } from "@/db/schema";
import { formatTaka, isValidDate, paisaToNumeric, parseAmount, toPaisa } from "@/lib/money";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/lib/types";

const createSchema = z.object({
  loanId: z.uuid(),
  amount: z.string(),
  paidDate: z.string(),
  note: z.string().trim().max(200, "Note is too long").optional(),
});

/** Borrower says "I paid X". Counts only after the lender confirms. */
export async function createRepayment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { loanId, amount, paidDate, note } = parsed.data;

  const paisa = parseAmount(amount);
  if (!paisa) return { error: "Enter a valid amount (up to 2 decimals)." };
  if (!isValidDate(paidDate)) return { error: "Choose a valid date." };

  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
  if (!loan || loan.borrowerId !== user.id)
    return { error: "Only the borrower can record a repayment." };
  if (loan.status !== "confirmed")
    return { error: "This loan hasn't been confirmed yet." };

  const [{ used }] = await db
    .select({ used: sql<string>`coalesce(sum(${repayments.amount}), 0)` })
    .from(repayments)
    .where(
      and(eq(repayments.loanId, loanId), inArray(repayments.status, ["pending", "confirmed"]))
    );
  const remaining = toPaisa(loan.amount) - toPaisa(used);
  if (paisa > remaining)
    return {
      error:
        remaining <= 0
          ? "This loan is already fully repaid (or waiting for confirmation)."
          : `That's more than what's left to repay (${formatTaka(remaining)}).`,
    };

  const repaymentId = randomUUID();
  await db.batch([
    db.insert(repayments).values({
      id: repaymentId,
      loanId,
      amount: paisaToNumeric(paisa),
      paidDate,
      note: note || null,
    }),
    db.insert(notifications).values({
      userId: loan.lenderId,
      type: "repayment_requested",
      loanId,
      repaymentId,
    }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Lender confirms they received the money (or disputes it). */
export async function respondToRepayment(
  repaymentId: string,
  decision: "confirmed" | "rejected"
): Promise<void> {
  const user = await requireUser();
  z.uuid().parse(repaymentId);

  const [row] = await db
    .select({ loanId: repayments.loanId, lenderId: loans.lenderId, borrowerId: loans.borrowerId })
    .from(repayments)
    .innerJoin(loans, eq(loans.id, repayments.loanId))
    .where(eq(repayments.id, repaymentId))
    .limit(1);
  if (!row || row.lenderId !== user.id)
    throw new Error("Only the lender can confirm a repayment.");

  const [updated] = await db
    .update(repayments)
    .set({ status: decision, respondedAt: new Date() })
    .where(and(eq(repayments.id, repaymentId), eq(repayments.status, "pending")))
    .returning({ id: repayments.id });
  if (!updated) throw new Error("This repayment was already answered.");

  await db.insert(notifications).values({
    userId: row.borrowerId,
    type: decision === "confirmed" ? "repayment_confirmed" : "repayment_rejected",
    loanId: row.loanId,
    repaymentId,
  });
  revalidatePath("/", "layout");
}

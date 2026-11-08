"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { loans, notifications } from "@/db/schema";
import { getMembership } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { isValidDate, paisaToNumeric, parseAmount } from "@/lib/money";
import type { ActionState } from "@/lib/types";

const createSchema = z.object({
  circleId: z.uuid(),
  borrowerId: z.string().min(1, "Choose who you lent to"),
  amount: z.string(),
  loanDate: z.string(),
  note: z.string().trim().max(200, "Note is too long").optional(),
});

/** Lender records a loan. It stays "pending" until the borrower confirms. */
export async function createLoan(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { circleId, borrowerId, amount, loanDate, note } = parsed.data;

  const paisa = parseAmount(amount);
  if (!paisa) return { error: "Enter a valid amount (up to 2 decimals)." };
  if (!isValidDate(loanDate)) return { error: "Choose a valid date." };
  if (borrowerId === user.id) return { error: "You can't lend money to yourself." };

  // Both people must belong to this circle.
  if (!(await getMembership(circleId, user.id)))
    return { error: "You are not a member of this circle." };
  if (!(await getMembership(circleId, borrowerId)))
    return { error: "That person is not in this circle." };

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
    db.insert(notifications).values({
      userId: borrowerId,
      type: "loan_requested",
      loanId,
    }),
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
  z.uuid().parse(loanId);

  // The WHERE clause itself enforces: only the borrower, only while pending.
  const [updated] = await db
    .update(loans)
    .set({ status: decision, respondedAt: new Date() })
    .where(
      and(
        eq(loans.id, loanId),
        eq(loans.borrowerId, user.id),
        eq(loans.status, "pending")
      )
    )
    .returning({ lenderId: loans.lenderId });
  if (!updated) throw new Error("This loan can't be updated (already answered, or not yours).");

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
  z.uuid().parse(loanId);
  const [updated] = await db
    .update(loans)
    .set({ status: "cancelled", respondedAt: new Date() })
    .where(
      and(
        eq(loans.id, loanId),
        eq(loans.lenderId, user.id),
        eq(loans.status, "pending")
      )
    )
    .returning({ id: loans.id });
  if (!updated) throw new Error("This loan can't be cancelled.");
  revalidatePath("/", "layout");
}

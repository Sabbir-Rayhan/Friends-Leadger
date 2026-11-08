"use server";

import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { loans, notifications, repayments } from "@/db/schema";
import { getI18n } from "@/i18n/server";
import { formatTaka, isValidDate, paisaToNumeric, parseAmount, toPaisa } from "@/lib/money";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/lib/types";

/** Borrower says "I paid X". Counts only after the lender confirms. */
export async function createRepayment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const { t, lang } = await getI18n();

  const loanId = String(formData.get("loanId") ?? "");
  const amount = String(formData.get("amount") ?? "");
  const paidDate = String(formData.get("paidDate") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!z.uuid().safeParse(loanId).success) return { error: t("errorGeneric") };
  if (note.length > 200) return { error: t("e_noteLong") };
  const paisa = parseAmount(amount);
  if (!paisa) return { error: t("e_amount") };
  if (!isValidDate(paidDate)) return { error: t("e_date") };

  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
  if (!loan || loan.borrowerId !== user.id) return { error: t("e_onlyBorrower") };
  if (loan.status !== "confirmed") return { error: t("e_loanNotConfirmed") };

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
          ? t("e_fullyRepaid")
          : t("e_tooMuch", { max: formatTaka(remaining, lang) }),
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
  const { t } = await getI18n();
  z.uuid().parse(repaymentId);

  const [row] = await db
    .select({ loanId: repayments.loanId, lenderId: loans.lenderId, borrowerId: loans.borrowerId })
    .from(repayments)
    .innerJoin(loans, eq(loans.id, repayments.loanId))
    .where(eq(repayments.id, repaymentId))
    .limit(1);
  if (!row || row.lenderId !== user.id) throw new Error(t("e_onlyLender"));

  const [updated] = await db
    .update(repayments)
    .set({ status: decision, respondedAt: new Date() })
    .where(and(eq(repayments.id, repaymentId), eq(repayments.status, "pending")))
    .returning({ id: repayments.id });
  if (!updated) throw new Error(t("e_alreadyAnswered"));

  await db.insert(notifications).values({
    userId: row.borrowerId,
    type: decision === "confirmed" ? "repayment_confirmed" : "repayment_rejected",
    loanId: row.loanId,
    repaymentId,
  });
  revalidatePath("/", "layout");
}

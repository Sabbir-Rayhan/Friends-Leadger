import { toPaisa } from "@/lib/money";
import type { LoanView, RepaymentView } from "@/lib/types";

/** How much of one loan is paid / awaiting confirmation / still owed (paisa). */
export function loanTotals(loan: LoanView, repayments: RepaymentView[]) {
  const total = toPaisa(loan.amount);
  let paid = 0;
  let pending = 0;
  for (const r of repayments) {
    if (r.loanId !== loan.id) continue;
    if (r.status === "confirmed") paid += toPaisa(r.amount);
    if (r.status === "pending") pending += toPaisa(r.amount);
  }
  return {
    total,
    paid,
    pending,
    outstanding: Math.max(total - paid, 0),
    // what the borrower may still record as a new repayment
    recordable: Math.max(total - paid - pending, 0),
  };
}

export type Debt = { debtorId: string; creditorId: string; amount: number };

/** Net "who owes whom" between every pair, from CONFIRMED loans/repayments only. */
export function computeDebts(loans: LoanView[], repayments: RepaymentView[]): Debt[] {
  const directed = new Map<string, number>(); // "lender|borrower" -> outstanding
  for (const loan of loans) {
    if (loan.status !== "confirmed") continue;
    const { outstanding } = loanTotals(loan, repayments);
    if (outstanding <= 0) continue;
    const key = `${loan.lenderId}|${loan.borrowerId}`;
    directed.set(key, (directed.get(key) ?? 0) + outstanding);
  }

  const debts: Debt[] = [];
  const seen = new Set<string>();
  for (const key of directed.keys()) {
    const [a, b] = key.split("|");
    const pair = [a, b].sort().join("|");
    if (seen.has(pair)) continue;
    seen.add(pair);
    const aLentB = directed.get(`${a}|${b}`) ?? 0;
    const bLentA = directed.get(`${b}|${a}`) ?? 0;
    const net = aLentB - bLentA;
    if (net > 0) debts.push({ creditorId: a, debtorId: b, amount: net });
    else if (net < 0) debts.push({ creditorId: b, debtorId: a, amount: -net });
  }
  return debts.sort((x, y) => y.amount - x.amount);
}

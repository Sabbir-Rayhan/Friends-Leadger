import { cancelLoan, respondToLoan } from "@/actions/loans";
import { respondToRepayment } from "@/actions/repayments";
import { formatDate, formatTaka, toPaisa } from "@/lib/money";
import { loanTotals } from "@/lib/balances";
import type { LoanView, RepaymentView } from "@/lib/types";
import { RepaymentForm } from "./RepaymentForm";
import { SubmitButton } from "./SubmitButton";
import { StatusBadge, cardCls } from "./ui";

export function needsMyAction(loan: LoanView, repayments: RepaymentView[], me: string) {
  if (loan.status === "pending" && loan.borrowerId === me) return true;
  return (
    loan.lenderId === me &&
    repayments.some((r) => r.loanId === loan.id && r.status === "pending")
  );
}

export function LoanCard({
  loan,
  repayments,
  me,
}: {
  loan: LoanView;
  repayments: RepaymentView[];
  me: string;
}) {
  const reps = repayments.filter((r) => r.loanId === loan.id);
  const t = loanTotals(loan, repayments);
  const iAmLender = loan.lenderId === me;
  const iAmBorrower = loan.borrowerId === me;
  const lender = iAmLender ? "You" : loan.lenderName;
  const borrower = iAmBorrower ? "you" : loan.borrowerName;
  const settled = loan.status === "confirmed" && t.outstanding === 0;
  const attention = needsMyAction(loan, repayments, me);

  return (
    <div className={`${cardCls} ${attention ? "ring-2 ring-amber-400" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            {lender} lent {borrower} <span className="text-emerald-700">{formatTaka(toPaisa(loan.amount))}</span>
          </p>
          <p className="text-xs text-slate-500">
            {formatDate(loan.loanDate)}
            {loan.note ? ` · ${loan.note}` : ""}
          </p>
        </div>
        <StatusBadge status={settled ? "settled" : loan.status} />
      </div>

      {loan.status === "confirmed" && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${Math.min((t.paid / t.total) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Repaid {formatTaka(t.paid)} · Remaining {formatTaka(t.outstanding)}
            {t.pending > 0 && ` · ${formatTaka(t.pending)} awaiting confirmation`}
          </p>
        </div>
      )}

      {/* Loan confirmation actions */}
      {loan.status === "pending" && iAmBorrower && (
        <div className="mt-3 flex items-center gap-2">
          <p className="mr-2 text-sm text-amber-700">
            {loan.lenderName} says they lent you this money. Is that right?
          </p>
          <form action={respondToLoan.bind(null, loan.id, "confirmed")}>
            <SubmitButton small>Confirm</SubmitButton>
          </form>
          <form action={respondToLoan.bind(null, loan.id, "rejected")}>
            <SubmitButton small variant="danger">Reject</SubmitButton>
          </form>
        </div>
      )}
      {loan.status === "pending" && iAmLender && (
        <div className="mt-3 flex items-center gap-3">
          <p className="text-sm text-slate-600">Waiting for {loan.borrowerName} to confirm.</p>
          <form action={cancelLoan.bind(null, loan.id)}>
            <SubmitButton small variant="secondary">Cancel</SubmitButton>
          </form>
        </div>
      )}

      {/* Repayment history */}
      {reps.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          {reps.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {iAmBorrower ? "You" : loan.borrowerName} paid {formatTaka(toPaisa(r.amount))} on{" "}
                {formatDate(r.paidDate)}
                {r.note ? ` · ${r.note}` : ""}
              </span>
              <span className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                {r.status === "pending" && iAmLender && (
                  <>
                    <form action={respondToRepayment.bind(null, r.id, "confirmed")}>
                      <SubmitButton small>I received it</SubmitButton>
                    </form>
                    <form action={respondToRepayment.bind(null, r.id, "rejected")}>
                      <SubmitButton small variant="danger">Dispute</SubmitButton>
                    </form>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {loan.status === "confirmed" && iAmBorrower && t.recordable > 0 && (
        <RepaymentForm loanId={loan.id} maxLabel={formatTaka(t.recordable)} />
      )}
    </div>
  );
}

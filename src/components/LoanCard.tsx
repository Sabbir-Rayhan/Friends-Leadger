import { cancelLoan, respondToLoan } from "@/actions/loans";
import { respondToRepayment } from "@/actions/repayments";
import { getI18n } from "@/i18n/server";
import { loanTotals } from "@/lib/balances";
import { formatDate, formatTaka, toPaisa } from "@/lib/money";
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

export async function LoanCard({
  loan,
  repayments,
  me,
}: {
  loan: LoanView;
  repayments: RepaymentView[];
  me: string;
}) {
  const { t, lang } = await getI18n();
  const reps = repayments.filter((r) => r.loanId === loan.id);
  const totals = loanTotals(loan, repayments);
  const iAmLender = loan.lenderId === me;
  const iAmBorrower = loan.borrowerId === me;
  const settled = loan.status === "confirmed" && totals.outstanding === 0;
  const attention = needsMyAction(loan, repayments, me);
  const money = (p: number) => formatTaka(p, lang);
  const amount = money(toPaisa(loan.amount));

  const title = iAmLender
    ? t("loanYouLent", { borrower: loan.borrowerName, amount })
    : iAmBorrower
      ? t("loanLentYou", { lender: loan.lenderName, amount })
      : t("loanLentOther", { lender: loan.lenderName, borrower: loan.borrowerName, amount });

  const badge = settled ? "settled" : loan.status;

  return (
    <div className={`${cardCls} ${attention ? "ring-2 ring-amber-400" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold">{title}</p>
          <p className="text-sm text-slate-500">
            {formatDate(loan.loanDate, lang)}
            {loan.note ? ` · ${loan.note}` : ""}
          </p>
        </div>
        <StatusBadge status={badge} label={t(`status_${badge}` as "status_pending")} />
      </div>

      {loan.status === "confirmed" && (
        <div className="mt-3">
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${Math.min((totals.paid / totals.total) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {t("repaidLeft", { paid: money(totals.paid), left: money(totals.outstanding) })}
            {totals.pending > 0 && ` · ${t("awaitingConfirm", { amount: money(totals.pending) })}`}
          </p>
        </div>
      )}

      {/* Loan confirmation */}
      {loan.status === "pending" && iAmBorrower && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">
            {t("borrowerPrompt", { lender: loan.lenderName })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={respondToLoan.bind(null, loan.id, "confirmed")}>
              <SubmitButton small>{t("confirmYes")}</SubmitButton>
            </form>
            <form action={respondToLoan.bind(null, loan.id, "rejected")}>
              <SubmitButton small variant="danger">{t("confirmNo")}</SubmitButton>
            </form>
          </div>
        </div>
      )}
      {loan.status === "pending" && iAmLender && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-600">{t("waitingBorrower", { borrower: loan.borrowerName })}</p>
          <form action={cancelLoan.bind(null, loan.id)}>
            <SubmitButton small variant="secondary">{t("cancelLoan")}</SubmitButton>
          </form>
        </div>
      )}

      {/* Repayment history */}
      {reps.length > 0 && (
        <ul className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          {reps.map((r) => {
            const a = money(toPaisa(r.amount));
            const date = formatDate(r.paidDate, lang);
            return (
              <li key={r.id} className="space-y-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {iAmBorrower
                      ? t("repayYou", { amount: a, date })
                      : t("repayOther", { borrower: loan.borrowerName, amount: a, date })}
                    {r.note ? ` · ${r.note}` : ""}
                  </span>
                  <StatusBadge status={r.status} label={t(`status_${r.status}` as "status_pending")} />
                </div>
                {r.status === "pending" && iAmLender && (
                  <div className="flex flex-wrap gap-2">
                    <form action={respondToRepayment.bind(null, r.id, "confirmed")}>
                      <SubmitButton small>{t("gotIt")}</SubmitButton>
                    </form>
                    <form action={respondToRepayment.bind(null, r.id, "rejected")}>
                      <SubmitButton small variant="danger">{t("notGot")}</SubmitButton>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {loan.status === "confirmed" && iAmBorrower && totals.recordable > 0 && (
        <RepaymentForm loanId={loan.id} maxLabel={money(totals.recordable)} />
      )}
    </div>
  );
}

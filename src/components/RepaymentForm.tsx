"use client";

import { useActionState, useEffect, useRef } from "react";
import { createRepayment } from "@/actions/repayments";
import { useI18n } from "@/i18n/client";
import { SubmitButton } from "./SubmitButton";
import { useToday } from "./useToday";
import { inputCls } from "./ui";

export function RepaymentForm({ loanId, maxLabel }: { loanId: string; maxLabel: string }) {
  const { t } = useI18n();
  const [state, action] = useActionState(createRepayment, {});
  const ref = useRef<HTMLFormElement>(null);
  const today = useToday();

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-base font-semibold text-emerald-700">
        {t("repayTitle")}
      </summary>
      <form ref={ref} action={action} className="mt-3 space-y-2">
        <input type="hidden" name="loanId" value={loanId} />
        <input
          name="amount"
          inputMode="decimal"
          required
          placeholder={t("repayAmountPh", { max: maxLabel })}
          className={inputCls}
        />
        <input key={today} name="paidDate" type="date" required defaultValue={today} className={inputCls} />
        <input name="note" maxLength={200} placeholder={t("repayNotePh")} className={inputCls} />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.ok && <p className="text-sm text-emerald-700">{t("repaySent")}</p>}
        <SubmitButton small>{t("repaySend")}</SubmitButton>
      </form>
    </details>
  );
}

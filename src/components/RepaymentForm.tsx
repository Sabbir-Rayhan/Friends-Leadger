"use client";

import { useActionState, useEffect, useRef } from "react";
import { createRepayment } from "@/actions/repayments";
import { SubmitButton } from "./SubmitButton";
import { useToday } from "./useToday";
import { inputCls } from "./ui";

export function RepaymentForm({ loanId, maxLabel }: { loanId: string; maxLabel: string }) {
  const [state, action] = useActionState(createRepayment, {});
  const ref = useRef<HTMLFormElement>(null);
  const today = useToday();

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-medium text-emerald-700">
        I paid back some money
      </summary>
      <form ref={ref} action={action} className="mt-3 space-y-2">
        <input type="hidden" name="loanId" value={loanId} />
        <div className="grid grid-cols-2 gap-2">
          <input name="amount" inputMode="decimal" required placeholder={`Amount (max ${maxLabel})`} className={inputCls} />
          <input key={today} name="paidDate" type="date" required defaultValue={today} className={inputCls} />
        </div>
        <input name="note" maxLength={200} placeholder="Note (optional)" className={inputCls} />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.ok && <p className="text-sm text-emerald-700">Sent! The lender will confirm it.</p>}
        <SubmitButton small>Send for confirmation</SubmitButton>
      </form>
    </details>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";
import { createLoan } from "@/actions/loans";
import { SubmitButton } from "./SubmitButton";
import { useToday } from "./useToday";
import { inputCls, labelCls } from "./ui";

export function NewLoanForm({
  circleId,
  friends,
}: {
  circleId: string;
  friends: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(createLoan, {});
  const ref = useRef<HTMLFormElement>(null);
  const today = useToday();

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  if (friends.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        No one else is in this circle yet. Share the invite link so your friends can join.
      </p>
    );
  }

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="circleId" value={circleId} />
      <div>
        <label className={labelCls} htmlFor="borrowerId">I lent money to</label>
        <select id="borrowerId" name="borrowerId" required defaultValue="" className={inputCls}>
          <option value="" disabled>Choose a friend…</option>
          {friends.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="amount">Amount (৳)</label>
          <input id="amount" name="amount" inputMode="decimal" required placeholder="500" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="loanDate">Date</label>
          <input key={today} id="loanDate" name="loanDate" type="date" required defaultValue={today} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="note">Note (optional)</label>
        <input id="note" name="note" maxLength={200} placeholder="e.g. lunch, bus fare" className={inputCls} />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-700">Sent! Your friend has been asked to confirm.</p>}
      <SubmitButton>Send for confirmation</SubmitButton>
    </form>
  );
}

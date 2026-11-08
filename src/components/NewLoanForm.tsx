"use client";

import { useActionState, useEffect, useRef } from "react";
import { createLoan } from "@/actions/loans";
import { useI18n } from "@/i18n/client";
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
  const { t } = useI18n();
  const [state, action] = useActionState(createLoan, {});
  const ref = useRef<HTMLFormElement>(null);
  const today = useToday();

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  if (friends.length === 0) {
    return <p className="text-sm text-slate-600">{t("noFriends")}</p>;
  }

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="circleId" value={circleId} />
      <div>
        <label className={labelCls} htmlFor="borrowerId">{t("lentTo")}</label>
        <select id="borrowerId" name="borrowerId" required defaultValue="" className={inputCls}>
          <option value="" disabled>{t("chooseFriend")}</option>
          {friends.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls} htmlFor="amount">{t("amountLbl")}</label>
        <input id="amount" name="amount" inputMode="decimal" required placeholder="500" className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="loanDate">{t("dateLbl")}</label>
        <input key={today} id="loanDate" name="loanDate" type="date" required defaultValue={today} className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="note">{t("noteLbl")}</label>
        <input id="note" name="note" maxLength={200} placeholder={t("notePh")} className={inputCls} />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-700">{t("loanSent")}</p>}
      <SubmitButton full>{t("sendLoan")}</SubmitButton>
      <p className="text-xs text-slate-500">{t("loanHint")}</p>
    </form>
  );
}

import { getI18n } from "@/i18n/server";
import type { Debt } from "@/lib/balances";
import { formatTaka } from "@/lib/money";
import { cardCls } from "./ui";

export async function BalanceSummary({
  debts,
  names,
  me,
}: {
  debts: Debt[];
  names: Record<string, string>;
  me: string;
}) {
  const { t, lang } = await getI18n();
  const youOwe = debts.filter((d) => d.debtorId === me).reduce((s, d) => s + d.amount, 0);
  const owedToYou = debts.filter((d) => d.creditorId === me).reduce((s, d) => s + d.amount, 0);
  const name = (id: string) => names[id] ?? "?";

  return (
    <div className={cardCls}>
      <h2 className="text-lg font-bold">{t("whoOwesTitle")}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg bg-red-50 p-3">
          <p className="text-sm text-red-700">{t("youOwe")}</p>
          <p className="text-xl font-bold text-red-800">{formatTaka(youOwe, lang)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-sm text-emerald-700">{t("youAreOwed")}</p>
          <p className="text-xl font-bold text-emerald-800">{formatTaka(owedToYou, lang)}</p>
        </div>
      </div>
      {debts.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{t("allSettled")}</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {debts.map((d) => {
            const amount = formatTaka(d.amount, lang);
            const text =
              d.debtorId === me
                ? t("debtYouOwe", { creditor: name(d.creditorId), amount })
                : d.creditorId === me
                  ? t("debtOwesYou", { debtor: name(d.debtorId), amount })
                  : t("debtOther", { debtor: name(d.debtorId), creditor: name(d.creditorId), amount });
            return <li key={`${d.debtorId}-${d.creditorId}`}>{text}</li>;
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-slate-400">{t("balanceNote")}</p>
    </div>
  );
}

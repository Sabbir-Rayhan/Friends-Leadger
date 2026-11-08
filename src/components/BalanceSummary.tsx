import type { Debt } from "@/lib/balances";
import { formatTaka } from "@/lib/money";
import { cardCls } from "./ui";

export function BalanceSummary({
  debts,
  names,
  me,
}: {
  debts: Debt[];
  names: Record<string, string>;
  me: string;
}) {
  const youOwe = debts.filter((d) => d.debtorId === me).reduce((s, d) => s + d.amount, 0);
  const owedToYou = debts.filter((d) => d.creditorId === me).reduce((s, d) => s + d.amount, 0);
  const who = (id: string) => (id === me ? "You" : names[id] ?? "Someone");

  return (
    <div className={cardCls}>
      <h2 className="font-semibold">Who owes whom</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg bg-red-50 p-3">
          <p className="text-xs text-red-700">You owe</p>
          <p className="text-lg font-semibold text-red-800">{formatTaka(youOwe)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs text-emerald-700">You are owed</p>
          <p className="text-lg font-semibold text-emerald-800">{formatTaka(owedToYou)}</p>
        </div>
      </div>
      {debts.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Everyone is settled up. 🎉</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {debts.map((d) => (
            <li key={`${d.debtorId}-${d.creditorId}`}>
              <strong>{who(d.debtorId)}</strong> {d.debtorId === me ? "owe" : "owes"}{" "}
              <strong>{who(d.creditorId).toLowerCase() === "you" ? "you" : who(d.creditorId)}</strong>{" "}
              <span className="font-medium text-slate-900">{formatTaka(d.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-slate-400">Only confirmed loans and repayments are counted.</p>
    </div>
  );
}

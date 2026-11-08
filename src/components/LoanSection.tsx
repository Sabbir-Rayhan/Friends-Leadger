import type { LoanView, RepaymentView } from "@/lib/types";
import { LoanCard } from "./LoanCard";

export function LoanSection({
  title,
  items,
  repayments,
  me,
}: {
  title: string;
  items: LoanView[];
  repayments: RepaymentView[];
  me: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-500">{title}</h2>
      {items.map((l) => (
        <LoanCard key={l.id} loan={l} repayments={repayments} me={me} />
      ))}
    </section>
  );
}

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20";
export const labelCls = "mb-1 block text-sm font-medium text-slate-700";
export const cardCls = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";

const badgeColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  settled: "bg-sky-100 text-sky-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
        badgeColors[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

import Link from "next/link";
import { markAllNotificationsRead } from "@/actions/notifications";
import { SubmitButton } from "@/components/SubmitButton";
import { cardCls } from "@/components/ui";
import { getNotifications } from "@/data/queries";
import { formatTaka, toPaisa } from "@/lib/money";
import { requireUser } from "@/lib/session";

type Row = Awaited<ReturnType<typeof getNotifications>>[number];

function message(n: Row) {
  const loan = formatTaka(toPaisa(n.loanAmount));
  const rep = n.repaymentAmount ? formatTaka(toPaisa(n.repaymentAmount)) : "";
  switch (n.type) {
    case "loan_requested":
      return `${n.lenderName} says they lent you ${loan}. Please confirm or reject.`;
    case "loan_confirmed":
      return `${n.borrowerName} confirmed the ${loan} loan.`;
    case "loan_rejected":
      return `${n.borrowerName} rejected the ${loan} loan.`;
    case "repayment_requested":
      return `${n.borrowerName} says they paid you back ${rep}. Please confirm.`;
    case "repayment_confirmed":
      return `${n.lenderName} confirmed your ${rep} repayment.`;
    case "repayment_rejected":
      return `${n.lenderName} disputed your ${rep} repayment.`;
  }
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await getNotifications(user.id);
  const hasUnread = items.some((n) => !n.readAt);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <SubmitButton variant="secondary" small>Mark all as read</SubmitButton>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <p className={`${cardCls} text-sm text-slate-600`}>Nothing yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href={`/circles/${n.circleId}`}
                className={`${cardCls} block hover:border-emerald-400 ${n.readAt ? "" : "border-emerald-300 bg-emerald-50/50"}`}
              >
                <p className="text-sm">{message(n)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {n.circleName} · {n.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import Link from "next/link";
import { markAllNotificationsRead } from "@/actions/notifications";
import { SubmitButton } from "@/components/SubmitButton";
import { cardCls } from "@/components/ui";
import { getNotifications } from "@/data/queries";
import { localeOf, type DictKey, type TFunc } from "@/i18n";
import { getI18n } from "@/i18n/server";
import { formatTaka, toPaisa } from "@/lib/money";
import { requireUser } from "@/lib/session";

type Row = Awaited<ReturnType<typeof getNotifications>>[number];

export default async function NotificationsPage() {
  const user = await requireUser();
  const { t, lang } = await getI18n();
  const items = await getNotifications(user.id);
  const hasUnread = items.some((n) => !n.readAt);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("notifTitle")}</h1>
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <SubmitButton variant="secondary" small>{t("markAllRead")}</SubmitButton>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <p className={`${cardCls} text-slate-600`}>{t("noNotifs")}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href={`/circles/${n.circleId}`}
                className={`${cardCls} block hover:border-emerald-400 ${n.readAt ? "" : "border-emerald-300 bg-emerald-50/50"}`}
              >
                <p>{message(n, t, lang)}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {n.circleName} ·{" "}
                  {n.createdAt.toLocaleString(localeOf(lang), {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Dhaka",
                  })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function message(n: Row, t: TFunc, lang: "bn" | "en") {
  const amount = formatTaka(toPaisa(n.repaymentAmount ?? n.loanAmount), lang);
  return t(`n_${n.type}` as DictKey, {
    lender: n.lenderName,
    borrower: n.borrowerName,
    amount,
  });
}

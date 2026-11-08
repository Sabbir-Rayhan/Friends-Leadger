import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { BalanceSummary } from "@/components/BalanceSummary";
import { CopyButton } from "@/components/CopyButton";
import { needsMyAction } from "@/components/LoanCard";
import { LoanSection } from "@/components/LoanSection";
import { NewLoanForm } from "@/components/NewLoanForm";
import { cardCls } from "@/components/ui";
import { getCircleForMember, getCircleLoans, getCircleMembers } from "@/data/queries";
import { formatNumber } from "@/i18n";
import { getI18n } from "@/i18n/server";
import { computeDebts, loanTotals } from "@/lib/balances";
import { requireUser } from "@/lib/session";

export default async function CirclePage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  if (!z.uuid().safeParse(circleId).success) notFound();

  const user = await requireUser();
  const { t, lang } = await getI18n();
  // Circle isolation: non-members get a 404, as if the circle didn't exist.
  const circle = await getCircleForMember(circleId, user.id);
  if (!circle) notFound();

  const [members, { loans, repayments }] = await Promise.all([
    getCircleMembers(circleId),
    getCircleLoans(circleId, user.id),
  ]);

  const names = Object.fromEntries(members.map((m) => [m.id, m.name]));
  const debts = computeDebts(loans, repayments);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const inviteLink = `${proto}://${host}/join/${circle.inviteCode}`;

  const attention = loans.filter((l) => needsMyAction(l, repayments, user.id));
  const active = loans.filter(
    (l) =>
      !attention.includes(l) &&
      (l.status === "pending" ||
        (l.status === "confirmed" && loanTotals(l, repayments).outstanding > 0))
  );
  const settled = loans.filter(
    (l) =>
      l.status === "confirmed" &&
      loanTotals(l, repayments).outstanding === 0 &&
      !attention.includes(l)
  );
  const closed = loans.filter((l) => l.status === "rejected" || l.status === "cancelled");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/circles" className="text-sm text-slate-500 hover:text-emerald-700">
          {t("allGroups")}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{circle.name}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* On phones the "I lent money" form comes first, so beginners find it immediately */}
        <div className="order-2 space-y-6 lg:order-1 lg:col-span-2">
          <LoanSection title={t("needsAttention")} items={attention} repayments={repayments} me={user.id} />
          <LoanSection title={t("activeLoans")} items={active} repayments={repayments} me={user.id} />
          <LoanSection title={t("settledLoans")} items={settled} repayments={repayments} me={user.id} />
          <LoanSection title={t("closedLoans")} items={closed} repayments={repayments} me={user.id} />
          {loans.length === 0 && <p className={`${cardCls} text-slate-600`}>{t("noLoans")}</p>}
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <div className={cardCls}>
            <h2 className="mb-3 text-lg font-bold">{t("recordLoanTitle")}</h2>
            <NewLoanForm
              circleId={circle.id}
              friends={members.filter((m) => m.id !== user.id).map((m) => ({ id: m.id, name: m.name }))}
            />
          </div>

          <BalanceSummary debts={debts} names={names} me={user.id} />

          <div className={cardCls}>
            <h2 className="text-lg font-bold">{t("inviteTitle")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("inviteHelp")}</p>
            <p className="mt-2 break-all rounded bg-slate-50 p-2 text-xs">{inviteLink}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <CopyButton text={inviteLink} label={t("copyLink")} />
              <CopyButton text={circle.inviteCode} label={t("copyCode")} />
              <span className="font-mono text-sm tracking-wider text-slate-600">{circle.inviteCode}</span>
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="mb-2 text-lg font-bold">
              {t("membersTitle", { n: formatNumber(members.length, lang) })}
            </h2>
            <ul className="space-y-1">
              {members.map((m) => (
                <li key={m.id}>
                  {m.name}
                  {m.id === user.id ? ` ${t("youTag")}` : ""}
                  {m.role === "admin" && (
                    <span className="ml-1 text-xs text-slate-400">{t("adminTag")}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

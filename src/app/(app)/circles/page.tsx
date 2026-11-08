import Link from "next/link";
import { CreateCircleForm, JoinCircleForm } from "@/components/CircleForms";
import { cardCls } from "@/components/ui";
import { getMyCircles } from "@/data/queries";
import { formatNumber } from "@/i18n";
import { getI18n } from "@/i18n/server";
import { requireUser } from "@/lib/session";

export default async function CirclesPage() {
  const user = await requireUser();
  const { t, lang } = await getI18n();
  const circles = await getMyCircles(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("groupsTitle")}</h1>
        <p className="text-slate-600">{t("groupsIntro")}</p>
      </div>

      {circles.length === 0 ? (
        <p className={`${cardCls} text-slate-600`}>{t("noGroups")}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {circles.map((c) => (
            <li key={c.id}>
              <Link href={`/circles/${c.id}`} className={`${cardCls} block hover:border-emerald-400`}>
                <p className="text-lg font-semibold">{c.name}</p>
                <p className="text-sm text-slate-500">
                  {c.memberCount === 1 ? t("memberOne") : t("memberMany", { n: formatNumber(c.memberCount, lang) })}
                  {c.role === "admin" ? ` · ${t("adminTag")}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className={cardCls}>
          <h2 className="mb-3 text-lg font-bold">{t("createGroup")}</h2>
          <CreateCircleForm />
        </div>
        <div className={cardCls}>
          <h2 className="mb-3 text-lg font-bold">{t("joinGroup")}</h2>
          <JoinCircleForm />
        </div>
      </div>

      <div className={`${cardCls} bg-emerald-50/60`}>
        <h2 className="text-lg font-bold">{t("helpTitle")}</h2>
        <ul className="mt-2 space-y-1 text-slate-700">
          <li>{t("help1")}</li>
          <li>{t("help2")}</li>
          <li>{t("help3")}</li>
        </ul>
      </div>
    </div>
  );
}

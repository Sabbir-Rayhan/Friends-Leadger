import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { cardCls } from "@/components/ui";
import { getI18n } from "@/i18n/server";
import { formatNumber } from "@/i18n";
import { getSession } from "@/lib/session";

export default async function Home() {
  if (await getSession()) redirect("/circles");
  const { t, lang } = await getI18n();
  const steps = [t("how1"), t("how2"), t("how3"), t("how4")];

  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl justify-end px-4 pt-4">
        <LanguageToggle />
      </div>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-5 py-10 text-center">
        <h1 className="text-5xl font-bold text-emerald-700">{t("appName")}</h1>
        <p className="mt-3 text-lg font-medium text-slate-700">{t("tagline")}</p>
        <p className="mt-4 max-w-xl text-slate-600">{t("landingText")}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="rounded-lg bg-emerald-600 px-7 py-3 text-base font-semibold text-white hover:bg-emerald-700">
            {t("getStarted")}
          </Link>
          <Link href="/login" className="rounded-lg border border-slate-300 bg-white px-7 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50">
            {t("logIn")}
          </Link>
        </div>

        <section className={`${cardCls} mt-12 w-full text-left`}>
          <h2 className="text-xl font-bold">{t("howTitle")}</h2>
          <ol className="mt-4 space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800">
                  {formatNumber(i + 1, lang)}
                </span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">🔒 {t("privacyNote")}</p>
        </section>
      </main>
    </>
  );
}

import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { joinCircleByLink } from "@/actions/circles";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SubmitButton } from "@/components/SubmitButton";
import { cardCls } from "@/components/ui";
import { db } from "@/db";
import { circles } from "@/db/schema";
import { getI18n } from "@/i18n/server";
import { getMembership } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/join/${code}`)}`);

  const { t } = await getI18n();
  const [circle] = await db
    .select({ id: circles.id, name: circles.name })
    .from(circles)
    .where(eq(circles.inviteCode, code.toUpperCase()))
    .limit(1);
  if (!circle) notFound();

  if (await getMembership(circle.id, session.user.id)) redirect(`/circles/${circle.id}`);

  return (
    <>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <span className="text-xl font-bold text-emerald-700">{t("appName")}</span>
        <LanguageToggle />
      </div>
      <main className="flex flex-1 items-start justify-center p-4 sm:items-center">
        <div className={`${cardCls} w-full max-w-sm text-center`}>
          <p className="text-sm text-slate-500">{t("invitedTo")}</p>
          <h1 className="mt-1 text-2xl font-bold">{circle.name}</h1>
          <p className="mt-3 text-sm text-slate-500">{t("joinNote")}</p>
          <form action={joinCircleByLink.bind(null, code)} className="mt-5">
            <SubmitButton full>{t("joinThisGroup")}</SubmitButton>
          </form>
        </div>
      </main>
    </>
  );
}

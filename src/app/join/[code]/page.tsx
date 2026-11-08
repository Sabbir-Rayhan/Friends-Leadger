import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { joinCircleByLink } from "@/actions/circles";
import { SubmitButton } from "@/components/SubmitButton";
import { cardCls } from "@/components/ui";
import { db } from "@/db";
import { circles } from "@/db/schema";
import { getMembership } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/join/${code}`)}`);

  const [circle] = await db
    .select({ id: circles.id, name: circles.name })
    .from(circles)
    .where(eq(circles.inviteCode, code.toUpperCase()))
    .limit(1);
  if (!circle) notFound();

  if (await getMembership(circle.id, session.user.id)) redirect(`/circles/${circle.id}`);

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className={`${cardCls} w-full max-w-sm text-center`}>
        <p className="text-sm text-slate-500">You&apos;ve been invited to join</p>
        <h1 className="mt-1 text-2xl font-bold">{circle.name}</h1>
        <p className="mt-3 text-xs text-slate-500">
          Members of this circle will be able to see its loans, and you&apos;ll see theirs.
        </p>
        <form action={joinCircleByLink.bind(null, code)} className="mt-5">
          <SubmitButton>Join circle</SubmitButton>
        </form>
      </div>
    </main>
  );
}

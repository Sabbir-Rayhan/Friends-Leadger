import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  if (await getSession()) redirect("/circles");
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold text-emerald-700">Friend Ledger</h1>
      <p className="mt-4 text-slate-600">
        Keep track of money lent between friends. Every loan and repayment is
        confirmed by both sides, so the numbers stay honest. Each friend circle
        is private to its members.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/signup" className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
          Get started
        </Link>
        <Link href="/login" className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Log in
        </Link>
      </div>
    </main>
  );
}

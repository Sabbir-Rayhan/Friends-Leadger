import Link from "next/link";
import { CreateCircleForm, JoinCircleForm } from "@/components/CircleForms";
import { cardCls } from "@/components/ui";
import { getMyCircles } from "@/data/queries";
import { requireUser } from "@/lib/session";

export default async function CirclesPage() {
  const user = await requireUser();
  const circles = await getMyCircles(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your circles</h1>
        <p className="text-sm text-slate-600">
          A circle is a private group of friends. Only its members can see its loans.
        </p>
      </div>

      {circles.length === 0 ? (
        <p className={`${cardCls} text-sm text-slate-600`}>
          You&apos;re not in any circle yet. Create one, or join a friend&apos;s with an invite code.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {circles.map((c) => (
            <li key={c.id}>
              <Link href={`/circles/${c.id}`} className={`${cardCls} block hover:border-emerald-400`}>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-slate-500">
                  {c.memberCount} member{c.memberCount === 1 ? "" : "s"}
                  {c.role === "admin" ? " · admin" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className={cardCls}>
          <h2 className="mb-3 font-semibold">Create a circle</h2>
          <CreateCircleForm />
        </div>
        <div className={cardCls}>
          <h2 className="mb-3 font-semibold">Join with an invite code</h2>
          <JoinCircleForm />
        </div>
      </div>
    </div>
  );
}

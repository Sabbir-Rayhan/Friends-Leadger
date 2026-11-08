import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

export function Header({ name, unread }: { name: string; unread: number }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/circles" className="text-lg font-bold text-emerald-700">
          Friend Ledger
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/circles" className="text-slate-700 hover:text-emerald-700">
            Circles
          </Link>
          <Link
            href="/notifications"
            className="relative text-slate-700 hover:text-emerald-700"
          >
            Notifications
            {unread > 0 && (
              <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                {unread}
              </span>
            )}
          </Link>
          <span className="hidden text-slate-500 sm:inline">{name}</span>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}

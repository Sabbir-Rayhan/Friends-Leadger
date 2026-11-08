import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { formatNumber } from "@/i18n";
import { LanguageToggle } from "./LanguageToggle";
import { SignOutButton } from "./SignOutButton";

export async function Header({ name, unread }: { name: string; unread: number }) {
  const { t, lang } = await getI18n();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/circles" className="text-xl font-bold text-emerald-700">
          {t("appName")}
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/circles" className="font-medium text-slate-700 hover:text-emerald-700">
            {t("navGroups")}
          </Link>
          <Link href="/notifications" className="font-medium text-slate-700 hover:text-emerald-700">
            {t("navNotifications")}
            {unread > 0 && (
              <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                {formatNumber(unread, lang)}
              </span>
            )}
          </Link>
          <span className="hidden text-slate-500 md:inline">{name}</span>
          <LanguageToggle />
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}

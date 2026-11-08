import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getI18n } from "@/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n();
  return (
    <>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-emerald-700">
          {t("appName")}
        </Link>
        <LanguageToggle />
      </header>
      <main className="flex flex-1 items-start justify-center p-4 sm:items-center">{children}</main>
    </>
  );
}

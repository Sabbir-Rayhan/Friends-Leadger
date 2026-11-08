"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
    >
      {t("signOut")}
    </button>
  );
}

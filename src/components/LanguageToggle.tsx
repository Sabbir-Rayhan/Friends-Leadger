"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLanguage } from "@/actions/language";
import { useI18n } from "@/i18n/client";

export function LanguageToggle() {
  const { lang, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setLanguage(lang === "bn" ? "en" : "bn");
          router.refresh();
        })
      }
      className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      {t("switchLanguage")}
    </button>
  );
}

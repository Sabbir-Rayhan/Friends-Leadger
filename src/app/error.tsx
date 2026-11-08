"use client";

import { useI18n } from "@/i18n/client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="mx-auto mt-24 max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-red-700">{t("somethingWrong")}</h2>
      <p className="mt-2 text-sm text-slate-600">{error.message || t("errorGeneric")}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white"
      >
        {t("tryAgain")}
      </button>
    </div>
  );
}

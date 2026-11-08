"use client";

import { useFormStatus } from "react-dom";
import { useI18n } from "@/i18n/client";

const variants = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-700",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
};

export function SubmitButton({
  children,
  variant = "primary",
  small = false,
  full = false,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  small?: boolean;
  full?: boolean;
}) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg font-semibold transition disabled:opacity-60 ${variants[variant]} ${
        small ? "px-3.5 py-2 text-sm" : "px-5 py-3 text-base"
      } ${full ? "w-full" : ""}`}
    >
      {pending ? t("pleaseWait") : children}
    </button>
  );
}

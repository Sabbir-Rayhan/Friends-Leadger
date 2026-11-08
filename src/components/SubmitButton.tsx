"use client";

import { useFormStatus } from "react-dom";

const variants = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-700",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
};

export function SubmitButton({
  children,
  variant = "primary",
  small = false,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  small?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg font-medium transition disabled:opacity-60 ${variants[variant]} ${
        small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      }`}
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

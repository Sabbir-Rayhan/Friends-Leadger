"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import type { TFunc } from "@/i18n";
import { authClient } from "@/lib/auth-client";
import { inputCls, labelCls } from "./ui";

function authErrorMessage(err: { code?: string; message?: string }, t: TFunc) {
  const s = `${err.code ?? ""} ${err.message ?? ""}`.toLowerCase();
  if (s.includes("already exist")) return t("errUserExists");
  if (s.includes("invalid email or password") || s.includes("invalid_email_or_password"))
    return t("errInvalidCreds");
  if (s.includes("too short") || s.includes("password_too_short")) return t("errPasswordShort");
  if (s.includes("invalid email") || s.includes("invalid_email")) return t("errInvalidEmail");
  return t("errorGeneric");
}

export function AuthForm({
  mode,
  next,
  googleEnabled,
}: {
  mode: "login" | "signup";
  next: string;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));

    const res =
      mode === "signup"
        ? await authClient.signUp.email({ name: String(fd.get("name")), email, password })
        : await authClient.signIn.email({ email, password });

    setLoading(false);
    if (res.error) {
      setError(authErrorMessage(res.error, t));
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">
        {mode === "signup" ? t("signupTitle") : t("loginTitle")}
      </h1>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {mode === "signup" && (
          <div>
            <label className={labelCls} htmlFor="name">{t("yourName")}</label>
            <input id="name" name="name" required maxLength={60} autoComplete="name" className={inputCls} />
          </div>
        )}
        <div>
          <label className={labelCls} htmlFor="email">{t("email")}</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="password">{t("password")}</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className={inputCls}
          />
          {mode === "signup" && <p className="mt-1 text-xs text-slate-500">{t("passwordHint")}</p>}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-5 py-3 text-base font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("pleaseWait") : mode === "signup" ? t("signupBtn") : t("loginBtn")}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-4 text-center text-xs text-slate-400">{t("or")}</div>
          <button
            type="button"
            onClick={() => authClient.signIn.social({ provider: "google", callbackURL: next })}
            className="w-full rounded-lg border border-slate-300 px-5 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            {t("google")}
          </button>
        </>
      )}

      <p className="mt-5 text-center text-sm text-slate-600">
        {mode === "signup" ? (
          <>
            {t("haveAccount")}{" "}
            <Link className="font-medium text-emerald-700 underline" href={`/login?next=${encodeURIComponent(next)}`}>
              {t("logIn")}
            </Link>
          </>
        ) : (
          <>
            {t("newHere")}{" "}
            <Link className="font-medium text-emerald-700 underline" href={`/signup?next=${encodeURIComponent(next)}`}>
              {t("createAccountLink")}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { inputCls, labelCls } from "./ui";

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
      setError(res.error.message ?? "Something went wrong.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {mode === "signup" && (
          <div>
            <label className={labelCls} htmlFor="name">Name</label>
            <input id="name" name="name" required maxLength={60} className={inputCls} />
          </div>
        )}
        <div>
          <label className={labelCls} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className={inputCls}
          />
          {mode === "signup" && (
            <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "signup" ? "Sign up" : "Log in"}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-4 text-center text-xs text-slate-400">or</div>
          <button
            type="button"
            onClick={() => authClient.signIn.social({ provider: "google", callbackURL: next })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Continue with Google
          </button>
        </>
      )}

      <p className="mt-5 text-center text-sm text-slate-600">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link className="text-emerald-700 underline" href={`/login?next=${encodeURIComponent(next)}`}>
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link className="text-emerald-700 underline" href={`/signup?next=${encodeURIComponent(next)}`}>
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

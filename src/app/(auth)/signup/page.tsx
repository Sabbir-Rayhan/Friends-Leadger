import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { googleEnabled } from "@/lib/auth";
import { getSession } from "@/lib/session";

function safeNext(v: string | string[] | undefined) {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.startsWith("/") && !s.startsWith("//") ? s : "/circles";
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = safeNext((await searchParams).next);
  if (await getSession()) redirect(next);
  return <AuthForm mode="signup" next={next} googleEnabled={googleEnabled} />;
}

"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LANG_COOKIE } from "@/i18n";

export async function setLanguage(lang: "bn" | "en"): Promise<void> {
  (await cookies()).set(LANG_COOKIE, lang === "en" ? "en" : "bn", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

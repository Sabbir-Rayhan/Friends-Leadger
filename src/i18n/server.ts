import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, makeT, type Lang } from "./index";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return v === "en" || v === "bn" ? v : DEFAULT_LANG;
}

/** Use in server components and server actions. */
export async function getI18n() {
  const lang = await getLang();
  return { lang, t: makeT(lang) };
}

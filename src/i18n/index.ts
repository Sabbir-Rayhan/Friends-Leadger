import { bn, en, type DictKey } from "./dictionaries";

export type Lang = "bn" | "en";
export type { DictKey };
export type TFunc = (key: DictKey, params?: Record<string, string | number>) => string;

export const LANG_COOKIE = "lang";
export const DEFAULT_LANG: Lang = "bn";

export function makeT(lang: Lang): TFunc {
  const dict: Record<DictKey, string> = lang === "en" ? en : bn;
  return (key, params) => {
    let s = dict[key];
    if (params) {
      for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
    }
    return s;
  };
}

export const localeOf = (lang: Lang) => (lang === "bn" ? "bn-BD" : "en-US");

export const formatNumber = (n: number, lang: Lang) => n.toLocaleString(localeOf(lang));

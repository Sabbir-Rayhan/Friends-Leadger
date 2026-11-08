"use client";

import { createContext, useContext, useMemo } from "react";
import { makeT, type Lang, type TFunc } from "./index";

const Ctx = createContext<{ lang: Lang; t: TFunc }>({ lang: "bn", t: makeT("bn") });

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const value = useMemo(() => ({ lang, t: makeT(lang) }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Use in client components. */
export const useI18n = () => useContext(Ctx);

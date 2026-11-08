"use client";

import { useActionState } from "react";
import { createCircle, joinCircleWithCode } from "@/actions/circles";
import { useI18n } from "@/i18n/client";
import { SubmitButton } from "./SubmitButton";
import { inputCls, labelCls } from "./ui";

export function CreateCircleForm() {
  const { t } = useI18n();
  const [state, action] = useActionState(createCircle, {});
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className={labelCls} htmlFor="name">{t("groupName")}</label>
        <input id="name" name="name" required maxLength={60} placeholder={t("groupNamePh")} className={inputCls} />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton full>{t("createGroupBtn")}</SubmitButton>
    </form>
  );
}

export function JoinCircleForm() {
  const { t } = useI18n();
  const [state, action] = useActionState(joinCircleWithCode, {});
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className={labelCls} htmlFor="code">{t("inviteCode")}</label>
        <input id="code" name="code" required placeholder="K7M2QX9A" className={`${inputCls} uppercase`} />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton variant="secondary" full>{t("joinBtn")}</SubmitButton>
    </form>
  );
}

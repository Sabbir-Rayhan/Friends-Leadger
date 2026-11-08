"use client";

import { useActionState } from "react";
import { createCircle, joinCircleWithCode } from "@/actions/circles";
import { SubmitButton } from "./SubmitButton";
import { inputCls, labelCls } from "./ui";

export function CreateCircleForm() {
  const [state, action] = useActionState(createCircle, {});
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className={labelCls} htmlFor="name">Circle name</label>
        <input id="name" name="name" required maxLength={60} placeholder="e.g. College friends" className={inputCls} />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton>Create circle</SubmitButton>
    </form>
  );
}

export function JoinCircleForm() {
  const [state, action] = useActionState(joinCircleWithCode, {});
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className={labelCls} htmlFor="code">Invite code</label>
        <input id="code" name="code" required placeholder="e.g. K7M2QX9A" className={`${inputCls} uppercase`} />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton variant="secondary">Join circle</SubmitButton>
    </form>
  );
}

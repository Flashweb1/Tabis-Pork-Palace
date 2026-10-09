"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { FormState } from "@/lib/form";

export function ActionForm({
  action,
  children,
  submit,
  className = "space-y-4",
  buttonClass = "btn-primary w-full",
  resetOnSuccess = false,
  hideSubmit = false,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children: ReactNode;
  submit: string;
  className?: string;
  buttonClass?: string;
  resetOnSuccess?: boolean;
  hideSubmit?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && state.redirect) {
      if (/^https?:/.test(state.redirect)) window.location.href = state.redirect;
      else {
        router.push(state.redirect);
        router.refresh();
      }
    }
  }, [state, router]);

  return (
    <form
      action={formAction}
      className={className}
      ref={(el) => {
        if (el && resetOnSuccess && state?.ok && !state.redirect) el.reset();
      }}
    >
      {children}
      {!hideSubmit && (
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Please wait…" : submit}
        </button>
      )}
      {state && (
        <p role="status" className={`rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-forest-3 text-forest" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

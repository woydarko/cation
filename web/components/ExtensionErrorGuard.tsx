"use client";
import { useEffect } from "react";

/** Browser extensions (wallets, etc.) sometimes throw inside their own content
 * scripts when they probe the page. Those errors come from chrome-extension://
 * sources and are not our app's fault, but Next's dev overlay surfaces them.
 * Swallow errors that originate from extension code so they don't disrupt the
 * app. Registered in the capture phase, as early as possible. */
export default function ExtensionErrorGuard() {
  useEffect(() => {
    const has = (v: unknown, needle: string) =>
      typeof v === "string" && v.includes(needle);
    // Known extension-thrown message + any chrome-extension:// origin. Extension
    // errors are often cross-origin sanitized (empty filename/stack), so we also
    // match the specific message these wallet extensions throw while probing.
    const isExtensionError = (msg?: string, file?: string, stack?: string) =>
      has(file, "chrome-extension://") ||
      has(stack, "chrome-extension://") ||
      has(msg, "Cannot create proxy with a non-object");

    const onError = (e: ErrorEvent) => {
      const stack = (e.error && (e.error as Error).stack) || "";
      if (isExtensionError(e.message, e.filename, stack)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason as { message?: string; stack?: string } | undefined;
      if (isExtensionError(reason?.message, undefined, reason?.stack)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection, true);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection, true);
    };
  }, []);

  return null;
}

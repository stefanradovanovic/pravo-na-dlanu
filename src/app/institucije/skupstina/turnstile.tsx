"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { assemblyRatingAction } from "../../../../convex/ratingContract";

type TurnstileApi = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      language: string;
      size: "normal" | "compact";
      appearance: "interaction-only";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => boolean;
      "response-field": boolean;
    },
  ): string | undefined;
  remove(widgetId: string): void;
};

let scriptReady: Promise<TurnstileApi> | undefined;

function loadTurnstile() {
  const turnstileWindow = window as Window & {
    turnstile?: TurnstileApi;
    assemblyRatingTurnstileReady?: () => void;
  };
  scriptReady ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=assemblyRatingTurnstileReady";
    script.async = true;

    function finish() {
      window.clearTimeout(timeout);
      delete turnstileWindow.assemblyRatingTurnstileReady;
    }

    function fail() {
      finish();
      script.remove();
      reject(new Error("Turnstile did not load."));
    }

    const timeout = window.setTimeout(fail, 15_000);
    script.onerror = fail;
    turnstileWindow.assemblyRatingTurnstileReady = () => {
      const api = turnstileWindow.turnstile;
      if (!api) return fail();
      finish();
      resolve(api);
    };
    document.head.append(script);
  }).catch((error) => {
    scriptReady = undefined;
    throw error;
  });
  return scriptReady;
}

export function Turnstile({
  siteKey,
  onToken,
  onFailure,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  onFailure: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const verified = useEffectEvent(onToken);
  const failed = useEffectEvent(onFailure);

  useEffect(() => {
    let disposed = false;
    let settled = false;
    let remove: (() => void) | undefined;
    function fail() {
      if (!disposed && !settled) {
        settled = true;
        failed();
      }
      return true;
    }

    void loadTurnstile()
      .then((api) => {
        const node = container.current;
        if (disposed || !node) return;
        const widget = api.render(node, {
          sitekey: siteKey,
          action: assemblyRatingAction,
          language: "sr",
          size: node.clientWidth >= 300 ? "normal" : "compact",
          appearance: "interaction-only",
          "response-field": false,
          callback(token) {
            if (!disposed && !settled) {
              settled = true;
              verified(token);
            }
          },
          "expired-callback": fail,
          "error-callback": fail,
        });
        if (widget) remove = () => api.remove(widget);
        else fail();
      })
      .catch(fail);

    return () => {
      disposed = true;
      remove?.();
    };
  }, [siteKey]);

  return <div ref={container} />;
}

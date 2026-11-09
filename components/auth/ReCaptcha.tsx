"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

export interface ReCaptchaRef {
  reset: () => void;
  getResponse: () => string;
}

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark";
  className?: string;
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (
        container: HTMLElement | string,
        parameters: {
          sitekey: string;
          theme?: "light" | "dark";
          callback?: (response: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => number;
      reset: (opt_widget_id?: number) => void;
      getResponse: (opt_widget_id?: number) => string;
    };
  }
}

export const ReCaptcha = forwardRef<ReCaptchaRef, ReCaptchaProps>(
  ({ onVerify, onExpire, onError, theme = "light", className = "" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const callbacksRef = useRef({ onVerify, onExpire, onError });

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    // Update callbacks without recreating the widget.
    useEffect(() => {
      callbacksRef.current = { onVerify, onExpire, onError };
    }, [onVerify, onExpire, onError]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current !== null && window.grecaptcha) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
          } catch (err) {
            console.error("[RECAPTCHA_RESET_ERROR]:", err);
          }
        }
      },

      getResponse: () => {
        if (widgetIdRef.current !== null && window.grecaptcha) {
          try {
            return window.grecaptcha.getResponse(widgetIdRef.current);
          } catch {
            return "";
          }
        }

        return "";
      },
    }));

    useEffect(() => {
      const key = siteKey;

      if (!key || !containerRef.current) return;

      let isMounted = true;
      let interval: ReturnType<typeof setInterval> | undefined;

      // Each effect execution owns its own widget.
      let currentWidgetId: number | null = null;

      function renderWidget() {
        if (
          !isMounted ||
          !containerRef.current ||
          !window.grecaptcha ||
          currentWidgetId !== null
        ) {
          return;
        }

        try {
          const target = document.createElement("div");
          containerRef.current.appendChild(target);

          const id = window.grecaptcha.render(target, {
            sitekey: key as string,
            theme,

            callback: (token: string) => {
              if (isMounted) {
                callbacksRef.current.onVerify(token);
              }
            },

            "expired-callback": () => {
              if (isMounted) {
                callbacksRef.current.onExpire?.();
              }
            },

            "error-callback": () => {
              if (isMounted) {
                callbacksRef.current.onError?.();
              }
            },
          });

          currentWidgetId = id;
          widgetIdRef.current = id;
        } catch (err) {
          console.error("[RECAPTCHA_RENDER_ERROR]:", err);
        }
      }

      function waitForScript() {
        if (!isMounted || !window.grecaptcha) return;

        window.grecaptcha.ready(() => {
          if (isMounted) renderWidget();
        });
      }

      if (window.grecaptcha?.render) {
        waitForScript();
      } else {
        const existingScript = document.getElementById(
          "google-recaptcha-script",
        );

        if (!existingScript) {
          const script = document.createElement("script");

          script.id = "google-recaptcha-script";
          script.src =
            "https://www.google.com/recaptcha/api.js?render=explicit";
          script.async = true;
          script.defer = true;

          script.onload = waitForScript;

          script.onerror = () => {
            if (isMounted) {
              callbacksRef.current.onError?.();
            }
          };

          document.head.appendChild(script);
        } else {
          interval = setInterval(() => {
            if (window.grecaptcha?.render) {
              if (interval !== undefined) {
                clearInterval(interval);
                interval = undefined;
              }

              waitForScript();
            }
          }, 100);
        }
      }

      return () => {
        isMounted = false;

        if (interval !== undefined) {
          clearInterval(interval);
          interval = undefined;
        }

        if (currentWidgetId !== null && window.grecaptcha) {
          try {
            window.grecaptcha.reset(currentWidgetId);
          } catch (err) {
            console.error("[RECAPTCHA_CLEANUP_ERROR]:", err);
          }
        }

        if (widgetIdRef.current === currentWidgetId) {
          widgetIdRef.current = null;
        }

        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
      };
    }, [siteKey, theme]);

    if (!siteKey) {
      if (process.env.NODE_ENV === "development") {
        return (
          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-700 text-center">
            <strong>Dev Notice:</strong> NEXT_PUBLIC_RECAPTCHA_SITE_KEY belum
            diisi. reCAPTCHA v2 nonaktif sementara.
          </div>
        );
      }

      return null;
    }

    return (
      <div className={`flex justify-center my-2 ${className}`}>
        <div ref={containerRef} className="min-h-[78px]" />
      </div>
    );
  },
);

ReCaptcha.displayName = "ReCaptcha";

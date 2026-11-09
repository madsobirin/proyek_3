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
    const isRenderedRef = useRef(false);
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    // Simpan callback di ref agar tidak memicu re-render useEffect saat inline function berubah
    const callbacksRef = useRef({ onVerify, onExpire, onError });
    useEffect(() => {
      callbacksRef.current = { onVerify, onExpire, onError };
    }, [onVerify, onExpire, onError]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (
          widgetIdRef.current !== null &&
          typeof window !== "undefined" &&
          window.grecaptcha
        ) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
          } catch (err) {
            console.error("[RECAPTCHA_RESET_ERROR]:", err);
          }
        }
      },
      getResponse: () => {
        if (
          widgetIdRef.current !== null &&
          typeof window !== "undefined" &&
          window.grecaptcha
        ) {
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
      if (!siteKey || !containerRef.current) return;
      if (isRenderedRef.current) return;

      let isMounted = true;
      let interval: ReturnType<typeof setInterval> | undefined;

      function renderWidget() {
        if (!containerRef.current || !window.grecaptcha || !isMounted) return;
        if (isRenderedRef.current) return;

        try {
          containerRef.current.innerHTML = "";
          const target = document.createElement("div");
          containerRef.current.appendChild(target);

          const id = window.grecaptcha.render(target, {
            sitekey: siteKey,
            theme,
            callback: (token: string) => {
              if (isMounted) callbacksRef.current.onVerify(token);
            },
            "expired-callback": () => {
              if (isMounted) callbacksRef.current.onExpire?.();
            },
            "error-callback": () => {
              if (isMounted) callbacksRef.current.onError?.();
            },
          });

          widgetIdRef.current = id;
          isRenderedRef.current = true;
        } catch (err) {
          console.error("[RECAPTCHA_RENDER_ERROR]:", err);
        }
      }

      if (window.grecaptcha?.render) {
        window.grecaptcha.ready(renderWidget);
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

          script.onload = () => {
            if (window.grecaptcha) {
              window.grecaptcha.ready(renderWidget);
            }
          };

          document.head.appendChild(script);
        } else {
          interval = setInterval(() => {
            if (window.grecaptcha?.render) {
              clearInterval(interval);
              interval = undefined;

              window.grecaptcha.ready(renderWidget);
            }
          }, 100);
        }
      }

      // Satu cleanup untuk semua jalur eksekusi
      return () => {
        isMounted = false;

        if (interval !== undefined) {
          clearInterval(interval);
          interval = undefined;
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

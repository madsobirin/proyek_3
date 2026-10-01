"use client";

import { useEffect } from "react";
import { useChatContext, type ChatPageContext } from "@/components/ChatContext";

/**
 * Hook yang digunakan oleh setiap halaman untuk mendaftarkan context-nya ke FitBot.
 * Saat halaman di-unmount, context otomatis di-reset.
 */
export function useSetChatContext(ctx: ChatPageContext) {
  const { setPageContext } = useChatContext();

  useEffect(() => {
    setPageContext(ctx);
    return () => {
      setPageContext(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

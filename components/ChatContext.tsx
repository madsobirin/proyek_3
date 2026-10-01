"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type QuickPrompt = {
  icon: ReactNode;
  text: string;
};

export type ChatPageContext = {
  /** Nama halaman saat ini, misal "Kalkulator BMI" */
  pageName: string;
  /** Quick prompts khusus halaman */
  quickPrompts: QuickPrompt[];
  /** Hint tambahan untuk system prompt AI (opsional) */
  systemHint?: string;
};

type ChatContextValue = {
  pageContext: ChatPageContext | null;
  setPageContext: (ctx: ChatPageContext | null) => void;
};

const ChatContext = createContext<ChatContextValue>({
  pageContext: null,
  setPageContext: () => {},
});

export function ChatContextProvider({ children }: { children: ReactNode }) {
  const [pageContext, setPageContextState] = useState<ChatPageContext | null>(
    null,
  );

  const setPageContext = useCallback((ctx: ChatPageContext | null) => {
    setPageContextState(ctx);
  }, []);

  return (
    <ChatContext.Provider value={{ pageContext, setPageContext }}>
      {children}
    </ChatContext.Provider>
  );
}

/** Hook untuk membaca context chat saat ini */
export function useChatContext() {
  return useContext(ChatContext);
}

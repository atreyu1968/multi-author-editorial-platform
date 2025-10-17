import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UiText } from "@shared/schema";
import { useLocale } from "./locale-context";

interface UiTextContextValue {
  texts: Map<string, string>;
  isLoading: boolean;
  getText: (namespace: string, key: string, defaultValue?: string) => string;
}

const UiTextContext = createContext<UiTextContextValue | undefined>(undefined);

interface UiTextProviderProps {
  children: ReactNode;
}

export function UiTextProvider({ children }: UiTextProviderProps) {
  const { locale } = useLocale();
  const { data: uiTexts = [], isLoading } = useQuery<UiText[]>({
    queryKey: ["/api/ui-texts", { locale }],
    staleTime: 1000 * 60 * 5,
  });

  const textsMap = new Map<string, string>();
  for (const text of uiTexts) {
    const mapKey = `${text.namespace}.${text.key}`;
    textsMap.set(mapKey, text.value);
  }

  const getText = (namespace: string, key: string, defaultValue?: string): string => {
    const mapKey = `${namespace}.${key}`;
    return textsMap.get(mapKey) || defaultValue || `${namespace}.${key}`;
  };

  const value: UiTextContextValue = {
    texts: textsMap,
    isLoading,
    getText,
  };

  return <UiTextContext.Provider value={value}>{children}</UiTextContext.Provider>;
}

export function useUiText(namespace: string, key: string, defaultValue?: string): string {
  const context = useContext(UiTextContext);
  if (!context) {
    throw new Error("useUiText must be used within UiTextProvider");
  }
  return context.getText(namespace, key, defaultValue);
}

export function useUiTextContext() {
  const context = useContext(UiTextContext);
  if (!context) {
    throw new Error("useUiTextContext must be used within UiTextProvider");
  }
  return context;
}

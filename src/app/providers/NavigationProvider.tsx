import { createContext, useContext, useState, PropsWithChildren } from "react";

export type ActiveTab = "home" | "scan" | "meal" | "shopping" | "settings";

interface NavigationContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: PropsWithChildren) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");

  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}

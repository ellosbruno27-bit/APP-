import React, { createContext, useContext } from "react";
import { useBackendData } from "./useBackendData";
import type { Lead, LandingPage, Corretor, Banco, Produto, CategoriaAfiliado } from "./data";

interface BackendDataContextType {
  leads: Lead[];
  landingPages: LandingPage[];
  corretores: Corretor[];
  bancos: Banco[];
  produtos: Produto[];
  categoriasAfiliado: CategoriaAfiliado[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const BackendDataContext = createContext<BackendDataContextType | null>(null);

export function BackendDataProvider({ children }: { children: React.ReactNode }) {
  const data = useBackendData();

  return (
    <BackendDataContext.Provider value={data}>
      {children}
    </BackendDataContext.Provider>
  );
}

export function useData(): BackendDataContextType {
  const ctx = useContext(BackendDataContext);
  if (!ctx) {
    throw new Error("useData must be used within BackendDataProvider");
  }
  return ctx;
}
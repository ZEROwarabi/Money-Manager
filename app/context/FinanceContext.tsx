"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';

type FinanceDataContextType = ReturnType<typeof useFinanceData>;

export const FinanceDataContext = createContext<FinanceDataContextType | undefined>(undefined);

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const financeData = useFinanceData();

  return (
    <FinanceDataContext.Provider value={financeData}>
      {children}
    </FinanceDataContext.Provider>
  );
}

export function useFinanceContext() {
  const context = useContext(FinanceDataContext);
  if (context === undefined) {
    throw new Error('useFinanceContext must be used within a FinanceDataProvider');
  }
  return context;
}

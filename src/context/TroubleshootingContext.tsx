import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { TroubleshootingLog } from '../types';

interface TroubleshootingContextType {
  logs: TroubleshootingLog[];
  addLog: (entry: Omit<TroubleshootingLog, 'id' | 'timestamp'>) => TroubleshootingLog;
  clearLogs: (moduleName?: string) => void;
  getModuleLogs: (moduleName: string) => TroubleshootingLog[];
  getLatestModuleLog: (moduleName: string) => TroubleshootingLog | undefined;
}

const TroubleshootingContext = createContext<TroubleshootingContextType | undefined>(undefined);

export const TroubleshootingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<TroubleshootingLog[]>([]);

  const addLog = useCallback((entry: Omit<TroubleshootingLog, 'id' | 'timestamp'>) => {
    const newLog: TroubleshootingLog = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    setLogs((prev) => [newLog, ...prev.slice(0, 99)]); // Keep last 100 entries
    return newLog;
  }, []);

  const clearLogs = useCallback((moduleName?: string) => {
    if (moduleName) {
      setLogs((prev) => prev.filter((l) => l.module !== moduleName));
    } else {
      setLogs([]);
    }
  }, []);

  const getModuleLogs = useCallback((moduleName: string) => {
    return logs.filter((l) => l.module === moduleName);
  }, [logs]);

  const getLatestModuleLog = useCallback((moduleName: string) => {
    return logs.find((l) => l.module === moduleName);
  }, [logs]);

  return (
    <TroubleshootingContext.Provider
      value={{
        logs,
        addLog,
        clearLogs,
        getModuleLogs,
        getLatestModuleLog,
      }}
    >
      {children}
    </TroubleshootingContext.Provider>
  );
};

export function useTroubleshooting(): TroubleshootingContextType {
  const context = useContext(TroubleshootingContext);
  if (!context) {
    throw new Error('useTroubleshooting must be used within a TroubleshootingProvider');
  }
  return context;
}

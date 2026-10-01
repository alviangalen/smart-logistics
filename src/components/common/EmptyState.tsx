import React from 'react';
import { Database, AlertTriangle, RefreshCw, Server, ExternalLink } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface EmptyStateProps {
  title?: string;
  description?: string;
  endpoint?: string;
  status?: string | number | null;
  errorMessage?: string;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Tidak ada data',
  description = 'Data dari backend AWS belum diterima atau endpoint belum merespons.',
  endpoint,
  status,
  errorMessage,
  onRetry,
  isLoading = false,
}) => {
  return (
    <div className="border border-slate-800 bg-slate-900/80 p-8 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
        {errorMessage ? (
          <AlertTriangle className="w-6 h-6 text-rose-400" />
        ) : (
          <Database className="w-6 h-6 text-slate-400" />
        )}
      </div>

      <h3 className="font-mono text-base font-medium text-slate-200 uppercase tracking-wider mb-1">
        {title}
      </h3>

      <p className="text-xs text-slate-400 max-w-md mb-4 font-sans">
        {description}
      </p>

      {endpoint && (
        <div className="w-full max-w-xl border border-slate-800 bg-slate-950 p-3 mb-4 text-left font-mono text-xs">
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-slate-800/80">
            <span className="text-slate-500 uppercase flex items-center gap-1">
              <Server className="w-3.5 h-3.5" /> Target Endpoint:
            </span>
            {status && <StatusBadge status={String(status)} />}
          </div>
          <div className="truncate text-slate-300 font-mono select-all">
            {endpoint}
          </div>
          {errorMessage && (
            <div className="mt-2 p-2 bg-rose-950/60 border border-rose-900 text-rose-300 text-xs break-all">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-steel-700 hover:bg-steel-600 disabled:bg-slate-800 text-white font-mono text-xs border border-steel-500 transition-none"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Memeriksa Endpoint...' : 'Uji Koneksi Ulang'}
        </button>
      )}
    </div>
  );
};

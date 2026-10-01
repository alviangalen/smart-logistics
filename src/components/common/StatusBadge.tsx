import React from 'react';

export type StatusVariant = 
  | 'HEALTHY' 
  | 'UNHEALTHY' 
  | 'UNREACHABLE' 
  | 'PENDING' 
  | 'NOT_CONFIGURED' 
  | 'CONNECTED' 
  | 'DISCONNECTED' 
  | 'CONNECTING' 
  | 'ONLINE' 
  | 'OFFLINE'
  | 'OK' 
  | 'ALARM' 
  | 'INSUFFICIENT_DATA'
  | 'SUCCESS'
  | 'ERROR'
  | 'WARNING'
  | 'INFO';

interface StatusBadgeProps {
  status: string | StatusVariant;
  text?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text, size = 'sm' }) => {
  const norm = String(status).toUpperCase();
  let bg = 'bg-slate-800 text-slate-300 border-slate-700';

  if (['HEALTHY', 'CONNECTED', 'ONLINE', 'OK', 'SUCCESS', '200', '201'].includes(norm)) {
    bg = 'bg-emerald-950 text-emerald-300 border-emerald-700';
  } else if (['UNHEALTHY', 'UNREACHABLE', 'DISCONNECTED', 'OFFLINE', 'ALARM', 'ERROR', 'FAILED', 'ECONNREFUSED', 'ETIMEDOUT'].includes(norm)) {
    bg = 'bg-rose-950 text-rose-300 border-rose-700';
  } else if (['PENDING', 'CONNECTING', 'WARNING', 'INSUFFICIENT_DATA', 'SQS_ENQUEUED'].includes(norm)) {
    bg = 'bg-amber-950 text-amber-300 border-amber-700';
  } else if (['NOT_CONFIGURED'].includes(norm)) {
    bg = 'bg-slate-900 text-slate-400 border-slate-700';
  } else if (['STEP_FUNCTIONS_RUNNING', 'DYNAMO_STORED', 'DISPATCHED', 'STANDARD'].includes(norm)) {
    bg = 'bg-steel-950 text-steel-300 border-steel-700';
  } else if (['GLACIER', 'DEEP_ARCHIVE'].includes(norm)) {
    bg = 'bg-cyan-950 text-cyan-300 border-cyan-700';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-medium border ${padding} ${bg}`}>
      <span className="w-1.5 h-1.5 rounded-none bg-current" />
      {text || status}
    </span>
  );
};

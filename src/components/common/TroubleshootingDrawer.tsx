import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Copy, Check, Trash2, Clock, Globe, ArrowRight } from 'lucide-react';
import { TroubleshootingLog } from '../../types';
import { StatusBadge } from './StatusBadge';

interface TroubleshootingDrawerProps {
  logs: TroubleshootingLog[];
  moduleName: string;
  onClear?: () => void;
  defaultOpen?: boolean;
}

export const TroubleshootingDrawer: React.FC<TroubleshootingDrawerProps> = ({
  logs,
  moduleName,
  onClear,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeLog = (selectedLogId ? logs.find((l) => l.id === selectedLogId) : logs[0]) || null;

  const handleCopy = (data: any) => {
    const text = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="border border-slate-700 bg-slate-950 mt-6 text-slate-300 font-mono text-xs">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-steel-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider">
            Troubleshooting & Diagnostic Log
          </span>
          <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 text-[10px] border border-slate-700">
            {moduleName}
          </span>
          <span className="text-[10px] text-slate-400">
            ({logs.length} permintaan terekam)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onClear && logs.length > 0 && (
            <button
              onClick={onClear}
              title="Bersihkan riwayat log modul ini"
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 px-2 py-0.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-none text-[11px]"
          >
            {isOpen ? (
              <>
                <span>Sembunyikan Panel</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Buka Panel</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      {isOpen && (
        <div className="p-3 bg-slate-950">
          {logs.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              Belum ada aktivitas HTTP/WebSocket yang terekam untuk modul ini. Jalankan aksi atau health-check untuk memverifikasi respons AWS.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Request List Column */}
              <div className="lg:col-span-4 border border-slate-800 bg-slate-900/50 max-h-72 overflow-y-auto divide-y divide-slate-800">
                {logs.map((log) => {
                  const isSelected = activeLog?.id === log.id;
                  const isError = String(log.statusCode).startsWith('4') || String(log.statusCode).startsWith('5') || typeof log.statusCode === 'string';
                  
                  return (
                    <button
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className={`w-full text-left p-2.5 transition-none block ${
                        isSelected
                          ? 'bg-slate-800 text-slate-100 border-l-2 border-steel-400'
                          : 'hover:bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-[11px] px-1 bg-slate-950 text-steel-400 border border-slate-800">
                          {log.method}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-semibold ${isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {log.statusCode}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {log.latencyMs}ms
                          </span>
                        </div>
                      </div>
                      <div className="truncate text-[11px] text-slate-300 font-mono" title={log.url}>
                        {log.url}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Payload & Diagnostic Details Column */}
              <div className="lg:col-span-8 border border-slate-800 bg-slate-900/90 p-3 flex flex-col justify-between">
                {activeLog ? (
                  <div>
                    {/* Header info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2 mb-2 border-b border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Method / Protocol:</span>
                        <span className="font-bold text-steel-300">{activeLog.method}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Status Code:</span>
                        <StatusBadge status={String(activeLog.statusCode)} text={`${activeLog.statusCode} ${activeLog.statusText || ''}`} />
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Latency:</span>
                        <span className="font-bold text-slate-200">{activeLog.latencyMs} ms</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Timestamp:</span>
                        <span className="text-slate-300">{new Date(activeLog.timestamp).toISOString()}</span>
                      </div>
                    </div>

                    {/* URL */}
                    <div className="mb-2">
                      <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Target Request URL:</span>
                      <div className="p-1.5 bg-slate-950 border border-slate-800 text-steel-200 break-all select-all text-xs">
                        {activeLog.url}
                      </div>
                    </div>

                    {/* Error Notice */}
                    {activeLog.error && (
                      <div className="mb-2 p-2 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                        <div className="font-bold uppercase tracking-wider text-[10px] mb-0.5">Diagnostic Error:</div>
                        {activeLog.error}
                      </div>
                    )}

                    {/* Request Payload (if any) */}
                    {activeLog.requestPayload && (
                      <div className="mb-2">
                        <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Request Payload:</span>
                        <pre className="p-2 bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto text-[11px] max-h-32">
                          {JSON.stringify(activeLog.requestPayload, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Response Payload */}
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-slate-400 uppercase">Raw Response Body / Payload:</span>
                        <button
                          onClick={() => handleCopy(activeLog.responsePayload)}
                          className="flex items-center gap-1 text-[10px] text-steel-400 hover:text-steel-300"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copied ? 'Tersalin' : 'Salin JSON'}
                        </button>
                      </div>
                      <pre className="p-2 bg-slate-950 border border-slate-800 text-slate-200 overflow-x-auto text-[11px] max-h-56 select-all font-mono">
                        {activeLog.responsePayload
                          ? typeof activeLog.responsePayload === 'object'
                            ? JSON.stringify(activeLog.responsePayload, null, 2)
                            : String(activeLog.responsePayload)
                          : 'Tidak ada respons body (kosong atau koneksi terputus).'}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-8">
                    Pilih permintaan dari daftar di sebelah kiri untuk melihat detail payload dan headers.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

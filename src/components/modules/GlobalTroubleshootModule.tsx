import React, { useState } from 'react';
import { Terminal, Copy, Check, Trash2, Filter, Download, Server, AlertTriangle } from 'lucide-react';
import { useTroubleshooting } from '../../context/TroubleshootingContext';
import { StatusBadge } from '../common/StatusBadge';

export const GlobalTroubleshootModule: React.FC = () => {
  const { logs, clearLogs } = useTroubleshooting();
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const modules = ['ALL', 'ClusterHealth', 'IoTTelemetry', 'MapTracking', 'OrderPipeline', 'StoragePOD', 'MediaStreaming', 'PredictiveAnalytics', 'Observability'];

  const filteredLogs = logs.filter((l) => {
    if (filterModule === 'ALL') return true;
    return l.module === filterModule;
  });

  const activeLog = (selectedLogId ? logs.find((l) => l.id === selectedLogId) : filteredLogs[0]) || null;

  const handleCopy = (data: any) => {
    const text = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-logistics-audit-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-steel-400" />
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                Konsol Audit Global &amp; Log Diagnostik AWS
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Pusat inspeksi lalu lintas API, status probe backend, latensi jaringan, serta respon payload dari seluruh 8 modul operasional.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 border border-slate-700 transition-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit JSON</span>
            </button>
            <button
              onClick={() => clearLogs()}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-950 hover:bg-rose-900 disabled:bg-slate-900 text-rose-300 border border-rose-800 transition-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Seluruh Log</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400 text-[10px] uppercase shrink-0">Filter Modul:</span>
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setFilterModule(m)}
              className={`px-2 py-0.5 text-[11px] border transition-none shrink-0 ${
                filterModule === m
                  ? 'bg-steel-700 text-white border-steel-500 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Log List */}
        <div className="lg:col-span-5 border border-slate-800 bg-slate-900 overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center justify-between">
            <span>Daftar Permintaan Jaringan</span>
            <span className="text-slate-400 text-[10px]">{filteredLogs.length} Entri</span>
          </div>

          <div className="flex-1 max-h-[600px] overflow-y-auto divide-y divide-slate-800">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Tidak ada entri log yang cocok dengan filter.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = activeLog?.id === log.id;
                const isError = String(log.statusCode).startsWith('4') || String(log.statusCode).startsWith('5') || typeof log.statusCode === 'string';

                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`w-full text-left p-2.5 transition-none block ${
                      isSelected
                        ? 'bg-slate-800 text-slate-100 border-l-2 border-steel-400'
                        : 'hover:bg-slate-850 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold px-1 bg-slate-950 text-steel-400 text-[10px] border border-slate-800">
                          {log.method}
                        </span>
                        <span className="text-[10px] text-slate-300 font-semibold">{log.module}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold ${isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {log.statusCode}
                        </span>
                        <span className="text-[10px] text-slate-400">{log.latencyMs}ms</span>
                      </div>
                    </div>
                    <div className="truncate text-[11px] text-slate-300" title={log.url}>
                      {log.url}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Log Inspector */}
        <div className="lg:col-span-7 border border-slate-800 bg-slate-900 p-4">
          <div className="border-b border-slate-800 pb-2 mb-3 flex items-center justify-between">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Detail Inspeksi Paket HTTP &amp; Telemetri
            </span>
            {activeLog && (
              <button
                onClick={() => handleCopy(activeLog)}
                className="flex items-center gap-1 text-[11px] text-steel-400 hover:text-steel-300"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
              </button>
            )}
          </div>

          {activeLog ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pb-2 border-b border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Modul:</span>
                  <span className="font-bold text-steel-300">{activeLog.module}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Method:</span>
                  <span className="font-bold text-slate-200">{activeLog.method}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Status Code:</span>
                  <StatusBadge status={String(activeLog.statusCode)} text={`${activeLog.statusCode} ${activeLog.statusText || ''}`} />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Latency:</span>
                  <span className="font-bold text-slate-200">{activeLog.latencyMs} ms</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Target Endpoint URL:</span>
                <div className="p-2 bg-slate-950 border border-slate-800 text-steel-200 break-all select-all text-xs">
                  {activeLog.url}
                </div>
              </div>

              {activeLog.error && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                  <div className="font-bold uppercase text-[10px] mb-0.5">Status Kegagalan Teknis:</div>
                  {activeLog.error}
                </div>
              )}

              {activeLog.requestPayload && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Payload Permintaan (Request Body):</span>
                  <pre className="p-2.5 bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto text-[11px] max-h-40">
                    {JSON.stringify(activeLog.requestPayload, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Raw Response Body / Error Payload:</span>
                <pre className="p-3 bg-slate-950 border border-slate-800 text-slate-200 overflow-x-auto text-[11px] max-h-72 font-mono select-all">
                  {activeLog.responsePayload
                    ? typeof activeLog.responsePayload === 'object'
                      ? JSON.stringify(activeLog.responsePayload, null, 2)
                      : String(activeLog.responsePayload)
                    : 'Tidak ada body payload.'}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              Pilih salah satu log di panel kiri untuk memeriksa detail transmisi data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

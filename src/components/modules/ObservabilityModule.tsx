import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Bell, RefreshCw, Cpu, Activity, AlertOctagon, TrendingUp } from 'lucide-react';
import { AppConfig, CloudWatchMetricItem, CloudWatchAlarmItem, AWSBudgetData } from '../../types';
import { executeDiagnosticRequest } from '../../services/httpClient';
import { useTroubleshooting } from '../../context/TroubleshootingContext';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { TroubleshootingDrawer } from '../common/TroubleshootingDrawer';

interface ObservabilityModuleProps {
  config: AppConfig;
}

export const ObservabilityModule: React.FC<ObservabilityModuleProps> = ({ config }) => {
  const { addLog, getModuleLogs, clearLogs } = useTroubleshooting();

  // Metrics state
  const [metrics, setMetrics] = useState<CloudWatchMetricItem[]>([]);
  const [alarms, setAlarms] = useState<CloudWatchAlarmItem[]>([]);
  const [budget, setBudget] = useState<AWSBudgetData | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  useEffect(() => {
    fetchObservabilityData();
  }, []);

  const fetchObservabilityData = async () => {
    setIsLoading(true);
    setMetricsError(null);
    setBudgetError(null);

    // 1. Fetch CloudWatch Metrics
    const metricsResponse = await executeDiagnosticRequest<CloudWatchMetricItem[]>(
      config.cloudwatchMetricsEndpoint,
      {
        method: 'GET',
        moduleName: 'Observability',
        timeoutMs: 8000,
        logCallback: addLog,
      }
    );

    if (metricsResponse.success && Array.isArray(metricsResponse.data)) {
      setMetrics(metricsResponse.data);
    } else {
      setMetricsError(metricsResponse.error || 'Endpoint CloudWatch Metrics tidak merespons.');
      setMetrics([]);
    }

    // 2. Fetch CloudWatch Alarms
    const alarmsResponse = await executeDiagnosticRequest<CloudWatchAlarmItem[]>(
      config.cloudwatchAlarmsEndpoint,
      {
        method: 'GET',
        moduleName: 'Observability',
        timeoutMs: 8000,
        logCallback: addLog,
      }
    );

    if (alarmsResponse.success && Array.isArray(alarmsResponse.data)) {
      setAlarms(alarmsResponse.data);
    } else {
      setAlarms([]);
    }

    // 3. Fetch AWS Budgets
    const budgetResponse = await executeDiagnosticRequest<AWSBudgetData>(
      config.awsBudgetsEndpoint,
      {
        method: 'GET',
        moduleName: 'Observability',
        timeoutMs: 8000,
        logCallback: addLog,
      }
    );

    if (budgetResponse.success && budgetResponse.data) {
      setBudget(budgetResponse.data);
    } else {
      setBudgetError(budgetResponse.error || 'Endpoint AWS Budgets API tidak merespons.');
      setBudget(null);
    }

    setIsLoading(false);
  };

  const moduleLogs = getModuleLogs('Observability');

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-steel-400" />
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                Modul 8: Observability & Cloud Budgets (Governance & Cost)
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Metrik operasional infrastruktur komputasi CloudWatch dan kontrol batas pengeluaran anggaran AWS Budgets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchObservabilityData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-steel-700 hover:bg-steel-600 disabled:bg-slate-800 text-white border border-steel-500 transition-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Mengambil Data...' : 'Sinkronkan Metrik & Anggaran'}</span>
            </button>
          </div>
        </div>

        {/* Quick Governance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800">
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">CloudWatch Metrics Endpoint</span>
            <span className="text-xs font-bold text-steel-300 truncate block" title={config.cloudwatchMetricsEndpoint}>
              {config.cloudwatchMetricsEndpoint || '(Belum diatur)'}
            </span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">AWS Budgets Endpoint</span>
            <span className="text-xs text-slate-300 truncate block" title={config.awsBudgetsEndpoint}>
              {config.awsBudgetsEndpoint || '(Belum diatur)'}
            </span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Metrik Aktif</span>
            <span className="text-sm font-bold text-slate-200">{metrics.length} Metrik</span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Alarm Terpicu</span>
            <span className="text-sm font-bold text-rose-400">
              {alarms.filter((a) => a.stateValue === 'ALARM').length} Alarm
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Metrics, Alarms, Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CloudWatch Metrics Table */}
        <div className="lg:col-span-8 border border-slate-800 bg-slate-900 flex flex-col">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-steel-400" />
              <span>Metrik Beban Infrastruktur (Amazon CloudWatch)</span>
            </span>
            <span className="text-[10px] text-slate-400">Interval: 60 Detik</span>
          </div>

          <div className="p-4 flex-1">
            {metrics.length === 0 ? (
              <EmptyState
                title="Tidak ada data metrik"
                description="Endpoint CloudWatch belum merespons atau tidak ada metrik instans yang aktif saat ini."
                endpoint={config.cloudwatchMetricsEndpoint}
                status={metricsError ? 'ERROR' : 'EMPTY'}
                errorMessage={metricsError || undefined}
                onRetry={fetchObservabilityData}
                isLoading={isLoading}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metrics.map((m, idx) => (
                  <div key={`${m.metricName}-${idx}`} className="p-3 bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-steel-300 text-xs">{m.metricName}</span>
                      <StatusBadge status={m.status} size="sm" />
                    </div>
                    <div className="text-[10px] text-slate-400 mb-2">Namespace: {m.namespace}</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-slate-100">{m.currentValue.toFixed(1)}</span>
                      <span className="text-slate-400 text-xs">{m.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AWS Budgets & Cost Governance */}
        <div className="lg:col-span-4 border border-slate-800 bg-slate-900 flex flex-col">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-steel-400" />
              <span>AWS Budgets &amp; Biaya</span>
            </span>
            <span className="text-[10px] text-slate-400">Bulanan</span>
          </div>

          <div className="p-4 flex-1">
            {budget ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Nama Anggaran</div>
                  <div className="text-sm font-bold text-slate-200">{budget.budgetName}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Batas Limit</div>
                    <div className="text-sm font-bold text-steel-300">
                      ${budget.budgetLimit.toFixed(2)} {budget.unit}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Biaya Riil Saat Ini</div>
                    <div className="text-sm font-bold text-emerald-400">
                      ${budget.actualSpend.toFixed(2)} {budget.unit}
                    </div>
                  </div>
                </div>

                {/* Flat Progress Bar */}
                <div className="p-3 bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Penggunaan Kuota Anggaran:</span>
                    <span className="font-bold text-slate-200">{budget.percentageUsed.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 border border-slate-700">
                    <div
                      className={`h-full ${budget.percentageUsed > 90 ? 'bg-rose-600' : 'bg-steel-600'}`}
                      style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Estimasi Akhir Bulan: ${budget.forecastedSpend.toFixed(2)}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Tidak ada data anggaran"
                description="Endpoint AWS Budgets belum dikonfigurasi atau tidak ada data biaya yang diterima."
                endpoint={config.awsBudgetsEndpoint}
                status={budgetError ? 'ERROR' : 'EMPTY'}
                errorMessage={budgetError || undefined}
                onRetry={fetchObservabilityData}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>

      {/* CloudWatch Alarms Table */}
      <div className="border border-slate-800 bg-slate-900">
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-steel-400" />
            <span>Daftar Alarm &amp; Peringatan (CloudWatch Alarms)</span>
          </span>
          <span className="text-[10px] text-slate-400">Evaluasi Otomatis</span>
        </div>

        <div className="overflow-x-auto">
          {alarms.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="Tidak ada alarm terkonfigurasi"
                description="Tidak ada alarm CloudWatch yang diterima dari endpoint backend."
                endpoint={config.cloudwatchAlarmsEndpoint}
                onRetry={fetchObservabilityData}
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                  <th className="p-3">Nama Alarm</th>
                  <th className="p-3">Metrik Terkait</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Ambang Batas (Threshold)</th>
                  <th className="p-3">Alasan Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {alarms.map((a) => (
                  <tr key={a.alarmName} className="hover:bg-slate-850/50">
                    <td className="p-3 font-bold text-steel-300">{a.alarmName}</td>
                    <td className="p-3 text-slate-200">{a.metricName}</td>
                    <td className="p-3"><StatusBadge status={a.stateValue} /></td>
                    <td className="p-3 text-slate-300">{a.threshold}</td>
                    <td className="p-3 text-slate-400 text-[11px] truncate max-w-sm">{a.stateReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Troubleshooting Drawer */}
      <TroubleshootingDrawer
        logs={moduleLogs}
        moduleName="Observability"
        onClear={() => clearLogs('Observability')}
      />
    </div>
  );
};

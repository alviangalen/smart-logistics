import React, { useState, useEffect, useCallback } from 'react';
import { Server, RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { AppConfig, ClusterNodeHealth, ClusterNodeType } from '../../types';
import { executeDiagnosticRequest } from '../../services/httpClient';
import { useTroubleshooting } from '../../context/TroubleshootingContext';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { TroubleshootingDrawer } from '../common/TroubleshootingDrawer';

interface ClusterHealthModuleProps {
  config: AppConfig;
}

export const ClusterHealthModule: React.FC<ClusterHealthModuleProps> = ({ config }) => {
  const { addLog, getModuleLogs, clearLogs } = useTroubleshooting();
  const [nodes, setNodes] = useState<ClusterNodeHealth[]>([]);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [checkingNode, setCheckingNode] = useState<string | null>(null);

  const initialNodeDefinitions = useCallback((): ClusterNodeHealth[] => [
    {
      serviceName: 'EC2',
      clusterOrInstanceName: 'Ingestion-Worker-EC2',
      targetEndpoint: config.ec2HealthEndpoint,
      status: config.ec2HealthEndpoint ? 'PENDING' : 'NOT_CONFIGURED',
      httpStatus: null,
      latencyMs: null,
    },
    {
      serviceName: 'ASG',
      clusterOrInstanceName: 'Fleet-Telemetry-ASG',
      targetEndpoint: config.asgHealthEndpoint,
      status: config.asgHealthEndpoint ? 'PENDING' : 'NOT_CONFIGURED',
      httpStatus: null,
      latencyMs: null,
    },
    {
      serviceName: 'ECS',
      clusterOrInstanceName: 'Logistics-API-ECS (Node.js)',
      targetEndpoint: config.ecsHealthEndpoint,
      status: config.ecsHealthEndpoint ? 'PENDING' : 'NOT_CONFIGURED',
      httpStatus: null,
      latencyMs: null,
    },
    {
      serviceName: 'EKS',
      clusterOrInstanceName: 'Route-Processor-EKS (Golang)',
      targetEndpoint: config.eksHealthEndpoint,
      status: config.eksHealthEndpoint ? 'PENDING' : 'NOT_CONFIGURED',
      httpStatus: null,
      latencyMs: null,
    },
  ], [config.ec2HealthEndpoint, config.asgHealthEndpoint, config.ecsHealthEndpoint, config.eksHealthEndpoint]);

  useEffect(() => {
    setNodes(initialNodeDefinitions());
  }, [initialNodeDefinitions]);

  const checkSingleNode = async (serviceName: ClusterNodeType) => {
    setCheckingNode(serviceName);
    const node = nodes.find((n) => n.serviceName === serviceName);
    if (!node) return;

    if (!node.targetEndpoint) {
      setNodes((prev) =>
        prev.map((n) =>
          n.serviceName === serviceName
            ? { ...n, status: 'NOT_CONFIGURED', errorMessage: 'Endpoint belum dikonfigurasi di .env' }
            : n
        )
      );
      setCheckingNode(null);
      return;
    }

    const response = await executeDiagnosticRequest(node.targetEndpoint, {
      method: 'GET',
      moduleName: 'ClusterHealth',
      timeoutMs: 8000,
      logCallback: addLog,
    });

    setNodes((prev) =>
      prev.map((n) => {
        if (n.serviceName !== serviceName) return n;

        const isOk = response.success;
        const uptime = response.data?.uptime || response.data?.uptimeSeconds || (isOk ? 'Running' : undefined);
        const region = response.data?.region || config.region;

        return {
          ...n,
          status: isOk ? 'HEALTHY' : 'UNHEALTHY',
          httpStatus: typeof response.status === 'number' ? response.status : null,
          latencyMs: response.latencyMs,
          uptime: uptime ? String(uptime) : undefined,
          region,
          lastChecked: new Date().toISOString(),
          rawResponse: response.rawPayload,
          errorMessage: response.error,
        };
      })
    );

    setCheckingNode(null);
  };

  const checkAllNodes = async () => {
    setIsCheckingAll(true);
    for (const node of nodes) {
      await checkSingleNode(node.serviceName);
    }
    setIsCheckingAll(false);
  };

  const moduleLogs = getModuleLogs('ClusterHealth');
  const healthyCount = nodes.filter((n) => n.status === 'HEALTHY').length;
  const configuredCount = nodes.filter((n) => n.targetEndpoint).length;

  return (
    <div className="space-y-4">
      {/* Top Banner & Technical Specs */}
      <div className="border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-steel-400" />
              <h2 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wider">
                Modul 1: Ingestion & Cluster Health (Compute & Containers)
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Pemantauan dan pengujian endpoint status instans EC2, Auto Scaling Group, klaster ECS (Node.js), dan klaster EKS (Golang).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={checkAllNodes}
              disabled={isCheckingAll}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-steel-700 hover:bg-steel-600 disabled:bg-slate-800 text-white font-mono text-xs border border-steel-500 transition-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingAll ? 'animate-spin' : ''}`} />
              <span>{isCheckingAll ? 'Memeriksa Klaster...' : 'Jalankan Health Check Semua Node'}</span>
            </button>
          </div>
        </div>

        {/* Quick Technical KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800 font-mono text-xs">
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Target Layanan Terkonfigurasi</span>
            <span className="text-sm font-bold text-slate-200">{configuredCount} / 4 Node</span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Node Sehat (Healthy)</span>
            <span className="text-sm font-bold text-emerald-400">{healthyCount} Node</span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Target Region AWS</span>
            <span className="text-sm font-bold text-steel-300">{config.region}</span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Pemeriksaan Terakhir</span>
            <span className="text-xs text-slate-300">
              {nodes.some((n) => n.lastChecked) ? new Date().toLocaleTimeString() : 'Belum dijalankan'}
            </span>
          </div>
        </div>
      </div>

      {/* Cluster Table Grid */}
      <div className="border border-slate-800 bg-slate-900 overflow-hidden font-mono text-xs">
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-xs">
            Daftar Klaster & Instans Komputasi AWS
          </span>
          <span className="text-[11px] text-slate-400">
            Protokol: HTTP/HTTPS GET Health Probe
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="p-3">Layanan</th>
                <th className="p-3">Nama Klaster / Instans</th>
                <th className="p-3">Target Endpoint URL</th>
                <th className="p-3">Status</th>
                <th className="p-3">HTTP Code</th>
                <th className="p-3">Latency</th>
                <th className="p-3">Uptime</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {nodes.map((node) => {
                const isChecking = checkingNode === node.serviceName;

                return (
                  <tr key={node.serviceName} className="hover:bg-slate-850/50">
                    <td className="p-3 font-bold text-steel-300">
                      {node.serviceName}
                    </td>
                    <td className="p-3 text-slate-200">
                      {node.clusterOrInstanceName}
                    </td>
                    <td className="p-3 max-w-xs truncate text-slate-400 font-mono text-[11px]" title={node.targetEndpoint}>
                      {node.targetEndpoint || (
                        <span className="text-slate-400 italic">Endpoint belum diatur</span>
                      )}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={node.status} />
                    </td>
                    <td className="p-3">
                      {node.httpStatus !== null ? (
                        <span className={node.httpStatus === 200 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {node.httpStatus}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {node.latencyMs !== null ? (
                        <span className="text-slate-300">{node.latencyMs} ms</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">
                      {node.uptime || '-'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => checkSingleNode(node.serviceName)}
                        disabled={isChecking || !node.targetEndpoint}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-400 text-slate-200 border border-slate-700 font-mono text-[11px] transition-none"
                      >
                        {isChecking ? 'Menguji...' : 'Uji Probe'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Troubleshooting Drawer at bottom */}
      <TroubleshootingDrawer
        logs={moduleLogs}
        moduleName="ClusterHealth"
        onClear={() => clearLogs('ClusterHealth')}
      />
    </div>
  );
};

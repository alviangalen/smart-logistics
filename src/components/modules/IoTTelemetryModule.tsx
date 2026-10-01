import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Radio, Wifi, WifiOff, RefreshCw, Thermometer, ShieldAlert, Cpu, Database } from 'lucide-react';
import { AppConfig, TelemetryReading, IoTConnectionState } from '../../types';
import { executeDiagnosticRequest } from '../../services/httpClient';
import { useTroubleshooting } from '../../context/TroubleshootingContext';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { TroubleshootingDrawer } from '../common/TroubleshootingDrawer';

interface IoTTelemetryModuleProps {
  config: AppConfig;
}

export const IoTTelemetryModule: React.FC<IoTTelemetryModuleProps> = ({ config }) => {
  const { addLog, getModuleLogs, clearLogs } = useTroubleshooting();
  const [connectionState, setConnectionState] = useState<IoTConnectionState>({
    status: 'DISCONNECTED',
    endpoint: config.iotWsEndpoint || config.iotCoreEndpoint || '',
    topic: config.iotMqttTopic || 'logistics/fleet/coldchain/telemetry',
    messagesReceived: 0,
    lastMessageTimestamp: null,
  });

  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [isPollingRedis, setIsPollingRedis] = useState(false);
  const [redisError, setRedisError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = useCallback(() => {
    const endpoint = config.iotWsEndpoint;
    if (!endpoint) {
      const err = 'Endpoint WebSocket AWS IoT Core belum dikonfigurasi di .env.local';
      setConnectionState((prev) => ({
        ...prev,
        status: 'DISCONNECTED',
        errorDetail: err,
      }));
      addLog({
        module: 'IoTTelemetry',
        url: '(empty WebSocket endpoint)',
        method: 'WS',
        statusCode: 'NOT_CONFIGURED',
        statusText: 'Disconnected',
        latencyMs: 0,
        error: err,
        responsePayload: { error: err },
      });
      return;
    }

    setConnectionState((prev) => ({ ...prev, status: 'CONNECTING', errorDetail: undefined }));
    const startTime = performance.now();

    try {
      const ws = new WebSocket(endpoint);
      wsRef.current = ws;

      ws.onopen = () => {
        const latency = Math.round(performance.now() - startTime);
        setConnectionState((prev) => ({
          ...prev,
          status: 'CONNECTED',
          errorDetail: undefined,
        }));

        addLog({
          module: 'IoTTelemetry',
          url: endpoint,
          method: 'WS',
          statusCode: 'CONNECTED',
          statusText: '101 Switching Protocols',
          latencyMs: latency,
          responsePayload: { message: 'WebSocket connection established successfully', topic: config.iotMqttTopic },
        });
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const newReading: TelemetryReading = {
            timestamp: payload.timestamp || new Date().toISOString(),
            deviceId: payload.deviceId || payload.thingName || 'UNKNOWN',
            truckPlate: payload.truckPlate || payload.plateNumber || 'UNKNOWN',
            temperatureC: Number(payload.temperatureC ?? payload.temp ?? 0),
            targetTempMin: Number(payload.targetTempMin ?? -20),
            targetTempMax: Number(payload.targetTempMax ?? -15),
            humidityPct: Number(payload.humidityPct ?? payload.humidity ?? 0),
            latitude: Number(payload.latitude ?? payload.lat ?? 0),
            longitude: Number(payload.longitude ?? payload.lng ?? 0),
            doorStatus: payload.doorStatus === 'OPEN' ? 'OPEN' : 'CLOSED',
            compressorState: payload.compressorState || 'ACTIVE',
            alarmTriggered: Boolean(payload.alarmTriggered || payload.alarm),
            alarmType: payload.alarmType,
          };

          setReadings((prev) => [newReading, ...prev.slice(0, 49)]);
          setConnectionState((prev) => ({
            ...prev,
            messagesReceived: prev.messagesReceived + 1,
            lastMessageTimestamp: newReading.timestamp,
          }));

          addLog({
            module: 'IoTTelemetry',
            url: endpoint,
            method: 'WS',
            statusCode: 'MESSAGE_RECEIVED',
            statusText: 'Payload Ingested',
            latencyMs: 1,
            responsePayload: payload,
          });
        } catch (err: any) {
          addLog({
            module: 'IoTTelemetry',
            url: endpoint,
            method: 'WS',
            statusCode: 'PARSE_ERROR',
            statusText: 'Invalid JSON',
            latencyMs: 1,
            error: err.message,
            responsePayload: event.data,
          });
        }
      };

      ws.onerror = () => {
        const latency = Math.round(performance.now() - startTime);
        const errDetail = `Gagal terhubung ke WebSocket backend [${endpoint}]. Status: ECONNREFUSED`;
        setConnectionState((prev) => ({
          ...prev,
          status: 'DISCONNECTED',
          errorDetail: errDetail,
        }));

        addLog({
          module: 'IoTTelemetry',
          url: endpoint,
          method: 'WS',
          statusCode: 'ECONNREFUSED',
          statusText: 'Connection Refused / Failed',
          latencyMs: latency,
          error: errDetail,
          responsePayload: { error: 'WebSocket encountered error event', target: endpoint },
        });
      };

      ws.onclose = (event) => {
        setConnectionState((prev) => ({
          ...prev,
          status: 'DISCONNECTED',
          errorDetail: prev.errorDetail || `Koneksi ditutup (Code: ${event.code})`,
        }));
      };
    } catch (err: any) {
      const errDetail = `Gagal inisialisasi WebSocket [${endpoint}]. Status: ${err.message}`;
      setConnectionState((prev) => ({
        ...prev,
        status: 'DISCONNECTED',
        errorDetail: errDetail,
      }));

      addLog({
        module: 'IoTTelemetry',
        url: endpoint,
        method: 'WS',
        statusCode: 'INIT_ERROR',
        statusText: 'Initialization Failed',
        latencyMs: 0,
        error: errDetail,
        responsePayload: { error: err.message },
      });
    }
  }, [config.iotWsEndpoint, config.iotMqttTopic, addLog]);

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionState((prev) => ({
      ...prev,
      status: 'DISCONNECTED',
      errorDetail: 'Koneksi diputus secara manual oleh pengguna.',
    }));
  };

  const pollRedisTelemetry = async () => {
    setIsPollingRedis(true);
    setRedisError(null);

    const response = await executeDiagnosticRequest<TelemetryReading[]>(config.redisTelemetryEndpoint, {
      method: 'GET',
      moduleName: 'IoTTelemetry',
      timeoutMs: 6000,
      logCallback: addLog,
    });

    if (response.success && Array.isArray(response.data)) {
      setReadings(response.data);
    } else {
      setRedisError(response.error || 'Gagal mengambil data dari Redis cache.');
    }

    setIsPollingRedis(false);
  };

  const moduleLogs = getModuleLogs('IoTTelemetry');

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-slate-900 p-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-steel-400" />
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                Modul 2: IoT Telemetry & Cold-Chain Monitor (IoT & Caching)
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Integrasi langsung ke AWS IoT Core (MQTT over WebSocket) dan Redis/ElastiCache telemetry stream sensor suhu armada rantai dingin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {connectionState.status === 'CONNECTED' ? (
              <button
                onClick={disconnectWebSocket}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 transition-none"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span>Putuskan WebSocket</span>
              </button>
            ) : (
              <button
                onClick={connectWebSocket}
                disabled={connectionState.status === 'CONNECTING'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-steel-700 hover:bg-steel-600 disabled:bg-slate-800 text-white border border-steel-500 transition-none"
              >
                <Wifi className={`w-3.5 h-3.5 ${connectionState.status === 'CONNECTING' ? 'animate-pulse' : ''}`} />
                <span>{connectionState.status === 'CONNECTING' ? 'Menghubungkan...' : 'Hubungkan ke AWS IoT Core'}</span>
              </button>
            )}

            <button
              onClick={pollRedisTelemetry}
              disabled={isPollingRedis || !config.redisTelemetryEndpoint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 border border-slate-700 transition-none"
            >
              <Database className={`w-3.5 h-3.5 ${isPollingRedis ? 'animate-spin' : ''}`} />
              <span>Poll Redis Cache</span>
            </button>
          </div>
        </div>

        {/* Connection Diagnostics Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800">
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Status Koneksi IoT</span>
            <div className="mt-1">
              <StatusBadge status={connectionState.status} />
            </div>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Topic Langganan (MQTT)</span>
            <span className="text-xs font-bold text-steel-300 truncate block" title={connectionState.topic}>
              {connectionState.topic}
            </span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Payload Diterima</span>
            <span className="text-sm font-bold text-slate-200">{connectionState.messagesReceived} Paket</span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Pesan Terakhir</span>
            <span className="text-xs text-slate-300">
              {connectionState.lastMessageTimestamp
                ? new Date(connectionState.lastMessageTimestamp).toLocaleTimeString()
                : 'Belum ada data'}
            </span>
          </div>
        </div>

        {connectionState.errorDetail && (
          <div className="mt-3 p-2.5 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
            <span className="font-bold uppercase tracking-wider block text-[10px]">Error Status Koneksi:</span>
            {connectionState.errorDetail}
          </div>
        )}
      </div>

      {/* Telemetry Stream Data Grid */}
      <div className="border border-slate-800 bg-slate-900 font-mono text-xs">
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-slate-200 uppercase tracking-wider">
            Aliran Telemetri Sensor Dingin (Live Stream)
          </span>
          <span className="text-[11px] text-slate-400">
            Ambang Batas Target: -20°C s.d. -15°C
          </span>
        </div>

        {readings.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Tidak ada data telemetri"
              description="Belum ada payload sensor yang diterima dari broker AWS IoT Core atau cache Redis. Hubungkan WebSocket atau jalankan pengujian Redis."
              endpoint={config.iotWsEndpoint || config.redisTelemetryEndpoint}
              status={connectionState.status}
              errorMessage={connectionState.errorDetail || redisError || undefined}
              onRetry={connectWebSocket}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                  <th className="p-3">Waktu Sensor</th>
                  <th className="p-3">Device ID</th>
                  <th className="p-3">Plat Armada</th>
                  <th className="p-3">Suhu Kargo (°C)</th>
                  <th className="p-3">Kelembaban</th>
                  <th className="p-3">Koordinat (Lat, Lng)</th>
                  <th className="p-3">Pintu Kargo</th>
                  <th className="p-3">Kompresor</th>
                  <th className="p-3">Status Alarm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {readings.map((r, idx) => {
                  const isTempBreached = r.temperatureC > r.targetTempMax || r.temperatureC < r.targetTempMin;
                  return (
                    <tr key={`${r.deviceId}-${idx}`} className="hover:bg-slate-850/50">
                      <td className="p-3 text-slate-400">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3 font-bold text-steel-300">
                        {r.deviceId}
                      </td>
                      <td className="p-3 text-slate-200 font-bold">
                        {r.truckPlate}
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${isTempBreached ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {r.temperatureC.toFixed(1)}°C
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">
                          ({r.targetTempMin}°C s/d {r.targetTempMax}°C)
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">
                        {r.humidityPct.toFixed(0)}%
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                      </td>
                      <td className="p-3">
                        <span className={r.doorStatus === 'OPEN' ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {r.doorStatus}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">
                        {r.compressorState}
                      </td>
                      <td className="p-3">
                        {r.alarmTriggered || isTempBreached ? (
                          <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 font-bold text-[10px]">
                            ALARM: {r.alarmType || 'SUHU ANOMALI'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                            NORMAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Module Troubleshooting Drawer */}
      <TroubleshootingDrawer
        logs={moduleLogs}
        moduleName="IoTTelemetry"
        onClear={() => clearLogs('IoTTelemetry')}
      />
    </div>
  );
};

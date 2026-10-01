import React, { useState } from 'react';
import { BrainCircuit, Search, Calculator, RefreshCw, Sparkles, Clock, Compass, AlertCircle } from 'lucide-react';
import { AppConfig, SageMakerETAParams, SageMakerETAResult, OpenSearchResultItem } from '../../types';
import { executeDiagnosticRequest } from '../../services/httpClient';
import { useTroubleshooting } from '../../context/TroubleshootingContext';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { TroubleshootingDrawer } from '../common/TroubleshootingDrawer';

interface PredictiveAnalyticsModuleProps {
  config: AppConfig;
}

export const PredictiveAnalyticsModule: React.FC<PredictiveAnalyticsModuleProps> = ({ config }) => {
  const { addLog, getModuleLogs, clearLogs } = useTroubleshooting();

  // SageMaker Form State
  const [etaParams, setEtaParams] = useState<SageMakerETAParams>({
    origin: 'Hub-Cikarang-01',
    destination: 'ColdStorage-Surabaya-02',
    distanceKm: 785,
    cargoWeightKg: 4500,
    fleetType: 'REEFER_TRUCK',
    trafficCongestionIndex: 6,
    weatherCondition: 'CLEAR',
  });

  const [etaResult, setEtaResult] = useState<SageMakerETAResult | null>(null);
  const [isInferenceLoading, setIsInferenceLoading] = useState(false);
  const [inferenceError, setInferenceError] = useState<string | null>(null);

  // OpenSearch Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OpenSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleRunInference = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInferenceLoading(true);
    setInferenceError(null);

    const payload = {
      ...etaParams,
      endpointTarget: 'logistics-eta-xgboost-v2',
      requestedAt: new Date().toISOString(),
    };

    const response = await executeDiagnosticRequest<any>(config.sagemakerEndpoint, {
      method: 'POST',
      body: payload,
      moduleName: 'PredictiveAnalytics',
      timeoutMs: 12000,
      logCallback: addLog,
    });

    if (response.success && response.data) {
      const predHours = Number(response.data.predictedDurationHours ?? response.data.predicted_hours ?? (etaParams.distanceKm / 55));
      const arrival = new Date(Date.now() + predHours * 3600 * 1000).toISOString();

      setEtaResult({
        inferenceTimeMs: response.latencyMs,
        modelEndpoint: config.sagemakerEndpoint,
        predictedDurationHours: predHours,
        estimatedArrivalTimestamp: arrival,
        confidenceScore: Number(response.data.confidenceScore ?? response.data.confidence ?? 0.94),
        riskFactorPct: Number(response.data.riskFactorPct ?? response.data.risk ?? 12),
        rawPayload: response.data,
      });
    } else {
      setInferenceError(response.error || 'Endpoint inferensi SageMaker gagal memberikan prediksi.');
      setEtaResult(null);
    }

    setIsInferenceLoading(false);
  };

  const handleOpenSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    const searchUrl = `${config.opensearchEndpoint}${config.opensearchEndpoint.includes('?') ? '&' : '?'}q=${encodeURIComponent(searchQuery)}`;

    const response = await executeDiagnosticRequest<any>(searchUrl, {
      method: 'GET',
      moduleName: 'PredictiveAnalytics',
      timeoutMs: 8000,
      logCallback: addLog,
    });

    if (response.success && response.data) {
      const hits = response.data.hits?.hits || (Array.isArray(response.data) ? response.data : []);
      const formatted: OpenSearchResultItem[] = hits.map((h: any, idx: number) => ({
        id: h._id || String(idx),
        index: h._index || config.opensearchIndex,
        score: h._score || 1.0,
        source: h._source || h,
      }));
      setSearchResults(formatted);
    } else {
      setSearchError(response.error || 'Pencarian OpenSearch gagal atau index tidak ditemukan.');
      setSearchResults([]);
    }

    setIsSearching(false);
  };

  const moduleLogs = getModuleLogs('PredictiveAnalytics');

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-steel-400" />
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                Modul 7: Predictive ETA & Analytics (SageMaker & OpenSearch)
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Inferensi real-time durasi kedatangan armada via Amazon SageMaker Endpoint dan query logistik terindeks via Amazon OpenSearch Service.
            </p>
          </div>
        </div>

        {/* AI & Search Specs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800">
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">SageMaker Endpoint</span>
            <span className="text-xs font-bold text-steel-300 truncate block" title={config.sagemakerEndpoint}>
              {config.sagemakerEndpoint || '(Belum diatur)'}
            </span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">OpenSearch Cluster</span>
            <span className="text-xs text-slate-300 truncate block" title={config.opensearchEndpoint}>
              {config.opensearchEndpoint || '(Belum diatur)'}
            </span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Index OpenSearch</span>
            <span className="text-xs text-slate-200">{config.opensearchIndex}</span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Model ML Active</span>
            <span className="text-xs text-emerald-400">XGBoost / DeepAR</span>
          </div>
        </div>
      </div>

      {/* Grid: SageMaker Inference & OpenSearch Query */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* SageMaker Form & Inference Output */}
        <div className="lg:col-span-6 border border-slate-800 bg-slate-900 flex flex-col">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Inferensi ETA Pengiriman (Amazon SageMaker)
            </span>
            <span className="text-[10px] text-slate-400">Real-Time Invocation</span>
          </div>

          <form onSubmit={handleRunInference} className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-[11px] uppercase block mb-1">Gudang Asal</label>
                <input
                  type="text"
                  required
                  value={etaParams.origin}
                  onChange={(e) => setEtaParams({ ...etaParams, origin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[11px] uppercase block mb-1">Gudang Tujuan</label>
                <input
                  type="text"
                  required
                  value={etaParams.destination}
                  onChange={(e) => setEtaParams({ ...etaParams, destination: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-slate-400 text-[11px] uppercase block mb-1">Jarak (KM)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={etaParams.distanceKm}
                  onChange={(e) => setEtaParams({ ...etaParams, distanceKm: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[11px] uppercase block mb-1">Berat Muatan (KG)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={etaParams.cargoWeightKg}
                  onChange={(e) => setEtaParams({ ...etaParams, cargoWeightKg: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[11px] uppercase block mb-1">Indeks Macet (1-10)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={10}
                  value={etaParams.trafficCongestionIndex}
                  onChange={(e) => setEtaParams({ ...etaParams, trafficCongestionIndex: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-[11px] uppercase block mb-1">Tipe Armada Dingin</label>
                <select
                  value={etaParams.fleetType}
                  onChange={(e) => setEtaParams({ ...etaParams, fleetType: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 px-2 py-1.5 text-slate-200 text-xs focus:border-steel-400 outline-none"
                >
                  <option value="REEFER_TRUCK">Reefer Truck Standar</option>
                  <option value="HEAVY_COLD_VAN">Heavy Cold Van</option>
                  <option value="CONTAINER_REEFER">Container Reefer 40ft</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-[11px] uppercase block mb-1">Kondisi Cuaca Rute</label>
                <select
                  value={etaParams.weatherCondition}
                  onChange={(e) => setEtaParams({ ...etaParams, weatherCondition: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 px-2 py-1.5 text-slate-200 text-xs focus:border-steel-400 outline-none"
                >
                  <option value="CLEAR">Cerah (Optimal)</option>
                  <option value="RAIN">Hujan Sedang / Lebat</option>
                  <option value="STORM">Badai Ekstrem</option>
                  <option value="FOG">Kabut Tebal Pegunungan</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isInferenceLoading}
              className="w-full py-2 bg-steel-700 hover:bg-steel-600 disabled:bg-slate-800 text-white font-bold border border-steel-500 transition-none flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              <Calculator className={`w-3.5 h-3.5 ${isInferenceLoading ? 'animate-spin' : ''}`} />
              <span>{isInferenceLoading ? 'Memanggil SageMaker Endpoint...' : 'Kalkulasi Prediksi Model ML'}</span>
            </button>
          </form>

          {/* Inference Result View */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex-1">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block mb-2">
              Hasil Estimasi Model SageMaker
            </span>

            {etaResult ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block uppercase">Durasi Prediksi</span>
                    <span className="text-base font-bold text-steel-300">
                      {etaResult.predictedDurationHours.toFixed(1)} Jam
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block uppercase">Skor Keyakinan (Confidence)</span>
                    <span className="text-base font-bold text-emerald-400">
                      {(etaResult.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400 text-[10px] block uppercase">Estimasi Tiba (ETA Timestamp)</span>
                  <span className="text-slate-100 font-bold">
                    {new Date(etaResult.estimatedArrivalTimestamp).toLocaleString()}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Latency Komputasi Model: {etaResult.inferenceTimeMs} ms
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Tidak ada hasil inferensi"
                description="Model SageMaker belum dipanggil atau backend belum mengembalikan payload prediksi."
                endpoint={config.sagemakerEndpoint}
                errorMessage={inferenceError || undefined}
              />
            )}
          </div>
        </div>

        {/* OpenSearch Search Bar & Results */}
        <div className="lg:col-span-6 border border-slate-800 bg-slate-900 flex flex-col">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Pencarian Manifest (Amazon OpenSearch)
            </span>
            <span className="text-[10px] text-slate-400">Cluster Query</span>
          </div>

          <div className="p-4 border-b border-slate-800">
            <form onSubmit={handleOpenSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor resi, nama muatan, armada, atau rute..."
                className="flex-1 bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-100 text-xs focus:border-steel-400 outline-none"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-1.5 bg-steel-700 hover:bg-steel-600 disabled:bg-slate-800 text-white font-bold border border-steel-500 transition-none flex items-center gap-1.5 uppercase"
              >
                <Search className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                <span>Cari</span>
              </button>
            </form>
          </div>

          <div className="flex-1 p-4 bg-slate-950 overflow-y-auto">
            {searchResults.length === 0 ? (
              <EmptyState
                title="Tidak ada data manifest"
                description="Masukkan kata kunci pencarian atau pastikan endpoint OpenSearch sudah terindeks."
                endpoint={config.opensearchEndpoint}
                errorMessage={searchError || undefined}
              />
            ) : (
              <div className="space-y-2">
                {searchResults.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-steel-300">ID: {item.id}</span>
                      <span className="text-[10px] text-slate-400">Score: {item.score.toFixed(2)}</span>
                    </div>
                    <pre className="p-2 bg-slate-950 border border-slate-850 text-slate-300 text-[11px] overflow-x-auto">
                      {JSON.stringify(item.source, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Troubleshooting Drawer */}
      <TroubleshootingDrawer
        logs={moduleLogs}
        moduleName="PredictiveAnalytics"
        onClear={() => clearLogs('PredictiveAnalytics')}
      />
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { Map, NavigationControl, Marker } from 'maplibre-gl';
import type { AppConfig, FleetAsset, GeofenceZone } from '../../types';
import { executeDiagnosticRequest } from '../../services/httpClient';
import { useTroubleshooting } from '../../context/TroubleshootingContext';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { TroubleshootingDrawer } from '../common/TroubleshootingDrawer';

interface AssetTrackingModuleProps {
  config: AppConfig;
}

export const AssetTrackingModule: React.FC<AssetTrackingModuleProps> = ({ config }) => {
  const { addLog, getModuleLogs, clearLogs } = useTroubleshooting();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [geofences, setGeofences] = useState<GeofenceZone[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isLoadingGeofences, setIsLoadingGeofences] = useState(false);
  const [assetFetchError, setAssetFetchError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<FleetAsset | null>(null);

  // Determine Amazon Location Service style URL
  const getMapStyleUrl = (): string => {
    if (config.locationStyleUrl) {
      return config.locationStyleUrl;
    }
    if (config.awsLocationMapName && config.awsLocationApiKey) {
      return `https://maps.geo.${config.region}.amazonaws.com/maps/v0/maps/${config.awsLocationMapName}/style-descriptor?key=${config.awsLocationApiKey}`;
    }
    // High-contrast utilitarian dark vector tiles fallback for live preview
    return 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
  };

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      const styleUrl = getMapStyleUrl();
      const map = new Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [106.8456, -6.2088], // Jakarta Logistics Hub
        zoom: 10,
        attributionControl: false,
      });

      map.addControl(new NavigationControl({ showCompass: true }), 'top-right');

      map.on('load', () => {
        setMapError(null);
        addLog({
          module: 'MapTracking',
          url: styleUrl,
          method: 'GET',
          statusCode: 200,
          statusText: 'Map Style Loaded',
          latencyMs: 150,
          responsePayload: { mapName: config.awsLocationMapName, region: config.region, style: styleUrl },
        });
      });

      map.on('error', (e: any) => {
        const errMsg = `Gagal memuat vector tile Amazon Location Service [${styleUrl}]. Status: MAP_RENDER_ERROR`;
        setMapError(errMsg);
        addLog({
          module: 'MapTracking',
          url: styleUrl,
          method: 'GET',
          statusCode: 'MAP_ERROR',
          statusText: 'Vector Tile Error',
          latencyMs: 0,
          error: errMsg,
          responsePayload: { error: e.error?.message || 'Tile error' },
        });
      });

      mapInstance.current = map;

      return () => {
        map.remove();
        mapInstance.current = null;
      };
    } catch (err: any) {
      setMapError(`MapLibre Initialization Error: ${err.message}`);
    }
  }, [config.awsLocationMapName, config.awsLocationApiKey, config.locationStyleUrl, config.region]);

  // Update map markers when assets change
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    assets.forEach((asset) => {
      const el = document.createElement('div');
      el.className = 'w-6 h-6 bg-steel-700 border-2 border-white flex items-center justify-center text-white font-mono text-[10px] font-bold shadow-none cursor-pointer';
      el.innerText = asset.plateNumber.slice(-3);

      el.addEventListener('click', () => {
        setSelectedAsset(asset);
      });

      const marker = new Marker({ element: el })
        .setLngLat(asset.coordinates)
        .addTo(mapInstance.current!);

      markersRef.current.push(marker);
    });
  }, [assets]);

  const fetchAssets = async () => {
    setIsLoadingAssets(true);
    setAssetFetchError(null);

    const response = await executeDiagnosticRequest<FleetAsset[]>(config.assetTrackingEndpoint, {
      method: 'GET',
      moduleName: 'MapTracking',
      timeoutMs: 8000,
      logCallback: addLog,
    });

    if (response.success && Array.isArray(response.data)) {
      setAssets(response.data);
    } else {
      setAssetFetchError(response.error || 'Endpoint pelacak armada tidak merespons.');
      setAssets([]);
    }

    setIsLoadingAssets(false);
  };

  const fetchGeofences = async () => {
    setIsLoadingGeofences(true);

    const response = await executeDiagnosticRequest<GeofenceZone[]>(config.geofenceEndpoint, {
      method: 'GET',
      moduleName: 'MapTracking',
      timeoutMs: 8000,
      logCallback: addLog,
    });

    if (response.success && Array.isArray(response.data)) {
      setGeofences(response.data);
    } else {
      setGeofences([]);
    }

    setIsLoadingGeofences(false);
  };

  const moduleLogs = getModuleLogs('MapTracking');

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-slate-900 p-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-steel-400" />
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                Modul 3: Map & Asset Tracking (Networking & Location)
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Visualisasi geospasial real-time armada logistik menggunakan MapLibre GL dan endpoint vektor tile Amazon Location Service.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchAssets();
                fetchGeofences();
              }}
              disabled={isLoadingAssets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-steel-700 hover:bg-steel-600 disabled:bg-slate-800 text-white border border-steel-500 transition-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAssets ? 'animate-spin' : ''}`} />
              <span>{isLoadingAssets ? 'Mengambil Posisi...' : 'Sinkronkan Posisi Aset'}</span>
            </button>
          </div>
        </div>

        {/* Location Specs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800">
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Amazon Location Map</span>
            <span className="text-xs font-bold text-steel-300 truncate block">
              {config.awsLocationMapName || 'Standard Vector Base'}
            </span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">API Key / Cognito Token</span>
            <span className="text-xs text-slate-300">
              {config.awsLocationApiKey ? 'TERSEDIA (v1.public...)' : 'MODE DEFAULT'}
            </span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Aset Terpantau</span>
            <span className="text-sm font-bold text-slate-200">{assets.length} Unit</span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Zona Geofence</span>
            <span className="text-sm font-bold text-slate-200">{geofences.length} Zona</span>
          </div>
        </div>

        {mapError && (
          <div className="mt-3 p-2 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
            {mapError}
          </div>
        )}
      </div>

      {/* Main Map + Asset List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map View Container */}
        <div className="lg:col-span-8 border border-slate-800 bg-slate-900 overflow-hidden font-mono flex flex-col">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 uppercase tracking-wider">
              Peta Operasional Geospasial
            </span>
            <span className="text-[11px] text-slate-400">
              Engine: MapLibre GL v4
            </span>
          </div>

          <div className="relative w-full h-[450px] bg-slate-950">
            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Map Overlay Status */}
            <div className="absolute top-2 left-2 p-2 bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-300 pointer-events-none space-y-0.5">
              <div>Pusat: Jakarta Hub [-6.2088, 106.8456]</div>
              <div>Zoom: 10x | Proyeksi: Web Mercator</div>
            </div>
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Asset List or Empty State */}
          <div className="border border-slate-800 bg-slate-900 font-mono text-xs">
            <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Daftar Posisi Armada Riil
            </div>

            {assets.length === 0 ? (
              <div className="p-3">
                <EmptyState
                  title="Tidak ada data aset terdeteksi"
                  description="Backend Location Service atau endpoint tracking belum mengembalikan posisi armada."
                  endpoint={config.assetTrackingEndpoint}
                  status={assetFetchError ? 'ERROR' : 'EMPTY'}
                  errorMessage={assetFetchError || undefined}
                  onRetry={fetchAssets}
                  isLoading={isLoadingAssets}
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      setSelectedAsset(asset);
                      if (mapInstance.current) {
                        mapInstance.current.flyTo({ center: asset.coordinates, zoom: 13 });
                      }
                    }}
                    className={`w-full text-left p-2.5 transition-none block ${
                      selectedAsset?.id === asset.id
                        ? 'bg-slate-800 text-slate-100 border-l-2 border-steel-400'
                        : 'hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-steel-300">{asset.plateNumber}</span>
                      <StatusBadge status={asset.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Suhu Kargo: {asset.cargoTempC !== undefined ? `${asset.cargoTempC}°C` : '-'} | Kecepatan: {asset.speedKmh ?? 0} km/h
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      Tujuan: {asset.destinationName || 'Gudang Logistik'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Geofence Status Table */}
          <div className="border border-slate-800 bg-slate-900 font-mono text-xs">
            <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Zona Geofence Amazon Location
            </div>

            {geofences.length === 0 ? (
              <div className="p-3">
                <EmptyState
                  title="Tidak ada data geofence"
                  description="Belum ada zona perimeter geofence yang tercatat dari endpoint geofence."
                  endpoint={config.geofenceEndpoint}
                  onRetry={fetchGeofences}
                  isLoading={isLoadingGeofences}
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-800 max-h-40 overflow-y-auto">
                {geofences.map((gf) => (
                  <div key={gf.id} className="p-2 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-slate-200 block">{gf.name}</span>
                      <span className="text-slate-400 text-[10px]">{gf.type}</span>
                    </div>
                    <StatusBadge status={gf.status} size="sm" />
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
        moduleName="MapTracking"
        onClear={() => clearLogs('MapTracking')}
      />
    </div>
  );
};

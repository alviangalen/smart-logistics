import React, { useState, useEffect } from 'react';
import { AppConfig } from './types';
import { getAppConfig } from './config/env';
import { TroubleshootingProvider, useTroubleshooting } from './context/TroubleshootingContext';
import { Header } from './components/common/Header';
import { Sidebar, ModuleId } from './components/common/Sidebar';
import { EnvironmentConfigModal } from './components/common/EnvironmentConfigModal';

// Modules
import { ClusterHealthModule } from './components/modules/ClusterHealthModule';
import { IoTTelemetryModule } from './components/modules/IoTTelemetryModule';
import { AssetTrackingModule } from './components/modules/AssetTrackingModule';
import { OrderPipelineModule } from './components/modules/OrderPipelineModule';
import { StorageModule } from './components/modules/StorageModule';
import { MediaStreamingModule } from './components/modules/MediaStreamingModule';
import { PredictiveAnalyticsModule } from './components/modules/PredictiveAnalyticsModule';
import { ObservabilityModule } from './components/modules/ObservabilityModule';
import { GlobalTroubleshootModule } from './components/modules/GlobalTroubleshootModule';

const DashboardContent: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(getAppConfig());
  const [activeModule, setActiveModule] = useState<ModuleId>('cluster_health');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const { logs } = useTroubleshooting();

  useEffect(() => {
    const handleConfigUpdate = () => {
      setConfig(getAppConfig());
    };
    window.addEventListener('app_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('app_config_updated', handleConfigUpdate);
  }, []);

  const totalErrors = logs.filter(
    (l) => String(l.statusCode).startsWith('4') || String(l.statusCode).startsWith('5') || typeof l.statusCode === 'string'
  ).length;

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'cluster_health':
        return <ClusterHealthModule config={config} />;
      case 'iot_telemetry':
        return <IoTTelemetryModule config={config} />;
      case 'map_tracking':
        return <AssetTrackingModule config={config} />;
      case 'order_pipeline':
        return <OrderPipelineModule config={config} />;
      case 'storage_pod':
        return <StorageModule config={config} />;
      case 'media_streaming':
        return <MediaStreamingModule config={config} />;
      case 'predictive_analytics':
        return <PredictiveAnalyticsModule config={config} />;
      case 'observability':
        return <ObservabilityModule config={config} />;
      case 'troubleshoot_global':
        return <GlobalTroubleshootModule />;
      default:
        return <ClusterHealthModule config={config} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Universal Enterprise Header */}
      <Header
        config={config}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        totalErrors={totalErrors}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Compact Navigation Sidebar */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          onOpenConfigModal={() => setIsConfigModalOpen(true)}
        />

        {/* Dynamic Operational Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 bg-slate-925">
          <div className="max-w-[1600px] mx-auto">
            {renderActiveModule()}
          </div>
        </main>
      </div>

      {/* Environment & Parameters Modal */}
      <EnvironmentConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onConfigSaved={(newCfg) => setConfig(newCfg)}
      />
    </div>
  );
};

export default function App() {
  return (
    <TroubleshootingProvider>
      <DashboardContent />
    </TroubleshootingProvider>
  );
}

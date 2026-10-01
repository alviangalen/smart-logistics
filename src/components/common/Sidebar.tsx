import React from 'react';
import { 
  Server, 
  Radio, 
  MapPin, 
  Workflow, 
  HardDrive, 
  Video, 
  BrainCircuit, 
  BarChart3,
  Sliders,
  Terminal
} from 'lucide-react';

export type ModuleId = 
  | 'cluster_health' 
  | 'iot_telemetry' 
  | 'map_tracking' 
  | 'order_pipeline' 
  | 'storage_pod' 
  | 'media_streaming' 
  | 'predictive_analytics' 
  | 'observability'
  | 'troubleshoot_global';

interface NavItem {
  id: ModuleId;
  index: string;
  name: string;
  awsServices: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'cluster_health',
    index: '01',
    name: 'Cluster & Ingestion Health',
    awsServices: 'EC2, ASG, ECS, EKS',
    icon: Server,
  },
  {
    id: 'iot_telemetry',
    index: '02',
    name: 'IoT Telemetry Cold-Chain',
    awsServices: 'IoT Core, Events, Redis',
    icon: Radio,
  },
  {
    id: 'map_tracking',
    index: '03',
    name: 'Asset Tracking & Geofence',
    awsServices: 'Location Service, Route 53',
    icon: MapPin,
  },
  {
    id: 'order_pipeline',
    index: '04',
    name: 'Order Pipeline & Events',
    awsServices: 'Step Functions, SQS, DynamoDB',
    icon: Workflow,
  },
  {
    id: 'storage_pod',
    index: '05',
    name: 'Document & POD Storage',
    awsServices: 'S3 Presigned, Glacier',
    icon: HardDrive,
  },
  {
    id: 'media_streaming',
    index: '06',
    name: 'Fleet Dashcam Stream',
    awsServices: 'Kinesis Video Streams',
    icon: Video,
  },
  {
    id: 'predictive_analytics',
    index: '07',
    name: 'Predictive ETA & Search',
    awsServices: 'SageMaker, OpenSearch',
    icon: BrainCircuit,
  },
  {
    id: 'observability',
    index: '08',
    name: 'Observability & Budgets',
    awsServices: 'CloudWatch, AWS Budgets',
    icon: BarChart3,
  },
];

interface SidebarProps {
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  onOpenConfigModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  onOpenConfigModal,
}) => {
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Navigation Category Label */}
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-850">
          Modul Operasional AWS
        </div>

        {/* Navigation Links */}
        <nav className="p-1 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`w-full text-left p-2.5 flex items-start gap-2.5 transition-none font-mono ${
                  isActive
                    ? 'bg-steel-950 text-steel-200 border-l-2 border-steel-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-l-2 border-transparent'
                }`}
              >
                <div className={`mt-0.5 ${isActive ? 'text-steel-400' : 'text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.index}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {item.awsServices}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / System Tools */}
      <div className="p-2 border-t border-slate-850 space-y-1">
        <button
          onClick={() => onSelectModule('troubleshoot_global')}
          className={`w-full text-left px-2.5 py-2 flex items-center gap-2 font-mono text-xs ${
            activeModule === 'troubleshoot_global'
              ? 'bg-slate-800 text-steel-300 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-steel-400" />
          <span>Global Audit Log</span>
        </button>

        <button
          onClick={onOpenConfigModal}
          className="w-full text-left px-2.5 py-2 flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-mono text-xs border border-transparent"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span>Konfigurasi .env</span>
        </button>
      </div>
    </aside>
  );
};

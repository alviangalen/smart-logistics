import React, { useState } from 'react';
import { X, Save, RotateCcw, Copy, Check, Server, Shield, Radio, MapPin, Workflow, HardDrive, Video, BrainCircuit, BarChart3 } from 'lucide-react';
import { AppConfig } from '../../types';
import { saveAppConfig, resetAppConfig } from '../../config/env';

interface EnvironmentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onConfigSaved: (newConfig: AppConfig) => void;
}

export const EnvironmentConfigModal: React.FC<EnvironmentConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigSaved,
}) => {
  const [formData, setFormData] = useState<AppConfig>(config);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'export'>('endpoints');

  if (!isOpen) return null;

  const handleChange = (key: keyof AppConfig, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveAppConfig(formData);
    onConfigSaved(formData);
    onClose();
  };

  const handleReset = () => {
    resetAppConfig();
    window.location.reload();
  };

  const generateEnvText = () => {
    return `# SMART LOGISTICS - ENVIRONMENT CONFIGURATION
VITE_AWS_REGION=${formData.region}
VITE_AWS_ACCOUNT_ID=${formData.accountId}
VITE_COGNITO_USER_POOL_ID=${formData.cognitoUserPoolId}
VITE_COGNITO_IDENTITY_POOL_ID=${formData.cognitoIdentityPoolId}
VITE_COGNITO_APP_CLIENT_ID=${formData.cognitoAppClientId}

# MODUL 1: COMPUTE & CONTAINERS
VITE_EC2_HEALTH_ENDPOINT=${formData.ec2HealthEndpoint}
VITE_ASG_HEALTH_ENDPOINT=${formData.asgHealthEndpoint}
VITE_ECS_HEALTH_ENDPOINT=${formData.ecsHealthEndpoint}
VITE_EKS_HEALTH_ENDPOINT=${formData.eksHealthEndpoint}

# MODUL 2: IOT & COLD-CHAIN
VITE_IOT_CORE_ENDPOINT=${formData.iotCoreEndpoint}
VITE_IOT_WS_ENDPOINT=${formData.iotWsEndpoint}
VITE_IOT_MQTT_TOPIC=${formData.iotMqttTopic}
VITE_REDIS_TELEMETRY_ENDPOINT=${formData.redisTelemetryEndpoint}

# MODUL 3: NETWORKING & LOCATION
VITE_AWS_LOCATION_MAP_NAME=${formData.awsLocationMapName}
VITE_AWS_LOCATION_API_KEY=${formData.awsLocationApiKey}
VITE_LOCATION_STYLE_URL=${formData.locationStyleUrl}
VITE_ASSET_TRACKING_ENDPOINT=${formData.assetTrackingEndpoint}
VITE_GEOFENCE_ENDPOINT=${formData.geofenceEndpoint}

# MODUL 4: ORDER PIPELINE & INTEGRATION
VITE_ORDER_API_ENDPOINT=${formData.orderApiEndpoint}
VITE_STEP_FUNCTIONS_ARN=${formData.stepFunctionsArn}
VITE_ORDER_LIST_ENDPOINT=${formData.orderListEndpoint}
VITE_ORDER_STATUS_ENDPOINT=${formData.orderStatusEndpoint}

# MODUL 5: STORAGE (S3 & GLACIER)
VITE_S3_BUCKET_NAME=${formData.s3BucketName}
VITE_S3_PRESIGN_ENDPOINT=${formData.s3PresignEndpoint}
VITE_S3_LIST_ENDPOINT=${formData.s3ListEndpoint}

# MODUL 6: MEDIA STREAMING (KINESIS)
VITE_KINESIS_STREAM_NAME=${formData.kinesisStreamName}
VITE_KINESIS_HLS_ENDPOINT=${formData.kinesisHlsEndpoint}
VITE_KINESIS_GET_MEDIA_ENDPOINT=${formData.kinesisGetMediaEndpoint}

# MODUL 7: PREDICTIVE ETA & ANALYTICS (SAGEMAKER & OPENSEARCH)
VITE_SAGEMAKER_ENDPOINT=${formData.sagemakerEndpoint}
VITE_OPENSEARCH_ENDPOINT=${formData.opensearchEndpoint}
VITE_OPENSEARCH_INDEX=${formData.opensearchIndex}

# MODUL 8: GOVERNANCE & OBSERVABILITY (CLOUDWATCH & BUDGETS)
VITE_CLOUDWATCH_METRICS_ENDPOINT=${formData.cloudwatchMetricsEndpoint}
VITE_CLOUDWATCH_ALARMS_ENDPOINT=${formData.cloudwatchAlarmsEndpoint}
VITE_AWS_BUDGETS_ENDPOINT=${formData.awsBudgetsEndpoint}
`;
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(generateEnvText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 max-h-[90vh] flex flex-col font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-steel-400" />
            <span className="font-bold text-slate-100 uppercase tracking-wider text-sm">
              Konfigurasi Endpoint & Parameter AWS
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`px-3 py-2 font-bold uppercase tracking-wider border-b-2 transition-none ${
              activeTab === 'endpoints'
                ? 'border-steel-400 text-steel-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Form Parameter (.env.local)
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-2 font-bold uppercase tracking-wider border-b-2 transition-none ${
              activeTab === 'export'
                ? 'border-steel-400 text-steel-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Export Raw .env Format
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === 'endpoints' ? (
            <div className="space-y-6">
              {/* Global Section */}
              <div className="border border-slate-800 p-3 bg-slate-950">
                <div className="font-bold text-slate-300 uppercase pb-2 mb-3 border-b border-slate-800 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-steel-400" />
                  <span>Global AWS & Cognito Credentials</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">VITE_AWS_REGION</label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => handleChange('region', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">VITE_AWS_ACCOUNT_ID</label>
                    <input
                      type="text"
                      value={formData.accountId}
                      onChange={(e) => handleChange('accountId', e.target.value)}
                      placeholder="12-digit AWS Account ID"
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">VITE_COGNITO_USER_POOL_ID</label>
                    <input
                      type="text"
                      value={formData.cognitoUserPoolId}
                      onChange={(e) => handleChange('cognitoUserPoolId', e.target.value)}
                      placeholder="ap-southeast-1_xxxxxxxxx"
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">VITE_COGNITO_IDENTITY_POOL_ID</label>
                    <input
                      type="text"
                      value={formData.cognitoIdentityPoolId}
                      onChange={(e) => handleChange('cognitoIdentityPoolId', e.target.value)}
                      placeholder="ap-southeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Module 1 */}
              <div className="border border-slate-800 p-3 bg-slate-950">
                <div className="font-bold text-slate-300 uppercase pb-2 mb-3 border-b border-slate-800 flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-steel-400" />
                  <span>Modul 1: Ingestion & Cluster Health Endpoints</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">EC2 Health Endpoint</label>
                    <input
                      type="text"
                      value={formData.ec2HealthEndpoint}
                      onChange={(e) => handleChange('ec2HealthEndpoint', e.target.value)}
                      placeholder="http://ec2-instance-ip:8080/health"
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Auto Scaling Group Endpoint</label>
                    <input
                      type="text"
                      value={formData.asgHealthEndpoint}
                      onChange={(e) => handleChange('asgHealthEndpoint', e.target.value)}
                      placeholder="http://alb-dns-name/asg/health"
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">ECS (Node.js) Health Endpoint</label>
                    <input
                      type="text"
                      value={formData.ecsHealthEndpoint}
                      onChange={(e) => handleChange('ecsHealthEndpoint', e.target.value)}
                      placeholder="http://alb-dns-name/ecs/health"
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">EKS (Golang) Health Endpoint</label>
                    <input
                      type="text"
                      value={formData.eksHealthEndpoint}
                      onChange={(e) => handleChange('eksHealthEndpoint', e.target.value)}
                      placeholder="http://alb-dns-name/eks/health"
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Module 2 */}
              <div className="border border-slate-800 p-3 bg-slate-950">
                <div className="font-bold text-slate-300 uppercase pb-2 mb-3 border-b border-slate-800 flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-steel-400" />
                  <span>Modul 2: IoT Telemetry & Cold-Chain Endpoints</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">AWS IoT Core Broker URL</label>
                    <input
                      type="text"
                      value={formData.iotCoreEndpoint}
                      onChange={(e) => handleChange('iotCoreEndpoint', e.target.value)}
                      placeholder="xxxxxx-ats.iot.ap-southeast-1.amazonaws.com"
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">IoT WebSocket / WSS Endpoint</label>
                    <input
                      type="text"
                      value={formData.iotWsEndpoint}
                      onChange={(e) => handleChange('iotWsEndpoint', e.target.value)}
                      placeholder="wss://api.example.com/ws/telemetry"
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">MQTT Subscription Topic</label>
                    <input
                      type="text"
                      value={formData.iotMqttTopic}
                      onChange={(e) => handleChange('iotMqttTopic', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Redis/ElastiCache Telemetry API</label>
                    <input
                      type="text"
                      value={formData.redisTelemetryEndpoint}
                      onChange={(e) => handleChange('redisTelemetryEndpoint', e.target.value)}
                      placeholder="http://api.example.com/telemetry/redis/latest"
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Module 3 & 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-800 p-3 bg-slate-950">
                  <div className="font-bold text-slate-300 uppercase pb-2 mb-3 border-b border-slate-800 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-steel-400" />
                    <span>Modul 3: Location & Tracking</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Location Map Name</label>
                      <input
                        type="text"
                        value={formData.awsLocationMapName}
                        onChange={(e) => handleChange('awsLocationMapName', e.target.value)}
                        placeholder="LogisticsFleetMap"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Location API Key / Token</label>
                      <input
                        type="text"
                        value={formData.awsLocationApiKey}
                        onChange={(e) => handleChange('awsLocationApiKey', e.target.value)}
                        placeholder="v1.public.xxxxxxx"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Asset Tracking Endpoint</label>
                      <input
                        type="text"
                        value={formData.assetTrackingEndpoint}
                        onChange={(e) => handleChange('assetTrackingEndpoint', e.target.value)}
                        placeholder="http://api.example.com/assets/tracking"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-800 p-3 bg-slate-950">
                  <div className="font-bold text-slate-300 uppercase pb-2 mb-3 border-b border-slate-800 flex items-center gap-2">
                    <Workflow className="w-3.5 h-3.5 text-steel-400" />
                    <span>Modul 4: Order Pipeline & Step Functions</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Order Execution API Gateway URL</label>
                      <input
                        type="text"
                        value={formData.orderApiEndpoint}
                        onChange={(e) => handleChange('orderApiEndpoint', e.target.value)}
                        placeholder="https://api-id.execute-api.ap-southeast-1.amazonaws.com/orders"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Step Functions State Machine ARN</label>
                      <input
                        type="text"
                        value={formData.stepFunctionsArn}
                        onChange={(e) => handleChange('stepFunctionsArn', e.target.value)}
                        placeholder="arn:aws:states:ap-southeast-1:123456789012:stateMachine:OrderProcess"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Order List Endpoint (DynamoDB/RDS)</label>
                      <input
                        type="text"
                        value={formData.orderListEndpoint}
                        onChange={(e) => handleChange('orderListEndpoint', e.target.value)}
                        placeholder="https://api-id.execute-api.ap-southeast-1.amazonaws.com/orders/list"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Module 5 & 6 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-800 p-3 bg-slate-950">
                  <div className="font-bold text-slate-300 uppercase pb-2 mb-3 border-b border-slate-800 flex items-center gap-2">
                    <HardDrive className="w-3.5 h-3.5 text-steel-400" />
                    <span>Modul 5: Storage (S3 & Glacier)</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">S3 Bucket Name</label>
                      <input
                        type="text"
                        value={formData.s3BucketName}
                        onChange={(e) => handleChange('s3BucketName', e.target.value)}
                        placeholder="smart-logistics-pod-storage"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">S3 Pre-sign Endpoint</label>
                      <input
                        type="text"
                        value={formData.s3PresignEndpoint}
                        onChange={(e) => handleChange('s3PresignEndpoint', e.target.value)}
                        placeholder="https://api-id.execute-api.ap-southeast-1.amazonaws.com/storage/presign"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">S3 Objects List Endpoint</label>
                      <input
                        type="text"
                        value={formData.s3ListEndpoint}
                        onChange={(e) => handleChange('s3ListEndpoint', e.target.value)}
                        placeholder="https://api-id.execute-api.ap-southeast-1.amazonaws.com/storage/objects"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-800 p-3 bg-slate-950">
                  <div className="font-bold text-slate-300 uppercase pb-2 mb-3 border-b border-slate-800 flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-steel-400" />
                    <span>Modul 6: Kinesis Video Streams</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Kinesis Stream Name</label>
                      <input
                        type="text"
                        value={formData.kinesisStreamName}
                        onChange={(e) => handleChange('kinesisStreamName', e.target.value)}
                        placeholder="fleet-dashcam-stream"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">KVS HLS Playback URL</label>
                      <input
                        type="text"
                        value={formData.kinesisHlsEndpoint}
                        onChange={(e) => handleChange('kinesisHlsEndpoint', e.target.value)}
                        placeholder="https://xxxxxx.kinesisvideo.ap-southeast-1.amazonaws.com/hls/v1/getHLSMasterPlaylist.m3u8"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Module 7 & 8 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-800 p-3 bg-slate-950">
                  <div className="font-bold text-slate-300 uppercase pb-2 mb-3 border-b border-slate-800 flex items-center gap-2">
                    <BrainCircuit className="w-3.5 h-3.5 text-steel-400" />
                    <span>Modul 7: SageMaker & OpenSearch</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">SageMaker Inference API Endpoint</label>
                      <input
                        type="text"
                        value={formData.sagemakerEndpoint}
                        onChange={(e) => handleChange('sagemakerEndpoint', e.target.value)}
                        placeholder="https://api-id.execute-api.ap-southeast-1.amazonaws.com/predict-eta"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">OpenSearch Query Endpoint</label>
                      <input
                        type="text"
                        value={formData.opensearchEndpoint}
                        onChange={(e) => handleChange('opensearchEndpoint', e.target.value)}
                        placeholder="https://search-domain.ap-southeast-1.es.amazonaws.com/logistics-manifests/_search"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-800 p-3 bg-slate-950">
                  <div className="font-bold text-slate-300 uppercase pb-2 mb-3 border-b border-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-steel-400" />
                    <span>Modul 8: CloudWatch & Budgets</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">CloudWatch Metrics Endpoint</label>
                      <input
                        type="text"
                        value={formData.cloudwatchMetricsEndpoint}
                        onChange={(e) => handleChange('cloudwatchMetricsEndpoint', e.target.value)}
                        placeholder="https://api-id.execute-api.ap-southeast-1.amazonaws.com/observability/metrics"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">AWS Budgets API Endpoint</label>
                      <input
                        type="text"
                        value={formData.awsBudgetsEndpoint}
                        onChange={(e) => handleChange('awsBudgetsEndpoint', e.target.value)}
                        placeholder="https://api-id.execute-api.ap-southeast-1.amazonaws.com/observability/budgets"
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 text-xs focus:border-steel-400 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">
                  Format konfigurasi standar untuk disimpan ke dalam berkas <code className="text-steel-300">.env.local</code>:
                </span>
                <button
                  onClick={handleCopyEnv}
                  className="flex items-center gap-1.5 px-3 py-1 bg-steel-700 hover:bg-steel-600 text-white font-mono text-xs border border-steel-500"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin' : 'Salin ke Clipboard'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto select-all max-h-[60vh]">
                {generateEnvText()}
              </pre>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Default (.env)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-steel-700 hover:bg-steel-600 text-white border border-steel-500 font-bold"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan & Terapkan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

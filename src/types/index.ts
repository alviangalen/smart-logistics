// SMART LOGISTICS - AWS OPERATIONS & MONITORING PLATFORM
// Enterprise TypeScript Interfaces

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';

export interface TroubleshootingLog {
  id: string;
  timestamp: string;
  module: string;
  url: string;
  method: HttpMethod;
  statusCode: number | string;
  statusText: string;
  latencyMs: number;
  requestHeaders?: Record<string, string>;
  requestPayload?: any;
  responsePayload?: any;
  error?: string;
}

export interface AppConfig {
  region: string;
  accountId: string;
  cognitoUserPoolId: string;
  cognitoIdentityPoolId: string;
  cognitoAppClientId: string;

  // Module 1: Ingestion & Cluster Health (Compute & Containers)
  ec2HealthEndpoint: string;
  asgHealthEndpoint: string;
  ecsHealthEndpoint: string;
  eksHealthEndpoint: string;

  // Module 2: IoT Telemetry & Cold-Chain Monitor (IoT & Caching)
  iotCoreEndpoint: string;
  iotWsEndpoint: string;
  iotMqttTopic: string;
  redisTelemetryEndpoint: string;

  // Module 3: Map & Asset Tracking (Networking & Location)
  awsLocationMapName: string;
  awsLocationApiKey: string;
  locationStyleUrl: string;
  assetTrackingEndpoint: string;
  geofenceEndpoint: string;

  // Module 4: Order Pipeline & Event Integration (Step Functions, SQS, DynamoDB, RDS)
  orderApiEndpoint: string;
  stepFunctionsArn: string;
  orderListEndpoint: string;
  orderStatusEndpoint: string;

  // Module 5: Document & POD Storage (Storage: S3 Pre-signed URL, Glacier)
  s3BucketName: string;
  s3PresignEndpoint: string;
  s3ListEndpoint: string;

  // Module 6: Media Streaming (Amazon Kinesis Video Streams)
  kinesisStreamName: string;
  kinesisHlsEndpoint: string;
  kinesisGetMediaEndpoint: string;

  // Module 7: Predictive ETA & Analytics (SageMaker, OpenSearch)
  sagemakerEndpoint: string;
  opensearchEndpoint: string;
  opensearchIndex: string;

  // Module 8: Observability & Cloud Budgets (CloudWatch, AWS Budgets)
  cloudwatchMetricsEndpoint: string;
  cloudwatchAlarmsEndpoint: string;
  awsBudgetsEndpoint: string;
}

// Module 1 Types
export type ClusterNodeType = 'EC2' | 'ASG' | 'ECS' | 'EKS';
export type ClusterNodeStatus = 'HEALTHY' | 'UNHEALTHY' | 'UNREACHABLE' | 'PENDING' | 'NOT_CONFIGURED';

export interface ClusterNodeHealth {
  serviceName: ClusterNodeType;
  clusterOrInstanceName: string;
  targetEndpoint: string;
  status: ClusterNodeStatus;
  httpStatus: number | null;
  latencyMs: number | null;
  uptime?: string;
  region?: string;
  lastChecked?: string;
  rawResponse?: any;
  errorMessage?: string;
}

// Module 2 Types
export interface TelemetryReading {
  timestamp: string;
  deviceId: string;
  truckPlate: string;
  temperatureC: number;
  targetTempMin: number;
  targetTempMax: number;
  humidityPct: number;
  latitude: number;
  longitude: number;
  doorStatus: 'OPEN' | 'CLOSED';
  compressorState: 'ACTIVE' | 'IDLE' | 'FAULT';
  alarmTriggered: boolean;
  alarmType?: string;
}

export interface IoTConnectionState {
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  endpoint: string;
  topic: string;
  messagesReceived: number;
  lastMessageTimestamp: string | null;
  errorDetail?: string;
}

// Module 3 Types
export interface FleetAsset {
  id: string;
  plateNumber: string;
  driverName?: string;
  status: 'EN_ROUTE' | 'AT_WAREHOUSE' | 'IDLE' | 'MAINTENANCE';
  coordinates: [number, number]; // [lng, lat]
  speedKmh?: number;
  headingDeg?: number;
  cargoTempC?: number;
  activeGeofenceId?: string;
  destinationName?: string;
  lastReported: string;
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'WAREHOUSE' | 'DISTRIBUTION_CENTER' | 'PORT' | 'RESTRICTED';
  coordinates: [number, number][]; // Polygon coords [lng, lat]
  status: 'NORMAL' | 'BREACH' | 'ALERT';
}

// Module 4 Types
export type OrderCargoType = 'FROZEN_FOOD' | 'PHARMACEUTICAL' | 'DAIRY' | 'PERISHABLE';
export type OrderPipelineStage = 
  | 'CREATED'
  | 'SQS_ENQUEUED'
  | 'STEP_FUNCTIONS_RUNNING'
  | 'DYNAMO_STORED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'FAILED';

export interface LogisticsOrder {
  orderId: string;
  waybillNumber: string;
  clientName: string;
  origin: string;
  destination: string;
  cargoCategory: OrderCargoType;
  requiredTempC: number;
  weightKg: number;
  createdAt: string;
  stepFunctionsExecutionArn?: string;
  pipelineStage: OrderPipelineStage;
  statusDetail?: string;
}

// Module 5 Types
export type S3StorageClass = 
  | 'STANDARD' 
  | 'GLACIER' 
  | 'GLACIER_IR' 
  | 'INTELLIGENT_TIERING' 
  | 'DEEP_ARCHIVE' 
  | 'STANDARD_IA';

export interface S3Document {
  key: string;
  bucket: string;
  sizeBytes: number;
  lastModified: string;
  storageClass: S3StorageClass;
  contentType?: string;
  etag?: string;
  url?: string;
}

// Module 6 Types
export interface KinesisStreamInfo {
  streamName: string;
  hlsEndpoint: string;
  status: 'ACTIVE' | 'OFFLINE' | 'CONNECTING';
  videoCodec?: string;
  audioCodec?: string;
  latencyMs?: number;
  bitrateKbps?: number;
}

// Module 7 Types
export interface SageMakerETAParams {
  origin: string;
  destination: string;
  distanceKm: number;
  cargoWeightKg: number;
  fleetType: 'REEFER_TRUCK' | 'HEAVY_COLD_VAN' | 'CONTAINER_REEFER';
  trafficCongestionIndex: number;
  weatherCondition: 'CLEAR' | 'RAIN' | 'STORM' | 'FOG';
}

export interface SageMakerETAResult {
  inferenceTimeMs: number;
  modelEndpoint: string;
  predictedDurationHours: number;
  estimatedArrivalTimestamp: string;
  confidenceScore: number;
  riskFactorPct: number;
  rawPayload: any;
}

export interface OpenSearchResultItem {
  id: string;
  index: string;
  score: number;
  source: Record<string, any>;
}

// Module 8 Types
export interface CloudWatchMetricItem {
  metricName: string;
  namespace: string;
  unit: string;
  currentValue: number;
  threshold?: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  timestamp: string;
}

export interface CloudWatchAlarmItem {
  alarmName: string;
  stateValue: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
  stateReason: string;
  metricName: string;
  threshold: number;
  updatedTimestamp: string;
}

export interface AWSBudgetData {
  budgetName: string;
  budgetType: string;
  timeUnit: string;
  budgetLimit: number;
  actualSpend: number;
  forecastedSpend: number;
  unit: string;
  percentageUsed: number;
  lastEvaluated: string;
}

import { AppConfig } from '../types';

const STORAGE_KEY = 'smart_logistics_env_overrides';

// Read default environment variables injected by Vite
const defaultEnv = import.meta.env;

export const defaultAppConfig: AppConfig = {
  region: defaultEnv.VITE_AWS_REGION || 'ap-southeast-1',
  accountId: defaultEnv.VITE_AWS_ACCOUNT_ID || '',
  cognitoUserPoolId: defaultEnv.VITE_COGNITO_USER_POOL_ID || '',
  cognitoIdentityPoolId: defaultEnv.VITE_COGNITO_IDENTITY_POOL_ID || '',
  cognitoAppClientId: defaultEnv.VITE_COGNITO_APP_CLIENT_ID || '',

  // Module 1
  ec2HealthEndpoint: defaultEnv.VITE_EC2_HEALTH_ENDPOINT || '',
  asgHealthEndpoint: defaultEnv.VITE_ASG_HEALTH_ENDPOINT || '',
  ecsHealthEndpoint: defaultEnv.VITE_ECS_HEALTH_ENDPOINT || '',
  eksHealthEndpoint: defaultEnv.VITE_EKS_HEALTH_ENDPOINT || '',

  // Module 2
  iotCoreEndpoint: defaultEnv.VITE_IOT_CORE_ENDPOINT || '',
  iotWsEndpoint: defaultEnv.VITE_IOT_WS_ENDPOINT || '',
  iotMqttTopic: defaultEnv.VITE_IOT_MQTT_TOPIC || 'logistics/fleet/coldchain/telemetry',
  redisTelemetryEndpoint: defaultEnv.VITE_REDIS_TELEMETRY_ENDPOINT || '',

  // Module 3
  awsLocationMapName: defaultEnv.VITE_AWS_LOCATION_MAP_NAME || '',
  awsLocationApiKey: defaultEnv.VITE_AWS_LOCATION_API_KEY || '',
  locationStyleUrl: defaultEnv.VITE_LOCATION_STYLE_URL || '',
  assetTrackingEndpoint: defaultEnv.VITE_ASSET_TRACKING_ENDPOINT || '',
  geofenceEndpoint: defaultEnv.VITE_GEOFENCE_ENDPOINT || '',

  // Module 4
  orderApiEndpoint: defaultEnv.VITE_ORDER_API_ENDPOINT || '',
  stepFunctionsArn: defaultEnv.VITE_STEP_FUNCTIONS_ARN || '',
  orderListEndpoint: defaultEnv.VITE_ORDER_LIST_ENDPOINT || '',
  orderStatusEndpoint: defaultEnv.VITE_ORDER_STATUS_ENDPOINT || '',

  // Module 5
  s3BucketName: defaultEnv.VITE_S3_BUCKET_NAME || '',
  s3PresignEndpoint: defaultEnv.VITE_S3_PRESIGN_ENDPOINT || '',
  s3ListEndpoint: defaultEnv.VITE_S3_LIST_ENDPOINT || '',

  // Module 6
  kinesisStreamName: defaultEnv.VITE_KINESIS_STREAM_NAME || '',
  kinesisHlsEndpoint: defaultEnv.VITE_KINESIS_HLS_ENDPOINT || '',
  kinesisGetMediaEndpoint: defaultEnv.VITE_KINESIS_GET_MEDIA_ENDPOINT || '',

  // Module 7
  sagemakerEndpoint: defaultEnv.VITE_SAGEMAKER_ENDPOINT || '',
  opensearchEndpoint: defaultEnv.VITE_OPENSEARCH_ENDPOINT || '',
  opensearchIndex: defaultEnv.VITE_OPENSEARCH_INDEX || 'logistics-manifests',

  // Module 8
  cloudwatchMetricsEndpoint: defaultEnv.VITE_CLOUDWATCH_METRICS_ENDPOINT || '',
  cloudwatchAlarmsEndpoint: defaultEnv.VITE_CLOUDWATCH_ALARMS_ENDPOINT || '',
  awsBudgetsEndpoint: defaultEnv.VITE_AWS_BUDGETS_ENDPOINT || '',
};

export function getAppConfig(): AppConfig {
  if (typeof window === 'undefined') return defaultAppConfig;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAppConfig;
    const overrides = JSON.parse(raw);
    return { ...defaultAppConfig, ...overrides };
  } catch {
    return defaultAppConfig;
  }
}

export function saveAppConfig(config: AppConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event('app_config_updated'));
}

export function resetAppConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('app_config_updated'));
}

import { HttpMethod, TroubleshootingLog } from '../types';

export interface HttpResponse<T = any> {
  success: boolean;
  data: T | null;
  status: number | string;
  statusText: string;
  latencyMs: number;
  error?: string;
  rawPayload?: any;
}

export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
  moduleName: string;
  logCallback?: (log: Omit<TroubleshootingLog, 'id' | 'timestamp'>) => void;
}

export async function executeDiagnosticRequest<T = any>(
  url: string,
  options: RequestOptions
): Promise<HttpResponse<T>> {
  const method = options.method || 'GET';
  const startTime = performance.now();
  const headers = {
    'Accept': 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  // If endpoint is blank or not configured
  if (!url || url.trim() === '') {
    const errorMsg = 'Endpoint backend belum dikonfigurasi (periksa .env.local atau setelan modul)';
    const result: HttpResponse<T> = {
      success: false,
      data: null,
      status: 'NOT_CONFIGURED',
      statusText: 'Endpoint Not Configured',
      latencyMs: 0,
      error: errorMsg,
      rawPayload: { error: errorMsg, endpoint: url },
    };

    if (options.logCallback) {
      options.logCallback({
        module: options.moduleName,
        url: url || '(empty)',
        method,
        statusCode: 'NOT_CONFIGURED',
        statusText: 'Endpoint Not Configured',
        latencyMs: 0,
        requestHeaders: headers,
        requestPayload: options.body,
        responsePayload: result.rawPayload,
        error: errorMsg,
      });
    }

    return result;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 10000);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
      ...(options.body ? { body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body) } : {}),
    };

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    let parsedPayload: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        parsedPayload = await response.json();
      } catch {
        parsedPayload = await response.text();
      }
    } else {
      parsedPayload = await response.text();
    }

    const isSuccess = response.ok;
    const errorDetail = !isSuccess
      ? `Gagal terhubung ke backend [${url}]. Status: ${response.status} ${response.statusText}`
      : undefined;

    const result: HttpResponse<T> = {
      success: isSuccess,
      data: isSuccess ? (parsedPayload as T) : null,
      status: response.status,
      statusText: response.statusText || (isSuccess ? 'OK' : 'ERROR'),
      latencyMs,
      error: errorDetail,
      rawPayload: parsedPayload,
    };

    if (options.logCallback) {
      options.logCallback({
        module: options.moduleName,
        url,
        method,
        statusCode: response.status,
        statusText: response.statusText,
        latencyMs,
        requestHeaders: headers,
        requestPayload: options.body,
        responsePayload: parsedPayload,
        error: errorDetail,
      });
    }

    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    let statusCode: string | number = 'NETWORK_ERROR';
    let statusText = 'Network Error';
    let errorDetail = '';

    if (err.name === 'AbortError') {
      statusCode = 'ETIMEDOUT';
      statusText = 'Request Timeout';
      errorDetail = `Gagal terhubung ke backend [${url}]. Status: ETIMEDOUT (Waktu permintaan habis > ${options.timeoutMs || 10000}ms)`;
    } else if (err.message && err.message.includes('Failed to fetch')) {
      statusCode = 'ECONNREFUSED';
      statusText = 'Connection Refused / CORS Blocked';
      errorDetail = `Gagal terhubung ke backend [${url}]. Status: ECONNREFUSED`;
    } else {
      errorDetail = `Gagal terhubung ke backend [${url}]. Status: ${err.message || 'Unknown Error'}`;
    }

    const result: HttpResponse<T> = {
      success: false,
      data: null,
      status: statusCode,
      statusText,
      latencyMs,
      error: errorDetail,
      rawPayload: {
        error: err.name || 'NetworkError',
        message: err.message,
        stack: err.stack,
      },
    };

    if (options.logCallback) {
      options.logCallback({
        module: options.moduleName,
        url,
        method,
        statusCode,
        statusText,
        latencyMs,
        requestHeaders: headers,
        requestPayload: options.body,
        responsePayload: result.rawPayload,
        error: errorDetail,
      });
    }

    return result;
  }
}

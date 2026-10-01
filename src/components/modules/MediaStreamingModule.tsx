import React, { useState, useEffect, useRef } from 'react';
import { Video, Play, Pause, RotateCw, AlertTriangle, Radio, Film, Activity } from 'lucide-react';
import Hls from 'hls.js';
import { AppConfig, KinesisStreamInfo } from '../../types';
import { executeDiagnosticRequest } from '../../services/httpClient';
import { useTroubleshooting } from '../../context/TroubleshootingContext';
import { StatusBadge } from '../common/StatusBadge';
import { TroubleshootingDrawer } from '../common/TroubleshootingDrawer';

interface MediaStreamingModuleProps {
  config: AppConfig;
}

export const MediaStreamingModule: React.FC<MediaStreamingModuleProps> = ({ config }) => {
  const { addLog, getModuleLogs, clearLogs } = useTroubleshooting();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [streamUrl, setStreamUrl] = useState(config.kinesisHlsEndpoint || '');
  const [streamName, setStreamName] = useState(config.kinesisStreamName || 'fleet-dashcam-primary');
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamStatus, setStreamStatus] = useState<'OFFLINE' | 'ACTIVE' | 'CONNECTING'>('OFFLINE');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    setStreamUrl(config.kinesisHlsEndpoint || '');
    setStreamName(config.kinesisStreamName || 'fleet-dashcam-primary');
  }, [config.kinesisHlsEndpoint, config.kinesisStreamName]);

  const destroyHls = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  const loadStream = () => {
    destroyHls();
    setStreamError(null);

    if (!streamUrl || streamUrl.trim() === '') {
      setStreamStatus('OFFLINE');
      setStreamError('URL HLS Kinesis Video Streams belum dikonfigurasi di .env.local');
      addLog({
        module: 'MediaStreaming',
        url: '(empty)',
        method: 'GET',
        statusCode: 'NOT_CONFIGURED',
        statusText: 'Stream Endpoint Not Set',
        latencyMs: 0,
        error: 'URL HLS Kinesis Video Streams belum dikonfigurasi',
      });
      return;
    }

    setStreamStatus('CONNECTING');
    const startTime = performance.now();

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      if (videoRef.current) {
        hls.attachMedia(videoRef.current);
      }

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const measured = Math.round(performance.now() - startTime);
        setLatencyMs(measured);
        setStreamStatus('ACTIVE');
        setIsPlaying(true);
        videoRef.current?.play().catch(() => {});

        addLog({
          module: 'MediaStreaming',
          url: streamUrl,
          method: 'GET',
          statusCode: 200,
          statusText: 'HLS Master Playlist OK',
          latencyMs: measured,
          responsePayload: { status: 'STREAM_CONNECTED', streamName },
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        const measured = Math.round(performance.now() - startTime);
        const isFatal = data.fatal;
        if (isFatal) {
          setStreamStatus('OFFLINE');
          const errDetail = `Gagal memutar stream Kinesis Video [${streamUrl}]. Status: ${data.details || 'HLS_STREAM_OFFLINE'}`;
          setStreamError(errDetail);

          addLog({
            module: 'MediaStreaming',
            url: streamUrl,
            method: 'GET',
            statusCode: 'STREAM_ERROR',
            statusText: data.details,
            latencyMs: measured,
            error: errDetail,
            responsePayload: { errorType: data.type, details: data.details, fatal: true },
          });

          destroyHls();
        }
      });
    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      videoRef.current.src = streamUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        setStreamStatus('ACTIVE');
        setIsPlaying(true);
        videoRef.current?.play();
      });
      videoRef.current.addEventListener('error', () => {
        setStreamStatus('OFFLINE');
        setStreamError(`Stream tidak aktif pada URL [${streamUrl}]`);
      });
    } else {
      setStreamStatus('OFFLINE');
      setStreamError('Browser tidak mendukung pemutaran HLS video streaming.');
    }
  };

  const handleStopStream = () => {
    destroyHls();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    setIsPlaying(false);
    setStreamStatus('OFFLINE');
  };

  const testGetMediaEndpoint = async () => {
    if (!config.kinesisGetMediaEndpoint) {
      setStreamError('Endpoint GetMedia / Session API belum diatur.');
      return;
    }

    const response = await executeDiagnosticRequest(config.kinesisGetMediaEndpoint, {
      method: 'POST',
      body: { StreamName: streamName, PlaybackMode: 'LIVE' },
      moduleName: 'MediaStreaming',
      timeoutMs: 8000,
      logCallback: addLog,
    });

    if (response.success && response.data?.HLSStreamingSessionURL) {
      setStreamUrl(response.data.HLSStreamingSessionURL);
      setStreamStatus('ACTIVE');
    } else {
      setStreamError(response.error || 'Gagal memperoleh sesi HLS dari API Kinesis.');
    }
  };

  const moduleLogs = getModuleLogs('MediaStreaming');

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-steel-400" />
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                Modul 6: Media Streaming (Amazon Kinesis Video Streams)
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Pemantauan kamera dashcam armada dan rekaman kompartemen pendingin via Amazon Kinesis Video Streams (HLS).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isPlaying ? (
              <button
                onClick={handleStopStream}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 transition-none"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Hentikan Stream</span>
              </button>
            ) : (
              <button
                onClick={loadStream}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-steel-700 hover:bg-steel-600 text-white border border-steel-500 transition-none"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Mulai Pemutaran</span>
              </button>
            )}

            <button
              onClick={testGetMediaEndpoint}
              disabled={!config.kinesisGetMediaEndpoint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 border border-slate-700 transition-none"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Probe Session API</span>
            </button>
          </div>
        </div>

        {/* Video Telemetry Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800">
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Status Aliran Video</span>
            <div className="mt-1">
              <StatusBadge status={streamStatus} />
            </div>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Nama Stream Kinesis</span>
            <span className="text-xs font-bold text-steel-300 truncate block">
              {streamName}
            </span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Protokol Media</span>
            <span className="text-xs text-slate-300">HLS (HTTP Live Streaming)</span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Latency Manifest</span>
            <span className="text-xs text-slate-300">
              {latencyMs !== null ? `${latencyMs} ms` : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Video Player Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Video Screen */}
        <div className="lg:col-span-8 border border-slate-800 bg-slate-950 flex flex-col">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
              <Film className="w-4 h-4 text-steel-400" />
              <span>Layar Dashcam Armada Live</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Resolusi: 1080p H.264
            </span>
          </div>

          <div className="relative w-full h-[400px] bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              controls
              playsInline
              className={`w-full h-full object-contain ${streamStatus === 'ACTIVE' ? 'block' : 'hidden'}`}
            />

            {/* Offline or Error Overlay */}
            {streamStatus !== 'ACTIVE' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 font-mono">
                <div className="w-12 h-12 border border-slate-700 bg-slate-900 flex items-center justify-center text-slate-400 mb-3">
                  <Video className="w-6 h-6 text-slate-500" />
                </div>
                <div className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Stream tidak aktif
                </div>
                <div className="text-xs text-slate-400 max-w-md mb-4 font-sans">
                  Sesi live streaming Kinesis Video Streams sedang offline atau endpoint belum memancarkan sinyal video.
                </div>
                {streamError && (
                  <div className="max-w-lg p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs break-all">
                    {streamError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stream Endpoint Configuration Panel */}
        <div className="lg:col-span-4 border border-slate-800 bg-slate-900 p-4 space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-xs block">
              Parameter Endpoint Streaming
            </span>
            <span className="text-[10px] text-slate-400">
              Amazon Kinesis Video Streams v1
            </span>
          </div>

          <div>
            <label className="text-slate-400 text-[11px] uppercase block mb-1">
              HLS Master Playlist URL (.m3u8)
            </label>
            <textarea
              rows={4}
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://xxxxxx.kinesisvideo.ap-southeast-1.amazonaws.com/hls/v1/getHLSMasterPlaylist.m3u8"
              className="w-full bg-slate-950 border border-slate-700 p-2 text-slate-200 text-xs focus:border-steel-400 outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px] uppercase block mb-1">
              Nama Channel / Stream KVS
            </label>
            <input
              type="text"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-200 text-xs focus:border-steel-400 outline-none"
            />
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 space-y-2 text-[11px] text-slate-400">
            <div className="font-bold text-slate-300 uppercase">Spesifikasi Transcoding:</div>
            <div>- Video Codec: H.264 Baseline/Main</div>
            <div>- Audio Codec: AAC-LC 48kHz (Opsional)</div>
            <div>- Latensi Target: &lt; 3000 ms</div>
            <div>- Kontainer: MPEG-TS Segments</div>
          </div>

          <button
            onClick={loadStream}
            className="w-full py-2 bg-steel-700 hover:bg-steel-600 text-white font-bold border border-steel-500 transition-none uppercase tracking-wider"
          >
            Terapkan &amp; Putar Stream
          </button>
        </div>
      </div>

      {/* Troubleshooting Drawer */}
      <TroubleshootingDrawer
        logs={moduleLogs}
        moduleName="MediaStreaming"
        onClear={() => clearLogs('MediaStreaming')}
      />
    </div>
  );
};

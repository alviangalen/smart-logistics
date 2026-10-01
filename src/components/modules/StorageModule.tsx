import React, { useState, useEffect } from 'react';
import { HardDrive, Upload, RefreshCw, FileText, CheckCircle, AlertTriangle, ExternalLink, Archive } from 'lucide-react';
import { AppConfig, S3Document, S3StorageClass } from '../../types';
import { executeDiagnosticRequest } from '../../services/httpClient';
import { useTroubleshooting } from '../../context/TroubleshootingContext';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { TroubleshootingDrawer } from '../common/TroubleshootingDrawer';

interface StorageModuleProps {
  config: AppConfig;
}

export const StorageModule: React.FC<StorageModuleProps> = ({ config }) => {
  const { addLog, getModuleLogs, clearLogs } = useTroubleshooting();

  // Uploader state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [storageClass, setStorageClass] = useState<S3StorageClass>('STANDARD');
  const [waybillRef, setWaybillRef] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Document list state
  const [documents, setDocuments] = useState<S3Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    setFetchError(null);

    const response = await executeDiagnosticRequest<S3Document[]>(config.s3ListEndpoint, {
      method: 'GET',
      moduleName: 'StoragePOD',
      timeoutMs: 8000,
      logCallback: addLog,
    });

    if (response.success && Array.isArray(response.data)) {
      setDocuments(response.data);
    } else {
      setFetchError(response.error || 'Endpoint daftar objek S3 tidak merespons.');
      setDocuments([]);
    }

    setIsLoadingDocs(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('Meminta Pre-signed URL dari backend...');
    setUploadError(null);

    const filename = `${waybillRef ? waybillRef + '-' : ''}${Date.now()}-${selectedFile.name}`;
    const contentType = selectedFile.type || 'application/octet-stream';

    // Step 1: Get Pre-signed URL
    const presignResponse = await executeDiagnosticRequest<{ uploadUrl: string; key: string }>(
      config.s3PresignEndpoint,
      {
        method: 'POST',
        body: {
          filename,
          contentType,
          storageClass,
          bucket: config.s3BucketName,
        },
        moduleName: 'StoragePOD',
        timeoutMs: 10000,
        logCallback: addLog,
      }
    );

    if (!presignResponse.success || !presignResponse.data?.uploadUrl) {
      setUploadError(presignResponse.error || 'Gagal memperoleh pre-signed URL dari backend S3.');
      setIsUploading(false);
      return;
    }

    const uploadUrl = presignResponse.data.uploadUrl;
    setUploadStatus('Mengunggah berkas langsung ke S3 Bucket...');

    // Step 2: Upload to S3 via PUT
    const startTime = performance.now();
    try {
      const s3Response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'x-amz-storage-class': storageClass,
        },
        body: selectedFile,
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (s3Response.ok) {
        setUploadStatus(`Unggah sukses! Objek tersimpan di bucket [${config.s3BucketName}] dengan kelas ${storageClass}.`);
        addLog({
          module: 'StoragePOD',
          url: uploadUrl.split('?')[0],
          method: 'PUT',
          statusCode: s3Response.status,
          statusText: s3Response.statusText || 'OK',
          latencyMs,
          requestHeaders: { 'Content-Type': contentType, 'x-amz-storage-class': storageClass },
          responsePayload: { message: 'Direct S3 PUT successful', objectKey: filename },
        });

        setSelectedFile(null);
        setWaybillRef('');
        fetchDocuments();
      } else {
        const errText = await s3Response.text();
        const errDetail = `Gagal upload ke S3. Status: ${s3Response.status} ${s3Response.statusText}`;
        setUploadError(errDetail);
        addLog({
          module: 'StoragePOD',
          url: uploadUrl.split('?')[0],
          method: 'PUT',
          statusCode: s3Response.status,
          statusText: s3Response.statusText,
          latencyMs,
          error: errDetail,
          responsePayload: errText,
        });
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      const errDetail = `Gagal terhubung ke S3 Pre-signed URL [${uploadUrl.split('?')[0]}]. Status: ECONNREFUSED`;
      setUploadError(errDetail);
      addLog({
        module: 'StoragePOD',
        url: uploadUrl.split('?')[0],
        method: 'PUT',
        statusCode: 'UPLOAD_FAILED',
        statusText: 'Network Error',
        latencyMs,
        error: errDetail,
        responsePayload: { error: err.message },
      });
    }

    setIsUploading(false);
  };

  const moduleLogs = getModuleLogs('StoragePOD');

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-steel-400" />
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                Modul 5: Document & POD Storage (Amazon S3 & Glacier)
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Pengunggahan bukti penerimaan (Proof of Delivery / POD) langsung menggunakan Amazon S3 Pre-signed URL serta manajemen tiering S3 Glacier.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDocuments}
              disabled={isLoadingDocs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-steel-700 hover:bg-steel-600 disabled:bg-slate-800 text-white border border-steel-500 transition-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin' : ''}`} />
              <span>{isLoadingDocs ? 'Menyinkronkan...' : 'Sinkronkan Objek S3'}</span>
            </button>
          </div>
        </div>

        {/* Storage KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800">
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Target S3 Bucket</span>
            <span className="text-xs font-bold text-steel-300 truncate block">
              {config.s3BucketName || '(Belum diatur)'}
            </span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Pre-signed URL Endpoint</span>
            <span className="text-xs text-slate-300 truncate block" title={config.s3PresignEndpoint}>
              {config.s3PresignEndpoint || '(Belum diatur)'}
            </span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Objek Tersimpan</span>
            <span className="text-sm font-bold text-slate-200">{documents.length} Berkas</span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Kelas Arsip Dingin</span>
            <span className="text-xs text-cyan-300">Glacier & Deep Archive</span>
          </div>
        </div>
      </div>

      {/* Grid: Form & List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Upload Form */}
        <div className="lg:col-span-4 border border-slate-800 bg-slate-900">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Uploader Dokumen POD (Pre-signed)
            </span>
            <span className="text-[10px] text-slate-400">Direct S3 PUT</span>
          </div>

          <form onSubmit={handleUpload} className="p-4 space-y-3">
            <div>
              <label className="text-slate-400 text-[11px] uppercase block mb-1">
                Pilih Berkas POD (PDF / Gambar / Manifest)
              </label>
              <input
                type="file"
                required
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                className="w-full bg-slate-950 border border-slate-700 p-2 text-slate-200 text-xs focus:border-steel-400 outline-none file:mr-2 file:py-1 file:px-2 file:bg-slate-800 file:text-slate-300 file:border file:border-slate-700 file:font-mono file:text-[11px]"
              />
              {selectedFile && (
                <div className="text-[10px] text-slate-400 mt-1">
                  Ukuran: {(selectedFile.size / 1024).toFixed(1)} KB | Tipe: {selectedFile.type || 'unknown'}
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-400 text-[11px] uppercase block mb-1">
                Referensi Resi / Waybill (Opsional)
              </label>
              <input
                type="text"
                placeholder="WB-20261001-XXXX"
                value={waybillRef}
                onChange={(e) => setWaybillRef(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-100 text-xs focus:border-steel-400 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] uppercase block mb-1">
                Amazon S3 Storage Class
              </label>
              <select
                value={storageClass}
                onChange={(e) => setStorageClass(e.target.value as S3StorageClass)}
                className="w-full bg-slate-950 border border-slate-700 px-2 py-1.5 text-slate-100 text-xs focus:border-steel-400 outline-none"
              >
                <option value="STANDARD">STANDARD (Akses Cepat, Operasional Harian)</option>
                <option value="INTELLIGENT_TIERING">INTELLIGENT_TIERING (Otomatis Hemat Biaya)</option>
                <option value="STANDARD_IA">STANDARD_IA (Infrequent Access)</option>
                <option value="GLACIER_IR">GLACIER Instant Retrieval</option>
                <option value="GLACIER">GLACIER Flexible Retrieval (Arsip Audit)</option>
                <option value="DEEP_ARCHIVE">DEEP_ARCHIVE (Penyimpanan Hukum &gt; 5 Tahun)</option>
              </select>
            </div>

            {uploadStatus && (
              <div className="p-2 bg-slate-950 border border-slate-800 text-steel-300 text-xs break-all">
                {uploadStatus}
              </div>
            )}

            {uploadError && (
              <div className="p-2 bg-rose-950 border border-rose-800 text-rose-300 text-xs break-all">
                {uploadError}
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="w-full py-2 bg-steel-700 hover:bg-steel-600 disabled:bg-slate-800 text-white font-bold border border-steel-500 transition-none flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
              <span>{isUploading ? 'Mengunggah...' : 'Upload Dokumen ke S3'}</span>
            </button>
          </form>
        </div>

        {/* Objects List Table */}
        <div className="lg:col-span-8 border border-slate-800 bg-slate-900 flex flex-col">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Daftar Objek Bukti Pengiriman di S3 Bucket
            </span>
            <span className="text-[10px] text-slate-400">
              Listing Endpoint: {config.s3ListEndpoint || '(Not set)'}
            </span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {documents.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Tidak ada data dokumen"
                  description="Belum ada objek POD yang tersimpan pada bucket S3 ini atau endpoint list S3 belum merespons."
                  endpoint={config.s3ListEndpoint}
                  status={fetchError ? 'ERROR' : 'EMPTY'}
                  errorMessage={fetchError || undefined}
                  onRetry={fetchDocuments}
                  isLoading={isLoadingDocs}
                />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                    <th className="p-3">Nama Berkas (Object Key)</th>
                    <th className="p-3">S3 Bucket</th>
                    <th className="p-3">Storage Class</th>
                    <th className="p-3">Ukuran</th>
                    <th className="p-3">Terakhir Diubah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {documents.map((doc) => (
                    <tr key={doc.key} className="hover:bg-slate-850/50">
                      <td className="p-3 font-bold text-steel-300 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-xs">{doc.key}</span>
                      </td>
                      <td className="p-3 text-slate-300">
                        {doc.bucket || config.s3BucketName}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={doc.storageClass} />
                      </td>
                      <td className="p-3 text-slate-300">
                        {(doc.sizeBytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(doc.lastModified).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Troubleshooting Drawer */}
      <TroubleshootingDrawer
        logs={moduleLogs}
        moduleName="StoragePOD"
        onClear={() => clearLogs('StoragePOD')}
      />
    </div>
  );
};

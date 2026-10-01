import React, { useState, useEffect } from 'react';
import { Workflow, Plus, RefreshCw, Send, CheckCircle2, AlertCircle, Database, Layers } from 'lucide-react';
import { AppConfig, LogisticsOrder, OrderCargoType, OrderPipelineStage } from '../../types';
import { executeDiagnosticRequest } from '../../services/httpClient';
import { useTroubleshooting } from '../../context/TroubleshootingContext';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { TroubleshootingDrawer } from '../common/TroubleshootingDrawer';

interface OrderPipelineModuleProps {
  config: AppConfig;
}

export const OrderPipelineModule: React.FC<OrderPipelineModuleProps> = ({ config }) => {
  const { addLog, getModuleLogs, clearLogs } = useTroubleshooting();

  // Form state
  const [waybillNumber, setWaybillNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [origin, setOrigin] = useState('Hub-Cikarang-01');
  const [destination, setDestination] = useState('ColdStorage-Surabaya-02');
  const [cargoCategory, setCargoCategory] = useState<OrderCargoType>('FROZEN_FOOD');
  const [requiredTempC, setRequiredTempC] = useState<number>(-18);
  const [weightKg, setWeightKg] = useState<number>(1200);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Table state
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const generateWaybill = () => {
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    setWaybillNumber(`WB-${dateStr}-${randomHex}`);
  };

  useEffect(() => {
    generateWaybill();
    fetchOrderList();
  }, []);

  const fetchOrderList = async () => {
    setIsLoadingOrders(true);
    setFetchError(null);

    const response = await executeDiagnosticRequest<LogisticsOrder[]>(config.orderListEndpoint, {
      method: 'GET',
      moduleName: 'OrderPipeline',
      timeoutMs: 8000,
      logCallback: addLog,
    });

    if (response.success && Array.isArray(response.data)) {
      setOrders(response.data);
    } else {
      setFetchError(response.error || 'Endpoint daftar order tidak mengembalikan data.');
      // Strictly no fake static array
      setOrders([]);
    }

    setIsLoadingOrders(false);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccessMsg(null);

    const payload = {
      waybillNumber: waybillNumber || `WB-${Date.now()}`,
      clientName,
      origin,
      destination,
      cargoCategory,
      requiredTempC,
      weightKg,
      stepFunctionsArn: config.stepFunctionsArn,
      timestamp: new Date().toISOString(),
    };

    const response = await executeDiagnosticRequest(config.orderApiEndpoint, {
      method: 'POST',
      body: payload,
      moduleName: 'OrderPipeline',
      timeoutMs: 10000,
      logCallback: addLog,
    });

    if (response.success) {
      setSubmitSuccessMsg(`Order berhasil diproses ke pipeline. Execution ARN: ${response.data?.executionArn || 'AWS Step Functions Triggered'}`);
      generateWaybill();
      setClientName('');
      // Refresh list
      fetchOrderList();
    } else {
      setSubmitError(response.error || 'Gagal mengeksekusi order ke Step Functions API.');
    }

    setIsSubmitting(false);
  };

  const moduleLogs = getModuleLogs('OrderPipeline');

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-steel-400" />
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                Modul 4: Order Pipeline & Event Integration (Integration & DB)
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Pemrosesan alur order logistik melalui AWS Step Functions, antrean SQS, dan penyimpanan DynamoDB / RDS.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrderList}
              disabled={isLoadingOrders}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-steel-700 hover:bg-steel-600 disabled:bg-slate-800 text-white border border-steel-500 transition-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
              <span>{isLoadingOrders ? 'Memuat...' : 'Refresh Daftar Order'}</span>
            </button>
          </div>
        </div>

        {/* Pipeline Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800">
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">State Machine ARN</span>
            <span className="text-xs font-bold text-steel-300 truncate block" title={config.stepFunctionsArn}>
              {config.stepFunctionsArn || 'Belum diatur di .env'}
            </span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Endpoint API Gateway</span>
            <span className="text-xs text-slate-300 truncate block" title={config.orderApiEndpoint}>
              {config.orderApiEndpoint || 'Belum diatur di .env'}
            </span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Total Order Terbaca</span>
            <span className="text-sm font-bold text-slate-200">{orders.length} Order</span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Target Database</span>
            <span className="text-xs text-slate-300">DynamoDB / RDS Aurora</span>
          </div>
        </div>
      </div>

      {/* Form & Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Order Form */}
        <div className="lg:col-span-4 border border-slate-800 bg-slate-900">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Buat Order Resi Logistik Baru
            </span>
            <span className="text-[10px] text-slate-400">Step Functions Trigger</span>
          </div>

          <form onSubmit={handleSubmitOrder} className="p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 text-[11px] uppercase">Nomor Resi (Waybill)</label>
                <button
                  type="button"
                  onClick={generateWaybill}
                  className="text-[10px] text-steel-400 hover:text-steel-300"
                >
                  Generate Kode
                </button>
              </div>
              <input
                type="text"
                required
                value={waybillNumber}
                onChange={(e) => setWaybillNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-100 text-xs focus:border-steel-400 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] uppercase block mb-1">Nama Klien / Pengirim</label>
              <input
                type="text"
                required
                placeholder="PT Sumber Segar Cold Chain"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-100 text-xs focus:border-steel-400 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-[11px] uppercase block mb-1">Gudang Asal</label>
                <input
                  type="text"
                  required
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-100 text-xs focus:border-steel-400 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[11px] uppercase block mb-1">Gudang Tujuan</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-100 text-xs focus:border-steel-400 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-[11px] uppercase block mb-1">Kategori Muatan</label>
                <select
                  value={cargoCategory}
                  onChange={(e) => setCargoCategory(e.target.value as OrderCargoType)}
                  className="w-full bg-slate-950 border border-slate-700 px-2 py-1.5 text-slate-100 text-xs focus:border-steel-400 outline-none"
                >
                  <option value="FROZEN_FOOD">Frozen Food (-18°C)</option>
                  <option value="PHARMACEUTICAL">Farmasi / Vaksin (-20°C)</option>
                  <option value="DAIRY">Dairy & Susu (4°C)</option>
                  <option value="PERISHABLE">Perishable Daging (0°C)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-[11px] uppercase block mb-1">Suhu Target (°C)</label>
                <input
                  type="number"
                  required
                  value={requiredTempC}
                  onChange={(e) => setRequiredTempC(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-100 text-xs focus:border-steel-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] uppercase block mb-1">Berat Muatan (kg)</label>
              <input
                type="number"
                required
                min={1}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-100 text-xs focus:border-steel-400 outline-none"
              />
            </div>

            {submitSuccessMsg && (
              <div className="p-2 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs">
                {submitSuccessMsg}
              </div>
            )}

            {submitError && (
              <div className="p-2 bg-rose-950 border border-rose-800 text-rose-300 text-xs">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-steel-700 hover:bg-steel-600 disabled:bg-slate-800 text-white font-bold border border-steel-500 transition-none flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Mengirim ke Step Functions...' : 'Kirim Eksekusi Order'}</span>
            </button>
          </form>
        </div>

        {/* Orders Table */}
        <div className="lg:col-span-8 border border-slate-800 bg-slate-900 flex flex-col">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Pelacakan Progres Alur Order (DynamoDB / SQS)
            </span>
            <span className="text-[10px] text-slate-400">
              Query Endpoint: {config.orderListEndpoint || '(Not set)'}
            </span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {orders.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Tidak ada data order"
                  description="Database DynamoDB / RDS belum memiliki data pesanan logistik atau endpoint order belum merespons."
                  endpoint={config.orderListEndpoint}
                  status={fetchError ? 'ERROR' : 'EMPTY'}
                  errorMessage={fetchError || undefined}
                  onRetry={fetchOrderList}
                  isLoading={isLoadingOrders}
                />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                    <th className="p-3">Nomor Resi</th>
                    <th className="p-3">Pengirim</th>
                    <th className="p-3">Rute (Asal -&gt; Tujuan)</th>
                    <th className="p-3">Kategori &amp; Suhu</th>
                    <th className="p-3">Berat</th>
                    <th className="p-3">Tahap Pipeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map((ord) => (
                    <tr key={ord.orderId || ord.waybillNumber} className="hover:bg-slate-850/50">
                      <td className="p-3 font-bold text-steel-300">
                        {ord.waybillNumber}
                      </td>
                      <td className="p-3 text-slate-200">
                        {ord.clientName}
                      </td>
                      <td className="p-3 text-slate-300 text-[11px]">
                        {ord.origin} -&gt; {ord.destination}
                      </td>
                      <td className="p-3">
                        <span className="text-slate-200 block font-semibold">{ord.cargoCategory}</span>
                        <span className="text-steel-400 text-[10px]">{ord.requiredTempC}°C</span>
                      </td>
                      <td className="p-3 text-slate-300">
                        {ord.weightKg} kg
                      </td>
                      <td className="p-3">
                        <StatusBadge status={ord.pipelineStage} />
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
        moduleName="OrderPipeline"
        onClear={() => clearLogs('OrderPipeline')}
      />
    </div>
  );
};

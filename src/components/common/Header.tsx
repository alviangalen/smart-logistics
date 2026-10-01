import React, { useState, useEffect } from 'react';
import { Sliders, Activity, Clock, ShieldCheck, Terminal, Server } from 'lucide-react';
import { AppConfig } from '../../types';

interface HeaderProps {
  config: AppConfig;
  onOpenConfigModal: () => void;
  totalErrors: number;
}

export const Header: React.FC<HeaderProps> = ({ config, onOpenConfigModal, totalErrors }) => {
  const [timeUtc, setTimeUtc] = useState('');
  const [timeLocal, setTimeLocal] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + ' UTC');
      setTimeLocal(now.toLocaleTimeString() + ' WIB');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between select-none">
      {/* Brand & System Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-steel-700 border border-steel-500 flex items-center justify-center font-mono font-bold text-white text-sm">
          SL
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-100 text-sm tracking-wider">
              SMART-LOGISTICS
            </span>
            <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-700">
              AWS CONSOLE // OPS
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
            <span>PLATFORM INTEGRASI & TELEMETRI ARMADA DINGIN</span>
          </div>
        </div>
      </div>

      {/* Operational Technical Telemetry Badges */}
      <div className="hidden md:flex items-center gap-3 font-mono text-xs">
        {/* Region */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300">
          <Server className="w-3.5 h-3.5 text-steel-400" />
          <span className="text-slate-400">REGION:</span>
          <span className="font-bold text-steel-300">{config.region || 'DEFAULT'}</span>
        </div>

        {/* Cognito Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">AUTH:</span>
          <span className="text-slate-200">
            {config.cognitoUserPoolId ? 'COGNITO CONFIGURED' : 'ANONYMOUS/IAM'}
          </span>
        </div>

        {/* Real-time Clock */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeUtc}</span>
          <span className="text-slate-600">|</span>
          <span className="text-steel-300">{timeLocal}</span>
        </div>

        {/* Diagnostic Errors Count */}
        {totalErrors > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-950/80 border border-rose-800 text-rose-300 font-bold">
            <Activity className="w-3.5 h-3.5" />
            <span>{totalErrors} ERROR DETEKSI</span>
          </div>
        )}

        {/* Config Modal Button */}
        <button
          onClick={onOpenConfigModal}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-none font-mono text-xs"
        >
          <Sliders className="w-3.5 h-3.5 text-steel-400" />
          <span>SETTING ENDPOINT</span>
        </button>
      </div>
    </header>
  );
};

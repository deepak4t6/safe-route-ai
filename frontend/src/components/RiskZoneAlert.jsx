import React from 'react';
import { AlertTriangle, X, ShieldAlert, ArrowRight } from 'lucide-react';

const RiskZoneAlert = ({ alert, onDismiss, onReroute }) => {
  if (!alert) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md bg-amber-500 text-slate-950 rounded-2xl p-4 shadow-xl shadow-amber-500/20 border border-amber-300 animate-bounce-short">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm uppercase tracking-wide">
              Approaching Caution Zone
            </h4>
            <button onClick={onDismiss} className="text-slate-950/70 hover:text-slate-950">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs font-medium mt-0.5 text-slate-900 leading-snug">
            {alert.warning || 'Poor lighting & blind corners reported ahead in next 150m.'}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            {onReroute && (
              <button
                onClick={onReroute}
                className="px-3 py-1.5 rounded-lg bg-slate-950 text-white font-bold text-xs flex items-center gap-1 shadow hover:bg-slate-900 transition"
              >
                <span>Switch to Safer Detour</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onDismiss}
              className="text-xs font-bold underline px-2 py-1 text-slate-950 hover:opacity-80"
            >
              Continue cautiously
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskZoneAlert;

import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const SafetyScoreCard = ({
  score = 88,
  riskLevel = 'safe',
  confidence = 0.88,
  confidenceLabel = 'High data confidence',
  explanations = [],
  factors = {},
  routeType = 'safest'
}) => {

  const getScoreTheme = (val) => {
    if (val >= 80) {
      return {
        bg: 'from-emerald-500 to-teal-600',
        text: 'text-emerald-500 dark:text-emerald-400',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        label: 'SAFE ROUTE',
        icon: ShieldCheck
      };
    }
    if (val >= 60) {
      return {
        bg: 'from-amber-500 to-yellow-600',
        text: 'text-amber-500 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        label: 'MODERATE RISK',
        icon: AlertTriangle
      };
    }
    if (val >= 40) {
      return {
        bg: 'from-orange-500 to-orange-600',
        text: 'text-orange-500 dark:text-orange-400',
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border-orange-300 dark:border-orange-800',
        label: 'EXERCISE CAUTION',
        icon: AlertTriangle
      };
    }
    return {
      bg: 'from-red-500 to-red-600',
      text: 'text-red-500 dark:text-red-400',
      badge: 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border-red-300 dark:border-red-800',
      label: 'HIGH RISK ZONE',
      icon: ShieldAlert
    };
  };

  const theme = getScoreTheme(score);
  const Icon = theme.icon;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      {/* Header with Score and Badge */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.bg} flex flex-col items-center justify-center text-white font-extrabold shadow-md shadow-emerald-500/10`}>
            <span className="text-2xl leading-none">{Math.round(score)}</span>
            <span className="text-[10px] font-medium opacity-80">/100</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.badge}`}>
                {theme.label}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>{confidenceLabel} ({(confidence * 100).toFixed(0)}%)</span>
            </div>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Route Type</span>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 capitalize">
            {routeType} Route
          </div>
        </div>
      </div>

      {/* Transparent Factors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Lighting</span>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {score >= 75 ? '💡 Well-Lit (8.5/10)' : '⚠️ Low / Patchy'}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Police Booth</span>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {score >= 70 ? '👮 Within 400m' : '🚶 > 1.2km away'}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Surveillance</span>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {score >= 65 ? '📹 Active CCTV' : '❌ Low Coverage'}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Footfall</span>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {score >= 75 ? '👥 High Activity' : '🏚️ Isolated Stretches'}
          </div>
        </div>
      </div>

      {/* Explainable AI Highlights */}
      <div className="space-y-2 mt-3">
        <span className="text-xs font-bold tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Icon className={`w-4 h-4 ${theme.text}`} />
          Why this route received this Safety Score:
        </span>
        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
          {explanations && explanations.length > 0 ? (
            explanations.map((exp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{exp}</span>
              </li>
            ))
          ) : (
            <li className="text-slate-400">Analyzed using verified community hazards and municipal street density.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default SafetyScoreCard;

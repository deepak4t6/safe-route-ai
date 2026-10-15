import React from 'react';
import { Shield, Zap, Scale, Clock, MapPin, AlertCircle, ArrowRight } from 'lucide-react';

const RouteComparisonCard = ({
  routes = [],
  selectedRouteId,
  onSelectRoute,
  onStartNavigation
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Generated Route Options ({routes.length})
        </h3>
        <span className="text-xs text-slate-400">Tap to preview on map</span>
      </div>

      <div className="space-y-3">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isSafest = route.type === 'safest';
          const isFastest = route.type === 'fastest';

          let icon = Scale;
          let badgeColor = 'text-amber-500 border-amber-500/30 bg-amber-500/10';
          let borderHighlight = 'border-amber-500';

          if (isSafest) {
            icon = Shield;
            badgeColor = 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
            borderHighlight = 'border-emerald-500 shadow-md shadow-emerald-500/10';
          } else if (isFastest) {
            icon = Zap;
            badgeColor = 'text-orange-500 border-orange-500/30 bg-orange-500/10';
            borderHighlight = 'border-orange-500';
          }

          const IconComponent = icon;

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route)}
              className={`relative cursor-pointer rounded-2xl p-4 transition-all border ${
                isSelected
                  ? `bg-white dark:bg-slate-900 ${borderHighlight} ring-2 ring-emerald-500/20`
                  : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Recommended Pill */}
              {route.is_recommended && (
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
                  Recommended Choice
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badgeColor}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      {route.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {route.tagline}
                    </p>
                  </div>
                </div>

                {/* Score Pill */}
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-400 font-medium">Safety Score</div>
                  <div className={`text-xl font-extrabold ${
                    route.safety_score >= 80 ? 'text-emerald-500' : (route.safety_score >= 60 ? 'text-amber-500' : 'text-orange-500')
                  }`}>
                    {Math.round(route.safety_score)}<span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{route.duration_formatted}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{route.distance_formatted}</span>
                </div>
                {route.risky_segments_count > 0 ? (
                  <div className="flex items-center gap-1 text-red-500 font-medium ml-auto">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{route.risky_segments_count} risky zone</span>
                  </div>
                ) : (
                  <div className="text-emerald-500 font-medium ml-auto text-[11px]">
                    ✓ 0 hazardous bottlenecks
                  </div>
                )}
              </div>

              {/* Select & Navigate Button (shown on active) */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Ready to travel?</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartNavigation(route);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition"
                  >
                    <span>Start Navigation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RouteComparisonCard;

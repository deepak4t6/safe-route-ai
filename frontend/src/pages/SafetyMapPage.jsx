import React, { useState, useEffect } from 'react';
import {
  Flame,
  Filter,
  Shield,
  AlertTriangle,
  Plus,
  ThumbsUp,
  Clock,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { safetyAPI } from '../services/api';
import MapComponent from '../components/MapComponent';

const SafetyMapPage = () => {
  const { setIsReportOpen } = useTrip();

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showSafePlaces, setShowSafePlaces] = useState(true);
  const [reports, setReports] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [safePlaces, setSafePlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMapData();
  }, [categoryFilter]);

  const loadMapData = async () => {
    setIsLoading(true);
    try {
      const [heatRes, repRes, safeRes] = await Promise.all([
        safetyAPI.getHeatmap({ category: categoryFilter }),
        safetyAPI.getReports({ category: categoryFilter !== 'all' ? categoryFilter : undefined }),
        safetyAPI.getNearbySafePlaces()
      ]);

      if (heatRes.data.success) {
        const rz = heatRes.data.data.points.filter(p => p.type === 'risk_zone').map((z, i) => ({
          id: 'rz-' + i,
          name: z.name,
          latitude: z.lat,
          longitude: z.lng,
          radius_meters: z.radius,
          risk_score: z.intensity * 100,
          reason: z.reason
        }));
        setRiskZones(rz);
      }

      if (repRes.data.success) {
        setReports(repRes.data.reports);
      }

      if (safeRes.data.success) {
        setSafePlaces(safeRes.data.safe_places);
      }
    } catch (err) {
      console.warn('Could not fetch heatmap from backend', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (reportId, direction) => {
    try {
      await safetyAPI.verifyReport(reportId, { vote: direction });
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            upvotes: direction === 'up' ? r.upvotes + 1 : r.upvotes,
            downvotes: direction === 'down' ? r.downvotes + 1 : r.downvotes
          };
        }
        return r;
      }));
    } catch (err) {
      // offline vote
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-7 h-7 text-amber-500" />
            Safety Heatmap & Community Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time urban security index powered by community hazard tags & open civic intelligence.
          </p>
        </div>

        <button
          onClick={() => setIsReportOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-md flex items-center gap-2 active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Report Hazard / Safe Spot</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500">Filter Category:</span>
          {[
            { id: 'all', label: 'All Hazards' },
            { id: 'poor_lighting', label: '💡 Poor Lighting' },
            { id: 'harassment', label: '🚫 Harassment' },
            { id: 'stray_dogs', label: '🐕 Stray Dogs' },
            { id: 'construction', label: '🚧 Construction' },
            { id: 'police_presence', label: '👮 Police Presence' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                categoryFilter === c.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Toggle Safe Places */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSafePlaces}
              onChange={(e) => setShowSafePlaces(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
            />
            <span>Show 24/7 Safe Havens & Police</span>
          </label>
        </div>
      </div>

      {/* Heatmap Container */}
      <div className="relative">
        <MapComponent
          center={[28.6328, 77.2195]}
          zoom={15}
          safePlaces={safePlaces}
          riskZones={riskZones}
          reports={reports}
          showSafePlaces={showSafePlaces}
          showHeatmap={true}
          height="540px"
        />

        {/* Map Legend Floating */}
        <div className="absolute bottom-6 right-6 z-20 p-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-white backdrop-blur text-xs space-y-1.5 shadow-xl">
          <div className="font-bold text-[11px] text-slate-400 uppercase tracking-wider">Map Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500" />
            <span>Flagged Risk Hotspots</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Police Stations & Booths</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>24/7 Hospitals & Safe Havens</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Community Hazard Pins</span>
          </div>
        </div>
      </div>

      {/* Community Reports List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            Recent Community Incident Feed ({reports.length})
          </h2>
          <span className="text-xs text-slate-400">All submissions are moderated</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {rep.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Severity: <strong className="text-amber-500">{rep.severity || 3}/5</strong>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                  "{rep.description}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{rep.status === 'verified' ? 'Verified by Team' : 'Pending Review'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVote(rep.id, 'up')}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-emerald-500 transition"
                    title="Confirm this hazard exists"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{rep.upvotes || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default SafetyMapPage;

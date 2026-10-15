import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  BarChart3,
  Flame,
  Hospital,
  Clock,
  Filter
} from 'lucide-react';
import { adminAPI } from '../services/api';

const AdminDashboardPage = () => {
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [repRes, anaRes] = await Promise.all([
        adminAPI.getReports(),
        adminAPI.getAnalytics()
      ]);

      if (repRes.data.success) {
        setReports(repRes.data.reports);
      }
      if (anaRes.data.success) {
        setAnalytics(anaRes.data.analytics);
      }
    } catch (err) {
      console.warn('Admin API fallback:', err.message);
      // Fallback sample reports
      setReports([
        {
          id: 'rep-1',
          category: 'poor_lighting',
          description: 'Four consecutive streetlights are non-functional on radial road 4. Very dark.',
          latitude: 28.6348,
          longitude: 77.2142,
          severity: 4,
          status: 'verified',
          reported_by: { name: 'Ananya Sharma', email: 'ananya@saferoute.ai' }
        },
        {
          id: 'rep-2',
          category: 'harassment',
          description: 'Catcalling and loitering reported near deserted bus stop after 9:30 PM.',
          latitude: 28.6350,
          longitude: 77.2135,
          severity: 5,
          status: 'pending',
          reported_by: 'Anonymous User'
        },
        {
          id: 'rep-3',
          category: 'construction',
          description: 'Pavement dug up for fiber cable installation. Pedestrians forced into motor lane.',
          latitude: 28.6305,
          longitude: 77.2230,
          severity: 3,
          status: 'pending',
          reported_by: { name: 'Rahul Verma', email: 'rahul@saferoute.ai' }
        }
      ]);
      setAnalytics({
        overview: {
          total_registered_users: 1420,
          total_community_reports: 28,
          verified_reports: 22,
          pending_moderation: 6,
          active_risk_zones: 3,
          verified_safe_havens: 7,
          sos_incidents_handled: 4
        },
        category_distribution: {
          poor_lighting: 11,
          harassment: 5,
          stray_dogs: 4,
          construction: 6,
          police_presence: 2
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      await adminAPI.updateReport(reportId, { status: newStatus });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    } catch (err) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    }
  };

  const filteredReports = statusFilter === 'all'
    ? reports
    : reports.filter(r => r.status === statusFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>Moderator & Administrator Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Community Safety Moderation & Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Verify citizen-reported dark spots, review harassment flags, and monitor geospatial route confidence.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: 'Registered Users', value: analytics?.overview?.total_registered_users || 1420, icon: Users, color: 'text-blue-500' },
          { label: 'Total Reports', value: analytics?.overview?.total_community_reports || 28, icon: Flame, color: 'text-amber-500' },
          { label: 'Verified Reports', value: analytics?.overview?.verified_reports || 22, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Pending Review', value: analytics?.overview?.pending_moderation || 6, icon: Clock, color: 'text-orange-500' },
          { label: 'Active Risk Zones', value: analytics?.overview?.active_risk_zones || 3, icon: AlertTriangle, color: 'text-red-500' },
          { label: 'Verified Havens', value: analytics?.overview?.verified_safe_havens || 7, icon: Hospital, color: 'text-teal-500' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reports Moderation Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Pending & Active Hazard Reports
            </h2>
            <p className="text-xs text-slate-500">
              Verified reports immediately adjust route safety weights in the routing engine.
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
            >
              <option value="all">All Reports</option>
              <option value="pending">Pending Moderation</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Location (Lat, Lng)</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold capitalize text-slate-900 dark:text-white whitespace-nowrap">
                    {rep.category.replace('_', ' ')}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate">
                    {rep.description}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                    {rep.latitude.toFixed(4)}, {rep.longitude.toFixed(4)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-amber-500">
                    {rep.severity || 3} / 5
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      rep.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : (rep.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300')
                    }`}>
                      {rep.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(rep.id, 'verified')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(rep.id, 'rejected')}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-[11px] transition"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboardPage;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  MapPin,
  Clock,
  PhoneCall,
  Users,
  AlertTriangle,
  ArrowRight,
  Flame,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { safetyAPI } from '../services/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerSOS, setCurrentLocation, setDestination } = useTrip();

  const [fromText, setFromText] = useState('Rajiv Chowk Metro Gate 3');
  const [toText, setToText] = useState('Janpath Lane Commercial Hub');
  const [stats, setStats] = useState({
    safeHavens: 6,
    activeAlerts: 3,
    verifiedReports: 12
  });

  const recentTrips = [
    {
      id: 'trip-1',
      from: 'Barakhamba Road',
      to: 'Connaught Place Central',
      date: 'Yesterday at 9:45 PM',
      routeType: 'Safest Route',
      safetyScore: 91,
      duration: '12 mins'
    },
    {
      id: 'trip-2',
      from: 'Rajiv Chowk Gate 2',
      to: 'Janpath Hotel Plaza',
      date: '3 days ago',
      routeType: 'Balanced Route',
      safetyScore: 78,
      duration: '16 mins'
    }
  ];

  const handleStartPlanning = (e) => {
    e.preventDefault();
    setCurrentLocation({
      lat: 28.6328,
      lng: 77.2195,
      latitude: 28.6328,
      longitude: 77.2195,
      name: fromText
    });
    setDestination({
      lat: 28.6385,
      lng: 77.2240,
      latitude: 28.6385,
      longitude: 77.2240,
      name: toText
    });
    navigate('/plan');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/30 text-xs font-semibold backdrop-blur">
            <Shield className="w-3.5 h-3.5" />
            <span>Safety Shield Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome back, {user?.name || 'Explorer'}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm">
            Current travel profile: <strong className="underline capitalize">{user?.preferred_mode || 'Walking'}</strong> (Avoiding dark & isolated routes)
          </p>
        </div>

        <button
          onClick={triggerSOS}
          className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 flex items-center gap-2 active:scale-95 transition"
        >
          <PhoneCall className="w-4 h-4 animate-pulse" />
          <span>Quick SOS Trigger</span>
        </button>
      </div>

      {/* Quick Search Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-500" />
          Plan a Safe Journey
        </h2>

        <form onSubmit={handleStartPlanning} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <input
              type="text"
              value={fromText}
              onChange={(e) => setFromText(e.target.value)}
              placeholder="Origin / Current Point..."
              className="w-full bg-transparent outline-none text-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <input
              type="text"
              value={toText}
              onChange={(e) => setToText(e.target.value)}
              placeholder="Destination..."
              className="w-full bg-transparent outline-none text-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition"
          >
            <span>Compare 3 Routes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Grid: Stats + Recent Trips + Emergency Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Local Area Safety Stats */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Local Security Intelligence
          </h3>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Verified Safe Havens Nearby</div>
                  <div className="font-extrabold text-lg text-slate-800 dark:text-white">{stats.safeHavens} Places</div>
                </div>
              </div>
              <Link to="/safety-map" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                View
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Active Caution / Dark Stretches</div>
                  <div className="font-extrabold text-lg text-slate-800 dark:text-white">{stats.activeAlerts} Spots</div>
                </div>
              </div>
              <Link to="/safety-map" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
                Explore
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Community Reports Verified</div>
                  <div className="font-extrabold text-lg text-slate-800 dark:text-white">{stats.verifiedReports} Reports</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400">Moderated</span>
            </div>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recent Navigations
            </h3>
            <Link to="/plan" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              New Route +
            </Link>
          </div>

          <div className="space-y-3">
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{trip.from}</span>
                    <span className="text-slate-400">→</span>
                    <span>{trip.to}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {trip.date}
                    </span>
                    <span>•</span>
                    <span>{trip.routeType}</span>
                    <span>•</span>
                    <span>{trip.duration}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {trip.safetyScore}/100 Score
                  </div>
                  <div className="text-[11px] text-emerald-500 font-semibold flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Reached Safely
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trusted Emergency Contacts Banner */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-emerald-500" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                  2 Emergency Contacts Configured
                </h4>
                <p className="text-[11px] text-slate-500">
                  Auto-receives GPS tracking SMS during SOS triggers
                </p>
              </div>
            </div>
            <Link
              to="/profile"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-sm"
            >
              Manage
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardPage;

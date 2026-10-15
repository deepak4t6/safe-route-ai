import React, { useState } from 'react';
import { AlertTriangle, X, MapPin, Send, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { safetyAPI } from '../services/api';

const CATEGORIES = [
  { value: 'poor_lighting', label: '💡 Poor / Broken Streetlights' },
  { value: 'harassment', label: '🚫 Harassment / Eve-Teasing Spot' },
  { value: 'theft', label: '⚠️ Snatching / Theft Area' },
  { value: 'construction', label: '🚧 Blocked Road / Construction Trench' },
  { value: 'stray_dogs', label: '🐕 Aggressive Stray Animal Pack' },
  { value: 'unsafe_crowd', label: '👥 Unsafe / Hostile Crowd Loitering' },
  { value: 'police_presence', label: '👮 Active Police Presence / PCR Van' },
  { value: 'safe_haven', label: '🛡️ Verified Safe Zone (24/7 Store/Clinic)' },
];

const ReportModal = () => {
  const { isReportOpen, setIsReportOpen, currentLocation } = useTrip();
  const [category, setCategory] = useState('poor_lighting');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(3);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isReportOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Please provide a brief description of the hazard.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await safetyAPI.submitReport({
        category,
        description,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        severity: parseInt(severity, 10),
        is_anonymous: isAnonymous
      });

      if (res.data.success) {
        setSuccessMessage('Thank you! Your safety report has been submitted for community verification.');
        setTimeout(() => {
          setSuccessMessage(null);
          setDescription('');
          setIsReportOpen(false);
        }, 2000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Could not submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-slate-900 dark:text-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-lg text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <span>Report Hazard or Safe Spot</span>
          </div>
          <button
            onClick={() => setIsReportOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Report Submitted</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Location Pill */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">
                Tagged Location: <strong>{currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</strong> ({currentLocation.name})
              </span>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Description / Context
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., 3 consecutive streetlights non-functional after 8 PM, isolated dark lane..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Severity Level */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                <span>Severity Level</span>
                <span className="text-amber-500 font-extrabold">{severity} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1 - Minor Inconvenience</span>
                <span>3 - Moderate Concern</span>
                <span>5 - Critical Danger</span>
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Anonymous Reporting</div>
                  <div className="text-[11px] text-slate-400">Do not attach profile name to this report</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-900">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting report...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Safety Report</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default ReportModal;

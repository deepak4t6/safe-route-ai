import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Compass,
  ArrowRight,
  Flame,
  Clock,
  Eye,
  AlertTriangle,
  Sparkles,
  PhoneCall,
  MapPin,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useTrip } from '../context/TripContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { setCurrentLocation, setDestination } = useTrip();

  const [fromInput, setFromInput] = useState('Connaught Place Metro Gate 2');
  const [toInput, setToInput] = useState('Barakhamba Road Commercial Tower');

  const handleQuickPlan = (e) => {
    e.preventDefault();
    setCurrentLocation({
      lat: 28.6328,
      lng: 77.2195,
      latitude: 28.6328,
      longitude: 77.2195,
      name: fromInput
    });
    setDestination({
      lat: 28.6385,
      lng: 77.2240,
      latitude: 28.6385,
      longitude: 77.2240,
      name: toInput
    });
    navigate('/plan');
  };

  return (
    <div className="space-y-20 pb-20 overflow-hidden">

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 lg:pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold shadow-sm">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>AI-Powered Safety Navigation for Pedestrians & Travelers</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Reach <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">Safely</span>, Not Just Quickly.
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Standard maps only optimize for speed. <strong>Safe Route AI</strong> analyzes streetlighting,
            incident density, crowd levels, and police proximity to guide you through the most secure streets.
          </p>

          {/* Quick Route Search Box */}
          <form
            onSubmit={handleQuickPlan}
            className="mt-8 p-3 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-emerald-500/10 flex flex-col md:flex-row items-center gap-3 text-left"
          >
            <div className="flex-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <input
                type="text"
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
                placeholder="Starting Location..."
                className="w-full bg-transparent text-sm font-medium outline-none text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <input
                type="text"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                placeholder="Where to? (Destination)..."
                className="w-full bg-transparent text-sm font-medium outline-none text-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition"
            >
              <span>Find Safe Route</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Micro trust stats */}
          <div className="flex flex-wrap justify-center items-center gap-6 pt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Transparent 0–100 Safety Score
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> One-Tap SOS Dispatch
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verified 24/7 Safe Havens
            </span>
          </div>
        </div>
      </section>

      {/* Live Route Comparison Preview Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-white">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">How It Works</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">The Difference Between Fast and Safe</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Safe Route AI generates 3 dynamic alternatives so you can make informed choices before stepping out.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Safest Route Card */}
            <div className="p-6 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/80 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500 text-slate-950">
                  Recommended: Safest Route
                </span>
                <span className="text-2xl font-black text-emerald-400">89<span className="text-xs text-slate-400 font-normal">/100</span></span>
              </div>
              <h3 className="text-lg font-bold text-white">Via Main Commercial Radial Avenue</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                12% longer than shortcut, but keeps you on brightly illuminated pavements with open shops, CCTV, and a police post within 350 meters.
              </p>
              <ul className="text-xs text-emerald-300 space-y-1.5 pt-2">
                <li>✓ 85%+ streetlight coverage</li>
                <li>✓ Direct proximity to Central Police Post</li>
                <li>✓ Avoids deserted Block D alley</li>
              </ul>
              <div className="pt-2 text-xs text-slate-400 flex items-center justify-between border-t border-emerald-900">
                <span>ETA: 14 mins</span>
                <span>Distance: 1.1 km</span>
              </div>
            </div>

            {/* Fastest Shortcut Route Card */}
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-orange-500/50 shadow space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Fastest Route (Caution)
                </span>
                <span className="text-2xl font-black text-orange-400">46<span className="text-xs text-slate-400 font-normal">/100</span></span>
              </div>
              <h3 className="text-lg font-bold text-white">Via Rear Service Alley Shortcut</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Saves 2 minutes, but cuts through poorly-lit backroads with 3 recent evening harassment and dark-spot reports.
              </p>
              <ul className="text-xs text-orange-300 space-y-1.5 pt-2">
                <li>⚠️ Broken streetlights on 250m stretch</li>
                <li>⚠️ Low pedestrian footfall after 8:30 PM</li>
                <li>⚠️ 1.4km away from nearest police assistance</li>
              </ul>
              <div className="pt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-700">
                <span>ETA: 11 mins</span>
                <span>Distance: 920 m</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/plan"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
            >
              <span>Try Safe Route Planner Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Built for Real-World Urban Safety
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            A comprehensive safety ecosystem combining crowdsourcing, computer vision lighting metrics, and emergency response.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-5">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Transparent Risk Engine</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We never use a black box. Our AI shows exactly why a route scored 88 vs 52, breaking down lighting, police posts, road width, and historical incident logs.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-5">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">One-Tap Emergency SOS</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              In danger? Trigger SOS within one tap. We immediately notify your trusted contacts with a live GPS tracking URL and locate the nearest police station.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-500 flex items-center justify-center mb-5">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Community Heatmap</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Citizens and night workers report broken streetlights, harassment spots, and safe havens. Verified reports continuously update the routing graph.
            </p>
          </div>
        </div>
      </section>

      {/* Target Audiences */}
      <section className="bg-slate-100 dark:bg-slate-900/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Designed for Anyone Navigating the City
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Students', icon: '🎓' },
              { label: 'Women Safety', icon: '👩' },
              { label: 'Night Shift Workers', icon: '🌙' },
              { label: 'Travelers', icon: '🎒' },
              { label: 'Cyclists & Walkers', icon: '🚲' },
              { label: 'Elderly Citizens', icon: '🚶' }
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">Never Walk Unsure Again.</h2>
          <p className="text-emerald-100 max-w-xl mx-auto text-sm sm:text-base">
            Start planning your trip today. Safe Route AI is completely free, mobile-friendly, and privacy-respecting.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/plan"
              className="px-8 py-3.5 rounded-2xl bg-white text-emerald-800 font-extrabold text-sm shadow hover:bg-emerald-50 transition active:scale-95"
            >
              Open Safe Route Planner
            </Link>
            <Link
              to="/safety-map"
              className="px-8 py-3.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-extrabold text-sm border border-emerald-400/30 transition"
            >
              Explore Safety Heatmap
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;

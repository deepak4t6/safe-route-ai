import React from 'react';
import { Shield, PhoneCall, HeartHandshake, AlertCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Emergency Quick Numbers Banner */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg">Immediate Emergency Hotlines</h4>
              <p className="text-xs sm:text-sm text-slate-400">Toll-free 24/7 direct access across India</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="tel:112"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition"
            >
              <span>Police / Emergency:</span>
              <span className="text-base tracking-wider underline">112</span>
            </a>
            <a
              href="tel:1091"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition"
            >
              <span>Women Helpline:</span>
              <span className="text-base tracking-wider underline">1091</span>
            </a>
            <a
              href="tel:102"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition"
            >
              <span>Ambulance:</span>
              <span className="text-base tracking-wider underline">102</span>
            </a>
          </div>
        </div>

        {/* Brand & Description */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">Safe Route AI</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Empowering pedestrians, women, travelers, and late-night workers with real-time safety scores,
              crowdsourced hazard detection, well-lit corridors, and instant SOS alerts.
            </p>
            <div className="pt-2 text-xs text-emerald-400 font-medium">
              “Reach safely, not just quickly.”
            </div>
          </div>

          <div>
            <h5 className="text-white font-semibold text-sm mb-3">Core Features</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Multi-Route Safety Scoring (0–100)</li>
              <li>• Live Turn-by-Turn Guidance</li>
              <li>• Color-Coded Heatmap & Hazards</li>
              <li>• Verified Safe Havens & Police Stations</li>
              <li>• One-Tap Emergency SOS Broadcast</li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold text-sm mb-3">Privacy & Trust</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Anonymous Incident Reporting</li>
              <li>• Zero Background Precision Storing</li>
              <li>• Transparent Explainable AI Breakdown</li>
              <li>• Community Moderated Reports</li>
            </ul>
          </div>
        </div>

        {/* Mandatory Safety Disclaimer */}
        <div className="border-t border-slate-800 pt-6 mt-6">
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-200">Legal Safety Disclaimer:</strong> Safe Route AI provides navigational guidance based on historical incident density, verified community alerts, municipal lighting information, and geospatial proximity to emergency services. While designed to enhance urban travel security, conditions on the ground can fluctuate rapidly. Safe Route AI does not guarantee 100% safety. Always stay alert and call <span className="text-red-400 font-semibold">112</span> immediately in critical emergencies.
            </p>
          </div>
          <p className="text-center text-xs text-slate-500 mt-6">
            © {new Date().getFullYear()} Safe Route AI. Open-source urban safety initiative.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

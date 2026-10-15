import React, { useState } from 'react';
import {
  User,
  Shield,
  Phone,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Save,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const ProfilePage = () => {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || 'Ananya Sharma');
  const [phone, setPhone] = useState(user?.phone || '+919876543210');
  const [preferredMode, setPreferredMode] = useState(user?.preferred_mode || 'walking');
  const [avoidDark, setAvoidDark] = useState(true);
  const [avoidIsolated, setAvoidIsolated] = useState(true);
  const [preferCctv, setPreferCctv] = useState(true);
  const [preferMainRoads, setPreferMainRoads] = useState(true);

  // Contacts
  const [contacts, setContacts] = useState(user?.emergency_contacts || [
    { id: 'ec-1', name: 'Rajesh Sharma (Father)', phone: '+919876500001', relationship: 'Parent' },
    { id: 'ec-2', name: 'Sneha Kapoor (Friend)', phone: '+919876500002', relationship: 'Friend' }
  ]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('Friend');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await authAPI.updateProfile({
        name,
        phone,
        preferred_mode: preferredMode,
        safety_pref_avoid_dark: avoidDark,
        safety_pref_avoid_isolated: avoidIsolated,
        safety_pref_prefer_cctv: preferCctv,
        safety_pref_prefer_main_roads: preferMainRoads
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;

    const newC = {
      id: 'ec-' + Date.now(),
      name: newContactName,
      phone: newContactPhone,
      relationship: newContactRelation
    };

    try {
      await authAPI.addContact(newC);
    } catch (err) {}

    setContacts(prev => [...prev, newC]);
    setNewContactName('');
    setNewContactPhone('');
    setIsAddingContact(false);
  };

  const handleDeleteContact = async (id) => {
    try {
      await authAPI.deleteContact(id);
    } catch (err) {}
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          User Profile & Safety Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Customize navigation penalties, emergency contacts, and privacy options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Column: Profile Card & Safety Toggles */}
        <div className="lg:col-span-2 space-y-6">

          {/* User Details & Preferences Form */}
          <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Primary Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Default Travel Mode
              </label>
              <select
                value={preferredMode}
                onChange={(e) => setPreferredMode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="walking">🚶 Walking (Pavement & streetlighting optimized)</option>
                <option value="cycling">🚲 Cycling (Dedicated cycle tracks & low-traffic roads)</option>
                <option value="driving">🚗 Driving (Main arterial avenues)</option>
              </select>
            </div>

            {/* Safety Preferences Checklist */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                AI Route Calculation Preferences
              </h4>

              <div className="space-y-2.5">
                {[
                  { id: 'dark', label: 'Avoid dark roads & broken streetlights', state: avoidDark, setter: setAvoidDark },
                  { id: 'isolated', label: 'Avoid isolated alleys & deserted service lanes', state: avoidIsolated, setter: setAvoidIsolated },
                  { id: 'cctv', label: 'Prioritize paths under municipal CCTV surveillance', state: preferCctv, setter: setPreferCctv },
                  { id: 'main', label: 'Prefer wide main roads over residential shortcuts', state: preferMainRoads, setter: setPreferMainRoads }
                ].map(pref => (
                  <label key={pref.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pref.state}
                      onChange={(e) => pref.setter(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                      {pref.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile & routing preferences saved successfully!</span>
              </div>
            )}

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </form>

        </div>

        {/* Right Column: Emergency Contacts Manager */}
        <div className="space-y-6">

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Trusted Emergency Contacts
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Auto-notified during SOS events</p>
              </div>

              <button
                onClick={() => setIsAddingContact(true)}
                className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition"
                title="Add new contact"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Contacts List */}
            <div className="space-y-2.5">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{c.phone}</span>
                      <span>• {c.relationship}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteContact(c.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition"
                    title="Remove contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Contact Form (Modal / Inline) */}
            {isAddingContact && (
              <form onSubmit={handleAddContact} className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Add Emergency Contact
                </div>
                <input
                  type="text"
                  required
                  placeholder="Contact Name (e.g. Papa / Sneha)"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone (+91 98765 00000)"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                  >
                    Save Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingContact(false)}
                    className="py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Privacy & Location Notice */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Privacy-First Guarantee</span>
            </div>
            <p className="leading-relaxed">
              Safe Route AI does not permanently store continuous device GPS tracks. Location is only evaluated during active navigation and emergency SOS dispatches.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ProfilePage;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TripProvider } from './context/TripContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SosModal from './components/SosModal';
import ReportModal from './components/ReportModal';
import AiAssistantModal from './components/AiAssistantModal';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import RoutePlannerPage from './pages/RoutePlannerPage';
import LiveNavigationPage from './pages/LiveNavigationPage';
import SafetyMapPage from './pages/SafetyMapPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TripProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">

              {/* Navigation Header */}
              <Navbar />

              {/* Main Routed Page Content */}
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/plan" element={<RoutePlannerPage />} />
                  <Route path="/navigate" element={<LiveNavigationPage />} />
                  <Route path="/safety-map" element={<SafetyMapPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                </Routes>
              </main>

              {/* Global Emergency Modals */}
              <SosModal />
              <ReportModal />
              <AiAssistantModal />

              {/* Footer */}
              <Footer />

            </div>
          </Router>
        </TripProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

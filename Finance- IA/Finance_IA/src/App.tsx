import { useState, useEffect } from "react";
import { UserProfile } from "./types";
import ThemeToggle from "./components/ThemeToggle";
import HomePage from "./pages/client/HomePage";
import OnboardingPage from "./pages/client/OnboardingPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PortfolioPage from "./pages/client/PortfolioPage";
import OpenFinancePage from "./pages/client/OpenFinancePage";
import AuraCentral from "./components/AuraCentral";
import MainLayout from "./layouts/MainLayout";

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(true);
  
  // App routing/view state machine: "home" | "onboarding" | "dashboard" | "portfolio" | "analise" | "openfinance"
  const [currentView, setCurrentView] = useState<"home" | "onboarding" | "dashboard" | "portfolio" | "analise" | "openfinance">("home");
  
  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Sync dark class on document element just in case
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Handle onboarding completion
  const handleCompleteOnboarding = (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentView("dashboard");
  };

  // Direct login simulator (bypassing onboarding with an executive preset)
  const handleDirectLogin = () => {
    const defaultProfile: UserProfile = {
      name: "Investidor Premium",
      goals: "Multiplicar Patrimônio",
      riskPsychology: "Não faria nada",
      knowledgeLevel: "Intermediário",
      calculatedProfile: "Moderado Estratégico",
      balance: 450000
    };
    setUserProfile(defaultProfile);
    setCurrentView("dashboard");
  };

  // Logout/Reset
  const handleLogout = () => {
    setUserProfile(null);
    setCurrentView("home");
  };

  // Background color helper
  const rootBgClass = isDark ? "bg-black text-[#f8fafc]" : "bg-slate-50 text-slate-900";

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${rootBgClass}`}>
      {/* 1. PUBLIC VIEW - HOME LANDING */}
      {currentView === "home" && (
        <div className="animate-fade-in relative overflow-hidden min-h-screen flex flex-col">
          {/* Subtle cosmic blur gradients in background */}
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-[#CD9C20]/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-full h-[500px] bg-gradient-to-tl from-[#F5CB5C]/5 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-end">
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
          </div>

          <HomePage
            isDark={isDark}
            onStartOnboarding={() => setCurrentView("onboarding")}
            onDirectLogin={handleDirectLogin}
          />
        </div>
      )}

      {/* 2. PUBLIC VIEW - RISK ONBOARDING WIZARD */}
      {currentView === "onboarding" && (
        <div className="animate-fade-in py-6">
          <div className="max-w-2xl mx-auto px-4 flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                A
              </div>
              <span className={`font-bold text-sm ${isDark ? "text-slate-50" : "text-slate-900"}`}>Aura IA Wizard</span>
            </div>
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
          </div>

          <OnboardingPage
            isDark={isDark}
            onCompleteOnboarding={handleCompleteOnboarding}
            onBackToHome={() => setCurrentView("home")}
          />
        </div>
      )}

      {/* 3. LOGGED-IN VIEW - FULL PORTFOLIO APP AREA */}
      {(currentView === "dashboard" || currentView === "portfolio" || currentView === "analise" || currentView === "openfinance") && userProfile && (
        <MainLayout 
          userProfile={userProfile}
          currentView={currentView}
          setCurrentView={setCurrentView}
          isDark={isDark}
          setIsDark={setIsDark}
          onLogout={handleLogout}
        >
          {currentView === "dashboard" && (
            <AdminDashboard
              isDark={isDark}
              profile={userProfile}
              onNavigateToPortfolio={() => setCurrentView("portfolio")}
              onNavigateToReports={() => setCurrentView("analise")}
            />
          )}

          {currentView === "portfolio" && (
            <PortfolioPage
              isDark={isDark}
              profile={userProfile}
            />
          )}

          {currentView === "analise" && (
            <AuraCentral
              isDark={isDark}
              profile={userProfile}
            />
          )}

          {currentView === "openfinance" && (
            <OpenFinancePage
              isDark={isDark}
              profile={userProfile}
            />
          )}
        </MainLayout>
      )}
    </div>
  );
}

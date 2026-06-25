import React, { useState } from "react";
import { UserProfile } from "../types";
import ThemeToggle from "../components/ThemeToggle";
import {
  LayoutDashboard,
  PieChart as ChartIcon,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Lock,
  Sparkles,
  Landmark
} from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
  userProfile: UserProfile;
  currentView: "dashboard" | "portfolio" | "analise" | "openfinance";
  setCurrentView: (view: "dashboard" | "portfolio" | "analise" | "openfinance") => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onLogout: () => void;
}

export default function MainLayout({
  children,
  userProfile,
  currentView,
  setCurrentView,
  isDark,
  setIsDark,
  onLogout
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const cardBgClass = isDark ? "bg-[#0a0a0a] border-[#CD9C20]/20" : "bg-white border-[#CD9C20]/25 shadow-sm";

  return (
    <div className="flex min-h-screen relative">
      {/* MOBILE NAVBAR TOGGLER */}
      <div className={`lg:hidden flex items-center justify-between w-full p-4 border-b ${cardBgClass} absolute top-0 left-0 right-0 z-40`}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#CD9C20] to-[#F5CB5C] flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <span className="font-bold text-sm">Aura Investimentos</span>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION - FIXED LEFT */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:z-30 w-72 border-r flex flex-col justify-between transition-transform duration-300 transform lg:translate-x-0 ${cardBgClass} ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:pt-0 pt-16`}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-5 border-b border-opacity-10 border-slate-500">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#CD9C20] to-[#F5CB5C] flex items-center justify-center text-white font-bold text-md shadow-md">
              A
            </div>
            <div>
              <h4 className="font-bold tracking-tight text-md font-serif">Aura IA Premium</h4>
              <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Member Sandbox</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-550 dark:text-slate-500 font-mono block uppercase">PERFIL ATIVO</span>
              <p className="font-extrabold text-xs text-slate-700 dark:text-amber-100">{userProfile.calculatedProfile}</p>
            </div>
            <div className="p-1.5 rounded-lg bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C]">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          <nav className="space-y-1.5 pt-4">
            <button
              onClick={() => { setCurrentView("dashboard"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "dashboard"
                  ? "bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C] border border-[#CD9C20]/25 font-extrabold"
                  : "text-slate-500 hover:bg-[#CD9C20]/10 dark:text-slate-300 dark:hover:bg-[#CD9C20]/10"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Visão Geral</span>
            </button>

            <button
              onClick={() => { setCurrentView("portfolio"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "portfolio"
                  ? "bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C] border border-[#CD9C20]/25 font-extrabold"
                  : "text-slate-500 hover:bg-[#CD9C20]/10 dark:text-slate-300 dark:hover:bg-[#CD9C20]/10"
              }`}
            >
              <ChartIcon className="h-4 w-4" />
              <span>Carteira Ideal</span>
            </button>

            <button
              onClick={() => { setCurrentView("analise"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "analise"
                  ? "bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C] border border-[#CD9C20]/25 font-extrabold"
                  : "text-slate-500 hover:bg-[#CD9C20]/10 dark:text-slate-300 dark:hover:bg-[#CD9C20]/10"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Central do Agente</span>
            </button>

            <button
              onClick={() => { setCurrentView("openfinance"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "openfinance"
                  ? "bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C] border border-[#CD9C20]/25 font-extrabold"
                  : "text-slate-500 hover:bg-[#CD9C20]/10 dark:text-slate-300 dark:hover:bg-[#CD9C20]/10"
              }`}
            >
              <Landmark className="h-4 w-4" />
              <span>Open Finance</span>
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-opacity-10 border-slate-500 space-y-4">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#CD9C20]/5 text-[#CD9C20] dark:text-[#F5CB5C] text-xs border border-[#CD9C20]/15">
            <Lock className="h-4.5 w-4.5" />
            <span className="font-mono text-[9px] leading-tight tracking-wide">SECURE BY DESIGN ACTIVE</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
            <button
              onClick={() => {
                onLogout();
                setSidebarOpen(false);
              }}
              className="p-2 w-max rounded-xl border border-transparent text-slate-500 hover:text-red-400 hover:bg-red-500/5 cursor-pointer transition flex items-center gap-1.5 text-xs font-semibold"
              title="Sair da carteira"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER CONTENT */}
      <main className="flex-1 lg:ml-72 p-6 md:p-8 pt-20 lg:pt-8 min-h-screen relative overflow-x-hidden">
        <div className="absolute top-0 right-0 w-full h-[600px] bg-gradient-to-bl from-[#CD9C20]/5 via-transparent to-transparent pointer-events-none" />
        {children}
      </main>
    </div>
  );
}

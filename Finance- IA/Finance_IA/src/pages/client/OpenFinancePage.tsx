import React, { useState } from "react";
import { UserProfile } from "../../types";
import { 
  Building2, 
  Lock, 
  ShieldCheck, 
  RefreshCcw, 
  ArrowRight,
  TrendingUp,
  Activity
} from "lucide-react";

interface OpenFinancePageProps {
  isDark: boolean;
  profile: UserProfile;
}

export default function OpenFinancePage({ isDark, profile }: OpenFinancePageProps) {
  const [syncStatus, setSyncStatus] = useState<"idle" | "connecting" | "success">("idle");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const handleConnect = (bank: string) => {
    setSelectedBank(bank);
    setSyncStatus("connecting");
    setTimeout(() => {
      setSyncStatus("success");
    }, 3000);
  };

  const cardBgClass = isDark ? "bg-[#111111] border-[#CD9C20]/20" : "bg-white border-[#CD9C20]/25 shadow-sm";

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* HEADER */}
      <div>
        <h4 className="text-[#CD9C20] dark:text-[#F5CB5C] text-xs font-bold uppercase tracking-widest font-mono mb-2">
          Open Finance Seguro
        </h4>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-serif mb-3">
          Sincronização de Contas
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-sm leading-relaxed">
          Conecte sua corretora atual de forma totalmente segura. A IA analisará seus ativos existentes, sugerirá rebalanceamentos imediatos e fará o monitoramento contínuo da sua carteira, tudo dentro de um sandbox matemático isolado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COL: BANK LIST */}
        <div className={`lg:col-span-1 p-6 rounded-2xl border ${cardBgClass} flex flex-col`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide">Corretoras</h2>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>

          <div className="space-y-3 flex-1">
            {[
              { id: "xp", name: "XP Investimentos", logo: "X", color: "bg-slate-900", text: "text-white" },
              { id: "btg", name: "BTG Pactual", logo: "B", color: "bg-blue-900", text: "text-white" },
              { id: "nu", name: "NuInvest", logo: "N", color: "bg-purple-800", text: "text-white" },
              { id: "rico", name: "Rico", logo: "R", color: "bg-orange-600", text: "text-white" },
            ].map((bank) => (
              <button
                key={bank.id}
                onClick={() => syncStatus === "idle" && handleConnect(bank.id)}
                disabled={syncStatus !== "idle"}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  selectedBank === bank.id
                    ? isDark 
                      ? "border-[#CD9C20] bg-[#CD9C20]/10" 
                      : "border-[#CD9C20] bg-amber-50"
                    : isDark
                    ? "border-slate-800 hover:border-slate-700 bg-black"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50"
                } ${syncStatus !== "idle" && selectedBank !== bank.id ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${bank.color} ${bank.text}`}>
                    {bank.logo}
                  </div>
                  <span className="font-semibold text-sm">{bank.name}</span>
                </div>
                {selectedBank === bank.id && syncStatus === "connecting" && (
                  <RefreshCcw className="h-4 w-4 text-[#CD9C20] animate-spin" />
                )}
                {selectedBank === bank.id && syncStatus === "success" && (
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                )}
                {selectedBank !== bank.id && syncStatus === "idle" && (
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
              Conexão read-only. A Aura IA não tem permissão para realizar movimentações. Criptografia AES-256 ativa.
            </p>
          </div>
        </div>

        {/* RIGHT COL: AI ANALYSIS AND MONITORING */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${cardBgClass} relative overflow-hidden flex flex-col`}>
          {syncStatus === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 backdrop-blur-sm bg-white/40 dark:bg-black/40">
              <Lock className="h-8 w-8 text-slate-400 mb-3" />
              <h3 className="text-lg font-bold">Aguardando Conexão</h3>
              <p className="text-sm text-slate-500">Selecione uma corretora para importar sua carteira.</p>
            </div>
          )}

          <div className={`flex-1 transition-opacity duration-500 ${syncStatus === "idle" ? "opacity-20 blur-sm pointer-events-none" : "opacity-100"}`}>
            {syncStatus === "connecting" && (
              <div className="h-full flex flex-col items-center justify-center animate-pulse">
                <RefreshCcw className="h-10 w-10 text-[#CD9C20] animate-spin mb-4" />
                <h3 className="text-lg font-bold font-serif mb-1">Processando Tokens de Segurança...</h3>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Estabelecendo Handshake SSL</p>
              </div>
            )}

            {syncStatus === "success" && (
              <div className="animate-fade-in space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-lg">Carteira Importada (XP)</h3>
                    <p className="text-xs text-slate-500">Última sincronização: Agora</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black font-serif text-[#CD9C20] dark:text-[#F5CB5C]">R$ {profile.balance.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-emerald-500 font-bold flex items-center justify-end gap-1">
                      <TrendingUp className="h-3 w-3" /> +2.4% Hoje
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Monitoramento de Ativos Atuais</h4>
                  
                  {/* Mock Imported Assets */}
                  {[
                    { ticker: "PETR4", name: "Petrobras", val: 45000, perf: "+1.2%", alert: "Manter posição. Preço alvo: R$ 42.00", alertColor: "text-emerald-600" },
                    { ticker: "VALE3", name: "Vale", val: 32000, perf: "-0.5%", alert: "Atenção: Queda no minério de ferro. Sugestão de redução.", alertColor: "text-amber-500" },
                    { ticker: "WEGE3", name: "WEG", val: 18000, perf: "+3.4%", alert: "Excelente performance. Mantém forte tese de longo prazo.", alertColor: "text-emerald-600" },
                  ].map((asset, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${isDark ? "bg-[#161616] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono px-2 py-0.5 rounded text-xs bg-slate-200 dark:bg-slate-800">{asset.ticker}</span>
                          <span className="text-sm font-semibold">{asset.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">R$ {asset.val.toLocaleString('pt-BR')}</span>
                          <span className={`block text-xs font-bold ${asset.perf.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{asset.perf}</span>
                        </div>
                      </div>
                      <div className={`text-xs mt-2 p-2 rounded-lg bg-white dark:bg-black border ${isDark ? "border-slate-800" : "border-slate-200"} flex items-start gap-2`}>
                        <Activity className={`h-4 w-4 mt-0.5 shrink-0 ${asset.alertColor}`} />
                        <span className="font-mono">{asset.alert}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

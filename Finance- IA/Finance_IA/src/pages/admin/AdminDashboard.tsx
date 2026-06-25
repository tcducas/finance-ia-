import { UserProfile } from "../types";
import { Shield, TrendingUp, Sparkles, BarChart3, ChevronRight, Lock, EyeOff, CheckCircle, Database } from "lucide-react";

interface DashboardViewProps {
  isDark: boolean;
  profile: UserProfile;
  onNavigateToPortfolio: () => void;
  onNavigateToReports: () => void;
}

export default function DashboardView({ isDark, profile, onNavigateToPortfolio, onNavigateToReports }: DashboardViewProps) {
  // Constants for Dashboard simulation based on profile
  const calculatedProfileName = profile.calculatedProfile;

  // Average yields based on profile
  let estimatedMonthlyYieldPercent = 0.54; // Conservador: ~0.54% monthly
  let protectionScore = 95;                // Conservador: High protection
  let advice = "Sua carteira foi focada em blindar seu patrimônio contra variações inflacionárias e oscilações diárias bruscas.";

  if (calculatedProfileName === "Moderado Estratégico") {
    estimatedMonthlyYieldPercent = 0.94; // Moderado: ~0.94% monthly
    protectionScore = 82;
    advice = "Buscamos o equilíbrio matemático ótimo entre rendimento real e proteção estruturada utilizando indexadores diversificados.";
  } else if (calculatedProfileName === "Arrojado Dinâmico") {
    estimatedMonthlyYieldPercent = 1.28; // Arrojado: ~1.28% monthly
    protectionScore = 60;
    advice = "Exposição tática a ativos de renda variável e globais calibrados com modelagem quantitativa para maximizar o ganho real de capital.";
  }

  const estimatedMonthlyRealCurrencyValue = Math.round(profile.balance * (estimatedMonthlyYieldPercent / 100));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner de Boas-Vindas */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#CD9C20]/15 via-[#0D1527] to-[#CD9C20]/10 border border-[#CD9C20]/30 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <Sparkles className="h-28 w-28 text-[#F5CB5C] rotate-12" />
        </div>
        
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C] border border-[#CD9C20]/30 uppercase tracking-widest">
            <Sparkles className="h-3 w-3 animate-spin text-[#F5CB5C]" /> IA Ativa • Conectado como {profile.name}
          </div>

          <h3 className={`text-2xl md:text-3.5xl font-extrabold tracking-tight font-serif ${isDark ? "text-slate-50" : "text-[#1c1917]"}`}>
            Olá, {profile.name}! Olhando o cenário, seu perfil atual é <span className="bg-gradient-to-r from-[#CD9C20] to-[#F5CB5C] bg-clip-text text-transparent italic">{calculatedProfileName}</span>.
          </h3>

          <p className="text-sm text-slate-400 leading-relaxed">
            {advice} Com base nessas premissas, a Aura organizou sua alocação de ativos em subcomitês ideais e simulou o rendimento estimado para sua carteira.
          </p>

          <div className="pt-2">
            <button
              id="dash-quick-portfolio"
              onClick={onNavigateToPortfolio}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-[#CD9C20] to-[#F5CB5C] rounded-xl hover:scale-105 transition-all duration-300 shadow-md cursor-pointer gold-glow font-mono uppercase tracking-wider"
            >
              Visualizar Minha Carteira Ideal
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Resumo de Patrimônio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Saldo Total Simulado */}
        <div className={`p-6 rounded-2.5xl border relative overflow-hidden group shadow-lg transition-all duration-300 ${
          isDark ? "bg-[#0a0a0a] border-[#CD9C20]/25" : "bg-white border-[#CD9C20]/30 shadow-sm"
        }`}>
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patrimônio Simulado</p>
            <div className={`p-2 rounded-xl border ${isDark ? "bg-[#030611] border-[#CD9C20]/20" : "bg-stone-50 border-stone-200"}`}>
              <Database className="h-4 w-4 text-[#CD9C20] dark:text-[#F5CB5C]" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500 font-mono">Saldo Sob Consulta</p>
            <h4 className={`text-2xl font-black font-mono tracking-tight ${isDark ? "text-slate-50" : "text-stone-900"}`}>
              R$ {profile.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
          </div>
          <p className="text-[10px] text-slate-500 mt-4 border-t border-opacity-10 border-slate-500 pt-3 flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-[#CD9C20] dark:text-[#F5CB5C]" /> Ativo para simulação matemática
          </p>
        </div>

        {/* Card 2: Rendimento Mensal Médio */}
        <div className={`p-6 rounded-2.5xl border relative overflow-hidden group shadow-lg transition-all duration-300 ${
          isDark ? "bg-[#0a0a0a] border-[#CD9C20]/25" : "bg-white border-[#CD9C20]/30 shadow-sm"
        }`}>
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rendimento Médio Estimado</p>
            <div className={`p-2 rounded-xl border ${isDark ? "bg-[#030611] border-[#CD9C20]/20" : "bg-stone-50 border-stone-200"}`}>
              <TrendingUp className="h-4 w-4 text-[#CD9C20] dark:text-[#F5CB5C]" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500 font-mono">+{estimatedMonthlyYieldPercent}% ao mês</p>
            <h4 className="text-2xl font-black font-mono tracking-tight text-[#CD9C20] dark:text-[#F5CB5C]">
              +R$ {estimatedMonthlyRealCurrencyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
          </div>
          <p className="text-[10px] text-slate-500 mt-4 border-t border-opacity-10 border-slate-500 pt-3">
            Anualizado: ~{(estimatedMonthlyYieldPercent * 12).toFixed(1)}% líquidos recomendados
          </p>
        </div>

        {/* Card 3: Nível de Proteção */}
        <div className={`p-6 rounded-2.5xl border relative overflow-hidden group shadow-lg transition-all duration-300 ${
          isDark ? "bg-[#0a0a0a] border-[#CD9C20]/25" : "bg-white border-[#CD9C20]/30 shadow-sm"
        }`}>
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Índice Resiliência de IA</p>
            <div className={`p-2 rounded-xl border ${isDark ? "bg-[#030611] border-[#CD9C20]/20" : "bg-stone-50 border-stone-200"}`}>
              <Shield className="h-4 w-4 text-[#CD9C20] dark:text-[#F5CB5C]" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500 font-mono">Fadiga à crise de mercado</p>
            <div className="flex items-baseline gap-2">
              <h4 className={`text-3xl font-black font-mono tracking-tight ${isDark ? "text-slate-50" : "text-stone-900"}`}>
                {protectionScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </h4>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4 border-t border-opacity-10 border-slate-500 pt-3">
            Grau elevado baseado em Swaps e indexadores IPCA+
          </p>
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <section className="space-y-4">
        <h4 className={`text-lg font-bold font-serif ${isDark ? "text-slate-200" : "text-stone-850"}`}>Atalhos e Ações Rápidas</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            id="dash-quick-allocation"
            onClick={onNavigateToPortfolio}
            className={`p-6 rounded-2xl border text-left flex items-start justify-between hover:scale-[1.01] transition-all duration-300 cursor-pointer ${
              isDark ? "bg-[#0a0a0a] border-[#CD9C20]/20 hover:border-[#CD9C20]/45" : "bg-white border-[#CD9C20]/25 shadow-sm hover:border-[#CD9C20]/50"
            }`}
          >
            <div className="space-y-2">
              <span className="p-2 w-max inline-block rounded-lg bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C] mb-2">
                <BarChart3 className="h-5 w-5" />
              </span>
              <h5 className={`font-bold text-base font-serif ${isDark ? "text-slate-50" : "text-stone-900"}`}>Minha Carteira Ideal</h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Explore a divisão minuciosa dos ativos selecionados, examine as teses individuais da IA para cada um e realize simulações históricas de estresses financeiros.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 mt-1" />
          </button>

          <button
            id="dash-quick-reports"
            onClick={onNavigateToReports}
            className={`p-6 rounded-2xl border text-left flex items-start justify-between hover:scale-[1.01] transition-all duration-300 cursor-pointer ${
              isDark ? "bg-[#0a0a0a] border-[#CD9C20]/20 hover:border-[#CD9C20]/45" : "bg-white border-[#CD9C20]/25 shadow-sm hover:border-[#CD9C20]/50"
            }`}
          >
            <div className="space-y-2">
              <span className="p-2 w-max inline-block rounded-lg bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C] mb-2">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </span>
              <h5 className={`font-bold text-base font-serif ${isDark ? "text-slate-50" : "text-stone-900"}`}>Central do Agente Financeiro</h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Converse diretamente com o Consultor Aura, acesse relatórios de mercado em tempo real e embase suas decisões sob absoluto rigor científico de conformidade.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 mt-1" />
          </button>
        </div>
      </section>

      {/* Security Demonstration Box: "Security by Design Insights" */}
      <section className={`p-6 rounded-2.5xl border ${
        isDark ? "bg-[#0a0a0a]/50 border-[#CD9C20]/15" : "bg-slate-50/65 border-[#CD9C20]/25 shadow-sm"
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C]">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h5 className={`font-bold text-sm uppercase tracking-wide font-serif ${isDark ? "text-[#F5CB5C]" : "text-[#CD9C20]"}`} id="label-security-by-design-insights">
              Security by Design: Fluxo de Governança Ativo
            </h5>
            <p className="text-[10px] text-slate-500 font-mono">CONEXÃO LOCAL CRIPTOGRAFADA • BACKEND PROXY GATEWAY</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className={`p-4 rounded-xl border space-y-2 ${isDark ? "bg-[#030611] border-[#CD9C20]/20" : "bg-white border-stone-200"}`}>
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <EyeOff className="h-3 w-3 text-rose-400" /> Mascaramento LGPD (Anonymization Pipes)
            </p>
            <div className="text-slate-500 text-[11px] leading-relaxed space-y-1">
              <div><strong className="text-slate-400">Identidade Real:</strong> {profile.name}</div>
              <div><strong className="text-slate-400">Identidade Enviada à IA:</strong> {"{{USER_FIRST_NAME}}"}</div>
              <div><strong className="text-slate-400">Patrimônio Real:</strong> R$ {profile.balance.toLocaleString('pt-BR')}</div>
              <div><strong className="text-slate-400">Patrimônio Enviado à IA:</strong> {"{{TOTAL_BALANCE}}"}</div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border space-y-2 ${isDark ? "bg-[#030611] border-[#CD9C20]/20" : "bg-white border-stone-200"}`}>
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-[#CD9C20] dark:text-[#F5CB5C]" /> Blindagem de Prompt Injection & Sandbox Execution
            </p>
            <div className="text-slate-500 text-[11px] leading-relaxed space-y-1">
              <div><strong className="text-slate-400">Filtros de Entrada (CVS/Guard):</strong> Ativo</div>
              <div><strong className="text-slate-400">Executores de Fórmula (Sandbox):</strong> Servidor Isolado</div>
              <div><strong className="text-slate-400">Token JWT de Autenticação:</strong> Padrão de Mercado Encriptado</div>
              <div className="text-[#CD9C20] dark:text-[#F5CB5C] text-[10px] flex items-center gap-1 mt-1 font-bold">
                <CheckCircle className="h-3.5 w-3.5" /> NORMAS CVM & LGPD RIGOROSAMENTE CUMPRIDAS
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

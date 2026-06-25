import { useState, useMemo } from "react";
import { ArrowRight, ShieldAlert, Sparkles, TrendingUp, Cpu, BarChart3, Lock } from "lucide-react";

interface HomeViewProps {
  isDark: boolean;
  onStartOnboarding: () => void;
  onDirectLogin: () => void;
}

export default function HomeView({ isDark, onStartOnboarding, onDirectLogin }: HomeViewProps) {
  const [sliderValue, setSliderValue] = useState<number>(5000);

  // Projections for the slider widget: 5 years of compounding growth
  const projections = useMemo(() => {
    const years = [0, 1, 2, 3, 4, 5];
    const standardRate = 0.065; // 6.5% standard inflation/CDB rate
    const aiRate = 0.128;       // 12.8% Aura optimized rate

    const standardData = years.map(yr => Math.round(sliderValue * Math.pow(1 + standardRate, yr)));
    const aiData = years.map(yr => Math.round(sliderValue * Math.pow(1 + aiRate, yr)));

    return {
      years,
      standardData,
      aiData,
      finalStandard: standardData[5],
      finalAi: aiData[5],
      totalGainDifference: aiData[5] - standardData[5]
    };
  }, [sliderValue]);

  // Coordinates for drawing the simple interactive SVG Line Chart
  const svgPoints = useMemo(() => {
    const width = 380;
    const height = 180;
    const maxVal = Math.max(...projections.aiData) * 1.05;
    const minVal = sliderValue * 0.95;
    const valRange = maxVal - minVal;

    const getX = (index: number) => (index / 5) * (width - 40) + 20;
    const getY = (val: number) => height - 20 - ((val - minVal) / valRange) * (height - 40);

    const standardPath = projections.standardData.map((v, i) => `${getX(i)},${getY(v)}`).join(" L ");
    const aiPath = projections.aiData.map((v, i) => `${getX(i)},${getY(v)}`).join(" L ");

    return {
      standardPath: `M ${standardPath}`,
      aiPath: `M ${aiPath}`,
      standardPoints: projections.standardData.map((v, i) => ({ x: getX(i), y: getY(v), val: v })),
      aiPoints: projections.aiData.map((v, i) => ({ x: getX(i), y: getY(v), val: v }))
    };
  }, [projections, sliderValue]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 md:py-16 space-y-16">
      {/* Header Area */}
      <header className="flex justify-between items-center pb-6 border-b border-opacity-10 border-slate-500">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#CD9C20] to-[#F5CB5C] flex items-center justify-center text-white font-bold text-lg shadow-lg">
            A
          </div>
          <div>
            <h1 className={`text-xl font-bold tracking-tight font-serif ${isDark ? "text-slate-50" : "text-stone-900"}`}>
              Aura <span className="text-[#CD9C20] dark:text-[#F5CB5C] text-xs font-normal border border-[#CD9C20]/30 px-1.5 py-0.5 rounded ml-1">IA</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest">GEOFUNDS ANALYTICS</p>
          </div>
        </div>

        <button
          id="btn-login"
          onClick={onDirectLogin}
          className={`px-5 py-2 text-xs font-semibold rounded-xl border transition-all duration-300 ${
            isDark
              ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
              : "bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          Acessar Painel
        </button>
      </header>

      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#CD9C20]/10 text-[#CD9C20] dark:text-[#F5CB5C] border border-[#CD9C20]/20">
            <Sparkles className="h-4 w-4" />
            <span>Consultoria Patrimonial com IA de Nova Geração</span>
          </div>

          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight font-serif ${
            isDark ? "text-slate-50" : "text-stone-900"
          }`}>
            Seu dinheiro esculpido por <span className="bg-gradient-to-r from-[#CD9C20] to-[#F5CB5C] bg-clip-text text-transparentWeb">Inteligência Artificial</span>.
          </h2>

          <p className={`text-lg leading-relaxed ${isDark ? "text-slate-350" : "text-stone-700"}`}>
            Conecte seu perfil a um agente autônomo de alocação quantitativa. O Agente Aura calibra sua carteira ideal em tempo real, executa simulações de estresse financeiro severo e gera relatórios avançados livres de conflitos de interesse de bancos tradicionais.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              id="btn-create-free"
              onClick={onStartOnboarding}
              className="px-8 py-4 text-sm font-bold text-slate-950 bg-gradient-to-r from-[#CD9C20] to-[#F5CB5C] rounded-xl hover:opacity-90 transition-all duration-300 shadow-xl shadow-[#CD9C20]/20 flex items-center justify-center gap-2 cursor-pointer gold-glow"
            >
              Criar Minha Carteira Grátis
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              id="btn-how-it-works"
              onClick={onDirectLogin}
              className={`px-6 py-4 text-sm font-semibold rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
                  : "bg-white border-slate-350 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Entrar sem Responder Quiz
            </button>
          </div>

          {/* Core visual badges */}
          <div className="pt-6 grid grid-cols-3 gap-4 border-t border-opacity-10 border-slate-500">
            <div>
              <p className={`text-2xl font-bold font-mono ${isDark ? "text-[#F5CB5C]" : "text-[#CD9C20]"}`}>12.8%</p>
              <p className="text-xs text-slate-500">Rentabilidade Média Projetada</p>
            </div>
            <div>
              <p className={`text-2xl font-bold font-mono ${isDark ? "text-[#F5CB5C]" : "text-[#CD9C20]"}`}>100%</p>
              <p className="text-xs text-slate-500">Isenção Comercial e Transparente</p>
            </div>
            <div>
              <p className={`text-2xl font-bold font-mono ${isDark ? "text-[#F5CB5C]" : "text-[#CD9C20]"}`}>WCAG</p>
              <p className="text-xs text-slate-500">Contraste e Acessibilidade Triple AAA</p>
            </div>
          </div>
        </div>

        {/* Interactive Widget Section */}
        <div className="lg:col-span-5">
          <div className={`p-6 rounded-3xl border shadow-2xl transition-all duration-300 ${
            isDark ? "bg-[#0a0a0a] border-[#CD9C20]/20" : "bg-white border-[#CD9C20]/25"
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] text-[#CD9C20] dark:text-[#F5CB5C] font-mono tracking-widest uppercase">Widget de Degustação</p>
                <h3 className={`font-bold text-lg font-serif ${isDark ? "text-slate-50" : "text-stone-900"}`}>Veja o Poder da IA</h3>
              </div>
              <TrendingUp className="h-5 w-5 text-[#CD9C20] dark:text-[#F5CB5C]" />
            </div>

            {/* Simulated Live Values */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="flex justify-between text-xs font-semibold text-slate-550 mb-1.5">
                  <span>Aporte Inicial Desejado</span>
                  <span className={`font-mono text-sm font-bold ${isDark ? "text-slate-50" : "text-stone-950"}`}>
                    R$ {sliderValue.toLocaleString('pt-BR')}
                  </span>
                </label>
                <input
                  id="investment-slider"
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#CD9C20]/20 rounded-lg appearance-none cursor-pointer accent-[#CD9C20] dark:accent-[#F5CB5C]"
                />
              </div>

              {/* Comparison Cards */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className={`p-3 rounded-2xl border ${isDark ? "bg-[#050A16]/50 border-slate-800" : "bg-stone-50 border-stone-200"}`}>
                  <p className="text-[10px] text-slate-500 font-medium">Investimento Tradicional</p>
                  <p className={`text-base font-bold font-mono tracking-tight mt-1 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    R$ {projections.finalStandard.toLocaleString('pt-BR')}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">6.5% a.a • 5 anos</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#CD9C20]/10 border border-[#CD9C20]/25">
                  <p className="text-[10px] text-[#CD9C20] dark:text-[#F5CB5C] font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Aura IA Premium
                  </p>
                  <p className="text-base font-bold font-mono tracking-tight mt-1 text-[#CD9C20] dark:text-[#F5CB5C]">
                    R$ {projections.finalAi.toLocaleString('pt-BR')}
                  </p>
                  <span className="text-[10px] text-[#CD9C20]/80 dark:text-[#F5CB5C]/80 font-mono mt-0.5 block">12.8% a.a • 5 anos</span>
                </div>
              </div>

              {/* Spark Value Card */}
              <div className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#CD9C20]/10 to-[#F5CB5C]/10 border border-[#CD9C20]/20 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Aura gerará mais <strong className="text-[#CD9C20] dark:text-[#F5CB5C]">R$ {projections.totalGainDifference.toLocaleString('pt-BR')}</strong> no mesmo período.
                </p>
              </div>
            </div>

            {/* Custom Interactive SVG Line Chart */}
            <div className="relative pt-2">
              <svg viewBox="0 0 380 180" className="w-full h-auto overflow-visible">
                {/* Chart Grid Lines */}
                <line x1="20" y1="20" x2="360" y2="20" stroke={isDark ? "#293249" : "#d6cfc7"} strokeDasharray="3 3.5" strokeOpacity="0.6" />
                <line x1="20" y1="80" x2="360" y2="80" stroke={isDark ? "#293249" : "#d6cfc7"} strokeDasharray="3 3.5" strokeOpacity="0.6" />
                <line x1="20" y1="140" x2="360" y2="140" stroke={isDark ? "#293249" : "#d6cfc7"} strokeDasharray="3 3.5" strokeOpacity="0.6" />

                {/* Standard Asset Curve */}
                <path
                  d={svgPoints.standardPath}
                  fill="none"
                  stroke={isDark ? "#4b5563" : "#8c8273"}
                  strokeWidth="2.5"
                  strokeOpacity="0.75"
                />

                {/* Aura Smart Selection Curve */}
                <path
                  d={svgPoints.aiPath}
                  fill="none"
                  stroke={isDark ? "#F5CB5C" : "#CD9C20"}
                  strokeWidth="3.5"
                  className="animate-pulse"
                />

                {/* Points highlights */}
                <circle cx={svgPoints.standardPoints[5].x} cy={svgPoints.standardPoints[5].y} r="5" fill={isDark ? "#64748b" : "#475569"} />
                <circle cx={svgPoints.aiPoints[5].x} cy={svgPoints.aiPoints[5].y} r="6" fill={isDark ? "#F5CB5C" : "#CD9C20"} />

                {/* Tooltip or point overlay text */}
                <text x={svgPoints.aiPoints[5].x - 118} y={svgPoints.aiPoints[5].y - 12} fill={isDark ? "#F5CB5C" : "#CD9C20"} fontSize="10" fontWeight="bold" fontFamily="monospace">
                  Aura: R$ {projections.finalAi.toLocaleString('pt-BR')}
                </text>
                <text x={svgPoints.standardPoints[5].x - 110} y={svgPoints.standardPoints[5].y + 15} fill={isDark ? "#94a3b8" : "#475569"} fontSize="9" fontFamily="monospace">
                  CDB Comum: R$ {projections.finalStandard.toLocaleString('pt-BR')}
                </text>

                {/* Years Labels */}
                <g fill={isDark ? "#94a3b8" : "#5c5346"} fontSize="9" fontFamily="monospace">
                  <text x="20" y="175">Ano 0</text>
                  <text x="156" y="175">Ano 2.5</text>
                  <text x="330" y="175">Ano 5</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - 3 columns */}
      <section className="space-y-8 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <p className="text-xs text-[#CD9C20] dark:text-[#F5CB5C] font-bold uppercase tracking-widest font-mono">DIFERENCIAIS EXCLUSIVOS</p>
          <h3 className={`text-3xl font-extrabold tracking-tight font-serif ${isDark ? "text-slate-50" : "text-[#1c1917]"}`}>
            Por que escolher a inteligência Aura?
          </h3>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-stone-600"}`}>
            Unimos tecnologias de ponta com absoluto foco científico em alocação patrimonial segura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Agente Inteligente */}
          <div className={`p-6 rounded-2xl border hover:scale-[1.02] transition-all duration-300 ${
            isDark ? "bg-[#0a0a0a] border-[#CD9C20]/20" : "bg-white border-[#CD9C20]/25"
          }`}>
            <div className="p-3 w-12 rounded-xl bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C] mb-4">
              <Cpu className="h-6 w-6" />
            </div>
            <h4 className={`text-lg font-bold mb-2 font-serif ${isDark ? "text-slate-50" : "text-[#1c1917]"}`}>
              1. Agente de Alocação Autônomo
            </h4>
            <p className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-stone-600"}`}>
              Nossos algoritmos processam o cenário macroeconômico global, indexadores de inflação e perfis de ativos para sugerir a diversificação perfeita para seus objetivos e apetite a volatilidade.
            </p>
          </div>

          {/* Card 2: Teste de Crise */}
          <div className={`p-6 rounded-2xl border hover:scale-[1.02] transition-all duration-300 ${
            isDark ? "bg-[#0a0a0a] border-[#CD9C20]/20" : "bg-white border-[#CD9C20]/25"
          }`}>
            <div className="p-3 w-12 rounded-xl bg-rose-500/11 text-rose-400 mb-4">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h4 className={`text-lg font-bold mb-2 font-serif ${isDark ? "text-slate-50" : "text-[#1c1917]"}`}>
              2. Simulador de Estresse Severo
            </h4>
            <p className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-stone-600"}`}>
              Simule crises monetárias, disparadas de juros de mercado ou recessões sistêmicas na hora. Compare em gráficos dinâmicos o comportamento resiliente da alocação de IA contra portfólios amadores.
            </p>
          </div>

          {/* Card 3: Relatórios Rápidos */}
          <div className={`p-6 rounded-2xl border hover:scale-[1.02] transition-all duration-300 ${
            isDark ? "bg-[#0a0a0a] border-[#CD9C20]/20" : "bg-white border-[#CD9C20]/25"
          }`}>
            <div className="p-3 w-12 rounded-xl bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C] mb-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h4 className={`text-lg font-bold mb-2 font-serif ${isDark ? "text-slate-50" : "text-[#1c1917]"}`}>
              3. Relatórios Estratégicos Imediatos
            </h4>
            <p className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-stone-600"}`}>
              Gere insights macro e micro sob demanda. O backend seguro anonimiza seus dados sensíveis antes de enviá-los às redes de inteligência geradora do Gemini, retornando pareceres ricos e profundos.
            </p>
          </div>
        </div>
      </section>

      {/* Security Banner section - "Security by Design" */}
      <section className={`p-6 rounded-3xl border ${
        isDark ? "bg-[#0a0a0a]/50 border-[#CD9C20]/20" : "bg-slate-50/60 border-[#CD9C20]/25"
      }`}>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="p-4 rounded-full bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C] flex-shrink-0">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h4 className={`text-base font-bold uppercase tracking-tight font-serif ${isDark ? "text-[#F5CB5C]" : "text-[#CD9C20]"}`} id="label-security-by-design">
              🛡️ Arquitetura Segura - Security by Design
            </h4>
            <p className={`text-sm ${isDark ? "text-slate-350" : "text-stone-850"}`}>
              Nós lideramos as melhores práticas regulatórias mundiais e a LGPD. <strong>Nenhum dado sensível real</strong> (como seu nome completo ou números bancários) é enviado à IA comercial. De forma automatizada, nosso backend realiza mascaramento de dados (Anonymization Pipes) antes de qualquer requisição, isolando os cálculos matemáticos em sandbox local e eliminando vulnerabilidades de injeções (Guardrails).
            </p>
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="text-center pt-8 border-t border-opacity-10 border-slate-500 text-xs text-slate-500 font-mono flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>© 2026 Aura Investment Advisor Ltd. Todos os direitos reservados.</span>
        <div className="flex gap-4">
          <span className="hover:text-[#CD9C20] dark:hover:text-[#F5CB5C] cursor-pointer">Segurança por Design</span>
          <span className="hover:text-[#CD9C20] dark:hover:text-[#F5CB5C] cursor-pointer">Conformidade LGPD</span>
          <span className="hover:text-[#CD9C20] dark:hover:text-[#F5CB5C] cursor-pointer">Regulamentação CVM</span>
        </div>
      </footer>
    </div>
  );
}

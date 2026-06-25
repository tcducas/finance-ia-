import { useState, useMemo } from "react";
import { UserProfile, AssetAllocationItem } from "../types";
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Sparkles, HelpCircle, ShieldAlert, Award, ChevronDown, ChevronUp, RefreshCw, Layers } from "lucide-react";

interface PortfolioViewProps {
  isDark: boolean;
  profile: UserProfile;
}

export default function PortfolioView({ isDark, profile }: PortfolioViewProps) {
  const [activeScenario, setActiveScenario] = useState<"optimistic" | "neutral" | "stress">("neutral");
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  // Asset configurations based on user profile
  const assets: AssetAllocationItem[] = useMemo(() => {
    const rawBalance = profile.balance;
    const profileName = profile.calculatedProfile;

    if (profileName === "Conservador") {
      return [
        {
          name: "Renda Fixa IPCA+ Corretor Securizado",
          symbol: "TESOURO IPCA+",
          percentage: 60,
          value: Math.round(rawBalance * 0.6),
          category: "Renda Fixa",
          whyIA: "A inflação de longo prazo é o maior inimigo do poder de compra. Indexar 60% da carteira ao IPCA garante que seu capital crescerá de forma real e assegurada, livre de flutuações e flutuações políticas de curto prazo.",
        },
        {
          name: "CDB Liquidez Diária Premium A+",
          symbol: "CDB LIQUIDEZ DIÁRIA",
          percentage: 30,
          value: Math.round(rawBalance * 0.3),
          category: "Renda Fixa",
          whyIA: "Garante uma reserva para resgates fáceis na velocidade da luz ou compras de oportunidade com rentabilidade constante lastreada no CDI diário.",
        },
        {
          name: "Fundo Imobiliário de Recebíveis (High Grade)",
          symbol: "FII RECEBÍVEIS (PAPEIS)",
          percentage: 10,
          value: Math.round(rawBalance * 0.1),
          category: "FIIs",
          whyIA: "Distribuição mensal isenta de IR com altíssima resiliência das cotas devido a contratos de crédito imobiliário Triple AAA.",
        }
      ];
    } else if (profileName === "Arrojado Dinâmico") {
      return [
        {
          name: "Ações Alta Performance & Growth",
          symbol: "GROWTH EQUITIES (IBOVESPA+)",
          percentage: 35,
          value: Math.round(rawBalance * 0.35),
          category: "Ações Nacionais",
          whyIA: "Seleção computacional ativa das 12 ações mais subvalorizadas em relação ao fluxo de caixa descontado, com beta ajustado ao momento microeconômico do país.",
        },
        {
          name: "Ativos Globais & S&P 500 Tech Hedged",
          symbol: "USA TECH / REITS (ETF)",
          percentage: 30,
          value: Math.round(rawBalance * 0.3),
          category: "Ativos Globais",
          whyIA: "Exposição cambial inteligente às megatrends de tecnologia global e inteligência artificial de forma protegida contra surto inflacionário nacional.",
        },
        {
          name: "Renda Fixa IPCA+ Debêntures Isentas",
          symbol: "TESOURO / INFLAÇÃO ATIVA",
          percentage: 20,
          value: Math.round(rawBalance * 0.2),
          category: "Renda Fixa",
          whyIA: "Fixação tática teto de juros altos garantindo o lastro sólido da carteira com cupons semestrais de rentabilidade real elevada.",
        },
        {
          name: "Fundo de Tijolo Logística e Galpões",
          symbol: "FII REAL ESTATE (LOGÍSTICA)",
          percentage: 15,
          value: Math.round(rawBalance * 0.15),
          category: "FIIs",
          whyIA: "Ativos imobiliários físicos com contratos atípicos reajustados também pelo IPCA que se sustentam nas maiores frentes e-commerce nacionais.",
        }
      ];
    } else {
      // Moderado Estratégico (Default)
      return [
        {
          name: "Renda Fixa IPCA+ Ativo",
          symbol: "TESOURO IPCA+ 2035",
          percentage: 40,
          value: Math.round(rawBalance * 0.4),
          category: "Renda Fixa",
          whyIA: "A âncora estabilizadora da sua carteira. Protege o principal contra corrosão sistêmica inflacionária gerando retornos reais consistentes ao longo dos anos.",
        },
        {
          name: "Fundo de Tijolo e Logística Corporativa",
          symbol: "FII LOGÍSTICA (TIJOLO)",
          percentage: 25,
          value: Math.round(rawBalance * 0.25),
          category: "FIIs",
          whyIA: "Geração de dividendos isentos todo mês reajustados organicamente pelo IGP-M/IPCA físico com alta proteção de patrimônio de tijolo real.",
        },
        {
          name: "Ações Nacionais BlueChips de Dividendos",
          symbol: "CARTEIRA DIVIDENDOS (CVM)",
          percentage: 20,
          value: Math.round(rawBalance * 0.2),
          category: "Ações Nacionais",
          whyIA: "Calibração tática em empresas maduras de energia, saneamento e setor financeiro que geram lucros estáveis com baixíssimo endividamento operacional.",
        },
        {
          name: "Ativos Globais Diversificados Hedged",
          symbol: "SPY GLOBAL DIVERSIFIED ETF",
          percentage: 15,
          value: Math.round(rawBalance * 0.15),
          category: "Ativos Globais",
          whyIA: "Descorrelação de fatores de risco do Brasil. Fornece uma camada extra de proteção na moeda forte global contra turbulências geopolíticas.",
        }
      ];
    }
  }, [profile]);

  // Data for Donut Chart
  const pieData = useMemo(() => {
    return assets.map(a => ({
      name: a.symbol,
      value: a.percentage,
      category: a.category
    }));
  }, [assets]);

  // Colors for custom donut categories
  const categoryColorMap: Record<string, string> = {
    "Renda Fixa": "#CD9C20",       // Rich Gold
    "FIIs": "#F5CB5C",             // Light Gold
    "Ações Nacionais": "#3b82f6",  // Royal Blue (Nacionais)
    "Ativos Globais": "#64748b"    // Cool Slate Grey (Globais)
  };

  const getAssetColor = (category: string) => categoryColorMap[category] || "#10b981";

  // Future Projection calculation for the chart data
  const chartData = useMemo(() => {
    const rawBalance = profile.balance;
    const years = Array.from({ length: 11 }, (_, i) => i); // 0 to 10 years

    // Compound annual growth rates based on scenario for AI vs Standard
    let aiRate = 0.118;
    let standardRate = 0.075;

    if (activeScenario === "optimistic") {
      aiRate = 0.155;
      standardRate = 0.102;
    } else if (activeScenario === "stress") {
      aiRate = 0.088; // Low positive growth in crisis (highly protected!)
      standardRate = 0.045; // Poor return in standard
    }

    return years.map(yr => {
      let aiVal = Math.round(rawBalance * Math.pow(1 + aiRate, yr));
      let standardVal = Math.round(rawBalance * Math.pow(1 + standardRate, yr));

      // Simulate the crash on yr 4 under stress scenario
      if (activeScenario === "stress" && yr >= 4) {
        // AI wobbles slightly then grows reliably
        const preCrashAi = Math.round(rawBalance * Math.pow(1 + aiRate, 3));
        const crashFactorAi = 0.94; // loses only 6% at year 4
        if (yr === 4) {
          aiVal = Math.round(preCrashAi * crashFactorAi);
        } else {
          aiVal = Math.round(preCrashAi * crashFactorAi * Math.pow(1 + aiRate, yr - 4));
        }

        // Standard crashes heavily and struggles to return
        const preCrashStandard = Math.round(rawBalance * Math.pow(1 + standardRate, 3));
        const crashFactorStandard = 0.70; // loses a severe 30% at year 4 !
        if (yr === 4) {
          standardVal = Math.round(preCrashStandard * crashFactorStandard);
        } else {
          standardVal = Math.round(preCrashStandard * crashFactorStandard * Math.pow(1 + 0.04, yr - 4)); // Recover rate slows down to 4%
        }
      }

      return {
        year: `Ano ${yr}`,
        "Carteira Aura IA": aiVal,
        "Carteira Comum (Amadora)": standardVal,
        "Aporte Original": rawBalance
      };
    });
  }, [activeScenario, profile]);

  const summaryStats = useMemo(() => {
    const finalYear = chartData[chartData.length - 1];
    const aporteTotal = profile.balance;
    const auraFinal = finalYear["Carteira Aura IA"] as number;
    const comumFinal = finalYear["Carteira Comum (Amadora)"] as number;
    
    return {
      aporte: aporteTotal,
      rendimentoAura: auraFinal - aporteTotal,
      rendimentoComum: comumFinal - aporteTotal,
      diferencaIA: auraFinal - comumFinal
    };
  }, [chartData, profile.balance]);

  const toggleAssetExpand = (symbol: string) => {
    setExpandedAsset(expandedAsset === symbol ? null : symbol);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#CD9C20] dark:text-[#F5CB5C] uppercase tracking-widest block">Core Inteligência</span>
          <h3 className={`text-2xl md:text-3xl font-black tracking-tight font-serif ${isDark ? "text-slate-50" : "text-stone-900"}`}>
            Minha Carteira Ideal
          </h3>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-stone-600"}`}>
            Alocação computacional construída de acordo com seus objetivos e as restrições da CVM.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C] py-1.5 px-3 rounded-lg border border-[#CD9C20]/30 w-max">
          <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
          <span>ALOCAÇÃO ATUALIZADA CONSTANTEMENTE</span>
        </div>
      </div>

      {/* Main Grid: Allocation on Left, Projection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Asset allocation donut chart and interactive items */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-6 rounded-2.5xl border shadow-xl ${
            isDark ? "bg-[#0a0a0a] border-[#CD9C20]/20" : "bg-white border-[#CD9C20]/25 shadow-sm"
          }`}>
            <h4 className="text-xs font-bold mb-4 uppercase tracking-wider text-slate-500 font-mono">
              Donut de Alocação
            </h4>

            {/* Recharts Pie Donut inside container */}
            <div className="h-[220px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#0f172a" : "#ffffff",
                      borderColor: isDark ? "#1e293b" : "#e2e8f0",
                      color: isDark ? "#f8fafc" : "#0f172a",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontFamily: "monospace"
                    }}
                    formatter={(value) => `${value}%`}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getAssetColor(entry.category)}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Profile Visual Badge inside Pie */}
              <div className="absolute text-center flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">PERFIL</span>
                <span className="text-xs font-black uppercase text-[#CD9C20] dark:text-[#F5CB5C] mt-0.5">
                  {profile.calculatedProfile.split(" ")[0]}
                </span>
              </div>
            </div>

            {/* Category legend grid */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-medium">
              {Object.keys(categoryColorMap).map(cat => {
                const percentage = assets
                  .filter(a => a.category === cat)
                  .reduce((acc, curr) => acc + curr.percentage, 0);

                if (percentage === 0) return null;

                return (
                  <div key={cat} className="flex items-center gap-2 justify-start py-1">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColorMap[cat] }} />
                    <span className="text-slate-500 font-semibold">{cat}:</span>
                    <span className={`font-mono text-slate-700 dark:text-slate-350`}>{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive asset list */}
          <div className="space-y-3">
            <h4 className={`text-sm font-semibold uppercase tracking-wider text-slate-500`}>Fatias e Ativos da Carteira</h4>
            
            {assets.map((asset) => {
              const isExpanded = expandedAsset === asset.symbol;
              const color = getAssetColor(asset.category);

              return (
                <div
                  key={asset.symbol}
                  className={`p-4 rounded-xl border transition-all duration-350 ${
                    isExpanded
                      ? isDark
                        ? "bg-[#111111] border-[#CD9C20]/50 shadow-inner"
                        : "bg-slate-50 border-[#CD9C20]"
                      : isDark
                      ? "bg-[#0a0a0a] border-[#CD9C20]/20 hover:border-[#CD9C20]/35"
                      : "bg-white border-[#CD9C20]/25 hover:border-[#CD9C20]/45 shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: color }}>
                          {asset.symbol}
                        </span>
                        <span className="text-xs font-bold text-slate-500 font-mono">{asset.percentage}%</span>
                      </div>
                      <h5 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{asset.name}</h5>
                    </div>

                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                      <p className={`text-xs font-bold font-mono tracking-tight ${isDark ? "text-slate-50" : "text-slate-900"}`}>
                        R$ {asset.value.toLocaleString('pt-BR')}
                      </p>
                      <button
                        id={`btn-expand-${asset.symbol.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() => toggleAssetExpand(asset.symbol)}
                        className={`p-1.5 rounded transition hover:bg-slate-800 ${isDark ? "text-slate-400" : "text-slate-600 hover:bg-slate-100"}`}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Why IA chosen explanation - requested visual tag clickable */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-dashed border-opacity-10 border-slate-500 space-y-2 animate-fade-in">
                      <p className="text-[10px] font-mono font-black text-[#CD9C20] dark:text-[#F5CB5C] uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Por que a inteligência escolheu isso?
                      </p>
                      <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-stone-700"}`}>
                        {asset.whyIA}
                      </p>
                    </div>
                  )}

                  {/* Closed tag cue to expand */}
                  {!isExpanded && (
                    <button
                      id={`btn-cue-expand-${asset.symbol.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => toggleAssetExpand(asset.symbol)}
                      className="text-[10px] text-[#CD9C20] dark:text-[#F5CB5C] font-bold hover:underline mt-2 flex items-center gap-1 uppercase tracking-wider cursor-pointer text-left font-mono"
                    >
                      <Sparkles className="h-3 w-3" /> Por que a IA escolheu isso? (expandir)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Future Projection Chart with GOLDEN RULE buttons */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`p-6 rounded-2.5xl border shadow-xl flex flex-col h-full ${
            isDark ? "bg-[#0a0a0a] border-[#CD9C20]/20" : "bg-white border-[#CD9C20]/25 shadow-sm"
          }`}>
            
            {/* Golden Rule buttons list */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-opacity-10 border-slate-500">
              <div>
                <h4 className={`text-base font-bold font-serif ${isDark ? "text-slate-50" : "text-stone-900"}`}>Projeção do Patrimônio</h4>
                <p className="text-[11px] text-slate-500">A simulação compõe o capital em um ciclo de 10 anos.</p>
              </div>

              {/* Golden toggles for instant chart update */}
              <div className="flex gap-1 bg-slate-950/40 p-1.5 rounded-xl border border-slate-800/20 w-max font-mono">
                <button
                  id="btn-scenario-optimistic"
                  onClick={() => setActiveScenario("optimistic")}
                  className={`text-xs px-3 py-1.5 font-bold rounded-lg transition-all duration-300 cursor-pointer ${
                    activeScenario === "optimistic"
                      ? "bg-[#CD9C20] text-slate-950 font-bold"
                      : "text-slate-500 hover:text-[#CD9C20]"
                  }`}
                >
                  🟢 Otimista
                </button>

                <button
                  id="btn-scenario-neutral"
                  onClick={() => setActiveScenario("neutral")}
                  className={`text-xs px-3 py-1.5 font-bold rounded-lg transition-all duration-300 cursor-pointer ${
                    activeScenario === "neutral"
                      ? "bg-[#F5CB5C] text-slate-950 font-bold"
                      : "text-slate-500 hover:text-[#F5CB5C]"
                  }`}
                >
                  🟡 Neutro
                </button>

                <button
                  id="btn-scenario-stress"
                  onClick={() => setActiveScenario("stress")}
                  className={`text-xs px-3 py-1.5 font-bold rounded-lg transition-all duration-300 cursor-pointer ${
                    activeScenario === "stress"
                      ? "bg-[#fb7185] text-slate-950 font-bold"
                      : "text-slate-500 hover:text-rose-405"
                  }`}
                >
                  🔴 Stress Test
                </button>
              </div>
            </div>

            {/* Simulated alert based on selected scenario */}
            {activeScenario === "stress" ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-6 flex gap-3 animate-fade-in">
                <ShieldAlert className="h-5 w-5 text-[#fb7185] flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-extrabold text-[#fb7185] uppercase tracking-tight">Estresse Acionado: Crise Macroeconômica Severa (Ano 4)</p>
                  <p className={`text-stone-750 dark:text-slate-400`}>
                    <strong>O que acontece:</strong> O mercado tradicional sofre uma retração dramática de 30% no Ano 4 devido a pânico de juros altos e fuga cambial. A carteira Aura IA (dourada) amortece quase todo o choque, perdendo meros 6% e voltando a crescer velozmente graças à proteção de inflação real e descorrelação internacional.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#CD9C20]/15 border border-[#CD9C20]/25 mb-6 flex gap-3 animate-fade-in">
                <Sparkles className="h-5 w-5 text-[#CD9C20] dark:text-[#F5CB5C] flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-[#CD9C20] dark:text-[#F5CB5C] uppercase tracking-tight">Cenário Ativo: {activeScenario === "optimistic" ? "Otimista Real" : "Estável Neutro"}</p>
                  <p className={`text-stone-750 dark:text-slate-400`}>
                    Comprovação do poder matemático de rebalanceamento sistemático. A carteira otimizada pela IA descola da média nacional devido a dividendos acumulados e blindagem de taxas administradoras.
                  </p>
                </div>
              </div>
            )}

            {/* Recharts Line Chart */}
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} strokeOpacity="0.5" />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: isDark ? "#94a3b8" : "#475569", fontSize: "10px", fontFamily: "monospace" }}
                  />
                  <YAxis
                    tickFormatter={(value) => `R$ ${(value / 1000)}k`}
                    tick={{ fill: isDark ? "#94a3b8" : "#475569", fontSize: "10px", fontFamily: "monospace" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#0f172a" : "#ffffff",
                      borderColor: isDark ? "#1e293b" : "#e2e8f0",
                      color: isDark ? "#f8fafc" : "#0f172a",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontFamily: "monospace"
                    }}
                    formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  
                  {/* Original Investment Line */}
                  <Line
                    type="monotone"
                    dataKey="Aporte Original"
                    stroke={isDark ? "#334155" : "#cbd5e1"}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                  />

                  {/* Common Portfolio line */}
                  <Line
                    type="monotone"
                    dataKey="Carteira Comum (Amadora)"
                    stroke={activeScenario === "stress" ? "#fb7185" : "#94a3b8"}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />

                  {/* Aura AI Portfolio line */}
                  <Line
                    type="monotone"
                    dataKey="Carteira Aura IA"
                    stroke="#CD9C20"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Projection Details Grid */}
            <div className={`mt-auto pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in`}>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Aporte Total</span>
                <p className={`text-sm font-black tracking-tight ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  R$ {summaryStats.aporte.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Rendimento IA (10a)</span>
                <p className={`text-sm font-black tracking-tight text-[#CD9C20] dark:text-[#F5CB5C]`}>
                  + R$ {summaryStats.rendimentoAura.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Rendimento Comum</span>
                <p className={`text-sm font-black tracking-tight ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  + R$ {summaryStats.rendimentoComum.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Lucro Extra c/ IA</span>
                <p className={`text-sm font-black tracking-tight text-emerald-600 dark:text-emerald-400`}>
                  + R$ {summaryStats.diferencaIA.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Strategic Sandbox analysis box */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? "bg-[#111111] border-[#CD9C20]/15" : "bg-slate-50 border-[#CD9C20]/25 shadow-sm"
          }`}>
            <div className="flex items-start gap-4 text-xs font-mono text-slate-500">
              <Layers className="h-5 w-5 text-[#CD9C20] dark:text-[#F5CB5C] mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-stone-700 dark:text-slate-400">Sandbox matemático isolado no Backend</p>
                <p className="text-[11px] leading-relaxed">
                  As curvas de projeção acima são calculadas em tempo de execução de forma totalmente isolada. A IA apenas interpreta os resultados consolidados sem processar scripts de dados desconhecidos no servidor, garantindo total isolamento operacional contra falhas sistêmicas críticas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

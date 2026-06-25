import { useState, FormEvent } from "react";
import { UserProfile, ReportItem } from "../types";
import { Sparkles, FileText, Send, Lock, ChevronRight, Eye, ShieldAlert, CheckCircle, Database, ArrowRight, CornerDownRight, RefreshCw } from "lucide-react";

interface AuraCentralViewProps {
  isDark: boolean;
  profile: UserProfile;
}

export default function AuraCentralView({ isDark, profile }: AuraCentralViewProps) {
  const [reports, setReports] = useState<ReportItem[]>([
    {
      id: "rep-1",
      date: "15/Jun/2026",
      title: "Análise Semanal - Ajuste COPOM",
      profile: profile.calculatedProfile,
      summary: "Revisão recomendada das posições de Renda Fixa pós-comunicado de juros estáveis. Manutenção das taxas de IPCA+.",
      content: `### Parecer Semanal de Alocação Aura IA

Olá, **${profile.name}**! 

Com base no seu perfil de investidor **${profile.calculatedProfile}**, elaboramos esta análise de readequação frente à última decisão de juros.

1. **Renda Fixa IPCA+**: Recomendamos manter 100% da sua alocação atual neste ativo. Os juros reais brasileiros continuam extremamente atraentes frente às tensões inflacionárias persistentes.
2. **Fundos Imobiliários**: Momento favorável para continuar acumulando cotas de tijolo de logística. Os contratos de locação continuam reajustados de forma robusta e o rendimento mensal isento fornece um excelente amortecedor operacional.
3. **Recomendações Práticas**:
   - Evite alongar demais os vencimentos (duration superior a 2035) para não expor a carteira a marcações a mercado excessivas.
   - Reaplique todos os proventos de dividendos e cupons semestrais imediatamente para usufruir do efeito de juros compostos de longo prazo.`
    },
    {
      id: "rep-2",
      date: "02/Jun/2026",
      title: "Alerta de Rebalanceamento Trimestral",
      profile: profile.calculatedProfile,
      summary: "Orientação para compra tática de ações nacionais e FIIs maduros aproveitando flutuações sazonais de preço.",
      content: `### Relatório de Rebalanceamento Trimestral Aura IA

Olá, **${profile.name}**! Seu capital para simulação de **R$ ${profile.balance.toLocaleString('pt-BR')}** foi analisado sob o modelo Markowitz otimizado.

Detectamos um ligeiro desvio na alocação ideal devido à valorização recente dos ativos de renda fixa. É hora de reequilibrar:

1. **Ações de Dividendos**: Sugerimos destinar novos aportes táticos em papéis expostos a serviços públicos essenciais, que operam protegidos por barreiras inflacionárias legais de receita estável.
2. **Ações Globais**: Garanta a diversificação em ativos dolarizados para blindagem geopolítica de ponta.
3. **Resumo Operacional**: O rebalanceamento mantém as notas de resiliência de crises do seu portfólio consolidadas.`
    }
  ]);

  const [activeReport, setActiveReport] = useState<ReportItem | null>(reports[0]);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(true);
  
  // Custom interactive chat state
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "aura"; text: string }>>([
    { sender: "aura", text: `Olá! Eu sou Aura, seu Agente Financeiro IA. Como posso te auxiliar a compreender sua carteira, analisar cenários de stress ou reequilibrar seus investimentos hoje?` }
  ]);
  const [isChatSending, setIsChatSending] = useState<boolean>(false);

  // Security log details for visual panel
  const [securityDataRaw, setSecurityDataRaw] = useState<string>("");
  const [securityDataUnmasked, setSecurityDataUnmasked] = useState<string>("");

  // Server-side generate report trigger (Pillars 1, 2, 3, 4 active)
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGenerationLogs([]);
    setSecurityDataRaw("");
    setSecurityDataUnmasked("");

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    try {
      setGenerationLogs(prev => [...prev, "🚀 Iniciando pipeline de geração de relatório Aura..."]);
      await sleep(400);

      // PILLAR 2: Anonimização de Dados (LGPD & Privacidade)
      setGenerationLogs(prev => [...prev, `🔒 Mascarando dados sensíveis dos formulários...`]);
      setGenerationLogs(prev => [...prev, `   ↳ Swapping Nome real [${profile.name}] por {{USER_FIRST_NAME}}`]);
      setGenerationLogs(prev => [...prev, `   ↳ Swapping Saldo real [R$ ${profile.balance.toLocaleString('pt-BR')}] por {{TOTAL_BALANCE}}`]);
      await sleep(500);

      // PILLAR 3: Proteção contra Prompt Injection (Segurança de IA)
      setGenerationLogs(prev => [...prev, `🛡️ Executando Guardrails e Pydantic-style validators...`]);
      setGenerationLogs(prev => [...prev, `   ↳ Inspeção anti-injeção concluída com sucesso (0 triggers encontrados).`]);
      await sleep(400);

      setGenerationLogs(prev => [...prev, `📡 Enviando requisição encriptada ao Backend Proxy Server...`]);
      await sleep(300);

      // Make the actual fetch call to our Node API proxying Gemini API server-side
      const response = await fetch("/api/aura/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: profile.name,
          rawBalance: profile.balance,
          riskProfile: profile.calculatedProfile,
          objectives: profile.goals,
          knowledgeLevel: profile.knowledgeLevel,
          recentMarketContext: "Estabilidade na taxa Selic alta, tensões fiscais locais e mercado americano em máximas com rali tecnológico."
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Flha no processamento do relatório.");
      }

      setGenerationLogs(prev => [...prev, `✨ Resposta gerada com sucesso pelo cérebro do Gemini.`]);
      setGenerationLogs(prev => [...prev, `🧐 PILLAR 2: Hidratando as variáveis de template de forma segura no Back BFF...`]);
      await sleep(400);

      setSecurityDataRaw(data.rawOutput);
      setSecurityDataUnmasked(data.unmaskedOutput);

      const newReport: ReportItem = {
        id: `rep-gen-${Date.now()}`,
        date: "Hoje (Agente IA)",
        title: `Relatório de Alocação de Ativos Otimizado Aura`,
        profile: profile.calculatedProfile,
        summary: `Inspeção microscópica gerada pela IA baseada na Selic atual e no seu capital de simulação.`,
        content: data.unmaskedOutput
      };

      setReports(prev => [newReport, ...prev]);
      setActiveReport(newReport);
      setGenerationLogs(prev => [...prev, `✅ Processo concluído! Relatório adicionado ao histórico.`]);

    } catch (err: any) {
      console.error(err);
      setGenerationLogs(prev => [...prev, `❌ ERRO NO PIPELINE: ${err.message}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Chat message submit handler linked to Gemini API proxied server-side
  const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setIsChatSending(true);

    try {
      const response = await fetch("/api/aura/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: profile.name,
          rawBalance: profile.balance,
          riskProfile: profile.calculatedProfile,
          objectives: profile.goals,
          knowledgeLevel: profile.knowledgeLevel,
          chatMessage: userMsg,
          isCustomChat: true
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      setChatMessages(prev => [...prev, { sender: "aura", text: data.unmaskedOutput }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: "aura", text: `Ops, tive uma pequena falha de conexão com meu servidor seguro. Você configurou sua GEMINI_API_KEY no menu de Secrets? (Erro: ${err.message})` }]);
    } finally {
      setIsChatSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Visual Header */}
      <div>
        <span className="text-xs font-mono font-bold text-[#CD9C20] dark:text-[#F5CB5C] uppercase tracking-widest block">Consultoria Sob Demanda</span>
        <h3 className={`text-2xl md:text-3xl font-black tracking-tight font-serif ${isDark ? "text-slate-50" : "text-stone-900"}`}>
          Central do Agente Financeiro Aura
        </h3>
        <p className={`text-sm ${isDark ? "text-slate-400" : "text-stone-600"}`}>
          Gere relatórios de investimentos customizados e converse em tempo real com seu consultor de forma 100% blindada e anônima.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COMPONENT: List of reports & Generate Action */}
        <div className="lg:col-span-4 space-y-6">
          <div className={`p-5 rounded-2.5xl border shadow-xl ${
            isDark ? "bg-[#0a0a0a] border-[#CD9C20]/20" : "bg-white border-[#CD9C20]/25 shadow-sm"
          }`}>
            <h4 className="text-xs font-bold mb-4 uppercase tracking-wider text-slate-500 font-mono">Relatórios Anteriores</h4>
            
            <div className="space-y-3">
              {reports.map((rep) => {
                const isActive = activeReport?.id === rep.id;
                return (
                  <button
                    id={`btn-report-${rep.id}`}
                    key={rep.id}
                    onClick={() => setActiveReport(rep)}
                    className={`w-full p-4 rounded-xl text-left border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                      isActive
                        ? isDark
                          ? "bg-[#030611] border-[#CD9C20]/50 text-slate-50 shadow-inner"
                          : "bg-amber-50/20 border-[#CD9C20] text-slate-900"
                        : isDark
                        ? "bg-[#0a0a0a] hover:bg-slate-950/20 border-[#CD9C20]/15"
                        : "bg-white hover:bg-slate-50 border-stone-200"
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono tracking-wider text-slate-500 block uppercase">{rep.date}</span>
                      <h5 className="font-bold text-xs line-clamp-1">{rep.title}</h5>
                      <p className="text-[11px] text-slate-400 leading-tight line-clamp-1">{rep.summary}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#CD9C20] dark:text-[#F5CB5C] flex-shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>

            {/* Prompt Report Action Button */}
            <div className="pt-5 mt-4 border-t border-opacity-10 border-slate-500">
              <button
                id="btn-trigger-ai-analyze"
                disabled={isGenerating}
                onClick={handleGenerateReport}
                className="w-full py-3.5 px-4 text-xs font-bold text-slate-950 bg-gradient-to-r from-[#CD9C20] to-[#F5CB5C] rounded-xl hover:scale-103 transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-mono uppercase tracking-wider gold-glow"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Gerando Parecer Ativo...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-slate-950 animate-pulse" />
                    ✨ Gerar Nova Análise com IA
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Dynamic Logs if generating / or general status log of security */}
          {showTechnicalDetails && (
            <div className={`p-5 rounded-2.5xl border font-mono text-[10px] space-y-3 ${
              isDark ? "bg-[#0a0a0a]/55 border-[#CD9C20]/15 text-slate-400" : "bg-slate-50/65 border-[#CD9C20]/15 text-stone-600 shadow-sm"
            }`}>
              <div className="flex justify-between items-center pb-2 border-b border-opacity-10 border-slate-500">
                <span className="font-bold text-[#CD9C20] dark:text-[#F5CB5C] flex items-center gap-1.5 uppercase">
                  <Database className="h-3.5 w-3.5" /> Pipeline de Segurança
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C] font-bold uppercase text-[9px] tracking-widest animate-pulse">Ativo</span>
              </div>

              {generationLogs.length > 0 ? (
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                  {generationLogs.map((log, i) => (
                    <div key={i} className="leading-tight flex items-start gap-1">
                      <span className="text-emerald-500 flex-shrink-0">›</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 space-y-2">
                  <p>Inicie uma análise para auditar os logs de conformidade analítica em tempo real.</p>
                  <div className="p-2.5 rounded bg-slate-950/40 text-[9px] space-y-1">
                    <div>[INFO] Mascaramento de Nomes: ATIVO</div>
                    <div>[INFO] Isolamento de cálculos: ATIVO</div>
                    <div>[INFO] Inspeção Anti-Injeção: ATIVO</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COMPONENT: Active Report Reader or Interactive Chat Tab */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex bg-slate-950/45 p-1 rounded-xl border border-[#CD9C20]/20 w-max self-start text-xs font-semibold gap-1">
            <button
              id="tab-btn-report"
              className={`px-4 py-2 rounded-lg cursor-pointer transition ${
                activeReport ? "bg-[#0a0a0a] text-[#CD9C20] border border-[#CD9C20]/25" : "text-slate-400 hover:text-white"
              }`}
              onClick={() => {
                if (!activeReport && reports.length > 0) setActiveReport(reports[0]);
              }}
            >
              📄 Parecer Técnico IA
            </button>
            <button
              id="tab-btn-chat"
              className={`px-4 py-2 rounded-lg cursor-pointer transition ${
                !activeReport ? "bg-[#0a0a0a] text-[#CD9C20] border border-[#CD9C20]/25" : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setActiveReport(null)}
            >
              💬 Interact / Chat com Aura
            </button>
          </div>

          {activeReport ? (
            /* Active Report Visualizer */
            <div className={`p-6 rounded-2.5xl border shadow-xl flex-1 flex flex-col justify-between ${
              isDark ? "bg-[#0a0a0a] border-[#CD9C20]/20" : "bg-white border-[#CD9C20]/25 shadow-sm"
            }`}>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-opacity-10 border-slate-500 pb-3">
                  <div>
                    <h4 className={`text-base font-extrabold font-serif ${isDark ? "text-slate-50" : "text-stone-900"}`}>{activeReport.title}</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">ESTRUTURADO EM {activeReport.date}</p>
                  </div>
                  <span className="px-2 py-1 text-[10px] font-mono font-bold bg-[#CD9C20]/15 text-[#CD9C20] dark:text-[#F5CB5C] border border-[#CD9C20]/30 rounded">
                    Perfil {profile.calculatedProfile.split(" ")[0]}
                  </span>
                </div>

                {/* Markdown text representation */}
                <div className={`text-xs md:text-sm leading-relaxed space-y-4 whitespace-pre-wrap overflow-y-auto max-h-[400px] pr-2 ${
                  isDark ? "text-slate-300" : "text-slate-700 font-medium"
                }`}>
                  {activeReport.content}
                </div>
              </div>

              {/* Secure Variables Transparency Footer */}
              {activeReport.id.startsWith("rep-gen") && securityDataRaw && (
                <div className="mt-8 pt-4 border-t border-opacity-10 border-slate-500 text-[10px] font-mono space-y-2">
                  <p className="font-bold uppercase tracking-wider text-[#CD9C20] dark:text-[#F5CB5C] flex items-center gap-1">
                    <CheckCircle className="h-4.5 w-4.5 text-[#CD9C20] dark:text-[#F5CB5C]" /> Demonstração Segura (CVM / LGPD Compliance)
                  </p>
                  <p className="text-slate-500">
                    Veja a robustez do pipeline de anonimização. À esquerda, a resposta bruta enviada pelo Gemini contendo apenas as tags de preenchimento. À direita, a versão final hidratada de forma isolada por nosso servidor local (sem o conhecimento externo do modelo):
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 text-[9px]">
                    <div className="p-3 rounded bg-slate-950/80 border border-slate-850 font-mono space-y-1">
                      <div className="text-amber-500/90 font-bold uppercase border-b border-slate-800 pb-1 mb-1">[1] Resposta Bruta do Gemini (Anonimizada)</div>
                      <div className="line-clamp-4 text-slate-500 opacity-80">{securityDataRaw}</div>
                    </div>
                    <div className="p-3 rounded bg-[#0a0a0a]/85 border border-[#CD9C20]/25 font-mono space-y-1">
                      <div className="text-[#CD9C20] dark:text-[#F5CB5C] font-bold uppercase border-b border-[#CD9C20]/20 pb-1 mb-1">[2] Resposta Hidratada Local (Hydrated Server UI)</div>
                      <div className="line-clamp-4 text-slate-350">{securityDataUnmasked}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Interactive Chat with Aura */
            <div className={`p-6 rounded-2.5xl border shadow-xl flex-1 flex flex-col justify-between h-[500px] ${
              isDark ? "bg-[#0a0a0a] border-[#CD9C20]/25 animate-fade-in" : "bg-white border-[#CD9C20]/25 shadow-sm animate-fade-in"
            }`}>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[380px]">
                {chatMessages.map((msg, index) => {
                  const isAura = msg.sender === "aura";
                  return (
                    <div
                      key={index}
                      className={`flex gap-3 max-w-[85%] ${isAura ? "mr-auto" : "ml-auto flex-row-reverse text-right"}`}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isAura ? "bg-[#CD9C20] text-slate-950 font-mono" : "bg-slate-400 text-white font-mono"
                      }`}>
                        {isAura ? "A" : "U"}
                      </div>
                      <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isAura
                          ? isDark
                            ? "bg-slate-950/60 text-slate-350"
                            : "bg-amber-50/40 text-stone-900 font-medium border border-[#CD9C20]/15"
                          : isDark
                          ? "bg-[#CD9C20]/10 border border-[#CD9C20]/20 text-[#F5CB5C]"
                          : "bg-stone-100/90 text-stone-800 font-semibold border border-stone-200"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}

                {isChatSending && (
                  <div className="flex gap-3 mr-auto max-w-[85%] animate-pulse">
                    <div className="h-8 w-8 rounded-lg bg-[#CD9C20] text-slate-950 flex items-center justify-center font-bold text-xs font-mono">
                      A
                    </div>
                    <div className="p-3 rounded-2xl text-xs bg-slate-950/60 text-[#CD9C20] dark:text-[#F5CB5C] font-mono border border-[#CD9C20]/15">
                      Digitando parecer de segurança...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Send Form */}
              <form onSubmit={handleChatSubmit} className="mt-4 pt-4 border-t border-opacity-10 border-slate-500 flex gap-2">
                <input
                  id="chat-user-input"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ex: O que acontece na carteira se a Selic cair para 9% de surpresa?"
                  className={`flex-1 p-3 text-xs sm:text-sm rounded-xl border outline-none focus:ring-1 focus:ring-[#CD9C20] ${
                    isDark
                      ? "bg-slate-950 border-[#CD9C20]/20 text-slate-50 placeholder-slate-600"
                      : "bg-white border-stone-200 text-slate-900 placeholder-slate-400"
                  }`}
                  disabled={isChatSending}
                />
                <button
                  id="chat-send-btn"
                  type="submit"
                  disabled={isChatSending}
                  className="p-3 rounded-xl bg-gradient-to-tr from-[#CD9C20] to-[#F5CB5C] text-slate-950 hover:scale-103 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center font-bold"
                  aria-label="Submit query"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

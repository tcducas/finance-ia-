import { useState } from "react";
import { UserProfile } from "../types";
import { AlertCircle, ArrowLeft, ArrowRight, Shield, Award, Sparkles } from "lucide-react";

interface OnboardingViewProps {
  isDark: boolean;
  onCompleteOnboarding: (profile: UserProfile) => void;
  onBackToHome: () => void;
}

export default function OnboardingView({ isDark, onCompleteOnboarding, onBackToHome }: OnboardingViewProps) {
  const [userName, setUserName] = useState<string>("");
  const [balance, setBalance] = useState<number>(150000);
  const [step, setStep] = useState<number>(0); // Step 0: Name & Wealth, Step 1: Goal, Step 2: Risk, Step 3: Knowledge, Step 4: Loading Aura AI
  
  // Quiz selections
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [selectedRisk, setSelectedRisk] = useState<string>("");
  const [selectedKnowledge, setSelectedKnowledge] = useState<string>("");

  // Handler for each step
  const handleNextStep = () => {
    if (step === 0 && !userName.trim()) {
      alert("Por favor, informe seu primeiro nome para personalização.");
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      onBackToHome();
    }
  };

  // Final confirmation that triggers the beautiful loading transition
  const handleFinalChoice = (knowledge: string) => {
    setSelectedKnowledge(knowledge);
    setStep(4); // Trigger AI matching spinner screen

    // Calculate simulated profile based on risk psychology selection
    let calculatedProfile: "Conservador" | "Moderado Estratégico" | "Arrojado Dinâmico" = "Moderado Estratégico";
    if (selectedRisk === "Venderia tudo") {
      calculatedProfile = "Conservador";
    } else if (selectedRisk === "Compraria mais") {
      calculatedProfile = "Arrojado Dinâmico";
    }

    const finalProfile: UserProfile = {
      name: userName,
      goals: selectedGoal,
      riskPsychology: selectedRisk,
      knowledgeLevel: knowledge,
      calculatedProfile,
      balance: balance
    };

    // Simulate Aura calculations and redirect after 2.8 seconds
    setTimeout(() => {
      onCompleteOnboarding(finalProfile);
    }, 2800);
  };

  // Step indicator percentages
  const progressPercent = step === 0 ? 10 : step === 1 ? 35 : step === 2 ? 65 : step === 3 ? 90 : 100;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12 md:py-20 min-h-[500px] flex flex-col justify-between">
      {/* ProgressBar - except loading screen */}
      {step < 4 && (
        <div className="w-full space-y-4 mb-8">
          <div className="flex justify-between items-center text-xs font-mono font-medium text-slate-500">
            <button
              onClick={handlePrevStep}
              className="flex items-center gap-1.5 hover:text-[#CD9C20] dark:hover:text-[#F5CB5C] font-semibold cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>
            <span>Passo {step + 1} de 4</span>
          </div>

          <div className="w-full h-1.5 bg-slate-300/40 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#CD9C20] to-[#F5CB5C] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* STEP 0: Personal Name & Wealth Intake */}
      {step === 0 && (
        <div className="space-y-6 my-auto animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs uppercase text-[#CD9C20] dark:text-[#F5CB5C] font-bold font-mono tracking-widest font-serif">COACHING INICIAL</span>
            <h3 className={`text-2xl md:text-3xl font-extrabold tracking-tight font-serif ${isDark ? "text-slate-50" : "text-slate-900"}`}>
              Como deveremos te chamar na área de membros?
            </h3>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Sua resposta é totalmente protegida por criptografia e blindada no gateway local.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Primeiro Nome</label>
              <input
                id="onboarding-name-input"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: João"
                className={`w-full p-4 rounded-xl border font-medium outline-none transition-all focus:ring-1 focus:ring-[#CD9C20] ${
                  isDark
                    ? "bg-slate-900 border-slate-800 text-slate-50 placeholder-slate-600"
                    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
              />
            </div>

            <div>
              <label className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <span>Patrimônio Desejado Para Gestão</span>
                <span className={`font-mono font-bold ${isDark ? "text-[#F5CB5C]" : "text-[#CD9C20]"}`}>
                  R$ {balance.toLocaleString('pt-BR')}
                </span>
              </label>
              <input
                id="onboarding-balance-slider"
                type="range"
                min="5000"
                max="2500000"
                step="5000"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#CD9C20] dark:accent-[#F5CB5C]"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>R$ 5 Mil</span>
                <span>R$ 1 Milhão</span>
                <span>R$ 2.5 Milhões</span>
              </div>
            </div>
          </div>

          <button
            id="onboarding-next-0"
            onClick={handleNextStep}
            className="w-full py-4 text-sm font-bold text-slate-950 bg-gradient-to-r from-[#CD9C20] to-[#F5CB5C] rounded-xl hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2 mt-4 cursor-pointer gold-glow"
          >
            Avançar
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STEP 1: Main Goal selection */}
      {step === 1 && (
        <div className="space-y-6 my-auto animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs uppercase text-[#CD9C20] dark:text-[#F5CB5C] font-bold font-mono tracking-widest font-serif">OBJETIVIDADE</span>
            <h3 className={`text-2xl md:text-3xl font-extrabold tracking-tight font-serif ${isDark ? "text-slate-50" : "text-slate-900"}`}>
              {userName}, o que você busca atingir hoje com seus investimentos?
            </h3>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Sua alocação será moldada de acordo com o horizonte operacional deste objetivo primário.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              id="goal-aposentadoria"
              onClick={() => { setSelectedGoal("Aposentadoria"); setStep(2); }}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between h-40 ${
                selectedGoal === "Aposentadoria"
                  ? "border-[#CD9C20] bg-[#CD9C20]/10"
                  : isDark
                  ? "border-slate-800 bg-slate-900 hover:border-slate-700"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-4xl">🏡</span>
              <div>
                <h4 className={`font-bold font-serif ${isDark ? "text-slate-50" : "text-slate-900"}`}>Aposentadoria de Longo Prazo</h4>
                <p className="text-xs text-slate-500 mt-1">Viver de renda passiva recorrente com segurança patrimonial.</p>
              </div>
            </button>

            <button
              id="goal-imovel"
              onClick={() => { setSelectedGoal("Comprar Imóvel"); setStep(2); }}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between h-40 ${
                selectedGoal === "Comprar Imóvel"
                  ? "border-[#CD9C20] bg-[#CD9C20]/10"
                  : isDark
                  ? "border-slate-800 bg-slate-900 hover:border-slate-700"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-4xl">🏢</span>
              <div>
                <h4 className={`font-bold font-serif ${isDark ? "text-slate-50" : "text-slate-900"}`}>Aquisição de Imóvel</h4>
                <p className="text-xs text-slate-500 mt-1">Acúmulo estruturado com menor volatilidade em médio prazo.</p>
              </div>
            </button>

            <button
              id="goal-multiplicar"
              onClick={() => { setSelectedGoal("Multiplicar Patrimônio"); setStep(2); }}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between h-40 ${
                selectedGoal === "Multiplicar Patrimônio"
                  ? "border-[#CD9C20] bg-[#CD9C20]/10"
                  : isDark
                  ? "border-slate-800 bg-slate-900 hover:border-slate-700"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-4xl text-indigo-400">⚡</span>
              <div>
                <h4 className={`font-bold font-serif ${isDark ? "text-slate-50" : "text-slate-900"}`}>Multiplicar Patrimônio</h4>
                <p className="text-xs text-slate-500 mt-1">Busca agressiva por retornos com auxílio ativo quantitativo.</p>
              </div>
            </button>

            <button
              id="goal-proteger"
              onClick={() => { setSelectedGoal("Proteger do Risco"); setStep(2); }}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between h-40 ${
                selectedGoal === "Proteger do Risco"
                  ? "border-[#CD9C20] bg-[#CD9C20]/10"
                  : isDark
                  ? "border-slate-800 bg-slate-900 hover:border-slate-700"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-4xl">🛡️</span>
              <div>
                <h4 className={`font-bold font-serif ${isDark ? "text-slate-50" : "text-slate-900"}`}>Proteger Meus Recursos</h4>
                <p className="text-xs text-slate-500 mt-1">Superar a inflação interna de forma ultra blinda e garantidora.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Risk Profile Psychology */}
      {step === 2 && (
        <div className="space-y-6 my-auto animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs uppercase text-emerald-400 font-bold font-mono tracking-widest">PSICOLOGIA DE RISCO</span>
            <h3 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? "text-slate-50" : "text-slate-900"}`}>
              {userName}, se suas ações ou investimentos caíssem 15% amanhã, qual seria sua reação emocional imediata?
            </h3>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Sua resposta ditará o grau máximo de exposição a ativos cíclicos ou de alto estresse do seu portfólio.
            </p>
          </div>

          <div className="space-y-3">
            <button
              id="risk-vender"
              onClick={() => { setSelectedRisk("Venderia tudo"); setStep(3); }}
              className={`p-5 w-full rounded-2xl border text-left flex items-center gap-4 transition-all duration-300 cursor-pointer ${
                selectedRisk === "Venderia tudo"
                  ? "border-emerald-500 bg-emerald-500/10"
                  : isDark
                  ? "border-slate-800 bg-slate-900 hover:border-slate-700"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 text-lg font-bold font-mono">
                A
              </div>
              <div>
                <h4 className={`font-bold text-sm ${isDark ? "text-slate-50" : "text-slate-900"}`}>Venderia tudo imediatamente</h4>
                <p className="text-xs text-slate-500">Eu odeio oscilações. Priorizo estabilidade linear total (Foco Conservador).</p>
              </div>
            </button>

            <button
              id="risk-nada"
              onClick={() => { setSelectedRisk("Não faria nada"); setStep(3); }}
              className={`p-5 w-full rounded-2xl border text-left flex items-center gap-4 transition-all duration-300 cursor-pointer ${
                selectedRisk === "Não faria nada"
                  ? "border-emerald-500 bg-emerald-500/10"
                  : isDark
                  ? "border-slate-800 bg-slate-900 hover:border-slate-700"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500 text-lg font-bold font-mono">
                B
              </div>
              <div>
                <h4 className={`font-bold text-sm ${isDark ? "text-slate-50" : "text-slate-900"}`}>Não faria nada / Aguardaria a melhora</h4>
                <p className="text-xs text-slate-500">Compreendo que ciclos de mercado ocorrem e oscilações corrigem no tempo (Moderado).</p>
              </div>
            </button>

            <button
              id="risk-comprar"
              onClick={() => { setSelectedRisk("Compraria mais"); setStep(3); }}
              className={`p-5 w-full rounded-2xl border text-left flex items-center gap-4 transition-all duration-300 cursor-pointer ${
                selectedRisk === "Compraria mais"
                  ? "border-emerald-500 bg-emerald-500/10"
                  : isDark
                  ? "border-slate-800 bg-slate-900 hover:border-slate-700"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 text-lg font-bold font-mono">
                C
              </div>
              <div>
                <h4 className={`font-bold text-sm ${isDark ? "text-slate-50" : "text-slate-900"}`}>Aproveitaria para comprar muito mais barato</h4>
                <p className="text-xs text-slate-500">Quedas são excelentes oportunidades para turbinar aportes estratégicos (Arrojado).</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Knowledge Level selection */}
      {step === 3 && (
        <div className="space-y-6 my-auto animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs uppercase text-[#CD9C20] dark:text-[#F5CB5C] font-bold font-mono tracking-widest font-serif">APARATO TÉCNICO</span>
            <h3 className={`text-2xl md:text-3xl font-extrabold tracking-tight font-serif ${isDark ? "text-slate-50" : "text-slate-900"}`}>
              E qual o seu nível de contato e conhecimento com produtos financeiros?
            </h3>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-655"}`}>
              Nosso Agente Aura adaptará o linguajar técnico nos relatórios de investimentos de acordo com o nível selecionado.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
               id="knowledge-iniciante"
               onClick={() => handleFinalChoice("Iniciante")}
               className={`p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                 isDark ? "border-slate-890 bg-slate-900 hover:border-slate-700" : "border-slate-200 bg-white hover:border-slate-300"
               }`}
            >
              <div className="flex justify-between items-center">
                <h4 className={`font-bold text-sm font-serif ${isDark ? "text-slate-50" : "text-slate-900"}`}>Iniciante</h4>
                <Shield className="h-4 w-4 text-[#CD9C20] dark:text-[#F5CB5C]" />
              </div>
              <p className="text-xs text-slate-500 mt-1">Gostaria de relatórios simples, diretos, com termos mastigados e poucas siglas técnicas.</p>
            </button>

            <button
              id="knowledge-intermediario"
              onClick={() => handleFinalChoice("Intermediário")}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                isDark ? "border-slate-890 bg-slate-900 hover:border-slate-700" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <h4 className={`font-bold text-sm font-serif ${isDark ? "text-slate-50" : "text-slate-900"}`}>Intermediário</h4>
                <Award className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-xs text-slate-500 mt-1">Já entendo o básico de inflação, taxa Selic, CDB, dividendos selvagens e ações.</p>
            </button>

            <button
              id="knowledge-avancado"
              onClick={() => handleFinalChoice("Avançado")}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                isDark ? "border-slate-890 bg-slate-900 hover:border-slate-700" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <h4 className={`font-bold text-sm font-serif ${isDark ? "text-slate-50" : "text-slate-900"}`}>Avançado / Profissional</h4>
                <Sparkles className="h-4 w-4 text-[#CD9C20] dark:text-[#F5CB5C]" />
              </div>
              <p className="text-xs text-slate-500 mt-1">Busco análises microestruturais profundas de taxas, spreads, FIIs logísticos e Duration.</p>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Beautiful Aura Transition with Loading animations */}
      {step === 4 && (
        <div className="my-auto text-center space-y-8 py-16 animate-pulse">
          <div className="relative inline-block">
            {/* Spinning gold ambient ring */}
            <div className="absolute inset-0 rounded-full bg-[#CD9C20]/20 blur-xl animate-pulse" />
            <div className="relative h-24 w-24 rounded-full border-4 border-slate-700 border-t-[#CD9C20] animate-spin flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-[#CD9C20] dark:text-[#F5CB5C] animate-bounce" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className={`text-xl font-extrabold tracking-tight font-serif ${isDark ? "text-slate-50" : "text-slate-900"}`}>
              Consultando o Cérebro Aura...
            </h3>
            <p className="text-xs font-mono text-[#CD9C20] dark:text-[#F5CB5C] tracking-wider">
              O AGENTE AURA ESTÁ CRUZANDO SEUS DADOS COM O MERCADO ATUAL...
            </p>
          </div>

          <div className="max-w-xs mx-auto text-center p-3.5 rounded-xl border border-dashed border-slate-700/60 bg-slate-900/40 text-[10px] text-slate-500 font-mono tracking-wide">
            <div>MASCARANDO VARIÁVEIS DE IDENTIFICAÇÃO (LGPD)</div>
            <div>VALIDANDO DADOS NA SANDBOX DO BACKEND</div>
            <div>ANALISANDO INDEXADORES DE STRESS FINANCEIRO...</div>
          </div>
        </div>
      )}

      {/* Basic Back bar */}
      {step < 4 && (
        <div className="text-center pt-6 text-[10px] text-slate-500 font-mono">
          Suas escolhas definem seu perfil segundo as diretrizes CVM 30.
        </div>
      )}
    </div>
  );
}

/**
 * Types and interfaces for the Aura - AI Investment Advisor
 */

export interface UserProfile {
  name: string;
  goals: string; // "Aposentadoria" | "Comprar Imóvel" | "Multiplicar Patrimônio" | "Proteger do Risco"
  riskPsychology: string; // "Venderia tudo" | "Não faria nada" | "Compraria mais"
  knowledgeLevel: string; // "Iniciante" | "Intermediário" | "Avançado"
  calculatedProfile: "Conservador" | "Moderado Estratégico" | "Arrojado Dinâmico";
  balance: number;
}

export interface SecurityPipelines {
  anonymized: boolean;
  guardrailsPassed: boolean;
  lastInputMasked: string;
  lastOutputHydrated: string;
  executionLogs: string[];
}

export interface AssetAllocationItem {
  name: string;
  percentage: number;
  value: number;
  category: "Renda Fixa" | "FIIs" | "Ações Nacionais" | "Ativos Globais";
  whyIA: string;
  symbol: string;
}

export interface SimulationScenario {
  id: "optimistic" | "neutral" | "stress";
  name: string;
  color: string;
}

export interface ReportItem {
  id: string;
  date: string;
  title: string;
  profile: string;
  summary: string;
  content: string;
}

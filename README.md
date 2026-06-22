# 🚀 AuraFinance - AI-Driven Wealth Management & Portfolio Simulator

AuraFinance is a next-generation fintech application that leverages an autonomous **Financial AI Agent** to analyze, optimize, and protect user investment portfolios. Instead of static dashboards, AuraFinance offers interactive "Stress Testing" scenarios and on-demand conversational financial reports, bridging the gap between advanced artificial intelligence and secure wealth management.

Developed as a high-impact portfolio project demonstrating **Security by Design**, clean architecture, and modern AI Agent implementation.
---

### 1. Backend Setup (FastAPI)

1. Navigate to the backend directory:
```bash
   cd backend
---

## 🎨 Design Philosophy & UX
The interface is built to be clean, premium, and highly accessible, featuring full native support for **Dark Mode** and **Light Mode**.
*   **Dark Mode:** Deep slate backgrounds (`#020617`) with Emerald accents (`#34d399`) representing growth and wealth.
*   **Light Mode:** Clean, high-contrast Slate white backgrounds (`#f8fafc`) for maximum readability.

---

## ✨ Key Features

*   **Pre-Registration Interactive Playground:** A "hook" slider on the landing page that lets anonymous visitors simulate investment returns instantly before creating an account.
*   **Conversational Onboarding (Risk Profiling):** A sleek, 3-step conversational wizard that assesses user risk tolerance dynamically without traditional, boring forms.
*   **Dynamic Portfolio Allocation (The AI Verdict):** Renders beautiful Recharts graphs (Donut/Pie) recommending custom allocations based on the user's profile, accompanied by AI justifications.
*   **Macroeconomic Stress Testing (Differentiator):** A multi-line chart projecting asset growth over 1, 5, 10, or 20 years with interactive triggers:
    *   🟢 *Optimistic Scenario:* High-growth market.
    *   🟡 *Neutral Scenario:* Historical average baseline.
    *   🔴 *Stress Test (Crisis Simulation):* Simulates a major macroeconomic crash to visually demonstrate how the AI-recommended portfolio cushions losses compared to unoptimized ones.
*   **On-Demand AI Financial Reports:** A timeline feed where users can trigger the AI Agent to generate deep-dive performance analyses formatted cleanly in Markdown.
*   **Admin Control Panel:** Dedicated dashboard for administrators to monitor user registration and track AI API token consumption/costs.

---

## 🔒 Security by Design (Architecture)

Financial applications require enterprise-grade security. AuraFinance implements strict guardrails across its stack:

### 1. Data Anonymization (Privacy First)
The Python backend intercepts user data before forwarding it to LLM providers (Gemini/OpenAI). Sensible personal data is stripped, ensuring the AI agent only operates on financial parameters (e.g., `{{USER_BALANCE}}`, `{{RISK_PROFILE}}`), compliant with LGPD/GDPR regulations.

### 2. Prompt Injection Shielding & Pydantic Guardrails
All incoming requests pass through robust FastAPI validation layers (`Pydantic v2`). The AI agent's system instructions strictly restrict its scope to objective financial simulation, rendering it immune to systemic prompt manipulation attempts.

### 3. Isolated Tool Calling (Function Sandbox)
The AI Agent never writes to or alters the database directly. When the agent requests a projection tool (e.g., `tool_calcular_projecao`), the backend validates the parameters, runs the mathematical code in isolation, and feeds the structured JSON back to the AI.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework:** Next.js (React) - App Router
*   **Styling:** Tailwind CSS + Shadcn/ui (Radix Primitives)
*   **Data Visualization:** Recharts (Interactive Line and Donut charts)
*   **Authentication:** Clerk / Supabase Auth (JWT Validation)

### Backend
*   **Framework:** FastAPI (Python 3.11+) - High-performance, asynchronous REST API.
*   **AI Ecosystem:** Gemini API / OpenAI API with native Function Calling.
*   **Database:** Supabase (PostgreSQL) with Row-Level Security (RLS) enabled.
*   **Validation:** Pydantic v2.

---

## 🗄️ Database Schema Overview

```sql
-- Core user profiles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE,
    full_name TEXT,
    investment_profile TEXT DEFAULT 'Não Definido', -- Conservador, Moderado, Arrojado
    total_balance NUMERIC(15, 2) DEFAULT 0.00
);

-- AI Token Usage Logs for Admin Monitoring
CREATE TABLE public.ai_token_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    prompt_tokens INT,
    completion_tokens INT,
    total_tokens INT,
    action_type TEXT, -- 'generate_report', 'portfolio_simulation'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

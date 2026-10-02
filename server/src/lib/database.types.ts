/**
 * Tipos do banco no formato do `supabase gen types typescript`.
 *
 * BOOTSTRAP: derivado 1:1 das migrations em supabase/migrations enquanto o
 * projeto Supabase não está linkado nesta máquina. Assim que estiver, rode:
 *   supabase gen types typescript --project-id <id> > server/src/lib/database.types.ts
 * e este arquivo é substituído sem mudar nenhum consumidor.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          is_admin: boolean;
          plan: 'free' | 'pro';
          plan_updated_at: string | null;
          onboarded_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          is_admin?: boolean;
          plan?: 'free' | 'pro';
          plan_updated_at?: string | null;
          onboarded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          is_admin?: boolean;
          plan?: 'free' | 'pro';
          plan_updated_at?: string | null;
          onboarded_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      investor_profiles: {
        Row: {
          user_id: string;
          risk_profile: 'conservador' | 'moderado' | 'arrojado';
          answers: Json;
          computed_at: string;
        };
        Insert: {
          user_id: string;
          risk_profile: 'conservador' | 'moderado' | 'arrojado';
          answers?: Json;
          computed_at?: string;
        };
        Update: {
          user_id?: string;
          risk_profile?: 'conservador' | 'moderado' | 'arrojado';
          answers?: Json;
          computed_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'receita' | 'despesa';
          category: string;
          amount: number;
          occurred_on: string;
          description: string | null;
          is_recurring: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'receita' | 'despesa';
          category: string;
          amount: number;
          occurred_on: string;
          description?: string | null;
          is_recurring?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'receita' | 'despesa';
          category?: string;
          amount?: number;
          occurred_on?: string;
          description?: string | null;
          is_recurring?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          monthly_limit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          monthly_limit: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          monthly_limit?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          name: string;
          value: number;
          is_liability: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          name: string;
          value: number;
          is_liability?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          name?: string;
          value?: number;
          is_liability?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          context: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          context?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          context?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          kind: 'reserva' | 'compra' | 'aposentadoria' | 'geral';
          target_amount: number;
          current_amount: number;
          monthly_contribution: number;
          annual_rate: number;
          target_date: string | null;
          priority: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          kind?: 'reserva' | 'compra' | 'aposentadoria' | 'geral';
          target_amount: number;
          current_amount?: number;
          monthly_contribution?: number;
          annual_rate?: number;
          target_date?: string | null;
          priority?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          kind?: 'reserva' | 'compra' | 'aposentadoria' | 'geral';
          target_amount?: number;
          current_amount?: number;
          monthly_contribution?: number;
          annual_rate?: number;
          target_date?: string | null;
          priority?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      patrimonio_snapshots: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          asset_class: string;
          value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          asset_class?: string;
          value: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month?: string;
          asset_class?: string;
          value?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_usage: {
        Row: {
          user_id: string;
          period: string;
          kind: 'chat' | 'analyze';
          count: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          period: string;
          kind: 'chat' | 'analyze';
          count?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          period?: string;
          kind?: 'chat' | 'analyze';
          count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      holdings: {
        Row: {
          id: string;
          user_id: string;
          ticker: string;
          market: 'BR' | 'CRYPTO' | 'US';
          asset_class: string;
          quantity: number;
          avg_price: number;
          acquired_on: string | null;
          dividends_received: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ticker: string;
          market?: 'BR' | 'CRYPTO' | 'US';
          asset_class?: string;
          quantity: number;
          avg_price: number;
          acquired_on?: string | null;
          dividends_received?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ticker?: string;
          market?: 'BR' | 'CRYPTO' | 'US';
          asset_class?: string;
          quantity?: number;
          avg_price?: number;
          acquired_on?: string | null;
          dividends_received?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      watchlist: {
        Row: {
          id: string;
          user_id: string;
          ticker: string;
          market: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ticker: string;
          market?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ticker?: string;
          market?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicTables = Database['public']['Tables'];

export type Tables<T extends keyof PublicTables> = PublicTables[T]['Row'];
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]['Insert'];
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]['Update'];

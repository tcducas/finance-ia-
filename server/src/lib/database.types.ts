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

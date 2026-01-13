export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agendamentos_robustos: {
        Row: {
          CONTATO: string | null
          created_at: string | null
          DATA: string
          finalização: string | null
          HORA: string
          id: string
          NOME: string | null
          PROFISSIONAL: string | null
          senha: string | null
          servico: string | null
          STATUS:
            | Database["public"]["Enums"]["status_agendamento_robusto"]
            | null
        }
        Insert: {
          CONTATO?: string | null
          created_at?: string | null
          DATA: string
          finalização?: string | null
          HORA: string
          id?: string
          NOME?: string | null
          PROFISSIONAL?: string | null
          senha?: string | null
          servico?: string | null
          STATUS?:
            | Database["public"]["Enums"]["status_agendamento_robusto"]
            | null
        }
        Update: {
          CONTATO?: string | null
          created_at?: string | null
          DATA?: string
          finalização?: string | null
          HORA?: string
          id?: string
          NOME?: string | null
          PROFISSIONAL?: string | null
          senha?: string | null
          servico?: string | null
          STATUS?:
            | Database["public"]["Enums"]["status_agendamento_robusto"]
            | null
        }
        Relationships: []
      }
      bd_ativo: {
        Row: {
          created_at: string
          id: number
          num: number | null
        }
        Insert: {
          created_at?: string
          id: number
          num?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          num?: number | null
        }
        Relationships: []
      }
      cadastro: {
        Row: {
          contato: string
          created_at: string
          data_nascimento: string
          id: number
          nome: string
          serviços_preferidos: string
          user_id: string | null
        }
        Insert: {
          contato: string
          created_at?: string
          data_nascimento: string
          id?: number
          nome: string
          serviços_preferidos: string
          user_id?: string | null
        }
        Update: {
          contato?: string
          created_at?: string
          data_nascimento?: string
          id?: number
          nome?: string
          serviços_preferidos?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categorias_produto: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          ordem: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          ordem?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      feriados: {
        Row: {
          data: string
          descricao: string
        }
        Insert: {
          data: string
          descricao: string
        }
        Update: {
          data?: string
          descricao?: string
        }
        Relationships: []
      }
      info_loja: {
        Row: {
          address: string | null
          auth_user: string | null
          closing_time: string
          escolha_serviços: string | null
          id: string
          instructions: string | null
          maps_url: string | null
          name: string
          nome_profissionais: string | null
          opening_time: string
          slot_interval_minutes: number
          url_insta: string | null
          url_phone: string | null
        }
        Insert: {
          address?: string | null
          auth_user?: string | null
          closing_time?: string
          escolha_serviços?: string | null
          id?: string
          instructions?: string | null
          maps_url?: string | null
          name: string
          nome_profissionais?: string | null
          opening_time?: string
          slot_interval_minutes?: number
          url_insta?: string | null
          url_phone?: string | null
        }
        Update: {
          address?: string | null
          auth_user?: string | null
          closing_time?: string
          escolha_serviços?: string | null
          id?: string
          instructions?: string | null
          maps_url?: string | null
          name?: string
          nome_profissionais?: string | null
          opening_time?: string
          slot_interval_minutes?: number
          url_insta?: string | null
          url_phone?: string | null
        }
        Relationships: []
      }
      produtos_loja: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          created_at: string
          foto_url: string | null
          id: string
          nome: string
          ordem: number | null
          preco: string
          quantidade: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          nome: string
          ordem?: number | null
          preco: string
          quantidade?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          preco?: string
          quantidade?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_loja_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produto"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      info_loja_public: {
        Row: {
          address: string | null
          closing_time: string | null
          escolha_serviços: string | null
          id: string | null
          instructions: string | null
          maps_url: string | null
          name: string | null
          nome_profissionais: string | null
          opening_time: string | null
          slot_interval_minutes: number | null
          url_insta: string | null
          url_phone: string | null
        }
        Insert: {
          address?: string | null
          closing_time?: string | null
          escolha_serviços?: string | null
          id?: string | null
          instructions?: string | null
          maps_url?: string | null
          name?: string | null
          nome_profissionais?: string | null
          opening_time?: string | null
          slot_interval_minutes?: number | null
          url_insta?: string | null
          url_phone?: string | null
        }
        Update: {
          address?: string | null
          closing_time?: string | null
          escolha_serviços?: string | null
          id?: string | null
          instructions?: string | null
          maps_url?: string | null
          name?: string | null
          nome_profissionais?: string | null
          opening_time?: string | null
          slot_interval_minutes?: number | null
          url_insta?: string | null
          url_phone?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      status_agendamento_robusto:
        | "AGENDADO"
        | "REAGENDADO"
        | "CANCELADO"
        | "CONCLUÍDO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      status_agendamento_robusto: [
        "AGENDADO",
        "REAGENDADO",
        "CANCELADO",
        "CONCLUÍDO",
      ],
    },
  },
} as const

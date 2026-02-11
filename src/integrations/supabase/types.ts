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
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          key_hash: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_hash: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_hash?: string
          name?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          serial_number: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          serial_number: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          serial_number?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          document_type: string
          event_id: string | null
          file_name: string
          file_url: string
          id: string
          uploaded_at: string
          user_id: string
          venue_id: string | null
        }
        Insert: {
          document_type: string
          event_id?: string | null
          file_name: string
          file_url: string
          id?: string
          uploaded_at?: string
          user_id: string
          venue_id?: string | null
        }
        Update: {
          document_type?: string
          event_id?: string | null
          file_name?: string
          file_url?: string
          id?: string
          uploaded_at?: string
          user_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          bride_grandparents: string | null
          bride_name: string | null
          bride_parents: string | null
          created_at: string
          device_rental_cost: number | null
          device_returned: boolean | null
          documents_complete: boolean | null
          event_date: string
          event_type: string
          groom_grandparents: string | null
          groom_name: string | null
          groom_parents: string | null
          id: string
          invitation_design_url: string | null
          invitation_text: string | null
          owner_id: string
          payment_completed: boolean | null
          seller_payme_id: string | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          bride_grandparents?: string | null
          bride_name?: string | null
          bride_parents?: string | null
          created_at?: string
          device_rental_cost?: number | null
          device_returned?: boolean | null
          documents_complete?: boolean | null
          event_date: string
          event_type?: string
          groom_grandparents?: string | null
          groom_name?: string | null
          groom_parents?: string | null
          id?: string
          invitation_design_url?: string | null
          invitation_text?: string | null
          owner_id: string
          payment_completed?: boolean | null
          seller_payme_id?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          bride_grandparents?: string | null
          bride_name?: string | null
          bride_parents?: string | null
          created_at?: string
          device_rental_cost?: number | null
          device_returned?: boolean | null
          documents_complete?: boolean | null
          event_date?: string
          event_type?: string
          groom_grandparents?: string | null
          groom_name?: string | null
          groom_parents?: string | null
          id?: string
          invitation_design_url?: string | null
          invitation_text?: string | null
          owner_id?: string
          payment_completed?: boolean | null
          seller_payme_id?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          email: string | null
          event_id: string
          full_name: string
          id: string
          invitation_sent: boolean | null
          number_of_guests: number
          phone: string | null
          relationship: string | null
          rsvp_date: string | null
          rsvp_status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_id: string
          full_name: string
          id?: string
          invitation_sent?: boolean | null
          number_of_guests?: number
          phone?: string | null
          relationship?: string | null
          rsvp_date?: string | null
          rsvp_status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: string
          full_name?: string
          id?: string
          invitation_sent?: boolean | null
          number_of_guests?: number
          phone?: string | null
          relationship?: string | null
          rsvp_date?: string | null
          rsvp_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          file_url: string | null
          for_month: string
          id: string
          venue_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          file_url?: string | null
          for_month: string
          id?: string
          venue_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          file_url?: string | null
          for_month?: string
          id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_leads: {
        Row: {
          created_at: string
          email: string | null
          event_date: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_date?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          event_date?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          lead_type: string
          phone: string | null
          status: string | null
          updated_at: string
          venue_address: string | null
          venue_count: number | null
          venue_name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          lead_type: string
          phone?: string | null
          status?: string | null
          updated_at?: string
          venue_address?: string | null
          venue_count?: number | null
          venue_name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          lead_type?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
          venue_address?: string | null
          venue_count?: number | null
          venue_name?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_completed: boolean | null
          lead_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      required_documents: {
        Row: {
          created_at: string
          document_type: string
          for_type: string
          id: string
          is_required: boolean | null
        }
        Insert: {
          created_at?: string
          document_type: string
          for_type: string
          id?: string
          is_required?: boolean | null
        }
        Update: {
          created_at?: string
          document_type?: string
          for_type?: string
          id?: string
          is_required?: boolean | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          description: string
          id: string
          response: string | null
          status: string | null
          subject: string
          ticket_type: string
          updated_at: string
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          response?: string | null
          status?: string | null
          subject: string
          ticket_type: string
          updated_at?: string
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          response?: string | null
          status?: string | null
          subject?: string
          ticket_type?: string
          updated_at?: string
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          admin_email: string | null
          id: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          admin_email?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          admin_email?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string
          due_date: string | null
          id: string
          is_completed: boolean | null
          lead_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          blessing_text: string | null
          created_at: string
          event_id: string
          id: string
          installments: number | null
          payer_email: string | null
          payer_name: string
          payer_phone: string | null
          payme_sale_id: string | null
          payme_transaction_id: string | null
          payment_status: string | null
          receipt_url: string | null
          relationship: string | null
          transaction_date: string
          venue_id: string | null
        }
        Insert: {
          amount: number
          blessing_text?: string | null
          created_at?: string
          event_id: string
          id?: string
          installments?: number | null
          payer_email?: string | null
          payer_name: string
          payer_phone?: string | null
          payme_sale_id?: string | null
          payme_transaction_id?: string | null
          payment_status?: string | null
          receipt_url?: string | null
          relationship?: string | null
          transaction_date?: string
          venue_id?: string | null
        }
        Update: {
          amount?: number
          blessing_text?: string | null
          created_at?: string
          event_id?: string
          id?: string
          installments?: number | null
          payer_email?: string | null
          payer_name?: string
          payer_phone?: string | null
          payme_sale_id?: string | null
          payme_transaction_id?: string | null
          payment_status?: string | null
          receipt_url?: string | null
          relationship?: string | null
          transaction_date?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string
          banner_url: string | null
          created_at: string
          email: string | null
          id: string
          landing_page_config: Json | null
          logo_url: string | null
          monthly_subscription: number | null
          name: string
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address: string
          banner_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          landing_page_config?: Json | null
          logo_url?: string | null
          monthly_subscription?: number | null
          name: string
          owner_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          banner_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          landing_page_config?: Json | null
          logo_url?: string | null
          monthly_subscription?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "venue_owner" | "event_owner"
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
      user_role: ["admin", "venue_owner", "event_owner"],
    },
  },
} as const

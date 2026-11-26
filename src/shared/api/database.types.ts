export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      activity_events: {
        Row: {
          body: string | null
          changes: Json | null
          client_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          id: string
          invoice_id: string | null
          occurred_at: string
          source: Database['public']['Enums']['activity_source']
          task_id: string | null
          type: Database['public']['Enums']['activity_type']
          updated_at: string
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          body?: string | null
          changes?: Json | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          invoice_id?: string | null
          occurred_at?: string
          source?: Database['public']['Enums']['activity_source']
          task_id?: string | null
          type: Database['public']['Enums']['activity_type']
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body?: string | null
          changes?: Json | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          invoice_id?: string | null
          occurred_at?: string
          source?: Database['public']['Enums']['activity_source']
          task_id?: string | null
          type?: Database['public']['Enums']['activity_type']
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activity_events_workspace_id_client_id_fkey'
            columns: ['workspace_id', 'client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['workspace_id', 'id']
          },
          {
            foreignKeyName: 'activity_events_workspace_id_deal_id_fkey'
            columns: ['workspace_id', 'deal_id']
            isOneToOne: false
            referencedRelation: 'deals'
            referencedColumns: ['workspace_id', 'id']
          },
          {
            foreignKeyName: 'activity_events_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_events_workspace_id_invoice_id_fkey'
            columns: ['workspace_id', 'invoice_id']
            isOneToOne: false
            referencedRelation: 'invoices'
            referencedColumns: ['workspace_id', 'id']
          },
          {
            foreignKeyName: 'activity_events_workspace_id_task_id_fkey'
            columns: ['workspace_id', 'task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['workspace_id', 'id']
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          job_title: string | null
          name: string
          phone: string | null
          updated_at: string
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          job_title?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          job_title?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'client_contacts_workspace_id_client_id_fkey'
            columns: ['workspace_id', 'client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['workspace_id', 'id']
          },
          {
            foreignKeyName: 'client_contacts_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          archived_at: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: Database['public']['Enums']['client_source']
          tags: string[]
          tax_number: string | null
          type: Database['public']['Enums']['client_type']
          updated_at: string
          website: string | null
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          address?: string | null
          archived_at?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: Database['public']['Enums']['client_source']
          tags?: string[]
          tax_number?: string | null
          type?: Database['public']['Enums']['client_type']
          updated_at?: string
          website?: string | null
          workspace_id: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: Database['public']['Enums']['client_source']
          tags?: string[]
          tax_number?: string | null
          type?: Database['public']['Enums']['client_type']
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'clients_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      deals: {
        Row: {
          amount_cents: number
          archived_at: string | null
          client_id: string
          closed_at: string | null
          created_at: string
          description: string | null
          expected_close_date: string | null
          id: string
          lost_comment: string | null
          lost_reason: Database['public']['Enums']['deal_lost_reason'] | null
          name: string
          position: number
          source: Database['public']['Enums']['client_source']
          stage: Database['public']['Enums']['deal_stage']
          updated_at: string
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          amount_cents?: number
          archived_at?: string | null
          client_id: string
          closed_at?: string | null
          created_at?: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_comment?: string | null
          lost_reason?: Database['public']['Enums']['deal_lost_reason'] | null
          name: string
          position?: number
          source?: Database['public']['Enums']['client_source']
          stage?: Database['public']['Enums']['deal_stage']
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          archived_at?: string | null
          client_id?: string
          closed_at?: string | null
          created_at?: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_comment?: string | null
          lost_reason?: Database['public']['Enums']['deal_lost_reason'] | null
          name?: string
          position?: number
          source?: Database['public']['Enums']['client_source']
          stage?: Database['public']['Enums']['deal_stage']
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'deals_workspace_id_client_id_fkey'
            columns: ['workspace_id', 'client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['workspace_id', 'id']
          },
          {
            foreignKeyName: 'deals_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      invoice_counters: {
        Row: {
          last_seq: number
          workspace_id: string
          year: number
        }
        ComputedFields: never
        Insert: {
          last_seq: number
          workspace_id: string
          year: number
        }
        Update: {
          last_seq?: number
          workspace_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: 'invoice_counters_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_total_cents: number
          position: number
          quantity: number
          unit_price_cents: number
          updated_at: string
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_total_cents?: number
          position?: number
          quantity: number
          unit_price_cents: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_total_cents?: number
          position?: number
          quantity?: number
          unit_price_cents?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invoice_items_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoice_items_workspace_id_invoice_id_fkey'
            columns: ['workspace_id', 'invoice_id']
            isOneToOne: false
            referencedRelation: 'invoices'
            referencedColumns: ['workspace_id', 'id']
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          currency: Database['public']['Enums']['currency_code']
          deal_id: string | null
          due_date: string
          id: string
          issue_date: string
          note: string | null
          number: string | null
          number_seq: number
          number_year: number
          paid_cents: number
          sent_at: string | null
          status: Database['public']['Enums']['invoice_status']
          subtotal_cents: number
          total_cents: number
          updated_at: string
          vat_cents: number
          vat_rate_bp: number | null
          voided_at: string | null
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          client_id: string
          created_at?: string
          currency?: Database['public']['Enums']['currency_code']
          deal_id?: string | null
          due_date: string
          id?: string
          issue_date?: string
          note?: string | null
          number?: never
          number_seq?: number
          number_year?: number
          paid_cents?: number
          sent_at?: string | null
          status?: Database['public']['Enums']['invoice_status']
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          vat_cents?: number
          vat_rate_bp?: number | null
          voided_at?: string | null
          workspace_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          currency?: Database['public']['Enums']['currency_code']
          deal_id?: string | null
          due_date?: string
          id?: string
          issue_date?: string
          note?: string | null
          number?: never
          number_seq?: number
          number_year?: number
          paid_cents?: number
          sent_at?: string | null
          status?: Database['public']['Enums']['invoice_status']
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          vat_cents?: number
          vat_rate_bp?: number | null
          voided_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invoices_workspace_id_client_id_fkey'
            columns: ['workspace_id', 'client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['workspace_id', 'id']
          },
          {
            foreignKeyName: 'invoices_workspace_id_deal_id_fkey'
            columns: ['workspace_id', 'deal_id']
            isOneToOne: false
            referencedRelation: 'deals'
            referencedColumns: ['workspace_id', 'id']
          },
          {
            foreignKeyName: 'invoices_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          comment: string | null
          created_at: string
          id: string
          invoice_id: string
          method: Database['public']['Enums']['payment_method']
          paid_on: string
          updated_at: string
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          amount_cents: number
          comment?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          method?: Database['public']['Enums']['payment_method']
          paid_on: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          comment?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database['public']['Enums']['payment_method']
          paid_on?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_workspace_id_invoice_id_fkey'
            columns: ['workspace_id', 'invoice_id']
            isOneToOne: false
            referencedRelation: 'invoices'
            referencedColumns: ['workspace_id', 'id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          timezone: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          priority: Database['public']['Enums']['task_priority']
          status: Database['public']['Enums']['task_status']
          title: string
          updated_at: string
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          priority?: Database['public']['Enums']['task_priority']
          status?: Database['public']['Enums']['task_status']
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          priority?: Database['public']['Enums']['task_priority']
          status?: Database['public']['Enums']['task_status']
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_workspace_id_client_id_fkey'
            columns: ['workspace_id', 'client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['workspace_id', 'id']
          },
          {
            foreignKeyName: 'tasks_workspace_id_deal_id_fkey'
            columns: ['workspace_id', 'deal_id']
            isOneToOne: false
            referencedRelation: 'deals'
            referencedColumns: ['workspace_id', 'id']
          },
          {
            foreignKeyName: 'tasks_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database['public']['Enums']['workspace_role']
          user_id: string
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          role?: Database['public']['Enums']['workspace_role']
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database['public']['Enums']['workspace_role']
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workspace_members_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      workspaces: {
        Row: {
          bank_name: string | null
          business_address: string | null
          business_name: string | null
          created_at: string
          currency: Database['public']['Enums']['currency_code']
          iban: string | null
          id: string
          is_vat_payer: boolean
          logo_path: string | null
          name: string
          tax_id: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          bank_name?: string | null
          business_address?: string | null
          business_name?: string | null
          created_at?: string
          currency?: Database['public']['Enums']['currency_code']
          iban?: string | null
          id?: string
          is_vat_payer?: boolean
          logo_path?: string | null
          name: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          bank_name?: string | null
          business_address?: string | null
          business_name?: string | null
          created_at?: string
          currency?: Database['public']['Enums']['currency_code']
          iban?: string | null
          id?: string
          is_vat_payer?: boolean
          logo_path?: string | null
          name?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_demo_accounts: { Args: Record<PropertyKey, never>; Returns: number }
      clear_workspace_data: { Args: { ws: string }; Returns: undefined }
      demo_workspace_id: { Args: Record<PropertyKey, never>; Returns: string }
      generate_demo_data: { Args: { ws: string }; Returns: undefined }
      has_workspace_role: { Args: { roles: string[]; ws: string }; Returns: boolean }
      is_workspace_folder_member: { Args: { object_name: string }; Returns: boolean }
      is_workspace_member: { Args: { ws: string }; Returns: boolean }
      jsonb_changes: { Args: { keys: string[]; new_row: Json; old_row: Json }; Returns: Json }
      log_activity: {
        Args: {
          event_type: Database['public']['Enums']['activity_type']
          p_changes?: Json
          p_client_id: string
          p_deal_id?: string
          p_invoice_id?: string
          p_task_id?: string
          ws: string
        }
        Returns: undefined
      }
      reset_demo_data: { Args: Record<PropertyKey, never>; Returns: undefined }
      seed_demo_data: { Args: Record<PropertyKey, never>; Returns: undefined }
    }
    Enums: {
      activity_source: 'system' | 'manual'
      activity_type:
        | 'call'
        | 'meeting'
        | 'message'
        | 'note'
        | 'client_created'
        | 'client_updated'
        | 'client_archived'
        | 'client_restored'
        | 'deal_created'
        | 'deal_updated'
        | 'deal_stage_changed'
        | 'deal_archived'
        | 'deal_reopened'
        | 'task_created'
        | 'task_completed'
        | 'invoice_status_changed'
        | 'payment_recorded'
        | 'payment_deleted'
      client_source: 'upwork' | 'referral' | 'direct' | 'other'
      client_type: 'company' | 'individual'
      currency_code: 'UAH' | 'USD' | 'EUR'
      deal_lost_reason: 'price' | 'chose_another_freelancer' | 'no_budget' | 'no_response' | 'other'
      deal_stage: 'lead' | 'proposal_sent' | 'negotiation' | 'won' | 'lost'
      invoice_status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'void'
      payment_method: 'bank_transfer' | 'upwork' | 'payoneer' | 'wise' | 'other'
      task_priority: 'low' | 'medium' | 'high'
      task_status: 'todo' | 'done'
      workspace_role: 'owner' | 'admin' | 'member'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_source: ['system', 'manual'],
      activity_type: [
        'call',
        'meeting',
        'message',
        'note',
        'client_created',
        'client_updated',
        'client_archived',
        'client_restored',
        'deal_created',
        'deal_updated',
        'deal_stage_changed',
        'deal_archived',
        'deal_reopened',
        'task_created',
        'task_completed',
        'invoice_status_changed',
        'payment_recorded',
        'payment_deleted',
      ],
      client_source: ['upwork', 'referral', 'direct', 'other'],
      client_type: ['company', 'individual'],
      currency_code: ['UAH', 'USD', 'EUR'],
      deal_lost_reason: ['price', 'chose_another_freelancer', 'no_budget', 'no_response', 'other'],
      deal_stage: ['lead', 'proposal_sent', 'negotiation', 'won', 'lost'],
      invoice_status: ['draft', 'sent', 'partially_paid', 'paid', 'void'],
      payment_method: ['bank_transfer', 'upwork', 'payoneer', 'wise', 'other'],
      task_priority: ['low', 'medium', 'high'],
      task_status: ['todo', 'done'],
      workspace_role: ['owner', 'admin', 'member'],
    },
  },
} as const

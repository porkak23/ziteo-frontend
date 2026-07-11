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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      auth_throttle: {
        Row: {
          attempts: number
          id: number
          identifier: string
          window_start: string
        }
        Insert: {
          attempts?: number
          id?: number
          identifier: string
          window_start?: string
        }
        Update: {
          attempts?: number
          id?: number
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string | null
          id: string
          product_id: string
          quantity: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          product_id: string
          quantity: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          icon_name: string
          id: string
          name: string
          order_index: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          icon_name: string
          id?: string
          name: string
          order_index?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          icon_name?: string
          id?: string
          name?: string
          order_index?: number | null
        }
        Relationships: []
      }
      contact_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          maestro_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          maestro_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          maestro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_events_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_events_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_events_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      contract_bids: {
        Row: {
          amount: number
          contract_id: string
          created_at: string | null
          id: string
          maestro_id: string
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string | null
          id?: string
          maestro_id: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string | null
          id?: string
          maestro_id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_bids_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_bids_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contract_bids_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contract_bids_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      contracts: {
        Row: {
          actual_end_date: string | null
          budget: number | null
          city: string | null
          constructor_id: string
          contract_date: string | null
          created_at: string | null
          description: string | null
          estimated_end_date: string | null
          id: string
          maestro_id: string
          project_id: string | null
          scope: Json | null
          start_date: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          actual_end_date?: string | null
          budget?: number | null
          city?: string | null
          constructor_id: string
          contract_date?: string | null
          created_at?: string | null
          description?: string | null
          estimated_end_date?: string | null
          id?: string
          maestro_id: string
          project_id?: string | null
          scope?: Json | null
          start_date?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_end_date?: string | null
          budget?: number | null
          city?: string | null
          constructor_id?: string
          contract_date?: string | null
          created_at?: string | null
          description?: string | null
          estimated_end_date?: string | null
          id?: string
          maestro_id?: string
          project_id?: string | null
          scope?: Json | null
          start_date?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_constructor_id_fkey"
            columns: ["constructor_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contracts_constructor_id_fkey"
            columns: ["constructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contracts_constructor_id_fkey"
            columns: ["constructor_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contracts_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contracts_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contracts_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          accepted_at: string | null
          cargo_type: string
          collect_amount: number | null
          created_at: string
          delivered_at: string | null
          distance_km: number | null
          driver_id: string | null
          dropoff_address: string | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          estimated_fee: number | null
          id: string
          notes: string | null
          order_id: string
          payment_required: boolean
          picked_up_at: string | null
          pickup_address: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          cargo_type?: string
          collect_amount?: number | null
          created_at?: string
          delivered_at?: string | null
          distance_km?: number | null
          driver_id?: string | null
          dropoff_address?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          estimated_fee?: number | null
          id?: string
          notes?: string | null
          order_id: string
          payment_required?: boolean
          picked_up_at?: string | null
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          cargo_type?: string
          collect_amount?: number | null
          created_at?: string
          delivered_at?: string | null
          distance_km?: number | null
          driver_id?: string | null
          dropoff_address?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          estimated_fee?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          payment_required?: boolean
          picked_up_at?: string | null
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          created_by: string
          details: string
          id: string
          order_id: string
          reason: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          details: string
          id?: string
          order_id: string
          reason: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          details?: string
          id?: string
          order_id?: string
          reason?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "disputes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "disputes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          driver_id: string
          heading: number | null
          lat: number
          lng: number
          updated_at: string
        }
        Insert: {
          driver_id: string
          heading?: number | null
          lat: number
          lng: number
          updated_at?: string
        }
        Update: {
          driver_id?: string
          heading?: number | null
          lat?: number
          lng?: number
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string | null
          created_at: string | null
          current_url: string | null
          description: string
          id: string
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_url?: string | null
          description: string
          id?: string
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_url?: string | null
          description?: string
          id?: string
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      licitacion_postulaciones: {
        Row: {
          created_at: string
          id: string
          licitacion_id: string
          maestro_id: string
          message: string | null
          proposed_budget: number | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          licitacion_id: string
          maestro_id: string
          message?: string | null
          proposed_budget?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          licitacion_id?: string
          maestro_id?: string
          message?: string | null
          proposed_budget?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "licitacion_postulaciones_licitacion_id_fkey"
            columns: ["licitacion_id"]
            isOneToOne: false
            referencedRelation: "licitaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licitacion_postulaciones_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "licitacion_postulaciones_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "licitacion_postulaciones_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      licitaciones: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          city: string | null
          constructor_id: string
          created_at: string
          description: string | null
          id: string
          intent: string | null
          item_category: string | null
          specialty: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          constructor_id: string
          created_at?: string
          description?: string | null
          id?: string
          intent?: string | null
          item_category?: string | null
          specialty?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          constructor_id?: string
          created_at?: string
          description?: string | null
          id?: string
          intent?: string | null
          item_category?: string | null
          specialty?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licitaciones_constructor_id_fkey"
            columns: ["constructor_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "licitaciones_constructor_id_fkey"
            columns: ["constructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "licitaciones_constructor_id_fkey"
            columns: ["constructor_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      maestro_habilidades: {
        Row: {
          created_at: string
          id: string
          maestro_id: string
          porcentaje: number
          skill: string
        }
        Insert: {
          created_at?: string
          id?: string
          maestro_id: string
          porcentaje?: number
          skill: string
        }
        Update: {
          created_at?: string
          id?: string
          maestro_id?: string
          porcentaje?: number
          skill?: string
        }
        Relationships: [
          {
            foreignKeyName: "maestro_habilidades_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "maestro_habilidades_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "maestro_habilidades_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      maestro_profiles: {
        Row: {
          available: boolean | null
          created_at: string | null
          experience_years: number | null
          id: string
          max_concurrent_projects: number | null
          portfolio_url: string | null
          rate_amount: number
          rate_type: string | null
          specialties: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available?: boolean | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          max_concurrent_projects?: number | null
          portfolio_url?: string | null
          rate_amount: number
          rate_type?: string | null
          specialties?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available?: boolean | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          max_concurrent_projects?: number | null
          portfolio_url?: string | null
          rate_amount?: number
          rate_type?: string | null
          specialties?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maestro_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "maestro_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "maestro_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          is_rental: boolean
          order_id: string
          price_unit: number
          product_id: string
          quantity: number
          rental_days: number | null
          rental_deposit: number | null
          rental_end_date: string | null
          rental_start_date: string | null
          rental_status: string | null
          rental_unit_rate: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_rental?: boolean
          order_id: string
          price_unit: number
          product_id: string
          quantity: number
          rental_days?: number | null
          rental_deposit?: number | null
          rental_end_date?: string | null
          rental_start_date?: string | null
          rental_status?: string | null
          rental_unit_rate?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_rental?: boolean
          order_id?: string
          price_unit?: number
          product_id?: string
          quantity?: number
          rental_days?: number | null
          rental_deposit?: number | null
          rental_end_date?: string | null
          rental_start_date?: string | null
          rental_status?: string | null
          rental_unit_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cargo_type: string | null
          constructor_id: string
          created_at: string | null
          delivered_date: string | null
          delivery_address: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          delivery_method: string | null
          due_date: string | null
          estimated_delivery_at: string | null
          expires_at: string
          id: string
          notes: string | null
          order_date: string | null
          payment_confirmed_at: string | null
          payment_confirmed_by: string | null
          payment_evidence_uploaded_at: string | null
          payment_evidence_url: string | null
          payment_rejection_reason: string | null
          project_id: string | null
          provider_id: string
          status: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          cargo_type?: string | null
          constructor_id: string
          created_at?: string | null
          delivered_date?: string | null
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_method?: string | null
          due_date?: string | null
          estimated_delivery_at?: string | null
          expires_at?: string
          id?: string
          notes?: string | null
          order_date?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by?: string | null
          payment_evidence_uploaded_at?: string | null
          payment_evidence_url?: string | null
          payment_rejection_reason?: string | null
          project_id?: string | null
          provider_id: string
          status?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          cargo_type?: string | null
          constructor_id?: string
          created_at?: string | null
          delivered_date?: string | null
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_method?: string | null
          due_date?: string | null
          estimated_delivery_at?: string | null
          expires_at?: string
          id?: string
          notes?: string | null
          order_date?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by?: string | null
          payment_evidence_uploaded_at?: string | null
          payment_evidence_url?: string | null
          payment_rejection_reason?: string | null
          project_id?: string | null
          provider_id?: string
          status?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_constructor_id_fkey"
            columns: ["constructor_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_constructor_id_fkey"
            columns: ["constructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_constructor_id_fkey"
            columns: ["constructor_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_payment_confirmed_by_fkey"
            columns: ["payment_confirmed_by"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_payment_confirmed_by_fkey"
            columns: ["payment_confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_payment_confirmed_by_fkey"
            columns: ["payment_confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      otps: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          purpose: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          purpose?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          purpose?: string
          used?: boolean
        }
        Relationships: []
      }
      payment_method_audit: {
        Row: {
          changed_at: string
          field: string
          id: string
          new_hash: string | null
          old_hash: string | null
          owner_id: string
        }
        Insert: {
          changed_at?: string
          field: string
          id?: string
          new_hash?: string | null
          old_hash?: string | null
          owner_id: string
        }
        Update: {
          changed_at?: string
          field?: string
          id?: string
          new_hash?: string | null
          old_hash?: string | null
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_method_audit_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_method_audit_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_method_audit_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          confirm_token: string
          created_at: string
          created_by: string
          delivery_id: string | null
          evidence_url: string | null
          id: string
          method: string
          order_id: string
          settled_at: string | null
          status: string
          token_used: boolean
        }
        Insert: {
          amount: number
          confirm_token: string
          created_at?: string
          created_by: string
          delivery_id?: string | null
          evidence_url?: string | null
          id: string
          method: string
          order_id: string
          settled_at?: string | null
          status?: string
          token_used?: boolean
        }
        Update: {
          amount?: number
          confirm_token?: string
          created_at?: string
          created_by?: string
          delivery_id?: string | null
          evidence_url?: string | null
          id?: string
          method?: string
          order_id?: string
          settled_at?: string | null
          status?: string
          token_used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_transactions_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          bulk_min_qty: number | null
          bulk_price: number | null
          bulk_unit: string | null
          category: string | null
          category_id: string | null
          construction_stage: string | null
          created_at: string | null
          description: string | null
          id: string
          image_bucket: string | null
          image_url: string | null
          is_active: boolean | null
          is_deleted: boolean | null
          item_condition: string | null
          listing_type: string | null
          name: string
          price_unit: number
          promo_active: boolean
          promo_price: number | null
          promo_until: string | null
          provider_id: string
          rental_daily_rate: number | null
          rental_deposit: number | null
          rental_min_days: number | null
          rental_weekly_rate: number | null
          seller_type: string
          specs: Json | null
          stock: number | null
          stock_quantity: number
          unit_type: string
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          active?: boolean | null
          bulk_min_qty?: number | null
          bulk_price?: number | null
          bulk_unit?: string | null
          category?: string | null
          category_id?: string | null
          construction_stage?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_bucket?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_deleted?: boolean | null
          item_condition?: string | null
          listing_type?: string | null
          name: string
          price_unit: number
          promo_active?: boolean
          promo_price?: number | null
          promo_until?: string | null
          provider_id: string
          rental_daily_rate?: number | null
          rental_deposit?: number | null
          rental_min_days?: number | null
          rental_weekly_rate?: number | null
          seller_type?: string
          specs?: Json | null
          stock?: number | null
          stock_quantity?: number
          unit_type?: string
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          active?: boolean | null
          bulk_min_qty?: number | null
          bulk_price?: number | null
          bulk_unit?: string | null
          category?: string | null
          category_id?: string | null
          construction_stage?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_bucket?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_deleted?: boolean | null
          item_condition?: string | null
          listing_type?: string | null
          name?: string
          price_unit?: number
          promo_active?: boolean
          promo_price?: number | null
          promo_until?: string | null
          provider_id?: string
          rental_daily_rate?: number | null
          rental_deposit?: number | null
          rental_min_days?: number | null
          rental_weekly_rate?: number | null
          seller_type?: string
          specs?: Json | null
          stock?: number | null
          stock_quantity?: number
          unit_type?: string
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_role: string
          avatar_url: string | null
          beta_acknowledged_at: string | null
          bio: string | null
          city: string
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string
          pin_hash: string
          preferred_auth_method: string | null
          terms_accepted_at: string | null
          totp_enabled: boolean | null
          totp_secret: string | null
          updated_at: string | null
          user_id: string
          waitlist: boolean | null
        }
        Insert: {
          active_role: string
          avatar_url?: string | null
          beta_acknowledged_at?: string | null
          bio?: string | null
          city: string
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone: string
          pin_hash: string
          preferred_auth_method?: string | null
          terms_accepted_at?: string | null
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id: string
          waitlist?: boolean | null
        }
        Update: {
          active_role?: string
          avatar_url?: string | null
          beta_acknowledged_at?: string | null
          bio?: string | null
          city?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string
          pin_hash?: string
          preferred_auth_method?: string | null
          terms_accepted_at?: string | null
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id?: string
          waitlist?: boolean | null
        }
        Relationships: []
      }
      project_applications: {
        Row: {
          applicant_id: string
          created_at: string | null
          id: string
          message: string | null
          project_id: string
          role: string
          status: string | null
        }
        Insert: {
          applicant_id: string
          created_at?: string | null
          id?: string
          message?: string | null
          project_id: string
          role: string
          status?: string | null
        }
        Update: {
          applicant_id?: string
          created_at?: string | null
          id?: string
          message?: string | null
          project_id?: string
          role?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_materials: {
        Row: {
          added_at: string | null
          id: string
          notes: string | null
          product_id: string
          project_id: string
          quantity: number
          unit_type: string
          updated_at: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          project_id: string
          quantity: number
          unit_type: string
          updated_at?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          project_id?: string
          quantity?: number
          unit_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_shares: {
        Row: {
          access_level: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          message: string | null
          project_id: string
          shared_by_id: string
          shared_with_id: string
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          project_id: string
          shared_by_id: string
          shared_with_id: string
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          project_id?: string
          shared_by_id?: string
          shared_with_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_shares_shared_by_id_fkey"
            columns: ["shared_by_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_shares_shared_by_id_fkey"
            columns: ["shared_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_shares_shared_by_id_fkey"
            columns: ["shared_by_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_shares_shared_with_id_fkey"
            columns: ["shared_with_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_shares_shared_with_id_fkey"
            columns: ["shared_with_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_shares_shared_with_id_fkey"
            columns: ["shared_with_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      projects: {
        Row: {
          city: string | null
          constructor_id: string
          created_at: string | null
          description: string | null
          estimated_budget: number | null
          estimated_end_date: string | null
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          name: string
          needs_maestro: boolean | null
          needs_materials: boolean | null
          photo_url: string | null
          progress: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          constructor_id: string
          created_at?: string | null
          description?: string | null
          estimated_budget?: number | null
          estimated_end_date?: string | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          name: string
          needs_maestro?: boolean | null
          needs_materials?: boolean | null
          photo_url?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          constructor_id?: string
          created_at?: string | null
          description?: string | null
          estimated_budget?: number | null
          estimated_end_date?: string | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          needs_maestro?: boolean | null
          needs_materials?: boolean | null
          photo_url?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_constructor_id_fkey"
            columns: ["constructor_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_constructor_id_fkey"
            columns: ["constructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_constructor_id_fkey"
            columns: ["constructor_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quotations: {
        Row: {
          buyer_id: string
          created_at: string
          expires_at: string | null
          id: string
          items: Json
          order_id: string | null
          pdf_url: string | null
          provider_id: string
          status: string
          subtotal: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          items?: Json
          order_id?: string | null
          pdf_url?: string | null
          provider_id: string
          status?: string
          subtotal: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          items?: Json
          order_id?: string | null
          pdf_url?: string | null
          provider_id?: string
          status?: string
          subtotal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quotations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quotations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quotations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quotations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quotations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rated_user_id: string
          related_entity_id: string
          related_entity_type: string
          reviewer_id: string
          score: number
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rated_user_id: string
          related_entity_id: string
          related_entity_type: string
          reviewer_id: string
          score: number
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rated_user_id?: string
          related_entity_id?: string
          related_entity_type?: string
          reviewer_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_rated_user_id_fkey"
            columns: ["rated_user_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ratings_rated_user_id_fkey"
            columns: ["rated_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ratings_rated_user_id_fkey"
            columns: ["rated_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ratings_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ratings_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ratings_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          contract_id: string | null
          created_at: string
          id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      transport_requests: {
        Row: {
          accepted_at: string | null
          cargo_type: string
          city: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          driver_id: string | null
          dropoff_address: string
          dropoff_lat: number | null
          dropoff_lng: number | null
          id: string
          pickup_address: string
          pickup_lat: number | null
          pickup_lng: number | null
          requester_id: string
          requester_role: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          cargo_type: string
          city?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          driver_id?: string | null
          dropoff_address: string
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          id?: string
          pickup_address: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          requester_id: string
          requester_role?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          cargo_type?: string
          city?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          driver_id?: string | null
          dropoff_address?: string
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          id?: string
          pickup_address?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          requester_id?: string
          requester_role?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          company_name: string | null
          created_at: string | null
          delivery_time_hours: number | null
          free_shipping_threshold: number | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          min_order_amount: number | null
          onboarding_complete: boolean | null
          onboarding_completed: boolean | null
          payment_bank_transfer: string | null
          payment_cash: boolean | null
          payment_qr_hash: string | null
          payment_qr_updated_at: string | null
          payment_qr_url: string | null
          role: string
          service_zones: string[] | null
          specialty: string | null
          store_address: string | null
          store_description: string | null
          store_lat: number | null
          store_lng: number | null
          store_logo_url: string | null
          store_name: string | null
          updated_at: string | null
          user_id: string
          vehicle_plate: string | null
          vehicle_type: string | null
          years_experience: number | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          delivery_time_hours?: number | null
          free_shipping_threshold?: number | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          min_order_amount?: number | null
          onboarding_complete?: boolean | null
          onboarding_completed?: boolean | null
          payment_bank_transfer?: string | null
          payment_cash?: boolean | null
          payment_qr_hash?: string | null
          payment_qr_updated_at?: string | null
          payment_qr_url?: string | null
          role: string
          service_zones?: string[] | null
          specialty?: string | null
          store_address?: string | null
          store_description?: string | null
          store_lat?: number | null
          store_lng?: number | null
          store_logo_url?: string | null
          store_name?: string | null
          updated_at?: string | null
          user_id: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
          years_experience?: number | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          delivery_time_hours?: number | null
          free_shipping_threshold?: number | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          min_order_amount?: number | null
          onboarding_complete?: boolean | null
          onboarding_completed?: boolean | null
          payment_bank_transfer?: string | null
          payment_cash?: boolean | null
          payment_qr_hash?: string | null
          payment_qr_updated_at?: string | null
          payment_qr_url?: string | null
          role?: string
          service_zones?: string[] | null
          specialty?: string | null
          store_address?: string | null
          store_description?: string | null
          store_lat?: number | null
          store_lng?: number | null
          store_logo_url?: string | null
          store_name?: string | null
          updated_at?: string | null
          user_id?: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "maestros_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_invalid_city"
            referencedColumns: ["user_id"]
          },
        ]
      }
      waitlist: {
        Row: {
          city: string
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string
          role: string
          user_id: string | null
        }
        Insert: {
          city: string
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone: string
          role: string
          user_id?: string | null
        }
        Update: {
          city?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      kpi_active_maestros: {
        Row: {
          available: number | null
          profile_complete: number | null
          total_maestros: number | null
        }
        Relationships: []
      }
      kpi_active_providers: {
        Row: {
          total_providers: number | null
          with_products: number | null
          without_products: number | null
        }
        Relationships: []
      }
      kpi_gmv_by_city: {
        Row: {
          city: string | null
          confirmed_gmv: number | null
          total_gmv: number | null
          total_orders: number | null
        }
        Relationships: []
      }
      kpi_licitaciones_engagement: {
        Row: {
          engagement_rate: number | null
          total: number | null
          with_bids: number | null
          without_bids: number | null
        }
        Relationships: []
      }
      kpi_orders_by_day: {
        Row: {
          day: string | null
          gmv: number | null
          order_count: number | null
        }
        Relationships: []
      }
      kpi_payment_confirmation_rate: {
        Row: {
          cancelled: number | null
          confirmation_rate: number | null
          confirmed: number | null
          expired: number | null
          total_orders: number | null
        }
        Relationships: []
      }
      kpi_signups_by_day: {
        Row: {
          by_role: Json | null
          day: string | null
          signups: number | null
        }
        Relationships: []
      }
      maestros_view: {
        Row: {
          available: boolean | null
          avatar_url: string | null
          city: string | null
          experience_years: number | null
          name: string | null
          rate_amount: number | null
          rate_type: string | null
          specialties: string[] | null
          user_id: string | null
        }
        Relationships: []
      }
      profiles_invalid_city: {
        Row: {
          city: string | null
          created_at: string | null
          name: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          name?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_delivery: { Args: { p_delivery_id: string }; Returns: Json }
      accept_transport_request: {
        Args: { p_request_id: string }
        Returns: Json
      }
      advance_transport_request: {
        Args: { p_new_status: string; p_request_id: string }
        Returns: Json
      }
      broadcast_licitacion: {
        Args: { p_licitacion_id: string }
        Returns: number
      }
      check_throttle: {
        Args: {
          p_identifier: string
          p_max_attempts: number
          p_window_minutes: number
        }
        Returns: boolean
      }
      confirm_payment_by_provider: {
        Args: { p_order_id: string }
        Returns: Json
      }
      confirm_rental_return: {
        Args: { p_order_item_id: string }
        Returns: undefined
      }
      create_delivery_by_provider: {
        Args: {
          p_driver_name?: string
          p_mode: string
          p_order_id: string
          p_vehicle_plate?: string
        }
        Returns: Json
      }
      create_dispute: {
        Args: { p_details: string; p_order_id: string; p_reason: string }
        Returns: Json
      }
      expire_old_quotations: { Args: never; Returns: undefined }
      expire_pending_orders: { Args: never; Returns: number }
      generate_quotation: {
        Args: {
          p_buyer_id: string
          p_expires_in_days?: number
          p_items: Json
          p_provider_id: string
          p_subtotal: number
        }
        Returns: string
      }
      get_user_rating: {
        Args: { target_user_id: string }
        Returns: {
          avg_score: number
          total_reviews: number
        }[]
      }
      list_orders_cursor: {
        Args: {
          p_cursor_created_at?: string
          p_cursor_id?: string
          p_limit?: number
          p_status?: string
        }
        Returns: {
          cargo_type: string
          constructor_id: string
          created_at: string
          id: string
          provider_id: string
          status: string
          total: number
        }[]
      }
      list_products_cursor: {
        Args: {
          p_category_id?: string
          p_cursor_created_at?: string
          p_cursor_id?: string
          p_limit?: number
          p_provider_id?: string
          p_stage?: string
        }
        Returns: {
          active: boolean
          category_id: string
          construction_stage: string
          created_at: string
          id: string
          image_url: string
          name: string
          price_unit: number
          provider_id: string
          stock_quantity: number
          unit_type: string
        }[]
      }
      log_contact_event: {
        Args: { p_event_type: string; p_maestro_id: string }
        Returns: undefined
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      mark_rental_completed: {
        Args: { p_order_item_id: string }
        Returns: undefined
      }
      mark_rental_in_use: { Args: { p_order_id: string }; Returns: undefined }
      place_order: {
        Args: {
          p_cargo_type?: string
          p_constructor_id: string
          p_delivery_address?: string
          p_delivery_lat?: number
          p_delivery_lng?: number
          p_delivery_method?: string
          p_items: Json
          p_project_id?: string
          p_provider_id: string
          p_total: number
        }
        Returns: string
      }
      promote_user_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: undefined
      }
      reject_payment_by_provider: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: Json
      }
      resolve_dispute: {
        Args: { p_dispute_id: string; p_resolution_notes?: string }
        Returns: Json
      }
      send_notification: {
        Args: {
          p_message: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      settle_delivery_payment: {
        Args: {
          p_confirm_token: string
          p_evidence_url?: string
          p_transaction_id: string
        }
        Returns: Json
      }
      start_delivery_payment: {
        Args: {
          p_delivery_id: string
          p_method: string
          p_transaction_id: string
        }
        Returns: Json
      }
      store_qr_hash: {
        Args: { p_hash: string; p_role?: string }
        Returns: undefined
      }
      switch_active_role: { Args: { new_role: string }; Returns: undefined }
      update_delivery_status: {
        Args: { p_delivery_id: string; p_new_status: string }
        Returns: Json
      }
      upload_payment_evidence: {
        Args: { p_evidence_url: string; p_order_id: string }
        Returns: Json
      }
      upsert_driver_location: {
        Args: { p_heading?: number; p_lat: number; p_lng: number }
        Returns: undefined
      }
      vehicle_to_cargo_type: { Args: { p_vehicle: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

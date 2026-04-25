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
            referencedRelation: "profiles"
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
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      contracts: {
        Row: {
          actual_end_date: string | null
          constructor_id: string
          contract_date: string | null
          created_at: string | null
          description: string | null
          estimated_end_date: string | null
          id: string
          initial_amount: number | null
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
          constructor_id: string
          contract_date?: string | null
          created_at?: string | null
          description?: string | null
          estimated_end_date?: string | null
          id?: string
          initial_amount?: number | null
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
          constructor_id?: string
          contract_date?: string | null
          created_at?: string | null
          description?: string | null
          estimated_end_date?: string | null
          id?: string
          initial_amount?: number | null
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
            referencedRelation: "profiles"
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
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
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
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price_unit: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price_unit: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price_unit?: number
          product_id?: string
          quantity?: number
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
          constructor_id: string
          created_at: string | null
          delivered_date: string | null
          due_date: string | null
          id: string
          notes: string | null
          order_date: string | null
          project_id: string | null
          provider_id: string
          status: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          constructor_id: string
          created_at?: string | null
          delivered_date?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          project_id?: string | null
          provider_id: string
          status?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          constructor_id?: string
          created_at?: string | null
          delivered_date?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
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
            referencedRelation: "profiles"
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
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          image_bucket: string | null
          image_url: string | null
          is_deleted: boolean | null
          name: string
          price_unit: number
          provider_id: string
          specs: Json | null
          stock_quantity: number
          unit_type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_bucket?: string | null
          image_url?: string | null
          is_deleted?: boolean | null
          name: string
          price_unit: number
          provider_id: string
          specs?: Json | null
          stock_quantity?: number
          unit_type?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_bucket?: string | null
          image_url?: string | null
          is_deleted?: boolean | null
          name?: string
          price_unit?: number
          provider_id?: string
          specs?: Json | null
          stock_quantity?: number
          unit_type?: string
          updated_at?: string | null
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
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_role: string
          avatar_url: string | null
          bio: string | null
          city: string
          created_at: string | null
          id: string
          name: string
          phone: string
          pin_hash: string
          preferred_auth_method: string | null
          totp_enabled: boolean | null
          totp_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_role: string
          avatar_url?: string | null
          bio?: string | null
          city: string
          created_at?: string | null
          id?: string
          name: string
          phone: string
          pin_hash: string
          preferred_auth_method?: string | null
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_role?: string
          avatar_url?: string | null
          bio?: string | null
          city?: string
          created_at?: string | null
          id?: string
          name?: string
          phone?: string
          pin_hash?: string
          preferred_auth_method?: string | null
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id?: string
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
            referencedRelation: "profiles"
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
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_shares_shared_with_id_fkey"
            columns: ["shared_with_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      projects: {
        Row: {
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
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
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
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
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
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_constructor_id_fkey"
            columns: ["constructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ratings_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_name: string | null
          created_at: string | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          onboarding_completed: boolean | null
          role: string
          specialty: string | null
          store_description: string | null
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
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          role: string
          specialty?: string | null
          store_description?: string | null
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
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          role?: string
          specialty?: string | null
          store_description?: string | null
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
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      deliveries: {
        Row: {
          id: string
          order_id: string
          driver_id: string | null
          status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'failed'
          pickup_address: string | null
          dropoff_address: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          distance_km: number | null
          estimated_fee: number | null
          notes: string | null
          accepted_at: string | null
          picked_up_at: string | null
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          driver_id?: string | null
          status?: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'failed'
          pickup_address?: string | null
          dropoff_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          distance_km?: number | null
          estimated_fee?: number | null
          notes?: string | null
          accepted_at?: string | null
          picked_up_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          driver_id?: string | null
          status?: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'failed'
          pickup_address?: string | null
          dropoff_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          distance_km?: number | null
          estimated_fee?: number | null
          notes?: string | null
          accepted_at?: string | null
          picked_up_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_rating: {
        Args: { target_user_id: string }
        Returns: {
          avg_score: number
          total_reviews: number
        }[]
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      switch_active_role: { Args: { new_role: string }; Returns: undefined }
      place_order: {
        Args: {
          p_constructor_id: string
          p_provider_id: string
          p_total: number
          p_items: { product_id: string; quantity: number; price_unit: number }[]
        }
        Returns: string
      }
      accept_delivery: {
        Args: { p_delivery_id: string }
        Returns: { success: boolean; message?: string; delivery_id?: string }
      }
      update_delivery_status: {
        Args: { p_delivery_id: string; p_new_status: string }
        Returns: { success: boolean; new_status: string }
      }
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

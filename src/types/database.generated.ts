// THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
// Re-generate with: supabase gen types typescript --project-id dlizxnlwhnbargobvzmi > src/types/database.generated.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          diff: Json | null;
          entity: string;
          entity_id: string | null;
          id: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          diff?: Json | null;
          entity: string;
          entity_id?: string | null;
          id?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          diff?: Json | null;
          entity?: string;
          entity_id?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_log_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      category: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      device: {
        Row: {
          connection: string | null;
          created_at: string;
          id: string;
          is_default: boolean;
          name: string;
          type: string;
        };
        Insert: {
          connection?: string | null;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name: string;
          type: string;
        };
        Update: {
          connection?: string | null;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name?: string;
          type?: string;
        };
        Relationships: [];
      };
      discount: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          kind: string;
          label: string;
          value: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind: string;
          label: string;
          value: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind?: string;
          label?: string;
          value?: number;
        };
        Relationships: [];
      };
      ingredient: {
        Row: {
          category: string | null;
          created_at: string;
          current_stock: number;
          id: string;
          last_restocked_at: string | null;
          min_stock: number;
          name: string;
          unit: string;
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          current_stock?: number;
          id?: string;
          last_restocked_at?: string | null;
          min_stock?: number;
          name: string;
          unit: string;
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          current_stock?: number;
          id?: string;
          last_restocked_at?: string | null;
          min_stock?: number;
          name?: string;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      integration: {
        Row: {
          config: Json;
          created_at: string;
          id: string;
          provider: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          id?: string;
          provider: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          id?: string;
          provider?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          created_at: string;
          id: string;
          last_counted_at: string | null;
          product_id: string;
          qty_on_hand: number;
          qty_reserved: number;
          reorder_point: number;
          reorder_qty: number;
          unit: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_counted_at?: string | null;
          product_id: string;
          qty_on_hand?: number;
          qty_reserved?: number;
          reorder_point?: number;
          reorder_qty?: number;
          unit?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_counted_at?: string | null;
          product_id?: string;
          qty_on_hand?: number;
          qty_reserved?: number;
          reorder_point?: number;
          reorder_qty?: number;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'product';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory_movement: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          inventory_id: string;
          kind: Database['public']['Enums']['inventory_movement_kind'];
          note: string | null;
          qty_after: number;
          qty_delta: number;
          reference_id: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          inventory_id: string;
          kind: Database['public']['Enums']['inventory_movement_kind'];
          note?: string | null;
          qty_after: number;
          qty_delta: number;
          reference_id?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          inventory_id?: string;
          kind?: Database['public']['Enums']['inventory_movement_kind'];
          note?: string | null;
          qty_after?: number;
          qty_delta?: number;
          reference_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_movement_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_movement_inventory_id_fkey';
            columns: ['inventory_id'];
            isOneToOne: false;
            referencedRelation: 'inventory';
            referencedColumns: ['id'];
          },
        ];
      };
      menu_item: {
        Row: {
          category_id: string;
          created_at: string;
          emoji: string | null;
          id: string;
          image_url: string | null;
          is_available: boolean;
          name: string;
          price: number;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          emoji?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          name: string;
          price: number;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          emoji?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          name?: string;
          price?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'menu_item_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'category';
            referencedColumns: ['id'];
          },
        ];
      };
      order: {
        Row: {
          cooking_at: string | null;
          created_at: string;
          customer_type: string;
          discount_id: string | null;
          discount_total: number;
          discount_type: string;
          discount_value: number;
          done_at: string | null;
          grand_total: number;
          id: string;
          order_no: string;
          paid_at: string | null;
          payment_status: Database['public']['Enums']['order_payment_status'];
          placed_at: string;
          placed_by: string | null;
          ready_at: string | null;
          service_total: number;
          status: Database['public']['Enums']['order_status'];
          subtotal: number;
          table_label: string | null;
          tax_total: number;
          updated_at: string;
        };
        Insert: {
          cooking_at?: string | null;
          created_at?: string;
          customer_type?: string;
          discount_id?: string | null;
          discount_total?: number;
          discount_type?: string;
          discount_value?: number;
          done_at?: string | null;
          grand_total?: number;
          id?: string;
          order_no?: string;
          paid_at?: string | null;
          payment_status?: Database['public']['Enums']['order_payment_status'];
          placed_at?: string;
          placed_by?: string | null;
          ready_at?: string | null;
          service_total?: number;
          status?: Database['public']['Enums']['order_status'];
          subtotal?: number;
          table_label?: string | null;
          tax_total?: number;
          updated_at?: string;
        };
        Update: {
          cooking_at?: string | null;
          created_at?: string;
          customer_type?: string;
          discount_id?: string | null;
          discount_total?: number;
          discount_type?: string;
          discount_value?: number;
          done_at?: string | null;
          grand_total?: number;
          id?: string;
          order_no?: string;
          paid_at?: string | null;
          payment_status?: Database['public']['Enums']['order_payment_status'];
          placed_at?: string;
          placed_by?: string | null;
          ready_at?: string | null;
          service_total?: number;
          status?: Database['public']['Enums']['order_status'];
          subtotal?: number;
          table_label?: string | null;
          tax_total?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_discount_id_fkey';
            columns: ['discount_id'];
            isOneToOne: false;
            referencedRelation: 'discount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_placed_by_fkey';
            columns: ['placed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      order_item: {
        Row: {
          created_at: string;
          id: string;
          line_total: number;
          menu_item_id: string;
          name_snapshot: string;
          order_id: string;
          qty: number;
          station_status: string;
          unit_price: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          line_total: number;
          menu_item_id: string;
          name_snapshot: string;
          order_id: string;
          qty: number;
          station_status?: string;
          unit_price: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          line_total?: number;
          menu_item_id?: string;
          name_snapshot?: string;
          order_id?: string;
          qty?: number;
          station_status?: string;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_item_menu_item_id_fkey';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_item';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_item_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'order';
            referencedColumns: ['id'];
          },
        ];
      };
      payment: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          idempotency_key: string;
          method: string;
          order_id: string;
          paid_at: string | null;
          provider: string;
          provider_ref: string | null;
          raw_payload: Json | null;
          status: Database['public']['Enums']['payment_status'];
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          idempotency_key: string;
          method: string;
          order_id: string;
          paid_at?: string | null;
          provider?: string;
          provider_ref?: string | null;
          raw_payload?: Json | null;
          status?: Database['public']['Enums']['payment_status'];
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          method?: string;
          order_id?: string;
          paid_at?: string | null;
          provider?: string;
          provider_ref?: string | null;
          raw_payload?: Json | null;
          status?: Database['public']['Enums']['payment_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'payment_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'order';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_method_config: {
        Row: {
          description: string | null;
          fee_bps: number;
          is_enabled: boolean;
          method: string;
          updated_at: string;
        };
        Insert: {
          description?: string | null;
          fee_bps?: number;
          is_enabled?: boolean;
          method: string;
          updated_at?: string;
        };
        Update: {
          description?: string | null;
          fee_bps?: number;
          is_enabled?: boolean;
          method?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product: {
        Row: {
          barcode: string | null;
          category_id: string | null;
          cost_price: number;
          created_at: string;
          description: string | null;
          emoji: string | null;
          id: string;
          image_url: string | null;
          is_available: boolean;
          name: string;
          price: number;
          sku: string | null;
          sort_order: number;
          track_inventory: boolean;
          updated_at: string;
        };
        Insert: {
          barcode?: string | null;
          category_id?: string | null;
          cost_price?: number;
          created_at?: string;
          description?: string | null;
          emoji?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          name: string;
          price: number;
          sku?: string | null;
          sort_order?: number;
          track_inventory?: boolean;
          updated_at?: string;
        };
        Update: {
          barcode?: string | null;
          category_id?: string | null;
          cost_price?: number;
          created_at?: string;
          description?: string | null;
          emoji?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          name?: string;
          price?: number;
          sku?: string | null;
          sort_order?: number;
          track_inventory?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'product_category';
            referencedColumns: ['id'];
          },
        ];
      };
      product_category: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: Database['public']['Enums']['app_role'];
          status: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: Database['public']['Enums']['app_role'];
          status?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: Database['public']['Enums']['app_role'];
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      receipt_config: {
        Row: {
          auto_print: boolean;
          footer: string | null;
          header_line_1: string | null;
          header_line_2: string | null;
          id: number;
          show_logo: boolean;
          show_qr: boolean;
          show_tax: boolean;
          singleton: boolean;
          updated_at: string;
        };
        Insert: {
          auto_print?: boolean;
          footer?: string | null;
          header_line_1?: string | null;
          header_line_2?: string | null;
          id?: number;
          show_logo?: boolean;
          show_qr?: boolean;
          show_tax?: boolean;
          singleton?: boolean;
          updated_at?: string;
        };
        Update: {
          auto_print?: boolean;
          footer?: string | null;
          header_line_1?: string | null;
          header_line_2?: string | null;
          id?: number;
          show_logo?: boolean;
          show_qr?: boolean;
          show_tax?: boolean;
          singleton?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipe_item: {
        Row: {
          id: string;
          ingredient_id: string;
          menu_item_id: string;
          qty_per_unit: number;
        };
        Insert: {
          id?: string;
          ingredient_id: string;
          menu_item_id: string;
          qty_per_unit: number;
        };
        Update: {
          id?: string;
          ingredient_id?: string;
          menu_item_id?: string;
          qty_per_unit?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_item_ingredient_id_fkey';
            columns: ['ingredient_id'];
            isOneToOne: false;
            referencedRelation: 'ingredient';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_item_menu_item_id_fkey';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_item';
            referencedColumns: ['id'];
          },
        ];
      };
      stock_movement: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          ingredient_id: string;
          qty_delta: number;
          reason: string | null;
          ref_order_id: string | null;
          type: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ingredient_id: string;
          qty_delta: number;
          reason?: string | null;
          ref_order_id?: string | null;
          type: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ingredient_id?: string;
          qty_delta?: number;
          reason?: string | null;
          ref_order_id?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_movement_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_movement_ingredient_id_fkey';
            columns: ['ingredient_id'];
            isOneToOne: false;
            referencedRelation: 'ingredient';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_movement_ref_order_id_fkey';
            columns: ['ref_order_id'];
            isOneToOne: false;
            referencedRelation: 'order';
            referencedColumns: ['id'];
          },
        ];
      };
      store_settings: {
        Row: {
          address: string | null;
          business_name: string | null;
          closes_at: string | null;
          created_at: string;
          currency: string;
          email: string | null;
          handle: string | null;
          id: number;
          logo_url: string | null;
          opens_at: string | null;
          phone: string | null;
          service_charge_bps: number;
          singleton: boolean;
          tax_rate_bps: number;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          business_name?: string | null;
          closes_at?: string | null;
          created_at?: string;
          currency?: string;
          email?: string | null;
          handle?: string | null;
          id?: number;
          logo_url?: string | null;
          opens_at?: string | null;
          phone?: string | null;
          service_charge_bps?: number;
          singleton?: boolean;
          tax_rate_bps?: number;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          business_name?: string | null;
          closes_at?: string | null;
          created_at?: string;
          currency?: string;
          email?: string | null;
          handle?: string | null;
          id?: number;
          logo_url?: string | null;
          opens_at?: string | null;
          phone?: string | null;
          service_charge_bps?: number;
          singleton?: boolean;
          tax_rate_bps?: number;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      transaction: {
        Row: {
          cashier_id: string | null;
          completed_at: string | null;
          created_at: string;
          discount_amount: number;
          discount_id: string | null;
          grand_total: number;
          id: string;
          note: string | null;
          payment_status: Database['public']['Enums']['order_payment_status'];
          status: Database['public']['Enums']['transaction_status'];
          subtotal: number;
          tax_amount: number;
          txn_no: string;
          updated_at: string;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        Insert: {
          cashier_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          discount_amount?: number;
          discount_id?: string | null;
          grand_total?: number;
          id?: string;
          note?: string | null;
          payment_status?: Database['public']['Enums']['order_payment_status'];
          status?: Database['public']['Enums']['transaction_status'];
          subtotal?: number;
          tax_amount?: number;
          txn_no: string;
          updated_at?: string;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          cashier_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          discount_amount?: number;
          discount_id?: string | null;
          grand_total?: number;
          id?: string;
          note?: string | null;
          payment_status?: Database['public']['Enums']['order_payment_status'];
          status?: Database['public']['Enums']['transaction_status'];
          subtotal?: number;
          tax_amount?: number;
          txn_no?: string;
          updated_at?: string;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'transaction_cashier_id_fkey';
            columns: ['cashier_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_discount_id_fkey';
            columns: ['discount_id'];
            isOneToOne: false;
            referencedRelation: 'discount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_voided_by_fkey';
            columns: ['voided_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      transaction_item: {
        Row: {
          cost_snapshot: number;
          created_at: string;
          id: string;
          line_total: number;
          name_snapshot: string;
          price_snapshot: number;
          product_id: string | null;
          qty: number;
          sku_snapshot: string | null;
          transaction_id: string;
        };
        Insert: {
          cost_snapshot?: number;
          created_at?: string;
          id?: string;
          line_total: number;
          name_snapshot: string;
          price_snapshot: number;
          product_id?: string | null;
          qty: number;
          sku_snapshot?: string | null;
          transaction_id: string;
        };
        Update: {
          cost_snapshot?: number;
          created_at?: string;
          id?: string;
          line_total?: number;
          name_snapshot?: string;
          price_snapshot?: number;
          product_id?: string | null;
          qty?: number;
          sku_snapshot?: string | null;
          transaction_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transaction_item_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_item_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'transaction';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      adjust_stock: {
        Args: {
          p_ingredient_id: string;
          p_qty_delta: number;
          p_reason?: string;
          p_type: string;
        };
        Returns: {
          created_at: string;
          created_by: string | null;
          id: string;
          ingredient_id: string;
          qty_delta: number;
          reason: string | null;
          ref_order_id: string | null;
          type: string;
        };
        SetofOptions: {
          from: '*';
          to: 'stock_movement';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      advance_order_status: {
        Args: {
          p_order_id: string;
          p_to: Database['public']['Enums']['order_status'];
        };
        Returns: {
          cooking_at: string | null;
          created_at: string;
          customer_type: string;
          discount_id: string | null;
          discount_total: number;
          discount_type: string;
          discount_value: number;
          done_at: string | null;
          grand_total: number;
          id: string;
          order_no: string;
          paid_at: string | null;
          payment_status: Database['public']['Enums']['order_payment_status'];
          placed_at: string;
          placed_by: string | null;
          ready_at: string | null;
          service_total: number;
          status: Database['public']['Enums']['order_status'];
          subtotal: number;
          table_label: string | null;
          tax_total: number;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'order';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      auth_role: {
        Args: never;
        Returns: Database['public']['Enums']['app_role'];
      };
      consume_stock_for_order: {
        Args: { p_order_id: string };
        Returns: undefined;
      };
      pay_order_cash: {
        Args: {
          p_amount: number;
          p_idempotency_key: string;
          p_order_id: string;
        };
        Returns: {
          amount: number;
          created_at: string;
          id: string;
          idempotency_key: string;
          method: string;
          order_id: string;
          paid_at: string | null;
          provider: string;
          provider_ref: string | null;
          raw_payload: Json | null;
          status: Database['public']['Enums']['payment_status'];
        };
        SetofOptions: {
          from: '*';
          to: 'payment';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      place_order: {
        Args: { payload: Json };
        Returns: {
          cooking_at: string | null;
          created_at: string;
          customer_type: string;
          discount_id: string | null;
          discount_total: number;
          discount_type: string;
          discount_value: number;
          done_at: string | null;
          grand_total: number;
          id: string;
          order_no: string;
          paid_at: string | null;
          payment_status: Database['public']['Enums']['order_payment_status'];
          placed_at: string;
          placed_by: string | null;
          ready_at: string | null;
          service_total: number;
          status: Database['public']['Enums']['order_status'];
          subtotal: number;
          table_label: string | null;
          tax_total: number;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'order';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      app_role: 'owner' | 'manager' | 'cashier' | 'kitchen';
      inventory_movement_kind: 'sale' | 'return' | 'purchase' | 'adjustment' | 'waste';
      order_payment_status: 'unpaid' | 'paid' | 'refunded' | 'void';
      order_status: 'pending' | 'cooking' | 'ready' | 'done' | 'paid' | 'void';
      payment_status: 'pending' | 'settled' | 'failed' | 'refunded' | 'expired';
      transaction_status: 'open' | 'completed' | 'void';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ['owner', 'manager', 'cashier', 'kitchen'],
      inventory_movement_kind: ['sale', 'return', 'purchase', 'adjustment', 'waste'],
      order_payment_status: ['unpaid', 'paid', 'refunded', 'void'],
      order_status: ['pending', 'cooking', 'ready', 'done', 'paid', 'void'],
      payment_status: ['pending', 'settled', 'failed', 'refunded', 'expired'],
      transaction_status: ['open', 'completed', 'void'],
    },
  },
} as const;

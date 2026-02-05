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
      campaigns: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          status: string | null
          system: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string | null
          system?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          system?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      factions: {
        Row: {
          allies: string | null
          campaign_id: string
          created_at: string
          description: string | null
          enemies: string | null
          goals: string | null
          headquarters: string | null
          id: string
          leader: string | null
          name: string
          symbol_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allies?: string | null
          campaign_id: string
          created_at?: string
          description?: string | null
          enemies?: string | null
          goals?: string | null
          headquarters?: string | null
          id?: string
          leader?: string | null
          name: string
          symbol_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allies?: string | null
          campaign_id?: string
          created_at?: string
          description?: string | null
          enemies?: string | null
          goals?: string | null
          headquarters?: string | null
          id?: string
          leader?: string | null
          name?: string
          symbol_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "factions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_boards: {
        Row: {
          background_color: string | null
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          background_color?: string | null
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          background_color?: string | null
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigation_boards_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_clues: {
        Row: {
          board_id: string
          clue_type: string | null
          color: string | null
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          is_pinned: boolean | null
          position_x: number
          position_y: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_id: string
          clue_type?: string | null
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          position_x?: number
          position_y?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_id?: string
          clue_type?: string | null
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          position_x?: number
          position_y?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigation_clues_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "investigation_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_connections: {
        Row: {
          board_id: string
          color: string | null
          created_at: string
          id: string
          label: string | null
          source_clue_id: string
          target_clue_id: string
          user_id: string
        }
        Insert: {
          board_id: string
          color?: string | null
          created_at?: string
          id?: string
          label?: string | null
          source_clue_id: string
          target_clue_id: string
          user_id: string
        }
        Update: {
          board_id?: string
          color?: string | null
          created_at?: string
          id?: string
          label?: string | null
          source_clue_id?: string
          target_clue_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigation_connections_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "investigation_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_connections_source_clue_id_fkey"
            columns: ["source_clue_id"]
            isOneToOne: false
            referencedRelation: "investigation_clues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_connections_target_clue_id_fkey"
            columns: ["target_clue_id"]
            isOneToOne: false
            referencedRelation: "investigation_clues"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          government: string | null
          id: string
          image_url: string | null
          name: string
          notable_features: string | null
          notes: string | null
          parent_id: string | null
          population: string | null
          secrets: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          government?: string | null
          id?: string
          image_url?: string | null
          name: string
          notable_features?: string | null
          notes?: string | null
          parent_id?: string | null
          population?: string | null
          secrets?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          government?: string | null
          id?: string
          image_url?: string | null
          name?: string
          notable_features?: string | null
          notes?: string | null
          parent_id?: string | null
          population?: string | null
          secrets?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_map_connections: {
        Row: {
          campaign_id: string
          connection_type: string | null
          created_at: string
          id: string
          label: string | null
          source_node_id: string
          target_node_id: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          connection_type?: string | null
          created_at?: string
          id?: string
          label?: string | null
          source_node_id: string
          target_node_id: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          connection_type?: string | null
          created_at?: string
          id?: string
          label?: string | null
          source_node_id?: string
          target_node_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mind_map_connections_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mind_map_connections_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "mind_map_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mind_map_connections_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "mind_map_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_map_nodes: {
        Row: {
          campaign_id: string
          color: string | null
          content: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          node_type: string | null
          position_x: number | null
          position_y: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          color?: string | null
          content?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          node_type?: string | null
          position_x?: number | null
          position_y?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          color?: string | null
          content?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          node_type?: string | null
          position_x?: number | null
          position_y?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mind_map_nodes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      npcs: {
        Row: {
          appearance: string | null
          campaign_id: string
          created_at: string
          description: string | null
          faction: string | null
          id: string
          image_url: string | null
          location: string | null
          motivation: string | null
          name: string
          notes: string | null
          personality: string | null
          secrets: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appearance?: string | null
          campaign_id: string
          created_at?: string
          description?: string | null
          faction?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          motivation?: string | null
          name: string
          notes?: string | null
          personality?: string | null
          secrets?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appearance?: string | null
          campaign_id?: string
          created_at?: string
          description?: string | null
          faction?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          motivation?: string | null
          name?: string
          notes?: string | null
          personality?: string | null
          secrets?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "npcs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quests: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          notes: string | null
          objectives: string | null
          priority: string | null
          quest_giver: string | null
          rewards: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          objectives?: string | null
          priority?: string | null
          quest_giver?: string | null
          rewards?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          objectives?: string | null
          priority?: string | null
          quest_giver?: string | null
          rewards?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_folders: {
        Row: {
          campaign_id: string | null
          created_at: string
          id: string
          is_global: boolean | null
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          is_global?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          is_global?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_folders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "resource_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          campaign_id: string | null
          created_at: string
          description: string | null
          file_url: string | null
          folder_id: string | null
          id: string
          is_favorite: boolean | null
          is_global: boolean | null
          name: string
          tags: string[] | null
          thumbnail_url: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          is_global?: boolean | null
          name: string
          tags?: string[] | null
          thumbnail_url?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          is_global?: boolean | null
          name?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "resource_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          actual_events: string | null
          campaign_id: string
          created_at: string
          id: string
          notes: string | null
          planned_content: string | null
          session_date: string | null
          session_number: number
          status: string | null
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_events?: string | null
          campaign_id: string
          created_at?: string
          id?: string
          notes?: string | null
          planned_content?: string | null
          session_date?: string | null
          session_number: number
          status?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_events?: string | null
          campaign_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          planned_content?: string | null
          session_date?: string | null
          session_number?: number
          status?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          campaign_id: string
          category: string | null
          created_at: string
          description: string | null
          era: string | null
          event_date: string | null
          id: string
          importance: string | null
          is_secret: boolean | null
          order_index: number | null
          related_locations: string[] | null
          related_npcs: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          era?: string | null
          event_date?: string | null
          id?: string
          importance?: string | null
          is_secret?: boolean | null
          order_index?: number | null
          related_locations?: string[] | null
          related_npcs?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          era?: string | null
          event_date?: string | null
          id?: string
          importance?: string | null
          is_secret?: boolean | null
          order_index?: number | null
          related_locations?: string[] | null
          related_npcs?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

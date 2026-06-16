export type UserRole = 'admin' | 'alumno'
export type UserStatus = 'pending' | 'approved' | 'rejected'
export type ComplexityLevel = 'basico' | 'intermedio' | 'avanzado'
export type ContentType = 'video' | 'pdf'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          status: UserStatus
          preferred_theme: number
          spotify_embed_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string
          role?: UserRole
          status?: UserStatus
          preferred_theme?: number
          spotify_embed_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: UserRole
          status?: UserStatus
          preferred_theme?: number
          spotify_embed_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      contents: {
        Row: {
          id: string
          product_id: string
          complexity: ComplexityLevel
          type: ContentType
          title: string
          description: string | null
          drive_file_id: string
          sort_order: number
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          complexity: ComplexityLevel
          type: ContentType
          title: string
          description?: string | null
          drive_file_id: string
          sort_order?: number
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          complexity?: ComplexityLevel
          type?: ContentType
          title?: string
          description?: string | null
          drive_file_id?: string
          sort_order?: number
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contents_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_approved: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      user_status: UserStatus
      complexity_level: ComplexityLevel
      content_type: ContentType
    }
    CompositeTypes: Record<string, never>
  }
}

// Tipos derivados de uso frecuente
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Content = Database['public']['Tables']['contents']['Row']

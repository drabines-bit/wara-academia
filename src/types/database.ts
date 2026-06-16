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
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          is_default?: boolean
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
          category_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          sort_order?: number
          category_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          sort_order?: number
          category_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
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
      user_content_progress: {
        Row: {
          user_id: string
          content_id: string
          viewed_at: string
        }
        Insert: {
          user_id: string
          content_id: string
          viewed_at?: string
        }
        Update: {
          user_id?: string
          content_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_content_progress_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_content_progress_content_id_fkey'
            columns: ['content_id']
            isOneToOne: false
            referencedRelation: 'contents'
            referencedColumns: ['id']
          },
        ]
      }
      user_categories: {
        Row: {
          user_id: string
          category_id: string
        }
        Insert: {
          user_id: string
          category_id: string
        }
        Update: {
          user_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_categories_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_categories_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
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
export type UserContentProgress = Database['public']['Tables']['user_content_progress']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Content = Database['public']['Tables']['contents']['Row']

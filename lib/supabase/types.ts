/**
 * Supabase 데이터베이스 타입 정의
 * - 타입 안정성을 위해 스키마와 일치해야 함
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'teacher' | 'student'
          name: string
          student_number: number | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'teacher' | 'student'
          name: string
          student_number?: number | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'teacher' | 'student'
          name?: string
          student_number?: number | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      timetable: {
        Row: {
          id: string
          week_start_date: string
          day_of_week: number
          period: number
          subject: string | null
          is_holiday: boolean
          teacher_note: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          week_start_date: string
          day_of_week: number
          period: number
          subject?: string | null
          is_holiday?: boolean
          teacher_note?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          week_start_date?: string
          day_of_week?: number
          period?: number
          subject?: string | null
          is_holiday?: boolean
          teacher_note?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          priority: 'low' | 'medium' | 'high'
          is_pinned: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          priority?: 'low' | 'medium' | 'high'
          is_pinned?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          priority?: 'low' | 'medium' | 'high'
          is_pinned?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      links: {
        Row: {
          id: string
          title: string
          url: string
          description: string | null
          category: string | null
          order_index: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          url: string
          description?: string | null
          category?: string | null
          order_index?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          url?: string
          description?: string | null
          category?: string | null
          order_index?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      reference_links: {
        Row: {
          id: string
          title: string
          url: string
          description: string | null
          category: string | null
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          url: string
          description?: string | null
          category?: string | null
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          url?: string
          description?: string | null
          category?: string | null
          tags?: string[] | null
          created_at?: string
        }
      }
      schedule: {
        Row: {
          id: string
          title: string
          description: string | null
          event_date: string
          event_type: 'exam' | 'school_event' | 'class_event' | 'other'
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_date: string
          event_type?: 'exam' | 'school_event' | 'class_event' | 'other'
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_date?: string
          event_type?: 'exam' | 'school_event' | 'class_event' | 'other'
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_date: string
          start_time: string | null
          end_time: string | null
          event_type: 'class' | 'personal' | 'holiday'
          is_completed: boolean
          user_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_date: string
          start_time?: string | null
          end_time?: string | null
          event_type?: 'class' | 'personal' | 'holiday'
          is_completed?: boolean
          user_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_date?: string
          start_time?: string | null
          end_time?: string | null
          event_type?: 'class' | 'personal' | 'holiday'
          is_completed?: boolean
          user_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          subject: 'korean' | 'math' | 'social' | 'science' | 'english' | 'other'
          title: string
          description: string | null
          external_url: string | null
          due_date: string | null
          total_points: number | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject: 'korean' | 'math' | 'social' | 'science' | 'english' | 'other'
          title: string
          description?: string | null
          external_url?: string | null
          due_date?: string | null
          total_points?: number | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subject?: 'korean' | 'math' | 'social' | 'science' | 'english' | 'other'
          title?: string
          description?: string | null
          external_url?: string | null
          due_date?: string | null
          total_points?: number | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          submitted_at: string
          status: 'pending' | 'submitted' | 'graded'
          note: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          submitted_at?: string
          status?: 'pending' | 'submitted' | 'graded'
          note?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          submitted_at?: string
          status?: 'pending' | 'submitted' | 'graded'
          note?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
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
  }
}

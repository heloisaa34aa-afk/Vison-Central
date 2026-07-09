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
      clients: {
        Row: {
          id: string
          name: string
          category: string
          status: string
          screensCount: number
          city: string
          neighborhood: string
          iconType: string
          orientation: string
          timezone: string
          playlistId: string | null
          tickerText: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          status: string
          screensCount: number
          city: string
          neighborhood: string
          iconType: string
          orientation: string
          timezone: string
          playlistId?: string | null
          tickerText?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          status?: string
          screensCount?: number
          city?: string
          neighborhood?: string
          iconType?: string
          orientation?: string
          timezone?: string
          playlistId?: string | null
          tickerText?: string | null
        }
      }
      devices: {
        Row: {
          id: string
          clientId: string
          name: string
          status: string
          uptime: string
          token: string
          lastSync: string
        }
        Insert: {
          id?: string
          clientId: string
          name: string
          status: string
          uptime?: string
          token: string
          lastSync?: string
        }
        Update: {
          id?: string
          clientId?: string
          name?: string
          status?: string
          uptime?: string
          token?: string
          lastSync?: string
        }
      }
      playlists: {
        Row: {
          id: string
          name: string
          mediaIds: string[]
        }
        Insert: {
          id?: string
          name: string
          mediaIds?: string[]
        }
        Update: {
          id?: string
          name?: string
          mediaIds?: string[]
        }
      }
      media: {
        Row: {
          id: string
          name: string
          url: string
          type: string
          duration: number
          size: string | null
        }
        Insert: {
          id?: string
          name: string
          url: string
          type: string
          duration: number
          size?: string | null
        }
        Update: {
          id?: string
          name?: string
          url?: string
          type?: string
          duration?: number
          size?: string | null
        }
      }
    }
  }
}

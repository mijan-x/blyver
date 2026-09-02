import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type AuthContextValue = { loading: boolean; session: Session | null; user: User | null }
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

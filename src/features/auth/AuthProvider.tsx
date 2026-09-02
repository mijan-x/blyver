import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { AuthContext } from './AuthContext'
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true); const [session, setSession] = useState<Session | null>(null)
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) }); const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setLoading(false) }); return () => data.subscription.unsubscribe() }, [])
  const value = useMemo(() => ({ loading, session, user: session?.user ?? null }), [loading, session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export default AuthProvider

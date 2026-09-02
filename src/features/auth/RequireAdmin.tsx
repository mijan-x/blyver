import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from './useAuth'

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth(); const [allowed, setAllowed] = useState<boolean | null>(null)
  useEffect(() => { if (!user) return; (async () => { const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(); setAllowed(data?.role === 'admin') })() }, [user])
  if (loading || (user && allowed === null)) return <main className="grid min-h-[55vh] place-items-center bg-blyver-ivory text-[11px] tracking-[0.2em] text-blyver-muted">VERIFYING ACCESS</main>
  if (!user) return <Navigate to="/sign-in" replace />
  if (!allowed) return <Navigate to="/account" replace />
  return <>{children}</>
}
export default RequireAdmin

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
function RequireAuth({ children }: { children: React.ReactNode }) { const { loading, user } = useAuth(); const location = useLocation(); if (loading) return <main className="grid min-h-[55vh] place-items-center bg-blyver-ivory text-[11px] tracking-[0.2em] text-blyver-muted">LOADING ACCOUNT</main>; if (!user) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />; return <>{children}</> }
export default RequireAuth

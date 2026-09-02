import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
function AuthFormShell({ eyebrow, title, children, footer }: { eyebrow: string; title: string; children: ReactNode; footer: ReactNode }) { return <main className="bg-blyver-ivory px-6 py-16 text-blyver-ink sm:px-10 sm:py-24"><section className="mx-auto max-w-md"><p className="text-[11px] tracking-[0.25em] text-blyver-champagne">{eyebrow}</p><h1 className="mt-5 font-serif text-4xl sm:text-5xl">{title}</h1><div className="mt-10">{children}</div><p className="mt-8 border-t border-blyver-ink/10 pt-6 text-sm text-blyver-charcoal/70">{footer}</p><Link to="/" className="mt-8 inline-block text-[11px] tracking-[0.16em] text-blyver-charcoal/65">← RETURN HOME</Link></section></main> }
export default AuthFormShell

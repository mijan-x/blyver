import { useEffect } from 'react'
function Seo({ title = 'Blyver | Where elegance meets everyday', description = 'Premium watches, wallets and purses in Bangladesh.' }: { title?: string; description?: string }) { useEffect(() => { document.title = title; const meta = document.querySelector('meta[name="description"]'); if (meta) meta.setAttribute('content', description); else { const tag = document.createElement('meta'); tag.name = 'description'; tag.content = description; document.head.appendChild(tag) } }, [description, title]); return null }
export default Seo

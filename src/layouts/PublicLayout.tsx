import { Outlet } from 'react-router-dom'
import SiteFooter from '../components/layout/SiteFooter'
import SiteHeader from '../components/layout/SiteHeader'

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-blyver-ink">
      <SiteHeader />
      <div className="flex-1"><Outlet /></div>
      <SiteFooter />
    </div>
  )
}

export default PublicLayout

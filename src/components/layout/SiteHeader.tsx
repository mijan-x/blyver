import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import logoImage from '../../assets/brand/blyver-logo.png'
import { useAuth } from '../../features/auth/useAuth'
import { cartUpdatedEvent, getCartItemCount } from '../../services/cartService'
import { getWishlistCount, wishlistUpdatedEvent } from '../../services/wishlistService'

const primaryLinks = [
  { label: 'Home', to: '/' },
  { label: 'Men', to: '/men' },
  { label: 'Women', to: '/women' },
  { label: 'Collections', to: '/collections' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

const utilityLinks = [
  { label: 'Search', to: '/search' },
  { label: 'Wishlist', to: '/wishlist' },
  { label: 'Cart', to: '/cart' },
  { label: 'Account', to: '/account' },
]

function navigationClassName({ isActive }: { isActive: boolean }) {
  return `transition-colors hover:text-blyver-champagne ${
    isActive ? 'text-blyver-champagne' : 'text-blyver-ivory/80'
  }`
}

function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const { user } = useAuth()

  const closeMenu = () => setIsMenuOpen(false)

  useEffect(() => {
    const loadCartCount = () => {
      if (!user) return setCartCount(0)
      getCartItemCount(user.id).then(setCartCount).catch(() => setCartCount(0))
    }
    loadCartCount()
    window.addEventListener(cartUpdatedEvent, loadCartCount)
    return () => window.removeEventListener(cartUpdatedEvent, loadCartCount)
  }, [user])

  useEffect(() => {
    const loadWishlistCount = () => {
      if (!user) return setWishlistCount(0)
      getWishlistCount(user.id).then(setWishlistCount).catch(() => setWishlistCount(0))
    }
    loadWishlistCount()
    window.addEventListener(wishlistUpdatedEvent, loadWishlistCount)
    return () => window.removeEventListener(wishlistUpdatedEvent, loadWishlistCount)
  }, [user])

  return (
    <header className="sticky top-0 z-50 border-b border-blyver-ivory/10 bg-blyver-ink/95 text-blyver-ivory backdrop-blur">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-6 px-6 py-4 sm:px-10">
        <Link to="/" aria-label="Blyver home" className="flex shrink-0 items-center gap-3" onClick={closeMenu}>
          <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-blyver-ivory p-1">
            <img src={logoImage} alt="" className="size-full object-contain" />
          </span>
          <span className="text-sm tracking-[0.28em]">BLYVER</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-[11px] tracking-[0.14em] lg:flex">
          {primaryLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navigationClassName} end={link.to === '/'}>
              {link.label.toUpperCase()}
            </NavLink>
          ))}
        </nav>

        <nav aria-label="Utility navigation" className="hidden items-center gap-4 text-[10px] tracking-[0.12em] sm:flex">
          {utilityLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={link.to === '/cart' || link.to === '/wishlist' ? `${navigationClassName} relative` : navigationClassName}>
              {link.label.toUpperCase()}
              {link.to === '/cart' && cartCount > 0 && <span aria-label={`${cartCount} items in cart`} className="absolute -right-3 -top-3 grid size-4 place-items-center rounded-full bg-blyver-champagne text-[8px] font-semibold tracking-normal text-blyver-ink">{cartCount > 99 ? '99+' : cartCount}</span>}
              {link.to === '/wishlist' && wishlistCount > 0 && <span aria-label={`${wishlistCount} items in wishlist`} className="absolute -right-3 -top-3 grid size-4 place-items-center rounded-full bg-blyver-champagne text-[8px] font-semibold tracking-normal text-blyver-ink">{wishlistCount > 99 ? '99+' : wishlistCount}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.16em] transition-colors hover:text-blyver-champagne lg:hidden"
        >
          <span>{isMenuOpen ? 'CLOSE' : 'MENU'}</span>
          <span aria-hidden="true" className="grid size-5 place-items-center">
            {isMenuOpen ? '×' : '☰'}
          </span>
        </button>
      </div>

      {isMenuOpen && (
        <div id="mobile-navigation" className="border-t border-blyver-ivory/10 bg-blyver-charcoal lg:hidden">
          <nav aria-label="Mobile navigation" className="mx-auto grid max-w-7xl px-6 py-4 sm:px-10">
            {[...primaryLinks, ...utilityLinks].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="border-b border-blyver-ivory/10 py-4 text-xs tracking-[0.16em] text-blyver-ivory/85 transition-colors hover:text-blyver-champagne"
                end={link.to === '/'}
                onClick={closeMenu}
              >
                {link.label.toUpperCase()}
                {link.to === '/cart' && cartCount > 0 && <span className="ml-2 rounded-full bg-blyver-champagne px-2 py-0.5 text-[9px] font-semibold tracking-normal text-blyver-ink">{cartCount}</span>}
                {link.to === '/wishlist' && wishlistCount > 0 && <span className="ml-2 rounded-full bg-blyver-champagne px-2 py-0.5 text-[9px] font-semibold tracking-normal text-blyver-ink">{wishlistCount}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

export default SiteHeader

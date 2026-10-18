import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, NavLink } from "react-router-dom";
import logoImage from "../../assets/brand/blyver-logo-steel.png";
import { useAuth } from "../../features/auth/useAuth";
import { useIsAdmin } from "../../features/auth/useIsAdmin";
import { cartUpdatedEvent, getCartItemCount } from "../../services/cartService";
import {
  getGuestCartCount,
  mergeGuestCartIntoAccount,
  subscribeToGuestCart,
} from "../../services/guestCartService";
import {
  getWishlistCount,
  wishlistUpdatedEvent,
} from "../../services/wishlistService";

const primaryLinks = [
  { label: "Home", to: "/" },
  { label: "Men", to: "/men" },
  { label: "Women", to: "/women" },
  { label: "Collections", to: "/collections" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const baseUtilityLinks = [
  { label: "Search", to: "/search" },
  { label: "Wishlist", to: "/wishlist" },
  { label: "Cart", to: "/cart" },
  { label: "Account", to: "/account" },
];

function navigationClassName({ isActive }: { isActive: boolean }) {
  return `relative py-1 transition-colors duration-300 hover:text-blyver-polished ${
    isActive
      ? "text-blyver-polished after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-gradient-to-r after:from-transparent after:via-blyver-steel after:to-transparent"
      : "text-blyver-steel/75"
  }`;
}

function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const guestCartCount = useSyncExternalStore(
    subscribeToGuestCart,
    getGuestCartCount,
    () => 0,
  );

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const loadCartCount = () => {
      if (!user) return setCartCount(0);
      getCartItemCount(user.id)
        .then(setCartCount)
        .catch(() => setCartCount(0));
    };
    loadCartCount();
    window.addEventListener(cartUpdatedEvent, loadCartCount);
    return () => window.removeEventListener(cartUpdatedEvent, loadCartCount);
  }, [user]);

  // A guest who signs in keeps what they put in their bag.
  useEffect(() => {
    if (user) mergeGuestCartIntoAccount(user.id).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    const loadWishlistCount = () => {
      if (!user) return setWishlistCount(0);
      getWishlistCount(user.id)
        .then(setWishlistCount)
        .catch(() => setWishlistCount(0));
    };
    loadWishlistCount();
    window.addEventListener(wishlistUpdatedEvent, loadWishlistCount);
    return () =>
      window.removeEventListener(wishlistUpdatedEvent, loadWishlistCount);
  }, [user]);

  const badgeCount = user ? cartCount : guestCartCount;
  const utilityLinks = isAdmin
    ? [...baseUtilityLinks, { label: "Admin", to: "/admin" }]
    : baseUtilityLinks;

  return (
    <header className="sticky top-0 z-50 bg-blyver-ink/85 text-blyver-polished backdrop-blur-md">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-6 px-6 py-4 sm:px-10">
        <Link
          to="/"
          aria-label="Blyver home"
          className="group flex shrink-0 items-center gap-3"
          onClick={closeMenu}
        >
          <img
            src={logoImage}
            alt=""
            width={128}
            height={125}
            decoding="async"
            className="size-9 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] transition-transform duration-700 group-hover:rotate-[8deg]"
          />
          <span className="type-wide text-[13px] font-medium tracking-[0.34em] text-blyver-polished">
            BLYVER
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="type-wide hidden items-center gap-7 text-[10.5px] lg:flex"
        >
          {primaryLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={navigationClassName}
              end={link.to === "/"}
            >
              {link.label.toUpperCase()}
            </NavLink>
          ))}
        </nav>

        <nav
          aria-label="Utility navigation"
          className="type-wide hidden items-center gap-5 text-[10px] sm:flex"
        >
          {utilityLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={navigationClassName}
            >
              {link.label.toUpperCase()}
              {link.to === "/cart" && badgeCount > 0 && (
                <span
                  aria-label={`${badgeCount} items in cart`}
                  className="absolute -right-3.5 -top-2.5 grid size-4 place-items-center rounded-full bg-blyver-champagne text-[8px] font-semibold tracking-normal text-blyver-polished"
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
              {link.to === "/wishlist" && wishlistCount > 0 && (
                <span
                  aria-label={`${wishlistCount} items in wishlist`}
                  className="absolute -right-3.5 -top-2.5 grid size-4 place-items-center rounded-full bg-blyver-champagne text-[8px] font-semibold tracking-normal text-blyver-polished"
                >
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="type-wide inline-flex items-center gap-3 text-[10.5px] text-blyver-steel transition-colors hover:text-blyver-polished lg:hidden"
        >
          <span>{isMenuOpen ? "CLOSE" : "MENU"}</span>
          <span aria-hidden="true" className="relative block h-2.5 w-5">
            <span
              className={`absolute left-0 h-px w-5 bg-current transition-transform duration-300 ${
                isMenuOpen ? "top-1 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 h-px w-5 bg-current transition-transform duration-300 ${
                isMenuOpen ? "top-1 -rotate-45" : "top-2"
              }`}
            />
          </span>
          {badgeCount > 0 && !isMenuOpen && (
            <span className="grid size-4 place-items-center rounded-full bg-blyver-champagne text-[8px] font-semibold tracking-normal text-blyver-polished sm:hidden">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </button>
      </div>

      {/* Steel edge under the bar. */}
      <div
        aria-hidden="true"
        className="h-px bg-gradient-to-r from-transparent via-blyver-steel/35 to-transparent"
      />

      {isMenuOpen && (
        <div
          id="mobile-navigation"
          className="brushed h-[calc(100svh-4.5rem)] overflow-y-auto lg:hidden"
        >
          <nav
            aria-label="Mobile navigation"
            className="mx-auto grid max-w-7xl px-6 py-6 sm:px-10"
          >
            {primaryLinks.map((link, index) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="flex items-baseline justify-between border-b border-blyver-steel/12 py-4 font-serif text-3xl text-blyver-polished transition-colors hover:text-blyver-steel"
                end={link.to === "/"}
                onClick={closeMenu}
              >
                {link.label}
                <span className="font-sans text-[10px] tabular-nums text-blyver-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </NavLink>
            ))}
            <div className="type-wide mt-8 grid grid-cols-2 gap-x-6 gap-y-4 text-[10.5px] text-blyver-steel">
              {utilityLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="transition-colors hover:text-blyver-polished"
                  onClick={closeMenu}
                >
                  {link.label.toUpperCase()}
                  {link.to === "/cart" && badgeCount > 0 && (
                    <span className="ml-2 rounded-full bg-blyver-champagne px-2 py-0.5 text-[9px] font-semibold tracking-normal text-blyver-polished">
                      {badgeCount}
                    </span>
                  )}
                  {link.to === "/wishlist" && wishlistCount > 0 && (
                    <span className="ml-2 rounded-full bg-blyver-champagne px-2 py-0.5 text-[9px] font-semibold tracking-normal text-blyver-polished">
                      {wishlistCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default SiteHeader;

import { useEffect, useState } from "react";
import type { FormEvent as FormEventType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import {
  createCodOrder,
  createGuestCodOrder,
  type CheckoutAddress,
} from "../services/checkoutService";
import {
  cartUpdatedEvent,
  getCartItems,
  type CartLine,
} from "../services/cartService";
import {
  clearGuestCart,
  getGuestCart,
  getGuestCartLines,
} from "../services/guestCartService";
import {
  defaultStoreSettings,
  getStoreSettings,
  type StoreSettings,
} from "../services/settingsService";
import { formatBdt } from "../utils/formatCurrency";
const field =
  "mt-2 w-full border border-blyver-ink/20 bg-transparent px-4 py-3 outline-none focus:border-blyver-champagne";
function CheckoutPage() {
  const { loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [hasCoupon, setHasCoupon] = useState(false);
  // Order summary: same cart the order is placed from (account cart when
  // signed in, this browser's guest cart otherwise).
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    const load = () => {
      (user ? getCartItems(user.id) : getGuestCartLines())
        .then((result) => {
          if (active) setLines(result);
        })
        .catch(() => {
          if (active) setLines([]);
        });
    };
    load();
    window.addEventListener(cartUpdatedEvent, load);
    return () => {
      active = false;
      window.removeEventListener(cartUpdatedEvent, load);
    };
  }, [authLoading, user]);
  useEffect(() => {
    let active = true;
    getStoreSettings()
      .then((result) => {
        if (active) setSettings(result);
      })
      .catch(() => {
        if (active) setSettings(defaultStoreSettings);
      });
    return () => {
      active = false;
    };
  }, []);
  const subtotal = (lines ?? []).reduce(
    (sum, line) =>
      sum +
      Number(line.product.sale_price ?? line.product.original_price) *
        line.quantity,
    0,
  );
  const threshold = settings?.free_delivery_threshold ?? null;
  // Same rule as the database: free delivery once the (discounted) subtotal
  // reaches the threshold. Coupons are applied by the database at order time.
  const delivery = settings
    ? threshold !== null && subtotal >= Number(threshold)
      ? 0
      : Number(settings.delivery_charge)
    : null;
  const total = delivery === null ? null : subtotal + delivery;
  const summaryReady = lines !== null && delivery !== null;
  const cartEmpty = lines !== null && lines.length === 0;
  async function submit(event: FormEventType<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const address: CheckoutAddress = {
      area: String(form.get("area")),
      district: String(form.get("district")),
      division: String(form.get("division")),
      email: String(form.get("email") ?? ""),
      fullAddress: String(form.get("fullAddress")),
      fullName: String(form.get("fullName")),
      phone: String(form.get("phone")),
    };
    const couponCode = String(form.get("couponCode"));
    try {
      let orderNumber: string;
      if (user) {
        orderNumber = await createCodOrder(address, couponCode);
      } else {
        // Guest: send the browser cart; the database re-checks prices and stock.
        orderNumber = await createGuestCodOrder(
          address,
          getGuestCart(),
          couponCode,
        );
        clearGuestCart();
      }
      navigate(`/order-success/${orderNumber}`, { replace: true });
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "We could not place your order.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="bg-blyver-ivory px-6 py-16 text-blyver-ink sm:px-10 sm:py-20">
      <form onSubmit={submit} className="mx-auto max-w-2xl">
        <p className="text-[11px] tracking-[0.24em] text-blyver-champagne">
          CHECKOUT / CASH ON DELIVERY
        </p>
        <h1 className="mt-5 font-serif text-5xl">Delivery details.</h1>
        {!authLoading && !user && (
          <p className="mt-5 text-sm text-blyver-charcoal/70">
            Ordering as a guest. Already have an account?{" "}
            <Link
              to="/sign-in"
              state={{ from: "/checkout" }}
              className="underline"
            >
              Sign in
            </Link>
          </p>
        )}
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            Full name
            <input required name="fullName" className={field} />
          </label>
          <label className="block text-sm">
            Mobile number
            <input
              required
              type="tel"
              name="phone"
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
              className={field}
            />
          </label>
          <label className="block text-sm">
            {user ? "Email" : "Email (optional)"}
            <input
              required={Boolean(user)}
              type="email"
              defaultValue={user?.email}
              name="email"
              className={field}
            />
          </label>
          <label className="block text-sm">
            Division
            <input required name="division" className={field} />
          </label>
          <label className="block text-sm">
            District
            <input required name="district" className={field} />
          </label>
          <label className="block text-sm sm:col-span-2">
            Area / Thana
            <input required name="area" className={field} />
          </label>
          <label className="block text-sm sm:col-span-2">
            Full delivery address
            <textarea required name="fullAddress" rows={4} className={field} />
          </label>
          <label className="block text-sm sm:col-span-2">
            Coupon code (optional)
            <input
              name="couponCode"
              placeholder="BLYVER10"
              onChange={(event) =>
                setHasCoupon(event.target.value.trim() !== "")
              }
              className={field}
            />
          </label>
        </div>
        <section
          aria-labelledby="order-summary-heading"
          className="mt-10 border border-blyver-ink/15 p-5"
        >
          <h2 id="order-summary-heading" className="font-serif text-2xl">
            Order summary
          </h2>
          {!summaryReady ? (
            <p className="mt-4 text-[11px] tracking-[0.16em] text-blyver-muted">
              LOADING SUMMARY
            </p>
          ) : cartEmpty ? (
            <p className="mt-4 text-sm">
              Your bag is empty.{" "}
              <Link to="/" className="underline">
                Continue shopping
              </Link>
            </p>
          ) : (
            <>
              <ul className="mt-4 divide-y divide-blyver-ink/10 border-y border-blyver-ink/10">
                {(lines ?? []).map((line) => {
                  const price = Number(
                    line.product.sale_price ?? line.product.original_price,
                  );
                  return (
                    <li
                      key={line.id}
                      className="flex justify-between gap-4 py-3 text-sm"
                    >
                      <span>
                        {line.product.name}
                        <span className="text-blyver-charcoal/60">
                          {" "}
                          × {line.quantity}
                        </span>
                      </span>
                      <span>{formatBdt(price * line.quantity)}</span>
                    </li>
                  );
                })}
              </ul>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatBdt(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Delivery charge</dt>
                  <dd>{delivery === 0 ? "Free" : formatBdt(delivery ?? 0)}</dd>
                </div>
                <div className="flex justify-between border-t border-blyver-ink/15 pt-3 text-base font-medium">
                  <dt>Total to pay on delivery</dt>
                  <dd>{formatBdt(total ?? subtotal)}</dd>
                </div>
              </dl>
              {hasCoupon && (
                <p className="mt-3 text-xs text-blyver-charcoal/65">
                  Your coupon discount, if valid, is taken off this total when
                  you place the order and shown on your confirmation.
                </p>
              )}
            </>
          )}
          <p className="mt-4 text-sm text-blyver-charcoal/65">
            Cash on Delivery. Prices and stock are re-checked securely when you
            place the order.
          </p>
        </section>
        {error && (
          <p role="alert" className="mt-5 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={loading || authLoading || !summaryReady || cartEmpty}
          className="mt-8 w-full bg-blyver-ink px-5 py-4 text-[11px] tracking-[0.16em] text-blyver-ivory disabled:opacity-60"
        >
          {loading
            ? "PLACING ORDER…"
            : total !== null && !cartEmpty
              ? `PLACE ORDER · ${formatBdt(total)}`
              : "PLACE CASH ON DELIVERY ORDER"}
        </button>
      </form>
    </main>
  );
}
export default CheckoutPage;

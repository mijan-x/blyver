import { useState } from "react";
import type { FormEvent as FormEventType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import {
  createCodOrder,
  createGuestCodOrder,
  type CheckoutAddress,
} from "../services/checkoutService";
import { clearGuestCart, getGuestCart } from "../services/guestCartService";
const field =
  "mt-2 w-full border border-blyver-ink/20 bg-transparent px-4 py-3 outline-none focus:border-blyver-champagne";
function CheckoutPage() {
  const { loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
            <input name="couponCode" placeholder="BLYVER10" className={field} />
          </label>
        </div>
        <div className="mt-10 border border-blyver-ink/15 p-5">
          <p className="font-medium">Cash on Delivery</p>
          <p className="mt-2 text-sm text-blyver-charcoal/65">
            Final prices, discounts, delivery and stock are calculated securely
            when you place the order.
          </p>
        </div>
        {error && (
          <p role="alert" className="mt-5 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={loading || authLoading}
          className="mt-8 w-full bg-blyver-ink px-5 py-4 text-[11px] tracking-[0.16em] text-blyver-ivory disabled:opacity-60"
        >
          {loading ? "PLACING ORDER…" : "PLACE CASH ON DELIVERY ORDER"}
        </button>
      </form>
    </main>
  );
}
export default CheckoutPage;

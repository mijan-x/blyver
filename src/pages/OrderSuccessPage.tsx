import { Link, useParams } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
function OrderSuccessPage() {
  const { orderNumber } = useParams();
  const { user } = useAuth();
  return (
    <main className="grid min-h-[60vh] place-items-center bg-blyver-ivory px-6 text-center text-blyver-ink">
      <section>
        <p className="text-[11px] tracking-[0.24em] text-blyver-champagne">
          ORDER RECEIVED
        </p>
        <h1 className="mt-5 font-serif text-5xl">
          Thank you for choosing Blyver.
        </h1>
        <p className="mt-6 text-sm leading-7 text-blyver-charcoal/70">
          Your Cash on Delivery order number is <strong>{orderNumber}</strong>.
          We will confirm it shortly.
        </p>
        {!user && (
          <p className="mt-3 text-sm leading-7 text-blyver-charcoal/70">
            Please keep this number. We will call your mobile to confirm
            delivery.
          </p>
        )}
        <Link
          to={user ? "/account" : "/collections"}
          className="mt-9 inline-block text-[11px] tracking-[0.16em] underline"
        >
          {user ? "VIEW YOUR ACCOUNT" : "CONTINUE SHOPPING"}
        </Link>
      </section>
    </main>
  );
}
export default OrderSuccessPage;

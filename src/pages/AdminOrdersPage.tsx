import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminOrders,
  orderStatusLabels,
  orderStatusTransitions,
  updateOrderStatus,
  type AdminOrder,
  type OrderStatus,
} from "../services/adminOrderService";
import { formatBdt } from "../utils/formatCurrency";

const statusFilters: Array<OrderStatus | "all"> = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

const statusBadgeClass: Record<OrderStatus, string> = {
  cancelled: "bg-red-100 text-red-800",
  confirmed: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  out_for_delivery: "bg-amber-100 text-amber-800",
  pending: "bg-blyver-ink/10 text-blyver-ink",
  processing: "bg-blue-100 text-blue-800",
  returned: "bg-orange-100 text-orange-800",
  shipped: "bg-amber-100 text-amber-800",
};

function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const load = useCallback(() => {
    setError("");
    getAdminOrders({
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    })
      .then(setOrders)
      .catch((loadError: Error) => setError(loadError.message));
  }, [search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(order: AdminOrder, newStatus: OrderStatus) {
    const confirmMessage =
      newStatus === "cancelled" || newStatus === "returned"
        ? `Mark ${order.order_number} as ${orderStatusLabels[newStatus].toLowerCase()}? This restores the ordered items to stock.`
        : `Mark ${order.order_number} as ${orderStatusLabels[newStatus].toLowerCase()}?`;
    if (!window.confirm(confirmMessage)) return;
    setUpdating(order.id);
    setActionError("");
    try {
      await updateOrderStatus(order.id, newStatus);
      await load();
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update the order status.",
      );
    } finally {
      setUpdating(null);
    }
  }

  return (
    <main className="bg-blyver-ivory px-6 py-16 text-blyver-ink sm:px-10 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-[11px] tracking-[0.24em] text-blyver-champagne">
          BLYVER ADMIN
        </p>
        <h1 className="mt-5 font-serif text-5xl sm:text-6xl">Orders.</h1>
        <Link
          to="/admin"
          className="mt-5 inline-block text-[11px] tracking-[0.16em] underline"
        >
          ← BACK TO OVERVIEW
        </Link>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order number, name or phone"
            className="w-full max-w-sm border border-blyver-ink/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-blyver-champagne"
          />
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 text-[11px] tracking-[0.1em] ${
                  statusFilter === status
                    ? "bg-blyver-ink text-blyver-ivory"
                    : "border border-blyver-ink/20 text-blyver-ink/70"
                }`}
              >
                {status === "all"
                  ? "ALL"
                  : orderStatusLabels[status].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-8 text-sm text-red-700">{error}</p>}
        {actionError && (
          <p role="alert" className="mt-5 text-sm text-red-700">
            {actionError}
          </p>
        )}

        {orders === null && !error ? (
          <p className="mt-10 text-[11px] tracking-[0.16em] text-blyver-muted">
            LOADING ORDERS
          </p>
        ) : orders && orders.length === 0 ? (
          <p className="mt-10 border border-blyver-ink/10 p-10 text-center text-sm">
            No orders match this filter.
          </p>
        ) : (
          orders && (
            <div className="mt-10 divide-y divide-blyver-ink/10 border-y border-blyver-ink/10">
              {orders.map((order) => {
                const nextStatuses = orderStatusTransitions[order.status];
                const isExpanded = expanded === order.id;
                return (
                  <article key={order.id} className="py-6">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : order.id)}
                      className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                    >
                      <div>
                        <p className="font-serif text-lg">
                          {order.order_number}
                          {order.is_guest && (
                            <span className="ml-2 text-[10px] tracking-[0.1em] text-blyver-muted">
                              GUEST
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-blyver-charcoal/65">
                          {order.customer_address?.full_name} ·{" "}
                          {order.guest_phone ?? order.customer_address?.phone}
                          {" · "}
                          {new Date(order.created_at).toLocaleString("en-BD", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          {formatBdt(order.total)}
                        </span>
                        <span
                          className={`px-3 py-1 text-[10px] tracking-[0.1em] ${statusBadgeClass[order.status]}`}
                        >
                          {orderStatusLabels[order.status].toUpperCase()}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-5 grid gap-6 bg-blyver-ivory/60 p-5 sm:grid-cols-[1fr_280px]">
                        <div>
                          <h3 className="text-[11px] tracking-[0.14em] text-blyver-muted">
                            ITEMS
                          </h3>
                          <ul className="mt-3 space-y-2 text-sm">
                            {order.items.map((item) => (
                              <li
                                key={item.id}
                                className="flex justify-between gap-4"
                              >
                                <span>
                                  {item.product_name} ({item.sku}) ×{" "}
                                  {item.quantity}
                                </span>
                                <span>{formatBdt(item.line_total)}</span>
                              </li>
                            ))}
                          </ul>
                          <dl className="mt-4 space-y-1 text-sm text-blyver-charcoal/75">
                            <div className="flex justify-between">
                              <dt>Subtotal</dt>
                              <dd>{formatBdt(order.subtotal)}</dd>
                            </div>
                            {order.coupon_code && (
                              <div className="flex justify-between">
                                <dt>Coupon ({order.coupon_code})</dt>
                                <dd>-{formatBdt(order.coupon_discount)}</dd>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <dt>Delivery</dt>
                              <dd>{formatBdt(order.delivery_charge)}</dd>
                            </div>
                            <div className="flex justify-between font-medium text-blyver-ink">
                              <dt>Total</dt>
                              <dd>{formatBdt(order.total)}</dd>
                            </div>
                          </dl>
                          {order.stock_restored_at && (
                            <p className="mt-3 text-xs text-blyver-muted">
                              Stock restored on{" "}
                              {new Date(
                                order.stock_restored_at,
                              ).toLocaleDateString("en-BD")}
                              .
                            </p>
                          )}
                        </div>

                        <div>
                          <h3 className="text-[11px] tracking-[0.14em] text-blyver-muted">
                            DELIVER TO
                          </h3>
                          <p className="mt-3 text-sm leading-6">
                            {order.customer_address?.full_name}
                            <br />
                            {order.guest_phone ?? order.customer_address?.phone}
                            {order.customer_email && (
                              <>
                                <br />
                                {order.customer_email}
                              </>
                            )}
                            <br />
                            {order.customer_address?.full_address}
                            <br />
                            {order.customer_address?.area},{" "}
                            {order.customer_address?.district},{" "}
                            {order.customer_address?.division}
                          </p>

                          {nextStatuses.length > 0 ? (
                            <div className="mt-5 flex flex-wrap gap-2">
                              {nextStatuses.map((status) => (
                                <button
                                  key={status}
                                  disabled={updating === order.id}
                                  onClick={() => changeStatus(order, status)}
                                  className="border border-blyver-ink/30 px-3 py-2 text-[11px] tracking-[0.1em] hover:bg-blyver-ink hover:text-blyver-ivory disabled:opacity-50"
                                >
                                  {updating === order.id
                                    ? "UPDATING…"
                                    : `MARK ${orderStatusLabels[status].toUpperCase()}`}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-5 text-xs text-blyver-muted">
                              This order is in a final state.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )
        )}
      </div>
    </main>
  );
}

export default AdminOrdersPage;

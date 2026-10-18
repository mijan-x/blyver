import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Seo from "../components/seo/Seo";
import {
  getStoreSettings,
  type StoreSettings,
} from "../services/settingsService";
import { formatBdt } from "../utils/formatCurrency";

// +8801333411163 -> +880 1333-411163 (falls back to the stored text).
function formatPhone(phone: string) {
  const match = phone.replace(/[\s-]/g, "").match(/^\+?880(1\d{3})(\d{6})$/);
  return match ? `+880 ${match[1]}-${match[2]}` : phone;
}

type ContactCardProps = {
  label: string;
  value: ReactNode;
  action?: { href: string; text: string; external?: boolean };
};

function ContactCard({ label, value, action }: ContactCardProps) {
  return (
    <article className="flex flex-col justify-between border border-blyver-ink/10 bg-white/40 p-8 sm:p-10">
      <div>
        <p className="text-[11px] tracking-[0.24em] text-blyver-champagne">
          {label}
        </p>
        <p className="mt-5 break-words font-display text-3xl leading-snug sm:text-4xl">
          {value}
        </p>
      </div>
      {action && (
        <a
          href={action.href}
          {...(action.external
            ? { rel: "noopener noreferrer", target: "_blank" }
            : {})}
          className="mt-8 inline-block self-start border-b border-blyver-ink pb-2 text-[11px] tracking-[0.18em] transition hover:border-blyver-champagne hover:text-blyver-champagne"
        >
          {action.text} <span aria-hidden="true">→</span>
        </a>
      )}
    </article>
  );
}

function ContactPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getStoreSettings()
      .then((result) => {
        if (active) setSettings(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const phone = settings?.phone.trim() ?? "";
  const email = settings?.email.trim() ?? "";
  const whatsapp = settings?.whatsapp.trim() ?? "";
  const address = settings?.business_address.trim() ?? "";
  const whatsappDigits = whatsapp.replace(/\D/g, "");
  const hasContact = Boolean(phone || email || whatsapp || address);
  const threshold = settings?.free_delivery_threshold ?? null;

  return (
    <main className="bg-blyver-ivory px-6 py-16 text-blyver-ink sm:px-10 sm:py-24">
      <Seo
        title="Contact | Blyver"
        description="Call, message or visit Blyver. Customer care for watches, wallets and purses."
      />
      <div className="mx-auto max-w-5xl">
        <p className="text-[11px] tracking-[0.26em] text-blyver-champagne">
          CONTACT BLYVER
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-5xl font-medium leading-[1.05] sm:text-7xl">
          We’re here to make every detail feel effortless.
        </h1>
        <p className="mt-7 max-w-xl text-sm leading-7 text-blyver-charcoal/75 sm:text-base">
          Questions about an order, a piece, or delivery? Reach us directly and
          we will happily help.
        </p>

        {settings === null && !failed && (
          <p className="mt-14 text-[11px] tracking-[0.16em] text-blyver-muted">
            LOADING CONTACT DETAILS
          </p>
        )}
        {failed && (
          <p className="mt-14 text-sm text-blyver-charcoal/70">
            We couldn’t load our contact details. Please refresh the page.
          </p>
        )}
        {settings && !hasContact && (
          <p className="mt-14 text-sm text-blyver-charcoal/70">
            Our contact details will be added here soon.
          </p>
        )}

        {hasContact && (
          <div className="mt-14 grid gap-px bg-blyver-ink/10 sm:grid-cols-2">
            {phone && (
              <ContactCard
                label="CALL US"
                value={formatPhone(phone)}
                action={{
                  href: `tel:${phone.replace(/[^\d+]/g, "")}`,
                  text: "CALL NOW",
                }}
              />
            )}
            {whatsapp && (
              <ContactCard
                label="WHATSAPP"
                value={formatPhone(whatsapp)}
                action={
                  whatsappDigits
                    ? {
                        external: true,
                        href: `https://wa.me/${whatsappDigits}`,
                        text: "CHAT ON WHATSAPP",
                      }
                    : undefined
                }
              />
            )}
            {email && (
              <ContactCard
                label="EMAIL"
                value={email}
                action={{ href: `mailto:${email}`, text: "SEND AN EMAIL" }}
              />
            )}
            {address && (
              <ContactCard
                label="FIND US"
                value={<span className="whitespace-pre-line">{address}</span>}
                action={{
                  external: true,
                  href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                  text: "OPEN IN MAPS",
                }}
              />
            )}
          </div>
        )}

        {settings && (
          <section className="mt-16 border-t border-blyver-ink/10 pt-12">
            <p className="text-[11px] tracking-[0.26em] text-blyver-champagne">
              DELIVERY
            </p>
            <p className="mt-5 max-w-2xl font-display text-3xl leading-snug sm:text-4xl">
              Cash on Delivery, {formatBdt(Number(settings.delivery_charge))}{" "}
              per order
              {threshold !== null
                ? `, and free on orders of ${formatBdt(Number(threshold))} or more.`
                : "."}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

export default ContactPage;

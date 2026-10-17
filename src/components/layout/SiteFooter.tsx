import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  defaultStoreSettings,
  getStoreSettings,
  type StoreSettings,
} from "../../services/settingsService";

const shopLinks = [
  { label: "Men", to: "/men" },
  { label: "Women", to: "/women" },
  { label: "Collections", to: "/collections" },
];

const helpLinks = [
  { label: "Contact us", to: "/contact" },
  { label: "Shipping & returns", to: "/contact" },
  { label: "My account", to: "/account" },
];

function SiteFooter() {
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);

  useEffect(() => {
    getStoreSettings()
      .then(setSettings)
      .catch(() => undefined);
  }, []);

  const phone = settings.phone.trim();
  const email = settings.email.trim();
  const whatsapp = settings.whatsapp.trim();
  const address = settings.business_address.trim();
  const whatsappDigits = whatsapp.replace(/\D/g, "");
  const hasContact = Boolean(phone || email || whatsapp || address);

  return (
    <footer className="border-t border-blyver-ivory/10 bg-blyver-ink text-blyver-ivory">
      <div
        className={`mx-auto grid max-w-7xl gap-12 px-6 py-14 sm:px-10 md:py-18 ${
          hasContact
            ? "md:grid-cols-[1.5fr_1fr_1fr_1.3fr]"
            : "md:grid-cols-[1.5fr_1fr_1fr]"
        }`}
      >
        <div>
          <p className="text-sm tracking-[0.28em]">BLYVER</p>
          <p className="mt-5 max-w-xs font-serif text-2xl leading-tight text-blyver-ivory/90">
            Where elegance meets everyday.
          </p>
          <p className="mt-5 text-sm leading-6 text-blyver-muted">
            Curated watches, wallets, and purses for life’s defining moments.
          </p>
        </div>

        <div>
          <h2 className="text-[11px] tracking-[0.2em] text-blyver-champagne">
            SHOP
          </h2>
          <ul className="mt-5 space-y-3 text-sm text-blyver-ivory/75">
            {shopLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="transition hover:text-blyver-champagne"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[11px] tracking-[0.2em] text-blyver-champagne">
            CUSTOMER CARE
          </h2>
          <ul className="mt-5 space-y-3 text-sm text-blyver-ivory/75">
            {helpLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="transition hover:text-blyver-champagne"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {hasContact && (
          <div>
            <h2 className="text-[11px] tracking-[0.2em] text-blyver-champagne">
              CONTACT
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-blyver-ivory/75">
              {phone && (
                <li>
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                    className="transition hover:text-blyver-champagne"
                  >
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="break-all transition hover:text-blyver-champagne"
                  >
                    {email}
                  </a>
                </li>
              )}
              {whatsapp && (
                <li>
                  {whatsappDigits ? (
                    <a
                      href={`https://wa.me/${whatsappDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:text-blyver-champagne"
                    >
                      WhatsApp: {whatsapp}
                    </a>
                  ) : (
                    <span>WhatsApp: {whatsapp}</span>
                  )}
                </li>
              )}
              {address && (
                <li className="max-w-xs whitespace-pre-line leading-6">
                  {address}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-blyver-ivory/10 px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-[10px] tracking-[0.1em] text-blyver-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} BLYVER. ALL RIGHTS RESERVED.</span>
          <span>PRICES IN BDT (৳)</span>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

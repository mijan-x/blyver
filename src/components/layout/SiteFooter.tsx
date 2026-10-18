import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
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

const headingClassName =
  "type-wide text-[10px] uppercase text-blyver-muted";
const linkClassName = "transition-colors hover:text-blyver-polished";

function SiteFooter() {
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);
  const footerRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  });
  const wordmarkY = useTransform(scrollYProgress, (value) =>
    reduceMotion ? "0%" : `${(1 - value) * 45}%`,
  );

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
    <footer
      ref={footerRef}
      className="brushed relative overflow-hidden text-blyver-polished"
    >
      <div
        aria-hidden="true"
        className="h-px bg-gradient-to-r from-transparent via-blyver-steel/35 to-transparent"
      />
      <div
        className={`mx-auto grid max-w-7xl gap-12 px-6 pt-16 pb-10 sm:px-10 md:pt-20 ${
          hasContact
            ? "md:grid-cols-[1.5fr_1fr_1fr_1.3fr]"
            : "md:grid-cols-[1.5fr_1fr_1fr]"
        }`}
      >
        <div>
          <p className="max-w-xs font-serif text-2xl leading-tight text-blyver-polished">
            Where elegance meets everyday.
          </p>
          <p className="mt-5 max-w-xs text-sm leading-6 text-blyver-steel/70">
            Curated watches, wallets, and purses for life’s defining moments.
          </p>
        </div>

        <div>
          <h2 className={headingClassName}>Shop</h2>
          <ul className="mt-5 space-y-3 text-sm text-blyver-steel">
            {shopLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={linkClassName}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={headingClassName}>Customer care</h2>
          <ul className="mt-5 space-y-3 text-sm text-blyver-steel">
            {helpLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className={linkClassName}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {hasContact && (
          <div>
            <h2 className={headingClassName}>Contact</h2>
            <ul className="mt-5 space-y-3 text-sm text-blyver-steel">
              {phone && (
                <li>
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                    className={linkClassName}
                  >
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className={`break-all ${linkClassName}`}
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
                      className={linkClassName}
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

      {/* Engraved wordmark that rises into place as the page ends. */}
      <div aria-hidden="true" className="overflow-hidden px-4">
        <m.p
          style={{ y: wordmarkY }}
          className="text-metal text-center text-[21vw] leading-[0.82] font-light tracking-[-0.02em] select-none [font-stretch:125%] xl:text-[17rem]"
        >
          BLYVER
        </m.p>
      </div>

      <div className="border-t border-blyver-steel/12 px-6 py-5 sm:px-10">
        <div className="type-wide mx-auto flex max-w-7xl flex-col gap-2 text-[9.5px] text-blyver-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} BLYVER. ALL RIGHTS RESERVED.</span>
          <span>PRICES IN BDT (৳)</span>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

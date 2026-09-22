"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

// Minimalist Clean Icons
const Icons = {
  Home: ({ className = "w-3 h-3" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  ChevronRight: ({ className = "w-2.5 h-2.5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

// Route segment to friendly title mapping
const ROUTE_NAME_MAP = {
  events: { label: "Events" },
  "my-events": { label: "My Bookings" },
  gamification: { label: "Leaderboard" },
  profile: { label: "Profile" },
  "qr-scanner": { label: "QR Scanner" },
  contact: { label: "Contact" },
  about: { label: "About" },
  "terms&cond": { label: "Terms" },
  "privacy&policy": { label: "Privacy" },
  "refund&rule": { label: "Refunds" },
  "shipping&policy": { label: "Shipping" },
  admin: { label: "Admin" },
  "create-event": { label: "Create Event" },
  scanner: { label: "Scanner" },
  admins: { label: "Admins" },
  edit: { label: "Edit" },
  "contact-messages": { label: "Messages" },
  "qr-test": { label: "QR Test" },
};

export default function Breadcrumb({
  items,
  className = "",
  homeHref = "/",
}) {
  const pathname = usePathname();

  const breadcrumbItems = React.useMemo(() => {
    if (items && items.length > 0) {
      return items;
    }

    if (!pathname || pathname === "/") return [];

    const segments = pathname.split("/").filter(Boolean);
    const generated = [];

    let currentPath = "";
    segments.forEach((seg, index) => {
      currentPath += `/${seg}`;
      const isLast = index === segments.length - 1;

      const mapping = ROUTE_NAME_MAP[seg.toLowerCase()] || {
        label: seg.length > 20 ? `${seg.slice(0, 16)}...` : decodeURIComponent(seg).replace(/-/g, " "),
      };

      const label =
        mapping.label.charAt(0).toUpperCase() + mapping.label.slice(1);

      generated.push({
        label,
        href: isLast ? null : currentPath,
      });
    });

    return generated;
  }, [items, pathname]);

  if (!breadcrumbItems || breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`inline-flex items-center text-xs text-slate-400 font-medium py-0 max-w-full overflow-x-auto no-scrollbar ${className}`}
    >
      <ol
        className="flex items-center space-x-1.5 whitespace-nowrap"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {/* Home Link */}
        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          className="inline-flex items-center"
        >
          <Link
            href={homeHref}
            itemProp="item"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors duration-150"
          >
            <Icons.Home className="w-3 h-3 text-slate-400 hover:text-white transition-colors" />
            <span itemProp="name">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>

        {/* Segments */}
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const position = index + 2;

          return (
            <React.Fragment key={index}>
              {/* Clean separator */}
              <li aria-hidden="true" className="text-slate-600 select-none flex items-center">
                <Icons.ChevronRight className="w-2.5 h-2.5 text-slate-600" />
              </li>

              <li
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
                className="inline-flex items-center min-w-0"
              >
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    itemProp="item"
                    className="text-slate-400 hover:text-white transition-colors duration-150 truncate max-w-[140px] sm:max-w-[180px]"
                    title={item.label}
                  >
                    <span itemProp="name">{item.label}</span>
                  </Link>
                ) : (
                  <span
                    aria-current="page"
                    className="text-slate-200 font-medium truncate max-w-[160px] sm:max-w-[260px]"
                    title={item.label}
                  >
                    <span itemProp="name">{item.label}</span>
                  </span>
                )}
                <meta itemProp="position" content={position.toString()} />
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

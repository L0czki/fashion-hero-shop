"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { CloseIcon } from "./icons";
import { Crown } from "lucide-react";

type MenuKey = "MEN" | "WOMEN" | "SALE";

interface MenuColumn {
  heading: string;
  links: { label: string; href: string }[];
}

const menMenu: MenuColumn[] = [
  {
    heading: "SHOES",
    links: [
      { label: "Runners", href: "/collections/mens?type=runner" },
      { label: "Walkers", href: "/collections/mens?type=walker" },
      { label: "Trainers", href: "/collections/mens?type=trainer" },
      { label: "Slip-Ons", href: "/collections/mens?type=slip-on" },
      { label: "All Men's Shoes", href: "/collections/mens" },
    ],
  },
  {
    heading: "APPAREL",
    links: [
      { label: "Tees", href: "/collections/apparel?gender=men&type=tee" },
      { label: "Hoodies", href: "/collections/apparel?gender=men&type=hoodie" },
      { label: "Joggers", href: "/collections/apparel?gender=men&type=pant" },
      { label: "Jackets", href: "/collections/apparel?gender=men&type=jacket" },
      { label: "All Men's Apparel", href: "/collections/apparel?gender=men" },
    ],
  },
  {
    heading: "SOCKS",
    links: [
      { label: "Ankle Socks", href: "/collections/socks?gender=men" },
      { label: "Crew Socks", href: "/collections/socks?gender=men" },
      { label: "No-Show", href: "/collections/socks" },
      { label: "Performance", href: "/collections/socks" },
      { label: "All Men's Socks", href: "/collections/socks" },
    ],
  },
  {
    heading: "ACCESSORIES",
    links: [
      { label: "Bags", href: "/collections/accessories" },
      { label: "Beanies", href: "/collections/accessories" },
      { label: "Caps", href: "/collections/accessories" },
      { label: "Insoles", href: "/collections/accessories" },
    ],
  },
];

const womenMenu: MenuColumn[] = [
  {
    heading: "SHOES",
    links: [
      { label: "Runners", href: "/collections/womens?type=runner" },
      { label: "Walkers", href: "/collections/womens?type=walker" },
      { label: "Trainers", href: "/collections/womens?type=trainer" },
      { label: "Flats", href: "/collections/womens?type=flat" },
      { label: "Slip-Ons", href: "/collections/womens?type=slip-on" },
      { label: "All Women's Shoes", href: "/collections/womens" },
    ],
  },
  {
    heading: "APPAREL",
    links: [
      { label: "Tees", href: "/collections/apparel?gender=women&type=tee" },
      { label: "Hoodies", href: "/collections/apparel?gender=women&type=hoodie" },
      { label: "Joggers", href: "/collections/apparel?gender=women&type=pant" },
      { label: "Cardigans", href: "/collections/apparel?gender=women&type=cardigan" },
      { label: "All Women's Apparel", href: "/collections/apparel?gender=women" },
    ],
  },
  {
    heading: "SOCKS",
    links: [
      { label: "Ankle Socks", href: "/collections/socks?gender=women" },
      { label: "Crew Socks", href: "/collections/socks?gender=women" },
      { label: "No-Show", href: "/collections/socks" },
      { label: "Performance", href: "/collections/socks" },
      { label: "All Women's Socks", href: "/collections/socks" },
    ],
  },
  {
    heading: "ACCESSORIES",
    links: [
      { label: "Bags", href: "/collections/accessories" },
      { label: "Beanies", href: "/collections/accessories" },
      { label: "Caps", href: "/collections/accessories" },
      { label: "Insoles", href: "/collections/accessories" },
    ],
  },
];

const menuData: Record<MenuKey, MenuColumn[] | null> = {
  MEN: menMenu,
  WOMEN: womenMenu,
  SALE: null,
};

interface MegaMenuTriggerProps {
  label: MenuKey;
  href: string;
}

export function MegaMenuNav() {
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [mobileMenu, setMobileMenu] = useState<MenuKey | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((key: MenuKey) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(key);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setActiveMenu(null), 150);
  }, []);

  const handlePanelEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const triggers: MegaMenuTriggerProps[] = [
    { label: "MEN", href: "/collections/mens" },
    { label: "WOMEN", href: "/collections/womens" },
    { label: "SALE", href: "/collections/sale" },
  ];

  return (
    <>
      {/* Desktop nav triggers */}
      <div className="hidden lg:flex items-center gap-6 flex-1">
        {triggers.map(({ label, href }) => (
          <div
            key={label}
            onMouseEnter={() => handleMouseEnter(label)}
            onMouseLeave={handleMouseLeave}
            className="relative"
          >
            <Link
              href={href}
              className="text-[12px] font-medium uppercase tracking-[0.5px] text-charcoal hover:opacity-60 transition-opacity"
            >
              {label}
            </Link>
          </div>
        ))}
        <Link
          href="/collections/new-arrivals"
          className="text-[12px] font-medium uppercase tracking-[0.5px] text-charcoal hover:opacity-60 transition-opacity"
        >
          NEW
        </Link>
        <Link
          href="/collections/premium-early-access"
          className="flex items-center gap-1 text-[12px] font-medium uppercase tracking-[0.5px] text-charcoal hover:opacity-60 transition-opacity"
        >
          <Crown className="h-3 w-3" /> PREMIUM EARLY ACCESS
        </Link>
      </div>

      {/* Desktop mega menu panel */}
      {activeMenu && menuData[activeMenu] && (
        <div
          className="hidden lg:block absolute left-0 right-0 top-full bg-white border-t border-black/5 shadow-lg z-50"
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="grid grid-cols-4 gap-10">
              {menuData[activeMenu]!.map((col) => (
                <div key={col.heading}>
                  <h3 className="text-[12px] font-medium uppercase tracking-[0.8px] text-charcoal mb-3">
                    {col.heading}
                  </h3>
                  <ul className="space-y-2">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          onClick={() => setActiveMenu(null)}
                          className="text-[13px] text-charcoal/70 hover:text-charcoal transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu items (rendered inside mobile drawer via prop) */}
      <MegaMenuMobile
        open={mobileMenu}
        onOpen={setMobileMenu}
        onClose={() => setMobileMenu(null)}
        triggers={triggers}
      />
    </>
  );
}

/** Mobile mega menu — rendered as expandable sections */
function MegaMenuMobile({
  open,
  onOpen,
  onClose,
  triggers,
}: {
  open: MenuKey | null;
  onOpen: (key: MenuKey) => void;
  onClose: () => void;
  triggers: MegaMenuTriggerProps[];
}) {
  // This component is used inside the mobile drawer in header.tsx
  // It's exported so header can embed it
  return null; // The mobile rendering is handled directly in the header
}

/** Standalone mobile mega menu content for embedding in header mobile drawer */
export function MobileMegaMenuContent({ onLinkClick }: { onLinkClick: () => void }) {
  const [expanded, setExpanded] = useState<MenuKey | null>(null);

  const triggers: { label: MenuKey; href: string }[] = [
    { label: "MEN", href: "/collections/mens" },
    { label: "WOMEN", href: "/collections/womens" },
    { label: "SALE", href: "/collections/sale" },
  ];

  return (
    <div className="space-y-1">
      {triggers.map(({ label, href }) => {
        const columns = menuData[label];
        if (!columns) {
          // SALE — just a link
          return (
            <Link
              key={label}
              href={href}
              className="block text-nav py-2"
              onClick={onLinkClick}
            >
              {label}
            </Link>
          );
        }

        const isOpen = expanded === label;
        return (
          <div key={label}>
            <button
              onClick={() => setExpanded(isOpen ? null : label)}
              className="flex items-center justify-between w-full text-nav py-2"
            >
              {label}
              <span className="text-[12px] text-warm-gray">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="pl-4 pb-3 space-y-4">
                {columns.map((col) => (
                  <div key={col.heading}>
                    <h4 className="text-[11px] font-medium uppercase tracking-[0.8px] text-warm-gray mb-1.5">
                      {col.heading}
                    </h4>
                    <ul className="space-y-1">
                      {col.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            onClick={onLinkClick}
                            className="block text-[13px] text-charcoal/70 hover:text-charcoal py-0.5"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <Link
        href="/collections/new-arrivals"
        className="block text-nav py-2"
        onClick={onLinkClick}
      >
        NEW
      </Link>
      <Link
        href="/collections/premium-early-access"
        className="flex items-center gap-2 text-nav py-2"
        onClick={onLinkClick}
      >
        <Crown className="h-3.5 w-3.5" /> PREMIUM EARLY ACCESS
      </Link>
    </div>
  );
}

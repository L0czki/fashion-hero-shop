"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SearchIcon, UserIcon, CartIcon, MenuIcon, CloseIcon, HeartIcon } from "./icons";
import { Crown } from "lucide-react";
import { SearchModal } from "./search-modal";
import { MegaMenuNav, MobileMegaMenuContent } from "./mega-menu";
import { useAuth } from "./auth-provider";

const secondaryLinks = [
  { label: "About", href: "/about" },
];

interface HeaderProps {
  onCartOpen?: () => void;
  cartCount?: number;
  wishlistCount?: number;
}

export function Header({ onCartOpen, cartCount = 0, wishlistCount = 0 }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, isPremiumActive } = useAuth();

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-black/5">
      <nav className="mx-auto flex h-14 items-center px-4 lg:px-8 relative">
        {/* Mobile menu button */}
        <button
          className="lg:hidden p-1 mr-3"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Logo */}
        <Link href="/" className="mr-8">
          <span className="text-xl font-semibold italic tracking-tight text-charcoal">
            FashionHero
          </span>
        </Link>

        {/* Desktop nav with mega menu */}
        <MegaMenuNav />

        {/* Right side icons */}
        <div className="flex items-center gap-3 ml-auto">
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden lg:block text-[12px] text-charcoal hover:opacity-60 transition-opacity"
            >
              {link.label}
            </Link>
          ))}
          <button
            aria-label="Search"
            className="p-1 hover:opacity-60 transition-opacity"
            onClick={() => setSearchOpen(true)}
          >
            <SearchIcon />
          </button>
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="hidden sm:block p-1 hover:opacity-60 transition-opacity relative"
          >
            <HeartIcon className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href={user ? "/account" : "/account/login"}
            aria-label="Account"
            className="hidden sm:flex p-1 hover:opacity-60 transition-opacity items-center justify-center gap-1 relative"
          >
            {user ? (
              <span className="w-5 h-5 rounded-full bg-charcoal text-white text-[11px] font-medium flex items-center justify-center">
                {user.firstName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <UserIcon />
            )}
            {isPremiumActive && (
              <span
                title="Premium aktywne"
                aria-label="Premium"
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-charcoal text-white flex items-center justify-center"
              >
                <Crown className="h-2.5 w-2.5" />
              </span>
            )}
          </Link>
          <button
            aria-label="View Cart"
            className="p-1 hover:opacity-60 transition-opacity relative"
            onClick={onCartOpen}
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-charcoal text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300",
          mobileMenuOpen ? "max-h-[500px]" : "max-h-0"
        )}
      >
        <div className="px-4 py-4 space-y-1 border-t border-black/5">
          <MobileMegaMenuContent onLinkClick={() => setMobileMenuOpen(false)} />
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

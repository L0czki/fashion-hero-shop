"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CloseIcon, MinusIcon, PlusIcon } from "./icons";
import type { CartItem } from "@/types";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { useAuth } from "./auth-provider";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemove,
}: CartDrawerProps) {
  const { isPremiumActive } = useAuth();
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h2 className="text-nav">CART ({items.length})</h2>
          <button onClick={onClose} aria-label="Close cart">
            <CloseIcon />
          </button>
        </div>

        {/* Shipping bar — three states */}
        <div className="px-4 py-3 bg-cream-light">
          {isPremiumActive ? (
            <div className="text-center">
              <p className="text-xs font-medium text-charcoal">
                ✓ Premium: darmowa dostawa odblokowana
              </p>
              <p className="text-[11px] text-warm-gray mt-0.5">
                Dostawa next-day przy zamówieniu do 14:00
              </p>
            </div>
          ) : remaining > 0 ? (
            <div className="text-center">
              <p className="text-xs text-warm-gray">
                Dodaj jeszcze <span className="text-charcoal font-medium">{remaining.toFixed(0)} zł</span> do darmowej dostawy
              </p>
              <Link
                href="/premium"
                onClick={onClose}
                className="text-[11px] text-warm-gray underline hover:text-charcoal transition-colors mt-0.5 inline-block"
              >
                Albo kup Premium za 59 zł/rok — zawsze 0 zł dostawy →
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-charcoal font-medium">
                Masz darmową dostawę w tym zamówieniu ✓
              </p>
              <Link
                href="/premium"
                onClick={onClose}
                className="text-[11px] text-warm-gray underline hover:text-charcoal transition-colors mt-0.5 inline-block"
              >
                Z Premium masz ją zawsze + next-day →
              </Link>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-warm-gray mb-4">
                Your cart is empty. Start shopping!
              </p>
              <div className="space-y-2">
                <a href="/collections/womens" className="btn-cta block">
                  SHOP WOMENS
                </a>
                <a href="/collections/mens" className="btn-cta-outline block">
                  SHOP MENS
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const thumbSrc = item.color.image;
                const showThumb = thumbSrc.startsWith("/images/");
                return (
                  <div key={index} className="flex gap-3 pb-4 border-b border-cream-dark">
                    {/* Thumbnail */}
                    <div
                      className="w-20 h-20 rounded flex-shrink-0 overflow-hidden"
                      style={{
                        background: `radial-gradient(ellipse at 50% 55%, ${item.color.hex}44 0%, ${item.color.hex}22 35%, #ece9e2 65%)`,
                      }}
                    >
                      {showThumb && (
                        <Image
                          src={thumbSrc}
                          alt={`${item.product.name} - ${item.color.name}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-medium uppercase tracking-wide truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-warm-gray">
                        {item.color.name} / Size {item.size}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-cream-dark">
                          <button
                            className="p-1 hover:bg-cream-light"
                            onClick={() =>
                              item.quantity <= 1
                                ? onRemove(index)
                                : onUpdateQuantity(index, item.quantity - 1)
                            }
                          >
                            <MinusIcon />
                          </button>
                          <span className="px-3 text-xs">{item.quantity}</span>
                          <button
                            className="p-1 hover:bg-cream-light"
                            onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                          >
                            <PlusIcon />
                          </button>
                        </div>
                        <span className="text-sm font-medium">
                          {(item.product.price * item.quantity).toFixed(0)} zl
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-4 py-4 border-t">
            <div className="flex justify-between mb-3">
              <span className="text-sm font-medium">Subtotal</span>
              <span className="text-sm font-medium">{subtotal.toFixed(0)} zl</span>
            </div>
            <p className="text-xs text-warm-gray mb-3">
              Shipping and taxes calculated at checkout.
            </p>
            <Link
              href="/checkout"
              className="btn-cta w-full block text-center"
              onClick={onClose}
            >
              CHECKOUT
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

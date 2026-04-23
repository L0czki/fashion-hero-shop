"use client";

import Link from "next/link";
import { Truck, Zap, Sparkles, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
}

export function PremiumLockModal({ isOpen, onClose, productName }: Props) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white max-w-md w-full rounded-lg p-8 text-center">
        <button
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute top-3 right-3 p-1 hover:opacity-60 transition-opacity"
        >
          <X className="h-4 w-4 text-charcoal" />
        </button>
        <p className="text-[11px] uppercase tracking-[0.8px] text-warm-gray mb-3">Premium Early Access</p>
        <h3 className="text-xl font-light text-charcoal mb-2">
          {productName ? `"${productName}"` : "Ten produkt"} to Premium Early Access
        </h3>
        <p className="text-[13px] text-warm-gray mb-6">
          Aktywuj Premium, aby odblokować ten produkt i wszystkie pozostałe korzyści.
        </p>
        <ul className="text-left space-y-2 mb-6 text-[13px] text-charcoal">
          <li className="flex items-center gap-2"><Truck className="h-4 w-4" /> Darmowa dostawa zawsze</li>
          <li className="flex items-center gap-2"><Zap className="h-4 w-4" /> Next-day przed 14:00</li>
          <li className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Dostęp do ekskluzywów</li>
        </ul>
        <Link
          href="/premium"
          onClick={onClose}
          className="block w-full bg-charcoal text-white py-3 text-[12px] font-semibold uppercase tracking-[0.8px] rounded-full hover:bg-charcoal-light transition-colors"
        >
          Aktywuj Premium — 59 zł / rok
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import { WishlistButton } from "./wishlist-button";
import { useQuickView } from "./quick-view-provider";
import { getSellerById } from "@/data/sellers";
import { useAuth } from "./auth-provider";
import { PremiumLockOverlay } from "./premium-lock-overlay";
import { PremiumLockModal } from "./premium-lock-modal";
import { PremiumBadge } from "./premium-badge";

interface ProductCardProps {
  product: Product;
  className?: string;
}

/* Each product gets a unique gradient based on its first color hex */
function productGradient(hex: string): string {
  return `radial-gradient(ellipse at 50% 60%, ${hex}33 0%, ${hex}11 40%, #ece9e2 70%)`;
}

function hasRealImage(src: string): boolean {
  return src.startsWith("/images/");
}

interface ImageAreaProps {
  product: Product;
  firstColor: Product["colors"][number];
  badgeLabel: string | null;
  imageSrc: string;
  showImage: boolean;
  openQuickView: (product: Product) => void;
  disableQuickView: boolean;
}

function ImageArea({ product, firstColor, badgeLabel, imageSrc, showImage, openQuickView, disableQuickView }: ImageAreaProps) {
  return (
    <div
      className="relative aspect-square overflow-hidden mb-3"
      style={{ background: productGradient(firstColor.hex) }}
    >
      {badgeLabel && (
        <span className="absolute top-3 left-3 text-[10px] font-medium uppercase tracking-wider bg-white/90 px-2 py-1 z-10">
          {badgeLabel}
        </span>
      )}
      {showImage ? (
        <Image
          src={imageSrc}
          alt={`${product.name} - ${firstColor.name}`}
          width={800}
          height={800}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
          <div className="relative w-3/5 h-2/5">
            <div
              className="absolute inset-0 rounded-[50%]"
              style={{
                background: `linear-gradient(135deg, ${firstColor.hex}88 0%, ${firstColor.hex}44 100%)`,
                transform: "rotate(-8deg) scaleX(1.6)",
              }}
            />
            <div
              className="absolute top-[-20%] left-[10%] w-[50%] h-[70%] rounded-[40%_60%_30%_70%]"
              style={{
                background: `linear-gradient(180deg, ${firstColor.hex}66 0%, ${firstColor.hex}33 100%)`,
                transform: "rotate(-15deg)",
              }}
            />
          </div>
        </div>
      )}

      {!disableQuickView && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openQuickView(product);
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 text-[10px] font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:block hover:bg-white z-10"
        >
          QUICK VIEW
        </button>
      )}
    </div>
  );
}

export function ProductCard({ product, className }: ProductCardProps) {
  const firstColor = product.colors[0];
  const { openQuickView } = useQuickView();
  const seller = getSellerById(product.sellerId);
  const { isPremiumActive } = useAuth();
  const isLocked = !!product.premiumEarlyAccess && !isPremiumActive;
  const [lockModalOpen, setLockModalOpen] = useState(false);

  const badgeLabel = product.badge === "new"
    ? "NEW"
    : product.badge === "new-color"
    ? "NEW COLOR"
    : product.badge === "bestseller"
    ? "BESTSELLER"
    : product.badge === "sale"
    ? "SALE"
    : null;

  const imageSrc = firstColor.image;
  const showImage = hasRealImage(imageSrc);

  const infoBlock = (
    <div>
      <h3 className="text-[12px] font-medium uppercase tracking-[0.5px] mb-0.5">
        {product.name}
      </h3>
      <p className="text-[12px] text-warm-gray mb-0.5">{firstColor?.name}</p>
      {seller && (
        <p className="text-[11px] text-warm-gray/70 mb-1">
          Sold by{" "}
          <span className="text-charcoal/60 hover:text-charcoal transition-colors">
            {seller.name}
          </span>
          {seller.rating >= 4.5 && (
            <span className="inline-block ml-1 text-[9px] bg-charcoal/10 text-charcoal/70 px-1 py-0.5 rounded uppercase tracking-wide">
              Pro
            </span>
          )}
        </p>
      )}
    </div>
  );

  return (
    <div className={cn("group", className)}>
      <div className="relative">
        {isLocked ? (
          <button
            type="button"
            onClick={() => setLockModalOpen(true)}
            className="block text-left w-full"
            aria-label={`${product.name} — Premium Early Access`}
          >
            <ImageArea
              product={product}
              firstColor={firstColor}
              badgeLabel={badgeLabel}
              imageSrc={imageSrc}
              showImage={showImage}
              openQuickView={openQuickView}
              disableQuickView
            />
            <PremiumLockOverlay />
          </button>
        ) : (
          <Link href={`/products/${product.slug}`} className="block">
            <ImageArea
              product={product}
              firstColor={firstColor}
              badgeLabel={badgeLabel}
              imageSrc={imageSrc}
              showImage={showImage}
              openQuickView={openQuickView}
              disableQuickView={false}
            />
          </Link>
        )}

        {product.premiumEarlyAccess && (
          <div className="absolute bottom-3 left-3 z-30">
            <PremiumBadge size="sm" label="Early Access" />
          </div>
        )}

        {/* Wishlist button — top-right, shows on hover */}
        {!isLocked && (
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 md:block hidden">
            <WishlistButton productId={product.id} className="bg-white/90 rounded-full p-1.5 hover:bg-white" />
          </div>
        )}
      </div>

      {isLocked ? (
        <button
          type="button"
          onClick={() => setLockModalOpen(true)}
          className="block text-left w-full"
        >
          {infoBlock}
        </button>
      ) : (
        <Link href={`/products/${product.slug}`} className="block">
          {infoBlock}
        </Link>
      )}

      {/* Color swatches */}
      <div className="flex gap-1.5 mb-1.5">
        {product.colors.map((color) => (
          <button
            key={color.hex}
            className="w-3 h-3 rounded-full border border-black/10"
            style={{ backgroundColor: color.hex }}
            aria-label={color.name}
          />
        ))}
      </div>

      {/* Price */}
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-medium">{product.price} zl</span>
        {product.originalPrice && (
          <span className="text-xs text-warm-gray line-through">
            {product.originalPrice} zl
          </span>
        )}
      </div>

      <PremiumLockModal
        isOpen={lockModalOpen}
        onClose={() => setLockModalOpen(false)}
        productName={product.name}
      />
    </div>
  );
}

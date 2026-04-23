import Link from "next/link";
import Image from "next/image";
import type { Collection } from "@/types";
import { PremiumBadge } from "./premium-badge";

interface CollectionHeroProps {
  collection: Collection;
}

const collectionGradients: Record<string, string> = {
  mens: "linear-gradient(145deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)",
  womens: "linear-gradient(145deg, #d4a5a5 0%, #c08080 50%, #9a5e5e 100%)",
  "new-arrivals": "linear-gradient(145deg, #5c6b4f 0%, #8a9a7a 50%, #c5cfbb 100%)",
  "best-sellers": "linear-gradient(145deg, #c4b59a 0%, #a89279 50%, #8a7d6b 100%)",
  sale: "linear-gradient(145deg, #9e4040 0%, #c06060 50%, #d48a8a 100%)",
  "premium-early-access": "linear-gradient(145deg, #1a1a1a 0%, #2b2b2b 50%, #3d3d3d 100%)",
};

export function CollectionHero({ collection }: CollectionHeroProps) {
  const gradient = collectionGradients[collection.slug] || collectionGradients["new-arrivals"];
  const hasImage = collection.heroImage.startsWith("/images/");
  const isPremium = collection.slug === "premium-early-access";

  return (
    <section
      className="relative w-full flex items-center justify-center"
      style={{
        background: gradient,
        minHeight: "220px",
      }}
    >
      {/* Background image — skip for premium early access so the dark gradient dominates */}
      {hasImage && !isPremium && (
        <Image
          src={collection.heroImage}
          alt={collection.name}
          fill
          className="object-cover"
          priority
        />
      )}

      {/* Dark overlay for text readability */}
      <div className={isPremium ? "absolute inset-0 bg-black/30" : "absolute inset-0 bg-black/40"} />

      <div className="relative z-10 text-center px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-3" aria-label="Breadcrumb">
          <ol className="flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.6px] text-white/70">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-white">{collection.name}</li>
          </ol>
        </nav>

        {isPremium && (
          <>
            <div className="flex justify-center mb-3">
              <PremiumBadge label="Premium Early Access" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.8px] text-white/60 mb-2">
              48h wcześniej niż reszta
            </p>
          </>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-normal tracking-tight mb-2 text-white">
          {collection.name}
        </h1>

        {/* Description */}
        <p className="text-sm md:text-base max-w-lg mx-auto text-white/70">
          {collection.description}
        </p>
      </div>
    </section>
  );
}

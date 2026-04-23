import type { Collection } from "@/types";

export const collections: Collection[] = [
  {
    id: "mens",
    name: "Men's Fashion",
    slug: "mens",
    description:
      "Explore men's shoes, apparel and accessories from hundreds of sellers.",
    heroImage: "/images/hero/collection-hero-1.jpg",
  },
  {
    id: "womens",
    name: "Women's Fashion",
    slug: "womens",
    description:
      "Discover women's shoes, clothing and accessories from top sellers and indie designers.",
    heroImage: "/images/hero/collection-hero-2.jpg",
  },
  {
    id: "new-arrivals",
    name: "New Arrivals",
    slug: "new-arrivals",
    description: "Fresh drops from sellers across the marketplace. Be the first to discover them.",
    heroImage: "/images/hero/collection-hero-1.jpg",
  },
  {
    id: "best-sellers",
    name: "Best Sellers",
    slug: "best-sellers",
    description:
      "The most popular items on FashionHero right now. Loved by thousands of buyers.",
    heroImage: "/images/hero/collection-hero-2.jpg",
  },
  {
    id: "sale",
    name: "Sale",
    slug: "sale",
    description: "Discounted items from sellers across the marketplace. Great deals, limited time.",
    heroImage: "/images/hero/collection-hero-1.jpg",
  },
  {
    id: "socks",
    name: "Socks",
    slug: "socks",
    description: "Socks from independent makers and established brands. Every style, every price point.",
    heroImage: "/images/hero/collection-hero-1.jpg",
  },
  {
    id: "apparel",
    name: "Apparel",
    slug: "apparel",
    description: "Clothing from hundreds of sellers. Streetwear, basics, sustainable fashion and more.",
    heroImage: "/images/hero/collection-hero-2.jpg",
  },
  {
    id: "accessories",
    name: "Accessories",
    slug: "accessories",
    description: "Bags, hats, jewelry and more from sellers you won't find anywhere else.",
    heroImage: "/images/hero/collection-hero-1.jpg",
  },
  {
    id: "all",
    name: "All Products",
    slug: "all",
    description: "Browse everything on FashionHero - shoes, apparel, and accessories from thousands of sellers.",
    heroImage: "/images/hero/collection-hero-2.jpg",
  },
  {
    id: "premium-early-access",
    name: "Premium Early Access",
    slug: "premium-early-access",
    description: "Ekskluzywne produkty dostępne 48h wcześniej tylko dla Premium.",
    heroImage: "/images/hero/collection-hero-1.jpg",
  },
];

export function getCollection(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}

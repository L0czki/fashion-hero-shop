import { HeroCarousel } from "@/components/sections/hero-carousel";
import { CategoryRow } from "@/components/sections/category-row";
import { ProductCarousel } from "@/components/sections/product-carousel";
import { FeatureStory } from "@/components/sections/feature-story";
import { PromoTiles } from "@/components/sections/promo-tiles";
import { ValueProps } from "@/components/sections/value-props";
import { PremiumPromoBanner } from "@/components/sections/premium-promo-banner";

export default function HomePage() {
  return (
    <main>
      <HeroCarousel />
      <CategoryRow />
      <PremiumPromoBanner />
      <ProductCarousel />
      <FeatureStory />
      <PromoTiles />
      <ValueProps />
    </main>
  );
}

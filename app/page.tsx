import { AboutMaggie } from "@/components/home/AboutMaggie";
import { Favorites } from "@/components/home/Favorites";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HowToOrder } from "@/components/home/HowToOrder";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { Pickup } from "@/components/home/Pickup";
import { WorkshopBand } from "@/components/home/WorkshopBand";
import { heroSlides } from "@/data/site";
import { getFeaturedProducts, getFeaturedWorkshop } from "@/lib/data";

// ISR: se regenera cada 5 minutos. TODO(E5): revalidación on-demand.
export const revalidate = 300;

export default async function Home() {
  const [featuredProducts, featuredWorkshop] = await Promise.all([getFeaturedProducts(), getFeaturedWorkshop()]);

  return (
    <>
      <HeroCarousel slides={heroSlides} />
      <HowToOrder />
      {/* TODO(Maggie): elegir los destacados. Sin destacados, la sección no se muestra. */}
      {featuredProducts.length > 0 && <Favorites products={featuredProducts} />}
      <AboutMaggie />
      <WorkshopBand nextWorkshop={featuredWorkshop} />
      <InstagramFeed />
      <Pickup />
    </>
  );
}

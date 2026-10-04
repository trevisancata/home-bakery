import { AboutMaggie } from "@/components/home/AboutMaggie";
import { Favorites } from "@/components/home/Favorites";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HowToOrder } from "@/components/home/HowToOrder";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { Pickup } from "@/components/home/Pickup";
import { WorkshopBand } from "@/components/home/WorkshopBand";
import { heroSlides } from "@/data/site";
import { getFeaturedProducts, getFeaturedWorkshop } from "@/lib/data";

export default async function Home() {
  const [featuredProducts, featuredWorkshop] = await Promise.all([getFeaturedProducts(), getFeaturedWorkshop()]);

  return (
    <>
      <HeroCarousel slides={heroSlides} />
      <HowToOrder />
      <Favorites products={featuredProducts} />
      <AboutMaggie />
      {featuredWorkshop && <WorkshopBand workshop={featuredWorkshop} />}
      <InstagramFeed />
      <Pickup />
    </>
  );
}

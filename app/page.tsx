import { AboutMaggie } from "@/components/home/AboutMaggie";
import { Favorites } from "@/components/home/Favorites";
import { Hero } from "@/components/home/Hero";
import { HowToOrder } from "@/components/home/HowToOrder";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { Pickup } from "@/components/home/Pickup";
import { WorkshopBand } from "@/components/home/WorkshopBand";
import { getFeaturedProducts, getFeaturedWorkshop, getNextWorkshop } from "@/lib/data";

export default async function Home() {
  const [featuredProducts, nextWorkshop, featuredWorkshop] = await Promise.all([
    getFeaturedProducts(),
    getNextWorkshop(),
    getFeaturedWorkshop(),
  ]);

  return (
    <>
      <Hero nextWorkshop={nextWorkshop} />
      <HowToOrder />
      <Favorites products={featuredProducts} />
      <AboutMaggie />
      {featuredWorkshop && <WorkshopBand workshop={featuredWorkshop} />}
      <InstagramFeed />
      <Pickup />
    </>
  );
}

import { Eyebrow } from "@/components/Eyebrow";
import { ImageFrame } from "@/components/ImageFrame";
import { SectionTitle } from "@/components/SectionTitle";
import { pages, site } from "@/data/site";

const { instagram } = pages.home;

/** Últimos posts de Instagram. Solo en desktop, como en el mockup. */
export function InstagramFeed() {
  const { instagram: account } = site.contact;

  return (
    <section aria-labelledby="instagram-titulo" className="contenedor hidden flex-col gap-9 pt-26 pb-26 lg:flex">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-3">
          <Eyebrow>{instagram.eyebrow}</Eyebrow>
          <SectionTitle id="instagram-titulo" title={instagram.title} />
          <p className="text-16 text-secundario">{instagram.intro}</p>
        </div>
        <a href={account.url} className="text-15 font-semibold text-chocolate underline hover:text-carbon">
          {account.display} <span aria-hidden="true" className="font-simbolos">→</span>
        </a>
      </div>
      <ul className="grid grid-cols-6 gap-4">
        {instagram.posts.map((post, index) => (
          <li key={index}>
            <ImageFrame src={post.src} alt={post.alt} rounded="rounded-2xl" sizes="200px" className="aspect-square" />
          </li>
        ))}
      </ul>
    </section>
  );
}

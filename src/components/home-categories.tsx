"use client";

import { useLanguage } from '@/components/i18n';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
const categories = [{
  name: 'TOPS',
  href: '/shop?category=Tops',
  image: 'tops',
  alt: 'CELESTIALS graphic top with cherry blossom artwork',
  note: 'MAKE YOUR STATEMENT'
}, {
  name: 'BOTTOMS',
  href: '/shop?category=Bottoms',
  image: 'bottoms',
  alt: 'Black wide-leg CELESTIALS trousers on concrete steps',
  note: 'MOVE YOUR OWN WAY'
}, {
  name: 'OUTFITS',
  href: '/shop?category=Outfits',
  image: 'outfits',
  alt: 'A complete relaxed streetwear look photographed on a rooftop',
  note: 'BUILD THE WHOLE LOOK'
}];
export function HomeCategories() {
  const {
    t
  } = useLanguage();
  return <section className="home-categories" aria-labelledby="category-heading">
      <div className="home-categories-heading">
        <span className="eyebrow">{t("CELESTIALS / FIND YOUR ROTATION")}</span>
        <h2 id="category-heading">{t("SHOP BY CATEGORY")}</h2>
      </div>
      <div className="home-categories-grid">
        {categories.map(({
        name,
        href,
        image,
        alt,
        note
      }, index) => <Link key={name} href={href} className={`home-category home-category-${image}`} aria-label={t(`Shop ${name.toLowerCase()}`)}>
            <Image src={`/celestials/${image}.jpg`} alt={t(alt)} fill sizes={index === 0 ? '(max-width: 700px) 90vw, 54vw' : '(max-width: 700px) 43vw, 35vw'} />
            <div className="home-category-caption">
              <span className="eyebrow">{t(note)}</span>
              <div><h3>{t(name)}</h3><ArrowUpRight aria-hidden="true" strokeWidth={1.4} /></div>
            </div>
          </Link>)}
      </div>
    </section>;
}

import { getTranslator } from '@/lib/i18n/server';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
export const metadata = {
  title: 'Our story'
};
export default async function About() {
  const t = await getTranslator();
  return <><section className="story-hero"><div className="story-copy"><span className="eyebrow">{t("CELESTIALS / OUR POINT OF VIEW")}</span><h1>{t("A higher")}<br />{t("standard.")}<br />{t("Your own")}<br />{t("direction.")}</h1><p>{t("CELESTIALS begins with a simple belief: everyday clothing should feel anything but ordinary.")}</p><p>{t("We create space for self-expression through considered essentials, relaxed silhouettes, and a quiet attention to detail. Pieces that move with you, wherever you’re headed.")}</p><Link href="/shop" className="text-link">{t("FIND YOUR UNIFORM ")}<ArrowUpRight size={17} /></Link></div><div className="story-image"><img width={1084} height={1434} src="/celestials/about-models.jpeg" alt={t("Two models, one standing and one seated, against a weathered industrial wall")} /></div></section><section className="section values"><div><span>{t("01 / INTENTION")}</span><h2>{t("Every detail has a reason.")}</h2><p>{t("Clean lines. Considered proportions. A focus on the pieces you reach for again and again.")}</p></div><div><span>{t("02 / INDIVIDUALITY")}</span><h2>{t("No rules. Your rhythm.")}</h2><p>{t("Style comes from how you wear it. Our pieces leave room for your personality, your life, and your point of view.")}</p></div><div><span>{t("03 / EVERYDAY")}</span><h2>{t("Part of your story.")}</h2><p>{t("From slow mornings to late nights, a wardrobe that works together and feels like you.")}</p></div></section></>;
}

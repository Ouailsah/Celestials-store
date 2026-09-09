'use client';

import { useLanguage } from '@/components/i18n';
import Link from 'next/link';
import { BrandMark } from './brand-mark';
import { LanguageSelector } from './language-selector';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useMotionPresence } from './storefront-motion';
import { useCart } from './cart-provider';
export function Header() {
  const {
    t
  } = useLanguage();
  const {
    count
  } = useCart();
  const [menu, setMenu] = useState(false);
  const path = usePathname();
  const menuPresent = useMotionPresence(menu);
  return <><div className="announcement">{t("A HIGHER STANDARD OF EVERYDAY. ")}<span>{t("FREE DELIVERY ON ORDERS 15,000 DZD+")}</span><ArrowUpRight size={12} /></div><header className="header"><Link href="/" className="wordmark" aria-label={t("CELESTIALS home")}><span className="brand-name">CELESTIALS</span><BrandMark className="nav-brand-mark" /></Link><nav className="desktop-nav" aria-label={t("Main navigation")}><Link className={path === '/shop' ? 'active' : ''} href="/shop">{t("Shop all")}</Link><Link href="/shop?edit=new">{t("New arrivals ")}<span className="nav-dot" /></Link><Link href="/about">{t("The brand")}</Link></nav><div className="header-actions"><LanguageSelector onOpen={() => setMenu(false)} /><Link href="/shop?search=" className="desktop-search" aria-label={t("Search products")}><Search size={19} strokeWidth={1.5} /></Link><Link className="bag-link" href="/cart" aria-label={t("Shopping bag, {count} items", {count})}><ShoppingBag size={19} strokeWidth={1.5} /><span className="bag-label">{t("Bag")}</span><span className="bag-count">{count}</span></Link><button className="mobile-menu icon-button" onClick={() => setMenu(!menu)} aria-label={t(menu ? 'Close menu' : 'Open menu')} aria-expanded={menu}>{menu ? <X size={22} /> : <Menu size={22} />}</button></div></header>{menuPresent && <nav data-motion-state={menu ? 'open' : 'closed'} inert={!menu} aria-hidden={!menu} className="mobile-nav" aria-label={t("Mobile navigation")}>{[['/shop', 'Shop all'], ['/shop?edit=new', 'New arrivals'], ['/about', 'The brand'], ['/contact', 'Contact'], ['/shop?search=', 'Search products'], ['/cart', 'Bag']].map(([href, label]) => <Link key={href} href={href} onClick={() => setMenu(false)}><span>{t(label)}{href === "/cart" && <span className="mobile-bag-count"> ({count})</span>}</span><ArrowUpRight /></Link>)}</nav>}</>;
}
export function Footer() {
  const {
    t
  } = useLanguage();
  return <footer className="footer"><div className="footer-top"><div><span className="eyebrow">{t("THE CELESTIALS PHILOSOPHY")}</span><h2>{t("Less noise.")}<br />{t("More presence.")}</h2><p>{t("Considered essentials. Independent spirit.")}<br />{t("For the ones who move differently.")}</p></div><div className="footer-links"><div><span className="eyebrow">{t("EXPLORE")}</span><Link href="/shop">{t("All pieces")}</Link><Link href="/shop?edit=new">{t("New arrivals")}</Link><Link href="/about">{t("Our story")}</Link></div><div><span className="eyebrow">{t("HERE TO HELP")}</span><Link href="/contact">{t("Contact us")}</Link><Link href="/contact#delivery">{t("Delivery & returns")}</Link><Link href="/contact#sizing">{t("Size guide")}</Link></div></div></div><div className="footer-wordmark">CELESTIALS<BrandMark className="footer-brand-mark" /></div><div className="footer-bottom"><span>© {new Date().getFullYear()}{t(" CELESTIALS. ALL RIGHTS RESERVED.")}</span><span>{t("DESIGNED TO GO YOUR OWN WAY.")}</span><Link href="/contact" aria-label={t("Connect with CELESTIALS")}><ArrowUpRight size={16} /></Link></div><p style={{fontSize:10,lineHeight:1.6,marginTop:16}}>{t("Independent website concept — not the official CELESTIALS store.")}</p></footer>;
}

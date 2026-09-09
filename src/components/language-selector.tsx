'use client';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useLanguage } from './i18n';
import { useMotionPresence } from './storefront-motion';
import type { Locale } from '@/lib/i18n';

const languages = [
  { code: 'en', name: 'English', flag: 'gb' },
  { code: 'ar', name: 'العربية', flag: 'dz' },
  { code: 'fr', name: 'Français', flag: 'fr' },
] as const;

export function LanguageSelector({ onOpen }: { onOpen?: () => void }) {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const present = useMotionPresence(open);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const choices = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = languages.find(l => l.code === locale)!;
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  function choose(code: Locale) { setLocale(code); setOpen(false); trigger.current?.focus(); }
  function keyboard(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const index = choices.current.findIndex(node => node === document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : event.key === 'ArrowDown' ? (index + 1) % 3 : (index + 2) % 3;
      choices.current[next]?.focus();
    }
  }
  return <div className="language-selector" ref={root} dir="ltr" onKeyDown={keyboard} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="language-trigger" aria-label={t('Choose language')} aria-haspopup="menu" aria-expanded={open} aria-controls="language-menu" onClick={() => { if (!open) onOpen?.(); setOpen(!open); }} onKeyDown={event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); event.stopPropagation(); onOpen?.(); setOpen(true); requestAnimationFrame(() => choices.current[event.key === 'ArrowDown' ? 0 : 2]?.focus()); }
    }}><img src={`/flags/${selected.flag}.svg`} alt="" width={24} height={16} /><span>{locale.toUpperCase()}</span><ChevronDown size={13} aria-hidden="true" /></button>
    {present && <div data-motion-state={open ? 'open' : 'closed'} inert={!open} aria-hidden={!open} id="language-menu" className="language-dropdown" role="menu" aria-label={t('Choose language')}>
      {languages.map((language, index) => <button key={language.code} ref={node => { choices.current[index] = node; }} type="button" role="menuitemradio" aria-checked={locale === language.code} onClick={() => choose(language.code)}>
        <img src={`/flags/${language.flag}.svg`} alt="" width={27} height={18} /><span className="language-code">{language.code.toUpperCase()}</span><span lang={language.code}>{language.name}</span>{locale === language.code && <Check size={14} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
}

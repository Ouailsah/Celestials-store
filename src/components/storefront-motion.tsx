'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const ease = 'cubic-bezier(.22,1,.36,1)';
const revealSelector = [
  '.hero-content h1', '.hero-content > p', '.hero-content > .button',
  '.page-intro', '.section-heading', '.home-categories-heading', '.home-category',
  '.brand-section > h2', '.brand-section > p', '.brand-section > .text-link',
  '.product-card', '.outfit-card', '.product-detail .gallery',
  '.product-detail-info > h1', '.product-detail-info > .detail-price',
  '.outfit-component', '.story-copy > *', '.story-image', '.values > div',
  '.contact-block', '.footer-top > div', '.cart-item',
].join(',');

/** Shared progressive enhancement: no hidden SSR content or scroll handlers. */
export function StorefrontMotion() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith('/admin') || typeof IntersectionObserver === 'undefined' || !HTMLElement.prototype.animate) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const small = matchMedia('(max-width: 700px)');
    document.documentElement.dataset.storeMotion = 'on';
    const seen = new WeakSet<Element>();
    const active = new Set<Animation>();
    const overlays = new Set<HTMLElement>();
    const galleryCleanup = new WeakMap<HTMLElement, () => void>();
    let disposed = false;
    function animate(node: HTMLElement, frames: Keyframe[], duration: number, delay = 0) {
      if (reduced.matches || disposed || !node.isConnected) return;
      const animation = node.animate(frames, { duration, delay, easing: ease, fill: 'backwards' });
      active.add(animation);
      animation.finished.then(() => active.delete(animation), () => active.delete(animation));
      return animation;
    }
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting);
      visible.forEach((entry, index) => {
        observer.unobserve(entry.target);
        const node = entry.target as HTMLElement;
        if (node.contains(document.activeElement)) return;
        const delay = Math.min(index % 4 * 35, 105);
        animate(node, [{ opacity: 0, translate: `0 ${small.matches ? 10 : 16}px` }, { opacity: 1, translate: '0 0' }], small.matches ? 360 : 520, delay);
      });
    }, { threshold: 0.04 });
    function discover(root: Element) {
      const elements = [...(root.matches(revealSelector) ? [root] : []), ...root.querySelectorAll(revealSelector)];
      for (const node of elements) {
        if (seen.has(node) || node.closest('.admin-content')) continue;
        seen.add(node);
        observer.observe(node);
      }
    }
    function crossfade(image: HTMLImageElement, previous: string) {
      galleryCleanup.get(image)?.();
      if (reduced.matches || !previous || previous === image.getAttribute('src')) return;
      const layer = document.createElement('div');
      layer.dataset.motionOverlay = '';
      layer.setAttribute('aria-hidden', 'true');
      const styles = getComputedStyle(image);
      Object.assign(layer.style, {
        position: 'absolute', inset: '0', pointerEvents: 'none',
        backgroundImage: `url(${JSON.stringify(previous)})`,
        backgroundSize: styles.objectFit === 'contain' ? 'contain' : 'cover',
        backgroundPosition: styles.objectPosition, backgroundRepeat: 'no-repeat',
        backgroundColor: getComputedStyle(image.parentElement!).backgroundColor,
        filter: styles.filter,
      });
      image.after(layer); overlays.add(layer);
      let cancelled = false;
      const cleanup = () => { cancelled = true; layer.remove(); overlays.delete(layer); };
      galleryCleanup.set(image, cleanup);
      // Keep the preceding photograph visible until the new photograph is decoded.
      void image.decode().catch(() => {}).then(() => {
        if (cancelled || disposed) return cleanup();
        const animation = animate(layer, [{ opacity: 1 }, { opacity: 0 }], small.matches ? 160 : 220);
        if (animation) void animation.finished.then(cleanup, cleanup); else cleanup();
      });
    }
    discover(document.body);
    const mutations = new MutationObserver(records => {
      const feedback = new Set<HTMLElement>();
      const grids = new Set<HTMLElement>();
      for (const record of records) {
        if (record.type === 'attributes' && record.target instanceof HTMLImageElement && record.target.matches('.storefront .gallery-main > img')) crossfade(record.target, record.oldValue || '');
        if (record.type !== 'childList') continue;
        for (const node of record.addedNodes) if (node instanceof Element && !node.hasAttribute('data-motion-overlay')) discover(node);
        const target = record.target instanceof HTMLElement ? record.target : record.target.parentElement;
        if (!target) continue;
        const counter = target.closest<HTMLElement>('.bag-count, .mobile-bag-count, .storefront .quantity-control span, .storefront .cart-feedback');
        if (counter?.textContent?.trim()) feedback.add(counter);
        if (target.matches('.storefront .product-grid') && record.removedNodes.length) grids.add(target);
      }
      feedback.forEach(node => animate(node, [{ opacity: .65, scale: '.97' }, { opacity: 1, scale: '1' }], 180));
      grids.forEach(node => animate(node, [{ opacity: .75 }, { opacity: 1 }], 180));
    });
    mutations.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'], attributeOldValue: true });
    const stop = () => { active.forEach(a => a.cancel()); active.clear(); overlays.forEach(n => n.remove()); overlays.clear(); };
    const preference = () => { if (reduced.matches) stop(); };
    const focus = (event: FocusEvent) => {
      // Keyboard focus can reveal immediately. Do not reposition a link between
      // pointer-down and pointer-up, which could cancel the user's click.
      if (!(event.target instanceof HTMLElement) || !event.target.matches(':focus-visible')) return;
      active.forEach(a => { const target = (a.effect as KeyframeEffect)?.target; if (target instanceof Element && target.contains(event.target as Node)) a.cancel(); });
    };
    reduced.addEventListener('change', preference);
    document.addEventListener('focusin', focus);
    return () => {
      disposed = true; observer.disconnect(); mutations.disconnect(); stop();
      reduced.removeEventListener('change', preference); document.removeEventListener('focusin', focus);
      delete document.documentElement.dataset.storeMotion;
    };
  }, [path]);
  return null;
}

/** Retain only the exiting visual for 160ms; it is immediately inert/hidden to AT. */
export function useMotionPresence(open: boolean) {
  const [retained, retain] = useState(open);
  useEffect(() => {
    if (open) { retain(true); return; }
    const timer = setTimeout(() => retain(false), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160);
    return () => clearTimeout(timer);
  }, [open]);
  return open || retained;
}

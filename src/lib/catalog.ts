import type { Product } from './types';
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;
export const HERO = photo('photo-1483985988355-763728e1935b');
export const EDITORIAL = photo('photo-1529139513065-cd1c9d8d2823');
const shirtId = '10000000-0000-4000-8000-000000000007';
export const seedProducts: Product[] = [{
  id: shirtId, slug: 'cursed-blood-manipulation-shirt', name: 'Cursed Blood Manipulation Shirt',
  category: 'Tops', price: 3500, badge: 'NEW ARRIVAL', active: true,
  description: 'An oversized statement shirt built around the Cursed Blood Manipulation graphic. Cut with a relaxed silhouette and finished with bold red detailing across the back, creating a sharp contrast against the deep black fabric. Designed for an effortless streetwear fit with a strong visual identity.',
  images: ['01-cover', '02-back', '03-side', '04-detail', '05-outfit'].map(name => `/products/cursed-blood-manipulation/${name}.jpeg`),
  // Preview inventory only; the SQL seed starts this product at zero pending real stock.
  product_variants: ['S', 'M-L', 'XL'].map((size, index) => ({
    id: `20000000-0000-4000-8000-${String(700 + index).padStart(12, '0')}`,
    product_id: shirtId, size, color: 'Black', color_hex: '#222222', stock: 12,
  })),
}, {
  id: '10000000-0000-4000-8000-000000000008', slug: 'sakura-long-sleeve', name: 'Sakura Long Sleeve',
  category: 'Tops', price: 3800, badge: 'NEW ARRIVAL', active: true,
  description: 'Sakura Long Sleeve — a relaxed statement piece inspired by Japanese aesthetics, featuring a detailed cherry blossom graphic across the back with contrasting black calligraphy. The clean white base and oversized silhouette keep the front minimal while allowing the artwork to define the piece. Designed for an effortless streetwear fit and easy everyday layering.',
  images: ['01-cover', '02-rear', '03-detail', '04-models', '05-angled'].map(name => `/products/sakura-long-sleeve/${name}.jpeg`),
  // Preview inventory; production stock awaits confirmed quantities.
  product_variants: ['S', 'M-L', 'XL'].map((size, index) => ({
    id: `20000000-0000-4000-8000-${String(800 + index).padStart(12, '0')}`,
    product_id: '10000000-0000-4000-8000-000000000008', size, color: 'White', color_hex: '#eeede5', stock: 12,
  })),
}, {
  id: '10000000-0000-4000-8000-000000000009', slug: 'sakura-shirt', name: 'Sakura Shirt',
  category: 'Tops', price: 3700, badge: 'NEW ARRIVAL', active: true,
  description: 'Sakura Shirt — a relaxed oversized statement piece featuring a Japanese-inspired cherry blossom graphic flowing across the upper back and shoulder. The clean white base keeps the silhouette minimal while the black and soft pink Sakura artwork creates the focal point. Designed with a loose, effortless fit for everyday streetwear styling.',
  images: ['01-cover', '02-rear', '03-side', '04-front'].map(name => `/products/sakura-shirt/${name}.jpeg`),
  // Preview inventory; production stock awaits confirmed quantities.
  product_variants: ['S', 'M-L', 'XL'].map((size, index) => ({
    id: `20000000-0000-4000-8000-${String(900 + index).padStart(12, '0')}`,
    product_id: '10000000-0000-4000-8000-000000000009', size, color: 'White', color_hex: '#eeede5', stock: 12,
  })),
}, {
  id: '10000000-0000-4000-8000-000000000010', slug: 'slim-fit-shirt-blue-navy', name: 'Slim Fit Shirt Blue Navy',
  category: 'Tops', price: 2000, badge: 'NEW ARRIVAL', active: true,
  description: 'A clean everyday essential designed with a close, streamlined silhouette. Finished in a deep navy tone, this shirt delivers a minimal and versatile look with a sharp fitted shape. Its simple construction makes it easy to style on its own or combine with other pieces for a clean everyday outfit.',
  images: ['01-cover', '02-front', '03-back'].map(name => `/products/slim-fit-shirt-blue-navy/${name}.jpeg`),
  // Provisional preview sizes and inventory; confirm before publishing stock.
  product_variants: ['S', 'M', 'L', 'XL'].map((size, index) => ({
    id: `20000000-0000-4000-8000-${String(1000 + index).padStart(12, '0')}`,
    product_id: '10000000-0000-4000-8000-000000000010', size, color: 'Navy', color_hex: '#151c29', stock: 12,
  })),
}, {
  id: '10000000-0000-4000-8000-000000000011', slug: 'sakura-jeans', name: 'Sakura Jeans',
  category: 'Bottoms', price: 6000, badge: 'NEW ARRIVAL', active: true,
  description: 'Sakura Jeans — a wide-leg black denim piece finished with a subtle Sakura-inspired graphic detail near the upper back pocket. The relaxed silhouette gives the jeans a loose streetwear shape, while the minimal floral accent connects the piece to the Sakura collection without overpowering the design. Built for an easy, oversized fit and everyday styling.',
  images: ['01-cover', '02-detail', '03-outdoor'].map(name => `/products/sakura-jeans/${name}.jpeg`),
  // Preview inventory; production stock awaits confirmed quantities.
  product_variants: ['S', 'M-L', 'XL'].map((size, index) => ({
    id: `20000000-0000-4000-8000-${String(1100 + index).padStart(12, '0')}`,
    product_id: '10000000-0000-4000-8000-000000000011', size, color: 'Black', color_hex: '#222222', stock: 12,
  })),
}, {
  id: '10000000-0000-4000-8000-000000000012', slug: 'serpent-hunter-bootcut', name: 'Serpent Hunter Bootcut',
  category: 'Bottoms', price: 5900, badge: null, active: true,
  description: 'Serpent Hunter Bootcut. Bootcut jeans with a flared leg, paired with the Slim Fit Shirt Blue Navy in the Bootcut + Slim Shirt Combo.',
  images: ['/products/bootcut-jeans/01-cover.jpeg'],
  size_guide: { image: '/products/bootcut-jeans/size-chart.jpeg', alt: 'Serpent Hunter Bootcut size chart. S: length 103, leg opening 17, thigh 28, rise 30. M: 106, 26, 29, 32. L: 108, 28, 30, 32. XL: 110, 31, 32, 33. Measurements in cm.' },
  // Preview inventory only. Production inventory starts at zero.
  product_variants: ['S', 'M', 'L', 'XL'].map((size, index) => ({
    id: `20000000-0000-4000-8000-${String(1200 + index).padStart(12, '0')}`,
    product_id: '10000000-0000-4000-8000-000000000012', size, color: 'Charcoal', color_hex: '#363638', stock: 12,
  })),
}];

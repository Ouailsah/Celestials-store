# CELESTIALS campaign asset

## Current supplied identity — 6 September 2026

The homepage now uses the user-supplied artwork at `public/celestials/hero.jpg`, with category photos at `public/celestials/tops.jpg`, `bottoms.jpg`, and `outfits.jpg`. These are unchanged copies of the supplied `.jpeg` files in `public/images`.

`public/celestials/logo.png` is a lossless PNG conversion of the supplied `public/images/logo.jpeg`, without resizing or recoloring. The original aspect ratio and lime symbol are retained in the navbar, homepage brand accents, footer, and favicon (`src/app/icon.png`). No image generation was used for this update.

The portrait hero uses `object-fit: contain` to preserve the person, celis artwork, airplane, and city. On desktop it occupies the right side of a large dark hero; on mobile the complete artwork appears above the copy. TOPS filters existing Tops/T-Shirts/Hoodies/Outerwear categories, BOTTOMS filters Bottoms, and OUTFITS opens the full collection to build a look.

## Previous generated campaign (retained, no longer the homepage hero)

The previous homepage used `public/images/celestials-campaign.png`, created with the **built-in image generation tool** and copied into this repository. It is retained as an unused asset. This is an AI-generated campaign concept, not a photograph of actual CELESTIALS merchandise.

Final generation prompt:

> Use case: photorealistic-natural. Asset type: premium streetwear fashion ecommerce homepage hero background for CELESTIALS, a contemporary independent clothing label. Create a wide landscape editorial fashion photograph, approximately 16:9. Two adult fashion models in oversized washed charcoal hoodies and loose black cargo trousers, one wearing a stone gray oversized jacket, standing casually in a monumental raw concrete urban passage with vertical brutalist walls. Full or three-quarter bodies. Models positioned mainly in the right half, one closer in right foreground and the other farther near center-right. The left 45 percent should be dark textured concrete with soft light and no people, deliberately leaving negative space for large white headline overlay. Understated, premium high fashion art direction; shot on 35mm film, tactile cotton, realistic natural skin, soft overcast daylight, low saturation charcoal, stone and subtle olive colors, quietly confident candid posture, strong architectural depth. Natural photographic realism. Avoid glossy commercial posing, avoid bright colors, avoid jewelry emphasis, avoid fantastical imagery. No writing, no text, no typography, no logos, no watermarks. This is a photographic asset only, not a website mockup.

Sample product/category/brand photos are remote Unsplash images, referenced in `src/lib/catalog.ts`, `src/app/page.tsx`, and `src/app/about/page.tsx`. They are illustrative, and must be replaced or reviewed for the real catalog. Product color selections do not recolor the sample photographs.

The CELESTIALS wordmark is rendered as text; interface icons use Lucide. The previous generic star favicon has been replaced with the supplied logo.

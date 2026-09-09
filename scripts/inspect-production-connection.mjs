// Read-only inspection: no authentication or order submission.
const base = process.argv[2] || 'https://celestials-store.vercel.app';
for (const path of ['/admin/login', '/shop', '/checkout']) {
  const response = await fetch(new URL(path, base));
  const html = await response.text();
  console.log(JSON.stringify({
    path, status: response.status,
    connectedProps: [...html.matchAll(/connected.{0,30}/g)].map(match => match[0]),
    productLinks: [...new Set([...html.matchAll(/href="\/product\/([^"]+)/g)].map(match => match[1]))],
    hasOwnerTestProduct: html.toLowerCase().includes('test celestial'),
    hasOwnerOutfit: html.includes('EVERYDAY BALANCE'),
    hasStorageImages: html.includes('supabase.co/storage'),
  }));
}

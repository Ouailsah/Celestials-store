import Image from 'next/image';

/** The supplied artwork retains its native aspect ratio and lime coloring. */
export function BrandMark({ className = '' }: { className?: string }) {
  return <Image src="/celestials/logo.png" width={512} height={594} alt="" aria-hidden="true" className={`brand-mark ${className}`} />;
}

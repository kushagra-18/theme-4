"use client";

import SafeImage from "./SafeImage";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  unoptimized?: boolean;
};

export default function HeroImageClickable({ src, alt, priority, sizes, unoptimized }: Props) {
  return (
    <figure
      id="post-hero"
      className="relative h-96 rounded-lg overflow-hidden mb-8 cursor-zoom-in"
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bb:openGallery', { detail: { index: 0 } }));
        }
      }}
      role="button"
      aria-label="Open image gallery"
    >
      <SafeImage
        src={src}
        alt={alt}
        fill
        style={{ objectFit: 'cover' }}
        priority={priority}
        sizes={sizes}
        unoptimized={unoptimized}
      />
    </figure>
  );
}

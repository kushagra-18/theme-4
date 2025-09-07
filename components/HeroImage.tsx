"use client";

import Image from "next/image";
import React from "react";

type HeroImageProps = {
  src: string; // absolute or next/image-compatible URL
  alt: string; // descriptive alt text
  width: number; // intrinsic width in px
  height: number; // intrinsic height in px
  isLCP?: boolean; // mark exactly ONE hero as LCP per page
  className?: string;
};

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4JyBoZWlnaHQ9JzgnIHZpZXdCb3g9JzAgMCA4IDgnPjxyZWN0IHdpZHRoPSc4JyBoZWlnaHQ9JzgnIGZpbGw9JyNlNWU3ZWInLz48L3N2Zz4=";

export default function HeroImage({
  src,
  alt,
  width,
  height,
  isLCP = false,
  className,
}: HeroImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      // LCP rules: no lazy, high priority/fetchPriority only for ONE image
      priority={isLCP}
      fetchPriority={isLCP ? "high" : "auto"}
      // Let next/image generate srcSet automatically; provide accurate sizes
      sizes="(max-width: 768px) 100vw, 1200px"
      // Blur placeholder to avoid CLS during initial paint
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
      // Avoid content jumps by reserving space via width/height props
      className={className}
    />
  );
}

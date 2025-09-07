"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

// Gray SVG data URI used as a lightweight fallback placeholder
const FALLBACK_DATA_URI =
  "data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' width='8' height='8'>\
  <rect width='8' height='8' fill='%23d1d5db'/>\
</svg>";

type BaseProps = {
  src?: string | null;
  className?: string; // applied to the underlying Image
} & Omit<ImageProps, "src">;

export default function SafeImage({ src, alt, className, onLoad, onError, ...rest }: BaseProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const finalSrc = !src || failed ? FALLBACK_DATA_URI : src;

  const isFill = (rest as any).fill === true;
  const wrapperClass = `relative ${isFill ? "block h-full w-full" : "inline-block"}`;

  return (
    <div className={wrapperClass}>
      {/* Skeleton layer */}
      {!loaded && (
        <div className="absolute inset-0 bg-base-300 animate-pulse" aria-hidden />
      )}
      <Image
        {...rest}
        alt={alt}
        src={finalSrc}
        className={className}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setFailed(true);
          setLoaded(true);
          onError?.(e);
        }}
      />
    </div>
  );
}

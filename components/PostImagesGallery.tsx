"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";

type Props = {
  images: string[];
};

export default function PostImagesGallery({ images }: Props) {
  const cleanImages = useMemo(() => Array.from(new Set((images || []).filter(Boolean))), [images]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const FALLBACK_DATA_URI =
    "data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' width='8' height='8'>\
  <rect width='8' height='8' fill='%23d1d5db'/>\
</svg>";

  const openAt = useCallback((i: number) => {
    if (cleanImages.length === 0) return;
    const clamped = Math.max(0, Math.min(i, cleanImages.length - 1));
    setIndex(clamped);
    setOpen(true);
  }, [cleanImages.length]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const ce = e as CustomEvent;
      const i = typeof ce.detail?.index === 'number' ? ce.detail.index : 0;
      openAt(i);
    };
    window.addEventListener('bb:openGallery', onOpen as EventListener);
    return () => window.removeEventListener('bb:openGallery', onOpen as EventListener);
  }, [openAt]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') setIndex(i => Math.min(i + 1, cleanImages.length - 1));
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    // lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, cleanImages.length]);

  useEffect(() => {
    // reset skeleton when image index changes or modal opens
    if (open) setImgLoaded(false);
  }, [index, open]);

  if (cleanImages.length === 0) return null;

  if (!mounted) return null;

  return open
    ? createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 flex items-center justify-center relative w-full">
              {!imgLoaded && (
                <div className="absolute inset-0 rounded-lg bg-base-300 animate-pulse" aria-hidden />
              )}
              <img
                src={cleanImages[index]}
                alt={`Image ${index + 1}`}
                className="max-h-[70vh] w-full object-contain rounded-lg bg-base-100 relative"
                onLoad={() => setImgLoaded(true)}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_DATA_URI;
                  setImgLoaded(true);
                }}
              />
            </div>

            {/* Controls */}
            <button
              className="absolute top-1/2 -translate-y-1/2 left-2 btn btn-circle"
              onClick={() => setIndex(i => Math.max(0, i - 1))}
              disabled={index === 0}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className="absolute top-1/2 -translate-y-1/2 right-2 btn btn-circle"
              onClick={() => setIndex(i => Math.min(cleanImages.length - 1, i + 1))}
              disabled={index === cleanImages.length - 1}
              aria-label="Next image"
            >
              ›
            </button>
            <button
              className="absolute top-2 right-2 btn btn-sm"
              onClick={() => setOpen(false)}
              aria-label="Close gallery"
            >
              ✕
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-white/90">
              {index + 1} / {cleanImages.length}
            </div>

            {/* Thumbnails inside modal */}
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar py-2">
              {cleanImages.map((src, i) => (
                <button
                  key={src + i}
                  className={`shrink-0 border rounded-md overflow-hidden focus:outline-none ${i === index ? 'ring-2 ring-primary' : 'border-base-300'}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                >
                  <img
                    src={src}
                    alt="thumb"
                    className="h-16 w-24 object-cover bg-base-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_DATA_URI;
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;
}

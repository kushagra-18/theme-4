"use client";

import { useEffect } from "react";

type Props = {
  containerId: string;
  images: string[];
};

export default function PostImageBinder({ containerId, images }: Props) {
  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) return;

    const imgs = Array.from(el.querySelectorAll('img')) as HTMLImageElement[];
    const urls = images;

    const handler = (ev: Event) => {
      const target = ev.currentTarget as HTMLImageElement;
      const src = target.getAttribute('src') || '';
      const idx = urls.indexOf(src);
      if (idx >= 0) {
        window.dispatchEvent(new CustomEvent('bb:openGallery', { detail: { index: idx } }));
      }
    };

    imgs.forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', handler);
    });

    return () => {
      imgs.forEach(img => img.removeEventListener('click', handler));
    };
  }, [containerId, images.join('|')]);

  return null;
}


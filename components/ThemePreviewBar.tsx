"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

const themes = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
  "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
  "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
  "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee",
  "winter", "dim", "nord", "sunset",
];

function ThemePreview() {
  const searchParams = useSearchParams();
  const showPreview = searchParams.get('blaze-blog-test') === 'true';
  const [currentTheme, setCurrentTheme] = useState('');

  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme');
    if (theme) {
      setCurrentTheme(theme);
    }
  }, []);

  const handleThemeChange = (theme: string) => {
    document.documentElement.setAttribute('data-theme', theme);
    setCurrentTheme(theme);
  };

  if (!showPreview) {
    return null;
  }

  return (
    <div className="bg-neutral text-neutral-content p-2 text-center text-sm sticky top-0 z-50">
      <div className="flex items-center justify-center gap-2">
        <span className="font-bold">Theme Preview:</span>
        <select
          className="select select-bordered select-xs"
          value={currentTheme}
          onChange={(e) => handleThemeChange(e.target.value)}
          aria-label="Select a theme to preview"
        >
          {themes.map(theme => (
            <option key={theme} value={theme}>{theme.charAt(0).toUpperCase() + theme.slice(1)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Wrap the component in Suspense as required by Next.js for components that use useSearchParams
export default function ThemePreviewBar() {
    return (
        <Suspense fallback={null}>
            <ThemePreview />
        </Suspense>
    )
}

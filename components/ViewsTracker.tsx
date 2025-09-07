"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ViewsTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const send = () => {
      try {
        // Extract first path segment as slug
        const raw = (window.location.pathname || "/").replace(/^\/+/, "").replace(/\/+$/, "");
        const slug = (raw.split("/")[0] || "").trim();
        if (!slug) return;

        // Bot/automation filters
        const ua = (navigator.userAgent || "").toLowerCase();
        const deny = ["bot", "spider", "crawl", "headlesschrome", "phantomjs", "puppeteer", "pingdom"];
        for (let i = 0; i < deny.length; i++) {
          if (ua.indexOf(deny[i]) !== -1) return;
        }

        const data = JSON.stringify({ slug });

        const url = "/api/views/collect";

        if (typeof navigator.sendBeacon === "function") {
          const blob = new Blob([data], { type: "application/json" });
          const ok = navigator.sendBeacon(url, blob);
          if (ok) return;
        }

        // Fallback to keepalive POST
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          credentials: "omit",
          body: data,
          cache: "no-store",
        }).catch(() => {});
      } catch {}
    };

    const schedule = (fn: () => void) => {
      const ric = (window as any).requestIdleCallback as
        | ((cb: () => void, opts?: { timeout?: number }) => number)
        | undefined;
      if (typeof ric === "function") {
        ric(fn, { timeout: 3000 });
      } else {
        setTimeout(fn, 0);
      }
    };

    if (document.readyState === "complete") {
      schedule(send);
    } else {
      const onLoad = () => {
        schedule(send);
        window.removeEventListener("load", onLoad);
      };
      window.addEventListener("load", onLoad);
      schedule(send);
    }
  }, [pathname, search]);

  return null;
}

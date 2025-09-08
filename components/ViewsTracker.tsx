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
        const raw = (window.location.pathname || "/").replace(/^\/+/, "").replace(/\/+$/, "");
        const slug = (raw.split("/")[0] || "").trim();
        if (!slug) return;

        const ua = (navigator.userAgent || "").toLowerCase();
        const deny = ["bot", "spider", "crawl", "headlesschrome", "phantomjs", "puppeteer", "pingdom"];
        for (let i = 0; i < deny.length; i++) {
          if (ua.indexOf(deny[i]) !== -1) return;
        }

        const domain = window.location.hostname;

        const payload = JSON.stringify({ slug, domain });
       
        const url = "/api/views/collect";
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          credentials: "omit",
          body: payload,
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

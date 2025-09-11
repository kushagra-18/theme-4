"use client";
import { Post, SiteConfig } from "@/lib/blazeblog";
import { useEffect, useMemo, useState } from "react";
import PostCard from "@/components/PostCard";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TagGroup = { id: number; name: string; slug: string; posts: Post[] };

export default function HomeTagsBrowser({
  latest,
  tags,
  siteConfig,
}: {
  latest: Post[];
  tags: TagGroup[];
  siteConfig: SiteConfig;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pills = useMemo(
    () => [{ key: "latest", label: "Latest", posts: latest }, ...tags.map((t) => ({ key: t.slug, label: t.name, posts: t.posts }))],
    [latest, tags]
  );

  const initialKey = searchParams.get("tag") || "latest";
  const [active, setActive] = useState(initialKey);

  useEffect(() => {
    const q = new URLSearchParams(searchParams.toString());
    if (active === "latest") q.delete("tag");
    else q.set("tag", active);
    router.replace(`${pathname}${q.toString() ? `?${q.toString()}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const activeGroup = pills.find((p) => p.key === active) || pills[0];

  return (
    <div className="flex flex-col gap-8">
      <div className="no-scrollbar -mx-2 overflow-x-auto">
        <div className="flex gap-2 px-2 justify-center">
          {pills.map((p) => (
            <button
              key={p.key}
              onClick={() => setActive(p.key)}
              className={`btn btn-sm rounded-full ${active === p.key ? "btn-primary" : "btn-ghost"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 justify-items-center">
        {activeGroup.posts.map((post) => (
          <PostCard key={post.id} post={post} authorLinkEnabled={siteConfig.featureFlags.enableAuthorsPage} />
        ))}
      </div>
    </div>
  );
}


import { getSSRBlazeBlogClient, Tag } from '@/lib/blazeblog';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Tags',
  description: 'A list of all tags used in posts.',
};

// Helper function to calculate font size for the tag cloud
const getTagStyle = (tag: Tag, maxCount: number) => {
  const minFontSize = 1; // em
  const maxFontSize = 3; // em
  const weight = tag.postCount ? Math.log(tag.postCount) / Math.log(maxCount) : 0.1;
  const fontSize = minFontSize + weight * (maxFontSize - minFontSize);
  return { fontSize: `${fontSize.toFixed(2)}em` };
};

export default async function TagsPage() {
  const client = await getSSRBlazeBlogClient();

  // Fetch config and tags in parallel
  const [siteConfig, tagsResult] = await Promise.all([
    client.getSiteConfig().then(res => (res as any).data || res),
    client.getTags()
  ]);

  if (!siteConfig.featureFlags.enableTagsPage) {
    notFound();
  }

  const { tags } = tagsResult;
  const maxCount = Math.max(...tags.map(t => t.postCount || 1), 1);

  return (
    <div className="bg-base-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Tags</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-base-content/70">
            Explore posts by keyword.
          </p>
        </div>

        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap justify-center items-center gap-4 text-center">
            {tags.map(tag => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="p-2 hover:text-primary transition-colors"
                style={getTagStyle(tag, maxCount)}
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-semibold">No tags found.</h2>
          </div>
        )}
      </div>
    </div>
  );
}

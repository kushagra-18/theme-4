import { getSSRBlazeBlogClient } from '@/lib/blazeblog';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';
  return {
    title: `Search results for "${query}"`,
    description: `Posts found matching the search term "${query}".`,
  };
}

async function SearchResults({ query }: { query: string }) {
  const client = await getSSRBlazeBlogClient();
  const { posts } = await client.searchPosts(query);

  return (
    <div className="bg-base-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Search Results
          </h1>
          <p className="mt-2 text-lg text-base-content/70">
            {posts.length > 0 ? `Showing results for "${query}"` : `No results found for "${query}"`}
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl">Try another search or browse our latest posts.</p>
            <Link href="/" className="btn btn-primary mt-4">Back to Home</Link>
          </div>
        )}
      </div>
    </div>
  );
}

// The main page component is wrapped in Suspense to handle streaming
export default function SearchPage({ searchParams }: Props) {
    const query = typeof searchParams.q === 'string' ? searchParams.q : '';

    if (!query) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-semibold">Please enter a search term.</h1>
            </div>
        )
    }

    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Loading search results...</div>}>
            <SearchResults query={query} />
        </Suspense>
    )
}

import { getSSRBlazeBlogClient } from '@/lib/blazeblog';
import { notFound } from 'next/navigation';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import type { Metadata } from 'next';

type Props = {
  params: { slug: string };
  searchParams?: { page?: string };
};

// Generate metadata for the tag page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const tagName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

  return {
    title: `Posts tagged with #${tagName}`,
    description: `Browse all posts tagged with #${tagName}.`,
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = params;
  const currentPage = Number(searchParams?.page) || 1;
  const client = await getSSRBlazeBlogClient();

  try {
    const { posts, pagination } = await client.getPosts({ tags: [slug], page: currentPage, limit: 9 });

    // We don't get the tag name back from this endpoint, so we format the slug
    const tagName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

    return (
      <div className="bg-base-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <p className="text-sm font-semibold uppercase text-primary">Tag</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">#{tagName}</h1>
          </div>

          {posts && posts.length > 0 ? (
            <>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center mt-12">
                <div className="join">
                  {pagination.prevPage && (
                    <Link href={`/tag/${slug}?page=${pagination.prevPage}`} className="join-item btn">
                      «
                    </Link>
                  )}
                  <button className="join-item btn" disabled>
                    Page {pagination.page} of {pagination.totalPages}
                  </button>
                  {pagination.nextPage && (
                    <Link href={`/tag/${slug}?page=${pagination.nextPage}`} className="join-item btn">
                      »
                    </Link>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-semibold">No posts found with this tag.</h2>
              <Link href="/" className="btn btn-primary mt-4">Back to Home</Link>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error(`Failed to fetch posts for tag ${slug}:`, error);
    notFound();
  }
}

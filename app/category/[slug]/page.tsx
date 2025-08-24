import { getSSRBlazeBlogClient } from '@/lib/blazeblog';
import { notFound } from 'next/navigation';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import type { Metadata } from 'next';

type Props = {
  params: { slug: string };
  searchParams?: { page?: string };
};

// Generate metadata for the category page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  // Capitalize first letter for a nicer title
  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

  return {
    title: `Posts in ${categoryName}`,
    description: `Browse all posts in the category ${categoryName}.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = params;
  const currentPage = Number(searchParams?.page) || 1;
  const client = await getSSRBlazeBlogClient();

  try {
    const { posts, pagination, meta } = await client.getPosts({ category: slug, page: currentPage, limit: 9 });

    // The API might return an empty posts array but not a 404
    // We need to get the actual category name from the first post if available
    const categoryName = posts[0]?.category?.name || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

    return (
      <div className="bg-base-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <p className="text-sm font-semibold uppercase text-primary">Category</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{categoryName}</h1>
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
                    <Link href={`/category/${slug}?page=${pagination.prevPage}`} className="join-item btn">
                      «
                    </Link>
                  )}
                  <button className="join-item btn" disabled>
                    Page {pagination.page} of {pagination.totalPages}
                  </button>
                  {pagination.nextPage && (
                    <Link href={`/category/${slug}?page=${pagination.nextPage}`} className="join-item btn">
                      »
                    </Link>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-semibold">No posts found in this category.</h2>
              <Link href="/" className="btn btn-primary mt-4">Back to Home</Link>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error(`Failed to fetch posts for category ${slug}:`, error);
    // The API might throw an error for a non-existent category, leading to a 500.
    // A 404 is more appropriate.
    notFound();
  }
}

import { getSSRBlazeBlogClient } from '@/lib/blazeblog';
import { notFound } from 'next/navigation';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';

type Props = {
  params: { slug: string };
  searchParams?: { page?: string };
};

// Generate metadata for the category page
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const currentPage = Number(searchParams?.page) || 1;
  const client = await getSSRBlazeBlogClient();
  const result = await client.getPosts({ category: params.slug, page: currentPage, limit: 9 });

  if (!result.seo) {
    return {
      title: "Category",
    };
  }

  return {
    title: result.seo.meta.title,
    description: result.seo.meta.description,
    alternates: {
        canonical: result.seo.meta.canonicalUrl,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = params;
  const currentPage = Number(searchParams?.page) || 1;
  const client = await getSSRBlazeBlogClient();

  try {
    const { posts, pagination, seo, category } = await client.getPosts({ category: slug, page: currentPage, limit: 9 });

    if (!posts) {
      notFound();
    }

    const categoryName = category?.name || slug.replace(/-/g, ' ');

    return (
      <>
        {seo && seo.jsonLd.map((json, index) => (
            <script
                key={index}
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
            />
        ))}
        <div className="bg-base-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumbs items={seo?.breadcrumbs || []} />
            <div className="my-8">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight capitalize">{categoryName}</h1>
            </div>

            {posts.length > 0 ? (
              <>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

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
      </>
    );
  } catch (error) {
    console.error(`Failed to fetch posts for category ${slug}:`, error);
    notFound();
  }
}

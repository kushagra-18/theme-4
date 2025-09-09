import { getSSRBlazeBlogClient } from '@/lib/blazeblog';
import { notFound } from 'next/navigation';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';

type Props = {
  params: { slug: string };
  searchParams?: { page?: string };
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const currentPage = Number(searchParams?.page) || 1;
  const client = await getSSRBlazeBlogClient();
  
  try {
    const response = await client.makeRequest<any>(`/public/posts/author/${params.slug}?page=${currentPage}&limit=10`);

    if (!response.seo) {
      const authorName = params.slug.charAt(0).toUpperCase() + params.slug.slice(1).replace(/-/g, ' ');
      return {
        title: `Posts by ${authorName}`,
        description: `Browse all posts by ${authorName}.`,
      };
    }

    return {
      title: response.seo.meta.title,
      description: response.seo.meta.description,
      alternates: {
        canonical: response.seo.meta.canonicalUrl,
      },
    };
  } catch (error) {
    return {
      title: "Author",
    };
  }
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const { slug } = params;
  const currentPage = Number(searchParams?.page) || 1;
  const client = await getSSRBlazeBlogClient();

  // Check if authors page is enabled
  const siteConfig = await client.getSiteConfig();
  if (!siteConfig.featureFlags.enableAuthorsPage) {
    notFound();
  }

  try {
    const { posts, pagination, seo } = await client.getPostsByAuthor(slug, { page: currentPage, limit: 9 });

    // Format the author name from slug
    const authorName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

    return (
      <>
        {/* JSON-LD structured data from API */}
        {seo && seo.jsonLd && seo.jsonLd.map((data: any, index: number) => (
          <JsonLd key={index} data={data} />
        ))}
        
        <div className="bg-base-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumbs items={seo?.breadcrumbs || []} />
            <div className="my-8">
              <p className="text-sm font-semibold uppercase text-primary">Author</p>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight capitalize">{authorName}</h1>
            </div>

            {posts && posts.length > 0 ? (
              <>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post: any) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      authorLinkEnabled={siteConfig.featureFlags.enableAuthorsPage}
                    />
                  ))}
                </div>

                <div className="flex justify-center items-center mt-12">
                  <div className="join">
                    {pagination.prevPage && (
                      <Link href={`/author/${slug}?page=${pagination.prevPage}`} className="join-item btn">
                        «
                      </Link>
                    )}
                    <button className="join-item btn" disabled>
                      Page {pagination.page} of {pagination.totalPages}
                    </button>
                    {pagination.nextPage && (
                      <Link href={`/author/${slug}?page=${pagination.nextPage}`} className="join-item btn">
                        »
                      </Link>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-semibold">No posts found by this author.</h2>
                <Link href="/" className="btn btn-primary mt-4">Back to Home</Link>
              </div>
            )}
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error(`Failed to fetch posts for author ${slug}:`, error);
    notFound();
  }
}

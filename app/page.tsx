import { getSSRBlazeBlogClient, SiteConfig } from "@/lib/blazeblog";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import NewsletterForm from "@/components/NewsletterForm";

async function getPageData(currentPage: number) {
    const client = await getSSRBlazeBlogClient();
    // Fetch posts and config in parallel for efficiency
    const [postsResult, siteConfig] = await Promise.all([
        client.getPosts({ limit: 9, page: currentPage }),
        client.getSiteConfig()
    ]);
    return {
        posts: postsResult.posts,
        pagination: postsResult.pagination,
        siteConfig: siteConfig
    };
}

export default async function HomePage({ searchParams }: { searchParams?: { page?: string } }) {
  const currentPage = Number(searchParams?.page) || 1;

  try {
    const { posts, pagination, siteConfig } = await getPageData(currentPage);

    if (!posts || posts.length === 0) {
      return (
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-semibold">No posts found.</h2>
          <p>Check back later for new content!</p>
        </div>
      );
    }

    return (
      <div className="bg-base-200" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/lined-paper.png)'}}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16 bg-base-100/50 backdrop-blur-sm p-8 rounded-lg">
            <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight">{siteConfig.siteConfig.h1}</h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl">
              {siteConfig.siteConfig.homeMetaDescription}
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-12">
            <div className="join">
              {pagination.prevPage && (
                <Link href={`/?page=${pagination.prevPage}`} className="join-item btn">
                  «
                </Link>
              )}
              <button className="join-item btn" disabled>
                Page {pagination.page} of {pagination.totalPages}
              </button>
              {pagination.nextPage && (
                <Link href={`/?page=${pagination.nextPage}`} className="join-item btn">
                  »
                </Link>
              )}
            </div>
          </div>
        </div>

        {siteConfig.featureFlags.enableNewsletters && (
            <div className="py-12">
                <NewsletterForm />
            </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold text-error">Error: Could not fetch posts.</h2>
        <p className="mt-2 text-base-content/70">
          The blog content could not be loaded at this time. Please try again later.
        </p>
      </div>
    );
  }
}

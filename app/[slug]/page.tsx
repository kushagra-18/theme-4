import { getSSRBlazeBlogClient, SiteConfig } from '@/lib/blazeblog';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import CommentSection from '@/components/CommentSection';
import Breadcrumbs from '@/components/Breadcrumbs';

type Props = {
  params: { slug: string };
};

// Generate metadata for the page using the new SEO object
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const client = await getSSRBlazeBlogClient();
  const result = await client.getPost(params.slug);

  if (!result || !result.seo) {
    return {
      title: 'Post not found',
    };
  }

  const { seo, data: post } = result;

  return {
    title: seo.meta.title,
    description: seo.meta.description,
    alternates: {
        canonical: seo.meta.canonicalUrl,
    },
    openGraph: {
      title: seo.meta.title,
      description: seo.meta.description,
      url: seo.meta.canonicalUrl,
      images: post.featuredImage ? [post.featuredImage] : [],
      type: 'article',
      publishedTime: post.publishedAt || post.createdAt,
      authors: [post.user.username],
    },
  };
}

export default async function PostPage({ params }: Props) {
    const { slug } = params;
    const client = await getSSRBlazeBlogClient();

    // Fetch post data and site config in parallel
    const [result, siteConfig] = await Promise.all([
        client.getPost(slug),
        client.getSiteConfig() // Still needed for feature flags
    ]);

    if (!result) {
        notFound();
    }

    const { data: post, seo } = result;
    const relatedPosts = post.relatedPosts || [];

    return (
        <>
            {/* Render JSON-LD from the API */}
            {seo.jsonLd.map((json, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
                />
            ))}
            <article className="bg-base-100 py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto">
                        <Breadcrumbs items={seo.breadcrumbs} />
                        <header className="mt-4 mb-8">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight my-4">{post.title}</h1>
                            <div className="flex items-center space-x-2 text-base-content/70">
                                <span>By {post.user.username}</span>
                                <span>&middot;</span>
                                <time dateTime={post.publishedAt || post.createdAt}>
                                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </time>
                                <span>&middot;</span>
                                <span>{post.readingTime} min read</span>
                            </div>
                        </header>

                        {post.featuredImage && (
                            <figure className="relative h-96 rounded-lg overflow-hidden mb-8">
                                <Image
                                    src={post.featuredImage}
                                    alt={post.title}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    priority
                                />
                            </figure>
                        )}

                        {post.content && (
                            <div
                                className="prose lg:prose-xl max-w-none"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                        )}

                        {post.tags && post.tags.length > 0 && (
                            <div className="mt-8 flex flex-wrap items-center gap-2">
                                <span className="font-semibold">Tags:</span>
                                {post.tags.map(tag => (
                                    <Link key={tag.id} href={`/tag/${tag.slug}`} className="badge badge-outline hover:bg-primary hover:text-primary-content">
                                        {tag.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {siteConfig?.featureFlags.enableComments && <CommentSection postId={post.id} postSlug={post.slug} />}
                    </div>
                </div>

                {relatedPosts.length > 0 && (
                    <div className="mt-16">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-3xl font-bold text-center mb-8">Related Posts</h2>
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                                {relatedPosts.map(relatedPostItem => (
                                    <PostCard key={relatedPostItem.id} post={relatedPostItem.relatedPost} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </article>
        </>
    );
}

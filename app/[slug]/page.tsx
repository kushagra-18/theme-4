import { getSSRBlazeBlogClient } from '@/lib/blazeblog';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PostCard from '@/components/PostCard';

type Props = {
  params: { slug: string };
};

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const client = await getSSRBlazeBlogClient();
  const result = await client.getPost(params.slug);
  const post = result?.post;

  if (!post) {
    return {
      title: 'Post not found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
      type: 'article',
      publishedTime: post.publishedAt || post.createdAt,
      authors: [post.user.username],
    },
  };
}

import CommentSection from '@/components/CommentSection';

export default async function PostPage({ params }: Props) {
    const { slug } = params;
    const client = await getSSRBlazeBlogClient();

    // Fetch post and site config in parallel
    const [postResult, siteConfig] = await Promise.all([
        client.getPost(slug),
        client.getSiteConfig()
    ]);

    if (!postResult || !postResult.post) {
        notFound();
    }

    const { post } = postResult;

    // Fetch related posts separately
    const { posts: relatedPosts } = await client.getRelatedPosts({ slug });

    // Structured data for SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: post.featuredImage || undefined,
        author: {
            '@type': 'Person',
            name: post.user.username,
        },
        publisher: {
            '@type': 'Organization',
            name: siteConfig.siteConfig.h1,
            logo: {
                '@type': 'ImageObject',
                url: siteConfig.siteConfig.logoPath,
            },
        },
        datePublished: post.publishedAt || post.createdAt,
        dateModified: post.updatedAt || post.createdAt,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <article className="bg-base-100 py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto">
                        <header className="mb-8">
                            {post.category && (
                                <Link href={`/category/${post.category.slug}`} className="text-primary font-semibold text-sm uppercase hover:underline">
                                    {post.category.name}
                                </Link>
                            )}
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

                        {/* Render post content */}
                        {post.content && (
                            <div
                                className="prose lg:prose-xl max-w-none"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                        )}

                        {/* Tags */}
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

                        {siteConfig.featureFlags.enableComments && <CommentSection postId={post.id} postSlug={post.slug} />}
                    </div>
                </div>

                {/* Related Posts */}
                {relatedPosts && relatedPosts.length > 0 && (
                    <div className="mt-16">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-3xl font-bold text-center mb-8">Related Posts</h2>
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                                {relatedPosts.map(relatedPost => (
                                    <PostCard key={relatedPost.id} post={relatedPost} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </article>
        </>
    );
}

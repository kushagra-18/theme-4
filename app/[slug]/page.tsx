import { getSSRBlazeBlogClient, SiteConfig } from '@/lib/blazeblog';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ViewsTracker from '@/components/ViewsTracker';
import PostCard from '@/components/PostCard';
import CommentSection from '@/components/CommentSection';
import Breadcrumbs from '@/components/Breadcrumbs';
import NewsletterForm from '@/components/NewsletterForm';
import ShareButtons from '@/components/ShareButtons';
import JsonLd from '@/components/JsonLd';
import PostImagesGallery from '@/components/PostImagesGallery';
import PostImageBinder from '@/components/PostImageBinder';
import HeroImageClickable from '@/components/HeroImageClickable';
import LeadFormModal from '@/components/LeadFormModal';

type Props = {
  params: { slug: string };
  searchParams?: { preview?: string; token?: string };
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

export default async function PostPage({ params, searchParams }: Props) {
    const { slug } = params;
    
    const staticFileExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.js', '.xml', '.txt', '.json'];
    const systemRoutes = ['favicon.ico', 'robots.txt', 'sitemap.xml', 'rss.xml', 'manifest.json', 'sw.js', '_next'];
    
    if (systemRoutes.includes(slug) || staticFileExtensions.some(ext => slug.endsWith(ext))) {
        notFound();
    }
    
    const client = await getSSRBlazeBlogClient();

    // Fetch post data and site config in parallel
    const [result, siteConfig] = await Promise.all([
        client.getPost(slug),
        client.getSiteConfig()
    ]);

    if (!result) {
        notFound();
    }

    const { data: post, seo } = result;
    const relatedPosts = post.relatedPosts || [];

    // Extract images from content HTML and include featured image first if present
    const extractImages = (html?: string) => {
      if (!html) return [] as string[];
      const regex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
      const out: string[] = [];
      let match;
      while ((match = regex.exec(html)) !== null) {
        out.push(match[1]);
      }
      return Array.from(new Set(out));
    };
    const contentImages = extractImages(post.content);
    const galleryImages = Array.from(new Set([post.featuredImage, ...contentImages].filter(Boolean))) as string[];

    return (
        <>
            {seo.jsonLd.map((json, index) => (
                <JsonLd key={index} data={json} />
            ))}
            <ViewsTracker />
            
            <article className="bg-base-200 py-8">
                <div className="p-8 bg-base-100/80 backdrop-blur-sm rounded-lg">
                    <div className="max-w-3xl mx-auto">
                        <Breadcrumbs items={seo.breadcrumbs} />
                        <header className="mt-4 mb-8 text-center border-b-2 border-base-300 pb-8">
                            <h1 className="text-5xl font-serif font-bold tracking-tight my-4">{post.title}</h1>
                            <div className="flex items-center justify-center space-x-2 text-base-content/70">
                                {siteConfig?.featureFlags.enableAuthorsPage ? (
                                  <Link href={`/author/${post.user.username}`} className="hover:underline">
                                    By {post.user.username}
                                  </Link>
                                ) : (
                                  <span>By {post.user.username}</span>
                                )}
                                <span>&middot;</span>
                                <time dateTime={post.publishedAt || post.createdAt}>
                                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </time>
                        <span>&middot;</span>
                                <span>{post.readingTime} min read</span>
                            </div>
                            <div className="mt-4">
                                <ShareButtons post={post} />
                            </div>
                        </header>

                        {post.featuredImage && (
                          <HeroImageClickable
                            src={post.featuredImage}
                            alt={post.title}
                            priority
                            sizes="(max-width: 768px) 100vw, 800px"
                            unoptimized={post.featuredImage.includes('width=')}
                          />
                        )}

                        {/* Render post content with clickable images (opens gallery) */}
                        {post.content && (
                          <>
                            <PostImageBinder containerId="post-content" images={galleryImages} />
                            <div
                              id="post-content"
                              className="prose lg:prose-xl max-w-none"
                              dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                          </>
                        )}
                        {/* Hidden gallery component; opens on image click and shows thumbnails inside modal */}
                        {galleryImages.length > 0 && (
                          <PostImagesGallery images={galleryImages} />
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

                        {/* The main content div ends here */}
                    </div>
                </div>

                {/* Re-ordered sections below */}

                {relatedPosts.length > 0 && (
                    <div className="mt-16">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-3xl font-bold text-center mb-8">Related Posts</h2>
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                                {relatedPosts.map(relatedPostItem => (
                                    <PostCard
                                      key={relatedPostItem.id}
                                      post={relatedPostItem.relatedPost}
                                      authorLinkEnabled={siteConfig?.featureFlags.enableAuthorsPage}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto">
                        {siteConfig?.featureFlags.enableComments && <CommentSection postId={post.id} postSlug={post.slug} />}
                    </div>
                </div>

                {siteConfig?.featureFlags.enableNewsletters && (
                    <div className="my-16">
                        <NewsletterForm />
                    </div>
                )}
            </article>
            <LeadFormModal />
        </>
    );
}

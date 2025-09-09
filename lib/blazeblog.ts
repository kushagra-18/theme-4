import { config } from "@/config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";

interface ResizeOptions {
  width: number;
  height: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
}

export const resizeImageUrl = (url: string, options: ResizeOptions): string => {
  if (!url) {
    return "";
  }

  const params = new URLSearchParams();
  params.append('width', options.width.toString());
  params.append('height', options.height.toString());
  if (options.fit) {
    params.append('fit', options.fit);
  }
  if (options.format) {
    params.append('format', options.format);
  }

  // Check if the URL already has query parameters
  if (url.includes('?')) {
    return `${url}&${params.toString()}`;
  } else {
    return `${url}?${params.toString()}`;
  }
}

// Utility function for resizing images with different sizes for different use cases
export const getResizedImageUrl = (originalUrl: string, context: 'card' | 'hero' | 'thumbnail' | 'full'): string => {
  if (!originalUrl) return '';

  const resizeConfigs = {
    card: { width: 400, height: 300, fit: 'cover' as const, format: 'webp' as const },
    hero: { width: 1200, height: 600, fit: 'cover' as const, format: 'webp' as const },
    thumbnail: { width: 150, height: 150, fit: 'cover' as const, format: 'webp' as const },
    full: { width: 800, height: 600, fit: 'cover' as const, format: 'webp' as const }
  };

  return resizeImageUrl(originalUrl, resizeConfigs[context]);
};

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  featuredImage: string | null;
  minsRead: number;
  readingTime: number;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  user: {
    id: number;
    username: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  relatedPosts?: Array<{
    id: number;
    relatedPostId: number;
    sortOrder: number;
    relatedPost: Post;
  }>;
  // Properties added by transformPost
  description?: string;
  image?: string;
  author?: any;
}

export interface Comment {
  id: number;
  authorName: string;
  authorEmail: string;
  authorWebsite?: string;
  content: string;
  createdAt: string;
  parentCommentId?: number;
  replies?: Comment[];
  status?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  postCount: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  color?: string;
  postCount?: number;
  size?: number;
  weight?: number;
}

export interface Newsletter {
  id: number;
  customerId: number;
  email: string;
  name?: string;
  company?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscribeRequest {
  email: string;
  name?: string;
  company?: string;
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PaginationMeta {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
}

export interface GetPostsResult {
  posts: Post[];
  meta: {
    total: number;
    limit: number;
  };
  pagination: PaginationMeta;
  // The following are specific to category/tag pages and might not always be present
  seo?: SeoData;
  category?: Category;
}

export interface SeoData {
  meta: {
    title: string;
    description: string;
    canonicalUrl: string;
  };
  breadcrumbs: Array<{
    name: string;
    url: string;
    position: number;
  }>;
  jsonLd: any[]; // Can be more specific if needed
}

export interface GetPostResult {
  data: Post;
  seo: SeoData;
}

export interface GetRelatedPostsResult {
  posts: Post[];
}

interface AnalyticsProvider {
  enabled: boolean;
  trackingId: string;
  script?: string; // Optional - fallback for custom implementations
}

interface NavigationLink {
  label: string;
  url: string;
  children?: NavigationLink[];
}

export interface SiteConfig {
  featureFlags: {
    allowImageResize?: boolean;
    enableTagsPage: boolean;
    maintenanceMode: boolean;
    enableAuthorsPage: boolean;
    autoApproveComments: boolean;
    enableCommentsReply: boolean;
    enableCategoriesPage: boolean;
    enableComments: boolean;
    enableNewsletters: boolean;
  };
  siteConfig: {
    h1: string;
    logoPath: string;
    seoTitle: string;
    aboutUsContent: string;
    homeMetaDescription: string;
  };
  analytics: {
    googleAnalytics: AnalyticsProvider;
    microsoftClarity: AnalyticsProvider;
    hotjar: AnalyticsProvider;
    mixpanel: AnalyticsProvider;
    segment: AnalyticsProvider;
    plausible: AnalyticsProvider;
    fathom: AnalyticsProvider;
    adobe: AnalyticsProvider;
  };
  analyticsScripts: {
    scripts: string[];
  };
  theme?: {
    themeId: number;
    colorPalette: string;
    fontFamily?: string;
  };
  headerNavigationLinks?: NavigationLink[];
  footerNavigationLinks?: NavigationLink[];
}

class BlazeBlogClient {
  private baseUrl: string;
  private tenantSlug: string;
  private domain?: string;

  constructor(baseUrl: string, tenantSlug: string, domain?: string) {
    this.baseUrl = baseUrl;
    this.tenantSlug = tenantSlug;
    this.domain = domain;
  }

  async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let domain = this.domain || (typeof window !== 'undefined' ?
      `${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}` :
      '');

    if (process.env.NODE_ENV === 'development') {
      domain = 'localhost:3000';
    }


    const headers = {
      'X-domain': domain,
      'Content-Type': 'application/json',
      'X-public-site': 'true',
      ...options?.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorData;
      try {
        // Check if the response might be XML/text first
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('xml') || contentType.includes('text')) {
          errorData = await response.text();
        } else {
          errorData = await response.json();
        }
      } catch {
        errorData = await response.text();
      }

      const error = new Error();
      error.name = 'APIError';
      // Attach status for consumers to branch on (e.g., 404 handling)
      (error as any).status = response.status;

      if (typeof errorData === 'object' && errorData !== null) {
        Object.assign(error, errorData);
        error.message = errorData.message || `API Error: ${response.status} - ${response.statusText}`;
      } else {
        error.message = `API Error: ${response.status} - ${response.statusText}. Body: ${errorData}`;
      }

      throw error;
    }

    // Check if the response is XML/text (for RSS/Sitemap endpoints)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('xml') || contentType.includes('text') || endpoint.includes('/rss') || endpoint.includes('/sitemap')) {
      const textData = await response.text();
      return textData as T;
    }

    const data = await response.json();
    return data;
  }

  // Lead Forms: Get active public form if any; returns null on 404
  async getActivePublicLeadForm(): Promise<any | null> {
    try {
      const response = await this.makeRequest<ApiResponse<any>>(`/public/forms`);
      return response?.data ?? null;
    } catch (err: any) {
      if (err && (err.status === 404 || /\b404\b/.test(String(err.message || '')))) {
        return null;
      }
      console.error('Error fetching public lead form:', err);
      return null;
    }
  }

  async submitPublicLeadForm(
    formId: string,
    values: Record<string, any>,
    meta?: { timeTaken?: number; userAgent?: string }
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>(`/public/forms/${formId}`, {
      method: 'POST',
      body: JSON.stringify({ id: formId, data: values, timeTaken: meta?.timeTaken, userAgent: meta?.userAgent }),
    });
  }

  async getPreviewPost(token: string): Promise<GetPostResult | null> {
    try {
      const response = await this.makeRequest<GetPostResult>(`/public/posts/preview?token=${token}`);

      if (response.data) {
        response.data = this.transformPost(response.data) as Post;
      }

      return response;
    } catch (error) {
      console.error(`Error fetching preview post with token ${token}:`, error);
      return null;
    }
  }

  // Fetch posts by author with proper transformation and pagination
  async getPostsByAuthor(
    username: string,
    { page = 1, limit = 9 }: { page?: number; limit?: number } = {}
  ): Promise<{ posts: Post[]; pagination: PaginationMeta; seo?: SeoData; author?: any }> {
    const [response, siteConfig] = await Promise.all([
      this.makeRequest<any>(`/public/posts/author/${username}?page=${page}&limit=${limit}`),
      this.getSiteConfig(),
    ]);

    const rawPosts = (response?.data?.posts ?? response?.posts ?? response?.data ?? []) as any[];
    let posts = rawPosts.map((p: any) => this.transformPost(p));

    if (siteConfig?.featureFlags.allowImageResize) {
      posts = posts.map((post: Post) => this.applyImageResize(post, siteConfig));
    }

    const meta = response?.meta || {
      total: posts.length,
      limit,
      page,
      totalPages: Math.max(1, Math.ceil(posts.length / limit)),
    };

    const pagination: PaginationMeta = {
      total: meta.total,
      limit: meta.limit,
      page: meta.page,
      totalPages: meta.totalPages,
      nextPage: meta.page < meta.totalPages ? meta.page + 1 : null,
      prevPage: meta.page > 1 ? meta.page - 1 : null,
    };

    return {
      posts,
      pagination,
      seo: response?.seo,
      author: response?.data?.author,
    };
  }

  async getPosts({
    limit = 10,
    page = 1,
    tags,
    category
  }: {
    limit?: number;
    page?: number;
    tags?: string[];
    category?: string;
  } = {}): Promise<GetPostsResult> {
    let endpoint = `/public/posts/home?limit=${limit}&page=${page}`;
    let isCategory = false;

    if (category) {
      endpoint = `/public/posts/category/${category}?page=${page}&limit=${limit}`;
      isCategory = true;
    } else if (tags && tags.length > 0) {
      endpoint = `/public/posts/tag/${tags[0]}?page=${page}&limit=${limit}`;
    }

    const [response, siteConfig] = await Promise.all([
      this.makeRequest<any>(endpoint),
      this.getSiteConfig()
    ]);

    if (isCategory) {
      const categoryData = response.data || {};
      let posts = (categoryData.posts || []).map((p: any) => this.transformPost(p));
      
      if (siteConfig.featureFlags.allowImageResize) {
        posts = posts.map((post: Post) => this.applyImageResize(post, siteConfig));
      }
      
      const meta = response.meta || { total: posts.length, limit };
      const totalPages = Math.ceil(meta.total / limit);

      return {
        posts,
        meta,
        pagination: {
          total: meta.total,
          limit,
          page,
          totalPages,
          nextPage: page < totalPages ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null,
        },
        seo: response.seo,
        category: categoryData.category,
      };
    }

    // Handle home and tag pages (assuming simpler structure)
    let posts = (response.data?.posts || response.data || []).map((p: any) => this.transformPost(p));
    
    // Apply image resizing if feature flag is enabled
    if (siteConfig.featureFlags.allowImageResize) {
      posts = posts.map((post: Post) => this.applyImageResize(post, siteConfig));
    }
    
    const meta = response.meta || { total: posts.length, limit };
    const totalPages = Math.ceil(meta.total / limit);

    return {
      posts,
      meta,
      pagination: {
        total: meta.total,
        limit,
        page,
        totalPages,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    };
  }

  async getPost(slug: string, includeRelated = true): Promise<GetPostResult | null> {
    try {
      // The new API response includes everything, so we request the full object
      const [response, siteConfig] = await Promise.all([
        this.makeRequest<GetPostResult>(`/public/posts/${slug}?includeRelated=${includeRelated}`),
        this.getSiteConfig()
      ]);

      // The transformPost function expects a specific structure, let's adapt
      // or apply it to the nested post data.
      if (response.data) {
        response.data = this.transformPost(response.data) as Post;
        // Apply image resizing if feature flag is enabled
        response.data = this.applyImageResize(response.data, siteConfig);
        
        if (response.data.relatedPosts && response.data.relatedPosts.length > 0) {
          response.data.relatedPosts = response.data.relatedPosts.map(relatedItem => ({
            ...relatedItem,
            relatedPost: this.applyImageResize(
              this.transformPost(relatedItem.relatedPost), 
              siteConfig
            ) as Post
          }));
        }
      }

      return response;
    } catch (error) {
      console.error(`Error fetching post ${slug}:`, error);
      return null;
    }
  }

  async getRelatedPosts({ slug, limit = 3 }: { slug: string; limit?: number }): Promise<GetRelatedPostsResult> {
    try {
      const response = await this.makeRequest<any>(`/public/posts/${slug}?includeRelated=true`);
      const data = response.data || response;
      const relatedPosts = data.relatedPosts || [];

      const posts = relatedPosts
        .map((item: any) => item.relatedPost)
        .filter((post: any) => post && post.id && post.title)
        .slice(0, limit)
        .map((p: any) => this.transformPost(p));

      return { posts };
    } catch (error) {
      console.error('Error fetching related posts:', error);
      return { posts: [] };
    }
  }

  async getTags(): Promise<{ tags: Tag[] }> {
    const response = await this.makeRequest<any>('/public/tags?popular=true', {
      cache: 'no-store',
    });
    return {
      tags: response.data || response,
    };
  }

  async getCategories(): Promise<{ categories: Category[] }> {
    const response = await this.makeRequest<any>('/public/categories', {
      cache: 'no-store',
    });

    const data = response.data || response;
    const categories = Array.isArray(data) ? data : [];

    return {
      categories,
    };
  }

  async getComments(postSlug: string, page = 1, limit = 5): Promise<{ comments: Comment[]; meta: any; config: any }> {
    try {
      const postResult = await this.getPost(postSlug, false);
      if (!postResult?.data) {
        throw new Error('Post not found');
      }

      const response = await this.makeRequest<any>(
        `/public/posts/${postResult.data.id}/comments?limit=${limit}&page=${page}`, {
        cache: 'no-store',
      }
      );

      return {
        comments: response.data || [],
        meta: response.meta || { total: 0, page, limit, totalPages: 1 },
        config: {
          enabled: true,
          allowUrls: true,
          allowNested: true,
          signUpMessage: null,
        },
      };
    } catch (error) {
      return {
        comments: [],
        meta: { total: 0, page: 1, limit, totalPages: 1 },
        config: {
          enabled: true,
          allowUrls: true,
          allowNested: true,
          signUpMessage: null
        }
      };
    }
  }

  async createComment(commentData: {
    postSlug: string;
    authorName: string;
    authorEmail: string;
    authorWebsite?: string;
    content: string;
    parentCommentId?: number;
  }): Promise<ApiResponse<Comment>> {
    const postResult = await this.getPost(commentData.postSlug, false);
    if (!postResult?.data) {
      throw new Error('Post not found');
    }
    const { postSlug, ...payload } = commentData;
    const data = await this.makeRequest<ApiResponse<Comment>>(`/public/comments`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, postId: postResult.data.id }),
    });
    return data;
  }

  async createCommentByPostId(commentData: {
    postId: number;
    authorName: string;
    authorEmail: string;
    authorWebsite?: string;
    content: string;
    parentCommentId?: number;
  }): Promise<ApiResponse<Comment>> {
    const data = await this.makeRequest<ApiResponse<Comment>>('/public/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
      cache: 'no-store',
    });

    return data;
  }

  async searchPosts(query: string): Promise<{ posts: Post[] }> {
    if (!query.trim()) {
      return { posts: [] };
    }

    const [response, siteConfig] = await Promise.all([
      this.makeRequest<any>(`/public/search?q=${encodeURIComponent(query)}`),
      this.getSiteConfig()
    ]);

    const postsData = response.data?.posts?.posts || [];
    let posts = postsData.map((p: any) => this.transformPost(p));
    
    // Apply image resizing if feature flag is enabled
    if (siteConfig.featureFlags.allowImageResize) {
      posts = posts.map((post: Post) => this.applyImageResize(post, siteConfig));
    }

    return { posts };
  }

  async getSiteConfig(): Promise<SiteConfig> {
    const response = await this.makeRequest<any>('/public/site/configs', {
      cache: 'no-store',
    });
    if (response && response.data) {
      return response.data;
    }
    return response;
  }

  async subscribeToNewsletter(data: SubscribeRequest): Promise<ApiResponse<Newsletter>> {
    const response = await this.makeRequest<ApiResponse<Newsletter>>('/public/newsletters/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
      cache: 'no-store',
    });

    return response;
  }

  private transformPost(data: any): Post {
    const post = data.data || data;

    const slug = post.slug || (post.title ? post.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') : `post-${post.id}`);

    const transformImageUrl = (url: string | null | undefined): string | null => {
      if (!url || typeof url !== 'string') return null;

      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

      return `https://static.blazeblog.co/blazeblog${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const featuredImage = transformImageUrl(post.featuredImage);

    return {
      id: post.id,
      title: post.title,
      slug,
      excerpt: post.excerpt,
      content: post.content,
      featuredImage,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      publishedAt: post.publishedAt || post.createdAt,
      minsRead: post.minsRead || 5,
      readingTime: post.readingTime || post.minsRead || 5,
      user: post.user,
      category: post.category,
      tags: post.tags || [],
      relatedPosts: post.relatedPosts || [], // Pass related posts through
      description: post.excerpt,
      image: featuredImage || undefined,
      author: {
        name: post.user?.username,
        image: null,
      },
    };
  }

  private applyImageResize(post: Post, siteConfig?: SiteConfig): Post {
    if (!siteConfig?.featureFlags.allowImageResize) {
      return post;
    }

    if (post.featuredImage) {
      post.featuredImage = resizeImageUrl(post.featuredImage, {
        width: 800,
        height: 600,
        fit: 'cover',
        format: 'webp'
      });
    }

    if (post.image) {
      post.image = resizeImageUrl(post.image, {
        width: 800,
        height: 600,
        fit: 'cover',
        format: 'webp'
      });
    }

    return post;
  }
}

export const blazeblog = new BlazeBlogClient(API_BASE_URL, config.blog.tenantSlug, 'localhost:3000');

export function createBlazeBlogClient(domain?: string) {
  return new BlazeBlogClient(API_BASE_URL, config.blog.tenantSlug, domain);
}

export function getBlazeBlogClient(req?: { headers: { host?: string } }) {

  const domain = req?.headers?.host || (typeof window !== 'undefined' ?
    `${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}` :
    undefined);
  return new BlazeBlogClient(API_BASE_URL, config.blog.tenantSlug, domain);
}

export async function getSSRBlazeBlogClient() {
  if (typeof window !== 'undefined') {
    return blazeblog;
  }

  try {
    const { headers } = await import('next/headers');
    const headersList = headers();
    const host = headersList.get('host');
    const nginxDomain = headersList.get('x-nginx-domain');

    return new BlazeBlogClient(API_BASE_URL, config.blog.tenantSlug, host || nginxDomain || undefined);
  } catch (error) {
    return blazeblog;
  }
}

import { config } from "@/config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";

// --- INTERFACES ---

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  featuredImage: string | null;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  readingTime: number;
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

export interface PaginationMeta {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

export interface GetPostsResult {
  posts: Post[];
  meta: {
    total: number;
    limit: number;
  };
  pagination: PaginationMeta;
}

export interface GetPostResult {
  post: Post;
}

export interface GetRelatedPostsResult {
  posts: Post[];
}

interface AnalyticsProvider {
  enabled: boolean;
  trackingId: string;
  script?: string; // Optional - fallback for custom implementations
}

export interface SiteConfig {
  featureFlags: {
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
    color: string;
  };
}

// --- BLAZEBLOG CLIENT ---

class BlazeBlogClient {
  private baseUrl: string;
  private tenantSlug: string;
  private domain?: string;

  constructor(baseUrl: string, tenantSlug: string, domain?: string) {
    this.baseUrl = baseUrl;
    this.tenantSlug = tenantSlug;
    this.domain = domain;
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-domain': this.domain || '',
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
      const errorBody = await response.text();
      throw new Error(`API Error: ${response.status} - ${response.statusText}. Body: ${errorBody}`);
    }

    const data = await response.json();
    return data;
  }

  async getPosts({ limit = 10, page = 1, tags, category }: { limit?: number; page?: number; tags?: string[]; category?: string; } = {}): Promise<GetPostsResult> {
    let endpoint = `/public/posts?page=${page}&limit=${limit}`;
    if (category) {
      endpoint = `/public/posts/category/${category}?page=${page}&limit=${limit}`;
    } else if (tags && tags.length > 0) {
      endpoint = `/public/posts/tag/${tags[0]}?page=${page}&limit=${limit}`;
    }

    const response = await this.makeRequest<any>(endpoint);

    let posts: any[] = [];
    let meta: { total: number; limit: number } = { total: 0, limit };

    if (category) {
        const categoryData = response.data || response;
        posts = categoryData.posts || [];
        meta = response.meta || { total: posts.length, limit };
    } else {
        const data = response.data || response;
        posts = Array.isArray(data) ? data : (data.posts || []);
        meta = response.meta || { total: posts.length, limit };
    }

    const totalPages = Math.ceil(meta.total / limit);
    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    return {
      posts: posts.map(this.transformPost),
      meta,
      pagination: {
        total: meta.total,
        limit,
        page,
        totalPages,
        nextPage,
        prevPage,
      },
    };
  }

  async getPost(slug: string, includeRelated = true): Promise<GetPostResult | null> {
    try {
      const endpoint = `/public/posts/${slug}${includeRelated ? '?include=related' : ''}`;
      const response = await this.makeRequest<any>(endpoint);
      const data = response.data || response;
      const post = this.transformPost(data);

      return {
        post: {
          ...post,
          relatedPosts: data.relatedPosts || [],
        },
      };
    } catch (error) {
      console.error(`Error fetching post ${slug}:`, error);
      return null;
    }
  }

  async getRelatedPosts({ slug, limit = 3 }: { slug: string; limit?: number }): Promise<GetRelatedPostsResult> {
    try {
        const response = await this.makeRequest<any>(`/public/posts/${slug}/related`);
        const relatedPosts = response.data || response;
        const posts = relatedPosts
            .map((item: any) => item.relatedPost)
            .filter((post: any) => post && post.id && post.title)
            .slice(0, limit)
            .map(this.transformPost);

        return { posts };
    } catch (error) {
        console.error('Error fetching related posts:', error);
        return { posts: [] };
    }
  }

  async getTags(): Promise<{ tags: Tag[] }> {
      const response = await this.makeRequest<{data: Tag[]}>('/public/tags?popular=true');
      return { tags: response.data };
  }

  async getCategories(): Promise<{ categories: Category[] }> {
    const response = await this.makeRequest<any>('/public/categories');
    const data = response.data || response;
    const categories = Array.isArray(data) ? data : [];
    return { categories };
  }

  async getComments(postSlug: string, page = 1, limit = 5): Promise<{ comments: Comment[]; meta: any; config: any }> {
    try {
      const postResult = await this.getPost(postSlug, false);
      if (!postResult?.post) {
        throw new Error('Post not found');
      }
      const response = await this.makeRequest<any>(`/public/posts/${postResult.post.id}/comments?page=${page}&limit=${limit}`);
      return {
        comments: response.data || [],
        meta: response.meta || { total: 0, page, limit, totalPages: 1 },
        config: { enabled: true, allowUrls: true, allowNested: true, signUpMessage: null },
      };
    } catch (error) {
      return { comments: [], meta: { total: 0, page: 1, limit, totalPages: 1 }, config: { enabled: true, allowUrls: true, allowNested: true, signUpMessage: null } };
    }
  }

  async createComment(commentData: { postSlug: string; authorName: string; authorEmail: string; authorWebsite?: string; content: string; parentCommentId?: number; }): Promise<ApiResponse<Comment>> {
    const postResult = await this.getPost(commentData.postSlug, false);
    if (!postResult?.post) {
        throw new Error('Post not found');
    }
    const { postSlug, ...payload } = commentData;
    const data = await this.makeRequest<ApiResponse<Comment>>(`/public/posts/${postResult.post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data;
  }

  async searchPosts(query: string): Promise<{ posts: Post[]; categories: Category[]; tags: Tag[] }> {
    if (!query.trim()) {
      return { posts: [], categories: [], tags: [] };
    }
    const response = await this.makeRequest<any>(`/public/search?q=${encodeURIComponent(query)}`);
    const data = response.data || response;
    return {
      posts: (data.posts?.posts || []).map(this.transformPost),
      categories: data.categories || [],
      tags: data.tags || [],
    };
  }

  async getSiteConfig(): Promise<SiteConfig> {
    const response = await this.makeRequest<any>('/public/site-config');
    // Handle cases where the config might be nested inside a 'data' property
    if (response && response.data && response.data.featureFlags) {
      return response.data;
    }
    return response;
  }

  async subscribeToNewsletter(data: SubscribeRequest): Promise<ApiResponse<Newsletter>> {
    const response = await this.makeRequest<ApiResponse<Newsletter>>('/public/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response;
  }

  private transformPost(data: any): Post {
    const post = data.data || data;
    const slug = post.slug || (post.title ? post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : `post-${post.id}`);

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
      readingTime: post.readingTime,
      user: post.user,
      category: post.category,
      tags: post.tags || [],
      description: post.excerpt,
      image: featuredImage || undefined,
      author: {
        name: post.user?.username,
        image: null,
      },
    };
  }
}

// --- CLIENT INSTANCES & FACTORIES ---

export const blazeblog = new BlazeBlogClient(API_BASE_URL, config.blog.tenantSlug, 'localhost:3000');

export function createBlazeBlogClient(domain?: string) {
  return new BlazeBlogClient(API_BASE_URL, config.blog.tenantSlug, domain);
}

export function getBlazeBlogClient(req?: { headers: { host?: string } }) {
  const domain = req?.headers?.host || (typeof window !== 'undefined' ? `${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}` : undefined);
  return new BlazeBlogClient(API_BASE_URL, config.blog.tenantSlug, domain);
}

export async function getSSRBlazeBlogClient() {
  if (typeof window !== 'undefined') {
    return blazeblog;
  }

  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const host = headersList.get('host');
    const nginxDomain = headersList.get('x-nginx-domain');
    return new BlazeBlogClient(API_BASE_URL, config.blog.tenantSlug, host || nginxDomain || undefined);
  } catch {
    return blazeblog;
  }
}

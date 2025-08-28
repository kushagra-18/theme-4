import { config } from "@/config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";

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
    colorPalette: string;
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

    const headers = {
      'X-domain': "localhost:3000", // Use localhost for local dev to avoid CORS issues
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
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      const error = new Error();
      error.name = 'APIError';

      if (typeof errorData === 'object' && errorData !== null) {
        Object.assign(error, errorData);
        error.message = errorData.message || `API Error: ${response.status} - ${response.statusText}`;
      } else {
        error.message = `API Error: ${response.status} - ${response.statusText}. Body: ${errorData}`;
      }

      throw error;
    }

    const data = await response.json();
    return data;
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

    const response = await this.makeRequest<any>(endpoint);

    if (isCategory) {
      // Handle the new, rich category response
      const categoryData = response.data || {};
      const posts = (categoryData.posts || []).map((p: any) => this.transformPost(p));
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
    const posts = (response.data?.posts || response.data || []).map((p: any) => this.transformPost(p));
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
      const response = await this.makeRequest<GetPostResult>(`/public/posts/${slug}?includeRelated=${includeRelated}`);

      // The transformPost function expects a specific structure, let's adapt
      // or apply it to the nested post data.
      if (response.data) {
        response.data = this.transformPost(response.data) as Post;
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

    const response = await this.makeRequest<any>(`/public/search?q=${encodeURIComponent(query)}`);

    const postsData = response.data?.posts?.posts || [];

    return {
      posts: postsData.map((p: any) => this.transformPost(p)),
    };
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
    // The raw post data might be nested or not
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
  } catch {
    return blazeblog;
  }
}

import { getSSRBlazeBlogClient } from '@/lib/blazeblog';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    try {
      const client = await getSSRBlazeBlogClient();
      
      const response = await client.makeRequest<{ sitemapUrl?: string; sitemap?: string }>('/public/site/sitemap');

      let sitemapContent: string;

      if (typeof response === 'string') {
        sitemapContent = response;
      } else if (response.sitemap) {
        sitemapContent = response.sitemap;
      } else if (response.sitemapUrl) {
        const sitemapResponse = await fetch(response.sitemapUrl);
        sitemapContent = await sitemapResponse.text();
      } else {
        throw new Error('No sitemap content or URL found in response');
      }

      return new NextResponse(sitemapContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    } catch (apiError) {
      console.warn('API sitemap failed, trying direct XML fetch:', apiError);
      
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1"}/public/site/sitemap`;
      
      let domain = typeof window !== 'undefined' ?
        `${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}` :
        '';

      if (process.env.NODE_ENV === 'development') {
        domain = 'localhost:3000';
      }

      const response = await fetch(url, {
        headers: {
          'X-domain': domain,
          'X-public-site': 'true',
          'Accept': 'application/xml, text/xml',
        },
      });

      if (!response.ok) {
        throw new Error(`Sitemap API Error: ${response.status} - ${response.statusText}`);
      }

      const xmlContent = await response.text();
      
      return new NextResponse(xmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    
    // Return a basic sitemap with just the homepage
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new NextResponse(basicSitemap, {
      status: 500,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  }
}

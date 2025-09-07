import { NextResponse, NextRequest } from 'next/server';
import { getSSRBlazeBlogClient } from '@/lib/blazeblog';

export async function GET(request: NextRequest) {
    try {
        const client = await getSSRBlazeBlogClient();
        
        const rssEndpoints = ['/public/site/rss', '/public/rss', '/public/feed'];
        let rssResponse = null;
        let lastError = null;
        
        for (const endpoint of rssEndpoints) {
            try {
                rssResponse = await client.makeRequest<string>(endpoint, {
                    headers: {
                        'Accept': 'application/rss+xml, application/xml, text/xml',
                    },
                });
                if (rssResponse) break;
            } catch (error) {
                lastError = error;
                if (process.env.NODE_ENV === 'development') {
                    console.log(`RSS endpoint ${endpoint} failed:`, error);
                }
                continue;
            }
        }

        // If we got a response, return it
        if (rssResponse) {
            return new NextResponse(rssResponse, {
                status: 200,
                headers: {
                    'Content-Type': 'application/rss+xml; charset=utf-8',
                    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                },
            });
        }

        throw lastError || new Error('No RSS content received');
    } catch (error) {
        console.error('Error fetching RSS feed:', error);

        // Fallback: Generate a basic RSS feed from recent posts
        try {
            const client = await getSSRBlazeBlogClient();
            const [postsResult, siteConfig] = await Promise.all([
                client.getPosts({ limit: 20, page: 1 }),
                client.getSiteConfig()
            ]);

            const baseUrl = process.env.NODE_ENV === 'development' 
                ? 'http://localhost:3000' 
                : `https://${request.headers.get('host')}`;

            const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title><![CDATA[${siteConfig.siteConfig.h1}]]></title>
        <description><![CDATA[${siteConfig.siteConfig.homeMetaDescription}]]></description>
        <link>${baseUrl}</link>
        <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
        <language>en-us</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        ${postsResult.posts.map(post => `
        <item>
            <title><![CDATA[${post.title}]]></title>
            <description><![CDATA[${post.excerpt || ''}]]></description>
            <link>${baseUrl}/${post.slug}</link>
            <guid isPermaLink="true">${baseUrl}/${post.slug}</guid>
            <pubDate>${new Date(post.publishedAt || post.createdAt).toUTCString()}</pubDate>
            <author><![CDATA[${post.user.username}]]></author>
            ${post.category ? `<category><![CDATA[${post.category.name}]]></category>` : ''}
        </item>`).join('')}
    </channel>
</rss>`;

            return new NextResponse(rssXml, {
                status: 200,
                headers: {
                    'Content-Type': 'application/rss+xml; charset=utf-8',
                    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                },
            });
        } catch (fallbackError) {
            console.error('Error generating fallback RSS feed:', fallbackError);
            
            const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>RSS Feed Error</title>
        <description>Unable to generate RSS feed at this time</description>
        <link>/</link>
    </channel>
</rss>`;

            return new NextResponse(errorXml, {
                status: 500,
                headers: {
                    'Content-Type': 'application/rss+xml; charset=utf-8',
                },
            });
        }
    }
}

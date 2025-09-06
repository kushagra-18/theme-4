import { getSSRBlazeBlogClient } from '@/lib/blazeblog';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const client = await getSSRBlazeBlogClient();

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1"}/public/site/rss`;

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
                'Accept': 'application/rss+xml, application/xml, text/xml',
            },
        });

        if (!response.ok) {
            throw new Error(`RSS API Error: ${response.status} - ${response.statusText}`);
        }

        const xmlContent = await response.text();

        return new NextResponse(xmlContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/rss+xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        });
    } catch (error) {
        console.error('Error fetching RSS feed:', error);

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

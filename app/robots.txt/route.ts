import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Return a proper robots.txt response
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${request.headers.get('host') ? `https://${request.headers.get('host')}` : ''}/sitemap.xml`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
